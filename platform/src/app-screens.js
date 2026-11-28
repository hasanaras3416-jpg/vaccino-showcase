/* Uygulama ekranları: Genel, Araç parça listesi, Sistemler, Yarışlar, Envanter, Takım ve Destek.
   Tüm içerik ../data/vaccino-data.js dosyasından okunur. 3B sahneye yalnızca window.vaccino API'si ile dokunulur. */
import {site, stats, parts, systems, races, inventory, inventoryCategories, inventoryStatuses, team, interfaces, rozetler, acikSorular, eskiPlan, chassisStatus, suspension1900} from '../data/vaccino-data.js';
import {layout1900} from './layout-1900.js';
import {cornerSolver} from './suspension-1900.js';
import {clearance, wheelClearance, driveShafts, segmentSegment} from './frame-1900.js';

const $ = id => document.getElementById(id);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const cssMs = name => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0;

function h(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value == null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat()) if (child != null && child !== false) node.append(child);
  return node;
}
/* Doğruluk rozetleri: Ekip kararı, Aday, Tahmin, Doğrulanacak (+ arşiv için Eski plan). */
const badge = key => key && rozetler[key] ? h('span', {class: `badge-verify badge-${key}`, text: rozetler[key]}) : null;
const verifyBadge = () => badge('dogrula');
const rozetOf = item => item?.rozet ?? (item?.dogrula ? 'dogrula' : null);
/* Satır: düz metin ya da {metin, rozet}. */
const lineItem = item => typeof item === 'string' ? h('li', {text: item}) : h('li', {}, h('span', {text: item.metin + ' '}), badge(item.rozet));
const nonEmpty = list => Array.isArray(list) && list.length > 0;

/* ---------- Ayrıntı çekmecesi ---------- */
const drawer = $('detail-drawer');
let drawerTrigger = null, drawerTimer = 0;

function drawerSection(title, content) {
  if (content == null || (Array.isArray(content) && !content.length)) return null;
  let body;
  if (Array.isArray(content)) body = h('ul', {}, content.map(lineItem));
  else if (typeof content === 'string') body = h('p', {text: content});
  else body = content;
  return h('section', {class: 'drawer-section'}, h('h3', {text: title}), body);
}
function definitionList(rows) {
  const filtered = rows.filter(([, value]) => value);
  if (!filtered.length) return null;
  return h('dl', {class: 'drawer-facts'}, filtered.map(([label, value]) => h('div', {}, h('dt', {text: label}), h('dd', {}, value))));
}

export function openDrawer({eyebrow = '', title, verify = false, rozet = null, sections = [], trigger = document.activeElement}) {
  clearTimeout(drawerTimer);
  drawerTrigger = trigger instanceof HTMLElement ? trigger : null;
  $('drawer-eyebrow').textContent = eyebrow;
  $('drawer-title').replaceChildren(title, badge(rozet ?? (verify ? 'dogrula' : null)) ?? '');
  $('drawer-body').replaceChildren(...sections.filter(Boolean));
  $('drawer-body').scrollTop = 0;
  drawer.hidden = false;
  drawer.getBoundingClientRect();
  drawer.classList.add('is-open');
  document.body.classList.add('drawer-open');
  $('drawer-title').focus({preventScroll: true});
}
export function closeDrawer({returnFocus = true} = {}) {
  if (drawer.hidden) return;
  drawer.classList.remove('is-open');
  document.body.classList.remove('drawer-open');
  drawerTimer = setTimeout(() => { drawer.hidden = true; }, cssMs('--dur-panel'));
  document.querySelectorAll('[data-pick][aria-pressed="true"]').forEach(button => button.setAttribute('aria-pressed', 'false'));
  if (returnFocus && drawerTrigger?.isConnected) drawerTrigger.focus({preventScroll: true});
  drawerTrigger = null;
}
$('drawer-close').addEventListener('click', () => closeDrawer());
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || drawer.hidden || document.querySelector('dialog[open]')) return;
  event.preventDefault();
  closeDrawer();
});

