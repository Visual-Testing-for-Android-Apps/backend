import { AWSError, SQS } from "aws-sdk"
import { SendMessageRequest, SendMessageResult } from "aws-sdk/clients/sqs"
import { PromiseResult } from "aws-sdk/lib/request"

const awsRegion = process.env.AWS_REGION;
const JOB_HANDLER_QUEUE = process.env.JOB_HANDLER_QUEUE!
const DELAY = 60 * 4 //4 minute delay

const sqs = new SQS({
	apiVersion: '2012-11-05',
	region: awsRegion
});

const pushToQueue = (
	params: SendMessageRequest
): Promise<PromiseResult<SendMessageResult, AWSError>> => sqs.sendMessage(params).promise();


export const selfEnvoke = async (jobID:string) =>{
	const params: SendMessageRequest = {
		MessageBody: JSON.stringify({jobKey:jobID}),
		QueueUrl:JOB_HANDLER_QUEUE,
		DelaySeconds: DELAY
	};

	await pushToQueue(params);

}