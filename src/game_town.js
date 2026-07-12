'use strict';
/* ================= Carter's World — TOWN EXPANSION (Oak Lane + Maple Drive) =================
   Loads AFTER game_core.js and BEFORE game_logic.js (materials get color-managed by the
   boot sweep; NPCS/TRAFFIC arrays are live). Adds 50 homes on two new streets, 17 new
   characters, props, collectibles (feathers + chalk stars via window.QUEST_EV bridge),
   and per-frame animations via window.TOWN_ANIMS (run inside birdsUpdate).
   HARD RULES: no new coins, no coin sources, no kid-visible PII, fictional street names. */

/* ---------------- new street surfaces (baked like Carter St) ---------------- */
function bakeCrossStreet(stopEastX,stopWestX){
  return texCanvas(2048,96,c=>{
    const W=2048,H=96,ux=W/300,vy=H/8;      // u=(x+150)*ux, y=(zLocal+4)*vy
    bakeAsphaltBase(c,W,H);
    [-2.8,-1.2,1.2,2.8].forEach(z=>bakeWear(c,0,(z+4)*vy,W,0,3.2));
    c.fillStyle='#E8C24A';
    for(let x=-148;x<148;x+=6){
      if(x>72&&x<88)continue;
      c.fillRect((x+150)*ux,(0-0.14+4)*vy,2.2*ux,0.28*vy);
    }
    c.fillStyle='#e8e8e2';
    [[-150,74],[86,150]].forEach(s=>{
      [3.7,-3.7].forEach(z=>c.fillRect((s[0]+150)*ux,(z-0.09+4)*vy,(s[1]-s[0])*ux,0.18*vy));
    });
    for(let i=0;i<7;i++){
      const z=-3.6+i*1.2;
      c.fillRect((71.6-1.0+150)*ux,(z-0.27+4)*vy,2.0*ux,0.55*vy);
      c.fillRect((88.4-1.0+150)*ux,(z-0.27+4)*vy,2.0*ux,0.55*vy);
    }
    c.fillRect((stopEastX-0.25+150)*ux,(0.2+4)*vy,0.5*ux,3.4*vy);
    c.fillRect((stopWestX-0.25+150)*ux,(-3.6+4)*vy,0.5*ux,3.4*vy);
    bakeManhole(c,(-70+150)*ux,(-1.2+4)*vy,0.55*ux,0.55*vy);
    bakeManhole(c,(46+150)*ux,(1.3+4)*vy,0.55*ux,0.55*vy);
    c.fillStyle='rgba(20,20,26,0.35)';
    for(let i=0;i<8;i++){
      c.beginPath();c.ellipse(Math.random()*W,Math.random()*H,10+Math.random()*24,4+Math.random()*7,0,0,7);c.fill();
    }
  });
}
const OAK_Z=-64,MAPLE_Z=64;
{
  const crossTex=bakeCrossStreet(70.2,89.8);
  const crossMat=new THREE.MeshLambertMaterial({map:crossTex});
  flat(300,8,crossMat,0,OAK_Z,0.019);
  flat(300,8,crossMat,0,MAPLE_Z,0.019);
  [OAK_Z,MAPLE_Z].forEach(zc=>{
    flat(300,2,walkMat,0,zc-5.4,0.03);
    flat(300,2,walkMat,0,zc+5.4,0.03);
    [[-38,224],[118.5,63]].forEach(s=>{
      [-1,1].forEach(sd=>flat(s[1],0.5,gutterMat,s[0],zc+sd*4.15,0.034));
    });
  });
}

/* ---------------- 50 homes across four rows ---------------- */
const TOWN_BODY=[0x9cc7e8,0xf0dfae,0xd8b8d8,0xb8d8b0,0xf3c6a8,0xcfd8e8,0xe8e0c0,0xc8e0e8,
                 0xf4d8c0,0xc8d8a8,0xe0c8e8,0xd0e4f0];
