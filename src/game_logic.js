/* ================= Carter World — gameplay ================= */

/* ---------------- state ---------------- */
let playing=false,driving=false,paused=false;
let px=-60,pz=-9,py=0,pvy=0,pHeading=0,pSpeed=0;
let camYaw=0,camPitch=0.34,camDist=8,userCamT=0;
let activeV=null,carX=-52,carZ=-8,carH=0,carSpd=0,fuel=100,steerVis=0;
let joyX=0,joyY=0,jumpQ=false;
let shopSeen=false,checkoutSeen=false,boxOpened=false;
let shadowsOn=true;
const boxes=[];            // arrived packages {mesh, order}
let pkgAnim=null;          // flying box
const vanQ=[];             // orders waiting for a van run
let vanState='idle',vanT=0,vanOrder=null,nextVanAt=0;
let toastCount=0;

/* ---------------- toasts ---------------- */
function toast(msg,ms){
  if(toastCount>=3){const f=$('toasts').firstChild;if(f)f.remove();toastCount--;}
  const d=document.createElement('div');d.className='toast';d.textContent=msg;
  $('toasts').appendChild(d);toastCount++;
  setTimeout(()=>{d.remove();toastCount--;},ms||2800);
}
function setCoins(n){
  save.coins=n;persist();
  $('coinN').textContent=n;
  const p=$('coinPill');p.classList.remove('pop');void p.offsetWidth;p.classList.add('pop');
  setTimeout(()=>p.classList.remove('pop'),200);
  $('shopWallet').textContent='🪙 '+n;
  renderCart();
}

/* ---------------- objectives ---------------- */
const HOME_DOOR={x:-58,z:-10.5};
const STAGES=[
 {txt:'🚗 Hop into one of your rides!',  tgt:()=>({x:VEHICLES[0].x,z:VEHICLES[0].z}), done:()=>driving},
 {txt:'⛽ Drive to QuikTrip!',          tgt:()=>QT.lot,                 done:()=>dist2(driving?carX:px,driving?carZ:pz,QT.lot.x,QT.lot.z)<18*18},
 {txt:'🏪 Park & walk through the door!',tgt:()=>QT.door,               done:()=>shopSeen},
 {txt:'🍭 Grab snacks, then pay the cashier!',tgt:()=>cartCount()?{x:COUNTER_ZONE.x,z:COUNTER_ZONE.z}:{x:SHELF_ZONE.x,z:SHELF_ZONE.z}, done:()=>checkoutSeen},
 {txt:'🏠 Drive back home!',            tgt:()=>HOME_DOOR,              done:()=>dist2(driving?carX:px,driving?carZ:pz,HOME_DOOR.x,HOME_DOOR.z)<16*16},
 {txt:'📦 Watch for the Speedy van!',   tgt:()=>({x:-62.3,z:-11.3}),
  done:()=>boxOpened||(vanState==='idle'&&!pkgAnim&&vanQ.length===0&&boxes.length===0&&!save.orders.some(o=>o.status!=='opened'))},
];
function objText(){
  return save.stage<STAGES.length?STAGES[save.stage].txt:'🌟 Free play! Collect coins & shop anytime';
}
function objUpdate(){
  if(save.stage<STAGES.length&&STAGES[save.stage].done()){
    save.stage++;persist();
    sfx('stage');
    toast('⭐ Quest done!');
    $('objTxt').textContent=objText();
  }
}

/* ---------------- input: keyboard ---------------- */
const keys={};
addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT')return;
  keys[e.code]=true;
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
  if(!playing)return;
  if(e.code==='KeyE'||e.code==='Enter'){if(!anyModal())doInteract();}
  if(e.code==='Space'&&!driving)jumpQ=true;
  if(e.code==='KeyH'&&driving)sfx(activeV&&activeV.bike?'bell':'horn');
  if(e.code==='Escape'){if(anyModal())closeModals();else openPause();}
});
addEventListener('keyup',e=>keys[e.code]=false);
addEventListener('contextmenu',e=>e.preventDefault());
/* iOS: suppress pinch-zoom & double-tap zoom inside the game */
['gesturestart','gesturechange','gestureend'].forEach(ev=>
  document.addEventListener(ev,e=>e.preventDefault(),{passive:false}));
let lastTouchEnd=0;
document.addEventListener('touchend',e=>{
  const now=performance.now();
  const interactive=e.target.closest&&e.target.closest('button,a,input,.snack,.swatch,.bagRow,.orderRow');
  if(now-lastTouchEnd<320&&!interactive)e.preventDefault();
  lastTouchEnd=now;
},{passive:false});

/* ---------------- input: camera drag (pointer) ---------------- */
let dragId=null,dragX=0,dragY=0;
const cv=renderer.domElement;
cv.style.touchAction='none';
cv.addEventListener('pointerdown',e=>{
  if(dragId!==null)return;
  dragId=e.pointerId;dragX=e.clientX;dragY=e.clientY;
  try{cv.setPointerCapture(e.pointerId);}catch(_){}
});
cv.addEventListener('pointermove',e=>{
  if(e.pointerId!==dragId)return;
  camYaw-=(e.clientX-dragX)*0.006;
  camPitch=clamp(camPitch+(e.clientY-dragY)*0.005,0.08,1.15);
  dragX=e.clientX;dragY=e.clientY;userCamT=1.6;
});
const endDrag=e=>{if(e.pointerId===dragId)dragId=null;};
cv.addEventListener('pointerup',endDrag);
cv.addEventListener('pointercancel',endDrag);
cv.addEventListener('wheel',e=>{camDist=clamp(camDist+e.deltaY*0.01,4.5,16);},{passive:true});

/* ---------------- input: joystick + buttons ---------------- */
const joyZone=$('joyZone'),joyBase=$('joyBase'),joyStick=$('joyStick');
let joyId=null,joyCX=0,joyCY=0;
joyZone.addEventListener('touchstart',e=>{
  e.preventDefault();
  if(joyId!==null)return;
  const t=e.changedTouches[0];
  joyId=t.identifier;joyCX=t.clientX;joyCY=t.clientY;
  joyBase.style.display='block';
  const zr=joyZone.getBoundingClientRect();
  joyBase.style.left=(joyCX-zr.left-60)+'px';joyBase.style.top=(joyCY-zr.top-60)+'px';
  joyBase.style.bottom='auto';
},{passive:false});
joyZone.addEventListener('touchmove',e=>{
  e.preventDefault();
  for(const t of e.changedTouches){
    if(t.identifier!==joyId)continue;
    let dx=t.clientX-joyCX,dy=t.clientY-joyCY;
    const d=Math.hypot(dx,dy),max=48;
    if(d>max){dx=dx/d*max;dy=dy/d*max;}
    joyStick.style.left=(30+dx)+'px';joyStick.style.top=(30+dy)+'px';
    joyX=dx/max;joyY=-dy/max;
  }
},{passive:false});
const joyEnd=e=>{
  for(const t of e.changedTouches){
    if(t.identifier!==joyId)continue;
    joyId=null;joyX=0;joyY=0;
    joyBase.style.display='none';
    joyStick.style.left='30px';joyStick.style.top='30px';
  }
};
joyZone.addEventListener('touchend',joyEnd);
joyZone.addEventListener('touchcancel',joyEnd);
$('btnA').addEventListener('pointerdown',e=>{
  e.preventDefault();
  if(driving)sfx(activeV&&activeV.bike?'bell':'horn');else jumpQ=true;
});
$('btnB').addEventListener('pointerdown',e=>{e.preventDefault();if(!anyModal())doInteract();});
$('prompt').addEventListener('click',()=>{if(!anyModal())doInteract();});

