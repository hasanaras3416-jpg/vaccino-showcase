// SI units internally. Fixed-step longitudinal demonstration model, not vehicle validation.
import {trackLength} from './track-geometry.js';
export const parameterDefinitions=[
 ['mass','Araç + sürücü kütlesi','kg',260,20,5000],['power','Motor elektrik giriş gücü sınırı','W',1000,0,100000],['targetKmh','Hedef hız','km/sa',25,0,200],
 ['acceleration','İvmelenme sınırı','m/s²',.8,0,10],['braking','Frenleme sınırı','m/s²',1.5,.1,20],['rolling','Yuvarlanma katsayısı','—',.012,0,.2],
 ['drag','Aerodinamik Cd','—',.32,0,2],['area','Ön alan','m²',1,.1,15],['efficiency','Batarya → teker verimi','0–1',.82,.01,1]
];
export const defaultParameters=Object.freeze(Object.fromEntries(parameterDefinitions.map(p=>[p[0],p[3]])));
export function validateParameters(input){const p={};for(const [key,label,unit,value,min,max] of parameterDefinitions){const n=input[key]??value;if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max)throw Error(`${label}: ${min}–${max} ${unit} aralığında sayı gerekli.`);p[key]=n;}return p;}
export class SimulationEngine{
 constructor(parameters=defaultParameters,length=trackLength()){this.params=validateParameters(parameters);if(!Number.isFinite(length)||length<=0)throw Error('Parkur uzunluğu pozitif olmalı.');this.length=length;this.fixedDt=1/60;this.coupled=true;this.reset();}
 reset(){this.state={status:'idle',time:0,distance:0,speed:0,acceleration:0,energyWh:0,powerW:0,countdown:0,brake:false};this.accumulator=0;return this.snapshot();}
 configure(parameters){this.params=validateParameters(parameters);this.reset();}
 start(countdown=3){if(this.state.status==='paused'){this.state.status=this.resumeStatus||'running';return;}if(['running','countdown'].includes(this.state.status))return;if(['finished','stalled','timeout'].includes(this.state.status))this.reset();this.state.countdown=Math.max(0,countdown);this.state.status=countdown>0?'countdown':'running';}
 pause(){if(['running','countdown'].includes(this.state.status)){this.resumeStatus=this.state.status;this.state.status='paused';}this.accumulator=0;}
 brake(value=true){this.state.brake=!!value;}
 step(dt=this.fixedDt){
  const s=this.state,p=this.params;if(!Number.isFinite(dt)||dt<=0||dt>.1)throw Error('Geçersiz fizik zaman adımı.');
  if(s.status==='countdown'){s.countdown=Math.max(0,s.countdown-dt);if(s.countdown<1e-8)s.status='running';return;}
  if(s.status!=='running')return;
  const remaining=Math.max(0,this.length-s.distance),v=s.speed;
  const goal=s.brake?0:Math.min(p.targetKmh/3.6,Math.sqrt(2*p.braking*remaining));
  const resistance=p.mass*9.81*p.rolling+.5*1.225*p.drag*p.area*v*v;
  const effectivePower=this.coupled?p.power:0,driveForce=effectivePower*p.efficiency/Math.max(1,v);
  const slowing=v>goal+1e-9;
  let a=slowing?Math.max(-p.braking,(goal-v)/dt):Math.min(p.acceleration,(goal-v)/dt,(driveForce-resistance)/p.mass);
  let next=Math.max(0,v+a*dt);if(!slowing)next=Math.min(next,p.targetKmh/3.6);
  if(!slowing){const b=resistance*dt,c=p.mass*v*v-resistance*dt*v+2*effectivePower*p.efficiency*dt;const energyLimited=Math.max(0,(-b+Math.sqrt(Math.max(0,b*b+4*p.mass*c)))/(2*p.mass));next=Math.min(next,energyLimited);}
  let dx=(v+next)*.5*dt,usedDt=dt;
  if(dx>remaining){usedDt=dt*remaining/dx;dx=remaining;}
  const kinetic=.5*p.mass*(next*next-v*v);
  const electrical=slowing?0:Math.min(effectivePower*usedDt,Math.max(0,kinetic+resistance*dx)/p.efficiency);
  s.time+=usedDt;s.distance+=dx;s.speed=next;s.acceleration=(next-v)/dt;s.energyWh+=electrical/3600;s.powerW=usedDt?electrical/usedDt:0;
  if(s.distance>=this.length-1e-7||(remaining<.015&&next<.15&&p.targetKmh>0)){s.distance=this.length;s.speed=0;s.powerW=0;s.status='finished';}
  else if(s.time>=10&&s.distance<.001){s.status='stalled';s.powerW=0;}
  else if(s.time>=1800){s.status='timeout';s.powerW=0;}
 }
 advance(elapsed){if(!Number.isFinite(elapsed)||elapsed<0)throw Error('Geçersiz geçen süre.');if(!['running','countdown'].includes(this.state.status))return this.snapshot();this.accumulator+=elapsed;let steps=0;while(this.accumulator+1e-10>=this.fixedDt&&steps<1800){this.step();this.accumulator-=this.fixedDt;steps++;if(!['running','countdown'].includes(this.state.status)){this.accumulator=0;break;}}return this.snapshot();}
 snapshot(){return {...this.state,length:this.length,progress:this.state.distance/this.length};}
}
export function predictRun(parameters){const engine=new SimulationEngine(parameters);engine.start(0);for(let i=0;i<108001&&engine.state.status==='running';i++)engine.step();const s=engine.snapshot();return s.status==='finished'?{time:s.time,energyWh:s.energyWh,available:true,reliable:false,label:'Demo model tahmini; ölçülmüş performans değildir.'}:{time:null,energyWh:null,available:false,reliable:false,label:'Bu parametrelerle tamamlanan tur tahmini üretilemedi.'};}