const TOWN_ROOF=[0x51586b,0x7d4a35,0x5a5a6e,0x6e5a4a,0x54442f,0x3f4a5a,0x6b3a2a,0x4a3f5a];
function houseLite(hx,hz,facing,bodyC,roofC,num){
  const g=new THREE.Group();g.position.set(hx,0,hz);g.rotation.y=facing===1?0:Math.PI;
  scene.add(g);
  const w=9,d=8,h=3.4;
  const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),sideMat(bodyC));
  body.position.set(0,h/2,0);body.castShadow=true;body.receiveShadow=true;g.add(body);
  box(w+0.14,0.4,d+0.14,0x8f8a80,0,0.2,0,g);
  const gable=((parseInt(num,10)||0)>>2)%2===0;
  let roof;
  if(gable){
    roof=new THREE.Mesh(GABLE_GEO,[mat(bodyC),roofMat(roofC)]);
    roof.rotation.y=Math.PI/2;roof.scale.set(d*1.12,2.2,w*1.08);roof.position.y=h;
  }else{
    roof=new THREE.Mesh(ROOF_GEO,roofMat(roofC));
    roof.scale.set(w*0.78,2.2,d*0.78);roof.position.y=h+1.1;
  }
  roof.castShadow=true;g.add(roof);
  if((parseInt(num,10)||0)%3===1){
    box(0.75,1.8,0.75,0x9c5a48,w*0.26,h+1.3,-d*0.12,g);
  }
  box(1.7,2.6,0.1,0xf4f4ee,w*0.18,1.3,d/2+0.05,g);
  box(1.4,2.4,0.2,0x6b4a2a,w*0.18,1.2,d/2+0.08,g);
  box(0.09,0.09,0.09,0xd4af37,w*0.18+0.5,1.15,d/2+0.2,g);
  const win=(wx)=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(1.7,1.4,0.12),winMat);
    m.position.set(wx,2.0,d/2+0.07);g.add(m);
  };
  win(-w*0.26);win(w*0.34);
  const bshM2=mat(0x2f7a2c);
  [[-w*0.38,d/2+0.65],[w*0.4,d/2+0.65]].forEach((b,i)=>{
    const s=0.38+((i*5+(parseInt(num,10)||0))%3)*0.08;
    const bu=new THREE.Mesh(new THREE.SphereGeometry(s,6,5),bshM2);
    bu.position.set(b[0],s*0.72,b[1]);g.add(bu);
  });
  flat(1.4,3.2,new THREE.MeshLambertMaterial({color:0x9c9c9c}),
    hx+facing*w*0.18, hz+facing*(d/2+1.8), 0.028);
  const sg=signMesh(1.3,0.65,numberTex(num));
  sg.position.set(-w*0.06,2.75,d/2+0.1);g.add(sg);
  addCol(hx,hz,w+0.5,d+0.5,true);
  return {g,hx,hz,facing,num};
}
const TOWN_HOUSES=[];
{
  const rowA=[-132,-120,-108,-96,-84,-72,-60,-48,-36,-24,24,36,60];          // Oak north, faces -z
  const rowB=[-132,-120,-108,-96,-84,-72,-60,-48,-24,-12,12,36,60,120];      // Oak south, faces +z
  const rowC=[-132,-120,-108,-96,-84,-72,-60,-12,12,36,60];                  // Maple north, faces +z
  const rowD=[-132,-108,-84,-60,-36,-12,12,36,60,108,120,132];               // Maple south, faces -z
  rowA.forEach((x,i)=>TOWN_HOUSES.push(houseLite(x,OAK_Z+16,-1,TOWN_BODY[i%12],TOWN_ROOF[i%8],String(301+i*4))));
  rowB.forEach((x,i)=>TOWN_HOUSES.push(houseLite(x,OAK_Z-16,1,TOWN_BODY[(i+4)%12],TOWN_ROOF[(i+3)%8],String(302+i*4))));
  rowC.forEach((x,i)=>TOWN_HOUSES.push(houseLite(x,MAPLE_Z-16,1,TOWN_BODY[(i+7)%12],TOWN_ROOF[(i+5)%8],String(501+i*4))));
  rowD.forEach((x,i)=>TOWN_HOUSES.push(houseLite(x,MAPLE_Z+16,-1,TOWN_BODY[(i+2)%12],TOWN_ROOF[(i+1)%8],String(502+i*4))));
}
/* driveways + parked cars + hoops at a spread of homes */
{
  const parkCols=[0x8a3fd1,0x2a9d8f,0xd4a017,0x4a90d9,0xc0392b,0x5d6266,0x2f7a2c,0xe8641e];
  const spots=[[-120,OAK_Z+16,-1],[-84,OAK_Z+16,-1],[24,OAK_Z+16,-1],[-96,OAK_Z-16,1],
               [12,OAK_Z-16,1],[-108,MAPLE_Z-16,1],[36,MAPLE_Z-16,1],[-60,MAPLE_Z+16,-1],
               [36,MAPLE_Z+16,-1],[120,MAPLE_Z+16,-1]];
  spots.forEach((sp,i)=>{
    const dx=sp[0]+4.6,dz=sp[1]+sp[2]*7;
    flat(3.4,7.5,new THREE.MeshLambertMaterial({color:0x8f8f8f}),dx,sp[1]+sp[2]*7.2,0.026);
    if(i<8){
      const pc=makeTrafficCar(parkCols[i]);
      pc.position.set(dx,0,dz+sp[2]*0.6);pc.rotation.y=sp[2]===1?0:Math.PI;
      scene.add(pc);addCol(dx,dz+sp[2]*0.6,2.2,4.8);
    }
  });
  // two driveway basketball hoops
  [[-84+4.6,OAK_Z+16-7.8],[36+4.6,MAPLE_Z-16+7.8]].forEach(p=>{
    box(0.14,3.2,0.14,0x777777,p[0],1.6,p[1]);
    box(1.4,1.0,0.1,0xffffff,p[0],3.4,p[1]+0.1);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(0.26,0.04,8,18),mat(0xE8641E));
    rim.rotation.x=Math.PI/2;rim.position.set(p[0],3.05,p[1]+0.42);scene.add(rim);
    addCol(p[0],p[1],0.5,0.5);
  });
}
/* lamps, stop signs + street name blades at the new intersections */
streetLamp(-110,OAK_Z+6.8,Math.PI);streetLamp(0,OAK_Z-6.8,0);streetLamp(110,OAK_Z+6.8,Math.PI);
streetLamp(-110,MAPLE_Z-6.8,0);streetLamp(0,MAPLE_Z+6.8,Math.PI);streetLamp(110,MAPLE_Z-6.8,0);
{
  const stopTex=texCanvas(128,128,c=>{
    c.translate(64,64);c.fillStyle='#c0392b';
    c.beginPath();
    for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;c.lineTo(Math.cos(a)*60,Math.sin(a)*60);}
    c.closePath();c.fill();
    c.strokeStyle='#fff';c.lineWidth=5;c.stroke();
    c.fillStyle='#fff';c.font='900 34px Verdana';c.textAlign='center';c.textBaseline='middle';c.fillText('STOP',0,2);
  });
  const blade=nm=>texCanvas(512,96,c=>{
    c.fillStyle='#1f7a3a';c.fillRect(0,0,512,96);
    c.strokeStyle='#fff';c.lineWidth=6;c.strokeRect(4,4,504,88);
    c.fillStyle='#fff';c.font='900 52px Verdana';c.textAlign='center';c.textBaseline='middle';c.fillText(nm,256,52);
  });
  [[OAK_Z,'OAK LANE'],[MAPLE_Z,'MAPLE DRIVE']].forEach(sc=>{
    [[74.4,sc[0]+6.2,0.5],[85.6,sc[0]-6.2,Math.PI+0.5]].forEach(p=>{
      box(0.1,2.8,0.1,0x8a929c,p[0],1.4,p[1]);addCol(p[0],p[1],0.4,0.4);
      const s1=signMesh(1.05,1.05,stopTex);s1.position.set(p[0],2.55,p[1]-0.06);s1.rotation.y=p[2];scene.add(s1);
      const s2=signMesh(1.05,1.05,stopTex);s2.position.set(p[0],2.55,p[1]+0.06);s2.rotation.y=p[2]+Math.PI;scene.add(s2);
      const b1=signMesh(2.4,0.45,blade(sc[1]));b1.position.set(p[0],3.25,p[1]);b1.rotation.y=p[2]-0.5;scene.add(b1);
    });
  });
}
/* extra trees + curb flower patches for vibrancy */
[[-14,-52,1],[4,-52,0.9],[90,-58,1.1],[-140,-58,1],[140,-70,1.05],[90,58,1],
 [-140,58,1.1],[-36,58,0.9],[120,70,1],[0,70,1.05]].forEach(t=>tree(t[0],t[1],t[2]));
{
  const petal=[0xe86aa6,0xffd23e,0xff8c1a,0xd5232a,0x8a3fd1,0x2a9fd4];
  [[-100,-58.9],[-40,-58.9],[60,-58.9],[120,-69.1],[-100,58.9],[-40,69.1],[60,58.9],[120,58.9]]
  .forEach((p,pi)=>{
    for(let i=0;i<4;i++){
      const f=new THREE.Mesh(new THREE.SphereGeometry(0.1,5,4),mat(petal[(pi+i)%6]));
      f.position.set(p[0]+i*0.35,0.17,p[1]+((i%2)*0.2));scene.add(f);
    }
    const st2=new THREE.Mesh(new THREE.BoxGeometry(1.7,0.12,0.5),mat(0x7a5230));
    st2.position.set(p[0]+0.5,0.06,p[1]+0.1);scene.add(st2);
  });
}
/* ---------------- props: lemonade stand, hopscotch, chalk art, soccer, balloons, sprinkler ---------------- */
window.TOWN_ANIMS=[];
const LEMON={x:-72,z:-56.5};
{
  const g=new THREE.Group();g.position.set(LEMON.x,0,LEMON.z);scene.add(g);
  box(2.2,1.0,0.9,0xffd23e,0,0.5,0,g).castShadow=true;
  box(2.3,0.08,1.0,0xf4f4ee,0,1.04,0,g);
  const canopyTex=texCanvas(128,64,c=>{
    for(let i=0;i<8;i++){c.fillStyle=i%2?'#ffd23e':'#e84a5f';c.fillRect(i*16,0,16,64);}
  });
  const can=new THREE.Mesh(new THREE.BoxGeometry(2.6,0.08,1.4),new THREE.MeshLambertMaterial({map:canopyTex}));
  can.position.set(0,2.15,0);can.castShadow=true;g.add(can);
  box(0.07,1.1,0.07,0xf4f4ee,-1.2,1.6,0.55,g);box(0.07,1.1,0.07,0xf4f4ee,1.2,1.6,0.55,g);
  box(0.07,1.1,0.07,0xf4f4ee,-1.2,1.6,-0.55,g);box(0.07,1.1,0.07,0xf4f4ee,1.2,1.6,-0.55,g);
  const pit=new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.11,0.3,8),mat(0xffe9a0));
  pit.position.set(-0.5,1.24,0);g.add(pit);
  box(0.09,0.12,0.09,0xfff6d8,0.1,1.14,0.1,g);box(0.09,0.12,0.09,0xfff6d8,0.35,1.14,-0.1,g);
  const lsTex=texCanvas(256,96,c=>{
    c.fillStyle='#fff9ee';c.fillRect(0,0,256,96);
    c.strokeStyle='#20304A';c.lineWidth=6;c.strokeRect(3,3,250,90);
    c.fillStyle='#e84a5f';c.font='900 40px Verdana';c.textAlign='center';c.fillText('LEMONADE',128,44);
    c.fillStyle='#20304A';c.font='900 26px Verdana';c.fillText('free smiles!',128,78);
  });
  const ls=signMesh(1.7,0.62,lsTex);ls.position.set(0,0.82,0.48);g.add(ls);
  addCol(LEMON.x,LEMON.z,2.5,1.2);
  // bunting between the canopy posts
  const bun=[0xd5232a,0xffd23e,0x2a9fd4,0x3fa34d,0x8a3fd1];
  for(let i=0;i<5;i++){
    const fl=new THREE.Mesh(new THREE.PlaneGeometry(0.26,0.3),
      new THREE.MeshLambertMaterial({color:bun[i],side:THREE.DoubleSide}));
    fl.position.set(-1.0+i*0.5,1.95-Math.sin((i/4)*Math.PI)*0.14,0.62);
    fl.rotation.x=0.25;g.add(fl);
  }
}
/* hopscotch pads (jump on them!) */
const HOPSCOTCH=[{x:24,z:-58.6},{x:-24,z:58.6}];
{
  const hopTex=texCanvas(128,384,c=>{
    c.fillStyle='rgba(255,255,255,0)';c.fillRect(0,0,128,384);
    c.strokeStyle='rgba(240,240,255,0.9)';c.lineWidth=5;c.fillStyle='rgba(255,255,255,0.14)';
    const cell=(x,y,w,h,n2)=>{c.strokeRect(x,y,w,h);c.fillRect(x,y,w,h);
      c.save();c.fillStyle='rgba(250,250,255,0.95)';c.font='900 34px Verdana';
      c.textAlign='center';c.textBaseline='middle';c.fillText(n2,x+w/2,y+h/2);c.restore();};
    cell(34,330,60,48,'1');cell(34,282,60,48,'2');
    cell(4,234,60,48,'3');cell(64,234,60,48,'4');
    cell(34,186,60,48,'5');
    cell(4,138,60,48,'6');cell(64,138,60,48,'7');
    cell(34,90,60,48,'8');
    c.beginPath();c.arc(64,50,34,0,7);c.stroke();
  });
  const hm=new THREE.MeshLambertMaterial({map:hopTex,transparent:true});
  HOPSCOTCH.forEach(p=>{const f=flat(1.5,4.4,hm,p.x,p.z,0.036);f.receiveShadow=false;});
  // landing a jump on a pad = one hopscotch bounce
  let wasAir=false;
  TOWN_ANIMS.push(()=>{
    if(driving)return;
    if(py>0.25)wasAir=true;
    else if(wasAir){
      wasAir=false;
      for(const p of HOPSCOTCH){
        if(Math.abs(px-p.x)<1.1&&Math.abs(pz-p.z)<2.4){
          sfx('pop');burst(px,0.5,pz,5);
          if(window.QUEST_EV)QUEST_EV('hopscotch');
          break;
        }
      }
    }
  });
}
/* sidewalk chalk doodles */
{
  const doodle=draw=>texCanvas(128,128,c=>{c.strokeStyle='rgba(250,250,255,0.85)';c.lineWidth=5;c.lineCap='round';draw(c);});
  const sun=doodle(c=>{c.beginPath();c.arc(64,64,26,0,7);c.stroke();
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2;c.beginPath();
      c.moveTo(64+Math.cos(a)*34,64+Math.sin(a)*34);c.lineTo(64+Math.cos(a)*50,64+Math.sin(a)*50);c.stroke();}});
  const flower=doodle(c=>{for(let i=0;i<6;i++){const a=i/6*Math.PI*2;
      c.beginPath();c.arc(64+Math.cos(a)*22,64+Math.sin(a)*22,14,0,7);c.stroke();}
    c.beginPath();c.arc(64,64,10,0,7);c.stroke();});
  const rocket=doodle(c=>{c.beginPath();c.moveTo(64,20);c.lineTo(84,70);c.lineTo(84,100);c.lineTo(44,100);c.lineTo(44,70);c.closePath();c.stroke();
    c.beginPath();c.moveTo(54,100);c.lineTo(48,118);c.moveTo(74,100);c.lineTo(80,118);c.stroke();});
  [[sun,-100,-58.6],[flower,52,58.6],[rocket,100,-58.6]].forEach(d=>{
    const f=flat(1.6,1.6,new THREE.MeshLambertMaterial({map:d[0],transparent:true}),d[1],d[2],0.0365);
    f.receiveShadow=false;
  });
}
/* ================= CARTER STADIUM — playable soccer! ================= */
const PITCH={x:116,z:38,w:26,d:16};   // x 103..129, z 30..46 — right across from QuikTrip
const SOCCER={goals:0,cd:0};
{
  // striped pitch with real lines, baked in one texture
  const pitchTex=texCanvas(512,320,c=>{
    for(let i=0;i<8;i++){c.fillStyle=i%2?'#57a83c':'#63b848';c.fillRect(i*64,0,64,320);}
    c.strokeStyle='rgba(250,250,250,0.92)';c.lineWidth=5;
    c.strokeRect(10,10,492,300);
    c.beginPath();c.moveTo(256,10);c.lineTo(256,310);c.stroke();
    c.beginPath();c.arc(256,160,42,0,7);c.stroke();
    c.fillStyle='rgba(250,250,250,0.92)';c.beginPath();c.arc(256,160,5,0,7);c.fill();
    c.strokeRect(10,90,58,140);c.strokeRect(444,90,58,140);
    c.beginPath();c.arc(88,160,5,0,7);c.fill();
    c.beginPath();c.arc(424,160,5,0,7);c.fill();
  });
  const pitch=flat(PITCH.w,PITCH.d,new THREE.MeshLambertMaterial({map:pitchTex}),PITCH.x,PITCH.z,0.016);
  // goals with nets on both ends (open mouths face the pitch)
  function makeGoal(gx,facing){
    const gp=new THREE.Group();gp.position.set(gx,0,PITCH.z);gp.rotation.y=facing;scene.add(gp);
    box(0.1,2.0,0.1,0xf4f4ee,0,1.0,-2.2,gp);
    box(0.1,2.0,0.1,0xf4f4ee,0,1.0,2.2,gp);
    box(0.1,0.1,4.5,0xf4f4ee,0,2.02,0,gp);
    const netTex=texCanvas(64,64,c=>{
      c.strokeStyle='rgba(240,240,240,0.65)';c.lineWidth=1.5;
      for(let i=0;i<64;i+=7){c.beginPath();c.moveTo(i,0);c.lineTo(i,64);c.stroke();
        c.beginPath();c.moveTo(0,i);c.lineTo(64,i);c.stroke();}
    });
    const netM=new THREE.MeshLambertMaterial({map:netTex,transparent:true,side:THREE.DoubleSide});
    const back=new THREE.Mesh(new THREE.PlaneGeometry(4.4,1.9),netM);
    back.position.set(-1.0,0.97,0);back.rotation.y=Math.PI/2;gp.add(back);
    const top=new THREE.Mesh(new THREE.PlaneGeometry(1.0,4.4),netM);
    top.position.set(-0.5,1.95,0);top.rotation.z=Math.PI/2;top.rotation.x=Math.PI/2;gp.add(top);
    return gp;
  }
  makeGoal(PITCH.x-PITCH.w/2+0.6,0);              // west goal (mouth faces east)
  makeGoal(PITCH.x+PITCH.w/2-0.6,Math.PI);        // east goal (mouth faces west)
  // low perimeter rails (with colliders) — gaps at both side entrances + both goal mouths
  const railM=mat(0xf4f4ee);
  function rail(cx,cz,w,d){
    const r=new THREE.Mesh(new THREE.BoxGeometry(w,0.5,d),railM);
    r.position.set(cx,0.25,cz);r.castShadow=true;scene.add(r);
    addCol(cx,cz,w,d);
  }
  const L=PITCH.x-PITCH.w/2,R=PITCH.x+PITCH.w/2,T=PITCH.z-PITCH.d/2,B=PITCH.z+PITCH.d/2;
  rail((L+PITCH.x-2)/2- .0,T,PITCH.x-2-L,0.25);rail((PITCH.x+2+R)/2,T,R-(PITCH.x+2),0.25); // north, entrance gap
  rail((L+PITCH.x-2)/2,B,PITCH.x-2-L,0.25);rail((PITCH.x+2+R)/2,B,R-(PITCH.x+2),0.25);     // south, entrance gap
  rail(L,(T+PITCH.z-2.4)/2,0.25,PITCH.z-2.4-T);rail(L,(PITCH.z+2.4+B)/2,0.25,B-(PITCH.z+2.4)); // west, goal mouth gap
  rail(R,(T+PITCH.z-2.4)/2,0.25,PITCH.z-2.4-T);rail(R,(PITCH.z+2.4+B)/2,0.25,B-(PITCH.z+2.4)); // east, goal mouth gap
  // corner flags
  [[L,T],[R,T],[L,B],[R,B]].forEach(cf=>{
    box(0.05,1.1,0.05,0xf4f4ee,cf[0],0.55,cf[1]);
    const fl=new THREE.Mesh(new THREE.PlaneGeometry(0.4,0.28),
      new THREE.MeshLambertMaterial({color:0xe84a5f,side:THREE.DoubleSide}));
    fl.material.color.convertSRGBToLinear();fl.material.userData._lin=1;
    fl.position.set(cf[0]+0.22,1.0,cf[1]);scene.add(fl);
  });
  // the match ball
  const b2mesh=new THREE.Mesh(new THREE.SphereGeometry(0.42,16,12),soccerBallMat);
  b2mesh.castShadow=true;
  scene.add(b2mesh);
  const ball2={mesh:b2mesh,x:PITCH.x,y:0.42,z:PITCH.z,vx:0,vy:0,vz:0};
  b2mesh.position.set(ball2.x,ball2.y,ball2.z);
  window.EXTRA_BALLS=[ball2];
  // goal detection + CELEBRATION
  /* ------- stadium furniture: bleachers, benches, floodlights ------- */
  {
    for(let step=0;step<3;step++){
      const b=new THREE.Mesh(new THREE.BoxGeometry(6,0.4,0.8),mat(0x9aa4b0));
      b.position.set(105,0.2+step*0.42,27.2-step*0.8);b.castShadow=true;scene.add(b);
    }
    addCol(105,26.4,6.4,3);
    [[110,48.6],[122,48.6]].forEach(bp=>{
      box(2.2,0.12,0.6,0x8a5a2a,bp[0],0.55,bp[1]);
      box(0.15,0.55,0.5,0x555555,bp[0]-0.8,0.28,bp[1]);
      box(0.15,0.55,0.5,0x555555,bp[0]+0.8,0.28,bp[1]);
      addCol(bp[0],bp[1],2.4,0.8);
    });
    streetLamp(101.5,28.3,Math.PI/4,true);
    streetLamp(130.5,47.7,Math.PI+Math.PI/4,true);
  }
  /* ------- COME AND PLAY sign (the match starter) ------- */
  window.SOCCER_SIGN={x:111,z:28.4};
  {
    const st=texCanvas(512,224,c=>{
      c.fillStyle='#f7edd8';c.fillRect(0,0,512,224);
      c.strokeStyle='#6b4a2a';c.lineWidth=14;c.strokeRect(7,7,498,210);
      c.fillStyle='#1f7a3a';c.font='900 64px Verdana';c.textAlign='center';
      c.fillText('\u26BD COME AND',256,84);
      c.fillText('PLAY! \u26BD',256,150);
      c.fillStyle='#20304A';c.font='700 30px Verdana';c.fillText('3v3 \u00B7 first to 3 goals',256,196);
    });
    box(0.18,2.0,0.18,0x6b4a2a,SOCCER_SIGN.x-2,1.0,SOCCER_SIGN.z);
    box(0.18,2.0,0.18,0x6b4a2a,SOCCER_SIGN.x+2,1.0,SOCCER_SIGN.z);
    const sg=signMesh(4.6,2.0,st);sg.position.set(SOCCER_SIGN.x,2.2,SOCCER_SIGN.z+0.08);scene.add(sg);
    const sg2=signMesh(4.6,2.0,st);sg2.position.set(SOCCER_SIGN.x,2.2,SOCCER_SIGN.z-0.08);sg2.rotation.y=Math.PI;scene.add(sg2);
    addCol(SOCCER_SIGN.x,SOCCER_SIGN.z,4.4,0.5);
  }
  /* ------- live scoreboard ------- */
  const sbCanvas=document.createElement('canvas');sbCanvas.width=512;sbCanvas.height=128;
  const sbTex=new THREE.CanvasTexture(sbCanvas);sbTex.encoding=THREE.sRGBEncoding;
  function drawScore(us,them){
    const c=sbCanvas.getContext('2d');
    c.fillStyle='#16181c';c.fillRect(0,0,512,128);
    c.strokeStyle='#1f7a3a';c.lineWidth=10;c.strokeRect(5,5,502,118);
    c.fillStyle='#7fd4ff';c.font='900 25px Verdana';c.textAlign='center';
    c.fillText("CARTER'S TEAM",122,46);c.fillText("CHIPPY'S CREW",390,46);
    c.fillStyle='#ffd23e';c.font='900 62px Verdana';
    c.fillText(us+' - '+them,256,92);
    sbTex.needsUpdate=true;
  }
  drawScore(0,0);
  {
    box(0.15,3.4,0.15,0x3c424a,PITCH.x-2.6,1.7,T-1.2);
    box(0.15,3.4,0.15,0x3c424a,PITCH.x+2.6,1.7,T-1.2);
    const sb=new THREE.Mesh(new THREE.PlaneGeometry(5,1.25),
      new THREE.MeshBasicMaterial({map:sbTex}));
    sb.position.set(PITCH.x,3.2,T-1.14);scene.add(sb);
    const sb2=new THREE.Mesh(new THREE.PlaneGeometry(5,1.25),
      new THREE.MeshBasicMaterial({map:sbTex}));
    sb2.position.set(PITCH.x,3.2,T-1.26);sb2.rotation.y=Math.PI;scene.add(sb2);
    addCol(PITCH.x,T-1.2,5.4,0.5);
  }
  /* ------- the 3v3 match engine ------- */
  window.SOCCER_MATCH={on:false,us:0,them:0};
  const HOMES={Khoa:[110,34],Michael:[110,42],Chippy:[122,38],Amelia:[120,33],Holly:[120,43]};
  const BENCH={Khoa:[105,29.2],Michael:[108,29.2],Chippy:[120,29.2],Amelia:[123,29.2],Holly:[126,29.2]};
  function matchPlayers(){return NPCS.filter(n=>HOMES[n.name]);}
  window.SOCCER_TOGGLE=function(){
    const M=SOCCER_MATCH;
    if(!M.on){
      M.on=true;
      if(M.over||M.us===undefined){M.us=0;M.them=0;M.over=false;}
      drawScore(M.us,M.them);
      SOCCER.cd=1.6;   // short kickoff phase: players take formation first
      ball2.x=PITCH.x;ball2.z=PITCH.z;ball2.y=0.42;ball2.vx=ball2.vy=ball2.vz=0;
      toast((M.us||M.them)?('\u26BD Back on! '+M.us+' - '+M.them+' \u2014 first to 3!')
        :'\u26BD KICKOFF! Carter, Khoa & Michael vs Chippy\u2019s crew \u2014 first to 3!');
      sfx('goal');
      matchPlayers().forEach(n=>{n.kcd=0;});
    }else{
      M.on=false;
      toast('\u26BD Match paused \u2014 the score is safe. Come back anytime!');
    }
  };
  function endMatch(usWon){
    SOCCER_MATCH.on=false;SOCCER_MATCH.over=true;
    drawScore(0,0);
    if(usWon){
      toast('🏆 CARTER\u2019S TEAM WINS THE MATCH!!');
      sfx('goal');sfx('stage');
      for(let i=0;i<5;i++)burst(PITCH.x-8+i*4,1.5+(i%2),PITCH.z,24);
      if(window.QUEST_EV)QUEST_EV('match_win');
    }else{
      toast('😅 Chippy\u2019s crew takes this one \u2014 REMATCH?!');
      sfx('ding');
    }
    for(const n of NPCS){
      if(dist2(n.mesh.position.x,n.mesh.position.z,PITCH.x,PITCH.z)<32*32)n.wave=2.4;
    }
  }
  /* AI: nearest teammate chases the ball, others hold formation; kick toward the goal */
  TOWN_ANIMS.push((dt)=>{
    const M=SOCCER_MATCH;
    // goal reset / detection (shared for free play + matches)
    if(SOCCER.cd>0){
      SOCCER.cd-=dt;
      if(SOCCER.cd<=0){
        ball2.x=PITCH.x;ball2.z=PITCH.z;ball2.y=0.42;
        ball2.vx=ball2.vy=ball2.vz=0;
        if(!M.on)toast('\u26BD Ball is back on the center spot!');
      }
    }else if(Math.abs(ball2.z-PITCH.z)<2.2&&ball2.y<1.9){
      if(ball2.x>R-1.4&&ball2.x<R+2.0){   // EAST goal = Carter's team scores
        SOCCER.goals++;SOCCER.cd=2.2;
        sfx('goal');
        for(let i=0;i<3;i++)burst(R-0.6,1.2+i*0.7,PITCH.z,26);
        if(M.on){
          M.us++;drawScore(M.us,M.them);
          toast('\u26BD GOOOOAL!! '+M.us+' - '+M.them+'!');
          if(window.QUEST_EV)QUEST_EV('goal');
          if(M.us>=3)endMatch(true);
        }else{
          toast('\u26BD GOOOOAL!! That\u2019s '+SOCCER.goals+' this game!');
          if(window.QUEST_EV)QUEST_EV('goal');
          for(const n of NPCS){
            if(dist2(n.mesh.position.x,n.mesh.position.z,PITCH.x,PITCH.z)<30*30)n.wave=2.2;
          }
        }
      }else if(ball2.x<L+1.4&&ball2.x>L-2.0){   // WEST goal
        SOCCER.cd=2.2;
        sfx('thud');
        burst(L+0.6,1.4,PITCH.z,18);
        if(M.on){
          M.them++;drawScore(M.us,M.them);
          toast('😱 Chippy\u2019s crew scores! '+M.us+' - '+M.them);
          if(M.them>=3)endMatch(false);
        }else{
          SOCCER.goals++;
          toast('\u26BD GOOOOAL!! That\u2019s '+SOCCER.goals+' this game!');
          if(window.QUEST_EV)QUEST_EV('goal');
        }
      }
    }
    // throw-in: if the match ball escapes the stadium, bring it back
    if(M.on&&SOCCER.cd<=0){
      const oob=ball2.x<L-2||ball2.x>R+2||ball2.z<T-2||ball2.z>B+2;
      M.oobT=oob?(M.oobT||0)+dt:0;
      if(M.oobT>2){M.oobT=0;SOCCER.cd=1.2;toast('\u26BD Throw-in! Back to the center spot.');}
    }
    // player AI
    const players=matchPlayers();
    for(const n of players){
      const isUs=(n.name==='Khoa'||n.name==='Michael');
      let tx,tz,speed=isUs?3.1:3.35;
      if(M.on&&SOCCER.cd<=0){
        // nearest teammate to the ball chases it
        let nearest=null,best=1e9;
        for(const m of players){
          if((m.name==='Khoa'||m.name==='Michael')!==isUs)continue;
          const d=dist2(m.mesh.position.x,m.mesh.position.z,ball2.x,ball2.z);
          if(d<best){best=d;nearest=m;}
        }
        if(n===nearest){tx=ball2.x;tz=ball2.z;}
        else if(n.name==='Holly'){
          // Holly plays keeper: shadows the ball along her goal line
          tx=R-2.1;tz=clamp(ball2.z,PITCH.z-2.4,PITCH.z+2.4);speed=3.9;
        }else if(n.name==='Amelia'&&ball2.x>PITCH.x-3){
          // Amelia sweeps: cuts the lane between ball and goal
          tx=(ball2.x+R-1)/2;tz=(ball2.z+PITCH.z)/2;speed=3.7;
        }else{
          const h=HOMES[n.name];
          tx=h[0]+(ball2.x-PITCH.x)*0.35;tz=h[1]+(ball2.z-PITCH.z)*0.3;
        }
        tx=clamp(tx,L+1.6,R-1.6);tz=clamp(tz,T+1.2,B-1.2);
      }else if(M.on){
        const h=HOMES[n.name];tx=h[0];tz=h[1];  // kickoff formation
      }else{
        const b=BENCH[n.name];tx=b[0];tz=b[1];  // hang out at the sideline
      }
      const dx=tx-n.mesh.position.x,dz=tz-n.mesh.position.z;
      const d=Math.hypot(dx,dz);
      if(d>0.25){
        n.mesh.position.x+=dx/d*Math.min(speed*dt,d);
        n.mesh.position.z+=dz/d*Math.min(speed*dt,d);
        n.mesh.rotation.y=angLerp(n.mesh.rotation.y,Math.atan2(dx,dz),1-Math.exp(-8*dt));
        const P=n.mesh.userData.parts;
        if(P){n.ph=(n.ph||0)+speed*3.4*dt;
          if(!(n.wave>0)){P.armL.rotation.x=Math.sin(n.ph)*0.6;P.armR.rotation.x=-Math.sin(n.ph)*0.6;}
          P.legL.rotation.x=-Math.sin(n.ph)*0.7;P.legR.rotation.x=Math.sin(n.ph)*0.7;}
      }
      // kick!
      n.kcd=(n.kcd||0)-dt;
      if(M.on&&SOCCER.cd<=0&&n.kcd<=0){
        const bd=dist2(n.mesh.position.x,n.mesh.position.z,ball2.x,ball2.z);
        if(bd<1.25*1.25){
          n.kcd=0.7;
          const defending=!isUs&&ball2.x>PITCH.x+5;
          const gx=isUs?R:L,gz=PITCH.z+(Math.random()-0.5)*(defending?7:4.5);
          let kx=gx-ball2.x,kz=gz-ball2.z;
          const kl=Math.hypot(kx,kz)||1;
          const pow=7.5+Math.random()*3;
          ball2.vx=kx/kl*pow;ball2.vz=kz/kl*pow;ball2.vy=1.2+Math.random()*1.4;
          sfx('pop');
        }
      }
    }
  });
}
/* balloon house (a birthday every day!) */
{
  const bx=36,bz=MAPLE_Z-16;   // house 5xx on Maple north row
  const cols=[0xd5232a,0xffd23e,0x2a9fd4,0x3fa34d,0xe86aa6];
  const bGroup=new THREE.Group();bGroup.position.set(bx-3.2,0,bz+4.6);scene.add(bGroup);
  const balls=[];
  for(let i=0;i<5;i++){
    const b=new THREE.Mesh(new THREE.SphereGeometry(0.28,8,7),mat(cols[i]));
    b.position.set((i-2)*0.35,2.6+(i%2)*0.35,(i%3)*0.15);b.scale.y=1.15;bGroup.add(b);balls.push(b);
  }
  const strPts=[];
  balls.forEach(b=>{strPts.push(b.position.clone(),new THREE.Vector3(0,0.9,0));});
  const strGeo=new THREE.BufferGeometry().setFromPoints(strPts);
  const strM=new THREE.LineBasicMaterial({color:0x666a72});strM.color.convertSRGBToLinear();strM.userData._lin=1;
  bGroup.add(new THREE.LineSegments(strGeo,strM));
  box(0.12,0.9,0.12,0x8a929c,0,0.45,0,bGroup);
  TOWN_ANIMS.push((dt,t)=>{
    balls.forEach((b,i)=>{b.position.y=2.6+(i%2)*0.35+Math.sin(t*1.4+i)*0.1;});
  });
}
/* sprinkler (front yard on Oak) — run through the water! */
const SPRK={x:36,z:-55,on:true};
{
  box(0.14,0.3,0.14,0x8a929c,SPRK.x,0.15,SPRK.z);
  const drops=[];
  const dm=new THREE.MeshLambertMaterial({color:0x9fd4f0,transparent:true,opacity:0.8});
  dm.color.convertSRGBToLinear();dm.userData._lin=1;
  for(let i=0;i<10;i++){
    const d=new THREE.Mesh(new THREE.SphereGeometry(0.07,5,4),dm);
    d.visible=false;scene.add(d);drops.push(d);
  }
  const wet=flat(4.2,4.2,new THREE.MeshBasicMaterial({color:0x7ab8d8,transparent:true,opacity:0.13,depthWrite:false}),SPRK.x,SPRK.z,0.013);
  wet.receiveShadow=false;
  let sprkCD=0;
  TOWN_ANIMS.push((dt,t)=>{
    for(let i=0;i<10;i++){
      const ph=(t*0.9+i/10)%1,ang=(i/10)*Math.PI*2+t*0.7;
      const r=ph*1.9,y=0.3+Math.sin(ph*Math.PI)*1.15;
      drops[i].visible=true;
      drops[i].position.set(SPRK.x+Math.cos(ang)*r,y,SPRK.z+Math.sin(ang)*r);
    }
    sprkCD-=dt;
    if(sprkCD<=0&&!driving&&dist2(px,pz,SPRK.x,SPRK.z)<1.8*1.8){
      sprkCD=3;
      if(window.QUEST_EV)QUEST_EV('sprinkler');
      sfx('pop');burst(px,1.2,pz,6);
    }
  });
}
/* kite kid's kite (Sam stands on the Oak verge) */
{
  const kiteTex=texCanvas(64,64,c=>{
    c.fillStyle='#e84a5f';c.beginPath();c.moveTo(32,2);c.lineTo(62,32);c.lineTo(32,62);c.lineTo(2,32);c.closePath();c.fill();
    c.strokeStyle='#20304A';c.lineWidth=3;c.stroke();
    c.beginPath();c.moveTo(32,2);c.lineTo(32,62);c.moveTo(2,32);c.lineTo(62,32);c.stroke();
  });
  const kite=new THREE.Mesh(new THREE.PlaneGeometry(0.9,0.9),
    new THREE.MeshLambertMaterial({map:kiteTex,side:THREE.DoubleSide}));
  scene.add(kite);
  const strGeo=new THREE.BufferGeometry();
  const strPos=new Float32Array(6);
  strGeo.setAttribute('position',new THREE.BufferAttribute(strPos,3));
  const strM=new THREE.LineBasicMaterial({color:0xf4f4ee});strM.color.convertSRGBToLinear();strM.userData._lin=1;
  const line=new THREE.Line(strGeo,strM);scene.add(line);
  const KID={x:-6,z:-56};
  TOWN_ANIMS.push((dt,t)=>{
    const kx=KID.x+Math.cos(t*0.5)*4.5,kz=KID.z-3+Math.sin(t*0.8)*2.2,ky=8.5+Math.sin(t*0.9)*1.4;
    kite.position.set(kx,ky,kz);
    kite.rotation.y=t*0.5+Math.PI/2;kite.rotation.z=Math.sin(t*1.3)*0.3;
    strPos[0]=KID.x;strPos[1]=1.6;strPos[2]=KID.z;
    strPos[3]=kx;strPos[4]=ky-0.4;strPos[5]=kz;
    strGeo.attributes.position.needsUpdate=true;
  });
}
/* ---------------- collectibles: feathers + chalk stars (QUEST_EV bridge) ---------------- */
if(!save.townc)save.townc={feathers:{},chalk:{}};
const FEATHERS=[[-103,14],[-116,26],[-124,34],[-134,18],[66,-58],[-90,-58],[130,-66],
                [60,58],[-90,58],[0,-70]];
