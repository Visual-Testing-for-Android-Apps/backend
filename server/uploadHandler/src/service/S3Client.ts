import * as AWS from "aws-sdk"

const BUCKET_NAME = process.env["SRC_BUCKET"];
const URL_EXPIRATION_SECONDS = 300;
const s3bucket = new AWS.S3();
const videoExtension = ["mp4"];
const imageExtension = ["jpg", "jpeg"];

export const uploadToS3 = (fileName: string, fileStream: string): Promise<any> => {
	const params = {
		Bucket: BUCKET_NAME,
		Key: "userUploads" + "/" + fileName,
		Body: fileStream,
	} as AWS.S3.Types.PutObjectRequest;

	return s3bucket.upload(params).promise();
};

export const getUploadURL = async (fileKey: string, fileExtension: string) => {
	// Get signed URL from S3
	const s3Params = {
		Bucket: BUCKET_NAME,
		Key: fileKey,
		Expires: URL_EXPIRATION_SECONDS,
		ContentType: getContentType(fileExtension),
	};

	const uploadURL = await s3bucket.getSignedUrlPromise("putObject", s3Params);
	return uploadURL;
};

export const getUploadedFilesInJob = async (jobId: string): Promise<string[]> => {
	if (typeof BUCKET_NAME == "undefined") {
		throw Error("S3 Bucket name undefined");
	}
	const params = {
		Bucket: BUCKET_NAME,
		Prefix: `${jobId}/`,
	};
	const response = await s3bucket.listObjectsV2(params).promise();
	const uploadedFileNames: string[] = [];
	if (!response.Contents) {
		return [];
	}
	response.Contents.forEach((obj) => {
		if (obj.Key) {
			uploadedFileNames.push(obj.Key);
		}
	});
	// might need continous token to pagination
	return uploadedFileNames;
};

const getContentType = (fileExtension: string) => {
	if (videoExtension.includes(fileExtension.toLowerCase())) {
		return "video/mp4";
	}
	if (imageExtension.includes(fileExtension.toLowerCase())) {
		return `image/${fileExtension.toLowerCase()}`;
	}
	throw Error(
		JSON.stringify({
			fileExtension,
			message: "unrecoganised file extension",
		})
	);
};
