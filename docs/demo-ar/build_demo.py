"""Build a narrated video from verified pilot screenshots and public demo copy."""

import argparse
import asyncio
import json
import re
import subprocess
from pathlib import Path

import edge_tts
import imageio_ffmpeg
import arabic_reshaper
from bidi.algorithm import get_display
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path(__file__).parent
OUTPUT = ROOT / "assets" / "demo-ar"
FRAMES = SOURCE / "frames"
SCENES = json.loads((SOURCE / "scenes.json").read_text(encoding="utf-8"))
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


async def narrate() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for scene in SCENES:
        target = OUTPUT / (scene["id"] + ".mp3")
        if target.exists() and target.stat().st_size > 1000:
            continue
        voice = edge_tts.Communicate(scene["text"], "ar-SA-ZariyahNeural", rate="-5%")
        await voice.save(str(target))
        print(f"Narration complete: {scene['id']}", flush=True)


def run(arguments: list[str]) -> None:
    subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-y", *arguments], check=True)


def duration(path: Path) -> float:
    result = subprocess.run([FFMPEG, "-i", str(path)], capture_output=True, text=True)
    match = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", result.stderr)
    if not match:
        raise ValueError(f"No media duration: {path}")
    return int(match[1]) * 3600 + int(match[2]) * 60 + float(match[3])


def arabic(text: str) -> str:
    return get_display(arabic_reshaper.reshape(text))


def plate(scene: dict, screenshot: Path, index: int) -> Path:
    canvas = Image.new("RGB", (1920, 1080), "#f4f6f8")
    draw = ImageDraw.Draw(canvas)
    heading = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 40)
    small = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 24)
    if scene["id"] == "09-close":
        canvas = Image.new("RGB", (1920, 1080), "#11181b")
        logo = Image.open(ROOT / "assets" / "EMPID_Arabic_Transparent.png").convert("RGBA")
        logo.thumbnail((720, 720), Image.Resampling.LANCZOS)
        canvas.paste(logo, ((1920 - logo.width) // 2, 70), logo)
        draw = ImageDraw.Draw(canvas)
        draw.text((960, 840), arabic("اكتشف تجربة EMPID لفريقك"), font=heading, fill="white", anchor="ma")
        draw.text((960, 920), arabic("احجز عرضاً توضيحياً"), font=heading, fill="#49c8ea", anchor="ma")
        draw.text((960, 995), "empid.com", font=small, fill="white", anchor="ma")
        target = FRAMES / f"plate-{scene['id']}-{index}.png"
        canvas.save(target)
        return target
    draw.text((1775, 30), arabic(scene["title"]), font=heading, fill="#153d43", anchor="ra")
    draw.text((135, 30), "EMPID", font=heading, fill="#153d43")
    image = Image.open(screenshot).convert("RGB")
    image.thumbnail((1654, 930), Image.Resampling.LANCZOS)
    canvas.paste(image, ((1920 - image.width) // 2, 90))
    draw.text((1775, 1043), arabic("بيانات تجريبية | شركة الريادة للمقاولات والخدمات"), font=small, fill="#536268", anchor="ra")
    draw.text((135, 1043), "empid.com", font=small, fill="#536268")
    target = FRAMES / f"plate-{scene['id']}-{index}.png"
    canvas.save(target)
    return target


def timestamp(seconds: float) -> str:
    milliseconds = round(seconds * 1000)
    hours, remainder = divmod(milliseconds, 3600000)
    minutes, remainder = divmod(remainder, 60000)
    seconds, milliseconds = divmod(remainder, 1000)
    return f"{hours:02}:{minutes:02}:{seconds:02}.{milliseconds:03}"


def render() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    segments = []
    cues = ["WEBVTT", ""]
    timeline = []
    elapsed = 0.0
    for scene in SCENES:
        screenshot = FRAMES / (scene["id"] + ".png")
        audio = OUTPUT / (scene["id"] + ".mp3")
        if not screenshot.exists() or not audio.exists():
            raise FileNotFoundError(f"Verified screenshot and narration required: {scene['id']}")
        seconds = duration(audio)
        shots = [screenshot, *sorted(FRAMES.glob(scene["id"] + "-*.png"))]
        part_length = seconds / len(shots)
        for index, shot in enumerate(shots):
            segment = OUTPUT / f"{scene['id']}-{index}.mp4"
            composed = plate(scene, shot, index)
            run(["-loop", "1", "-i", str(composed), "-ss", str(index * part_length), "-i", str(audio), "-vf",
             "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=white,setsar=1",
             "-r", "25", "-c:v", "libx264", "-preset", "fast", "-crf", "20",
             "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-t", str(part_length), str(segment)])
            segments.append(segment)
        sentences = [text.strip() + "." for text in scene["text"].split(".") if text.strip()]
        total = sum(len(text) for text in sentences)
        position = elapsed
        for sentence in sentences:
            end = position + seconds * len(sentence) / total
            cues.extend([f"{timestamp(position)} --> {timestamp(end)}", sentence, ""])
            position = end
        timeline.append({"id": scene["id"], "title": scene["title"], "start": elapsed, "duration": seconds})
        elapsed += seconds
        print(f"Rendered: {scene['id']}", flush=True)
    manifest = SOURCE / "segments.txt"
    manifest.write_text("\n".join("file '" + x.as_posix() + "'" for x in segments), encoding="utf-8")
    run(["-f", "concat", "-safe", "0", "-i", str(manifest), "-c", "copy",
         "-movflags", "+faststart", str(OUTPUT / "empid-ar-demo.mp4")])
    (OUTPUT / "empid-ar-demo.vtt").write_text("\n".join(cues), encoding="utf-8")
    (SOURCE / "timeline.json").write_text(json.dumps(timeline, ensure_ascii=False, indent=2), encoding="utf-8")
    Image.open(FRAMES / "plate-01-dashboard-0.png").save(OUTPUT / "empid-ar-demo-poster.jpg", quality=92)
    audio_manifest = SOURCE / "audio-segments.txt"
    audio_manifest.write_text("\n".join("file '" + (OUTPUT / (scene["id"] + ".mp3")).as_posix() + "'" for scene in SCENES), encoding="utf-8")
    run(["-f", "concat", "-safe", "0", "-i", str(audio_manifest), "-c", "copy", str(OUTPUT / "empid-ar-voiceover.mp3")])
    (SOURCE / "script-ar.md").write_text("# نص العرض العربي\n\n" + "\n\n".join("## " + scene["title"] + "\n\n" + scene["text"] for scene in SCENES), encoding="utf-8")
    print("Video complete", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=["narrate", "render"])
    args = parser.parse_args()
    if args.mode == "narrate":
        asyncio.run(narrate())
    else:
        render()
