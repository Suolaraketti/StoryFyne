#!/usr/bin/env python3
"""Engine shim — this video is script.json; the engine does the rest.
Usage: python build.py [portrait|landscape]   (default: landscape)"""
import sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "storyfyne-engine"))
from storyfyne_engine.cli import main
want = "landscape"
for a in sys.argv[1:]:
    if a in ("portrait", "9:16", "vertical", "--portrait"): want = "portrait"
    if a in ("landscape", "16:9", "wide", "--landscape"): want = "landscape"
args = ["build", str(pathlib.Path(__file__).resolve().parent)]
if want == "landscape": args.append("--landscape")
sys.exit(main(args))
