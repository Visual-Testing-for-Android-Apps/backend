import * as AWS from "aws-sdk"
import { PutObjectRequest } from "aws-sdk/clients/s3"

const BUCKET_NAME = process.env["SRC_BUCKET"];
const URL_EXPIRATION_SECONDS = 3000; //TODO: This is 50 minutes, I don't think it needs to be any more than 5
const s3bucket = new AWS.S3();

export const uploadToS3 = (fileName: string, fileStream: string): Promise<any> => {
	const params = {
		Bucket: BUCKET_NAME,
		Key: "userUploads" + "/" + fileName,
		Body: fileStream,
	} as AWS.S3.Types.PutObjectRequest;

	return s3bucket.upload(params).promise();
};

export const getDownloadURL = async (key: string): Promise<string> => {
	// Get signed URL from S3
	const s3Params = {
		Bucket: BUCKET_NAME,
		Key: key,
		Expires: URL_EXPIRATION_SECONDS,
	};

	return await s3bucket.getSignedUrlPromise("getObject", s3Params);
};

export const uploadBase64EncodedImage = async (image_str:string, fileKey:string) =>{
	const buf = Buffer.from(image_str,'base64')
	const data = {
		Key: fileKey, 
		Body: buf,
		Bucket: BUCKET_NAME,
		ContentType: 'image/jpeg'
	} as PutObjectRequest
	console.log(JSON.stringify(data))
	const ret = await s3bucket.putObject(data).promise()
	console.log('successfully uploaded the image!', ret);
}
