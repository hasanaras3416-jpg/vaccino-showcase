/* Uygulama ekranları: Genel, Araç parça listesi, Sistemler, Yarışlar, Envanter, Takım ve Destek.
   Tüm içerik ../data/vaccino-data.js dosyasından okunur. 3B sahneye yalnızca window.vaccino API'si ile dokunulur. */
import {site, stats, parts, systems, tests, races, inventory, inventoryCategories, inventoryStatuses, team, interfaces, rozetler, acikSorular, eskiPlan, chassisStatus} from '../data/vaccino-data.js';

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
    blocks.push(section('Veri arayüzleri', h('p', {class: 'section-note'}, 'ROS 2 / CAN prototip sözleşmesi. ', verifyBadge()),
      h('div', {class: 'table-scroll', tabindex: '0', role: 'region', 'aria-label': 'Veri arayüzleri'},
        h('table', {class: 'data-table'}, h('thead', {}, h('tr', {}, ['Kod', 'Sinyal', 'Veri yolu', 'Birim'].map(text => h('th', {scope: 'col', text})))),
          h('tbody', {}, interfaces.map(row => h('tr', {}, h('td', {text: row.id}), h('td', {text: row.sinyal}), h('td', {text: row.yol}), h('td', {text: row.birim}))))))));
  }
  const planned = tests.filter(test => test.sistem === key);
  if (planned.length) blocks.push(section('Planlanan testler', h('div', {class: 'card-grid'}, planned.map(test => h('div', {class: 'card'},
    h('span', {class: 'card-title', text: test.durum}), h('strong', {class: 'card-value small', text: test.baslik}), h('span', {class: 'card-note', text: test.yontem}),
    h('span', {class: 'card-foot'}, h('span', {class: 'chip', text: 'Sonuç bekleniyor'})))))));
  if (key === 'mekanik') {
    if (nonEmpty(acikSorular)) blocks.push(section('Açık sorular', h('div', {class: 'card question-card'},
      h('ul', {class: 'question-list'}, acikSorular.map(item => h('li', {}, h('strong', {text: item.soru}), h('span', {text: item.not})))))));
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
    blocks.push(h('div', {class: 'card-grid'}, race.genel.map(item => card(item, {eyebrow: race.ad}))));
    if (nonEmpty(race.gorevler)) blocks.push(section('Yarışlar', h('div', {class: 'card-grid two'}, race.gorevler.map(item => card({baslik: item.ad, not: item.ozet, dogrula: item.dogrula, ayrinti: [item.ozet]}, {eyebrow: race.ad})))));
    if (nonEmpty(race.basvuru)) blocks.push(section('Başvuru dosyaları', h('button', {type: 'button', class: 'list-launch', 'aria-haspopup': 'dialog',
      onclick: event => openDrawer({eyebrow: race.ad, title: 'Teknik başvuru çıktıları', verify: true, trigger: event.currentTarget,
        sections: [drawerSection('Konuşulan çıktılar', race.basvuru), h('p', {class: 'drawer-caveat', text: 'Kurumsal imza ve roller portal ve Chapter I ile doğrulanacak.'})]})},
      h('span', {text: `${race.basvuru.length} çıktı`}), h('span', {class: 'card-more', 'aria-hidden': 'true', text: 'Listeyi aç →'}))));
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
  if (nonEmpty(race.baglantilar)) blocks.push(h('nav', {class: 'related-links', 'aria-label': 'Resmî kaynaklar'},
    race.baglantilar.map(link => h('a', {href: link.href, target: '_blank', rel: 'noopener noreferrer', text: `${link.etiket} ↗`}))));
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
  const talks = nonEmpty(team.gorusmeler) ? section('Görüşmeler', h('button', {type: 'button', class: 'list-launch', 'aria-haspopup': 'dialog',
    onclick: event => openDrawer({eyebrow: 'Destek', title: 'Görüşülen kurumlar', verify: true, trigger: event.currentTarget, sections: [
      h('ul', {class: 'talk-list'}, team.gorusmeler.map(item => h('li', {}, h('strong', {text: item.ad}), h('span', {class: 'talk-meta'}, h('span', {class: 'chip', text: item.durum}), h('span', {text: item.not}))))),
      h('p', {class: 'drawer-caveat', text: 'Hiçbiri onaylı sponsor değildir. Her ilişki kendi teyit düzeyinde.'})]})},
    h('span', {text: `${team.gorusmeler.length} görüşme kaydı`}), h('span', {class: 'card-more', 'aria-hidden': 'true', text: 'Listeyi aç →'}))) : null;
  const contact = section('İletişim', h('dl', {class: 'contact-list'}, team.iletisim.map(item => h('div', {}, h('dt', {text: item.etiket}), h('dd', {text: item.deger})))));
  $('support-panel').replaceChildren(hero, section('Takım', h('div', {class: 'card-grid'}, team.bilgiler.map(item => card(item)))), needs, talks, contact);
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
renderInventoryControls();
renderInventory();
renderSupport();
document.addEventListener('vaccino:route', onRoute);
onRoute();
