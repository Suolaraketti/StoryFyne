#!/usr/bin/env python3
"""Runner for the StoryFyne video engine. Examples:
    python make_video.py build storyfyne-hyperframes-cc            # 9:16
    python make_video.py build storyfyne-hyperframes-cc --landscape
    python make_video.py audio --vo vo.mp3 --music m.mp3 -o assets/soundtrack.mp3
    python make_video.py beats
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent / "storyfyne-engine"))
from storyfyne_engine.cli import main
sys.exit(main())
