import { SQSEvent } from 'aws-lambda'
import { getItem, GetItemInput, updateItem, UpdateItemInput, pushToQueue, SendMessageRequest } from './service/dynamodbClient'
import {AttributeMap} from "aws-sdk/clients/dynamodb";

export const awaitJob = async (request: GetItemInput): Promise<AttributeMap | null>  => {
	let res = await getItem(request);
	if (res.Item != null) {
		return res.Item
	}
	return null
}

export const updateJob = async(request: UpdateItemInput): Promise<any> =>{
	return await updateItem(request);
}

export const isJobComplete = async (event: SQSEvent, context: AWSLambda.Context): Promise<any> => {
	const key: string = JSON.parse(event.Records[0].body).jobKey
	console.log("Job key: " + String(key))

	const request: GetItemInput = {
		TableName:  process.env.JOB_TABLE as string,
		Key: {
			id: { S: key }
		}
	}
	let ready: boolean = false
	const res = await awaitJob(request)
	if (res) {
		//Check current job status. If we are already generating the report, then return early (could happen due to queue buffer)
		//If jobStatus doesn't exist, we return as the job is illformed
		if(res.jobStatus?.S){
			const status = res.jobStatus.S;
			console.log(status);
			if(status !== "PROCESSING"){
				return true;
			}
		} else{
			return false;
		}
		// const path = res.Item["path"];
		const media = res.files
		ready = true
		if (media.L != null) {
			media.L.forEach( (element) => {
				if (element.M != null) {
					var fin = element.M.finished.BOOL
					if (!(fin == null)) {
						ready &&= fin.valueOf()
						console.log("Is " + (element.M.fileRef.S != null ? String(element.M.fileRef.S) : "") + " finished?: " + String(fin))
					}
				}
			})
		}
		if (ready) {
			// Call to report handler
			const request: UpdateItemInput = {
				TableName:  process.env.JOB_TABLE as string,
				Key: {
					id: { S: key }
				},
				UpdateExpression: "set jobStatus = :s",
				//ExpressionAttributeNames: {
				//	"#MyVariable": "variable23"
				//},
				ExpressionAttributeValues: {
					":s": {"S": "GENERATING"}
				}
			}
			await updateJob(request);

			var params: SendMessageRequest = {
				MessageBody: '{ "jobKey": "' + String(key) + '" }',
				QueueUrl: process.env.REPORT_GENERATION_QUEUE as string,
			};
			
			pushToQueue(params);
		}
	}
	
	return ready;
}

exports.handler = (event: SQSEvent, context: AWSLambda.Context): Promise<any> => {
	return isJobComplete(event, context);
}
