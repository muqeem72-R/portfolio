(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  function store(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
  }

  /* theme and language are shared with the main page (same saved choice) */
  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    var m = $('meta[name="theme-color"]');
    if (m) m.setAttribute('content', t === 'dark' ? '#0b1020' : '#f7f8fc');
  }
  applyTheme(store('theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
  $('#theme').addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next); store('theme', next);
  });

  var I18N = {
    hi: {
      'skip': 'सामग्री पर जाएँ',
      'papers.back': '← पोर्टफ़ोलियो पर वापस',
      'papers.title': 'समीक्षा किए गए शोध पत्र',
      'papers.lead': 'मेरे M.Sc. माइनर प्रोजेक्ट "Multimodal Emotion Recognition and Reasoning: A Comprehensive Study" के लिए पढ़े गए 24 शोध पत्र, उसकी ग्रंथ-सूची (bibliography) के क्रम में। हर लिंक प्रकाशक की वेबसाइट पर पेपर खोलता है। कुछ प्रकाशक सदस्यता माँग सकते हैं।',
      'papers.open': 'पेपर पढ़ें',
      'footer.top': 'ऊपर जाएँ ↑'
    },
    ur: {
      'skip': 'مواد پر جائیں',
      'papers.back': '← پورٹ فولیو پر واپس',
      'papers.title': 'جائزہ لیے گئے تحقیقی مقالے',
      'papers.lead': 'میرے ایم ایس سی مائنر پروجیکٹ "Multimodal Emotion Recognition and Reasoning: A Comprehensive Study" کے لیے پڑھے گئے 24 تحقیقی مقالے، اس کی کتابیات (bibliography) کی ترتیب میں۔ ہر لنک ناشر کی ویب سائٹ پر مقالہ کھولتا ہے۔ کچھ ناشرین رکنیت مانگ سکتے ہیں۔',
      'papers.open': 'مقالہ پڑھیں',
      'footer.top': 'اوپر جائیں ↑'
    }
  };
  var EN = {};
  $$('[data-i18n]').forEach(function (n) { EN[n.getAttribute('data-i18n')] = n.textContent; });

  function setLang(lang) {
    if (lang !== 'hi' && lang !== 'ur') lang = 'en';
    root.setAttribute('lang', lang);
    root.setAttribute('dir', lang === 'ur' ? 'rtl' : 'ltr');
    $$('[data-i18n]').forEach(function (n) {
      var k = n.getAttribute('data-i18n');
      var v = (I18N[lang] && I18N[lang][k]) || EN[k];
      if (v) n.textContent = v;
    });
    $('#lang').value = lang;
    store('lang', lang);
  }
  $('#lang').addEventListener('change', function (e) { setLang(e.target.value); });
  var navLang = (navigator.language || 'en').slice(0, 2).toLowerCase();
  setLang(store('lang') || (navLang === 'hi' || navLang === 'ur' ? navLang : 'en'));

  $('#year').textContent = new Date().getFullYear();
})();
