'use strict';
document.documentElement.classList.add('js');
/* ---------- Data (edit freely) ---------- */
const U = (id, w = 800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;
const PRODUCTS = [
  {id:1,name:'Signature Espresso',desc:'Double shot, dark chocolate and toasted almond notes.',price:180,cat:'Hot Coffee',img:'1514432324607-a09d9b4aefdd',badge:'Bestseller',pop:98,sizes:true},
  {id:2,name:'Velvet Cappuccino',desc:'Silky microfoam over a rich espresso base.',price:220,cat:'Hot Coffee',img:'1495474472287-4d71bcdd2085',badge:'Bestseller',pop:95,sizes:true},
  {id:3,name:'Caramel Cloud Latte',desc:'Whipped caramel cream floating on steamed milk.',price:260,cat:'Hot Coffee',img:'1517701550927-30cf4ba1dba5',badge:'New',pop:88,sizes:true},
  {id:4,name:'Vanilla Cold Brew',desc:'18-hour steeped cold brew with Madagascar vanilla.',price:280,cat:'Cold Coffee',img:'1461023058943-07fcbe16d735',badge:'Bestseller',pop:92,sizes:true},
  {id:5,name:'Mocha Noir',desc:'Dark cocoa, espresso and steamed milk.',price:250,cat:'Hot Coffee',img:'1509042239860-f550ce710b93',badge:'',pop:80,sizes:true},
  {id:6,name:'Spanish Latte',desc:'Sweetened condensed milk meets bold espresso.',price:270,cat:'Cold Coffee',img:'1447933601403-0c6688de566e',badge:'',pop:84,sizes:true},
  {id:7,name:'Matcha Cloud',desc:'Ceremonial-grade matcha under soft milk foam.',price:290,cat:'Tea',img:'1515823064-d6e0c04616a7',badge:'New',pop:76,sizes:true},
  {id:8,name:'Chocolate Croissant',desc:'Buttery laminated pastry, baked each morning.',price:160,cat:'Bakery',img:'1555507036-ab1f4038808a',badge:'Bestseller',pop:90,sizes:false}
];
const SIZES = {S:0, M:40, L:80};
const CATS = ['All','Hot Coffee','Cold Coffee','Tea','Bakery'];
const STEPS = [
  ['Beans','Small lots chosen for sweetness and clarity.','1447933601403-0c6688de566e'],
  ['Roasting','Small batches, profiled and cupped every day.','1559496417-e7f25cb247f3'],
  ['Brewing','Dialled-in grind, dose and temperature.','1514432324607-a09d9b4aefdd'],
  ['Serving','Served at its peak, never rushed.','1495474472287-4d71bcdd2085']];
const TESTI = [
  ['Aarav M.','The cappuccino is the smoothest I have had in the city. (Demo quote)',5],
  ['Sana K.','Quiet corners, great light and a flaky croissant. (Demo quote)',5],
  ['Rohan P.','Cold brew that actually tastes like coffee. (Demo quote)',4]];
const GALLERY = [
  ['1521017432531-fbd92d768814','Main room','w'],['1559496417-e7f25cb247f3','Counter',''],['1555507036-ab1f4038808a','Fresh pastries','t2'],
  ['1514432324607-a09d9b4aefdd','The pour',''],['1442512595331-e89e73853f31','Window seats','w'],['1495474472287-4d71bcdd2085','Latte art','']];

/* ---------- Helpers ---------- */
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rupee = n => '₹' + n.toLocaleString('en-IN');
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store = {get:(k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set:(k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }};
/* ---------- Email (via the Netlify Function in netlify/functions/send-mail.js) ----------
   Fire-and-forget: if the mail service is not connected (e.g. opening the file locally) the site still works. */
const sendMail = (type, data) => fetch('/.netlify/functions/send-mail', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({type, ...data})}).then(r => r.ok).catch(() => false);
document.addEventListener('error', e => { if (e.target.tagName === 'IMG') e.target.classList.add('broken'); }, true);
function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; $('#toasts').append(t); setTimeout(() => t.remove(), 2900); }

/* ---------- State ---------- */
let cart = store.get('nb-cart', []).filter(i => PRODUCTS.some(p => p.id === i.id) && i.qty > 0);
let wish = new Set(store.get('nb-wish', []));
const view = {q:'', cat:'All', sort:'pop'};
const sizeSel = {};
const unit = (p, size, o) => p.price + (p.sizes ? SIZES[size || 'M'] : 0) + (o ? (o.shot ? 40 : 0) + (o.milk && o.milk !== 'Whole' ? 30 : 0) : 0);

/* ---------- Products ---------- */
function card(p, i = 0) {
  const sz = sizeSel[p.id] || 'M';
  return `<article class="card" data-id="${p.id}" data-cat="${p.cat}" style="--n:${i}">
    <div class="arch"><span class="ring"></span><div class="pic"><img loading="lazy" width="400" height="500" src="${U(p.img, 600)}" alt="${esc(p.name)}"></div>
      ${p.badge ? `<span class="seal">${p.badge}</span>` : ''}
      <button class="wish" aria-pressed="${wish.has(p.id)}" aria-label="Wishlist ${esc(p.name)}" data-act="wish"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.500-7 10-7 10z"/></svg></button>
      <button class="qv" data-act="qv">Quick view</button></div>
    <div class="c-body"><div class="nm"><h3>${esc(p.name)}</h3><i class="dots"></i><span class="price">${rupee(unit(p, sz))}</span></div><p>${esc(p.desc)}</p>
      <div class="row">${p.sizes ? `<div class="sizes" role="group" aria-label="Size">${Object.keys(SIZES).map(s => `<button data-act="size" data-size="${s}" aria-pressed="${s === sz}">${s}</button>`).join('')}</div>` : `<span class="cat">${p.cat}</span>`}
      <button class="add" data-act="add" aria-label="Add ${esc(p.name)} to cart">+</button></div></div></article>`;
}
function visible() {
  const q = view.q.trim().toLowerCase();
  const list = PRODUCTS.filter(p => (view.cat === 'All' || p.cat === view.cat) && (!q || (p.name + ' ' + p.cat + ' ' + p.desc + ' ' + p.price + ' rupees').toLowerCase().includes(q)));
  const s = {pop:(a, b) => b.pop - a.pop, lo:(a, b) => a.price - b.price, hi:(a, b) => b.price - a.price, az:(a, b) => a.name.localeCompare(b.name)}[view.sort];
  return list.sort(s);
}
function renderMenu() {
  const list = visible();
  $('#grid').innerHTML = list.length ? list.map((p, i) => card(p, i)).join('') : `<div class="empty"><h3>No matches found</h3><p>Try a different word or clear your filters.</p></div>`;
  $('#chips').innerHTML = CATS.map(c => `<button class="chip" aria-pressed="${c === view.cat}" data-cat="${c}">${c}</button>`).join('');
}
function onCardClick(e) {
  const btn = e.target.closest('[data-act]'); if (!btn) return;
  const el = btn.closest('.card, .bc'), p = PRODUCTS.find(x => x.id === +el.dataset.id), act = btn.dataset.act;
  if (act === 'size') { sizeSel[p.id] = btn.dataset.size; $$('[data-act=size]', el).forEach(b => b.setAttribute('aria-pressed', b === btn)); const pr = $('.price', el); pr.textContent = rupee(unit(p, btn.dataset.size)); pr.classList.remove('bump'); void pr.offsetWidth; pr.classList.add('bump'); }
  if (act === 'add') { addBtnFx(btn); addToCart(p.id, sizeSel[p.id] || 'M', 1, null, btn); }
  if (act === 'wish') { wish.has(p.id) ? wish.delete(p.id) : wish.add(p.id); store.set('nb-wish', [...wish]); $$(`.card[data-id="${p.id}"] .wish`).forEach(w => w.setAttribute('aria-pressed', wish.has(p.id))); toast(wish.has(p.id) ? 'Saved to wishlist' : 'Removed from wishlist'); }
  if (act === 'qv') quickView(p);
}
$('#grid').addEventListener('click', onCardClick);

