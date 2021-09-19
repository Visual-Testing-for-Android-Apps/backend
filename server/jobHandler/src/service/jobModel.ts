export interface Job {
	id: string;
	email: string;
	createdAt: string;
	files: File[];
	emailVerified:boolean;
	jobStatus: string;
}

export interface File {
	contentType: string;
	s3Key: string;
	orginalName:string;
	type: string;
	finishTime?: string;
	status: FileStatus;
	resultCode?: number;
	resultFileReference?: string;
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

export enum JobStatus {
	PROCESSING = "PROCESSING",
	GENERATING = "GENERATING"
}