const CHALK_STARS=[[-110,-58.6],[-40,-58.6],[20,-58.6],[100,-58.6],
                   [-110,58.6],[-50,58.6],[30,58.6],[110,58.6]];
{
  const fM=new THREE.MeshLambertMaterial({color:0xf8f8f4,side:THREE.DoubleSide});
  fM.color.convertSRGBToLinear();fM.userData._lin=1;
  const fGeo=new THREE.PlaneGeometry(0.22,0.6);
  const liveF=[];
  FEATHERS.forEach((p,i)=>{
    if(save.townc.feathers[i])return;
    const f=new THREE.Mesh(fGeo,fM);
    f.position.set(p[0],0.8,p[1]);f.rotation.z=0.4;
    scene.add(f);liveF.push({f,i,x:p[0],z:p[1]});
  });
  const starTex=texCanvas(64,64,c=>{
    c.fillStyle='rgba(255,240,140,0.95)';c.strokeStyle='rgba(250,250,255,0.9)';c.lineWidth=3;
    c.beginPath();
    for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?12:28;
      c.lineTo(32+Math.cos(a)*r,32+Math.sin(a)*r);}
    c.closePath();c.fill();c.stroke();
  });
  const sM=new THREE.MeshBasicMaterial({map:starTex,transparent:true,depthWrite:false});
  const liveS=[];
  CHALK_STARS.forEach((p,i)=>{
    if(save.townc.chalk[i])return;
    const s=flat(1.1,1.1,sM,p[0],p[1],0.037);s.receiveShadow=false;
    liveS.push({s,i,x:p[0],z:p[1]});
  });
  TOWN_ANIMS.push((dt,t)=>{
    for(let i=liveF.length-1;i>=0;i--){
      const F=liveF[i];
      F.f.position.y=0.8+Math.sin(t*2+F.i)*0.12;
      F.f.rotation.y=t*1.5+F.i;
      if(!driving&&dist2(px,pz,F.x,F.z)<1.5*1.5){
        scene.remove(F.f);liveF.splice(i,1);
        save.townc.feathers[F.i]=1;persist();
        sfx('pop');burst(F.x,1,F.z,8);
        toast('🪶 Found a soft feather! ('+Object.keys(save.townc.feathers).length+'/10)');
        if(window.QUEST_EV)QUEST_EV('feather');
      }
    }
    for(let i=liveS.length-1;i>=0;i--){
      const S=liveS[i];
      if(!driving&&dist2(px,pz,S.x,S.z)<1.2*1.2){
        scene.remove(S.s);liveS.splice(i,1);
        save.townc.chalk[S.i]=1;persist();
        sfx('pop');burst(S.x,0.6,S.z,10);
        toast('⭐ Chalk star collected! ('+Object.keys(save.townc.chalk).length+'/8)');
        if(window.QUEST_EV)QUEST_EV('chalk');
      }
    }
  });
}
/* ---------------- 17 new characters (kids playing + grown-ups doing things) ---------------- */
addNPC({name:'Zoe',x:LEMON.x+1.9,z:LEMON.z+0.4,type:'hop',
  mesh:makePerson({shirt:0xffd23e,pants:0x2a7fd4,skin:0xd99a66,pony:true,scale:0.6}),
  lines:['🍋 "Ice-cold lemonade! Free smiles included!"','🍋 "Business is BOOMING today!"','🍋 "You look thirsty, boss!"']});