/* ---------- Modal ---------- */
const modal = $('#modal');
function openModal(html) { $('#mBody').innerHTML = html; modal.showModal(); }
function quickView(p) {
  let size = 'M', qty = 1; const o = defOpts(p);
  openModal(`<div class="m"><img src="${U(p.img, 800)}" alt="${esc(p.name)}"><div><span class="tag" style="position:static;align-self:start">${p.cat}</span><h3 style="font-size:1.5rem">${esc(p.name)}</h3><p>${esc(p.desc)}</p>
    ${p.sizes ? `<div class="sizes" id="qSizes" role="group" aria-label="Size">${Object.keys(SIZES).map(s => `<button data-s="${s}" aria-pressed="${s === 'M'}">${s}</button>`).join('')}</div>
    <div class="seg" id="qTemp" role="group" aria-label="Hot or iced">${['Hot', 'Iced'].map(t => `<button data-t="${t}" aria-pressed="${t === o.temp}">${t}</button>`).join('')}</div>
    <label class="opt">Sugar<select id="qSugar"><option>Regular</option><option>Less</option><option>No</option></select></label>
    <label class="opt">Milk<select id="qMilk"><option value="Whole">Whole milk</option><option value="Oat">Oat milk (+₹30)</option><option value="Almond">Almond milk (+₹30)</option></select></label>
    <label class="chk"><input type="checkbox" id="qShot"> Extra shot (+₹40)</label>` : ''}
    <label class="opt">Special request<input id="qNote" maxlength="60" placeholder="e.g. warm it up"></label>
    <div class="qty"><button aria-label="Decrease" id="qMinus">−</button><span id="qN">1</span><button aria-label="Increase" id="qPlus">+</button></div>
    <span class="price" id="qPrice"></span><button class="btn gold" id="qAdd">Add to cart</button></div></div>`);
  const upd = () => { $('#qN').textContent = qty; $('#qPrice').textContent = rupee(unit(p, size, o) * qty); }; upd();
  $('#qMinus').onclick = () => { qty = Math.max(1, qty - 1); upd(); };
  $('#qPlus').onclick = () => { qty = Math.min(20, qty + 1); upd(); };
  $('#qNote').oninput = e => o.note = e.target.value.trim();
  if (p.sizes) {
    $$('#qSizes button').forEach(b => b.onclick = () => { size = b.dataset.s; $$('#qSizes button').forEach(x => x.setAttribute('aria-pressed', x === b)); upd(); });
    $$('#qTemp button').forEach(b => b.onclick = () => { o.temp = b.dataset.t; $$('#qTemp button').forEach(x => x.setAttribute('aria-pressed', x === b)); });
    $('#qSugar').onchange = e => o.sugar = e.target.value; $('#qMilk').onchange = e => { o.milk = e.target.value; upd(); }; $('#qShot').onchange = e => { o.shot = e.target.checked; upd(); };
  }
  $('#qAdd').onclick = () => { burstFrom($('#qAdd')); addToCart(p.id, size, qty, o, $('#qAdd')); modal.close(); };
}
$('#mClose').onclick = () => modal.close();
[modal, $('#lightbox')].forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));

/* ---------- Cart ---------- */
const defOpts = p => p.sizes ? {temp:p.cat === 'Cold Coffee' ? 'Iced' : 'Hot', sugar:'Regular', milk:'Whole', shot:false, note:''} : {note:''};
const optText = o => o ? [o.temp, o.sugar && o.sugar !== 'Regular' && o.sugar + ' sugar', o.milk && o.milk !== 'Whole' && o.milk + ' milk', o.shot && 'Extra shot', o.note && '“' + o.note + '”'].filter(Boolean).join(' · ') : '';
let promo = store.get('nb-promo', '');
const rewards = () => store.get('nb-rewards', {points:0, stamps:0, coupon:0});
const lineKey = i => i.id + '|' + i.size + '|' + JSON.stringify(i.opts || {});
function addToCart(id, size, qty, opts, origin) {
  const p = PRODUCTS.find(x => x.id === id), sz = p.sizes ? size : '', o = opts || defOpts(p), key = JSON.stringify(o);
  const line = cart.find(i => i.id === id && i.size === sz && JSON.stringify(i.opts || defOpts(p)) === key);
  const isNew = !line, drawerOpen = $('#drawer').classList.contains('open');
  line ? line.qty = Math.min(20, line.qty + qty) : cart.push({id, size:sz, qty, opts:o});
  touched = {key:lineKey(line || cart[cart.length - 1]), isNew};
  saveCart();
  flyToCart(p, origin).then(() => { cartLand(qty); if (!drawerOpen) peek(p, sz, qty); });
}
function saveCart() { store.set('nb-cart', cart); renderCart(); }
function totals(mode) {
  const sub = cart.reduce((s, i) => s + unit(PRODUCTS.find(p => p.id === i.id), i.size, i.opts) * i.qty, 0);
  const pr = promo === 'WARM10' ? Math.round(sub * .1) : 0, disc = Math.min(sub - pr, rewards().coupon || 0), net = sub - pr - disc;
  const tax = Math.round(net * .05), ship = mode === 'pickup' || sub === 0 || sub >= 600 ? 0 : 49;
  return {sub, pr, disc, tax, ship, total:net + tax + ship};
}
let prevSub = null, prevPct = 0, touched = null;
function suggest() {
  const inCart = new Set(cart.map(i => i.id)), cats = new Set(cart.map(i => PRODUCTS.find(p => p.id === i.id).cat));
  const want = cats.has('Bakery') ? ['Hot Coffee', 'Cold Coffee', 'Tea'] : ['Bakery', 'Tea'];
  return PRODUCTS.filter(p => !inCart.has(p.id) && want.includes(p.cat)).sort((a, b) => want.indexOf(a.cat) - want.indexOf(b.cat) || b.pop - a.pop)[0];
}
function renderCart() {
  const n = cart.reduce((s, i) => s + i.qty, 0), b = $('#badge');
  b.textContent = n; b.classList.add('pop'); setTimeout(() => b.classList.remove('pop'), 300);
  if (!cart.length) { $('#cartBody').innerHTML = `<div class="empty"><h3>Your cart is empty</h3><p>Add a coffee to start your order.</p><br><a class="btn gold" href="#menu" data-close>Browse the menu</a></div>`; $('#cartFoot').innerHTML = ''; prevSub = 0; prevPct = 0; touched = null; return; }
  const t = totals(), pct = Math.min(100, Math.round(t.sub / FREE_AT * 100)), left = FREE_AT - t.sub, unlocked = left <= 0, justUnlocked = prevSub !== null && prevSub < FREE_AT && t.sub >= FREE_AT;
  const ship = `<div class="ship${unlocked ? ' ok' : ''}"><p>${unlocked ? '<b>Free delivery unlocked</b> — this one is on us.' : `Add <b>${rupee(left)}</b> more for <b>free delivery</b>`}</p><div class="ship-bar${prevPct !== pct ? ' go' : ''}" style="--from:${prevPct}%;--to:${pct}%"><i></i><span class="roll"><img src="assets/images/bean-1.webp" alt=""></span></div></div>`;
  const items = cart.map((i, k) => { const p = PRODUCTS.find(x => x.id === i.id), hit = touched && touched.key === lineKey(i), cls = hit ? (touched.isNew ? ' fresh' : ' touched') : '';
    return `<div class="item${cls}"><img src="${U(p.img, 200)}" alt="${esc(p.name)}" width="70" height="70"><div><h4>${esc(p.name)}${hit && touched.isNew ? '<em class="newtag">Just added</em>' : ''}</h4><small>${i.size ? 'Size ' + i.size + ' · ' : ''}${rupee(unit(p, i.size, i.opts))}</small>${optText(i.opts) ? `<br><small>${esc(optText(i.opts))}</small>` : ''}<br><div class="qty"><button data-k="${k}" data-d="-1" aria-label="Decrease quantity">−</button><span>${i.qty}</span><button data-k="${k}" data-d="1" aria-label="Increase quantity">+</button></div></div><div><b>${rupee(unit(p, i.size, i.opts) * i.qty)}</b><br><button class="rm" data-k="${k}" data-rm>Remove</button></div></div>`; }).join('');
  const s = suggest(), pair = s ? `<div class="pair"><small>Pairs well with</small><div class="pair-card"><img src="${U(s.img, 120)}" alt="" width="52" height="52"><div><h4>${esc(s.name)}</h4><small>${rupee(unit(s, 'M'))}</small></div><button class="add" data-up="${s.id}" aria-label="Add ${esc(s.name)} to cart">+</button></div></div>` : '';
  $('#cartBody').innerHTML = ship + items + pair;
  const fresh = $('#cartBody .fresh, #cartBody .touched'); if (fresh && $('#drawer').classList.contains('open')) setTimeout(() => fresh.scrollIntoView({block:'nearest', behavior:'smooth'}), 60);
  $('#cartFoot').innerHTML = `<form class="promo" id="promoF"><input id="promoIn" placeholder="Promo code (try WARM10)" value="${esc(promo)}" aria-label="Promo code"><button class="btn line" type="submit">Apply</button></form><div class="sum"><div><span>Subtotal</span><span>${rupee(t.sub)}</span></div>${t.pr ? `<div><span>Promo WARM10</span><span>−${rupee(t.pr)}</span></div>` : ''}${t.disc ? `<div><span>Rewards</span><span>−${rupee(t.disc)}</span></div>` : ''}<div><span>GST (5%)</span><span>${rupee(t.tax)}</span></div><div><span>Delivery</span><span>${t.ship ? rupee(t.ship) : 'Free'}</span></div><div class="tot"><span>Total</span><span>${rupee(t.total)}</span></div></div><button class="btn gold" id="checkout">Checkout (demo)</button>`;
  if (justUnlocked) { rainBeans($('#drawer')); setTimeout(() => toast('Free delivery unlocked'), 400); }
  prevSub = t.sub; prevPct = pct; touched = null;
}
$('#cartBody').addEventListener('click', e => {
  if (e.target.closest('[data-close]')) return setDrawer(false);
  const up = e.target.closest('[data-up]'); if (up) { addBtnFx(up); addToCart(+up.dataset.up, 'M', 1, null, up); return; }
  const b = e.target.closest('[data-k]'); if (!b) return;
  const i = cart[+b.dataset.k];
  if (b.hasAttribute('data-rm')) { const row = b.closest('.item'); row.classList.add('gone'); setTimeout(() => { const at = cart.indexOf(i); if (at > -1) cart.splice(at, 1); toast('Item removed'); saveCart(); }, 330); return; }
  i.qty = Math.min(20, Math.max(1, i.qty + +b.dataset.d)); touched = {key:lineKey(i), isNew:false};
  saveCart();
});
function setDrawer(on) { $('#drawer').classList.toggle('open', on); $('#shade').classList.toggle('on', on); $('#drawer').setAttribute('aria-hidden', !on); document.body.style.overflow = on ? 'hidden' : ''; if (on) $('#cartClose').focus(); }
$('#cartBtn').onclick = () => setDrawer(true); $('#cartClose').onclick = () => setDrawer(false); $('#shade').onclick = () => setDrawer(false);
$('#cartFoot').addEventListener('click', e => { if (e.target.id === 'checkout') openCheckout(); });
$('#cartFoot').addEventListener('submit', e => { e.preventDefault(); const v = $('#promoIn').value.trim().toUpperCase(); promo = v === 'WARM10' ? v : ''; store.set('nb-promo', promo); toast(promo ? 'Promo WARM10 applied' : 'That promo code is not valid'); renderCart(); });

