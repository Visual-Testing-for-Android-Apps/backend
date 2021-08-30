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
        # 0. init clients 
        s3 = boto3.client('s3')
        bucket = os.getenv("SRC_BUCKET", "visual-testing-backend-v2-srcbucket-p3rsmcrs75qa")
        # 1. get file location, jobID
        body = json.loads(event["Records"][0]["body"])
        key = body["fileKey"]
        response = s3.get_object(Bucket=bucket, Key=key)
        # 2. parse response + run model
        imageBytes = response["Body"].read()
        res_image, bug_type = imageProcess(base64.b64decode(imageBytes))
        # 3. save result to dynamoDB
        fileIdx = int(body["fileIdx"])
        jobID = body["jobID"]
        saveResultToDb(bug_type, fileIdx, jobID)
        # 4. save image to S3 
        s3.upload(Bucket=bucket, key="result/result_" + key, body=res_image)
        # (TODO) 5. trigger SQS - postProcessHandle

    except Exception as e:
        print(e)
        return e

def saveResultToDb(result,fileIdx, jobID):
    tablename = os.getenv("JOB_TABLE")
    table = boto3.resource('dynamodb').Table(tablename)
    # update the record. 
    response = table.update_item(
    Key={'id': jobID},
    UpdateExpression="SET files["+fileIdx+"].resultMessage = :resultMessage, files["+fileIdx+"].finished = :finished",
    ExpressionAttributeValues={':resultMessage': result, ":finished": True},
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