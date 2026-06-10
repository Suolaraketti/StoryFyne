import sys, pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]; sys.path.insert(0,str(ROOT/"storyfyne-engine"))
from storyfyne_engine.cli import main
want="landscape"
for a in sys.argv[1:]:
    if a in ("portrait","9:16","vertical","--portrait"): want="portrait"
args=["build",str(pathlib.Path(__file__).resolve().parent)]
if want=="landscape": args.append("--landscape")
sys.exit(main(args))
