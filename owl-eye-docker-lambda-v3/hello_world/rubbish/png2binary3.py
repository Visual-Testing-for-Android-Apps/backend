from base64 import b64encode, b64decode
from json import dumps,loads
from PIL import Image
from io import BytesIO

ENCODING = 'utf-8'
IMAGE_NAME = 'bug.4003.jpg'
JSON_NAME = 'response.json'
OUTPUT_IMAGE_NAME = 'output.jpg'
def encoding( ):
    # first: reading the binary stuff
    # note the 'rb' flag
    # result: bytes
    with open(IMAGE_NAME, 'rb') as open_file:
        byte_content = open_file.read()

    # second: base64 encode read data
    # result: bytes (again)
    base64_bytes = b64encode(byte_content)

    # third: decode these bytes to text
    # result: string (in utf-8)
    base64_string = base64_bytes.decode(ENCODING)

    # optional: doing stuff with the data
    # result here: some dict
    raw_data = {IMAGE_NAME: base64_string}

    # now: encoding the data to json
    # result: string
    json_data = dumps(raw_data, indent=2)

    # finally: writing the json string to disk
    # note the 'w' flag, no 'b' needed as we deal with text here
    with open(JSON_NAME, 'w') as another_open_file:
        another_open_file.write(json_data)


def decoding():
    # read json
    with open(JSON_NAME, 'rb') as f:
        data = loads(f.read())
        print(data)
        image = Image.open(BytesIO(b64decode(data["res_img"].encode('utf-8'))))

        image.save(OUTPUT_IMAGE_NAME)

if __name__ == "__main__":
    #encoding()
    decoding()



