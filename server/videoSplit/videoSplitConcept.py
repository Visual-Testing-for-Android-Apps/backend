import cv2
from skimage.metrics import structural_similarity
from moviepy.video.io.ffmpeg_tools import ffmpeg_extract_subclip
import math

def video_split(filename):
    # Define constants
    start_frame = 2                         # Start frame to check video
    ssim_transition_threshold = 0.9         # Ceiling for when the frames change enough to record a video
    ssim_stable_threshold = 0.97            # Floor for when the frames stay constant enough to process an image
    split_video_min_duration = 16           # Minimum number of frames per video
    change_buffer = 1                       # Number of frames prior to the transition included in the video
    repeat_video_buffer = 5                 # Number of frames between each video
    still_video_duration = 0.5              # Number of seconds video has to remain stable to output an image
    target_file_destination = "./server/videoSplit/"  # target directory for output files

    # Open video
    cap = cv2.VideoCapture(filename)

    # Record metrics about the video
    frames_per_second = int(cap.get(cv2.CAP_PROP_FPS))
    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    number_of_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))


    # Output image metrics
    print(frames_per_second)
    print(frame_width)
    print(frame_height)
    print(number_of_frames)
    
    # Loop condition
    count = start_frame

    # Get the first frame
    _, previous_frame = cap.read()

    # Definitions for loop
    current_image_frames = []           # Array of individual frames to be passed into OwlEyes
    current_video_frames = []           # Array of tuples of start and end frames to be passed into Seenomaly
    current_video_split = False         # Condition on whether a video is currently being split
    current_image_split = False         # Condition on whether an image is currently being split
    last_included_frame = 0             # Previous included frame for either video or image
    first_transition_frame = 0          # First frame of created video
    last_transition_frame = 0           # Last frame of created video
    image_length_check_frame = 0        # First frame for checking if the video is stable for long enough to output an image

    # Loop to read in frames, compare their similarity, and divide into images and videos
    while (count != number_of_frames - split_video_min_duration + change_buffer):
        
        # Read in current frame
        _, current_frame = cap.read()

        # Measure similarity between current frame and previous frame
        # multichannel = True indicates that the frames have colour
        ssim = structural_similarity(current_frame, previous_frame, multichannel=True)

        # Check if the similarity is under the threshold to be considered a transition
        if (ssim < ssim_transition_threshold):

            if current_video_split == False:
                
                # Add previous video to current_video_frames
                # Check length of transition video
                if last_transition_frame - first_transition_frame > split_video_min_duration:
                    # Add first and last frame tuple to array
                    current_video_frames.append((first_transition_frame, last_transition_frame))
                else:
                    # Add video from first frame until the minimum video duration
                    current_video_frames.append((first_transition_frame - change_buffer, first_transition_frame + split_video_min_duration - change_buffer))

                # Check to help remove double up videos
                if count > last_included_frame:
                    current_video_split = True
                    first_transition_frame = count              

            # Set the current final frame of the video to the current frame    
            else:
                last_transition_frame = count
            
            # Set the final included frame for the function to the current frame
            last_included_frame = count
        else:
            current_video_split = False

        
        # Check if ssim is over the threshold to be considered an image
        if (ssim > ssim_stable_threshold):
            if current_image_split == False:
                # Attempts to extract the previous included frame in a video to ensure multiple of the same images do not get extracted
                try:
                    if last_included_frame > current_image_frames[-1][1]:
                        current_image_split = True
                        image_length_check_frame = count
                except:
                    current_image_split = True
                    image_length_check_frame = count
            else:

                # Check if the video has been still for enough time
                if count - image_length_check_frame > still_video_duration * frames_per_second:
                    current_image_frames.append((current_frame, count))
                    current_image_split = False
        else:
            current_image_split = False

        # Extract previous frame for comparison
        previous_frame = current_frame
        
        # Iterate loop
        count += 1

    # Include final video
    if last_transition_frame - first_transition_frame > split_video_min_duration:
        current_video_frames.append((first_transition_frame, last_transition_frame))
    else:
        current_video_frames.append((first_transition_frame - change_buffer, first_transition_frame + split_video_min_duration - change_buffer))

    print(current_video_frames)

    # Extract individual image frames from video
    for frames in current_image_frames:
        cv2.imwrite(target_file_destination + str(round(frames[1]/frames_per_second)) + ".jpg", frames[0])

    # Remove first video as it is included by default from the function and is unwanted
    current_video_frames.pop(0)

    # Extract smaller videos from uploaded video
    for frames in current_video_frames:
        ffmpeg_extract_subclip(filename, frames[0]/frames_per_second, frames[1]/frames_per_second, targetname = target_file_destination + str(round(frames[0]/frames_per_second)) + "-" + str(round(frames[1]/frames_per_second)) + ".mp4")



video_split('./server/videoSplit/test2.mp4')