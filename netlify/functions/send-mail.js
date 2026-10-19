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

const money = n => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
const when = () => new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST';

/* A simple branded wrapper so every email looks tidy. EDIT THE LOOK OF ALL EMAILS HERE. */
const wrap = (title, body, badge) => `<div style="font-family:Arial,sans-serif;background:#f7f1e8;padding:24px">
  <div style="max-width:560px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e6d9c8">
    <div style="background:#201510;color:#f7f1e8;padding:18px 24px;font-size:18px;letter-spacing:.12em">NOIR <span style="color:#c18b55">&amp;</span> BEAN</div>
    <div style="padding:24px;color:#201510"><h2 style="margin:0 0 6px;font-size:20px">${esc(title)}</h2>${badge || ''}${body}
      <p style="margin:22px 0 0;font-size:12px;color:#85776c">Received ${esc(when())}.</p></div>
  </div></div>`;
const row = (k, v) => `<p style="margin:6px 0;font-size:14px"><b>${esc(k)}:</b> ${esc(v)}</p>`;
const badge = (text, ok) => `<p style="margin:6px 0 14px"><span style="display:inline-block;padding:3px 12px;border-radius:99px;font-size:12px;font-weight:bold;background:${ok ? '#e6f4ea' : '#fff3d6'};color:${ok ? '#1e6b34' : '#8a5a00'}">${esc(text)}</span></p>`;
const heading = t => `<h3 style="margin:18px 0 6px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#85776c">${esc(t)}</h3>`;
const billRow = (k, v, strong) => `<tr><td style="padding:3px 0;${strong ? 'font-weight:bold;font-size:16px;border-top:2px solid #201510;padding-top:8px' : 'color:#5d4d42'}">${esc(k)}</td><td style="padding:3px 0;text-align:right;${strong ? 'font-weight:bold;font-size:16px;border-top:2px solid #201510;padding-top:8px' : 'color:#5d4d42'}">${esc(v)}</td></tr>`;

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
    const o = d.order || {}, c = d.customer || {}, b = o.bill || {};
    const id = clip(o.id, 12), name = clip(c.name, 80), email = clip(c.email, 254), dial = clip(c.dial, 5), phone = clip(c.phone, 15), addr = clip(c.addr, 250);
    const items = (Array.isArray(o.items) ? o.items : []).slice(0, 40).map(i => ({ n: clip(i && i.n, 80), q: Math.max(1, Math.min(99, Math.round(Number(i && i.q)) || 1)), p: Math.max(0, Math.min(1e5, Number(i && i.p) || 0)), size: clip(i && i.size, 3), note: clip(i && i.note, 120) })).filter(i => i.n);
    const total = Number(o.total), num = k => Math.max(0, Math.min(1e6, Number(b[k]) || 0));
    if (!/^NB\d{4}$/.test(id) || name.length < 2 || !EMAIL_RE.test(email) || !/^\+\d{1,4}$/.test(dial) || !/^\d{6,15}$/.test(phone) || !items.length || !(total >= 0 && total < 1e6)) return { error: 'Invalid order' };
    const mode = o.mode === 'pickup' ? 'Pickup' : 'Delivery', pay = ['Card', 'UPI', 'Cash'].includes(o.pay) ? o.pay : 'Cash', payNote = clip(o.payNote, 40) || pay, paid = o.paid === true;
    const statusText = paid ? 'PAID (SAMPLE PAYMENT)' : (mode === 'Pickup' ? 'PAY AT COUNTER' : 'CASH ON DELIVERY');
    const bill = { sub: num('sub'), pr: num('pr'), disc: num('disc'), tax: num('tax'), ship: num('ship') };
    const list = items.map(i => `<tr><td style="padding:6px 0;border-bottom:1px solid #eee">${esc(i.n)}${i.size ? ' (' + esc(i.size) + ')' : ''}${i.note ? `<br><span style="font-size:12px;color:#85776c">${esc(i.note)}</span>` : ''}<br><span style="font-size:12px;color:#85776c">${money(i.p)} each</span></td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:center">× ${i.q}</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">${money(i.p * i.q)}</td></tr>`).join('');
    const html = wrap(`New order ${id}`,
      heading('Customer') + row('Name', name) + row('Phone', `${dial} ${phone}`) + row('Email', email) + row('Order type', mode) + (mode === 'Delivery' ? row('Delivery address', addr) : '')
      + heading('Items') + `<table style="width:100%;border-collapse:collapse;font-size:14px">${list}</table>`
      + heading('Bill') + `<table style="width:100%;border-collapse:collapse;font-size:14px">${billRow('Subtotal', money(bill.sub))}${bill.pr ? billRow('Promo WARM10', '−' + money(bill.pr)) : ''}${bill.disc ? billRow('Rewards', '−' + money(bill.disc)) : ''}${billRow('GST (5%)', money(bill.tax))}${billRow('Delivery', bill.ship ? money(bill.ship) : 'Free')}${billRow('Total', money(total), true)}</table>`
      + heading('Payment') + row('Method', payNote) + `<p style="margin:6px 0;font-size:12px;color:#85776c">Sample checkout: no real money was taken.</p>`,
      badge(statusText, paid));
    const text = `New order ${id} (${statusText})\n\nCustomer: ${name}\nPhone: ${dial} ${phone}\nEmail: ${email}\nType: ${mode}${mode === 'Delivery' ? '\nAddress: ' + addr : ''}\n\nItems:\n` + items.map(i => `- ${i.n}${i.size ? ' (' + i.size + ')' : ''} x${i.q} @ ${money(i.p)} = ${money(i.p * i.q)}${i.note ? ' [' + i.note + ']' : ''}`).join('\n')
      + `\n\nSubtotal: ${money(bill.sub)}${bill.pr ? '\nPromo: -' + money(bill.pr) : ''}${bill.disc ? '\nRewards: -' + money(bill.disc) : ''}\nGST (5%): ${money(bill.tax)}\nDelivery: ${bill.ship ? money(bill.ship) : 'Free'}\nTOTAL: ${money(total)}\n\nPayment: ${payNote}\nReceived: ${when()}`;
    return { subject: `New order ${id} — ${money(total)} · ${paid ? 'Paid via ' + pay : mode === 'Pickup' ? 'Pay at counter' : 'Cash on delivery'}`, replyTo: email, html, text };
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
