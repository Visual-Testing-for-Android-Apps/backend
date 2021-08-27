import { handler } from "./index";
import { ApiGatewayEvent } from "./service/apigateway";
import { createNewJobItem } from "./service/dynamodbService";

jest.mock("./service/dynamodbService");

const mockAddNewJobToDb = createNewJobItem as jest.Mock;
describe("main", () => {
	beforeEach(() => {
		mockAddNewJobToDb.mockImplementation(() => {
			return;
		});
	});
	afterEach(() => jest.clearAllMocks());

	it("Main", async () => {
		const mockApiEvent = {} as ApiGatewayEvent;
		const res = await handler(mockApiEvent);

		expect(res).toEqual({
			body: "SyntaxError: Unexpected token u in JSON at position 0",
			headers: {
				"Access-Control-Allow-Headers": "*",
				"Access-Control-Allow-Methods": "OPTIONS,POST,GET",
				"Access-Control-Allow-Origin": "*",
			},
			statusCode: 502,
		});
	});
});
