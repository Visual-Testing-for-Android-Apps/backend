import base64
import json
from io import BytesIO
import torch
from PIL import Image,ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = True
import os
import torch.utils.data as data
import torchvision.transforms as transforms
import cv2
import numpy as np
from torch.autograd import Function, Variable
ImageFile.LOAD_TRUNCATED_IMAGES = True
import torch.nn as nn

# image_transforms = torchvision.transforms.Compose([
#     torchvision.transforms.ToTensor(),
#     torchvision.transforms.Normalize((0.1307,), (0.3081,))])

#
# class Net(nn.Module):
#     def __init__(self):
#         super(Net, self).__init__()
#         self.conv1 = nn.Conv2d(1, 20, kernel_size=5)
#         self.conv2 = nn.Conv2d(20, 20, kernel_size=5)
#         self.conv2_drop = nn.Dropout2d()
#
#         self.fc1 = nn.Linear(320, 100)
#         self.bn1 = nn.BatchNorm1d(100)
#
#         self.fc2 = nn.Linear(100, 100)
#         self.bn2 = nn.BatchNorm1d(100)
#
#         self.smax = nn.Linear(100, 10)
#
#     def forward(self, x):
#         x = F.relu(F.max_pool2d(self.conv1(x), 2))
#         x = F.relu(F.max_pool2d(self.conv2_drop(self.conv2(x)), 2))
#
#         x = x.view(-1, 320)
#         x = self.bn1(F.relu(self.fc1(x)))
#         x = F.dropout(x, training=self.training)
#
#         x = self.bn2(F.relu(self.fc2(x)))
#         x = F.dropout(x, training=self.training)
#
#         return F.softmax(self.smax(x), dim=-1)


model_file = '../hello_world/0model.pth'
# model = Net()
# model.load_state_dict(torch.load(model_file))
# model.eval()

#---------------------------------- Network.py -----------------------------------------------------#

cfg = [16, 16, 'M', 16, 16, 'M', 32, 32, 'M', 64, 64, 'M', 128, 128, 'M', 128, 128, 'M']


class Net(nn.Module):

    def __init__(self, init_weights=True):
        super(Net, self).__init__()
        self.features = make_layers(cfg)

        self.classifier = nn.Sequential(
            nn.Linear(12 * 7 * 128, 4096),
            nn.Linear(4096, 1024),
            nn.Linear(1024, 128),
            nn.Linear(128, 2),
        )
        if init_weights:
            self._initialize_weights()

    def forward(self, x):
        x = self.features(x)
        x = torch.flatten(x, 1)
        x = self.classifier(x)
        return x

    def _initialize_weights(self):
        for m in self.modules():
            if isinstance(m, nn.Conv2d):
                nn.init.kaiming_normal_(m.weight, mode='fan_out', nonlinearity='relu')
                if m.bias is not None:
                    nn.init.constant_(m.bias, 0)
            elif isinstance(m, nn.BatchNorm2d):
                nn.init.constant_(m.weight, 1)
                nn.init.constant_(m.bias, 0)
            elif isinstance(m, nn.Linear):
                nn.init.normal_(m.weight, 0, 0.01)
                nn.init.constant_(m.bias, 0)


def make_layers(cfg):
    layers = []
    in_channels = 3
    for v in cfg:
        if v == 'M':
            layers += [nn.MaxPool2d(kernel_size=2, stride=2, padding=0, dilation=1, ceil_mode=False)]
        else:
            conv2d = nn.Conv2d(in_channels, v, kernel_size=3, padding=1)
            layers += [conv2d, nn.BatchNorm2d(v), nn.ReLU(inplace=True)]
            in_channels = v
    return nn.Sequential(*layers)



#-----------------------------getdata.py ---------------------------------------------------------------------#

IMAGE_H = 768
IMAGE_W = 448

dataTransform = transforms.Compose([
    transforms.Resize((IMAGE_H,IMAGE_W)),
    transforms.CenterCrop((IMAGE_H, IMAGE_W)),
    transforms.ToTensor()
])


