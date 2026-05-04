# StoryFyne

Reddit story to expressive audio generator.

## Architecture

- **Backend**: Python FastAPI → Railway
- **Frontend**: Next.js → Vercel
- **Storage**: Cloudflare R2 (audio + JSON metadata index)
- **AI**: Claude Haiku (tagging) + xAI TTS (synthesis)

## Project Structure

```
storyfyne-backend/     # FastAPI app
  main.py              # API endpoints
  scraper.py           # Reddit scraping (PRAW)
  tagger.py            # Claude Haiku integration
  generator.py         # xAI TTS chunking + pydub assembly
  storage.py           # R2 storage (boto3)
  config.py            # Settings & constants
  requirements.txt
  .env.example

storyfyne-frontend/    # Next.js app
  app/
    page.tsx           # Main UI
    layout.tsx
  components/
    StoryInput.tsx
    ProgressTracker.tsx
    StoryList.tsx
    StoryCard.tsx
    AudioPlayer.tsx
  next.config.js
  package.json
  tsconfig.json
  .env.example
```

## Setup

### Backend

```bash
cd storyfyne-backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Fill in .env
uvicorn main:app --reload
```

### Frontend

```bash
cd storyfyne-frontend
npm install
cp .env.example .env.local
# Fill in .env.local
npm run dev
```

## Deployment

- Backend: Connect `storyfyne-backend` folder to a new Railway project
- Frontend: Connect `storyfyne-frontend` folder to a new Vercel project

## API Endpoints

- `POST /api/process` — Scrape, tag, generate, upload
- `GET /api/stories` — List all stories
- `GET /api/stories/{id}` — Get story metadata
- `GET /api/download/{id}` — Redirect to audio file
- `DELETE /api/stories/{id}` — Delete story