/* ---------- Kayan altçizgili sekmeler ---------- */
function renderTabs(nav, items, label) {
  nav.setAttribute('aria-label', label);
  const indicator = h('span', {class: 'tab-indicator', 'aria-hidden': 'true'});
  const links = items.map(item => h('a', {href: item.href, 'aria-current': item.current ? 'page' : null, text: item.label}));
  const previous = nav.querySelector('.tab-indicator');
  const start = previous ? {x: previous.style.getPropertyValue('--x'), w: previous.style.getPropertyValue('--w')} : null;
  nav.replaceChildren(...links, indicator);
  if (start) { indicator.style.setProperty('--x', start.x); indicator.style.setProperty('--w', start.w); }
  requestAnimationFrame(() => placeIndicator(nav));
}
function placeIndicator(nav) {
  const active = nav.querySelector('[aria-current]'), indicator = nav.querySelector('.tab-indicator');
  if (!active || !indicator) return;
  indicator.style.setProperty('--x', `${active.offsetLeft}px`);
  indicator.style.setProperty('--sx', String(active.offsetWidth / 100));
  if (nav.scrollWidth > nav.clientWidth) active.scrollIntoView({block: 'nearest', inline: 'nearest', behavior: 'instant'});
}
new ResizeObserver(() => document.querySelectorAll('.tabs').forEach(placeIndicator)).observe(document.body);

function animatePanel(panel) {
  panel.classList.remove('panel-enter');
  if (reducedMotion.matches) return;
  panel.getBoundingClientRect();
  panel.classList.add('panel-enter');
  // Kart ve listeler sırayla: en çok 6 öğe, 40 ms aralık; gerisi altıncıyla birlikte.
  panel.querySelectorAll('.card-grid, .race-switch, .tag-list, .talk-list').forEach(list => {
    [...list.children].forEach((item, i) => item.style.setProperty('--i', String(Math.min(i, 5))));
    list.classList.remove('m-stagger'); void list.offsetWidth; list.classList.add('m-stagger');
  });
}
/* Kart ızgarası dengesi: son satırda tek kart kalmasın (bkz. app-shell.css, .card-grid[data-n]). */
function balanceGrid(grid) {
  const n = grid.children.length;
  grid.dataset.n = String(n); grid.dataset.r3 = String(n % 3); grid.dataset.r2 = String(n % 2);
}
new MutationObserver(records => {
  for (const record of records) {
    if (record.target.matches?.('.card-grid')) balanceGrid(record.target);
    for (const node of record.addedNodes) {
      if (node.nodeType !== 1) continue;
      if (node.matches('.card-grid')) balanceGrid(node);
      node.querySelectorAll('.card-grid').forEach(balanceGrid);
    }
  }
}).observe(document.getElementById('workspace'), {childList: true, subtree: true});
document.querySelectorAll('.card-grid').forEach(balanceGrid);

/* ---------- Kartlar ---------- */
function card(item, {eyebrow = '', extra = []} = {}) {
  const hasDetail = nonEmpty(item.ayrinti) || item.href;
  const content = [
    item.deger ? h('span', {class: 'card-title', text: item.baslik}) : null,
    h('strong', {class: 'card-value', text: item.deger || item.baslik}),
    item.not ? h('span', {class: 'card-note', text: item.not}) : null,
    h('span', {class: 'card-foot'}, badge(rozetOf(item)) ?? h('span'), hasDetail ? h('span', {class: 'card-more', 'aria-hidden': 'true', text: 'Ayrıntı →'}) : null)
  ];
  if (!hasDetail) return h('div', {class: 'card'}, content);
  return h('button', {type: 'button', class: 'card is-interactive', 'aria-haspopup': 'dialog',
    onclick: event => openDrawer({
      eyebrow, title: item.baslik, rozet: rozetOf(item), trigger: event.currentTarget,
      sections: [
        definitionList([['Değer', item.deger], ['Not', item.not]]),
        drawerSection('Ayrıntı', item.ayrinti),
        ...extra,
        item.href ? h('a', {class: 'drawer-link', href: item.href, text: '3B’de incele →'}) : null
      ]
    })
  }, content);
}
const section = (title, ...children) => h('section', {class: 'app-section'}, h('h2', {class: 'section-heading', text: title}), ...children);

