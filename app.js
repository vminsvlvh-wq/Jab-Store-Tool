// فحص JAP الذكي — نموذج أولي
const localHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
const rawBase = window.__API_BASE__ || '';
const unresolved = rawBase.startsWith('__PORT_');
if (unresolved && !localHosts.has(location.hostname)) {
  document.getElementById('app').innerHTML = '<div class="err-box">تعذر الاتصال بالخادم: عنوان الخادم لم يُضبط.</div>';
  throw new Error('Backend proxy placeholder was not rewritten');
}
const API = unresolved ? 'http://localhost:8000' : rawBase;

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const fmt = (n) => Number(n).toLocaleString('en-US');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function api(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  let data = null;
  try { data = await res.json(); } catch { /* ignore */ }
  if (!res.ok) throw new Error((data && data.detail) || `خطأ ${res.status}`);
  return data;
}

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg; t.setAttribute('role', 'status');
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

// ------------------------------------------------------------------ silhouettes
const SIL = {
  front: '<svg viewBox="0 0 120 70" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"><path d="M20 52V38l8-18c2-4 5-6 9-6h46c4 0 7 2 9 6l8 18v14"/><path d="M14 38h92M28 22h64"/><rect x="18" y="52" width="14" height="10" rx="3"/><rect x="88" y="52" width="14" height="10" rx="3"/><circle cx="32" cy="44" r="4"/><circle cx="88" cy="44" r="4"/><path d="M46 46h28"/></svg>',
  rear: '<svg viewBox="0 0 120 70" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"><path d="M20 52V36l9-20c2-3 4-4 8-4h46c4 0 6 1 8 4l9 20v16"/><path d="M14 36h92M32 18h56"/><rect x="18" y="52" width="14" height="10" rx="3"/><rect x="88" y="52" width="14" height="10" rx="3"/><path d="M24 42h14M82 42h14M48 46h24"/></svg>',
  side: '<svg viewBox="0 0 140 70" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"><path d="M10 48v-8c0-4 3-7 7-8l18-4 16-12c3-2 6-3 9-3h30c4 0 7 1 10 4l12 11 14 3c4 1 6 4 6 8v9"/><circle cx="36" cy="50" r="9"/><circle cx="104" cy="50" r="9"/><path d="M45 50h50M48 28h58"/></svg>',
  hood: '<svg viewBox="0 0 120 70" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"><path d="M16 56l12-36c1-3 4-5 7-5h50c3 0 6 2 7 5l12 36z"/><path d="M40 30l-3 10M60 28v12M80 30l3 10"/><circle cx="48" cy="46" r="1.6" fill="currentColor"/><circle cx="66" cy="50" r="1.6" fill="currentColor"/><circle cx="58" cy="42" r="1.6" fill="currentColor"/><circle cx="74" cy="44" r="1.6" fill="currentColor"/></svg>',
  bumper: '<svg viewBox="0 0 120 70" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"><path d="M10 26h100l-6 26H16z"/><path d="M30 34h60M36 42h48"/><circle cx="24" cy="34" r="1.6" fill="currentColor"/><circle cx="96" cy="38" r="1.6" fill="currentColor"/><circle cx="44" cy="30" r="1.6" fill="currentColor"/></svg>',
};
const SLOTS = [
  { key: 'front', label: 'أمامية كاملة', hint: 'من مسافة 3 أمتار', sil: 'front' },
  { key: 'hood', label: 'الكبوت عن قرب', hint: 'زاوية مائلة', sil: 'hood' },
  { key: 'bumper', label: 'الصدام الأمامي', hint: 'قريبة', sil: 'bumper' },
  { key: 'right', label: 'الجانب الأيمن', hint: 'جانبية كاملة', sil: 'side' },
  { key: 'left', label: 'الجانب الأيسر', hint: 'جانبية كاملة', sil: 'side' },
  { key: 'rear', label: 'خلفية', hint: 'اختيارية', sil: 'rear' },
];
const DEMOS = {
  lc: { model: 'تويوتا لاندكروزر', year: '2023', age: '1to3', files: { front: 'samples/front.jpg' }, daily: 70, hwy: 60, trips: { qassim: 4, dammam: 2 } },
  sedan: { model: 'سيدان ألماني أسود', year: '2021', age: 'gt3', files: { right: 'samples/side.jpg', hood: 'samples/hood.jpg' }, daily: 45, hwy: 45, trips: { makkah: 1 } },
};

