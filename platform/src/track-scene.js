import {demoTrack,trackLength,trackPose,sampleTrack} from './track-geometry.js';
export function createTrackScene(T){
 const root=new T.Group();root.name='demo-track-only';
 const grass=new T.Mesh(new T.PlaneGeometry(180,120),new T.MeshStandardMaterial({color:0x62715a,roughness:1}));grass.rotation.x=-Math.PI/2;grass.position.y=-.025;root.add(grass);
 const points=sampleTrack(),vertices=[],indices=[];
 for(const p of points){const nx=-p.tz,nz=p.tx;for(const sign of [-1,1])vertices.push(p.x+nx*demoTrack.width/2*sign,0,p.z+nz*demoTrack.width/2*sign);}
 for(let i=0;i<points.length-1;i++){const a=2*i;indices.push(a,a+2,a+1,a+2,a+3,a+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();root.add(new T.Mesh(g,new T.MeshStandardMaterial({color:0x3d4447,roughness:.95,side:T.DoubleSide})));
 function batch(geometry,material,count,place){const m=new T.InstancedMesh(geometry,material,count),o=new T.Object3D();for(let i=0;i<count;i++){place(o,i);o.updateMatrix();m.setMatrixAt(i,o.matrix);}root.add(m);return m;}
 const dashCount=Math.floor(trackLength()/3);batch(new T.BoxGeometry(1.1,.008,.055),new T.MeshStandardMaterial({color:0xdbd8c8}),dashCount,(o,i)=>{const p=trackPose(i*3);o.position.set(p.x,.007,p.z);o.rotation.y=-Math.atan2(p.tz,p.tx);});
 for(const color of [0xf3f0df,0x202625])batch(new T.BoxGeometry(.45,.012,.5),new T.MeshStandardMaterial({color}),10,(o,i)=>{o.position.set(-30+(i%2)*.45,.014,-17.25+Math.floor(i/2)+((color===0x202625)?.5:0));});
 const poleMat=new T.MeshStandardMaterial({color:0x50595c,metalness:.5,roughness:.5});
 for(const z of [-18.5,-11.5]){const pole=new T.Mesh(new T.CylinderGeometry(.06,.06,3,12),poleMat);pole.position.set(-29,1.5,z);root.add(pole);}
 const beam=new T.Mesh(new T.BoxGeometry(.15,.15,7.2),poleMat);beam.position.set(-29,3,-15);root.add(beam);
 const lamps=[];for(let i=0;i<3;i++){const m=new T.Mesh(new T.SphereGeometry(.16,14,10),new T.MeshStandardMaterial({color:0x761d1d,emissive:0x761d1d}));m.position.set(-29.15,2.8,-15+(i-1)*.55);root.add(m);lamps.push(m);}
 return {root,update(state){lamps.forEach((lamp,i)=>{const green=state.status==='running'||state.status==='finished',red=state.status==='countdown'&&state.countdown<=3-i;const c=green?0x66c377:red?0xe74c3c:state.status==='paused'?0xb78d32:0x542b2b;lamp.material.color.setHex(c);lamp.material.emissive.setHex(c);});},pose:trackPose};
}
