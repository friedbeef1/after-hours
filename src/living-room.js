import { rboxGeo } from './gfx.js';
import { cloth } from './afterhours.js';
const T=window.THREE;
function roundedSolid(w,h,d,r){
 r=Math.min(r,w*.45,h*.45,d*.45);const seg=6,g=new T.BoxGeometry(w,h,d,seg,seg,seg),p=g.attributes.position,n=g.attributes.normal;const v=new T.Vector3(),q=new T.Vector3();
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);for(const [axis,dim] of [['x',w],['y',h],['z',d]]){const u=v[axis]/(dim/2);if(Math.abs(u)<.99&&Math.abs(u)>.01)v[axis]=Math.sign(u)*Math.min(Math.abs(v[axis]),dim/2-r);}q.set(Math.max(-w/2+r,Math.min(w/2-r,v.x)),Math.max(-h/2+r,Math.min(h/2-r,v.y)),Math.max(-d/2+r,Math.min(d/2-r,v.z)));const normal=v.clone().sub(q).normalize();n.setXYZ(i,normal.x,normal.y,normal.z);v.copy(q).addScaledVector(normal,r);p.setXYZ(i,v.x,v.y,v.z);}return g;
}
export function buildLivingRoom(scene){
 const root=new T.Group();scene.add(root);const boxes=[];const lights=[];const scale=5.6;
 scene.background=new T.Color(0xaebfbc);scene.fog=new T.Fog(0xaebfbc,115,180);
 function box(w,h,d,x,y,z,col,kind='plain',r=.05){
  const material=cloth(col,kind==='plain'?'plastic':kind==='cloth'?'cloth':'wood');
  const mesh=new T.Mesh((kind==='cloth'||kind==='plain')&&h>.15?roundedSolid(w*scale,h*scale,d*scale,Math.max(r,.16)*scale):rboxGeo(w*scale,h*scale,d*scale,r*scale),material);mesh.position.set(x*scale,y*scale,z*scale);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);
  if(y+h/2>.13)boxes.push({x1:(x-w/2)*scale,y1:(y-h/2)*scale,z1:(z-d/2)*scale,x2:(x+w/2)*scale,y2:(y+h/2)*scale,z2:(z+d/2)*scale});return mesh;
 }
 function ball(r,x,y,z,c,s=[1,1,1]){const o=new T.Mesh(new T.SphereGeometry(r*scale,16,12),cloth(c));o.position.set(x*scale,y*scale,z*scale);o.scale.set(...s);o.castShadow=o.receiveShadow=true;root.add(o);return o}
 function cylinder(r,h,x,y,z,c){const o=new T.Mesh(new T.CylinderGeometry(r*scale,r*scale,h*scale,16),cloth(c,'wood'));o.position.set(x*scale,y*scale,z*scale);o.castShadow=o.receiveShadow=true;root.add(o);if(h>1)boxes.push({x1:(x-r)*scale,y1:(y-h/2)*scale,z1:(z-r)*scale,x2:(x+r)*scale,y2:(y+h/2)*scale,z2:(z+r)*scale});return o}