const TYPE_AR = { stone_chips: 'آثار حصى', swirls: 'دوامات غسيل', scratch: 'خدش', fading: 'بهتان', scuff: 'احتكاك سطحي', dent: 'انبعاج', oxidation: 'تآكل / أكسدة', contamination: 'أوساخ أو بقع' };
const ZONE_AR = { front_bumper: 'الصدام الأمامي', hood: 'الكبوت', roof: 'السقف', fenders: 'الرفارف', left_doors: 'الأبواب اليسرى', right_doors: 'الأبواب اليمنى', mirrors: 'المرايا', rocker: 'أسفل الأبواب', rear_bumper: 'الصدام الخلفي', trunk: 'الشنطة', headlights: 'الأنوار', pillars: 'الأعمدة', other: 'منطقة أخرى' };
const SEV_AR = ['', 'خفيف', 'متوسط', 'واضح'];

const state = {
  photos: {}, // key -> dataURL (downscaled)
  isDemo: false,
  opts: { parking: 'outdoor', finish: 'gloss', focus: 'full' },
  trips: {},
  routes: {},
  result: null,
  booking: { branch: 'القادسية', pay: 'deposit', day: null },
};

// ------------------------------------------------------------------ image helpers
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
function fileToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}
async function downscale(dataUrl, max = 1600) {
  const img = await loadImage(dataUrl);
  const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  try { return c.toDataURL('image/jpeg', 0.85); } catch { return dataUrl; }
}

// ------------------------------------------------------------------ step 1: slots
let activeSlot = null;
function renderSlots() {
  const wrap = $('#slots');
  wrap.innerHTML = SLOTS.map((s) => {
    const src = state.photos[s.key];
    if (src) {
      return `<div class="slot is-filled" data-key="${s.key}" tabindex="0" role="button" aria-label="${s.label} — تغيير الصورة">
        <img src="${src}" alt="${s.label}"><span class="slot-tag">${s.label}</span>
        <button class="slot-x" data-remove="${s.key}" aria-label="حذف صورة ${s.label}">×</button></div>`;
    }
    return `<div class="slot" data-key="${s.key}" tabindex="0" role="button" aria-label="أضف صورة: ${s.label}">
      ${SIL[s.sil]}<span class="slot-label">${s.label}</span><span class="slot-hint">${s.hint}</span></div>`;
  }).join('');
  const n = Object.keys(state.photos).length;
  $('#to-step-2').disabled = n === 0;
  $('#photo-count').textContent = n === 0 ? 'لم تُضف صور بعد' : (n < 3 ? `${n} من 6 · ننصح بثلاث صور على الأقل` : `${n} من 6 صور جاهزة`);
}
$('#slots').addEventListener('click', (e) => {
  const rm = e.target.closest('[data-remove]');
  if (rm) { e.stopPropagation(); delete state.photos[rm.dataset.remove]; state.isDemo = false; renderSlots(); return; }
  const slot = e.target.closest('.slot');
  if (!slot) return;
  activeSlot = slot.dataset.key;
  $('#file-input').value = '';
  $('#file-input').click();
});
$('#slots').addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('slot')) { e.preventDefault(); e.target.click(); }
});
$('#file-input').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  if (!f || !activeSlot) return;
  if (!f.type.startsWith('image/')) { toast('الملف ليس صورة'); return; }
  try {
    state.photos[activeSlot] = await downscale(await fileToDataURL(f));
    state.isDemo = false;
    renderSlots();
  } catch { toast('تعذر قراءة الصورة. جرّب صورة JPG أو PNG.'); }
});
$$('[data-demo]').forEach((b) => b.addEventListener('click', async () => {
  const d = DEMOS[b.dataset.demo];
  b.disabled = true;
  try {
    state.photos = {};
    for (const [k, url] of Object.entries(d.files)) {
      const blob = await (await fetch(url)).blob();
      state.photos[k] = await downscale(await fileToDataURL(blob));
    }
    state.isDemo = true;
    $('#car_model').value = d.model; $('#car_year').value = d.year; $('#car_age').value = d.age;
    $('#daily_km').value = d.daily; $('#highway_share').value = d.hwy;
    state.trips = { ...d.trips };
    syncRanges(); renderTrips(); renderSlots();
    toast('أُضيفت صور نموذجية. اضغط التالي.');
  } catch { toast('تعذر تحميل الصور النموذجية'); }
  b.disabled = false;
}));