/* ---------------- modals ---------------- */
function anyModal(){
  return ['shopModal','checkoutModal','bagModal','pauseModal','parentModal']
    .some(id=>!$(id).classList.contains('hidden'));
}
function closeModals(){
  ['shopModal','checkoutModal','bagModal','pauseModal','parentModal']
    .forEach(id=>$(id).classList.add('hidden'));
}
function openPause(){if(playing)$('pauseModal').classList.remove('hidden');}
$('pauseBtn').addEventListener('click',openPause);
$('pauseClose').addEventListener('click',closeModals);
$('resumeBtn').addEventListener('click',closeModals);
$('quitBtn').addEventListener('click',()=>{persist();location.reload();});
$('resetCarBtn').addEventListener('click',()=>{
  if(driving)exitCar(true);
  VEHICLES.forEach(v=>{
    v.x=v.home.x;v.z=v.home.z;v.h=v.home.h;v.spd=0;v.fuel=100;
    v.mesh.position.set(v.x,0,v.z);v.mesh.rotation.y=v.h;
  });
  closeModals();toast('🚗 All your rides are back home!');
});
$('shadowBtn').addEventListener('click',()=>{
  shadowsOn=!shadowsOn;
  sun.castShadow=shadowsOn;
  renderer.setPixelRatio(shadowsOn?Math.min(devicePixelRatio,IS_PHONE?1.3:(IS_TOUCH?1.5:1.75)):1);
  $('shadowBtn').textContent='✨ Fancy graphics: '+(shadowsOn?'ON':'OFF');
});
$('bagBtn').addEventListener('click',()=>{renderBag();$('bagModal').classList.remove('hidden');});
$('bagClose').addEventListener('click',closeModals);
$('sndBtn').addEventListener('click',()=>{
  save.sound=!save.sound;persist();
  if(master)master.gain.value=save.sound?0.5:0;
  $('sndBtn').textContent=save.sound?'🔊':'🔇';
});
$('fsBtn').addEventListener('click',()=>{
  const el=document.documentElement;
  const req=el.requestFullscreen||el.webkitRequestFullscreen;
  try{
    if(document.fullscreenElement||document.webkitFullscreenElement){
      (document.exitFullscreen||document.webkitExitFullscreen).call(document);
    }else if(req){
      req.call(el);
    }else{
      // iPhone Safari has no fullscreen API
      toast('💡 Tap Share, then "Add to Home Screen" for full screen!',4200);
    }
  }catch(e){}
});

/* ---------------- interactions ---------------- */
const SHELF_ZONE={x:112.5,z:-41,r:4.6};
const COUNTER_ZONE={x:124.6,z:-38,r:3.4};
const MAIL_LINES=['📬 A new comic book came!','📬 Pizza coupons! Score!','📬 A letter addressed to the coolest kid on Carter Street.','📬 Empty... the mail comes at 3pm!'];
const DOOR_LINES=['🚪 Mom: "Hi sweetie! Back before dark!"','🚪 Somebody inside yells "BRING SNACKS!"','🚪 You hear the TV playing inside.','🚪 Mom: "Did you feed Tiny?"'];
let mailI=0,doorI=0;
let curInteract=null;

function scanInteract(){
  let best=null;
  if(driving){
    const nearPump=Math.min(dist2(carX,carZ,QT.pumpA.x,QT.pumpA.z),dist2(carX,carZ,QT.pumpB.x,QT.pumpB.z));
    if(activeV&&!activeV.bike&&nearPump<5.5*5.5&&fuel<95&&Math.abs(carSpd)<1.5)
      best={label:activeV.ev?'⚡ Supercharge!':'⛽ Fill up the tank',
        fn:()=>{fuel=100;sfx('fill');toast(activeV.ev?'⚡ Charged up! Zoom!':"⛽ Tank's full! Vroom!");}};
    else if(Math.abs(carSpd)<2.5)
      best={label:activeV&&activeV.bike?'🚶 Hop off':'🚶 Hop out',fn:()=>exitCar(false)};
  }else{
    // nearest-wins: collect every interaction in range, pick the closest
    const cand=[];
    for(const b of boxes){
      const d=dist2(px,pz,b.mesh.position.x,b.mesh.position.z);
      if(d<2.4*2.4)cand.push({d:d-2,label:'📦 Open your package!',fn:()=>openBox(b)}); // small bonus: packages matter
    }
    for(const v of VEHICLES){
      const d=dist2(px,pz,v.x,v.z);
      if(d<3.3*3.3)cand.push({d,label:v.bike?'🚲 Ride your bike!':(v.icon+' Drive the '+v.label+'!'),fn:()=>enterCar(v)});
    }
    if(cartCount()>0){
      const d=dist2(px,pz,COUNTER_ZONE.x,COUNTER_ZONE.z);
      if(d<COUNTER_ZONE.r*COUNTER_ZONE.r)cand.push({d,label:'🧾 Check out with the cashier!',fn:openCheckout});
    }
    {
      const d=dist2(px,pz,SHELF_ZONE.x,SHELF_ZONE.z);
      if(d<SHELF_ZONE.r*SHELF_ZONE.r)cand.push({d,label:'🛒 Grab snacks!',fn:openShop});
    }
    if(cartCount()===0){
      const d=dist2(px,pz,COUNTER_ZONE.x,COUNTER_ZONE.z);
      if(d<2.6*2.6)cand.push({d,label:'🧑‍💼 Talk to the cashier',fn:()=>{
        sfx('pop');
        if(window._cashier)window._cashier.userData.wave=1.5;
        toast('🧑‍💼 "Howdy Carter! Grab some snacks from the shelves!"');
      }});
    }
    {
      const d=dist2(px,pz,dog.position.x,dog.position.z);
      if(d<2.2*2.2)cand.push({d,label:'🐶 Pet Tiny',fn:()=>{sfx('bark');dogHop=2.6;burst(dog.position.x,1.2,dog.position.z,10);toast('🐶 Tiny loves you!');}});
    }
    for(const n of NPCS){
      const d=dist2(px,pz,n.mesh.position.x,n.mesh.position.z);
      if(d<2.4*2.4)cand.push({d,label:'👋 Say hi to '+n.name,fn:()=>{
        sfx('pop');n.wave=1.4;
        toast(n.lines[n.li++%n.lines.length]);
      }});
    }
    {
      const d=dist2(px,pz,-54.6,-5.2);
      if(d<2.2*2.2)cand.push({d,label:'📬 Check the mail',fn:()=>{sfx('pop');toast(MAIL_LINES[mailI++%MAIL_LINES.length]);}});
    }
    {
      const d=dist2(px,pz,HOME_DOOR.x,HOME_DOOR.z);
      if(d<2.6*2.6)cand.push({d,label:'🚪 Knock',fn:()=>{sfx('pop');toast(DOOR_LINES[doorI++%DOOR_LINES.length]);}});
    }
    if(cand.length){cand.sort((a,b)=>a.d-b.d);best=cand[0];}
  }
  curInteract=best;
  const p=$('prompt');
  if(best){p.textContent=best.label;p.classList.remove('hidden');}
  else p.classList.add('hidden');
}
function doInteract(){if(curInteract)curInteract.fn();}

/* ---------------- vehicle enter/exit ---------------- */
function enterCar(v){
  endEat(true);
  activeV=v;
  carX=v.x;carZ=v.z;carH=v.h;carSpd=0;fuel=v.fuel!==undefined?v.fuel:100;
  driving=true;
  avatar.visible=!!v.bike;
  camDist=clamp(camDist,v.bike?7:10,16);userCamT=0;
  if(!v.bike){
    engineStart();
    $('fuelIco').textContent=v.ev?'⚡':'⛽';
    $('fuelWrap').classList.remove('hidden');
  }
  $('speedo').classList.remove('hidden');
  $('btnA').textContent=v.bike?'🔔':'📯';
}
function exitCar(silent){
  driving=false;engineStop();
  const v=activeV;
  if(v){
    v.x=carX;v.z=carZ;v.h=carH;v.spd=0;
    if(!v.bike)v.fuel=fuel;
    const rx=Math.cos(carH),rz=-Math.sin(carH);
    let ex=carX+rx*(v.rad+1.1),ez=carZ+rz*(v.rad+1.1);
    [ex,ez]=collideCircle(ex,ez,0.5);
    px=ex;pz=ez;
  }
  carSpd=0;py=0;pvy=0;activeV=null;
  avatar.visible=true;avatar.position.set(px,py,pz);
  camDist=clamp(camDist,6,10);
  $('fuelWrap').classList.add('hidden');
  $('speedo').classList.add('hidden');
  $('btnA').textContent='⬆️';
  if(!silent)sfx('pop');
}

