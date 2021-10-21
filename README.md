Uploaded 29/8/2021

# Visual testing Backend

## Table of Content
----
- [Visual testing Backend](#visual-testing-backend)
  - [## Table of Content](#-table-of-content)
  - [## Tech stack](#-tech-stack)
  - [## Architecture](#-architecture)
    - [Diagram](#diagram)
  - [## Want to contribute ?](#-want-to-contribute-)
  - [## Dev Environment Set up](#-dev-environment-set-up)
    - [Deploy on your own AWS account](#deploy-on-your-own-aws-account)
  - [## CI/CD](#-cicd)
    - [Pull requests](#pull-requests)
    - [Continous deploy](#continous-deploy)
- [Lambdas](#lambdas)
  - [## UploadHandler](#-uploadhandler)
    - [Job submission workflow](#job-submission-workflow)
    - [Access files with UploadHandler](#access-files-with-uploadhandler)
  - [JobHandler](#jobhandler)
  - [ReportGen](#reportgen)
  - [JobData](#jobdata)
  - [OwlEye](#owleye)
  - [Seenomaly](#seenomaly)
- [Database Schema](#database-schema)
- [S3 bucket structure](#s3-bucket-structure)


## Tech stack 
----
The backend uses two languages: Python and Typescript. 
* Python: used in our machine learning models and some lambda function
* Typescript: Most lambda are written in typescript

The backend is hosted via AWS. 
* Lambdas handles all the backend logics as well as hosting the machine learning model with the container support. API Gateways create accessing endpoints. SQS acts as glues for lambdas to trigger each other.  
* Elastic Container Register is used to store the machine learning code, model and dependencies. 
* S3 bucket stores the user uploaded files and result files 
* DynamoDB stores the uploading infomations

## Architecture 
----

All backend code are hosted on AWS lambdas. The lambdas can be categoried into two parts
* model components - The machine learning models, owleye and seenomaly, located in `/model`.
* server components - All other logics for handling batch job, including saving and retrieving `job` information, processing a `job` and etc. Located in `/server`. 

These two parts are deployed separately. This is because deploying models is much slower than deploying other lambdas. Therefore, to speed up the deployment of `server components`, we create a new deployment pipeline for `models components` since they get changed less frequently. 

**Model components** 

`Owleye` and `seenomaly` are packed in to two lamdbas. Each of them are triggered by API gateway which allows access from frontend (for live jobs) and other server components (for batch jobs). 

**Server components** 

Then end to end processing for a batch job is supported by the following lambdas. Each of them has a dedicated folder. Here, just we give a high level decription for each of them. More detailed decription is at the bottom. 

* UploadHandler - Triggered by frontend. Handle uploading files and save `job` information to database 

* JobHandler - Triggered by UploadHander. Send image and videos to `Owleye` and `seenomaly` via their API endpoints, save the result to database and S3 bucket. This lambda is self-trigger to prevent having jobs unfinished due to lambda time out. 

* ReportGenerator (ReportGen) - Triggered by JobHandler. Gather all information for a completed batch `job` to create the report in JSON format. Also, generate the access link and send it to the job uploader via email. 

* JobData - Trigger by frontend. Retreive file from S3 bucket and send to front end. 

### Diagram 
The diagram below shows the model and server components. 

<img src="./1.png" alt="drawing" width="350"/>


## Want to contribute ? 
----
You can report a bug or feature suggestion as an issue to the reposity. To contribute to the codebase, create and pull request and link to the relavent issue. 
## Dev Environment Set up 
----
Step 1: Install tools 

- [ ] Install [aws-sam-cli](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html). 
```
# For mac user

curl "https://s3.amazonaws.com/aws-cli/awscli-bundle.zip" -o "awscli-bundle.zip"

unzip awscli-bundle.zip

sudo ./awscli-bundle/install -i /usr/local/aws -b /usr/local/bin/aws
```

- [ ] Download docker [here](https://docs.docker.com/get-docker/). 

- [ ] Install [nvm](https://github.com/nvm-sh/nvm). And use nvm to install npm and node via nvm
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
```
```
nvm node
nvm npm
```


Step 2: Install dependencies 

- [ ] Install typescript globally
```
npm install -g typescript
```
- [ ] Install packages
Do the following inside each folder of `./server/*`
```
npm install 
```


### Deploy on your own AWS account 
**Deploy model components** 

Create a ECR repository. Save the URI which is outputed to the terminal. The URI will be used when deploying. This is only needed for the first time of deployment. 
```
aws ecr create-repository --repository-name REPO_NAME --image-scanning-configuration scanOnPush=true
```

Build and deploy
```
cd ./models
sam build
sam deploy --guided # only need guided for the first time 
```

**Deploy server components** 
```
cd ./server
sam build
sam deploy --guided # only need guided for the first time 
```
## CI/CD
----

### Pull requests
Pull request checks are made to ensure the code quality and correctness. This inludes lintings and pre-build and validation via aws-sam.

### Continous deploy 
The actual hosting is on one of our member's aws account. Build and deploy have been automated to her account upon merging to the `develop` branch for `server components`. Changes on `model components` require manual deployment by running the above sam commads by the account owner.


# Lambdas 

## UploadHandler
---- 

### Job submission workflow

Root URL : https://2fr7fj3ota.execute-api.ap-southeast-2.amazonaws.com/Prod/

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

### Access files with UploadHandler 

🔵 Get one file via file reference

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


## JobHandler 
Event schema 
TODO


## ReportGen 

TODO

## JobData


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

## OwlEye
Image Endpoint: POST https://u8iacl4gj0.execute-api.ap-southeast-2.amazonaws.com/Prod/owleye

## Seenomaly
Video Endpoint: POST https://u8iacl4gj0.execute-api.ap-southeast-2.amazonaws.com/Prod/Seenomaly



# Database Schema 

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
# S3 bucket structure 

S3 bucket looks like this,
|-jobID
|-file1.mp4
|-file2.png
|-result
|-result_file2.jpg
|-report.html
