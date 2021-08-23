export interface job {
	id: string;
	email: string;
	uploadTime: string;
	files: file[];
}

export interface file {
	fileReference: string;
	fileType: FileType;
	finishTime: string;
	fileStatus: fileStatus;
	resultCode: number;
	resultFileReference: string;
}

export enum FileType {
	VIDEO = "VIDEO",
	IMAGE = "IMAGE",
}

export enum fileStatus {
	NEW = "NEW",
	CRASHED = "CRASHED",
	DONE = "DONE",
}
