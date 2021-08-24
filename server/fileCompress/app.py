import os
import zipfile
import json
import posixpath
from pprint import pprint
import boto3
import shutil


def lambda_handler(event, context):
    # Define the constants
    TABLE_NAME = "test_table"
    BUCKET_NAME = "visiontestbucket1337"
    PRIMARY_KEY = "batch_id"
    LOOKUP_BATCH_ID = event["queryStringParameters"]["batch_id"]

    # Create table and bucket reference
    table = boto3.resource("dynamodb").Table(TABLE_NAME)
    bucket = boto3.resource("s3").Bucket(BUCKET_NAME)

    # Get the data from DynamoDB
    response = table.get_item(Key={PRIMARY_KEY: LOOKUP_BATCH_ID})

    # Download files using reference data from DynamoDB
    files_json = response["Item"]["files"]

    # Create zip file
    zip_file_path = os.path.join("/tmp/", 'temp_zip.zip')
    temp_zip = zipfile.ZipFile(zip_file_path, 'w')

    # Go through each file
    for file in files_json:

        # Get file path for s3 bucket and create file path to store in tmp 
        file_ref_s3 = file["fileRef"]
        file_ref_tmp = "/tmp/" + file["fileRef"].split('/')[-1]

        # Download the uploaded file
        bucket.download_file(file_ref_s3, file_ref_tmp)

        # Add it to the zip file in the uploaded section
        temp_zip.write(file_ref_tmp, 'uploaded/' + file["fileRef"].split('/')[-1], compress_type = zipfile.ZIP_DEFLATED)

        # Delete the upload file
        os.remove(file_ref_tmp)

        # Download the result file is it exists
        if file['finished']:

            # Get file path references
            file_ref_s3 = file["resultFileReference"]
            file_ref_tmp = "/tmp/" + file["resultFileReference"].split('/')[-1]

            # Download the results file
            bucket.download_file(file_ref_s3, file_ref_tmp)

            # Add it to the zip file in the results section
            temp_zip.write(file_ref_tmp, 'results/' + file["resultFileReference"].split('/')[-1], compress_type = zipfile.ZIP_DEFLATED)

            # Delete the results file
            os.remove(file_ref_tmp)

    # Close zip file
    temp_zip.close()

    # Add zip file to S3 bucket
    file_ref_zip_s3 = LOOKUP_BATCH_ID + "/VisionResults.zip"
    bucket.upload_file(zip_file_path, file_ref_zip_s3)

    # Clean out tmp folder
    for root, dirs, files in os.walk('/tmp'):
        for f in files:
            os.unlink(os.path.join(root, f))
        for d in dirs:
            shutil.rmtree(os.path.join(root, d))

    # Create S3 client
    s3 = boto3.client("s3")

    # Get presigned url as download link
    response = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": BUCKET_NAME, "Key": file_ref_zip_s3},
        ExpiresIn=432000,
    )
    
    # Send it 
    return {
        "statusCode": 200,
        "body": json.dumps(
            {
                "url": response,
            }
        ),
    }
