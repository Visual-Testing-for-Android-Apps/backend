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

📧 At this point, you will receive a verification code in your email. However for now, the email service is in sendbox mode, can't send email to unverified email address. Let me (Rebecca) know if you want to be verified.  All verification codes are 6 digit numbers. You can still use unverified email for submiting jobs, then the verification is just skipped. 

🔵 2. (for each file) Send a PUT request on the preSigned URL with file

```
PUT {uploadUrl returned from step 1}
```

🔴 3. After the user entered the verification code 

missing verification only prevent the models to process the file, it doesn't stop you to upload.

Verification code expires in 500 seconds (can be adjusted)
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

3.1 if user want to update their email 
```
POST /job/update-email

// Sample request body
{
    "email": "new_email_address",
    "jobID":"jobId returned from the first api call"
}
```

3.2 resend verification code
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

### Single job

Video Endpoint: POST https://knfxd86hz7.execute-api.ap-southeast-2.amazonaws.com/Prod/Seenomaly

## Back end reads this section

✅ Manual trigger owlEye and seenomaly
In your AWS console,

1. go to SQS
2. select `send and reieve messages`.
   Example body format

```
{
    "jobID":123,
    "fileKey": the file reference in S3,
    "fileIdx": the file index in the dynmodb files list of the job.
}
✅ Go to cloudwatch/log group to see the the execution logs
✅ dynamodb to check if result has been updated
✅ S3 to check if image is saved (only for image model)

```