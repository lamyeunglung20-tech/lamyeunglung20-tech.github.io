import * as THREE from './vendor/three.module.js';

const C={ink:0x314b58,glass:0xd7f6fa,water:0x86cde1,leaf:0x71ad62,pale:0xe8dc9b,starch:0x202650,alcohol:0xf7dfa6,iodine:0x9a5833,cream:0xfff8e9};
const clamp=THREE.MathUtils.clamp;

export class StarchWorld{
  constructor(canvas,{onPhase=()=>{}}={}){
    this.canvas=canvas;this.onPhase=onPhase;this.available=false;this.stage=0;this.progress=[0,0,0,0];this.elapsed=0;this.running=false;this.pointers=new Map();this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    try{this.renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});}catch(e){console.warn('WebGL unavailable',e);return;}
    this.available=true;this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));this.renderer.setClearColor(0xf0f8f4,0);this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.2;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.scene=new THREE.Scene();this.scene.add(new THREE.HemisphereLight(0xffffff,0xb5cfcb,2.2));const sun=new THREE.DirectionalLight(0xfff6db,2.7);sun.position.set(-4,7,6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-7,right:7,top:7,bottom:-5});this.scene.add(sun);
    this.camera=new THREE.OrthographicCamera(-4,4,4,-4,.1,40);this.yaw=.18;this.pitch=1.32;this.zoom=1;this.target=new THREE.Vector3(0,1.95,0);
    this.groups=[];this.build();this.bind();this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);this.resize();this.last=performance.now();this.tick();
  }
  mat(color,extra={}){return new THREE.MeshStandardMaterial({color,roughness:.55,metalness:0,...extra});}
  mesh(geometry,material,parent,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  sphere(parent,x,y,z,r,color,extra={}){return this.mesh(new THREE.SphereGeometry(r,20,14),this.mat(color,extra),parent,x,y,z);}
  cyl(parent,x,y,z,r,h,color,extra={}){return this.mesh(new THREE.CylinderGeometry(r,r,h,40),this.mat(color,extra),parent,x,y,z);}
  tube(parent,points,r,color,extra={}){return this.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),30,r,8,false),this.mat(color,extra),parent);}
  ring(parent,x,y,z,r,color,thick=.025){const m=this.mesh(new THREE.TorusGeometry(r,thick,8,40),this.mat(color),parent,x,y,z);m.rotation.x=Math.PI/2;return m;}
  group(){const g=new THREE.Group();this.scene.add(g);this.groups.push(g);return g;}
  leaf(parent,x,y,z,color=C.leaf,scale=1){
    const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(scale);parent.add(g);
    const shape=new THREE.Shape();shape.moveTo(-.87,0);shape.bezierCurveTo(-.3,.6,.52,.48,.89,0);shape.bezierCurveTo(.45,-.5,-.32,-.58,-.87,0);
    const mat=this.mat(color,{side:THREE.DoubleSide,roughness:.52});const blade=this.mesh(new THREE.ExtrudeGeometry(shape,{depth:.055,bevelEnabled:true,bevelSegments:2,bevelSize:.025,bevelThickness:.025,curveSegments:18}),mat,g);blade.rotation.z=.15;
    const veins=new THREE.Group();g.add(veins);this.tube(veins,[[-.8,0,.11],[0,.02,.11],[.83,0,.11]],.016,0xc8d694);for(const side of [-1,1])for(let i=0;i<3;i++){const px=-.48+i*.38;this.tube(veins,[[px,.01,.12],[px+.18,side*.24,.12],[px+.38,side*.27,.1]],.009,0xc8d694);}
    return {g,blade,mat,veins};
  }
  hotplate(g){const base=this.mesh(new THREE.BoxGeometry(3.9,.25,2.7),this.mat(0x52646d),g,0,.37,0);const top=this.mesh(new THREE.BoxGeometry(3.7,.06,2.52),this.mat(0x6e858d),g,0,.55,0);this.sphere(g,1.55,.38,1.23,.065,0x8ad1b0,{emissive:0x54a67d,emissiveIntensity:.3});return {base,top};}
  beaker(g,{radius=1.35,top=3.35,bottom=.63,fill=.9,fluid=C.water}={}){
    const h=top-bottom;const glass=this.cyl(g,0,(top+bottom)/2,0,radius,h,C.glass,{transparent:true,opacity:.13,depthWrite:false,side:THREE.DoubleSide,roughness:.08});glass.castShadow=false;
    this.ring(g,0,top,0,radius,C.ink,.025);this.ring(g,0,bottom,0,radius,C.ink,.022);
    const water=this.cyl(g,0,bottom+fill/2,0,radius-.07,fill,fluid,{transparent:true,opacity:.38,depthWrite:false,roughness:.14});water.castShadow=false;
    const surface=this.cyl(g,0,bottom+fill,0,radius-.07,.035,fluid,{transparent:true,opacity:.56,depthWrite:false});surface.castShadow=false;
    return {water,surface};
  }
  build(){
    this.floor=this.cyl(this.scene,0,-.18,0,3.75,.34,0xe8e2d6);this.cyl(this.scene,0,.035,0,3.7,.08,0xfffcf4);
    // First station: the leaf is immersed in boiling water.
    const g0=this.group();this.hotplate(g0);this.beaker(g0,{top:3.65,fill:1.85});this.leaf0=this.leaf(g0,0,1.82,.22,C.leaf,.86);this.leaf0.g.rotation.z=-.24;
    this.bubbles0=[];for(let i=0;i<22;i++){const a=i*2.4;const b=this.sphere(g0,Math.cos(a)*(.35+(i%4)*.15),.8+i*.12,Math.sin(a)*.4,.03+(i%3)*.015,0xf6ffff,{transparent:true,opacity:.75});b.castShadow=false;this.bubbles0.push(b);}
    this.steam0=this.steam(g0,3.8);
    // Second station: an alcohol tube stands inside the hot-water bath.
    const g1=this.group();this.hotplate(g1);this.beaker(g1,{top:2.95,fill:1.45});
    this.cyl(g1,0,2.55,.05,.43,3.25,C.glass,{transparent:true,opacity:.18,depthWrite:false,side:THREE.DoubleSide});this.ring(g1,0,4.16,.05,.43,C.ink,.03);
    this.cyl(g1,0,1.53,.05,.37,1.2,C.alcohol,{transparent:true,opacity:.39,depthWrite:false});this.leaf1=this.leaf(g1,0,1.59,.49,C.leaf,.54);this.leaf1.g.rotation.z=1.1;
    this.steam1=this.steam(g1,3.08);
    // Third station: pale leaf is washed in hot water.
    const g2=this.group();this.hotplate(g2);this.beaker(g2,{top:3.42,fill:1.5});this.leaf2=this.leaf(g2,0,1.95,.49,C.pale,.79);this.leaf2.g.rotation.z=-.18;this.steam2=this.steam(g2,3.58);
    // Fourth station: iodine drops onto a pale leaf on a white tile.
    const g3=this.group();this.mesh(new THREE.BoxGeometry(3.8,.17,2.6),this.mat(0x6b8a92),g3,0,.6,0);this.mesh(new THREE.BoxGeometry(3.6,.11,2.4),this.mat(0xfffefa),g3,0,.75,0);
    this.leaf3=this.leaf(g3,0,1.05,.25,C.pale,1.18);this.dropper=new THREE.Group();g3.add(this.dropper);this.dropper.position.set(.82,3.25,.4);this.tube(this.dropper,[[.18,.9,0],[0,.1,0],[-.12,-.52,0]],.065,0xb7dce2,{transparent:true,opacity:.65});this.sphere(this.dropper,.2,.98,0,.18,0x4d626b);this.sphere(this.dropper,-.13,-.53,0,.072,C.iodine);
    this.drops=[];for(let i=0;i<5;i++){const d=this.sphere(g3,-.04-i*.12,1.8+i*.28,.5,.04+(i%2)*.012,C.iodine);d.castShadow=false;this.drops.push(d);}
    this.setStage(0);
  }
  steam(g,height){const bubbles=[];for(let i=0;i<8;i++){const b=this.sphere(g,Math.sin(i*2.3)*.5,height+i*.16,Math.cos(i*1.5)*.25,.07+i*.008,0xffffff,{transparent:true,opacity:.24,depthWrite:false});b.castShadow=false;bubbles.push(b);}return bubbles;}
  setStage(index){if(!this.available)return;this.stage=clamp(index,0,3);this.running=false;this.progress[this.stage]=0;this.groups.forEach((g,i)=>g.visible=i===this.stage);this.leaf1.mat.color.setHex(C.leaf);this.leaf3.mat.color.setHex(C.pale);this.drops.forEach(d=>d.visible=false);this.onPhase('idle');}
  play(){if(!this.available)return;this.running=true;this.start=this.elapsed;this.onPhase('run');if(this.reduced){this.progress[this.stage]=1;this.updateVisual(1);this.running=false;queueMicrotask(()=>this.onPhase('done'));}}
  updateVisual(p){const t=this.stage;if(t===0){this.leaf0.g.rotation.z=-.24+Math.sin(p*Math.PI)*.3;}
    else if(t===1){this.leaf1.mat.color.copy(new THREE.Color(C.leaf).lerp(new THREE.Color(C.pale),p));this.leaf1.g.rotation.z=1.1+Math.sin(p*Math.PI)*.2;}
    else if(t===2){this.leaf2.g.rotation.z=-.18+Math.sin(p*Math.PI)*.16;this.leaf2.g.scale.setScalar(.79+Math.sin(p*Math.PI)*.035);}
    else{this.leaf3.mat.color.copy(new THREE.Color(C.pale).lerp(new THREE.Color(C.starch),Math.max(0,(p-.3)/.7)));this.drops.forEach((d,i)=>{d.visible=p>.05&&p<.8;d.position.y=2.9-((p*2+i/5)%1)*1.75;});this.dropper.rotation.z=-.08+Math.sin(p*Math.PI)*.09;}}
  tick(){if(!this.available)return;this.frame=requestAnimationFrame(()=>this.tick());const now=performance.now(),dt=Math.min(.05,(now-this.last)/1000);this.last=now;this.elapsed+=dt;
    if(this.running){const p=clamp((this.elapsed-this.start)/2.8,0,1);this.progress[this.stage]=p;this.updateVisual(p);if(p>=1){this.running=false;this.drops.forEach(d=>d.visible=false);this.onPhase('done');}}
    const steam=[this.steam0,this.steam1,this.steam2][this.stage];if(steam)steam.forEach((b,i)=>{b.position.y=([3.8,3.08,3.58][this.stage])+((this.elapsed*.2+i/steam.length)%1)*.9;b.material.opacity=.12+Math.sin(this.elapsed*2+i)*.08;});
    if(this.stage===0)this.bubbles0.forEach((b,i)=>{b.position.y=.8+((this.elapsed*.45+i/22)%1)*1.65;});
    this.renderer.render(this.scene,this.camera);
  }
  cameraUpdate(){this.camera.position.set(Math.sin(this.yaw)*11*Math.sin(this.pitch),this.target.y+Math.cos(this.pitch)*11,Math.cos(this.yaw)*11*Math.sin(this.pitch));this.camera.lookAt(this.target);this.camera.zoom=this.zoom;this.camera.updateProjectionMatrix();}
  resize(){if(!this.available)return;const r=this.canvas.getBoundingClientRect();const w=Math.max(1,r.width),h=Math.max(1,r.height),aspect=w/h;this.renderer.setSize(w,h,false);const half=Math.max(2.65,3.25/aspect);this.camera.left=-half*aspect;this.camera.right=half*aspect;this.camera.top=half;this.camera.bottom=-half;this.cameraUpdate();}
  resetCamera(){this.yaw=.18;this.pitch=1.32;this.zoom=1;this.cameraUpdate();}
  bind(){const on=(name,fn,options)=>{this.canvas.addEventListener(name,fn,options);(this.listeners??=[]).push([name,fn,options]);};this.canvas.style.touchAction='none';on('pointerdown',e=>{this.canvas.setPointerCapture(e.pointerId);this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});this.pinch=null;});on('pointermove',e=>{const old=this.pointers.get(e.pointerId);if(!old)return;const dx=e.clientX-old.x,dy=e.clientY-old.y;this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(this.pointers.size>1){const [a,b]=[...this.pointers.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(this.pinch)this.zoom=clamp(this.zoom*d/this.pinch,.8,1.5);this.pinch=d;}else{this.yaw=clamp(this.yaw-dx*.006,-.65,.65);this.pitch=clamp(this.pitch+dy*.004,1.06,1.56);}this.cameraUpdate();});const up=e=>{this.pointers.delete(e.pointerId);this.pinch=null;};on('pointerup',up);on('pointercancel',up);on('wheel',e=>{e.preventDefault();this.zoom=clamp(this.zoom*(1-e.deltaY*.001),.8,1.5);this.cameraUpdate();},{passive:false});}
  dispose(){if(!this.available)return;this.available=false;cancelAnimationFrame(this.frame);this.observer?.disconnect();this.listeners?.forEach(([n,f,o])=>this.canvas.removeEventListener(n,f,o));const mats=new Set();this.scene.traverse(o=>{o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>mats.add(m));});mats.forEach(m=>m.dispose());this.renderer.dispose();}
}