class Dataset(data.Dataset):
    def __init__(self, mode, dir):
        self.mode = mode
        self.list_img = []
        self.list_label = []
        self.data_size = 0
        self.transform = dataTransform

        if self.mode == 'train':
            dir = dir + '/train/'
            for file in os.listdir(dir):
                #print(file)
                self.list_img.append(dir + file)
                self.data_size += 1
                name = file.split(sep='.')
                if name[0] == 'bug':
                    self.list_label.append(0)
                else:
                    self.list_label.append(1)
        elif self.mode == 'test':
            dir = dir + '/test/'
            for file in os.listdir(dir):
                self.list_img.append(dir + file)
                self.data_size += 1
                self.list_label.append(2)
        else:
            print('Undefined Dataset!')

    def __getitem__(self, item):
        if self.mode == 'train':
            img = Image.open(self.list_img[item])
            label = self.list_label[item]
            return self.transform(img), torch.LongTensor([label])
        elif self.mode == 'test':
            img = Image.open(self.list_img[item])
            return self.transform(img)
        else:
            print('None')

    def __len__(self):
        return self.data_size


#----------------------------------------------------------------------------------------------------#


#----------------------------- Localization.py -----------------------------------------------#


class FeatureExtractor():
    """ Class for extracting activations and
    registering gradients from targetted intermediate layers """

    def __init__(self, model, target_layers):
        self.model = model
        self.target_layers = target_layers
        self.gradients = []

    def save_gradient(self, grad):
        self.gradients.append(grad)

    def __call__(self, x):
        outputs = []
        self.gradients = []

        for name, module in self.model.module.features._modules.items():
            x = module(x)
            if name in self.target_layers:
                x.register_hook(self.save_gradient)
                outputs += [x]
        return outputs, x


class ModelOutputs():
    """ Class for making a forward pass, and getting:
    1. The network output.
    2. Activations from intermeddiate targetted layers.
    3. Gradients from intermeddiate targetted layers. """

    def __init__(self, model, target_layers):
        self.model = model
        self.feature_extractor = FeatureExtractor(self.model, target_layers)

    def get_gradients(self):
        return self.feature_extractor.gradients

    def __call__(self, x):
        target_activations, output = self.feature_extractor(x)
        output = output.view(output.size(0), -1)

        return target_activations, output


def preprocess_image(img):


    imgs_data = []
    #img = Image.open(image_file)
    img_data = dataTransform(img)

    imgs_data.append(img_data)
    imgs_data = torch.stack(imgs_data)
    input = Variable(imgs_data, requires_grad = True)
    return input


def show_cam_on_image(img, mask):
    heatmap = cv2.applyColorMap(np.uint8(255 * mask), cv2.COLORMAP_JET)
    heatmap = np.float32(heatmap) / 255
    cam = heatmap + np.float32(img)
    cam = cam / np.max(cam)
    return np.uint8(255 * cam)
    # TODO: store image to s3 bucket
    # cv2.imwrite("{}/{}cam.jpg".format(target_dir,image_num), np.uint8(255 * cam))


class GradCam:
    def __init__(self, model, target_layer_names, use_cuda):
        self.model = model
        self.model.eval()
        self.cuda = use_cuda
        if self.cuda:
            self.model = model.cuda()

        self.extractor = ModelOutputs(self.model, target_layer_names)

    def forward(self, input):
        return self.model(input)

    def __call__(self, input, index=None):
        if self.cuda:
            features, output = self.extractor(input.cuda())
        else:
            features, output = self.extractor(input)

        if index == None:
            index = np.argmax(output.cpu().data.numpy())

        one_hot = np.zeros((1, output.size()[-1]), dtype=np.float32)
        one_hot[0][index] = 1
        one_hot = torch.from_numpy(one_hot).requires_grad_(True)
        if self.cuda:
            one_hot = torch.sum(one_hot.cuda() * output)
        else:
            one_hot = torch.sum(one_hot * output)

        self.model.zero_grad()
        one_hot.backward(retain_graph=True)

        grads_val = self.extractor.get_gradients()[-1].cpu().data.numpy()

        target = features[-1]
        target = target.cpu().data.numpy()[0, :]

        weights = np.mean(grads_val, axis=(2, 3))[0, :]
        cam = np.zeros(target.shape[1:], dtype=np.float32)

        for i, w in enumerate(weights):
            cam += w * target[i, :, :]

        cam = np.maximum(cam, 0)
        cam = cv2.resize(cam, (448, 768))
        cam = cam - np.min(cam)
        cam = cam / np.max(cam)
        return cam


