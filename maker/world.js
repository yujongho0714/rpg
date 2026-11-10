/* 정도 게임 메이커 — 오픈월드 (KayKit Medieval Hexagon, CC0) · 사냥터 · 필드 보스 · 마을 NPC · 월드맵 · 자동 이동 */
'use strict';
const WS=3,HW=2*WS,HZ=1.725*WS,WC=34,WR=36;const W0={x:-WC*HW/2,z:-WR*HZ/2};
const hexPos=(c,r)=>({x:W0.x+HW*(c+.5*(r&1))+HW/2,z:W0.z+HZ*r+HZ/2});
function hexAt(x,z){const r=Math.round((z-W0.z-HZ/2)/HZ);const c=Math.round((x-W0.x-HW/2)/HW-.5*(r&1));return{c,r};}
const ZONES=[
  {id:'town',name:'정도 마을',lv:0,c:17,r:18,rad:3,col:'#ffd24a'},
  {id:'z1',name:'해골 초원',lv:1,c:11,r:14,rad:3,mobs:['brawler','zombie','slime','d_fighter'],n:9,col:'#9be07a'},
  {id:'z2',name:'바위 언덕',lv:5,c:24,r:13,rad:3,mobs:['thrower','skeleton','runner','d_caster','spider'],n:9,col:'#c9b48a'},
  {id:'z3',name:'검은 숲',lv:10,c:9,r:24,rad:3,boss:'enderman',mobs:['shadow','spider','d_blinker','husk','brawler'],n:10,col:'#3f7a4a'},
  {id:'z4',name:'호숫가 폐허',lv:15,c:25,r:24,rad:3,boss:'giant',mobs:['stray','d_caster','d_rusher','thrower','slime'],n:10,col:'#6ab8e0'},
  {id:'z5',name:'광전사 야영지',lv:20,c:17,r:30,rad:3,mobs:['brute','wither_sk','d_fighter','d_rusher','runner'],n:11,col:'#e07a5a',boss:'golem'},
  {id:'z6',name:'해골 왕의 언덕',lv:25,c:17,r:6,rad:3,mobs:['wither_sk','shadow','d_blinker','d_caster','brute'],n:11,col:'#b07aff',boss:'d_boss'}];
const PORTALS=[{name:'지하 무덤 입구',c:5,r:9,th:'kk_tomb'},{name:'버려진 광산 입구',c:29,r:8,th:'kk_mine'},{name:'해골 요새 입구',c:28,r:31,th:'kk_fort'}];
const NPCS=[{name:'상인 루나',file:'Rogue_Hooded',dc:-1.2,dr:0,act:'shop',t:'🏪 물약·주문서'},{name:'대장장이 강철',file:'Barbarian',dc:1.2,dr:0,act:'forge',t:'⚒ 공방·강화'},{name:'관장님',file:'Knight',dc:0,dr:-1.2,act:'quest',t:'📜 오늘의 사냥'},{name:'마법사 별이',file:'Mage',dc:0,dr:1.2,act:'poly',t:'🎭 변신·소환'}];
let WORLD=null;
function hexD(a,b){const ax=a.c-(a.r-(a.r&1))/2,az=a.r,bx=b.c-(b.r-(b.r&1))/2,bz=b.r;const dx=ax-bx,dz=az-bz;return(Math.abs(dx)+Math.abs(dz)+Math.abs(dx+dz))/2;}
function genWorld(){const T=[];let seed=7;const R=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  for(let r=0;r<WR;r++)for(let c=0;c<WC;c++){const t={c,r,k:'grass',d:null,rot:Math.floor(R()*6)*PI/3};const edge=c<2||r<2||c>=WC-2||r>=WR-2;
    const town=hexD({c,r},ZONES[0])<=ZONES[0].rad;const lake=hexD({c,r},{c:23,r:21})<=2||hexD({c,r},{c:24,r:20})<=1;
    if(edge)t.d=pick(['mountain_A_grass_trees','mountain_B_grass_trees','mountain_C_grass_trees','mountain_A','mountain_B_grass','hills_C_trees']),t.solid=1;
    else if(lake)t.k='water',t.solid=1,t.d=R()<.25?pick(['waterlily_A','waterlily_B','waterplant_A']):null;
    else if(!town){const z=ZONES.slice(1).some(Z=>hexD({c,r},Z)<=1);const p=PORTALS.some(P=>hexD({c,r},P)<=1);if(!z&&!p){const v=R();
        if(v<.13)t.d=pick(['trees_A_large','trees_B_large','trees_A_medium','trees_B_medium']),t.tree=1;else if(v<.2)t.d=pick(['tree_single_A','tree_single_B','trees_A_small','trees_B_small']);
        else if(v<.24)t.d=pick(['rock_single_A','rock_single_B','rock_single_C','rock_single_D','rock_single_E']);else if(v<.27)t.d=pick(['hills_A_trees','hills_B_trees','hill_single_A','hill_single_B']),t.solid=1;}}
    T.push(t);}
  const town=[['building_castle_blue',0,-2],['building_market_blue',-2,0],['building_blacksmith_blue',2,0],['building_tavern_blue',-1,2],['building_church_blue',1,2],['building_home_A_blue',-3,-1],['building_home_B_blue',3,-1],['building_well_blue',0,1],['building_windmill_blue',-2,-2],['building_tower_A_blue',2,-2],['building_home_A_red',-3,1],['building_watermill_blue',3,2]];
  town.forEach(([n,dc,dr])=>{const t=T.find(x=>x.c===ZONES[0].c+dc&&x.r===ZONES[0].r+dr);if(t){t.d=n;t.solid=n!=='building_well_blue'?1:0;t.build=1;t.rot=PI;}});
  ZONES.slice(1).forEach(Z=>{[[1,0,'tent'],[-1,1,'flag_red'],[0,-1,'crate_A_big']].forEach(([dc,dr,n])=>{const t=T.find(x=>x.c===Z.c+dc&&x.r===Z.r+dr);if(t&&!t.d)t.d=n;});});
  return T;}
