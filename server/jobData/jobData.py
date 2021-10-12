import os
import boto3
import json

def getReportJson(event, context):
    """
    Input: POST request where the body is a stringified json of the form:
    "{"publicKey":"1", "pwd":"password"}"
    Where the values for publicKey and pwd are the ID and PASSWORD from link to display batch job report
    Eg. https://afternoon-woodland-24079.herokuapp.com/batchreportpage/8944s61gdgds300187?pwd=blhTelphY
        where ID = 8944s61gdgds300187, PASSWORD = blhTelphY

    Output: presigned url to report.json for job in s3 bucket
    """

    # Load id/password from html request
    json_body = json.loads(event["body"])
    linkId = json_body["publicKey"]
    linkPassword = json_body["pwd"]

    # Constants
    TABLE_NAME = os.environ["JOB_TABLE"]
    BUCKET_NAME = os.environ["SRC_BUCKET"]
    LOOKUP_BATCH_ID = linkId # may lookup batch job id in another table using linkId for extra security
    PRESIGNED_LINK_DURATION = 60*30 # 30 minutes in seconds

    # fetch from database
    table = boto3.resource("dynamodb").Table(TABLE_NAME)
    data = table.get_item(Key={"id": LOOKUP_BATCH_ID})

    # check if job id exists
    try:
        data["Item"]
    except KeyError:
        return {
            "statusCode": 404,  # job id not found
            "body": json.dumps(
				{
					"error": "Job id: " + (id) + " not found",
				}
			),
        }

    # Check password
    if linkPassword != data["Item"]["password"]:
        return {
            "statusCode": 401, # unauthorised, incorrect password
            "body": json.dumps(
				{
					"error": "Unauthorised",
				}
			),
        }

    # Send url to report.json
    report_url = LOOKUP_BATCH_ID + "/report.json"

    s3_client = boto3.client("s3")
    response = s3_client.generate_presigned_url(
        "get_object",
        Params={"Bucket": BUCKET_NAME, "Key": report_url},
        ExpiresIn=PRESIGNED_LINK_DURATION
    )
    
    return {
        "statusCode": 200,
        "body": json.dumps(
            {
                "url": response,
            }
        ),
    }