addNPC({name:'Marcus',x:-96,z:-57,type:'loop',cx:-96,cz:-57,r:3,speed:2.8,
  mesh:makePerson({shirt:0x2a9d8f,pants:0x2b3540,skin:0x8d5a3a,hair:0x1a120a,scale:0.62}),
  lines:['⚽ "I\'m gonna be a soccer star!"','⚽ "Wanna see my trick shot?"','⚽ "Coach Danny taught me this!"']});
addNPC({name:'Bella',x:-46,z:-71,type:'loop',cx:-46,cz:-71,r:4,speed:3.6,
  mesh:makePerson({shirt:0xe86aa6,pants:0x8a3fd1,skin:0xf0c8a0,hair:0x7a4a1e,pony:true,scale:0.58}),
  lines:['🏃 "Can\'t catch me, Ruby!"','🏃 "I\'m the fastest on Oak Lane!"','🏃 "Tag! You\'re it now!"']});
addNPC({name:'Ruby',x:-42,z:-71,type:'loop',cx:-46,cz:-71,r:4,speed:3.8,
  mesh:makePerson({shirt:0xff8c1a,pants:0x2b3540,skin:0xc98a5e,hair:0x2a1c10,pony:true,scale:0.58}),
  lines:['🏃 "Bella cheats, she got new shoes!"','🏃 "We race every single day!"','🏃 "Watch me zoom!"']});
