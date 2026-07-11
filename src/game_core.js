'use strict';
/* ================= Carter World — core ================= */
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const angLerp=(a,b,t)=>{const d=((b-a)%(Math.PI*2)+Math.PI*3)%(Math.PI*2)-Math.PI;return a+d*t;};
const dist2=(x1,z1,x2,z2)=>{const dx=x1-x2,dz=z1-z2;return dx*dx+dz*dz;};
const IS_TOUCH=('ontouchstart' in window)||navigator.maxTouchPoints>0;

/* ---------------- save ---------------- */
const SAVE_KEY='cw_save_v3';
let save=loadSave();
function loadSave(){
  try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));
    if(s&&s.v===3){s.inv=s.inv||{};s.orders=s.orders||[];s.got=s.got||[];return s;}
  }catch(e){}
  return {v:3,name:'Carter',shirt:'#2e6fe0',coins:0,inv:{},orders:[],got:[],stage:0,lastDaily:'',sound:true};
}
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(save));}catch(e){}}

/* ---------------- snack catalog (all real, Amazon-orderable) ---------------- */
const CATALOG=[
{sec:'🔥 Chips & Crunchy',items:[
 {id:'takis',   nm:'Takis Fuego',            em:'🌶️', pr:4, col:'#5b2d8e', q:'Takis Fuego Hot Chili Pepper Lime 9.9 oz'},
 {id:'hotch',   nm:"Flamin' Hot Cheetos",    em:'🔥', pr:4, col:'#d31f26', q:'Cheetos Crunchy Flamin Hot 8.5 oz'},
 {id:'dorna',   nm:'Doritos Nacho Cheese',   em:'🧀', pr:3, col:'#c8102e', q:'Doritos Nacho Cheese Party Size'},
 {id:'dorcr',   nm:'Cool Ranch Doritos',     em:'🤠', pr:3, col:'#1b62b5', q:'Doritos Cool Ranch Party Size'},
 {id:'lays',    nm:"Lay's Classic",          em:'🥔', pr:3, col:'#f5c518', q:'Lays Classic Potato Chips Party Size'},
 {id:'pring',   nm:'Pringles Original',      em:'🥫', pr:3, col:'#d02027', q:'Pringles Original 5.2 oz'},
 {id:'funyun',  nm:'Funyuns',                em:'🧅', pr:3, col:'#f2b900', q:'Funyuns Onion Flavored Rings 6 oz'},
 {id:'gold',    nm:'Goldfish Cheddar',       em:'🐠', pr:3, col:'#e87f1e', q:'Goldfish Cheddar Crackers 30 oz carton'},
 {id:'skinny',  nm:'SkinnyPop Popcorn',      em:'🍿', pr:3, col:'#2a9d8f', q:'SkinnyPop Original Popcorn snack bags'},
 {id:'chex',    nm:'Chex Mix',               em:'🥨', pr:3, col:'#8a4b1e', q:'Chex Mix Traditional Savory 8.75 oz'},
]},
{sec:'🍬 Candy',items:[
 {id:'spk',     nm:'Sour Patch Kids',        em:'😝', pr:3, col:'#f7d117', q:'Sour Patch Kids 8 oz bag'},
 {id:'skit',    nm:'Skittles',               em:'🌈', pr:2, col:'#c9002b', q:'Skittles Original Share Size'},
 {id:'starb',   nm:'Starburst',              em:'🍓', pr:2, col:'#ff5fa2', q:'Starburst Original Share Size'},
 {id:'nerds',   nm:'Nerds Gummy Clusters',   em:'🟣', pr:3, col:'#8b1fc4', q:'Nerds Gummy Clusters Rainbow 8 oz'},
 {id:'haribo',  nm:'Haribo Gummy Bears',     em:'🐻', pr:3, col:'#f2c500', q:'Haribo Goldbears 8 oz'},
 {id:'jolly',   nm:'Jolly Ranchers',         em:'🍭', pr:2, col:'#20376e', q:'Jolly Rancher Hard Candy Original 7 oz'},
 {id:'airhd',   nm:'Airheads',               em:'🎈', pr:2, col:'#00a3e0', q:'Airheads Assorted 6 bar pack'},
 {id:'warhd',   nm:'Warheads',               em:'😵', pr:2, col:'#1f1f1f', q:'Warheads Extreme Sour Hard Candy 3.25 oz'},
 {id:'ringp',   nm:'Ring Pops',              em:'💍', pr:2, col:'#e6007e', q:'Ring Pop Assorted 10 count'},
 {id:'baby',    nm:'Sour Punch Straws',      em:'🥢', pr:2, col:'#e01f26', q:'Sour Punch Straws Rainbow 4.5 oz'},
]},
{sec:'🍫 Chocolate',items:[
 {id:'mms',     nm:"M&M's",                  em:'🔵', pr:2, col:'#5b3a21', q:'M&Ms Milk Chocolate Share Size'},
 {id:'reese',   nm:"Reese's Cups",           em:'🥜', pr:2, col:'#f26f21', q:'Reeses Peanut Butter Cups King Size'},
 {id:'kitkat',  nm:'Kit Kat',                em:'🍫', pr:2, col:'#d31f26', q:'Kit Kat King Size'},
 {id:'snick',   nm:'Snickers',               em:'🥖', pr:2, col:'#4a2c17', q:'Snickers King Size'},
 {id:'twix',    nm:'Twix',                   em:'🟤', pr:2, col:'#c9a227', q:'Twix Caramel King Size'},
 {id:'hershc',  nm:"Hershey's Cookies'n'Creme",em:'🍪', pr:2, col:'#d8d8d8', q:'Hersheys Cookies n Creme King Size'},
 {id:'milky',   nm:'Milky Way',              em:'🌌', pr:2, col:'#1f6e43', q:'Milky Way King Size'},
 {id:'butter',  nm:'Butterfinger',           em:'🧈', pr:2, col:'#f7b500', q:'Butterfinger King Size'},
]},
{sec:'🍪 Cookies & Sweet Snacks',items:[
 {id:'oreo',    nm:'Oreos',                  em:'⚫', pr:3, col:'#1b3fa0', q:'Oreo Chocolate Sandwich Cookies Family Size'},
 {id:'chips',   nm:'Chips Ahoy!',            em:'🍪', pr:3, col:'#1b62d4', q:'Chips Ahoy Original Family Size'},
 {id:'rkt',     nm:'Rice Krispies Treats',   em:'🟦', pr:3, col:'#2a7fd4', q:'Rice Krispies Treats Original 12 count'},
 {id:'cosmic',  nm:'Cosmic Brownies',        em:'🌠', pr:3, col:'#3b2a6e', q:'Little Debbie Cosmic Brownies 12 count'},
 {id:'popt',    nm:'Pop-Tarts Strawberry',   em:'🍞', pr:3, col:'#e94e8a', q:'Pop Tarts Frosted Strawberry 16 count'},
 {id:'nutter',  nm:'Nutter Butter',          em:'🥪', pr:3, col:'#c8863c', q:'Nutter Butter Family Size'},
]},
{sec:'🥤 Drinks',items:[
 {id:'gator',   nm:'Gatorade Cool Blue',     em:'💧', pr:2, col:'#1b62d4', q:'Gatorade Cool Blue 28 oz'},
 {id:'prime',   nm:'Prime Hydration',        em:'⚡', pr:4, col:'#19c3e5', q:'Prime Hydration Blue Raspberry'},
 {id:'capri',   nm:'Capri Sun',              em:'🧃', pr:3, col:'#b8c4cc', q:'Capri Sun Fruit Punch 10 pack'},
 {id:'drp',     nm:'Dr Pepper',              em:'🥤', pr:2, col:'#6e1423', q:'Dr Pepper 12 pack cans'},
 {id:'sprite',  nm:'Sprite',                 em:'🍋', pr:2, col:'#118a3c', q:'Sprite 12 pack cans'},
 {id:'jammer',  nm:'Kool-Aid Jammers',       em:'🎯', pr:3, col:'#e01f7a', q:'Kool-Aid Jammers Tropical Punch 10 pack'},
]},
{sec:'🧊 QT Specials (eat right now!)',items:[
 {id:'slush',   nm:'QT Slushie',             em:'🧊', pr:1, col:'#7fd4ff', q:'', now:true},
 {id:'hotdog',  nm:'QT Hot Dog',             em:'🌭', pr:1, col:'#c46a1e', q:'', now:true},
]},
];
const ALL_ITEMS={};CATALOG.forEach(s=>s.items.forEach(i=>{ALL_ITEMS[i.id]=i;}));

/* ---------------- audio (all synthesized) ---------------- */
let AC=null,master=null,engine=null;
function audioInit(){
  if(AC)return;
  try{
    AC=new (window.AudioContext||window.webkitAudioContext)();
    master=AC.createGain();master.gain.value=save.sound?0.5:0;master.connect(AC.destination);
  }catch(e){}
}
function blip(f,dur,type,vol,when,f2){
  if(!AC)return;const o=AC.createOscillator(),g=AC.createGain();
  o.type=type||'sine';o.frequency.setValueAtTime(f,when);
  if(f2)o.frequency.exponentialRampToValueAtTime(f2,when+dur);
  g.gain.setValueAtTime(vol,when);g.gain.exponentialRampToValueAtTime(0.001,when+dur);
  o.connect(g);g.connect(master);o.start(when);o.stop(when+dur+0.02);
}
function sfx(n){
  if(!AC)return;const t=AC.currentTime;
  switch(n){
    case 'coin': blip(1318,.09,'sine',.16,t);blip(1976,.14,'sine',.16,t+.07);break;
    case 'jump': blip(300,.15,'sine',.1,t,600);break;
    case 'pop':  blip(500,.08,'square',.06,t,900);break;
    case 'stage':blip(660,.1,'sine',.14,t);blip(880,.1,'sine',.14,t+.1);blip(1320,.22,'sine',.14,t+.2);break;
    case 'buy':  blip(523,.1,'triangle',.16,t);blip(659,.1,'triangle',.16,t+.09);blip(784,.1,'triangle',.16,t+.18);blip(1046,.25,'triangle',.18,t+.27);break;
    case 'swipe':blip(2200,.18,'sawtooth',.05,t,600);break;
    case 'ding': blip(988,.3,'sine',.15,t);blip(784,.45,'sine',.15,t+.25);break;
    case 'thud': blip(90,.15,'square',.12,t,50);break;
    case 'bark': blip(880,.06,'square',.09,t,560);blip(980,.07,'square',.09,t+.1,600);break; // chihuahua yip!
    case 'munch':blip(200,.06,'square',.08,t,120);blip(180,.06,'square',.08,t+.1,110);break;
    case 'horn': blip(392,.35,'square',.09,t);blip(494,.35,'square',.09,t);break;
    case 'error':blip(220,.2,'square',.08,t,170);break;
    case 'fill': blip(330,.5,'sine',.06,t,520);break;
    case 'bell': blip(1568,.12,'sine',.12,t);blip(1568,.14,'sine',.12,t+.16);break;
    case 'skid': blip(1150,.3,'sawtooth',.045,t,170);blip(760,.26,'sawtooth',.03,t+.03,130);break;
  }
}
function engineStart(){
  if(!AC||engine)return;
  const o=AC.createOscillator(),g=AC.createGain(),f=AC.createBiquadFilter();
  o.type='sawtooth';o.frequency.value=60;f.type='lowpass';f.frequency.value=400;
  g.gain.value=0.0;o.connect(f);f.connect(g);g.connect(master);o.start();
  engine={o,g};
}
function engineStop(){if(engine){try{engine.g.gain.value=0;engine.o.stop();}catch(e){}engine=null;}}
function engineSet(sp){if(engine){engine.o.frequency.value=55+Math.abs(sp)*7;engine.g.gain.value=0.035+Math.min(Math.abs(sp)/24,1)*0.05;}}
function audioKick(){if(AC&&AC.state!=='running'){try{AC.resume();}catch(e){}}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')audioKick();});
window.addEventListener('pointerdown',audioKick,true);
window.addEventListener('touchstart',audioKick,true);

/* ---------------- three.js scene ---------------- */
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x7EC8F0).convertSRGBToLinear();
scene.fog=new THREE.Fog(new THREE.Color(0xcfe9f7).convertSRGBToLinear(),70,240);
const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,0.1,600);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setSize(innerWidth,innerHeight);
const IS_PHONE=IS_TOUCH&&Math.min(screen.width,screen.height)<500;
renderer.setPixelRatio(Math.min(devicePixelRatio,IS_PHONE?1.3:(IS_TOUCH?1.5:1.75)));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
/* filmic pipeline: sRGB output + ACES tone mapping. ALL material/light hex colors
   are authored as sRGB and must be convertSRGBToLinear()'d — mat() and the boot-time
   sweep in game_logic handle this. Canvas textures get encoding=sRGBEncoding in texCanvas. */
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.28;
$('game').appendChild(renderer.domElement);

const hemi=new THREE.HemisphereLight(0xcfe8ff,0x8a9a5a,0.62);
hemi.color.convertSRGBToLinear();hemi.groundColor.convertSRGBToLinear();
scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff1d0,1.25);
sun.color.convertSRGBToLinear();
sun.castShadow=true;
sun.shadow.mapSize.set(IS_TOUCH?1024:2048,IS_TOUCH?1024:2048);
sun.shadow.camera.left=-70;sun.shadow.camera.right=70;
sun.shadow.camera.top=70;sun.shadow.camera.bottom=-70;
sun.shadow.camera.near=1;sun.shadow.camera.far=260;
sun.shadow.bias=-0.0004;
scene.add(sun);scene.add(sun.target);
const storeLight=new THREE.PointLight(0xfff4e0,0.9,26);
storeLight.position.set(117,4,-40);scene.add(storeLight);

