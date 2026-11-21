import {initializeDriver} from './driver.js';

/* Driver is a separate scene; existing vehicle JS and CAD data are unchanged. */
function ready() {
 initializeDriver();
 const hero=document.querySelector('.studio-home');
 const canvas=document.getElementById('vehicle');
 const restore=document.getElementById('v-hero-restore');
 let start=null;
 if(hero&&canvas){
   canvas.addEventListener('pointerdown',event=>{
     if(document.body.dataset.route!=='overview')return;
     start={x:event.clientX,y:event.clientY};
   });
   canvas.addEventListener('pointermove',event=>{
     if(!start||document.body.dataset.route!=='overview')return;
     if(Math.hypot(event.clientX-start.x,event.clientY-start.y)>8){
       hero.classList.add('v-inspecting');start=null;
     }
   });
   canvas.addEventListener('pointerup',()=>{start=null});
   canvas.addEventListener('pointercancel',()=>{start=null});
 }
 restore?.addEventListener('click',()=>hero.classList.remove('v-inspecting'));
 document.addEventListener('vaccino:route',event=>{
   if(event.detail?.route!=='overview')hero?.classList.remove('v-inspecting');
 });
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
