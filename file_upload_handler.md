## File_upload_handler

This is a server which can receive image/videos through POST requests from the clients. 
## EndPoints
***/fileReceiver***
- receive one single file 

***/multiFileReceiver***
- receive at most 10 files

## How to POST 
Make sure all files have the filename 'userFile' and the enctype should be 'multipart/form-data'. 

HTML example 
```html
<form action="/profile" method="post" enctype="multipart/form-data">
  <input type="file" name="userFile" />
</form>
```


## Accpet file types 
video/mp4, image/png, image/jpeg ,image/gif

## Size Limits 
At Most 5MB for each file