addNPC({name:'Mr. Chen',x:-120,z:-53,type:'patrol',speed:1.2,pauseT:1.6,
  pts:[[-124,-53],[-112,-53]],
  mesh:makePerson({shirt:0x4a6a8a,pants:0x3a3a3a,skin:0xe8c090,hair:0x222222}),
  lines:['🌱 "My tomatoes won a prize last year!"','🌱 "A good lawn takes patience."','🌱 "Morning! Fine day on Oak Lane."']});
addNPC({name:'Nora',x:24,z:-57.4,type:'hop',
  mesh:makePerson({shirt:0x8a3fd1,pants:0xe86aa6,skin:0xd99a66,pony:true,scale:0.56}),
  lines:['🎨 "I drew that hopscotch myself!"','🎨 "Bet you can\'t hop to 8!"','🎨 "Chalk art is REAL art!"']});
addNPC({name:'Jax',x:58,z:-71,type:'loop',cx:58,cz:-71,r:3,speed:4.2,
  mesh:makePerson({shirt:0x1a9fd4,pants:0x20242a,skin:0x8d5a3a,hair:0x111111,cap:0xd5232a,scale:0.64}),
  lines:['💨 "Zoom zoom ZOOM!"','💨 "I never ever get dizzy!"','💨 "Race me around the block!"']});
