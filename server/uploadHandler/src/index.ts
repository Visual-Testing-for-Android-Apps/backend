import { createNewJob } from "./createNewJob";
import { ApiGatewayEvent, ApiGatewayResponse } from "./service/apigateway";

/**
 * Sample Lambda function which creates an instance of a PostApp and executes it.
 * The PostApp takes the HTTP request body, turns it into a TodoItem and stores it in DynamoDB.
 *
 * @param {Object} event - Input event to the Lambda function
 *
 * @returns {Object} object - Object containing the TodoItem stored.
 *
 */
export const handler = async (
  event: ApiGatewayEvent
): Promise<ApiGatewayResponse> => {
  if (!process.env["JOB_TABLE"]) {
    console.log(
      "Lambda environment variables is missing the SAMPLE_TABLE variable required."
    );
    return { statusCode: 500 };
  }

  console.log("job_table", process.env["JOB_TABLE"]);
  console.log("src_bucket", process.env["SRC_BUCKET"]);
  console.log("region", process.env["AWS_REGION"]);

  await createNewJob();
  return { statusCode: 200, body: event.body };
};
