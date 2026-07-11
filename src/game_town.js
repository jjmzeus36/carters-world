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
/* soccer goal + field (Maple east) */
{
  const gp=new THREE.Group();gp.position.set(96,0,78);scene.add(gp);
  box(0.09,1.6,0.09,0xf4f4ee,-1.8,0.8,0,gp);box(0.09,1.6,0.09,0xf4f4ee,1.8,0.8,0,gp);
  box(3.7,0.09,0.09,0xf4f4ee,0,1.62,0,gp);
  const netTex=texCanvas(64,64,c=>{
    c.strokeStyle='rgba(240,240,240,0.7)';c.lineWidth=1.5;
    for(let i=0;i<64;i+=8){c.beginPath();c.moveTo(i,0);c.lineTo(i,64);c.stroke();
      c.beginPath();c.moveTo(0,i);c.lineTo(64,i);c.stroke();}
  });
  const net=new THREE.Mesh(new THREE.PlaneGeometry(3.6,1.55),
    new THREE.MeshLambertMaterial({map:netTex,transparent:true,side:THREE.DoubleSide}));
  net.position.set(0,0.8,-0.35);net.rotation.x=0.2;gp.add(net);
  addCol(96,78,4,0.6);
  paint2(96,74.5);
  function paint2(x,z){
    const f=flat(6,4,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.16}),x,z,0.014);
    f.receiveShadow=false;
  }
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
addNPC({name:'Coach Danny',x:96,z:73,type:'patrol',speed:1.6,pauseT:1.4,
  pts:[[92,73],[100,73]],
  mesh:makePerson({shirt:0x3fa34d,pants:0x20242a,skin:0xc98a5e,hair:0x1f1408,cap:0x3fa34d}),
  lines:['⚽ "Practice makes progress, champ!"','⚽ "Best goal on this side of town!"','⚽ "You\'ve got great hustle, kid!"']});
/* two more ambient cars for the new streets */
addTraffic(0x2a9d8f,-100,OAK_Z+2,Math.PI/2,'x',1,-152,152);
addTraffic(0xd4a017,100,MAPLE_Z-2,-Math.PI/2,'x',-1,-152,152);
