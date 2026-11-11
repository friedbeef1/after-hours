// After Hours cosmetic layer. Receives collision geometry but never changes it.
import { add, group, rboxGeo, sphereGeo, cylGeo, canvasTexture, bake } from './gfx.js';
const T=window.THREE;
const cache=new Map(),texCache=new Map();
export function setupMaterials(renderer,scene){
 const env=new T.Scene();env.add(new T.Mesh(new T.SphereGeometry(20,24,16),new T.MeshBasicMaterial({color:0x8d9b9a,side:T.BackSide})));
 for(const [x,y,z,c,power] of [[0,12,0,0xf0dab9,2],[-10,4,-4,0x7296ac,1],[8,5,4,0xffc083,2]]){const m=new T.Mesh(new T.PlaneGeometry(8,8),new T.MeshBasicMaterial({color:c}));m.material.color.multiplyScalar(power);m.position.set(x,y,z);m.lookAt(0,0,0);env.add(m)}
 const generator=new T.PMREMGenerator(renderer);scene.environment=generator.fromScene(env,.06).texture;generator.dispose();env.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose()}});
}

export function cloth(color,kind='cloth') {
 const key=color+kind;if(cache.has(key))return cache.get(key);
 const tex=texCache.get(kind)||canvasTexture(256,256,(g)=>{
  let seed=13271;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  g.fillStyle='#ffffff';g.fillRect(0,0,256,256);
  if(kind==='paper'){for(let i=0;i<5000;i++){g.fillStyle=rnd()>.5?'#ffffff16':'#70654c0d';g.fillRect(rnd()*256,rnd()*256,1,1);}for(let y=0;y<256;y+=7){g.strokeStyle='#8d80681a';g.beginPath();g.moveTo(0,y);g.lineTo(256,y);g.stroke();}}else if(kind==='plastic'){for(let i=0;i<3000;i++){g.fillStyle=rnd()>.5?'#ffffff08':'#252e2905';g.fillRect(rnd()*256,rnd()*256,1,1);}}else if(kind==='wood'){
   for(let i=0;i<420;i++){const y=rnd()*256;g.strokeStyle=rnd()>.5?'#67472b30':'#fff1d438';g.lineWidth=.3+rnd()*.8;g.beginPath();g.moveTo(0,y);for(let x=0;x<=256;x+=8)g.lineTo(x,y+Math.sin(x/44+i)*2.4);g.stroke();}
  }else{
   for(let i=0;i<1800;i++){const x=rnd()*256,y=rnd()*256,r=.5+rnd()*3.5;g.fillStyle=rnd()>.5?'#ffffff05':'#303b3606';g.beginPath();g.ellipse(x,y,r,r*.65,0,0,7);g.fill();}
   for(let y=0;y<256;y+=3)for(let x=0;x<256;x+=3){g.strokeStyle=(x+y)%2?'#ffffff58':'#323b3740';g.beginPath();g.moveTo(x,y);g.lineTo(x+1,y+2);g.stroke();}
  }
 });texCache.set(kind,tex);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=1;tex.generateMipmaps=true;tex.minFilter=T.LinearMipmapLinearFilter;
 const m=new T.MeshStandardMaterial({color,map:tex,bumpMap:kind==='plastic'?null:tex,bumpScale:kind==='wood'?.012:.012,roughness:kind==='plastic'?.24:kind==='wood'?.48:.7,envMapIntensity:.55,metalness:0});cache.set(key,m);return m;
}
const softCache=new Map();
function softBox(w,h,d,r,force=false){
 const key=[w,h,d,r,force].join('|');if(softCache.has(key))return softCache.get(key);
 r=Math.min(r,w*.45,h*.45,d*.45);if(r<.03&&!force){const g=new T.BoxGeometry(w,h,d);const a=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv;for(let i=0;i<a.count;i++){const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i));if(nx>.5)u.setXY(i,a.getZ(i)/2,a.getY(i)/2);else if(ny>.5)u.setXY(i,a.getX(i)/2,a.getZ(i)/2);else u.setXY(i,a.getX(i)/2,a.getY(i)/2);}softCache.set(key,g);return g;}const g=new T.BoxGeometry(w,h,d,4,4,4),a=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,v=new T.Vector3(),q=new T.Vector3();
 for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i);for(const [axis,dim] of [['x',w],['y',h],['z',d]]){const u=v[axis]/(dim/2);if(Math.abs(u)<.99&&Math.abs(u)>.01)v[axis]=Math.sign(u)*(dim/2-r);}
 q.set(Math.max(-w/2+r,Math.min(w/2-r,v.x)),Math.max(-h/2+r,Math.min(h/2-r,v.y)),Math.max(-d/2+r,Math.min(d/2-r,v.z)));v.sub(q).normalize();n.setXYZ(i,v.x,v.y,v.z);v.multiplyScalar(r).add(q);a.setXYZ(i,v.x,v.y,v.z);const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i));if(nx>.5)uv.setXY(i,v.z/2,v.y/2);else if(ny>.5)uv.setXY(i,v.x/2,v.z/2);else uv.setXY(i,v.x/2,v.y/2);}
 softCache.set(key,g);return g;
}
const roomMats=new Map();
function box(parent,w,h,d,x,y,z,color,kind='cloth',radius=.09){let m=cloth(color,kind);if(parent.userData.cosmeticRoom){const key=color+kind;if(!roomMats.has(key))roomMats.set(key,new T.MeshLambertMaterial({color,map:m.map}));m=roomMats.get(key);}return add(parent,softBox(w,h,d,radius),m,x,y,z)}
function label(parent,s,x,y,z,size,color='#f1dec0'){
 const t=canvasTexture(512,128,(g)=>{g.clearRect(0,0,512,128);g.font='800 80px sans-serif';g.textAlign='center';g.fillStyle=color;g.fillText(s,256,96)});
 const m=new T.Sprite(new T.SpriteMaterial({map:t,transparent:true,depthWrite:false}));m.scale.set(size*4,size,1);m.position.set(x,y,z);parent.add(m);return m;
}
export function dressRoom(scene,sourceRoot,boxes,sites,zones=[]){
 const room=group(scene);room.userData.cosmeticRoom=true;scene.background=new T.Color(0x394e55);
 // Turn off original farm dressing. The original collision/nav data remains authoritative.
 sourceRoot.visible=false;
 const colors=[0x6a8179,0xb49a72,0x95725b,0x546e76,0x8b8976];
 boxes.forEach((b,i)=>{
  const w=b.x2-b.x1,h=b.y2-b.y1,d=b.z2-b.z1,cx=(b.x1+b.x2)/2,cy=(b.y1+b.y2)/2,cz=(b.z1+b.z2)/2;
  const tall=h>4||Math.max(w,d)>18;
  if(tall){box(room,w,h,d,cx,cy,cz,colors[i%5]);
   if(w>3&&d<2){for(let x=b.x1+.4;x<b.x2-.2;x+=2.1){box(room,.045,h-.12,.018,x,cy,b.z2+.025,0xd5c7a4);}}
   if(d>3&&w<2){for(let z=b.z1+.4;z<b.z2-.2;z+=2.1){box(room,.018,h-.12,.045,b.x2+.025,cy,z,0xd5c7a4);}}
  }else{
   const layers=Math.max(1,Math.ceil(h/.65)),ly=h/layers;
   for(let j=0;j<layers;j++){
    const y=b.y1+(j+.5)*ly;
    if(Math.min(w,d)>.5){
     box(room,w*.96,ly*.70,d*.95,cx,y,cz,0xd5c9a8,'paper',.018);
     for(const sign of [-1,1])box(room,w,ly*.12,d,cx,y+sign*ly*.42,cz,colors[(i+j)%5],'cloth',.015);
     box(room,w,ly*.75,.065,cx,y,b.z1+.04,colors[(i+j)%5],'cloth',.015);
    }else box(room,w,ly*.97,d,cx,y,cz,colors[(i+j)%5],'cloth',.035);
   }
  }
 });
 for(const z of zones){const w=z.x2-z.x1,d=z.z2-z.z1;box(room,w,.035,d,(z.x1+z.x2)/2,.002,(z.z1+z.z2)/2,0x687c72,'cloth',.01);for(const x of [z.x1,z.x2])box(room,.08,.05,d,x,.015,(z.z1+z.z2)/2,0xc4b79a,'cloth',.015);for(const zz of [z.z1,z.z2])box(room,w,.05,.08,(z.x1+z.x2)/2,.015,zz,0xc4b79a,'cloth',.015);}
 // Reuse original instance positions; visual yarn alpha is tested against baseline cover.
 const preserved=[];sourceRoot.traverse(o=>{if(o.isInstancedMesh&&o.material&&o.material.alphaTest>.1)preserved.push(o)});
 for(const o of preserved){
  const original=o.material.map.image,base=document.createElement('canvas');base.width=128;base.height=256;const bg=base.getContext('2d');bg.drawImage(original,0,0,128,256);const pixels=bg.getImageData(0,0,128,256).data;let originalCount=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>114)originalCount++;
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=256;const ctx=canvas.getContext('2d');
  const img=ctx.createImageData(128,256);let replacementCount=0;
  for(let y=0;y<256;y++)for(let x=0;x<128;x++){
   const k=(y*128+x)*4,alpha=pixels[k+3];if(alpha>114)replacementCount++;
   // Textile-only colour changes: original alpha and cross-plane locations remain exact.
   const stitch=(y%12<2&&x%8<4),fibre=((x*17+y*31)%13-6)*1.4;
   const tone=stitch?24:0,shade=(pixels[k+1]-150)*.13;
   img.data[k]=141+fibre+tone+shade;img.data[k+1]=159+fibre+tone+shade;img.data[k+2]=140+fibre+tone+shade;img.data[k+3]=alpha;
  }
  ctx.putImageData(img,0,0);
  const map=new T.CanvasTexture(canvas);map.encoding=T.sRGBEncoding;const material=new T.MeshLambertMaterial({color:0x9aaa9c,map,alphaTest:.45,side:T.DoubleSide});o.material=material;o.userData.coverage={original:originalCount/32768,replacement:replacementCount/32768,mode:'original-alpha-textile'};room.attach(o);
 }
 for(let i=0;i<37;i++){const x=-90+i*5;for(let j=0;j<4;j++){const z=-69+j*46;box(room,4.98,.12,45.96,x,-.10,z,[0xa7805c,0xa37a54,0xad8661,0x9f7651][(i+j)%4],'wood',.008);}}
 box(room,25,.018,18,0,.005,27,0x788a7e,'cloth',.005);
 for(const x of [-12.5,12.5])box(room,.07,.025,18,x,.016,27,0xc1b497,'cloth',.01);
 for(const z of [18,36])box(room,25,.025,.07,0,.016,z,0xc1b497,'cloth',.01);
 // Giant room landmarks outside the gameplay footprint.
 box(room,192,120,.6,0,60,-91,0x738792,'wall');box(room,192,.5,190,0,120,0,0xaaa994,'wall');box(room,192,120,.6,0,60,93,0x738792,'wall');box(room,.6,120,185,94,60,0,0x718791,'wall');box(room,.6,120,185,-94,60,0,0x71858d,'wall');
 box(room,192,1,1,0,.5,-90.2,0x9b7e64,'wood');
 const sofa=group(room);
 box(sofa,63,8,53,-81,10,-25,0xa5b5a6,'cloth',3);box(sofa,63,17,8,-81,22,-48,0x9cafa3,'cloth',3);box(sofa,8,18,54,-51,16,-25,0xaab7a5,'cloth',3.3);
 for(let j=0;j<3;j++)box(sofa,19,5,43,-101+j*20,16,-23,0xabb9a9,'cloth',2);
 for(const x of [-107,-55])for(const z of [-43,-4])box(sofa,3,6,3,x,3,z,0x685342,'wood',.3);
 const seamPts=[];
 for(const [cy,cz,a] of [[22.8,-48,Math.PI],[22.8,-2,Math.PI/2],[9.2,-2,0],[9.2,-48,-Math.PI/2]])for(let j=0;j<=8;j++){const t=a-j*Math.PI/16;seamPts.push(new T.Vector3(-46.97,cy+1.1*Math.sin(t),cz+1.1*Math.cos(t)));}
 const seamPath=new T.CatmullRomCurve3(seamPts,true);add(sofa,new T.TubeGeometry(seamPath,96,.065,5,true),cloth(0xd1c7ac),0,0,0);
 for(const y of [12,17,22])for(let i=0;i<8;i++)add(sofa,new T.SphereGeometry(.30,12,8),cloth(0x81978a),-46.95,y,-44+i*5.4,{s:[.35,1,1]});
 const pillow=box(sofa,16,14,5,-67,26,-42,0xc1a077,'cloth',2.2);pillow.rotation.z=-.12;
 bake(sofa.children.filter(o=>o.isMesh),sofa);
 box(room,68,2,29,48,30,-68,0x99775a,'wood',.6);box(room,67.2,.38,28.3,48,31.12,-68,0xb39571,'wood',.12);
 box(room,28,6,23,62,26,-68,0x80664f,'wood',.4);for(const y of [24.9,27.2]){box(room,26,.06,.06,62,y,-56.42,0x554a3c,'wood',.01);box(room,7,.3,.7,62,y+1,-56,0xc2af88,'plastic',.13);}for(const x of [18,77])box(room,3,30,3,x,15,-69,0x8f6c50,'wood');
 for(let j=0;j<8;j++){const h=12+(j%3)*3;box(room,2.6,h,9,26+j*3.2,31+h/2,-71,colors[j%5]);box(room,1.8,.22,.05,26+j*3.2,34,-66.45,0xd9c9a7)}
 box(room,46,36,.6,30,49,-90,0x394e56,'wood');
 const paneMap=canvasTexture(256,256,g=>{const grad=g.createLinearGradient(0,0,0,256);grad.addColorStop(0,'#6c8b9c');grad.addColorStop(.65,'#b8c8c5');grad.addColorStop(1,'#d2c7a8');g.fillStyle=grad;g.fillRect(0,0,256,256);});const pane=new T.Mesh(new T.PlaneGeometry(44,34),new T.MeshBasicMaterial({map:paneMap}));pane.position.set(30,49,-89.6);room.add(pane);
 for(const x of [4.7,55.3]){box(room,4,43,1,x,44,-88.6,0x969e91,'cloth',.4);for(let i=0;i<4;i++)add(room,cylGeo(.45,.45,42,10),cloth(i%2?0x88968b:0xa6afa0),x-1.5+i,44,-88);}
 box(room,19,14,.8,-17,43,-89.6,0x685744,'wood',.2);box(room,17.5,12.5,.25,-17,43,-89,0xb29673,'cloth');
 const note=box(room,6,7,.1,-19,44,-88.8,0xe4d8b9,'paper');note.rotation.z=.1;
 add(room,cylGeo(3,2.5,8),cloth(0x536b70,'plastic'),72,35,-61);
 for(let j=0;j<5;j++){const pencil=add(room,cylGeo(.16,.16,14),cloth(colors[j],'wood'),70.8+j*.55,42,-61+(j%2)*.6);pencil.rotation.z=(j-2)*.04;}
