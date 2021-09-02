

import cv2
import numpy as np
import base64
import json
import pickle
from PIL import Image
import requests
from io import BytesIO

def im2json(im):
    """Convert a Numpy array to JSON string"""
    imdata = pickle.dumps(im)
    print(len(base64.b64encode(imdata).decode('ascii')))
    jstr = json.dumps({"body": base64.b64encode(imdata).decode('ascii')})

    return jstr

def json2im(jstr):
    """Convert a JSON string back to a Numpy array"""
    load = json.loads(jstr)
    imdata = base64.b64decode(load['body'])
    im = pickle.loads(imdata)
    return im

# Create solid red image
#red = np.full((480, 640, 3), [0, 0, 255], dtype=np.uint8)
if __name__ == "__main__":
    IMAGE_NAME = "bug.4006.jpg"
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
    raw_data = base64_string

    # now: encoding the data to json
    # result: string
    # json_data = json.dumps(raw_data, indent=2)
    # with open(file_name) as f:
    #     data = json.load(f)

    url= 'https://ekh9wzayy6.execute-api.ap-southeast-2.amazonaws.com/Prod/owleye/'
    res = requests.post(url, data=raw_data, timeout=5000)
    print(res.status_code)
    print(res.json())
    if res.status_code == 200:
        img = res.json()["res_img"]
        # decode img
        image = Image.open(BytesIO(base64.b64decode(img.encode('utf-8'))))

        image.save('tmp.jpg')


