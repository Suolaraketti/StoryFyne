import re
import httpx
from typing import Dict, List, Optional
from config import REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT


def extract_post_id(url: str) -> Optional[str]:
    """Extract Reddit post ID from various URL formats."""
    patterns = [
        r"/comments/(\w+)/",
        r"/r/\w+/comments/(\w+)/",
        r"redd\.it/(\w+)",
        r"reddit\.com/(\w+)$",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def _clean_reddit_url(url: str) -> str:
    """Normalize a Reddit URL to its canonical form."""
    # Remove query params and fragments
    url = url.split("?")[0].split("#")[0]
    # Ensure trailing slash for .json append
    if not url.endswith("/"):
        url += "/"
    return url


def _has_praw_credentials() -> bool:
    """Check if Reddit API credentials are configured."""
    return bool(REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET)


def _praw_available() -> bool:
    """Check if praw library is installed."""
    try:
        import praw
        return True
    except ImportError:
        return False


def _scrape_with_praw(url: str) -> Dict:
    """Scrape via PRAW (requires Reddit API credentials)."""
    import praw

    post_id = extract_post_id(url)
    if not post_id:
        raise ValueError(f"Could not extract post ID from URL: {url}")

    reddit = praw.Reddit(
        client_id=REDDIT_CLIENT_ID,
        client_secret=REDDIT_CLIENT_SECRET,
        user_agent=REDDIT_USER_AGENT,
    )
    submission = reddit.submission(id=post_id)
    submission.comments.replace_more(limit=0)

    top_comments: List[str] = []
    for comment in submission.comments:
        if isinstance(comment, praw.models.Comment):
            body = comment.body.strip()
            if body and body != "[deleted]" and body != "[removed]":
                top_comments.append(body)
        if len(top_comments) >= 20:
            break

    parts = [f"{submission.title}\n\n{submission.selftext}"]
    if top_comments:
        parts.append("\n\nComments:\n")
        for i, comment in enumerate(top_comments, 1):
            parts.append(f"\nComment {i}:\n{comment}")

    return {
        "id": post_id,
        "reddit_url": url,
        "title": submission.title,
        "author": f"u/{submission.author.name}" if submission.author else "u/[deleted]",
        "subreddit": submission.subreddit.display_name,
        "selftext": submission.selftext,
        "top_comments": top_comments,
        "full_text": "\n".join(parts),
        "score": submission.score,
    }


def _extract_comments_from_json(comment_listing: List[Dict], max_comments: int = 20) -> List[str]:
    """Extract top-level comment bodies from Reddit JSON."""
    comments: List[str] = []
    for child in comment_listing:
        if child.get("kind") != "t1":
            continue
        data = child.get("data", {})
        body = data.get("body", "").strip()
        if body and body != "[deleted]" and body != "[removed]":
            comments.append(body)
        if len(comments) >= max_comments:
            break
    return comments


def _scrape_with_json(url: str) -> Dict:
    """Scrape via Reddit's public .json endpoint (no API keys needed)."""
    clean_url = _clean_reddit_url(url)
    json_url = f"{clean_url}.json"
    post_id = extract_post_id(url) or "unknown"

    headers = {
        "User-Agent": REDDIT_USER_AGENT,
        "Accept": "application/json",
    }

    with httpx.Client(timeout=30.0, headers=headers, follow_redirects=True) as client:
        response = client.get(json_url)

    if response.status_code != 200:
        raise RuntimeError(
            f"Reddit JSON endpoint returned {response.status_code}: {response.text[:200]}"
        )

    data = response.json()
    if not isinstance(data, list) or len(data) < 2:
        raise ValueError("Unexpected Reddit JSON structure")

    # Post data is in the first listing
    post_listing = data[0]
    post_children = post_listing.get("data", {}).get("children", [])
    if not post_children:
        raise ValueError("No post found in Reddit JSON response")

    post_data = post_children[0].get("data", {})
    title = post_data.get("title", "")
    selftext = post_data.get("selftext", "")
    author = post_data.get("author", "[deleted]")
    subreddit = post_data.get("subreddit", "")
    score = post_data.get("score", 0)

    # Comments are in the second listing
    comments_listing = data[1]
    comment_children = comments_listing.get("data", {}).get("children", [])
    top_comments = _extract_comments_from_json(comment_children, max_comments=20)

    parts = [f"{title}\n\n{selftext}"]
    if top_comments:
        parts.append("\n\nComments:\n")
        for i, comment in enumerate(top_comments, 1):
            parts.append(f"\nComment {i}:\n{comment}")

    return {
        "id": post_id,
        "reddit_url": url,
        "title": title,
        "author": f"u/{author}",
        "subreddit": subreddit,
        "selftext": selftext,
        "top_comments": top_comments,
        "full_text": "\n".join(parts),
        "score": score,
    }


def scrape_reddit_post(url: str) -> Dict:
    """Scrape a Reddit post and its top comments.

    Uses PRAW if Reddit API credentials are configured and praw is installed,
    otherwise falls back to the public .json endpoint (no auth required).
    """
    if _has_praw_credentials() and _praw_available():
        try:
            return _scrape_with_praw(url)
        except Exception:
            # If PRAW fails for any reason, try JSON fallback
            pass

    return _scrape_with_json(url)