async function instMeshes(name,list,scale=WS,shadow=true){if(!list.length)return;const g=await gltf('kk/h/'+name+'.gltf').catch(()=>null);if(!g)return;g.scene.updateMatrixWorld(true);
  g.scene.traverse(o=>{if(!o.isMesh)return;const mat=o.material.clone();if(name==='hex_grass')mat.color.setRGB(.5,.68,.42);else mat.color.setRGB(.9,.9,.9);const im=new THREE.InstancedMesh(o.geometry,mat,list.length);const m=new THREE.Matrix4(),q=new THREE.Quaternion();
    list.forEach((p,i)=>{q.setFromAxisAngle(new V3(0,1,0),p.rot||0);m.compose(new V3(p.x,p.y||0,p.z),q,new V3(scale*(p.s||1),scale*(p.s||1),scale*(p.s||1)));m.multiply(o.matrixWorld);im.setMatrixAt(i,m);});
    im.castShadow=shadow;im.receiveShadow=true;scene.add(im);MAP.objs.push(im);});}
async function buildWorld(){MAP.objs.forEach(o=>scene.remove(o));MAP.objs=[];MAP.theme='world';const T=WORLD||(WORLD=genWorld());
  const N=Math.ceil(Math.max(WC*HW,WR*HZ)/2)*2+8;MAP.N=N;MAP.solid=new Uint8Array(N*N);const H=N/2;
  scene.background.set(0x9fd2f0);scene.fog.color.set(0x9fd2f0);if(scene.fog.near!=null){scene.fog.near=38;scene.fog.far=95;}sun.color.set(0xfff6ea);sun.intensity=.85;
  const groups={};const add=(k,p)=>{(groups[k]=groups[k]||[]).push(p);};
  T.forEach(t=>{const p=hexPos(t.c,t.r);add('T:'+(t.k==='water'?'hex_water':'hex_grass'),{x:p.x,z:p.z,rot:t.rot});if(t.d)add('D:'+t.d,{x:p.x,z:p.z,rot:t.build?t.rot:t.rot,s:t.tree?1.15:t.build?1.05:1});
    // 충돌
    if(t.solid||t.tree){const rad=t.solid?(t.build?HW*.42:HW*.55):HW*.28;for(let dz=-rad;dz<=rad;dz+=.5)for(let dx=-rad;dx<=rad;dx+=.5){if(dx*dx+dz*dz>rad*rad)continue;const i=Math.floor(p.x+dx+H),j=Math.floor(p.z+dz+H);if(i>=0&&j>=0&&i<N&&j<N)MAP.solid[j*N+i]=1;}}});
  for(let i=0;i<N;i++){MAP.solid[i]=MAP.solid[(N-1)*N+i]=MAP.solid[i*N]=MAP.solid[i*N+N-1]=1;}
  // 맵 밖은 막기
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=i-H+.5,z=j-H+.5;const h=hexAt(x,z);if(h.c<0||h.r<0||h.c>=WC||h.r>=WR)MAP.solid[j*N+i]=1;}
  const jobs=Object.keys(groups).map(k=>instMeshes(k.slice(2),groups[k],WS,k[0]==='D'));
  // 포털
  PORTALS.forEach(P=>{const p=hexPos(P.c,P.r);P.x=p.x;P.z=p.z;const fx=pfx('arcane/portal',new V3(p.x,.05,p.z),{scale:1.6,life:1e9});if(fx)MAP.objs.push({isFx:1,fx});});
  ZONES.forEach(Z=>{const p=hexPos(Z.c,Z.r);Z.x=p.x;Z.z=p.z;});
  await Promise.all(jobs);await spawnNPCs();worldMiniCache();}
