# Import libraries
import os
import zipfile
import json
import boto3
import shutil


def lambda_handler(event, context):
    # Define the constants
    TABLE_NAME = os.environ["JOB_TABLE"]
    BUCKET_NAME = os.environ["SRC_BUCKET"]
    EMAIL_QUEUE = os.environ["EMAIL_QUEUE"]
    PRIMARY_KEY = "id"
    LOOKUP_BATCH_ID = json.loads(event["Records"][0]["body"])["jobKey"]
    PRESIGNED_LINK_DURATION = 432000 # seconds (up to max of 7 days)

    # Create table and bucket reference
    table = boto3.resource("dynamodb").Table(TABLE_NAME)
    bucket = boto3.resource("s3").Bucket(BUCKET_NAME)

    # Get the data from DynamoDB
    response = table.get_item(Key={PRIMARY_KEY: LOOKUP_BATCH_ID})

    # Download files using reference data from DynamoDB
    files_json = response["Item"]["files"]

    # Absolute path does not work in lambda, so instead defining relative path
    tmp_dir_path = os.sep + "tmp"

    # Create zip file
    zip_file_path = os.path.join(tmp_dir_path, "temp_zip.zip")
    temp_zip = zipfile.ZipFile(zip_file_path, "w")

    # Go through each file
    for file in files_json:

        # Get file path for s3 bucket and create file path to store in tmp
        file_ref_s3 = os.path.join(str(LOOKUP_BATCH_ID), file["fileRef"])
        file_ref_tmp = os.path.join(tmp_dir_path, os.path.split(file["fileRef"])[-1])

        # Download the uploaded file
        bucket.download_file(file_ref_s3, file_ref_tmp)

        # Add it to the zip file in the uploaded section
        temp_zip.write(
            file_ref_tmp,
            os.path.join("uploaded", os.path.split(file["fileRef"])[-1]),
            compress_type=zipfile.ZIP_DEFLATED,
        )

        # Delete the upload file
        os.remove(file_ref_tmp)

        # Get file path references
        file_ref_s3 = os.path.join(str(LOOKUP_BATCH_ID), file["resultFileReference"])
        file_ref_tmp = os.path.join(
            tmp_dir_path, os.path.split(file["resultFileReference"])[-1]
        )

        # Download the results file
        bucket.download_file(file_ref_s3, file_ref_tmp)

        # Add it to the zip file in the results section
        temp_zip.write(
            file_ref_tmp,
            os.path.join("results", os.path.split(file["fileRef"])[-1]),
            compress_type=zipfile.ZIP_DEFLATED,
        )

        # Delete the results file
        os.remove(file_ref_tmp)

    # Close zip file
    temp_zip.close()

    # Clean out batch files in S3 bucket
    bucket.objects.filter(Prefix=LOOKUP_BATCH_ID).delete()

    # Add zip file to S3 bucket
    file_ref_zip_s3 = LOOKUP_BATCH_ID + "/VisionResults.zip"
    bucket.upload_file(zip_file_path, file_ref_zip_s3)

    # Update DynamoDB
    table.update_item(
        Key={PRIMARY_KEY: LOOKUP_BATCH_ID},
        UpdateExpression="SET jobStatus = :stat1",
        ExpressionAttributeValues={":stat1": "ZIPPED"},
    )

    # Clean out tmp folder
    for root, dirs, files in os.walk("/tmp"):
        for f in files:
            os.unlink(os.path.join(root, f))
        for d in dirs:
            shutil.rmtree(os.path.join(root, d))

    # Create S3 client
    s3_client = boto3.client("s3")

    # Get presigned url as download link
    response = s3_client.generate_presigned_url(
        "get_object",
        Params={"Bucket": BUCKET_NAME, "Key": file_ref_zip_s3},
        ExpiresIn=PRESIGNED_LINK_DURATION,
    )

    sqs = boto3.client('sqs')

    response = sqs.send_message(
        QueueUrl=EMAIL_QUEUE,
        DelaySeconds=1,
        MessageBody=(
            '{ "jobKey": "' + str(LOOKUP_BATCH_ID) + '" }'
        )
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
