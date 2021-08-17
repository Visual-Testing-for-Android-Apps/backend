import { SQSEvent } from "aws-lambda";

export const handler = async (
  event: SQSEvent,
  context: AWSLambda.Context
): Promise<any> => {
  console.log("event", event);
  console.log("event", context);
};
