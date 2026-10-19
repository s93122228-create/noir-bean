/*
  NOIR & BEAN — send-mail (Netlify Function)
  ------------------------------------------------------------------
  Runs on the SERVER, so the secret API key never reaches the browser.
  The website calls:  POST /.netlify/functions/send-mail
  with JSON like     { "type": "order" | "newsletter" | "review", ... }

  Settings come from Netlify "Environment variables" (never from code):
    RESEND_API_KEY  (required)  your secret key from resend.com
    RECEIVER_EMAIL  (optional)  who gets the emails; default below
    MAIL_FROM       (optional)  default is Resend's test sender
*/

const RECEIVER = process.env.RECEIVER_EMAIL || 's93122228@gmail.com';
const FROM = process.env.MAIL_FROM || 'Noir & Bean <onboarding@resend.dev>';

/* The recipient is fixed on the server. The browser can NOT choose it,
   so nobody can use this endpoint to email other people. */

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const hits = new Map(); // simple rate limit: 10 requests / 10 minutes / visitor (per server instance)

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clip = (s, n) => String(s == null ? '' : s).trim().slice(0, n);
const json = (code, body) => ({ statusCode: code, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

function limited(ip) {
  const now = Date.now(), win = 10 * 60 * 1000, list = (hits.get(ip) || []).filter(t => now - t < win);
  list.push(now); hits.set(ip, list);
  if (hits.size > 500) hits.clear();
  return list.length > 10;
}

/* A simple branded wrapper so every email looks tidy */
const wrap = (title, rows) => `<div style="font-family:Arial,sans-serif;background:#f7f1e8;padding:24px">
  <div style="max-width:560px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e6d9c8">
    <div style="background:#201510;color:#f7f1e8;padding:18px 24px;font-size:18px;letter-spacing:.12em">NOIR <span style="color:#c18b55">&amp;</span> BEAN</div>
    <div style="padding:24px;color:#201510"><h2 style="margin:0 0 14px;font-size:20px">${esc(title)}</h2>${rows}</div>
  </div></div>`;
const row = (k, v) => `<p style="margin:6px 0;font-size:14px"><b>${esc(k)}:</b> ${esc(v)}</p>`;

function build(d) {
  if (d.type === 'newsletter') {
    const email = clip(d.email, 254);
    if (!EMAIL_RE.test(email)) return { error: 'Invalid email' };
    return { subject: 'New newsletter subscriber', replyTo: email,
      html: wrap('New newsletter subscriber', row('Email', email)), text: `New newsletter subscriber: ${email}` };
  }
  if (d.type === 'review') {
    const name = clip(d.name, 60), text = clip(d.text, 1000), rating = Math.round(Number(d.rating));
    if (name.length < 2 || text.length < 10 || !(rating >= 1 && rating <= 5)) return { error: 'Invalid review' };
    return { subject: `New review: ${rating}/5 from ${name}`,
      html: wrap('New review', row('Name', name) + row('Rating', '★'.repeat(rating) + '☆'.repeat(5 - rating) + ` (${rating}/5)`) + row('Review', text)),
      text: `New review from ${name} (${rating}/5): ${text}` };
  }
  if (d.type === 'order') {
    const o = d.order || {}, c = d.customer || {};
    const id = clip(o.id, 12), name = clip(c.name, 80), email = clip(c.email, 254), phone = clip(c.phone, 15), addr = clip(c.addr, 250);
    const items = (Array.isArray(o.items) ? o.items : []).slice(0, 40).map(i => ({ n: clip(i && i.n, 80), q: Math.max(1, Math.min(99, Math.round(Number(i && i.q)) || 1)) })).filter(i => i.n);
    const total = Number(o.total);
    if (!/^NB\d{4}$/.test(id) || name.length < 2 || !EMAIL_RE.test(email) || !/^\d{10}$/.test(phone) || !items.length || !(total >= 0 && total < 1e6)) return { error: 'Invalid order' };
    const mode = o.mode === 'pickup' ? 'Pickup' : 'Delivery', pay = clip(o.pay, 30);
    const list = items.map(i => `<tr><td style="padding:4px 0">${esc(i.n)}</td><td style="padding:4px 0;text-align:right">× ${i.q}</td></tr>`).join('');
    return { subject: `New order ${id} — ₹${Math.round(total)}`, replyTo: email,
      html: wrap(`New order ${id}`, row('Customer', name) + row('Email', email) + row('Phone', phone) + row('Type', mode) + (mode === 'Delivery' ? row('Address', addr) : '') + row('Payment', pay)
        + `<table style="width:100%;margin:14px 0;font-size:14px;border-top:1px solid #eee;border-bottom:1px solid #eee">${list}</table>` + `<p style="font-size:16px"><b>Total: ₹${Math.round(total)}</b></p>`),
      text: `New order ${id}\n${name} | ${email} | ${phone}\n${mode}${mode === 'Delivery' ? ' to ' + addr : ''} | ${pay}\n` + items.map(i => `${i.n} x${i.q}`).join('\n') + `\nTotal: ₹${Math.round(total)}` };
  }
  return { error: 'Unknown type' };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });
  if ((event.body || '').length > 10000) return json(413, { error: 'Too large' });
  const headers = event.headers || {}, ip = headers['x-nf-client-connection-ip'] || (headers['x-forwarded-for'] || '').split(',')[0] || 'unknown';
  if (limited(ip)) return json(429, { error: 'Too many requests, try again later' });

  let data; try { data = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Bad JSON' }); }
  const mail = build(data || {});
  if (mail.error) return json(400, { error: mail.error });

  const key = process.env.RESEND_API_KEY;
  if (!key) return json(500, { error: 'Mail is not configured yet (missing RESEND_API_KEY)' });

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [RECEIVER], subject: mail.subject, html: mail.html, text: mail.text, ...(mail.replyTo ? { reply_to: mail.replyTo } : {}) })
    });
    if (!r.ok) { console.error('Resend error', r.status, await r.text()); return json(502, { error: 'Mail provider rejected the request' }); }
    return json(200, { ok: true });
  } catch (err) {
    console.error('Mail send failed', err);
    return json(502, { error: 'Could not reach the mail provider' });
  }
};