/* snack-bag product art: brand-colored bag with the item's emoji + name */
const _bagMats={};
function bagMat(id){
  if(!_bagMats[id]){
    const it=ALL_ITEMS[id];
    const tex=texCanvas(128,160,c=>{
      const col=(it&&it.col)||'#c0392b';
      c.fillStyle=col;
      c.beginPath();c.moveTo(10,20);c.lineTo(118,20);c.lineTo(112,152);c.lineTo(16,152);c.closePath();c.fill();
      c.fillStyle='rgba(255,255,255,0.4)';c.fillRect(10,14,108,9);       // crimped top
      c.fillStyle='rgba(255,255,255,0.14)';                              // shine stripe
      c.beginPath();c.moveTo(24,20);c.lineTo(42,20);c.lineTo(32,152);c.lineTo(20,152);c.closePath();c.fill();
      c.fillStyle='#fff';c.beginPath();c.ellipse(64,72,44,34,0,0,7);c.fill();
      c.font='42px serif';c.textAlign='center';c.textBaseline='middle';c.fillText(it?it.em:'🍬',64,71);
      c.fillStyle='#fff';c.font='900 15px Arial';c.textAlign='center';c.textBaseline='alphabetic';
      c.strokeStyle='rgba(0,0,0,0.35)';c.lineWidth=3;
      const nm=(it?it.nm:'').split(' ');
      const l1=nm.slice(0,2).join(' ').slice(0,13), l2=nm.slice(2).join(' ').slice(0,13);
      c.strokeText(l1,64,126);c.fillText(l1,64,126);
      if(l2){c.strokeText(l2,64,144);c.fillText(l2,64,144);}
    });
    _bagMats[id]=new THREE.MeshLambertMaterial({map:tex,transparent:true});
  }
  return _bagMats[id];
}
function bagBox(id,w,h,d){
  const side=mat(0x7d8894);
  return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),[side,side,side,side,bagMat(id),bagMat(id)]);
}

/* colliders: axis-aligned boxes {x0,x1,z0,z1} */
const colliders=[];
function addCol(cx,cz,w,d,cam){colliders.push({x0:cx-w/2,x1:cx+w/2,z0:cz-d/2,z1:cz+d/2,cam:!!cam});}
function collideCircle(px,pz,r){
  for(let i=0;i<colliders.length;i++){
    const c=colliders[i];
    const nx=clamp(px,c.x0,c.x1),nz=clamp(pz,c.z0,c.z1);
    let dx=px-nx,dz=pz-nz;const d2=dx*dx+dz*dz;
    if(d2<r*r){
      if(d2>1e-9){const d=Math.sqrt(d2);px=nx+dx/d*r;pz=nz+dz/d*r;}
      else{
        const l=px-c.x0,ri=c.x1-px,tp=pz-c.z0,bt=c.z1-pz;
        const m=Math.min(l,ri,tp,bt);
        if(m===l)px=c.x0-r;else if(m===ri)px=c.x1+r;
        else if(m===tp)pz=c.z0-r;else pz=c.z1+r;
      }
    }
  }
  return [px,pz];
}

/* ---------------- material + geometry helpers ---------------- */
const mats={};
function mat(color){
  const k='m'+color;
  if(!mats[k]){
    mats[k]=new THREE.MeshLambertMaterial({color});
    mats[k].color.convertSRGBToLinear();
    mats[k].userData._lin=1;
  }
  return mats[k];
}
function box(w,h,d,color,x,y,z,parent,ry){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));
  m.position.set(x,y,z);if(ry)m.rotation.y=ry;
  (parent||scene).add(m);return m;
}
function texCanvas(w,h,draw){
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;
  draw(cv.getContext('2d'));
  const t=new THREE.CanvasTexture(cv);t.anisotropy=4;
  t.encoding=THREE.sRGBEncoding;
  return t;
}
function signMesh(w,h,tex){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),
    new THREE.MeshBasicMaterial({map:tex,transparent:true}));
  return m;
}

/* ---------------- sky dome + sun ---------------- */
const skyGroup=new THREE.Group();scene.add(skyGroup);
{
  const skyTex=texCanvas(64,512,c=>{
    const gr=c.createLinearGradient(0,0,0,512);
    gr.addColorStop(0,'#3f9be4');gr.addColorStop(0.38,'#7EC8F0');
    gr.addColorStop(0.50,'#aadcf5');
    gr.addColorStop(0.56,'#cfe9f7');                 // bright haze band == scene.fog
    gr.addColorStop(1,'#d8eef6');
    c.fillStyle=gr;c.fillRect(0,0,64,512);
  });
  const dome=new THREE.Mesh(new THREE.SphereGeometry(430,20,14),
    new THREE.MeshBasicMaterial({map:skyTex,side:THREE.BackSide,fog:false,depthWrite:false}));
  dome.renderOrder=-10;skyGroup.add(dome);
  const glowTex=texCanvas(128,128,c=>{
    const gr=c.createRadialGradient(64,64,4,64,64,62);
    gr.addColorStop(0,'rgba(255,246,214,1)');gr.addColorStop(0.25,'rgba(255,238,180,0.9)');
    gr.addColorStop(0.6,'rgba(255,225,140,0.25)');gr.addColorStop(1,'rgba(255,225,140,0)');
    c.fillStyle=gr;c.fillRect(0,0,128,128);
  });
  const sunSpr=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,fog:false,depthWrite:false,transparent:true}));
  sunSpr.scale.set(120,120,1);
  const sd=new THREE.Vector3(45,70,25).normalize().multiplyScalar(400);
  sunSpr.position.copy(sd);skyGroup.add(sunSpr);
}

/* ---------------- ground, roads ---------------- */
{
  const grassTex=texCanvas(256,256,c=>{
    c.fillStyle='#69BE4B';c.fillRect(0,0,256,256);
    const shades=['#5fb141','#74c957','#61b447','#7dcf63','#57a83c','#6fc350'];
    for(let i=0;i<1500;i++){
      c.fillStyle=shades[i%6];
      const x=Math.random()*256,y=Math.random()*256;
      c.fillRect(x,y,1+Math.random()*1.6,2+Math.random()*3.2);
    }
    c.fillStyle='rgba(255,255,255,0.55)';
    for(let i=0;i<8;i++)c.fillRect(Math.random()*256,Math.random()*256,2,2);
    c.fillStyle='rgba(255,220,80,0.6)';
    for(let i=0;i<6;i++)c.fillRect(Math.random()*256,Math.random()*256,2,2);
  });
  grassTex.wrapS=grassTex.wrapT=THREE.RepeatWrapping;grassTex.repeat.set(70,70);
  const g=new THREE.Mesh(new THREE.PlaneGeometry(560,560),new THREE.MeshLambertMaterial({map:grassTex,color:0xeef6ea}));
  g.rotation.x=-Math.PI/2;g.receiveShadow=true;scene.add(g);
  // mowed tone patches for variety
  const pm=new THREE.MeshLambertMaterial({color:0x4f9e38,transparent:true,opacity:0.30});
  for(let i=0;i<26;i++){
    const p=new THREE.Mesh(new THREE.CircleGeometry(4+((i*37)%11),10),pm);
    p.rotation.x=-Math.PI/2;p.position.set(((i*89)%300)-150,0.012,((i*53)%300)-150);
    scene.add(p);
  }
}
/* fully-baked road surfaces: asphalt grain, tire-wear lanes, dashes, edge lines,
   crosswalks, stop bars, manholes and patches all in ONE texture per road */
function bakeAsphaltBase(c,W,H){
  c.fillStyle='#43434b';c.fillRect(0,0,W,H);
  for(let i=0;i<W*H/70;i++){
    const v=Math.random();
    c.fillStyle=v<0.5?'rgba(255,255,255,'+(0.03+Math.random()*0.05)+')':'rgba(0,0,0,'+(0.05+Math.random()*0.09)+')';
    c.fillRect(Math.random()*W,Math.random()*H,1+Math.random()*2,1+Math.random()*2);
  }
  c.strokeStyle='rgba(18,18,22,0.42)';c.lineWidth=1.2;
  for(let i=0;i<W/90;i++){
    c.beginPath();let x=Math.random()*W,y=0;
    c.moveTo(x,y);
    while(y<H){y+=H/10+Math.random()*H/8;x+=(Math.random()-0.5)*30;c.lineTo(x,y);}
    c.stroke();
  }
}
function bakeManhole(c,x,y,rx,ry){
  ry=ry||rx;
  c.fillStyle='#26262c';c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fill();
  c.strokeStyle='#55555e';c.lineWidth=2;c.beginPath();c.ellipse(x,y,rx-2,ry-2,0,0,7);c.stroke();
  c.beginPath();c.ellipse(x,y,rx*0.55,ry*0.55,0,0,7);c.stroke();
}
function bakeWear(c,x0,y0,x1,y1,w){ // soft darkened tire path
  const g2=c.createLinearGradient(0,y0-w,0,y0+w);
  g2.addColorStop(0,'rgba(0,0,0,0)');g2.addColorStop(0.5,'rgba(10,10,14,0.16)');g2.addColorStop(1,'rgba(0,0,0,0)');
  c.fillStyle=g2;c.fillRect(x0,y0-w,x1-x0,w*2);
}
const carterTex=texCanvas(2048,96,c=>{
  const W=2048,H=96,ux=W/300,vy=H/8;         // world→px: u=(x+150)*ux, y=(z+4)*vy
  bakeAsphaltBase(c,W,H);
  // tire wear: two tracks per lane (lanes at z=±2 → wheels ±0.8 around lane center)
  [-2.8,-1.2,1.2,2.8].forEach(z=>bakeWear(c,0,(z+4)*vy,W,0,3.2));
  // center dashes (skip intersection x 74..86)
  c.fillStyle='#E8C24A';
  for(let x=-148;x<148;x+=6){
    if(x>72&&x<88)continue;
    c.fillRect((x+150)*ux,(0-0.14+4)*vy,2.2*ux,0.28*vy);
  }
  // white edge lines at z=±3.7 (skip intersection)
  c.fillStyle='#e8e8e2';
  [[-150,74],[86,150]].forEach(s=>{
    [3.7,-3.7].forEach(z=>c.fillRect((s[0]+150)*ux,(z-0.09+4)*vy,(s[1]-s[0])*ux,0.18*vy));
  });
  // crosswalk zebras flanking the intersection + stop bars
  c.fillStyle='#e8e8e2';
  for(let i=0;i<7;i++){
    const z=-3.6+i*1.2;
    c.fillRect((71.6-1.0+150)*ux,(z-0.27+4)*vy,2.0*ux,0.55*vy);
    c.fillRect((88.4-1.0+150)*ux,(z-0.27+4)*vy,2.0*ux,0.55*vy);
  }
  c.fillRect((70.2-0.25+150)*ux,(0.2+4)*vy,0.5*ux,3.4*vy);   // stop bar eastbound (south lane)
  c.fillRect((89.8-0.25+150)*ux,(-3.6+4)*vy,0.5*ux,3.4*vy);  // stop bar westbound (north lane)
  // manholes + tar patches
  bakeManhole(c,(-40+150)*ux,(1.1+4)*vy,0.55*ux,0.55*vy);
  bakeManhole(c,(30+150)*ux,(-1.3+4)*vy,0.55*ux,0.55*vy);
  c.fillStyle='rgba(20,20,26,0.35)';
  for(let i=0;i<10;i++){
    const x=Math.random()*W,y=Math.random()*H;
    c.beginPath();c.ellipse(x,y,10+Math.random()*26,4+Math.random()*7,0,0,7);c.fill();
  }
});
const heroTex=texCanvas(96,2048,c=>{
  const W=96,H=2048,ux=W/10,vy=H/300;        // u=(x-75)*ux, y=(z+150)*vy
  bakeAsphaltBase(c,W,H);
  // tire wear vertical
  [-2.8,-1.2,1.2,2.8].forEach(xo=>{
    const g2=c.createLinearGradient((xo+5-0.8)*ux,0,(xo+5+0.8)*ux,0);
    g2.addColorStop(0,'rgba(0,0,0,0)');g2.addColorStop(0.5,'rgba(10,10,14,0.16)');g2.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=g2;c.fillRect((xo+5-0.8)*ux,0,1.6*ux,H);
  });
  // dashes (skip |z|<8)
  c.fillStyle='#E8C24A';
  for(let z=-148;z<148;z+=6){
    if(Math.abs(z)<8)continue;
    c.fillRect((5-0.14)*ux,(z+150)*vy,0.28*ux,2.2*vy);
  }
  // edge lines x=80±3.7 → local ±3.7 (skip |z|<5)
  c.fillStyle='#e8e8e2';
  [[-150,-5],[5,150]].forEach(s=>{
    [3.7,-3.7].forEach(xo=>c.fillRect((xo+5-0.09)*ux,(s[0]+150)*vy,0.18*ux,(s[1]-s[0])*vy));
  });
  // zebras across Hero Way at z=±6.4 + stop bars at z=±7.8
  for(let i=0;i<8;i++){
    const x=-4.2+i*1.2;
    c.fillRect((x+5-0.27)*ux,(-6.4-1.0+150)*vy,0.55*ux,2.0*vy);
    c.fillRect((x+5-0.27)*ux,(6.4-1.0+150)*vy,0.55*ux,2.0*vy);
  }
  c.fillRect((1.9-1.7+5)*ux,(7.8-0.25+150)*vy,3.4*ux,0.5*vy);
  c.fillRect((-1.9-1.7+5)*ux,(-7.8-0.25+150)*vy,3.4*ux,0.5*vy);
  bakeManhole(c,(0.9+5)*ux,(40+150)*vy,0.55*ux,0.55*vy);
});
const roadMat=new THREE.MeshLambertMaterial({map:carterTex});
const roadMatB=new THREE.MeshLambertMaterial({map:heroTex});
function walkTex(vert){
  const t=texCanvas(128,128,c=>{
    c.fillStyle='#9a9484';c.fillRect(0,0,128,128);
    for(let i=0;i<380;i++){
      c.fillStyle=Math.random()<0.5?'rgba(255,255,255,0.07)':'rgba(60,55,45,0.09)';
      c.fillRect(Math.random()*128,Math.random()*128,1.5,1.5);
    }
    c.strokeStyle='rgba(70,65,55,0.55)';c.lineWidth=3;
    c.beginPath();
    if(vert){c.moveTo(64,0);c.lineTo(64,128);}else{c.moveTo(0,64);c.lineTo(128,64);}
    c.stroke();
  });
  t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;
}
const walkTexH=walkTex(true);walkTexH.repeat.set(60,1);
const walkTexV=walkTex(false);walkTexV.repeat.set(1,60);
const walkMat=new THREE.MeshLambertMaterial({map:walkTexH,color:0xe8e4da});
const walkMatV=new THREE.MeshLambertMaterial({map:walkTexV,color:0xe8e4da});
const gutterMat=new THREE.MeshLambertMaterial({color:0x7d7d84});
function flat(w,d,material,x,z,y){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),material);
  m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.receiveShadow=true;scene.add(m);return m;
}
// Carter Street: along x, at z=0 (all markings baked into the texture)
flat(300,8,roadMat,0,0,0.02);
flat(300,2,walkMat,0,-5.4,0.03);
flat(300,2,walkMat,0,5.4,0.03);
// Hero Way: along z, at x=80
flat(10,300,roadMatB,80,0,0.021);
flat(2,300,walkMatV,73.6,0,0.029);
flat(2,300,walkMatV,86.4,0,0.0295);
// concrete gutters between road and grass
[[-38,224],[118.5,63]].forEach(s=>{
  [-1,1].forEach(sd=>flat(s[1],0.5,gutterMat,s[0],sd*4.15,0.034));
});
[[-77.5,145],[77.5,145]].forEach(s=>{
  [-1,1].forEach(sd=>flat(0.5,s[1],gutterMat,80+sd*4.6,s[0],0.0345));
});
// QT lot: one baked overlay for stalls + ♿ spot, plus a few oil stains
{
  // maps to an 18×5.6 plane centered (105.5,-33.4): stalls x 97..112, ♿ at 113.5
  const stallTex2=texCanvas(512,160,c=>{
    const x0=96.5,ux=512/18,vz0=-36.2,vy=160/5.6;
    c.fillStyle='#e8e8e2';
    for(let i=0;i<6;i++){
      const wx=97+i*3;
      c.fillRect((wx-x0)*ux-2,(-35.2-vz0)*vy,4,( -31.8 +35.2)*vy);
    }
    c.fillStyle='rgba(42,111,212,0.5)';
    c.fillRect((112.2-x0)*ux,(-35.2-vz0)*vy,(114.8-112.2)*ux,3.4*vy);
    c.fillStyle='#fff';c.font='900 74px Verdana';c.textAlign='center';c.textBaseline='middle';
    c.fillText('♿',(113.5-x0)*ux,(-33.5-vz0)*vy);
  });
  const ov=flat(18,5.6,new THREE.MeshLambertMaterial({map:stallTex2,transparent:true}),105.5,-33.4,0.032);
  const oilTex=texCanvas(64,64,c=>{
    const g2=c.createRadialGradient(32,32,3,32,32,30);
    g2.addColorStop(0,'rgba(18,16,22,0.5)');g2.addColorStop(1,'rgba(18,16,22,0)');
    c.fillStyle=g2;c.beginPath();c.ellipse(32,32,28,20,0.5,0,7);c.fill();
  });
  const oilMat=new THREE.MeshBasicMaterial({map:oilTex,transparent:true,depthWrite:false});
  [[104,-26],[119,-23.5],[110,-33]].forEach(p=>{
    const o=flat(2.4,1.8,oilMat,p[0],p[1],0.031);o.receiveShadow=false;
  });
}
function onPavement(x,z){
  if(Math.abs(z)<=5.2&&Math.abs(x)<=150)return true;            // Carter Street
  if(Math.abs(x-80)<=6.2&&Math.abs(z)<=150)return true;         // Hero Way
  if(x>=90&&x<=144&&z>=-48&&z<=-10)return true;                 // QT lot
  if(x>=-54.5&&x<=-39.5&&z>=-13&&z<=-3.5)return true;           // driveway pad
  return false;
}

