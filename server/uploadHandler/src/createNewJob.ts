import { addNewJobToDb } from "./service/dynamodbService";

export const createNewJob = async () => {
    console.log('Running uploadHandler');
    // 1. upload files to S3

    // 2. save job to DB
    await addNewJobToDb("sample@gmail.com", ["src/v1"], ["src/v2"])

    // 3. trigger the seenomaly/owleye lamdbas


}