class GuidedBackpropReLU(Function):

    @staticmethod
    def forward(self, input):
        positive_mask = (input > 0).type_as(input)
        output = torch.addcmul(torch.zeros(input.size()).type_as(input), input, positive_mask)
        self.save_for_backward(input, output)
        return output

    @staticmethod
    def backward(self, grad_output):
        input, output = self.saved_tensors
        grad_input = None

        positive_mask_1 = (input > 0).type_as(grad_output)
        positive_mask_2 = (grad_output > 0).type_as(grad_output)
        grad_input = torch.addcmul(torch.zeros(input.size()).type_as(input),
                                   torch.addcmul(torch.zeros(input.size()).type_as(input), grad_output,
                                                 positive_mask_1), positive_mask_2)

        return grad_input


class GuidedBackpropReLUModel:
    def __init__(self, model, use_cuda):
        self.model = model
        self.model.eval()
        self.cuda = use_cuda
        if self.cuda:
            self.model = model.cuda()

        for idx, module in self.model.module.features._modules.items():
            if module.__class__.__name__ == 'ReLU':
                self.model.module.features._modules[idx] = GuidedBackpropReLU.apply

    def forward(self, input):
        res = self.model.module(input)
        #print(res)
        print('forward get res')
        return res

    def __call__(self, input, index=None):
        if self.cuda:
            output = self.forward(input.cuda())
        else:
            output = self.forward(input)

        if index == None:
            index = np.argmax(output.cpu().data.numpy())

        one_hot = np.zeros((1, output.size()[-1]), dtype=np.float32)
        one_hot[0][index] = 1
        one_hot = torch.from_numpy(one_hot).requires_grad_(True)
        if self.cuda:
            one_hot = torch.sum(one_hot.cuda() * output)
        else:
            one_hot = torch.sum(one_hot * output)

        one_hot.backward(retain_graph=True)
        output = input.grad.cpu().data.numpy()
        output = output[0, :, :, :]

        return output


# def get_args():
#     parser = argparse.ArgumentParser()
#     parser.add_argument('--use-cuda', action='store_true', default=False,
#                         help='Use NVIDIA GPU acceleration')
#     parser.add_argument('--image-path', type=str, default='./examples/211.jpg',
#                         help='Input image path')
#     args = parser.parse_args()

#     args.use_cuda = args.use_cuda and torch.cuda.is_available()
#     if args.use_cuda:
#         print("Using GPU for acceleration")
#     else:
#         print("Using CPU for computation")

#     return args

def deprocess_image(img):
    """ see https://github.com/jacobgil/keras-grad-cam/blob/master/grad-cam.py#L65 """
    img = img - np.mean(img)
    img = img / (np.std(img) + 1e-5)
    img = img * 0.1
    img = img + 0.5
    img = np.clip(img, 0, 1)
    return np.uint8(img * 255)
#----------------------------------------------------------------------------------------------------#