/* ---------- Checkout, orders, rewards ---------- */
let trackId = '';
const saveRewards = r => { store.set('nb-rewards', r); renderRewards(); renderCart(); };
function openCheckout() {
  setDrawer(false);
  openModal(`<form class="co" id="coForm" novalidate><h3 style="font-size:1.5rem">Checkout</h3><p class="demo"><b>Demo checkout.</b> No real payment is taken. The café team is emailed your order details.</p>
  <div class="radios" role="radiogroup" aria-label="Order type"><label><input type="radio" name="mode" value="delivery" checked> Delivery</label><label><input type="radio" name="mode" value="pickup"> Pickup</label></div>
  ${[['name', 'Full name', 'text'], ['email', 'Email', 'email'], ['phone', 'Phone (10 digits)', 'tel']].map(([id, l, ty]) => `<label>${l}<input name="${id}" type="${ty}"><span class="err" data-for="${id}"></span></label>`).join('')}
  <label id="addrL">Delivery address<textarea name="addr" rows="2"></textarea><span class="err" data-for="addr"></span></label>
  <div class="radios" role="radiogroup" aria-label="Payment method (demo)"><label><input type="radio" name="pay" value="Card" checked> Card</label><label><input type="radio" name="pay" value="UPI"> UPI</label><label><input type="radio" name="pay" value="Cash"> Pay at counter</label></div>
  <p class="demo" id="coTot"></p><button class="btn gold" type="submit">Place demo order</button></form>`);
  const f = $('#coForm'), el = n => f.elements[n], mode = () => f.querySelector('[name=mode]:checked').value;
  const upd = () => { $('#addrL').style.display = mode() === 'pickup' ? 'none' : ''; $('#coTot').innerHTML = `Total (demo): <b>${rupee(totals(mode()).total)}</b>`; };
  f.addEventListener('change', upd); upd();
  f.onsubmit = e => { e.preventDefault(); const v = n => el(n).value.trim(), m = mode();
    const rules = {name:v('name').length > 1, email:/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email')), phone:/^\d{10}$/.test(v('phone')), addr:m === 'pickup' || v('addr').length > 5};
    const msg = {name:'Enter your full name.', email:'Enter a valid email address.', phone:'Enter a 10-digit phone number.', addr:'Enter your delivery address.'};
    let ok = true; for (const k in rules) { $(`[data-for=${k}]`, f).textContent = rules[k] ? '' : msg[k]; ok = ok && rules[k]; }
    if (!ok) return;
    const t = totals(m), drinks = cart.filter(i => PRODUCTS.find(p => p.id === i.id).sizes).reduce((s, i) => s + i.qty, 0);
    const order = {id:'NB' + Math.floor(1000 + Math.random() * 9000), ts:Date.now(), mode:m, pay:f.querySelector('[name=pay]:checked').value, total:t.total, items:cart.map(i => ({n:PRODUCTS.find(p => p.id === i.id).name, q:i.qty}))};
    store.set('nb-orders', [order, ...store.get('nb-orders', [])].slice(0, 10));
    sendMail('order', {order, customer:{name:v('name'), email:v('email'), phone:v('phone'), addr:m === 'pickup' ? '' : v('addr')}});
    const r = rewards(); saveRewards({points:r.points + Math.floor(t.sub / 10), stamps:Math.min(12, r.stamps + drinks), coupon:Math.max(0, r.coupon - t.disc)});
    cart = []; promo = ''; store.set('nb-promo', ''); saveCart(); renderTrack(order.id);
    $('#mBody').innerHTML = `<div style="padding:2.2rem;text-align:center"><h3 style="font-size:1.6rem">Demo order placed</h3><p style="margin:.8rem 0">Order <b>${order.id}</b> for ${esc(v('name'))}. You earned ${Math.floor(t.sub / 10)} demo points. No payment was processed.</p><button class="btn gold" id="goTrack">Track order</button></div>`;
    $('#goTrack').onclick = () => { modal.close(); $('#track').scrollIntoView(); };
  };
}
let shownPts = 0, shownStamps = 0;
function countTo(el, from, to) { if (from === to) { el.textContent = to; return; } const t0 = performance.now(); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
  const f = t => { const k = Math.min(1, (t - t0) / 900); el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); }
function burst(btn) { if (matchMedia('(prefers-reduced-motion:reduce)').matches) return; const r = btn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, cols = ['#C18B55', '#F7F1E8', '#f3cf9a', '#8a5a34'];
  for (let i = 0; i < 26; i++) { const p = document.createElement('i'); p.className = 'cf'; p.style.cssText = `left:${x}px;top:${y}px;background:${cols[i % 4]}`; document.body.append(p);
    const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 120; p.animate([{transform:'translate(0,0) rotate(0)', opacity:1}, {transform:`translate(${Math.cos(a) * d}px,${Math.sin(a) * d - 40}px) rotate(${Math.random() * 540}deg)`, opacity:1, offset:.6}, {transform:`translate(${Math.cos(a) * d * 1.1}px,${Math.sin(a) * d + 60}px) rotate(720deg)`, opacity:0}], {duration:1100 + Math.random() * 300, easing:'ease-out'}).onfinish = () => p.remove(); } }
function renderRewards() {
  const r = rewards(); countTo($('#pts'), shownPts, r.points); $('#ptsBar').style.width = Math.min(100, r.points) + '%';
  $('#ptsTxt').textContent = r.points >= 100 ? 'You can redeem a reward now.' : `${100 - r.points} points to your next reward`;
  $('#stamps').innerHTML = Array.from({length:6}, (_, i) => `<span class="${i < r.stamps ? 'on' : ''}${i >= shownStamps && i < r.stamps ? ' new' : ''}" style="--d:${Math.max(0, i - shownStamps) * .15}s">${i < r.stamps ? '✓' : ''}</span>`).join('');
  shownPts = r.points; shownStamps = r.stamps;
  $('#redeemPts').disabled = r.points < 100; $('#redeemStamps').disabled = r.stamps < 6;
  const ct = $('#couponTxt'), had = ct.classList.contains('has'); ct.textContent = r.coupon ? `Active reward: ₹${r.coupon} off your next order.` : ''; ct.classList.toggle('has', !!r.coupon); if (r.coupon && had) { ct.style.animation = 'none'; void ct.offsetWidth; ct.style.animation = ''; }
}
$('#redeemPts').onclick = () => { const r = rewards(); if (r.points >= 100) { saveRewards({...r, points:r.points - 100, coupon:r.coupon + 50}); toast('₹50 reward added to your next order'); burst($('#redeemPts')); } };
$('#redeemStamps').onclick = () => { const r = rewards(); if (r.stamps >= 6) { saveRewards({...r, stamps:r.stamps - 6, coupon:r.coupon + 180}); toast('Free drink reward added to your next order'); burst($('#redeemStamps')); } };
$('#demoBtn').onclick = () => { const r = rewards(); saveRewards({...r, points:r.points + 50, stamps:Math.min(12, r.stamps + 1)}); burst($('#demoBtn')); };
function renderTrack(id) {
  if (id !== undefined) trackId = id;
  const os = store.get('nb-orders', []), o = trackId ? os.find(x => x.id === trackId) : os[0], out = $('#trackOut');
  if (!o) { out.dataset.sig = ''; out.innerHTML = trackId ? `<div class="empty"><h3>Order not found</h3><p>Check the order ID and try again.</p></div>` : `<div class="empty"><h3>No orders yet</h3><p>Place a demo order from the menu and track it here.</p></div>`; return; }
  const st = Math.min(3, Math.floor((Date.now() - o.ts) / 7000)), sig = o.id + st; if (out.dataset.sig === sig) return; out.dataset.sig = sig;
  const labels = ['Received', 'Brewing', 'Ready', o.mode === 'pickup' ? 'Picked up' : 'Delivered'];
  out.innerHTML = `<div class="trk"><div class="row"><h3>Order ${o.id}</h3><span class="tag" style="position:static">${o.mode === 'pickup' ? 'Pickup' : 'Delivery'} · ${esc(o.pay)} (demo)</span></div><p class="small2">${o.items.map(i => i.q + '× ' + esc(i.n)).join(', ')} · ${rupee(o.total)}</p><ol class="stages" style="--p:${st / 3 * 100}%">${labels.map((l, k) => `<li class="${k <= st ? 'done' : ''}${k === st ? ' cur' : ''}"><i></i>${l}</li>`).join('')}</ol><p class="small2">${st < 3 ? 'Demo status updates automatically.' : 'Enjoy! This was a demo order.'}</p></div>`;
}
$('#trackF').addEventListener('submit', e => { e.preventDefault(); $('#trackOut').dataset.sig = ''; renderTrack($('#trackIn').value.trim().toUpperCase()); });
setInterval(() => { if (!document.hidden) renderTrack(); }, 1000);
renderRewards(); renderTrack();

/* ---------- Search / filter / sort ---------- */
$('#q').addEventListener('input', e => { view.q = e.target.value; renderMenu(); });
$('#sort').addEventListener('change', e => { view.sort = e.target.value; renderMenu(); });
$('#chips').addEventListener('click', e => { const c = e.target.closest('[data-cat]'); if (c) { view.cat = c.dataset.cat; renderMenu(); } });
$('#clear').onclick = () => { Object.assign(view, {q:'', cat:'All', sort:'pop'}); $('#q').value = ''; $('#sort').value = 'pop'; renderMenu(); };
$('#searchBtn').onclick = () => { $('#menu').scrollIntoView(); setTimeout(() => $('#q').focus(), 500); };
$('#accountBtn').onclick = () => toast('Accounts are not part of this demo');
$$('.foot [data-cat]').forEach(a => a.addEventListener('click', () => { view.cat = a.dataset.cat; renderMenu(); }));
$('#offerBtn').onclick = () => { view.cat = 'Hot Coffee'; renderMenu(); $('#menu').scrollIntoView(); };
$$('[data-doc]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); openModal(`<div style="padding:2rem"><h3 style="font-size:1.6rem">${a.dataset.doc}</h3><p style="margin-top:1rem">Placeholder text for the demo site. Replace with your real ${a.dataset.doc.toLowerCase()} before launch.</p></div>`); }));

/* ---------- Bestseller spotlight ---------- */
const BEST = PRODUCTS.filter(p => p.badge === 'Bestseller'), spot = $('#spot'); let si = 0, sTimer = 0, sPaused = false;
function renderSpot(dir) {
  const p = BEST[si];
  spot.innerHTML = `<div class="stage"><div class="info"><small>Bestseller ${si + 1} of ${BEST.length}</small><h3>${esc(p.name)}</h3><p>${esc(p.desc)}</p><span class="price big">${rupee(unit(p, 'M'))}</span><div class="cta"><button class="btn gold" data-sa="add">Add to cart</button><button class="btn ghost" data-sa="view">Customise</button></div></div><div class="plate"><span class="orbit"></span><img src="${U(p.img, 900)}" width="520" height="520" alt="${esc(p.name)}"></div></div>
  <div class="tabs">${BEST.map((b, i) => `<button class="tab${i === si ? ' on' : ''}" data-i="${i}" aria-label="Show ${esc(b.name)}"><img src="${U(b.img, 120)}" alt="" width="44" height="44"><span>${esc(b.name)}</span><i></i></button>`).join('')}</div>`;
  clearTimeout(sTimer); if (!sPaused && !matchMedia('(prefers-reduced-motion:reduce)').matches) sTimer = setTimeout(() => goSpot(1), 5000);
}
const goSpot = d => { si = (si + d + BEST.length) % BEST.length; renderSpot(d); };
$('#bPrev').onclick = () => goSpot(-1); $('#bNext').onclick = () => goSpot(1);
spot.addEventListener('click', e => { const t = e.target.closest('[data-i],[data-sa]'); if (!t) return; if (t.dataset.sa === 'add') { burstFrom(t); addToCart(BEST[si].id, 'M', 1, null, t); } else if (t.dataset.sa === 'view') quickView(BEST[si]); else { si = +t.dataset.i; renderSpot(1); } });
spot.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { sPaused = true; clearTimeout(sTimer); spot.classList.add('paused'); } });
spot.addEventListener('pointerleave', () => { if (sPaused) { sPaused = false; spot.classList.remove('paused'); renderSpot(1); } });
let bx = null; spot.addEventListener('pointerdown', e => bx = e.clientX); spot.addEventListener('pointerup', e => { if (bx !== null && Math.abs(e.clientX - bx) > 50) goSpot(e.clientX < bx ? 1 : -1); bx = null; });
renderSpot(1);