/* ---------- Genel ---------- */
function renderHome() {
  $('home-tagline').textContent = site.tanim + '.';
  $('home-eyebrow').textContent = `${site.okul} · ${site.sehir}`;
  $('home-status').replaceChildren(h('span', {class: 'status-dot', 'aria-hidden': 'true'}), h('span', {text: site.durum.etiket}));
  $('home-stats').replaceChildren(...stats.map(stat => h('li', {class: 'stat'},
    h('span', {class: 'stat-value'}, stat.deger, stat.birim ? h('small', {text: ` ${stat.birim}`}) : null),
    h('span', {class: 'stat-label', text: stat.etiket}),
    h('span', {class: 'stat-source'}, h('span', {text: stat.kaynak}), badge(stat.rozet))
  )));
}

/* ---------- Araç: parça listesi + çekmece ---------- */
let partGroup = 'Tümü';
function partSections(part) {
  return [
    drawerSection('Görevi', part.gorev),
    drawerSection('Ölçü ve model', part.olcu),
    drawerSection('Durum', h('p', {class: 'drawer-status'}, h('span', {class: 'chip', text: part.durum}), badge(rozetOf(part)))),
    drawerSection('Ayrıntı', part.ayrinti),
    h('p', {class: 'drawer-caveat', text: '3B geometri temsilidir; üretim çizimi değildir.'})
  ];
}
function showPart(id, trigger) {
  const part = parts.find(item => item.id === id);
  if (!part) return;
  try { window.vaccino?.select?.(id); } catch (error) { console.warn(error); }
  document.querySelectorAll('[data-pick]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.pick === id)));
  openDrawer({eyebrow: part.grup, title: part.ad, rozet: rozetOf(part), sections: partSections(part), trigger});
}
/* Araç ekranı: Şasi durumu kartı (bir kez eklenir) */
function renderChassisStatus() {
  const screen = document.querySelector('[data-screen=vehicle]');
  if (!screen || document.getElementById('chassis-status') || !chassisStatus) return;
  const card = h('section', {class: 'card chassis-status', id: 'chassis-status', 'aria-labelledby': 'chassis-status-title'},
    h('h2', {class: 'section-heading', id: 'chassis-status-title', text: chassisStatus.baslik}),
    h('ul', {class: 'status-lines'}, chassisStatus.satirlar.map(lineItem)),
    h('h3', {class: 'status-subhead'}, chassisStatus.eklenecek.baslik + ' ', badge(chassisStatus.eklenecek.rozet)),
    h('ul', {class: 'tag-list'}, chassisStatus.eklenecek.maddeler.map(item => h('li', {text: item}))),
    h('p', {class: 'section-note', text: chassisStatus.not}));
  screen.append(card);
}
/* Süspansiyon ADAYI (dingil 1900): mekanik ekibin tablosu, tekerlek hareketi kaydırıcısı, bağlantı noktası – boru
   uzaklıkları ve çakışma kontrolü. Uzaklıklar 3B sahnedeki kesilmiş şasi ağından (vaccino.frameModel); Doğrulanacak. */
const fmtMm = n => `${Math.round(n).toLocaleString('tr-TR')} mm`;
const fmtDeg = n => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(2).replace('.', ',')}°`;
function renderSuspension1900() {
  const screen = document.querySelector('[data-screen=vehicle]');
  if (!screen || document.getElementById('suspension-1900') || !suspension1900) return;
  const d = suspension1900, L = layout1900;
  const solvers = Object.fromEntries(['front', 'rear'].map(k => [k, cornerSolver(L.corners[k], L.track[k] / 2, L.wheelY)]));
  const rest = Object.fromEntries(['front', 'rear'].map(k => [k, solvers[k](0)]));
  const live = h('output', {class: 'susp-live', 'aria-live': 'polite'});
  const slider = h('input', {type: 'range', min: String(-L.travel), max: String(L.travel), step: '1', value: '0', id: 'susp-travel', 'aria-describedby': 'susp-travel-note'});
  const update = () => {
    const t = +slider.value, rows = [];
    for (const [k, ad] of [['front', 'Ön'], ['rear', 'Arka']]) {
      const p = solvers[k](t), dc = p.coilover - rest[k].coilover;
      rows.push(`${ad}: kamber ${fmtDeg(p.camberDeg)} · coilover ${p.coilover.toFixed(1).replace('.', ',')} mm (${dc >= 0 ? '+' : '−'}${Math.abs(dc).toFixed(1).replace('.', ',')})`);
    }
    live.textContent = `${t > 0 ? '+' : ''}${t} mm · ${rows.join(' · ')}`;
    window.vaccino?.setSuspensionTravel?.(t);
  };
  slider.addEventListener('input', update);
  const mounts = h('ul', {class: 'status-lines'}, h('li', {text: 'Ölçülüyor…'}));
  const clashes = h('ul', {class: 'status-lines'});
  const card = h('section', {class: 'card chassis-status suspension-card', id: 'suspension-1900', 'aria-labelledby': 'suspension-1900-title'},
    h('h2', {class: 'section-heading', id: 'suspension-1900-title'}, d.baslik + ' ', h('span', {class: 'badge-verify badge-aday', text: d.etiket})),
    h('div', {class: 'table-scroll', tabindex: '0', role: 'region', 'aria-label': 'Süspansiyon hesap sonuçları'},
      h('table', {class: 'data-table'}, h('thead', {}, h('tr', {}, d.sutunlar.map(text => h('th', {scope: 'col', text})))),
        h('tbody', {}, d.satirlar.map(([a, b, c]) => h('tr', {}, h('th', {scope: 'row', text: a}), h('td', {text: b}), h('td', {text: c})))))),
    h('p', {class: 'section-note', text: d.ackermann}),
    h('label', {class: 'susp-slider', for: 'susp-travel'}, h('span', {text: 'Tekerlek hareketi (−25…+25 mm)'}), slider),
    live,
    h('p', {class: 'section-note', id: 'susp-travel-note', text: 'Dört-çubuk çözümü: alt kol açısı → üst kol çemberi kesişimi. Kamber ve coilover boyu canlı hesaplanır; 3B sahnede rotil, teker ve coilover birlikte hareket eder.'}),
    h('h3', {class: 'status-subhead'}, 'Bağlantı noktası – en yakın boru ', badge('dogrula')), mounts,
    h('h3', {class: 'status-subhead'}, 'Çakışma kontrolü ', badge('dogrula')), clashes,
    h('p', {class: 'section-note', text: `${d.kaynak}. Altın renkli borular adayla eklenenler (alçak raylar, ön çemberler). Uzaklıklar 3B şasi ağının yüzeyinden ölçülür; CAD ölçümü değildir.`}));
  screen.append(card);
  update();
  // Coilover ile tahrik aksı (arka) ve rot kolu (ön; rep-parts.js kremayer → mafsal) arasındaki en kısa mesafe
  const coil = k => [[L.axles[k], L.corners[k].coilover.lower[1], L.corners[k].coilover.lower[0]], [L.axles[k], L.corners[k].coilover.top[1], L.corners[k].coilover.top[0]]];
  const springR = L.coilover.springD / 2;
  const checks = [
    {ad: 'Arka coilover – tahrik aksı', seg: driveShafts(L)[1], r: driveShafts(L)[1].r, k: 'rear'},
    {ad: 'Ön coilover – rot kolu (temsili, önceki yerleşimden)', seg: {a: [565, 150, 220], b: [L.axles.front - 40, L.wheelY + 20, L.track.front / 2 - 70]}, r: 8, k: 'front'}
  ];
  clashes.replaceChildren(...checks.map(c => {
    const [a, b] = coil(c.k), r = segmentSegment(a, b, c.seg.a, c.seg.b), gap = r.d - springR - c.r;
    const li = h('li', {class: gap <= 0 ? 'is-fail' : null}, h('span', {text: `${c.ad}: `}), h('b', {text: gap <= 0 ? `çakışma (${fmtMm(gap)})` : fmtMm(gap)}));
    return li;
  }));
  const measure = model => {
    const rows = [];
    for (const [k, ad] of [['front', 'Ön'], ['rear', 'Arka']]) {
      const c = L.corners[k], x = L.axles[k], off = L.legOffset;
      const pt = ([z, y], dx = 0) => [x + dx, y, z];
      const worst = pts => pts.map(p => clearance(p, model)).reduce((a, b) => (b.mm > a.mm ? b : a));
      rows.push([`${ad} alt kol iç pivot`, worst([pt(c.lower.inner, -off), pt(c.lower.inner, off)])]);
      rows.push([`${ad} üst kol iç pivot`, worst([pt(c.upper.inner, -off), pt(c.upper.inner, off)])]);
      rows.push([`${ad} coilover üst bağlantı`, clearance(pt(c.coilover.top), model)]);
    }
    mounts.replaceChildren(...rows.map(([ad, r]) => h('li', {class: r.mm > 40 ? 'is-warn' : null},
      h('span', {text: `${ad} (${r.ad}): `}), h('b', {text: r.mm <= 0 ? 'boru üstünde' : fmtMm(r.mm)}))));
    // Teker – boru boşluğu (Bölüm A: teker boru kafesin içinde kalmalı). Çakışma kırmızı gösterilir, gizlenmez.
    clashes.prepend(...[['front', 'Ön teker'], ['rear', 'Arka teker']].map(([k, ad]) => {
      const r = wheelClearance(model, L.axles[k], L.track[k] / 2), at = r.at ? ` · x ${Math.round(r.at[0])}, y ${Math.round(r.at[1])}, z ±${Math.abs(Math.round(r.at[2]))}` : '';
      return h('li', {class: r.mm <= 0 ? 'is-fail' : null}, h('span', {text: `${ad} – en yakın boru (${r.ad}${at}): `}), h('b', {text: r.mm <= 0 ? `çakışma (${fmtMm(r.mm)})` : fmtMm(r.mm)}));
    }));
  };
  // Ölçüm modeli 3B sahne yüklenince gelir (kesilmiş STEP ağı); WebGL yoksa ölçüm yapılmaz
  if (window.vaccino?.frameModel) measure(window.vaccino.frameModel);
  else document.addEventListener('vaccino:frame-model', () => window.vaccino?.frameModel ? measure(window.vaccino.frameModel) : mounts.replaceChildren(h('li', {text: '3B şasi yüklenemedi; ölçüm yapılamadı.'})), {once: true});
}

function renderVehicle() {
  const groups = ['Tümü', ...new Set(parts.map(part => part.grup))];
  $('part-filter').replaceChildren(...groups.map(group => h('button', {type: 'button', class: 'chip-button', 'aria-pressed': String(group === partGroup), text: group,
    onclick: () => { partGroup = group; renderVehicle(); }})));
  const visible = parts.filter(part => partGroup === 'Tümü' || part.grup === partGroup);
  $('part-panel-count').textContent = `${visible.length} parça`;
  $('part-list').replaceChildren(...visible.map(part => h('li', {},
    h('button', {type: 'button', class: 'part-item', 'aria-haspopup': 'dialog', 'aria-pressed': 'false', dataset: {pick: part.id}, onclick: event => showPart(part.id, event.currentTarget)},
      h('span', {class: 'part-name', text: part.ad}), h('span', {class: 'part-state', text: part.durum}))
  )));
}
/* 3B işaretçiye tıklanınca yerleşik inceleyici yerine aynı çekmeceyi aç. */
let pinPick = false;
$('pins')?.addEventListener('click', () => { pinPick = document.body.dataset.route === 'vehicle'; }, true);
document.addEventListener('vaccino:part', event => {
  if (!pinPick) return;
  pinPick = false;
  const id = event.detail;
  setTimeout(() => {
    document.dispatchEvent(new Event('vaccino:inspector-close'));
    const part = parts.find(item => item.id === id);
    if (part) openDrawer({eyebrow: part.grup, title: part.ad, rozet: rozetOf(part), sections: partSections(part), trigger: document.querySelector(`#pins [data-part="${id}"]`)});
  });
});

