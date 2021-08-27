import * as AWS from "aws-sdk"

const BUCKET_NAME = process.env["SRC_BUCKET"];

const s3bucket = new AWS.S3();

export const uploadToS3 = (fileName: string, fileStream:string): Promise<any> {
    const params = {
      Bucket: BUCKET_NAME,
      Key: "userUploads" + "/" + fileName,
      Body: fileStream
    } as AWS.S3.Types.PutObjectRequest;
  
    url = s3bucket.getSignedUrlPromise(params)
    return s3bucket.upload(params).promise()

    
  }