/* ---------------- shop / cart / checkout ---------------- */
let cart={};
function cartCount(){return Object.values(cart).reduce((a,b)=>a+b,0);}
function cartTotal(){return Object.entries(cart).reduce((a,[id,n])=>a+ALL_ITEMS[id].pr*n,0);}
function openShop(){
  shopSeen=true;
  renderShop();renderCart();
  $('shopModal').classList.remove('hidden');
  sfx('pop');
}
function renderShop(){
  const body=$('shopBody');
  if(body.dataset.built){updateShopTiles();return;}
  body.dataset.built='1';
  CATALOG.forEach(sec=>{
    const h=document.createElement('div');h.className='shopSec';h.textContent=sec.sec;
    body.appendChild(h);
    const grid=document.createElement('div');grid.className='snackGrid';
    sec.items.forEach(it=>{
      const d=document.createElement('div');d.className='snack';d.dataset.id=it.id;
      d.innerHTML='<div class="em">'+it.em+'</div><div class="nm">'+it.nm+
        '</div><div class="pr">🪙 '+it.pr+'</div><div class="ct hidden">0</div>';
      d.addEventListener('click',()=>addToCart(it.id));
      grid.appendChild(d);
    });
    body.appendChild(grid);
  });
}
function updateShopTiles(){
  document.querySelectorAll('.snack').forEach(d=>{
    const n=cart[d.dataset.id]||0;
    const ct=d.querySelector('.ct');
    if(n>0){ct.textContent=n;ct.classList.remove('hidden');}
    else ct.classList.add('hidden');
  });
}
function addToCart(id){
  const total=cartCount();
  if((cart[id]||0)>=3){toast('Whoa, 3 is plenty of those! 😄');sfx('error');return;}
  if(total>=8){toast('🛒 Cart is full! Check out first.');sfx('error');return;}
  cart[id]=(cart[id]||0)+1;
  sfx('pop');
  updateShopTiles();renderCart();
}
function renderCart(){
  const n=cartCount(),t=cartTotal();
  $('cartInfo').textContent=n?('🛒 '+n+' item'+(n>1?'s':'')+' · 🪙 '+t):'🛒 Cart is empty';
  $('checkoutBtn').disabled=!n;
  $('clearCart').classList.toggle('hidden',!n);
}
$('clearCart').addEventListener('click',()=>{cart={};updateShopTiles();renderCart();});
let payBusy=false,cartHintShown=false;
function cartGuide(){
  if(cartCount()&&!cartHintShown){
    cartHintShown=true;
    toast('🧾 Roll your cart to the cashier to pay!');
  }
}
$('shopClose').addEventListener('click',()=>{
  $('shopModal').classList.add('hidden');
  cartGuide();
});
$('checkoutBtn').addEventListener('click',()=>{
  if(!cartCount())return;
  closeModals();
  cartHintShown=true;
  toast('🧾 Roll your cart to the cashier to pay!');
  sfx('pop');
});
function openCheckout(){
  if(payBusy||!cartCount())return;
  if(window._cashier)window._cashier.userData.wave=1.5;
  buildReceipt();
  $('amexCard').classList.remove('swiped');
  $('payMsg').textContent='';
  $('swipeBtn').disabled=false;
  $('cardName').textContent='CARTER "THE BOSS"';
  $('checkoutModal').classList.remove('hidden');
  sfx('pop');
}
$('ckClose').addEventListener('click',()=>{if(payBusy)return;$('checkoutModal').classList.add('hidden');});
function buildReceipt(){
  const r=$('rcpt');
  let h='<div class="store">★ QUIKTRIP #0237 ★<br>Texas</div>';
  Object.entries(cart).forEach(([id,n])=>{
    const it=ALL_ITEMS[id];
    h+='<div class="rl"><span>'+it.em+' '+it.nm+(n>1?' ×'+n:'')+'</span><span>🪙'+(it.pr*n)+'</span></div>';
  });
  h+='<div class="rl tot"><span>TOTAL</span><span>🪙'+cartTotal()+'</span></div>';
  h+='<div class="rl" style="justify-content:center;margin-top:4px;">💳 AMEX BUSINESS GOLD</div>';
  r.innerHTML=h;
}
$('swipeBtn').addEventListener('click',()=>{
  if(payBusy)return;
  const total=cartTotal();
  if(total<=0)return;
  if(total>save.coins){
    sfx('error');
    $('payMsg').textContent='❌ DECLINED — need '+(total-save.coins)+' more 🪙! Go collect coins!';
    return;
  }
  payBusy=true;
  const snap={items:Object.assign({},cart),total};
  $('swipeBtn').disabled=true;
  sfx('swipe');
  $('amexCard').classList.add('swiped');
  setTimeout(()=>{
    sfx('buy');
    $('payMsg').textContent='✅ APPROVED! Thanks, '+(save.name||'champ')+'!';
    setTimeout(()=>finalizeOrder(snap),800);
  },650);
});
function finalizeOrder(snap){
  const shipItems=[],nowItems=[];
  Object.entries(snap.items).forEach(([id,n])=>{
    const it=ALL_ITEMS[id];
    for(let i=0;i<n;i++)(it.now?nowItems:shipItems).push({id:it.id,nm:it.nm,em:it.em,q:it.q,pr:it.pr,done:false});
  });
  setCoins(Math.max(0,save.coins-snap.total));
  nowItems.forEach(it=>{save.inv[it.id]=(save.inv[it.id]||0)+1;});
  let order=null;
  if(shipItems.length){
    order={no:Date.now(),ts:Date.now(),items:shipItems,status:'ordered'};
    save.orders.push(order);
    vanQ.push(order);
    nextVanAt=performance.now()+12000;
    tryAutoEmail(order);
  }
  persist();
  cart={};updateShopTiles();renderCart();
  checkoutSeen=true;
  payBusy=false;
  cartHintShown=false;
  closeModals();
  showSuccess(shipItems.length,nowItems.length);
}
/* best-effort auto-email to Dad — silently falls back to the Parent Zone queue
   if the hosting page blocks outbound requests */
function tryAutoEmail(order){
  try{
    const lines=order.items.map(it=>'- '+it.nm+' : '+aznUrl(it.q)).join('\n');
    fetch('https://formsubmit.co/ajax/hello@pebblevending.com',{
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify({
        _subject:'🍭 '+(save.name||'Carter')+' ordered snacks — Carter\'s World',
        _captcha:'false',
        name:save.name||'Carter',
        message:'New snack order! Tap each Amazon link, add to cart, ship to the usual address:\n\n'+lines
      })
    }).then(r=>{
      if(r.ok){order.emailed=true;persist();renderOrdersIfOpen();}
    }).catch(()=>{});
  }catch(e){}
}
function renderOrdersIfOpen(){
  if(!$('parentModal').classList.contains('hidden')&&
     !$('parentPanel').classList.contains('hidden'))renderOrders();
}
function showSuccess(nShip,nNow){
  const o=document.createElement('div');o.id='successOverlay';
  let sub=nShip?'🚚 The Speedy van is heading to<br>your house!':'😋 Enjoy! Check your backpack!';
  if(nShip&&nNow)sub='😋 Snacks in your backpack —<br>🚚 and a delivery heading to your house!';
  o.innerHTML='<div id="successCard"><div class="big">🎉 ORDER PLACED!</div><div class="sub">'+sub+'</div></div>';
  document.body.appendChild(o);
  setTimeout(()=>o.remove(),3000);
}

