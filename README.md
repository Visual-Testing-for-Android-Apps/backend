Uploaded 29/8/2021

# Visual testing Backend

## Front end reads this section

### Batch job.

#### Root URL : https://2fr7fj3ota.execute-api.ap-southeast-2.amazonaws.com/Prod/

Front need to
🔵 1. Send a POST request to get preSigned URLs for upload image/vidoe
example request body

```
POST /job/upload-request
// Sample request body
{
    "email": "sample_email@gmail.com",
    "fileNames":["test.mp4", "test.jpg"]
}
// Sample response body
{
    "uploadUrls":
                {
                    "test.mp4" : "preSigned-url1",
                    "test.jpg" : "preSigned-url1"
                }
    "jobID" : "jobId"
}
```

~~📧 At this point, you will receive a verification code in your email. However for now, the email service is in sendbox mode, can't send email to unverified email address. Let me (Rebecca) know if you want to be verified. All verification codes are 6 digit numbers. You can still use unverified email for submiting jobs, then the verification is just skipped.~~

🔵 2. (for each file) Send a PUT request on the preSigned URL with file

```
PUT {uploadUrl returned from step 1}
```

~~(skipped) 3. After the user entered the verification code
missing verification only prevent the models to process the file, it doesn't stop you to upload. Verification code expires in 500 seconds (can be adjusted)~~

```
POST /job/verify-code
// Sample request body
{
    "verificationCode": "some 6 digt number", // can be anything code for now send
    "jobID":"jobId returned from the first api call"
}
// Sample response body
{
    "jobID": "30ecd6ed-78ab-40d6-b3cd-79c2e3c4922e",
    "verified": true,
    "message": "verify code ..."
}
```

~~3.1 if user want to update their email (optional)~~

```
POST /job/update-email
// Sample request body
{
    "email": "new_email_address",
    "jobID":"jobId returned from the first api call"
}
```

~~3.2 resend verification code (optional)~~

```
POST /job/resend-code
// Sample request body
{
    "jobID":"jobid"
}
```

🔵 4. (after all file has been uploaded) send a Post request to notify finish

```
POST /job/upload-done
// Sample request body
{
    "jobID":"jobid"
}
// Sample response
statusCode = 200 -> start to process the job
statusCode != 200 -> error
```

🔵 5. Report display

The user receives an email containing a link such as
https://afternoon-woodland-24079.herokuapp.com/batchreportpage/publicKey?pwd=password

The frontend uses the publicKey and password from the link to sent a POST request for
the presigned URL for the batch job. An example request body is given below.

```
POST /jobdata/

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
            "titles": ["List of image UI issue titles"],
            "descs": ["List of image UI issue descriptions"],
            "orig_image": "pathToOriginalImage",
            "heatmap_image": "pathToHeatmapImage"
        }
    ],
    "videos": [
        {
            "title": "Video UI issue title",
            "desc": "Video UI issue description",
            "classification": "Video UI issue code",
            "video": "pathToVideo"
        }
    ]
}
```

🔵 5. Retrive a file

```
Post /job/file

// sample request
{"filePath": "jobID/1231.jpg" }

// sample response
{"url" : "downloadUrl"}
```

```
GET downloadUrl
```

🔵 OR get all job file at once

```
Post /job/files

// sample request
{"jobID": "4141" }

// sample response
{
    "4141/342.jpg":"downloadurl1",
    "4141/result/342.jpg":"downloadurl1",
    "4141/342.mp4":"downloadurl3",
}
```

```
GET downloadUrl
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
