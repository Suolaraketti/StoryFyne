import httpx
from config import ANTHROPIC_API_KEY, CLAUDE_MODEL, CLAUDE_MAX_TOKENS

SYSTEM_PROMPT = """You are an audio director. Analyze Reddit stories and prepare them for text-to-speech with expressive voice tags.

Rules:
1. Identify who is speaking. Label speakers as [NARRATOR], [SPEAKER_A], [SPEAKER_B], [SPEAKER_C], etc.
2. Detect emotional tone: fear, anger, sadness, excitement, whisper, panic, defeat, joy, sarcasm.
3. Add xAI TTS tags using ONLY these exact tags:
   Inline: [laugh], [sigh], [pause], [long-pause], [breath], [whisper], [cry]
   Wrapping: <whisper>text</whisper>, <emphasis>text</emphasis>, <slow>text</slow>, <soft>text</soft>, <loud>text</loud>, <fast>text</fast>
4. Maintain original text. Only add tags. Do not rewrite, summarize, or truncate.
5. Keep paragraphs intact.
6. For dialogue attribution like 'he whispered' or 'she shouted', remove the attribution and wrap the dialogue in the appropriate tag instead. Example: 'Get out,' she whispered. → <whisper>Get out.</whisper>
7. For ALL CAPS text, use <emphasis>ALL CAPS TEXT</emphasis>
8. For ellipsis (...), add [pause] before or after
9. For exclamation marks indicating shouting, use <emphasis>text!</emphasis>

Output format:
Return ONLY the tagged text. No explanations, no markdown code blocks, no preamble."""


async def tag_text_with_claude(text: str) -> str:
    """Send text to Claude Haiku for expressive tagging."""
    if not ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY not configured")

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
            json={
                "model": CLAUDE_MODEL,
                "max_tokens": CLAUDE_MAX_TOKENS,
                "system": SYSTEM_PROMPT,
                "messages": [
                    {"role": "user", "content": text}
                ],
            },
        )

    if response.status_code != 200:
        raise RuntimeError(f"Claude API error: {response.status_code} - {response.text}")

    data = response.json()
    content_blocks = data.get("content", [])
    if not content_blocks:
        raise RuntimeError("Claude returned empty content")

    tagged_text = content_blocks[0].get("text", "").strip()
    # Remove markdown code blocks if Claude added them despite instructions
    if tagged_text.startswith("```"):
        lines = tagged_text.split("\n")
        # Find first and last ```
        start = 0
        end = len(lines)
        for i, line in enumerate(lines):
            if line.strip().startswith("```"):
                start = i + 1
                break
        for i in range(len(lines) - 1, -1, -1):
            if lines[i].strip().startswith("```"):
                end = i
                break
        tagged_text = "\n".join(lines[start:end]).strip()

    return tagged_text
