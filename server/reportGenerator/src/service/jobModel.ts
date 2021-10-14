export interface Job {
  id: string
  email: string
  createdAt: string
  files: File[]
  emailVerified: boolean
  jobStatus: string
}

export interface File {
  contentType: string
  s3Key: string
  orginalName: string
  type: string
  finishTime?: string
  status: FileStatus
  result: Result
}

interface Result {
  message: string[]
  code: string
  outputKey: string
}

/* Custom return type for generateImgReport function */
export interface ImgReturn {
  titles: string[]
  descs: string[]
  orig_image: string
  heatmap_image: string
  orginalName?: string
}

export enum FileType {
  VIDEO = 'VIDEO',
  IMAGE = 'IMAGE',
}

export enum FileStatus {
  NEW = 'NEW',
  CRASHED = 'CRASHED',
  DONE = 'DONE',
}

export enum Models {
  SEENOMALY = 'Seenomaly',
  OWLEYE = 'owleye',
}

export enum JobStatus {
  PROCESSING = 'PROCESSING',
  GENERATING = 'GENERATING',
  ZIPPING = 'ZIPPING',
}