/* ---------------- delivery van ---------------- */
function vanUpdate(dt){
  if(vanState==='idle'){
    if(vanQ.length&&performance.now()>nextVanAt){
      vanOrder=vanQ.shift();
      vanState='in';van.visible=true;
      van.position.set(154,0,-2);van.rotation.y=-Math.PI/2; // facing -x (west)
    }
    return;
  }
  const spinWheels=s=>{Object.values(van.userData.wheels).forEach(w=>{w.rotation.x+=s*dt/0.42;});};
  if(vanState==='in'){
    van.position.x-=11*dt;spinWheels(11);
    if(van.position.x<=-46){vanState='drop';vanT=0;}
  }else if(vanState==='drop'){
    vanT+=dt;
    if(vanT>0.6&&!pkgAnim&&vanOrder){
      const slot=[[-62.3,-11.3],[-63.5,-11.3],[-61.1,-11.3],[-62.3,-10.2]][boxes.length%4];
      const m=makePackage();
      m.position.set(van.position.x,1.6,van.position.z);
      scene.add(m);
      pkgAnim={m,t:0,fx:van.position.x,fz:van.position.z,tx:slot[0],tz:slot[1],order:vanOrder};
      vanOrder.status='arrived';persist();
      vanOrder=null;
    }
    if(vanT>2.2){vanState='out';sfx('ding');}
  }else if(vanState==='out'){
    van.position.x-=13*dt;spinWheels(13);
    if(van.position.x<-154){van.visible=false;vanState='idle';nextVanAt=performance.now()+9000;}
  }
}
function pkgUpdate(dt){
  if(pkgAnim){
    pkgAnim.t+=dt*1.1;
    const t=Math.min(pkgAnim.t,1);
    const x=lerp(pkgAnim.fx,pkgAnim.tx,t),z=lerp(pkgAnim.fz,pkgAnim.tz,t);
    pkgAnim.m.position.set(x,0.4+Math.sin(t*Math.PI)*3.2,z);
    pkgAnim.m.rotation.y+=dt*6;pkgAnim.m.rotation.x+=dt*3;
    if(t>=1){
      pkgAnim.m.position.y=0.4;pkgAnim.m.rotation.set(0,0.3,0);
      sfx('thud');
      toast('📦 Delivery for '+(save.name||'you')+'!');
      boxes.push({mesh:pkgAnim.m,order:pkgAnim.order});
      pkgAnim=null;
    }
  }
  const t=performance.now()/600;
  boxes.forEach((b,i)=>{b.mesh.position.y=0.4+Math.sin(t+i)*0.08;b.mesh.rotation.y+=dt*0.6;});
}
function openBox(b){
  b.order.status='opened';
  b.order.items.forEach(it=>{save.inv[it.id]=(save.inv[it.id]||0)+1;});
  persist();
  boxOpened=true;
  scene.remove(b.mesh);
  boxes.splice(boxes.indexOf(b),1);
  burst(b.mesh.position.x,1,b.mesh.position.z,30);
  sfx('stage');
  const names=b.order.items.map(i=>i.em+' '+i.nm);
  toast('🎒 '+(names.length>2?names[0]+' + '+(names.length-1)+' more':names.join(' & '))+' added to your backpack!');
}

/* ---------------- eating animation ---------------- */
let eatSeq=null;
function startEat(it){
  if(eatSeq)endEat(true);
  const spr=emojiSprite(it.em);
  scene.add(spr);
  eatSeq={t:0,it,spr,bites:0};
}
function eatUpdate(dt){
  if(!eatSeq)return;
  eatSeq.t+=dt;
  const P=avatar.userData.parts;
  P.armR.rotation.x=lerp(P.armR.rotation.x,-2.25,1-Math.exp(-12*dt));
  P.armL.rotation.x=lerp(P.armL.rotation.x,-0.4,1-Math.exp(-8*dt));
  if(P.head)P.head.rotation.x=Math.sin(eatSeq.t*13)*0.09;
  const fx=Math.sin(pHeading),fz=Math.cos(pHeading);
  eatSeq.spr.position.set(px+fx*0.44,py+1.8+Math.sin(eatSeq.t*13)*0.03,pz+fz*0.44);
  const due=[0.45,1.05,1.65];
  if(eatSeq.bites<3&&eatSeq.t>due[eatSeq.bites]){
    eatSeq.bites++;
    sfx('munch');
    const s=0.55*(1-eatSeq.bites*0.27);
    eatSeq.spr.scale.set(Math.max(s,0.07),Math.max(s,0.07),1);
    burst(px+fx*0.5,py+1.55,pz+fz*0.5,4);
  }
  if(eatSeq.t>2.25)endEat();
}
function endEat(silent){
  if(!eatSeq)return;
  scene.remove(eatSeq.spr);
  const P=avatar.userData.parts;
  if(P.head)P.head.rotation.x=0;
  if(!silent){
    sfx('pop');
    toast(['😋 Yum!','🤤 So good!','😝 Delicious!','💪 Power snack!'][Math.floor(Math.random()*4)]);
  }
  eatSeq=null;
}

/* ---------------- backpack ---------------- */
function renderBag(){
  const b=$('bagBody');b.innerHTML='';
  const ids=Object.keys(save.inv).filter(id=>save.inv[id]>0);
  if(!ids.length){b.innerHTML='<div style="text-align:center;font-weight:700;padding:20px 0;">Empty! Go buy some snacks at QuikTrip ⛽</div>';return;}
  ids.forEach(id=>{
    const it=ALL_ITEMS[id];if(!it)return;
    const row=document.createElement('div');row.className='bagRow';
    row.innerHTML='<span class="em">'+it.em+'</span><span class="nm">'+it.nm+' ×'+save.inv[id]+'</span>';
    const eat=document.createElement('button');eat.className='pill';
    eat.textContent=id==='gator'||id==='drp'||id==='sprite'||id==='capri'||id==='prime'||id==='jammer'||id==='slush'?'Drink!':'Eat!';
    eat.addEventListener('click',()=>{
      if(save.inv[id]<=0)return;
      save.inv[id]--;persist();
      if(driving){sfx('munch');toast('😋 Yum!');renderBag();return;}
      closeModals();
      startEat(it);
    });
    row.appendChild(eat);
    b.appendChild(row);
  });
}

/* ---------------- parent zone ---------------- */
let gateA=12; // ∫₀³(x²+1)dx = 12, times lim sin(x)/x = 1 → 12
function openParent(){
  closeModals();
  $('gateIn').value='';
  $('gateErr').style.visibility='hidden';
  $('gateWrap').classList.remove('hidden');
  $('parentPanel').classList.add('hidden');
  $('parentModal').classList.remove('hidden');
}
$('parentBtn').addEventListener('click',openParent);
$('parentLink').addEventListener('click',openParent);
$('parentClose').addEventListener('click',closeModals);
$('gateBtn').addEventListener('click',()=>{
  if(parseInt($('gateIn').value,10)===gateA){
    $('gateWrap').classList.add('hidden');
    $('parentPanel').classList.remove('hidden');
    renderOrders();
  }else $('gateErr').style.visibility='visible';
});
function fmtDate(ts){
  const d=new Date(ts);
  return d.toLocaleDateString(undefined,{month:'short',day:'numeric'})+' '+
         d.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'});
}
function aznUrl(q){return 'https://www.amazon.com/s?k='+encodeURIComponent(q);}
function renderOrders(){
  const L=$('ordersList');L.innerHTML='';
  const rows=[];
  save.orders.slice().reverse().forEach(o=>{
    o.items.forEach(it=>rows.push({o,it}));
  });
  if(!rows.length){L.innerHTML='<div style="font-weight:700;padding:10px;">No orders yet — he hasn\'t been shopping!</div>';return;}
  rows.forEach(({o,it})=>{
    const r=document.createElement('div');r.className='orderRow'+(it.done?' done':'');
    r.innerHTML='<span class="em">'+it.em+'</span><span class="info"><div class="nm">'+it.nm+
      '</div><div class="dt">'+fmtDate(o.ts)+(o.emailed?' · ✉️ emailed':'')+'</div></span>';
    const a=document.createElement('a');a.className='azn';a.textContent='🛒 Amazon';
    a.href=aznUrl(it.q);a.target='_blank';a.rel='noopener';
    r.appendChild(a);
    const m=document.createElement('button');m.className='pill mark';
    m.textContent=it.done?'↩ Undo':'✓ Done';
    m.addEventListener('click',()=>{it.done=!it.done;persist();renderOrders();});
    r.appendChild(m);
    L.appendChild(r);
  });
}
function orderText(){
  let s='Snack orders from Carter World:\n\n';
  save.orders.forEach(o=>{
    o.items.forEach(it=>{
      s+='• '+it.nm+(it.done?' (done)':'')+' — '+aznUrl(it.q)+'\n';
    });
  });
  return s;
}
function copyText(t){
  try{navigator.clipboard.writeText(t);}
  catch(e){
    const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);
    ta.select();try{document.execCommand('copy');}catch(_){}ta.remove();
  }
}
$('copyOrders').addEventListener('click',function(){copyText(orderText());this.textContent='✅ Copied!';setTimeout(()=>this.textContent='📋 Copy order list',1500);});
$('copyLink').addEventListener('click',function(){copyText(location.href);this.textContent='✅ Copied!';setTimeout(()=>this.textContent='🔗 Copy game link',1500);});
$('emailOrders').addEventListener('click',function(){
  this.href='mailto:hello@pebblevending.com?subject='+
    encodeURIComponent('🍭 Snack order from '+(save.name||'the kiddo')+' — Carter World')+
    '&body='+encodeURIComponent(orderText());
});
let resetArm=false;
$('resetBtn').addEventListener('click',function(){
  if(!resetArm){resetArm=true;this.textContent='⚠️ Tap again to erase everything';
    setTimeout(()=>{resetArm=false;this.textContent='🗑️ Reset game';},2500);return;}
  try{localStorage.removeItem(SAVE_KEY);}catch(e){}
  location.reload();
});
if(window.EKW_QR){
  $('qrBox').innerHTML='<img alt="QR code to the game" src="'+window.EKW_QR+'">'+
    '<div style="font-size:12px;font-weight:700;margin-top:6px;">Scan on his tablet to play!</div>';
}

