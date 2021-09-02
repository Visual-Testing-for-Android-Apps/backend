import base64
import json
from PIL import ImageFile

ImageFile.LOAD_TRUNCATED_IMAGES = True
import os

ImageFile.LOAD_TRUNCATED_IMAGES = True
from app import * 
import boto3

CORS_HEADER = {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        }
TABLE_NAME =  os.environ["JOB_TABLE"]
DBClient = boto3.resource('dynamodb').Table(TABLE_NAME)

def handler(event, context):
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
        response = s3.get_object(Bucket=bucket, Key=key)
        # 2. parse response + run model
        imageBytes = response["Body"].read()
        res_image, bug_type = imageProcess(imageBytes)
        # 3. save result to dynamoDB
        saveResultToDb(bug_type, fileIdx, jobID)
        # 4. save image to S3 
        s3.upload(Bucket=bucket, key="result/result_" + key, body=res_image)
        # (TODO) 5. trigger SQS - postProcessHandle
        return "successful"

    except Exception as e:
        print(e)
        return str(e)

def validateFileStatus(jobID, fileIdx, fileKey):
    fileRec = getFile(jobID, fileIdx)
    if fileRec.finished:
        raise Exception("File is already processed")
    if fileRec.fileReference != fileKey:
        raise Exception("Inconsistent fileKey, fileKey received: {}, fileKey in DB: {}".format(fileKey,fileRec.fileReference))


def getFile(jobID, fileIdx):
    response = DBClient.get_item(Key={"id":jobID})
    item = response["Item"]
    print("item: " + json.dumps(item))
    if not item["files"]:
        raise Exception("no files in job")
    if fileIdx >= len(item["files"]):
        raise Exception("Invalid fileIdx")
    return item["files"][fileIdx]

def saveResultToDb(result,fileIdx, jobID):
    # update the record. 
    response = DBClient.update_item(
    Key={'id': jobID},
    UpdateExpression="SET files["+str(fileIdx)+"].resultMessage = :resultMessage, files["+str(fileIdx)+"].finished = :finished",
    ExpressionAttributeValues={':resultMessage': result, ":finished": True},
    ReturnValues="UPDATED_NEW",
    )
    return response

def submitSQSForm():
    # Create SQS client
    sqs = boto3.client('sqs')
    queue_url = os.environ['POST_PROCESS_HANDLER_QUEUE']
    print('POST_PROCESS_HANDLER_QUEUE', queue_url)
    # Send message to SQS queue
    response = sqs.send_message(
        QueueUrl=queue_url,
        DelaySeconds=5,
        MessageBody="someMessage"
    )

    print(response['MessageId'])