/* ---------- Craft timeline ---------- */
function renderCraft() {
  $('#steps').innerHTML = STEPS.map((s, i) => `<li><button data-i="${i}" class="${i ? '' : 'on'}"><h3>${i + 1}. ${s[0]}</h3><p>${s[1]}</p></button></li>`).join('');
  setStep(0);
}
function setStep(i) { $$('#steps button').forEach((b, k) => b.classList.toggle('on', k === i)); $('#steps').style.setProperty('--p', (i + 1) * 25 + '%'); const im = $('#craftImg'); im.classList.remove('broken'); im.style.opacity = 0; setTimeout(() => { im.src = U(STEPS[i][2], 1000); im.alt = STEPS[i][0]; im.style.opacity = 1; }, 200); }
$('#steps').addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) setStep(+b.dataset.i); });
let auto = 0;
new IntersectionObserver(([en]) => { if (en.isIntersecting && !matchMedia('(prefers-reduced-motion:reduce)').matches) { auto = setInterval(() => setStep((+$('#steps .on').dataset.i + 1) % 4), 4000); } else clearInterval(auto); }, {threshold:.4}).observe($('#steps'));
$('#steps').addEventListener('click', () => clearInterval(auto));

/* ---------- Reviews ---------- */
const SEED = [['Aarav M.', 5, 'The cappuccino is the smoothest I have had in the city. (Demo)'], ['Sana K.', 5, 'Quiet corners, great light and a flaky croissant. (Demo)'], ['Rohan P.', 4, 'Cold brew that actually tastes like coffee. (Demo)'], ['Meera S.', 4, 'Lovely matcha, a little busy on weekends. (Demo)']];
let rating = 0;
const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);
function renderReviews() {
  const all = [...store.get('nb-reviews', []), ...SEED.map(([n, r, c]) => ({n, r, c}))], avg = all.reduce((s, x) => s + x.r, 0) / all.length;
  $('#rvSum').innerHTML = `<b>${avg.toFixed(1)}</b><div class="stars" aria-label="${avg.toFixed(1)} out of 5">${stars(Math.round(avg))}</div><small>${all.length} demo reviews</small>` + [5, 4, 3, 2, 1].map(s => { const c = all.filter(x => x.r === s).length; return `<div class="dist"><span>${s}</span><i><u style="width:${c / all.length * 100}%"></u></i><span>${c}</span></div>`; }).join('');
  $('#rvList').innerHTML = all.slice(0, 6).map(x => `<figure class="t"><div class="stars" aria-label="${x.r} out of 5">${stars(x.r)}</div><blockquote>“${esc(x.c)}”</blockquote><figcaption>${esc(x.n)}</figcaption></figure>`).join('');
}
$('#starIn').innerHTML = [1, 2, 3, 4, 5].map(v => `<button type="button" data-v="${v}" aria-label="${v} star${v > 1 ? 's' : ''}">★</button>`).join('');
$('#starIn').addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b) return; rating = +b.dataset.v; $$('#starIn button').forEach(x => x.classList.toggle('on', +x.dataset.v <= rating)); });
$('#rvForm').addEventListener('submit', e => {
  e.preventDefault(); const n = $('#rvName').value.trim(), c = $('#rvText').value.trim(), err = $('#rvErr');
  if (n.length < 2 || !rating || c.length < 10) { err.textContent = 'Add your name, a star rating and a review of at least 10 characters.'; return; }
  err.textContent = ''; store.set('nb-reviews', [{n, r:rating, c}, ...store.get('nb-reviews', [])].slice(0, 20)); sendMail('review', {name:n, rating, text:c});
  e.target.reset(); rating = 0; $$('#starIn button').forEach(x => x.classList.remove('on')); renderReviews(); toast('Review added (demo, saved in this browser)');
});
renderReviews();