/* ---------------- houses ---------------- */
function numberTex(num){
  return texCanvas(128,64,c=>{
    c.fillStyle='#fff';c.fillRect(0,0,128,64);
    c.strokeStyle='#20304A';c.lineWidth=6;c.strokeRect(3,3,122,58);
    c.fillStyle='#20304A';c.font='900 40px Verdana';
    c.textAlign='center';c.textBaseline='middle';c.fillText(num,64,34);
  });
}
const ROOF_GEO=new THREE.ConeGeometry(1,1,4);ROOF_GEO.rotateY(Math.PI/4);
/* grayscale shingle + siding detail maps, tinted per-house via material color */
const shingleTex=texCanvas(256,256,c=>{
  c.fillStyle='#8a8a8a';c.fillRect(0,0,256,256);
  for(let row=0;row<11;row++){
    const y=row*24,off=(row%2)*16;
    for(let x=-1;x<9;x++){
      const v=115+((x*37+row*53)%36);
      c.fillStyle='rgb('+v+','+v+','+v+')';
      c.fillRect(x*32+off+1,y+1,30,22);
    }
    c.fillStyle='rgba(0,0,0,0.38)';c.fillRect(0,y+21,256,3);
  }
});
shingleTex.wrapS=shingleTex.wrapT=THREE.RepeatWrapping;shingleTex.repeat.set(2.5,2.5);
const sidingTex=texCanvas(128,128,c=>{
  c.fillStyle='#d9d9d9';c.fillRect(0,0,128,128);
  for(let y=0;y<128;y+=16){
    c.fillStyle='rgba(0,0,0,0.13)';c.fillRect(0,y+13,128,3);
    c.fillStyle='rgba(255,255,255,0.18)';c.fillRect(0,y,128,2);
  }
  for(let i=0;i<160;i++){
    c.fillStyle='rgba(0,0,0,'+(0.02+Math.random()*0.04)+')';
    c.fillRect(Math.random()*128,Math.random()*128,2,2);
  }
});
sidingTex.wrapS=sidingTex.wrapT=THREE.RepeatWrapping;sidingTex.repeat.set(2,1.4);
const _roofMats={},_sideMats={};
function roofMat(colr){
  const k='r'+colr;
  if(!_roofMats[k]){
    _roofMats[k]=new THREE.MeshLambertMaterial({map:shingleTex,color:colr});
    _roofMats[k].color.convertSRGBToLinear();_roofMats[k].color.multiplyScalar(1.9);
    _roofMats[k].userData._lin=1;
  }
  return _roofMats[k];
}
function sideMat(colr){
  const k='s'+colr;
  if(!_sideMats[k]){
    _sideMats[k]=new THREE.MeshLambertMaterial({map:sidingTex,color:colr});
    _sideMats[k].color.convertSRGBToLinear();_sideMats[k].color.multiplyScalar(1.16);
    _sideMats[k].userData._lin=1;
  }
  return _sideMats[k];
}
/* gable roof: extruded triangle — slopes get shingles, triangle end-caps get trim white */
const GABLE_SHAPE=new THREE.Shape();
GABLE_SHAPE.moveTo(-0.5,0);GABLE_SHAPE.lineTo(0.5,0);GABLE_SHAPE.lineTo(0,0.5);GABLE_SHAPE.closePath();
const GABLE_GEO=new THREE.ExtrudeGeometry(GABLE_SHAPE,{depth:1,bevelEnabled:false});
GABLE_GEO.translate(0,0,-0.5);
const winTex=texCanvas(128,128,c=>{
  const gr=c.createLinearGradient(0,0,128,128);
  gr.addColorStop(0,'#d8f0ff');gr.addColorStop(0.45,'#9fcbe8');gr.addColorStop(0.55,'#c8e6f8');gr.addColorStop(1,'#8ab8d8');
  c.fillStyle=gr;c.fillRect(0,0,128,128);
  c.fillStyle='rgba(255,255,255,0.5)';
  c.beginPath();c.moveTo(10,128);c.lineTo(70,0);c.lineTo(100,0);c.lineTo(40,128);c.closePath();c.fill();
  c.strokeStyle='#f4f4ee';c.lineWidth=9;
  c.strokeRect(4,4,120,120);
  c.beginPath();c.moveTo(64,4);c.lineTo(64,124);c.moveTo(4,64);c.lineTo(124,64);c.stroke();
});
const winMat=new THREE.MeshLambertMaterial({map:winTex});
function houseWindow(g,x,y,z,ry,w,h){
  w=w||1.6;h=h||1.3;
  const fr=box(w+0.24,h+0.24,0.1,0xf4f4ee,x,y,z,g);if(ry)fr.rotation.y=ry;
  const win=new THREE.Mesh(new THREE.BoxGeometry(w,h,0.12),winMat);
  win.position.set(x,y,z+(z>0?0.04:-0.04));if(ry)win.rotation.y=ry;
  g.add(win);
  const sill=box(w+0.3,0.1,0.2,0xe8e4da,x,y-h/2-0.1,z+(z>0?0.06:-0.06),g);if(ry)sill.rotation.y=ry;
}
function house(hx,hz,facing,bodyC,roofC,num,kid){
  // facing: +1 door faces +z (south), -1 faces -z
  const g=new THREE.Group();g.position.set(hx,0,hz);g.rotation.y=facing===1?0:Math.PI;
  scene.add(g);
  const w=kid?11:9,d=8,h=3.6;
  const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),sideMat(bodyC));
  body.position.set(0,h/2,0);body.castShadow=true;body.receiveShadow=true;g.add(body);
  box(w+0.16,0.42,d+0.16,0x8f8a80,0,0.21,0,g);                    // foundation strip
  const gable=((parseInt(num,10)||0)>>2)%2===0;                    // mix of roof styles
  let roof;
  if(gable){
    roof=new THREE.Mesh(GABLE_GEO,[mat(bodyC),roofMat(roofC)]);   // caps=body, slopes=shingles
    roof.rotation.y=Math.PI/2;                                     // ridge runs along x
    roof.scale.set(d*1.12,2.4,w*1.08);
    roof.position.y=h;
  }else{
    roof=new THREE.Mesh(ROOF_GEO,roofMat(roofC));
    roof.scale.set(w*0.78,2.3,d*0.78);
    roof.position.y=h+1.15;
  }
  roof.castShadow=true;g.add(roof);
  box(w*0.8,0.24,d*0.8,0xf4f4ee,0,h+0.1,0,g);                     // fascia trim
  // chimney on some houses (deterministic by street number)
  if((parseInt(num,10)||0)%3===1){
    const ch=box(0.8,1.9,0.8,0x9c5a48,w*0.26,h+1.4,-d*0.12,g);ch.castShadow=true;
    box(0.95,0.18,0.95,0x777777,w*0.26,h+2.4,-d*0.12,g);
  }
  // door with frame, kick plate, knob + step
  box(1.8,2.7,0.1,0xf4f4ee,w*0.18,1.35,d/2+0.05,g);
  box(1.5,2.5,0.22,0x6b4a2a,w*0.18,1.25,d/2+0.08,g);
  box(1.3,0.32,0.05,0x8a6a42,w*0.18,0.35,d/2+0.2,g);
  const knob=box(0.09,0.09,0.09,0xd4af37,w*0.18+0.55,1.2,d/2+0.21,g);
  box(1.9,0.16,0.9,0x9c9c9c,w*0.18,0.08,d/2+0.55,g);
  // windows with frames + shutters
  houseWindow(g,-w*0.24,2.0,d/2+0.06,0);
  box(0.34,1.5,0.08,roofC,-w*0.24-1.1,2.0,d/2+0.05,g);
  box(0.34,1.5,0.08,roofC,-w*0.24+1.1,2.0,d/2+0.05,g);
  houseWindow(g,w*0.24+(kid?-2.6:0),2.0,-d/2-0.06,0);
  { // side window (west face)
    const fr=box(0.1,1.44,1.64,0xf4f4ee,-w/2-0.05,2.0,0,g);
    const win=new THREE.Mesh(new THREE.BoxGeometry(0.12,1.2,1.4),winMat);
    win.position.set(-w/2-0.09,2.0,0);g.add(win);
  }
  // foundation bushes + flowers
  const bshM=mat(0x2f7a2c);
  [[-w*0.38,d/2+0.7],[w*0.42,d/2+0.7],[-w*0.05,d/2+0.62]].forEach((b,i)=>{
    const s=0.42+((i*7+((parseInt(num,10)||0)))%3)*0.09;
    const bu=new THREE.Mesh(new THREE.SphereGeometry(s,7,6),bshM);
    bu.position.set(b[0],s*0.75,b[1]);bu.castShadow=true;g.add(bu);
  });
  const flM=new THREE.MeshLambertMaterial({color:[0xe86aa6,0xffd23e,0xff8c1a,0xd5232a][((parseInt(num,10)||0)>>2)%4]});
  for(let i=0;i<3;i++){
    const f=new THREE.Mesh(new THREE.SphereGeometry(0.09,5,4),flM);
    f.position.set(-w*0.05+0.5+i*0.3,0.16,d/2+0.62);g.add(f);
  }
  // AC unit (west wall on the kid's house — his garage owns the east wall)
  const acx=kid?-(w/2+0.44):w/2+0.44;
  const ac=box(0.8,0.7,0.8,0xb8bcc0,acx,0.45,d*0.2,g);ac.castShadow=true;
  box(0.06,0.6,0.6,0x8a9096,acx+(kid?-0.42:0.42),0.45,d*0.2,g);
  // curbside trash bin + mailbox for the neighbors (237 has its own blue one)
  if(!kid){
    box(0.55,0.8,0.55,0x2f5d3a,-w*0.4,0.4,d/2+3.4,g);
    box(0.62,0.08,0.62,0x274e30,-w*0.4,0.84,d/2+3.4,g);
    box(0.1,1.0,0.1,0x555555,w*0.42,0.5,d/2+3.7,g);
    const mbx=box(0.4,0.3,0.58,0x333a42,w*0.42,1.12,d/2+3.7,g);mbx.castShadow=true;
  }
  const sign=signMesh(1.5,0.75,numberTex(num));
  sign.position.set(-w*0.05,2.9,d/2+0.12);g.add(sign);
  addCol(hx,hz,w+0.6,d+0.6,true);
  if(kid){
    // porch slab + awning
    box(4.6,0.24,2.2,0x9c9c9c,-2.2,0.12,d/2+1.2,g);
    box(0.22,2.2,0.22,0xffffff,-4.1,1.2,d/2+2.1,g);
    box(0.22,2.2,0.22,0xffffff,-0.4,1.2,d/2+2.1,g);
    const aw=box(5,0.18,2.6,roofC,-2.2,2.4,d/2+1.2,g);aw.castShadow=true;
    // garage door on east face
    box(0.2,2.6,4.4,0xd8d8d8,w/2+0.06,1.3,-0.6,g);
  }
  return g;
}
// kid's house — the house (north side, door faces street)
house(-60,-16,1,0x9cc7e8,0x51586b,'237',true);
// neighbors
house(-100,-16,1,0xf0dfae,0x7d4a35,'233');
house(-20,-16,1,0xd8b8d8,0x5a5a6e,'241');
house(20,-16,1,0xb8d8b0,0x6e5a4a,'245');
house(-80,16,-1,0xf3c6a8,0x54442f,'234');
house(-40,16,-1,0xcfd8e8,0x3f4a5a,'238');
house(0,16,-1,0xe8e0c0,0x6b3a2a,'242');
house(40,16,-1,0xc8e0e8,0x4a3f5a,'246');

