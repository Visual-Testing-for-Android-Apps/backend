

import cv2
import numpy as np
import base64
import json
import pickle
from PIL import Image
import requests

def im2json(im):
    """Convert a Numpy array to JSON string"""
    imdata = pickle.dumps(im)
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
red = cv2.imread( 'bug.4003.jpg')

# Make image into JSON string
jstr = im2json(red)
with open( "test.json", 'w') as f:
    f.write(jstr)
print(jstr)


# Extract image from JSON string, and convert from OpenCV to PIL reversing BGR to RGB on the way
OpenCVim = json2im(jstr)
PILimage = Image.fromarray(OpenCVim[...,::-1])
PILimage.show()