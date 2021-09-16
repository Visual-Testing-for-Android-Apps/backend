
import json
from json.decoder import JSONDecodeError
import multiEventHandler 


CORS_HEADER = {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        }
def handler(event, context):
    # check event header 
    isRecievedJson = False
    try:
        body = json.loads(event["body"])
        isRecievedJson = True
    except JSONDecodeError as e:
        pass 

    if isRecievedJson:
        (x,msg) =  multiEventHandler.handleVideoInPresignedUrl(body)
    else:
        (x,msg) =  multiEventHandler.handleVideoInBody(event["body"])
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
        
    # except Exception as e:
    #     print(e)
    #     return {
    #         "statusCode": 502,
    #         "headers": CORS_HEADER,
    #         "body": json.dumps(
    #             {
    #                 "classification": "",
    #                 "error_msg" : str(e)
    #             }
    #         )
    #     }

