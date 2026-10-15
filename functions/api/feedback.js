// Cloudflare Pages Function: /api/feedback
//
//   POST  saves what the visitor chose to share, in Cloudflare KV (free):
//           kind "visit"     the visitor's name (optional), the language and the time, written when they ask their first question
//           kind "feedback"  the rating (1 to 5), an optional message and the number of questions asked
//         Both carry the same random session id, so the private page can show one row per conversation.
//         Question texts are NOT saved. No IP address is saved.
//   GET   /api/feedback?key=YOUR_ADMIN_KEY   a private page for Mukeem: name, date and time (India time), rating and comment.
//
// Needs two settings in the Cloudflare dashboard (Workers & Pages > this project > Settings):
//   Bindings > Add > KV namespace   variable name FEEDBACK   (create the namespace first under Workers & Pages > KV)
//   Variables and Secrets > Add     ADMIN_KEY                (a long random text only Mukeem knows; it goes in the address above)
// Without the KV binding the function answers 503 and the page offers to send the feedback by email instead.

const MAX_TEXT = 500;
const MAX_NAME = 40;
const LANGS = { en: 1, hi: 1, ur: 1 };
const FACES = ['😞', '😕', '😐', '🙂', '😍'];
const LABELS = ['Very bad', 'Bad', 'Okay', 'Good', 'Great'];
const TTL_SECONDS = 60 * 60 * 24 * 400;   // kept for about 13 months
const SID = /^[a-f0-9]{16}$/;

