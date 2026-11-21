// Concept geometry and presentation timing. This does not model torque or assembly.
import {vehicleLayout} from './vehicle-layout.js';

export function createHubMotor(T,rightWheel) {
  const motor=new T.Group();
  motor.userData.drivetrainPart='hub-motor';
  motor.visible=false;
  rightWheel.add(motor);

  const graphite=new T.MeshStandardMaterial({color:0x313a40,metalness:.60,roughness:.38});
  const alloy=new T.MeshStandardMaterial({color:0x9aa8ae,metalness:.72,roughness:.29});
  const brass=new T.MeshStandardMaterial({color:0xcbb98b,metalness:.65,roughness:.32});
  function cylinder(radius,depth,z,material){
    const piece=new T.Mesh(new T.CylinderGeometry(radius,radius,depth,32),material);
    piece.rotation.x=Math.PI/2;
    piece.position.z=z;
    motor.add(piece);
    return piece;
  }
  cylinder(.141,.092,0,graphite);
  cylinder(.126,.012,.045,alloy);
  cylinder(.129,.014,-.040,alloy);
  cylinder(.061,.016,.058,graphite);
  const ring=new T.Mesh(new T.TorusGeometry(.122,.008,8,40),brass);
  ring.position.z=.052;
  motor.add(ring);
  const innerRing=ring.clone();
  innerRing.position.z=-.050;
  motor.add(innerRing);
  for(let i=0;i<8;i++){
    const angle=i*Math.PI/4;
    const fastener=cylinder(.008,.012,.056,brass);
    fastener.position.x=.098*Math.cos(angle);
    fastener.position.y=.098*Math.sin(angle);
  }
  return motor;
}

export function createDrivetrainTransition(T,{central,hub,batteryPack,batteryMount,rightWheel,onFrame,onSettled}){
  const centralMeshes=new Set(),hubMeshes=new Set(),tireMeshes=new Set();
  for(const root of [central,batteryMount])root.traverse(mesh=>{if(mesh.isMesh)centralMeshes.add(mesh);});
  hub.traverse(mesh=>{if(mesh.isMesh)hubMeshes.add(mesh);});
  rightWheel.traverse(mesh=>{if(mesh.isMesh&&!hubMeshes.has(mesh))tireMeshes.add(mesh);});
  const meshes=[...centralMeshes,...hubMeshes,...tireMeshes];
  const stockBattery=new T.Vector3(...vehicleLayout.battery.position);
  const alternateBattery=new T.Vector3(...vehicleLayout.hub.batteryPosition);
  let blend=0,motion=null,centralOpacity=1,hubOpacity=0;
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');

  function apply(value){
    blend=value;
    centralOpacity=1-T.MathUtils.smoothstep(blend,0,.63);
    hubOpacity=T.MathUtils.smoothstep(blend,.40,1);
    central.visible=batteryMount.visible=centralOpacity>.001;
    hub.visible=hubOpacity>.001;
    batteryPack.position.lerpVectors(stockBattery,alternateBattery,blend);
    onFrame(meshes);
  }
  return {
    set(useHub,{immediate=false}={}){
      const end=useHub?1:0;
      if(immediate||reducedMotion.matches||Math.abs(end-blend)<.001){
        motion=null;apply(end);onSettled();
      }else motion={start:blend,end,lastFrame:null,elapsed:0,duration:760*Math.abs(end-blend)};
    },
    tick(now){
      if(!motion)return;
      // Keep visible steps even when shader compilation or a slow frame stalls rendering.
      motion.elapsed+=motion.lastFrame===null?0:Math.min(100,Math.max(0,now-motion.lastFrame));
      motion.lastFrame=now;
      const time=reducedMotion.matches?1:Math.min(1,motion.elapsed/motion.duration);
      apply(T.MathUtils.lerp(motion.start,motion.end,T.MathUtils.smootherstep(time,0,1)));
      if(time===1){motion=null;onSettled();}
    },
    opacity(mesh){
      if(centralMeshes.has(mesh))return centralOpacity;
      if(hubMeshes.has(mesh))return hubOpacity;
      if(tireMeshes.has(mesh))return 1-.77*hubOpacity;
      return 1;
    },
    get active(){return !!motion;},
    get blend(){return blend;}
  };
}
