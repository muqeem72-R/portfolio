# Mukeem Khan | Personal Portfolio

Personal introduction site for Mukeem Khan, M.Sc. Mathematics with Computer Science student at Jamia Millia Islamia, focused on Agentic and Robotic AI training work.

Plain HTML, CSS and JavaScript. No build step, no dependencies.

## Features

- English / हिन्दी / اردو switcher (right-to-left layout for Urdu)
- Dark and light theme, each with its own colour palette
- Interactive expertise explorer and an expandable education timeline
- "Try it": random reasoning problems (mostly mathematics, some code) that change on every visit
- Interactive lab:
  - **Compare responses**: pick the better answer and find the first flawed step, then see a rubric
  - **Numerical methods**: Newton's method and the trapezoidal rule drawn on a canvas
  - **Robot tasks**: order the steps of a task, then diagnose a failure using the physics
- Online courses and certificates (Kaggle, HackerRank), kept separate from formal education
- Projects: the M.Sc. minor project plus two personal projects, Python Quest (a browser game that teaches Python) and TypeLab (a touch-typing trainer), each with its own repository, live site and "View on GitHub" button
- Live repository list from the GitHub API (hidden until there is a repository to show; the projects above and this site's own repository are skipped)
- "Ask about Mukeem" assistant (English / हिन्दी / اردو): asks the visitor's name first, answers from a fixed list of facts (suggested questions + keyword search), uses free Cloudflare Workers AI only when the facts are not enough, offers email first and WhatsApp second, ends with an optional 5-face rating
- Responsive down to 320px wide, 44px touch targets, keyboard accessible, respects reduced motion, print-friendly

## Run locally

Open `index.html` in a browser, or use the VS Code **Live Server** extension and visit `http://127.0.0.1:5500/`.

## Deploy (Cloudflare Pages)

Framework preset: **None**. Build command: *(empty)*. Output directory: *(empty)*.

## Assistant setup (Cloudflare, free plan)

The page works without any setup (suggested questions and keyword search). To switch on the AI fallback and the rating records, open the Pages project, then **Settings, Bindings**:

1. **Workers AI**: variable name `AI`.
2. **KV namespace**: create one (Workers & Pages, KV) and bind it as `FEEDBACK`.
3. **Variables and secrets**: add `ADMIN_KEY` (a long random value, at least 12 characters) as a secret. Optional: `AI_MODEL` to change the model.
4. Redeploy. The ratings page is `https://<site>/api/feedback?key=<ADMIN_KEY>` (India time; add `&format=json` for raw data).

Stored per conversation: name (optional), language, time, rating, message, number of questions. Questions themselves are not stored, and no IP address is kept (entries expire after 400 days). The phone number is never part of the assistant's facts.

## Editing content

- Text and sections: `index.html`
- Education entries: `EDU` list in `assets/app.js`
- Courses and certificates: `LEARNING` list in `assets/app.js` (add one entry per course)
- Profile links: `PROFILES` list in `assets/app.js`
- Projects: the cards in the Projects section of `index.html`; repositories to hide from the live list: `SKIP_NAMES` in `assets/app.js`
- Assistant answers, questions and interface text: `assets/assistant-kb.json` (English, Hindi and Urdu in one place; used by both the page and the server)
- Practice problems: `BANK` in `assets/app.js`; lab cases in `assets/lab.js`

## Structure

```
index.html            page content
assets/style.css      styles
assets/app.js         interactivity, translations, problem bank
assets/lab.js         the three lab tools
assets/assistant.js   the assistant widget and keyword search
assets/assistant-kb.json  facts and interface text for the assistant (en / hi / ur)
functions/api/chat.js     AI fallback endpoint (Workers AI, rate limited, answers only from the facts)
functions/api/feedback.js stores ratings and visits (KV) and serves the private ratings page
assets/logo.svg       logo with the Rajasthan desert scene (hero, 404, share preview)
assets/logo-small.svg simplified logo for tiny sizes (header; favicon.svg is the same file)
assets/*.pdf          resume
_headers              security headers for Cloudflare Pages
robots.txt            crawler rules
private-resume/       editable resume (git-ignored, never published)
```
