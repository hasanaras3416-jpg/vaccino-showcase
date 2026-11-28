import {record, parameters, format, state, part, inspectionSystem, activeDrivetrain} from './store.js';
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
const {mechanical, electrical} = record.presentation.systems;
const systems = {mechanical, electrical};
const software = record.presentation.software;
const drivetrainData=record.presentation.drivetrain;
if(!drivetrainData?.variants?.central||!drivetrainData?.variants?.hub){
  throw new Error('VACCİNO veri sürümü uyuşmuyor: aktarma mimarileri bulunamadı. Sayfayı yenileyin.');
}
// All route data must come from the same revision as the JavaScript modules.
// A stale project.json previously prevented any navigation from initializing.
for (const [section, entries] of Object.entries({...systems, autonomy: software})) {
  if (!Array.isArray(entries)) {
    throw new Error(`VACCİNO veri sürümü uyuşmuyor: ${section} alt menüleri bulunamadı. Sayfayı önbelleği temizleyerek yenileyin.`);
  }
}
const viewer = $('viewer');
let inspectPart, vehicleApi;

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
  for (const [route, entries] of Object.entries({...systems,autonomy:software})) {
    $(`${route}-tabs`).replaceChildren(...entries.map(entry => {
      const a = link(entry.label, `#/${route}/${entry.id}`); a.dataset.sub = entry.id; return a;
    }));
  }
}
const screenInfo={
  overview:['Genel',''],vehicle:['Araç','Parçaya dokun, ayrıntısını gör.'],systems:['Sistemler',''],
  races:['Yarışlar',''],inventory:['Envanter','Arama ve filtreyle tüm donanım kayıtları.'],support:['Takım ve Destek',''],
  mechanical:['Mekanik 3B','Mekanik sistemleri 3B yerleşimde incele.'],electrical:['Elektrik 3B','Enerji ve kontrolü 3B yerleşimde incele.'],
  autonomy:['Yazılım',''],driver:['Sürücü Stüdyosu','Pilot ekipmanı · görsel konsept'],decisions:['Mühendislik kararları',''],
  tests:['Test planı',''],experience:['Araç ortamı','']
};
function updateHeading() {
  const [title,description]=screenInfo[state.route]||['VACCİNO',''];
  $('screen-title').textContent=title;
  $('breadcrumb').textContent=title;
  $('screen-description').textContent=description;
  $('footer-context').textContent=`${record.revision} / v${record.uiVersion}`;
  document.title=state.route==='overview'?'VACCİNO — Otonom elektrikli yarış aracı':`${title} — VACCİNO`;
}
function closeMenu(){}
document.querySelector('.skip-link').addEventListener('click',event=>{
  event.preventDefault();
  const headingId={autonomy:'software-title',driver:'driver-title'}[state.route]??'screen-title';
  const heading=state.route==='overview'?$('home-title'):$(headingId);
  heading.tabIndex=-1;
  heading.focus({preventScroll:true});
  heading.scrollIntoView({block:'start',behavior:'instant'});
});
function diagram(labels, className='principle-flow') {
  const node=make('ol',null,className);
  labels.forEach((label,i)=>{const li=make('li');li.append(make('small',String(i+1).padStart(2,'0')),make('span',label));node.append(li);});
  return node;
}
function disclosure(label,content){
  const detail=make('details',null,'engineering-disclosure');
  detail.append(make('summary',label),content);
  return detail;
}
function partActions(ids){
  const actions=make('div',null,'system-parts');
  for(const id of ids){
    const button=make('button',part(id).label);
    button.dataset.inspect=id;
    button.setAttribute('aria-pressed','false');
    button.onclick=()=>inspectPart?.(id,button);
    actions.append(button);
  }
  return actions;
}
function evaluation(label,items){
  const block=make('div');
  const list=make('ul');
  for(const item of items)list.append(make('li',item));
  block.append(make('h3',label),list);
  return block;
}
function isolationButton(){
  const button=make('button','Sistemi öne çıkar','isolate-button');
  button.id='system-isolate';
  button.disabled=document.body.dataset.webgl==='failed';
  button.setAttribute('aria-pressed',String(vehicleApi?.state().isolation??true));
  button.onclick=()=>{
    const enabled=button.getAttribute('aria-pressed')!=='true';
    button.setAttribute('aria-pressed',String(enabled));
    vehicleApi?.isolate(enabled);
  };
  return button;
}
function drivetrainBrief(variant){
  const title=make('h2',variant.label);title.id='mechanical-title';
  const headline=make('header',null,'drivetrain-headline');
  headline.append(paragraph(drivetrainData.status,'drivetrain-status'),title,paragraph(variant.summary,'system-lead'));
  const evaluationSummary=make('div',null,'drivetrain-evaluation');
  evaluationSummary.append(evaluation('Potansiyel avantajlar',variant.advantages.slice(0,2)),
    evaluation('Değerlendirme başlıkları',variant.considerations.slice(0,2)));
  const additional=make('div',null,'drivetrain-evaluation');
  additional.append(evaluation('Diğer olası avantajlar',variant.advantages.slice(2)),
    evaluation('Diğer değerlendirmeler',variant.considerations.slice(2)));
  const compare=make('dl',null,'drivetrain-comparison');
  for(const [key,label] of drivetrainData.topics){
    const row=make('div');
    row.append(make('dt',label));
    for(const item of Object.values(drivetrainData.variants)){
      const value=make('dd');
      value.append(make('b',item.label),paragraph(item.comparison[key]));
      row.append(value);
    }
    compare.append(row);
  }
  const actions=partActions(variant.parts);
  actions.classList.add('drivetrain-parts');
  const notes=make('div',null,'brief-explanation');
  notes.append(paragraph(drivetrainData.transitionNote),
    paragraph('Görsel yerleşimler değerlendirme aşamasında. Kütle merkezi, fiziksel çakışmalar ve araç performansı ayrıca doğrulanacak.'),isolationButton());
  $('mechanical-brief').replaceChildren(headline,actions,evaluationSummary,
    disclosure('Tüm değerlendirme başlıkları',additional),
    disclosure('Mühendislik karşılaştırması',compare),
    disclosure('Görsel kapsam',notes));
}
function syncDrivetrainPanel(){
  const variant=activeDrivetrain();
  const pending=vehicleApi?.drivetrainTransitioning()??false;
  // Hub motor seçeneği 27 Kasım 2026'da bırakıldı (eski plan); karşılaştırma seçicisi gösterilmez.
  $('drivetrain-selector').hidden=true;
  $('drivetrain-options').querySelectorAll('input').forEach(input=>{
    input.checked=input.value===state.drivetrain;
    input.disabled=!inspectPart;
  });
  if(variant){
    $('mechanical-brief').querySelectorAll('[data-inspect]').forEach(button=>{button.disabled=pending;});
  }
}
for(const [id,variant] of Object.entries(drivetrainData.variants)){
  const label=make('label');
  const radio=make('input');
  radio.type='radio';radio.name='drivetrain';radio.value=id;radio.checked=id===state.drivetrain;
  radio.addEventListener('change',()=>{
    if(!inspectPart||!radio.checked||!activeDrivetrain())return;
    state.drivetrain=id;
    drivetrainBrief(activeDrivetrain());
    vehicleApi?.applyDrivetrain({selectPart:true});
    if(!vehicleApi)document.dispatchEvent(new Event('vaccino:drivetrain-change'));
    syncViewerControls({closeSettings:false});
    syncDrivetrainPanel();
  });
  label.append(radio,make('span',variant.label));
  $('drivetrain-options').append(label);
}
document.addEventListener('vaccino:drivetrain-settled',syncDrivetrainPanel);

