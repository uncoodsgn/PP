#!/usr/bin/env python3
"""One-off: re-encode img/*.mp4 (H.264 CRF + faststart), write *-poster.webp. Requires pillow + imageio-ffmpeg."""
from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
from pathlib import Path

import imageio_ffmpeg
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IMG = ROOT / "img"
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def has_audio(path: Path) -> bool:
    r = subprocess.run(
        [FFMPEG, "-hide_banner", "-i", str(path)],
        capture_output=True,
        text=True,
        timeout=120,
    )
    return "Audio:" in r.stderr


def compress_mp4(src: Path, dst_tmp: Path) -> None:
    aud = has_audio(src)
    cmd = [
        FFMPEG,
        "-y",
        "-i",
        str(src),
        "-c:v",
        "libx264",
        "-crf",
        "26",
        "-preset",
        "medium",
        "-movflags",
        "+faststart",
        "-pix_fmt",
        "yuv420p",
    ]
    if aud:
        cmd.extend(["-c:a", "aac", "-b:a", "96k"])
    else:
        cmd.append("-an")
    cmd.append(str(dst_tmp))
    subprocess.run(cmd, check=True, capture_output=True, timeout=3600)


def frame_to_poster_webp(src_video: Path, dest_webp: Path) -> None:
    png = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
    png.close()
    try:
        subprocess.run(
            [
                FFMPEG,
                "-y",
                "-ss",
                "0.15",
                "-i",
                str(src_video),
                "-vframes",
                "1",
                png.name,
            ],
            check=True,
            capture_output=True,
            timeout=300,
        )
        im = Image.open(png.name).convert("RGB")
        im.save(dest_webp, "WEBP", quality=82, method=6)
    finally:
        os.unlink(png.name)


def main() -> None:
    for mp4 in sorted(IMG.glob("*.mp4")):
        tmp = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
        tmp.close()
        try:
            print("compress", mp4.name, flush=True)
            compress_mp4(mp4, Path(tmp.name))
            new_sz = os.path.getsize(tmp.name)
            old_sz = mp4.stat().st_size
            if new_sz < old_sz:
                shutil.move(tmp.name, mp4)
                print(f"  -> {old_sz} -> {new_sz} bytes", flush=True)
            else:
                os.unlink(tmp.name)
                print(f"  keep original (new {new_sz} >= {old_sz})", flush=True)
        except subprocess.CalledProcessError as e:
            if os.path.exists(tmp.name):
                os.unlink(tmp.name)
            print("  FAILED", mp4.name, e.stderr.decode() if e.stderr else e, flush=True)
            raise

        poster = IMG / f"{mp4.stem}-poster.webp"
        print("poster", poster.name, flush=True)
        frame_to_poster_webp(mp4, poster)


if __name__ == "__main__":
    main()
