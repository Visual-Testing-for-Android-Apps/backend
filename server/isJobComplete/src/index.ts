import { SQSEvent } from "aws-lambda"
import { AttributeMap } from "aws-sdk/clients/dynamodb"

import { awaitJob, isJobComplete } from "./isJobComplete.js"
import {
  Converter,
  getItem,
  GetItemInput,
  pushToQueue,
  SendMessageRequest,
  updateItem,
  UpdateItemInput,
} from "./service/dynamodbClient"

export const jobHandler = async (event: SQSEvent, context: AWSLambda.Context): Promise<any> =>{
	const key: string = JSON.parse(event.Records[0].body).jobKey;

	//Job request object.
	const request: GetItemInput = {
		TableName: process.env.JOB_TABLE as string,
		Key: {
			id: { S: key },
		},
	};

	const resMarshalled = await awaitJob(request);

	if (!resMarshalled) { return false; }

	const res = Converter.unmarshall(resMarshalled);
	
	//Check if this job is already complete
	if (res.jobStatus) {
		if (res.jobStatus !== "PROCESSING") {
			return true
		}
	} else {
		return false
	}

	if(!res.files){
		return false
	}

	//Push a request to our SQS queue for the next iteration
	const params: SendMessageRequest = {
		MessageBody: '{ "jobKey": "' + String(key) + '" }',
		QueueUrl: process.env.JOB_STATUS_QUEUE as string,
		DelaySeconds: 60 * 4, //4 minute delay
	};

	await pushToQueue(params);

	for(;;){
		for (let file of res.files) {
			//generate the signed URL
			const signedUrl: string = "";

			const msg: string = '{ "jobKey": "' + String(key) + '"; "signedUrl": "' + signedUrl +'" }';
			
			//Invoke lambda for OwlEyes/Seenomaly
			if(file.filetype == "image"){
				//I think we can just copy/paste this code from somewhere else
				//await mediaRes = ...
			} else{

			}

			//Write results to DB
		}     
	}
	
	//The actual checking if all jobs are complete could be redundant, but leaving it in doesn't hurt anything
	isJobComplete(key);
}
 
//Exports isJobComplete for use with AWS lambda
exports.handler = (event: SQSEvent, context: AWSLambda.Context): Promise<any> => {
	return jobHandler(event, context);
};
