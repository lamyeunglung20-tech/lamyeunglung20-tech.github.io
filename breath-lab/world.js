import * as THREE from './vendor/three.module.js';

const C={navy:0x193845,cream:0xfffaf0,blue:0x89c6d9,cyan:0x52c9c2,coral:0xf29383,skin:0xe9b494,hair:0x3c3548,lung:0xf39f9e,lavender:0xb6abe3,gold:0xffd27c};
const LEVELS={oxygen:[.8,.58],carbon:[.08,.65],water:[.25,.8],temperature:[.3,.8]};
const COLORS={oxygen:0x58bdc3,carbon:0xa698d4,water:0x7fb7e3,temperature:0xf2a56e};
const clamp=THREE.MathUtils.clamp;

export class BreathWorld {
  constructor(canvas,{onPhase=()=>{}}={}) {
    this.canvas=canvas;this.onPhase=onPhase;this.available=false;this.listeners=[];this.pointers=new Map();this.topic='oxygen';this.revealed=false;this.phase='idle';this.breathAmount=.35;this.elapsed=0;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    try {this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});}catch(e){console.warn('3D model unavailable',e);return;}
    this.available=true;this.renderer.setClearColor(0xeef4f1);this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.25;
    this.scene=new THREE.Scene();this.camera=new THREE.OrthographicCamera(-4,4,4,-4,.1,60);this.target=new THREE.Vector3(0,2.8,0);this.yaw=.08;this.pitch=1.35;this.zoom=1;
    this.scene.add(new THREE.HemisphereLight(0xffffff,0xb4c8d1,2.5));const key=new THREE.DirectionalLight(0xffeedb,3);key.position.set(-5,10,8);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-6,right:6,top:7,bottom:-5,near:1,far:30});key.shadow.normalBias=.035;this.scene.add(key);const rim=new THREE.DirectionalLight(0xd6ddff,1.8);rim.position.set(4,6,-5);this.scene.add(rim);
    this.root=new THREE.Group();this.scene.add(this.root);this.build();this.bind();this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);this.resize();this.last=performance.now();this.tick();
  }
  mat(color,extra={}){return new THREE.MeshStandardMaterial({color,roughness:.6,metalness:0,...extra});}
  mesh(geometry,material,p=this.root,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;p.add(m);return m;}
  sphere(p,x,y,z,r,color,extra={}){return this.mesh(new THREE.SphereGeometry(r,24,18),this.mat(color,extra),p,x,y,z);}
  cylinder(p,x,y,z,r,h,color,extra={}){return this.mesh(new THREE.CylinderGeometry(r,r,h,32),this.mat(color,extra),p,x,y,z);}
  capsule(p,x,y,z,r,length,color,extra={}){return this.mesh(new THREE.CapsuleGeometry(r,length,8,20),this.mat(color,extra),p,x,y,z);}
  line(p,points,color,r=.04,extra={}){return this.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v))),32,r,8,false),this.mat(color,extra),p);}
  ring(p,x,y,z,r,t,color){const m=this.mesh(new THREE.TorusGeometry(r,t,10,48),this.mat(color),p,x,y,z);m.rotation.x=Math.PI/2;return m;}
  build(){
    this.cylinder(this.root,0,-.18,0,3.9,.35,0xc8d9d7);this.cylinder(this.root,0,.025,0,3.85,.08,C.cream);this.ring(this.root,0,.08,0,3.6,.016,0xc8d9d7);
    this.person=new THREE.Group();this.root.add(this.person);
    // Soft toy proportions and a transparent chest display keep the lungs easy to see.
    const p=this.person;
    for(const side of [-1,1]){
      this.capsule(p,side*.36,1.1,-.02,.25,1.35,C.navy);const shoe=this.sphere(p,side*.36,.25,.2,.35,C.cream);shoe.scale.set(1,.55,1.5);
      const arm=this.capsule(p,side*.96,3.15,-.05,.2,1.23,0xaabfe6);arm.rotation.z=side*.14;
      this.sphere(p,side*1.07,2.38,-.02,.23,C.skin);
    }
    const shirt=this.capsule(p,0,3.12,-.3,.73,1.05,0xaabfe6);shirt.scale.z=.62;
    const chest=this.sphere(p,0,3.35,.16,.84,0xe4f7f4,{transparent:true,opacity:.2,depthWrite:false,roughness:.18});chest.scale.set(.93,1.23,.62);chest.castShadow=false;
    // The softly outlined display is a simplified model, not a realistic body section.
    const outline=this.line(p,[[-.56,4,.42],[-.72,3.55,.5],[-.63,2.65,.43],[0,2.48,.43],[.63,2.65,.43],[.72,3.55,.5],[.56,4,.42]],0xd6e9ef,.035);
    outline.castShadow=false;
    this.lungs=new THREE.Group();this.lungs.position.set(0,3.28,.39);p.add(this.lungs);
    for(const side of [-1,1]){
      const lung=this.sphere(this.lungs,side*.36,0,0,.43,C.lung);lung.scale.set(.82,1.4,.53);lung.rotation.z=side*.12;
      this.line(this.lungs,[[0,.43,.1],[side*.23,.21,.16],[side*.35,-.15,.17]],0xffd1c3,.055);
      this.line(this.lungs,[[side*.23,.15,.16],[side*.45,.02,.18]],0xffd1c3,.033);
    }
    this.line(p,[[0,4.64,.48],[0,4.18,.47],[0,3.72,.5]],0xffcfbd,.095);
    for(let i=0;i<6;i++){const ring=this.ring(p,0,3.92+i*.105,.47,.099,.014,0xe8a9a0);ring.castShadow=false;}
    this.cylinder(p,0,4.4,-.03,.23,.46,C.skin);
    const head=this.sphere(p,0,5.03,0,.65,C.skin);head.scale.set(.94,1.08,.88);
    for(const side of [-1,1]){this.sphere(p,side*.59,4.99,-.02,.14,C.skin);this.sphere(p,side*.23,5.09,.53,.047,C.navy);const blush=this.sphere(p,side*.35,4.94,.49,.105,0xe99891);blush.scale.set(1,.5,.16);}
    this.sphere(p,0,4.99,.56,.075,0xdfa183);
    this.line(p,[[-.115,4.83,.543],[0,4.79,.57],[.115,4.83,.543]],C.navy,.022);
    const hair=this.sphere(p,0,5.38,-.09,.6,C.hair);hair.scale.set(1,.65,.96);
    for(let i=0;i<5;i++){const h=this.sphere(p,-.42+i*.2,5.44+Math.sin(i)*.05,.3,.22,C.hair);h.scale.set(1,1.08,.7);}
    this.sphere(p,-.56,5.22,.02,.16,C.hair);this.sphere(p,.56,5.22,.02,.16,C.hair);
    this.pods=[this.makePod(-2.55,C.cyan),this.makePod(2.55,C.coral)];
    // Dotted paths suggest air movement without assigning all air to a single gas.
    this.paths={in:new THREE.CatmullRomCurve3([new THREE.Vector3(-2.55,3.28,.15),new THREE.Vector3(-1.8,4.15,.5),new THREE.Vector3(-.7,4.6,.75),new THREE.Vector3(0,4.8,.65),new THREE.Vector3(0,3.7,.6)]),out:new THREE.CatmullRomCurve3([new THREE.Vector3(0,3.7,.6),new THREE.Vector3(0,4.8,.65),new THREE.Vector3(.7,4.6,.75),new THREE.Vector3(1.8,4.15,.5),new THREE.Vector3(2.55,3.28,.15)])};
    this.air=[];for(let i=0;i<24;i++){const s=this.sphere(this.root,0,0,0,.052+(i%3)*.012,[0x82cdd0,0xe7c17e,0xb2a5da][i%3],{transparent:true,opacity:.8});s.visible=false;s.castShadow=false;this.air.push(s);}
    this.setTopic('oxygen');
  }
  makePod(x,color){
    const group=new THREE.Group();group.position.set(x,.1,0);this.root.add(group);
    this.cylinder(group,0,.17,0,.77,.3,color);this.cylinder(group,0,.37,0,.64,.12,0xe4ecec);this.cylinder(group,0,1.98,0,.61,3.06,0xe8ffff,{transparent:true,opacity:.15,depthWrite:false,roughness:.15});
    this.ring(group,0,.48,0,.62,.045,color);this.ring(group,0,3.51,0,.62,.045,color);this.cylinder(group,0,3.58,0,.66,.12,color);
    for(const side of [-1,1])this.cylinder(group,side*.59,1.97,-.1,.021,2.98,0xd3e3df);
    const fill=this.cylinder(group,0,.52,0,.51,1,0x58bdc3,{transparent:true,opacity:.65,roughness:.3});fill.castShadow=false;fill.scale.y=.001;
    const top=this.cylinder(group,0,.53,0,.51,.04,0x58bdc3,{roughness:.25});top.visible=false;
    const dots=[];for(let i=0;i<9;i++){const d=this.sphere(group,Math.sin(i*2.4)*.33,1+i*.22,Math.cos(i*2.4)*.33,.064,0xf7fffc,{transparent:true,opacity:.7});d.visible=false;d.castShadow=false;dots.push(d);}
    const therm=new THREE.Group();group.add(therm);therm.visible=false;
    this.capsule(therm,0,1.95,.06,.15,2.25,0xfff6e8);this.sphere(therm,0,.7,.16,.24,0xf0b28a);
    const rod=this.cylinder(therm,0,.76,.22,.063,1,0xf0a16e);const bulb=this.sphere(therm,0,.7,.25,.145,0xf0a16e);
    for(let i=0;i<7;i++){const tick=this.mesh(new THREE.BoxGeometry(.09,.018,.018),this.mat(0xa9b0ab),therm,.11,1.1+i*.28,.22);tick.castShadow=false;}
    return {group,fill,top,dots,therm,rod,bulb,current:0,target:0};
  }
  setTopic(id){if(!this.available)return;this.topic=LEVELS[id]?id:'oxygen';this.revealed=false;const color=COLORS[this.topic];this.pods.forEach(p=>{p.fill.material.color.setHex(color);p.top.material.color.setHex(color);p.target=0;p.current=0;});this.updatePods(1);}
  reveal(flag=true){if(!this.available)return;this.revealed=flag;this.pods.forEach((p,i)=>{p.target=flag?LEVELS[this.topic][i]:0;});if(this.reduced)this.updatePods(1);}
  breathe(direction){if(!this.available||!['in','out'].includes(direction))return;this.phase=direction;this.started=this.elapsed;this.from=this.breathAmount;this.to=direction==='in'?1:0;this.onPhase(direction);if(this.reduced){this.breathAmount=this.to;this.updateLungs();this.phase='idle';queueMicrotask(()=>{if(this.available)this.onPhase('idle');});}}
  updateLungs(){const k=this.breathAmount;this.lungs.scale.set(1+k*.12,.96+k*.11,1+k*.1);}
  updatePods(dt){this.pods.forEach((p,i)=>{p.current+=(p.target-p.current)*Math.min(1,dt*5);const h=Math.max(.001,p.current*2.65);const temp=this.topic==='temperature';p.fill.visible=this.revealed&&!temp;p.top.visible=this.revealed&&!temp;p.fill.scale.y=h;p.fill.position.y=.52+h/2;p.top.position.y=.52+h;p.therm.visible=temp&&this.revealed;p.rod.scale.y=h;p.rod.position.y=.75+h/2;p.bulb.material.color.setHex(i===0?0xf4c17e:0xed7d68);p.rod.material.color.copy(p.bulb.material.color);p.dots.forEach((d,j)=>{d.visible=this.revealed&&!temp&&h>.1;d.position.y=.58+((this.reduced?j/9:(this.elapsed*.08+j/9)%1))*Math.max(0,h-.12);});});}
  tick(){if(!this.available)return;this.frame=requestAnimationFrame(()=>this.tick());const now=performance.now(),dt=Math.min(.05,(now-this.last)/1000);this.last=now;this.elapsed+=dt;
    if(this.phase!=='idle'){const t=clamp((this.elapsed-this.started)/2.5,0,1),smooth=t*t*(3-2*t);this.breathAmount=this.from+(this.to-this.from)*smooth;this.updateLungs();this.air.forEach((s,i)=>{const q=(t*1.5+i/this.air.length)%1;s.visible=t>.03&&t<.97;const v=this.paths[this.phase].getPoint(q);v.x+=Math.sin(i*2.7)*.1;v.z+=Math.cos(i*1.4)*.11;s.position.copy(v);s.material.opacity=Math.sin(q*Math.PI)*.85;});if(t>=1){this.phase='idle';this.air.forEach(s=>s.visible=false);this.onPhase('idle');}}
    this.updatePods(dt);this.renderer.render(this.scene,this.camera);
  }
  cameraUpdate(){this.camera.position.set(Math.sin(this.yaw)*12*Math.sin(this.pitch),this.target.y+Math.cos(this.pitch)*12,Math.cos(this.yaw)*12*Math.sin(this.pitch));this.camera.lookAt(this.target);this.camera.zoom=this.zoom;this.camera.updateProjectionMatrix();}
  resize(){if(!this.available)return;const b=this.canvas.getBoundingClientRect(),w=Math.max(1,b.width),h=Math.max(1,b.height),aspect=w/h;this.renderer.setSize(w,h,false);const half=Math.max(3.3,4.05/aspect);this.camera.left=-half*aspect;this.camera.right=half*aspect;this.camera.top=half;this.camera.bottom=-half;this.cameraUpdate();}
  resetCamera(){if(!this.available)return;this.yaw=.08;this.pitch=1.35;this.zoom=1;this.cameraUpdate();}
  bind(){const on=(type,fn,opts)=>{this.canvas.addEventListener(type,fn,opts);this.listeners.push([type,fn,opts]);};this.canvas.style.touchAction='none';on('pointerdown',e=>{this.canvas.setPointerCapture(e.pointerId);this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});this.pinch=null;});on('pointermove',e=>{const previous=this.pointers.get(e.pointerId);if(!previous)return;const dx=e.clientX-previous.x,dy=e.clientY-previous.y;this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(this.pointers.size>1){const [a,b]=[...this.pointers.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(this.pinch)this.zoom=clamp(this.zoom*d/this.pinch,.75,1.55);this.pinch=d;}else{this.yaw=clamp(this.yaw-dx*.006,-.8,.8);this.pitch=clamp(this.pitch+dy*.004,.95,1.55);}this.cameraUpdate();});const up=e=>{this.pointers.delete(e.pointerId);this.pinch=null;};on('pointerup',up);on('pointercancel',up);on('wheel',e=>{e.preventDefault();this.zoom=clamp(this.zoom*(1-e.deltaY*.001),.75,1.55);this.cameraUpdate();},{passive:false});}
  dispose(){if(!this.available)return;this.available=false;cancelAnimationFrame(this.frame);this.observer?.disconnect();this.listeners.forEach(([t,f,o])=>this.canvas.removeEventListener(t,f,o));const geometries=new Set(),materials=new Set();this.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());this.renderer.dispose();}
}
