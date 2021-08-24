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
	fileStatus: FileStatus;
	resultCode: number;
	resultFileReference: string;
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
