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
import boto3

CORS_HEADER = {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        }
TABLE_NAME =  os.environ["JOB_TABLE"]
DBClient = boto3.resource('dynamodb').Table(TABLE_NAME)

def handler(event):
    # check event header 
    if "httpMethod" in event and event["httpMethod"] =="POST":
        return handleRequestFromAPIGateway(event)
    return handleRequestFromSQS(event)

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
        return {
            'statusCode': 502,
            'headers': CORS_HEADER,
            'body': json.dumps(
                {
                    "error_msg": str(e)
                }
            )
        }

def handleRequestFromSQS(event):
    try: 
        body = json.loads(event["Records"][0]["body"])
        fileIdx = int(body["fileIdx"])
        jobID = body["jobID"]
        key = body["fileKey"]
        # 0. validate 
        validateFileStatus(jobID, fileIdx, key)
        # 0. init clients 
        s3 = boto3.client('s3')
        bucket = os.environ["SRC_BUCKET"]
        # 1. get file in S3
        print("get file from s3...")
        response = s3.get_object(Bucket=bucket, Key=key)
        # 2. parse response + run model
        print("run model ...")
        imageBytes = response["Body"].read()
        res_image, bug_type = imageProcess(imageBytes)
        # 3. save image to S3 
        print("save result image to s3 ...")
        resultKey = jobID + "/result/result_" + key.split("/")[-1]
        #print("res_image: " + str(res_image))
        s3.put_object(
            Bucket=bucket, 
            Key=resultKey, 
            Body=res_image, 
            # ContentType="image/jpeg",
            # ContentEncoding="base64"
        )
        # 4. save result to dynamoDB
        print("save result to db...")
        saveResultToDb(bug_type, fileIdx, jobID, resultKey)
        # (TODO) 5. trigger SQS - postProcessHandle
        return "successful"
    except Exception as e:
        print(str(e))
        return str(e)

 

def validateFileStatus(jobID, fileIdx, fileKey):
    fileRec = getFile(jobID, fileIdx)
    if fileRec["status"] != "NEW":
        raise Exception("File is already processed")
    if fileRec["s3Key"] != fileKey:
        raise Exception("Inconsistent fileKey, fileKey received: {}, fileKey in DB: {}".format(fileKey,fileRec["s3Key"]))


def getFile(jobID, fileIdx):
    response = DBClient.get_item(Key={"id":jobID})
    item = response["Item"]
    print("item: " + json.dumps(item))
    if not item["files"]:
        raise Exception("no files in job")
    if fileIdx >= len(item["files"]):
        raise Exception("Invalid fileIdx")
    return item["files"][fileIdx]

def saveResultToDb(result,fileIdx, jobID,resultKey):
    tablename = os.getenv("JOB_TABLE")
    table = boto3.resource('dynamodb').Table(tablename)
    # update the record. 
    response = table.update_item(
    Key={'id': jobID},
    ExpressionAttributeNames= { "#status": "status" },
    UpdateExpression="SET files["+str(fileIdx)+"].resultMessage = :resultMessage," 
                        + "files["+str(fileIdx)+"].#status = :status,"
                        + "files["+str(fileIdx)+"].s3KeyHeatMap = :s3KeyHeatMap",
    ExpressionAttributeValues={':resultMessage': result, 
                                ":status": "DONE", 
                                ":s3KeyHeatMap":resultKey
                                },
    ReturnValues="UPDATED_NEW",
    )
    return response

def submitSQSForm():
    # Create SQS client
    sqs = boto3.client('sqs')
    queue_url = os.getenv('POST_PROCESS_HANDLER_QUEUE')
    print('POST_PROCESS_HANDLER_QUEUE', queue_url)
    # Send message to SQS queue
    response = sqs.send_message(
        QueueUrl=queue_url,
        DelaySeconds=5,
        MessageBody="someMessage"
    )

    print(response['MessageId'])