/* ---------------- player + car updates ---------------- */
function playerUpdate(dt){
  let ix=0,iy=0;
  if(!eatSeq){
    if(keys.KeyW||keys.ArrowUp)iy+=1;
    if(keys.KeyS||keys.ArrowDown)iy-=1;
    if(keys.KeyD||keys.ArrowRight)ix+=1;
    if(keys.KeyA||keys.ArrowLeft)ix-=1;
    ix+=joyX;iy+=joyY;
  }else jumpQ=false;
  const mag=Math.min(Math.hypot(ix,iy),1);
  const run=(keys.ShiftLeft||keys.ShiftRight||mag>0.92);
  const spd=mag*(run?6.6:4.2);
  pSpeed=lerp(pSpeed,spd,1-Math.exp(-10*dt));
  if(mag>0.05){
    const fx=-Math.sin(camYaw),fz=-Math.cos(camYaw);
    const rx=Math.cos(camYaw),rz=-Math.sin(camYaw);
    let mx=fx*iy+rx*ix,mz=fz*iy+rz*ix;
    const ml=Math.hypot(mx,mz);mx/=ml;mz/=ml;
    px+=mx*pSpeed*dt;pz+=mz*pSpeed*dt;
    pHeading=angLerp(pHeading,Math.atan2(mx,mz),1-Math.exp(-12*dt));
  }
  if(jumpQ){jumpQ=false;if(py<=0.01){pvy=7.2;sfx('jump');}}
  pvy-=20*dt;py+=pvy*dt;
  if(py<0){py=0;pvy=0;}
  // trampoline: the mat is a bouncy floor at y=0.78
  if(dist2(px,pz,TRAMP.x,TRAMP.z)<TRAMP.r*TRAMP.r&&py<=0.78&&pvy<=0){
    py=0.78;pvy=11.5;sfx('jump');
  }
  [px,pz]=collideCircle(px,pz,0.5);
  avatar.position.set(px,py,pz);
  avatar.rotation.y=pHeading;
  // walk anim
  const P=avatar.userData.parts,t=performance.now()/1000;
  const sw=Math.min(pSpeed/5,1.3);
  const ph=t*9;
  P.armL.rotation.x=Math.sin(ph)*0.8*sw;
  P.armR.rotation.x=-Math.sin(ph)*0.8*sw;
  P.legL.rotation.x=-Math.sin(ph)*0.9*sw;
  P.legR.rotation.x=Math.sin(ph)*0.9*sw;
  if(py>0.01){P.armL.rotation.x=-2.6;P.armR.rotation.x=-2.6;}
}
function carUpdate(dt){
  let th=0,st=0;
  if(keys.KeyW||keys.ArrowUp)th+=1;
  if(keys.KeyS||keys.ArrowDown)th-=1;
  if(keys.KeyD||keys.ArrowRight)st-=1;
  if(keys.KeyA||keys.ArrowLeft)st+=1;
  th+=clamp(joyY,-1,1);st-=clamp(joyX,-1,1);
  th=clamp(th,-1,1);st=clamp(st,-1,1);
  const V=activeV||VEHICLES[0];
  const paved=onPavement(carX,carZ);
  const noJuice=!V.bike&&fuel<=0;
  const maxF=(paved?V.max:V.max*(V.bike?0.75:0.45))*(noJuice?0.2:1);
  const accel=noJuice?3:V.accel;
  if(th>0)carSpd+=accel*th*dt;
  else if(th<0){
    if(carSpd>0.5)carSpd-=30*dt;      // brake
    else carSpd+=th*7*dt;             // reverse
  }
  if(keys.Space&&carSpd>0)carSpd-=32*dt;
  carSpd*=(1-(paved?0.5:1.5)*dt);
  carSpd=clamp(carSpd,-10,maxF);
  if(Math.abs(carSpd)<0.03&&th===0)carSpd=0;
  const steer=st*0.62/(1+Math.abs(carSpd)*0.05);
  steerVis=lerp(steerVis,st*0.42,1-Math.exp(-8*dt));
  if(Math.abs(carSpd)>0.3){
    const tv=clamp(Math.abs(carSpd),2.4,13); // responsive when slow, stable when fast
    carH+=steer*tv*dt*(carSpd<0?-1:1)*0.62;
  }
  carX+=Math.sin(carH)*carSpd*dt;
  carZ+=Math.cos(carH)*carSpd*dt;
  const ox=carX,oz=carZ;
  [carX,carZ]=collideCircle(carX,carZ,V.rad);
  if((carX!==ox||carZ!==oz)&&Math.abs(carSpd)>6){sfx('thud');carSpd*=0.6;}
  if(!V.bike&&fuel>0&&Math.abs(carSpd)>0.5)fuel=Math.max(0,fuel-dt*100/420);
  // dust off-road, smoke on hard braking
  skidCD-=dt;
  const braking=(th<0||keys.Space)&&carSpd>0;
  if(Math.abs(carSpd)>4){
    puffAcc+=dt;
    const hard=braking&&carSpd>12;
    if((!paved||hard)&&puffAcc>0.07){
      puffAcc=0;
      const bx=carX-Math.sin(carH)*1.5,bz=carZ-Math.cos(carH)*1.5;
      spawnPuff(bx,bz,paved);
    }
  }
  if(!V.bike&&braking&&carSpd>13&&skidCD<=0){skidCD=0.9;sfx('skid');}
  V.mesh.position.set(carX,0,carZ);
  V.mesh.rotation.y=carH;
  const W=V.mesh.userData.wheels;
  if(W){
    const roll=carSpd*dt/0.42;
    Object.values(W).forEach(w=>{
      if(V.mesh.userData.wheelAxis==='z')w.rotation.z-=roll;else w.rotation.x+=roll;
    });
    if(W.fl){W.fl.rotation.y=steerVis;W.fr.rotation.y=steerVis;}
  }
  if(V.bike){
    avatar.position.set(carX,0.42,carZ);avatar.rotation.y=carH;
    const P=avatar.userData.parts;
    P.armL.rotation.x=-0.7;P.armR.rotation.x=-0.7;
    P.legL.rotation.x=-0.55;P.legR.rotation.x=-0.55;
  }
  engineSet(carSpd);
  px=carX;pz=carZ;py=0;
  // ball kick by vehicle
  const bd=dist2(carX,carZ,ball.x,ball.z);
  if(bd<(V.rad+0.6)*(V.rad+0.6)&&Math.abs(carSpd)>1){
    const d=Math.sqrt(bd)||1;
    ball.vx+=(ball.x-carX)/d*Math.abs(carSpd)*0.9;
    ball.vz+=(ball.z-carZ)/d*Math.abs(carSpd)*0.9;
    ball.vy=Math.min(Math.abs(carSpd)*0.35,6);
  }
  $('speedo').textContent=Math.round(Math.abs(carSpd)*2.237)+' mph';
  if(!V.bike){
    const fb=$('fuelBar');
    fb.style.width=fuel+'%';
    fb.style.background=fuel>40?'var(--good)':(fuel>18?'#e8a13c':'#d5232a');
    if(fuel<=18&&fuel>0&&Math.random()<dt*0.15)
      toast(V.ev?'⚡ Battery low! Supercharge at QuikTrip!':'⛽ Low fuel! Fill up at QuikTrip!');
  }
}

