# gistcv — Step-by-Step Instruction Manual

This walks through everything from unzipping the project to running it
locally and (optionally) publishing it on GitHub.

---

## 1. Prerequisites

Before you start, make sure you have:

- **Node.js version 18 or later** installed.
  Check with:
  ```bash
  node -v
  ```
  If it prints nothing or a version below 18, install Node from
  https://nodejs.org/ first.
- **npm** (comes bundled with Node — no separate install needed).
- A terminal / command prompt.
- (Optional, for GitHub steps) **Git** installed and a GitHub account.

---

## 2. Get the project onto your machine

If you have the `gistcv.zip` file:

1. Unzip it wherever you keep projects, e.g.:
   ```bash
   unzip gistcv.zip
   cd gistcv
   ```

If you already pushed it to GitHub instead, clone it:
```bash
git clone https://github.com/<your-username>/gistcv.git
cd gistcv
```

---

## 3. Install dependencies

From inside the `gistcv` folder, run:
```bash
npm install
```
This reads `package.json` and downloads everything the app needs into a
`node_modules` folder. It only needs to be run once (or again if you pull
new changes that add dependencies).

---

## 4. Set up your environment file

1. Copy the example env file to a real one:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` in any text editor.

You'll see a `LLM_PROVIDER` setting and API key placeholders for three
providers. You only need to fill in **one** of them, matching whichever
provider `LLM_PROVIDER` is set to.

### Option A — Gemini (recommended, free)

1. Go to https://aistudio.google.com/apikey
2. Sign in with a Google account and click **Create API key**.
3. Copy the key.
4. In `.env`, set:
   ```
   LLM_PROVIDER=gemini
   GEMINI_API_KEY=paste-your-key-here
   ```

### Option B — Groq (also free)

1. Go to https://console.groq.com/keys
2. Sign in and generate a key.
3. In `.env`, set:
   ```
   LLM_PROVIDER=groq
   GROQ_API_KEY=paste-your-key-here
   ```

### Option C — Anthropic (paid)

1. Go to https://console.anthropic.com/
2. Create an API key under your account settings.
3. In `.env`, set:
   ```
   LLM_PROVIDER=anthropic
   ANTHROPIC_API_KEY=paste-your-key-here
   ```

Save the `.env` file when done. **Never commit this file or share it** —
it's already listed in `.gitignore` so Git will ignore it automatically.

---

## 5. Start the app

```bash
npm start
```

You should see:
```
Resume job search term generator running on http://localhost:3000
```

Leave this terminal window open — closing it stops the server.

---

## 6. Use the app

1. Open a browser and go to **http://localhost:3000**
2. Choose an input method:
   - **Paste text** — paste your resume content directly into the box
   - **Upload file** — choose a `.pdf`, `.docx`, or `.txt` file
3. Click **Generate search terms**.
4. Wait a few seconds for the results, which will include:
   - A short profile summary
   - Primary job titles to search
   - Adjacent/pivot titles worth trying
   - Skill keywords
   - Ready-to-copy LinkedIn boolean search strings
   - Ready-to-copy Google X-ray searches
5. Click any search string to copy it to your clipboard, then paste it
   into LinkedIn, Indeed, or Google.

To stop the server, go back to the terminal and press `Ctrl+C`.

---

## 7. Making changes (optional)

- Backend logic lives in `server.js`.
- Frontend files live in `public/` (`index.html`, `style.css`, `app.js`).
- After editing `server.js`, restart with `npm start`, or run
  `npm run dev` instead, which auto-restarts on file changes.

---

## 8. Publishing to GitHub (optional)

1. Create a new, empty repository on GitHub named `gistcv` (don't
   initialize it with a README — you already have one).
2. In `package.json` and `LICENSE`, replace the `<your-username>` and
   `<your-name>` placeholders with your actual GitHub username and name.
3. From inside the `gistcv` folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: gistcv"
   git branch -M main
   git remote add origin https://github.com/<your-username>/gistcv.git
   git push -u origin main
   ```
4. Refresh your GitHub repo page — your code should now be there.

---

## 9. Cutting a release (optional)

1. Tag the current commit:
   ```bash
   git tag -a v1.0.0 -m "v1.0.0"
   git push origin v1.0.0
   ```
2. On GitHub, go to your repo → **Releases** (right sidebar) →
   **Draft a new release**.
3. Under **Choose a tag**, select `v1.0.0`.
4. Add a title (e.g. `v1.0.0`) and paste in release notes describing
   what's included.
5. Click **Publish release**.

---

## Troubleshooting

| Problem | Likely cause / fix |
|---|---|
| `Missing GEMINI_API_KEY` error | You haven't set the matching key in `.env` for whatever `LLM_PROVIDER` is set to |
| `Cannot find package 'express'` | Run `npm install` before `npm start` |
| Port 3000 already in use | Another app is using that port — set `PORT=3001` (or any free port) in `.env` |
| File upload fails silently | Only `.pdf`, `.docx`, and `.txt` are supported, and files must be under 8MB |
| Results look generic | Try pasting more complete resume text — thin or bullet-only resumes give the model less to work with |
