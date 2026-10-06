#!/usr/bin/env python3
"""Stamp the visible release and asset cache keys from one version file."""
import argparse
import json
import re
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
group = parser.add_mutually_exclusive_group()
group.add_argument("--bump", action="store_true")
group.add_argument("--version")
group.add_argument("--check", action="store_true")
args = parser.parse_args()
release_path = ROOT / "version.json"
release = json.loads(release_path.read_text())
if args.bump:
    major, minor, patch = map(int, release["version"].split("."))
    release["version"] = f"{major}.{minor}.{patch + 1}"
elif args.version:
    if not re.fullmatch(r"\d+\.\d+\.\d+", args.version):
        parser.error("Version must be X.Y.Z")
    release["version"] = args.version
if args.bump or args.version:
    release["updated_at"] = datetime.now(ZoneInfo("Europe/Stockholm")).replace(microsecond=0).isoformat()
version = release["version"]
date = datetime.fromisoformat(release["updated_at"]).astimezone(ZoneInfo("Europe/Stockholm"))
label = date.strftime("%Y-%m-%d %H:%M ") + ("CEST" if date.dst() else "CET")
html_path = ROOT / "index.html"
original = html_path.read_text()
stamped = re.sub(r'(data-release-version>)[^<]+', lambda m: m[1] + "v" + version, original)
stamped = re.sub(r'(data-release-time datetime=")[^"]*(">)[^<]*', lambda m: m[1] + release["updated_at"] + m[2] + label, stamped)
stamped = re.sub(r'((?:href|src)="[^"]+\.(?:css|js))\?v=[^"]+', lambda m: m[1] + "?v=" + version, stamped)
if args.check:
    if stamped != original:
        raise SystemExit("Release stamp or asset cache versions are out of date. Run scripts/release.py.")
    if original.count('data-release-version>') != 2 or original.count('data-release-time datetime=') != 1:
        raise SystemExit("Expected a header version, footer version and release time.")
    assets = re.findall(r'(?:href|src)="([^"]+\.(?:css|js))\?v=([^"]+)"', original)
    if len(assets) != 4 or any(v != version or not (ROOT / name).is_file() for name, v in assets):
        raise SystemExit("Expected four existing assets with matching cache versions.")
    print(f"Release v{version} verified.")
else:
    html_path.write_text(stamped)
    release_path.write_text(json.dumps(release, indent=2) + "\n")
    print(f"Release v{version} · {label}")

