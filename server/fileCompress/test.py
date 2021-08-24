import os
import zipfile
import json
import posixpath
from pprint import pprint
import boto3
import shutil

# Define the table
TABLE_NAME = "test_table"
BUCKET_NAME = "visiontestbucket1337"
PRIMARY_KEY = "batch_id"
LOOKUP_BATCH_ID = '43'

# Create table reference
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(TABLE_NAME)

# Get the data
response = table.get_item(
    Key={
        PRIMARY_KEY: LOOKUP_BATCH_ID
    }
)

# Create S3 bucket reference
s3 = boto3.resource("s3")
bucket = s3.Bucket(BUCKET_NAME)

# Download files using reference data from DynamoDB
files_json = response["Item"]["files"]

# Create batch id directory
current_dir = os.path.dirname(os.path.abspath(__file__))
batch_folder_path = os.path.join(current_dir, LOOKUP_BATCH_ID)
os.mkdir(batch_folder_path)

# Create uploaded and results directory in uploaded directory
uploaded_path = os.path.join(batch_folder_path, "uploaded")
os.mkdir(uploaded_path)
results_path = os.path.join(batch_folder_path, "results")
os.mkdir(results_path)

# Go through each file
for file in files_json:

    # Get file path references
    file_ref_s3 = file["fileRef"]
    file_ref_local = current_dir + "/" + file["fileRef"]

    # Convert local file path to current os
    file_ref_local = file_ref_local.replace(posixpath.sep, os.sep)

    # Download the uploaded file
    bucket.download_file(file_ref_s3, file_ref_local)

    # Download the result file is it exists
    if file['finished']:

        # Get file path references
        file_ref_s3 = file["resultFileReference"]
        file_ref_local = current_dir + "/" + file["resultFileReference"]

        # Convert local file path to current os
        file_ref_local = file_ref_local.replace(posixpath.sep, os.sep)

        bucket.download_file(file_ref_s3, file_ref_local)

# Create zip file
zip_file_path = os.path.join(batch_folder_path, 'test_zip.zip')
test_zip = zipfile.ZipFile(zip_file_path, 'w')

# Go through each file in batch id directory and add to zip file based on the current directory format
for folder, subfolders, files in os.walk(batch_folder_path):
    for file in files:
        test_zip.write(os.path.join(folder, file), os.path.relpath(os.path.join(folder,file), batch_folder_path), compress_type = zipfile.ZIP_DEFLATED)

# Close zip file
test_zip.close()

# Add zip file to database
bucket.upload_file(zip_file_path, LOOKUP_BATCH_ID + "/" + LOOKUP_BATCH_ID + ".zip")

# Delete local files
shutil.rmtree(batch_folder_path)
