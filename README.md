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
- [Visioning strategy](#visioning-strategy)
- [Lambdas](#lambdas)
  - [## UploadHandler](#-uploadhandler)
    - [Job submission workflow](#job-submission-workflow)
    - [Email verification feature 📧](#email-verification-feature-)
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

- [ ] Install [aws-cli](https://aws.amazon.com/cli/) and [aws-sam-cli](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-command-reference.html). 
The offical doc to install [aws-cli](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html) and [aws-sam-cli](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html). 

For mac user
```

/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" # install homebrew if you don't have it already

brew tap aws/tap

brew install awscli aws-sam-cli 
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
sam deploy --parameter-overrides emailPassword=EMAIL_PASSWORD --guided# only need guided for the first time 
```
EMAIL_PASSWORD is the password of the email account which used to send email. 
## CI/CD
----

### Pull requests
Pull request checks are made to ensure the code quality and correctness. This inludes lintings and pre-build and validation via aws-sam.

### Continous deploy 
The actual hosting is on one of our member's aws account. Build and deploy have been automated to her account upon merging to the `develop` branch for `server components`. Changes on `model components` require manual deployment by running the above sam commads by the account owner
.
# Visioning strategy 

<span style="color:red">TODO</span>.

# Lambdas 

## UploadHandler
---- 
Root URL : https://2fr7fj3ota.execute-api.ap-southeast-2.amazonaws.com/Prod/


### Job submission workflow
Front submit `job` via Uploadhandler. There are `three steps` for job submission. 

🔵 1. Send a POST request to get preSigned URLs for upload image/vidoe
example request body
`POST /job/upload-request`
```
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



🔵 2. (for each file) Send a PUT request on the preSigned URL with file
`PUT $preSigned-url-returned-from-step1`


🔵 3. (after all file has been uploaded) send a Post request to notify finish
`POST /job/upload-done`
```
// Sample request body
{
    "jobID":"jobid"
}
// Sample response
statusCode = 200 -> start to process the job
statusCode != 200 -> error
```
### Email verification feature 📧

The Email verification feature is implemented but not yet integrated with the front end. 
Verification code expires in 500 seconds.


The module `sesService.ts` contains functionality which 
* send verification code 
* verify code 


Three API endpoints are built around email verification feature

Verify code:   `POST /job/verify-code`
```
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

Update their email: `POST /job/update-email`

```
// Sample request body
{
    "email": "new_email_address",
    "jobID":"jobId returned from the first api call"
}
```

Resend verification code: `POST /job/update-email`

```
// Sample request body
{
    "jobID":"jobid"
}
```

### Access files with UploadHandler 

Get one file via file reference `Post /job/file`

```

// sample request
{"filePath": "jobID/1231.jpg" }

// sample response
{"url" : "downloadUrl"}
```

```
GET downloadUrl
```

OR get all job file at once
`Post /job/files`
```

// sample request
{"jobID": "4141" }

// sample response
{
    "4141/342.jpg":"download_url1",
    "4141/result/342.jpg":"download_url1",
    "4141/342.mp4":"download_url3",
}
```

```
GET downloadUrl
```





## JobHandler 

Sample event: 
```
{'jobKey':'the job id in the database'}

```

The jobHandler lambda receives a `jobKey` from the event. It is reponsible for processing all unprocessed images or videos in the `job` via calling the owleye and seenomaly lambdas. It has a timeout of 800 seconds. It triggers itself before the time out when the `job` is not yet finished. This is illustrated in the figure below. 

<img src="./2.png" alt="drawing" width="200"/>

## ReportGen 

<span style="color:red">TODO</span>.

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
Image Endpoint: `POST` https://u8iacl4gj0.execute-api.ap-southeast-2.amazonaws.com/Prod/owleye

Request body contains 
* the `raw binary` of the image, or
* a `download_url` inside a json object 
```
// Sample json request body 
{"download_url":"url to download the image"}
```

```
// Sample return body
    {

        "original_img":original_img , // this is the original image
        'res_img': res_image, // The base 64 encoded result image 
        'bug_type': 'Null value'|'Missing image'|'Component occlusion' 
    }
```

## Seenomaly
Video Endpoint: `POST` https://u8iacl4gj0.execute-api.ap-southeast-2.amazonaws.com/Prod/Seenomaly

Request body contains 
* the `raw binary` of the video, or
* a `download_url` inside a json object 
```
// Sample json request body 
{"download_url":"url to download the video"}
```

```
// Sample return body
    {
        "classification": error code,
        "explanation": error description
    }
```
Explanation contains one of 
```
[
        "Unknown",
        "Pass through other material",
        "Lack of scrimmed background",
        "Snackbar blocks bottom app bar",
        "Stack multiple banners",
        "Flip card to reveal information",
        "Move one card behind other card",
        "Stack multiple snackbars",
        "Lack of shadow",
        "Invisible scrime of modal bottom sheet",
]
```


# Database Schema 


```
{
 "id": String,
 "emailVerified": Boolean,
 "emailVerification": {
  "createdAt": String eg."2021-09-20T08:27:18.972Z",
  "code": String eg."910695"
 },
 "files": [
  {
   "contentType": String "video/mp4"|"image/jpeg"|"image/png",
   "orginalName": String eg. "test_1.mp4",
   "s3Key": String 
   "status": String "NEW"|"DONE",
   "type": String "VIDEO"|"VIDEO"
    "result": {
    "message": String|String[] eg."Snackbar blocks bottom app bar",
    "code": String? eg."3"
    "outputKey": String?
   },
  },
 ],
 "createdAt": String eg."2021-09-20T08:25:40.984Z",
 "email": String eg."Example@gmail.com"
 "jobStatus": String? "PROCESSING"|"GENERATING"|"DONE",
}

```

- waiting for the file to be processed. -> In db, jobStatus = PROCESSING, file.statu
- all file completed. -> In db, jobStatus = GENERATING , file.status = DONE

# S3 bucket structure 

For a single jobs,

|-jobID <br>
&nbsp;&nbsp;&nbsp;&nbsp; |-file1.mp4 <br>
&nbsp;&nbsp;&nbsp;&nbsp; |-file2.png <br>
&nbsp;&nbsp;&nbsp;&nbsp; |-result <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|-result_file2.jpg <br>
&nbsp;&nbsp;&nbsp;&nbsp;|-report.html <br>
