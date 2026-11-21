import {experienceState,simulation,setEnvironment,startExperienceClock} from './animation-state.js';
import {state,parameters} from './store.js';
import {initializeSimulationUI} from './simulation-ui.js';
import {initializeInventoryUI} from './inventory-ui.js';
export function initializeExperienceUI(){
 const api=window.vaccino,$=id=>document.getElementById(id);
 const simUI=initializeSimulationUI($('simulation-panel'));initializeInventoryUI($('engineering-inventory'));
 const labels={showroom:'SHOWROOM',workshop:'ATÖLYE',track:'PİST / DEMO'};
 function route(){
  const wasActive=experienceState.active,active=['experience','overview'].includes(state.route);experienceState.active=active;
  if(!active&&wasActive){simulation.pause();api?.setShell('hidden',{immediate:true});api?.setAnimating(false);}
  else if(active){
   const env=state.route==='overview'?'showroom':state.sub;
   if(experienceState.environment!==env||!api?.experienceState().active){setEnvironment(env);}
   if(state.route==='experience')document.getElementById('reset').click();
   api?.setShell('hidden',{immediate:true});
  }
  document.querySelectorAll('[data-environment]').forEach(a=>a.setAttribute('aria-current',a.dataset.environment===experienceState.environment?'page':'false'));
  $('workshop-controls').hidden=experienceState.environment!=='workshop';$('track-controls').hidden=experienceState.environment!=='track';$('simulation-panel').hidden=experienceState.environment!=='track';
  $('experience-limit').textContent=experienceState.environment==='workshop'?'Lift ve destekler görsel konsepttir. Kaldırma noktası ve taşıma kapasitesi doğrulanmadı.':experienceState.environment==='track'?'DEMO PARKUR · gerçek pist değildir. Boyuna model tahmini; CAN veya ölçülmüş telemetri yok.':'Şasi ve bileşen yerleşimleri temsilidir. Gerçek CAD ve hareket açıklıkları doğrulanmadı.';
  $('lift-toggle').setAttribute('aria-pressed',String(experienceState.liftRaised));$('lift-toggle').textContent=experienceState.liftRaised?'Lifti indir':'Lifti Kaldır';
  updateView();status();
 }
 function updateView(){
  const track=experienceState.environment==='track';document.querySelector('[data-slot="experience"]').hidden=track&&experienceState.view==='2d';
  document.querySelectorAll('[data-track-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.trackView===experienceState.view)));
  $('sim-map-wrap').hidden=!track||experienceState.view!=='2d';simUI.update();document.dispatchEvent(new Event('vaccino:resize'));
 }
 $('lift-toggle').onclick=()=>{experienceState.liftRaised=!experienceState.liftRaised;$('lift-toggle').setAttribute('aria-pressed',String(experienceState.liftRaised));$('lift-toggle').textContent=experienceState.liftRaised?'Lifti indir':'Lifti Kaldır';};
 document.querySelectorAll('[data-workshop-focus]').forEach(b=>b.onclick=()=>{api?.setShell('hidden',{immediate:true});if(b.dataset.workshopFocus==='under'){experienceState.liftRaised=true;$('lift-toggle').textContent='Lifti indir';$('lift-toggle').setAttribute('aria-pressed','true');api?.moveCamera({az:-.9,el:-.16,rad:3.8,target:[0,.25,0]});}else api?.focusSystem(b.dataset.workshopFocus);});
 document.querySelectorAll('[data-track-view]').forEach(b=>b.onclick=()=>{experienceState.view=b.dataset.trackView;updateView();});
 $('track-camera').onchange=event=>{experienceState.camera=event.target.value;document.dispatchEvent(new Event('vaccino:resize'));};
 function status(){if(state.route!=='experience')return;const s=simulation.snapshot(),core=api?.state(),track=experienceState.active&&experienceState.environment==='track';
  $('vehicle-status-mode').textContent=labels[experienceState.environment]+' · '+(track?'SİMÜLASYON':'GÖRSEL DEMO')+' · DONANIM BAĞLI DEĞİL';
  $('status-speed').textContent=(track?s.speed*3.6:0).toLocaleString('tr-TR',{maximumFractionDigits:1})+' km/sa';$('status-drive').textContent=core?.engaged===false?'Ayrık':'Bağlı';
  $('status-motor').textContent=track?(s.powerW>0&&core?.engaged!==false?'Modelde güç veriliyor':'Modelde tork yok'):(core?.playing?'Prensip animasyonu':'Duruyor / demo');
  $('status-time').textContent=(track?s.time:0).toFixed(1)+' s';$('status-battery').textContent=`${parameters.battery.series}S${parameters.battery.parallel}P · ${parameters.battery.nominalV} V hedef`;
 }
 $('simulation-panel').addEventListener('click',status);
 $('sim-form').addEventListener('submit',status);
 document.addEventListener('vaccino:route',route);document.addEventListener('vaccino:simulation',status);startExperienceClock();route();
 window.vaccinoExperience={state:()=>({...experienceState,world:api?.experienceState(),shell:api?.shellState(),simulation:simulation.snapshot()}),environment(name){location.hash='#/experience/'+name;},update:status};
}