// ------------------------------------------------------------------ step 2
function bindSeg(root, onChange) {
  $$('.seg', root).forEach((seg) => {
    seg.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      e.preventDefault();
      $$('button', seg).forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', x === b); });
      onChange(seg.dataset.name, b.dataset.v);
    });
    $$('button', seg).forEach((x) => x.setAttribute('aria-pressed', x.classList.contains('is-on')));
  });
}
bindSeg($('#step-2'), (name, v) => { state.opts[name] = v; });
bindSeg($('#book-form'), (name, v) => { state.booking[name] = v; });

function syncRanges() {
  $('#daily_km_v').textContent = $('#daily_km').value;
  $('#highway_v').textContent = $('#highway_share').value;
}
$('#daily_km').addEventListener('input', syncRanges);
$('#highway_share').addEventListener('input', syncRanges);

function renderTrips() {
  $('#trips').innerHTML = Object.entries(state.routes).map(([k, r]) => `
    <div class="trip"><span>${esc(r.name)}</span>
      <div class="stepper-ctl">
        <button type="button" data-trip="${k}" data-d="-1" aria-label="إنقاص">−</button>
        <b class="num" aria-live="polite">${state.trips[k] || 0}</b>
        <button type="button" data-trip="${k}" data-d="1" aria-label="زيادة">+</button>
      </div></div>`).join('');
}
$('#trips').addEventListener('click', (e) => {
  const b = e.target.closest('[data-trip]'); if (!b) return;
  const k = b.dataset.trip;
  state.trips[k] = Math.max(0, Math.min(52, (state.trips[k] || 0) + Number(b.dataset.d)));
  renderTrips();
});

