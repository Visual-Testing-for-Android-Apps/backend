import { createNewJob, FileUploadResponseBody } from "./createNewJob"
import { ApiGatewayEvent, ApiGatewayResponse } from "./service/apigateway"
import { getEmail, updateEmail } from "./service/dynamodbService"
import { checkVerificationCode, handleNewEmailSes } from "./service/sesService"
import { modelTiggerSqsEvent, sendMessage } from "./service/sqsClient"

const CORS_HEADER = {
	"Access-Control-Allow-Headers": "*",
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "OPTIONS,POST,GET",
};

const JOB_HANDLER_QUEUE = process.env.JOB_HANDLER_QUEUE

/**
 * Sample Lambda function which creates an instance of a PostApp and executes it.
 * The PostApp takes the HTTP request body, turns it into a TodoItem and stores it in DynamoDB.
 *
 * @param {Object} event - Input event to the Lambda function
 *
 * @returns {Object} object - Object containing the TodoItem stored.
 *
 */
export const handler = async (event: ApiGatewayEvent): Promise<ApiGatewayResponse> => {
	try {
		switch (event.path){
			case "/job":
				return newJobHandler(event)
			case "/job/update-email":
				return updateEmailHandler(event)
			case "/job/resend-code":
				return resendCodeHandler(event)
			case "/job/upload-done":
				return uploadDoneHandler(event)
			case "/job/verify-code":
				return verifyCodeHandler(event)
			default:
				return {
					statusCode: 404,
					headers: CORS_HEADER,
					body: JSON.stringify({
						message: "invalid path",
						event:event
					}),
				}
		}
	} catch (e) {
		console.log(e);
		return {
			statusCode: 502,
			headers: CORS_HEADER,
			body: String(e),
		};
	}
};

const newJobHandler = async (event:ApiGatewayEvent): Promise<ApiGatewayResponse> =>{

	const returnBody: FileUploadResponseBody = await createNewJob(event.body);
	
	return {
		statusCode: 200,
		headers: CORS_HEADER,
		body: JSON.stringify({
			...returnBody,
			message:"Created new Job",
		}),
	};
}

const updateEmailHandler = async (event:ApiGatewayEvent): Promise<ApiGatewayResponse> =>{
	const parsedBody = JSON.parse(event.body);
	const jobID = parsedBody["jobID"];
	const newEmail = parsedBody["email"];
	if (!jobID || !newEmail){
		throw Error("No jobID or new email provided");
	}
	await updateEmail(jobID, newEmail);
	return {
		statusCode: 200,
		headers: CORS_HEADER,
		body: JSON.stringify({
			jobID,
			newEmail,
			message:"Udpated email",
		}),
	};
}

const resendCodeHandler = async (event:ApiGatewayEvent): Promise<ApiGatewayResponse> =>{
	const parsedBody = JSON.parse(event.body);
	const jobID = parsedBody["jobID"];
	if (!jobID){
		throw Error("No jobID or new email provided");
	}

	const email = await getEmail(jobID)
	await handleNewEmailSes(jobID, email)
	return {
		statusCode: 200,
		headers: CORS_HEADER,
		body: JSON.stringify({
			jobID,
			email,
			message: "Resent verification code",
		}),
	}

}

const uploadDoneHandler =  async (event:ApiGatewayEvent): Promise<ApiGatewayResponse> =>{
	const parsedBody = JSON.parse(event.body);
	const jobID = parsedBody["jobID"];
	if (!jobID) {
		throw Error("No jobID provided");
	}

	//Push a request to our SQS queue for the next iteration
	if (JOB_HANDLER_QUEUE === undefined){
		throw Error("Environment variable \"JOB_HANDLER_QUEUE\" is missing!")
	}
	await sendMessage({jobKey: jobID}, JOB_HANDLER_QUEUE);

	return {
		statusCode: 200,
		headers: CORS_HEADER,
		body: JSON.stringify({
			jobID,
			message:"Upload done, triggered job handler",
		}),
	}

}

const verifyCodeHandler = async (event:ApiGatewayEvent): Promise<ApiGatewayResponse> =>{
	const parsedBody = JSON.parse(event.body);
	const jobID = parsedBody["jobID"];
	const verificationCode = parsedBody["verificationCode"];

	if (!jobID || !verificationCode) {
		throw Error("No jobID or verificationCode provided");
	}
	const verified = await checkVerificationCode(jobID, verificationCode)
	return {
		statusCode: verified? 200 : 403,
		headers: CORS_HEADER,
		body: JSON.stringify({
			jobID,
			verified,
			message:"Verified code",
		}),
	}
	

}
