#!/usr/bin/env python3
"""Build data.js from the raw starred repos JSON (output of `gh api --paginate --slurp`)."""
import json
import sys
import datetime

src = sys.argv[1] if len(sys.argv) > 1 else "starred_raw.json"

with open(src, encoding="utf-8") as f:
    pages = json.load(f)

# --slurp may wrap pages as [[...],[...]] or already flattened
if pages and isinstance(pages[0], list):
    items = [r for page in pages for r in page]
else:
    items = pages

repos = []
for r in items:
    lic = r.get("license") or {}
    repos.append({
        "full_name": r["full_name"],
        "name": r["name"],
        "owner": r["owner"]["login"],
        "url": r["html_url"],
        "homepage": r.get("homepage") or "",
        "description": r.get("description") or "",
        "language": r.get("language") or "",
        "stars": r.get("stargazers_count", 0),
        "forks": r.get("forks_count", 0),
        "pushed_at": r.get("pushed_at") or "",
        "created_at": r.get("created_at") or "",
        "archived": bool(r.get("archived")),
        "topics": r.get("topics") or [],
        "license": lic.get("spdx_id") or "",
    })

repos.sort(key=lambda x: (-x["stars"], x["full_name"]))

last_updated = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

# 若收藏内容与现有 data.js 完全一致，则复用旧的 lastUpdated，
# 避免纯时间戳差异导致的无意义提交（并发运行时还会造成 push 冲突）
try:
    with open("data.js", encoding="utf-8") as f:
        txt = f.read().strip()
    prefix = "window.REPOS_DATA = "
    if txt.startswith(prefix) and txt.endswith(";"):
        old = json.loads(txt[len(prefix):-1])
        if old.get("repos") == repos:
            last_updated = old.get("lastUpdated") or last_updated
except FileNotFoundError:
    pass

payload = {
    "lastUpdated": last_updated,
    "repoCount": len(repos),
    "repos": repos,
}

with open("data.js", "w", encoding="utf-8") as f:
    f.write("window.REPOS_DATA = ")
    json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
    f.write(";")

print(f"repos: {len(repos)}")
