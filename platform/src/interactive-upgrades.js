import {initializeDriver} from './driver.js';

/* Driver is a separate scene; existing vehicle JS and CAD data are unchanged. */
function ready() {
 initializeDriver();
 const hero=document.querySelector('.studio-home');
 const canvas=document.getElementById('vehicle');
 const restore=document.getElementById('v-hero-restore');
 const copy=hero.querySelector('.v-hero-content');
 function setInspecting(active){
   if(restore.hidden===!active)return;
   restore.hidden=!active;
   copy.inert=active;
   hero.classList.toggle('v-inspecting',active);
 }
 function restoreIntro(){
   setInspecting(false);
   window.vaccino?.resetHomeView(matchMedia('(prefers-reduced-motion: reduce)').matches?0:360);
   canvas.focus({preventScroll:true});
 }
 function syncRoute(){
   if(document.body.dataset.route==='overview')canvas.setAttribute('aria-describedby','v-hero-controls');
   else{
     canvas.removeAttribute('aria-describedby');
     setInspecting(false);
   }
 }
 canvas.addEventListener('vaccino:home-inspect',()=>setInspecting(true));
 canvas.addEventListener('keydown',event=>{
   if(event.key==='Escape'&&!restore.hidden&&!document.body.classList.contains('presentation-active')){
     event.preventDefault();
     restoreIntro();
   }
 });
 restore.addEventListener('click',restoreIntro);
 document.addEventListener('vaccino:route',syncRoute);
 syncRoute();
 // Nextion UI is a visual prototype, not a hardware-connected display.
 const dialog=document.getElementById('nextion-dialog');
 const close=document.getElementById('nextion-close');
 const screen=document.getElementById('nextion-screen');
 const tabs=Array.from(document.querySelectorAll('[data-nextion-tab]'));
 const view={
   home:'<div class="nextion-speed"><span>HIZ</span><strong>00</strong><small>km/h</small></div><div class="nextion-metrics"><div><small>BATARYA</small><strong>82%</strong><div class="nextion-bar"><i></i></div></div><div><small>MOD</small><strong>ECO</strong></div><div><small>SICAKLIK</small><strong>28°C</strong></div></div>',
   energy:'<div class="nextion-speed"><span>ENERJİ</span><strong>82</strong><small>%</small></div><div class="nextion-metrics"><div><small>GERİLİM</small><strong>48.0 V</strong></div><div><small>AKIM</small><strong>0.0 A</strong></div><div><small>MOD</small><strong>ECO</strong></div></div>',
   diagnostics:'<div class="nextion-diagnostics"><strong>STATUS / DEMO</strong><p>Kontrolcü: Beklemede</p><p>Fren: Simülasyon</p><p>Sensörler: Bağlı değil</p><p>Telemetri: Örnek değerler</p></div>'
 };
 const open=()=>{
   if(!dialog?.open){dialog?.showModal();}
 };
 close?.addEventListener('click',()=>dialog.close());
 dialog?.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
 document.querySelectorAll('[data-open-nextion]').forEach(button=>button.addEventListener('click',open));
 tabs.forEach(button=>button.addEventListener('click',()=>{
   for(const b of tabs)b.setAttribute('aria-pressed',String(b===button));
   screen.innerHTML=view[button.dataset.nextionTab]||view.home;
 }));
 document.addEventListener('vaccino:part',event=>{
   if(event.detail==='hmi'&&['vehicle','autonomy','electrical','mechanical','experience'].includes(document.body.dataset.route))open();
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});
else ready();
