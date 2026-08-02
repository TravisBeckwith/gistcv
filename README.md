# gistcv

**Get the gist of a resume — as search terms.**

Paste or upload a resume (PDF, DOCX, or plain text) and get back tailored,
platform-ready job search terms: primary job titles, adjacent/pivot titles,
skill keywords, LinkedIn boolean search strings, and Google X-ray searches.

No scraping involved — this only reads the resume you provide and uses an
LLM to reason about search terms. You then paste the generated terms into
LinkedIn, Indeed, Google, etc. yourself.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the example env file:
   ```bash
   cp .env.example .env
   ```
   By default this app uses **Google Gemini's free tier** — no credit card
   required, ~1,500 requests/day on Gemini Flash, which is far more than
   this app needs. Get a free key at https://aistudio.google.com/apikey
   and set `GEMINI_API_KEY` in `.env`.

   Other supported providers (set `LLM_PROVIDER` in `.env` to switch):
   - `groq` — also free, fast open-weight models (Llama 3.3). Key at
     https://console.groq.com/keys
   - `anthropic` — paid, generally higher quality output. Key at
     https://console.anthropic.com/

   Free tiers are rate-limited and can change without notice — fine for
   personal use, but check current limits if you expect heavy traffic.

3. Start the server:
   ```bash
   npm start
   ```

4. Open http://localhost:3000 in your browser.

## How it works

- **Frontend** (`public/`): plain HTML/CSS/JS. Two input modes — paste text
  or upload a file.
- **Backend** (`server.js`): Express server with two routes:
  - `POST /api/analyze-text` — accepts raw resume text
  - `POST /api/analyze-file` — accepts a `.pdf`, `.docx`, or `.txt` upload,
    extracts text (via `pdf-parse` / `mammoth`), then sends it to the LLM
  - Both routes call whichever LLM provider is configured (`LLM_PROVIDER`
    in `.env` — Gemini by default, or Groq/Anthropic) with a prompt asking
    for structured JSON output (titles, keywords, boolean/X-ray search
    strings)

## Notes / next steps

- Uploaded files are processed in memory and never written to disk.
- The 8MB upload limit and prompt length are configurable in `server.js`.
- If you want to deploy this (e.g. Render, Railway, Fly.io), just make sure
  your chosen provider's API key is set as an environment variable there —
  never commit your `.env` file (it's already gitignored).
- Possible extensions: save search term sets per user, add more platforms
  (Indeed-specific query syntax, ZipRecruiter), or let the user regenerate
  with a "more senior" / "more junior" / "career change" toggle.

## Contributing

Issues and PRs welcome. Keep new LLM providers behind the same
`LLM_PROVIDER` switch pattern in `server.js` if you add one.

## License

MIT — see [LICENSE](./LICENSE).

## Pushing to GitHub and cutting a release

```bash
git init
git add .
git commit -m "Initial commit: gistcv"
git branch -M main
git remote add origin https://github.com/<your-username>/gistcv.git
git push -u origin main
```

Then tag and publish a release:

```bash
git tag -a v1.0.0 -m "v1.0.0"
git push origin v1.0.0
```

On GitHub: **Releases → Draft a new release → choose tag `v1.0.0`** →
add release notes → **Publish release**.

Before pushing, replace the `<your-username>` placeholders in
`package.json` (`repository`, `homepage`, `bugs`) and `LICENSE`
(`<your-name>`) with your actual details.
