import google.generativeai as genai
from config import GEMINI_API_KEY, GEMINI_MODEL, GEMINI_MAX_OUTPUT_TOKENS

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


def _strip_code_blocks(text: str) -> str:
    """Remove markdown code blocks if the model added them."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
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
        text = "\n".join(lines[start:end]).strip()
    return text


async def tag_text_with_gemini(text: str) -> str:
    """Send text to Gemini Flash for expressive tagging."""
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not configured")

    genai.configure(api_key=GEMINI_API_KEY)

    model = genai.GenerativeModel(
        model_name=GEMINI_MODEL,
        system_instruction=SYSTEM_PROMPT,
    )

    response = await model.generate_content_async(
        text,
        generation_config=genai.types.GenerationConfig(
            max_output_tokens=GEMINI_MAX_OUTPUT_TOKENS,
            temperature=0.3,
        ),
    )

    if not response or not response.text:
        raise RuntimeError("Gemini returned empty response")

    tagged_text = _strip_code_blocks(response.text)
    return tagged_text