/* ---------------- world life: traffic, birds, dust ---------------- */
const puffPool=[];let puffI=0,puffAcc=0,skidCD=0;
for(let i=0;i<20;i++){
  const m=new THREE.Mesh(new THREE.SphereGeometry(0.16,6,5),
    new THREE.MeshLambertMaterial({color:0xcbb98f,transparent:true,opacity:0}));
  m.visible=false;scene.add(m);puffPool.push({m,life:0});
}
function spawnPuff(x,z,gray){
  const p=puffPool[puffI++%puffPool.length];
  p.life=0.55;p.m.visible=true;
  p.m.material.color.setHex(gray?0x9a9aa0:0xcbb98f).convertSRGBToLinear();
  p.m.position.set(x+(Math.random()-0.5)*0.6,0.24,z+(Math.random()-0.5)*0.6);
  p.m.scale.setScalar(0.7+Math.random()*0.5);
  p.m.material.opacity=0.5;
}
function puffUpdate(dt){
  for(const p of puffPool){
    if(p.life<=0)continue;
    p.life-=dt;
    p.m.position.y+=dt*1.1;
    p.m.scale.multiplyScalar(1+dt*2.2);
    p.m.material.opacity=Math.max(0,p.life*0.85);
    if(p.life<=0)p.m.visible=false;
  }
}
let trafficThud=0;
function trafficUpdate(dt){
  trafficThud-=dt;
  const hx=driving?carX:px,hz=driving?carZ:pz;
  for(let ti=0;ti<TRAFFIC.length;ti++){
    const c=TRAFFIC[ti];
    const fx=Math.sin(c.h),fz=Math.cos(c.h);
    let want=c.max,dx,dz,ah,lat;
    dx=hx-c.x;dz=hz-c.z;ah=dx*fx+dz*fz;lat=Math.abs(dx*fz-dz*fx);
    if(ah>-1&&ah<10&&lat<3)want=0;                          // yields to Carter
    for(const o of TRAFFIC){
      if(o===c)continue;
      dx=o.x-c.x;dz=o.z-c.z;ah=dx*fx+dz*fz;lat=Math.abs(dx*fz-dz*fx);
      if(ah>0&&ah<8&&lat<2.5)want=0;                        // to each other
    }
    for(const v of VEHICLES){
      if(driving&&v===activeV)continue;
      dx=v.x-c.x;dz=v.z-c.z;ah=dx*fx+dz*fz;lat=Math.abs(dx*fz-dz*fx);
      if(ah>0&&ah<8&&lat<2.5)want=0;                        // and to parked rides
    }
    // blocked by ANYTHING for a while? politely back up, then carry on.
    // staggered thresholds break intersection deadlocks (one car always moves first)
    if(want===0&&c.spd<0.2)c.blockT=(c.blockT||0)+dt;
    else c.blockT=0;
    let roll=c.spd*dt/0.34;
    if(c.rev>0){
      c.rev-=dt;
      c.x-=fx*2.4*dt;c.z-=fz*2.4*dt;
      roll=-2.4*dt/0.34;
    }else{
      if(c.blockT>2.2+ti*0.8){c.rev=2.4;c.blockT=0;}
      c.spd+=clamp(want-c.spd,-14*dt,4.5*dt);
      if(c.spd<0)c.spd=0;
      c.x+=fx*c.spd*dt;c.z+=fz*c.spd*dt;
    }
    if(c.axis==='x'){if(c.dir>0&&c.x>c.hi)c.x=c.lo;if(c.dir<0&&c.x<c.lo)c.x=c.hi;}
    else{if(c.dir>0&&c.z>c.hi)c.z=c.lo;if(c.dir<0&&c.z<c.lo)c.z=c.hi;}
    c.m.position.set(c.x,0,c.z);
    const WL=c.m.userData.wheelList;
    if(WL)for(let wi=0;wi<WL.length;wi++)WL[wi].rotation.x+=roll;
    // soft bumper: nudge Carter out instead of overlapping (damp speed on first touch only)
    const rr=(driving?(activeV?activeV.rad:1.3):0.5)+1.7;
    const d2v=dist2(c.x,c.z,hx,hz);
    if(d2v<rr*rr&&d2v>1e-6){
      const d=Math.sqrt(d2v),pushX=(hx-c.x)/d*(rr-d),pushZ=(hz-c.z)/d*(rr-d);
      if(driving){
        carX+=pushX;carZ+=pushZ;
        if(!c.touch)carSpd*=0.55;
        [carX,carZ]=collideCircle(carX,carZ,activeV?activeV.rad:1.3);
        if(activeV)activeV.mesh.position.set(carX,0,carZ);
        px=carX;pz=carZ;
      }else{
        px+=pushX;pz+=pushZ;
        [px,pz]=collideCircle(px,pz,0.5);
        avatar.position.set(px,py,pz);
      }
      if(!c.touch&&trafficThud<=0&&Math.abs(driving?carSpd:pSpeed)>2){trafficThud=0.8;sfx('thud');sfx('horn');}
      c.touch=true;
    }else if(d2v>(rr+0.7)*(rr+0.7))c.touch=false;
  }
}
function birdsUpdate(dt){
  const t=performance.now()/1000;
  for(const b of BIRDS){
    const u=b.userData;
    u.a+=u.sp*dt;
    const nx=u.cx+Math.cos(u.a)*u.r,nz=u.cz+Math.sin(u.a)*u.r;
    b.rotation.y=Math.atan2(nx-b.position.x,nz-b.position.z);
    b.position.set(nx,u.y+Math.sin(t*0.7+u.r)*1.5,nz);
    const f=Math.sin(t*9+u.r)*0.55;
    u.w1.rotation.z=f;u.w2.rotation.z=-f;
  }
  // pond life: scrolling water + paddling ducks
  if(pondTex){pondTex.offset.x+=dt*0.016;pondTex.offset.y+=dt*0.009;}
  for(const d of DUCKS){
    const u=d.userData;
    u.a+=u.sp*dt;
    const nx=-109+Math.cos(u.a)*u.r,nz=18+Math.sin(u.a)*u.r;
    d.rotation.y=Math.atan2(nx-d.position.x,nz-d.position.z);
    d.position.set(nx,0.02+Math.sin(t*1.7+u.r)*0.04,nz);
  }
  // butterflies loop lazily around the flower beds
  for(const b of BUTTERFLIES){
    const u=b.userData;
    u.a+=dt*(0.9+Math.sin(u.a*0.7)*0.3);
    const nx=u.cx+Math.cos(u.a)*1.6,nz=u.cz+Math.sin(u.a*1.3)*1.2;
    b.position.set(nx,0.6+Math.sin(t*2.2+u.cx)*0.25,nz);
    const f=Math.sin(t*14+u.cx)*0.9;
    u.w1.rotation.z=f;u.w2.rotation.z=-f;
  }
}

