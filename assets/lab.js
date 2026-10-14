/* Interactive lab: three tools (compare responses, numerical methods, robot task planning). */
(function () {
  'use strict';

  var root = document.documentElement;
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
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
  function cssv(name) { return getComputedStyle(root).getPropertyValue(name).trim(); }
  function shuffled(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x;
    }
    return a;
  }
  function sci(x) { return x === 0 ? '0' : x.toExponential(2); }
  function num(x, d) {
    if (!isFinite(x)) return String(x);
    return Math.abs(x) >= 1e6 ? x.toExponential(3) : x.toFixed(d);
  }

  var tabsEl = $('#lab-tabs'), panelsEl = $('#lab-panels');
  if (!tabsEl || !panelsEl) return;

  var redraws = [];   // canvas redraw callbacks, called on theme change and resize

  /* =====================================================================
     1. COMPARE TWO RESPONSES
     ===================================================================== */
  var RUBRIC = ['Correct answer', 'Valid reasoning', 'Completeness', 'Clarity'];
  var CASES = [
    { topic: 'Calculus', problem: 'Differentiate f(x) = x·e^(2x).',
      good: ['Use the product rule: f′ = (x)′·e^(2x) + x·(e^(2x))′.', 'By the chain rule, (e^(2x))′ = 2e^(2x).', 'So f′ = e^(2x) + 2x·e^(2x) = e^(2x)(1 + 2x).'],
      bad: ['Use the product rule: f′ = (x)′·e^(2x) + x·(e^(2x))′.', '(e^(2x))′ = e^(2x).', 'So f′ = e^(2x) + x·e^(2x) = e^(2x)(1 + x).'],
      flaw: 1, hintWrong: 'Differentiate e^(2x) yourself. What does the chain rule add?',
      why: 'The chain rule gives (e^(2x))′ = 2e^(2x). Response B dropped the factor 2, so its final answer is wrong even though the product rule was set up correctly.',
      rubric: { good: [5, 5, 5, 4], bad: [1, 2, 4, 4] } },
    { topic: 'Probability', problem: 'A bag holds 3 red and 2 blue balls. Two are drawn without replacement. What is P(both red)?',
      good: ['P(first red) = 3/5.', 'After one red is removed, 2 red remain among 4 balls, so P(second red | first red) = 2/4.', 'P = 3/5 × 2/4 = 6/20 = 3/10.'],
      bad: ['P(first red) = 3/5.', 'P(second red) = 3/5 as well.', 'P = 3/5 × 3/5 = 9/25.'],
      flaw: 1, hintWrong: 'Does the bag stay the same after the first ball is drawn? Check the words "without replacement".',
      why: 'Without replacement the second draw depends on the first. One red ball is gone, so the second probability is 2/4, not 3/5. Response B treated the draws as independent.',
      rubric: { good: [5, 5, 5, 5], bad: [1, 2, 4, 4] } },
    { topic: 'Linear algebra', problem: 'Find the eigenvalues of A = [[2, 1], [1, 2]].',
      good: ['Solve det(A − λI) = 0.', 'det = (2 − λ)(2 − λ) − 1·1 = λ² − 4λ + 3.', 'λ² − 4λ + 3 = (λ − 1)(λ − 3), so λ = 1 and λ = 3.'],
      bad: ['Solve det(A − λI) = 0.', 'det = (2 − λ)(2 − λ) + 1·1 = λ² − 4λ + 5.', 'The discriminant 16 − 20 is negative, so λ = 2 ± i.'],
      flaw: 1, hintWrong: 'A real symmetric matrix cannot have complex eigenvalues. Also recheck the determinant formula ad − bc.',
      why: 'The determinant of a 2×2 matrix is ad − bc, so the off-diagonal product must be subtracted. Response B added it, which produced a wrong polynomial and impossible complex eigenvalues for a real symmetric matrix.',
      rubric: { good: [5, 5, 5, 4], bad: [1, 2, 3, 4] } },
    { topic: 'Numerical methods', problem: 'Approximate the integral of x² from 0 to 2 using the trapezoidal rule with n = 2.',
      good: ['h = (2 − 0)/2 = 1, so the nodes are x = 0, 1, 2 and f = 0, 1, 4.', 'T = (h/2)[f(0) + 2f(1) + f(2)]', 'T = 0.5 × [0 + 2 + 4] = 3.'],
      bad: ['h = (2 − 0)/2 = 1, so the nodes are x = 0, 1, 2 and f = 0, 1, 4.', 'T = (h/2)[f(0) + f(1) + f(2)]', 'T = 0.5 × [0 + 1 + 4] = 2.5.'],
      flaw: 1, hintWrong: 'One value is closer to the exact answer 8/3. Closeness is not the same as a correct method, so check the formula.',
      why: 'The interior nodes must be doubled in the trapezoidal rule. Response B left out the 2, so its formula is wrong. Its value 2.5 happens to be nearer the exact 8/3 ≈ 2.67, but a good-looking number from a wrong method is still a wrong response.',
      rubric: { good: [4, 5, 5, 4], bad: [2, 1, 4, 4] } },
    { topic: 'Inequalities', problem: 'Solve x² > 4 over the real numbers.',
      good: ['x² > 4 is the same as x² − 4 > 0.', 'Factor: (x − 2)(x + 2) > 0.', 'The product is positive when both factors have the same sign: x > 2 or x < −2.'],
      bad: ['x² > 4.', 'Take square roots of both sides: x > 2.', 'Solution: x > 2.'],
      flaw: 1, hintWrong: 'Test a value such as x = −3 in the original inequality. Does it work?',
      why: '√(x²) equals |x|, not x. The condition is |x| > 2, which gives x > 2 or x < −2. Response B lost the negative branch, and x = −3 is a counterexample.',
      rubric: { good: [5, 5, 5, 4], bad: [2, 1, 3, 4] } },
    { topic: 'Algorithms · code', problem: 'What is the time complexity of this loop nest? for i in 0..n−1: for j in 0..i−1: work()',
      good: ['For each i the inner loop runs i times.', 'The total is 0 + 1 + … + (n − 1) = n(n − 1)/2.', 'That grows like n², so the complexity is Θ(n²).'],
      bad: ['For each i the inner loop runs i times.', 'Since i grows slowly, treat the inner loop as about log n iterations.', 'The total is O(n log n).'],
      flaw: 1, hintWrong: 'Count how many times work() runs in total, as a sum over i.',
      why: 'The inner loop runs i times, and i goes up to n − 1, so it is not log n. The sum 0 + 1 + … + (n − 1) is n(n − 1)/2, which is quadratic.',
      rubric: { good: [5, 5, 5, 4], bad: [1, 1, 3, 4] } }
  ];

  function buildCompare(host) {
    var order = shuffled(CASES.map(function (_, i) { return i; })), pos = 0, reviewed = 0;
    var wrap = el('div');
    host.appendChild(wrap);

    host.insertBefore(el('p', { class: 'tool-intro', text: 'Read the two responses, pick the better one, then find the first incorrect step in the weaker one. This is a small version of rating model outputs.' }), wrap);

    function nextCase() {
      if (pos >= order.length) { order = shuffled(order); pos = 0; }
      render(CASES[order[pos++]]);
    }

    function render(c) {
      wrap.textContent = '';
      var goodIsA = Math.random() < 0.5;
      var resp = {
        a: { steps: goodIsA ? c.good : c.bad, good: goodIsA },
        b: { steps: goodIsA ? c.bad : c.good, good: !goodIsA }
      };
      var weakKey = goodIsA ? 'b' : 'a';

      wrap.appendChild(el('div', { class: 'quiz-top' }, [
        el('span', { class: 'pill', text: c.topic }),
        el('span', { class: 'q-type', text: 'Case ' + (reviewed + 1) })
      ]));
      wrap.appendChild(el('p', { class: 'q', text: c.problem }));

      var grid = el('div', { class: 'resp-grid' });
      var lists = {};
      ['a', 'b'].forEach(function (k) {
        var ol = el('ol', { class: 'steps' });
        resp[k].steps.forEach(function (s) { ol.appendChild(el('li', { text: s })); });
        lists[k] = ol;
        grid.appendChild(el('section', { class: 'resp', 'data-r': k, 'aria-label': 'Response ' + k.toUpperCase() }, [
          el('h3', { text: 'Response ' + k.toUpperCase() }), ol
        ]));
      });
      wrap.appendChild(grid);

      var prompt = el('p', { class: 'tool-prompt', text: 'Which response is better?' });
      var verdicts = el('div', { class: 'verdicts' });
      var fb = el('div', { class: 'feedback', role: 'status', 'aria-live': 'polite' });
      var extra = el('div', { class: 'reveal-box' });
      wrap.appendChild(prompt);
      wrap.appendChild(verdicts);
      wrap.appendChild(fb);
      wrap.appendChild(extra);

      var vbtn = {};
      ['a', 'b'].forEach(function (k) {
        var b = el('button', { class: 'btn', type: 'button', text: 'Response ' + k.toUpperCase() + ' is better' });
        b.addEventListener('click', function () {
          fb.textContent = '';
          if (!resp[k].good) {
            b.disabled = true;
            fb.appendChild(el('strong', { class: 'bad', text: 'Not quite. ' }));
            fb.appendChild(document.createTextNode(c.hintWrong));
            return;
          }
          vbtn.a.disabled = vbtn.b.disabled = true;
          b.classList.add('primary');
          fb.appendChild(el('strong', { class: 'ok', text: 'Yes. ' }));
          fb.appendChild(document.createTextNode('Now click the first incorrect step in Response ' + weakKey.toUpperCase() + '.'));
          prompt.textContent = 'Find the first incorrect step in Response ' + weakKey.toUpperCase() + ':';
          armSteps();
        });
        vbtn[k] = b;
        verdicts.appendChild(b);
      });

      function armSteps() {
        var items = $$('li', lists[weakKey]);
        var btns = items.map(function (li, i) {
          var text = li.textContent;
          li.textContent = '';
          var sb = el('button', { class: 'step-btn', type: 'button', text: text });
          sb.addEventListener('click', function () {
            if (i === c.flaw) {
              btns.forEach(function (x) { x.disabled = true; });
              sb.classList.add('flaw');
              fb.textContent = '';
              fb.appendChild(el('strong', { class: 'ok', text: 'Found it. ' }));
              fb.appendChild(document.createTextNode(c.why));
              reviewed++;
              reveal();
            } else {
              sb.classList.add('fine');
              sb.disabled = true;
              fb.textContent = '';
              fb.appendChild(el('strong', { class: 'bad', text: 'Not this one. ' }));
              fb.appendChild(document.createTextNode('This step is valid, or the mistake comes later. Check each step on its own.'));
            }
          });
          li.appendChild(sb);
          return sb;
        });
      }

      function reveal() {
        extra.appendChild(el('p', { class: 'block-label', text: 'Expert rubric (out of 5)' }));
        var tbl = el('div', { class: 'rubric' });
        tbl.appendChild(el('div', { class: 'rubric-legend' }, [
          el('span', { class: 'lg a', text: 'Response A' }), el('span', { class: 'lg b', text: 'Response B' })
        ]));
        RUBRIC.forEach(function (name, i) {
          var row = el('div', { class: 'rubric-row' }, [el('span', { class: 'rubric-name', text: name })]);
          ['a', 'b'].forEach(function (k) {
            var score = resp[k].good ? c.rubric.good[i] : c.rubric.bad[i];
            var bar = el('span', { class: 'rbar ' + k }, [el('span')]);
            $('span', bar).style.width = (score / 5 * 100) + '%';
            row.appendChild(el('span', { class: 'rubric-cell' }, [bar, el('b', { text: String(score) })]));
          });
          tbl.appendChild(row);
        });
        extra.appendChild(tbl);
        var nb = el('button', { class: 'btn primary small', type: 'button', text: 'Next case →' });
        nb.addEventListener('click', function () { nextCase(); });
        extra.appendChild(nb);
        nb.focus({ preventScroll: true });
      }
    }
    nextCase();
  }

  /* =====================================================================
     2. NUMERICAL METHODS (Newton + trapezoid) drawn on canvas
     ===================================================================== */
  function setupCanvas(canvas, holder) {
    var dpr = window.devicePixelRatio || 1;
    var w = Math.max(260, Math.floor(holder.clientWidth));
    var h = Math.round(Math.max(230, Math.min(360, w * 0.56)));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }
  function plotFrame(c, view) {
    var pad = 28;
    return {
      pad: pad, w: c.w, h: c.h, view: view,
      sx: function (x) { return pad + (x - view[0]) / (view[1] - view[0]) * (c.w - 2 * pad); },
      sy: function (y) { return c.h - pad - (y - view[2]) / (view[3] - view[2]) * (c.h - 2 * pad); }
    };
  }
  function drawAxes(ctx, P) {
    var v = P.view;
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = cssv('--border');
    ctx.fillStyle = cssv('--muted');
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    var xs = niceTicks(v[0], v[1]);
    xs.forEach(function (x) {
      ctx.beginPath(); ctx.moveTo(P.sx(x), P.pad); ctx.lineTo(P.sx(x), P.h - P.pad); ctx.stroke();
      ctx.fillText(tickLabel(x), P.sx(x), P.h - P.pad + 15);
    });
    ctx.textAlign = 'right';
    niceTicks(v[2], v[3]).forEach(function (y) {
      ctx.beginPath(); ctx.moveTo(P.pad, P.sy(y)); ctx.lineTo(P.w - P.pad, P.sy(y)); ctx.stroke();
      ctx.fillText(tickLabel(y), P.pad - 5, P.sy(y) + 4);
    });
    ctx.strokeStyle = cssv('--muted');
    ctx.lineWidth = 1.5;
    if (v[2] < 0 && v[3] > 0) { ctx.beginPath(); ctx.moveTo(P.pad, P.sy(0)); ctx.lineTo(P.w - P.pad, P.sy(0)); ctx.stroke(); }
    if (v[0] < 0 && v[1] > 0) { ctx.beginPath(); ctx.moveTo(P.sx(0), P.pad); ctx.lineTo(P.sx(0), P.h - P.pad); ctx.stroke(); }
    ctx.restore();
  }
  function niceTicks(lo, hi) {
    var span = hi - lo, raw = span / 5, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    var step = [1, 2, 5, 10].map(function (m) { return m * mag; }).filter(function (s) { return s >= raw; })[0];
    var out = [];
    for (var t = Math.ceil(lo / step) * step; t <= hi + 1e-9; t += step) out.push(Math.round(t / step) * step);
    return out;
  }
  function tickLabel(x) { return Math.abs(x) < 1e-9 ? '0' : String(Math.round(x * 100) / 100); }
  function clipPlot(ctx, P) { ctx.save(); ctx.beginPath(); ctx.rect(P.pad, P.pad, P.w - 2 * P.pad, P.h - 2 * P.pad); ctx.clip(); }
  function drawCurve(ctx, P, f, color) {
    var v = P.view, N = 300, started = false;
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    ctx.beginPath();
    for (var i = 0; i <= N; i++) {
      var x = v[0] + (v[1] - v[0]) * i / N, y = f(x);
      if (!isFinite(y)) { started = false; continue; }
      y = Math.max(-1e4, Math.min(1e4, y));
      if (!started) { ctx.moveTo(P.sx(x), P.sy(y)); started = true; } else ctx.lineTo(P.sx(x), P.sy(y));
    }
    ctx.stroke();
    ctx.restore();
  }
  function dot(ctx, x, y, r, color) { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fillStyle = color; ctx.fill(); }

  var NEWTON = [
    { name: 'f(x) = x² − 2  (finds √2)', f: function (x) { return x * x - 2; }, d: function (x) { return 2 * x; },
      root: Math.SQRT2, view: [-0.5, 3, -3, 7], min: 0.5, max: 3, start: 2.5 },
    { name: 'f(x) = cos x − x', f: function (x) { return Math.cos(x) - x; }, d: function (x) { return -Math.sin(x) - 1; },
      root: 0.7390851332151607, view: [-1, 2.5, -3, 2], min: -1, max: 2.4, start: 2 },
    { name: 'f(x) = x³ − x − 1', f: function (x) { return x * x * x - x - 1; }, d: function (x) { return 3 * x * x - 1; },
      root: 1.324717957244746, view: [-1.5, 2.5, -4, 6], min: 0.5, max: 2.4, start: 2 }
  ];

  function buildNewton(box) {
    var fi = 0, xs = [];
    var holder = el('div', { class: 'plot-wrap' });
    var canvas = el('canvas', { class: 'plot', role: 'img', 'aria-label': 'Graph showing Newton iterations on the curve' });
    holder.appendChild(canvas);
    var sel = el('select', { class: 'select wide', 'aria-label': 'Function' }, NEWTON.map(function (n, i) { return el('option', { value: i, text: n.name }); }));
    var range = el('input', { type: 'range', step: '0.1', 'aria-label': 'Starting value x₀' });
    var rval = el('output', { class: 'range-val' });
    var bStep = el('button', { class: 'btn primary small', type: 'button', text: 'Step' });
    var bRun = el('button', { class: 'btn small', type: 'button', text: 'Run 5 steps' });
    var bReset = el('button', { class: 'btn ghost small', type: 'button', text: 'Reset' });
    var info = el('p', { class: 'tool-note', role: 'status', 'aria-live': 'polite' });
    var tableWrap = el('div', { class: 'table-wrap' });

    box.appendChild(el('p', { class: 'tool-intro', text: "Newton's method follows the tangent line down to the x-axis and uses that crossing as the next guess. Press Step and watch the guesses close in on the root." }));
    box.appendChild(el('div', { class: 'ctrl-row' }, [sel]));
    box.appendChild(el('div', { class: 'ctrl-row' }, [el('label', { class: 'range-label' }, [document.createTextNode('Start x₀ '), rval, range])]));
    box.appendChild(holder);
    box.appendChild(el('div', { class: 'ctrl-row' }, [bStep, bRun, bReset]));
    box.appendChild(info);
    box.appendChild(tableWrap);

    function applyFn() {
      var F = NEWTON[fi];
      range.min = F.min; range.max = F.max; range.value = F.start;
      reset();
    }
    function reset() { xs = [parseFloat(range.value)]; rval.textContent = xs[0].toFixed(1); draw(); renderInfo(); }
    function stepOnce() {
      if (xs.length > 12) { info.textContent = 'Enough steps: the guess has stopped changing at this precision.'; return false; }
      var F = NEWTON[fi], x = xs[xs.length - 1], fp = F.d(x);
      if (Math.abs(fp) < 1e-9) { info.textContent = 'The tangent here is horizontal, so it never meets the x-axis. Newton\'s method fails from this start.'; return false; }
      xs.push(x - F.f(x) / fp);
      draw(); renderInfo();
      return true;
    }
    function draw() {
      var F = NEWTON[fi], c = setupCanvas(canvas, holder), P = plotFrame(c, F.view), ctx = c.ctx;
      ctx.clearRect(0, 0, c.w, c.h);
      drawAxes(ctx, P);
      clipPlot(ctx, P);
      drawCurve(ctx, P, F.f, cssv('--c1'));
      // exact root marker
      ctx.setLineDash([5, 4]); ctx.strokeStyle = cssv('--c5'); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(P.sx(F.root), P.pad); ctx.lineTo(P.sx(F.root), P.h - P.pad); ctx.stroke();
      ctx.setLineDash([]);
      // tangents
      xs.forEach(function (x, i) {
        var fx = F.f(x), fp = F.d(x);
        if (!isFinite(fx) || Math.abs(fp) < 1e-9) return;
        var xn = x - fx / fp, last = i === xs.length - 1;
        ctx.save();
        ctx.globalAlpha = last ? 1 : 0.35;
        ctx.strokeStyle = cssv('--c4'); ctx.lineWidth = last ? 2 : 1.5;
        ctx.beginPath(); ctx.moveTo(P.sx(x), P.sy(fx)); ctx.lineTo(P.sx(xn), P.sy(0)); ctx.stroke();
        ctx.setLineDash([3, 3]); ctx.strokeStyle = cssv('--muted'); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(P.sx(x), P.sy(0)); ctx.lineTo(P.sx(x), P.sy(fx)); ctx.stroke();
        ctx.restore();
        dot(ctx, P.sx(x), P.sy(fx), last ? 5 : 3.5, cssv('--c4'));
      });
      xs.forEach(function (x) { dot(ctx, P.sx(x), P.sy(0), 4, cssv('--c2')); });
      ctx.restore();
    }
    function renderInfo() {
      var F = NEWTON[fi], n = xs.length - 1, x = xs[n], err = Math.abs(x - F.root);
      var digits = err > 0 ? Math.max(0, -Math.log10(err)) : 16;
      var f = F.f(x), fp = F.d(x), next = (Math.abs(fp) < 1e-9) ? NaN : x - f / fp;
      info.textContent = 'Step ' + n + ': x = ' + num(x, 8) + '. About ' + Math.min(16, Math.floor(digits)) + ' correct digits. ' +
        (isFinite(next) ? 'Next guess would be ' + num(next, 6) + (next < F.view[0] || next > F.view[1] ? ' (off the graph).' : '.') : 'The tangent is horizontal here.') +
        (n >= 2 ? ' Notice how the number of correct digits roughly doubles each step.' : '');
      var rows = xs.slice(-8).map(function (v, i) {
        var idx = Math.max(0, xs.length - 8) + i;
        return [String(idx), num(v, 8), sci(F.f(v)), sci(Math.abs(v - F.root))];
      });
      tableWrap.textContent = '';
      var tbl = el('table', { class: 'data' });
      tbl.appendChild(el('thead', {}, [el('tr', {}, ['n', 'xₙ', 'f(xₙ)', '|xₙ − root|'].map(function (h) { return el('th', { scope: 'col', text: h }); }))]));
      var tb = el('tbody');
      rows.forEach(function (r) { tb.appendChild(el('tr', {}, r.map(function (v) { return el('td', { text: v }); }))); });
      tbl.appendChild(tb);
      tableWrap.appendChild(tbl);
    }
    sel.addEventListener('change', function () { fi = parseInt(sel.value, 10); applyFn(); });
    range.addEventListener('input', reset);
    bStep.addEventListener('click', stepOnce);
    bRun.addEventListener('click', function () { for (var i = 0; i < 5; i++) if (!stepOnce()) break; });
    bReset.addEventListener('click', reset);
    applyFn();
    return { redraw: function () { if (box.offsetParent !== null) draw(); } };
  }

  var TRAP = [
    { name: 'f(x) = x² on [0, 2]', f: function (x) { return x * x; }, a: 0, b: 2, exact: 8 / 3, view: [-0.2, 2.2, -0.5, 4.6] },
    { name: 'f(x) = sin x on [0, π]', f: Math.sin, a: 0, b: Math.PI, exact: 2, view: [-0.2, 3.4, -0.3, 1.3] },
    { name: 'f(x) = eˣ on [0, 1]', f: Math.exp, a: 0, b: 1, exact: Math.E - 1, view: [-0.1, 1.1, -0.3, 3] },
    { name: 'f(x) = 1/(1 + x²) on [0, 1]', f: function (x) { return 1 / (1 + x * x); }, a: 0, b: 1, exact: Math.PI / 4, view: [-0.1, 1.1, -0.1, 1.2] }
  ];
  function trap(T, n) {
    var h = (T.b - T.a) / n, s = T.f(T.a) + T.f(T.b);
    for (var i = 1; i < n; i++) s += 2 * T.f(T.a + i * h);
    return h / 2 * s;
  }

  function buildTrapezoid(box) {
    var ti = 0;
    var holder = el('div', { class: 'plot-wrap' });
    var canvas = el('canvas', { class: 'plot', role: 'img', 'aria-label': 'Graph of a function with trapezoids under it' });
    holder.appendChild(canvas);
    var sel = el('select', { class: 'select wide', 'aria-label': 'Function' }, TRAP.map(function (n, i) { return el('option', { value: i, text: n.name }); }));
    var range = el('input', { type: 'range', min: '1', max: '50', step: '1', value: '4', 'aria-label': 'Number of trapezoids n' });
    var rval = el('output', { class: 'range-val' });
    var info = el('p', { class: 'tool-note', role: 'status', 'aria-live': 'polite' });

    box.appendChild(el('p', { class: 'tool-intro', text: 'The trapezoidal rule approximates an integral by adding up trapezoids. Drag n and see how fast the error shrinks.' }));
    box.appendChild(el('div', { class: 'ctrl-row' }, [sel]));
    box.appendChild(el('div', { class: 'ctrl-row' }, [el('label', { class: 'range-label' }, [document.createTextNode('Trapezoids n = '), rval, range])]));
    box.appendChild(holder);
    box.appendChild(info);

    function draw() {
      var T = TRAP[ti], n = parseInt(range.value, 10);
      var c = setupCanvas(canvas, holder), P = plotFrame(c, T.view), ctx = c.ctx;
      ctx.clearRect(0, 0, c.w, c.h);
      drawAxes(ctx, P);
      clipPlot(ctx, P);
      var h = (T.b - T.a) / n;
      for (var i = 0; i < n; i++) {
        var x0 = T.a + i * h, x1 = x0 + h;
        ctx.beginPath();
        ctx.moveTo(P.sx(x0), P.sy(0)); ctx.lineTo(P.sx(x0), P.sy(T.f(x0)));
        ctx.lineTo(P.sx(x1), P.sy(T.f(x1))); ctx.lineTo(P.sx(x1), P.sy(0)); ctx.closePath();
        ctx.fillStyle = cssv('--c6'); ctx.globalAlpha = 0.28; ctx.fill(); ctx.globalAlpha = 1;
        ctx.strokeStyle = cssv('--c6'); ctx.lineWidth = 1; ctx.stroke();
      }
      drawCurve(ctx, P, T.f, cssv('--c1'));
      ctx.restore();
    }
    function update() {
      var T = TRAP[ti], n = parseInt(range.value, 10), est = trap(T, n), err = Math.abs(est - T.exact);
      rval.textContent = String(n);
      var msg = 'T = ' + est.toFixed(6) + ' versus the exact ' + T.exact.toFixed(6) + '. Error ' + sci(err) + '. ';
      msg += est > T.exact + 1e-12 ? 'It overestimates because the curve bends upward (convex).' : (est < T.exact - 1e-12 ? 'It underestimates because the curve bends downward (concave).' : 'It matches the exact value.');
      if (n >= 2 && n % 2 === 0) {
        var errHalf = Math.abs(trap(T, n / 2) - T.exact);
        if (err > 1e-14) msg += ' Doubling n from ' + (n / 2) + ' to ' + n + ' divided the error by about ' + (errHalf / err).toFixed(2) + ' (the rule has error roughly proportional to 1/n²).';
      }
      info.textContent = msg;
      draw();
    }
    sel.addEventListener('change', function () { ti = parseInt(sel.value, 10); update(); });
    range.addEventListener('input', update);
    update();
    return { redraw: function () { if (box.offsetParent !== null) draw(); } };
  }

  function buildNumeric(host) {
    var seg = el('div', { class: 'seg', role: 'group', 'aria-label': 'Method' });
    var bN = el('button', { type: 'button', 'aria-pressed': 'true', text: "Newton's method" });
    var bT = el('button', { type: 'button', 'aria-pressed': 'false', text: 'Trapezoid rule' });
    seg.appendChild(bN); seg.appendChild(bT);
    var nBox = el('div'), tBox = el('div');
    tBox.hidden = true;
    host.appendChild(seg); host.appendChild(nBox); host.appendChild(tBox);
    var n = buildNewton(nBox), t = null;
    redraws.push(n.redraw);
    function pick(which) {
      bN.setAttribute('aria-pressed', String(which === 'n'));
      bT.setAttribute('aria-pressed', String(which === 't'));
      nBox.hidden = which !== 'n'; tBox.hidden = which !== 't';
      if (which === 't' && !t) { t = buildTrapezoid(tBox); redraws.push(t.redraw); }
      else redrawAll();
    }
    bN.addEventListener('click', function () { pick('n'); });
    bT.addEventListener('click', function () { pick('t'); });
  }

  /* =====================================================================
     3. ROBOT TASK PLANNING
     ===================================================================== */
  var SCENARIOS = [
    { title: 'Robot arm makes a cup of tea', intro: 'Put the steps in an order that works. Several orders can be valid; the check tests the dependencies between steps.',
      steps: ['Fill the kettle with water', 'Heat the water until it boils', 'Place a tea bag in the cup', 'Pour the hot water into the cup', 'Wait about 3 minutes for the tea to steep', 'Remove the tea bag'],
      rules: [
        [0, 1, 'Water must be in the kettle before it can be heated.'],
        [1, 3, 'Pouring before the water is hot gives cold tea.'],
        [2, 3, 'The tea bag has to be in the cup before the water is poured over it.'],
        [3, 4, 'Steeping only starts once hot water is in the cup.'],
        [4, 5, 'Removing the bag early gives weak tea.']
      ],
      fail: { facts: 'The kettle was full (1.0 L). The cup holds 250 mL. The robot poured for 10 seconds at 40 mL per second.', q: 'The counter ended up wet. What most likely happened?',
        options: [
          { t: 'The cup overflowed: 10 s × 40 mL/s = 400 mL, which is 150 mL more than the cup holds.', ok: true },
          { t: 'The water was not hot enough, so it spilled.', h: 'Water temperature does not change how much liquid ends up on the counter.' },
          { t: 'The tea bag absorbed the extra water.', h: 'A tea bag absorbs only a few millilitres, nowhere near 150 mL.' },
          { t: 'The kettle was empty.', h: 'The facts say the kettle was full.' }
        ],
        explain: '400 mL poured into a 250 mL cup leaves 150 mL with nowhere to go. A fix is to pour for about 6 seconds (240 mL) or to sense the fill level.' } },
    { title: 'Robot arm moves a box to a shelf', intro: 'Order the pick-and-place steps. Think about what each step needs to have happened first.',
      steps: ['Detect the position of the box with the camera', 'Open the gripper', 'Move the gripper next to the box', 'Close the gripper to grasp the box', 'Lift the box', 'Move to the shelf', 'Lower the box onto the shelf', 'Open the gripper to release the box', 'Retreat the arm'],
      rules: [
        [0, 2, 'The robot needs the box position before it can move toward it.'],
        [1, 2, 'The gripper must already be open to fit around the box.'],
        [2, 3, 'The gripper cannot grasp a box it has not reached.'],
        [3, 4, 'Lifting before gripping would leave the box on the table.'],
        [4, 5, 'Carry the box only after lifting it clear.'],
        [5, 6, 'Lowering happens at the shelf, after arriving there.'],
        [6, 7, 'Releasing before the box rests on the shelf would drop it.'],
        [7, 8, 'Retreating before releasing would pull the box back off the shelf.']
      ],
      fail: { facts: 'The box has a mass of 3 kg. Each of the two gripper pads pushes with 5 N. The friction coefficient between pad and box is 0.4. Take g = 9.8 m/s².', q: 'The box slipped out during the lift. Why?',
        options: [
          { t: 'Friction is too small: 2 pads × 0.4 × 5 N = 4 N, but the box weighs 3 × 9.8 = 29.4 N.', ok: true },
          { t: 'The camera found the wrong box.', h: 'Slipping during the lift is a force problem, not a perception problem. Compare friction with weight.' },
          { t: 'The shelf was too high.', h: 'The slip happened during the lift, before the arm reached the shelf.' },
          { t: 'The gripper closed too slowly.', h: 'The speed of closing does not change the final friction force.' }
        ],
        explain: 'Maximum friction = μ × N × 2 pads = 0.4 × 5 × 2 = 4 N, far below the 29.4 N weight. Each pad would need at least 29.4 / (2 × 0.4) ≈ 36.75 N.' } },
    { title: 'Robot arm opens a door', intro: 'Order the steps for opening a latched door with a lever handle.',
      steps: ['Detect the door handle', 'Move the gripper to the handle', 'Grasp the handle', 'Rotate the handle downward', 'Pull the door open', 'Release the handle'],
      rules: [
        [0, 1, 'The robot needs to know where the handle is before moving to it.'],
        [1, 2, 'The gripper must be at the handle before it can grasp it.'],
        [2, 3, 'The handle cannot be turned without a grip on it.'],
        [3, 4, 'A latched door will not open until the handle is turned.'],
        [4, 5, 'Letting go early would let the door swing back.']
      ],
      fail: { facts: 'The handle needs 3 N·m of torque to turn. The gripper holds the handle 0.10 m from the pivot and can push with 20 N.', q: 'The handle did not turn. Why?',
        options: [
          { t: 'Torque = 20 N × 0.10 m = 2 N·m, which is less than the 3 N·m required.', ok: true },
          { t: 'The door was locked from the other side.', h: 'Nothing in the facts says it was locked. Compare the torque with the requirement.' },
          { t: 'The gripper pushed in the wrong direction.', h: 'The facts give no sign of that. Check the numbers first.' },
          { t: 'The pivot distance is too large.', h: 'A larger distance from the pivot gives more torque, not less.' }
        ],
        explain: 'τ = F × r = 20 × 0.10 = 2 N·m, below the 3 N·m needed. It needs F ≥ 3 / 0.10 = 30 N, or a grip farther from the pivot (r ≥ 0.15 m).' } }
  ];

  function buildRobot(host) {
    var order = shuffled(SCENARIOS.map(function (_, i) { return i; })), pos = 0;
    host.appendChild(el('p', { class: 'tool-intro', text: 'Break a robot task into steps, then diagnose a failure using the physics. Use the arrow buttons to reorder.' }));
    var wrap = el('div');
    host.appendChild(wrap);

    function nextScenario() {
      if (pos >= order.length) { order = shuffled(order); pos = 0; }
      render(SCENARIOS[order[pos++]]);
    }

    function violations(S, seq) {
      var where = {};
      seq.forEach(function (id, i) { where[id] = i; });
      return S.rules.filter(function (r) { return where[r[0]] > where[r[1]]; });
    }

    function render(S) {
      wrap.textContent = '';
      var seq = S.steps.map(function (_, i) { return i; });
      do { seq = shuffled(seq); } while (violations(S, seq).length === 0);

      wrap.appendChild(el('h3', { class: 'tool-title', text: S.title }));
      wrap.appendChild(el('p', { class: 'tool-note', text: S.intro }));
      var list = el('ol', { class: 'plan' });
      var fb = el('div', { class: 'feedback', role: 'status', 'aria-live': 'polite' });
      var phase2 = el('div', { class: 'reveal-box' });
      var check = el('button', { class: 'btn primary small', type: 'button', text: 'Check order' });
      wrap.appendChild(list);
      wrap.appendChild(el('div', { class: 'ctrl-row' }, [check]));
      wrap.appendChild(fb);
      wrap.appendChild(phase2);
      var locked = false;

      function paint(focusId, focusDir) {
        list.textContent = '';
        seq.forEach(function (id, i) {
          var up = el('button', { class: 'mv', type: 'button', 'data-id': id, 'data-dir': 'up', 'aria-label': 'Move up: ' + S.steps[id], text: '▲' });
          var dn = el('button', { class: 'mv', type: 'button', 'data-id': id, 'data-dir': 'down', 'aria-label': 'Move down: ' + S.steps[id], text: '▼' });
          up.disabled = locked || i === 0;
          dn.disabled = locked || i === seq.length - 1;
          up.addEventListener('click', function () { move(i, -1, id, 'up'); });
          dn.addEventListener('click', function () { move(i, 1, id, 'down'); });
          list.appendChild(el('li', {}, [el('span', { class: 'plan-text', text: S.steps[id] }), el('span', { class: 'mvs' }, [up, dn])]));
        });
        if (focusId !== undefined) {
          var f = $('[data-id="' + focusId + '"][data-dir="' + focusDir + '"]', list);
          if (f && !f.disabled) f.focus({ preventScroll: true });
          else { var alt = $('[data-id="' + focusId + '"]:not(:disabled)', list); if (alt) alt.focus({ preventScroll: true }); }
        }
      }
      function move(i, d, id, dir) {
        var j = i + d, t = seq[i]; seq[i] = seq[j]; seq[j] = t;
        fb.textContent = '';
        paint(id, dir);
      }
      paint();

      check.addEventListener('click', function () {
        var bad = violations(S, seq);
        fb.textContent = '';
        if (bad.length) {
          fb.appendChild(el('strong', { class: 'bad', text: bad.length + ' dependenc' + (bad.length === 1 ? 'y is' : 'ies are') + ' broken. ' }));
          var ul = el('ul', { class: 'viol' });
          bad.slice(0, 3).forEach(function (r) {
            ul.appendChild(el('li', {}, [el('b', { text: '"' + S.steps[r[0]] + '" must come before "' + S.steps[r[1]] + '". ' }), document.createTextNode(r[2])]));
          });
          fb.appendChild(ul);
          return;
        }
        locked = true; check.disabled = true;
        paint();
        fb.appendChild(el('strong', { class: 'ok', text: 'Valid plan. ' }));
        fb.appendChild(document.createTextNode('Every step has what it needs before it runs. Now a failure analysis.'));
        failurePhase();
      });

      function failurePhase() {
        phase2.textContent = '';
        phase2.appendChild(el('p', { class: 'block-label', text: 'Failure analysis' }));
        phase2.appendChild(el('p', { class: 'facts-box', text: S.fail.facts }));
        phase2.appendChild(el('p', { class: 'q', text: S.fail.q }));
        var opts = el('div', { class: 'opts' });
        var fb2 = el('div', { class: 'feedback', role: 'status', 'aria-live': 'polite' });
        var buttons = shuffled(S.fail.options).map(function (o) {
          var b = el('button', { class: 'opt', type: 'button', text: o.t });
          b.addEventListener('click', function () {
            fb2.textContent = '';
            if (o.ok) {
              buttons.forEach(function (x) { x.disabled = true; });
              b.classList.add('right');
              fb2.appendChild(el('strong', { class: 'ok', text: 'Correct. ' }));
              fb2.appendChild(document.createTextNode(S.fail.explain));
              var nb = el('button', { class: 'btn primary small', type: 'button', text: 'Next scenario →' });
              nb.addEventListener('click', nextScenario);
              phase2.appendChild(nb);
              nb.focus({ preventScroll: true });
            } else {
              b.classList.add('wrong'); b.disabled = true;
              fb2.appendChild(el('strong', { class: 'bad', text: 'Not quite. ' }));
              fb2.appendChild(document.createTextNode(o.h));
            }
          });
          opts.appendChild(b);
          return b;
        });
        phase2.appendChild(opts);
        phase2.appendChild(fb2);
        phase2.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
    nextScenario();
  }

  /* =====================================================================
     Tabs + shared redraw handling
     ===================================================================== */
  var TOOLS = [
    { id: 'compare', name: 'Compare responses', k: 1, build: buildCompare },
    { id: 'numeric', name: 'Numerical methods', k: 6, build: buildNumeric },
    { id: 'robot', name: 'Robot tasks', k: 4, build: buildRobot }
  ];
  var built = {};

  function redrawAll() { redraws.forEach(function (fn) { try { fn(); } catch (e) { /* ignore */ } }); }

  function show(i) {
    TOOLS.forEach(function (t, j) {
      var on = i === j;
      t.tab.setAttribute('aria-selected', String(on));
      t.tab.setAttribute('tabindex', on ? '0' : '-1');
      t.panel.hidden = !on;
    });
    var t = TOOLS[i];
    if (!built[t.id]) { built[t.id] = true; t.build(t.panel); }
    else redrawAll();
  }

  TOOLS.forEach(function (t, i) {
    t.tab = el('button', { class: 'tab', role: 'tab', id: 'labtab-' + t.id, type: 'button', text: t.name, 'aria-controls': 'labpanel-' + t.id, 'data-k': t.k });
    t.panel = el('div', { class: 'card panel lab-panel', role: 'tabpanel', id: 'labpanel-' + t.id, 'aria-labelledby': 'labtab-' + t.id, 'data-k': t.k });
    t.panel.hidden = true;
    t.tab.addEventListener('click', function () { show(i); });
    t.tab.addEventListener('keydown', function (e) {
      var n = null;
      if (e.key === 'ArrowRight') n = (i + 1) % TOOLS.length;
      if (e.key === 'ArrowLeft') n = (i - 1 + TOOLS.length) % TOOLS.length;
      if (n !== null) { e.preventDefault(); show(n); TOOLS[n].tab.focus(); }
    });
    tabsEl.appendChild(t.tab);
    panelsEl.appendChild(t.panel);
  });
  show(0);

  // Canvas colours come from CSS variables, so redraw when the theme changes or the window resizes.
  new MutationObserver(redrawAll).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  var rt = null, lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth === lastW) return;   // ignore mobile address-bar height changes
    lastW = window.innerWidth;
    clearTimeout(rt); rt = setTimeout(redrawAll, 120);
  });
})();