const seen = new Map();   // best-effort limits per visitor (each running instance counts for itself)

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }, extra)
  });
}
function plain(text, status) {
  return new Response(text, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}
function cleanName(v) {
  if (typeof v !== 'string') return '';
  const n = v.replace(/[^\p{L}\p{M} .'-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);
  return /\p{L}/u.test(n) ? n : '';
}
function cleanText(v) {
  if (typeof v !== 'string') return '';
  return v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/[ \t]+/g, ' ').trim().slice(0, MAX_TEXT);
}
function tooMany(bucket, ip, limit) {
  const now = Date.now(), k = bucket + ':' + ip;
  const list = (seen.get(k) || []).filter((t) => now - t < 3600000);
  if (list.length >= limit) { seen.set(k, list); return true; }
  list.push(now);
  seen.set(k, list);
  if (seen.size > 4000) seen.clear();
  return false;
}
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function sameKey(a, b) {   // compares without stopping at the first difference
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
function istText(iso) {
  try {
    return new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(iso)) + ' IST';
  } catch (e) {
    return iso.replace('T', ' ').slice(0, 16) + ' UTC';
  }
}
const reversedStamp = () => String(9999999999999 - Date.now()).padStart(13, '0');   // plain text order then means newest first

async function save(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) return json({ error: 'forbidden' }, 403);
  if (!(request.headers.get('Content-Type') || '').includes('application/json')) return json({ error: 'bad_request' }, 400);

  let body;
  try {
    const raw = await request.text();
    if (raw.length > 3000) return json({ error: 'bad_request' }, 413);
    body = JSON.parse(raw);
  } catch (e) {
    return json({ error: 'bad_request' }, 400);
  }
  if (!body || typeof body !== 'object') return json({ error: 'bad_request' }, 400);
  const kind = body.kind === 'visit' ? 'visit' : 'feedback';
  const sid = typeof body.sid === 'string' && SID.test(body.sid) ? body.sid : '';
  const lang = LANGS[body.lang] ? body.lang : 'en';

  let entry, key, bucket, limit;
  if (kind === 'visit') {
    if (!sid) return json({ error: 'bad_request' }, 400);
    entry = { sid, t: new Date().toISOString(), name: cleanName(body.name), lang };
    key = 'v:' + reversedStamp() + ':' + sid;
    bucket = 'visit'; limit = 20;
  } else {
    const rating = Number.isInteger(body.rating) ? body.rating : 0;
    if (rating < 1 || rating > 5) return json({ error: 'bad_request' }, 400);
    entry = {
      sid, t: new Date().toISOString(), rating, name: cleanName(body.name), text: cleanText(body.text), lang,
      asked: Number.isInteger(body.asked) && body.asked >= 0 && body.asked <= 100 ? body.asked : 0
    };
    key = 'fb:' + reversedStamp() + ':' + Math.random().toString(16).slice(2, 8);
    bucket = 'feedback'; limit = 6;
  }

  if (!env || !env.FEEDBACK) return json({ error: 'storage_unavailable' }, 503);
  const ip = request.headers.get('CF-Connecting-IP') || 'anonymous';
  if (tooMany(bucket, ip, limit)) return json({ error: 'rate_limited' }, 429, { 'Retry-After': '3600' });

  try {
    await env.FEEDBACK.put(key, JSON.stringify(entry), { expirationTtl: TTL_SECONDS });
  } catch (e) {
    return json({ error: 'storage_unavailable' }, 503);
  }
  return json({ ok: true });
}

// one row per conversation: the visit (name and time) joined with its rating and message
function buildSessions(visits, feedbacks) {
  const bySid = new Map();
  feedbacks.forEach((f) => { if (f.sid && !bySid.has(f.sid)) bySid.set(f.sid, f); });
  const used = new Set();
  const rows = visits.map((v) => {
    const f = bySid.get(v.sid); if (f) used.add(f);
    return { t: v.t, name: v.name || (f && f.name) || '', lang: v.lang, asked: f ? f.asked : null, rating: f ? f.rating : 0, text: f ? f.text : '', rated: !!f };
  });
  feedbacks.forEach((f) => { if (!used.has(f)) rows.push({ t: f.t, name: f.name || '', lang: f.lang, asked: f.asked, rating: f.rating, text: f.text, rated: true }); });
  rows.sort((a, b) => (a.t < b.t ? 1 : a.t > b.t ? -1 : 0));
  return rows;
}

async function adminView(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const secret = env && env.ADMIN_KEY;
  if (typeof secret !== 'string' || secret.length < 12) {
    return plain('The private feedback page is switched off until ADMIN_KEY (at least 12 characters) is set in the Cloudflare dashboard.', 503);
  }
  if (!sameKey(url.searchParams.get('key'), secret)) return plain('Not found', 404);
  if (!env.FEEDBACK) return plain('The FEEDBACK KV binding is not set up yet.', 503);

  const [lv, lf] = await Promise.all([env.FEEDBACK.list({ prefix: 'v:', limit: 500 }), env.FEEDBACK.list({ prefix: 'fb:', limit: 500 })]);
  const read = async (keys) => (await Promise.all(keys.map((k) => env.FEEDBACK.get(k.name, 'json')))).filter(Boolean);
  const sessions = buildSessions(await read(lv.keys), await read(lf.keys));

  if (url.searchParams.get('format') === 'json') {
    return json({ count: sessions.length, sessions: sessions.map((s) => Object.assign({ time_ist: istText(s.t) }, s)) }, 200, { 'X-Robots-Tag': 'noindex' });
  }

  const rated = sessions.filter((s) => s.rated);
  const counts = [0, 0, 0, 0, 0];
  let sum = 0;
  rated.forEach((s) => { counts[s.rating - 1]++; sum += s.rating; });
  const avg = rated.length ? (sum / rated.length).toFixed(2) : '–';
  const bars = counts.map((c, n) => '<div class="row"><span class="face" title="' + esc(LABELS[n]) + '">' + FACES[n] + '</span><span class="bar"><span style="width:' + (rated.length ? Math.round(c * 100 / rated.length) : 0) + '%"></span></span><b>' + c + '</b></div>').join('');
  const rows = sessions.map((s) => '<tr><td>' + esc(istText(s.t)) + '</td><td>' + esc(s.name || '–') + '</td><td>' + (s.asked === null ? '–' : esc(s.asked)) + '</td><td class="face" title="' + (s.rated ? esc(LABELS[s.rating - 1]) : 'no rating given') + '">' + (s.rated ? FACES[s.rating - 1] + ' ' + s.rating + '/5' : '–') + '</td><td class="msg">' + esc(s.text || '–') + '</td><td>' + esc(s.lang) + '</td></tr>').join('');
  const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Assistant visitors | private</title><style>'
    + 'body{font:16px/1.5 system-ui,sans-serif;margin:0;padding:24px;background:#0b1020;color:#e8ecff}h1{margin:0 0 4px}p{color:#9aa6cc;margin:0 0 20px}'
    + '.card{background:#141c3a;border:1px solid #243058;border-radius:14px;padding:16px;margin-bottom:20px;max-width:560px}'
    + '.row{display:flex;align-items:center;gap:10px;margin:6px 0}.face{font-size:1.2rem;white-space:nowrap}.bar{flex:1;height:10px;background:#0f1630;border:1px solid #243058;border-radius:10px;overflow:hidden}'
    + '.bar span{display:block;height:100%;background:#8b8dff}.big{font-size:2rem;font-weight:800}.small{font-size:1rem;font-weight:400;color:#9aa6cc}table{border-collapse:collapse;width:100%;font-size:.92rem}'
    + 'th,td{text-align:left;padding:8px 10px;border-bottom:1px solid #243058;vertical-align:top}th{color:#9aa6cc;font-weight:600;white-space:nowrap}td:first-child{white-space:nowrap}.msg{white-space:pre-wrap;word-break:break-word;min-width:200px}'
    + '.wrap{overflow-x:auto}</style></head><body><h1>People who used the assistant</h1><p>Private page. Newest first. Times are India time (IST). Question texts are not saved.</p>'
    + '<div class="card"><div class="big">' + esc(avg) + ' <span class="small">average of ' + rated.length + (rated.length === 1 ? ' rating' : ' ratings') + ' &middot; ' + sessions.length + (sessions.length === 1 ? ' conversation' : ' conversations') + '</span></div>' + bars + '</div>'
    + '<div class="wrap"><table><thead><tr><th>Date and time</th><th>Name</th><th>Questions</th><th>Rating</th><th>Comment</th><th>Language</th></tr></thead><tbody>' + (rows || '<tr><td colspan="6">Nobody yet.</td></tr>') + '</tbody></table></div></body></html>';
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', 'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'", 'X-Content-Type-Options': 'nosniff'
    }
  });
}

export async function onRequest(context) {
  const m = context.request.method;
  if (m === 'POST') return save(context);
  if (m === 'GET') return adminView(context);
  return json({ error: 'method_not_allowed' }, 405, { Allow: 'GET, POST' });
}