/* ---------- Sistemler ---------- */
const systemOrder = ['mekanik', 'elektrik', 'yazilim', 'surucu', 'nextion'];
function renderSystems(sub) {
  const key = systemOrder.includes(sub) ? sub : 'mekanik';
  const data = systems[key];
  renderTabs($('systems-tabs'), systemOrder.map(id => ({label: systems[id].ad, href: `#/systems/${id}`, current: id === key})), 'Sistem sekmeleri');
  const panel = $('systems-panel');
  const head = h('div', {class: 'panel-head'}, h('p', {class: 'panel-lead', text: data.ozet}),
    data.derin ? h('a', {class: 'pill-link', href: data.derin.href, text: `${data.derin.etiket} →`}) : null,
    key === 'nextion' ? h('button', {type: 'button', class: 'pill-link', 'aria-haspopup': 'dialog', onclick: () => $('nextion-dialog')?.showModal(), text: 'Ekranı aç ↗'}) : null);
  const blocks = [head, h('div', {class: 'card-grid'}, data.kartlar.map(item => card(item, {eyebrow: data.ad})))];
  if (nonEmpty(data.hat)) blocks.push(section('Geliştirme hattı', h('ol', {class: 'pipeline'}, data.hat.map((step, i) => h('li', {}, h('small', {text: String(i + 1).padStart(2, '0')}), h('span', {text: step}))))));
  if (key === 'yazilim' && nonEmpty(interfaces)) {
    blocks.push(section('Veri arayüzleri', h('p', {class: 'section-note', text: 'ROS 2 / CAN prototip sözleşmesi; henüz doğrulanmadı.'}),
      h('div', {class: 'table-scroll', tabindex: '0', role: 'region', 'aria-label': 'Veri arayüzleri'},
        h('table', {class: 'data-table'}, h('thead', {}, h('tr', {}, ['Kod', 'Sinyal', 'Veri yolu', 'Birim'].map(text => h('th', {scope: 'col', text})))),
          h('tbody', {}, interfaces.map(row => h('tr', {}, h('td', {text: row.id}), h('td', {text: row.sinyal}), h('td', {text: row.yol}), h('td', {text: row.birim}))))))));
  }
  if (data.oncekiSezon) blocks.push(h('details', {class: 'quiet-disclosure archive'},
    h('summary', {}, `${data.oncekiSezon.baslik} · ${data.oncekiSezon.kartlar.length}`),
    h('p', {class: 'section-note', text: data.oncekiSezon.not}),
    h('div', {class: 'card-grid'}, data.oncekiSezon.kartlar.map(item => card(item, {eyebrow: data.oncekiSezon.baslik})))));
  if (key === 'mekanik') {
    if (nonEmpty(acikSorular)) blocks.push(section('Açık sorular', h('div', {class: 'card question-card'},
      h('ul', {class: 'question-list'}, acikSorular.map(item => h('li', {}, h('strong', {}, item.soru + ' ', badge(item.rozet)), h('span', {text: item.not})))))));
    if (nonEmpty(eskiPlan?.maddeler)) blocks.push(h('details', {class: 'quiet-disclosure archive'},
      h('summary', {}, `Eski plan arşivi (${eskiPlan.maddeler.length})`),
      h('p', {class: 'section-note'}, `${eskiPlan.tarih} itibarıyla bırakıldı. ${eskiPlan.not}`),
      eskiPlan.gorsel ? h('figure', {class: 'archive-figure'}, h('img', {src: eskiPlan.gorsel.src, alt: eskiPlan.gorsel.alt, loading: 'lazy', width: '901', height: '440'}),
        h('figcaption', {}, eskiPlan.gorsel.baslik + ' ', badge('eski'))) : null,
      h('ul', {class: 'question-list'}, eskiPlan.maddeler.map(item => h('li', {}, h('strong', {}, item.baslik + ' ', badge('eski')), h('span', {text: item.not}))))));
  }
  if (data.not) blocks.push(h('p', {class: 'section-note', text: data.not}));
  blocks.push(h('nav', {class: 'related-links', 'aria-label': 'İlgili sayfalar'},
    h('a', {href: '#/decisions', text: 'Mühendislik kararları'}), h('a', {href: '#/tests', text: 'Test planı'}), h('a', {href: '#/experience/track', text: 'Pist ve simülasyon'})));
  panel.replaceChildren(...blocks);
  animatePanel(panel);
}