/* ---------- NPC ---------- */
const NPCA=[];
async function spawnNPCs(){NPCA.forEach(n=>{scene.remove(n.A.g);n.tag.remove();});NPCA.length=0;const Z=ZONES[0];
  for(const n of NPCS){const A=await makeKK(n.file,{h:1.9});const w=KKW[n.file]||[];if(w[0])await kkHold(A,'r',{kk:n.act==='shop'?'spellbook_open':w[0]});const x=Z.x+n.dc*HW*.55,z=Z.z+n.dr*HZ*.62+2.5;A.g.position.set(x,0,z);A.g.rotation.y=Math.atan2(Z.x-x,Z.z+2.5-z)+PI*0;scene.add(A.g);MAP.objs.push(A.g);
    const tag=document.createElement('div');tag.className='npctag';tag.innerHTML=`<b>${n.name}</b><br><small>${n.t}</small>`;document.body.appendChild(tag);NPCA.push({n,A,tag,x,z});kkPlay(A,n.file==='Mage'?'Spellcasting':'Idle');}}
function npcTick(dt){let near=null;NPCA.forEach(o=>{o.A.mixer.update(dt);const v=new V3(o.x,2.4,o.z).project(cam);const vis=v.z<1&&MODE==='world'&&Math.hypot(o.x-P.pos.x,o.z-P.pos.z)<26;o.tag.style.display=vis?'block':'none';
  if(vis){o.tag.style.left=((v.x+1)/2*innerWidth)+'px';o.tag.style.top=((1-v.y)/2*innerHeight)+'px';}if(MODE==='world'&&Math.hypot(o.x-P.pos.x,o.z-P.pos.z)<3)near=o;});
  const b=$('#talkB');if(near){b.hidden=false;b.textContent='💬 '+near.n.name;b.onclick=()=>npcTalk(near);}else b.hidden=true;}
function npcTalk(o){const a=o.n.act;if(a==='shop')openShop();else if(a==='forge')openForge();else if(a==='quest')openQuest();else if(a==='poly')openPolyShop();}
/* 오늘의 사냥 (퀘스트) */
if(!S.q)S.q={day:'',z:'',need:0,got:0,done:false};
function openQuest(){const box=$('#bagBox');openModal('#mBag');const today=new Date().toDateString();if(S.q.day!==today){const zs=ZONES.slice(1).filter(Z=>Z.lv<=L.lv+3);const Z=zs[zs.length-1]||ZONES[1];S.q={day:today,z:Z.id,need:15+Z.lv,got:0,done:false};saveAll();}
  const Z=ZONES.find(z=>z.id===S.q.z);const fin=S.q.got>=S.q.need;
  box.innerHTML=`<h2>📜 관장님의 오늘의 사냥<button class="x" data-x>✕</button></h2><div class="card"><b>${Z.name}</b>에서 몬스터 <b>${S.q.need}</b>마리 쓰러뜨리기<div class="prog" style="margin:8px 0"><i style="width:${100*Math.min(1,S.q.got/S.q.need)}%"></i></div>${Math.min(S.q.got,S.q.need)} / ${S.q.need}
   <p class="note">보상: 경험치, 아데나 ${(500+Z.lv*120).toLocaleString()}, 무기 강화 주문서, 축복받은 갑옷 강화 주문서</p></div>
   <div class="btns">${S.q.done?'<span class="lab">오늘은 다 했어요. 내일 또 와요!</span>':fin?'<button class="pri" data-ok>보상 받기</button>':`<button class="pri" data-go>🧭 ${Z.name}(으)로 자동 이동 + 자동 사냥</button>`}</div>`;
  box.onclick=e=>{const t=e.target.closest('[data-x],[data-ok],[data-go]');if(!t)return;if(t.dataset.x!=null){closeModal('#mBag');return;}
    if(t.dataset.go!=null){closeModal('#mBag');navTo(Z.x,Z.z,Z.name,true);return;}
    if(t.dataset.ok!=null){S.q.done=true;addExp(needExp(L.lv)*.35);S.coins+=500+Z.lv*120;give('scr_ew',1);give('scr_bea',1);msg('오늘의 사냥 완료!','#ffd24a');saveAll();linHUD();closeModal('#mBag');}};}