box(room,.7,34,.5,30,49,-89.2,0x7a8d91);box(room,44,.7,.5,30,49,-89.2,0x7a8d91);
 add(room,cylGeo(.4,.4,23),cloth(0x6d756f,'plastic'),65,44,-68);
 add(room,cylGeo(7,11,11),cloth(0xd1b993),65,59,-68);
 add(room,cylGeo(10.5,10.5,.15),new T.MeshBasicMaterial({color:0xffe1a0}),65,53.5,-68);
 for(const [key,s] of Object.entries(sites)){label(room,'TOY BOX '+key,s.x,6.4,s.z,1.15);box(room,2.8,.16,2.2,s.x,.10,s.z,0x957756,'wood',.04);for(const x of [-1.4,1.4])box(room,.12,.65,2.2,s.x+x,.35,s.z,0x789187,'cloth',.06);for(const z of [-1.1,1.1])box(room,2.8,.65,.12,s.x,.35,s.z+z,0x789187,'cloth',.06);const ring=new T.Mesh(new T.RingGeometry(s.r-.12,s.r,48),new T.MeshBasicMaterial({color:0xc4b179,side:T.DoubleSide,transparent:true,opacity:.7}));ring.rotation.x=-Math.PI/2;ring.position.set(s.x,.014,s.z);room.add(ring);}
 mergeRoom(room);
 scene.fog=new T.Fog(0x53646a,115,260);
 const hemi=new T.HemisphereLight(0xb9cddd,0x8a7960,1.05);scene.add(hemi);
 const key=new T.DirectionalLight(0xffdfaa,1.05);key.position.set(30,60,35);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-65,right:65,top:65,bottom:-65,near:1,far:180});key.shadow.radius=4;key.shadow.blurSamples=6;key.shadow.bias=-.001;key.shadow.normalBias=.04;scene.add(key);
 const lamp=new T.SpotLight(0xffca83,2.4,200,.78,.65,1);lamp.position.set(65,52,-68);lamp.target.position.set(5,0,8);scene.add(lamp,lamp.target);
 const fill=new T.DirectionalLight(0xb4d4e5,.55);fill.position.set(30,45,-80);scene.add(fill);
 return {room,lights:[hemi,key,fill,lamp],dispose(){scene.remove(room,hemi,key,fill,lamp,lamp.target);key.shadow.map&&key.shadow.map.dispose();const shared=new Set([...cache.values(),...roomMats.values(),...mergedRoomMats.values()]),owned=new Set();room.traverse(o=>{if(o.isMesh||o.isSprite){if(o.geometry)o.geometry.dispose();if(o.material&&!shared.has(o.material))owned.add(o.material)}});for(const m of owned){if(m.map)m.map.dispose();m.dispose()}}};
}
let contactShadowMat;
export function clothToy(c,kind,look){
 look=look===undefined?['chicken','pig','cow','sheep','goat'].indexOf(kind):look;
 const hands=kind==='farmer',color=hands?[0x155cde,0x167edb,0x4058df,0x156bd7,0x238ddd][(look||0)%5]:[0xff7a18,0xffa51b,0xed641d,0xff8b25,0xffb32b][(look||0)%5];
 // Reuse the proven segmented animation skeleton and weapon-mount interface.
 for(const part of [c.torso,c.head,...c.arms,...c.legs]){for(const child of [...part.children])if(child.isMesh)part.remove(child)}
 add(c.torso,new T.SphereGeometry(1,20,14),cloth(color),0,0,0,{s:[.34,.43,.24]});box(c.torso,.22,.26,.018,.1,-.05,-.226,0xff4e8a);
 add(c.head,new T.SphereGeometry(1,20,14),cloth(0xffce83),0,0,0,{s:[.29,.255,.24]});
 
 box(c.head,.34,.092,.025,0,.035,-.24,0x293c76,'cloth',.018);
 for(const s of [-1,1]){add(c.head,sphereGeo(),cloth(0xfff4cf,'plastic'),s*.1,.035,-.266,{s:[.035,.025,.014]});
  add(c.arms[s===-1?0:1],new T.CapsuleGeometry(.105,.19,4,10),cloth(color),0,-.15,0);add(c.arms[s===-1?0:1],sphereGeo(),cloth(0xffcd82),0,-.34,0,{s:.11});
  add(c.legs[s===-1?0:1],new T.CapsuleGeometry(.105,.15,4,10),cloth(0xffc855),0,-.13,0);box(c.legs[s===-1?0:1],.25,.14,.34,0,-.29,-.04,0x6c3cca);
 }
 const top=(look||0)%5;
 if(top===0){for(const x of [-.21,.21])add(c.head,new T.SphereGeometry(1,16,12),cloth(color),x,.19,0,{s:[.065,.13,.06]});}
 else if(top===1){box(c.head,.38,.06,.34,0,.22,0,color,'cloth',.025);box(c.head,.28,.025,.15,0,.20,-.19,color,'cloth',.01);}
 else if(top===2){add(c.head,new T.TorusGeometry(.23,.022,5,20),cloth(color),0,0,0,{r:[Math.PI/2,0,0]});}
 else if(top===3){for(const x of [-.23,.23]){const ear=box(c.head,.15,.22,.07,x,.11,0,color,'cloth',.04);ear.rotation.z=Math.sign(x)*.4;}}
 else{for(const x of [-.22,.22])add(c.head,new T.SphereGeometry(1,16,12),cloth(color),x,.17,0,{s:[.085,.085,.055]});}
 // Real seam geometry and team armband. No extra silhouette or hitbox.
 for(let i=0;i<7;i++)box(c.head,.023,.009,.009,-.18+i*.06,.19,-.15,0xe4d7b7,'cloth',.001);
 box(c.arms[0],.2,.08,.23,0,-.08,0,hands?0x4de0ff:0xffdd37);
 for(let i=0;i<6;i++)box(c.torso,.027,.012,.018,-.20+i*.07,.26,-.18,0xe4d7b7,'cloth',.002);
 const patchColors=[0x1dddaf,0xffdf23,0xf74795,0x4fe0ff,0x9856ef];
 box(c.torso,.13,.13,.025,-.17,.13,-.22,patchColors[(look||0)%5]);
 if(!contactShadowMat){const tex=canvasTexture(64,64,g=>{const r=g.createRadialGradient(32,32,3,32,32,31);r.addColorStop(0,'rgba(29,24,70,.5)');r.addColorStop(.45,'rgba(29,24,70,.27)');r.addColorStop(1,'rgba(29,24,70,0)');g.fillStyle=r;g.fillRect(0,0,64,64)});contactShadowMat=new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});}
 const contact=new T.Mesh(new T.PlaneGeometry(1.1,.85),contactShadowMat);contact.rotation.x=-Math.PI/2;contact.position.y=.018;c.root.add(contact);
 for(const part of [c.torso,c.head,...c.arms,...c.legs])mergeClothPart(part);
 return c;
}

