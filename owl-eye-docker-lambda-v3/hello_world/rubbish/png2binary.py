
import base64
import json
import pickle

def im2json(im):
    """Convert a Numpy array to JSON string"""
    imdata = pickle.dumps(im)
    jstr = json.dumps({"image": base64.b64encode(imdata).decode('ascii')})
    return jstr

def json2im(jstr):
    """Convert a JSON string back to a Numpy array"""
    load = json.loads(jstr)
    imdata = base64.b64decode(load['image'])
    im = pickle.loads(imdata)
    return im

if __name__ == "__main__":
    file_name = 'bug.4003'
    data = {}
    with open(file_name  + '.jpg', mode='rb') as file:
        img = file.read()
    data['body'] = base64.b64encode(img).decode('utf-8')
    with open(file_name + ".json", 'w') as f:
        f.write(json.dumps(data))


    # img = cv2.imread(file_name + '.jpg')
    # res = cv2.imencode('.jpg', img)[1].tobytes()
    # with open(file_name + ".json", 'w') as f:
    #     f.write(json.dumps({"body":res}))