function openPolyShop(){const box=$('#bagBox');openModal('#mBag');const items=[['scr_poly','변신 주문서',500],['_sum','소환수 계약서 (무작위)',2500],['_mt','탈것 증서 (무작위)',3000],['_pet','펫 알 (무작위)',1500]];
  box.innerHTML=`<h2>🎭 마법사 별이<button class="x" data-x>✕</button></h2><div class="list">${items.map(([k,n,p])=>`<div class="li"><b style="flex:1">${n}</b>${p.toLocaleString()} 아데나 <button data-b="${k}" data-p="${p}">사기</button></div>`).join('')}</div><p class="note">소환수·탈것·펫 등급은 무작위예요.</p>`;
  box.onclick=e=>{const t=e.target.closest('[data-x],[data-b]');if(!t)return;if(t.dataset.x!=null){closeModal('#mBag');return;}const p=+t.dataset.p;if(S.coins<p){toast('아데나가 부족해요',900);return;}S.coins-=p;linHUD();const k=t.dataset.b;closeModal('#mBag');
    if(k==='scr_poly')give('scr_poly',1);else if(k==='_sum')offer({kind:'item',it:makeSummon(Math.floor(Math.random()*SUMMONS.length),randRar(.15))});else if(k==='_mt')offer({kind:'item',it:makeMount(Math.floor(Math.random()*MOUNTS.length),randRar(.15))});
    else duReady().then(U=>{DU._cache=U;const c=Object.keys(U).filter(k=>U[k].f==='critter');offer({kind:'item',it:makePet(pick(c.length?c:Object.keys(U)),randRar(.15))});});saveAll();};}
/* ---------- 사냥터 스폰 ---------- */
const ZM=new Map();let zoneT=0;
function walkSpot(Z){for(let k=0;k<20;k++){const a=rnd(0,PI*2),d=rnd(0,HW*1.6);const x=Z.x+Math.cos(a)*d,z=Z.z+Math.sin(a)*d;if(!isSolid(x,z)&&!isSolid(x+.5,z)&&!isSolid(x,z+.5))return{x,z};}return{x:Z.x,z:Z.z};}
function zoneTick(dt){if(MODE!=='world')return;zoneT-=dt;if(zoneT>0)return;zoneT=1.2;
  ZONES.slice(1).forEach(Z=>{const list=(ZM.get(Z.id)||[]).filter(m=>mobs.includes(m)&&!m.dead);ZM.set(Z.id,list);if(Math.hypot(P.pos.x-Z.x,P.pos.z-Z.z)>60)return;
    if(list.length<Z.n&&Math.random()<.7){const s=walkSpot(Z);spawnMob(pick(Z.mobs),s.x,s.z,{level:Z.lv}).then(m=>{if(m){m.home=Z;list.push(m);pfx('spawn/poof',new V3(s.x,.05,s.z),{scale:.7});}});}
    if(Z.boss){Z.bt=(Z.bt==null?60:Z.bt)-1.2;if(Z.bt<=0&&!Z.bm){Z.bt=300;const s=walkSpot(Z);spawnMob(Z.boss,s.x,s.z,{level:Z.lv+5}).then(m=>{if(m){m.home=Z;Z.bm=m;msg(`⚠ 필드 보스 <b>${m.d.name}</b> 출현 · ${Z.name}`,'#ff8a8a');toast(`⚠ ${Z.name}에 ${m.d.name} 출현!`,2200);}});}if(Z.bm&&Z.bm.dead)Z.bm=null;}});
  // 집에서 너무 멀어지면 돌아가기
  mobs.forEach(m=>{if(m.home&&!m.dead&&Math.hypot(m.pos.x-m.home.x,m.pos.z-m.home.z)>HW*4){m.pos.set(m.home.x,0,m.home.z);m.hp=m.max;}});}
