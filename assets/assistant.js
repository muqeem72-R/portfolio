/* "Ask about Mukeem": a small assistant.
   Layer 1: suggested-question buttons with ready answers.
   Layer 2: keyword search over the facts in assistant-kb.json (English, Hindi, Urdu).
   Layer 3: only when a question is not clear from layer 2, the question and the few matching facts go to /api/chat (Cloudflare Workers AI). */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ text helpers
     The server function (functions/api/chat.js) carries the same norm/detectLang/score code. Keep the two in step. */
  function norm(s) {
    return String(s).toLowerCase().normalize('NFKC')
      .replace(/[يى]/g, 'ی')            // Arabic yeh -> Urdu yeh
      .replace(/ك/g, 'ک')                    // Arabic kaf -> Urdu kaf
      .replace(/[ً-़ٰٟ]/g, '')     // Arabic diacritics and the Devanagari nukta
      .replace(/[^\p{L}\p{N}\p{M}]+/gu, ' ')           // punctuation -> space (letters, digits and vowel signs stay)
      .replace(/\s+/g, ' ').trim();
  }

  function detectLang(text, fallback) {
    var d = (text.match(/[ऀ-ॿ]/g) || []).length;
    var a = (text.match(/[؀-ۿݐ-ݿ]/g) || []).length;
    var l = (text.match(/[A-Za-z]/g) || []).length;
    if (!d && !a && !l) return fallback;
    var m = Math.max(d, a, l);
    return m === d ? 'hi' : (m === a ? 'ur' : 'en');
  }

  function compileKw(k) {
    var strong = k.charAt(0) === '!';                 // a leading "!" marks a strong keyword: enough on its own for a direct answer
    var n = norm(strong ? k.slice(1) : k), latin = /^[a-z0-9 ]+$/.test(n), re = null;
    if (latin) re = new RegExp('(^| )' + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(s|es|ed|ing)?( |$)');
    return { n: n, re: re, w: strong ? 3 : (n.indexOf(' ') >= 0 ? 2 : 1) };
  }

  function buildIndex(kb) {
    var idx = kb.facts.map(function (f) { return { fact: f, kws: f.kw.map(compileKw) }; });
    idx.smalltalk = kb.smalltalk.kw.map(compileKw);
    idx.qmap = {};                                    // the suggested questions, word for word, in every language
    kb.facts.forEach(function (f) { Object.keys(f.q).forEach(function (l) { idx.qmap[norm(f.q[l])] = f.id; }); });
    return idx;
  }

  function matches(t, k) { return k.re ? k.re.test(t) : t.indexOf(k.n) !== -1; }

  function score(q, idx) {
    var t = norm(q), out = [];
    idx.forEach(function (e, order) {
      var s = 0;
      e.kws.forEach(function (k) { if (matches(t, k)) s += k.w; });
      if (s) out.push({ id: e.fact.id, s: s, order: order, fact: e.fact });
    });
    out.sort(function (a, b) { return b.s - a.s || a.order - b.order; });
    return out;
  }

  var THANKS = /thank|thx|shukriya|dhanyavad|धन्यवाद|शुक्रिया|شکریہ/;

  // what to do with a typed question
  function decide(q, idx) {
    var t = norm(q), words = t ? t.split(' ').length : 0, ranked = score(q, idx);
    if (idx.qmap[t]) return { type: 'fact', id: idx.qmap[t], ranked: ranked };
    if (!ranked.length) {
      var small = idx.smalltalk.some(function (k) { return matches(t, k); });
      if (small) return { type: 'smalltalk', thanks: THANKS.test(t) };
      return { type: 'none' };
    }
    var top = ranked[0], second = ranked[1] ? ranked[1].s : 0;
    if (top.s >= 3 || (top.s >= 2 && top.s - second >= 1) || (words <= 3 && top.s >= 1)) return { type: 'fact', id: top.id, ranked: ranked };
    return { type: 'ai', ids: ranked.slice(0, 3).map(function (r) { return r.id; }), ranked: ranked };
  }

  /* ------------------------------------------------------------------ for tests in Node */
  if (typeof module === 'object' && module.exports) {
    module.exports = { norm: norm, detectLang: detectLang, buildIndex: buildIndex, score: score, decide: decide };
  }
  if (typeof document === 'undefined') return;


  /* ------------------------------------------------------------------ widget */
  var root = document.documentElement;
  var STATIC_UI = {
    en: { open: 'Ask a question', title: 'Ask about Mukeem', close: 'Close', send: 'Send', placeholder: 'Type your question…', email: 'Email Mukeem', whatsapp: 'WhatsApp',
          offline: "I couldn't load the assistant. Please email Mukeem." },
    hi: { open: 'सवाल पूछें', title: 'मुकीम के बारे में पूछें', close: 'बंद करें', send: 'भेजें', placeholder: 'अपना सवाल लिखें…', email: 'मुकीम को ईमेल करें', whatsapp: 'व्हाट्सऐप',
          offline: 'मैं सहायक लोड नहीं कर सका। कृपया मुकीम को ईमेल करें।' },
    ur: { open: 'سوال پوچھیں', title: 'مکیم کے بارے میں پوچھیں', close: 'بند کریں', send: 'بھیجیں', placeholder: 'اپنا سوال لکھیں…', email: 'مکیم کو ای میل کریں', whatsapp: 'واٹس ایپ',
          offline: 'میں معاون لوڈ نہیں کر سکا۔ براہِ کرم مکیم کو ای میل کریں۔' }
  };
  var MAX_LEN = 300, MAX_QUESTIONS = 25, MIN_GAP_MS = 2500;
  var FACES = ['😞', '😕', '😐', '🙂', '😍'];

  var kb = null, idx = null, loading = null;
  var asked = 0, lastAt = 0, busy = false, greeted = false, phase = 'chat', answersGiven = 0;
  var used = false, feedbackOpen = false, rating = 0;

  /* ---- small helpers */
  function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* private mode: keep going without it */ } }
  var SID = (function () {
    var s = ssGet('ask-sid');
    if (s && /^[a-f0-9]{16}$/.test(s)) return s;
    var a = new Uint8Array(8);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a); else for (var i = 0; i < 8; i++) a[i] = Math.floor(Math.random() * 256);
    s = Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    ssSet('ask-sid', s);
    return s;
  })();
  var name = ssGet('ask-name') || '';
  var recorded = ssGet('ask-rec') === '1';
  var fbDone = ssGet('ask-fb') === '1';

  function el(tag, props, kids) {
    var n = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      if (k === 'text') n.textContent = props[k];
      else if (k === 'class') n.className = props[k];
      else n.setAttribute(k, props[k]);
    });
    (kids || []).forEach(function (c) { n.appendChild(c); });
    return n;
  }
  function uiLang() { var l = (root.getAttribute('lang') || 'en').slice(0, 2); return l === 'hi' || l === 'ur' ? l : 'en'; }
  function T(key) {
    var l = uiLang();
    if (kb && kb.ui[l] && kb.ui[l][key]) return kb.ui[l][key];
    return (STATIC_UI[l] && STATIC_UI[l][key]) || (STATIC_UI.en[key]) || '';
  }
  function TN(key) { return T(key).replace('{name}', name); }
  function factById(id) { for (var i = 0; i < kb.facts.length; i++) if (kb.facts[i].id === id) return kb.facts[i]; return null; }
  function factText(f, lang) { return f.a[lang] || f.a.en; }

  // contact details are read from the page itself, so they are written in one place only
  var emailLink = document.getElementById('email-link');
  var waLink = document.querySelector('a.wa');
  var EMAIL = emailLink ? emailLink.textContent.trim() : '';
  var WA = waLink ? waLink.getAttribute('href') : '';
  function mailto(subject, body) {
    return EMAIL ? 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body) : '#';
  }

  /* ---- the elements */
  var fab = el('button', { class: 'ask-fab', id: 'ask-fab', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'ask-panel' });
  fab.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.5-4.6A8 8 0 1 1 21 12z"/></svg>';
  var fabText = el('span', { class: 'ask-fab-text' });
  fab.appendChild(fabText);

  var panel = el('section', { class: 'ask-panel', id: 'ask-panel', role: 'dialog', 'aria-labelledby': 'ask-title' });
  panel.hidden = true;
  var title = el('div', { class: 'ask-title', id: 'ask-title' });
  var badge = el('span', { class: 'ask-badge' });
  var startOverBtn = el('button', { class: 'ask-link', type: 'button' });
  var closeBtn = el('button', { class: 'ask-close', type: 'button' });
  closeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var log = el('div', { class: 'ask-log', role: 'log', 'aria-live': 'polite', 'aria-relevant': 'additions' });
  var chips = el('div', { class: 'ask-chips', role: 'group' });
  var input = el('input', { class: 'ask-input', id: 'ask-input', type: 'text', maxlength: String(MAX_LEN), autocomplete: 'off', enterkeyhint: 'send' });
  var inputLabel = el('label', { class: 'visually-hidden', for: 'ask-input' });
  var send = el('button', { class: 'btn primary small ask-send', type: 'submit' });
  var form = el('form', { class: 'ask-form' }, [inputLabel, input, send]);
  var contact = el('div', { class: 'ask-contact', role: 'group' });
  var mailBtn = el('a', { class: 'btn primary small', href: mailto('Hello Mukeem', '') });
  var waBtn = el('a', { class: 'btn wa small', href: WA || '#', target: '_blank', rel: 'noopener noreferrer' });
  contact.appendChild(mailBtn);                       // email first: it is the preferred way to reach Mukeem
  if (WA) contact.appendChild(waBtn);
  var note = el('p', { class: 'ask-note' });

  // the rating step (shown instead of the conversation when the visitor tries to leave)
  var fbTitle = el('div', { class: 'ask-fb-title' });
  var fbSub = el('p', { class: 'ask-fb-sub' });
  var faces = el('div', { class: 'ask-faces', role: 'group' });
  var faceBtns = FACES.map(function (f, i) {
    var b = el('button', { class: 'ask-face', type: 'button', 'aria-pressed': 'false', text: f });
    b.addEventListener('click', function () { chooseRating(i + 1); });
    faces.appendChild(b);
    return b;
  });
  var fbNeed = el('p', { class: 'ask-fb-need', role: 'alert' });
  fbNeed.hidden = true;
  var fbLabel = el('label', { class: 'ask-fb-label', for: 'ask-fb-text' });
  var fbText = el('textarea', { class: 'ask-fb-text', id: 'ask-fb-text', rows: '3', maxlength: '500' });
  var fbSubmit = el('button', { class: 'btn primary ask-fb-submit', type: 'button' });
  var fbStatus = el('div', { class: 'ask-fb-status', role: 'status', 'aria-live': 'polite' });
  var fbNote = el('p', { class: 'ask-note' });
  var fbMore = el('div', { class: 'ask-fb-more' }, [fbLabel, fbText, fbSubmit]);
  fbMore.hidden = true;
  var fbBox = el('div', { class: 'ask-fb' }, [fbTitle, fbSub, faces, fbNeed, fbMore, fbStatus, fbNote]);
  fbBox.hidden = true;

  panel.appendChild(el('div', { class: 'ask-head' }, [el('div', { class: 'ask-head-main' }, [title, badge]), el('div', { class: 'ask-head-tools' }, [startOverBtn, closeBtn])]));
  [log, chips, form, contact, note, fbBox].forEach(function (n) { panel.appendChild(n); });
  document.body.appendChild(panel);
  document.body.appendChild(fab);

  function paintStatic() {
    fabText.textContent = T('open');
    fab.setAttribute('aria-label', T('open'));
    title.textContent = T('title');
    badge.textContent = T('badge');
    startOverBtn.textContent = T('startOver');
    closeBtn.setAttribute('aria-label', T('close'));
    inputLabel.textContent = phase === 'name' ? T('namePlaceholder') : T('placeholder');
    input.setAttribute('placeholder', phase === 'name' ? T('namePlaceholder') : T('placeholder'));
    send.textContent = T('send');
    chips.setAttribute('aria-label', T('chips'));
    contact.setAttribute('aria-label', T('contactLabel'));
    mailBtn.textContent = T('email');
    waBtn.textContent = T('whatsapp');
    note.textContent = T('note');
    fbTitle.textContent = T('fbTitle');
    fbSub.textContent = T('fbSub');
    faces.setAttribute('aria-label', T('fbTitle'));
    faceBtns.forEach(function (b, i) { b.setAttribute('aria-label', (i + 1) + ' / 5: ' + T('r' + (i + 1))); b.setAttribute('title', T('r' + (i + 1))); });
    fbNeed.textContent = T('fbNeeded');
    fbLabel.textContent = T('fbLabel');
    fbText.setAttribute('placeholder', T('fbPlaceholder'));
    fbSubmit.textContent = T('fbSubmit');
    fbNote.textContent = T('fbNote');
  }
  function paintChips() {
    chips.textContent = '';
    if (!kb) return;
    if (phase === 'name') {                                   // while the name is being asked, the only button is "Skip"
      var sk = el('button', { class: 'ask-chip', type: 'button', text: T('skip') });
      sk.addEventListener('click', skipName);
      chips.appendChild(sk);
      return;
    }
    var l = uiLang();
    kb.chips.forEach(function (id) {
      var f = factById(id); if (!f) return;
      chips.appendChild(chipFor(f, l));
    });
  }
  function chipFor(f, l) {
    var b = el('button', { class: 'ask-chip', type: 'button', text: f.q[l] || f.q.en });
    b.addEventListener('click', function () { askChip(f.id); });
    return b;
  }

  /* ---- messages */
  function addMsg(who, text, opts) {
    opts = opts || {};
    var m = el('div', { class: 'ask-msg ask-' + who });
    m.appendChild(el('span', { class: 'visually-hidden', text: (who === 'user' ? T('you') : T('bot')) + ': ' }));
    m.appendChild(el('span', { class: 'ask-text', text: text }));
    if (opts.aiTag) m.appendChild(el('small', { class: 'ask-tag', text: T('aiTag') }));
    if (opts.small) m.appendChild(el('small', { class: 'ask-tag', text: opts.small }));
    if (opts.actions && opts.actions.length) m.appendChild(el('div', { class: 'ask-actions' }, opts.actions));
    log.appendChild(m);
    log.scrollTop = log.scrollHeight;
    return m;
  }
  function emailAction(question) {
    return el('a', { class: 'btn small ask-act', href: mailto('Question from ' + (name || 'a visitor'), question + (name ? '\n\n— ' + name : '')), text: T('emailThis') });
  }
  function setBusy(v) {
    busy = v;
    input.disabled = v; send.disabled = v;
    if (!v) input.focus({ preventScroll: true });
  }

  // "You might also ask" and "See on the page" under an answer; only the latest answer keeps them
  function attachFollow(msg, fact) {
    Array.prototype.forEach.call(log.querySelectorAll('.ask-follow'), function (n) { n.remove(); });
    var l = uiLang(), box = el('div', { class: 'ask-follow' });
    var related = (fact.related || []).map(factById).filter(Boolean);
    if (related.length) {
      box.appendChild(el('div', { class: 'ask-follow-label', text: T('followUp') }));
      var row = el('div', { class: 'ask-follow-row' });
      related.forEach(function (f) { row.appendChild(chipFor(f, l)); });
      box.appendChild(row);
    }
    var navA = fact.see ? document.querySelector('#nav a[href="' + fact.see + '"]') : null;
    if (navA) {
      var see = el('a', { class: 'ask-see', href: fact.see, text: T('seeOnPage') + ' ' + navA.textContent.trim() });
      see.addEventListener('click', function () { if (window.matchMedia('(max-width: 520px)').matches) minimize(); });
      box.appendChild(see);
    }
    if (box.firstChild) msg.appendChild(box);
    log.scrollTop = log.scrollHeight;
  }

  // the answer to a fact; the visitor's name opens the first answer and then every third one
  function answerFact(fact, lang) {
    var text = factText(fact, lang);
    if (name && answersGiven % 3 === 0) text = (T('sure').replace('{name}', name)) + ' ' + text;
    answersGiven++;
    var m = addMsg('bot', text);
    attachFollow(m, fact);
  }

  /* ---- loading the facts */
  function ensureKB() {
    if (kb) return Promise.resolve(true);
    if (!loading) {
      loading = fetch('assets/assistant-kb.json')
        .then(function (r) { if (!r.ok) throw new Error('kb'); return r.json(); })
        .then(function (j) { kb = j; idx = buildIndex(j); paintStatic(); paintChips(); return true; })
        .catch(function () { loading = null; return false; });
    }
    return loading;
  }

  /* ---- starting: ask the name first */
  function showChatStart() {
    phase = 'chat'; paintStatic(); paintChips();
    addMsg('bot', name ? TN('nameHello') : T('greeting'));
  }
  function startConversation() {
    greeted = true;
    if (name) { showChatStart(); return; }
    phase = 'name'; paintStatic(); paintChips();
    addMsg('bot', T('askName'), { small: T('nameNote') });
  }
  function skipName() {
    if (phase !== 'name') return;
    addMsg('user', T('skip'));
    showChatStart();
  }

  var PREFIX = /^(my name is|name is|i am|i'm|im|this is|call me|it's|its|mera naam|mera name|main|मेरा नाम है|मेरा नाम|मैं|मै|میرا نام ہے|میرا نام|میں)\s+/i;
  var SUFFIX = /\s+(hai|है|ہے|here)$/i;
  function cleanName(t) {
    var n = t.trim(), prev;
    do { prev = n; n = n.replace(PREFIX, ''); } while (n !== prev);
    n = n.replace(SUFFIX, '').replace(/<[^>]*>/g, ' ').replace(/[^\p{L}\p{M} .'-]/gu, '').replace(/\s+/g, ' ').trim();
    n = n.split(' ').slice(0, 3).join(' ').slice(0, 40).trim();
    return /\p{L}/u.test(n) ? n : '';
  }
  function looksLikeQuestion(t) {
    if (/[?؟]/.test(t)) return true;
    if (norm(t).split(' ').length > 5) return true;
    var r = score(t, idx);
    return r.length > 0 && r[0].s >= 2;
  }
  function handleName(text) {
    if (looksLikeQuestion(text)) {                     // they went straight to a question: skip the name, answer it
      showChatStart(); ask(text); return;
    }
    var n = cleanName(text);
    input.value = '';
    addMsg('user', text);
    if (!n) { addMsg('bot', T('askName')); return; }
    name = n; ssSet('ask-name', n);
    showChatStart();
  }

  /* ---- recording who used the assistant (name, language and time: written once, when the first question is asked) */
  function postJSON(url, body) {
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 8000);
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { clearTimeout(timer); return r; }, function (e) { clearTimeout(timer); throw e; });
  }
  function recordVisit() {
    if (recorded) return;
    recorded = true; ssSet('ask-rec', '1');
    postJSON('/api/feedback', { kind: 'visit', sid: SID, name: name, lang: uiLang() }).catch(function () { /* the conversation does not depend on it */ });
  }

  /* ---- asking */
  function markUsed() { used = true; recordVisit(); }

  function askChip(id) {
    if (busy || phase !== 'chat') return;
    var f = factById(id); if (!f) return;
    markUsed(); asked++;
    addMsg('user', f.q[uiLang()] || f.q.en);
    answerFact(f, uiLang());
  }

  function callAI(q, lang) {
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 20000);
    return fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: q, lang: lang, name: name }), signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) {
      clearTimeout(timer);
      if (r.status === 429) throw new Error('rate');
      if (!r.ok) throw new Error('down');
      return r.json();
    }).then(function (j) {
      if (!j || typeof j.answer !== 'string' || !j.answer.trim()) throw new Error('down');
      return j.answer.trim();
    }).catch(function (e) { clearTimeout(timer); throw (e && (e.message === 'rate' || e.message === 'down')) ? e : new Error('net'); });
  }

  function ask(text) {
    text = (text || '').trim();
    if (!text || busy) return;
    if (!kb) { addMsg('user', text); addMsg('bot', T('offline')); input.value = ''; return; }
    if (phase === 'name') { handleName(text); return; }
    if (text.length > MAX_LEN) { addMsg('bot', T('tooLong')); return; }
    var now = Date.now();
    if (asked >= MAX_QUESTIONS || now - lastAt < MIN_GAP_MS) { addMsg('user', text); addMsg('bot', T('rateLimited')); input.value = ''; return; }
    lastAt = now; asked++;
    markUsed();
    addMsg('user', text);
    input.value = '';

    var lang = detectLang(text, uiLang());
    var d = decide(text, idx);
    if (d.type === 'smalltalk') { addMsg('bot', d.thanks ? (name ? TN('sure') + ' ' : '') + T('thanks') : (name ? TN('nameHello') : T('greeting'))); return; }
    if (d.type === 'none') { addMsg('bot', T('notCovered'), { actions: [emailAction(text)] }); return; }
    if (d.type === 'fact') { answerFact(factById(d.id), lang); return; }

    // not clear from the facts alone: ask the AI, which only sees the best-matching facts
    var best = factById(d.ids[0]);
    setBusy(true);
    var thinking = addMsg('bot', T('thinking'));
    callAI(text, lang).then(function (answer) {
      thinking.remove(); addMsg('bot', answer, { aiTag: true });
    }).catch(function (e) {
      thinking.remove();
      if (e.message === 'rate') addMsg('bot', T('rateLimited'));
      else if (e.message === 'net') addMsg('bot', T('offline'), { actions: [emailAction(text)] });
      else { addMsg('bot', T('aiDown'), { actions: [emailAction(text)] }); answerFact(best, lang); }
    }).then(function () { setBusy(false); });
  }

  /* ---- the rating step */
  function openFeedback() {
    feedbackOpen = true; rating = 0;
    panel.classList.add('ask-fbmode');
    fbBox.hidden = false; fbMore.hidden = true; fbNeed.hidden = true; fbStatus.textContent = '';
    faceBtns.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); b.classList.remove('is-on'); b.disabled = false; });
    fbText.value = ''; fbText.disabled = false; fbSubmit.disabled = false;
    closeBtn.setAttribute('aria-disabled', 'true');
    faceBtns[3].focus({ preventScroll: true });
  }
  function chooseRating(n) {
    rating = n;
    faceBtns.forEach(function (b, i) { var on = i + 1 === n; b.setAttribute('aria-pressed', String(on)); b.classList.toggle('is-on', on); });
    fbNeed.hidden = true;
    fbMore.hidden = false;
    closeBtn.setAttribute('aria-disabled', 'false');
    fbStatus.textContent = T('r' + n);
  }
  function endFeedback() {
    fbDone = true; ssSet('ask-fb', '1');
    feedbackOpen = false;
    panel.classList.remove('ask-fbmode');
    fbBox.hidden = true;
    hardClose();
  }
  function submitFeedback() {
    if (!rating) { needRating(); return; }
    var text = fbText.value.trim().slice(0, 500);
    faceBtns.forEach(function (b) { b.disabled = true; });
    fbText.disabled = true; fbSubmit.disabled = true;
    fbStatus.textContent = T('fbSaving');
    postJSON('/api/feedback', { kind: 'feedback', sid: SID, rating: rating, text: text, name: name, lang: uiLang(), asked: asked })
      .then(function (r) { if (!r.ok) throw new Error('save'); })
      .then(function () {
        fbStatus.textContent = name ? TN('fbThanksName') : T('fbThanks');
        setTimeout(endFeedback, 1400);
      })
      .catch(function () {                              // could not be saved: offer email, and never keep the visitor stuck
        fbStatus.textContent = T('fbFail');
        var body = rating + '/5 ' + FACES[rating - 1] + (text ? '\n\n' + text : '') + (name ? '\n\n— ' + name : '');
        fbStatus.appendChild(document.createElement('br'));
        fbStatus.appendChild(el('a', { class: 'btn small ask-act', href: mailto('Feedback on the assistant', body), text: T('fbEmail') }));
        var c = el('button', { class: 'btn small', type: 'button', text: T('fbClose') });
        c.addEventListener('click', endFeedback);
        fbStatus.appendChild(c);
      });
  }
  function needRating() {
    fbNeed.hidden = false;
    faceBtns[0].focus({ preventScroll: true });
  }

  /* ---- opening and closing */
  function open() {
    function show(ok) {
      panel.hidden = false;
      fab.setAttribute('aria-expanded', 'true');
      if (ok) { if (!greeted) startConversation(); }
      else if (!log.firstChild) addMsg('bot', T('offline'));
      if (feedbackOpen) faceBtns[Math.max(rating, 1) - 1].focus({ preventScroll: true }); else input.focus({ preventScroll: true });
    }
    if (kb) show(true); else ensureKB().then(show);
  }
  function hardClose() {
    panel.hidden = true;
    fab.setAttribute('aria-expanded', 'false');
    fab.focus({ preventScroll: true });
  }
  function minimize() {                                  // hides the panel without ending the conversation (used by the "See on the page" links on phones)
    panel.hidden = true;
    fab.setAttribute('aria-expanded', 'false');
  }
  // leaving: after the assistant has been used, a rating comes first; the panel closes once a face is chosen
  function requestClose() {
    if (feedbackOpen) { if (rating) submitFeedback(); else needRating(); return; }
    if (used && !fbDone) { openFeedback(); return; }
    hardClose();
  }
  function startOver() {
    if (busy) return;
    log.textContent = ''; asked = 0; answersGiven = 0; greeted = false;
    startConversation();
    input.focus({ preventScroll: true });
  }

  fab.addEventListener('click', function () { if (panel.hidden) open(); else requestClose(); });
  closeBtn.addEventListener('click', requestClose);
  startOverBtn.addEventListener('click', startOver);
  fbSubmit.addEventListener('click', submitFeedback);
  panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.stopPropagation(); requestClose(); } });
  form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); });

  // follow the site language (the English / Hindi / Urdu switch)
  new MutationObserver(function () { paintStatic(); paintChips(); }).observe(root, { attributes: true, attributeFilter: ['lang'] });

  paintStatic();
  // fetch the facts once the browser is idle, so the first open is instant
  (window.requestIdleCallback || function (f) { setTimeout(f, 1500); })(function () { ensureKB(); });
})();
