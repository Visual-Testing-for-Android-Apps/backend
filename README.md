Uploaded 29/8/2021

# Visual testing Backend

## Front end reads this section

### Batch job.

#### Root URL : https://2fr7fj3ota.execute-api.ap-southeast-2.amazonaws.com/Prod/

The user receives an email containing a link such as
https://afternoon-woodland-24079.herokuapp.com/batchreportpage/publicKey?pwd=password

The frontend uses the publicKey and password from the link to sent a POST request for
the presigned URL for the batch job. An example request body is given below.

```
POST /jobData/

// Sample request body
{
    "publicKey": "publicKeyExample",
    "pwd": "passwordExample"
}

// Sample response body
{
    "url":  "presignedUrlExample",
}
```

This presigned URL gives the frontend access to a folder containing a file named report.json. This file contains the batch job results with the following format.

```
{
    "images": [
        {
            "title": "Image UI issue title",
            "desc": "Image UI issue description",
            "orig_image": "pathToOriginalImage",
            "heatmap_image": "pathToHeatmapImage"
        }
    ],
    "videos": [
        {
            "title": "Video UI issue title",
            "desc": "Video UI issue description",
            "video": "pathToVideo"
        }
    ]
}
```

### Single job

Video Endpoint: POST https://u8iacl4gj0.execute-api.ap-southeast-2.amazonaws.com/Prod/Seenomaly

Image Endpoint: POST https://u8iacl4gj0.execute-api.ap-southeast-2.amazonaws.com/Prod/owleye

## Back end reads this section

After step 1,2,3 a job will be created in the database, eg.

```
{
 "id": "98a28539-1346-49d6-96af-496850deb006",
 "emailVerified": true,
 "emailVerification": {
  "createdAt": "2021-09-20T08:27:18.972Z",
  "code": "910695"
 },
 "files": [
  {
   "contentType": "video/mp4",
   "orginalName": "test_instagram.mp4",
   "s3Key": "98a28539-1346-49d6-96af-496850deb006/4320171.mp4",
   "status": "NEW",
   "type": "VIDEO"
  },
  {
   "contentType": "image/jpeg",
   "orginalName": "test.jpg",
   "s3Key": "98a28539-1346-49d6-96af-496850deb006/240046.jpg",
   "status": "NEW",
   "type": "IMAGE"
  }
 ],
 "createdAt": "2021-09-20T08:25:40.984Z",
 "email": "beining0026@gmail.com"
}

```

After step 4

- waiting for the file to be processed. -> In db, jobStatus = PROCESSING, file.statu
- all file completed. -> In db, jobStatus = GENERATION , file.status = DONE

database looks like this ,

```
{
 "id": "98a28539-1346-49d6-96af-496850deb006",
 "emailVerified": true,
 "emailVerification": {
  "createdAt": "2021-09-20T08:27:18.972Z",
  "code": "910695"
 },
 "files": [
  {
   "result": {
    "message": "Snackbar blocks bottom app bar",
    "code": "3"
   },
   "orginalName": "test_instagram.mp4",
   "s3Key": "98a28539-1346-49d6-96af-496850deb006/4320171.mp4",
   "type": "VIDEO",
   "contentType": "video/mp4",
   "status": "DONE"
  },
  {
   "contentType": "image/jpeg",
   "orginalName": "test.jpg",
   "result": {
    "message": [],
    "outputKey": "98a28539-1346-49d6-96af-496850deb006/result/result_240046.jpg"
   },
   "s3Key": "98a28539-1346-49d6-96af-496850deb006/240046.jpg",
   "status": "DONE",
   "type": "IMAGE"
  }
 ],
 "createdAt": "2021-09-20T08:25:40.984Z",
 "jobStatus": "GENERATING",
 "email": "beining0026@gmail.com"
}
```

S3 bucket looks like this,
|-jobID
|-file1.mp4
|-file2.png
|-result
|-result_file2.jpg
|-report.html
