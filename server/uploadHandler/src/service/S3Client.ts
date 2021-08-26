import * as AWS from "aws-sdk"

import {config as dotenv } from "dotenv"

dotenv()


const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

const s3bucket = new AWS.S3({
  region: process.env.AWS_BUCKET_REGION,
  secretAccessKey: process.env.AWS_SECRT_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY
});

export const uploadToS3 = async (fileName: string, fileStream:string): Promise<any> {
    
  const params = {
      Bucket: BUCKET_NAME,
      Key: "userUploads" + "/" + fileName,
      Body: fileStream,
      ACL:"public-read"
    } as AWS.S3.Types.PutObjectRequest;
    
    
    return s3bucket.upload(params).promise()
    
  }