// ------------------------------------------------------------------ navigation between steps
function showStep(id) {
  ['step-1', 'step-2', 'step-analyze', 'step-3'].forEach((s) => { $('#' + s).hidden = s !== id; });
  const idx = { 'step-1': 1, 'step-2': 2, 'step-analyze': 3, 'step-3': 3 }[id];
  $$('.stepper li').forEach((li) => {
    const n = Number(li.dataset.step);
    li.classList.toggle('is-current', n === idx);
    li.classList.toggle('is-done', n < idx);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
$('#to-step-2').addEventListener('click', () => showStep('step-2'));
$('#back-1').addEventListener('click', () => showStep('step-1'));

// ------------------------------------------------------------------ run scan
const MSGS = ['نقرأ الصور…', 'نبحث عن آثار الحصى على الكبوت والصدام…', 'نقيس الدوامات والخدوش…', 'نحسب خطر طريقك…', 'نجهز الباقة المناسبة…'];
$('#run-scan').addEventListener('click', runScan);
async function runScan() {
  const keys = SLOTS.map((s) => s.key).filter((k) => state.photos[k]);
  if (!keys.length) { showStep('step-1'); return; }
  $('#analyze-img').src = state.photos[keys[0]];
  showStep('step-analyze');
  let i = 0;
  $('#analyze-msg').textContent = MSGS[0];
  const timer = setInterval(() => { i = Math.min(MSGS.length - 1, i + 1); $('#analyze-msg').textContent = MSGS[i]; }, 3200);
  const t0 = performance.now();
  try {
    const body = {
      images: keys.map((k) => state.photos[k]),
      car_model: $('#car_model').value.trim(),
      car_year: $('#car_year').value.trim(),
      car_age: $('#car_age').value,
      daily_km: Number($('#daily_km').value),
      highway_share: Number($('#highway_share').value),
      trips: state.trips,
      parking: state.opts.parking, finish: state.opts.finish, focus: state.opts.focus,
      is_demo: state.isDemo,
    };
    const res = await api('/api/scan', { method: 'POST', body: JSON.stringify(body) });
    res.keys = keys;
    res.client_seconds = ((performance.now() - t0) / 1000).toFixed(0);
    state.result = res;
    renderReport();
    showStep('step-3');
  } catch (err) {
    showStep('step-2');
    const box = document.createElement('div');
    box.className = 'err-box';
    box.innerHTML = `<strong>ما قدرنا نكمل الفحص.</strong><p class="muted small" style="margin:.25rem 0 0">${esc(err.message)}</p>`;
    $('#step-2').prepend(box);
    setTimeout(() => box.remove(), 9000);
  } finally { clearInterval(timer); }
}

// ------------------------------------------------------------------ report
function scoreTone(s, chipSev = 0) { return (s >= 85 && chipSev < 2) ? ['ok', 'حالة ممتازة'] : s >= 60 ? ['warn', 'تحتاج حماية قريباً'] : ['bad', 'تحتاج معالجة وحماية']; }
function gauge(score) {
  const r = 70, c = 2 * Math.PI * r, off = c * (1 - score / 100);
  const col = score >= 85 ? 'var(--ok)' : score >= 60 ? 'var(--gold)' : 'var(--bad)';
  return `<div class="gauge" role="img" aria-label="درجة صحة الطلاء ${score} من 100">
    <svg viewBox="0 0 170 170"><circle cx="85" cy="85" r="${r}" stroke="var(--border)" stroke-width="12" fill="none"/>
    <circle cx="85" cy="85" r="${r}" stroke="${col}" stroke-width="12" fill="none" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}"/></svg>
    <div class="g-val"><b>${score}</b><span>من 100</span></div></div>`;
}

let photoIdx = 0;
function allFindings() {
  const v = state.result.vision;
  const list = [];
  (v.photos || []).forEach((p) => (p.findings || []).forEach((f) => {
    if (f.type === 'contamination' && (f.severity || 1) < 2) return; // not permanent damage
    list.push({ ...f, photo: p.index ?? 0 });
  }));
  return list.map((f, i) => ({ ...f, n: i + 1 }));
}

function renderPhotoStage() {
  const r = state.result;
  const src = state.photos[r.keys[photoIdx]];
  const fs = allFindings().filter((f) => f.photo === photoIdx);
  const marks = fs.filter((f) => Array.isArray(f.box) && f.box.length === 4).map((f) => {
    const [x, y, w, h] = f.box.map((n) => Math.max(0, Math.min(1, Number(n))));
    return `<div class="mark sev${f.severity}" data-n="${f.n}" style="left:${x * 100}%;top:${y * 100}%;width:${Math.max(4, w * 100)}%;height:${Math.max(4, h * 100)}%"><span class="mk">${f.n}</span></div>`;
  }).join('');
  $('#photo-stage').innerHTML = `<img src="${src}" alt="صورة السيارة رقم ${photoIdx + 1}">${marks}`;
  $$('.photo-tabs button').forEach((b, i) => b.classList.toggle('is-on', i === photoIdx));
}

function renderReport() {
  const r = state.result, v = r.vision, rec = r.recommendation, risk = r.risk;
  const findings = allFindings();
  const chipSev = Math.max(0, ...findings.filter((f) => f.type === 'stone_chips' && f.certainty !== 'possible').map((f) => f.severity || 1));
  const [tone, toneLabel] = scoreTone(r.score, chipSev);
  const perPhoto = r.keys.map((_, i) => findings.filter((f) => f.photo === i).length);
  const riskTone = risk.level === 'مرتفع' ? 'bad' : risk.level === 'متوسط' ? 'warn' : 'ok';
  const car = [$('#car_model').value.trim(), $('#car_year').value.trim()].filter(Boolean).join(' ') || v.vehicle_guess || 'سيارتك';

  $('#report').innerHTML = `
    <div class="report-head">
      ${gauge(r.score)}
      <div>
        <p class="eyebrow">تقرير صحة الطلاء · ${esc(car)}${state.isDemo ? ' · صور نموذجية' : ''}</p>
        <h1 class="h-app" style="margin-bottom:.5rem">درجة الطلاء ${r.score} <span class="badge ${tone}">${toneLabel}</span></h1>
        <p class="summary">${esc(v.summary_ar || '')}</p>
        ${v.image_quality !== 'good' && v.quality_tip_ar ? `<p class="quality">تحسين التصوير: ${esc(v.quality_tip_ar)}</p>` : ''}
        <p class="muted small" style="margin:.35rem 0 0">اكتمل الفحص في ${r.client_seconds} ثانية · ${r.keys.length} ${r.keys.length > 2 ? 'صور' : 'صورة'}</p>
      </div>
    </div>

    <div class="report-grid">
      <div class="stack">
        <div class="card">
          <h2>ما وجدناه على الطلاء</h2>
          ${r.keys.length > 1 ? `<div class="photo-tabs" role="tablist">${r.keys.map((k, i) => `<button role="tab" data-ph="${i}" aria-label="الصورة ${i + 1}"><img src="${state.photos[k]}" alt="">${perPhoto[i] ? `<span class="cnt">${perPhoto[i]}</span>` : ''}</button>`).join('')}</div>` : ''}
          <div class="photo-stage" id="photo-stage"></div>
          <p class="legend-note">المربعات تقريبية لتوضيح مكان الملاحظة، وليست قياساً دقيقاً.</p>
          ${findings.length ? `<ul class="findings">${findings.map((f) => `
            <li class="finding sev${f.severity}" data-n="${f.n}" data-photo="${f.photo}" tabindex="0">
              <span class="fk">${f.n}</span>
              <div><div class="ft">${f.certainty === 'possible' ? 'آثار حصى محتملة' : (TYPE_AR[f.type] || 'ملاحظة')} · ${ZONE_AR[f.zone] || ''}</div>
                <div class="fn">${esc(f.note_ar || '')}</div>
                ${f.type === 'stone_chips' && f.count_estimate ? `<div class="muted small">عدد تقريبي: نحو ${fmt(f.count_estimate)} ${f.count_estimate > 10 ? 'أثراً' : 'آثار'}${f.source === 'zoom' ? ' · بعد فحص مكبّر للقطعة' : ''}</div>` : ''}
                <div class="sev-dots" aria-label="الشدة ${SEV_AR[f.severity]}">${[1, 2, 3].map((n) => `<i class="${n <= f.severity ? 'on' : ''}"></i>`).join('')}</div></div>
              <span class="muted small">${f.certainty === 'possible' ? 'يحتاج تأكيد' : (SEV_AR[f.severity] || '')}</span>
            </li>`).join('')}</ul>` : '<div class="empty-f" style="margin-top:1rem">لم نرصد ضرراً واضحاً في الصور. الحماية الآن تحافظ على هذه الحالة.</div>'}
        </div>

        <div class="card">
          <h2>خطر طريقك <span class="badge ${riskTone}">${risk.level}</span></h2>
          <div class="risk-meter" aria-hidden="true"><i style="left:${risk.risk}%"></i></div>
          <div class="stats-3">
            <div class="stat"><b>${fmt(risk.highway_km)}</b><span>كم سنوياً على طرق سريعة</span></div>
            <div class="stat"><b>${risk.chips_year}</b><span>ضربة حصى متوقعة سنوياً</span></div>
            <div class="stat"><b>${fmt(risk.chips_5y)}</b><span>خلال 5 سنوات</span></div>
          </div>
          ${risk.trips.length ? `<p class="muted small" style="margin:.75rem 0 0">رحلاتك: ${risk.trips.map(esc).join('، ')}</p>` : ''}
          <div class="compare">
            <div class="c-bad"><span>إعادة رش الكبوت والصدام (تقدير السوق)</span><b>${fmt(rec.repaint_range[0])} – ${fmt(rec.repaint_range[1])} ر.س</b><span>وتنزل قيمة السيارة عند البيع</span></div>
            <div class="c-ok"><span>حماية JAP لكامل السيارة</span><b>${fmt(rec.total)} ر.س</b><span>وطلاء المصنع يبقى أصلياً</span></div>
          </div>
          <p class="legend-note">المؤشر تقديري: معدل الحصى لكل 1,000 كم افتراض أولي يُعاير من بيانات سيارات JAP.</p>
        </div>
      </div>

      <div class="stack">
        <div class="card rec" id="rec-card">
          <p class="eyebrow">الباقة المقترحة لسيارتك</p>
          <h2 style="margin-bottom:.25rem">${esc(rec.name)}</h2>
          <div class="price"><b>${fmt(rec.price)} ر.س</b>${rec.was ? `<s>${fmt(rec.was)}</s>` : ''}<span class="muted small">ضمان ${esc(rec.warranty)}</span></div>
          <ul class="items">${rec.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
          ${rec.addons.map((a) => `<div class="addon"><span>+ ${esc(a.name)}</span><span class="num">${fmt(a.price)} ر.س</span></div>`).join('')}
          <div class="total"><span>الإجمالي التقديري</span><b>${fmt(rec.total)} ر.س</b></div>
          <p class="muted small" style="margin:.35rem 0 0">أو ${fmt(rec.installment)} ر.س شهرياً × 4 مع تابي أو تمارا</p>
          ${rec.reasons.length ? `<ul class="why">${rec.reasons.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
          <div class="actions">
            <button class="btn btn-primary" id="open-book">احجز وثبّت السعر</button>
            <button class="btn btn-ghost" id="share-wa">أرسل التقرير على واتساب</button>
            <button class="btn btn-ghost" id="restart">فحص سيارة أخرى</button>
          </div>
          <p class="disclaimer">الأسعار من عروض JAP المنشورة لشهر أكتوبر 2026 وشاملة الضريبة. هذا تقدير أولي بالذكاء الاصطناعي، والسعر النهائي يُحدَّد بعد المعاينة في الفرع، وقد يختلف للطرازات الكبيرة أو النادرة.</p>
        </div>
      </div>
    </div>`;

  photoIdx = 0;
  renderPhotoStage();
  $$('.photo-tabs button').forEach((b) => b.addEventListener('click', () => { photoIdx = Number(b.dataset.ph); renderPhotoStage(); }));
  $$('.finding').forEach((li) => {
    const focus = () => {
      const n = li.dataset.n, ph = Number(li.dataset.photo);
      if (ph !== photoIdx) { photoIdx = ph; renderPhotoStage(); }
      const stage = $('#photo-stage');
      stage.classList.add('focus');
      $$('.mark', stage).forEach((m) => m.classList.toggle('is-focus', m.dataset.n === n));
      $$('.finding').forEach((x) => x.classList.toggle('is-focus', x === li));
    };
    li.addEventListener('click', focus);
    li.addEventListener('keydown', (e) => { if (e.key === 'Enter') focus(); });
    li.addEventListener('mouseleave', () => $('#photo-stage').classList.remove('focus'));
  });
  $('#open-book').addEventListener('click', openBooking);
  $('#restart').addEventListener('click', () => { state.photos = {}; state.result = null; state.isDemo = false; renderSlots(); showStep('step-1'); });
  $('#share-wa').addEventListener('click', () => {
    const fl = findings.slice(0, 4).map((f) => `• ${TYPE_AR[f.type] || ''} على ${ZONE_AR[f.zone] || ''} (${SEV_AR[f.severity]})`).join('\n');
    const msg = `تقرير فحص JAP الذكي لسيارتي ${car}\nدرجة الطلاء: ${r.score}/100\n${fl}\nخطر الطريق: ${risk.level} · ${risk.chips_year} ضربة حصى متوقعة سنوياً\nالباقة المقترحة: ${rec.name} · ${fmt(rec.total)} ر.س`;
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener');
  });
}

// ------------------------------------------------------------------ booking
const DAY_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MON_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
function renderDays() {
  const out = []; const now = new Date();
  for (let i = 1; i <= 10; i++) {
    const d = new Date(now); d.setDate(now.getDate() + i);
    const fri = d.getDay() === 5;
    const label = `${DAY_AR[d.getDay()]} ${d.getDate()} ${MON_AR[d.getMonth()]}`;
    out.push(`<button type="button" data-day="${label}" ${fri ? 'disabled title="مغلق"' : ''}>${DAY_AR[d.getDay()]}<b>${d.getDate()}</b>${fri ? 'مغلق' : MON_AR[d.getMonth()]}</button>`);
  }
  $('#days').innerHTML = out.join('');
  const first = $('#days button:not([disabled])');
  first.classList.add('is-on'); state.booking.day = first.dataset.day;
}
$('#days').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  $$('#days button').forEach((x) => x.classList.toggle('is-on', x === b));
  state.booking.day = b.dataset.day;
});
function openBooking() {
  const rec = state.result.recommendation;
  $('#book-summary').textContent = `${rec.name} · ${fmt(rec.total)} ر.س · رقم الفحص ${state.result.id.slice(0, 6).toUpperCase()}`;
  $('#book-error').hidden = true;
  renderDays();
  $('#book-dialog').showModal();
}
$('#book-cancel').addEventListener('click', () => $('#book-dialog').close());
$('#book-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const btn = $('#book-submit'); btn.disabled = true; btn.textContent = 'جارٍ التأكيد…';
  try {
    const res = await api(`/api/scan/${state.result.id}/book`, {
      method: 'POST',
      body: JSON.stringify({ name: fd.get('name'), phone: fd.get('phone'), branch: state.booking.branch, slot: state.booking.day, pay: state.booking.pay }),
    });
    $('#book-dialog').close();
    $('#rec-card').innerHTML = `<div class="confirm">
      <p class="eyebrow">تم استلام طلب الحجز</p>
      <p class="ref">${res.ref}</p>
      <p>فرع ${esc(state.booking.branch)} · ${esc(state.booking.day)}</p>
      <p class="muted small">${state.booking.pay === 'deposit' ? 'السعر مثبت لمدة 30 يوماً بعد دفع العربون.' : 'سيتواصل معك فريق JAP لتأكيد الموعد.'} أحضر هذا التقرير، والفني بيراجعه معك عند الكشف.</p>
      <p class="disclaimer">نموذج أولي: لم يتم تحصيل أي مبلغ، والطلب محفوظ في لوحة التجربة فقط.</p>
      <button class="btn btn-ghost" id="restart2">فحص سيارة أخرى</button></div>`;
    $('#restart2').addEventListener('click', () => { state.photos = {}; state.result = null; renderSlots(); showStep('step-1'); });
  } catch (err) {
    $('#book-error').textContent = err.message; $('#book-error').hidden = false;
  } finally { btn.disabled = false; btn.textContent = 'تأكيد الحجز'; }
});

// ------------------------------------------------------------------ team dashboard
const STATUS_AR = { scanned: 'فحص فقط', booked: 'حجز', visited: 'زار الفرع', sold: 'تم البيع', lost: 'لم يكمل' };
async function loadTeam() {
  $('#kpis').innerHTML = '<div class="kpi"><span>جارٍ التحميل…</span></div>';
  try {
    const [st, leads] = await Promise.all([api('/api/stats'), api('/api/leads')]);
    const k = [
      [fmt(st.total), 'فحص مكتمل'],
      [fmt(st.booked), 'طلب حجز'],
      [`${st.conversion.toFixed(0)}%`, 'التحويل من فحص إلى حجز'],
      [st.accuracy == null ? '—' : `${st.accuracy.toFixed(0)}%`, `تطابق مع الفني (${st.reviewed} مراجعة)`],
      [`${st.avg_seconds} ث`, 'متوسط زمن التحليل'],
      [`${fmt(st.pipeline)}`, 'قيمة الحجوزات (ر.س)'],
    ];
    $('#kpis').innerHTML = k.map(([b, s]) => `<div class="kpi"><b>${b}</b><span>${s}</span></div>`).join('');
    const tb = $('#leads-body');
    if (!leads.length) { tb.innerHTML = '<tr><td colspan="8" class="empty-table">لا توجد فحوصات بعد. أجرِ أول فحص من صفحة الفحص.</td></tr>'; return; }
    tb.innerHTML = leads.map((l) => {
      const d = new Date(l.created_at * 1000);
      const t = `${d.getDate()} ${MON_AR[d.getMonth()]} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      const top = (l.findings?.photos || []).flatMap((p) => p.findings || []).filter((f) => f.type !== 'contamination').sort((a, b) => b.severity - a.severity)[0];
      return `<tr data-id="${l.id}">
        <td class="muted">${t}</td>
        <td>${esc(l.car_model || l.findings?.vehicle_guess || '—')} ${esc(l.car_year || '')}${l.is_demo ? '<span class="demo-tag">نموذجية</span>' : ''}
          ${top ? `<div class="muted small">أبرز ملاحظة: ${TYPE_AR[top.type] || ''} · ${ZONE_AR[top.zone] || ''}</div>` : ''}</td>
        <td><span class="pill">${l.score}</span></td>
        <td><span class="pill">${l.risk}</span></td>
        <td>${esc(l.package)}<div class="muted small num">${fmt(l.price)} ر.س</div></td>
        <td>${l.name ? `${esc(l.name)}<div class="muted small"><bdi dir="ltr" class="num">${esc(l.phone)}</bdi> · ${esc(l.branch || '')}</div>` : '<span class="muted">—</span>'}</td>
        <td><select data-status aria-label="حالة العميل">${Object.entries(STATUS_AR).map(([v, a]) => `<option value="${v}" ${l.status === v ? 'selected' : ''}>${a}</option>`).join('')}</select></td>
        <td><div class="agree">
          <button data-agree="1" class="${l.tech_agree === 1 ? 'on-yes' : ''}">يطابق</button>
          <button data-agree="0" class="${l.tech_agree === 0 ? 'on-no' : ''}">لا يطابق</button></div></td>
      </tr>`;
    }).join('');
  } catch (err) {
    $('#kpis').innerHTML = `<div class="err-box" style="grid-column:1/-1">تعذر تحميل البيانات: ${esc(err.message)}</div>`;
  }
}
$('#leads-body').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-agree]'); if (!b) return;
  const id = b.closest('tr').dataset.id;
  try { await api(`/api/leads/${id}`, { method: 'PATCH', body: JSON.stringify({ tech_agree: Number(b.dataset.agree) }) }); loadTeam(); }
  catch { toast('تعذر الحفظ'); }
});
$('#leads-body').addEventListener('change', async (e) => {
  const s = e.target.closest('[data-status]'); if (!s) return;
  const id = s.closest('tr').dataset.id;
  try { await api(`/api/leads/${id}`, { method: 'PATCH', body: JSON.stringify({ status: s.value }) }); loadTeam(); toast('تم تحديث الحالة'); }
  catch { toast('تعذر الحفظ'); }
});
$('#refresh-team').addEventListener('click', loadTeam);

// ------------------------------------------------------------------ views
function route() {
  const team = location.hash === '#team';
  $('#view-scan').hidden = team; $('#view-team').hidden = !team;
  $$('.navlink').forEach((a) => a.classList.toggle('is-active', (a.dataset.nav === 'team') === team));
  if (team) loadTeam();
}
$$('[data-nav]').forEach((a) => a.addEventListener('click', (e) => {
  e.preventDefault();
  if (a.dataset.nav === 'team') location.hash = 'team';
  else history.pushState('', '', location.pathname + location.search), route();
}));
window.addEventListener('hashchange', route);

// ------------------------------------------------------------------ init
(async function init() {
  renderSlots(); syncRanges();
  try {
    const m = await api('/api/meta');
    state.routes = m.routes;
  } catch {
    state.routes = { qassim: { name: 'الرياض ⇄ القصيم' }, dammam: { name: 'الرياض ⇄ الدمام' }, ahsa: { name: 'الرياض ⇄ الأحساء' }, makkah: { name: 'الرياض ⇄ مكة / جدة' }, hail: { name: 'الرياض ⇄ حائل' }, abha: { name: 'الرياض ⇄ أبها' } };
  }
  renderTrips();
  route();
})();