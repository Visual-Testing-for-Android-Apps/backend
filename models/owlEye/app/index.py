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

CORS_HEADER = {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        }

def handler(event,context):
    # check event header 
    return handleRequestFromAPIGateway(event)


def handleRequestFromAPIGateway(event):
    try:
        image_bytes = event['body'].encode('utf-8')  # here is where the app get the image data in string
        res_image, bug_type = imageProcess(base64.b64decode(image_bytes))
        return {
            'statusCode': 200,
            'headers': CORS_HEADER,
            'body': json.dumps(
                {
            
                    "original_img": event['body'], # this is the original image
                    'res_img': res_image,
                    'bug_type': bug_type # contain bug. Currently only have three type of bug
                    # 'res_img' : img_res_str
                }
            )
        }
    except Exception as e:
        print(e)
        return {
            'statusCode': 502,
            'headers': CORS_HEADER,
            'body': json.dumps(
                {
                    "error_msg": str(e)
                }
            )
        }