import {SimulationEngine} from './simulation-engine.js';
let clockStarted=false;
export function startExperienceClock(){if(clockStarted)return;clockStarted=true;let last=performance.now(),notified=0;
 function frame(now){requestAnimationFrame(frame);const elapsed=Math.min(.25,Math.max(0,(now-last)/1000));last=now;
  if(!experienceState.active||experienceState.environment!=='track'||document.hidden||document.body.classList.contains('presentation-active'))return;
  if(!['countdown','running'].includes(simulation.state.status)) return;
  simulation.advance(elapsed);
  document.dispatchEvent(new Event('vaccino:simulation-frame'));
  if(now-notified>90||simulation.state.status==='finished'||simulation.state.status==='stalled'||simulation.state.status==='timeout'){
   notified=now;document.dispatchEvent(new CustomEvent('vaccino:simulation',{detail:simulation.snapshot()}));
  }
 }requestAnimationFrame(frame);
}
export const experienceState={environment:'showroom',active:false,bodyMode:'hidden',hatchOpen:false,liftRaised:false,camera:'follow',view:'3d',lift:0};
export const simulation=new SimulationEngine();
export function setEnvironment(name){if(!['showroom','workshop','track'].includes(name))throw Error('Bilinmeyen ortam');simulation.pause();experienceState.environment=name;experienceState.hatchOpen=false;experienceState.liftRaised=false;experienceState.lift=0;experienceState.bodyMode='hidden';}