export function smoothShell(g){g.traverse(o=>{if(!o.isMesh)return;const geo=o.geometry;if(geo.type==='ExtrudeGeometry'){geo.computeBoundingBox();const b=geo.boundingBox,w=b.max.x-b.min.x,h=b.max.y-b.min.y,d=b.max.z-b.min.z;const c=b.getCenter(new T.Vector3());const next=softBox(w,h,d,Math.min(w,h,d)*.23,true).clone();next.translate(c.x,c.y,c.z);o.geometry=next;}});}

let unifiedCloth;
function mergeClothPart(part){
 if(!unifiedCloth){unifiedCloth=cloth(0xffffff).clone();unifiedCloth.vertexColors=true;unifiedCloth.bumpMap=null;unifiedCloth.envMapIntensity=.5;unifiedCloth.roughness=.54;}
 const pos=[],nor=[],uv=[],col=[],v=new T.Vector3(),nm=new T.Matrix3();
 for(const m of [...part.children]){if(!m.isMesh)continue;m.updateMatrix();nm.getNormalMatrix(m.matrix);const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry;const p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv,c=m.material.color;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(m.matrix);pos.push(v.x,v.y,v.z);v.fromBufferAttribute(n,i).applyMatrix3(nm).normalize();nor.push(v.x,v.y,v.z);uv.push(u?u.getX(i):0,u?u.getY(i):0);col.push(c.r,c.g,c.b);}part.remove(m);if(g!==m.geometry)g.dispose();}
 const geo=new T.BufferGeometry();for(const [key,data,size] of [['position',pos,3],['normal',nor,3],['uv',uv,2],['color',col,3]])geo.setAttribute(key,new T.Float32BufferAttribute(data,size));const mesh=new T.Mesh(geo,unifiedCloth);mesh.castShadow=mesh.receiveShadow=true;part.add(mesh);
}

