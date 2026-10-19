# Python Quest

A free browser game that teaches Python step by step. Players travel across 8 islands and solve 40 short challenges. **There is no typing**: every level is solved by choosing, filling or arranging code, so it is comfortable on a phone as well as on a laptop.

Plain HTML, CSS and JavaScript. No build step, no dependencies, no server, no account.

## What is inside

| Island | Topic |
|---|---|
| 1. Print Beach | `print()`, strings, comments |
| 2. Variable Village | variables, numbers, joining strings |
| 3. If-Else Forest | conditions, `and` / `or`, `if` / `elif` / `else`, `%` |
| 4. Loop Lagoon | `for`, `range()`, `while` |
| 5. List Cave | lists, indexes, `len()`, `append()`, dictionaries |
| 6. Function Fort | `def`, parameters, `return` |
| 7. Bug Bazaar | reading errors: `NameError`, `TypeError`, `ZeroDivisionError`, `SyntaxError` |
| 8. Boss Island | mixed final test, then the Python Beginner badge |

Each island starts with a short lesson card, then 5 levels. Four kinds of challenge:

- **Choose the output**: read the code and pick what it prints.
- **Fill the blank**: tap the missing word into the code.
- **Fix the bug**: tap the broken line, then pick the line that fixes it.
- **Arrange the code**: put shuffled lines in the right order.

Game features: 3 hearts per level, up to 3 stars per level, XP, a daily streak, two hints plus a "show the answer" step, a short explanation after every level, dark and light themes, and progress saved in the browser (`localStorage`). Nothing is sent to any server.

## Works on every device

- Mobile first layout, checked at 320, 390, 820 and 1280 px wide with no sideways scrolling.
- Touch targets are at least 40 px, and tapping is the only input needed.
- Keyboard accessible, visible focus rings, screen-reader labels, live feedback messages, and `prefers-reduced-motion` is respected.
- Follows the system dark / light setting, with a manual switch.

## Run it locally

Open `index.html` in a browser, or serve the folder:

```
python -m http.server 8000
```

then visit <http://localhost:8000/>.

## Check that every answer is really correct

Every level is verified by running its code with real Python (needs Python 3 and Node.js):

```
python tools/verify_levels.py
```

It proves that the marked answer is right, that no wrong option also works, and that each "arrange the code" level has exactly one valid order. Run it again after you edit `js/levels.js`.

## Add or change levels

All content lives in [js/levels.js](js/levels.js). The top of that file explains the four level formats. Keep content in plain English and give every level exactly two hints and a `why` explanation. Then run `python tools/verify_levels.py`.

## Folder layout

```
index.html          page shell
css/style.css       all styling (light and dark themes)
js/theme.js         applies the saved theme before first paint
js/levels.js        islands, lessons and levels (the content)
js/game.js          game engine: map, levels, hearts, stars, XP, saving
tools/              verify_levels.py + dump_levels.js (content checker)
favicon.svg         app icon
og-image.png        social sharing image (1200 x 630)
_headers            security headers for Cloudflare Pages / Netlify
```

## Publish it

**As its own GitHub repo**

1. Copy or move this `python-quest` folder somewhere outside the main website repo.
2. `git init`, commit, create an empty repo on GitHub, then push.
3. Connect the repo to Cloudflare Pages (build command: none, output directory: `/`). The game is then live at its own address.

**Inside the main website**

The folder already sits at `games_on_my_web/python-quest/`, so deploying the site publishes the game at `/games_on_my_web/python-quest/`. Link to it from the main page, and add that URL to `sitemap.xml`.

**Before you publish, check two things**

- `og:image` in `index.html` points to `https://mukeemkhan.pages.dev/games_on_my_web/python-quest/og-image.png`. If the game lives at a different address, update that URL.
- The `_headers` file uses a strict Content-Security-Policy (no inline scripts or styles). The game is written for it, so keep it that way when you add code: no `onclick="..."`, no `style="..."`, no inline `<script>`.

## Privacy

The game does not use cookies, analytics or any network request. Progress is stored only in the visitor's own browser, and the "Reset my progress" link on the home screen clears it.