/* ---------- Gallery, journal ---------- */
$('#gallery').innerHTML = GALLERY.map((g, i) => `<button class="g ${g[2]}" style="--n:${i}" data-i="${i}" aria-label="Open image: ${g[1]}"><img loading="lazy" width="600" height="400" src="${U(g[0], 900)}" alt="${g[1]}"><span>${g[1]}</span></button>`).join('');
$('#gallery').addEventListener('click', e => { const g = e.target.closest('.g'); if (!g) return; const d = GALLERY[+g.dataset.i]; $('#lImg').src = U(d[0], 1400); $('#lImg').alt = d[1]; $('#lightbox').showModal(); });
$('#lClose').onclick = () => $('#lightbox').close();
/* ---------- Newsletter ---------- */
$('#newsForm').addEventListener('submit', e => {
  e.preventDefault(); const inp = $('#email'), err = $('#emailErr'), btn = $('#subBtn'), v = inp.value.trim();
  err.className = 'err';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { err.textContent = 'Enter a valid email address, like you@example.com.'; inp.setAttribute('aria-invalid', 'true'); inp.focus(); return; }
  inp.removeAttribute('aria-invalid'); err.textContent = ''; btn.disabled = true; btn.textContent = 'Subscribing…';
  sendMail('newsletter', {email:v}).then(ok => { const l = store.get('nb-news', []); l.push(v); store.set('nb-news', l); btn.disabled = false; btn.textContent = 'Subscribed ✓'; err.className = 'err ok-msg'; err.textContent = ok ? 'Thanks — you are subscribed!' : 'Saved on this device. (Mail service is not connected yet.)'; inp.value = ''; });
});

/* ---------- Page motion ---------- */
$('#year').textContent = new Date().getFullYear();
const nav = $('#nav'), prog = $('#progress'), topBtn = $('#top');
let tick = false;
function onScroll() {
  const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
  nav.classList.toggle('scrolled', y > 40); topBtn.classList.toggle('show', y > 600); prog.style.transform = `scaleX(${h ? y / h : 0})`;
  const sc = $('#scene'); if (sc && y < innerHeight && !matchMedia('(prefers-reduced-motion:reduce)').matches) sc.style.transform = `translateY(${y * .05}px)`;
  tick = false;
}
addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, {passive:true});
topBtn.onclick = () => scrollTo({top:0});
$('#toTop2').onclick = () => setTimeout(() => $('#email').focus(), 600);
const burger = $('#burger'), mnav = $('#menuNav');
burger.onclick = () => { const o = mnav.classList.toggle('open'); burger.setAttribute('aria-expanded', o); };
mnav.addEventListener('click', e => { if (e.target.tagName === 'A') { mnav.classList.remove('open'); burger.setAttribute('aria-expanded', false); } });
addEventListener('keydown', e => { if (e.key === 'Escape') { setDrawer(false); mnav.classList.remove('open'); burger.setAttribute('aria-expanded', false); } });

const io = new IntersectionObserver(es => es.forEach(en => { if (!en.isIntersecting) return; en.target.classList.add('in');
  $$('[data-n]', en.target).forEach(c => { const n = +c.dataset.n, s = c.dataset.s || '', t0 = performance.now(); const f = t => { const k = Math.min(1, (t - t0) / 1400); c.textContent = Math.round(n * (1 - Math.pow(1 - k, 3))).toLocaleString('en-IN') + (k === 1 ? s : ''); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); });
  io.unobserve(en.target); }), {threshold:.05});
