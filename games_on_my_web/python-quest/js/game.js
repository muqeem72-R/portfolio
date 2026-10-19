/*
  Python Quest: game engine.
  Plain JavaScript, no libraries, no build step.
  Content lives in levels.js. Progress is stored in localStorage only.
  Everything is built with DOM methods (never innerHTML), so it also works
  under a strict Content-Security-Policy.
*/
(function () {
  "use strict";

  var ISLANDS = window.PQ_ISLANDS || [];
  var app = document.getElementById("app");
  var SAVE_KEY = "pythonQuest.v1";
  var THEME_KEY = "pythonQuest.theme";
  var MAX_HEARTS = 3;
  var firstRender = true;

  var KIND_NAMES = {
    output: "Choose the output",
    fill: "Fill the blank",
    bug: "Fix the bug",
    order: "Arrange the code"
  };

  /* ------------------------------------------------------------ DOM helpers */

  function append(el, kids) {
    if (kids === null || kids === undefined || kids === false) return;
    if (Array.isArray(kids)) { kids.forEach(function (k) { append(el, k); }); return; }
    el.appendChild(typeof kids === "object" ? kids : document.createTextNode(String(kids)));
  }

  function h(tag, props, kids) {
    var el = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        var v = props[k];
        if (v === null || v === undefined || v === false) return;
        if (k === "class") el.className = v;
        else if (k === "text") el.textContent = v;
        else if (k.indexOf("on") === 0) el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? "" : String(v));
      });
    }
    append(el, kids);
    return el;
  }

  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function plural(n, word) { return n + " " + word + (n === 1 ? "" : "s"); }

  /* -------------------------------------------------- Python syntax colours */

  var KEYWORDS = new Set(["def", "return", "if", "elif", "else", "for", "while", "in", "and", "or", "not",
    "True", "False", "None", "import", "from", "as", "break", "continue", "pass", "is"]);
  var BUILTINS = new Set(["print", "len", "range", "input", "int", "str", "float", "list", "dict", "sum", "max", "min", "type"]);
  var TOKEN = /(____)|(#.*)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|(\d+(?:\.\d+)?)|([A-Za-z_]\w*)|([\s\S])/g;

  function span(cls, text) { return h("span", { class: cls, text: text }); }

  function highlight(line, onBlank) {
    var frag = document.createDocumentFragment();
    var plain = "";
    var re = new RegExp(TOKEN.source, "g");
    var m;
    function flush() { if (plain) { frag.appendChild(document.createTextNode(plain)); plain = ""; } }
    while ((m = re.exec(line)) !== null) {
      if (m[1]) { flush(); frag.appendChild(onBlank ? onBlank() : document.createTextNode("____")); }
      else if (m[2]) { flush(); frag.appendChild(span("c", m[2])); }
      else if (m[3]) { flush(); frag.appendChild(span("s", m[3])); }
      else if (m[4]) { flush(); frag.appendChild(span("n", m[4])); }
      else if (m[5]) {
        if (KEYWORDS.has(m[5])) { flush(); frag.appendChild(span("k", m[5])); }
        else if (BUILTINS.has(m[5])) { flush(); frag.appendChild(span("b", m[5])); }
        else if (line.charAt(re.lastIndex) === "(") { flush(); frag.appendChild(span("f", m[5])); }
        else plain += m[5];
      } else plain += m[6];
    }
    flush();
    return frag;
  }

  /*
    codeBlock(lines, opts)
      opts.blank(k)        -> node used for the k-th ____ blank
      opts.pick(i)         -> if given and truthy for line i, the line is a button; value is the click handler
      opts.mark[i]         -> extra class for line i ("found" / "fixed")
      opts.replace[i]      -> text shown instead of lines[i]
  */
  function codeBlock(lines, opts) {
    opts = opts || {};
    var blankCount = 0;
    var box = h("div", { class: "code", role: "group", "aria-label": "Python code" });
    if (!opts.pick) box.setAttribute("tabindex", "0");
    lines.forEach(function (raw, i) {
      var text = opts.replace && opts.replace[i] !== undefined ? opts.replace[i] : raw;
      var handler = opts.pick && text.trim() !== "" ? opts.pick(i) : null;
      var cls = "line" + (opts.mark && opts.mark[i] ? " " + opts.mark[i] : "");
      var src = h("span", { class: "src" });
      src.appendChild(highlight(text, opts.blank ? function () { return opts.blank(blankCount++); } : null));
      if (!text) src.appendChild(document.createTextNode("​"));
      var row;
      if (handler) {
        row = h("button", { type: "button", class: cls + " pick", "aria-label": "Line " + (i + 1) + ": " + text.trim(), onclick: handler });
      } else {
        row = h("div", { class: cls });
      }
      row.appendChild(h("span", { class: "no", "aria-hidden": "true", text: String(i + 1) }));
      row.appendChild(src);
      box.appendChild(row);
    });
    return box;
  }

  function goalBox(text, label) {
    return h("div", { class: "term" }, [
      h("span", { class: "tag", text: label || "Goal output" }),
      h("pre", { text: text })
    ]);
  }

  function starsNode(n, max) {
    max = max || 3;
    var box = h("span", { class: "stars", role: "img", "aria-label": n + " of " + max + " stars" });
    for (var i = 0; i < max; i++) box.appendChild(h("span", { class: i < n ? "" : "off", "aria-hidden": "true", text: "★" }));
    return box;
  }

  /* ------------------------------------------------------------- save data */

  function defaults() { return { xp: 0, stars: {}, streak: { count: 0, last: "" } }; }

  function loadSave() {
    var s = defaults();
    try {
      var raw = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (raw && typeof raw === "object") {
        s.xp = Math.max(0, Number(raw.xp) || 0);
        if (raw.stars && typeof raw.stars === "object") {
          Object.keys(raw.stars).forEach(function (k) {
            var v = Number(raw.stars[k]);
            if (/^\d+-\d+$/.test(k) && v >= 1 && v <= 3) s.stars[k] = Math.floor(v);
          });
        }
        if (raw.streak && typeof raw.streak === "object") {
          s.streak.count = Math.max(0, Number(raw.streak.count) || 0);
          s.streak.last = typeof raw.streak.last === "string" ? raw.streak.last : "";
        }
      }
    } catch (e) { /* storage blocked or corrupt: start fresh */ }
    return s;
  }

  var save = loadSave();

  function persist() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ }
  }

  function dayKey(d) {
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (day < 10 ? "0" : "") + day;
  }

  function currentStreak() {
    var now = new Date();
    var y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    var last = save.streak.last;
    return last === dayKey(now) || last === dayKey(y) ? save.streak.count : 0;
  }

  function touchStreak() {
    var now = new Date();
    var today = dayKey(now);
    if (save.streak.last === today) return;
    var y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    save.streak.count = save.streak.last === dayKey(y) ? save.streak.count + 1 : 1;
    save.streak.last = today;
  }

  /* -------------------------------------------------------------- progress */

  function key(i, j) { return i + "-" + j; }
  function starsOf(i, j) { return save.stars[key(i, j)] || 0; }
  function levelCount(i) { return ISLANDS[i].levels.length; }
  function doneCount(i) {
    var n = 0;
    for (var j = 0; j < levelCount(i); j++) if (starsOf(i, j) > 0) n++;
    return n;
  }
  function islandComplete(i) { return doneCount(i) === levelCount(i); }
  function islandUnlocked(i) { return i === 0 || islandComplete(i - 1); }
  function levelUnlocked(i, j) { return islandUnlocked(i) && (j === 0 || starsOf(i, j - 1) > 0); }
  function totalLevels() { return ISLANDS.reduce(function (n, isl) { return n + isl.levels.length; }, 0); }
  function totalDone() { var n = 0; ISLANDS.forEach(function (_, i) { n += doneCount(i); }); return n; }
  function islandStars(i) { var n = 0; for (var j = 0; j < levelCount(i); j++) n += starsOf(i, j); return n; }
  function allComplete() { return totalDone() === totalLevels(); }

  function nextTarget() {
    for (var i = 0; i < ISLANDS.length; i++) {
      for (var j = 0; j < levelCount(i); j++) if (!starsOf(i, j)) return { i: i, j: j };
    }
    return null;
  }

  function completeLevel(i, j, stars) {
    var k = key(i, j);
    var old = save.stars[k] || 0;
    var gain = 0;
    if (!old) gain = 10 + 5 * stars;
    else if (stars > old) gain = 5 * (stars - old);
    save.stars[k] = Math.max(old, stars);
    save.xp += gain;
    touchStreak();
    persist();
    updateStats();
    return gain;
  }

  function updateStats() {
    document.getElementById("xp-val").textContent = String(save.xp);
    document.getElementById("streak-val").textContent = String(currentStreak());
  }

  /* ----------------------------------------------------------------- theme */

  var themeBtn = document.getElementById("theme-btn");

  function currentTheme() {
    var t = document.documentElement.getAttribute("data-theme");
    if (t === "light" || t === "dark") return t;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function paintTheme() {
    var t = currentTheme();
    document.getElementById("theme-icon").textContent = t === "dark" ? "☀️" : "🌙";
    themeBtn.setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme");
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t === "dark" ? "#0b1020" : "#f7f8fc");
  }

  themeBtn.addEventListener("click", function () {
    var next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
    paintTheme();
  });

  /* --------------------------------------------------------------- routing */

  function parseRoute() {
    var parts = (location.hash || "").replace(/^#\/?/, "").split("/").filter(Boolean);
    function num(s, max) { return /^\d+$/.test(s || "") && Number(s) < max ? Number(s) : -1; }
    if (parts[0] === "finish") return { name: "finish" };
    if (parts[0] === "i") {
      var i = num(parts[1], ISLANDS.length);
      if (i < 0) return { name: "home" };
      if (parts.length === 2) return { name: "island", i: i };
      if (parts[2] === "done" && parts.length === 3) return { name: "islandDone", i: i };
      if (parts[2] === "l" && parts.length === 4) {
        var j = num(parts[3], levelCount(i));
        if (j >= 0) return { name: "level", i: i, j: j };
      }
      return { name: "island", i: i };
    }
    return { name: "home" };
  }

  function go(hash) { location.replace(hash); }

  function setTitle(t) { document.title = t ? t + " | Python Quest" : "Python Quest | Learn Python by Playing"; }

  function render() {
    var r = parseRoute();
    app.textContent = "";
    try {
      if (r.name === "island" || r.name === "islandDone" || r.name === "level") {
        if (!islandUnlocked(r.i)) { go("#/"); return; }
      }
      if (r.name === "level" && !levelUnlocked(r.i, r.j)) { go("#/i/" + r.i); return; }
      if (r.name === "islandDone" && !islandComplete(r.i)) { go("#/i/" + r.i); return; }
      if (r.name === "finish" && !allComplete()) { go("#/"); return; }

      if (r.name === "home") viewHome();
      else if (r.name === "island") viewIsland(r.i);
      else if (r.name === "islandDone") viewIslandDone(r.i);
      else if (r.name === "finish") viewFinish();
      else viewLevel(r.i, r.j);
    } catch (err) {
      app.textContent = "";
      app.appendChild(h("p", { class: "notice", text: "Sorry, something went wrong while showing this page. Please reload." }));
      if (window.console) console.error(err);
    }
    updateStats();
    window.scrollTo(0, 0);
    if (!firstRender) {
      var f = app.querySelector("[data-focus]");
      if (f) f.focus({ preventScroll: true });
    }
    firstRender = false;
  }

  /* ------------------------------------------------------------------ home */

  function viewHome() {
    setTitle("");
    var total = totalLevels(), done = totalDone();
    var target = nextTarget();
    var startHref = "#/i/0";
    var startLabel = "Start playing";
    if (done > 0 && target) {
      startHref = target.j === 0 ? "#/i/" + target.i : "#/i/" + target.i + "/l/" + target.j;
      startLabel = "Continue";
    } else if (!target) {
      startHref = "#/finish";
      startLabel = "See your badge";
    }

    var hero = h("section", { class: "hero" }, [
      h("h1", { text: "Learn Python by playing", tabindex: "-1", "data-focus": "" }),
      h("p", { text: "Travel across " + ISLANDS.length + " islands and solve " + total + " short challenges. You do not type any code. You only choose, fill and arrange it." }),
      h("div", { class: "meter" }, [
        h("div", { class: "meter-label", text: done + " of " + total + " levels done" }),
        h("progress", { max: total, value: done, "aria-label": "Levels completed" })
      ]),
      h("a", { class: "btn", href: startHref, text: startLabel })
    ]);

    var kinds = h("ul", { class: "kinds", "aria-label": "Kinds of challenges" }, [
      kindItem("Choose the output", "Read the code and pick what it prints."),
      kindItem("Fill the blank", "Tap the missing word into the code."),
      kindItem("Fix the bug", "Find the broken line and pick the fix."),
      kindItem("Arrange the code", "Put shuffled lines in the right order.")
    ]);

    var list = h("ul", { class: "islands" });
    ISLANDS.forEach(function (isl, i) {
      var unlocked = islandUnlocked(i);
      var complete = islandComplete(i);
      var cls = "island" + (unlocked ? "" : " locked") + (complete ? " done" : "");
      var inner = [
        h("span", { class: "emoji", "aria-hidden": "true", text: unlocked ? isl.emoji : "🔒" }),
        h("span", { class: "name", text: (i + 1) + ". " + isl.name }),
        h("span", { class: "blurb", text: unlocked ? isl.blurb : "Finish " + ISLANDS[i - 1].name + " to unlock this island." }),
        h("span", { class: "meta" }, [
          h("span", { text: doneCount(i) + " / " + levelCount(i) + " levels" }),
          starsNode(Math.round(islandStars(i) / levelCount(i)))
        ])
      ];
      var card = unlocked
        ? h("a", { class: cls, href: "#/i/" + i }, inner)
        : h("div", { class: cls, "aria-disabled": "true" }, inner);
      list.appendChild(h("li", null, card));
    });

    var kids = [hero];
    if (allComplete()) {
      kids.push(h("section", { class: "badge-box" }, [
        h("div", { class: "big", "aria-hidden": "true", text: "🏆" }),
        h("h2", { text: "Python Beginner badge earned" }),
        h("p", { class: "muted", text: "You finished every island. Great work!" }),
        h("a", { class: "btn secondary", href: "#/finish", text: "What next?" })
      ]));
    }
    kids.push(h("h2", { text: "How the challenges work" }), kinds, h("h2", { text: "Choose an island" }), list);
    kids.push(h("div", { class: "reset" }, h("button", {
      class: "linkish", type: "button", text: "Reset my progress",
      onclick: function () {
        if (window.confirm("Reset all your progress? This cannot be undone.")) {
          save = defaults(); persist(); updateStats(); render();
        }
      }
    })));
    append(app, kids);
  }

  function kindItem(title, text) {
    return h("li", null, [h("b", { text: title }), h("span", { text: text })]);
  }

  /* ---------------------------------------------------------------- island */

  function viewIsland(i) {
    var isl = ISLANDS[i];
    setTitle(isl.name);
    var learn = isl.learn;

    var path = h("ol", { class: "path" });
    var firstOpen = -1;
    isl.levels.forEach(function (lv, j) {
      var unlocked = levelUnlocked(i, j);
      var st = starsOf(i, j);
      if (unlocked && !st && firstOpen < 0) firstOpen = j;
      var inner = [
        h("span", { class: "num", "aria-hidden": "true", text: st ? "✓" : String(j + 1) }),
        h("span", { class: "label" }, [
          "Level " + (j + 1),
          h("span", { class: "kind", text: KIND_NAMES[lv.type] })
        ]),
        st ? starsNode(st) : h("span", { class: "muted", text: unlocked ? "Play" : "Locked" })
      ];
      var cls = "stop" + (st ? " done" : "") + (unlocked ? "" : " locked");
      path.appendChild(h("li", null, unlocked
        ? h("a", { class: cls, href: "#/i/" + i + "/l/" + j }, inner)
        : h("div", { class: cls, "aria-disabled": "true" }, inner)));
    });

    var cta;
    if (firstOpen >= 0) {
      cta = h("a", { class: "btn", href: "#/i/" + i + "/l/" + firstOpen, text: doneCount(i) ? "Continue with level " + (firstOpen + 1) : "Start level 1" });
    } else {
      cta = h("a", { class: "btn secondary", href: "#/i/" + i + "/done", text: "Island complete" });
    }

    append(app, [
      h("a", { class: "back", href: "#/", text: "← All islands" }),
      h("div", { class: "island-head" }, [
        h("span", { class: "emoji", "aria-hidden": "true", text: isl.emoji }),
        h("div", null, [
          h("h1", { text: isl.name, tabindex: "-1", "data-focus": "" }),
          h("p", { text: isl.blurb })
        ])
      ]),
      h("section", { class: "card" }, [
        h("h2", { text: "Quick lesson" }),
        h("ul", null, learn.points.map(function (p) { return h("li", { text: p }); })),
        codeBlock(learn.code),
        goalBox(learn.output, "Output")
      ]),
      h("h2", { text: "Levels" }),
      path,
      cta
    ]);
  }

  function viewIslandDone(i) {
    var isl = ISLANDS[i];
    setTitle(isl.name + " complete");
    var last = i === ISLANDS.length - 1;
    var maxStars = levelCount(i) * 3;
    append(app, h("section", { class: "card celebrate" }, [
      h("div", { class: "big", "aria-hidden": "true", text: isl.emoji }),
      h("h1", { text: isl.name + " complete!", tabindex: "-1", "data-focus": "" }),
      h("p", { text: "You earned " + islandStars(i) + " of " + maxStars + " stars here. Replay a level any time to collect more stars." }),
      h("div", { class: "row" }, [
        last
          ? h("a", { class: "btn", href: "#/finish", text: "Claim your badge" })
          : h("a", { class: "btn", href: "#/i/" + (i + 1), text: "Next: " + ISLANDS[i + 1].name }),
        h("a", { class: "btn quiet", href: "#/", text: "All islands" })
      ])
    ]));
  }

  function viewFinish() {
    setTitle("Python Beginner");
    var maxStars = totalLevels() * 3;
    var got = 0;
    ISLANDS.forEach(function (_, i) { got += islandStars(i); });
    append(app, h("section", { class: "card celebrate" }, [
      h("div", { class: "big", "aria-hidden": "true", text: "🏆" }),
      h("h1", { text: "You are a Python Beginner!", tabindex: "-1", "data-focus": "" }),
      h("p", { text: "You finished all " + ISLANDS.length + " islands and " + totalLevels() + " levels with " + got + " of " + maxStars + " stars and " + save.xp + " XP." }),
      h("p", { text: "Next step: try typing real code. Install Python from python.org, or open any free online Python editor, and re-create the programs from this game. Then change them and see what happens." }),
      h("div", { class: "row" }, [
        h("a", { class: "btn", href: "#/", text: "Back to the map" })
      ])
    ]));
  }

  /* ----------------------------------------------------------------- level */

  function viewLevel(i, j) {
    var isl = ISLANDS[i];
    var lv = isl.levels[j];
    var n = levelCount(i);
    setTitle(isl.name + ", level " + (j + 1));

    var hearts = MAX_HEARTS, mistakes = 0, hintsUsed = 0;
    var revealed = false, solved = false, over = false;
    var checkFn = null;

    var heartsEl = h("div", { class: "hearts", role: "img" });
    var play = h("div", { class: "play" });
    var hintList = h("ul", { class: "hint-list", "aria-label": "Hints" });
    var fbWrap = h("div", { "aria-live": "polite", "aria-atomic": "false", role: "status" });
    var hintBtn = h("button", { class: "btn quiet", type: "button" });
    var checkBtn = null;

    function drawHearts(lostIndex) {
      heartsEl.textContent = "";
      heartsEl.setAttribute("aria-label", plural(hearts, "heart") + " left");
      for (var k = 0; k < MAX_HEARTS; k++) {
        heartsEl.appendChild(h("span", { class: "heart" + (k >= hearts ? " lost" : "") + (k === lostIndex ? " pop" : ""), "aria-hidden": "true", text: "♥" }));
      }
    }

    function paintHint() {
      var labels = ["💡 Hint", "💡 Another hint", "💡 Show the answer", "No more hints"];
      hintBtn.textContent = labels[Math.min(hintsUsed, 3)];
      hintBtn.disabled = hintsUsed >= 3 || solved || over;
    }

    function showFb(kind, title, nodes) {
      fbWrap.textContent = "";
      var box = h("div", { class: "fb " + kind });
      if (title) box.appendChild(h("strong", { class: "title", text: title }));
      append(box, nodes);
      fbWrap.appendChild(box);
      return box;
    }

    function lockAll() {
      play.classList.add("locked");
      play.inert = true;
      hintBtn.disabled = true;
      if (checkBtn) checkBtn.disabled = true;
    }

    var ctx = {
      active: function () { return !solved && !over; },
      info: function (msg) { showFb("", "", h("p", { text: msg })); },
      enableCheck: function (on, fn) { if (checkBtn) checkBtn.disabled = !on || !ctx.active(); if (fn) checkFn = fn; },
      wrong: function (msg) {
        if (!ctx.active()) return;
        mistakes++;
        hearts--;
        drawHearts(hearts);
        play.classList.remove("shake");
        void play.offsetWidth;
        play.classList.add("shake");
        if (hearts <= 0) { fail(); return; }
        showFb("bad", "Not quite", h("p", { text: msg + " You have " + plural(hearts, "heart") + " left." }));
      },
      right: function () {
        if (!ctx.active()) return;
        solved = true;
        var stars = revealed ? 1 : Math.max(1, 3 - mistakes - (hintsUsed > 0 ? 1 : 0));
        var old = starsOf(i, j);
        var gain = completeLevel(i, j, stars);
        lockAll();
        paintHint();

        var next;
        if (j + 1 < n) next = { href: "#/i/" + i + "/l/" + (j + 1), label: "Next level" };
        else if (islandComplete(i)) next = { href: "#/i/" + i + "/done", label: "Finish island" };
        else next = { href: "#/i/" + i, label: "Back to island" };

        var note = "";
        if (revealed) note = "You looked at the answer, so this level gives 1 star. Replay it later for more.";
        else if (hintsUsed > 0 || mistakes > 0) note = "Hints and mistakes cost stars. Play it again without them for 3 stars.";
        var cont = h("a", { class: "btn", href: next.href, text: next.label });
        showFb("good", "Correct!", [
          h("div", { class: "result-stars" }, starsNode(stars)),
          h("p", { text: gain > 0 ? "+" + gain + " XP" : (old >= stars ? "No new XP: you already have " + old + (old === 1 ? " star" : " stars") + " here." : "") }),
          h("p", { text: lv.why }),
          note ? h("p", { class: "muted", text: note }) : null,
          h("div", { class: "row" }, [cont, h("a", { class: "btn quiet", href: "#/i/" + i, text: "Island map" })])
        ]);
        cont.focus({ preventScroll: false });
      }
    };

    function fail() {
      over = true;
      lockAll();
      paintHint();
      var again = h("button", { class: "btn", type: "button", text: "Try again", onclick: render });
      showFb("bad", "Out of hearts", [
        h("p", { text: "That is okay. Mistakes are how we learn. Here is the answer and why it works:" }),
        built.solution(),
        h("p", { text: lv.why }),
        h("div", { class: "row" }, [again, h("a", { class: "btn quiet", href: "#/i/" + i, text: "Island map" })])
      ]);
      again.focus();
    }

    var built = TYPES[lv.type](lv, ctx);
    play.appendChild(built.node);

    hintBtn.addEventListener("click", function () {
      if (hintsUsed >= 3 || !ctx.active()) return;
      hintsUsed++;
      if (hintsUsed <= 2) {
        hintList.appendChild(h("li", null, [h("b", { text: "Hint " + hintsUsed + ": " }), lv.hints[hintsUsed - 1]]));
      } else {
        revealed = true;
        hintList.appendChild(h("li", null, [h("b", { text: "Answer: " }), built.solution()]));
      }
      paintHint();
    });

    var tools = h("div", { class: "tools" }, [hintBtn]);
    if (lv.type === "fill" || lv.type === "order") {
      checkBtn = h("button", { class: "btn", type: "button", text: "Check", disabled: true, onclick: function () { if (checkFn && ctx.active()) checkFn(); } });
      tools.appendChild(checkBtn);
    }

    drawHearts(-1);
    paintHint();

    append(app, [
      h("div", { class: "lvl-top" }, [
        h("a", { class: "x", href: "#/i/" + i, "aria-label": "Leave this level and go back to the island", text: "✕" }),
        h("div", null, [
          h("div", { class: "meter-label", text: isl.name + " · Level " + (j + 1) + " of " + n }),
          h("progress", { max: n, value: j, "aria-label": "Level progress" })
        ]),
        heartsEl
      ]),
      h("h1", { class: "q", tabindex: "-1", "data-focus": "", text: lv.q }),
      play,
      tools,
      h("p", { class: "muted", text: "A hint costs one star. Showing the answer leaves you 1 star." }),
      hintList,
      fbWrap
    ]);
  }

  /* ----------------------------------------------------------- level types */

  var TYPES = {};

  // Choose the output --------------------------------------------------------
  TYPES.output = function (lv, ctx) {
    var items = shuffle(lv.options.map(function (t, idx) { return { t: t, idx: idx }; }));
    var grid = h("div", { class: "opts", role: "group", "aria-label": "Answer choices" });
    var buttons = [];
    items.forEach(function (it, pos) {
      var btn = h("button", { type: "button", class: "opt", onclick: function () {
        if (!ctx.active()) return;
        if (it.idx === lv.answer) {
          btn.classList.add("good");
          buttons.forEach(function (b) { b.disabled = true; });
          ctx.right();
        } else {
          btn.classList.add("bad");
          btn.disabled = true;
          ctx.wrong("That is not the right answer. Go through the code one line at a time.");
        }
      } }, [
        h("span", { class: "ltr", "aria-hidden": "true", text: String.fromCharCode(65 + pos) }),
        h("span", { text: it.t })
      ]);
      buttons.push(btn);
      grid.appendChild(btn);
    });
    return {
      node: h("div", null, [codeBlock(lv.code), h("p", { class: "sub", text: "Pick one answer:" }), grid]),
      solution: function () { return goalBox(lv.options[lv.answer], "Correct answer"); }
    };
  };

  // Fill the blank -----------------------------------------------------------
  TYPES.fill = function (lv, ctx) {
    var count = lv.answers.length;
    var values = [];
    for (var k = 0; k < count; k++) values.push(null);
    var chips = shuffle(lv.choices.map(function (t, idx) { return { t: t, idx: idx }; }));
    var active = 0;
    var blankBtns = [];
    var chipBtns = [];

    function firstEmpty() {
      for (var q = 0; q < count; q++) if (values[q] === null) return q;
      return -1;
    }

    function refresh() {
      blankBtns.forEach(function (b, q) {
        var v = values[q];
        b.textContent = v === null ? "   " : chips.filter(function (c) { return c.idx === v; })[0].t;
        b.className = "blank" + (v !== null ? " filled" : "") + (q === active ? " active" : "");
        b.setAttribute("aria-label", "Blank " + (q + 1) + (v === null ? ", empty" : ", " + b.textContent + ". Tap to clear"));
      });
      chipBtns.forEach(function (b, q) { b.disabled = values.indexOf(chips[q].idx) !== -1; });
      ctx.enableCheck(firstEmpty() === -1);
    }

    var codeNode = codeBlock(lv.code, { blank: function (q) {
      var b = h("button", { type: "button", class: "blank", onclick: function () {
        if (!ctx.active()) return;
        if (values[q] !== null) values[q] = null;
        active = q;
        refresh();
      } });
      blankBtns[q] = b;
      return b;
    } });

    var pool = h("div", { class: "pool", role: "group", "aria-label": "Words to place" });
    chips.forEach(function (c, q) {
      var b = h("button", { type: "button", class: "tok", text: c.t, onclick: function () {
        if (!ctx.active()) return;
        var target = values[active] === null ? active : (firstEmpty() === -1 ? active : firstEmpty());
        values[target] = c.idx;
        var nextEmpty = firstEmpty();
        active = nextEmpty === -1 ? target : nextEmpty;
        refresh();
      } });
      chipBtns[q] = b;
      pool.appendChild(b);
    });

    ctx.enableCheck(false, function () {
      var ok = values.every(function (v, q) { return lv.choices[v] === lv.answers[q]; });
      if (ok) ctx.right();
      else ctx.wrong("A blank is not right yet. Compare your code with the goal output.");
    });
    refresh();

    return {
      node: h("div", null, [
        codeNode,
        goalBox(lv.goal),
        h("p", { class: "sub", text: "Tap a word to put it in the blank. Tap a filled blank to clear it." }),
        pool
      ]),
      solution: function () {
        return codeBlock(lv.code, { blank: function (q) { return span("ans n", lv.answers[q]); } });
      }
    };
  };

  // Fix the bug --------------------------------------------------------------
  TYPES.bug = function (lv, ctx) {
    var step = 1;
    var wrongPicks = {};
    var stage = h("div");

    function buildCode() {
      return codeBlock(lv.code, {
        pick: function (idx) {
          if (step !== 1) return null;
          return function () {
            if (!ctx.active() || step !== 1) return;
            if (idx === lv.bug) {
              step = 2;
              ctx.info("Yes, line " + (idx + 1) + " is the bug. Now pick the line that fixes it.");
              stage.textContent = "";
              stage.appendChild(buildStage());
              showFixes();
            } else {
              wrongPicks[idx] = true;
              ctx.wrong("Line " + (idx + 1) + " is fine. Look for the line that crashes or gives the wrong result.");
              stage.textContent = "";
              stage.appendChild(buildStage());
              var again = stage.querySelector("button.line.pick:not(:disabled)");
              if (again && ctx.active()) again.focus({ preventScroll: true });
            }
          };
        },
        mark: step === 2 ? (function () { var m = {}; m[lv.bug] = "found"; return m; })() : markWrong()
      });
    }

    function markWrong() {
      var m = {};
      Object.keys(wrongPicks).forEach(function (k) { m[k] = "wrongpick"; });
      return m;
    }

    var fixHost = h("div");
    function buildStage() {
      var box = h("div");
      var code = buildCode();
      // lines already tried stay visible (struck through) but cannot be tapped again
      Object.keys(wrongPicks).forEach(function (k) {
        var row = code.children[Number(k)];
        if (row && row.tagName === "BUTTON") row.disabled = true;
      });
      box.appendChild(code);
      box.appendChild(goalBox(lv.goal));
      if (step === 1) box.appendChild(h("p", { class: "sub", text: "Tap the line that has the bug:" }));
      return box;
    }

    function showFixes() {
      var items = shuffle(lv.fixes.map(function (t, idx) { return { t: t, idx: idx }; }));
      var grid = h("div", { class: "opts", role: "group", "aria-label": "Possible fixes" });
      var buttons = [];
      items.forEach(function (it, pos) {
        var btn = h("button", { type: "button", class: "opt", onclick: function () {
          if (!ctx.active()) return;
          if (it.idx === lv.fix) {
            btn.classList.add("good");
            buttons.forEach(function (b) { b.disabled = true; });
            var rep = {}; rep[lv.bug] = lv.fixes[lv.fix];
            var mark = {}; mark[lv.bug] = "fixed";
            stage.textContent = "";
            stage.appendChild(h("div", null, [codeBlock(lv.code, { replace: rep, mark: mark }), goalBox(lv.goal)]));
            fixHost.textContent = "";
            ctx.right();
          } else {
            btn.classList.add("bad");
            btn.disabled = true;
            ctx.wrong("That line does not fix the problem or does not give the goal output.");
          }
        } }, [
          h("span", { class: "ltr", "aria-hidden": "true", text: String.fromCharCode(65 + pos) }),
          h("span", { text: it.t })
        ]);
        buttons.push(btn);
        grid.appendChild(btn);
      });
      fixHost.textContent = "";
      fixHost.appendChild(h("p", { class: "sub", text: "Which line should replace line " + (lv.bug + 1) + "?" }));
      fixHost.appendChild(grid);
    }

    stage.appendChild(buildStage());
    return {
      node: h("div", null, [stage, fixHost]),
      solution: function () {
        var rep = {}; rep[lv.bug] = lv.fixes[lv.fix];
        var mark = {}; mark[lv.bug] = "fixed";
        return codeBlock(lv.code, { replace: rep, mark: mark });
      }
    };
  };

  // Arrange the code ---------------------------------------------------------
  TYPES.order = function (lv, ctx) {
    var pieces = lv.lines.map(function (t, idx) { return { t: t, idx: idx, node: null }; });
    var shown = pieces.slice();
    for (var tries = 0; tries < 30; tries++) {
      shown = shuffle(pieces);
      var same = shown.every(function (p, q) { return p.t === lv.lines[q]; });
      if (!same) break;
    }
    var placed = [];
    var stack = h("div", { class: "stack", role: "group", "aria-label": "Your code, first line at the top" });
    var pool = h("div", { class: "pieces", role: "group", "aria-label": "Lines to place" });
    var empty = h("div", { class: "hint-empty", text: "Tap the lines below, in the order they should run." });
    var poolLabel = h("p", { class: "sub", text: "Lines to place:" });

    function layout(focusPiece) {
      stack.textContent = "";
      pool.textContent = "";
      if (!placed.length) stack.appendChild(empty);
      placed.forEach(function (p, q) {
        p.node.setAttribute("aria-label", "Line " + (q + 1) + " of your code: " + p.t.trim() + ". Tap to remove");
        stack.appendChild(p.node);
      });
      shown.forEach(function (p) {
        if (placed.indexOf(p) === -1) {
          p.node.setAttribute("aria-label", p.t.trim() + ". Tap to add");
          pool.appendChild(p.node);
        }
      });
      poolLabel.hidden = placed.length === pieces.length;
      ctx.enableCheck(placed.length === pieces.length);
      if (focusPiece && focusPiece.node.parentNode) focusPiece.node.focus({ preventScroll: true });
    }

    pieces.forEach(function (p) {
      p.node = h("button", { type: "button", class: "piece", text: p.t, onclick: function () {
        if (!ctx.active()) return;
        var at = placed.indexOf(p);
        if (at === -1) placed.push(p); else placed.splice(at, 1);
        layout(p);
      } });
    });

    ctx.enableCheck(false, function () {
      var ok = placed.length === lv.lines.length && placed.every(function (p, q) { return p.t === lv.lines[q]; });
      if (ok) ctx.right();
      else ctx.wrong("The order is not right yet. Run the lines in your head from top to bottom and compare with the goal output.");
    });
    layout(null);

    return {
      node: h("div", null, [
        goalBox(lv.goal),
        h("p", { class: "sub", text: "Your code:" }),
        stack,
        poolLabel,
        pool
      ]),
      solution: function () { return codeBlock(lv.lines); }
    };
  };

  /* ------------------------------------------------------------------ boot */

  paintTheme();
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var onSystemChange = function () { if (!document.documentElement.getAttribute("data-theme")) paintTheme(); };
    if (mq.addEventListener) mq.addEventListener("change", onSystemChange);
    else if (mq.addListener) mq.addListener(onSystemChange);
  }

  if (!ISLANDS.length) {
    app.appendChild(h("p", { class: "notice", text: "The game content could not be loaded. Please reload the page." }));
  } else {
    window.addEventListener("hashchange", render);
    render();
  }
})();
