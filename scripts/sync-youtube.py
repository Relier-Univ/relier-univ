#!/usr/bin/env python3
"""
Synchronise la chaîne YouTube RELIER avec le site statique.

- récupère la liste des vidéos de la chaîne ;
- écrit assets/data/videos.json ;
- télécharge une vignette locale par vidéo ;
- ne nécessite pas de clé API YouTube.

La page publique ne contacte donc pas YouTube pour afficher les vignettes.
"""

from __future__ import annotations

import datetime as dt
import json
import subprocess
import sys
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

CHANNEL_ID = "UChQSi1vaDXyvDCcWOqp9nrg"
CHANNEL_URL = f"https://www.youtube.com/channel/{CHANNEL_ID}/videos"
CHANNEL_PUBLIC_URL = "https://www.youtube.com/@reseaurelier1033"

DATA_DIR = ROOT / "assets" / "data"
THUMB_DIR = ROOT / "assets" / "img" / "videos"

JSON_FILE = DATA_DIR / "videos.json"

PLACEHOLDER = "assets/img/video-placeholder.svg"


def run_ytdlp() -> list[dict]:
    """Méthode principale : récupère toute la page /videos via yt-dlp."""

    cmd = [
        "yt-dlp",
        "--flat-playlist",
        "--dump-single-json",
        "--no-warnings",
        "--ignore-errors",
        CHANNEL_URL,
    ]

    result = subprocess.run(
        cmd,
        check=True,
        capture_output=True,
        text=True,
    )

    payload = json.loads(result.stdout)

    videos = []

    for entry in payload.get("entries") or []:
        if not entry:
            continue

        video_id = entry.get("id") or entry.get("url")
        title = entry.get("title")

        if not video_id or not title:
            continue

        videos.append(
            {
                "id": str(video_id),
                "title": str(title).strip(),
            }
        )

    return videos


def run_rss_fallback() -> list[dict]:
    """
    Secours : flux RSS officiel YouTube.
    Attention : le flux RSS expose surtout les vidéos les plus récentes.
    """

    url = (
        "https://www.youtube.com/feeds/videos.xml"
        f"?channel_id={CHANNEL_ID}"
    )

    request = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 RELIER-video-sync"},
    )

    with urllib.request.urlopen(request, timeout=30) as response:
        xml_data = response.read()

    root = ET.fromstring(xml_data)

    ns = {
        "atom": "http://www.w3.org/2005/Atom",
        "yt": "http://www.youtube.com/xml/schemas/2015",
    }

    videos = []

    for entry in root.findall("atom:entry", ns):
        video_id = entry.findtext("yt:videoId", default="", namespaces=ns)
        title = entry.findtext("atom:title", default="", namespaces=ns)

        if video_id and title:
            videos.append(
                {
                    "id": video_id.strip(),
                    "title": title.strip(),
                }
            )

    return videos


def download_thumbnail(video_id: str) -> str:
    """
    Télécharge la vignette YouTube 16:9 au moment de la synchro GitHub.
    Le visiteur du site ne contacte pas YouTube pour l'image.
    """

    THUMB_DIR.mkdir(parents=True, exist_ok=True)

    target = THUMB_DIR / f"{video_id}.jpg"

    if target.exists() and target.stat().st_size > 1000:
        return f"assets/img/videos/{video_id}.jpg"

    candidates = [
        f"https://i.ytimg.com/vi/{video_id}/mqdefault.jpg",
        f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
    ]

    for url in candidates:
        try:
            request = urllib.request.Request(
                url,
                headers={"User-Agent": "Mozilla/5.0 RELIER-video-sync"},
            )

            with urllib.request.urlopen(request, timeout=30) as response:
                data = response.read()

            if len(data) > 1000:
                target.write_bytes(data)
                return f"assets/img/videos/{video_id}.jpg"

        except Exception as exc:
            print(
                f"[WARN] vignette {video_id} : {exc}",
                file=sys.stderr,
            )

    return PLACEHOLDER


def main() -> int:

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    THUMB_DIR.mkdir(parents=True, exist_ok=True)

    try:
        videos = run_ytdlp()
        source = "yt-dlp"
    except Exception as exc:
        print(
            f"[WARN] yt-dlp indisponible : {exc}",
            file=sys.stderr,
        )

        try:
            videos = run_rss_fallback()
            source = "youtube-rss"
        except Exception as rss_exc:
            print(
                f"[ERREUR] Impossible de synchroniser YouTube : {rss_exc}",
                file=sys.stderr,
            )
            return 1

    # Déduplication, ordre YouTube conservé (plus récentes en premier).
    unique = []
    seen = set()

    for video in videos:
        if video["id"] in seen:
            continue

        seen.add(video["id"])

        unique.append(
            {
                "id": video["id"],
                "title": video["title"],
                "thumbnail": download_thumbnail(video["id"]),
            }
        )

    if not unique:
        print(
            "[ERREUR] La synchronisation n'a retourné aucune vidéo.",
            file=sys.stderr,
        )
        return 1

    payload = {
        "channel_id": CHANNEL_ID,
        "channel_url": CHANNEL_PUBLIC_URL,
        "updated_at": dt.datetime.now(dt.timezone.utc)
        .replace(microsecond=0)
        .isoformat(),
        "source": source,
        "count": len(unique),
        "videos": unique,
    }

    JSON_FILE.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    # Supprime les anciennes vignettes correspondant à des vidéos retirées.
    current_ids = {video["id"] for video in unique}

    for image in THUMB_DIR.glob("*.jpg"):
        if image.stem not in current_ids:
            image.unlink()

    print(
        f"{len(unique)} vidéo(s) synchronisée(s) via {source}."
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
