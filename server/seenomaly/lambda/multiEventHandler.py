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
        # get file location, jobID
        body = json.loads(event["Records"][0]["body"])
        print("body",body)
        # get file from S3 
        s3 = boto3.client('s3')
        bucket = os.getenv("SRC_BUCKET", "visual-testing-backend-v2-srcbucket-p3rsmcrs75qa")
        print("SRC_BUCKET",os.getenv("SRC_BUCKET"))
        key = body["fileKey"]
        response = s3.get_object(Bucket=bucket, Key=key)
        print(response["Body"])
        videoBytes = response["Body"].read()
        (x, msg) = use.main(netName, checkpoint, modelDir, preprocess.fromJson(videoBytes))
        print("msg:" + str(msg))
        print("clarification:"+ str(x))
        result = {"msg":"a message", "filename":"filename.mp4"}
        # save result to database 
        saveResultToDb(result)
        # trigger SQS - postProcessHandle
        submitSQSForm()
        return "successful"
    except Exception as e:
        print(e)
        return e



def saveResultToDb(result):
    tablename = os.getenv("JOB_TABLE","visual-testing-backend-v2-JobTable-VCGGLNCXZ70M")
    table = boto3.resource('dynamodb').Table(tablename)
    # update the record. 
    response = table.update_item(
    Key={'id': "random-id"},
    UpdateExpression="SET #results = list_append(if_not_exists(#results, :emptyList), :resultMessage)",
    ExpressionAttributeValues={':resultMessage': [result],":emptyList":[]},
    ReturnValues="UPDATED_NEW",
    ExpressionAttributeNames= {"#results": "results"}
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
