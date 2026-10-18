import * as THREE from './vendor/three.module.js';

// Original schematic plant diorama: particles and tokens are visual symbols.
export class PlantWorld {
  constructor(canvas,{onPhase=()=>{}}={}) {
    this.canvas=canvas; this.onPhase=onPhase; this.available=false;
    this.state={water:false,carbon:false,light:false,chlorophyll:false,products:false};
    this.running=null; this.startTime=0; this.pointerMap=new Map(); this.disposed=false;
    this.reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    try {
      this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
      this.renderer.setClearColor(0xf6f4e9,0); this.renderer.outputColorSpace=THREE.SRGBColorSpace;
      this.renderer.toneMapping=THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure=1.05;
      this.renderer.shadowMap.enabled=true; this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
      this.scene=new THREE.Scene(); this.scene.fog=new THREE.Fog(0xf6f4e9,18,32);
      this.camera=new THREE.PerspectiveCamera(37,1,.1,60);
      this.target=new THREE.Vector3(0,.85,0); this.azimuth=.34; this.elevation=.21; this.distance=13;
      this.scene.add(new THREE.HemisphereLight(0xfffbea,0x82977b,2.2));
      const key=new THREE.DirectionalLight(0xfff4d7,3); key.position.set(-4,9,8); key.castShadow=true;
      key.shadow.mapSize.set(1024,1024); Object.assign(key.shadow.camera,{left:-7,right:7,top:7,bottom:-5,near:1,far:25}); key.shadow.bias=-.0007; this.scene.add(key);
      const fill=new THREE.DirectionalLight(0xdaf2f5,1.3); fill.position.set(6,3,-4); this.scene.add(fill);
      this.materials={}; this.build(); this.bind(); this.resize(); this.available=true;
      this.loop=this.loop.bind(this); this.raf=requestAnimationFrame(this.loop);
    } catch(error) { this.renderer?.dispose(); this.available=false; }
  }
  mat(color,options={}) {
    return new THREE.MeshStandardMaterial({color,roughness:.72,metalness:0,...options});
  }
  mesh(geometry,material,parent=this.scene) { const m=new THREE.Mesh(geometry,material);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m; }
  sphere(pos,r,material,parent=this.scene,scale=null) { const m=this.mesh(new THREE.SphereGeometry(r,24,16),material,parent);m.position.set(...pos);if(scale)m.scale.set(...scale);return m; }
  tube(points,r,material,parent=this.scene) {
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const m=this.mesh(new THREE.TubeGeometry(curve,40,r,8,false),material,parent);return m;
  }
  build() {
    const green=this.mat(0x428f4a), vein=this.mat(0x9bc271), stem=this.mat(0x759848), root=this.mat(0xf3dfb3);
    const soil=this.mat(0x9a7053), soilFront=this.mat(0xb58967), cream=this.mat(0xe7ddc5);
    const floor=this.mesh(new THREE.CircleGeometry(6.1,64),this.mat(0xe8e8d7));floor.rotation.x=-Math.PI/2;floor.position.y=-1.65;
    const plinth=this.mesh(new THREE.CylinderGeometry(3.9,4.05,.18,64),cream);plinth.position.y=-1.55;plinth.scale.z=.72;
    const earth=this.mesh(new THREE.BoxGeometry(5.5,.97,2.45),[soil,soil,soil,soil,soilFront,soil]);earth.position.y=-.99;
    const bottom=this.mesh(new THREE.BoxGeometry(5.6,.12,2.55),cream);bottom.position.y=-1.47;
    // Cross-section striations and small soil grains stay behind exposed roots.
    const grainMat=this.mat(0x76513e);
    for(let i=0;i<38;i++){
      const x=((i*1.618)%1)*5.2-2.6,y=-.58-((i*.317)%1)*.8;
      this.sphere([x,y,1.237],.025+(i%3)*.009,grainMat,this.scene,[1.6,.7,.34]);
    }
    const topMat=this.mat(0xabc88b);
    for(let i=0;i<24;i++){
      const x=((i*.618)%1)*5.15-2.57,z=((i*.391)%1)*2.1-1.05;
      if(Math.abs(x)<.4)continue;
      this.sphere([x,-.49,z],.08+(i%3)*.025,topMat,this.scene,[1.8,.3,1.1]);
    }
    this.tube([[0,-.45,.05],[.03,.15,0],[-.05,.9,.02],[.04,1.65,.02],[.02,2.25,.02]],.105,stem);
    this.tube([[0,.5,0],[-.38,.66,.12],[-.75,.8,.15]],.065,stem);
    this.tube([[0,1.06,0],[.3,1.27,.12],[.61,1.42,.15]],.07,stem);
    this.tube([[.02,1.73,0],[-.15,1.99,.05],[-.32,2.12,.1]],.05,stem);
    this.leaves=[];this.pigments=[];
    this.makeLeaf([.35,1.25,.15],.23,1.05,green,vein);
    this.makeLeaf([-.38,.71,.13],Math.PI-.16,.82,green,vein);
    this.makeLeaf([-.15,1.91,.08],1.45,.62,green,vein);
    // Pale roots directly on the cutaway front: visible even on a small screen.
    this.tube([[0,-.46,.05],[.03,-.61,.75],[.03,-.76,1.29],[-.08,-1.34,1.29]],.073,root);
    const branches=[[[.02,-.74,1.29],[-.55,-.85,1.3],[-1.26,-1.03,1.3],[-2.25,-1.12,1.3]],[[.01,-.83,1.29],[.7,-.87,1.3],[1.4,-1.12,1.3],[2.35,-1.22,1.3]],[[0,-1.02,1.29],[-.5,-1.19,1.3],[-1.3,-1.31,1.3]],[[.4,-.84,1.3],[.98,-.65,1.3],[1.65,-.7,1.3]]];
    branches.forEach(p=>this.tube(p,.037,root));
    for(const [x,y,dir] of [[-1,-.98,-1],[-1.65,-1.07,1],[-.54,-.85,1],[.9,-.96,1],[1.65,-1.16,-1],[-.6,-1.23,-1],[1.28,-.68,1]])this.tube([[x,y,1.3],[x+dir*.23,y-.12,1.31],[x+dir*.35,y-.24,1.31]],.018,root);
    this.waterMarks=new THREE.Group();this.scene.add(this.waterMarks);
    const waterMat=this.mat(0x6bbddd,{emissive:0x236c89,emissiveIntensity:.1});
    [[-1.85,-.85],[-1.35,-1.16],[1.75,-.86]].forEach(([x,y],i)=>{const drop=this.sphere([x,y,1.34],.085,waterMat,this.waterMarks,[.75,1.3,.5]);drop.rotation.z=.15*i;});
    this.sun=new THREE.Group();this.sun.position.set(-2.7,3.35,-.25);this.scene.add(this.sun);
    this.sunMat=this.mat(0xffd56c,{emissive:0xffb52e,emissiveIntensity:.25});
    this.sphere([0,0,0],.41,this.sunMat,this.sun);
    const halo=this.sphere([0,0,0],.51,this.mat(0xffdf80,{transparent:true,opacity:.15,depthWrite:false}),this.sun);
    for(let i=0;i<10;i++){let a=i*Math.PI/5;this.tube([[Math.cos(a)*.62,Math.sin(a)*.62,0],[Math.cos(a)*.79,Math.sin(a)*.79,0]],.035,this.sunMat,this.sun);}
    this.cloud=new THREE.Group();this.cloud.position.set(2.85,2.96,-.3);this.scene.add(this.cloud);
    const cloudMat=this.mat(0xffffff,{roughness:1});
    [[-.4,0,0,.29],[0,.12,0,.4],[.4,0,0,.3],[.05,-.1,.05,.32]].forEach(([x,y,z,r])=>this.sphere([x,y,z],r,cloudMat,this.cloud,[1,.8,.7]));
    this.carbonMarks=new THREE.Group();this.scene.add(this.carbonMarks);
    const carbonMat=this.mat(0xa88ed0);
    [[2.9,2.35,.3],[3.2,1.94,.3],[2.8,1.65,.35]].forEach(p=>this.sphere(p,.07,carbonMat,this.carbonMarks));
    this.rays=new THREE.Group();this.scene.add(this.rays);
    const rayMat=this.mat(0xf6c65a,{transparent:true,opacity:.6,emissive:0xffc855,emissiveIntensity:.3});
    this.lightPaths=[[[ -2.4,3.12,.1],[-1.2,2.85,.3],[.6,2.05,.5]],[[-2.5,2.92,.1],[-1.1,2.4,.3],[1.15,1.85,.45]],[[-2.25,3.18,.1],[-.9,2.95,.3],[1.6,2,.45]]];
    this.lightPaths.forEach(p=>{const m=this.tube(p,.014,rayMat,this.rays);m.castShadow=false;});
    this.glucose=new THREE.Group();this.scene.add(this.glucose);
    const sugarMat=this.mat(0xf3bb50,{metalness:.15,roughness:.4,emissive:0xe8a238,emissiveIntensity:.12});
    for(let i=0;i<3;i++){
      const shape=new THREE.Shape();for(let j=0;j<6;j++){const a=j*Math.PI/3;const x=Math.cos(a)*.16,y=Math.sin(a)*.16;j?shape.lineTo(x,y):shape.moveTo(x,y);}shape.closePath();
      const token=this.mesh(new THREE.ExtrudeGeometry(shape,{depth:.065,bevelEnabled:true,bevelSize:.028,bevelThickness:.028,bevelSegments:2,steps:1}),sugarMat,this.glucose);
      token.position.set(.8+i*.42,1.83+(i%2)*.18,.7);token.rotation.z=.22*(i-1);
      this.sphere([token.position.x,token.position.y,token.position.z+.12],.043,this.mat(0xffedaa),this.glucose,[1,1,.4]);
    }
    this.oxygenMarks=new THREE.Group();this.scene.add(this.oxygenMarks);
    const bubbleMat=this.mat(0x87d9d2,{transparent:true,opacity:.55,roughness:.15,metalness:.05});
    [[2.58,1.15,.5],[2.95,1.48,.4],[3.21,1.1,.45]].forEach((p,i)=>{
      this.sphere(p,.105+i*.022,bubbleMat,this.oxygenMarks);
      this.sphere([p[0]-.028,p[1]+.04,p[2]+.1],.023,this.mat(0xf4fffa),this.oxygenMarks);
    });
    this.paths={water:new THREE.CatmullRomCurve3([[-1.9,-1.08,1.38],[-1,-1,1.38],[0,-.8,1.38],[0,-.4,.15],[0,.5,.22],[.25,1.24,.3],[1.18,1.65,.5]].map(p=>new THREE.Vector3(...p))),carbon:new THREE.CatmullRomCurve3([[3,2.3,.5],[2.8,2.1,.55],[2.3,1.95,.6],[1.6,1.7,.6]].map(p=>new THREE.Vector3(...p))),light:new THREE.CatmullRomCurve3(this.lightPaths[1].map(p=>new THREE.Vector3(...p))),oxygen:new THREE.CatmullRomCurve3([[1.5,1.55,.6],[2.15,1.38,.7],[2.8,1.5,.6],[3.5,1.95,.5]].map(p=>new THREE.Vector3(...p)))};
    this.flows={};
    for(const [kind,color] of Object.entries({water:0x55bde9,carbon:0xa17ac7,light:0xffda66,oxygen:0x84ded1})){
      const group=new THREE.Group();this.scene.add(group);const material=this.mat(color,{emissive:color,emissiveIntensity:kind==='light'?.55:.16,transparent:true,opacity:.95});
      for(let i=0;i<9;i++){let m=this.sphere([0,0,0],kind==='light'?.045:.06,material,group);m.castShadow=false;}
      this.flows[kind]=group;
    }
    this.setState(this.state);
  }
  makeLeaf(pos,angle,scale,green,vein) {
    const group=new THREE.Group();group.position.set(...pos);group.rotation.z=angle;group.scale.setScalar(scale);this.scene.add(group);this.leaves.push(group);
    const shape=new THREE.Shape();shape.moveTo(0,0);shape.bezierCurveTo(.52,.76,1.48,.85,2.18,0);shape.bezierCurveTo(1.45,-.7,.55,-.69,0,0);
    const geo=new THREE.ExtrudeGeometry(shape,{depth:.07,bevelEnabled:true,bevelSize:.045,bevelThickness:.045,bevelSegments:3,curveSegments:24,steps:1});
    this.mesh(geo,green,group);
    this.tube([[0,0,.14],[.7,.025,.16],[1.5,.02,.16],[2.13,0,.13]],.022,vein,group);
    for(let i=0;i<4;i++){
      const x=.34+i*.34,dy=Math.sin((x+.1)/2.2*Math.PI)*.5;
      for(const sign of [-1,1])this.tube([[x,0,.15],[x+.22,sign*dy*.56,.16],[x+.29,sign*dy,.14]],.012,vein,group);
    }
    const pigments=new THREE.Group();group.add(pigments);
    const pigmentMat=this.mat(0x297a3e,{emissive:0x76d95b,emissiveIntensity:.08});
    for(let i=0;i<9;i++){
      const x=.43+(i%3)*.45,y=(Math.floor(i/3)-1)*.26;
      const dot=this.sphere([x,y,.18],.065,pigmentMat,pigments,[1.35,.85,.34]);dot.castShadow=false;
    }
    this.pigments.push(pigments);
  }
  setState(next={}) {
    this.state={...this.state,...next};
    if(!this.scene)return;
    this.waterMarks.visible=this.state.water;this.carbonMarks.visible=this.state.carbon;
    this.rays.visible=this.state.light;this.pigments.forEach(g=>g.visible=this.state.chlorophyll);
    this.glucose.visible=this.state.products;this.oxygenMarks.visible=this.state.products;
    if(!this.running)Object.values(this.flows).forEach(g=>g.visible=false);
  }
  play(kind) {
    if(!this.available)return;
    if(!['water','carbon','light','chlorophyll','products'].includes(kind))return;
    this.running=kind;this.startTime=performance.now();this.onPhase(kind);
    // State is owned by the caller; the animation itself does not unlock a resource.
    if(this.reduced){this.finish();return;}
  }
  finish(){this.running=null;Object.values(this.flows).forEach(g=>g.visible=false);this.setState(this.state);this.onPhase('idle');}
  loop(now) {
    if(this.disposed)return;
    const t=now*.001;
    if(this.running){
      const age=(now-this.startTime)/1000,kind=this.running;
      for(const [name,group] of Object.entries(this.flows)){
        const show=(kind===name)||(kind==='chlorophyll'&&name==='light')||(kind==='products'&&this.state.water&&this.state.carbon&&this.state.light&&this.state.chlorophyll);
        group.visible=show;
        if(show)group.children.forEach((m,i)=>{const p=(age*.42+i/group.children.length)%1;m.position.copy(this.paths[name].getPoint(p));m.scale.setScalar(.7+Math.sin(p*Math.PI)*.5);});
      }
      if(kind==='chlorophyll'||kind==='light'||kind==='products')this.pigments.forEach(g=>g.children.forEach(m=>{m.material.emissiveIntensity=.16+Math.max(0,Math.sin(age*5))*.65;}));
      if(kind==='products'){this.glucose.visible=true;this.oxygenMarks.visible=true;this.glucose.position.y=Math.sin(age*3)*.035;}
      if(age>(kind==='products'?4:3))this.finish();
    }
    if(!this.reduced){this.sun.rotation.z=Math.sin(t*.5)*.025;this.cloud.position.y=2.96+Math.sin(t*.7)*.025;}
    this.renderer.render(this.scene,this.camera);this.raf=requestAnimationFrame(this.loop);
  }
  cameraUpdate(){
    const d=this.distance;this.camera.position.set(Math.sin(this.azimuth)*d*Math.cos(this.elevation),this.target.y+Math.sin(this.elevation)*d,Math.cos(this.azimuth)*d*Math.cos(this.elevation));this.camera.lookAt(this.target);
  }
  resetCamera(){this.azimuth=.34;this.elevation=.21;this.distance=this.baseDistance||13;this.cameraUpdate();}
  resize(){if(!this.renderer)return;const r=this.canvas.getBoundingClientRect();const w=Math.max(1,r.width),h=Math.max(1,r.height);this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.baseDistance=Math.max(12,8.7/(2*Math.tan(THREE.MathUtils.degToRad(37/2))*this.camera.aspect));this.distance=this.baseDistance;this.camera.updateProjectionMatrix();this.cameraUpdate();}
  bind(){
    this.handlers={};
    this.handlers.down=e=>{this.pointerMap.set(e.pointerId,{x:e.clientX,y:e.clientY});this.canvas.setPointerCapture(e.pointerId);this.pinch=null;};
    this.handlers.move=e=>{const prev=this.pointerMap.get(e.pointerId);if(!prev)return;const dx=e.clientX-prev.x,dy=e.clientY-prev.y;this.pointerMap.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(this.pointerMap.size===1){this.azimuth=THREE.MathUtils.clamp(this.azimuth+dx*.005,-.55,.65);this.elevation=THREE.MathUtils.clamp(this.elevation+dy*.003,.08,.4);}else{const p=[...this.pointerMap.values()];const dist=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(this.pinch)this.distance=THREE.MathUtils.clamp(this.distance*this.pinch/dist,this.baseDistance*.85,this.baseDistance*1.25);this.pinch=dist;}this.cameraUpdate();};
    this.handlers.up=e=>{this.pointerMap.delete(e.pointerId);this.pinch=null;};
    this.canvas.addEventListener('pointerdown',this.handlers.down);this.canvas.addEventListener('pointermove',this.handlers.move);this.canvas.addEventListener('pointerup',this.handlers.up);this.canvas.addEventListener('pointercancel',this.handlers.up);
    this.canvas.style.touchAction='none';this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(this.canvas);
  }
  dispose(){
    this.disposed=true;cancelAnimationFrame(this.raf);this.observer?.disconnect();
    if(this.handlers){for(const [event,key] of [['pointerdown','down'],['pointermove','move'],['pointerup','up'],['pointercancel','up']])this.canvas.removeEventListener(event,this.handlers[key]);}
    const materials=new Set();this.scene?.traverse(o=>{o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});materials.forEach(m=>m.dispose());this.renderer?.dispose();this.pointerMap.clear();
  }
}
