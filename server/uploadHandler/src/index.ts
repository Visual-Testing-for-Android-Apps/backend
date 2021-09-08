import { createNewJob, FileUploadResponseBody } from "./createNewJob";
import { ApiGatewayEvent, ApiGatewayResponse } from "./service/apigateway";

const CORS_HEADER = {
	"Access-Control-Allow-Headers": "*",
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "OPTIONS,POST,GET",
};

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
		const returnBody: FileUploadResponseBody = await createNewJob(event.body);
		return {
			statusCode: 200,
			headers: CORS_HEADER,
			body: JSON.stringify({
				...returnBody,
			}),
		};
	} catch (e) {
		console.log(e);
		return {
			statusCode: 502,
			headers: CORS_HEADER,
			body: String(e),
		};
	}
};
