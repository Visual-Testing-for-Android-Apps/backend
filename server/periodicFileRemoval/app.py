import os
import boto3
from datetime import datetime, timedelta
import logging

class Key:
	Primary = "id"
	Creation = "createdAt"

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
	#Get table and bucket reference using environent variables
	table = boto3.resource("dynamodb").Table(os.environ["JOB_TABLE"])
	bucket = boto3.resource("s3").Bucket(os.environ["SRC_BUCKET"])

	#Cache the current time
	currentTime = datetime.now()
	#Subtract 30 days, this is our deletion criteria
	cutoffTime = currentTime + timedelta(-30)

	#Retrieve all jobs from the DynamoDB
	response = table.scan()

	items = response["Items"]
	
	#There is a limit on how much data is returned at once, so we do multiple runs if required
	while "LastEvaluatedKey" in response:
		response = table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
		items.extend(response["Items"])

	for item in items:
		#Expects and ISO8601 datetime string
		time = datetime.strptime(item[Key.Creation], "%Y-%m-%dT%H:%M:%S.%f%z")

		#Remove timezone, as datetime.now() doesn't have one
		time = time.replace(tzinfo=None)
		
		jobId = item[Key.Primary]
		
		#print("Id: {}, Time: {}".format(jobId, time))
		logger.info("Id: {}, Time: {}".format(jobId, time))
		
		#This job is still in the valid time range, so skip it
		if time >= cutoffTime:
			continue
		
		#print("Deleting {}...".format(jobId))
		logger.info("Deleting {}...".format(jobId))
		
		# Clean out batch files in S3 bucket
		bucket.objects.filter(Prefix=jobId).delete()

		logger.info("Deleted folder from bucket.")

		# Update DynamoDB job status
		table.delete_item(
			Key={Key.Primary: jobId},
		)

		logger.info("Deleted info from job table.".format(jobId))

		"""
		If we add the table that converts between the public and private batch
		job keys we'll have to delete the corresponding entry their as well
		"""