/* driveway + mailbox + hoop + porch light at 237 */
flat(14,8.5,new THREE.MeshLambertMaterial({color:0x8f8f8f}),-47,-8.2,0.025);
{
  box(0.14,1.1,0.14,0x555555,-54.6,0.55,-5.2);
  const mb=box(0.55,0.4,0.9,0x2e6fe0,-54.6,1.28,-5.2);mb.castShadow=true;
  const s=signMesh(0.8,0.4,numberTex('★'));s.position.set(-54.6,1.28,-4.7);scene.add(s);
  addCol(-54.6,-5.2,0.6,0.9);
  // basketball hoop at top of driveway
  box(0.16,3.4,0.16,0x777777,-51,1.7,-12.6);
  box(1.5,1.05,0.1,0xffffff,-51,3.6,-12.5);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(0.28,0.045,8,20),mat(0xE8641E));
  rim.rotation.x=Math.PI/2;rim.position.set(-51,3.25,-12.15);scene.add(rim);
  addCol(-51,-12.6,0.5,0.5);
}

/* ---------------- park & playground ---------------- */
{
  flat(34,30,new THREE.MeshLambertMaterial({color:0x7acb5e}),-122,28,0.015);
  // slide
  const sl=new THREE.Group();sl.position.set(-130,0,22);scene.add(sl);
  box(1.6,2.4,1.6,0xE8641E,0,1.2,0,sl);
  const ramp=box(1.2,0.14,3.6,0xffd23e,0,1.55,2.6,sl);ramp.rotation.x=0.62;ramp.castShadow=true;
  addCol(-130,22,2,2);
  // swings
  const sw=new THREE.Group();sw.position.set(-118,0,24);scene.add(sw);
  box(0.16,2.6,0.16,0x4a90d9,-1.6,1.3,0,sw);box(0.16,2.6,0.16,0x4a90d9,1.6,1.3,0,sw);
  box(3.5,0.16,0.16,0x4a90d9,0,2.6,0,sw);
  box(0.7,0.08,0.3,0x8a5a2a,-0.8,0.9,0,sw);box(0.7,0.08,0.3,0x8a5a2a,0.8,0.9,0,sw);
  box(0.04,1.6,0.04,0x999999,-1.05,1.75,0,sw);box(0.04,1.6,0.04,0x999999,-0.55,1.75,0,sw);
  box(0.04,1.6,0.04,0x999999,0.55,1.75,0,sw);box(0.04,1.6,0.04,0x999999,1.05,1.75,0,sw);
  addCol(-118,24,4,0.8);
  // bench
  box(2.2,0.12,0.6,0x8a5a2a,-112,0.55,34);box(0.15,0.55,0.5,0x555555,-112.8,0.28,34);box(0.15,0.55,0.5,0x555555,-111.2,0.28,34);
  addCol(-112,34,2.4,0.8);
}

/* ---------------- QuikTrip ---------------- */
const QT={store:{x:117,z:-40},door:{x:116.2,z:-34.6},shop:{x:115,z:-40},pumpA:{x:106,z:-24},pumpB:{x:118,z:-24},lot:{x:117,z:-29}};
let storeRoof=null;
{
  flat(54,38,new THREE.MeshLambertMaterial({color:0x848484}),117,-29,0.022); // lot
  const S=new THREE.Group();S.position.set(117,0,-40);scene.add(S);
  const wallC=0xf2efe6;
  // back + sides + front segments with door gap (gap x -2.6..-0.2 local => world 114.4..116.8)
  const back=box(24,4.2,0.35,wallC,0,2.1,-5,S);back.castShadow=true;
  box(0.35,4.2,10,wallC,-12,2.1,0,S).castShadow=true;
  box(0.35,4.2,10,wallC,12,2.1,0,S).castShadow=true;
  box(9.4,4.2,0.35,wallC,-7.3,2.1,5,S).castShadow=true;   // front left  (-12..-2.6)
  box(12.2,4.2,0.35,wallC,5.9,2.1,5,S).castShadow=true;   // front right (-0.2..12)
  box(2.4,1.4,0.35,wallC,-1.4,3.5,5,S);                   // header over door
  // glass on front-right segment — gradient "reflection" instead of flat tint
  const glassTex=texCanvas(256,64,c=>{
    const gr=c.createLinearGradient(0,0,256,64);
    gr.addColorStop(0,'#bfe4f8');gr.addColorStop(0.35,'#7db8dc');
    gr.addColorStop(0.55,'#4d7fa8');gr.addColorStop(0.8,'#6ea6cc');gr.addColorStop(1,'#a8d4ec');
    c.fillStyle=gr;c.fillRect(0,0,256,64);
    c.fillStyle='rgba(255,255,255,0.5)';
    c.beginPath();c.moveTo(30,64);c.lineTo(90,0);c.lineTo(120,0);c.lineTo(60,64);c.closePath();c.fill();
    c.beginPath();c.moveTo(150,64);c.lineTo(210,0);c.lineTo(224,0);c.lineTo(164,64);c.closePath();c.fill();
    c.fillStyle='rgba(20,30,40,0.35)';c.fillRect(0,52,256,12);
    for(let x=0;x<256;x+=42){c.fillStyle='rgba(240,240,235,0.9)';c.fillRect(x,0,3,64);} // mullions
  });
  const glass=new THREE.Mesh(new THREE.BoxGeometry(10,2.2,0.12),
    new THREE.MeshLambertMaterial({map:glassTex,transparent:true,opacity:0.88}));
  glass.position.set(5.9,1.8,5.28);S.add(glass);
  // brick wainscot along the storefront base
  const brickTex=texCanvas(128,64,c=>{
    c.fillStyle='#8d4a38';c.fillRect(0,0,128,64);
    for(let row=0;row<4;row++){
      const y=row*16,off=(row%2)*16;
      for(let x=-1;x<5;x++){
        const v=Math.floor(Math.random()*22);
        c.fillStyle='rgb('+(150+v)+','+(78+v)+','+(58+v)+')';
        c.fillRect(x*32+off+1,y+1,30,14);
      }
    }
  });
  brickTex.wrapS=brickTex.wrapT=THREE.RepeatWrapping;brickTex.repeat.set(8,1);
  const brickM=new THREE.MeshLambertMaterial({map:brickTex});
  const wsc=new THREE.Mesh(new THREE.BoxGeometry(24.5,0.8,0.2),brickM);
  wsc.position.set(0,0.4,5.12);S.add(wsc);
  [-12.1,12.1].forEach(sx=>{
    const b2=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.8,10.2),brickM);
    b2.position.set(sx,0.4,0);S.add(b2);
  });
  // red fascia + QuikTrip lettering
  box(24.4,0.9,0.5,0xD5232A,0,4.45,5.05,S);
  const fasciaTex=texCanvas(1024,96,c=>{
    c.fillStyle='#D5232A';c.fillRect(0,0,1024,96);
    c.fillStyle='#fff';c.font='900 64px Verdana';c.textAlign='center';c.textBaseline='middle';
    c.fillText('Q u i k T r i p',512,52);
  });
  const f=signMesh(14,1.3,fasciaTex);f.position.set(0,4.45,5.32);S.add(f);
  storeRoof=box(24.6,0.3,10.6,0x8c8c8c,0,4.5,0,S);
  // interior floor + ceiling light strips
  const fl=flat(23,9,new THREE.MeshLambertMaterial({color:0xe8e4d8}),117,-40,0.05);
  const stripM=new THREE.MeshBasicMaterial({color:0xfffbe0});
  [-6,0,6].forEach(lx=>{
    const strip=new THREE.Mesh(new THREE.BoxGeometry(3.4,0.09,0.5),stripM);
    strip.position.set(lx,3.95,0);S.add(strip);
  });
  // shelves stocked with real product bags
  function shelf(lx,lz,ids){
    const sh=new THREE.Group();sh.position.set(lx,0,lz);S.add(sh);
    box(3.6,1.15,0.9,0x8f9aa8,0,0.575,0,sh).castShadow=true;
    ids.forEach((id,i)=>{
      const b=bagBox(id,0.46,0.56,0.14);
      b.position.set(-1.4+i*0.56,1.45,0.05);
      sh.add(b);
    });
    addCol(117+lx,-40+lz,3.8,1.1);
  }
  shelf(-6.5,-0.5,['takis','hotch','dorna','dorcr','lays','pring']);
  shelf(-2,-0.5,['funyun','gold','skinny','chex','oreo','chips']);
  shelf(-6.5,2.2,['spk','skit','starb','nerds','haribo','jolly']);
  shelf(-2,2.2,['mms','reese','kitkat','snick','twix','butter']);
  // cooler along back wall, doors stocked with drinks
  const cool=box(16,2.6,0.9,0xdfe8ee,-2,1.3,-4.3,S);
  ['gator','prime','capri','drp','sprite','jammer','slush','rkt'].forEach((id,i)=>{
    const p=bagBox(id,1.5,1.7,0.1);
    p.position.set(-9+i*2,1.35,-3.8);
    S.add(p);
  });
  addCol(115,-44.3,16.4,1.2);
  // counter + register
  box(3.4,1.15,1,0x8a5a2a,8,0.575,1.5,S);addCol(125,-38.5,3.6,1.2);
  box(0.4,0.3,0.35,0x2b3540,7.2,1.3,1.5,S);   // register
  box(0.36,0.26,0.04,0x9fd0e8,7.2,1.52,1.32,S); // register screen
  // the cashier — a real person in QT uniform
  function makeCashier(){
    const g=new THREE.Group();
    const skin=0xe8b88a, shirt=0xD5232A, pants=0x2b3540;
    box(0.34,1.0,0.34,pants,-0.21,0.5,0,g);
    box(0.34,1.0,0.34,pants,0.21,0.5,0,g);
    const torso=box(0.82,1.0,0.5,shirt,0,1.5,0,g);torso.castShadow=true;
    box(0.84,0.12,0.52,0xf4f4f0,0,1.96,0,g);            // polo collar
    box(0.2,0.12,0.03,0xffffff,0.24,1.74,0.27,g);       // name tag
    const logoTex=texCanvas(64,64,c=>{
      c.fillStyle='#fff';c.fillRect(0,0,64,64);
      c.fillStyle='#D5232A';c.font='900 34px Verdana';c.textAlign='center';c.textBaseline='middle';
      c.fillText('QT',32,34);
    });
    const logo=signMesh(0.16,0.16,logoTex);logo.position.set(-0.2,1.74,0.262);g.add(logo);
    ['L','R'].forEach(sd=>{
      const x=sd==='L'?-0.55:0.55;
      const ag=new THREE.Group();ag.position.set(x,1.9,0);g.add(ag);
      box(0.28,0.4,0.28,shirt,0,-0.18,0,ag);            // short sleeve
      const fa=box(0.22,0.58,0.22,skin,0,-0.64,0,ag);fa.castShadow=true;
      g.userData['arm'+sd]=ag;
    });
    const faceTexC=texCanvas(128,128,c=>{
      c.fillStyle='#e8b88a';c.fillRect(0,0,128,128);
      c.fillStyle='#fff';
      c.beginPath();c.ellipse(44,52,10,8,0,0,7);c.fill();
      c.beginPath();c.ellipse(84,52,10,8,0,0,7);c.fill();
      c.fillStyle='#3a2a1a';
      c.beginPath();c.arc(44,53,4.5,0,7);c.fill();
      c.beginPath();c.arc(84,53,4.5,0,7);c.fill();
      c.strokeStyle='#5a4022';c.lineWidth=4;c.lineCap='round';
      c.beginPath();c.moveTo(34,40);c.lineTo(54,38);c.stroke();
      c.beginPath();c.moveTo(74,38);c.lineTo(94,40);c.stroke();
      c.strokeStyle='#c89060';c.lineWidth=4;
      c.beginPath();c.moveTo(64,56);c.lineTo(64,66);c.stroke();
      c.strokeStyle='#7a4a2a';c.lineWidth=6;
      c.beginPath();c.arc(64,76,20,0.35,Math.PI-0.35);c.stroke();
    });
    const sm=(cN)=>new THREE.MeshLambertMaterial({color:cN});
    const head=new THREE.Mesh(new THREE.BoxGeometry(0.6,0.6,0.6),
      [sm(skin),sm(skin),sm(skin),sm(skin),
       new THREE.MeshLambertMaterial({map:faceTexC}),sm(skin)]);
    head.position.y=2.32;head.castShadow=true;g.add(head);
    box(0.62,0.34,0.16,0x5a4022,0,2.34,-0.32,g);        // hair (back)
    box(0.64,0.16,0.64,0xD5232A,0,2.68,0,g);            // QT cap crown
    box(0.62,0.11,0.24,0xD5232A,0,2.6,0.4,g);           // cap brim
    g.userData.head=head;
    return g;
  }
  const cash=makeCashier();cash.position.set(8,0,-0.3);S.add(cash);
  window._cashier=cash;
  // wall colliders
  addCol(117,-45,24.4,0.7,true);
  addCol(105,-40,0.7,10.4,true);addCol(129,-40,0.7,10.4,true);
  addCol(109.7,-35,9.6,0.7,true);addCol(122.9,-35,12.4,0.7,true);
}
/* canopy + pumps */
let canopyRoof=null;
{
  const cp=new THREE.Group();cp.position.set(112,0,-24);scene.add(cp);
  canopyRoof=new THREE.Group();cp.add(canopyRoof);
  const roof=box(24,0.55,11,0xf2efe6,0,4.7,0,canopyRoof);roof.castShadow=true;
  box(24.2,0.55,0.4,0xD5232A,0,4.7,5.6,canopyRoof);
  box(24.2,0.55,0.4,0xD5232A,0,4.7,-5.6,canopyRoof);
  // own materials so the roof can fade to glass without touching shared colors
  canopyRoof.children.forEach(m=>{m.material=m.material.clone();m.material.transparent=true;});
  [[-9,-3.5],[-9,3.5],[9,-3.5],[9,3.5]].forEach(p=>{
    box(0.34,4.5,0.34,0xb8b8b8,p[0],2.25,p[1],cp);
    addCol(112+p[0],-24+p[1],0.6,0.6);
  });
  [QT.pumpA,QT.pumpB].forEach(pp=>{
    flat(3.2,6,new THREE.MeshLambertMaterial({color:0x99948a}),pp.x,pp.z,0.06);
    const pm=new THREE.Group();pm.position.set(pp.x,0,pp.z);scene.add(pm);
    box(1,1.7,0.6,0xf2efe6,0,0.95,0,pm).castShadow=true;
    box(1.06,0.4,0.66,0xD5232A,0,1.95,0,pm);
    box(0.5,0.35,0.05,0x223344,0,1.35,0.33,pm);
    addCol(pp.x,pp.z,1.3,0.9);
  });
}
/* shopping carts */
function makeCart(){
  const g=new THREE.Group();
  box(0.66,0.05,0.9,0x9aa4b0,0,0.45,0,g);
  box(0.66,0.3,0.04,0x9aa4b0,0,0.6,0.45,g);
  box(0.66,0.3,0.04,0x9aa4b0,0,0.6,-0.45,g);
  box(0.04,0.3,0.9,0x9aa4b0,-0.33,0.6,0,g);
  box(0.04,0.3,0.9,0x9aa4b0,0.33,0.6,0,g);
  [[-0.28,0.35],[0.28,0.35],[-0.28,-0.35],[0.28,-0.35]].forEach(p=>{
    box(0.04,0.34,0.04,0x7a828c,p[0],0.26,p[1],g);
    const w=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,0.05,10),mat(0x22262c));
    w.rotation.z=Math.PI/2;w.position.set(p[0],0.07,p[1]);g.add(w);
  });
  box(0.04,0.5,0.04,0x7a828c,-0.3,0.85,-0.5,g);
  box(0.04,0.5,0.04,0x7a828c,0.3,0.85,-0.5,g);
  box(0.66,0.06,0.07,0xd5232a,0,1.08,-0.52,g);
  g.userData.items=[];
  const cols=[0xE8641E,0x4a90d9,0xffd23e,0x3fa34d,0xd5232a,0x8a3fd1,0x2ec4b6,0xff6b9d];
  for(let i=0;i<8;i++){
    const it=box(0.16,0.16,0.16,cols[i],-0.2+(i%3)*0.2,0.55,-0.25+Math.floor(i/3)*0.25,g);
    it.visible=false;g.userData.items.push(it);
  }
  return g;
}
const shopCart=makeCart();shopCart.visible=false;scene.add(shopCart);
{ // cart corral by the store
  const c1=makeCart();c1.position.set(128,0,-16.6);c1.rotation.y=0.3;scene.add(c1);
  const c2=makeCart();c2.position.set(128.6,0,-15.3);c2.rotation.y=0.5;scene.add(c2);
  box(0.06,0.55,2.8,0x8a94a0,127.1,0.5,-16);
  box(0.06,0.55,2.8,0x8a94a0,129.7,0.5,-16);
  addCol(128.4,-16,3.2,3.2);
}
/* QT extras: ICE box, trash can, slushie machine, aisle signs, pump hoses */
{
  const ice=box(1.3,1.15,0.7,0xf4f6f8,110.4,0.58,-34.3);ice.castShadow=true;
  const iceTex=texCanvas(256,128,c=>{
    c.fillStyle='#f4f6f8';c.fillRect(0,0,256,128);
    c.fillStyle='#1a6fc4';c.font='900 84px Verdana';c.textAlign='center';c.fillText('ICE',128,96);
    c.strokeStyle='#1a6fc4';c.lineWidth=8;c.strokeRect(6,6,244,116);
  });
  const iceS=signMesh(1.2,0.6,iceTex);iceS.position.set(110.4,0.62,-33.93);scene.add(iceS);
  addCol(110.4,-34.3,1.5,0.9);
  const trash=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.26,0.8,10),mat(0x3a4148));
  trash.position.set(118,0.4,-34.3);trash.castShadow=true;scene.add(trash);
  addCol(118,-34.3,0.7,0.7);
  // slushie machine on the counter
  box(0.55,0.5,0.42,0xf0f0f0,123.5,1.42,-38.5);
  const slr=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,0.3,10),mat(0xd5232a));
  slr.position.set(123.38,1.75,-38.4);scene.add(slr);
  const slb=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,0.3,10),mat(0x2a7fd4));
  slb.position.set(123.64,1.75,-38.4);scene.add(slb);
  // hanging aisle signs
  const aisleTex=(txt,bg)=>texCanvas(512,128,c=>{
    c.fillStyle=bg;c.fillRect(0,0,512,128);
    c.strokeStyle='#fff';c.lineWidth=8;c.strokeRect(4,4,504,120);
    c.fillStyle='#fff';c.font='900 72px Verdana';c.textAlign='center';c.fillText(txt,256,92);
  });
  const s1=signMesh(2.4,0.6,aisleTex('SNACKS','#D5232A'));s1.position.set(112,3.2,-38);scene.add(s1);
  const s2=signMesh(2.4,0.6,aisleTex('DRINKS','#1a6fc4'));s2.position.set(121,3.2,-43.3);scene.add(s2);
  // pump hoses + nozzles
  [QT.pumpA,QT.pumpB].forEach(pp=>{
    [-0.56,0.56].forEach(off=>{
      box(0.05,0.66,0.05,0x1c1f24,pp.x+off,1.12,pp.z);
      box(0.1,0.2,0.1,0x1c1f24,pp.x+off,0.72,pp.z);
    });
  });
}
/* QT road sign */
{
  box(0.35,7,0.35,0x888888,94,3.5,-13.5);addCol(94,-13.5,0.7,0.7);
  const t=texCanvas(256,256,c=>{
    const rr=(x,y,w,h,r)=>{c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);
      c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();};
    c.fillStyle='#D5232A';rr(8,8,240,240,40);c.fill();
    c.strokeStyle='#fff';c.lineWidth=10;rr(18,18,220,220,32);c.stroke();
    c.fillStyle='#fff';c.font='900 120px Verdana';c.textAlign='center';c.textBaseline='middle';
    c.fillText('QT',128,138);
  });
  const s1=signMesh(3,3,t);s1.position.set(94,8,-13.3);scene.add(s1);
  const s2=signMesh(3,3,t);s2.position.set(94,8,-13.7);s2.rotation.y=Math.PI;scene.add(s2);
  // gas price board under the QT sign
  const priceTex=texCanvas(256,192,c=>{
    c.fillStyle='#16181c';c.fillRect(0,0,256,192);
    c.strokeStyle='#D5232A';c.lineWidth=10;c.strokeRect(5,5,246,182);
    c.fillStyle='#fff';c.font='900 30px Verdana';c.textAlign='center';c.fillText('REGULAR',128,46);
    c.fillStyle='#ffd23e';c.font='900 62px Verdana';c.fillText('$2.49',128,112);
    c.fillStyle='#7fd4ff';c.font='900 26px Verdana';c.fillText('SLUSHIES  $1',128,164);
  });
  const p1=signMesh(2.4,1.8,priceTex);p1.position.set(94,5.2,-13.3);scene.add(p1);
  const p2=signMesh(2.4,1.8,priceTex);p2.position.set(94,5.2,-13.7);p2.rotation.y=Math.PI;scene.add(p2);
}
/* street signs + welcome sign */
{
  box(0.12,3.2,0.12,0x4a5a4a,74.5,1.6,-5.6);
  const t1=texCanvas(512,96,c=>{c.fillStyle='#1f7a3a';c.fillRect(0,0,512,96);c.strokeStyle='#fff';c.lineWidth=6;c.strokeRect(4,4,504,88);c.fillStyle='#fff';c.font='900 52px Verdana';c.textAlign='center';c.textBaseline='middle';c.fillText('CARTER STREET',256,52);});
  const b1=signMesh(2.6,0.5,t1);b1.position.set(74.5,3,-5.6);scene.add(b1);
  const t2=texCanvas(512,96,c=>{c.fillStyle='#1f7a3a';c.fillRect(0,0,512,96);c.strokeStyle='#fff';c.lineWidth=6;c.strokeRect(4,4,504,88);c.fillStyle='#fff';c.font='900 52px Verdana';c.textAlign='center';c.textBaseline='middle';c.fillText('HERO WAY',256,52);});
  const b2=signMesh(2.2,0.5,t2);b2.position.set(74.5,2.5,-5.6);b2.rotation.y=Math.PI/2;scene.add(b2);
  // welcome sign
  box(0.2,2.2,0.2,0x6b4a2a,-138,1.1,-7);box(0.2,2.2,0.2,0x6b4a2a,-133,1.1,-7);
  const tw=texCanvas(512,192,c=>{
    c.fillStyle='#f7edd8';c.fillRect(0,0,512,192);c.strokeStyle='#6b4a2a';c.lineWidth=14;c.strokeRect(7,7,498,178);
    c.fillStyle='#20304A';c.textAlign='center';
    c.font='900 46px Verdana';c.fillText('WELCOME TO',256,62);
    c.font='900 60px Verdana';c.fillStyle='#D5232A';c.fillText('CARTER TOWN',256,124);
    c.font='700 30px Verdana';c.fillStyle='#20304A';c.fillText('★ Pop. Awesome ★',256,166);
  });
  const ws=signMesh(5.4,2,tw);ws.position.set(-135.5,2.6,-6.9);scene.add(ws);
  addCol(-135.5,-7,5.6,0.5);
}