$$('.rv, #gallery').forEach(el => io.observe(el));
$$('main section[id]').forEach(s => new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) $$('#menuNav a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + s.id)); }), {rootMargin:'-45% 0px -50% 0px'}).observe(s));

/* ---------- Hero: floating beans, coffee dust and steam (canvas) ---------- */
/* Where the coffee surface sits inside cup-cut.webp, as fractions of the image. Change if you swap the photo. */
const COFFEE = {x:.523, y:.349, rx:.204, ry:.13};
(() => {
  const hero = $('#home'), cB = $('#fxBack'), cF = $('#fxFront'), cup = $('.cup-cut'), stage = $('#scene'); if (!hero || !cB) return;
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches, bx = cB.getContext('2d'), fx = cF.getContext('2d'), R = (a, b) => a + Math.random() * (b - a);
  const base = [1, 2, 3, 4, 5, 6, 7].map(i => { const im = new Image(); im.src = `assets/images/bean-${i}.webp`; return im; }), BLUR = [0, 5, 12], sheets = BLUR.map(() => []), canFilter = 'filter' in bx;
  let W = 0, H = 0, dpr = 1, S = 1, cx = 0, cy = 0, ready = false, t0 = 0, last = 0, running = false, seen = true, mx = 0, my = 0, smx = 0, smy = 0, lastPuff = 0, beans = [], dust = [];
  const ok = im => im && (im.naturalWidth || im.width);
  function build() {
    base.forEach((im, i) => BLUR.forEach((b, k) => { if (!ok(im)) return; im._cw = im.naturalWidth;
      if (!b || !canFilter) { sheets[k][i] = im; return; }
      const pad = b * 3, c = document.createElement('canvas'); c.width = im.naturalWidth + pad * 2; c.height = im.naturalHeight + pad * 2;
      const x = c.getContext('2d'); x.filter = `blur(${b}px)`; x.drawImage(im, pad, pad); x.filter = 'none'; x.globalCompositeOperation = 'source-atop'; x.fillStyle = `rgba(22,10,5,${k === 1 ? .22 : .42})`; x.fillRect(0, 0, c.width, c.height); c._cw = im.naturalWidth; sheets[k][i] = c; }));
    ready = true;
  }
  Promise.all(base.map(im => im.decode ? im.decode().catch(() => {}) : new Promise(r => { im.onload = im.onerror = r; }))).then(build);
  /* x, y (fractions of hero), size px, layer (0 behind cup, 1 in front), blur level, sprite */
  const DARK_DUST = ['198,150,104', '150,96,60', '224,176,128', '112,68,42'], LIGHT_DUST = ['120,72,44', '90,52,30', '160,104,64'];
  const DESIGNS = {
    poster:{dust:150, cols:DARK_DUST, steam:'255,238,220', spec:[
      [.11,.40,66,0,0,0],[.21,.64,50,0,1,3],[.31,.31,40,0,1,5],[.69,.29,46,0,1,1],[.87,.64,60,0,0,2],[.89,.36,74,0,0,6],
      [.27,.81,42,0,1,4],[.74,.80,48,0,1,2],[.06,.68,38,0,2,1],[.95,.72,42,0,2,5],[.17,.22,36,0,1,6],[.84,.18,40,0,1,0],
      [.045,.30,128,1,2,3],[.955,.46,140,1,2,5],[.14,.88,112,1,2,0],[.88,.90,104,1,2,4],
      [.36,.50,46,1,0,2],[.645,.63,40,1,0,6],[.40,.70,30,1,0,1]]},
    editorial:{dust:36, cols:DARK_DUST, steam:'255,238,220', spec:[
      [.56,.16,44,0,1,3],[.91,.22,66,0,0,0],[.97,.55,52,0,1,5],[.60,.84,56,0,1,2],[.86,.90,84,1,2,4],[.68,.10,34,0,1,6],
      [.96,.82,46,0,0,1],[.55,.52,38,1,0,6],[.91,.45,34,1,0,2],[.58,.66,30,0,2,1],[.04,.90,100,1,2,0],[.47,.30,30,0,2,5]]},
    spotlight:{dust:110, cols:DARK_DUST, steam:'255,238,220', rain:{back:11, front:6}, spec:[]},
    latte:{dust:34, cols:LIGHT_DUST, steam:'110,70,44', spec:[
      [.06,.22,60,0,0,0],[.11,.84,52,0,1,3],[.46,.20,46,0,1,5],[.47,.82,56,0,0,2],[.025,.58,40,0,2,1],
      [.10,.60,46,1,0,4],[.405,.48,36,1,0,1],[.18,.92,96,1,2,6],[.975,.10,90,1,2,3],[.97,.88,80,1,2,0]]}
  };
  let D = DESIGNS.poster;
  const curDesign = () => DESIGNS[document.documentElement.dataset.banner] ? document.documentElement.dataset.banner : 'poster';
  function layout() {
    const r = stage.getBoundingClientRect(), hr = hero.getBoundingClientRect(); cx = r.left - hr.left + r.width / 2; cy = r.top - hr.top + r.height / 2;
  }
  function size() {
    const r = hero.getBoundingClientRect(); W = r.width; H = r.height; dpr = Math.min(2, devicePixelRatio || 1);
    [cB, cF].forEach(c => { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); });
    S = Math.max(.5, Math.min(1.2, Math.min(W, H * 1.3) / 1000)); layout();
    if (!beans.length) setup();
  }
  function setup() {
    D = DESIGNS[curDesign()]; puffs.length = 0; t0 = 0; layout();
    let spec = D.spec;
    if (D.rain) { spec = []; for (let i = 0; i < D.rain.back; i++) spec.push([R(.03, .97), 0, R(26, 56), 0, Math.random() < .5 ? 0 : 1, (Math.random() * 7) | 0]);
      for (let i = 0; i < D.rain.front; i++) spec.push([R(.03, .97), 0, R(90, 140), 1, 2, (Math.random() * 7) | 0]); }
    beans = spec.map(([fx_, fy, sz, layer, bl, sp], i) => ({fx:fx_, fy, sz, layer, bl, sp, rot:R(0, 6.28), spin:R(.12, .42) * (Math.random() < .5 ? -1 : 1), ph:R(0, 6.28), f:R(.35, .8), ax:R(5, 13), ay:R(6, 15), tum:R(.5, 1.1), delay:i * .06 + R(0, .15),
      y0:R(0, 1) * 2000, v:(layer ? R(95, 150) : R(32, 62)) * (D.rain ? 1 : 0)}));
    dust = Array.from({length:Math.round(D.dust * (W < 700 ? .5 : 1))}, () => { const g = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
      return {fx:Math.min(.99, Math.max(.01, .5 + g() * .5)), fy:Math.min(.97, Math.max(.05, .55 + g() * .42)), r:R(.7, 3), layer:Math.random() < .7 ? 0 : 1, col:D.cols[(Math.random() * D.cols.length) | 0], a:R(.35, .9), ph:R(0, 6.28), tw:R(.8, 2.2), delay:R(0, .9)}; });
  }
  const puffCache = {};
  const puffSprite = () => puffCache[D.steam] || (puffCache[D.steam] = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, `rgba(${D.steam},.9)`); g.addColorStop(.5, `rgba(${D.steam},.35)`); g.addColorStop(1, `rgba(${D.steam},0)`); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return c; })());
  const puffs = [];
  function spawnPuff() {
    const r = cup.getBoundingClientRect(), hr = hero.getBoundingClientRect(); if (!r.width) return;
    puffs.push({x:r.left - hr.left + r.width * (COFFEE.x + R(-.6, .6) * COFFEE.rx * .8), y:r.top - hr.top + r.height * (COFFEE.y + R(-.4, .3) * COFFEE.ry), vy:R(26, 46) * S, sway:R(8, 24), ph:R(0, 6.28), age:0, life:R(3.2, 4.8), r0:R(10, 18) * S, grow:R(42, 78) * S, a:R(.2, .38)});
  }
  function drawBean(ctx, b, t) {
    const p = Math.min(1, (t - b.delay) / 1.5); if (p <= 0) return; const e = 1 - Math.pow(1 - p, 3), img = sheets[b.bl][b.sp]; if (!ok(img)) return;
    let x, y;
    if (D.rain) { const pad = b.sz * S * 1.6; x = b.fx * W + Math.sin(t * b.f + b.ph) * b.ax * 2 + smx * b.sz * .22; y = ((b.y0 + t * b.v * S) % (H + pad * 2)) - pad; }
    else { const rx = b.fx * W + Math.sin(t * b.f + b.ph) * b.ax + smx * b.sz * .22, ry = b.fy * H + Math.cos(t * b.f * .8 + b.ph) * b.ay + smy * b.sz * .14; x = cx + (rx - cx) * e; y = cy + (ry - cy) * e; }
    const w = b.sz * S * (D.rain ? 1 : .25 + .75 * e), k = w / img._cw, nw = img.naturalWidth || img.width, nh = img.naturalHeight || img.height, dw = nw * k, dh = nh * k;
    ctx.save(); ctx.translate(x, y); ctx.rotate(b.rot + b.spin * t + (1 - e) * 3); ctx.scale(1, .82 + .18 * Math.cos(t * b.tum + b.ph)); ctx.globalAlpha = Math.min(1, p * 2.2);
    if (!b.bl) { ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 12 * S; ctx.shadowOffsetY = 7 * S; }
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh); ctx.restore();
  }
  function paint(t, dt) {
    bx.setTransform(dpr, 0, 0, dpr, 0, 0); fx.setTransform(dpr, 0, 0, dpr, 0, 0); bx.clearRect(0, 0, W, H); fx.clearRect(0, 0, W, H);
    dust.forEach(d => { const p = Math.min(1, Math.max(0, (t - d.delay) / 1.6)); if (p <= 0) return; const e = 1 - Math.pow(1 - p, 3), ctx = d.layer ? fx : bx;
      const x = cx + (d.fx * W + Math.sin(t * .35 * d.tw + d.ph) * 14 + smx * 8 - cx) * e, y = cy + (d.fy * H + Math.cos(t * .3 * d.tw + d.ph) * 10 + smy * 5 - cy) * e;
      ctx.fillStyle = `rgba(${d.col},${(d.a * (.6 + .4 * Math.sin(t * d.tw + d.ph)) * e).toFixed(3)})`; ctx.beginPath(); ctx.arc(x, y, d.r * S, 0, 6.283); ctx.fill(); });
    if (!reduce) { lastPuff += dt; if (lastPuff > .16) { lastPuff = 0; spawnPuff(); } }
    for (let i = puffs.length - 1; i >= 0; i--) { const q = puffs[i]; q.age += dt; const p = q.age / q.life; if (p >= 1) { puffs.splice(i, 1); continue; }
      const r = q.r0 + q.grow * p, y = q.y - q.vy * q.age, x = q.x + Math.sin(q.age * 1.2 + q.ph) * q.sway * p; fx.globalAlpha = q.a * Math.pow(Math.sin(Math.PI * p), .8); fx.drawImage(puffSprite(), x - r, y - r, r * 2, r * 2); }
    fx.globalAlpha = 1; beans.forEach(b => drawBean(b.layer ? fx : bx, b, t));
  }
  function frame(now) {
    if (!running) return; requestAnimationFrame(frame);
    if (!ready || !document.body.classList.contains('loaded')) return; if (!t0) t0 = now; const dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
    smx += (mx - smx) * .06; smy += (my - smy) * .06; paint((now - t0) / 1000, dt);
  }
  const run = () => { const on = seen && !document.hidden && !reduce; if (on && !running) { running = true; last = 0; requestAnimationFrame(frame); } else if (!on) running = false; };
  window.nbHero = {reset() { beans = []; size(); if (reduce && ready) paint(99, 0); }};
  size(); addEventListener('resize', () => { clearTimeout(size._t); size._t = setTimeout(() => { size(); if (reduce && ready) paint(99, 0); }, 120); });
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; run(); }).observe(hero); document.addEventListener('visibilitychange', run);
  if (matchMedia('(pointer:fine)').matches && !reduce) hero.addEventListener('pointermove', e => { mx = (e.clientX / innerWidth - .5) * 2; my = (e.clientY / innerHeight - .5) * 2; }, {passive:true});
  if (reduce) { const iv = setInterval(() => { if (ready) { clearInterval(iv); layout(); paint(99, 0); } }, 100); } else run();
  addEventListener('load', layout);
})();