function systemBrief(route, entry) {
  const target=$(`${route}-brief`);
  const title=make('h2',entry.label);title.id=`${route}-title`;
  const actions=partActions(entry.parts);

  const focus=isolationButton();
  const explanation=make('div',null,'brief-explanation');
  const source=make('div',null,'brief-source technical-only');
  source.append(make('small','KAYNAK VE DOĞRULAMA'),paragraph(`${record.source} · ${record.revision}`),paragraph('Gerçek CAD, montaj açıklıkları ve test sonuçları bekleniyor.'));
  explanation.append(paragraph(part(entry.parts[0]).desc),diagram(entry.flow),source,focus);

  if(entry.id==='braking'){
    const flow=make('button','Fren akışını göster');
    flow.id='brake-flow';
    flow.setAttribute('aria-pressed','false');
    flow.onclick=()=>flow.setAttribute('aria-pressed',String(vehicleApi?.toggleBrakeFlow()||false));
    actions.append(flow);
    explanation.append(paragraph('Ön devre mavi, arka devre bakır renkle gösterilir. Yerleşim ve akış temsilidir. Montaj, hareket açıklığı ve donanım seçimi mühendislik doğrulaması gerektirir.'));
  }
  target.replaceChildren(title,paragraph(entry.summary,'system-lead'),actions,
    disclosure(route==='electrical'?'Teknik detaylar':'Çalışma prensibi ve kaynaklar',explanation));
  if(entry.id==='battery'){
    const calc=make('div',null,'calculation-strip');
    const b=parameters.battery;
    calc.append(make('span','HEDEF PARAMETRELERDEN HESAP','eyebrow'),make('strong',`${format(b.nominalV)} V × ${format(b.capacityAh)} Ah = ${format(b.nominalWh)} Wh`),paragraph(`Nominal enerji hesabıdır; kullanılabilir enerji ölçümü değildir. ${b.series} × ${format(b.cellFullV)} V = ${format(b.fullV)} V tam dolu gerilim varsayımı. Hücre/BMS doğrulaması bekleniyor.`));
    target.append(disclosure('Hesaplamalar',calc));
  }
  if(route==='electrical'){
    const power=make('div',null,'power-diagram');
    const trunk=diagram(['Batarya ve BMS','Koruma ve güç dağıtımı']);
    const branches=make('div',null,'power-branches');
    branches.append(diagram(['Motor sürücüsü','BLDC motor']),diagram(['DC/DC dönüştürücü','Araç bilgisayarı, kontrol ve sensör beslemeleri']));
    power.append(trunk,branches,paragraph('Akış ve kablaj temsilidir. Koruma elemanları, DC/DC seçimi ve bağlantılar doğrulanacak.','muted'));
    target.append(disclosure('Güç dağıtımı',power));
  }
}
function applySceneFocus() {
  const api=vehicleApi;
  if(!api){
    if(document.body.dataset.webgl==='failed'){
      for(const id of ['system-isolate','brake-flow']) if($(id)) $(id).disabled=true;
    }
    return;
  }
  const entry=inspectionSystem();
  if(entry) api.focusSystem(entry.focus,entry.parts);
  else if(state.route==='vehicle')api.resetVehicleView();
  else api.clearFocus(state.route==='overview');
}
function mediaFrame(items, className=''){
  const frame=make('div',null,`engineering-media ${className}`);
  if(!items.length){
    frame.classList.add('media-empty');
    frame.append(paragraph('İçerik eklenecek'));
  }
  for(const item of items){
    const figure=make('figure');
    const media=make(item.type==='video'?'video':'img');
    media.src=item.src;
    if(item.type==='video'){
      media.controls=true;
      media.preload='metadata';
      media.setAttribute('aria-label',item.alt);
      if(item.captions){
        const track=make('track');
        track.kind='captions';track.src=item.captions;track.srclang='tr';track.label='Türkçe';
        media.append(track);
      }
    }else{
      media.alt=item.alt;media.loading='lazy';
    }
    figure.append(media);
    if(item.caption) figure.append(make('figcaption',item.caption));
    frame.append(figure);
  }
  return frame;
}
function renderSoftware(entry){
  const title=make('header',null,'software-heading');
  const heading=make('h2',entry.label);heading.id='software-title';
  title.append(make('p','Yazılım','eyebrow'),heading,paragraph(entry.description));
  const notes=make('section',null,'engineering-notes');
  const list=make('dl');
  for(const [key,label] of [['purpose','Amaç'],['method','Yöntem'],['result','Sonuç'],['next','Sıradaki adım']]){
    const row=make('div');
    row.append(make('dt',label),make('dd',entry.notes[key]));
    list.append(row);
  }
  notes.append(make('h3','Mühendislik notları'),list);
  if(entry.id==='simulation') notes.append(link('2B simülasyon ve 3B pist','#/experience/track','text-link'));
  $('software-showcase').replaceChildren(title,mediaFrame(entry.media,'software-media'),notes);
}
const settings=$('viewer-settings');
document.addEventListener('click',event=>{
  if(settings.open&&!settings.contains(event.target))settings.open=false;
});
settings.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&settings.open){
    event.preventDefault();
    event.stopPropagation();
    settings.open=false;
    settings.querySelector('summary').focus();
  }
});
function syncViewerControls({closeSettings=true}={}){
  const scoped=!!inspectionSystem();
  const transmission=state.route==='mechanical'&&state.sub==='transmission';
  const central=transmission&&state.drivetrain==='central';
  $('engage').hidden=!central;
  $('play').hidden=scoped&&!transmission;
  $('part-open').hidden=scoped;
  viewer.querySelectorAll('[data-general-view]').forEach(button=>{button.hidden=scoped;});
  viewer.querySelectorAll('[data-transmission-view]').forEach(button=>{button.hidden=scoped&&!central;});
  if(closeSettings)settings.open=false;
}
const knownRoutes=new Set(['overview','vehicle','systems','races','inventory','support','driver','mechanical','electrical','autonomy','decisions','tests','experience']);
const navParent={mechanical:'systems',electrical:'systems',autonomy:'systems',driver:'systems',decisions:'systems',tests:'systems',experience:'vehicle'};
function resolveHash(hash) {
  const raw=hash.replace(/^#\/?/,'').split('/');
  const alias={competitions:['races'],team:['races'],files:['races'],garage:['systems'],sensors:['autonomy','sensors'],'vehicle-section':['vehicle'],
    genel:['overview'],arac:['vehicle'],sistemler:['systems',...raw.slice(1)],yarislar:['races',...raw.slice(1)],envanter:['inventory'],destek:['support'],takim:['support']};
  return alias[raw[0]]||raw;
}
const routeOf=path=>knownRoutes.has(path[0])?path[0]:'overview';
// Menü sırası geçiş yönünü belirler: aşağıdaki ekran ileri, yukarıdaki geri.
const navOrder=['overview','vehicle','systems','races','inventory','support'];
const navIndex=route=>navOrder.indexOf(navParent[route]||route);
// 3B sahnenin yuvası olan ekranlar; iki ekranda da varsa sahne tek öğe olarak taşınır.
const sceneRoutes=new Set([...document.querySelectorAll('[data-slot]')].map(slot=>slot.dataset.slot));
function placeNavIndicator() {
  const indicator=document.querySelector('.nav-indicator');
  const active=document.querySelector('.primary-nav a[aria-current=page]');
  if(!indicator)return;
  if(!active){indicator.style.opacity='0';return;}
  indicator.style.opacity='1';
  const horizontal=getComputedStyle(active.parentElement).flexDirection==='row';
  indicator.style.setProperty('--nav-x',horizontal?`${active.offsetLeft+(active.offsetWidth-indicator.offsetWidth)/2}px`:'0px');
  indicator.style.setProperty('--nav-y',horizontal?'0px':`${active.offsetTop+(active.offsetHeight-indicator.offsetHeight)/2}px`);
  requestAnimationFrame(()=>{indicator.dataset.ready='';});
}
new ResizeObserver(()=>{const i=document.querySelector('.nav-indicator');if(i)delete i.dataset.ready;placeNavIndicator();}).observe(document.querySelector('.primary-nav'));
// Kart ve listeler sırayla girer: en çok 6 öğe, 40 ms aralık; gerisi altıncıyla birlikte.
function staggerIn(root) {
  if(!root)return;
  root.querySelectorAll('.card-grid, .part-list, .race-switch, .tag-list, .talk-list').forEach(list=>{
    if(list.closest('[hidden]'))return;
    [...list.children].forEach((item,i)=>item.style.setProperty('--i',String(Math.min(i,5))));
    list.classList.remove('m-stagger');void list.offsetWidth;list.classList.add('m-stagger');
  });
}
function navigate({focusHeading=false}={}) {
  document.dispatchEvent(new Event('vaccino:inspector-close'));
  if(document.body.classList.contains('presentation-active'))document.dispatchEvent(new Event('vaccino:presentation-exit'));
  const path=resolveHash(location.hash);
  state.route=routeOf(path);
  const entries=state.route==='autonomy'?software:systems[state.route];
  const legacySoftware={perception:'vision',sensors:'vision',interfaces:'vision'};
  const requested=state.route==='autonomy'?(legacySoftware[path[1]]??path[1]):path[1];
  state.sub=entries?(entries.some(s=>s.id===requested)?requested:entries[0].id):['systems','races'].includes(state.route)?path.slice(1).join('/'):'';
  if(state.route==='experience')state.sub=['showroom','workshop','track'].includes(path[1])?path[1]:'showroom';
  if(state.route!=='mechanical'||state.sub!=='transmission')state.drivetrain='central';
  document.body.dataset.route=state.route;document.body.dataset.sub=state.sub;
  document.querySelectorAll('[data-screen]').forEach(screen=>{screen.hidden=screen.dataset.screen!==state.route;});
  const navRoute=navParent[state.route]||state.route;
  document.querySelectorAll('.primary-nav a').forEach(a=>{if(a.dataset.route===navRoute)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  placeNavIndicator();
  document.querySelectorAll('.subnav a').forEach(a=>{if(a.closest('[data-screen]')?.dataset.screen===state.route&&a.dataset.sub===state.sub)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  const slot=document.querySelector(`[data-slot="${state.route}"]`);
  if(slot){slot.insertBefore(viewer,state.route==='overview'?$('v-hero-restore'):null);viewer.hidden=false;viewer.dataset.context=state.route;}
  else viewer.hidden=true;
  if(entries){
    const entry=entries.find(item=>item.id===state.sub);
    const variant=activeDrivetrain();
    if(state.route==='autonomy')renderSoftware(entry);
    else if(variant)drivetrainBrief(variant);
    else systemBrief(state.route,entry);
  }
  const softwareRoute=state.route==='autonomy';
  $('software-resources').open=softwareRoute&&['sensors','interfaces'].includes(path[1]);
  document.querySelector('.interface-disclosure').open=softwareRoute&&path[1]==='interfaces';
  vehicleApi?.applyDrivetrain({immediate:true});
  syncViewerControls();syncDrivetrainPanel();
  updateHeading();applySceneFocus();closeMenu();
  window.scrollTo({top:0,behavior:'instant'});
  if(focusHeading){
    const tab=document.querySelector('[data-screen]:not([hidden]) .subnav a[aria-current]');
    const heading=$(state.route==='driver'?'driver-title':'screen-title');
    (state.route==='overview'?document.getElementById('home-title'):tab??heading).focus({preventScroll:true});
  }
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
document.addEventListener('vaccino:part',event=>{
  document.querySelectorAll('[data-inspect]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.inspect===event.detail)));
});
$('decision-filter').onchange=decisions;$('sensor-search').oninput=sensors;$('sensor-filter').onchange=sensors;
renderTabs();decisions();sensors();tests();
table('interface-table',record.inventory[1],record.inventory[1].rows.slice(4));$('interface-count').textContent=`${record.inventory[1].rows.length-4} arayüz`;
const interfaceSummary=make('div',null,'sensor-list simple-only');interfaceSummary.id='interface-summary';
for(const row of record.inventory[1].rows.slice(4)){
  const item=make('details'),summary=make('summary');summary.append(make('span',row.A,'row-number'),make('b',record.presentation.interfaceSummaries[row.A]||row.B));
  const body=make('div');body.append(paragraph(row.C),paragraph(row.F));item.append(summary,body);interfaceSummary.append(item);
}
const interfaceSection=document.querySelector('.interface-disclosure');interfaceSection.insertBefore(interfaceSummary,interfaceSection.querySelector('p'));

navigate();
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
let lastRoute=state.route;
const root=document.documentElement;
window.addEventListener('hashchange',()=>{
  const before=lastRoute;
  const next=routeOf(resolveHash(location.hash));
  const run=()=>{navigate({focusHeading:true});lastRoute=state.route;if(next!==before&&!reducedMotion.matches)staggerIn(document.querySelector('[data-screen]:not([hidden])'));};
  if(next===before||document.body.classList.contains('presentation-active')){run();return;}
  root.dataset.dir=navIndex(next)>=navIndex(before)?'forward':'back';
  if(sceneRoutes.has(next)&&sceneRoutes.has(before))root.dataset.shared='';else delete root.dataset.shared;
  // Ekran değişirken 3B render döngüleri durur; yeni ekran görününce yeniden başlar.
  root.dataset.transition='screen';
  const done=()=>{delete root.dataset.transition;delete root.dataset.shared;document.dispatchEvent(new Event('vaccino:resize'));};
  if(document.startViewTransition){
    const transition=document.startViewTransition(run);
    transition.finished.finally(done);
  }else{
    run();
    const ms=parseFloat(getComputedStyle(root).getPropertyValue('--dur-screen'))||320;
    setTimeout(done,ms);
  }
});
document.body.dataset.data='ready';
const logo=loadBrandLogo();
const finishSeasonSetup=initializeSeason(logo);
const vehicle=await import('./vehicle.js');
if(!Object.hasOwn(vehicle,'vehicleApi')||
  (document.body.dataset.webgl==='ready'&&
    (typeof vehicle.vehicleApi?.applyDrivetrain!=='function'||typeof vehicle.vehicleApi?.drivetrainTransitioning!=='function'))){
  throw new Error(`VACCİNO 3B görüntüleyici sürümü uyuşmuyor: ${import.meta.url}`);
}
({inspect:inspectPart,vehicleApi}=vehicle);
vehicleApi?.applyDrivetrain({immediate:true});
syncDrivetrainPanel();
applySceneFocus();
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