/* ---------------- trees & scenery ---------------- */
const TREE_GREENS=[0x3f8f3a,0x4aa344,0x357f34,0x54b048,0x469a3e];
const trunkGeo=new THREE.CylinderGeometry(0.16,0.3,1,7);
function tree(x,z,s){
  s=s||1;
  const hsh=Math.abs(Math.round(x*7+z*13));
  const tr=new THREE.Mesh(trunkGeo,mat(0x7a5230));
  tr.scale.set(s,2.4*s,s);tr.position.set(x,1.2*s,z);tr.castShadow=true;scene.add(tr);
  const g1=TREE_GREENS[hsh%5],g2=TREE_GREENS[(hsh+2)%5],g3=TREE_GREENS[(hsh+3)%5];
  const fol=new THREE.Mesh(new THREE.SphereGeometry(1.5*s,8,7),mat(g1));
  fol.position.set(x,3.1*s,z);fol.scale.y=1.12;fol.castShadow=true;scene.add(fol);
  const f2=new THREE.Mesh(new THREE.SphereGeometry(1.05*s,8,7),mat(g2));
  f2.position.set(x+0.85*s,2.5*s,z+0.4*s);f2.castShadow=true;scene.add(f2);
  const f3=new THREE.Mesh(new THREE.SphereGeometry(0.9*s,7,6),mat(g3));
  f3.position.set(x-0.75*s,2.6*s,z-0.35*s);scene.add(f3);
  addCol(x,z,0.8,0.8);
}
[[-132,-10,1.2],[-90,-7.5,1],[-74,-7.5,0.9],[-34,-7.5,1.1],[-6,-7.5,1],[34,-7.5,0.95],[56,-7.5,1.15],
 [-96,8,1],[-58,8,0.9],[-26,8,1.05],[10,8,1],[52,8,1.1],[66,8,0.85],
 [-124,14,1.3],[-104,36,1.1],[-136,34,1],[92,6,1],[100,8,1.2],[130,4,0.9],
 [70,-40,1.2],[70,-70,1],[88,40,1.1],[74,70,1.2],[-60,-40,1.4],[-20,-44,1.2],[20,-40,1.3],[110,30,1.2],[140,-60,1.1]
].forEach(t=>tree(t[0],t[1],t[2]));
/* hills ring (decor) */
for(let i=0;i<14;i++){
  const a=i/14*Math.PI*2;
  const h=new THREE.Mesh(new THREE.SphereGeometry(30,10,8),mat(i%2?0x5CAF3F:0x54a238));
  h.position.set(Math.cos(a)*215,-14,Math.sin(a)*215);
  h.scale.set(1.6,0.55,1);scene.add(h);
}
/* clouds — puffy tops, flat bottoms — with soft shadows drifting over the ground */
const clouds=[],cloudShadows=[];
{
  const cloudMat=new THREE.MeshLambertMaterial({color:0xffffff,transparent:true,opacity:0.94});
  const shTex=texCanvas(128,128,c=>{
    const g2=c.createRadialGradient(64,64,8,64,64,62);
    g2.addColorStop(0,'rgba(20,30,26,0.20)');g2.addColorStop(0.7,'rgba(20,30,26,0.11)');g2.addColorStop(1,'rgba(20,30,26,0)');
    c.fillStyle=g2;c.beginPath();c.ellipse(64,64,60,42,0,0,7);c.fill();
  });
  const shMat=new THREE.MeshBasicMaterial({map:shTex,transparent:true,depthWrite:false});
  for(let i=0;i<7;i++){
    const c=new THREE.Group();
    for(let j=0;j<6;j++){
      const s=new THREE.Mesh(new THREE.SphereGeometry(3+((i+j)%4),7,6),cloudMat);
      s.position.set(j*3.4-8.5,(j%3)*0.9,((j*7)%5)-2);s.scale.y=0.58;c.add(s);
    }
    c.position.set(((i*83)%300)-150,34+(i%3)*5,((i*131)%300)-150);
    scene.add(c);clouds.push(c);
    const sh=new THREE.Mesh(new THREE.PlaneGeometry(26,18),shMat);
    sh.rotation.x=-Math.PI/2;sh.position.set(c.position.x+6,0.055,c.position.z+4);
    sh.renderOrder=2;scene.add(sh);cloudShadows.push(sh);
  }
}
/* power lines along the south side of Carter Street */
{
  const poleM=mat(0x6b543c);
  const wirePts=[];
  const poleXs=[-140,-100,-60,-20,20,60,100,140];
  poleXs.forEach(x=>{
    const p=new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.15,7.4,7),poleM);
    p.position.set(x,3.7,8.6);p.castShadow=true;scene.add(p);
    box(0.14,0.14,2.2,0x6b543c,x,6.7,8.6);
    box(0.12,0.12,1.4,0x6b543c,x,6.1,8.6);
    addCol(x,8.6,0.5,0.5);
  });
  // sagging wires: sampled quadratics between poles, one merged LineSegments draw
  for(let i=0;i<poleXs.length-1;i++){
    const a=poleXs[i],b=poleXs[i+1];
    [[6.72,-0.85],[6.72,0.85],[6.14,-0.55],[6.14,0.55]].forEach(w=>{
      let prev=null;
      for(let s=0;s<=8;s++){
        const t=s/8,x=a+(b-a)*t,y=w[0]-Math.sin(Math.PI*t)*0.55;
        const pt=new THREE.Vector3(x,y,8.6+w[1]);
        if(prev){wirePts.push(prev,pt);}
        prev=pt;
      }
    });
  }
  const wireGeo=new THREE.BufferGeometry().setFromPoints(wirePts);
  const wires=new THREE.LineSegments(wireGeo,new THREE.LineBasicMaterial({color:0x14161a}));
  scene.add(wires);
}
/* park pond with living water + ducks, gravel path, picnic table */
const DUCKS=[];let pondTex=null;
{
  pondTex=texCanvas(128,128,c=>{
    c.fillStyle='#3f8fc4';c.fillRect(0,0,128,128);
    for(let i=0;i<40;i++){
      c.strokeStyle='rgba(255,255,255,'+(0.05+Math.random()*0.1)+')';
      c.lineWidth=1.5;
      const x=Math.random()*128,y=Math.random()*128;
      c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+8,y-2,x+16,y);c.stroke();
    }
    c.fillStyle='rgba(180,225,250,0.16)';
    c.beginPath();c.ellipse(40,40,26,14,0.6,0,7);c.fill();
  });
  pondTex.wrapS=pondTex.wrapT=THREE.RepeatWrapping;pondTex.repeat.set(2.4,2.4);
  const water=new THREE.Mesh(new THREE.CircleGeometry(5.4,26),
    new THREE.MeshPhongMaterial({map:pondTex,color:0xbfe0f0,shininess:120,transparent:true,opacity:0.96}));
  water.rotation.x=-Math.PI/2;water.position.set(-109,0.05,18);scene.add(water);
  const sandM=mat(0xd8c9a0);
  const rim=new THREE.Mesh(new THREE.RingGeometry(5.3,6.3,26),sandM);
  rim.rotation.x=-Math.PI/2;rim.position.set(-109,0.045,18);rim.receiveShadow=true;scene.add(rim);
  for(let i=0;i<9;i++){
    const a=i/9*Math.PI*2,r=5.9+((i*13)%3)*0.25;
    const st=new THREE.Mesh(new THREE.SphereGeometry(0.28+((i*7)%3)*0.09,6,5),mat(0x8d8d94));
    st.position.set(-109+Math.cos(a)*r,0.14,18+Math.sin(a)*r);
    st.scale.y=0.6;st.castShadow=true;scene.add(st);
  }
  addCol(-109,18,9.4,9.4);   // keep everyone out of the water
  function makeDuck(colr){
    const g=new THREE.Group();
    const body=new THREE.Mesh(new THREE.SphereGeometry(0.3,8,6),mat(colr));
    body.scale.set(1,0.75,1.35);body.position.y=0.16;body.castShadow=true;g.add(body);
    const head=new THREE.Mesh(new THREE.SphereGeometry(0.16,7,6),mat(colr===0xf4f4e8?0xf4f4e8:0x2e6e3e));
    head.position.set(0,0.48,0.3);g.add(head);
    box(0.09,0.05,0.16,0xe8a13c,0,0.45,0.46,g);
    box(0.2,0.14,0.3,colr===0xf4f4e8?0xe8e0c8:0x6b4a2a,0,0.26,-0.2,g);
    return g;
  }
  [[0xf4f4e8,0],[0x7a5a3a,2.6]].forEach(dk=>{
    const d=makeDuck(dk[0]);
    d.userData={a:dk[1],r:2.6+dk[1]*0.4,sp:0.28};
    scene.add(d);DUCKS.push(d);
  });
  // gravel path from the sidewalk to the playground
  const gravelTex=texCanvas(128,128,c=>{
    c.fillStyle='#b9b0a2';c.fillRect(0,0,128,128);
    for(let i=0;i<400;i++){
      const v=150+Math.floor(Math.random()*70);
      c.fillStyle='rgb('+v+','+(v-8)+','+(v-18)+')';
      c.beginPath();c.arc(Math.random()*128,Math.random()*128,1+Math.random()*2,0,7);c.fill();
    }
  });
  gravelTex.wrapS=gravelTex.wrapT=THREE.RepeatWrapping;gravelTex.repeat.set(2,8);
  const path=flat(3,26,new THREE.MeshLambertMaterial({map:gravelTex}),-122,20,0.04);
  // picnic table
  const pt=new THREE.Group();pt.position.set(-104,0,34);pt.rotation.y=0.4;scene.add(pt);
  box(2.2,0.12,1.1,0x9a6b42,0,0.78,0,pt).castShadow=true;
  box(2.2,0.1,0.45,0x9a6b42,0,0.45,0.95,pt);
  box(2.2,0.1,0.45,0x9a6b42,0,0.45,-0.95,pt);
  [[-0.85],[0.85]].forEach(px2=>{
    const leg=box(0.12,0.85,1.9,0x7a5230,px2[0],0.4,0,pt);leg.rotation.x=0.35;
  });
  addCol(-104,34,2.6,2.4);
}
/* backyard privacy fences along the rear property lines */
{
  const fenceTex=texCanvas(128,64,c=>{
    c.fillStyle='#a8814e';c.fillRect(0,0,128,64);
    for(let x=0;x<128;x+=13){
      const v=Math.floor(Math.random()*26)-13;
      c.fillStyle='rgb('+(168+v)+','+(129+v)+','+(78+v)+')';
      c.fillRect(x+1,0,11,64);
      c.fillStyle='rgba(60,40,20,0.5)';c.fillRect(x,0,1.5,64);
    }
    c.fillStyle='rgba(60,40,20,0.35)';c.fillRect(0,8,128,3);c.fillRect(0,50,128,3);
  });
  fenceTex.wrapS=fenceTex.wrapT=THREE.RepeatWrapping;
  const mk=(cx,cz,len)=>{
    const t2=fenceTex.clone();t2.needsUpdate=true;t2.repeat.set(len/2.6,1);
    const f=new THREE.Mesh(new THREE.BoxGeometry(len,1.7,0.1),
      new THREE.MeshLambertMaterial({map:t2}));
    f.position.set(cx,0.85,cz);f.castShadow=true;f.receiveShadow=true;scene.add(f);
    addCol(cx,cz,len,0.5);
  };
  mk(-68,-30.5,80);    // behind the north yards (ends before the open field coins)
  mk(8,34,68);         // behind the south-east yards
}
/* backyard trampoline (bouncy!) at 245's yard */
const TRAMP={x:24,z:-26,r:1.9};
{
  const t=new THREE.Group();t.position.set(TRAMP.x,0,TRAMP.z);scene.add(t);
  const matBlack=new THREE.Mesh(new THREE.CylinderGeometry(1.55,1.55,0.09,18),mat(0x22262e));
  matBlack.position.y=0.78;t.add(matBlack);
  const pad=new THREE.Mesh(new THREE.TorusGeometry(1.7,0.19,8,20),mat(0x2a7fd4));
  pad.rotation.x=Math.PI/2;pad.position.y=0.8;pad.castShadow=true;t.add(pad);
  for(let i=0;i<6;i++){
    const a=i/6*Math.PI*2;
    box(0.09,0.8,0.09,0x8a929c,Math.cos(a)*1.55,0.4,Math.sin(a)*1.55,t);
  }
}
/* butterflies fluttering near the flower beds */
const BUTTERFLIES=[];
{
  const bcols=[0xe8641e,0x8a3fd1,0x2a9fd4];
  [[-60,-11],[-20,-11],[40,11]].forEach((p2,i)=>{
    const b=new THREE.Group();
    const wm=new THREE.MeshLambertMaterial({color:bcols[i],side:THREE.DoubleSide});
    wm.color.convertSRGBToLinear();wm.userData._lin=1;
    const mkWing=sd=>{
      const pv=new THREE.Group();
      const w=new THREE.Mesh(new THREE.PlaneGeometry(0.2,0.26),wm);
      w.rotation.x=-Math.PI/2;w.position.x=sd*0.11;
      pv.add(w);b.add(pv);return pv;
    };
    const p1v=mkWing(-1),p2v=mkWing(1);
    b.userData={cx:p2[0],cz:p2[1],a:i*2,w1:p1v,w2:p2v};
    scene.add(b);BUTTERFLIES.push(b);
  });
}
/* street lights, stop sign, hydrant */
const lampHeadMat=new THREE.MeshBasicMaterial({color:0xfff2c2});
function streetLamp(x,z,rot,tall){
  const h=tall?5.4:4.4;
  const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot||0;scene.add(g);
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.13,h,8),mat(0x3c424a));
  pole.position.y=h/2;g.add(pole);
  box(0.12,0.12,1.5,0x3c424a,0,h-0.05,0.75,g);
  const head=new THREE.Mesh(new THREE.BoxGeometry(0.36,0.14,0.8),lampHeadMat);
  head.position.set(0,h-0.14,1.45);g.add(head);
  box(0.42,0.08,0.9,0x2b3138,0,h-0.04,1.45,g);
  addCol(x,z,0.4,0.4);
}
streetLamp(-120,6.8,Math.PI);streetLamp(-78,-6.8,0);streetLamp(-32,6.8,Math.PI);
streetLamp(8,-6.8,0);streetLamp(46,6.8,Math.PI);streetLamp(66,-6.8,0);
streetLamp(72.4,-46,Math.PI/2);streetLamp(87.6,42,-Math.PI/2);
streetLamp(95,-28.5,Math.PI/2,true);streetLamp(139,-28.5,-Math.PI/2,true);
{
  // stop sign at the intersection corner
  box(0.1,2.8,0.1,0x8a929c,86.8,1.4,6.3);addCol(86.8,6.3,0.4,0.4);
  const st=texCanvas(128,128,c=>{
    c.translate(64,64);c.fillStyle='#c0392b';
    c.beginPath();
    for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;c.lineTo(Math.cos(a)*60,Math.sin(a)*60);}
    c.closePath();c.fill();
    c.strokeStyle='#fff';c.lineWidth=5;c.stroke();
    c.fillStyle='#fff';c.font='900 34px Verdana';c.textAlign='center';c.textBaseline='middle';c.fillText('STOP',0,2);
  });
  const s1=signMesh(1.1,1.1,st);s1.position.set(86.8,2.6,6.24);s1.rotation.y=Math.PI+0.5;scene.add(s1);
  const s2=signMesh(1.1,1.1,st);s2.position.set(86.8,2.6,6.36);s2.rotation.y=0.5;scene.add(s2);
  // fire hydrant on the north sidewalk strip
  const hyd=new THREE.Group();hyd.position.set(-14,0,-6.6);scene.add(hyd);
  const hb=new THREE.Mesh(new THREE.CylinderGeometry(0.17,0.2,0.62,8),mat(0xd5232a));
  hb.position.y=0.31;hb.castShadow=true;hyd.add(hb);
  const hc2=new THREE.Mesh(new THREE.SphereGeometry(0.17,8,6),mat(0xd5232a));
  hc2.position.y=0.62;hyd.add(hc2);
  box(0.5,0.1,0.12,0xd5232a,0,0.42,0,hyd);
  box(0.12,0.1,0.5,0xd5232a,0,0.42,0,hyd);
  addCol(-14,-6.6,0.5,0.5);
}
/* ambient traffic — friendly cars that cruise the streets and stop for Carter */
function makeTrafficCar(color){
  const g=new THREE.Group();
  const paint=new THREE.MeshPhongMaterial({color,shininess:90});
  const body=vehShape([
    [2.1,0.36],[2.18,0.55],[2.1,0.68],[1.35,0.75],[0.8,0.72],
    [0.42,1.18],[-0.5,1.22],[-1.35,0.85],[-1.9,0.78],[-2.1,0.6],[-2.05,0.36]
  ],[1.28,-1.28],0.46,0.36);
  g.add(sideMesh(body,1.7,paint));
  const glass=vehShape([[0.78,0.74],[0.42,1.14],[-0.48,1.18],[-1.28,0.84]],[],0,0.74);
  g.add(sideMesh(glass,1.5,phong(0x1a2028,120)));
  box(1.4,0.08,0.06,0xfff6d8,0,0.55,2.12,g);
  box(1.4,0.07,0.06,0xff3b30,0,0.6,-2.08,g);
  addWheels(g,0.34,0.72,1.28,-1.28,0.26);
  return g;
}
const TRAFFIC=[];
function addTraffic(color,x,z,h,axis,dir,lo,hi){
  const m=makeTrafficCar(color);
  m.position.set(x,0,z);m.rotation.y=h;scene.add(m);
  m.userData.wheelList=Object.values(m.userData.wheels);
  TRAFFIC.push({m,x,z,h,axis,dir,lo,hi,spd:0,max:6.5+Math.random()*1.5,blockT:0,rev:0,touch:false});
}
addTraffic(0x4a90d9,-120,2,Math.PI/2,'x',1,-152,152);
addTraffic(0xe8641e,110,-2,-Math.PI/2,'x',-1,-152,152);
addTraffic(0x8a3fd1,82,110,Math.PI,'z',-1,-152,152);
/* birds */
const BIRDS=[];
for(let i=0;i<3;i++){
  const b=new THREE.Group();
  const wm=mat(0x2e3440);
  const w1=box(0.55,0.05,0.16,0x2e3440,-0.3,0,0,b);
  const w2=box(0.55,0.05,0.16,0x2e3440,0.3,0,0,b);
  b.userData={w1,w2,cx:(i-1)*70,cz:-20+i*30,r:34+i*12,y:25+i*4,a:i*2.1,sp:0.14+i*0.05};
  scene.add(b);BIRDS.push(b);
}
/* world bounds */
addCol(0,-165,340,20);addCol(0,165,340,20);addCol(-165,0,20,340);addCol(165,0,20,340);