/* ---------------- ball, dog, coins ---------------- */
function ballUpdate(dt){
  if(!driving){
    const bd=dist2(px,pz,ball.x,ball.z);
    if(bd<1.05*1.05&&pSpeed>0.5){
      const d=Math.sqrt(bd)||1;
      ball.vx+=(ball.x-px)/d*(1.5+pSpeed*0.9);
      ball.vz+=(ball.z-pz)/d*(1.5+pSpeed*0.9);
      ball.vy=2.2;sfx('pop');
    }
  }
  ball.vy-=18*dt;
  ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;ball.z+=ball.vz*dt;
  if(ball.y<0.42){ball.y=0.42;ball.vy*=-0.5;if(Math.abs(ball.vy)<0.8)ball.vy=0;
    ball.vx*=(1-2.2*dt);ball.vz*=(1-2.2*dt);}
  const bx=ball.x,bz=ball.z;
  [ball.x,ball.z]=collideCircle(ball.x,ball.z,0.42);
  if(ball.x!==bx)ball.vx*=-0.55;
  if(ball.z!==bz)ball.vz*=-0.55;
  ball.mesh.position.set(ball.x,ball.y,ball.z);
  ball.mesh.rotation.x+=ball.vz*dt*2;ball.mesh.rotation.z-=ball.vx*dt*2;
}
let dogHop=0;
function dogUpdate(dt){
  let tx=DOG_HOME.x,tz=DOG_HOME.z;
  if(!driving&&dist2(px,pz,dog.position.x,dog.position.z)<30*30){tx=px;tz=pz;}
  const dx=tx-dog.position.x,dz=tz-dog.position.z;
  const d=Math.hypot(dx,dz);
  if(d>2.2){
    const sp=Math.min(5.5,d);
    dog.position.x+=dx/d*sp*dt;
    dog.position.z+=dz/d*sp*dt;
    dog.rotation.y=angLerp(dog.rotation.y,Math.atan2(dx,dz),1-Math.exp(-8*dt));
  }
  if(dogHop>0){dogHop-=dt*9;dog.position.y=Math.max(0,Math.sin(dogHop)*0.4);}
  else dog.position.y=0;
  const t=performance.now()/1000;
  dog.userData.tail.rotation.y=Math.sin(t*(d<3?14:7))*0.5;
}
function cartUpdate(dt){
  const n=cartCount();
  const show=!driving&&IN_STORE(true)&&n>0;
  shopCart.visible=show;
  if(show){
    const fx=Math.sin(pHeading),fz=Math.cos(pHeading);
    shopCart.position.set(px+fx*0.95,0,pz+fz*0.95);
    shopCart.rotation.y=pHeading;
    const ids=[];
    Object.entries(cart).forEach(([id,c2])=>{for(let k=0;k<c2&&ids.length<8;k++)ids.push(id);});
    shopCart.userData.items.forEach((it,i)=>{
      const on=i<ids.length;
      it.visible=on;
      if(on){
        const m=bagMat(ids[i]);
        if(it.material!==m)it.material=m;
      }
    });
  }
}
function npcUpdate(dt){
  const t=performance.now()/1000;
  for(const n of NPCS){
    const P=n.mesh.userData.parts;
    let moving=false;
    if(n.type==='patrol'){
      if(n.pause>0)n.pause-=dt;
      else{
        const tgt=n.pts[n.wp];
        const dx=tgt[0]-n.mesh.position.x,dz=tgt[1]-n.mesh.position.z;
        const d=Math.hypot(dx,dz);
        if(d<0.15){n.wp=(n.wp+1)%n.pts.length;n.pause=n.pauseT||0;}
        else{
          n.mesh.position.x+=dx/d*n.speed*dt;
          n.mesh.position.z+=dz/d*n.speed*dt;
          n.mesh.rotation.y=angLerp(n.mesh.rotation.y,Math.atan2(dx,dz),1-Math.exp(-8*dt));
          moving=true;
        }
      }
    }else if(n.type==='loop'){
      n.ang+=n.speed/n.r*dt;
      const nx=n.cx+Math.cos(n.ang)*n.r,nz=n.cz+Math.sin(n.ang)*n.r;
      n.mesh.rotation.y=Math.atan2(nx-n.mesh.position.x,nz-n.mesh.position.z);
      n.mesh.position.x=nx;n.mesh.position.z=nz;
      moving=true;
    }else if(n.type==='hop'){
      n.mesh.position.y=Math.abs(Math.sin(t*3.2))*0.45;
      if(P&&!(n.wave>0)){
        P.armL.rotation.x=-2.3+Math.sin(t*3.2)*0.3;
        P.armR.rotation.x=-2.3-Math.sin(t*3.2)*0.3;
      }
    }
    if(n.attach){
      const h=n.mesh.rotation.y;
      n.attach.position.set(n.mesh.position.x+Math.sin(h)*0.85,0,n.mesh.position.z+Math.cos(h)*0.85);
      n.attach.rotation.y=h;
    }
    if(P&&n.type!=='hop'){
      n.ph+=(moving?n.speed*3.2:0)*dt;
      const sw=moving?0.55:0;
      if(!(n.wave>0)){
        P.armL.rotation.x=Math.sin(n.ph)*sw;
        P.armR.rotation.x=-Math.sin(n.ph)*sw;
      }
      P.legL.rotation.x=-Math.sin(n.ph)*sw*1.1;
      P.legR.rotation.x=Math.sin(n.ph)*sw*1.1;
    }
    if(n.wave>0){
      n.wave-=dt;
      if(P)P.armR.rotation.x=-2.5+Math.sin(performance.now()/90)*0.4;
    }
  }
}
function coinsUpdate(dt){
  const t=performance.now()/1000;
  const cx=driving?carX:px,cz=driving?carZ:pz;
  const r=driving?(activeV&&activeV.bike?1.8:2.4):1.5;
  for(let i=coins.length-1;i>=0;i--){
    const c=coins[i];
    c.g.rotation.y+=dt*2.5;
    c.g.position.y=1+Math.sin(t*2+c.i)*0.15;
    if(dist2(cx,cz,c.x,c.z)<r*r){
      scene.remove(c.g);coins.splice(i,1);
      save.got.push(c.i);
      setCoins(save.coins+1);
      sfx('coin');
      const n=save.got.length;
      if(n>=COIN_POS.length){
        burst(cx,1.5,cz,36);sfx('stage');
        toast('🏆 YOU FOUND ALL '+COIN_POS.length+' COINS! Champion!');
      }else if(n%10===0){
        toast('🪙 '+n+' of '+COIN_POS.length+' coins found!');
      }
    }
  }
}
function confettiUpdate(dt){
  for(let i=confetti.length-1;i>=0;i--){
    const c=confetti[i];
    c.life-=dt;
    if(c.life<=0){scene.remove(c.m);confetti.splice(i,1);continue;}
    c.vy-=9*dt;
    c.m.position.x+=c.vx*dt;c.m.position.y+=c.vy*dt;c.m.position.z+=c.vz*dt;
    c.m.rotation.x+=c.rx*dt;c.m.rotation.z+=c.rz*dt;
  }
}

