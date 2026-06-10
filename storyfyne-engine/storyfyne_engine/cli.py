"""CLI: build videos from beat scripts, premix audio, list the beat catalog.

  python make_video.py <project_dir> [--landscape]      # build (9:16 default)
  python make_video.py audio --vo vo.mp3 --music m.mp3 -o assets/soundtrack.mp3
  python make_video.py beats                            # show the beat catalog
"""
import argparse
import os
import subprocess
import sys

from . import beats as beats_mod
from .core import build_project, ScriptError


def cmd_build(args):
    portrait = not args.landscape
    try:
        outp, warnings, dur = build_project(args.project, portrait=portrait)
    except ScriptError as e:
        print("✗ %s" % e)
        return 1
    print("✓ wrote %s  (%s, %.1fs)" % (outp, "1080x1920" if portrait else "1920x1080", dur))
    for w in warnings:
        print("  ⚠ %s" % w)
    print("  next: npx hyperframes lint %s   then render:" % args.project)
    print("  npx hyperframes render %s -o out.mp4 -q high --fps 60 --gpu --browser-gpu" % args.project)
    return 0


def cmd_audio(args):
    """Premix VO over ducked, looped music — the house mix."""
    probe = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                            "-of", "default=nw=1:nk=1", args.vo], capture_output=True, text=True)
    vodur = float(probe.stdout.strip())
    fout = max(0.0, vodur - 2.5)
    flt = ("[1:a]volume=%s,afade=t=in:st=0:d=1.0,afade=t=out:st=%.2f:d=2.5[m];"
           "[0:a][m]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.97[a]"
           % (args.music_volume, fout))
    os.makedirs(os.path.dirname(os.path.abspath(args.out)) or ".", exist_ok=True)
    r = subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", args.vo, "-stream_loop", "-1",
                        "-i", args.music, "-filter_complex", flt, "-map", "[a]",
                        "-ar", "44100", "-ac", "2", "-b:a", "192k", args.out])
    if r.returncode == 0:
        print("✓ wrote %s (%.1fs; VO + music at %s, faded)" % (args.out, vodur, args.music_volume))
    return r.returncode


def cmd_beats(_args):
    print("Beat catalog (see storyfyne-engine/AUTHORING.md for JSON examples):\n")
    for kind in sorted(beats_mod.REGISTRY):
        spec = beats_mod.REGISTRY[kind]
        req = ", ".join(spec["required"]) or "—"
        print("  %-11s required: %s" % (kind, req))
    return 0


def main(argv=None):
    p = argparse.ArgumentParser(prog="storyfyne_engine")
    sub = p.add_subparsers(dest="cmd")

    pb = sub.add_parser("build", help="build index.html from a project's script.json")
    pb.add_argument("project")
    pb.add_argument("--landscape", action="store_true", help="16:9 (default is 9:16)")

    pa = sub.add_parser("audio", help="premix VO + ducked music into a soundtrack")
    pa.add_argument("--vo", required=True)
    pa.add_argument("--music", required=True)
    pa.add_argument("-o", "--out", required=True)
    pa.add_argument("--music-volume", default="0.15")

    sub.add_parser("beats", help="list available beat types")

    args = p.parse_args(argv)
    if args.cmd == "build":
        return cmd_build(args)
    if args.cmd == "audio":
        return cmd_audio(args)
    if args.cmd == "beats":
        return cmd_beats(args)
    p.print_help()
    return 1


if __name__ == "__main__":
    sys.exit(main())