// One enclosed human-scale room, with no freestanding arena walls.
for(let x=-8;x<8;x+=.8)box(.79,.12,20,x+.4,-.08,0,'#e9b975','wood',.01);
box(16,6,.2,0,3,-10,'#69c9ed');box(.2,6,20,-8,3,0,'#69c9ed');box(.2,6,20,8,3,0,'#ffe28a');
box(16,.22,.15,0,.14,-9.8,'#fff5dc');box(.15,.22,20,-7.8,.14,0,'#fff5dc');box(.15,.22,20,7.8,.14,0,'#fff5dc');
// Window with large readable silhouette and draped curtains.
box(6,3.3,.1,2,3.7,-9.82,'#fff4d3');box(5.65,2.95,.1,2,3.7,-9.7,'#58c9ff');box(.12,3,.14,2,3.7,-9.57,'#fff4dc');box(5.6,.12,.14,2,3.7,-9.57,'#fff4dc');for(const x of [-1.4,5.4])box(.8,4.5,.4,x,3,-9.3,'#ff647e','cloth',.15);
// Sofa back at rear wall: continuous long seat, arms, cushions, timber feet.
box(7,.55,2.4,-3,1.3,-7.1,'#146be6','cloth',.25);box(7,1.9,.5,-3,2,-8.15,'#146be6','cloth',.22);for(const x of [-6.4,.4])box(.6,1.4,2.5,x,1.65,-7.1,'#2489ff','cloth',.2);for(let i=0;i<3;i++)box(1.95,.35,1.9,-5.15+i*2.15,1.62,-6.9,'#43c7ff','cloth',.17);for(const x of [-5.8,-.2])for(const z of [-7.8,-6.3])cylinder(.11,.5,x,.27,z,'#66472c');let cushion=box(1.2,1.2,.3,-5,2.25,-7.65,'#ffce22','cloth',.2);cushion.rotation.z=.2;
// Rug, coffee table, and honest under-table tunnel.
box(7.8,.06,7.4,-.3,.03,-1.5,'#f33c8f','cloth',.03);box(7.2,.02,6.8,-.3,.07,-1.5,'#ffd232','cloth',.02);for(let i=0;i<9;i++)box(6.9,.015,.05,-.3,.085,-4.6+i*.75,'#ff8654','cloth',.01);
box(4.8,.25,2.8,-.3,1.8,-2,'#ff9b24','wood',.15);for(const x of [-2.3,1.7])for(const z of [-3.1,-.9])box(.23,1.65,.23,x,.88,z,'#a751d4','wood');
for(let i=0;i<3;i++){let b=box(1.25,.14,.8,-.9,2.02+i*.15,-2,i===0?'#7354ef':i===1?'#ff4e6b':'#3dcc9c','cloth');b.rotation.y=i*.12;}cylinder(.3,.4,.9,2.1,-2,'#ffcf29');
// Side table and warm floor lamp, clearly separate from combat cover.
box(1.7,.18,1.7,5.8,1.9,-7,'#ff9b24','wood');for(const x of [5.2,6.4])for(const z of [-7.6,-6.4])box(.13,1.8,.13,x,.9,z,'#a751d4','wood');cylinder(.35,.1,5.8,2.05,-7,'#ffcc23');cylinder(.05,1.4,5.8,2.75,-7,'#7555dc');let shade=new T.Mesh(new T.CylinderGeometry(.5,.9,1,32,1,true),new T.MeshStandardMaterial({color:'#fff056',side:T.DoubleSide}));shade.scale.setScalar(scale);shade.position.set(5.8*scale,3.5*scale,-7*scale);root.add(shade);let lamp=new T.PointLight('#ffd28a',1.2,52);lamp.position.set(5.8*scale,3.3*scale,-7*scale);root.add(lamp);
// Basket and large children's blocks substitute for the old vegetation.
box(2.5,.06,2.3,5,.03,3,'#ffb52d','cloth',.2);for(const x of [3.85,6.15])box(.24,1.4,2.3,x,.7,3,'#ffcc38','cloth',.1);for(const z of [1.95])box(2.5,1.4,.22,5,.7,z,'#ffcc38','cloth',.1);ball(.5,4.7,.55,2.7,'#ff3f79');ball(.35,5.4,.4,2.8,'#24cfc4');
box(1.2,.5,1.4,-4,.3,1,'#4959e8','cloth');box(1.4,.5,1,-4.2,.8,.95,'#ffbd1e','cloth');box(.8,.7,.8,2.2,.38,3.7,'#18c9a9','cloth');
// Small objective boxes anchored to room features.
box(.9,.1,.6,-3,.04,-7.1,'#ff5c65','cloth');box(.9,.1,.6,5,.04,3,'#20bcdd','cloth');

 // A padded footstool breaks the entry sightline without adding arena walls.
 box(3,.72,1.7,-.8,.42,5.3,'#f43d93','cloth',.22);
 box(3.1,.18,1.8,-.8,.86,5.3,'#ff78b5','cloth',.12);
 // A fallen sofa cushion supplies honest left-flank cover.
 box(1.4,1.1,.65,-5,-0+0.55,-1.7,'#9de135','cloth',.18);
 // A matching reading chair faces the rug and shields the east-side entry.
 box(2,1.1,2.8,4.8,.9,-1.8,'#146be6','cloth',.22);
 box(.45,2,2.8,5.7,1.8,-1.8,'#146be6','cloth',.22);
 for(const z of [-3.15,-.45])box(2,1.3,.35,4.8,1.4,z,'#2489ff','cloth',.15);
 box(1.5,.25,2,4.6,1.55,-1.8,'#43c7ff','cloth',.17);
 for(const x of [4.05,5.55])for(const z of [-2.85,-.75])cylinder(.1,.4,x,.2,z,'#66472c');
 // Rounded upholstery piping and sculpted buttons make seams visibly dimensional.
 function piping(w,h,x,y,z,c){const pts=[];const r=.18;for(const [cx,cy,start]of [[w/2-r,h/2-r,0],[-w/2+r,h/2-r,Math.PI/2],[-w/2+r,-h/2+r,Math.PI],[w/2-r,-h/2+r,Math.PI*1.5]])for(let j=0;j<=6;j++){let a=start+j*Math.PI/12;pts.push(new T.Vector3((x+cx+r*Math.cos(a))*scale,(y+cy+r*Math.sin(a))*scale,z*scale));}const curve=new T.CatmullRomCurve3(pts,true);const m=new T.Mesh(new T.TubeGeometry(curve,48,.025*scale,5,true),cloth(c,'plastic'));m.castShadow=true;root.add(m);}
 piping(1.12,1.12,-5,2.25,-7.83,'#fff0ad');
 for(let i=0;i<3;i++){piping(1.83,.3,-5.15+i*2.15,1.62,-5.94,'#a8ecff');for(const y of [1.9,2.35])ball(.055,-5.15+i*2.15,y,-7.87,'#70daff',[1,1,.6]);}
 // Sunny rug tiles and chunky block studs add real relief without new collision.
 for(let i=0;i<5;i++)for(let j=0;j<4;j++){const m=new T.Mesh(rboxGeo(1.21*scale,.018*scale,1.28*scale,.02*scale),cloth(['#ff5a79','#16c4cc','#8861f5','#ffe44c','#80dc3e'][(i+j)%5],'cloth'));m.position.set((-3+i*1.35)*scale,.105*scale,(-3.9+j*1.5)*scale);m.receiveShadow=true;root.add(m);}
 for(const x of [-4.55,-3.85]){const stud=new T.Mesh(new T.CylinderGeometry(.18*scale,.18*scale,.1*scale,16),cloth('#ffde38','plastic'));stud.position.set(x*scale,1.1*scale,.95*scale);stud.castShadow=true;root.add(stud);}
 // Clear room-objective plaques sit at the sofa tunnel and basket opening.
 function plaque(letter,x,z){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.fillStyle='#f1e4c6';g.fillRect(0,0,128,128);g.strokeStyle='#76644a';g.lineWidth=7;g.strokeRect(4,4,120,120);g.fillStyle='#3b5a54';g.font='bold 94px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(letter,64,69);const tex=new T.CanvasTexture(c);tex.encoding=T.sRGBEncoding;const m=new T.Mesh(new T.PlaneGeometry(.6*scale,.6*scale),new T.MeshBasicMaterial({map:tex,side:T.DoubleSide}));m.position.set(x*scale,.32*scale,z*scale);root.add(m);return tex;}
 const signs=[plaque('A',-5.7,-5.65),plaque('B',6.05,4.2)];
 // Fourth wall closes the living room; no farm geometry or invisible farm corridors survive.
 box(16,6,.2,0,3,10,'#ffe28a');
 const hemi=new T.HemisphereLight(0xd8f4ff,0x8856a0,.45);root.add(hemi);
 const sun=new T.DirectionalLight(0xfff2d8,2.0);sun.position.set(-36,72,-24);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.normalBias=.02;sun.shadow.bias=-.0001;Object.assign(sun.shadow.camera,{left:-65,right:65,top:70,bottom:-70,far:180});root.add(sun);
 // A draped throw hangs over the table's north edge, leaving both side routes and the south tunnel open.
 box(3.2,1.65,.15,-.3,.85,-3.35,'#7e45dc','cloth',.08);
 const points={HERD:{x:-21,z:0},HANDS:{x:21,z:0},A:{x:-9,z:-21.3},B:{x:15,z:10.7},B_LEFT:{x:7,z:20},B_RIGHT:{x:20,z:20},B_MID:{x:10,z:22},YARD:{x:0,z:2},MID:{x:0,z:-3},LEFT:{x:-20,z:3},RIGHT:{x:20,z:0},SOFA:{x:-20,z:-15},WINDOW:{x:8,z:-15}};
 const routes={A:[['LEFT','SOFA','A'],['MID','SOFA','A'],['LEFT','WINDOW','A']],B:[['B_LEFT','B'],['B_MID','B'],['B_RIGHT','B']],MID:[['LEFT','MID'],['YARD','MID'],['RIGHT','MID']]};
 const holds={A:[{x:-9,z:-22,lx:-9,lz:-15},{x:-14,z:-21,lx:-14,lz:-14},{x:-4,z:-21,lx:-4,lz:-14},{x:-18,z:-18,lx:-15,lz:-10},{x:0,z:-18,lx:0,lz:-8}],B:[{x:15,z:9,lx:15,lz:16},{x:13,z:10,lx:15,lz:16},{x:17,z:10,lx:15,lz:16},{x:10,z:14,lx:15,lz:5},{x:20,z:16,lx:12,lz:5}],MID:[{x:0,z:3,lx:0,lz:20},{x:-10,z:0,lx:0,lz:15},{x:9,z:-6,lx:0,lz:15}]};
 const spawns={attack:[[-21,-10],[-21,-5],[-21,0],[-21,5],[-21,10]].map(([x,z])=>({x,z,yaw:-Math.PI/2})),defend:[[21,-10],[21,-5],[21,0],[21,5],[21,10]].map(([x,z])=>({x,z,yaw:Math.PI/2}))};
 for(const p of Object.values(points)){p.x*=(5.6/3);p.z*=(5.6/3);}for(const ps of Object.values(holds))for(const p of ps){p.x*=(5.6/3);p.z*=(5.6/3);p.lx*=(5.6/3);p.lz*=(5.6/3);}for(const ps of Object.values(spawns))for(const p of ps){p.x*=(5.6/3);p.z*=(5.6/3);}

 // Batch static meshes by material family. Keep vertex colours, bevel normals and PBR response.
 const buckets=new Map(),v=new T.Vector3(),nm=new T.Matrix3();
 for(const m of [...root.children]){if(!m.isMesh||!m.material.isMeshStandardMaterial)continue;const mt=m.material,key=[mt.map?.uuid,mt.roughness,mt.bumpScale,!!mt.bumpMap,m.castShadow,m.receiveShadow].join('|');if(!buckets.has(key))buckets.set(key,{source:mt,p:[],n:[],uv:[],c:[],cast:m.castShadow,receive:m.receiveShadow});const b=buckets.get(key);m.updateMatrix();nm.getNormalMatrix(m.matrix);const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry;for(let i=0;i<g.attributes.position.count;i++){v.fromBufferAttribute(g.attributes.position,i).applyMatrix4(m.matrix);b.p.push(v.x,v.y,v.z);v.fromBufferAttribute(g.attributes.normal,i).applyMatrix3(nm).normalize();b.n.push(v.x,v.y,v.z);const u=g.attributes.uv;b.uv.push(u?u.getX(i):0,u?u.getY(i):0);b.c.push(mt.color.r,mt.color.g,mt.color.b);}root.remove(m);}
 for(const b of buckets.values()){const g=new T.BufferGeometry();for(const[k,a,n]of[['position',b.p,3],['normal',b.n,3],['uv',b.uv,2],['color',b.c,3]])g.setAttribute(k,new T.Float32BufferAttribute(a,n));const mt=b.source.clone();mt.color.set(0xffffff);mt.vertexColors=true;const m=new T.Mesh(g,mt);m.castShadow=b.cast;m.receiveShadow=b.receive;root.add(m);}
 return {id:'farm',name:'After Hours living room',boxes,cornZones:[],slowZones:[],points,routes,holds,spawns,sites:{A:{...points.A,r:3},B:{...points.B,r:3}},animated:[],half:60,cluck:null,slowAt(){return 1},dispose(){scene.remove(root);root.traverse(o=>{if(o.isMesh)o.geometry.dispose()});sun.shadow.map?.dispose();for(const t of signs)t.dispose();scene.fog=null}};
}
