# Owl Eye API 
## Author 
Rebecca Chen

Let me know if you have any question or find any bug

## End Point 
POST https://8uxam9kkod.execute-api.ap-southeast-2.amazonaws.com/Prod/owleye/

## Access example 

### Approach 1 : Postman 
1. Select the `binary` option. 
2. upload the image file 

![image info](./owl-eye-docker-lambda-v3/postman_example.jpg)

### Approach 2: Python 
1. Encoding the image 
```python 
with open(IMAGE_NAME, 'rb') as open_file:
    byte_content = open_file.read()
base64_bytes = base64.b64encode(byte_content)
base64_string = base64_bytes.decode('utf-8')
raw_data = base64_string
```
2. send the image to the API 
```python 
url= 'https://8uxam9kkod.execute-api.ap-southeast-2.amazonaws.com/Prod/owleye/'
res = requests.post(url, data=raw_data, timeout=5000)
```

3. process the result 
```python 
print(res.status_code)
print(res.json())
if res.status_code == 200:
    img = res.json()["res_img"]
    # decode img
    image = Image.open(BytesIO(base64.b64decode(img.encode('utf-8'))))

    image.save(OUTPUT_IMAGE_NAME)
```

## Future improvement 
Instead of return back the heatmap directly, we need to store it to the S3 bucket. 

## Others 
* I didn't push the model file to the repo since it's too large 
* don't try to run the code, I will fail. 


# Instruction on setting up API 
## High-level process 
1. working code which is envoked by called the function handler(event, context). The input is in the event argument in json format.  
2. put the working code + the model to the docker image 
3. upload the docker image to AWS ECR ( Think this is just a place to store the code and the model. ) 
4. AWS Lamdba + AWS API endpoint together serves the code in the cloud. 

## Important files 
**owl-eye-docker-lambda-v3/hello_world/app**

This folder contains all the files we need for the model to run. 
* app.py. -  When the lambda function is invoked by an API, it will call the function `handler(event, context)` in this script. 
In the API call,  `event` is what the front-end sent to us. The return of this function will be sent to the frontend as the API response. 

* requirements.txt - this will be read by the Dockerfile

* the model - not upload to repo because it is too big. 



**owl-eye-docker-lambda-v3/hello_world/Dockerfile**


This file provide instruction to build the docker image.  
Think the docker image as a separate computer that your code will run on. You need to put everything required for the model to run to a docker image. 

Hence we need to, 
1. copy the files over to the new computer 
2. install the required packages 

**owl-eye-docker-lambda-v3/template.yaml** 

By typing `sam build` in the command line. It reads this file. 
This file is essentially
1. build the docker image by following the Dockerfile 
2. create/update the lambda function 
3. create the API endpoint. 

## What to do with the code 
1. Read the input image/video through the `event` argument in the `handler` function. Instead of open local image/video files. 
2. create python venv, install packages to the venv. After all dependencies are installed and the code is working in the venv. 
Use `pip freeze  > requirements.txt` to create the requirements.txt file. 
This makes sure we only install packages that is relevent to the script.  

create the python venv folder
```bash
python3 -m venv <NEW_FODLER_NAME>
```
Activate the venv 
```bash
source <NEW_FODLER_NAME>/bin/activate
```
Install packages. (for example requests)
```bash
pip install requests 
```
create the requirements.txt
```bash
pip freeze > requirements.txt
```
Exit the venv
```bash
deactivate 
```

## Anticipated Challenges 

The biggest challenge I was facing when deploying the code is to when I tried to get rid to the local read/write of the image files. Also, encode and decode the image so that they can be sent as json. 

Fortunately, for encoding/decoding image the python code in the above section do the job. 

## local testing 

I highly recommend to test the modified code locally. 
To do that, create `local_test.py` file and simulate how will function will be called. 
```python
import app

if __name__ == "__main__":
    # 1. TODO read a local video/image file

    # 2. TODO encode the video/image and pass it

    # 3. put encoding information to a event json object. 
    event = {'body' :  MY_FILE_STRING}
    # 4. call the handler function 
    print(app.handler(event, None))

```