/* ---------------- coins ---------------- */
const coinGeo=new THREE.CylinderGeometry(0.45,0.45,0.09,20);
const coinMat=new THREE.MeshLambertMaterial({color:0xFFC93C,emissive:0x8a6d00});
const coins=[];
/* exactly 30 coins — low-medium hunt: some in plain sight along the routes he
   already travels, the rest tucked behind houses, the store, and park corners */
const COIN_POS=[
  [-51,-11.8],[-64,-11],                                          // by the hoop + beside the porch
  [-88,-5.4],[-70,-5.4],[-26,-5.4],[6,-5.4],                      // north sidewalk trail
  [-98,5.4],[30,5.4],[104,5.4],                                   // south sidewalk
  [-64,-27],[-24,-29],[16,-27],                                   // backyards (north side)
  [-64,30],[4,32],                                                // behind south houses
  [-129,21],[-117,29],[-136,33],[-108,38],                        // park & playground
  [80,-48],[80,28],[80,60],                                       // Hero Way cruise line
  [97,-17],[128,-14],[135,-40],[104,-44],                         // QT lot + behind the store
  [-134,-14],[48,-38],[-40,52],[120,24],[-6,-44],                 // roam-a-little finds
];
COIN_POS.forEach((p,i)=>{
  if(save.got.includes(i))return;
  const g=new THREE.Group();
  const m=new THREE.Mesh(coinGeo,coinMat);m.rotation.x=Math.PI/2;g.add(m);
  g.position.set(p[0],1,p[1]);scene.add(g);
  coins.push({g,i,x:p[0],z:p[1]});
});