/* ---------- Premium motion ---------- */
$$('.sec h2, .news h2, .offer h2').forEach(el => { el.innerHTML = el.textContent.split(' ').map((w, i) => `<span class="w"><span style="--i:${i}">${esc(w)}</span></span>`).join(' '); el.classList.add('sp'); io.observe(el); });
const mq = $('#mq'); mq.innerHTML += mq.innerHTML;
(() => { const d = new Date(), day = d.getDay(), t = d.getHours() + d.getMinutes() / 60, wk = day > 0 && day < 6, [o, c] = wk ? [7, 22] : [8, 23], open = t >= o && t < c;
  $$('.open-now').forEach(e => { e.textContent = open ? `Open now · until ${c - 12}pm` : 'Closed now · see opening hours'; e.classList.toggle('closed', !open); }); })();
if (matchMedia('(pointer:fine)').matches && !matchMedia('(prefers-reduced-motion:reduce)').matches) {
  const cur = document.createElement('div'); cur.className = 'cursor'; document.body.append(cur); let cx = 0, cy = 0, tx = 0, ty = 0, run = false;
  const loop = () => { cx += (tx - cx) * .18; cy += (ty - cy) * .18; cur.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`; run = Math.abs(tx - cx) + Math.abs(ty - cy) > .5; if (run) requestAnimationFrame(loop); };
  addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; if (!run) { run = true; requestAnimationFrame(loop); }
    cur.classList.toggle('big', !!e.target.closest('a,button,input,select,.bc,.card'));
    const m = e.target.closest('.btn.gold'); $$('.btn.gold').forEach(b => { if (b !== m) b.style.transform = ''; });
    if (m) { const r = m.getBoundingClientRect(); m.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px,${(e.clientY - r.top - r.height / 2) * .35}px)`; } });
  addEventListener('pointermove', e => { const s = $('#scene'); if (s && scrollY < innerHeight) { s.style.setProperty('--mx', ((e.clientX / innerWidth - .5) * 14).toFixed(1) + 'px'); } }, {passive:true});
}