/* ---------- Yarışlar ---------- */
function raceTabs(race) {
  return [['genel', 'Genel', true], ['kurallar', 'Kurallar', nonEmpty(race.kurallar)], ['takvim', 'Takvim', nonEmpty(race.takvim)]].filter(([, , show]) => show);
}
function renderRaces(sub) {
  const [raceId, tabId] = (sub || '').split('/');
  const race = races.find(item => item.id === raceId) || races[0];
  const tabs = raceTabs(race);
  const tab = tabs.some(([id]) => id === tabId) ? tabId : 'genel';
  $('race-switch').replaceChildren(...races.map(item => h('a', {href: `#/races/${item.id}/genel`, 'aria-current': item === race ? 'page' : null},
    h('strong', {text: item.ad}), h('small', {text: item.alt}))));
  renderTabs($('race-tabs'), tabs.map(([id, label]) => ({label, href: `#/races/${race.id}/${id}`, current: id === tab})), `${race.ad} sekmeleri`);
  const panel = $('races-panel');
  const blocks = [];
  if (tab === 'genel') {
    blocks.push(h('div', {class: 'card-grid'}, race.genel.slice(0, 4).map(item => card(item, {eyebrow: race.ad}))));
  }
  if (tab === 'kurallar') {
    blocks.push(h('p', {class: 'section-note'}, race.kuralNotu + ' ', verifyBadge()));
    blocks.push(h('div', {class: 'card-grid'}, race.kurallar.map(rule => h('div', {class: 'card'},
      h('span', {class: 'card-title', text: rule.baslik}), h('strong', {class: 'card-value', text: rule.deger}), h('span', {class: 'card-note', text: rule.not}),
      h('span', {class: 'card-foot'}, badge(rule.rozet ?? 'dogrula'))))));
    if (nonEmpty(race.acikKontrol)) blocks.push(section('Kontrol edilecek', h('ul', {class: 'tag-list'}, race.acikKontrol.map(item => h('li', {text: item})))));
  }
  if (tab === 'takvim') {
    blocks.push(h('ol', {class: 'timeline'}, race.takvim.map(item => h('li', {},
      h('span', {class: 'timeline-date', text: item.tarih}),
      h('span', {class: 'timeline-body'}, h('strong', {text: item.baslik}), h('span', {class: 'timeline-meta'}, h('span', {class: 'chip', text: item.tur}), item.dogrula ? verifyBadge() : null))))));
    blocks.push(h('p', {class: 'section-note', text: 'Önceki kontrolde görünen tarihler. Resmî kaynaktan yeniden kontrol edilecek.'}));
  }
  const files = nonEmpty(race.basvuru) ? h('button', {type: 'button', class: 'link-button', 'aria-haspopup': 'dialog', text: `Başvuru dosyaları (${race.basvuru.length})`,
    onclick: event => openDrawer({eyebrow: race.ad, title: 'Teknik başvuru çıktıları', verify: true, trigger: event.currentTarget,
      sections: [drawerSection('Konuşulan çıktılar', race.basvuru), h('p', {class: 'drawer-caveat', text: 'Kurumsal imza ve roller portal ve Chapter I ile doğrulanacak.'})]})}) : null;
  if (files || nonEmpty(race.baglantilar)) blocks.push(h('nav', {class: 'related-links', 'aria-label': 'Başvuru ve resmî kaynaklar'}, files,
    (race.baglantilar || []).map(link => h('a', {href: link.href, target: '_blank', rel: 'noopener noreferrer', text: `${link.etiket} ↗`}))));
  panel.replaceChildren(...blocks);
  animatePanel(panel);
}

