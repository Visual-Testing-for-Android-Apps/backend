import app
import json
import base64
import boto3
import preprocess
import use

TEST_VIDEO = "./data/test.mp4"

class testPacket:
    def __init__(self, data):
        self.data = data
        self.status_code = 200

    def json(self):
        return self.data

def test_api():
    with open(TEST_VIDEO, "rb") as open_file:
        byte_content = open_file.read()
    base64_bytes = base64.b64encode(byte_content)
    base64_string = base64_bytes.decode("utf-8")
    raw_data = base64_string

    # event = testPacket({
    #     "res_video" :  raw_data
    # })


    #print(len(event.json()["res_video"]))

    res = app.handler({"body":raw_data}, None)

    print(res)
    j = json.loads(res["body"])
    print("Prediciton: {}".format(j["classification"]))
    print("Result: {}".format(j["explanation"]))

def test_sqs():
    s3 = boto3.client('s3')
    bucket = "visual-testing-backend-v2-srcbucket-p3rsmcrs75qa"
    key = "test_instagram.mp4"
    response = s3.get_object(Bucket=bucket, Key=key)
    videoBytes = response["Body"].read()



if __name__ == "__main__":
    test_sqs()
    