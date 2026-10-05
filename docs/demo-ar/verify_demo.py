"""Check the local demo deliverable and build a visual review sheet."""

import json
import subprocess
from pathlib import Path

import imageio_ffmpeg
from PIL import Image, ImageDraw

SOURCE = Path(__file__).parent
OUTPUT = SOURCE.parents[1] / "assets" / "demo-ar"
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

frames = sorted(path for path in (SOURCE / "frames").glob("*.png") if path.name[:2].isdigit())
sheet = Image.new("RGB", (1200, ((len(frames) + 2) // 3) * 250), "white")
draw = ImageDraw.Draw(sheet)
for index, path in enumerate(frames):
    image = Image.open(path).convert("RGB")
    image.thumbnail((390, 220))
    x, y = (index % 3) * 400, (index // 3) * 250
    sheet.paste(image, (x, y))
    draw.text((x + 5, y + 225), path.stem, fill="black")
sheet.save(SOURCE / "capture-review.jpg")

video = OUTPUT / "empid-ar-demo.mp4"
if video.exists():
    result = subprocess.run([FFMPEG, "-hide_banner", "-i", str(video), "-f", "null", "-"], capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(result.stderr)
    (SOURCE / "decode-check.txt").write_text(result.stderr, encoding="utf-8")
    timeline = json.loads((SOURCE / "timeline.json").read_text(encoding="utf-8"))
    assert len(timeline) == 9
    assert (OUTPUT / "empid-ar-demo.vtt").read_text(encoding="utf-8").startswith("WEBVTT")
    print(f"Full decode passed. File size: {video.stat().st_size} bytes.")
    print(f"Narration duration: {sum(scene['duration'] for scene in timeline):.2f} seconds.")
    print("H.264 video and AAC audio: inspect decode-check.txt for stream metadata.")
