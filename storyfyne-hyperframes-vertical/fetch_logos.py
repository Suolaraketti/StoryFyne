#!/usr/bin/env python3
"""
Fetch real brand logos from logo.dev into assets/logos/ so build.py uses them
automatically (it falls back to the inlined SVGs when a file is absent).

Where to put the key (pick one):
  1. A `.env` file next to this script:   LOGODEV_TOKEN=pk_xxxxxxxx   (gitignored)
  2. An environment variable:             export LOGODEV_TOKEN=pk_xxxxxxxx
     (in Claude Code on the web, set it under the environment's Variables/Secrets)

Then run:  python fetch_logos.py
Needs network access to img.logo.dev (allowlist it if you're in a locked-down env).
"""
import os, sys, urllib.request, urllib.error

# brand key (matches build.py)  ->  domain logo.dev resolves
LOGOS = {
    "salesforce":   "salesforce.com",
    "gong":         "gong.io",
    "hubspot":      "hubspot.com",
    "hyperbound":   "hyperbound.ai",
    "mindtickle":   "mindtickle.com",
    "secondnature": "secondnature.ai",
    "dialfyne":     "dialfyne.com",   # overwrites the bundled PNG only if logo.dev has it
}

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)


def load_env():
    """LOGODEV_TOKEN from the environment, or a local .env file."""
    for name in ("LOGODEV_TOKEN", "LOGO_DEV_TOKEN", "LOGODEV_API_KEY"):
        if os.environ.get(name):
            return os.environ[name].strip()
    for envpath in (os.path.join(HERE, ".env"), os.path.join(ROOT, ".env")):
        if os.path.exists(envpath):
            for line in open(envpath, encoding="utf-8"):
                line = line.strip()
                if line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                if k.strip() in ("LOGODEV_TOKEN", "LOGO_DEV_TOKEN", "LOGODEV_API_KEY"):
                    return v.strip().strip('"').strip("'")
    return None


def targets():
    """Write to every sibling project's assets/logos that exists (landscape + vertical)."""
    dirs = []
    for d in ("storyfyne-hyperframes", "storyfyne-hyperframes-vertical"):
        p = os.path.join(ROOT, d, "assets", "logos")
        if os.path.isdir(os.path.dirname(os.path.dirname(p))):
            dirs.append(p)
    return dirs or [os.path.join(HERE, "assets", "logos")]


def main():
    token = load_env()
    if not token:
        print("No logo.dev key found.\n"
              "  Put it in a .env file:   LOGODEV_TOKEN=pk_xxxxxxxx\n"
              "  or:  export LOGODEV_TOKEN=pk_xxxxxxxx\n"
              "Keeping the inlined SVG fallbacks for now.")
        return 0

    dests = targets()
    for d in dests:
        os.makedirs(d, exist_ok=True)
    print("Fetching %d logos -> %s" % (len(LOGOS), ", ".join(dests)))

    ok = 0
    for key, domain in LOGOS.items():
        url = ("https://img.logo.dev/%s?token=%s&size=512&format=png&retina=true&fallback=404"
               % (domain, token))
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "storyfyne-fetch-logos"})
            with urllib.request.urlopen(req, timeout=20) as r:
                data = r.read()
            if len(data) < 200:           # tiny payload => not a real logo
                raise ValueError("empty/placeholder response")
            for d in dests:
                with open(os.path.join(d, "%s.png" % key), "wb") as f:
                    f.write(data)
            print("  ok  %-13s (%s, %d KB)" % (key, domain, len(data) // 1024))
            ok += 1
        except (urllib.error.HTTPError, urllib.error.URLError, ValueError, TimeoutError) as e:
            print("  --  %-13s (%s) skipped: %s" % (key, domain, e))

    print("Done: %d/%d fetched. Re-run build.py to pick them up." % (ok, len(LOGOS)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