/* ---------- Envanter ---------- */
function renderInventoryControls() {
  for (const value of inventoryCategories) $('inv-category').append(new Option(value, value));
  for (const value of inventoryStatuses) $('inv-status').append(new Option(value, value));
  for (const id of ['inv-search', 'inv-category', 'inv-status']) $(id).addEventListener(id === 'inv-search' ? 'input' : 'change', renderInventory);
}
function inventorySections(item) {
  return [
    definitionList([['Model', item.model], ['Kategori', item.kategori], ['Durum', item.durum], ['Adet', item.adet], ['Sorumlu ekip', item.ekip]]),
    drawerSection('Not', item.not),
    drawerSection('Fiyat bilgisi', item.fiyat),
    drawerSection('Kaynak', item.kaynak),
    h('p', {class: 'drawer-caveat', text: 'Fiziksel stok sayımı yapılmadı. Fiyatlar teklif değildir.'})
  ];
}
function renderInventory() {
  const query = $('inv-search').value.trim().toLocaleLowerCase('tr');
  const category = $('inv-category').value, status = $('inv-status').value;
  const rows = inventory.filter(item => (!category || item.kategori === category) && (!status || item.durum === status) &&
    Object.values(item).join(' ').toLocaleLowerCase('tr').includes(query));
  $('inv-count').textContent = `${rows.length} / ${inventory.length} kayıt`;
  const body = $('inv-rows');
  if (!rows.length) {
    body.replaceChildren(h('tr', {}, h('td', {colspan: '4', class: 'empty-row', text: 'Bu filtreyle eşleşen kayıt yok.'})));
    return;
  }
  body.replaceChildren(...rows.map(item => h('tr', {},
    h('td', {}, h('button', {type: 'button', class: 'inv-open', 'aria-haspopup': 'dialog',
      onclick: event => openDrawer({eyebrow: `${item.id} · ${item.kategori}`, title: item.ad, rozet: item.durum === 'Eski plan' ? 'eski' : 'dogrula', sections: inventorySections(item), trigger: event.currentTarget})},
      h('span', {class: 'inv-name', text: item.ad}), h('span', {class: 'inv-model-inline', text: item.model}))),
    h('td', {class: 'inv-model', text: item.model}),
    h('td', {class: 'inv-category', text: item.kategori}),
    h('td', {}, h('span', {class: `chip status-${item.durum === 'Elde' ? 'ok' : item.durum === 'Arızalı' ? 'bad' : item.durum === 'Eski plan' ? 'old' : 'open'}`, text: item.durum}))
  )));
}

