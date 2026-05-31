import os
import subprocess

ffmpeg_path = r"c:\Users\Admin\Desktop\JPN STUDIO\ANTARIK\Outskill X Openai buildathon\Voicecontract\ffmpeg-master-latest-win64-gpl\bin\ffmpeg.exe"

vid_ui = "Recording 2026-05-31 235248.mp4"
vid_id = "20260531-1804-48.1210446.mp4"
vid_mvp = "20260531-1808-57.8067025.mp4"

# We will use the full lengths of the videos to hit the ~5 minute mark.
# vid_ui: ~160s
# vid_id: ~131s
# vid_mvp: ~24s
# Total ~315s (5m15s)

filter_script = """
[0:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=yuv420p[v0];
[1:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=yuv420p[v1];
[2:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=yuv420p[v2];
[v0][v1][v2]concat=n=3:v=1:a=0[vcat];
[vcat]drawtext=text='The Problem Verbal Deals Lost in Translation':fontcolor=white:fontsize=60:x=(w-text_w)/2:y=(h-text_h)-100:enable='between(t,5,15)':box=1:boxcolor=black@0.7:boxborderw=20,drawtext=text='The Solution VoiceContract':fontcolor=white:fontsize=60:x=(w-text_w)/2:y=(h-text_h)-100:enable='between(t,30,40)':box=1:boxcolor=black@0.7:boxborderw=20,drawtext=text='Tech Stack Groq Llama 3.3 OpenAI Codex':fontcolor=white:fontsize=60:x=(w-text_w)/2:y=(h-text_h)-100:enable='between(t,60,75)':box=1:boxcolor=black@0.7:boxborderw=20,drawtext=text='The Command Center Complete Deal Oversight':fontcolor=white:fontsize=60:x=(w-text_w)/2:y=(h-text_h)-100:enable='between(t,100,115)':box=1:boxcolor=black@0.7:boxborderw=20,drawtext=text='Step 1 Extracting Brand DNA':fontcolor=white:fontsize=60:x=(w-text_w)/2:y=(h-text_h)-100:enable='between(t,170,185)':box=1:boxcolor=black@0.7:boxborderw=20,drawtext=text='Step 2 Tone and Style Calibration':fontcolor=white:fontsize=60:x=(w-text_w)/2:y=(h-text_h)-100:enable='between(t,210,225)':box=1:boxcolor=black@0.7:boxborderw=20,drawtext=text='Step 3 Audio Interception & Processing':fontcolor=white:fontsize=60:x=(w-text_w)/2:y=(h-text_h)-100:enable='between(t,250,265)':box=1:boxcolor=black@0.7:boxborderw=20,drawtext=text='The Result The Legal Trinity Generated':fontcolor=white:fontsize=60:x=(w-text_w)/2:y=(h-text_h)-100:enable='between(t,295,310)':box=1:boxcolor=black@0.7:boxborderw=20[out]
"""

with open('filter.txt', 'w') as f:
    f.write(filter_script)

cmd = [
    ffmpeg_path,
    "-y",
    "-i", vid_ui,
    "-i", vid_id,
    "-i", vid_mvp,
    "-filter_complex_script", "filter.txt",
    "-map", "[out]",
    "-c:v", "libx264",
    "-preset", "ultrafast",
    "-crf", "28",
    "VoiceContract_Full_5Min.mp4"
]

print("Starting FFmpeg...")
subprocess.run(cmd)
print("Done!")
