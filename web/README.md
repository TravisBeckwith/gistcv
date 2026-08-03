# gistcv — web version

A single self-contained HTML file. No Node, no npm, no terminal, no
install. It runs entirely in your browser.

## Quick start (no hosting needed)

1. Download `index.html`.
2. Double-click it to open it in your browser (or drag it into a browser
   window).
3. Get a free Gemini API key at https://aistudio.google.com/apikey
   (no credit card required) and paste it into the "API key" field, then
   click **Save key**.
4. Paste or upload your resume and click **Generate search terms**.

Your API key is saved only in your browser's local storage on your own
device. It's sent directly to Google's Gemini API when you click
generate — never to any other server, including this project's.

## Hosting it as a real webpage (optional)

If you want a shareable link instead of a local file, GitHub Pages can
host this for free straight from the repo:

1. On GitHub, go to the repo → **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **Deploy from a
   branch**.
3. Under **Branch**, choose `main` and set the folder to `/web` (root of
   this folder), then **Save**.
4. GitHub will publish it at:
   `https://<your-username>.github.io/gistcv/`
   (may take a minute or two after the first save)

Anyone who visits that link still needs to paste in their *own* free
Gemini key — this setup never involves your key or any server cost to
you, since every visitor's browser talks directly to Google.

## Why a separate version from the Node app?

The main `gistcv` app (in the repo root) is a small Node/Express server —
more flexible (swap LLM providers via `.env`, extend the backend) but
requires installing Node, running `npm install`, and using a terminal.
This `web/` version trades that flexibility for zero setup: perfect for
sharing with someone who just wants to use the tool, not run a dev
environment.

## Limitations

- Only supports the Gemini provider (the free option) — not Groq or
  Anthropic, to keep the file dependency-free and simple.
- Each visitor needs their own Gemini API key; there's no shared/central
  key, so nobody (including you, if you host it) is on the hook for
  everyone else's usage.
- PDF and DOCX parsing rely on external libraries loaded from a CDN
  (pdf.js and mammoth.js). If those fail to load — e.g. an ad-blocker or
  strict corporate firewall — file upload for those two formats won't
  work, but pasting resume text as plain text still will.
