# gistcv [![DOI](https://zenodo.org/badge/1320727809.svg)](https://doi.org/10.5281/zenodo.21763847)


**Get the gist of a resume — as search terms.**

> **Status: v0.1 — testing.** This is an early, actively-tested release.
> Expect rough edges, and pin dependency/model versions if you rely on
> stable behavior.

Paste or upload a resume (PDF, DOCX, or plain text) and get back tailored,
platform-ready job search terms: primary job titles, adjacent/pivot titles,
skill keywords, LinkedIn boolean search strings, and Google X-ray searches.

No scraping involved — this only reads the resume you provide and uses an
LLM to reason about search terms. You then paste the generated terms into
LinkedIn, Indeed, Google, etc. yourself.

## Two ways to run this

**Option 1 — No install, just a webpage.** Open `web/index.html` in any
browser (locally, or via GitHub Pages if enabled on this repo — see
[docs/README](./docs/README.md)), paste in your own free Gemini API key,
and go. No Node, no npm, no terminal. Best for anyone who isn't a
developer.

**Option 2 — Local Node server.** The instructions below. Better if you
want to swap LLM providers via `.env`, extend the backend, or don't want
to deal with per-visitor API keys.

## Setup (Node server)

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
- Transient provider errors (HTTP 429 rate-limited, 503 overloaded) are
  automatically retried up to 3 times with exponential backoff before
  surfacing an error — see "Common errors" below if you still hit one.

## Common errors

Free-tier LLM providers move fast — model names get deprecated and
capacity fluctuates. These are the issues you're most likely to run into,
in roughly the order you'll hit them:

**`API key not valid`**
The key in `.env` is missing, still set to the placeholder text, or was
copied with extra whitespace. Get a real key from the relevant provider's
console (links in `.env.example`), paste it in with no quotes, and
restart the server — `.env` is only read once at startup.

**`This model ... is no longer available` (404)**
The provider retired the model ID this app was pointed at. Providers
(especially Google) deprecate and rename models faster than this repo can
track. Fix: check the provider's current model list and set the new ID as
an env var, e.g. `GEMINI_MODEL=gemini-3.6-flash` in `.env` — no code
change needed. Current model docs:
- Gemini: https://ai.google.dev/gemini-api/docs/models
- Groq: https://console.groq.com/docs/models
- Anthropic: https://docs.claude.com/en/docs/about-claude/models

**`currently experiencing high demand` / `UNAVAILABLE` (503)**
This is the provider's servers being temporarily overloaded, not a
problem with your setup. The app automatically retries 3 times with
backoff before giving up — if you still see this error, the provider is
having a rough moment; wait a bit and try again, or temporarily switch
`LLM_PROVIDER` to another configured provider in `.env`.

**Rate limited (429)**
You've hit the free tier's request cap (e.g. Gemini's ~1,500/day). Also
auto-retried a few times; if it persists, wait for the quota to reset or
switch providers.

## Contributing

Issues and PRs welcome. Keep new LLM providers behind the same
`LLM_PROVIDER` switch pattern in `server.js` if you add one.

## License

MIT — see [LICENSE](./LICENSE).
