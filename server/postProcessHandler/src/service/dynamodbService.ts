// import { GetItemInput, GetItemOutput } from "aws-sdk/clients/dynamodb";

// import { getItem } from "./dynamodbClient";

// const tableName = process.env.JOB_TABLE as string

// export const addNewJobToDb = async (
//     email: string,
//     videoFiles: string[],
//     imageFiles: string[],
//   ): Promise<void> => {
//     const newJobItem = {
//       TableName: tableName,
//       Item:{
//           id: uuidv4,
//           email,
//           videoFiles,
//           imageFiles,
//           updatedAt: new Date().toISOString()
//       }
//     } as PutItemInput

//     await putItem(newJobItem)
//   }
