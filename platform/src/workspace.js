import {record, parameters, format, state, part} from './store.js';
import {initializeSeason, loadBrandLogo} from './season.js';

const $ = id => document.getElementById(id);
const make = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text !== undefined && text !== null) node.textContent = text;
  if (className) node.className = className;
  return node;
};
const paragraph = (text, className) => make('p', text, className);
const link = (text, href, className) => {const a=make('a', text, className);a.href=href;return a;};
const routes = record.presentation.routes;
const systems = record.presentation.systems;
const viewer = $('viewer');
let vehicleReady = false;

function modeText(simple, technical) {
  const section = make('div');
  section.append(paragraph(simple));
  if (technical && technical !== simple) {
    const details = make('details');
    details.append(make('summary','Detayları Gör'), paragraph(technical));
    section.append(details);
  }
  return section;
}
function renderTabs() {
  for (const [route, entries] of Object.entries(systems)) {
    $(`${route}-tabs`).replaceChildren(...entries.map(entry => {
      const a = link(entry.label, `#/${route}/${entry.id}`); a.dataset.sub = entry.id; return a;
    }));
  }
}
function updateHeading() {
  const route = routes.find(r => r.id === state.route);
  $('screen-title').textContent = ({overview:'Vaccino stüdyosu',vehicle:'3B Model',mechanical:'Mekanik',electrical:'Elektrik',autonomy:'Yazılım',team:'Yarışmalar',inventory:'Envanter'})[state.route] || route.title;
  $('breadcrumb').textContent = $('screen-title').textContent;
  $('screen-description').textContent = state.route==='overview'?'':route.simple;
  $('footer-context').textContent = `${record.revision} / v${record.uiVersion}`;
  document.title = `${route.label} — Vaccino 26/27`;
}
function closeMenu(returnFocus = false) {
  document.body.classList.remove('menu-open');
  $('menu-toggle').setAttribute('aria-expanded','false');
  $('menu-toggle').setAttribute('aria-label','Menüyü aç');
  $('menu-scrim').hidden = true;
  $('sidebar').inert = true;
  document.querySelector('.app-shell').inert = false;
  if (returnFocus) $('menu-toggle').focus();
}
function toggleMenu() {
  if (document.body.classList.contains('menu-open')) return closeMenu(true);
  $('sidebar').inert = false;
  document.body.classList.add('menu-open');
  $('menu-toggle').setAttribute('aria-expanded','true');
  $('menu-toggle').setAttribute('aria-label','Menüyü kapat');
  $('menu-scrim').hidden = false;
  document.querySelector('.app-shell').inert = true;
  ($('sidebar').querySelector('[aria-current="page"]') || $('sidebar').querySelector('nav a')).focus();
}
$('menu-toggle').onclick = toggleMenu;
$('menu-close').onclick = () => closeMenu(true);
$('menu-scrim').onclick = () => closeMenu(true);
$('sidebar').addEventListener('click',event=>{
  if(event.target.closest('a')) closeMenu(true);
});
document.addEventListener('keydown', event => {
  if (!document.body.classList.contains('menu-open')) return;
  if (event.key === 'Escape') {event.preventDefault();closeMenu(true);}
  if (event.key === 'Tab') {
    const items = [...$('sidebar').querySelectorAll('a, button')].filter(n=>n.getClientRects().length);
    const first=items[0], last=items.at(-1);
    if (event.shiftKey && document.activeElement===first) {event.preventDefault();last.focus();}
    else if (!event.shiftKey && document.activeElement===last) {event.preventDefault();first.focus();}
  }
});
closeMenu();

