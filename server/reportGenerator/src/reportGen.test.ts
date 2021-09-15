import { Context, SQSMessageAttributes, SQSRecordAttributes } from "aws-lambda";

import { generateReport } from "./reportGen";

//  so that jest doesn't fail
test("Placeholder test", () => {
	expect(true).toBe(true);
});
