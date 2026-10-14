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
- Live repository list from the GitHub API (hidden until there is a repository to show)
- Responsive down to 320px wide, 44px touch targets, keyboard accessible, respects reduced motion, print-friendly

## Run locally

Open `index.html` in a browser, or use the VS Code **Live Server** extension and visit `http://127.0.0.1:5500/`.

## Deploy (Cloudflare Pages)

Framework preset: **None**. Build command: *(empty)*. Output directory: *(empty)*.

## Editing content

- Text and sections: `index.html`
- Education entries: `EDU` list in `assets/app.js`
- Courses and certificates: `LEARNING` list in `assets/app.js` (add one entry per course)
- Profile links: `PROFILES` list in `assets/app.js`
- Practice problems: `BANK` in `assets/app.js`; lab cases in `assets/lab.js`

## Structure

```
index.html            page content
assets/style.css      styles
assets/app.js         interactivity, translations, problem bank
assets/lab.js         the three lab tools
assets/logo.svg       logo (favicon.svg is the same file)
assets/*.pdf          resume
_headers              security headers for Cloudflare Pages
robots.txt            crawler rules
private-resume/       editable resume (git-ignored, never published)
```