/* ---------- Add-to-cart motion ---------- */
const REDUCE = matchMedia('(prefers-reduced-motion:reduce)').matches, FREE_AT = 600, R = (a, b) => a + Math.random() * (b - a);
const mk = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };
const beanEl = (w, sym) => mk(`<svg class="fx-bean" viewBox="0 0 20 28" style="width:${w}px;height:${w * 1.4}px" aria-hidden="true"><use href="#${sym || 'bean'}"/></svg>`);
function addBtnFx(btn) {
  btn.classList.remove('brew'); void btn.offsetWidth; btn.classList.add('brew');
  btn.innerHTML = '<svg class="tick" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.500l4.500 4.500L19 7.500"/></svg>';
  burstFrom(btn); clearTimeout(btn._t); btn._t = setTimeout(() => { btn.classList.remove('brew'); btn.textContent = '+'; }, 1400);
}
function burstFrom(el) {
  if (REDUCE || !el) return; const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
  for (let i = 0; i < 9; i++) { const s = beanEl(R(10, 16), i % 3 === 1 ? 'bean2' : 'bean'); s.style.left = x + 'px'; s.style.top = y + 'px'; document.body.append(s);
    const ang = -Math.PI / 2 + R(-1.3, 1.3), v = R(36, 84), dx = Math.cos(ang) * v, up = Math.sin(ang) * v, fall = R(26, 56);
    s.animate([{transform:'translate(-50%,-50%) scale(.3) rotate(0)', opacity:0}, {transform:`translate(calc(-50% + ${dx * .6}px),calc(-50% + ${up}px)) scale(1) rotate(${R(-200, 200)}deg)`, opacity:1, offset:.35, easing:'ease-in'}, {transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${up + fall}px)) scale(.7) rotate(${R(-440, 440)}deg)`, opacity:0}], {duration:R(650, 900), easing:'cubic-bezier(.2,.7,.4,1)'}).onfinish = () => s.remove(); }
  for (let i = 0; i < 2; i++) { const p = mk('<i class="puff"></i>'); p.style.left = x + (i ? 5 : -5) + 'px'; p.style.top = y - 10 + 'px'; document.body.append(p);
    p.animate([{transform:'translate(-50%,0) scale(.5)', opacity:0}, {opacity:.7, offset:.3}, {transform:`translate(calc(-50% + ${i ? 10 : -10}px),-34px) scale(1.6)`, opacity:0}], {duration:900, delay:i * 140, easing:'ease-out', fill:'backwards'}).onfinish = () => p.remove(); }
}
function flyToCart(p, origin) {
  if (REDUCE || !origin) return Promise.resolve();
  const target = $('#drawer').classList.contains('open') ? $('.d-head h2') : $('#cartBtn'), a = origin.getBoundingClientRect(), b = target.getBoundingClientRect();
  if (!a.width || !b.width) return Promise.resolve();
  const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2, dx = b.left + b.width / 2 - x0, dy = b.top + b.height / 2 - y0, S = 58, lift = Math.max(80, Math.min(190, Math.abs(dy) * .3 + 70)), dur = 950;
  const wrap = mk(`<div class="fly" style="left:${x0 - S / 2}px;top:${y0 - S / 2}px;width:${S}px;height:${S}px"><div class="fly-in"><img src="${U(p.img, 160)}" alt=""></div></div>`); document.body.append(wrap);
  const inner = wrap.firstChild;
  wrap.animate([{transform:'translateX(0)'}, {transform:`translateX(${dx}px)`}], {duration:dur, easing:'cubic-bezier(.45,.05,.55,.95)', fill:'forwards'});
  const anim = inner.animate([{transform:'translateY(0) scale(.5) rotate(0deg)', opacity:0, easing:'ease-out'}, {transform:`translateY(${-lift * .55}px) scale(1) rotate(90deg)`, opacity:1, offset:.14, easing:'ease-out'}, {transform:`translateY(${-lift}px) scale(1.12) rotate(180deg)`, opacity:1, offset:.4, easing:'cubic-bezier(.55,0,.9,.55)'}, {transform:`translateY(${dy}px) scale(.18) rotate(400deg)`, opacity:.9}], {duration:dur, fill:'forwards'});
  const trail = setInterval(() => { const r = inner.getBoundingClientRect(); if (r.width < 14) return; const t = beanEl(R(7, 12), Math.random() < .5 ? 'bean' : 'bean2'); t.style.left = r.left + r.width / 2 + 'px'; t.style.top = r.top + r.height / 2 + 'px'; document.body.append(t);
    t.animate([{transform:'translate(-50%,-50%) scale(1) rotate(0)', opacity:.95}, {transform:`translate(calc(-50% + ${R(-16, 16)}px),calc(-50% + ${R(12, 30)}px)) scale(.2) rotate(${R(-260, 260)}deg)`, opacity:0}], {duration:560, easing:'ease-out'}).onfinish = () => t.remove(); }, 50);
  return anim.finished.catch(() => {}).then(() => { clearInterval(trail); wrap.remove(); });
}
function cartLand(qty) {
  const open = $('#drawer').classList.contains('open'), tgt = open ? $('.d-head h2') : $('#cartBtn');
  tgt.classList.remove('wob'); void tgt.offsetWidth; tgt.classList.add('wob'); setTimeout(() => tgt.classList.remove('wob'), 800);
  if (open || REDUCE) return;
  const d = beanEl(11); d.classList.add('cdrop'); tgt.append(d);
  d.animate([{transform:'translate(-50%,-22px) rotate(0)', opacity:0}, {opacity:1, offset:.3}, {transform:'translate(-50%,6px) rotate(220deg) scale(.8)', opacity:0}], {duration:560, easing:'ease-in'}).onfinish = () => d.remove();
  const bd = $('#badge'); bd.classList.remove('ping'); void bd.offsetWidth; bd.classList.add('ping');
  const pl = mk(`<span class="plus1">+${qty || 1}</span>`); tgt.append(pl);
  pl.animate([{transform:'translateY(0)', opacity:0}, {opacity:1, offset:.25}, {transform:'translateY(-26px)', opacity:0}], {duration:900, easing:'ease-out'}).onfinish = () => pl.remove();
}
let peekEl = null, peekT = 0;
function dismissPeek() { if (!peekEl) return; const e = peekEl; peekEl = null; clearTimeout(peekT); e.classList.add('bye'); setTimeout(() => e.remove(), 350); }
function peek(p, size, qty) {
  const t = totals(), left = Math.max(0, FREE_AT - t.sub), pct = Math.min(100, Math.round(t.sub / FREE_AT * 100));
  peekEl && peekEl.remove(); clearTimeout(peekT);
  const el = peekEl = mk(`<div class="peek" role="status"><img src="${U(p.img, 120)}" alt="" width="46" height="46"><div class="pk-t"><b>${esc(p.name)} added</b><span>${size ? 'Size ' + size + ' · ' : ''}${qty > 1 ? '×' + qty + ' · ' : ''}${left ? rupee(left) + ' to free delivery' : 'Free delivery unlocked'}</span><div class="pk-bar${left ? '' : ' full'}"><i style="--to:${pct}%"></i></div></div><button class="btn gold pk-btn" type="button">View cart</button><u class="pk-life"></u></div>`);
  $('#toasts').append(el);
  $('.pk-btn', el).onclick = () => { dismissPeek(); setDrawer(true); };
  el.onmouseenter = () => { clearTimeout(peekT); el.classList.add('hold'); }; el.onmouseleave = () => { el.classList.remove('hold'); peekT = setTimeout(dismissPeek, 2200); };
  peekT = setTimeout(dismissPeek, 4200);
}
function rainBeans(host) {
  if (REDUCE) return; const r = host.getBoundingClientRect(), box = mk('<div class="rain" aria-hidden="true"></div>'); host.append(box);
  for (let i = 0; i < 26; i++) { const s = beanEl(R(10, 18), i % 3 === 1 ? 'bean2' : 'bean'); s.style.left = R(4, 96) + '%'; s.style.top = '0'; s.style.position = 'absolute'; box.append(s);
    s.animate([{transform:'translateY(-30px) rotate(0)', opacity:0}, {opacity:1, offset:.12}, {transform:`translateY(${r.height * R(.55, .95)}px) rotate(${R(-540, 540)}deg)`, opacity:0}], {duration:R(1400, 2300), delay:R(0, 500), easing:'cubic-bezier(.35,0,.9,.6)', fill:'both'}); }
  setTimeout(() => box.remove(), 3200);
}

/* ---------- Init ---------- */
renderMenu(); renderCraft(); renderCart(); onScroll();


/* ---------- Splash screen (first visit per session; add ?splash to the URL to replay) ---------- */
(() => {
  const sp = $('#splash'), start = () => document.body.classList.add('loaded');
  if (!sp || document.documentElement.classList.contains('no-splash')) { sp && sp.remove(); requestAnimationFrame(start); return; }
  document.body.classList.add('splash-on');
  const assets = ['splash-bg.jpg', 'splash-amb.jpg', 'hero-barista.jpg', 'pile.webp'].map(n => `assets/images/${n}`), bar = $('#spBar'), pct = $('#spPct');
  const MIN = matchMedia('(prefers-reduced-motion:reduce)').matches ? 500 : 2600, MAX = 6000; let done = 0, shown = 0, finished = false;
  assets.forEach(src => { const im = new Image(); im.onload = im.onerror = () => done++; im.src = src; });
  const finish = () => { if (finished) return; finished = true; try { sessionStorage.setItem('nb-splash', '1'); } catch {} sp.classList.add('out'); setTimeout(start, 380); setTimeout(() => { sp.remove(); document.body.classList.remove('splash-on'); }, 1300); };
  const t0 = performance.now();
  let prev = t0;
  (function loop(now) { const el = now - t0, dt = Math.min(.25, (now - prev) / 1000); prev = now; const real = done / assets.length, target = Math.min(real, Math.min(1, el / MIN)); shown += (target - shown) * (1 - Math.exp(-dt * 7)); const p = Math.round(shown * 100);
    bar.style.setProperty('--p', p + '%'); if (pct) pct.textContent = p + '%';
    if ((real >= 1 && el >= MIN && shown > .985) || el > MAX) return finish(); requestAnimationFrame(loop); })(t0);
})();
