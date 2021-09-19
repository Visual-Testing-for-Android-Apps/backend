import {
  Context,
  SQSMessageAttributes,
  SQSRecord,
  SQSRecordAttributes,
} from "aws-lambda"
import { AttributeMap, AttributeValue } from "aws-sdk/clients/dynamodb"

import { isJobComplete } from "./isJobComplete"
import { GetItemInput } from "./service/dynamodbClient"

import f = require("./");

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

// Create a sample payload with SQS message format
const createContex = (jobKey: number): SQSRecord => {
	return {
		body: '{ "jobKey": "' + String(jobKey) + '" }',
		attributes: {} as SQSRecordAttributes,
		awsRegion: "",
		eventSource: "",
		eventSourceARN: "",
		md5OfBody: "",
		messageAttributes: {} as SQSMessageAttributes,
		messageId: "",
		receiptHandle: "",
	};
};

const createFile = (
	fileRef: string,
	fileType: string,
	finished: boolean,
	resultCode: number,
	resultRef: string
): AttributeValue => {
	return {
		M: {
			fileRef: { S: fileRef },
			fileType: { S: fileType },
			finished: { BOOL: finished },
			resultCode: { N: String(resultCode) },
			resultFileReference: { S: resultRef },
		},
	};
};

const createBatch = (jobStatus: string, ...files: AttributeValue[]): AttributeMap => {
	return {
		jobStatus:{
			S: jobStatus
		},
		files: {
			L: files,
		},
	};
};

//let logSpy: any;
describe("Main", function () {
	beforeEach(() => {
		//logSpy = jest.spyOn(console, "log");
		jest.spyOn(f, "awaitJob").mockImplementation((...args: unknown[]) => {
			return new Promise((resolve, reject) => {
				let input = args[0] as GetItemInput;
				var index = 0;
				if (input?.Key?.id?.S != null) {
					index = number(input.Key.id.S);
				}

				let batches = [
					createBatch(
						"PROCESSING",
						createFile("some/path/", "image", false, 0, ""),
						createFile("other/path/", "video", true, 1, "another/path")
					),
					createBatch(
						"PROCESSING",
						createFile("some/path/", "image", true, 0, ""),
						createFile("other/path/", "video", true, 1, "another/path")
					),
				];

				if (index > 0 && index <= batches.length) {
					resolve(batches[index - 1]);
				} else {
					reject(Error());
				}
			});
		});
	});

	afterAll(() => {
		jest.restoreAllMocks();
	});

	// This test invokes the sqs-payload-logger Lambda function and verifies that the received result is correct
	// Database calls are mocked
	it("HandlerA", async () => {
		const res = await isJobComplete({ Records: [createContex(1)] }, mockContext);
		expect(res).toEqual(false);
	});

	it("HandlerB", async () => {
		const res = await isJobComplete({ Records: [createContex(2)] }, mockContext);
		expect(res).toEqual(true);
		//expect(logSpy).toBeCalledTimes(2);
	});
});