addNPC({name:'Mr. Ortiz',x:-12,z:-58.6,type:'patrol',speed:1.5,pauseT:1.2,
  pts:[[-30,-58.6],[20,-58.6]],attach:makeDog(),
  mesh:makePerson({shirt:0x6b8e23,pants:0x4a3b2a,skin:0xc98a5e,hair:0x1f1408}),
  lines:['🐕 "This is Peanut — Tiny\'s best pal!"','🐕 "Walkies twice a day, rain or shine."','🐕 "Peanut says hi back!"']});
addNPC({name:'Ava',x:-60,z:52.5,type:'hop',
  mesh:makePerson({shirt:0x3fa34d,pants:0xffd23e,skin:0xf0c8a0,hair:0x7a4a1e,pony:true,scale:0.6}),
  lines:['🪢 "Ninety-nine jumps, no misses!"','🪢 "Jump rope is my superpower!"','🪢 "Double-unders are EASY!"']});
addNPC({name:'Sam',x:-6,z:-56,type:'hop',
  mesh:makePerson({shirt:0xe84a5f,pants:0x2b3540,skin:0xe8c090,hair:0x5a4022,cap:0x2a7fd4,scale:0.62}),
  lines:['🪁 "My kite\'s named Rocket!"','🪁 "The wind is PERFECT today!"','🪁 "One day I\'ll fly like Rocket!"']});
