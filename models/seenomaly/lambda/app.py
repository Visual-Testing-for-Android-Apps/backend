
import json
import multiEventHandler 


CORS_HEADER = {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        }
def handler(event, context):
    # check event header 
    print(json.dumps(event))
    try:
        if (event['body']['download_url']):
            (x,msg) =  multiEventHandler.handleVideoInPresignedUrl(event)
        else:
            (x,msg) =  multiEventHandler.handleVideoInBody(event)
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

