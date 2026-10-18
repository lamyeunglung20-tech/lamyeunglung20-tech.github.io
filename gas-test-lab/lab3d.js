import * as THREE from './vendor/three.module.js';

const C={ink:0x385d64,aqua:0x84cbd1,cream:0xfff6df,metal:0x819fa6,glass:0xcbeef0};
const ease=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*(3-2*t);};

/** Small, self-contained 3D observation stage. No network assets or DOM labels. */
export class GasTestWorld {
  constructor(canvas,{onPop=()=>{}}={}) {
    this.canvas=canvas;this.onPop=onPop;this.available=false;this.active=false;this.animations=[];this.listeners=[];this.pointers=new Map();this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.lang='en';
    try{this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});}catch(error){console.warn('3D observation unavailable',error);return;}
    this.available=true;this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));this.renderer.setClearColor(0xe2f4f1);this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.12;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.scene=new THREE.Scene();this.scene.fog=new THREE.Fog(0xe2f4f1,17,32);this.camera=new THREE.PerspectiveCamera(37,1,.1,40);this.target=new THREE.Vector3(0,1.35,0);this.root=new THREE.Group();this.scene.add(this.root);
    this.scene.add(new THREE.HemisphereLight(0xffffff,0x7da9a5,2.8));const key=new THREE.DirectionalLight(0xfff0cf,3.2);key.position.set(-4,7,6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-5,right:5,top:6,bottom:-4,near:.1,far:20});key.shadow.normalBias=.035;this.scene.add(key);const edge=new THREE.DirectionalLight(0xabedff,2);edge.position.set(4,5,-3);this.scene.add(edge);
    this.fogTexture=this.texture(true);this.glowTexture=this.texture(false);this.clock=new THREE.Clock();this.elapsed=0;this.activationTime=0;this.bind();this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);this.resetCamera();this.show('oxygen');this.resize();this.tick();
  }
  texture(fog){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,fog?'rgba(255,255,255,.8)':'rgba(255,230,143,1)');g.addColorStop(.35,fog?'rgba(255,255,255,.5)':'rgba(255,181,67,.55)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
  mat(color,extra={}){return new THREE.MeshStandardMaterial({color,roughness:.48,metalness:0,...extra});}
  mesh(g,m,p=this.root,x=0,y=0,z=0){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;}
  box(p,x,y,z,w,h,d,c,extra={}){return this.mesh(new THREE.BoxGeometry(w,h,d),this.mat(c,extra),p,x,y,z);}
  sphere(p,x,y,z,r,c,extra={}){return this.mesh(new THREE.SphereGeometry(r,20,12),this.mat(c,extra),p,x,y,z);}
  cylinder(p,x,y,z,r,h,c,extra={}){return this.mesh(new THREE.CylinderGeometry(r,r,h,40),this.mat(c,extra),p,x,y,z);}
  torus(p,x,y,z,r,t,c,extra={}){const m=this.mesh(new THREE.TorusGeometry(r,t,8,48),this.mat(c,extra),p,x,y,z);m.rotation.x=Math.PI/2;return m;}
  bar(p,a,b,r,c,extra={}){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av);const m=this.mesh(new THREE.CylinderGeometry(r,r,d.length(),12),this.mat(c,extra),p);m.position.copy(av.add(bv).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m;}
  tube(p,pts,r,c,extra={}){return this.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(x=>new THREE.Vector3(...x))),40,r,10,false),this.mat(c,extra),p);}
  sprite(p,tex,x,y,z,size,color=0xffffff){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,color,transparent:true,opacity:0,depthWrite:false}));s.position.set(x,y,z);s.scale.setScalar(size);p.add(s);return s;}
  clear(){const gs=new Set(),ms=new Set();this.root.traverse(o=>{if(o.geometry)gs.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)ms.add(m);});this.root.clear();gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());this.animations=[];this.active=false;this.popped=false;}
  stage(){this.cylinder(this.root,0,-.15,0,2.65,.24,0x93bdba,{roughness:.65});this.cylinder(this.root,0,-.015,0,2.65,.075,C.cream);this.torus(this.root,0,.025,0,2.52,.022,0xe1d8bb);const floor=this.mesh(new THREE.PlaneGeometry(60,60),this.mat(0xd5eae5),this.root,0,-.29,0);floor.rotation.x=-Math.PI/2;floor.castShadow=false;}
  vessel(r=.8,h=2.3){const p=new THREE.Group();this.root.add(p);const glass=this.mesh(new THREE.CylinderGeometry(r,r,h,48,1,true),new THREE.MeshPhysicalMaterial({color:0xc4edf0,roughness:.12,metalness:0,transparent:true,opacity:.16,side:THREE.DoubleSide,depthWrite:false}),p,0,h/2+.07,0);glass.castShadow=false;this.cylinder(p,0,.085,0,r,.055,0xc6e9ea,{transparent:true,opacity:.36,depthWrite:false});for(const y of [.11,h+.07])this.torus(p,0,y,0,r,.035,0x71a9b4,{metalness:.22,roughness:.19});
    // Fine front highlights and scale marks keep the transparent vessel legible.
    this.bar(p,[-r*.78,.27,r*.6],[-r*.78,h-.1,r*.6],.016,0xffffff,{transparent:true,opacity:.7,depthWrite:false});this.bar(p,[r*.84,.3,r*.53],[r*.84,h*.72,r*.53],.009,0xffffff,{transparent:true,opacity:.6,depthWrite:false});for(let i=0;i<4;i++)this.bar(p,[r*.5,.55+i*.33,r*.87],[r*.69,.55+i*.33,r*.73],.012,0x598a96,{transparent:true,opacity:.6});return p;
  }
  liquid(p,r,h,color,opacity){const l=this.cylinder(p,0,.15+h/2,0,r,h,color,{transparent:true,opacity,roughness:.2,depthWrite:false});l.castShadow=false;l.userData.surface=this.torus(p,0,.15+h,0,r-.01,.016,color,{transparent:true,opacity:.55});return l;}
  flame(p){const f=new THREE.Group();p.add(f);const outer=this.sphere(f,0,.19,0,.16,0xff8d28,{emissive:0xff6816,emissiveIntensity:1.2,roughness:.35});outer.scale.set(.8,1.65,.8);const tip=this.mesh(new THREE.ConeGeometry(.105,.3,16),this.mat(0xffb132,{emissive:0xff8d15,emissiveIntensity:1.3}),f,.015,.49,0);tip.rotation.z=-.12;const core=this.sphere(f,0,.11,.055,.09,0xffec9f,{emissive:0xffcf65,emissiveIntensity:1.4});core.scale.y=1.55;const g=this.sprite(f,this.glowTexture,0,.22,0,1.4,0xffc46e);g.material.opacity=.27;const light=new THREE.PointLight(0xffa142,1.7,3,2);light.position.y=.22;f.add(light);return f;}
  splintScene(id){this.vessel(.78,2.3);const splint=new THREE.Group();this.root.add(splint);this.bar(splint,[-1.85,-.22,0],[0,0,0],.043,0xba824b);this.bar(splint,[-.17,-.02,0],[0,0,0],.046,0x604c37);const ember=this.sphere(splint,0,0,0,.061,0xff782a,{emissive:0xff5f18,emissiveIntensity:1.8});const glow=this.sprite(splint,this.glowTexture,0,0,0,.46,0xff9b42);glow.material.opacity=.6;const flame=this.flame(splint);const pulse=this.sprite(this.root,this.glowTexture,0,2.48,0,1.1,0xffd488);const ring=this.mesh(new THREE.TorusGeometry(.28,.018,8,48),this.mat(0xffc570,{emissive:0xffb258,emissiveIntensity:.8,transparent:true,opacity:0,depthWrite:false}),this.root,0,2.48,0);ring.rotation.x=Math.PI/2;ring.castShadow=false;
    this.animations.push((t,s)=>{if(id==='oxygen'){const k=this.active?ease(s/.85):0;splint.position.set(-1.05*(1-k),2.68-1.12*k,.15);splint.rotation.z=-.14-k*1.05;flame.rotation.z=-splint.rotation.z;flame.visible=this.active&&s>.87;flame.scale.setScalar(this.reduced?1:1+Math.sin(t*8)*.045);ember.visible=true;glow.material.opacity=flame.visible?.25:.55;}else{const k=this.active?ease(s/.8):0;splint.position.set(-1.12*(1-k),2.52,.1);flame.visible=true;flame.scale.setScalar(.7+(this.reduced?0:Math.sin(t*8)*.025));const q=this.active&&!this.reduced?Math.max(0,1-Math.abs(s-1.02)/.22):0;pulse.material.opacity=q*.75;pulse.scale.setScalar(.5+q*.8);ring.material.opacity=q*.65;ring.scale.setScalar(1+(1-q)*1.7);if(this.active&&s>=1&&!this.popped){this.popped=true;this.onPop();}}});
  }
  bubbles(p){for(let i=0;i<13;i++){const b=this.sphere(p,0,0,0,.035+(i%3)*.012,0xe4f9f6,{transparent:true,opacity:.65,roughness:.1,depthWrite:false});b.castShadow=false;this.animations.push((t,s)=>{b.visible=this.active&&s<2.7&&!this.reduced;const k=(t*.55+i/13)%1;b.position.set(.11+Math.sin(i*2.4)*.15,.32+k*.91,.05+Math.cos(i)*.16);b.scale.setScalar(.65+k*.8);});}}
  solutionScene(id){const p=this.vessel(.85,1.85);const indicator=id==='indicator';const liquid=this.liquid(p,.8,1.15,indicator?0xe3434c:0xd7eeec,indicator?.87:.17);const start=new THREE.Color(indicator?0xe3434c:0xd7eeec),end=new THREE.Color(indicator?0xffdd43:0xffffff);this.tube(this.root,[[-1.8,2.3,0],[-.55,2.3,0],[.12,2.27,0],[.13,1.65,0],[.13,.34,0]],.055,0xaccfd3,{transparent:true,opacity:.65,roughness:.13,depthWrite:false});this.tube(this.root,[[-2.12,2.3,0],[-1.8,2.3,0]],.085,0xe2ba84);this.bubbles(p);this.animations.push((t,s)=>{const k=this.active?ease((s-.4)/1.8):0;liquid.material.color.copy(start).lerp(end,k);liquid.userData.surface.material.color.copy(liquid.material.color);liquid.material.opacity=indicator?.87:.17+k*.79;});}
  waterScene(){const p=this.vessel(.9,1.45);this.liquid(p,.85,.87,0x9adbdc,.35);const paper=this.box(this.root,0,2.05,.04,.47,.78,.025,0x478bdd,{roughness:.75});this.cylinder(this.root,1.56,.11,-.16,.45,.18,0x789ea4,{metalness:.3});this.bar(this.root,[1.56,.16,-.16],[1.56,2.9,-.16],.045,0x9eb7b8,{metalness:.55,roughness:.25});this.bar(this.root,[1.56,2.74,-.16],[.04,2.74,-.16],.045,0x9eb7b8,{metalness:.55,roughness:.25});this.box(this.root,1.56,2.73,-.16,.2,.2,.2,0x587b82);this.bar(this.root,[.04,2.74,-.16],[-.11,2.4,.04],.025,0x839d9e,{metalness:.6});this.bar(this.root,[.04,2.74,-.16],[.11,2.4,.04],.025,0x839d9e,{metalness:.6});for(let i=0;i<13;i++){const v=this.sprite(this.root,this.fogTexture,0,1.5,0,.5);this.animations.push((t,s)=>{const k=this.reduced?(i+.5)/13:(t*.18+i/13)%1;v.position.set(Math.sin(i*2.399)*(.15+k*.3),1.28+k*1.3,Math.cos(i*2.399)*.22);v.scale.setScalar(.2+k*.5);v.material.opacity=this.active?Math.sin(k*Math.PI)*.21:0;});}const blue=new THREE.Color(0x478bdd),pink=new THREE.Color(0xef93bb);this.animations.push((t,s)=>paper.material.color.copy(blue).lerp(pink,this.active?ease((s-.3)/1.8):0));}
  starchScene(){
    const p=this.vessel(.88,1.55);
    const sample=this.liquid(p,.83,.8,0xf5eee1,.96);
    const white=new THREE.Color(0xf5eee1),brown=new THREE.Color(0x99521b),blueBlack=new THREE.Color(0x10183f);
    // A glass pipette containing brown iodine solution above the starch sample.
    const dropper=new THREE.Group();this.root.add(dropper);
    this.cylinder(dropper,0,.34,0,.095,.56,0xbce5e9,{transparent:true,opacity:.5,depthWrite:false,roughness:.16});
    this.cylinder(dropper,0,.34,0,.049,.47,0x99521b,{roughness:.3});
    this.mesh(new THREE.ConeGeometry(.095,.18,24),this.mat(0xbce5e9,{transparent:true,opacity:.55,depthWrite:false}),dropper,0,-.03,0).rotation.z=Math.PI;
    this.cylinder(dropper,0,.72,0,.15,.26,0x52616c);
    this.sphere(dropper,0,.85,0,.15,0x52616c);
    dropper.position.set(-1.1,2.05,0);
    const drops=[];
    for(let i=0;i<3;i++){const drop=this.sphere(this.root,0,0,0,.07,0x99521b,{roughness:.25});drop.scale.y=1.35;drop.visible=false;drops.push(drop);}
    this.animations.push((t,s)=>{
      const active=this.active,k=active?ease(s/.45):0;
      dropper.position.set(-1.1*(1-k),2.05,0);
      for(let i=0;i<drops.length;i++){
        const q=(s-.48-i*.52)/.43;
        drops[i].visible=active&&!this.reduced&&q>=0&&q<1;
        drops[i].position.set(0,1.93-Math.max(0,q)*.98,0);
      }
      const added=active?ease((s-.86)/.22):0;
      const reacted=active?ease((s-1.08)/1.35):0;
      sample.material.color.copy(white).lerp(brown,added).lerp(blueBlack,reacted);
      sample.userData.surface.material.color.copy(sample.material.color);
    });
  }
  show(id){if(!this.available)return;this.clear();this.id=['oxygen','hydrogen','lime','indicator','water','starch'].includes(id)?id:'oxygen';this.stage();if(this.id==='oxygen'||this.id==='hydrogen')this.splintScene(this.id);else if(this.id==='water')this.waterScene();else if(this.id==='starch')this.starchScene();else this.solutionScene(this.id);this.resetCamera();this.update();this.resize();}
  play(){if(!this.available)return;this.active=true;this.popped=false;this.activationTime=this.elapsed;this.update();}
  setLanguage(lang){this.lang=lang;}
  resetCamera(){if(!this.available)return;this.yaw=.23;this.pitch=1.24;this.radius=8.5;this.cameraUpdate();}
  cameraUpdate(){if(!this.available)return;this.camera.position.set(this.radius*Math.sin(this.pitch)*Math.sin(this.yaw),this.target.y+this.radius*Math.cos(this.pitch),this.radius*Math.sin(this.pitch)*Math.cos(this.yaw));this.camera.lookAt(this.target);}
  resize(){if(!this.available)return;const b=this.canvas.getBoundingClientRect();if(b.width<2||b.height<2)return;this.renderer.setSize(b.width,b.height,false);this.camera.aspect=b.width/b.height;this.camera.fov=this.camera.aspect<.9?45:37;this.camera.updateProjectionMatrix();}
  bind(){const on=(type,fn,options)=>{this.canvas.addEventListener(type,fn,options);this.listeners.push([type,fn,options]);};this.canvas.style.touchAction='none';on('pointerdown',e=>{this.canvas.setPointerCapture(e.pointerId);this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});this.pinch=null;});on('pointermove',e=>{const prev=this.pointers.get(e.pointerId);if(!prev)return;const dx=e.clientX-prev.x,dy=e.clientY-prev.y;this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(this.pointers.size===2){const a=[...this.pointers.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(this.pinch&&d>1)this.radius=THREE.MathUtils.clamp(this.radius*this.pinch/d,6.2,11);this.pinch=d;}else{this.yaw=THREE.MathUtils.clamp(this.yaw-dx*.006,-.9,.9);this.pitch=THREE.MathUtils.clamp(this.pitch+dy*.004,.75,1.48);}this.cameraUpdate();});const up=e=>{this.pointers.delete(e.pointerId);this.pinch=null;};on('pointerup',up);on('pointercancel',up);on('wheel',e=>{e.preventDefault();this.radius=THREE.MathUtils.clamp(this.radius*(1+e.deltaY*.001),6.2,11);this.cameraUpdate();},{passive:false});}
  update(){const s=this.active?(this.reduced?3:this.elapsed-this.activationTime):0;for(const f of this.animations)f(this.elapsed,s);}
  tick(){if(!this.available)return;this.frame=requestAnimationFrame(()=>this.tick());this.elapsed+=Math.min(.1,this.clock.getDelta());this.update();if(this.canvas.clientWidth>1&&this.canvas.clientHeight>1)this.renderer.render(this.scene,this.camera);}
  dispose(){if(!this.available)return;cancelAnimationFrame(this.frame);this.observer?.disconnect();for(const [type,fn,opts] of this.listeners)this.canvas.removeEventListener(type,fn,opts);this.clear();this.fogTexture.dispose();this.glowTexture.dispose();this.renderer.dispose();this.available=false;}
}
