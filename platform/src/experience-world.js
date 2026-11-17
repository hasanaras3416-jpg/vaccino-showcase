import {experienceState,simulation} from './animation-state.js';
import {createWorkshopScene} from './workshop-scene.js';
import {createTrackScene} from './track-scene.js';
export function createExperienceWorld(T,scene,vehicleRoot){
 let workshop=null,track=null,presentation=false;const target=new T.Vector3(),position=new T.Vector3();
 function update(dt){const active=experienceState.active&&!presentation,env=active?experienceState.environment:'showroom';let moving=false;
  if(env==='workshop'&&!workshop){workshop=createWorkshopScene(T);scene.add(workshop.root);}
  if(env==='track'&&!track){track=createTrackScene(T);scene.add(track.root);}
  if(workshop)workshop.root.visible=env==='workshop';if(track)track.root.visible=env==='track';
  scene.background.setHex(env==='workshop'?0x30393e:env==='track'?0xc6cfc6:0xf4f2ec);
  if(env==='workshop'){const end=experienceState.liftRaised?1.15:0;if(Math.abs(experienceState.lift-end)>.001){experienceState.lift+=(end-experienceState.lift)*(1-Math.exp(-2.3*dt));moving=true;}vehicleRoot.position.set(0,workshop.update(experienceState.lift),0);vehicleRoot.rotation.y=0;}
  else if(env==='track'){const s=simulation.snapshot(),p=track.pose(s.distance);vehicleRoot.position.set(p.x,0,p.z);vehicleRoot.rotation.y=p.yaw;track.update(s);moving=['running','countdown'].includes(s.status);}
  else{vehicleRoot.position.set(0,0,0);vehicleRoot.rotation.y=0;}
  return moving;
 }
 function camera(camera,baseTarget,az,el,rad,fit){if(!experienceState.active||presentation)return false;
  if(experienceState.environment==='workshop'){target.copy(baseTarget).add(new T.Vector3(0,.13+experienceState.lift,0));camera.position.set(target.x+fit*rad*Math.cos(el)*Math.sin(az),target.y+fit*rad*Math.sin(el),target.z+fit*rad*Math.cos(el)*Math.cos(az));camera.lookAt(target);return true;}
  if(experienceState.environment!=='track')return false;const p=track.pose(simulation.state.distance);target.set(p.x,.45,p.z);
  if(experienceState.camera==='top')position.set(p.x,23,p.z+.01);
  else if(experienceState.camera==='road')position.set(-21,2.4,-23);
  else if(experienceState.camera==='cockpit'){position.set(p.x-p.tx*.08,.76,p.z-p.tz*.08);target.set(p.x+p.tx*8,.72,p.z+p.tz*8);}
  else position.set(p.x-p.tx*5.2,2.5,p.z-p.tz*5.2);
  camera.position.copy(position);camera.lookAt(target);return true;
 }
 return {update,camera,setPresentation(value){presentation=value;},state:()=>({environment:presentation?'showroom':experienceState.environment,active:experienceState.active,presentation,lift:experienceState.lift,rootY:vehicleRoot.position.y,rootPosition:vehicleRoot.position.toArray(),yaw:vehicleRoot.rotation.y,platformY:workshop?.state().platformY??null,workshopVisible:workshop?.root.visible??false,trackVisible:track?.root.visible??false,visibleScenes:1,loadedScenes:1+Number(!!workshop)+Number(!!track)})};
}