addNPC({name:'Mia',x:12,z:52.5,type:'hop',
  mesh:makePerson({shirt:0x2a9fd4,pants:0xe86aa6,skin:0xd99a66,pony:true,scale:0.57}),
  lines:['🫧 "I can blow the BIGGEST bubbles!"','🫧 "Maple Drive is the best street!"','🫧 "Have you met everyone yet?"']});
addNPC({name:'Leo',x:-82,z:55,type:'loop',cx:-82,cz:55,r:2.5,speed:3.4,
  mesh:makePerson({shirt:0xd5232a,pants:0x2b3540,skin:0x8d5a3a,hair:0x111111,scale:0.6}),
  lines:['🦖 "RAWR! I\'m a T-rex today!"','🦖 "Eli can never catch a T-rex!"','🦖 "Dinosaurs are the coolest!"']});
addNPC({name:'Eli',x:-79.5,z:55,type:'loop',cx:-82,cz:55,r:2.5,speed:3.6,
  mesh:makePerson({shirt:0xffd23e,pants:0x3a3a3a,skin:0xe8c090,hair:0x7a4a1e,scale:0.6}),
  lines:['🚀 "Astronauts beat dinosaurs!"','🚀 "3... 2... 1... BLAST OFF!"','🚀 "I\'m training for the moon!"']});
