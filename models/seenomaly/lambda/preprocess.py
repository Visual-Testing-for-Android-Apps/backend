import av
import io
import base64
import numpy as np

def fromJson(videoBytes):
    #print(res.status_code)
    #print(len(res.json()))
    #vid = res["body"]

    tmp = io.BytesIO(videoBytes)
    video = av.open(tmp, "r")

    print("video",video)
    print("video duration",video.duration)
    step = video.duration//8
    cur = step//2

    frames = []

    for i in range(8):
        pos = video.seek(cur)#, any_frame=True)
        for frame in video.decode(video=0):
            img = frame.to_image()
            img = img.resize((224, 224), 2)
            #img.save('frame-%04d.jpg' % i)
            img = np.array(img)
            print(img.shape)
            frames.append(img)
            break
        cur += step

    return frames