function diagram(labels, className='principle-flow') {
  const node=make('ol',null,className);
  labels.forEach((label,i)=>{const li=make('li');li.append(make('small',String(i+1).padStart(2,'0')),make('span',label));node.append(li);});
  return node;
}
function systemBrief(route, entry) {
  const target=$(`${route}-brief`); if(!target) return;
  const head=make('div',null,'brief-heading');head.append(make('span','SİSTEMİN İZİ','eyebrow'),make('span','Yerleşim ve çalışma prensibi','muted'));
  const actions=make('div',null,'system-parts');
  entry.parts.forEach(id=>{const info=part(id);const button=make('button',info.label);button.dataset.inspect=id;button.setAttribute('aria-pressed','false');button.onclick=()=>window.vaccino?.inspect(id,button);actions.append(button);});
  const focus=make('button','Sistemi öne çıkar','isolate-button');focus.id='system-isolate';focus.setAttribute('aria-pressed','true');focus.onclick=()=>{
    const enabled=focus.getAttribute('aria-pressed')!=='true';focus.setAttribute('aria-pressed',String(enabled));
    if(enabled&&window.vaccino?.state().focusContext!==entry.focus)window.vaccino?.focusSystem(entry.focus);else window.vaccino?.isolate(enabled);
  };actions.append(focus);
  const explanation=make('div',null,'brief-explanation');
  explanation.append(modeText(part(entry.parts[0]).simple,part(entry.parts[0]).desc));
  const source=make('div',null,'brief-source technical-only');source.append(make('small','KAYNAK & DOĞRULAMA'),paragraph(`${record.source} · ${record.revision}`),paragraph('Gerçek CAD, montaj açıklıkları ve test sonuçları bekleniyor.'));
  explanation.append(source);
  target.replaceChildren(diagram(entry.flow),actions,explanation);
  if (route==='mechanical' && entry.id==='braking') {
    const flow = make('button','Fren akışını göster');
    flow.id='brake-flow';
    flow.setAttribute('aria-pressed','false');
    flow.onclick=()=>flow.setAttribute('aria-pressed', String(window.vaccino?.toggleBrakeFlow() || false));
    actions.append(flow);
    target.append(paragraph('Ön devre: mavi. Arka devre: bakır. Yerleşim ve akış temsilidir. Montaj, hareket açıklığı ve donanım seçimi mühendislik doğrulaması gerektirir.','muted'));
  }
  if(route==='electrical'&&entry.id==='battery'){
    const calc=make('div',null,'calculation-strip technical-only');
    const b=parameters.battery;
    calc.append(make('span','HEDEF PARAMETRELERDEN HESAP','eyebrow'),make('strong',`${format(b.nominalV)} V × ${format(b.capacityAh)} Ah = ${format(b.nominalWh)} Wh`),paragraph(`Nominal enerji hesabıdır; kullanılabilir enerji ölçümü değildir. ${b.series} × ${format(b.cellFullV)} V = ${format(b.fullV)} V tam dolu gerilim varsayımı. Hücre/BMS doğrulaması bekleniyor.`));target.append(calc);
  }
  if(route==='mechanical'&&entry.id==='transmission'){
    const calc=make('p',`Prensip gösterimi: kasnak yarıçapları ${format(parameters.transmission.smallRadiusMm)} / ${format(parameters.transmission.largeRadiusMm)} mm; oran ${format(parameters.transmission.ratio)}. Nihai redüksiyon seçimi değildir.`, 'technical-only muted');target.append(calc);
  }
  if(route==='electrical'){
    const power=make('section',null,'power-diagram');
    const trunk=diagram(['Batarya ve BMS','Koruma ve güç dağıtımı']);
    const branches=make('div',null,'power-branches');
    branches.append(diagram(['Motor sürücüsü','BLDC motor']),diagram(['DC/DC dönüştürücü','Araç bilgisayarı, kontrol ve sensör beslemeleri']));
    power.append(make('h2','Güç dağıtımı'),trunk,branches,paragraph('Akış ve kablaj temsilidir. Koruma elemanları, DC/DC seçimi ve bağlantılar doğrulanacak.','muted'));
    target.append(power);
  }
  if(route==='autonomy') target.append(paragraph('3B sahnede yalnızca ön stereo kamera rezervi gösterilir. Diğer sensörlerin gerçek yerleşimleri henüz modellenmedi.','geometry-note'));
}
function applySceneFocus() {
  if(!vehicleReady) return;
  const entry=systems[state.route]?.find(s=>s.id===state.sub);
  if(entry) window.vaccino?.focusSystem(entry.focus);
  else window.vaccino?.clearFocus(state.route==='overview');
}
function navigate({focusHeading=false}={}) {
  document.dispatchEvent(new Event('vaccino:inspector-close'));
  if(document.body.classList.contains('presentation-active'))document.dispatchEvent(new Event('vaccino:presentation-exit'));
  const raw=location.hash.replace(/^#\/?/,'').split('/');
  const alias={competitions:['team','goals'],sensors:['autonomy','sensors'],files:['team','files'],'vehicle-section':['vehicle']};
  const path=alias[raw[0]]||raw;
  state.route=routes.some(r=>r.id===path[0])?path[0]:'overview';
  const entries=systems[state.route];
  state.sub=entries?(entries.some(s=>s.id===path[1])?path[1]:entries[0].id):state.route==='team'&&path[1]==='files'?'files':state.route==='team'?'goals':'';
  if(state.route==='experience')state.sub=['showroom','workshop','track'].includes(path[1])?path[1]:'showroom';
  document.body.dataset.route=state.route;document.body.dataset.sub=state.sub;
  document.querySelectorAll('[data-screen]').forEach(screen=>{screen.hidden=screen.dataset.screen!==state.route;});
  document.querySelectorAll('.primary-nav a').forEach(a=>{if(a.dataset.route===(['vehicle','mechanical','electrical','autonomy','experience','decisions','tests'].includes(state.route)?'garage':state.route))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  document.querySelectorAll('.subnav a').forEach(a=>{if(a.dataset.sub===state.sub)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  const slot=document.querySelector(`[data-slot="${state.route}"]`);
  if(slot){slot.append(viewer);viewer.hidden=false;viewer.dataset.context=state.route;}
  else viewer.hidden=true;
  if(entries&&(state.route!=='autonomy'||state.sub==='perception')){const entry=entries.find(e=>e.id===state.sub);systemBrief(state.route,entry);}
  $('team-goals').hidden=state.sub==='files';$('files').hidden=state.sub!=='files';
  $('sensors').hidden=state.route!=='autonomy'||state.sub==='perception';
  document.querySelector('[data-slot="autonomy"]').hidden=state.route==='autonomy'&&state.sub!=='perception';
  $('autonomy-brief').hidden=state.sub!=='perception';
  $('autonomy-flow').hidden=state.sub!=='perception';
  const interfaces=state.route==='autonomy'&&state.sub==='interfaces';
  const disclosure=document.querySelector('.interface-disclosure');
  disclosure.classList.toggle('force-visible',interfaces);disclosure.open=interfaces;
  $('sensors').classList.toggle('interfaces-view',interfaces);
  updateHeading();applySceneFocus();closeMenu();
  window.scrollTo({top:0,behavior:'instant'});
  if(focusHeading) (state.route==='overview'?$('menu-toggle'):$('screen-title')).focus({preventScroll:true});
  document.dispatchEvent(new CustomEvent('vaccino:route',{detail:{route:state.route,sub:state.sub}}));
  document.dispatchEvent(new Event('vaccino:resize'));
}
function decisions() {
  const filter=$('decision-filter').value;
  const rows=record.decisions.filter(d=>filter==='Tümü'?d.team!=='Tarihçe':d.team===filter);
  $('decision-list').replaceChildren(...rows.map((d,i)=>{
    const row=make('details',null,'decision-row');if(i===0)row.open=true;
    const summary=make('summary');summary.append(make('span',String(i+1).padStart(2,'0'),'row-number'),make('span',d.title,'row-title'),make('span',d.team,'row-team'),make('span',d.status,'badge'),make('span','+','expand-symbol'));
    const body=make('div',null,'decision-body');body.append(modeText(d.simple,d.reason),make('h4','Sıradaki doğrulama'),modeText(d.nextSimple||d.next,d.next),make('small',`${d.date} · ${d.source}`,'technical-only'));
    row.append(summary,body);return row;
  }));
}
function table(id,sheet,rows) {
  const keys=Object.keys(sheet.rows[3]);const head=make('thead'), tr=make('tr');
  keys.forEach(k=>{const th=make('th',sheet.rows[3][k]);th.scope='col';tr.append(th);});head.append(tr);
  const body=make('tbody');rows.forEach(row=>{const tr=make('tr');keys.forEach(k=>{const td=make('td');if(k==='L'&&row[k]?.startsWith('https://')){const a=link('Üretici referansı ↗',row[k]);a.target='_blank';a.rel='noopener noreferrer';td.append(a);}else td.textContent=row[k]||'—';tr.append(td);});body.append(tr);});$(id).replaceChildren(head,body);
}
function sensors() {
  const sheet=record.inventory[0], query=$('sensor-search').value.toLocaleLowerCase('tr'), stage=$('sensor-filter').value;
  const rows=sheet.rows.slice(4).filter(r=>(stage==='Tümü'||r.B===stage)&&Object.values(r).join(' ').toLocaleLowerCase('tr').includes(query));
  table('sensor-table',sheet,rows);$('sensor-count').textContent=`${rows.length} / ${sheet.rows.length-4} kalem`;
  $('sensor-summary').replaceChildren(...rows.map(row=>{
    const item=make('details'), summary=make('summary');summary.append(make('span',row.A,'row-number'),make('b',row.C),make('span',row.J,'badge'));
    const body=make('div');body.append(paragraph(row.D),paragraph(row.I),make('small',`${row.B} · ${row.K}`));item.append(summary,body);return item;
  }));
  if(!rows.length)$('sensor-summary').append(paragraph('Bu aramayla eşleşen sensör bulunamadı.','empty-state'));
}
function tests() {
  $('test-total').textContent=String(record.tests.length).padStart(2,'0');
  $('test-list').replaceChildren(...record.tests.map((test,i)=>{
    const node=make('details',null,'test-step');const summary=make('summary');
    const title=make('span',null,'test-step-title');title.append(make('small',test.team.toLocaleUpperCase('tr')),make('b',test.title));
    summary.append(make('span',String(i+1).padStart(2,'0'),'step-index'),title,make('span',test.status,'badge'),make('span','+','expand-symbol'));
    const content=make('div',null,'test-method');content.append(paragraph(test.method),make('span',test.result,'result-pending'));node.append(summary,content);return node;
  }));
}
function filesAndTeam() {
  $('file-list').replaceChildren(...record.presentation.files.map(file=>{
    const a=link('',file.path);a.download='';const name=make('span');name.append(make('b',file.name),make('small',file.note));a.append(make('span',file.type,'file-type'),name,make('span','↗','file-arrow'));return a;
  }));
  const rules='https://www.shellecomarathon.com/about/global-rules.html';
  const competitions=[
    ['TEKNOFEST','Robotaksi','Özgün Araç Yarışması','Özgün araçlarda otonom sürüşü sınamak.','Vaccino V2 üzerinde algılama, karar ve araç kontrolünü birleştirmek.','Kamera, araç bilgisayarı, direksiyon ve fren.','https://www.teknofest.org/tr/yarismalar/robotaksi-binek-otonom-arac-yarismasi/'],
    ['Shell Eco-marathon','Autonomous Driving Competition','','Kapalı parkurda otonom sürüş görevlerini tamamlamak.','Parkur takibi ve araç kontrolünü demo ortamından araç testine taşımak.','Algılama, şerit takibi ve kontrol.',rules],
    ['Shell Eco-marathon','Mileage Challenge','','Pist üzerinde enerji verimliliğini karşılaştırmak.','Aktarma ve enerji tüketimi varsayımlarını ölçümle sınamak.','BLDC motor, kayış-kasnak, batarya ve enerji modeli.',rules]
  ];
  const organizerLogos={'TEKNOFEST':'teknofest-logo.png','Shell Eco-marathon':'shell-logo.png'};
  $('competition-record').replaceChildren(...competitions.map(([organizer,title,category,purpose,goal,systems,url])=>{
    const detail=make('details'), summary=make('summary');
    const heading=make('div');
    heading.append(make('h2',title));
    if(category) heading.append(make('p',category));
    const identity=make('span',null,'competition-brand');
    identity.textContent=organizer;
    const logo=make('img');
    logo.alt=organizer;
    logo.addEventListener('load',()=>identity.replaceChildren(logo),{once:true});
    logo.src=`assets/branding/${organizerLogos[organizer]}`;
    summary.append(identity,heading);
    const body=make('div',null,'competition-detail');
    const facts=make('dl');
    for(const [label,value] of [['Amaç',purpose],['Vaccino’nun hedefi',goal],['Temel sistemler',systems],['Hazırlık durumu','Tasarım ve demo çalışmaları mevcut. Başvuru, kabul ve teknik uygunluk doğrulanmayı bekliyor.']]){
      facts.append(make('dt',label),make('dd',value));
    }
    body.append(facts,link('Resmî yarışma gereksinimleri',url,'text-link'));
    detail.append(summary,body);
    return detail;
  }));
}
document.addEventListener('vaccino:part',event=>{
  document.querySelectorAll('[data-inspect]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.inspect===event.detail)));
});
$('decision-filter').onchange=decisions;$('sensor-search').oninput=sensors;$('sensor-filter').onchange=sensors;
renderTabs();decisions();sensors();tests();filesAndTeam();
table('interface-table',record.inventory[1],record.inventory[1].rows.slice(4));$('interface-count').textContent=`${record.inventory[1].rows.length-4} arayüz`;
const interfaceSummary=make('div',null,'sensor-list simple-only');interfaceSummary.id='interface-summary';
for(const row of record.inventory[1].rows.slice(4)){
  const item=make('details'),summary=make('summary');summary.append(make('span',row.A,'row-number'),make('b',record.presentation.interfaceSummaries[row.A]||row.B));
  const body=make('div');body.append(paragraph(row.C),paragraph(row.F));item.append(summary,body);interfaceSummary.append(item);
}
const interfaceSection=document.querySelector('.interface-disclosure');interfaceSection.insertBefore(interfaceSummary,interfaceSection.querySelector('p'));

$('autonomy-flow').append(diagram(['Kamera ve sensörler','Algılama ve şerit takibi','Karar','Araç kontrolü','Gerçek araç entegrasyonu']),link('2B simülasyon ve 3B pist','#/experience/track','text-link'));
navigate();
window.addEventListener('hashchange',()=>navigate({focusHeading:true}));
document.body.dataset.data='ready';
const logo=loadBrandLogo();
const finishSeasonSetup=initializeSeason(logo,toggleMenu);
await import('./vehicle.js');vehicleReady=!!window.vaccino;applySceneFocus();
const {initializePresentation}=await import('./presentation.js');initializePresentation();
const {initializeExperienceUI}=await import('./experience-ui.js');initializeExperienceUI();
const brandLogo=await logo;
if(brandLogo){
  const presentationBrand=document.querySelector('.presentation-brand');
  presentationBrand?.prepend(brandLogo.cloneNode());
}
await finishSeasonSetup();
document.body.dataset.app='ready';
document.body.dataset.readyMs=String(performance.now());
