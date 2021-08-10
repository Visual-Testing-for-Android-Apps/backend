import use
import preprocess
import os
import json
import boto3

netName = "gan"
checkpoint = 29471
modelDir = os.getenv("MODEL_DIR", "./models/gan") # local env default to ./models
def handleRequestFromAPIGateway(event):
    try:

        print("start")
        (x, msg) = use.main(netName, checkpoint, modelDir, preprocess.fromJson(event))
        return {
            "statusCode": 200,
            'headers': {
                'Access-Control-Allow-Origin': '*'
            },
            "body": json.dumps(
                {
                    "classification": str(x),
                    "explanation": msg
                }
            )
        }
    except Exception as e:
        return {
            "statusCode": 502,
            'headers': {
                'Access-Control-Allow-Origin': '*'
            },
            "body": json.dumps(
                {
                    "classification": "",
                    "error_msg" : str(e)
                }
            )
        }



def handleRequestFromSQS(event):
    # get file location, jobID
    body = json.loads(event["Records"][0]["body"])
    print("body",body)
    # get file from S3 
    s3 = boto3.client('s3')
    bucket = os.getenv("SRC_BUCKET", "https://visual-testing-backend-v2-srcbucket-p3rsmcrs75qa.s3.ap-southeast-2.amazonaws.com")
    key = "/test_instagram.mp4"
    response = s3.get_object(Bucket=bucket, Key=key)
    (x, msg) = use.main(netName, checkpoint, modelDir, preprocess.fromJson(response))
    print("msg:" + msg)
    print("clarification:"+ x)


    # process 
    # update image 
    # update statues in database 
    # save result to database 