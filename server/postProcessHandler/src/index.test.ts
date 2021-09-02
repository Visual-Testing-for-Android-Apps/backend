import { Context, SQSMessageAttributes, SQSRecordAttributes } from "aws-lambda";

import { handler } from "./";

const mockContext: Context = {
	awsRequestId: "mockRequestId",
	callbackWaitsForEmptyEventLoop: false,
	functionVersion: "",
	functionName: "",
	invokedFunctionArn: "",
	logGroupName: "",
	logStreamName: "",
	memoryLimitInMB: "",

	done: () => {
		return;
	},
	getRemainingTimeInMillis: () => 20000,
	fail: () => {
		return;
	},
	succeed: () => {
		return;
	},
};

let logSpy: any;
describe("Main", function () {
	beforeEach(() => {
		logSpy = jest.spyOn(console, "log");
	});
	// This test invokes the sqs-payload-logger Lambda function and verifies that the received payload is logged
	it("Handler", async () => {
		// Mock console.log statements so we can verify them. For more information, see
		// https://jestjs.io/docs/en/mock-functions.html

		// Create a sample payload with SQS message format
		const payload = {
			body: "someInformation",
			attributes: {} as SQSRecordAttributes,
			awsRegion: "",
			eventSource: "",
			eventSourceARN: "",
			md5OfBody: "",
			messageAttributes: {} as SQSMessageAttributes,
			messageId: "",
			receiptHandle: "",
		};

		const res = await handler({ Records: [payload] }, mockContext);

		// Verify that console.info has been called with the expected payload
		expect(res).toBeUndefined();
		expect(logSpy).toBeCalledTimes(2);
	});
});
