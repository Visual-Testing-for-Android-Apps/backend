import os
import zipfile
import json
from pprint import pprint
import boto3

# Define the table
table_name = "test_table"
primary_key = "batch_id"
lookup_batch_id = '1'

# Create table reference
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(table_name)

# Get the data
response = table.get_item(
    Key={
        primary_key: lookup_batch_id
    }
)

print(response["Item"])

# # Create zip file
# fantasy_zip = zipfile.ZipFile('test_zip', 'w')

# for folder, subfolders, files in os.walk('C:\\Stories\\Fantasy'):
#     for file in files:
#         if file.endswith('.pdf'):
#             fantasy_zip.write(os.path.join(folder, file), os.path.relpath(os.path.join(folder,file), 'C:\\Stories\\Fantasy'), compress_type = zipfile.ZIP_DEFLATED)

# fantasy_zip.close()

# personId = event['queryStringParameters']['personId']

# print({
#     "statusCode": 200,
#     "body": json.dumps({
#         "personId": personId + " from Lambda",
#     }),
# })