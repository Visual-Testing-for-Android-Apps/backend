export interface Job {
	id: string;
	email: string;
	createdAt: string;
	files: File[];
	emailVerified:boolean;
}

export interface File {
	contentType: string;
	s3Key: string;
	orginalName:string;
	type: string;
	finishTime?: string;
	fileStatus: FileStatus;
	resultCode?: number;
	resultFileReference?: string;
}

export interface EmailVerification {
	code:string;
	createdAt:string;
}

export enum FileType {
	VIDEO = "VIDEO",
	IMAGE = "IMAGE",
}

export enum FileStatus {
	NEW = "NEW",
	CRASHED = "CRASHED",
	DONE = "DONE",
}

export enum Models {
	SEENOMALY = "Seenomaly",
	OWLEYE = "owleye"
}



export const extensionToContentType: { [key:string] :string }  = {
	"mp4": "video/mp4",
	"jpg":"image/jpeg",
	"jpeg":"image/jpeg",
	"jfif":"image/jpeg",
	"pjeg":"image/jpeg",
	"pjpeg":"image/jpeg",
	"png":"image/png",
}

export const getFileType = (fileExtension:string):string => {
	if (typeof extensionToContentType[fileExtension.toLowerCase()] == "undefined"){
		throw Error("Invalid file extension");
	}
	return extensionToContentType[fileExtension.toLowerCase()].split("/")[0] == "video"
	? FileType.VIDEO : FileType.IMAGE
}
