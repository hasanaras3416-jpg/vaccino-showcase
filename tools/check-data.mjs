#!/usr/bin/env node
/*
 * VACCİNO veri tutarlılık kontrolü.
 * platform/data/vaccino-data.js (ekranların okuduğu değerler) ile platform/data/project.json
 * (3B ve ayrıntı ekranları) arasındaki ortak değerleri karşılaştırır.
 * Kullanım: npm run check:data   (ya da)   node tools/check-data.mjs
 * Çıkış kodu: çelişki varsa 1, yoksa 0. Paket bağımlılığı yoktur.
 */
import {readFileSync} from 'node:fs';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {dirname, join} from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = await import(pathToFileURL(join(root, 'platform/data/vaccino-data.js')).href);
const project = JSON.parse(readFileSync(join(root, 'platform/data/project.json'), 'utf8'));

const problems = [];
const warn = message => problems.push(message);
/* Satırlar düz metin ya da {metin, rozet} olabilir. */
const text = value => Array.isArray(value) ? value.map(text).join(' ') : typeof value === 'object' && value ? (value.metin ?? JSON.stringify(value)) : String(value ?? '');
const norm = value => text(value).replace(/\s+/g, ' ').replace(/(\d)\.(\d{3})/g, '$1$2').replace(/,/g, '.');
const part = id => data.parts.find(item => item.id === id);
const projectPart = id => project.parts.find(item => item.id === id);
const has = (haystack, needle, where) => { if (!norm(haystack).includes(norm(needle))) warn(`${where}: "${needle}" bulunamadı`); };

/* 1. Batarya: project.json parametreleri → vaccino-data.js metinleri */
const b = project.parameters.battery;
const wh = b.nominalV * b.capacityAh, fullV = +(b.series * b.cellFullV).toFixed(2);
const battery = text(part('battery')?.olcu);
has(battery, `${b.series}S${b.parallel}P`, 'Batarya (parts.battery)');
has(battery, `${b.nominalV} V`, 'Batarya (parts.battery)');
has(battery, `${b.capacityAh} Ah`, 'Batarya (parts.battery)');
has(battery, `${wh} Wh`, 'Batarya (parts.battery)');
has(battery, `${String(fullV).replace('.', ',')} V`, 'Batarya tam dolu (parts.battery)');
has(text(data.stats), `${b.nominalV} V · ${wh}`, 'Batarya (stats)');

/* 2. Motor etiketi: iki dosyada aynı değerler */
const motorLabel = ['48 V', '1000 W', '450 dev/dk', '20 A'];
const motorData = text(part('motor')?.olcu);
const motorProject = text([project.decisions.find(d => /orta motor/i.test(d.title))?.reason, projectPart('motor')?.facts]);
for (const value of motorLabel) {
  has(motorData, value, 'Motor etiketi (vaccino-data.js)');
  has(motorProject, value, 'Motor etiketi (project.json)');
}

/* 3. Şasi: Ø30 çizimi ölçüsü ve boru */
const frameData = text(part('frame')?.olcu), frameProject = text(projectPart('frame')?.facts);
for (const value of ['2.830 × 1.230 × 980', 'Ø30 × 2']) { has(frameData, value, 'Şasi (vaccino-data.js)'); has(frameProject, value, 'Şasi (project.json)'); }

/* 4. Planlanan testler: aynı başlıklar */
const projectTests = new Set(project.tests.map(test => norm(test.title)));
for (const test of data.tests) if (!projectTests.has(norm(test.baslik))) warn(`Test "${test.baslik}" project.json tests içinde yok`);

/* 5. Eski plan ifadeleri yalnızca arşiv/etiketli yerlerde */
const oldPlan = /hub motor|kayış|kasnak|zincir(?!i)|QS260|UUMotor|Arora|Flipsky|2\.?675/i;
const allowed = /eski plan|bırakıldı|terk/i;
function scan(value, path) {
  if (typeof value === 'string') { if (oldPlan.test(value) && !allowed.test(value)) warn(`Eski plan ifadesi etiketsiz: ${path} → "${value.slice(0, 90)}"`); return; }
  if (Array.isArray(value)) value.forEach((item, i) => scan(item, `${path}[${i}]`));
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) scan(item, `${path}.${key}`);
}
const archived = item => item?.durum === 'Eski plan';
scan({...data, eskiPlan: undefined, inventory: data.inventory.filter(item => !archived(item))}, 'vaccino-data');
const {drivetrain, ...presentation} = project.presentation;
scan({decisions: project.decisions, tests: project.tests, presentation, central: drivetrain.variants.central,
  parts: project.parts.filter(item => !['hub-motor', 'hub-battery', 'free-wheel'].includes(item.id))}, 'project.json');

/* 6. Her kartın ve istatistiğin rozeti olmalı */
const keys = new Set(Object.keys(data.rozetler));
const needsBadge = (item, where) => { const key = item.rozet ?? (item.dogrula ? 'dogrula' : null); if (/\d/.test(item.deger ?? '') && !keys.has(key)) warn(`Rozetsiz sayı: ${where} → ${item.deger}`); };
data.stats.forEach((item, i) => needsBadge(item, `stats[${i}]`));
for (const [id, system] of Object.entries(data.systems)) system.kartlar.forEach(item => needsBadge(item, `systems.${id} · ${item.baslik}`));
for (const race of data.races) race.genel.forEach(item => needsBadge(item, `races.${race.id} · ${item.baslik}`));

if (problems.length) {
  console.error(`Veri kontrolü: ${problems.length} uyarı`);
  for (const line of problems) console.error(`  - ${line}`);
  process.exit(1);
}
console.log('Veri kontrolü: çelişki yok.');
