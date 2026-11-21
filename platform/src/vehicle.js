import {data} from '../data/geometry.js';
import {createBodyShell} from './body-shell.js';
import {createExperienceWorld} from './experience-world.js';
import {experienceState,simulation} from './animation-state.js';
import {createStudio} from './studio.js';
import {addMechanicalDetails} from './mechanical-details.js';
import {createCameraMotion} from './camera-motion.js';
import {vehicleLayout,checkVisualEnvelopes} from './vehicle-layout.js';
import {record, parameters, state as workspaceState, mechanicalSystem} from './store.js';
const sections=record.parts;
const canInspect=id=>mechanicalSystem()?.parts.includes(id)??true;
const playLabel=document.querySelector('#play span');

let onSelect=()=>{};
let chosen='frame', batteryIndex=1, pickMode='frame', wheelSpin=0, demoEnd=0, draw=true;
const sizes=vehicleLayout.battery.variants, descriptions=['520 × 152 × 90 mm','316 × 220 × 90 mm','180 × 152 × 235 mm'];
const $=id=>document.getElementById(id);
let refreshBattery=()=>{}, redraw=()=>{}, refreshDrive=()=>{}, refreshSelectionMaterials=()=>{}, pins=[];
let engaged=true, guardVisible=false;
const inspector=$('part-inspector');
let inspectorTrigger=null;
function openInspector(trigger,moveFocus=true){
 inspectorTrigger=trigger;
 inspector.inert=false;
 inspector.dataset.open='true';
 $('part-open').setAttribute('aria-expanded','true');
 if(moveFocus)$('title').focus({preventScroll:true});
}
function closeInspector(returnFocus=false){
 if(inspector.inert)return;
 inspector.inert=true;
 delete inspector.dataset.open;
 $('part-open').setAttribute('aria-expanded','false');
 if(returnFocus)inspectorTrigger?.focus({preventScroll:true});
 inspectorTrigger=null;
}
export function inspect(id,trigger){
 if(!canInspect(id))return;
 select(id);
 openInspector(trigger);
}
$('part-open').onclick=()=>openInspector($('part-open'));
$('part-close').onclick=()=>closeInspector(true);
document.addEventListener('vaccino:inspector-close',()=>closeInspector());
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&!inspector.inert&&!$('nextion-dialog').open&&!document.body.classList.contains('menu-open')){
  event.preventDefault();
  closeInspector(true);
 }
});
function select(id){
 chosen=id;
 const info=sections.find(s=>s.id===id);
 $('status').textContent=info.status;$('title').textContent=info.label;$('desc').textContent=info.simple;
 $('part-technical').textContent=info.desc;
 $('facts').replaceChildren(...info.facts.map(f=>{const li=document.createElement('li');li.textContent=f;return li}));
 $('variants').replaceChildren();$('variant-note').textContent='';
 document.querySelectorAll('[data-part]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.part===id)));
 if(id==='battery'){
  ['15 × 3','9 × 5','5 × 3 × 3'].forEach((n,i)=>{const b=document.createElement('button');b.textContent=n;b.setAttribute('aria-pressed',String(i===batteryIndex));b.onclick=()=>{batteryIndex=i;refreshBattery();select(id)};$('variants').append(b)});
  $('variant-note').textContent=descriptions[batteryIndex]+' tahmini dış hacim. Kutu ve BMS ölçüleri doğrulanacak.';
 }
 if(['motor','clutch','diff'].includes(id)){
  const buttons=[
   ['Kısa animasyon',null,()=>{demoEnd=performance.now()+4500;redraw()}],
   ['Kayış muhafazası',guardVisible,()=>{guardVisible=!guardVisible;refreshDrive();select(id)}]
  ];
  for(const [label,pressed,action] of buttons){const b=document.createElement('button');b.textContent=label;if(pressed!==null)b.setAttribute('aria-pressed',String(pressed));b.onclick=action;$('variants').append(b)}
  $('variant-note').textContent=engaged?'Bağlı · Motor torku akslara aktarılır.':'Ayrık · Motor durabilir. Tekerlekler, akslar, diferansiyel ve kayış dönmeye devam eder.';
 }
 refreshDrive();onSelect(id);redraw();document.dispatchEvent(new CustomEvent('vaccino:part',{detail:id}));
}
for(const section of sections){
 const button=document.createElement('button');
 button.textContent=section.label;button.dataset.part=section.id;
 button.onclick=()=>{if(canInspect(section.id))select(section.id);};
 $('parts').append(button);
}
function syncPartLibrary(){
 const visible=mechanicalSystem()?.parts.length??sections.length;
 $('part-count').textContent=`${visible} bileşen`;
 $('parts').querySelectorAll('[data-part]').forEach(button=>{button.hidden=!canInspect(button.dataset.part);});
 for(const pin of pins) if(!canInspect(pin.id))pin.button.hidden=true;
}
document.addEventListener('vaccino:route',syncPartLibrary);
syncPartLibrary();
select('frame');
try{
 const T=THREE, canvas=$('vehicle'), scene=new T.Scene();
 const sceneBackground=new T.Color(0xf4f2ec);scene.background=sceneBackground;
 const render=new T.WebGLRenderer({canvas,antialias:true,alpha:true});render.setPixelRatio(Math.min(devicePixelRatio,matchMedia("(max-width:600px)").matches?1.25:2));render.outputColorSpace=T.SRGBColorSpace;
 const camera=new T.PerspectiveCamera(38,1,.05,250);
 const target=new T.Vector3(0,.39,0);let az=-.88,el=.50,rad=4.04;
 const readPose=()=>({az,el,rad,target:target.toArray()});
 const writePose=pose=>{az=pose.az;el=pose.el;rad=pose.rad;target.fromArray(pose.target);focusGoal=null;draw=true;};
 const cameraMotion=createCameraMotion({read:readPose,write:writePose,invalidate:()=>{draw=true}});
 const homePose={az:-.77,el:.24,rad:4.65,target:[-.10,.38,-.10]};
 const isHomeView=()=>workspaceState.route==='overview'&&!document.body.classList.contains('presentation-active');
 const resetHomeView=(duration=0)=>cameraMotion.moveTo(homePose,duration);
 const steel=new T.MeshStandardMaterial({color:0xaeb8bc,metalness:.65,roughness:.32,side:T.DoubleSide});
 const white=new T.MeshStandardMaterial({color:0xdddeda,roughness:.40,metalness:.22,side:T.DoubleSide});
 const gold=new T.MeshStandardMaterial({color:0xbd8c34,roughness:.35,metalness:.27,side:T.DoubleSide});
 const glass=new T.MeshStandardMaterial({color:0x293c42,roughness:.17,metalness:.34,side:T.DoubleSide});
 const rubber=new T.MeshStandardMaterial({color:0x222729,roughness:.94});
 const ambient=new T.HemisphereLight(0xffffff,0xb4ada0,1.65);scene.add(ambient);
 const sun=new T.DirectionalLight(0xffffff,1.75);sun.position.set(-3,6,4);scene.add(sun);
 const fill=new T.DirectionalLight(0xe8f0ff,.85);fill.position.set(4,3,-4);scene.add(fill);
 const homeLights=new T.Group();
 const homeKey=new T.DirectionalLight(0xfff4df,2.25);homeKey.position.set(-3,5,2);
 const homeRim=new T.DirectionalLight(0xe2ebff,1.65);homeRim.position.set(2,3,-4);
 const homeBounce=new T.HemisphereLight(0xf4f6ff,0x353334,.65);
 homeLights.add(homeKey,homeRim,homeBounce);scene.add(homeLights);homeLights.visible=false;
 let exploded=false, batteryHidden=false, playing=false, lastNow=0, focusGoal=null;
 const frame=new T.Group(),body=new T.Group(),wheels=new T.Group(),rollers=[];
 const vehicleRoot=new T.Group();vehicleRoot.name='vaccino-v2-vehicle';scene.add(vehicleRoot);vehicleRoot.add(frame,body,wheels);body.visible=false;
 const studio=createStudio(T,render,scene,vehicleRoot,()=>{draw=true});
 const world=createExperienceWorld(T,scene,vehicleRoot);
 const studioFloor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardMaterial({
  color:0x171513,metalness:.48,roughness:.38,envMapIntensity:.42
 }));
 studioFloor.rotation.x=-Math.PI/2;
 studioFloor.position.y=-.008;
 scene.add(studioFloor);
 studioFloor.visible=false;
 render.toneMapping=T.ACESFilmicToneMapping;render.toneMappingExposure=1.05;
 const chassis=nodePlaceholder(); function nodePlaceholder(){const g=new T.Group();frame.add(g);return g;}
 for(const item of data.frame){
  const bytes=Uint8Array.from(atob(item),c=>c.charCodeAt(0));const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(bytes.buffer),3));g.computeVertexNormals();chassis.add(new T.Mesh(g,steel));
 }
 const unitBox=new T.BoxGeometry(1,1,1),unitCylinder=new T.CylinderGeometry(1,1,1,20);
 const scratch=new T.Object3D();
 function instances(geometry,material,parent,items){
  const batch=new T.InstancedMesh(geometry,material,items.length);
  items.forEach((item,i)=>{scratch.position.fromArray(item.p);scratch.rotation.set(...(item.r||[0,0,0]));scratch.scale.fromArray(item.s||[1,1,1]);scratch.updateMatrix();batch.setMatrixAt(i,scratch.matrix);});batch.instanceMatrix.needsUpdate=true;parent.add(batch);return batch;
 }
 function box(L,H,W,x,y,z,material,group){
  const mesh=new T.Mesh(unitBox,material);mesh.scale.set(L,H,W);mesh.position.set(x,y,z);group.add(mesh);return mesh;
 }
 const mat=(color,metalness=.12,roughness=.45)=>new T.MeshStandardMaterial({color,metalness,roughness});
 const dark=mat(0x252d35), anodized=mat(0x56606a,.58), machined=mat(0xbec7ce,.64,.3);
 const cloth=mat(0x262c36,0,.94), upholstery=mat(0x3d4955,0,.9);
 const blue=mat(0x0965cc,.17,.32), red=mat(0xc62432), pcb=mat(0x226947,.04);
 const node=(parent,x=0,y=0,z=0)=>{const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g};
 function mesh(geometry,material,parent,x=0,y=0,z=0){
  const m=new T.Mesh(geometry,material);m.position.set(x,y,z);parent.add(m);return m;
 }
 function rounded(L,H,W,r,material,parent,x=0,y=0,z=0){
  const left=-L/2,right=L/2,bottom=-H/2,top=H/2;
  r=Math.min(r,L/2,H/2);
  const s=new T.Shape();
  s.moveTo(left+r,bottom);s.lineTo(right-r,bottom);s.quadraticCurveTo(right,bottom,right,bottom+r);
  s.lineTo(right,top-r);s.quadraticCurveTo(right,top,right-r,top);s.lineTo(left+r,top);
  s.quadraticCurveTo(left,top,left,top-r);s.lineTo(left,bottom+r);s.quadraticCurveTo(left,bottom,left+r,bottom);
  const geometry=new T.ExtrudeGeometry(s,{depth:W,bevelEnabled:false,curveSegments:6});
  geometry.translate(0,0,-W/2);
  return mesh(geometry,material,parent,x,y,z);
 }
 function rod(a,b,r,material,parent=frame){
  const v=new T.Vector3(...a),w=new T.Vector3(...b),d=w.clone().sub(v);
  const m=mesh(unitCylinder,material,parent);m.scale.set(r,d.length(),r);
  m.position.copy(v.add(w).multiplyScalar(.5));
  m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());
  return m;
 }
 const joint=(p,r=.023,parent=frame)=>mesh(new T.SphereGeometry(r,12,8),anodized,parent,...p);
 function wire(points,r,material,parent=frame){
  return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),22,r,8,false),material,parent);
 }
 function labelTexture(width,height,paint){
  const c=document.createElement('canvas');c.width=width;c.height=height;paint(c.getContext('2d'),width,height);
  const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;return texture;
 }
 function decal(texture,L,W,parent){
  return mesh(new T.PlaneGeometry(L,W),new T.MeshBasicMaterial({map:texture,transparent:true,polygonOffset:true,polygonOffsetFactor:-2}),parent);
 }
 // The seat shell, padding, bolsters, headrest and slides are separate visible surfaces.
 for(const x of [-.20,.35])rod([x,.182,-.56],[x,.182,.56],.018,steel);
 const seat=node(frame,.105,.258,0);
 rounded(.44,.083,.38,.04,cloth,seat,-.078,0,0);
 rounded(.36,.05,.252,.024,upholstery,seat,-.092,.052,0);
 for(const side of [-1,1]){
  const b=rounded(.375,.084,.056,.026,cloth,seat,-.09,.053,side*.158);b.rotation.y=side*.075;
  rod([-.27,-.063,side*.14],[.19,-.063,side*.14],.013,machined,seat);
 }
 const back=node(seat,.13,.22,0);back.rotation.z=-.24;
 rounded(.072,.415,.357,.031,cloth,back);
 rounded(.037,.299,.245,.016,upholstery,back,-.045,-.043,0);
 for(const side of [-1,1])rounded(.058,.288,.057,.025,cloth,back,-.038,-.053,side*.147);
 rounded(.088,.113,.245,.032,upholstery,back,-.018,.175,0);
 for(const z of [-.074,.074])rod([-.059,.07,z],[-.059,.15,z],.009,dark,back);
 const batterySupport=node(frame);
 const batteryPack=node(batterySupport,...vehicleLayout.battery.position);
 for(const x of [.87,1.16]){
  rod([x,.398,-.19],[x,.398,.19],.011,steel,batterySupport);
  for(const z of [-.19,.19])rod([x,.398,z],[x,.16,z],.01,steel,batterySupport);
 }
 const batteryLabel=labelTexture(512,256,(c,w,h)=>{
  c.fillStyle='#edf5ff';c.fillRect(0,0,w,h);c.fillStyle='#104785';c.font='bold 45px sans-serif';c.fillText('VACCINO',30,69);c.font='bold 43px sans-serif';c.fillText(`${parameters.battery.nominalV} V  /  ${parameters.battery.capacityAh} Ah`,30,139);c.font='30px sans-serif';c.fillText(`${parameters.battery.series}S${parameters.battery.parallel}P · TASLAK PAKET`,30,204);
 });
  refreshBattery=()=>{
  for(const child of batteryPack.children){
   child.geometry.dispose();if(child.material.map)child.material.dispose();
  }
  batteryPack.clear();
  const [L,H,W]=sizes[batteryIndex];
  rounded(L,H,W,.021,blue,batteryPack,0,H/2,0);
  for(const s of [-1,1])rounded(.021,H+.003,W+.003,.006,dark,batteryPack,s*L*.31,H/2,0);
  const sticker=decal(batteryLabel,Math.min(.155,L*.54),Math.min(.073,W*.48),batteryPack);
  sticker.rotation.x=-Math.PI/2;sticker.position.y=H+.002;
  for(const s of [-1,1])wire([[-L/2,H*.66,s*.03],[-L/2-.047,H*.64,s*.036],[-L/2-.068,.042,s*.052]],.006,s>0?red:dark,batteryPack);
  refreshSelectionMaterials();redraw();
 };
 refreshBattery();
 function finned(L,H,W,parent,x,y,z,color=anodized){
  const g=node(parent,x,y,z);
  rounded(L,H*.70,W,.009,color,g);
  for(let i=0;i<8;i++)box(L*.86,H*.32,.004,0,H*.48,(i-3.5)*W*.112,machined,g);
  rounded(.021,H*.52,W*.78,.008,dark,g,L*.51,-.004,0);
  for(const zz of [-.023,0,.023])rod([L*.52,-.004,zz],[L*.557,-.004,zz],.006,dark,g);
  return g;
 }
 const motorController=finned(.22,.066,.105,frame,.87,.29,-.34);
 finned(.17,.068,.08,frame,-.886,.242,-.106);
 finned(.138,.055,.10,frame,.577,.254,-.418);
 const computer=finned(.205,.083,.14,frame,.206,.278,-.408,dark);
 for(let i=0;i<3;i++)rounded(.01,.013,.024,.003,machined,computer,-.107,-.006,(i-1)*.036);
 const board=node(frame,-.113,.25,-.407);
 rounded(.156,.009,.106,.005,pcb,board);
 box(.042,.013,.035,0,.012,0,dark,board);
 for(const z of [-.04,.04])for(let i=0;i<9;i++)box(.007,.016,.008,-.056+i*.014,.011,z,machined,board);
 const fire=node(frame,.385,.46,.27);
 rod([0,0,-.145],[0,0,.105],.044,red,fire);
 mesh(new T.SphereGeometry(.044,18,12),red,fire,0,0,-.145).scale.z=.59;
 mesh(new T.SphereGeometry(.044,18,12),red,fire,0,0,.105).scale.z=.56;
 rod([0,0,.13],[0,0,.154],.022,machined,fire);
 rounded(.043,.017,.045,.005,dark,fire,0,.024,.153);
 wire([[0,.019,.16],[.033,.042,.178],[.073,.03,.145]],.006,dark,fire);
 rod([-1.242,.202,0],[-1.242,.423,0],.013,anodized);
 rod([-1.242,.201,-.17],[-1.242,.201,.17],.014,steel);
 const nose=node(frame,-1.242,.446,0);
 rounded(.03,.035,.124,.009,anodized,nose);
 for(const z of [-.049,.049]){
  rod([-.013,0,z],[-.018,0,z],.014,dark,nose);
  rod([-.017,0,z],[-.019,0,z],.010,glass,nose);
 }
 // Steering column, rack, rubber boots, tie rods and the wheel.
 const rackX=-.985,rackY=.292;
 rod([rackX,rackY,-.29],[rackX,rackY,.29],.026,machined);
 rounded(.114,.097,.164,.024,anodized,frame,-.963,.315,0);
 for(const s of [-1,1]){
  rod([rackX,rackY,s*.158],[rackX,rackY,s*.325],.028,dark);
  for(let i=0;i<8;i++){
   const z=s*(.173+i*.019);
   rod([rackX,rackY,z-.004],[rackX,rackY,z+.004],.033-i*.0017,rubber);
  }
  rod([rackX,rackY,s*.315],[-.893,.274,s*.568],.008,machined);
  joint([-.893,.274,s*.568],.015);
 }
 const columnStart=[-.903,.345,0],columnEnd=[-.315,.565,0];
 rod(columnStart,columnEnd,.013,machined);joint(columnStart,.025);
 rod([-.769,.395,0],[-.67,.433,0],.023,anodized);
 const step=node(frame,-.864,.33,.131);
 rounded(.087,.103,.103,.007,dark,step);
 rounded(.009,.112,.112,.008,machined,step,.046,0,0);
 rod([.051,0,0],[.084,0,0],.013,machined,step);
 const steering=node(frame,...columnEnd);steering.rotation.z=.35;
 const rim=mesh(new T.TorusGeometry(.137,.015,13,42),rubber,steering);rim.rotation.y=Math.PI/2;
 rod([-.006,0,-.133],[-.006,0,.133],.010,anodized,steering);
 rod([-.006,0,0],[-.006,-.132,0],.010,anodized,steering);
 rod([-.021,0,0],[.025,0,0],.042,dark,steering);
 const panel=node(frame,-.33,.557,.252);panel.rotation.z=.14;
 rounded(.028,.107,.169,.009,dark,panel);
 const hmiTexture=labelTexture(512,320,(c,w,h)=>{
  c.fillStyle='#10232c';c.fillRect(0,0,w,h);c.fillStyle='#76dedc';c.fillRect(22,62,468,3);
  c.font='bold 29px sans-serif';c.fillText('VACCINO  ·  GÖSTERGE',22,44);
  c.fillStyle='#fff';c.font='bold 99px sans-serif';c.fillText('0',33,192);
  c.font='33px sans-serif';c.fillText('km/sa',108,189);c.font='25px sans-serif';c.fillText('NEXTION  /  TASLAK',23,275);
 });
 const display=decal(hmiTexture,.153,.091,panel);display.rotation.y=Math.PI/2;display.position.x=.016;
 rod([-.331,.515,.252],[-.35,.405,.23],.011,anodized);
 // Visual study of two separate hydraulic circuits. See docs/v1.3-brakes.md.
 const brakes=node(frame);
 const brakeLines=[];
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 const brakePipe=mat(0x414c47,.55,.44), brakeHose=mat(0x262e2a,.1,.72);
 const pedalPivot=[-.723,.192,.098], pedalPad=[-.667,.323,.098];
 rod([-.723,.192,.058],[-.723,.192,.138],.014,machined,brakes);
 rod(pedalPivot,pedalPad,.011,machined,brakes);
 rounded(.019,.073,.057,.008,dark,brakes,...pedalPad).rotation.z=-.26;
 rod([-.723,.192,-.103],[-.667,.315,-.103],.010,machined);
 rounded(.019,.073,.057,.008,dark,frame,-.667,.323,-.103).rotation.z=-.26;
 rod([-.702,.252,.098],[-.756,.268,.11],.009,machined,brakes);
 rod([-.756,.268,.11],[-.884,.268,.11],.024,anodized,brakes);
 box(.10,.032,.053,-.818,.313,.11,white,brakes);
 box(.045,.009,.042,-.818,.335,.11,dark,brakes);
 function brakeLine(points,material,front) {
  const curve=new T.CatmullRomCurve3(points.map(point=>new T.Vector3(...point)));
  const line=mesh(new T.TubeGeometry(curve,24,material===brakeHose?.007:.004,6,false),material,brakes);
  line.userData.brakeColor=front?0x55bfff:0xe18a5b;
  brakeLines.push({line,curve});
 }
 for(const front of [true,false]) {
  const terminal=front?-.92:.79, port=front?-.86:-.79;
  const junction=front?-.89:.59;
  const feed=[[port,.267,.136],[port,.224,.19]];
  if(!front) feed.push([-.65,.221,.29],[.48,.221,.29]);
  brakeLine([...feed,[junction,.221,.22]],brakePipe,front);
  box(.025,.023,.024,junction,.221,.22,machined,brakes);
  for(const side of [-1,1]) {
   brakeLine([[junction,.221,.22],[junction,.221,side*.28],[terminal,.223,side*.32]],brakePipe,front);
   box(.031,.018,.025,terminal,.22,side*.32,machined,brakes);
   brakeLine([[terminal,.225,side*.32],[terminal+.10,.237,side*.41],[terminal+.10,.33,side*.51],[(front?-.96:.87)+.071,.382,side*.603]],brakeHose,front);
  }
 }
 const brakeMarkers=brakeLines.map(({line})=>{
  const marker=mesh(new T.SphereGeometry(.010,8,6),new T.MeshBasicMaterial({color:line.userData.brakeColor}),scene);
  marker.visible=false;
  return marker;
 });
 let brakeFlow=false;
 // Upper and lower wishbones, uprights and spring-damper units.
 function coilover(a,b,parent){
  const v=new T.Vector3(...a),w=new T.Vector3(...b),axis=w.clone().sub(v);
  rod(a,b,.015,machined,parent);
  const end=v.clone().addScaledVector(axis,.44);rod(a,end.toArray(),.023,anodized,parent);
  const basis=new T.Vector3(0,1,0);
  const q=new T.Quaternion().setFromUnitVectors(basis,axis.clone().normalize());
  const points=[];
  for(let i=0;i<=124;i++){
   const t=i/124,angle=t*12*Math.PI;
   points.push(new T.Vector3(.033*Math.cos(angle),axis.length()*(.13+.74*t),.033*Math.sin(angle)).applyQuaternion(q).add(v));
  }
  mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),124,.0048,7,false),gold,parent);
  for(const t of [.13,.87]){
   const A=v.clone().addScaledVector(axis,t-.014),B=v.clone().addScaledVector(axis,t+.014);
   rod(A.toArray(),B.toArray(),.04,anodized,parent);
  }
  joint(a,.019,parent);joint(b,.019,parent);
 }
 const suspension=node(frame);
 for(const axle of [-.96,.87])for(const s of [-1,1]){
  const front=axle<0;
  const lower=[axle,.194,s*.564],upper=[axle-.015,.371,s*.553];
  const width=front?.185:.254;
  for(const [level,end,inner] of [[.195,lower,width],[.365,upper,width+.016]]){
   const A=[axle-.168,level,s*inner],B=[axle+.154,level,s*inner];
   rod(A,end,.012,anodized,suspension);rod(B,end,.012,anodized,suspension);
   rod(A,B,.011,steel,suspension);joint(A,.016,suspension);joint(B,.016,suspension);
  }
  rod(lower,upper,.024,machined,suspension);joint(lower,.018,suspension);joint(upper,.018,suspension);
  rod([axle,.269,s*.554],[axle,.269,s*.663],.024,machined,suspension);
  const perch=[axle+.045,.202,s*.455],tower=[axle-.075,.469,s*(width+.05)];
  coilover(perch,tower,suspension);
  rod(tower,[tower[0]-.111,.183,s*width],.013,steel,suspension);
  rod(tower,[tower[0]+.132,.183,s*width],.013,steel,suspension);
 }
 for(const x of [-.96,-.20,.35,.87])for(const z of [-.40,.40]){
  box(.082,.006,.063,x,.203,z,machined,frame);
  for(const dx of [-.025,.025])mesh(new T.CylinderGeometry(.006,.006,.009,6),dark,frame,x+dx,.211,z);
 }
 const hubmat=new T.MeshStandardMaterial({color:0x8b9295,metalness:.55,roughness:.32});
 for(const x of [-.96,.87])for(const z of [-.66,.66]){
  const wheel=new T.Group();wheel.position.set(x,.269,z);wheels.add(wheel);rollers.push({wheel,rear:x>0});
  function disk(r,len,depth,material){
   const mesh=new T.Mesh(new T.CylinderGeometry(r,r,len,40),material);mesh.rotation.x=Math.PI/2;mesh.position.z=depth;wheel.add(mesh);
  }
  const side=Math.sign(z);
  instances(unitBox,rubber,wheel,Array.from({length:64},(_,i)=>{const a=i*Math.PI/32;return {p:[.269*Math.cos(a),.269*Math.sin(a),0],s:[.012,.003,.083],r:[0,0,a-Math.PI/2]};}));
  instances(new T.CircleGeometry(.0034,8),dark,wheel,Array.from({length:24},(_,i)=>{const a=i*Math.PI/12;return {p:[.116*Math.cos(a),.116*Math.sin(a),-side*.057],r:[0,side<0?0:Math.PI,0]};}));

  const tire=new T.LatheGeometry([
   [.200,-.055],[.215,-.067],[.251,-.067],[.269,-.047],[.269,.047],[.251,.067],[.215,.067],[.200,.055],[.200,-.055]
  ].map(([r,y])=>new T.Vector2(r,y)),64);
  const tread=mesh(tire,rubber,wheel);tread.rotation.x=Math.PI/2;
  const rimRing=mesh(new T.TorusGeometry(.198,.012,12,48),hubmat,wheel,0,0,side*.051);
  const rimInner=mesh(new T.TorusGeometry(.198,.009,12,48),hubmat,wheel,0,0,-side*.046);
  disk(.062,.092,0,hubmat);
  for(let i=0;i<6;i++){
   const a=i*Math.PI/3;
   const spoke=box(.135,.019,.035,.124*Math.cos(a),.124*Math.sin(a),side*.024,hubmat,wheel);
   spoke.rotation.z=a;
   mesh(new T.CylinderGeometry(.008,.008,.01,6),machined,wheel,.041*Math.cos(a),.041*Math.sin(a),side*.047).rotation.x=Math.PI/2;
  }
  const disc=mesh(new T.RingGeometry(.083,.134,48),studio.apply(new T.MeshStandardMaterial({color:0xb4bdc2,side:T.DoubleSide}),'brake'),wheel,0,0,-side*.054);
  disc.userData.part='brake';
  disk(.091,.005,-side*.055,hubmat);
  rounded(.073,.043,.043,.011,red,brakes,x+.071,.382,z-side*.057);

 }
 // Transverse motor, input-side disconnect, belt and differential.
 const driveline=node(frame);
 const motorGroup=node(driveline),diffGroup=node(driveline),axleGroup=node(driveline),clutchGroup=node(driveline);
 const motorX=vehicleLayout.motor.x, axleX=vehicleLayout.differential.x, axleY=vehicleLayout.differential.y;
 const alloy=mat(0x909da5,.65,.38), housing=mat(0x444e56,.44,.41), beltMaterial=mat(0x292b30,.02,.82);
 const shaft=(x,y,z1,z2,r,m,parent=diffGroup)=>rod([x,y,z1],[x,y,z2],r,m,parent);
 const housingBody=mesh(new T.SphereGeometry(1,32,20),housing,diffGroup,axleX,axleY,0);
 housingBody.scale.set(.116,.106,.15);
 shaft(axleX,axleY,-.105,.151,.078,housing);
 shaft(axleX,axleY,-.165,-.133,.061,alloy);
 shaft(axleX,axleY,.127,.178,.059,alloy);
 for(let i=0;i<10;i++){
  const a=i*Math.PI/5;
  const x=axleX+.071*Math.cos(a),y=axleY+.071*Math.sin(a);
  shaft(x,y,-.116,-.102,.008,machined);
  shaft(x,y,.095,.108,.008,machined);
 }
 const axleWitnesses=[];
 const carrier=node(diffGroup,axleX,axleY,0);
 shaft(0,0,-.14,.14,.049,machined,carrier);
 for(const sign of [-1,1]){
  const rotatingOutput=node(axleGroup,axleX,axleY,sign*.178);axleWitnesses.push(rotatingOutput);
  shaft(0,0,-.009,.009,.047,alloy,rotatingOutput);
  for(let i=0;i<6;i++){const a=i*Math.PI/3;shaft(.035*Math.cos(a),.035*Math.sin(a),-.01,.01,.004,gold,rotatingOutput);}
  shaft(axleX,axleY,sign*.16,sign*.65,.013,alloy,axleGroup);
  for(const [start,end,r] of [[...(sign>0?vehicleLayout.cv.innerRight:vehicleLayout.cv.innerLeft),.034],[...vehicleLayout.cv.outer,.038]]){
   const count=9;
   for(let i=0;i<count;i++){
    const z=start+(end-start)*i/(count-1);
    const cone=Math.sin(Math.PI*i/(count-1));
    shaft(axleX,axleY,sign*(z-.003),sign*(z+.003),r*(.55+.45*cone),rubber,axleGroup);
   }
   shaft(axleX,axleY,sign*(start-.02),sign*start,r*.67,machined,axleGroup);
  }
 }
 shaft(motorX,axleY,-.177,.074,.095,anodized,motorGroup);
 for(let i=0;i<24;i++){
  const a=i*Math.PI/12;
  const fin=box(.016,.012,.196,motorX+.092*Math.cos(a),axleY+.092*Math.sin(a),-.055,alloy,motorGroup);
  fin.rotation.z=a;
 }
 for(const z of [-.18,.077]){
  shaft(motorX,axleY,z-.008,z+.008,.099,machined,motorGroup);
  for(let i=0;i<6;i++){
   const a=i*Math.PI/3;
   shaft(motorX+.076*Math.cos(a),axleY+.076*Math.sin(a),z-.011,z+.011,.008,dark,motorGroup);
  }
 }
 for(const dz of [-.012,0,.012])wire([[.47,.36,-.20+dz],[.54,.395,-.24+dz],[.72,.30,-.33+dz]],.004,dz===0?gold:dark,motorGroup);
 shaft(motorX,axleY,-.206,-.183,.027,dark,motorGroup);
 const rotor=node(motorGroup,motorX,axleY,0);
 shaft(0,0,.076,.152,.024,machined,rotor);
 box(.014,.013,.053,.025,0,.104,gold,rotor);
 const drivenHub=node(clutchGroup,motorX,axleY,0);shaft(0,0,.160,.252,.022,alloy,drivenHub);
 const sleeve=node(clutchGroup,motorX,axleY,.132);
 const collarShape=new T.Shape();collarShape.absarc(0,0,.046,0,Math.PI*2,false);const collarHole=new T.Path();collarHole.absarc(0,0,.028,0,Math.PI*2,true);collarShape.holes.push(collarHole);
 mesh(new T.ExtrudeGeometry(collarShape,{depth:.025,bevelEnabled:false,curveSegments:24}),alloy,sleeve,0,0,-.026);
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4;
  const key=box(.011,.012,.025,.045*Math.cos(a),.045*Math.sin(a),.016,gold,sleeve);
  key.rotation.z=a;
 }
 rounded(.104,.055,.066,.011,housing,driveline,motorX-.14,axleY+.014,.14);
 rod([motorX-.09,axleY+.014,.14],[motorX-.042,axleY,.132],.009,machined,driveline);
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4+Math.PI/8;
  const dog=box(.011,.012,.014,.045*Math.cos(a),.045*Math.sin(a),.174,gold,drivenHub);dog.rotation.z=a;
 }
 const pulleyZ=vehicleLayout.pulley.z, smallR=parameters.transmission.smallRadiusMm/1000, largeR=parameters.transmission.largeRadiusMm/1000;
 function annulus(outer,inner,depth){const shape=new T.Shape();shape.absarc(0,0,outer,0,Math.PI*2,false);const hole=new T.Path();hole.absarc(0,0,inner,0,Math.PI*2,true);shape.holes.push(hole);const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:40});g.translate(0,0,-depth/2);return g;}
 function pulley(x,r,count){
  const g=node(diffGroup,x,axleY,pulleyZ);
  const bore=x===motorX?vehicleLayout.pulley.boreSmall:vehicleLayout.pulley.boreLarge;
  mesh(annulus(r-.004,bore,.042),alloy,g);
  for(const z of [-.021,.021])mesh(annulus(r+.004,bore,.008),machined,g,0,0,z);
  instances(unitBox,housing,g,Array.from({length:count},(_,i)=>{const a=i*2*Math.PI/count;return {p:[r*Math.cos(a),r*Math.sin(a),0],s:[.010,.006,.033],r:[0,0,a]};}));
  for(let i=0;i<5;i++){
   const a=i*2*Math.PI/5;
   shaft(.58*r*Math.cos(a),.58*r*Math.sin(a),.024,.031,.008,dark,g);
  }
  return g;
 }
 mesh(annulus(.036,.018,.081),machined,diffGroup,axleX,axleY,.1965);
 const smallPulley=pulley(motorX,smallR,parameters.transmission.smallTeeth),largePulley=pulley(axleX,largeR,parameters.transmission.largeTeeth);
 const beltShape=new T.Shape(), inset=new T.Path();
 function beltOutline(path,delta){
  const a=smallR+delta,b=largeR+delta;
  const tangent=Math.acos((a-b)/(axleX-motorX));
  path.moveTo(motorX+a*Math.cos(tangent),axleY+a*Math.sin(tangent));
  path.absarc(motorX,axleY,a,tangent,2*Math.PI-tangent,false);
  path.lineTo(axleX+b*Math.cos(tangent),axleY-b*Math.sin(tangent));
  path.absarc(axleX,axleY,b,-tangent,tangent,false);
  path.closePath();
 }
 beltOutline(beltShape,.009);beltOutline(inset,.002);beltShape.holes.push(inset);
 const belt=mesh(new T.ExtrudeGeometry(beltShape,{depth:.034,bevelEnabled:false,curveSegments:24}),beltMaterial,diffGroup,0,0,pulleyZ-.017);
 const beltPath=new T.Shape();beltOutline(beltPath,.005);const beltCurve=new T.CurvePath();beltCurve.curves=beltPath.curves;const beltLength=beltCurve.getLength();
 const beltMarks=new T.InstancedMesh(new T.BoxGeometry(.006,.005,.036),gold,72);beltMarks.frustumCulled=false;diffGroup.add(beltMarks);
 const guardMat=new T.MeshPhysicalMaterial({color:0xc1ddde,transparent:true,opacity:.30,roughness:.28,side:T.DoubleSide,depthWrite:false});
 const guardShape=new T.Shape();beltOutline(guardShape,.023);
 const guard=mesh(new T.ExtrudeGeometry(guardShape,{depth:.064,bevelEnabled:false,curveSegments:24}),guardMat,diffGroup,0,0,pulleyZ-.032);
 guard.visible=false;
 for(const x of [.42,.58,.83,.94])for(const z of [-.10,.08]){
  box(.046,.018,.048,x,.165,z,alloy,driveline);
  rod([x,.16,z],[x,.212,z],.011,housing,driveline);
 }
 const bodyShell=createBodyShell(T,body);body.userData.part='shell';
 studio.apply(steel,'metal');studio.apply(machined,'metal');studio.apply(hubmat,'metal');studio.apply(anodized,'cast');studio.apply(housing,'cast');studio.apply(alloy,'metal');studio.apply(rubber,'rubber');
 addMechanicalDetails(T,{chassis,suspension,brakes,motorGroup,diffGroup,axleGroup,wheels,studio});
 sections.filter(s=>s.point).forEach(s=>{
  const b=document.createElement('button');b.className='marker';b.setAttribute('aria-controls','part-inspector');b.dataset.part=s.id;b.title=s.label;b.setAttribute('aria-label',s.label);b.onclick=()=>inspect(s.id,b);$('pins').append(b);pins.push({button:b,position:new T.Vector3(...s.point),id:s.id});
 });
 let hideWheels=false, cockpitView=false, rearView=false;
 function setMode(mode){
  bodyShell.release();
  cockpitView=false;rearView=false;pickMode=mode;frame.visible=mode==='frame';body.visible=mode==='body';wheels.visible=mode==='body'||!hideWheels; $('wheel-toggle').disabled=mode==='body';
  $('frame').setAttribute('aria-pressed',String(frame.visible));$('body').setAttribute('aria-pressed',String(body.visible));
  if(mode==='body')select('shell');else select('frame');
  refreshDrive();
 }
 $('frame').onclick=()=>setMode('frame');$('body').onclick=()=>setMode('body');
 $('rear').onclick=()=>{if(pickMode==='body')setMode('frame');rearView=true;cockpitView=false;target.set(.73,.30,.02);az=1.06;el=.76;rad=1.78;select('diff');refreshDrive()};
 $('top').onclick=()=>{rearView=false;refreshDrive();cockpitView=false;target.set(0,.39,0);rad=4.5;el=1.52;az=-Math.PI/2;draw=true};
 $('cockpit').onclick=()=>{if(pickMode==='body')setMode('frame');rearView=false;refreshDrive();cockpitView=true;target.set(-.085,.48,.03);az=1.22;el=.71;rad=2.35;select('hmi');draw=true};
 $('wheel-toggle').onclick=()=>{hideWheels=!hideWheels;wheels.visible=!hideWheels;$('wheel-toggle').setAttribute('aria-pressed',String(hideWheels));$('wheel-toggle').textContent=hideWheels?'Tekerlekleri göster':'Tekerlekleri gizle';draw=true};
 $('reset').onclick=()=>{rearView=false;refreshDrive();cockpitView=false;target.set(0,.39,0);el=.50;az=-.88;rad=4.04;draw=true};
 redraw=()=>{draw=true};
 const partGroups={frame:chassis,motor:motorGroup,clutch:clutchGroup,diff:diffGroup,battery:batterySupport,seat,pc:computer,camera:nose,hmi:panel,suspension,brake:brakes,steering,drive:motorController,power:fire};
 const raycaster=new T.Raycaster();let downPoint=null;
 canvas.addEventListener('pointerdown',e=>{downPoint=[e.clientX,e.clientY]});
 canvas.addEventListener('pointerup',e=>{if(isHomeView()||!downPoint||Math.hypot(e.clientX-downPoint[0],e.clientY-downPoint[1])>5)return;
  const r=canvas.getBoundingClientRect();raycaster.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);
  const hit=raycaster.intersectObjects([frame,body,wheels],true).find(h=>{let n=h.object;while(n){if(!n.visible)return false;n=n.parent}return true});
  if(hit){let n=hit.object;while(n){if(n.userData.part){if(canInspect(n.userData.part))inspect(n.userData.part,canvas);break}n=n.parent}}
 });
 for(const [id,g] of Object.entries(partGroups))g.userData.part=id;
 axleGroup.userData.part='diff';
 const materialState=new Map();
 function registerMaterials(){
  for(const m of materialState.keys())if(!m.parent)materialState.delete(m);
  for(const root of [frame,body,wheels])root.traverse(m=>{if(m.isMesh&&!materialState.has(m)){m.material=m.material.clone();const mat=m.material;materialState.set(m,{color:mat.color.clone(),emissive:mat.emissive?.clone(),opacity:mat.opacity,transparent:mat.transparent,depthWrite:mat.depthWrite,roughness:mat.roughness});}});
 }
 registerMaterials();
 let focusContext=null,focusIds=new Set(),isolation=true;
 function owner(m){let node=m;while(node){if(node.userData.part)return node.userData.part;node=node.parent}return 'frame';}
 function updateHighlight(){
  const dimOpacity=mechanicalSystem()?.075:.16;
  for(const [m,base] of materialState){const mat=m.material;const id=owner(m),dim=focusContext&&isolation&&!focusIds.has(id)&&id!==chosen;mat.color.copy(base.color);mat.opacity=dim?dimOpacity:base.opacity;mat.transparent=dim||base.transparent;mat.depthWrite=dim?false:base.depthWrite;mat.roughness=base.roughness;
   if(mat.emissive)mat.emissive.copy(base.emissive||new T.Color(0)).add(new T.Color(id===chosen?0x332305:focusIds.has(id)?0x100b02:0));if(m.userData.brakeColor && (focusContext==='braking'||chosen==='brake')) {
    mat.color.setHex(m.userData.brakeColor);
    mat.emissive?.setHex(m.userData.brakeColor).multiplyScalar(.3);
   }
   mat.needsUpdate=true;
  }
 }
 refreshSelectionMaterials=()=>{registerMaterials();updateHighlight();};
 wheels.userData.part='suspension';
 onSelect=id=>{updateHighlight();$('scene-focus-label').textContent=(sections.find(s=>s.id===id)?.label||'GENEL GÖRÜNÜM').toLocaleUpperCase('tr');
  const info=sections.find(x=>x.id===id);
  if(info?.point&&id!=='frame'){
   focusGoal=new T.Vector3(...info.point);
   rad=mechanicalSystem()?3.65:['motor','clutch','diff'].includes(id)?1.85:3.2;
  }
  draw=true;
 };
 $('bottom').onclick=()=>{focusGoal=null;rearView=false;target.set(0,.35,0);el=-1.45;rad=4.5;draw=true};
 $('explode').onclick=()=>{exploded=!exploded;$('explode').setAttribute('aria-pressed',String(exploded));draw=true};
 $('battery-toggle').onclick=()=>{batteryHidden=!batteryHidden;$('battery-toggle').setAttribute('aria-pressed',String(batteryHidden));refreshDrive()};
 $('engage').onclick=()=>{
  if(mechanicalSystem()?.id!=='transmission')return;
  engaged=!engaged;refreshDrive();select(chosen);
 };
 $('play').onclick=()=>{playing=!playing;$('play').setAttribute('aria-pressed',String(playing));playLabel.textContent=playing?'Duraklat':'Canlandır';draw=true};
 $('quality').onchange=e=>studio.quality(e.target.value);
 $('shadows').onchange=e=>studio.setShadows(e.target.checked);
 studio.quality('auto');
 const originalReset=$('reset').onclick;$('reset').onclick=()=>{cameraMotion.cancel();focusContext=null;focusIds.clear();brakeFlow=false;isolation=true;updateHighlight();document.getElementById('brake-flow')?.setAttribute('aria-pressed','false');document.getElementById('system-isolate')?.setAttribute('aria-pressed','false');exploded=false;batteryHidden=false;playing=false;demoEnd=0;engaged=true;guardVisible=false;hideWheels=false;wheels.visible=true;setMode('frame');focusGoal=null;originalReset();$('explode').setAttribute('aria-pressed','false');$('battery-toggle').setAttribute('aria-pressed','false');$('wheel-toggle').setAttribute('aria-pressed','false');$('wheel-toggle').textContent='Tekerlekleri gizle';$('engage').setAttribute('aria-pressed','true');$('engage').textContent='Bağlı';$('play').setAttribute('aria-pressed','false');playLabel.textContent='Canlandır';refreshDrive();
  const entry=mechanicalSystem();
  if(entry){
   focusSystem(entry.focus,entry.parts);
   $('system-isolate')?.setAttribute('aria-pressed','true');
  }
 };
 for(const id of ['rear','top','cockpit']){const old=$(id).onclick;$(id).onclick=()=>{old();focusGoal=null;draw=true};}
 const pointers=new Map();let pinch=0;
 const notifyInspection=()=>{if(isHomeView())canvas.dispatchEvent(new Event('vaccino:home-inspect'));};
 canvas.addEventListener('pointerdown',e=>{
  cameraMotion.cancel();canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,started:false});
 });
 const dist=()=>{const [a,b]=[...pointers.values()];return Math.hypot(a.x-b.x,a.y-b.y)};
 canvas.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId))return;
  const pointer=pointers.get(e.pointerId);
  const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;
  if(pointers.size===1){
   if(!pointer.started){
    const verticalTouch=e.pointerType==='touch'&&Math.abs(dy)>Math.abs(dx);
    if(verticalTouch&&(isHomeView()||mechanicalSystem()))return;
    if(isHomeView()&&Math.hypot(dx,dy)<8)return;
   }
   if(!pointer.started)notifyInspection();
   pointer.started=true;
   az-=dx*.009;el=Math.max(-1.54,Math.min(1.54,el+dy*.009));
  }
  pointer.x=e.clientX;pointer.y=e.clientY;
  if(pointers.size===2){
   const d=dist();
   if(pinch&&d){rad=Math.max(rearView?1.1:2.35,Math.min(8.5,rad*pinch/d));notifyInspection();}
   pinch=d;
  }
  draw=true;
 });
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(ev,e=>{pointers.delete(e.pointerId);pinch=0});
 canvas.addEventListener('wheel',e=>{cameraMotion.cancel();e.preventDefault();notifyInspection();rad=Math.max(rearView?1.1:2.35,Math.min(8.5,rad*Math.exp(e.deltaY*.001)));draw=true},{passive:false});
 canvas.addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key))return;
  cameraMotion.cancel();e.preventDefault();notifyInspection();if(e.key==='ArrowLeft')az+=.15;if(e.key==='ArrowRight')az-=.15;
  if(e.key==='ArrowUp')el=Math.min(1.54,el+.12);if(e.key==='ArrowDown')el=Math.max(-1.54,el-.12);
  if(e.key==='+')rad=Math.max(rearView?1.1:2.35,rad*.9);if(e.key==='-')rad=Math.min(8.5,rad*1.1);draw=true;
 });
 new ResizeObserver(()=>{draw=true}).observe($('stage'));
 document.addEventListener('vaccino:resize',()=>{draw=true});
 let renderWidth=0,renderHeight=0;
 function loop(now){
  requestAnimationFrame(loop);
  if(document.hidden||$('viewer').hidden||canvas.clientWidth<2||canvas.clientHeight<2){lastNow=now;return;}
  if(cameraMotion.tick(now))draw=true;
  const sleeveEnd=engaged?.145:.105;if(Math.abs(sleeve.position.z-sleeveEnd)>.0001){sleeve.position.z=T.MathUtils.lerp(sleeve.position.z,sleeveEnd,.18);draw=true;}
  const dt=Math.min(.05,lastNow?(now-lastNow)/1000:0);lastNow=now;
  scene.background=sceneBackground;
  if(world.update(dt))draw=true;
  const inHome=isHomeView();
  const inStudio=!experienceState.active||experienceState.environment==='showroom'||document.body.classList.contains('presentation-active');
  studioFloor.visible=inStudio&&!inHome;
  homeLights.visible=inHome;
  ambient.visible=sun.visible=fill.visible=!inHome;
  render.toneMappingExposure=inHome?.90:1.05;
  if(inHome)scene.background=null;
  else if(inStudio)sceneBackground.setHex(0x100f0e);
  const showFlow=brakeFlow&&focusContext==='braking';
  for(const [index,marker] of brakeMarkers.entries()) {
   if(marker.visible!==showFlow) draw=true;
   marker.visible=showFlow;
   if(showFlow) {
    const phase=reducedMotion.matches?.55:(now/1400+index*.13)%1;
    brakeLines[index].curve.getPoint(phase,marker.position);
    if(!reducedMotion.matches)draw=true;
   }
  }
  if(bodyShell.tick(dt,!inHome&&experienceState.hatchOpen&&!document.body.classList.contains('presentation-active')))draw=true;
  if(focusGoal){target.lerp(focusGoal,.12);if(target.distanceTo(focusGoal)<.001)focusGoal=null;draw=true;}
  const destination=exploded?1:0;
  for(const [g,v] of [[motorGroup,[0,.20,-.22]],[clutchGroup,[0,.10,.16]],[diffGroup,[.14,0,.30]],[axleGroup,[0,-.10,0]]]){
   const end=new T.Vector3(...v).multiplyScalar(destination);if(g.position.distanceTo(end)>.0001){g.position.lerp(end,.12);draw=true;}
  }
  if(experienceState.active&&experienceState.environment==='track'&&!document.body.classList.contains('presentation-active')){
   const next=simulation.state.distance/.269,delta=next-wheelSpin;wheelSpin=next;for(const w of rollers)w.wheel.rotation.z=wheelSpin;largePulley.rotation.z=wheelSpin;smallPulley.rotation.z=wheelSpin*largeR/smallR;carrier.rotation.z=wheelSpin;drivenHub.rotation.z=smallPulley.rotation.z;for(const a of axleWitnesses)a.rotation.z=wheelSpin;for(const a of axleGroup.children)if(a.geometry?.type==='CylinderGeometry')a.rotateY(delta);if(engaged){rotor.rotation.z=smallPulley.rotation.z;sleeve.rotation.z=rotor.rotation.z;}if(Math.abs(delta)>.000001)draw=true;
  }else if(playing||now<demoEnd){wheelSpin+=dt*2;for(const w of rollers)w.wheel.rotation.z=wheelSpin;largePulley.rotation.z=wheelSpin;smallPulley.rotation.z=wheelSpin*largeR/smallR;axleGroup.rotation.z=0;for(const a of axleGroup.children){if(a.geometry?.type==='CylinderGeometry')a.rotateY(dt*2);}carrier.rotation.z=wheelSpin;for(const a of axleWitnesses)a.rotation.z=wheelSpin;drivenHub.rotation.z=smallPulley.rotation.z;if(engaged){rotor.rotation.z=smallPulley.rotation.z;sleeve.rotation.z=rotor.rotation.z;}draw=true}else if(beltMaterial.color.getHex()!==0x292b30){beltMaterial.color.setHex(0x292b30);draw=true}
  if(!draw)return;draw=false;
  for(let i=0;i<72;i++){const u=((i/72-wheelSpin*largeR/beltLength)%1+1)%1;const p=beltCurve.getPointAt(u),t=beltCurve.getTangentAt(u);scratch.position.set(p.x,p.y,pulleyZ);scratch.rotation.set(0,0,Math.atan2(t.y,t.x));scratch.scale.set(1,1,1);scratch.updateMatrix();beltMarks.setMatrixAt(i,scratch.matrix);}beltMarks.instanceMatrix.needsUpdate=true;
  const w=canvas.clientWidth,h=canvas.clientHeight;
  if(renderWidth!==w||renderHeight!==h){render.setSize(w,h,false);renderWidth=w;renderHeight=h;}camera.aspect=w/h;
  const fit=inHome?Math.max(.86,1.08/camera.aspect):Math.max(1,(document.body.classList.contains('presentation-active')?.95:rearView?.91:1.13)/camera.aspect);
  if(!world.camera(camera,target,az,el,rad,fit)){camera.position.set(target.x+fit*rad*Math.cos(el)*Math.sin(az),target.y+fit*rad*Math.sin(el),target.z+fit*rad*Math.cos(el)*Math.cos(az));camera.lookAt(target);}camera.updateProjectionMatrix();render.render(scene,camera);
  for(const p of pins){
   const v=p.position.clone().applyMatrix4(vehicleRoot.matrixWorld).project(camera);
   p.button.hidden=!canInspect(p.id)||cockpitView||(rearView&&!['motor','clutch','diff','drive'].includes(p.id))||(pickMode==='body'&&p.id!=='camera')||Math.abs(v.x)>.97||Math.abs(v.y)>.97;
   p.button.style.left=(v.x+1)*w/2+'px';
   p.button.style.top=(1-v.y)*h/2+'px';
  }
 }
 refreshDrive=()=>{simulation.coupled=engaged;if(engaged){rotor.rotation.z=smallPulley.rotation.z;sleeve.rotation.z=smallPulley.rotation.z;}$('engage').setAttribute('aria-pressed',String(engaged));$('engage').textContent=engaged?'Bağlı':'Süzülme';batterySupport.visible=!batteryHidden&&(!rearView||chosen==="battery");fire.visible=!rearView; sleeve.position.z=T.MathUtils.lerp(sleeve.position.z,engaged?.145:.105,.25);guard.visible=guardVisible;const state=$('drive-state');state.hidden=mechanicalSystem()?.id!=='transmission';state.textContent=engaged?'BAĞLI · Motor ve akslar':'AYRIK · Akslar dönmeye devam eder';redraw()};
 function clearFocus(wide=false){brakeFlow=false;cameraMotion.cancel();focusContext=null;focusIds.clear();isolation=true;updateHighlight();if(wide){$('reset').click();focusGoal=null;rearView=false;cockpitView=false;resetHomeView();$('scene-focus-label').textContent='GENEL GÖRÜNÜM';refreshDrive();}draw=true;}
 function focusSystem(name,parts){
  brakeFlow=false;
  const map={braking:{ids:['brake'],part:'brake'},transmission:{ids:['motor','clutch','diff'],part:'motor',camera:'rear'},suspension:{ids:['suspension','brake'],part:'suspension'},chassis:{ids:['frame','seat','steering','hmi'],part:'frame'},battery:{ids:['battery'],part:'battery'},control:{ids:['drive'],part:'drive'},auxiliary:{ids:['pc','power','hmi'],part:'pc'},sensors:{ids:['camera','pc'],part:'camera'}};
  const spec=map[name];if(!spec)return;focusContext=name;focusIds=new Set(parts??spec.ids);isolation=true;
  if(pickMode==='body')setMode('frame');
  rearView=false;cockpitView=false;
  if(parts&&mechanicalSystem()){
   const poses={
    transmission:{az:1.04,el:.44,rad:3.65,target:[.27,.34,0]},
    braking:{az:-.85,el:.56,rad:3.65,target:[0,.30,0]},
    suspension:{az:-.74,el:.41,rad:3.65,target:[-.14,.32,0]},
    chassis:{az:-.88,el:.50,rad:3.65,target:[0,.39,0]}
   };
   select(spec.part);
   writePose(poses[name]);
   refreshDrive();updateHighlight();return;
  }
  if(spec.camera==='rear'){$('rear').click();}
  else if(name==='chassis'){focusGoal=null;target.set(0,.39,0);az=-.88;el=.50;rad=4.04;}
  else{az=name==='braking'?-.76:name==='sensors'?-1.35:.85;el=.65;}
  if(name==='battery'){batteryHidden=false;$('battery-toggle').setAttribute('aria-pressed','false');}
  select(spec.part);if(name==='braking'){focusGoal=new T.Vector3(-.07,.23,0);rad=3.55;}if(name==='battery')rad=2.25;if(name==='sensors')rad=2.5;refreshDrive();updateHighlight();draw=true;
 }

 function captureView(){return {pose:readPose(),chosen,pickMode,hideWheels,batteryHidden,guardVisible,exploded,engaged,playing,wheelSpin,brakeFlow,focusContext,focusedParts:[...focusIds],isolation,rearView,cockpitView,rotor:rotor.rotation.z};}
 function syncControls(){
  $('frame').setAttribute('aria-pressed',String(frame.visible));$('body').setAttribute('aria-pressed',String(body.visible));$('wheel-toggle').disabled=pickMode==='body';
  $('wheel-toggle').setAttribute('aria-pressed',String(hideWheels));$('wheel-toggle').textContent=hideWheels?'Tekerlekleri göster':'Tekerlekleri gizle';
  $('battery-toggle').setAttribute('aria-pressed',String(batteryHidden));$('explode').setAttribute('aria-pressed',String(exploded));$('play').setAttribute('aria-pressed',String(playing));playLabel.textContent=playing?'Duraklat':'Canlandır';
 }
 function restoreView(view){
  world.setPresentation(false);if(experienceState.active)bodyShell.style(workspaceState.route==='overview'?'solid':experienceState.bodyMode);
  cameraMotion.cancel();pickMode=view.pickMode;hideWheels=view.hideWheels;batteryHidden=view.batteryHidden;guardVisible=view.guardVisible;exploded=view.exploded;engaged=view.engaged;playing=view.playing;wheelSpin=view.wheelSpin;brakeFlow=view.brakeFlow;focusContext=view.focusContext;focusIds=new Set(view.focusedParts);isolation=view.isolation;rearView=view.rearView;cockpitView=view.cockpitView;
  frame.visible=pickMode==='frame';body.visible=pickMode==='body';wheels.visible=pickMode==='body'||!hideWheels;
  for(const w of rollers)w.wheel.rotation.z=wheelSpin;largePulley.rotation.z=wheelSpin;smallPulley.rotation.z=wheelSpin*largeR/smallR;carrier.rotation.z=wheelSpin;for(const a of axleWitnesses)a.rotation.z=wheelSpin;
  select(view.chosen);writePose(view.pose);rotor.rotation.z=view.rotor;demoEnd=0;syncControls();updateHighlight();refreshDrive();draw=true;
 }
 function presentScene(spec){
  world.setPresentation(true);bodyShell.release();body.visible=false;
  const previousPose=readPose();demoEnd=0;playing=false;engaged=true;exploded=false;hideWheels=false;batteryHidden=false;guardVisible=false;pickMode='frame';frame.visible=true;body.visible=false;wheels.visible=true;
  if(spec.focus)focusSystem(spec.focus);else{clearFocus();select('frame');rearView=false;cockpitView=false;}
  syncControls();refreshDrive();writePose(previousPose);cameraMotion.moveTo(spec.camera,950);draw=true;
 }
 let transmissionActive=mechanicalSystem()?.id==='transmission';
 document.addEventListener('vaccino:route',()=>{
  const entry=mechanicalSystem();
  const active=entry?.id==='transmission';
  if(!active&&(transmissionActive||entry)){
   setAnimating(false);
   if(exploded)$('explode').click();
   engaged=true;refreshDrive();
  }
  transmissionActive=active;
 });
 function setAnimating(value){if(playing!==!!value)$('play').click();demoEnd=0;}
 function setEngaged(value){const pose=readPose();engaged=!!value;select(chosen);writePose(pose);refreshDrive();}
 function setQuality(value){$('quality').value=value;studio.quality(value);}
 function setShadows(value){$('shadows').checked=!!value;studio.setShadows(value);}
 function setShell(mode){cameraMotion.cancel();pickMode='frame';frame.visible=true;bodyShell.style(mode,{immediate:isHomeView()});draw=true;}
 function moveCamera(pose){cameraMotion.moveTo(pose,800);draw=true;}

 select('frame');focusGoal=null;rad=4.04;refreshDrive();document.body.dataset.webgl='ready';window.vaccino={state:()=>({shell:bodyShell.state(),world:world.state(),graphics:studio.status(),brakeFlow,cameraTransition:cameraMotion.active,layoutChecks:checkVisualEnvelopes(),focusContext,isolation,focusedParts:[...focusIds],engaged,playing,exploded,batteryHidden,hideWheels,wheelSpin,chosen,camera:{az,el,rad,target:target.toArray()},visible:{body:body.visible,frame:frame.visible,battery:batterySupport.visible,guard:guard.visible,wheels:wheels.visible},explodePosition:motorGroup.position.toArray(),rotor:rotor.rotation.z,carrier:carrier.rotation.z,sleeve:sleeve.position.z,small:smallPulley.rotation.z,large:largePulley.rotation.z,meshes:render.info.render.calls}),setStudioPose(pose,duration){cameraMotion.moveTo(pose,duration);},resetHomeView,toggleBrakeFlow(){if(focusContext!=='braking')focusSystem('braking',mechanicalSystem()?.parts);brakeFlow=!brakeFlow;draw=true;return brakeFlow;},setShell,moveCamera,experienceState:()=>world.state(),shellState:()=>bodyShell.state(),captureView,restoreView,presentScene,setAnimating,setEngaged,setQuality,setShadows,select,inspect,focusSystem,clearFocus,isolate:enabled=>{isolation=enabled;updateHighlight();draw=true;}};requestAnimationFrame(loop);
}catch(e){document.querySelector('.part-library').open=true;$('fallback').hidden=false;document.body.dataset.webgl='failed';console.error(e)}
