import use
import preprocess
import os
import json
import boto3
import base64


CORS_HEADER = {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        }

netName = "gan"
checkpoint = 29471
modelDir = os.getenv("MODEL_DIR", "./models/gan") # local env default to ./models
def handleRequestFromAPIGateway(event):
    try:

        print("start")
        videoBytes = base64.b64decode(event["body"].encode("utf-8"))
        (x, msg) = use.main(netName, checkpoint, modelDir, preprocess.fromJson(videoBytes))
        return {
            "statusCode": 200,
            "headers": CORS_HEADER,
            "body": json.dumps(
                {
                    "classification": str(x),
                    "explanation": msg
                }
            )
        }
    except Exception as e:
        print(e)
        return {
            "statusCode": 502,
            "headers": CORS_HEADER,
            "body": json.dumps(
                {
                    "classification": "",
                    "error_msg" : str(e)
                }
            )
        }



def handleRequestFromSQS(event):
    try:
        print("raw body: " + event["Records"][0]["body"])
        # get file location, jobID
        body = json.loads(event["Records"][0]["body"])
        fileIdx = int(body["fileIdx"])
        jobID = body["jobID"]
        key = body["fileKey"]
        print("body",body)
        # check file status 
        validateFileStatus(jobID, fileIdx, key)
        # get file from S3 
        s3 = boto3.client('s3')
        bucket = os.environ["SRC_BUCKET"]
        print("SRC_BUCKET", bucket)
        response = s3.get_object(Bucket=bucket, Key=key)
        print(response["Body"])
        videoBytes = response["Body"].read()
        (x, msg) = use.main(netName, checkpoint, modelDir, preprocess.fromJson(videoBytes))
        print("msg:" + str(msg))
        print("clarification:"+ str(x))
        # save result to database 
        result = {
            "msg":msg,
            "code":x
        }
        saveResultToDb(result, fileIdx, jobID)
        # trigger SQS - postProcessHandle
        submitSQSForm()
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

def saveResultToDb(result,fileIdx, jobID):
    tablename = os.getenv("JOB_TABLE")
    table = boto3.resource('dynamodb').Table(tablename)
    # update the record. 
    response = table.update_item(
    Key={'id': jobID},
    UpdateExpression="SET files["+fileIdx+"].resultCode = :resultCode, files["+fileIdx+"].resultMessage = :resultMessage, files["+fileIdx+"].finished = :finished",
    ExpressionAttributeValues={
        ':resultCode':  str(result["code"]), 
        ":status": "DONE",
        ":resultMessage": result["msg"]
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
