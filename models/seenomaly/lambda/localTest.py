# ####################################################
# File for testing locally, will not be uploaded to AWS
# ####################################################
import requests
import io
import base64
from io import BytesIO
from PIL import Image, ImageFile
# TEST_VIDEO = "outfile.mp4"

# class testPacket:
#     def __init__(self, data):
#         self.data = data
#         self.status_code = 200

#     def json(self):
#         return self.data

# def test_api():
#     with open(TEST_VIDEO, "rb") as open_file:
#         byte_content = open_file.read()
#     base64_bytes = base64.b64encode(byte_content)
#     base64_string = base64_bytes.decode("utf-8")
#     raw_data = base64_string

#     # event = testPacket({
#     #     "res_video" :  raw_data
#     # })


#     #print(len(event.json()["res_video"]))

#     res = app.handler({"body":raw_data}, None)

#     print(res)
#     j = json.loads(res["body"])
#     print("Prediciton: {}".format(j["classification"]))
#     print("Result: {}".format(j["explanation"]))

# def test_sqs():
#     s3 = boto3.client('s3')
#     bucket = "visual-testing-backend-v2-srcbucket-p3rsmcrs75qa"
#     key = "test_instagram.mp4"
#     response = s3.get_object(Bucket=bucket, Key=key)
#     videoBytes = response["Body"].read()


def getVideo():
    url = "https://visual-testing-backend-v2-srcbucket-p3rsmcrs75qa.s3.ap-southeast-2.amazonaws.com/30ecd6ed-78ab-40d6-b3cd-79c2e3c4922e/1304057.jpg?AWSAccessKeyId=ASIAYDHTZUBQSVSKOSGD&Expires=1631894156&Signature=kKxxw9PnS6GW9Lnw7y4gklnz65c%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEDcaDmFwLXNvdXRoZWFzdC0yIkgwRgIhAOR7FLPjHbl4y4SCGbrYp0RduIaXe111GVjFO7OlHc9XAiEAiMScf4FdOOxC%2FQccd9ZMCL339epe7xRjZIpN2o6XaHAqwgIIkP%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw1NTY3MDk1NTIyMjUiDE88Fmz%2BHONaqzf%2FfCqWAtmy6H71y7Rt5%2BDpxELbBUVjaSZ5scCtAlxpaw7qrum9PHdTWSRnfy%2BpKQ%2BbNHrOK1K4vd1NrEoTyPgIYQMWrb8pI%2Bxlwj1tam8opUS194YuZEoiwJadVkmMyxGS1jhQtpFiGEAaSLXB0J6XZxL3Kle%2FIdZp%2FQWUMsGchUF5m1%2FjPCj%2B4DdxUifdINePSAryg8y2xxVHNZlNaguR1ncpxl39%2Fr4msv9OGO98s%2BxCIXym1yeaEHea7TqCSl5s2gtMsqLkQ0xavdkNBztoyJT0UAf%2Bb3xmMIQY7YzhfwaegGCQsfDSku3T239HFyqcH0siy%2BpIGLnltnTJzrhzevB0d3Es%2F0vICBDWzFbNKukQUeYC9EgS34S6MIvXkooGOpkB%2B2zsQ7A37JeMQoXt1T1eDob1sw2mSZd6yGLiFal4WpwmK%2BJLzcaLDig2Inr86ZGZJ4KTVXSiIroJixiMkT33O7cS4RZiperlw7ey2qWt2Y0imzvbIh%2B4HiuA8oav%2BVLOLo1TgCnFKFmaZjX7hNHXyaDpOqwnudwo3koOFztt9LzJzTnmX%2Fq5fG1VNVPcev1UpPayINZ3pLIa"
    # content = requests.get(url).content
    # tmp = io.BytesIO(content)
    response = requests.get(url)
    #print("response",response.content)
    img = Image.OPEN(BytesIO(response.content))
    print(img)

if __name__ == "__main__":
    getVideo()
    