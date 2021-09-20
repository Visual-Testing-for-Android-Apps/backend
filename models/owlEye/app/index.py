import base64
import json
from io import BytesIO
import torch
from PIL import Image, ImageFile

ImageFile.LOAD_TRUNCATED_IMAGES = True
import os
import torch.utils.data as data
import torchvision.transforms as transforms
import cv2
import numpy as np
from torch.autograd import Function, Variable

ImageFile.LOAD_TRUNCATED_IMAGES = True
import torch.nn.functional as F
import torch.nn as nn
from app import * 
import json
from json.decoder import JSONDecodeError
import requests

CORS_HEADER = {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        }

def handler(event,context):
    # check event header 
    isRecievedJson = False
    try:
        body = json.loads(event["body"])
        isRecievedJson = True
    except JSONDecodeError as e:
        pass 

    if isRecievedJson:
        (original_img, res_image, bug_type ) = handleVideoInPresignedUrl(body)
        print("original_image", original_img)
        print("res_image",res_image)
        print("bug_type",bug_type)
    else:
        (original_img, res_image, bug_type ) = handleImageInBody(event)
        print("original_image", original_img)
        print("res_image",res_image)
        print("bug_type",bug_type)
    return {
    'statusCode': 200,
    'headers': CORS_HEADER,
    'body': json.dumps(
        {
    
            "original_img":original_img , # this is the original image
            'res_img': res_image,
            'bug_type': bug_type # contain bug. Currently only have three type of bug
        }
    )
}

def handleVideoInPresignedUrl(body):
    url = body['download_url']
    response = requests.get(url)
    print("response",response)
    res_image, bug_type = imageProcess(response.content)
    return response.text, res_image, bug_type 

def handleImageInBody(event):
    image_bytes = event['body'].encode('utf-8')  # here is where the app get the image data in string
    res_image, bug_type = imageProcess(base64.b64decode(image_bytes))
    return event['body'], res_image, bug_type 
 