addNPC({name:'Miss Rosa',x:-108,z:52.5,type:'patrol',speed:1.1,pauseT:2,
  pts:[[-114,52.5],[-100,52.5]],
  mesh:makePerson({shirt:0xe86aa6,pants:0x6e4a6e,skin:0xd99a66,hair:0x2a1c10,pony:true}),
  lines:['🌺 "My garden has 40 kinds of flowers!"','🌺 "The butterflies love Maple Drive."','🌺 "Smell the roses, sweetie!"']});
addNPC({name:'Dr. Kim',x:80,z:100,type:'loop',cx:40,cz:90,r:38,speed:4.8,
  mesh:makePerson({shirt:0xf4f4f0,pants:0x2b3540,skin:0xe8c090,hair:0x222222}),
  lines:['🏃 "Five miles every morning!"','🏃 "Gotta keep the heart strong!"','🏃 "On your left!"']});
addNPC({name:'Ben',x:36,z:53,type:'hop',
  mesh:makePerson({shirt:0x2a7fd4,pants:0xd5232a,skin:0x8d5a3a,hair:0x1a120a,scale:0.58}),
  lines:['🎈 "It\'s my birthday!! Well... almost!"','🎈 "Balloons make EVERYTHING better!"','🎈 "Want some cake? It\'s pretend!"']});
addNPC({name:'Coach Danny',x:112,z:47,type:'patrol',speed:1.6,pauseT:1.4,
  pts:[[112,47],[120,47]],
  mesh:makePerson({shirt:0x3fa34d,pants:0x20242a,skin:0xc98a5e,hair:0x1f1408,cap:0x3fa34d}),
  lines:['⚽ "Practice makes progress, champ!"','⚽ "Best goal on this side of town!"','⚽ "You\'ve got great hustle, kid!"']});
/* two more ambient cars for the new streets */
addTraffic(0x2a9d8f,-100,OAK_Z+2,Math.PI/2,'x',1,-152,152);
addTraffic(0xd4a017,100,MAPLE_Z-2,-Math.PI/2,'x',-1,-152,152);

/* ---------------- the soccer kids: Carter's team + Chippy's crew ---------------- */
addNPC({name:'Khoa',x:105,z:29.2,type:'idle',
  mesh:makePerson({shirt:0x2e6fe0,pants:0x20304a,skin:0xe8c090,hair:0x111111,scale:0.62}),
  lines:['\u26BD "Pass it! Pass it! PASS IT!"','\u26BD "Nice one, Carter!"','\u26BD "We totally got this!"']});
addNPC({name:'Michael',x:108,z:29.2,type:'idle',
  mesh:makePerson({shirt:0x2e6fe0,pants:0x2b3540,skin:0x8d5a3a,hair:0x1a120a,cap:0x2e6fe0,scale:0.63}),
  lines:['\u26BD "Defense wins championships!"','\u26BD "I call the next goal!"','\u26BD "Team huddle, team huddle!"']});
addNPC({name:'Chippy',x:120,z:29.2,type:'idle',
  mesh:makePerson({shirt:0xd5232a,pants:0x20242a,skin:0xf0c8a0,hair:0x7a4a1e,cap:0xd5232a,scale:0.6}),
  lines:['\u26BD "You can\u2019t beat MY crew!"','\u26BD "We\u2019re gonna win. Just saying."','\u26BD "Rematch. RIGHT NOW."']});
addNPC({name:'Amelia',x:123,z:29.2,type:'idle',
  mesh:makePerson({shirt:0xe86aa6,pants:0xd5232a,skin:0xd99a66,hair:0x2a1c10,pony:true,scale:0.6}),
  lines:['\u26BD "Fastest feet in town, right here!"','\u26BD "Watch my left foot!"','\u26BD "Good luck \u2014 you\u2019ll need it!"']});
addNPC({name:'Holly',x:126,z:29.2,type:'idle',
  mesh:makePerson({shirt:0xff8c1a,pants:0x8a3fd1,skin:0xf0c8a0,hair:0xc9a227,pony:true,scale:0.58}),
  lines:['\u26BD "Good game either way, okay?"','\u26BD "I never miss... mostly!"','\u26BD "This is the BEST pitch ever!"']});

/* ---------------- floating name tags (find anyone at a glance) ---------------- */
{
  function tagTex(nm){
    return texCanvas(256,64,c=>{
      c.fillStyle='rgba(255,249,238,0.92)';
      const w=Math.min(240,nm.length*22+34);
      const x0=(256-w)/2;
      c.beginPath();c.moveTo(x0+16,6);c.arcTo(x0+w,6,x0+w,58,16);c.arcTo(x0+w,58,x0,58,16);
      c.arcTo(x0,58,x0,6,16);c.arcTo(x0,6,x0+w,6,16);c.closePath();c.fill();
      c.strokeStyle='#20304A';c.lineWidth=4;c.stroke();
      c.fillStyle='#20304A';c.font='900 30px Verdana';c.textAlign='center';c.textBaseline='middle';
      c.fillText(nm,128,33);
    });
  }
  for(const n of NPCS){
    const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:tagTex(n.name),transparent:true,depthTest:false}));
    const sc=(n.mesh.scale&&n.mesh.scale.x)||1;
    spr.scale.set(2.6/sc,0.65/sc,1);       // counter the group scale: same size for kids + adults
    spr.position.y=2.9+0.55/sc;
    spr.renderOrder=5;
    n.mesh.add(spr);
  }
}
/* twin runners start on opposite sides of their loops */
{
  const ruby=NPCS.find(n=>n.name==='Ruby');if(ruby)ruby.ang=Math.PI;
  const eli=NPCS.find(n=>n.name==='Eli');if(eli)eli.ang=Math.PI;
}