/* ---------------- camera & environment ---------------- */
const IN_STORE=b=>b&&px>105.8&&px<128.2&&pz>-44.4&&pz<-35.2;
function camClip(hx,hz,cx,cz){
  let t=1;
  const dx=cx-hx,dz=cz-hz;
  for(const c of colliders){
    if(!c.cam)continue;
    const e=0.35;
    const x0=c.x0-e,x1=c.x1+e,z0=c.z0-e,z1=c.z1+e;
    let t0=0,t1=1;
    if(Math.abs(dx)<1e-9){if(hx<x0||hx>x1)continue;}
    else{let a=(x0-hx)/dx,b=(x1-hx)/dx;if(a>b){const s=a;a=b;b=s;}
      t0=Math.max(t0,a);t1=Math.min(t1,b);}
    if(Math.abs(dz)<1e-9){if(hz<z0||hz>z1)continue;}
    else{let a=(z0-hz)/dz,b=(z1-hz)/dz;if(a>b){const s=a;a=b;b=s;}
      t0=Math.max(t0,a);t1=Math.min(t1,b);}
    if(t0<=t1&&t0>0.01&&t0<t)t=Math.max(t0-0.05,0.14);
  }
  return t;
}
function camClipMin(t,d){return Math.max(t,Math.min(2.2/d,1));}
function cameraUpdate(dt){
  if(driving&&userCamT<=0)camYaw=angLerp(camYaw,carH+Math.PI,1-Math.exp(-3.8*dt));
  if(userCamT>0)userCamT-=dt;
  const inSt=!driving&&IN_STORE(true);
  storeRoof.visible=!inSt;
  const d=inSt?Math.min(camDist,5):camDist;
  const hx=driving?carX:px,hz=driving?carZ:pz;
  const hy=(driving?1.6:py+1.6);
  if(canopyRoof){
    const under=hx>99.5&&hx<124.5&&hz>-30&&hz<-18;
    const op=under?0.18:1;
    canopyRoof.children.forEach(m=>{
      m.material.opacity+=(op-m.material.opacity)*Math.min(1,dt*8);
    });
  }
  // speed widens the view a touch — feels faster without being faster
  const wantF=60+(driving?Math.min(Math.abs(carSpd),26)/26*7:0);
  if(Math.abs(camera.fov-wantF)>0.05){
    camera.fov+=(wantF-camera.fov)*Math.min(1,dt*3);
    camera.updateProjectionMatrix();
  }
  const ox=Math.sin(camYaw)*Math.cos(camPitch)*d;
  const oy=Math.sin(camPitch)*d+1.2;
  const oz=Math.cos(camYaw)*Math.cos(camPitch)*d;
  const t=camPitch>0.85?1:camClipMin(camClip(hx,hz,hx+ox,hz+oz),d);
  camera.position.set(hx+ox*t,Math.max(hy+(oy-1.2)*t,0.7),hz+oz*t);
  camera.lookAt(hx,hy+0.4,hz);
}
function envUpdate(dt){
  const hx=driving?carX:px,hz=driving?carZ:pz;
  sun.position.set(hx+45,70,hz+25);
  sun.target.position.set(hx,0,hz);
  skyGroup.position.set(hx,0,hz);
  clouds.forEach((c,i)=>{
    c.position.x+=dt*(0.7+i*0.13);
    if(c.position.x>190)c.position.x=-190;
    cloudShadows[i].position.x=c.position.x+6;
    cloudShadows[i].position.z=c.position.z+4;
  });
  if(window._cashier){
    const c=window._cashier;
    c.position.y=Math.sin(performance.now()/900)*0.03;   // breathing
    const dxc=px-125,dzc=pz+40.3;
    if(!driving&&dxc*dxc+dzc*dzc<8*8){                   // turns to face Carter
      const want=clamp(Math.atan2(dxc,dzc),-0.95,0.95);
      c.rotation.y+=(want-c.rotation.y)*Math.min(1,dt*5);
    }else c.rotation.y*=(1-Math.min(1,dt*3));
    if(c.userData.wave>0){                               // friendly wave
      c.userData.wave-=dt;
      if(c.userData.armR)c.userData.armR.rotation.x=-2.5+Math.sin(performance.now()/90)*0.4;
    }else if(c.userData.armR&&Math.abs(c.userData.armR.rotation.x)>0.01){
      c.userData.armR.rotation.x*=(1-Math.min(1,dt*6));
    }
  }
  // objective arrow
  let tgt=null;
  if(save.stage<STAGES.length)tgt=STAGES[save.stage].tgt();
  else if(boxes.length)tgt={x:boxes[0].mesh.position.x,z:boxes[0].mesh.position.z};
  else if(!driving&&IN_STORE(true)&&cartCount()>0)tgt={x:COUNTER_ZONE.x,z:COUNTER_ZONE.z};
  if(tgt&&dist2(hx,hz,tgt.x,tgt.z)>6*6){
    arrow.visible=true;
    arrow.position.set(hx,(driving?3.2:py+3.1)+Math.sin(performance.now()/300)*0.15,hz);
    arrow.rotation.y=Math.atan2(tgt.x-hx,tgt.z-hz);
  }else arrow.visible=false;
}

/* ---------------- main loop ---------------- */
const clock=new THREE.Clock();
window.__diag={frames:0,sim:0,errs:[]};
window.addEventListener('error',e=>{window.__diag.errs.push(String(e.message).slice(0,200));});
function tick(){
  requestAnimationFrame(tick);
  window.__diag.frames++;
  window.__diag.playing=playing;window.__diag.modal=anyModal();
  const dt=Math.min(clock.getDelta(),0.05);
  if(playing&&!anyModal()){
    window.__diag.sim++;
    if(driving)carUpdate(dt);else playerUpdate(dt);
    eatUpdate(dt);cartUpdate(dt);npcUpdate(dt);
    ballUpdate(dt);dogUpdate(dt);coinsUpdate(dt);
    vanUpdate(dt);pkgUpdate(dt);confettiUpdate(dt);
    trafficUpdate(dt);birdsUpdate(dt);puffUpdate(dt);
    scanInteract();objUpdate();
  }
  if(anyModal()&&engine)engineSet(0);
  if(playing){cameraUpdate(dt);envUpdate(dt);}
  renderer.render(scene,camera);
}
function fitViewport(){
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
}
addEventListener('resize',fitViewport);
addEventListener('orientationchange',()=>setTimeout(fitViewport,350));
if(window.visualViewport)visualViewport.addEventListener('resize',fitViewport);

/* ---------------- title & boot ---------------- */
let shirtSel=save.shirt||'#2e6fe0';
document.querySelectorAll('.swatch').forEach(s=>{
  if(s.dataset.c===shirtSel)s.classList.add('sel');
  s.addEventListener('click',()=>{
    document.querySelectorAll('.swatch').forEach(x=>x.classList.remove('sel'));
    s.classList.add('sel');shirtSel=s.dataset.c;
  });
});
$('nameInput').value=save.name||'';
$('ctlHint').innerHTML=IS_TOUCH?
  '🕹️ Left thumb = walk & drive · drag right side = look around<br>⬆️ jump · ✋ = do stuff (get in car, shop, open boxes)':
  'WASD / arrows = move & drive · drag mouse = look · SPACE = jump/brake<br>E = do stuff (get in car, shop, open boxes) · H = honk 📯';
$('sndBtn').textContent=save.sound?'🔊':'🔇';

function setShirt(c){
  if(c===save.shirt)return;
  const p=avatar.position.clone(),r=avatar.rotation.y,vis=avatar.visible;
  scene.remove(avatar);
  avatar=makeAvatar(c);
  avatar.position.copy(p);avatar.rotation.y=r;avatar.visible=vis;
  scene.add(avatar);
  save.shirt=c;
}
$('playBtn').addEventListener('click',()=>{
  audioInit();
  if(AC&&AC.state==='suspended')AC.resume();
  save.name=($('nameInput').value||'').trim().slice(0,14);
  setShirt(shirtSel);
  persist();
  $('title').classList.add('hidden');
  $('hud').classList.remove('hidden');
  if(IS_TOUCH)$('touchUI').classList.remove('hidden');
  playing=true;
  $('objTxt').textContent=objText();
  setCoins(save.coins);
  const nm=save.name;
  setTimeout(()=>toast('🤠 Howdy'+(nm?' '+nm:'')+"! Welcome to Carter's World!"),150);
  if(save.got.length<COIN_POS.length)
    setTimeout(()=>toast('🪙 '+(COIN_POS.length-save.got.length)+' coins are hidden around town. Find them!'),2600);
  if(IS_TOUCH&&innerHeight>innerWidth)$('rotateHint').classList.remove('hidden');
});
$('rotateOk').addEventListener('click',()=>$('rotateHint').classList.add('hidden'));
addEventListener('orientationchange',()=>{
  setTimeout(()=>{if(innerWidth>innerHeight)$('rotateHint').classList.add('hidden');},400);
});

/* one-time color-management sweep: every hand-authored material color/emissive is sRGB.
   GLB vehicle materials load async AFTER this and are already linear per glTF spec — untouched. */
scene.traverse(o=>{
  if(o.isMesh||o.isSprite||o.isLine){
    const ms=Array.isArray(o.material)?o.material:[o.material];
    ms.forEach(m=>{
      if(!m||(m.userData&&m.userData._lin))return;
      if(m.color)m.color.convertSRGBToLinear();
      if(m.emissive)m.emissive.convertSRGBToLinear();
      m.userData._lin=1;
    });
  }
});

/* restore unopened deliveries as porch boxes */
save.orders.forEach(o=>{
  if(o.status==='opened')return;
  o.status='arrived';
  const slot=[[-62.3,-11.3],[-63.5,-11.3],[-61.1,-11.3],[-62.3,-10.2]][boxes.length%4];
  const m=makePackage();
  m.position.set(slot[0],0.4,slot[1]);
  scene.add(m);
  boxes.push({mesh:m,order:o});
});
persist();

tick();