/* ---------------- avatar ---------------- */
function faceTex(){
  return texCanvas(128,128,c=>{
    c.fillStyle='#ffd23e';c.fillRect(0,0,128,128);
    c.fillStyle='#20304A';
    c.beginPath();c.arc(42,52,7,0,7);c.fill();
    c.beginPath();c.arc(86,52,7,0,7);c.fill();
    c.lineWidth=7;c.strokeStyle='#20304A';c.lineCap='round';
    c.beginPath();c.arc(64,72,24,0.25*Math.PI,0.75*Math.PI);c.stroke();
  });
}
function makeAvatar(shirtHex){
  const g=new THREE.Group();
  const skin=0xffd23e;
  const headMats=[mat(skin),mat(skin),mat(skin),mat(skin),
    new THREE.MeshLambertMaterial({map:faceTex()}),mat(skin)];
  const head=new THREE.Mesh(new THREE.BoxGeometry(0.62,0.62,0.62),headMats);
  head.position.y=1.95;head.castShadow=true;g.add(head);
  const shirt=new THREE.Color(shirtHex).getHex();
  const torso=box(0.72,0.85,0.45,shirt,0,1.175,0,g);torso.castShadow=true;
  const parts={};
  [['armL',-0.5],['armR',0.5]].forEach(a=>{
    const ag=new THREE.Group();ag.position.set(a[1],1.55,0);g.add(ag);
    const m=box(0.26,0.78,0.26,shirt,0,-0.34,0,ag);m.castShadow=true;parts[a[0]]=ag;
  });
  [['legL',-0.19],['legR',0.19]].forEach(a=>{
    const ag=new THREE.Group();ag.position.set(a[1],0.75,0);g.add(ag);
    const m=box(0.3,0.75,0.3,0x3a4a5a,0,-0.375,0,ag);m.castShadow=true;parts[a[0]]=ag;
  });
  parts.head=head;
  g.userData.parts=parts;
  return g;
}
/* emoji sprite (snack in hand while eating) */
const _emojiTex={};
function emojiSprite(em){
  if(!_emojiTex[em])
    _emojiTex[em]=texCanvas(128,128,c=>{
      c.font='92px serif';c.textAlign='center';c.textBaseline='middle';c.fillText(em,64,72);
    });
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:_emojiTex[em],transparent:true,depthTest:false}));
  s.scale.set(0.55,0.55,1);
  return s;
}
let avatar=makeAvatar(save.shirt||'#2e6fe0');
avatar.position.set(-60,0,-9);scene.add(avatar);

/* ---------------- vehicles: Tesla, Cybertruck, Tahoe, bike ---------------- */
function makeWheel(r,w,hubC){
  r=r||0.42;w=w||0.32;
  const wg=new THREE.Group();
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,w,18),mat(0x14171a));
  m.rotation.z=Math.PI/2;m.castShadow=true;wg.add(m);
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(r*0.62,r*0.62,w+0.03,14),mat(hubC||0xcccccc));
  hub.rotation.z=Math.PI/2;wg.add(hub);
  return wg;
}
function addWheels(g,r,xoff,zf,zb,w,hubC){
  const mk=()=>makeWheel(r,w,hubC);
  const ws={fl:mk(),fr:mk(),bl:mk(),br:mk()};
  ws.fl.position.set(-xoff,r,zf);ws.fr.position.set(xoff,r,zf);
  ws.bl.position.set(-xoff,r,zb);ws.br.position.set(xoff,r,zb);
  Object.values(ws).forEach(x=>g.add(x));
  g.userData.wheels=ws;g.userData.wheelAxis='x';
}
/* side-profile shape with wheel-arch cutouts along the bottom edge.
   pts run from the front-bottom corner up over the nose/roof/tail down
   to the rear-bottom corner; arches are cut on the way back. */
function vehShape(pts,archXs,archR,bottomY){
  const sh=new THREE.Shape();
  sh.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++)sh.lineTo(pts[i][0],pts[i][1]);
  const xs=archXs.slice().sort((a,b)=>a-b);
  for(const cx of xs){
    sh.lineTo(cx-archR,bottomY);
    sh.absarc(cx,bottomY,archR,Math.PI,0,true);
  }
  sh.lineTo(pts[0][0],bottomY);
  return sh;
}
function sideMesh(shape,w,material){
  const geo=new THREE.ExtrudeGeometry(shape,{depth:w,bevelEnabled:false});
  geo.translate(0,0,-w/2);
  const m=new THREE.Mesh(geo,material);
  m.rotation.y=-Math.PI/2;
  m.castShadow=true;
  return m;
}
function phong(cc,sh,flat){
  const m=new THREE.MeshPhongMaterial({color:cc,shininess:sh,flatShading:!!flat});
  m.color.convertSRGBToLinear();m.userData._lin=1;return m;
}
function teslaFallback(){
  const g=new THREE.Group();
  const paint=phong(0x5d6266,130); // space gray
  const tint=phong(0x0b0e11,150);  // deep tint
  // low, smooth fastback: one continuous arc hood->roof->trunk
  const body=vehShape([
    [2.34,0.34],[2.43,0.5],[2.36,0.64],[1.7,0.72],[1.05,0.79],
    [0.44,1.2],[-0.08,1.3],[-0.66,1.26],[-1.68,0.96],[-2.12,0.88],
    [-2.38,0.72],[-2.42,0.5],[-2.34,0.34]
  ],[1.45,-1.45],0.52,0.34);
  g.add(sideMesh(body,1.84,paint));
  // black-glass canopy, windshield to rear glass (Model 3 glass roof)
  const canopy=vehShape([
    [1.03,0.77],[0.46,1.18],[-0.06,1.27],[-0.64,1.23],[-1.64,0.94]
  ],[],0,0.77);
  g.add(sideMesh(canopy,1.62,tint));
  box(1.6,0.07,0.06,0xff3b30,0,0.66,-2.4,g);      // tail light bar
  box(1.5,0.14,0.08,0x15181b,0,0.42,2.4,g);       // black front fascia lip
  box(0.18,0.13,0.04,0xffffff,0,0.55,2.42,g);     // T badge
  box(0.09,0.1,0.22,0x0b0e11,-0.97,0.84,0.95,g);  // mirrors
  box(0.09,0.1,0.22,0x0b0e11,0.97,0.84,0.95,g);
  [[0.55,1],[-0.35,1],[0.55,-1],[-0.35,-1]].forEach(p=>
    box(0.02,0.035,0.24,0x1a1d20,p[1]*0.925,0.7,p[0],g)); // flush door handles
  addWheels(g,0.37,0.79,1.45,-1.45);
  return g;
}
function tahoeFallback(){
  const g=new THREE.Group();
  const paint=phong(0xf4f4f0,85);  // white
  const glassM=phong(0x171c21,110);
  // big two-box SUV: tall blunt nose, long flat roof, upright tailgate
  const body=vehShape([
    [2.6,0.42],[2.69,0.8],[2.66,1.14],[2.25,1.2],[1.32,1.24],
    [0.82,1.88],[-2.18,1.94],[-2.5,1.9],[-2.63,1.15],[-2.58,0.42]
  ],[1.62,-1.62],0.58,0.42);
  g.add(sideMesh(body,2.08,paint));
  // dark side glass band inset into the greenhouse
  const glass=vehShape([
    [0.86,1.26],[0.5,1.8],[-2.12,1.86],[-2.4,1.26]
  ],[],0,1.26);
  g.add(sideMesh(glass,2.12,glassM));
  box(0.05,0.06,3.0,0x9aa0a6,-0.8,2.0,-0.75,g);   // roof rails
  box(0.05,0.06,3.0,0x9aa0a6,0.8,2.0,-0.75,g);
  box(1.9,0.5,0.12,0x17191c,0,0.82,2.66,g);       // big black-mesh grille
  box(2.02,0.08,0.1,0xd0d4d8,0,1.1,2.66,g);       // chrome grille bar
  box(0.42,0.13,0.05,0xd4af37,0,0.84,2.74,g);     // gold Chevy bowtie
  box(0.15,0.34,0.05,0xd4af37,0,0.84,2.73,g);
  box(2.1,0.16,5.24,0x25282c,0,0.36,0,g);         // black lower cladding
  box(0.22,0.07,2.9,0x3a3e43,-1.1,0.52,-0.1,g);   // running boards
  box(0.22,0.07,2.9,0x3a3e43,1.1,0.52,-0.1,g);
  box(0.28,0.62,0.07,0xff3b30,-0.82,1.42,-2.64,g); // vertical tail lamps
  box(0.28,0.62,0.07,0xff3b30,0.82,1.42,-2.64,g);
  box(0.1,0.14,0.26,0x25282c,-1.1,1.14,1.0,g);    // mirrors
  box(0.1,0.14,0.26,0x25282c,1.1,1.14,1.0,g);
  addWheels(g,0.43,0.87,1.62,-1.62);
  return g;
}
/* Cybertruck: real low-poly glTF model (by Mobolaji via poly.pizza, CC-BY 3.0),
   embedded as base64; falls back to a built-in wedge if parsing fails */
function cyberFallback(){
  const f=new THREE.Group();
  const steel=phong(0xbcc0c3,100,true);
  f.add(sideMesh(vehShape([
    [2.72,0.34],[2.75,0.95],[0.2,1.62],[-2.72,1.08],[-2.75,0.4]
  ],[1.72,-1.72],0.56,0.34),2.16,steel));
  f.add(sideMesh(vehShape([
    [1.62,1.02],[0.22,1.5],[-1.3,1.3],[-1.3,1.02]
  ],[],0,1.02),2.02,phong(0x14181c,130)));
  box(2.14,0.05,0.06,0xf8f8ff,0,0.97,2.73,f);
  box(2.14,0.05,0.06,0xff3b30,0,1.06,-2.73,f);
  addWheels(f,0.46,0.92,1.72,-1.72);
  return f;
}
/* generic embedded-GLB vehicle: normalize length/orientation/ground, style fixes,
   graceful fallback to the hand-built model if parsing fails */
const VEH_CFG={
  cyber:{len:5.4,flip:true},
  tesla:{len:4.65,flip:false,lift:0.34,
    after:g=>{addWheels(g,0.33,0.82,1.44,-1.44,0.26,0x3a3e44);},  // tucked dark aero wheels
    fix:mt=>{if(mt.color)mt.color.set(0x5d6266).convertSRGBToLinear();}},   // space gray tint
  tahoe:{len:5.35,flip:false,noAuto:true,             // verified: raw nose already at +z; white paint baked offline
    after:g=>{box(0.42,0.13,0.05,0xd4af37,0,0.82,2.72,g);box(0.15,0.34,0.05,0xd4af37,0,0.82,2.71,g);}},
};
function makeGLBVehicle(key,fallback){
  const g=new THREE.Group();
  const cfg=VEH_CFG[key];
  let ok=false;
  try{
    const b64=window.EKW_GLB&&window.EKW_GLB[key];
    if(b64&&THREE.GLTFLoader){
      const bin=atob(b64);
      const buf=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++)buf[i]=bin.charCodeAt(i);
      new THREE.GLTFLoader().parse(buf.buffer,'',gltf=>{
        const m=gltf.scene;
        let bb=new THREE.Box3().setFromObject(m);
        let sz=bb.getSize(new THREE.Vector3());
        if(!cfg.noAuto&&sz.x>sz.z)m.rotation.y=Math.PI/2;   // longest side becomes length (z)
        if(cfg.flip)m.rotation.y+=Math.PI;
        if(cfg.rot)m.rotation.y+=cfg.rot;
        m.updateMatrixWorld(true);
        bb=new THREE.Box3().setFromObject(m);
        sz=bb.getSize(new THREE.Vector3());
        m.scale.setScalar(cfg.len/Math.max(sz.x,sz.z));
        m.updateMatrixWorld(true);
        bb=new THREE.Box3().setFromObject(m);
        const c=bb.getCenter(new THREE.Vector3());
        m.position.x-=c.x;m.position.z-=c.z;
        m.position.y+=(cfg.lift||0)-bb.min.y;
        m.traverse(o=>{
          if(o.isMesh){
            o.castShadow=true;
            const mats=Array.isArray(o.material)?o.material:[o.material];
            mats.forEach(mt=>{
              if(!mt)return;
              if(mt.metalness!==undefined){
                mt.metalness=Math.min(mt.metalness,0.35);
                mt.roughness=Math.max(mt.roughness||0.5,0.45);
              }
              if(cfg.fix)cfg.fix(mt);
            });
          }
        });
        ok=true;
        g.add(m);
        if(cfg.after)cfg.after(g);
      },()=>{if(!ok)g.add(fallback());});
    }else g.add(fallback());
  }catch(e){if(!ok)g.add(fallback());}
  return g;
}
function makeTesla(){return makeGLBVehicle('tesla',teslaFallback);}
function makeTahoe(){return makeGLBVehicle('tahoe',tahoeFallback);}
function makeCybertruck(){return makeGLBVehicle('cyber',cyberFallback);}
function makeBike(){
  const g=new THREE.Group();
  function bwheel(z){
    const wg=new THREE.Group();wg.position.set(0,0.36,z);
    const t=new THREE.Mesh(new THREE.TorusGeometry(0.34,0.05,8,20),mat(0x22262c));
    t.castShadow=true;wg.add(t);
    const sp=new THREE.Mesh(new THREE.BoxGeometry(0.02,0.62,0.02),mat(0xcccccc));wg.add(sp);
    const sp2=new THREE.Mesh(new THREE.BoxGeometry(0.02,0.62,0.02),mat(0xcccccc));
    sp2.rotation.z=Math.PI/2;wg.add(sp2);
    wg.rotation.y=Math.PI/2;
    g.add(wg);return wg;
  }
  const w1=bwheel(0.62),w2=bwheel(-0.62);
  const red=mat(0xd5232a);
  const bar=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.07,1.15),red);
  bar.position.set(0,0.72,0.05);bar.rotation.x=0.1;bar.castShadow=true;g.add(bar);
  const seatPost=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.42,0.07),red);
  seatPost.position.set(0,0.86,-0.42);g.add(seatPost);
  box(0.3,0.07,0.42,0x20242a,0,1.08,-0.44,g);
  const head=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.52,0.07),red);
  head.position.set(0,0.84,0.52);head.rotation.x=-0.22;g.add(head);
  box(0.66,0.06,0.06,0x20242a,0,1.1,0.6,g);
  g.userData.wheels={f:w1,b:w2};g.userData.wheelAxis='z';
  return g;
}
const VEHICLES=[
 {key:'tesla',label:'Tesla',     icon:'🚗',mesh:makeTesla(),     home:{x:-52,z:-8,h:0},max:26,accel:13,rad:1.3,ev:true, fuel:100},
 {key:'cyber',label:'Cybertruck',icon:'🛻',mesh:makeCybertruck(),home:{x:-47,z:-8,h:0},max:24,accel:12,rad:1.5,ev:true, fuel:100},
 {key:'tahoe',label:'Tahoe',     icon:'🚙',mesh:makeTahoe(),     home:{x:-42,z:-8,h:0},max:22,accel:10,rad:1.5,fuel:100},
 {key:'bike', label:'bike',      icon:'🚲',mesh:makeBike(),      home:{x:-55.8,z:-9.2,h:0.9},max:9.5,accel:7,rad:0.5,bike:true},
];
VEHICLES.forEach(v=>{
  v.x=v.home.x;v.z=v.home.z;v.h=v.home.h;v.spd=0;
  v.mesh.position.set(v.x,0,v.z);v.mesh.rotation.y=v.h;scene.add(v.mesh);
});

