import re
import praw
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


def get_reddit_instance() -> praw.Reddit:
    """Initialize and return a PRAW Reddit instance."""
    return praw.Reddit(
        client_id=REDDIT_CLIENT_ID,
        client_secret=REDDIT_CLIENT_SECRET,
        user_agent=REDDIT_USER_AGENT,
    )


def scrape_reddit_post(url: str) -> Dict:
    """Scrape a Reddit post and its top comments."""
    post_id = extract_post_id(url)
    if not post_id:
        raise ValueError(f"Could not extract post ID from URL: {url}")

    reddit = get_reddit_instance()
    submission = reddit.submission(id=post_id)

    # Force load comments
    submission.comments.replace_more(limit=0)

    # Get top-level comments sorted by top
    top_comments: List[str] = []
    for comment in submission.comments:
        if isinstance(comment, praw.models.Comment):
            body = comment.body.strip()
            if body and body != "[deleted]" and body != "[removed]":
                top_comments.append(body)
        if len(top_comments) >= 20:
            break

    # Build full text
    parts = [f"{submission.title}\n\n{submission.selftext}"]
    if top_comments:
        parts.append("\n\nComments:\n")
        for i, comment in enumerate(top_comments, 1):
            parts.append(f"\nComment {i}:\n{comment}")

    full_text = "\n".join(parts)

    return {
        "id": post_id,
        "reddit_url": url,
        "title": submission.title,
        "author": f"u/{submission.author.name}" if submission.author else "u/[deleted]",
        "subreddit": submission.subreddit.display_name,
        "selftext": submission.selftext,
        "top_comments": top_comments,
        "full_text": full_text,
        "score": submission.score,
    }
