// DEMO stadium, metres. No real circuit geometry or surveyed data was supplied.
export const demoTrack=Object.freeze({id:'demo-stadium-v1',name:'DEMO PARKUR · gerçek pist değildir',straight:60,radius:15,width:5});
export function trackLength(track=demoTrack){return 2*track.straight+2*Math.PI*track.radius;}
export function trackPose(distance,track=demoTrack){
 const a=track.straight,r=track.radius,L=trackLength(track);let s=((distance%L)+L)%L,x,z,tx,tz;
 if(s<a){x=-a/2+s;z=-r;tx=1;tz=0;}
 else if((s-=a)<Math.PI*r){const t=-Math.PI/2+s/r;x=a/2+r*Math.cos(t);z=r*Math.sin(t);tx=-Math.sin(t);tz=Math.cos(t);}
 else if((s-=Math.PI*r)<a){x=a/2-s;z=r;tx=-1;tz=0;}
 else{const t=Math.PI/2+(s-a)/r;x=-a/2+r*Math.cos(t);z=r*Math.sin(t);tx=-Math.sin(t);tz=Math.cos(t);}
 return {x,z,tx,tz,yaw:Math.atan2(tz,-tx)};
}
export function sampleTrack(count=240,track=demoTrack){return Array.from({length:count+1},(_,i)=>trackPose(i/count*trackLength(track),track));}
