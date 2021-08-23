import { handler } from "./index";
import { ApiGatewayEvent } from "./service/apigateway";
import { addNewJobToDb } from "./service/dynamodbService";

jest.mock("./service/dynamodbService");

const mockAddNewJobToDb = addNewJobToDb as jest.Mock;
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

		expect(res).toEqual({ statusCode: 500 });
	});
});