function inZone(){let best=null;ZONES.forEach(Z=>{if(Z.x==null)return;const d=Math.hypot(P.pos.x-Z.x,P.pos.z-Z.z);if(d<HW*(Z.rad+.5)&&(!best||d<best.d))best={Z,d};});return best&&best.Z;}
/* ---------- 길찾기 · 자동 이동 ---------- */
const NAV={path:null,i:0,name:'',hunt:false};
function findPath(sx,sz,tx,tz){const N=MAP.N,H=N/2,G=2,GN=Math.ceil(N/G);const blocked=(gi,gj)=>{for(let a=0;a<G;a++)for(let b=0;b<G;b++){const i=gi*G+a,j=gj*G+b;if(i>=N||j>=N||MAP.solid[j*N+i])return true;}return false;};
  const s=[Math.floor((sx+H)/G),Math.floor((sz+H)/G)],t=[Math.floor((tx+H)/G),Math.floor((tz+H)/G)];
  // 목표가 막혀 있으면 가까운 빈칸
  if(blocked(t[0],t[1])){let ok=false;for(let r=1;r<8&&!ok;r++)for(let a=-r;a<=r&&!ok;a++)for(let b=-r;b<=r&&!ok;b++)if(!blocked(t[0]+a,t[1]+b)){t[0]+=a;t[1]+=b;ok=true;}}
  const key=(i,j)=>j*GN+i;const g=new Float32Array(GN*GN).fill(1e9),from=new Int32Array(GN*GN).fill(-1),closed=new Uint8Array(GN*GN);const open=[[0,s[0],s[1]]];g[key(s[0],s[1])]=0;
  const hf=(i,j)=>Math.hypot(i-t[0],j-t[1]);let it=0;
  while(open.length&&it++<40000){let bi=0;for(let k=1;k<open.length;k++)if(open[k][0]<open[bi][0])bi=k;const [,i,j]=open.splice(bi,1)[0];const k0=key(i,j);if(closed[k0])continue;closed[k0]=1;
    if(i===t[0]&&j===t[1]){const out=[];let k=k0;while(k>=0){out.push([(k%GN)*G-H+G/2,Math.floor(k/GN)*G-H+G/2]);k=from[k];}return out.reverse();}
    for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const ni=i+di,nj=j+dj;if(ni<0||nj<0||ni>=GN||nj>=GN)continue;if(blocked(ni,nj))continue;if(di&&dj&&(blocked(i+di,j)||blocked(i,j+dj)))continue;
      const k=key(ni,nj);const ng=g[k0]+(di&&dj?1.414:1);if(ng<g[k]){g[k]=ng;from[k]=k0;open.push([ng+hf(ni,nj),ni,nj]);}}}
  return null;}
function navTo(x,z,name,hunt){if(MODE!=='world'){toast('필드에서만 자동 이동할 수 있어요',1200);return;}const p=findPath(P.pos.x,P.pos.z,x,z);if(!p){toast('갈 수 있는 길이 없어요',1000);return;}
  NAV.path=p;NAV.i=0;NAV.name=name;NAV.hunt=!!hunt;AUTO.on=false;buildPad();msg(`🧭 ${name}(으)로 자동 이동`,'#9fd4ff');if(S.eq.mount&&!KP.riding)setRide(true);navUI();}
function navCancel(){NAV.path=null;navUI();}
function navDir(){if(!NAV.path)return null;let w=NAV.path[NAV.i];while(w&&Math.hypot(w[0]-P.pos.x,w[1]-P.pos.z)<1.1){NAV.i++;w=NAV.path[NAV.i];}
  if(!w){const h=NAV.hunt,n=NAV.name;NAV.path=null;navUI();msg(`${n} 도착`,'#9fd4ff');if(h){if(KP.riding)setRide(false);AUTO.on=true;buildPad();}return null;}return{x:w[0]-P.pos.x,z:w[1]-P.pos.z};}
