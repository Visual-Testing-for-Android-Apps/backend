import * as AWS from "aws-sdk"
import { PutObjectRequest } from "aws-sdk/clients/s3"

const BUCKET_NAME = process.env["SRC_BUCKET"];
const URL_EXPIRATION_SECONDS = 3000;
const s3bucket = new AWS.S3();


export const getDownloadURL = async (key: string):Promise<string> => {
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
		ContentEncoding: 'base64',
		ContentType: 'image/jpeg'
	} as PutObjectRequest
	console.log(JSON.stringify(data))
	await s3bucket.upload(data)
	console.log('successfully uploaded the image!', buf);
}