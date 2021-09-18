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

// export const sqsTriggerModels = async (jobID: string) : Promise<boolean> => {
// 	const job = await getJob(jobID);
// 	// check email if verified 
// 	if (!job.emailVerified){
// 		return false
// 	}
// 	// init job 
// 	const files = job.files;
// 	for (let i = 0; i < files.length; i++) {
// 		const fileKey = files[i].s3Key;
// 		console.log("fileKey", fileKey);
// 		const event = {
// 			jobID,
// 			fileKey,
// 			fileIdx: i,
// 		} as modelTiggerSqsEvent;

// 		if (files[i].type == FileType.VIDEO) {
// 			console.log("send message to seenomaly", event);
// 			await sendMessage(event, seenomalySqsURL);
// 			continue;
// 		}

// 		// TODO get URL trigger for owl-eye
// 		if (files[i].type == FileType.IMAGE) {
// 			console.log("send message to owl-eye", event);
// 			await sendMessage(event, owlEyeSqsURL);
// 			continue;
// 		}

// 		throw Error(
// 			JSON.stringify({
// 				jobID,
// 				fileKey,
// 				message: "unrecoganised file extension",
// 			})
// 		);
// 	}
// 	return true
// };