function navUI(){const e=$('#navB');if(!e)return;e.hidden=!NAV.path;if(NAV.path)e.innerHTML=`🧭 ${esc(NAV.name)} 자동 이동 중 <b>✕</b>`;}
/* ---------- 월드맵 ---------- */
let MINI=null;
function worldMiniCache(){const N=MAP.N,c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d');g.fillStyle='#4f8a3a';g.fillRect(0,0,N,N);const H=N/2;
  (WORLD||[]).forEach(t=>{const p=hexPos(t.c,t.r);g.fillStyle=t.k==='water'?'#3a8ad0':t.build?'#c9a24a':t.solid?'#6a6a5a':t.tree?'#2f6a2a':'#5f9a46';g.beginPath();for(let k=0;k<6;k++){const a=PI/6+k*PI/3;g.lineTo(p.x+H+Math.cos(a)*WS*1.16,p.z+H+Math.sin(a)*WS*1.16);}g.fill();});
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const h=hexAt(i-H,j-H);if(h.c<0||h.r<0||h.c>=WC||h.r>=WR){g.fillStyle='#0a0c12';g.fillRect(i,j,1,1);}}
  MINI=c;}
function worldMini(){const c=$('#lmMap');if(!c||!MINI)return;const g=c.getContext('2d'),W=c.width,N=MAP.N,H=N/2;const view=70;const sx=P.pos.x+H-view/2,sz=P.pos.z+H-view/2;g.clearRect(0,0,W,W);g.drawImage(MINI,sx,sz,view,view,0,0,W,W);const s=W/view;
  const dot=(x,z,col,r)=>{const px=(x+H-sx)*s,pz=(z+H-sz)*s;if(px<0||pz<0||px>W||pz>W)return;g.fillStyle=col;g.beginPath();g.arc(px,pz,r,0,7);g.fill();};
  mobs.forEach(m=>{if(!m.dead)dot(m.pos.x,m.pos.z,m.boss?'#c07bff':'#ff4a4a',m.boss?4:2);});drops.forEach(d=>dot(d.g.position.x,d.g.position.z,'#ffd24a',2));NPCA.forEach(o=>dot(o.x,o.z,'#7affb0',3));PORTALS.forEach(P2=>dot(P2.x,P2.z,'#4aa3ff',4));
  if(NAV.path){g.strokeStyle='rgba(159,212,255,.9)';g.lineWidth=2;g.beginPath();NAV.path.slice(NAV.i).forEach(([x,z],k)=>{const px=(x+H-sx)*s,pz=(z+H-sz)*s;k?g.lineTo(px,pz):g.moveTo(px,pz);});g.stroke();}
  g.save();g.translate(W/2,W/2);g.rotate(-P.face+PI);g.fillStyle='#fff';g.beginPath();g.moveTo(0,-6);g.lineTo(4.5,4.5);g.lineTo(-4.5,4.5);g.fill();g.restore();const Z=inZone();$('#lmMapT').textContent=Z?Z.name+(Z.lv?' (Lv.'+Z.lv+'~)':''):'필드';}
