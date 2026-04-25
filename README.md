# Tyee Study Buddy

Middle-school homework helper. Ask a question → get a plain-English explanation, a flip-flashcard, and 3 auto-graded practice questions.

## v1 scope
- Guest only (no login / history)
- Text input only
- 3 tabs: Explanation · Flashcard · Practice
- Deploy: Vercel

## Local dev

```bash
# macOS / Linux / Git Bash
cp .env.example .env.local

# Windows (PowerShell or CMD)
copy .env.example .env.local

# then edit .env.local and set OPENAI_API_KEY
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. Go to https://vercel.com/new → import the repo.
3. In **Environment Variables**, add:
   - `OPENAI_API_KEY` = your key
   - `OPENAI_MODEL` = `gpt-5.4` (or whichever model you're using)
4. Click Deploy.

Vercel will auto-deploy on every push to `main`.

## v2 backlog
- Google login + question history (NextAuth + Vercel Postgres)
- Image / file upload for homework
- Follow-up chat ("I don't get step 2")
