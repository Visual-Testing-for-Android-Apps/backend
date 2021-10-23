# Upload Handler

This lambda function exposes the interface used by the frontend for submitting batch jobs.

This function exposes 2 end points for batch job creation and uploading:

- `upload-request` which creates a batch job and returns the presigned urls to the S3 bucket.
- `upload-done` which indicates that the frontend has finished uploading files.

Another 2 endpoints are for email verification:

- `verify-code` which verifies the code the user gave, which should come from an email sent after the batch job was created.
- `update-email` which allows the email assocaited with the batch job to be changed. Also can be used to have the verifiction email resent.

And finally 2 endpoints for file access:

- `file` allows a single file to be requested.
- `files` returns download links to all files.

The next Lambda function will then be trigger, Job Handler.