function openWorldMap(){if(MODE!=='world'){toast('필드에서 열 수 있어요',900);return;}const box=$('#bagBox');openModal('#mBag');const N=MAP.N,H=N/2;
  box.innerHTML=`<h2>🗺 월드맵<button class="x" data-x>✕</button></h2><canvas id="wmC" width="${N}" height="${N}" style="width:100%;max-width:520px;aspect-ratio:1;border-radius:10px;image-rendering:pixelated;display:block;margin:0 auto;cursor:crosshair"></canvas>
   <p class="note">지도를 누르면 그곳으로 자동 이동해요. 아래 목록을 누르면 이동한 뒤 자동 사냥까지 해요.</p>
   <div class="list">${ZONES.map((Z,i)=>`<div class="li" data-z="${i}"><span class="dot" style="background:${Z.col}"></span><b>${Z.name}</b><span class="r">${Z.lv?'Lv.'+Z.lv+'~ · 자동 사냥':'NPC · 상점 · 공방'}${Z.boss?' · 👑 필드 보스':''}</span></div>`).join('')}
   ${PORTALS.map((P2,i)=>`<div class="li" data-p="${i}"><span class="dot" style="background:#4aa3ff"></span><b>${P2.name}</b><span class="r">던전 (끝없는 층)</span></div>`).join('')}</div>`;
  const cv=$('#wmC'),g=cv.getContext('2d');g.drawImage(MINI,0,0);g.font='bold 7px sans-serif';g.textAlign='center';
  ZONES.forEach(Z=>{g.fillStyle=Z.col;g.beginPath();g.arc(Z.x+H,Z.z+H,4,0,7);g.fill();g.fillStyle='#fff';g.strokeStyle='#000';g.lineWidth=2;g.strokeText(Z.name,Z.x+H,Z.z+H-6);g.fillText(Z.name,Z.x+H,Z.z+H-6);});
  PORTALS.forEach(P2=>{g.fillStyle='#4aa3ff';g.beginPath();g.arc(P2.x+H,P2.z+H,4,0,7);g.fill();g.fillStyle='#cfe8ff';g.strokeText(P2.name,P2.x+H,P2.z+H-6);g.fillText(P2.name,P2.x+H,P2.z+H-6);});
  g.fillStyle='#fff';g.beginPath();g.arc(P.pos.x+H,P.pos.z+H,3,0,7);g.fill();
  cv.onclick=e=>{const r=cv.getBoundingClientRect();const x=(e.clientX-r.left)/r.width*N-H,z=(e.clientY-r.top)/r.height*N-H;closeModal('#mBag');navTo(x,z,'지도에서 고른 곳',false);};
  box.onclick=e=>{const t=e.target.closest('[data-x],[data-z],[data-p]');if(!t)return;closeModal('#mBag');if(t.dataset.z!=null){const Z=ZONES[+t.dataset.z];navTo(Z.x,Z.z+(Z.id==='town'?2.5:0),Z.name,!!Z.lv);}else if(t.dataset.p!=null){const P2=PORTALS[+t.dataset.p];navTo(P2.x,P2.z,P2.name,false);}};}
/* ---------- 필드 들어가기 ---------- */
async function goWorld(at){hideStart();$('#mOver').hidden=true;P.dead=false;P.hp=P.max;updHP();paused=false;clearField();MODE='world';S.stage=0;await buildWorld();
  const Z=ZONES[0];const p=at||(S.wpos&&!at?S.wpos:{x:Z.x,z:Z.z+4});P.pos.set(p.x,0,p.z);if(isSolid(P.pos.x,P.pos.z))P.pos.set(Z.x,0,Z.z+4);P.face=PI;
  cam.position.set(P.pos.x,12,P.pos.z+11);$('#waveT').textContent='';$('#killT').textContent='';toast('🌍 정도 대륙',1400);}
function worldTick(dt){if(MODE!=='world')return;zoneTick(dt);npcTick(dt);
  PORTALS.forEach(P2=>{if(Math.hypot(P.pos.x-P2.x,P.pos.z-P2.z)<1.6&&!P.dead){S.wpos={x:P2.x,z:P2.z+3};saveAll();navCancel();enterDungeon(P2);}});
  if(Math.random()<.05){S.wpos={x:P.pos.x,z:P.pos.z};}}
async function enterDungeon(P2){MODE='play';const keep=DB.stage.themes;DB.stage.themes=[P2.th];await startStage(Math.max(1,Math.floor(L.lv/3)+1));DB.stage.themes=keep;msg(P2.name+' 입장 · 귀환 주문서로 마을에 돌아가요','#9fd4ff');}

const _dieW=die;die=function(){const w=MODE==='world';_dieW();if(w)setTimeout(()=>{$('#mOver').hidden=true;goWorld({x:ZONES[0].x,z:ZONES[0].z+4});msg('마을에서 다시 일어났어요','#ffb0b0');},2600);};
document.addEventListener('keydown',e=>{if(e.target.matches('input,select,textarea'))return;if(e.key==='m'||e.key==='ㅡ')openWorldMap();});
$('#lmMapW').onclick=()=>openWorldMap();$('#navB').onclick=()=>navCancel();
