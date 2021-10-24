import { createNewJob } from "./createNewJob"
import { addFileToJob } from "./service/dynamodbService"
import { getUploadURL } from "./service/S3Client"
import { handleNewEmailSes } from "./service/sesService"

jest.mock("./service/dynamodbService.ts")
jest.mock("./service/sesService.ts")
jest.mock("./service/S3Client.ts")

const mockCreateNewJob = createNewJob as jest.Mock
const mockHandleNewEmailSes = handleNewEmailSes as jest.Mock
const mockGetUploadURL  = getUploadURL as jest.Mock
const mockAddFileToJob = addFileToJob as jest.Mock

const MOCK_UPLOAD_URL = "upload-url"
describe("main", () => {
    beforeEach(()=> {
        mockGetUploadURL.mockReturnValue(MOCK_UPLOAD_URL)
    })
	afterEach(() => jest.clearAllMocks());

	it("create new job", async () => {
        const mockEventBody = JSON.stringify({
            "email":"sample_email@gmail.com",
            "fileNames": ["test.mp4","test.jpg"]
        })

		const ret  = await createNewJob(mockEventBody);
        expect(ret.uploadUrls).toEqual({
            "test.mp4":MOCK_UPLOAD_URL,
            "test.jpg":MOCK_UPLOAD_URL,
        })
        
	});
});