/* ---------- Takım ve Destek ---------- */
function renderSupport() {
  const hero = h('header', {class: 'support-hero'},
    h('p', {class: 'eyebrow-line', text: `${team.okul.ad} · ${team.okul.sehir}`}),
    h('h2', {}, 'Birlikte ', h('em', {text: 'yarışalım.'})),
    h('p', {class: 'panel-lead', text: `${team.okul.alan}, ${site.sezon} sezonu.`}));
  const needs = section('İhtiyaçlarımız', h('div', {class: 'card-grid three'}, team.ihtiyaclar.map(item => card({...item, dogrula: false}, {eyebrow: 'İhtiyaç'}))));
  const talks = nonEmpty(team.gorusmeler) && !team.gorusmelerGizli ? section('Görüşmeler', h('button', {type: 'button', class: 'list-launch', 'aria-haspopup': 'dialog',
    onclick: event => openDrawer({eyebrow: 'Destek', title: 'Görüşülen kurumlar', verify: true, trigger: event.currentTarget, sections: [
      h('ul', {class: 'talk-list'}, team.gorusmeler.map(item => h('li', {}, h('strong', {text: item.ad}), h('span', {class: 'talk-meta'}, h('span', {class: 'chip', text: item.durum}), h('span', {text: item.not}))))),
      h('p', {class: 'drawer-caveat', text: 'Hiçbiri onaylı sponsor değildir. Her ilişki kendi teyit düzeyinde.'})]})},
    h('span', {text: `${team.gorusmeler.length} görüşme kaydı`}), h('span', {class: 'card-more', 'aria-hidden': 'true', text: 'Listeyi aç →'}))) : null;
  // İletişim: yer tutucu ("[...]") ya da boş değerler gösterilmez; gerçek bilgi girilince bölüm kendiliğinden görünür.
  const realContacts = (team.iletisim || []).filter(item => item.deger && !/^\s*\[.*\]\s*$/.test(item.deger));
  const contact = realContacts.length ? section('İletişim', h('dl', {class: 'contact-list'}, realContacts.map(item => h('div', {}, h('dt', {text: item.etiket}), h('dd', {text: item.deger}))))) : null;
  $('support-panel').replaceChildren(...[hero, section('Takım', h('div', {class: 'card-grid'}, team.bilgiler.filter(item => !item.hidden).map(item => card({...item, dogrula: false})))), needs, talks, contact].filter(Boolean));
}

/* ---------- Yönlendirme ---------- */
function onRoute() {
  const route = document.body.dataset.route, sub = document.body.dataset.sub || '';
  if (!drawer.hidden) closeDrawer({returnFocus: false});
  if (route === 'systems') renderSystems(sub);
  if (route === 'races') renderRaces(sub);
  requestAnimationFrame(() => document.querySelectorAll('[data-screen]:not([hidden]) .tabs').forEach(placeIndicator));
}
renderHome();
renderVehicle();
renderChassisStatus();
renderSuspension1900();
renderInventoryControls();
renderInventory();
renderSupport();
document.addEventListener('vaccino:route', onRoute);
onRoute();
