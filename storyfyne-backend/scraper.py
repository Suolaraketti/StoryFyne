import re
import httpx
from html.parser import HTMLParser
from typing import Dict, List, Optional
from config import REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT


class _HTMLTextExtractor(HTMLParser):
    """Simple HTML parser that extracts text content."""
    def __init__(self):
        super().__init__()
        self.text_parts = []
        self.skip_tags = {'script', 'style', 'nav', 'footer', 'header', 'aside'}
        self.skip_depth = 0

    def handle_starttag(self, tag, attrs):
        if tag in self.skip_tags:
            self.skip_depth += 1

    def handle_endtag(self, tag):
        if tag in self.skip_tags:
            self.skip_depth -= 1

    def handle_data(self, data):
        if self.skip_depth == 0:
            self.text_parts.append(data)

    def get_text(self) -> str:
        text = ' '.join(self.text_parts)
        text = re.sub(r'\s+', ' ', text).strip()
        return text


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
    url = url.split("?")[0].split("#")[0]
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
    """Scrape via Reddit's public .json endpoint (no auth required)."""
    clean_url = _clean_reddit_url(url)
    json_url = f"{clean_url}.json"
    post_id = extract_post_id(url) or "unknown"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
    }

    with httpx.Client(timeout=30.0, headers=headers, follow_redirects=True) as client:
        response = client.get(json_url)

        if response.status_code == 403:
            old_url = clean_url.replace("www.reddit.com", "old.reddit.com").replace("reddit.com", "old.reddit.com")
            json_url_old = f"{old_url}.json"
            response = client.get(json_url_old)

    if response.status_code != 200:
        raise RuntimeError(
            f"Reddit JSON endpoint returned {response.status_code}: {response.text[:200]}"
        )

    data = response.json()
    if not isinstance(data, list) or len(data) < 2:
        raise ValueError("Unexpected Reddit JSON structure")

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
            pass

    return _scrape_with_json(url)


def scrape_website(url: str, max_chars: int = 8000) -> str:
    """Scrape a website and return its text content."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
    }

    with httpx.Client(timeout=30.0, headers=headers, follow_redirects=True) as client:
        response = client.get(url)

    if response.status_code != 200:
        raise RuntimeError(f"Website returned {response.status_code}")

    content_type = response.headers.get("content-type", "")
    if "application/json" in content_type:
        return response.text[:max_chars]

    extractor = _HTMLTextExtractor()
    try:
        extractor.feed(response.text)
    except Exception:
        pass

    text = extractor.get_text()
    return text[:max_chars]
