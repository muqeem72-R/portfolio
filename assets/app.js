(function () {
  'use strict';

  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function store(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, val);
    } catch (e) { return null; }
  }

  function el(tag, props, children) {
    var n = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      if (k === 'text') n.textContent = props[k];
      else if (k === 'class') n.className = props[k];
      else n.setAttribute(k, props[k]);
    });
    (children || []).forEach(function (c) { n.appendChild(c); });
    return n;
  }

  /* ---------------- Theme ---------------- */
  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    var m = $('meta[name="theme-color"]');
    if (m) m.setAttribute('content', t === 'dark' ? '#0b1020' : '#f7f8fc');
  }
  var savedTheme = store('theme');
  applyTheme(savedTheme || (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
  $('#theme').addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    store('theme', next);
  });

  /* ---------------- Language (English / Hindi / Urdu) ---------------- */
  var I18N = {
    hi: {
      'skip': 'सामग्री पर जाएँ',
      'nav.about': 'परिचय', 'nav.expertise': 'विशेषज्ञता', 'nav.try': 'आज़माएँ', 'nav.lab': 'लैब', 'nav.projects': 'प्रोजेक्ट',
      'nav.education': 'शिक्षा', 'nav.learning': 'कोर्स', 'nav.profiles': 'प्रोफ़ाइल', 'nav.contact': 'संपर्क',
      'hero.badge': 'AI ट्रेनर भूमिकाओं के लिए उपलब्ध',
      'hero.role': 'एजेंटिक और रोबोटिक AI ट्रेनर',
      'hero.summary': 'जामिया मिल्लिया इस्लामिया में M.Sc. गणित (कंप्यूटर साइंस सहित) का छात्र। गणितीय तर्क, C और Java प्रोग्रामिंग, कंप्यूटर साइंस और भौतिक प्रणालियों की समझ के साथ मैं AI ट्रेनिंग कार्यों में चरण-दर-चरण विश्लेषण, कोड ट्रेसिंग और वैज्ञानिक तर्क लाता हूँ। हिंदी और उर्दू मेरी मातृभाषाएँ हैं और अंग्रेज़ी में मेरी पेशेवर दक्षता है।',
      'hero.resume': 'रिज़्यूमे डाउनलोड करें', 'hero.contact': 'संपर्क करें',
      'facts.study': 'अध्ययन', 'facts.uni': 'विश्वविद्यालय', 'facts.core': 'मुख्य ताकत', 'facts.lang': 'भाषाएँ', 'facts.time': 'स्थानीय समय',
      'stats.papers': 'शोध पत्र पढ़े', 'stats.subjects': 'विषय क्षेत्र', 'stats.langs': 'भाषाएँ', 'stats.certs': 'ऑनलाइन कोर्स और प्रमाणपत्र',
      'about.title': 'मेरे बारे में',
      'about.lead': 'बहु-विषयक विज्ञान पृष्ठभूमि, जिसे मैं AI सिस्टम के मूल्यांकन और सुधार में लगाता हूँ।',
      'expertise.title': 'विशेषज्ञता',
      'expertise.lead': 'कोई विषय चुनें और देखें कि मैंने क्या पढ़ा है और AI ट्रेनिंग में वह कहाँ काम आता है।',
      'try.title': 'आज़माएँ: तर्क की जाँच',
      'try.lead': 'हर बार नए सवाल, ज़्यादातर गणित के और कुछ कोडिंग के। एक हल करें तो उसकी जगह नया आ जाता है। न साइन-अप, न कुछ सेव होता है।',
      'try.shuffle': 'नए सवाल',
      'lab.title': 'इंटरएक्टिव लैब',
      'lab.lead': 'तीन छोटे टूल जो दिखाते हैं कि मैं गणित कैसे जाँचता हूँ, संख्यात्मक विधियाँ कैसे चलाता हूँ और रोबोट के कामों पर कैसे तर्क करता हूँ।',
      'projects.title': 'प्रोजेक्ट',
      'projects.lead': 'अकादमिक कार्य; पूरा होते ही और काम GitHub पर जुड़ते रहेंगे।',
      'education.title': 'शिक्षा',
      'education.lead': 'विवरण देखने के लिए किसी प्रविष्टि पर क्लिक करें।',
      'learning.title': 'ऑनलाइन कोर्स और प्रमाणपत्र',
      'learning.lead': 'कक्षा से बाहर कोडिंग और डेटा प्लेटफ़ॉर्म पर सीखना। ये ऊपर की औपचारिक शिक्षा से अलग हैं।',
      'profiles.title': 'ऑनलाइन मुझे यहाँ पाएँ',
      'profiles.lead': 'मेरे सार्वजनिक प्रोफ़ाइल, एक जगह पर।',
      'contact.title': 'बात करें',
      'contact.lead': 'AI ट्रेनिंग या इवैल्युएशन की भूमिका के लिए हायर कर रहे हैं? ईमेल या व्हाट्सऐप मुझ तक पहुँचने का सबसे तेज़ तरीका है।',
      'contact.copy': 'ईमेल कॉपी करें', 'contact.write': 'ईमेल लिखें', 'contact.whatsapp': 'व्हाट्सऐप पर संदेश भेजें',
      'footer.top': 'ऊपर जाएँ ↑',
      'msg.copied': 'ईमेल कॉपी हो गया।'
    },
    ur: {
      'skip': 'مواد پر جائیں',
      'nav.about': 'تعارف', 'nav.expertise': 'مہارت', 'nav.try': 'آزمائیں', 'nav.lab': 'لیب', 'nav.projects': 'پروجیکٹس',
      'nav.education': 'تعلیم', 'nav.learning': 'کورسز', 'nav.profiles': 'پروفائلز', 'nav.contact': 'رابطہ',
      'hero.badge': 'اے آئی ٹرینر کے کرداروں کے لیے دستیاب',
      'hero.role': 'ایجنٹک اور روبوٹک اے آئی ٹرینر',
      'hero.summary': 'جامعہ ملیہ اسلامیہ میں ایم ایس سی ریاضی (کمپیوٹر سائنس کے ساتھ) کا طالب علم۔ ریاضیاتی استدلال، C اور Java پروگرامنگ، کمپیوٹر سائنس اور طبعی نظاموں کی سمجھ کے ساتھ میں اے آئی ٹریننگ کے کاموں میں مرحلہ وار تجزیہ، کوڈ ٹریسنگ اور سائنسی استدلال لاتا ہوں۔ ہندی اور اردو میری مادری زبانیں ہیں اور انگریزی میں میری پیشہ ورانہ مہارت ہے۔',
      'hero.resume': 'ریزیومے ڈاؤن لوڈ کریں', 'hero.contact': 'رابطہ کریں',
      'facts.study': 'مطالعہ', 'facts.uni': 'یونیورسٹی', 'facts.core': 'بنیادی مہارتیں', 'facts.lang': 'زبانیں', 'facts.time': 'مقامی وقت',
      'stats.papers': 'جائزہ لیے گئے تحقیقی مقالے', 'stats.subjects': 'مضامین کے شعبے', 'stats.langs': 'زبانیں', 'stats.certs': 'آن لائن کورسز اور اسناد',
      'about.title': 'میرے بارے میں',
      'about.lead': 'متنوع سائنسی پس منظر، جسے میں اے آئی سسٹمز کی جانچ اور بہتری میں استعمال کرتا ہوں۔',
      'expertise.title': 'مہارت',
      'expertise.lead': 'کوئی مضمون منتخب کریں اور دیکھیں کہ میں نے کیا پڑھا ہے اور اے آئی ٹریننگ میں وہ کہاں کام آتا ہے۔',
      'try.title': 'آزمائیں: استدلال کی جانچ',
      'try.lead': 'ہر بار نئے سوال، زیادہ تر ریاضی کے اور کچھ کوڈنگ کے۔ ایک حل کریں تو اس کی جگہ نیا آ جاتا ہے۔ نہ سائن اپ، نہ کچھ محفوظ ہوتا ہے۔',
      'try.shuffle': 'نئے سوال',
      'lab.title': 'انٹرایکٹو لیب',
      'lab.lead': 'تین چھوٹے ٹولز جو دکھاتے ہیں کہ میں ریاضی کیسے جانچتا ہوں، عددی طریقے کیسے چلاتا ہوں اور روبوٹ کے کاموں پر کیسے استدلال کرتا ہوں۔',
      'projects.title': 'پروجیکٹس',
      'projects.lead': 'تعلیمی کام؛ مکمل ہوتے ہی مزید کام GitHub پر شامل ہوتا رہے گا۔',
      'education.title': 'تعلیم',
      'education.lead': 'تفصیل دیکھنے کے لیے کسی اندراج پر کلک کریں۔',
      'learning.title': 'آن لائن کورسز اور اسناد',
      'learning.lead': 'کلاس روم سے باہر کوڈنگ اور ڈیٹا پلیٹ فارمز پر سیکھنا۔ یہ اوپر دی گئی باقاعدہ تعلیم سے الگ ہیں۔',
      'profiles.title': 'آن لائن مجھے یہاں تلاش کریں',
      'profiles.lead': 'میرے عوامی پروفائلز، ایک جگہ۔',
      'contact.title': 'بات کریں',
      'contact.lead': 'اے آئی ٹریننگ یا ایویلیوایشن کے کردار کے لیے بھرتی کر رہے ہیں؟ ای میل یا واٹس ایپ مجھ تک پہنچنے کا سب سے تیز طریقہ ہے۔',
      'contact.copy': 'ای میل کاپی کریں', 'contact.write': 'ای میل لکھیں', 'contact.whatsapp': 'واٹس ایپ پر پیغام بھیجیں',
      'footer.top': 'اوپر جائیں ↑',
      'msg.copied': 'ای میل کاپی ہو گئی۔'
    }
  };
  // English text is read from the HTML itself, so the page works without JS.
  var EN = { 'msg.copied': 'Email copied to clipboard.' };
  $$('[data-i18n]').forEach(function (n) { EN[n.getAttribute('data-i18n')] = n.textContent; });

  var currentLang = 'en';
  function t(key) {
    var d = I18N[currentLang];
    return (d && d[key]) || EN[key] || '';
  }
  function setLang(lang) {
    if (lang !== 'hi' && lang !== 'ur') lang = 'en';
    currentLang = lang;
    root.setAttribute('lang', lang);
    root.setAttribute('dir', lang === 'ur' ? 'rtl' : 'ltr');
    $$('[data-i18n]').forEach(function (n) {
      var v = t(n.getAttribute('data-i18n'));
      if (v) n.textContent = v;
    });
    $('#lang').value = lang;
    store('lang', lang);
  }
  $('#lang').addEventListener('change', function (e) { setLang(e.target.value); });
  var navLang = (navigator.language || 'en').slice(0, 2).toLowerCase();
  setLang(store('lang') || (navLang === 'hi' || navLang === 'ur' ? navLang : 'en'));

  /* ---------------- Clean address bar: the logo and "Back to top" never leave "#top" in the URL ---------------- */
  function cleanUrl() {
    if (location.hash === '#top' && window.history && history.replaceState) {
      history.replaceState(null, '', location.pathname + location.search);
    }
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href="#top"]') : null;
    if (!a) return;
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    cleanUrl();
  });
  cleanUrl();

  /* ---------------- Mobile menu ---------------- */
  var nav = $('#nav'), menuBtn = $('#menu');
  function closeMenu() { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  menuBtn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ---------------- Active nav link + reveal on scroll ---------------- */
  if ('IntersectionObserver' in window) {
    var links = {};
    $$('a', nav).forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && links[en.target.id]) {
          $$('a', nav).forEach(function (a) { a.classList.remove('active'); });
          links[en.target.id].classList.add('active');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    $$('main section[id]').forEach(function (s) { spy.observe(s); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    $$('.reveal').forEach(function (n) { io.observe(n); });

    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        countIO.unobserve(en.target);
        var end = parseInt(en.target.getAttribute('data-count'), 10);
        if (reduceMotion) { en.target.textContent = end; return; }
        var start = performance.now(), dur = 900;
        (function tick(now) {
          var p = Math.min((now - start) / dur, 1);
          en.target.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        })(start);
      });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach(function (n) { n.textContent = '0'; countIO.observe(n); });
  } else {
    $$('.reveal').forEach(function (n) { n.classList.add('in'); });
  }

  /* ---------------- Live New Delhi clock ---------------- */
  var clock = $('#clock');
  function tickClock() {
    try {
      var f = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });
      clock.textContent = f.format(new Date()) + ' · New Delhi (IST, UTC+5:30)';
    } catch (e) { /* keep static text */ }
  }
  tickClock();
  setInterval(tickClock, 30000);

  /* ---------------- Expertise tabs (content from the resume) ---------------- */
  var EXPERTISE = [
    { id: 'math', name: 'Mathematics', k: 1,
      topics: ['Calculus', 'Linear algebra', 'Abstract algebra', 'Discrete mathematics', 'Real & functional analysis', 'Topology', 'Differential equations', 'Geometry', 'Numerical methods', 'Complex analysis (ongoing)', 'Differentiable manifolds (ongoing)', 'Wavelets (ongoing)'],
      detail: 'Numerical methods cover root-finding, interpolation, approximation, integration, error estimation and stability analysis.',
      use: 'Examining multistep solutions, numerical accuracy and mathematical explanations.' },
    { id: 'coding', name: 'Coding', k: 2,
      topics: ['C: control flow, arrays, strings, pointers, recursion, structures, file handling', 'Java: classes, objects, encapsulation, inheritance, polymorphism, interfaces, exceptions', 'HTML, CSS & JavaScript: forms and event handling'],
      detail: 'Coursework-based foundation in C, Java and web fundamentals.',
      use: 'Tracing program execution, interpreting code and examining input-output behaviour.' },
    { id: 'cs', name: 'Computer Science', k: 6,
      topics: ['Linked lists', 'Stacks & queues', 'Trees & graphs', 'Searching & sorting', 'Time/space complexity', 'Operating systems', 'Scheduling & synchronization', 'Deadlocks', 'Memory & file systems', 'DBMS & SQL (ongoing)'],
      detail: 'Data structures and algorithms, operating systems, and ongoing DBMS study covering relational models, keys, normalization, transactions and SQL.',
      use: 'Reasoning about task sequences, program state and structured data.' },
    { id: 'physics', name: 'Physics', k: 4,
      topics: ['Mechanics', 'Motion & forces', 'Oscillations', 'Electromagnetism', 'Optics', 'Thermodynamics', 'Electronics', 'Modern physics', 'Lagrangian & Hamiltonian mechanics'],
      detail: 'Includes laboratory coursework. M.Sc. mechanics covers Lagrangian and Hamiltonian formulations.',
      use: 'Interpreting physical actions, motion, measurements and cause-and-effect in robotic AI tasks.' },
    { id: 'chem', name: 'Chemistry', k: 5,
      topics: ['Inorganic', 'Organic', 'Physical chemistry', 'Atomic structure & bonding', 'Reaction mechanisms', 'Thermodynamics', 'Equilibrium & kinetics', 'Spectroscopy'],
      detail: 'Includes practical chemical analysis.',
      use: 'Interpreting scientific procedures, material properties, observations and technical explanations.' },
    { id: 'english', name: 'English', k: 3,
      topics: ['Reading comprehension', 'Inference', 'Vocabulary & grammar', 'Literature', 'Structured writing'],
      detail: 'Professional proficiency.',
      use: 'Understanding task instructions and assessing clarity, meaning and consistency in written responses.' },
    { id: 'hindi', name: 'Hindi · Urdu', k: 7,
      topics: ['Hindi: reading comprehension, grammar, prose and poetry interpretation', 'Structured written expression', 'Urdu: native language'],
      detail: 'Hindi and Urdu are native languages.',
      use: 'Interpreting instructions and reviewing the meaning of Hindi and Urdu responses.' }
  ];

  var tabsEl = $('#tabs'), panel = $('#tabpanel');
  function showTab(i) {
    var d = EXPERTISE[i];
    $$('.tab', tabsEl).forEach(function (b, j) {
      b.setAttribute('aria-selected', String(i === j));
      b.setAttribute('tabindex', i === j ? '0' : '-1');
    });
    panel.setAttribute('aria-labelledby', 'tab-' + d.id);
    panel.setAttribute('data-k', d.k);
    panel.textContent = '';
    panel.appendChild(el('div', { class: 'panel-head' }, [
      el('h3', { text: d.name }),
      el('span', { class: 'pill', text: d.topics.length + ' topics' })
    ]));
    panel.appendChild(el('span', { class: 'block-label', text: 'What I have studied' }));
    panel.appendChild(el('ul', { class: 'chips' }, d.topics.map(function (x) { return el('li', { text: x }); })));
    panel.appendChild(el('span', { class: 'block-label', text: 'Details' }));
    panel.appendChild(el('p', { class: 'detail', text: d.detail }));
    panel.appendChild(el('span', { class: 'block-label', text: 'Where it applies in AI training' }));
    panel.appendChild(el('p', { class: 'relevant', text: d.use }));
  }
  EXPERTISE.forEach(function (d, i) {
    var b = el('button', { class: 'tab', role: 'tab', id: 'tab-' + d.id, type: 'button', text: d.name, 'aria-controls': 'tabpanel', 'data-k': d.k });
    b.addEventListener('click', function () { showTab(i); });
    b.addEventListener('keydown', function (e) {
      var n = null;
      if (e.key === 'ArrowRight') n = (i + 1) % EXPERTISE.length;
      if (e.key === 'ArrowLeft') n = (i - 1 + EXPERTISE.length) % EXPERTISE.length;
      if (e.key === 'Home') n = 0;
      if (e.key === 'End') n = EXPERTISE.length - 1;
      if (n !== null) { e.preventDefault(); showTab(n); $$('.tab', tabsEl)[n].focus(); }
    });
    tabsEl.appendChild(b);
  });
  showTab(0);

  /* ---------------- Reasoning checks: random problems, mostly maths ---------------- */
  // P(topic, question, correct answer, [[wrong answer, hint], ...], explanation, extras)
  function P(topic, q, ok, wrongs, explain, extra) {
    var p = { topic: topic, q: q, explain: explain, opts: [{ t: ok, ok: true, h: '' }] };
    wrongs.forEach(function (w) { p.opts.push({ t: w[0], ok: false, h: w[1] }); });
    Object.keys(extra || {}).forEach(function (k) { p[k] = extra[k]; });
    return p;
  }
  // Flaw-spotting problems keep their steps in order (the steps are the options).
  function F(topic, q, steps, bad, explain) {
    return {
      topic: topic, q: q, explain: explain, ordered: true,
      opts: steps.map(function (s, i) { return { t: s[0], ok: i === bad, h: s[1] || '' }; })
    };
  }

  var BANK = {
    math: [
      F('Algebra · find the flaw', 'Solve √(x + 2) = x. One step in this solution is wrong. Which one?', [
        ['1. Square both sides: x + 2 = x²', 'Squaring is allowed here. Think about what it can introduce, though.'],
        ['2. Rearrange: x² − x − 2 = 0', 'This rearrangement is correct.'],
        ['3. Factor: (x − 2)(x + 1) = 0, so x = 2 or x = −1', 'The factoring is correct: (x − 2)(x + 1) = x² − x − 2.'],
        ['4. Both x = 2 and x = −1 are solutions.']
      ], 3, 'Squaring can introduce extraneous roots, so every candidate must be checked in the original equation. For x = −1, √1 = 1 ≠ −1, so only x = 2 is valid.'),
      F('Algebra · find the flaw', 'This "proof" shows 1 = 2. Which step is invalid?', [
        ['1. Let a = b, with a ≠ 0', 'Choosing a = b is a fine starting assumption.'],
        ['2. Then a² = ab', 'Multiplying both sides by a is valid.'],
        ['3. So a² − b² = ab − b²', 'Subtracting b² from both sides is valid.'],
        ['4. Factor: (a + b)(a − b) = b(a − b)', 'Both factorisations are correct.'],
        ['5. Divide by (a − b): a + b = b', ''],
        ['6. So 2b = b, hence 2 = 1', 'Given step 5 this follows, so the mistake happened earlier.']
      ], 4, 'Since a = b, the quantity (a − b) is 0, and dividing by zero is not allowed. Every step before it is valid; step 5 is where it breaks.'),
      P('Calculus', 'What is the derivative of f(x) = x² sin x at x = π?', '−π²', [
        ['π²', 'Check the sign: cos π = −1.'],
        ['0', 'That is only the term 2x·sin x. The product rule also gives x²·cos x.'],
        ['−2π', 'At x = π the term 2x·sin x is 2π·0 = 0, not −2π.']
      ], 'Product rule: f′(x) = 2x sin x + x² cos x. At x = π that is 0 + π²·(−1) = −π².'),
      P('Calculus', 'What is the value of the integral of sin x from 0 to π?', '2', [
        ['0', 'That is the integral over a full period, 0 to 2π. Here the area lies above the axis.'],
        ['1', 'The result is cos 0 − cos π = 1 − (−1), which is not 1.'],
        ['π', 'π is the length of the interval, not the area.']
      ], 'The antiderivative is −cos x, so the integral is −cos π + cos 0 = 1 + 1 = 2.'),
      P('Linear algebra', 'What is the determinant of this matrix?', '2', [
        ['10', 'The determinant is ad − bc, not ad + bc.'],
        ['6', '6 is only ad. Subtract bc = 4.'],
        ['−2', 'That is bc − ad. The order matters: ad − bc.']
      ], 'det = 2·3 − 1·4 = 2.', { code: '[ 2  1 ]\n[ 4  3 ]' }),
      P('Linear algebra', 'What are the eigenvalues of this matrix?', '2 and 5', [
        ['3 and 4', 'Eigenvalues are not simply the diagonal entries unless the matrix is triangular.'],
        ['1 and 6', 'The sum matches the trace (7), but the product must equal det A = 10, not 6.'],
        ['−2 and −5', 'The sum of the eigenvalues must equal the trace, which is +7.']
      ], 'trace = 7 and det = 4·3 − 1·2 = 10, so λ² − 7λ + 10 = 0, giving λ = 2 and λ = 5.', { code: '[ 4  1 ]\n[ 2  3 ]' }),
      P('Linear algebra', 'What is the rank of this matrix?', '1', [
        ['2', 'Row 2 is 2 × Row 1, so the rows are linearly dependent.'],
        ['0', 'Only the zero matrix has rank 0.'],
        ['4', 'Rank can never exceed the smaller dimension, which is 2 here.']
      ], 'Row 2 = 2·Row 1, so only one independent row remains. The rank is 1 (and the determinant is 0).', { code: '[ 1  2 ]\n[ 2  4 ]' }),
      P('Series', 'Σ from n = 1 to ∞ of 1 / (n(n + 1)) equals?', '1', [
        ['1/2', 'That is only the first term. Keep adding terms.'],
        ['2', 'Every partial sum is below 1, so the total cannot be 2.'],
        ['It diverges', 'The terms behave like 1/n², so the series converges.']
      ], '1/(n(n+1)) = 1/n − 1/(n+1), so the sum telescopes: the partial sum is 1 − 1/(N+1), which tends to 1.'),
      P('Limits', 'What is the limit of (1 + 1/x)^x as x → ∞?', 'e', [
        ['1', 'The base tends to 1 but the exponent tends to ∞, so this is an indeterminate form, not simply 1.'],
        ['∞', 'The base is barely above 1, which keeps the product bounded.'],
        ['0', 'The expression is always greater than 1, so the limit cannot be 0.']
      ], 'This is the standard definition of e ≈ 2.718.'),
      P('Algebra · logarithms', 'What is log₂ 8 + log₂ 4?', '5', [
        ['6', 'log a + log b = log(ab). It is not log a × log b.'],
        ['12', 'That is 8 + 4. You need the logarithms first.'],
        ['3', 'That is only log₂ 8. Add log₂ 4 = 2.']
      ], 'log₂ 8 + log₂ 4 = log₂ 32 = 5, or simply 3 + 2.'),
      P('Combinatorics', 'How many distinct arrangements are there of the letters in LEVEL?', '30', [
        ['120', 'The letters L and E repeat. Divide by 2! for each.'],
        ['60', 'Divide by 2! for both repeated letters, not just one.'],
        ['24', 'That is 4!. LEVEL has 5 letters.']
      ], '5! / (2! · 2!) = 120 / 4 = 30.'),
      P('Probability', 'Two fair dice are rolled. What is the probability that the sum is 7?', '1/6', [
        ['1/12', 'Count the ordered pairs: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1). That is 6, not 3.'],
        ['7/36', '7 is the sum, not the number of favourable outcomes.'],
        ['1/36', 'That is one specific pair. Six pairs give a sum of 7.']
      ], '6 favourable outcomes out of 36 equally likely ones: 6/36 = 1/6.'),
      P('Abstract algebra', 'In the additive group Z₁₂, what is the order of the element 3?', '4', [
        ['3', '3 is the element itself. The order is the smallest k with 3k ≡ 0 (mod 12).'],
        ['12', '12 is the order of the whole group. A smaller k already works.'],
        ['6', '3 × 6 = 18 ≡ 6 (mod 12), which is not 0.']
      ], 'The order is 12 / gcd(3, 12) = 4, because 3 × 4 = 12 ≡ 0 (mod 12).'),
      P('Numerical methods', 'One Newton step for f(x) = x² − 2, starting from x₀ = 1. What is x₁?', '1.5', [
        ['1.4142', 'That is the true root √2. One step gives x₁ = x₀ − f(x₀)/f′(x₀).'],
        ['2', 'f(1) = −1 and f′(1) = 2, so the step is +0.5, not +1.'],
        ['0.5', 'f(1) is negative, so subtracting f/f′ moves x to the right, not the left.']
      ], 'x₁ = 1 − (−1)/2 = 1.5, already close to √2 ≈ 1.4142.'),
      P('Numerical methods', 'The trapezoidal rule with a single interval estimates the integral of x² from 0 to 2 as?', '4', [
        ['8/3', 'That is the exact value. The trapezoid rule overestimates for a convex function.'],
        ['2', 'Trapezoid = (h/2)(f(0) + f(2)) with h = 2, which is 1 × 4.'],
        ['8', 'You dropped the factor ½ in (h/2).']
      ], '(2/2)(0 + 4) = 4, versus the exact 8/3 ≈ 2.67. The gap shows why more subintervals are used.'),
      P('Differential equations', 'Solve y′ = y with y(0) = 3. What is y(1)?', '3e', [
        ['e', 'The constant comes from y(0) = 3, so y = 3eˣ, not eˣ.'],
        ['3 + e', 'The solution scales multiplicatively: y = 3eˣ.'],
        ['e³', 'That would be e^(3x), which satisfies y′ = 3y.']
      ], 'y = Ceˣ and y(0) = 3 gives C = 3. So y(1) = 3e.')
    ],
    code: [
      P('C · pointers', 'What does this program print?', '21', [
        ['11', 'That is a[0] + 1, but p++ already moved the pointer forward.'],
        ['20', '20 is *p. The + 1 is then added to that value.'],
        ['31', 'That would be *(p + 1) + 1. Here the + 1 applies after dereferencing p.']
      ], 'p++ moves p from a[0] to a[1], so *p is 20 and *p + 1 is 21. Note that *p + 1 is not the same as *(p + 1).',
      { code: 'int a[] = {10, 20, 30};\nint *p = a;\np++;\nprintf("%d", *p + 1);', mono: true }),
      P('C · loops', 'What does this program print?', '30', [
        ['10', 'That is 1+2+3+4. The loop adds i * i, not i.'],
        ['16', 'That is only the last term, 4 * 4.'],
        ['100', 'That is (1+2+3+4)². The loop adds squares one at a time.']
      ], '1 + 4 + 9 + 16 = 30.',
      { code: 'int i, s = 0;\nfor (i = 1; i <= 4; i++)\n    s += i * i;\nprintf("%d", s);', mono: true }),
      P('C · recursion', 'What does this program print?', '120', [
        ['24', 'That is f(4). The call is f(5).'],
        ['15', 'That is 1+2+3+4+5. The function multiplies, it does not add.'],
        ['5', 'The recursion continues down to n <= 1, multiplying as it returns.']
      ], 'f(5) = 5 · 4 · 3 · 2 · 1 = 120.',
      { code: 'int f(int n) {\n    return n <= 1 ? 1 : n * f(n - 1);\n}\nprintf("%d", f(5));', mono: true }),
      P('C · integer arithmetic', 'What does this program print?', '3 1', [
        ['3.5 1', 'Both operands are int, so / truncates. No decimal part is produced.'],
        ['4 1', 'Integer division truncates toward zero; it does not round.'],
        ['3 3', 'a % b is the remainder of 7 / 2, which is 1.']
      ], '7 / 2 is 3 (integer division) and 7 % 2 is 1.',
      { code: 'int a = 7, b = 2;\nprintf("%d %d", a / b, a % b);', mono: true }),
      P('Java · strings', 'What does this program print?', 'abc', [
        ['ABC', 'Strings are immutable. toUpperCase() returns a new String and s is unchanged.'],
        ['A compile error', 'The code compiles. Ignoring a return value is allowed.'],
        ['null', 's still refers to "abc". Nothing set it to null.']
      ], 'toUpperCase() returns a new String; the result was discarded, so s is still "abc".',
      { code: 'String s = "abc";\ns.toUpperCase();\nSystem.out.println(s);', mono: true }),
      P('Java · exceptions', 'What happens when this code runs?', 'ArrayIndexOutOfBoundsException', [
        ['It prints 0', 'The valid indices are 0, 1 and 2. Index 3 does not exist.'],
        ['It prints null', 'An int array holds zeros by default, and a[3] does not exist.'],
        ['A compile error', 'The compiler does not check index values. The failure happens at run time.']
      ], 'The array has indices 0 to 2, so a[3] throws ArrayIndexOutOfBoundsException at run time.',
      { code: 'int[] a = new int[3];\nSystem.out.println(a[3]);', mono: true }),
      P('Data structures', 'What is the worst-case time complexity of binary search on a sorted array of n elements?', 'O(log n)', [
        ['O(n)', 'That is linear search. Binary search halves the remaining range each step.'],
        ['O(n log n)', 'That is the cost of sorting, not of searching a sorted array.'],
        ['O(1)', 'Constant time would need direct indexing. Binary search needs about log₂ n comparisons.']
      ], 'Each comparison halves the search range, so at most about log₂ n steps are needed.', { mono: true }),
      P('Data structures', 'A stack starts empty and these operations run. Which element is on top now?', '1', [
        ['2', 'pop() removes the most recently pushed item (LIFO). Two pops remove 3, then 2.'],
        ['3', '3 was pushed last, so it is the first one removed.'],
        ['The stack is empty', 'Three pushes and two pops leave one element behind.']
      ], 'Last in, first out: pops remove 3 then 2, leaving 1 on top.',
      { code: 'push(1); push(2); push(3);\npop(); pop();', mono: true })
    ]
  };

  var deck = $('#deck'), scoreEl = $('#score');
  var used = { math: [], code: [] };
  var stats = { solved: 0, first: 0 };

  function shuffled(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x;
    }
    return a;
  }
  function pickProblem(type) {
    var all = BANK[type], free = [];
    all.forEach(function (_, i) { if (used[type].indexOf(i) === -1) free.push(i); });
    if (!free.length) {
      // every problem of this type has been shown: start a new round, but never repeat the one just shown
      var justShown = used[type][used[type].length - 1];
      used[type] = [justShown];
      all.forEach(function (_, i) { if (i !== justShown) free.push(i); });
    }
    var idx = free[Math.floor(Math.random() * free.length)];
    used[type].push(idx);
    return all[idx];
  }
  function randomType() { return Math.random() < 0.7 ? 'math' : 'code'; }
  function renderScore() {
    scoreEl.textContent = stats.solved
      ? 'Solved: ' + stats.solved + ' · Right first time: ' + stats.first
      : 'Pick an answer. A wrong guess shows a hint instead of the answer.';
  }

  function makeCard(type) {
    var p = pickProblem(type), tries = 0, finished = false;
    var opts = p.ordered ? p.opts : shuffled(p.opts);
    var card = el('article', { class: 'card quiz swap', 'data-k': type === 'math' ? 1 : 2, 'aria-label': (type === 'math' ? 'Maths' : 'Code') + ' problem: ' + p.topic });
    card.appendChild(el('div', { class: 'quiz-top' }, [
      el('span', { class: 'pill', text: p.topic }),
      el('span', { class: 'q-type', text: type === 'math' ? 'Maths' : 'Code' })
    ]));
    card.appendChild(el('p', { class: 'q', text: p.q }));
    if (p.code) card.appendChild(el('pre', {}, [el('code', { text: p.code })]));

    var list = el('div', { class: 'opts' });
    var fb = el('div', { class: 'feedback', role: 'status', 'aria-live': 'polite' });
    var actions = el('div', { class: 'quiz-actions' });
    var skip = el('button', { class: 'linkish', type: 'button', text: 'Skip' });
    actions.appendChild(skip);

    function next() {
      var fresh = makeCard(randomType());
      deck.replaceChild(fresh, card);
      var first = $('.opt', fresh);
      if (first) first.focus({ preventScroll: true });
    }
    skip.addEventListener('click', next);

    var buttons = opts.map(function (o) {
      var b = el('button', { class: 'opt', type: 'button' });
      b.appendChild(el(p.mono ? 'code' : 'span', { text: o.t }));
      b.addEventListener('click', function () {
        if (finished) return;
        fb.textContent = '';
        if (o.ok) {
          finished = true;
          b.classList.add('right');
          buttons.forEach(function (x) { x.disabled = true; });
          stats.solved++;
          if (tries === 0) stats.first++;
          renderScore();
          fb.appendChild(el('strong', { class: 'ok', text: tries === 0 ? 'Correct. ' : 'Got it. ' }));
          fb.appendChild(document.createTextNode(p.explain));
          actions.textContent = '';
          var nb = el('button', { class: 'btn primary small', type: 'button', text: 'Next problem →' });
          nb.addEventListener('click', next);
          actions.appendChild(nb);
        } else {
          tries++;
          b.classList.add('wrong');
          b.disabled = true;
          fb.appendChild(el('strong', { class: 'bad', text: 'Not quite. ' }));
          fb.appendChild(document.createTextNode(o.h));
        }
      });
      list.appendChild(b);
      return b;
    });

    card.appendChild(list);
    card.appendChild(fb);
    card.appendChild(actions);
    return card;
  }

  function dealDeck() {
    deck.textContent = '';
    // two maths problems and one code problem, in random order
    shuffled(['math', 'math', 'code']).forEach(function (t) { deck.appendChild(makeCard(t)); });
  }
  $('#shuffle').addEventListener('click', dealDeck);
  renderScore();
  dealDeck();

  /* ---------------- Education & credentials ---------------- */
  var EDU = [
    { when: 'Ongoing', what: 'M.Sc. Mathematics with Computer Science', where: 'Jamia Millia Islamia, New Delhi',
      body: 'Mathematical reasoning and numerical analysis alongside programming, algorithms and operating systems; ongoing advanced mathematics and DBMS study. Programming, data-structure, operating-system and database laboratory components connect theory with computing practice.' },
    { when: 'Completed', what: 'Bachelor of Science (Mathematics, Physics, Chemistry)', where: 'Maharaja Surajmal Brij Vishvavidyalaya, Bharatpur, Rajasthan',
      body: 'Mathematical problem solving, physical principles, chemical processes and laboratory coursework gave a multidisciplinary foundation for scientific reasoning and interpreting experimental observations.' },
    { when: '2018', what: 'Senior Secondary (Science)', where: 'Sanatan Dharm Shiksha Sadan Senior Secondary School, Dholpur · Board of Secondary Education, Rajasthan',
      body: 'Mathematics, Physics, Chemistry, English and Hindi: foundation in quantitative reasoning, science and written comprehension.' },
    { when: '2016', what: 'Secondary', where: 'Ikra Secondary School, Dholpur · Board of Secondary Education, Rajasthan',
      body: 'Mathematics, Science, Social Studies, English, Hindi and Urdu; Foundation of Information Technology.' }
  ];
  var tl = $('#timeline');
  EDU.forEach(function (e, i) {
    var bodyId = 'edu-body-' + i;
    var btn = el('button', { class: 'tl-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': bodyId }, [
      el('span', { class: 'when', text: e.when }),
      el('span', { class: 'what', text: e.what }),
      el('span', { class: 'where', text: e.where })
    ]);
    var body = el('div', { class: 'tl-body', id: bodyId, text: e.body });
    var li = el('li', { class: 'tl-item', 'data-k': (i % 7) + 1 }, [btn, body]);
    btn.addEventListener('click', function () {
      var open = li.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
    tl.appendChild(li);
  });
  tl.firstChild.classList.add('open');
  $('.tl-btn', tl).setAttribute('aria-expanded', 'true');

  /* ---------------- Online courses & certificates (not academic) ---------------- */
  var LEARNING = [
    { platform: 'Kaggle', k: 6, title: 'Python',
      detail: 'Kaggle Learn course covering functions, conditionals, loops, lists, strings, dictionaries and external libraries.',
      url: 'https://www.kaggle.com/learn/certification/mukeemkhan/python', link: 'View certificate' },
    { platform: 'Kaggle', k: 6, title: 'Intro to Machine Learning',
      detail: 'Kaggle Learn course covering how models work, data exploration, a first model, validation, underfitting, overfitting and random forests.',
      url: 'https://www.kaggle.com/learn/certification/mukeemkhan/intro-to-machine-learning', link: 'View certificate' },
    { platform: 'HackerRank', k: 5, title: 'SQL (Intermediate)',
      detail: 'Verified skills certificate. The profile also shows Python and SQL badges.',
      url: 'https://www.hackerrank.com/certificates/499e6776c513', link: 'View certificate' }
  ];
  var lg = $('#learning-grid');
  LEARNING.forEach(function (c) {
    lg.appendChild(el('article', { class: 'card pillar', 'data-k': c.k }, [
      el('p', { class: 'pill-tag', text: c.platform }),
      el('h3', { text: c.title }),
      el('p', { class: 'learn-detail', text: c.detail }),
      el('a', { class: 'learn-link', href: c.url, target: '_blank', rel: 'noopener', text: c.link + ' ↗' })
    ]));
  });

  /* ---------------- Profiles ---------------- */
  var PROFILES = [
    { name: 'GitHub', handle: 'muqeem72-R', url: 'https://github.com/muqeem72-R', abbr: 'GH', color: '#24292f' },
    { name: 'LinkedIn', handle: 'Mukeem Khan', url: 'https://www.linkedin.com/in/mukeem-khan-6b10b5305/', abbr: 'in', color: '#0a66c2' },
    { name: 'Kaggle', handle: 'mukeemkhan', url: 'https://www.kaggle.com/mukeemkhan', abbr: 'K', color: '#0b7ca8' },
    { name: 'HackerRank', handle: 'mukeemuddeen9694', url: 'https://www.hackerrank.com/profile/mukeemuddeen9694', abbr: 'HR', color: '#067a43' },
    { name: 'LeetCode', handle: 'TJcZEIHg0E', url: 'https://leetcode.com/u/TJcZEIHg0E/', abbr: 'LC', color: '#8f5300' },
    { name: 'X (Twitter)', handle: '@muqeemshei', url: 'https://x.com/muqeemshei', abbr: 'X', color: '#14171a' }
  ];
  var pg = $('#profile-grid');
  PROFILES.forEach(function (p) {
    var a = el('a', { class: 'card profile', href: p.url, target: '_blank', rel: 'noopener' }, [
      el('span', { class: 'logo', text: p.abbr, 'aria-hidden': 'true' }),
      el('div', {}, [el('b', { text: p.name }), el('span', { text: p.handle })])
    ]);
    $('.logo', a).style.background = p.color;
    pg.appendChild(a);
  });

  /* ---------------- Live GitHub repos ---------------- */
  (function loadRepos() {
    var block = $('#more-repos'), host = $('#repos');
    var SKIP_NAMES = ['multimodal-emotion-recognition-and-reasoning'];   // shown as the featured project above
    var SKIP_IDS = [1169720950, 1419505212];                              // hidden on purpose (ids survive renames): learning-roadmap repo, and this website's own repo
    var KEY = 'gh-repos-v1';

    function render(list) {
      var items = list.filter(function (r) {
        return !r.fork && SKIP_NAMES.indexOf(r.name) === -1 && SKIP_IDS.indexOf(r.id) === -1;
      });
      if (!items.length) return;
      host.textContent = '';
      items.forEach(function (r) {
        var meta = el('div', { class: 'meta' });
        if (r.language) meta.appendChild(el('span', { text: r.language }));
        meta.appendChild(el('span', { text: 'Updated ' + new Date(r.pushed_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) }));
        host.appendChild(el('a', { class: 'card repo', 'data-k': 2, href: r.html_url, target: '_blank', rel: 'noopener' }, [
          el('h4', { text: r.name }),
          el('p', { text: r.description || 'No description yet.' }),
          meta
        ]));
      });
      block.hidden = false;
    }

    try {
      var cached = sessionStorage.getItem(KEY);
      if (cached) { render(JSON.parse(cached)); return; }
    } catch (e) { /* ignore */ }

    if (!window.fetch) return;
    fetch('https://api.github.com/users/muqeem72-R/repos?per_page=30&sort=pushed')
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (list) {
        try { sessionStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
        render(list);
      })
      .catch(function () { /* keep the block hidden */ });
  })();

  /* ---------------- Contact ---------------- */
  $('#copy').addEventListener('click', function () {
    var email = $('#email-link').textContent.trim();
    var msg = $('#copy-msg');
    function done() { msg.textContent = t('msg.copied'); setTimeout(function () { msg.textContent = ''; }, 3000); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(done, function () { msg.textContent = email; });
    } else {
      msg.textContent = email;
    }
  });

  $('#year').textContent = new Date().getFullYear();
})();
