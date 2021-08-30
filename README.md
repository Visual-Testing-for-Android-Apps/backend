Uploaded 29/8/2021

# Visual testing Backend 

## Front end reads this section 
### Batch job. 
Front need to 

🔵 1. (for each file) send a POST request to get a preSigned URL for upload image/vidoe 
example request body
```
POST https://knfxd86hz7.execute-api.ap-southeast-2.amazonaws.com/Prod/job 

// First file
{
    "email": "sample_email@gmail.com",
    "fileName":"test.mp4" // extension is important. 
}

// Following files 
{
    "email": "sample_email@gmail.com",
    "fileName":"test.mp4",
    "jobID" : "jobId returned from the first api call"
}
```
example return body 
```
{
    "uploadUrl": "some_url",
    "jobID": "2a9c3a0e-8df2-4484-a281-059796b15682"
}
```
🔵 2. (for each file) Send a PUT request on the preSigned URL with file
```
PUT {uploadUrl returned from step 1}
```
🔵 3. (after all file has been uploaded) send a Post requst to notify finish 
```
POST https://knfxd86hz7.execute-api.ap-southeast-2.amazonaws.com/Prod/job 

{
    "uploadDone": "true", 
    "jobID":"jobId returned from the first api call"
}
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
```
✅ Go to cloudwatch/log group to see the the execution logs
✅ dynamodb to check if result has been updated 
✅ S3 to check if image is saved (only for image model)




