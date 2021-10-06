import cv2
from skimage.metrics import structural_similarity
from moviepy.video.io.ffmpeg_tools import ffmpeg_extract_subclip
import math

filename = './server/videoSplit/testVideo.mp4'
cap = cv2.VideoCapture(filename)

frames_per_second = int(cap.get(cv2.CAP_PROP_FPS))
frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
number_of_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))


print(frames_per_second)
print(frame_width)
print(frame_height)
print(number_of_frames)
count = 2

ret, previous_frame = cap.read()

current_image_splits = []
current_split = False
last_included_frame = 0
first_transition_frame = 0
last_transition_frame = 0

while (count != number_of_frames - 7):
    ret, current_frame = cap.read()
    ssim = structural_similarity(current_frame, previous_frame, multichannel=True)

    if (ssim < 0.7 and current_split == False):
        if count - last_included_frame > 5:
            if last_transition_frame - first_transition_frame > 8:
                current_image_splits.append((first_transition_frame, last_transition_frame))
            else:
                current_image_splits.append((first_transition_frame - 1, first_transition_frame + 7))
            first_transition_frame = count
            current_split = True
        else:
            last_transition_frame = count
        last_included_frame = count
    else:
        current_split = False

    previous_frame = current_frame
    count += 1

if last_transition_frame - first_transition_frame > 8:
    current_image_splits.append((first_transition_frame, last_transition_frame))
else:
    current_image_splits.append((first_transition_frame - 1, first_transition_frame + 7))

current_image_splits.pop(0)

for frames in current_image_splits:
    ffmpeg_extract_subclip(filename, frames[0]/frames_per_second, frames[1]/frames_per_second, targetname = "./server/videoSplit/" + str(math.floor(frames[0]/frames_per_second)) + "-" + str(math.ceil(frames[1]/frames_per_second)) + ".mp4")