// One static draw per texture/shading family, with per-vertex colour. No lighting or geometry edits.
const mergedRoomMats=new Map();
function mergeRoom(room){
 const buckets=new Map(),v=new T.Vector3(),nm=new T.Matrix3();
 for(const m of [...room.children]){
  if(!m.isMesh||m.isInstancedMesh||m.material.transparent)continue;
  const mt=m.material;
  if(!mt.isMeshLambertMaterial||!mt.map){bake([m],room);continue;}
  const key=mt.map.uuid+'|'+m.castShadow+'|'+m.receiveShadow;
  if(!buckets.has(key))buckets.set(key,{pos:[],nor:[],uv:[],col:[],map:mt.map,cast:m.castShadow,receive:m.receiveShadow});
  const b=buckets.get(key);m.updateMatrix();nm.getNormalMatrix(m.matrix);
  const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry,p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv,c=mt.color;
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(m.matrix);b.pos.push(v.x,v.y,v.z);v.fromBufferAttribute(n,i).applyMatrix3(nm).normalize();b.nor.push(v.x,v.y,v.z);b.uv.push(u?u.getX(i):0,u?u.getY(i):0);b.col.push(c.r,c.g,c.b);}
  room.remove(m);if(g!==m.geometry)g.dispose();
 }
 for(const [key,b]of buckets){
  const geo=new T.BufferGeometry();for(const[k,a,n]of[['position',b.pos,3],['normal',b.nor,3],['uv',b.uv,2],['color',b.col,3]])geo.setAttribute(k,new T.Float32BufferAttribute(a,n));
  if(!mergedRoomMats.has(key))mergedRoomMats.set(key,new T.MeshLambertMaterial({map:b.map,vertexColors:true}));
  const m=new T.Mesh(geo,mergedRoomMats.get(key));m.castShadow=b.cast;m.receiveShadow=b.receive;room.add(m);
 }
}