def handler(event, context):

    #image_bytes = event['body']
    # print(image_bytes)
    # image = Image.open(BytesIO(base64.b64decode(image_bytes))).convert(mode='L')
    #load = json.loads(image_bytes)
    try:
        image_bytes = event['body'].encode('utf-8')
        image = Image.open(BytesIO(base64.b64decode(image_bytes)))

        #image_name = "/tmp/out.jpg"
        #image.save(image_name)

        # probabilities = model.forward(image_transforms(np.array(image)).reshape(-1, 1, 28, 28))
        # label = torch.argmax(probabilities).item()
        """ python grad_cam.py <path_to_image>
            1. Loads an image with opencv.
            2. Preprocesses it for VGG19 and converts to a pytorch variable.
            3. Makes a forward pass to find the category index with the highest score,
            and computes intermediate activations.
            Makes the visualization. """

        # file = os.listdir(image_dir)  # TODO : file is in the input event data
        # target_dir = 'LOCATION IN S3'  # TODO target dir is some location
        #
        # print(file)
        # (filename, extension) = os.path.splitext(file)
        # image_num = filename
        # image_name = image_dir + file
        # args = get_args()

        model = Net()
        # model.cuda()
        model = nn.DataParallel(model)
        model.load_state_dict(torch.load(model_file))  # TODO : model is in the S3 bucket

        grad_cam = GradCam(model=model, target_layer_names=["40"], use_cuda=False)

        #img = cv2.imread(image_name, 1)
        #img = np.float32(cv2.resize(img, (448, 768))) / 255
        #print(np.array(image))

        img = np.array(image)
        img = np.float32(cv2.resize(img, (448, 768))) / 255

        input = preprocess_image(image)
        #print(input.dim())
        target_index = None
        mask = grad_cam(input, target_index)
        img_res = show_cam_on_image(img, mask)
        img_res_str = cv2.imencode('.jpg', img_res)[1].tobytes()
        #imdata = pickle.dumps(img_res)
        print("process finish")
        # gb_model = GuidedBackpropReLUModel(model=model, use_cuda=False)
        # gb = gb_model(input, index=target_index)
        #
        # gb = gb.transpose((1, 2, 0))
        #
        # cam_mask = cv2.merge([mask, mask, mask])
        # cam_gb = deprocess_image(cam_mask * gb)
        # gb = deprocess_image(gb)


        return {
            'statusCode': 200,
            'body': json.dumps(
                {
                    "predicted_label": 'placeholder',
                    'res_img' : base64.b64encode(img_res_str).decode('utf-8')
                    #'res_img' : img_res_str
                }
            )
        }

    except Exception as e:
        return {
            'statusCode': 502,
            'body': json.dumps(
                {
                    "predicted_label": 'placeholder',
                    "error_msg" : str(e)
                }
            )
        }

   



# if __name__ == '__main__':

#     print('test running ')
#     # load model
#     model = Net()
#     # model.cuda()
#     model = nn.DataParallel(model)
#     model.load_state_dict(torch.load(model_file))  # TODO : model is in the S3 bucket

#     grad_cam = GradCam(model=model, target_layer_names=["40"], use_cuda=False)
#     print('model load')

if __name__ == "__main__":
    # file_name = "event.json"
    # with open(file_name) as f:
    #     data = json.load(f)
    #     res = handler(data, None)
    #     print(res)
    #     if res['statusCode'] ==200:
    #         img = res['body']['res_img']
    #         # decode img
    #         image = Image.open(BytesIO(base64.b64decode(data["res_img"].encode('utf-8'))))
    #
    #         image.save('tmp.png')
    IMAGE_NAME = "bug.4003.jpg"
    with open(IMAGE_NAME, 'rb') as open_file:
        byte_content = open_file.read()

    # second: base64 encode read data
    # result: bytes (again)
    base64_bytes = base64.b64encode(byte_content)

    # third: decode these bytes to text
    # result: string (in utf-8)
    base64_string = base64_bytes.decode('utf-8')

    # optional: doing stuff with the data
    # result here: some dict
    raw_data = {'body': base64_string}

    # now: encoding the data to json
    # result: string
    #json_data = json.dumps(raw_data, indent=2)
    # with open(file_name) as f:
    #     data = json.load(f)
    res = handler(raw_data, None)
    print(res)
    if res['statusCode'] == 200:
        img = json.loads(res['body'])['res_img']
        # decode img
        image = Image.open(BytesIO(base64.b64decode(img.encode('utf-8'))))

        image.save('tmp.jpg')

