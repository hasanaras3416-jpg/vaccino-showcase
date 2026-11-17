export function createWorkshopScene(T){
 const root=new T.Group(),platform=new T.Group();root.add(platform);
 const metal=new T.MeshStandardMaterial({color:0x59656a,metalness:.65,roughness:.55}),gold=new T.MeshStandardMaterial({color:0xba903b,metalness:.35,roughness:.6}),floor=new T.MeshStandardMaterial({color:0x394146,roughness:.95});
 function box(w,h,d,x,y,z,mat,parent=root){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);parent.add(m);return m;}
 box(22,.08,18,0,-.06,0,floor);const grid=new T.GridHelper(20,40,0x667077,0x475158);grid.position.y=-.015;root.add(grid);
 for(const z of [-.66,.66]){box(3.4,.12,.34,0,-.06,z,metal,platform);for(const edge of [-.81,-.51])box(3.4,.016,.035,0,.008,Math.sign(z)*Math.abs(edge),gold,platform);}
 for(const x of [-1.50,1.50])box(.09,.10,1.85,x,-.07,0,metal,platform);
 const posts=[];for(const x of [-1.3,1.3])for(const z of [-.73,.73]){box(.26,.08,.26,x,.04,z,gold);const post=box(.115,1,.115,x,.5,z,metal);posts.push(post);}
 for(const x of [-5,4]){box(1.3,1.5,.55,x,.75,3.2,metal);for(let i=0;i<5;i++)box(1.18,.025,.03,x,.24+i*.25,2.91,gold);}
 box(8,.12,.65,0,3.5,0,new T.MeshStandardMaterial({color:0xe6e2cf,emissive:0xb6c5be,emissiveIntensity:1}));
 for(const x of [-4,4]){const light=new T.PointLight(0xf2ead9,12,12,2);light.position.set(x,3,2);root.add(light);}
 return {root,update(lift){const y=.13+lift;platform.position.y=y;for(const p of posts){p.scale.y=Math.max(.1,y-.08);p.position.y=(y+.08)/2;}return y;},state:()=>({platformY:platform.position.y,supports:posts.length})};
}