/* ---------------- delivery van ---------------- */
function vanSideTex(flip){
  return texCanvas(512,256,c=>{
    c.fillStyle='#2c3a4a';c.fillRect(0,0,512,256);
    c.fillStyle='#fff';c.font='900 84px Verdana';c.textAlign='center';
    if(flip){c.translate(512,0);c.scale(-1,1);}
    c.fillText('speedy',256,130);
    c.strokeStyle='#FF9900';c.lineWidth=14;c.lineCap='round';
    c.beginPath();c.moveTo(140,170);c.quadraticCurveTo(256,215,370,170);c.stroke();
    c.beginPath();c.moveTo(370,170);c.lineTo(345,150);c.moveTo(370,170);c.lineTo(342,185);c.stroke();
  });
}
function makeVan(){
  const g=new THREE.Group();
  const cargo=new THREE.Mesh(new THREE.BoxGeometry(2.3,2.3,4),mat(0x2c3a4a));
  cargo.position.set(0,1.6,-0.7);cargo.castShadow=true;g.add(cargo);
  const sL=signMesh(3.6,1.9,vanSideTex(false));sL.position.set(-1.17,1.6,-0.7);sL.rotation.y=-Math.PI/2;g.add(sL);
  const sR=signMesh(3.6,1.9,vanSideTex(true));sR.position.set(1.17,1.6,-0.7);sR.rotation.y=Math.PI/2;g.add(sR);
  const cab=box(2.1,1.4,1.6,0x3d4f63,0,1.05,2,g);cab.castShadow=true;
  box(1.9,0.8,0.1,0x9fd0e8,0,1.35,2.82,g);
  const ws={fl:makeWheel(),fr:makeWheel(),bl:makeWheel(),br:makeWheel()};
  ws.fl.position.set(-1.05,0.42,1.9);ws.fr.position.set(1.05,0.42,1.9);
  ws.bl.position.set(-1.05,0.42,-1.6);ws.br.position.set(1.05,0.42,-1.6);
  Object.values(ws).forEach(w=>g.add(w));
  g.userData.wheels=ws;
  return g;
}
const van=makeVan();van.visible=false;scene.add(van);

/* ---------------- package box ---------------- */
function boxTex(){
  return texCanvas(256,256,c=>{
    c.fillStyle='#c8965a';c.fillRect(0,0,256,256);
    c.fillStyle='#b07f42';c.fillRect(0,116,256,24);
    c.strokeStyle='#FF9900';c.lineWidth=10;c.lineCap='round';
    c.beginPath();c.moveTo(60,190);c.quadraticCurveTo(128,215,196,190);c.stroke();
    c.beginPath();c.moveTo(196,190);c.lineTo(180,176);c.moveTo(196,190);c.lineTo(178,200);c.stroke();
  });
}
const pkgMat=new THREE.MeshLambertMaterial({map:boxTex()});
function makePackage(){
  const m=new THREE.Mesh(new THREE.BoxGeometry(0.8,0.8,0.8),pkgMat);
  m.castShadow=true;
  const ringM=new THREE.MeshBasicMaterial({color:0xFFC93C});
  ringM.color.convertSRGBToLinear();ringM.userData._lin=1;
  const ring=new THREE.Mesh(new THREE.TorusGeometry(0.75,0.05,8,24),ringM);
  ring.rotation.x=Math.PI/2;ring.position.y=-0.32;m.add(ring);
  return m;
}

/* ---------------- dog: Tiny the chihuahua ---------------- */
function makeDog(){
  const g=new THREE.Group();
  const fawn=0xd9a86a,cream=0xe8cba0;
  const body=box(0.26,0.24,0.44,fawn,0,0.28,0,g);body.castShadow=true;
  box(0.2,0.14,0.31,cream,0,0.19,0.05,g);                    // cream chest/belly
  const head=box(0.3,0.28,0.28,fawn,0,0.52,0.3,g);head.castShadow=true;
  box(0.14,0.1,0.12,cream,0,0.45,0.46,g);                    // little muzzle
  box(0.05,0.05,0.05,0x20242a,0,0.47,0.53,g);                // nose
  box(0.05,0.06,0.02,0x20242a,-0.08,0.57,0.445,g);           // big round eyes
  box(0.05,0.06,0.02,0x20242a,0.08,0.57,0.445,g);
  const earL=box(0.16,0.26,0.04,fawn,-0.13,0.77,0.26,g);earL.rotation.z=0.3;   // GIANT ears
  const earR=box(0.16,0.26,0.04,fawn,0.13,0.77,0.26,g);earR.rotation.z=-0.3;
  box(0.08,0.13,0.02,0xc98aa0,-0.13,0.75,0.283,g).rotation.z=0.3;              // pink inner ear
  box(0.08,0.13,0.02,0xc98aa0,0.13,0.75,0.283,g).rotation.z=-0.3;
  [[-0.09,0.15],[0.09,0.15],[-0.09,-0.16],[0.09,-0.16]].forEach(p=>box(0.07,0.18,0.07,fawn,p[0],0.09,p[1],g));
  const tail=new THREE.Group();tail.position.set(0,0.36,-0.24);g.add(tail);
  const t1=box(0.05,0.05,0.2,fawn,0,0.06,-0.07,tail);t1.rotation.x=-0.9;       // curled-up tail
  box(0.05,0.05,0.1,cream,0,0.15,-0.12,tail);
  g.userData.tail=tail;
  return g;
}
const dog=makeDog();
const DOG_HOME={x:-64.5,z:-10};
dog.position.set(DOG_HOME.x,0,DOG_HOME.z);scene.add(dog);

/* ---------------- soccer ball ---------------- */
const ball={mesh:new THREE.Mesh(new THREE.SphereGeometry(0.42,12,10),
  new THREE.MeshLambertMaterial({color:0xffffff})),
  x:-67,y:0.42,z:-7,vx:0,vy:0,vz:0};
ball.mesh.castShadow=true;
const ballDot=box(0.2,0.2,0.2,0x20304A,0,0,0.36,ball.mesh);
scene.add(ball.mesh);

/* ---------------- townsfolk ---------------- */
const _faceTexCache={};
function personFaceTex(skin){
  const k='f'+skin;
  if(!_faceTexCache[k]){
    _faceTexCache[k]=texCanvas(128,128,c=>{
      c.fillStyle='#'+skin.toString(16).padStart(6,'0');c.fillRect(0,0,128,128);
      c.fillStyle='#fff';
      c.beginPath();c.ellipse(44,52,10,8,0,0,7);c.fill();
      c.beginPath();c.ellipse(84,52,10,8,0,0,7);c.fill();
      c.fillStyle='#3a2a1a';
      c.beginPath();c.arc(44,53,4.5,0,7);c.fill();
      c.beginPath();c.arc(84,53,4.5,0,7);c.fill();
      c.strokeStyle='rgba(60,40,20,0.8)';c.lineWidth=4;c.lineCap='round';
      c.beginPath();c.moveTo(34,40);c.lineTo(54,38);c.stroke();
      c.beginPath();c.moveTo(74,38);c.lineTo(94,40);c.stroke();
      c.strokeStyle='rgba(120,70,40,0.85)';c.lineWidth=6;
      c.beginPath();c.arc(64,74,20,0.35,Math.PI-0.35);c.stroke();
    });
  }
  return _faceTexCache[k];
}
function makePerson(o){
  o=o||{};
  const g=new THREE.Group();
  const skin=o.skin||0xe8b88a, shirt=o.shirt||0x2e6fe0, pants=o.pants||0x2b3540, hair=o.hair||0x5a4022;
  const parts={};
  [['legL',-0.21],['legR',0.21]].forEach(a=>{
    const ag=new THREE.Group();ag.position.set(a[1],1.0,0);g.add(ag);
    const m=box(0.32,1.0,0.32,pants,0,-0.5,0,ag);m.castShadow=true;parts[a[0]]=ag;
  });
  const torso=box(0.8,0.98,0.48,shirt,0,1.49,0,g);torso.castShadow=true;
  [['armL',-0.54],['armR',0.54]].forEach(a=>{
    const ag=new THREE.Group();ag.position.set(a[1],1.88,0);g.add(ag);
    box(0.26,0.38,0.26,shirt,0,-0.17,0,ag);
    const m=box(0.2,0.56,0.2,skin,0,-0.62,0,ag);m.castShadow=true;parts[a[0]]=ag;
  });
  const sm=cN=>new THREE.MeshLambertMaterial({color:cN});
  const head=new THREE.Mesh(new THREE.BoxGeometry(0.58,0.58,0.58),
    [sm(skin),sm(skin),sm(skin),sm(skin),new THREE.MeshLambertMaterial({map:personFaceTex(skin)}),sm(skin)]);
  head.position.y=2.28;head.castShadow=true;g.add(head);
  box(0.6,0.32,0.15,hair,0,2.3,-0.31,g);
  if(o.cap){
    box(0.62,0.15,0.62,o.cap,0,2.62,0,g);
    box(0.6,0.1,0.24,o.cap,0,2.55,0.38,g);
  }else{
    box(0.62,0.14,0.62,hair,0,2.6,0,g);
  }
  if(o.pony)box(0.16,0.5,0.16,hair,0,2.08,-0.4,g);
  parts.head=head;
  g.userData.parts=parts;
  if(o.scale)g.scale.setScalar(o.scale);
  return g;
}
function makeMower(){
  const g=new THREE.Group();
  const b=box(0.52,0.24,0.72,0xd5232a,0,0.26,0,g);b.castShadow=true;
  box(0.2,0.14,0.2,0x22262c,0,0.44,-0.05,g);
  [[-0.22,0.28],[0.22,0.28],[-0.22,-0.28],[0.22,-0.28]].forEach(p=>{
    const w=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,0.06,10),mat(0x22262c));
    w.rotation.z=Math.PI/2;w.position.set(p[0],0.09,p[1]);g.add(w);
  });
  box(0.05,0.05,0.85,0x555b62,-0.18,0.6,-0.5,g).rotation.x=0.55;
  box(0.05,0.05,0.85,0x555b62,0.18,0.6,-0.5,g).rotation.x=0.55;
  box(0.44,0.05,0.05,0x555b62,0,0.88,-0.88,g);
  return g;
}
const NPCS=[];
function addNPC(cfg){
  cfg.mesh.position.set(cfg.x,0,cfg.z);
  scene.add(cfg.mesh);
  if(cfg.attach)scene.add(cfg.attach);
  cfg.wp=0;cfg.pause=0;cfg.ph=Math.random()*6;cfg.li=0;cfg.ang=0;cfg.wave=0;
  NPCS.push(cfg);
}
addNPC({name:'Mr. Bob',x:-46,z:10.5,type:'patrol',speed:1.5,pauseT:1.2,
  pts:[[-46,10.5],[-34,10.5]],attach:makeMower(),
  mesh:makePerson({shirt:0x6b8e23,pants:0x4a3b2a,skin:0xe8b88a,cap:0xd9c06a}),
  lines:['👨‍🌾 "Howdy, Carter!"','👨‍🌾 "Lawn\'s lookin\' sharp today!"','👨‍🌾 "Nice ride out there, partner!"']});
addNPC({name:'Max',x:-121,z:35,type:'loop',cx:-121,cz:28,r:7,speed:3.4,
  mesh:makePerson({shirt:0xff8c1a,pants:0x2b3540,skin:0xd99a66,hair:0x2a1c10,scale:0.62}),
  lines:['🏃 "Tag! You\'re it!"','🏃 "Betcha can\'t catch me!"','🏃 "Race you to the slide!"']});
addNPC({name:'Lily',x:-117.5,z:26.5,type:'hop',
  mesh:makePerson({shirt:0x8a3fd1,pants:0xe86aa6,skin:0xf0c8a0,hair:0x7a4a1e,pony:true,scale:0.6}),
  lines:['👧 "Watch how high I can jump!"','👧 "The swings are the BEST!"','👧 "Have you found all the coins?"']});
addNPC({name:'Miss Sue',x:110,z:-39.15,type:'patrol',speed:1.1,pauseT:1.6,
  pts:[[108.2,-39.15],[117.2,-39.15],[117.2,-42.6],[108.2,-42.6]],
  mesh:makePerson({shirt:0x2ec4b6,pants:0x30405a,skin:0xc98a5e,hair:0x1f1408,pony:true}),
  lines:['🛍️ "Have you tried the Takis? Spicy!"','🛍️ "Where do they keep the Oreos?"','🛍️ "This store has EVERYTHING!"']});

/* objective arrow */
const arrow=new THREE.Group();
const arrowCone=new THREE.Mesh(new THREE.ConeGeometry(0.32,0.9,10),
  new THREE.MeshBasicMaterial({color:0xFFC93C}));
arrowCone.rotation.x=Math.PI/2;arrowCone.position.z=0.45;
arrow.add(arrowCone);
const arrowTail=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.2,0.55),
  new THREE.MeshBasicMaterial({color:0xFFC93C}));
arrowTail.position.z=-0.15;arrow.add(arrowTail);
arrow.visible=false;
scene.add(arrow);

/* confetti pool */
const confetti=[];
function burst(x,y,z,n){
  const cols=[0xD5232A,0xFFC93C,0x3FA34D,0x2e6fe0,0x8a3fd1,0xff6b9d];
  if(!burst._mats)burst._mats=cols.map(cc=>{
    const mm=new THREE.MeshBasicMaterial({color:cc});
    mm.color.convertSRGBToLinear();mm.userData._lin=1;return mm;
  });
  for(let i=0;i<(n||24);i++){
    const m=new THREE.Mesh(new THREE.BoxGeometry(0.14,0.14,0.02),burst._mats[i%6]);
    m.position.set(x,y,z);scene.add(m);
    confetti.push({m,vx:(Math.random()-0.5)*6,vy:3+Math.random()*4.5,vz:(Math.random()-0.5)*6,
      rx:Math.random()*8,rz:Math.random()*8,life:1.7});
  }
}
