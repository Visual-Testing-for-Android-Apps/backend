import { AWSError, SQS } from "aws-sdk"
import { SendMessageRequest, SendMessageResult } from "aws-sdk/clients/sqs"
import { PromiseResult } from "aws-sdk/lib/request"

const sqsClient = new SQS({
	apiVersion: "2012-11-05",
	maxRetries: 3,
});

export interface modelTiggerSqsEvent {
	jobKey: string;
}

export const sendMessage = (
	event: modelTiggerSqsEvent,
	sqsURL: string
): Promise<PromiseResult<SendMessageResult, AWSError>> => {
	const params: SendMessageRequest = {
		QueueUrl: sqsURL,
		MessageBody: JSON.stringify(event),
	};
	return sqsClient.sendMessage(params).promise();
};
