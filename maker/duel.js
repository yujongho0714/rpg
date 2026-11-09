/* 정도 게임 메이커 — 변신 시스템 · 듀얼리스트 유닛 (OpenDuelyst, CC0) · 자동 사냥 */
'use strict';
const FACTION={f1:'라이온나르',f2:'송하이',f3:'베트루안',f4:'아비살',f5:'마구스',f6:'반아르',neutral:'중립',boss:'보스',critter:'동물'};
let DU=null;function duReady(){return DU||(DU=fetch('du/units.json').then(r=>r.json()));}
const DUPX=.034;
/* ---------- 스프라이트 배우 (대기·달리기·공격·맞음·쓰러짐) ---------- */
async function makeActor(uid,scale=1){const U=(await duReady())[uid];if(!U)return null;const img=await load('du/'+uid+'.png');
  const t=new THREE.Texture(img);t.magFilter=t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;t.encoding=THREE.sRGBEncoding;t.needsUpdate=true;
  const mat=new THREE.SpriteMaterial({map:t,transparent:true,alphaTest:.3,depthWrite:true});const sp=new THREE.Sprite(mat);
  const fl=new THREE.SpriteMaterial({map:t,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:0});const sp2=new THREE.Sprite(fl);
  const [w,h]=U.s;const k=DUPX*scale;sp.scale.set(w*k,h*k,1);sp2.scale.copy(sp.scale);sp.center.set(.5,1-U.b);sp2.center.copy(sp.center);
  const g=new THREE.Group();g.add(sp);g.add(sp2);
  const sh=new THREE.Mesh(new THREE.CircleGeometry(.45*scale*Math.max(1,w/100),16),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.35,depthWrite:false}));sh.rotation.x=-PI/2;sh.position.y=.02;g.add(sh);
  const A={uid,U,g,sp,sp2,t,img,state:'idle',f:0,ft:0,fps:12,flip:false,once:false,done:false,flashT:0,height:(U.b-U.t)*h*k};setFrame(A,U.a.idle[0]);return A;}
function setFrame(A,r){const [x,y,w,h]=r,W=A.img.width,H=A.img.height;A.t.repeat.set((A.flip?-1:1)*w/W,h/H);A.t.offset.set(A.flip?(x+w)/W:x/W,1-(y+h)/H);}
function actPlay(A,st,o={}){if(!A)return;if(A.state===st&&!o.restart)return;if(A.state==='death'&&st!=='idle'&&!o.force)return;A.state=st;A.f=0;A.ft=0;A.done=false;A.once=!!o.once;
  const n=(A.U.a[st]||A.U.a.idle).length;A.fps=o.dur?clamp(n/o.dur,6,40):(st==='run'?14:st==='attack'?16:12);}
function actTick(A,dt){if(!A)return;const fr=A.U.a[A.state]||A.U.a.idle;A.ft+=dt*A.fps;while(A.ft>=1){A.ft-=1;A.f++;if(A.f>=fr.length){if(A.once||A.state==='death'){A.f=fr.length-1;A.done=true;}else A.f=0;}}
  setFrame(A,fr[Math.min(A.f,fr.length-1)]);if(A.flashT>0){A.flashT-=dt;A.sp2.material.opacity=Math.min(1,A.flashT*12);}else A.sp2.material.opacity=0;
  if(A.done&&A.once&&A.state!=='death')actPlay(A,'idle');}
function actFace(A,dirx){if(!A)return;if(Math.abs(dirx)>.05)A.flip=dirx<0;}
/* ---------- 변신 카드 ---------- */
function hashN(s){let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))|0;return Math.abs(h);}
function polyRar(uid,U){if(U.f==='boss')return['M','O'][hashN(uid)%2];if(uid.endsWith('_general')||/general/.test(uid))return'L';return['N','N','R','R','E','U','L'][hashN(uid)%7];}
function makePoly(uid,rar){const U=DU&&DU._cache&&DU._cache[uid];const r=rar||'R';const R=RAR[r];
  return{id:'pc'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),slot:'poly',u:uid,rar:r,name:(U?(/general/i.test(U.n)?FACTION[U.f]+' '+U.n.replace(/general/i,'장군').trim():U.n):uid)+' 변신',
    patk:Math.round(R.i*6+4),aspd:+(1+R.i*.05).toFixed(2),mspd:+(1+R.i*.04).toFixed(2),php:R.i*25};}
SLOT_KO.poly='변신';
/* 능력치에 변신 보너스 더하기 */
const _stats0=stats;stats=function(){const s=_stats0();const pc=S.polyOn&&S.eq.poly;if(pc){s.atk=Math.round(s.atk*(1+pc.patk/100));s.kick=Math.round(s.kick*(1+pc.patk/100));s.max+=pc.php;}return s;};
/* ---------- 플레이어 변신 ---------- */
const POLY={A:null,uid:null};
async function applyPoly(){const pc=S.polyOn&&S.eq.poly;if(POLY.A&&(!pc||pc.u!==POLY.uid)){scene.remove(POLY.A.g);POLY.A=null;POLY.uid=null;}
  if(pc&&!POLY.A){const a=await makeActor(pc.u,1.15);if(a){POLY.A=a;POLY.uid=pc.u;scene.add(a.g);pfx('arcane/mana-burst',P.pos.clone().setY(.05),{scale:1.1});sfx('Magic1',.4,1.2);}}
  P.rig.root.visible=!POLY.A;updStats();buildPad();}
function polyTick(dt){const A=POLY.A;if(!A)return;P.rig.root.visible=false;A.g.position.set(P.pos.x,0,P.pos.z);
  const sx=Math.sin(P.face);actFace(A,sx);if(!P.dead&&A.state==='death')actPlay(A,'idle',{force:true});
  if(P.dead)actPlay(A,'death');else if(P.act){if(!P._polyAct||P._polyAct!==P.act){P._polyAct=P.act;const cast=['magic','ult'].includes(P.act.sk.cat)&&A.U.a.cast;actPlay(A,cast?'cast':'attack',{once:true,restart:true,dur:P.act.dur});}}
  else if(A.state==='attack'||A.state==='cast'){if(A.done)actPlay(A,'idle');}
  else if(P._hurtT>0)actPlay(A,'hit',{once:true});else actPlay(A,inputDir()?'run':'idle');
  if(P._hurtT>0)P._hurtT-=dt;A.g.visible=!(P.inv>0&&!P.act&&Math.floor(performance.now()/60)%2);actTick(A,dt);}
const _hurtP0=hurtPlayer;hurtPlayer=function(v,dir){const hp=P.hp;_hurtP0(v,dir);if(P.hp<hp&&POLY.A){POLY.A.flashT=.1;P._hurtT=.25;}};
// 공격 속도 · 이동 속도
const _useSkill0=useSkill;useSkill=function(id,slot){const pc=S.polyOn&&S.eq.poly;const sk=SK[id];if(pc&&sk&&!sk._fast){const s0=sk.spd;sk.spd=(s0||1)*pc.aspd;const r=_useSkill0(id,slot);sk.spd=s0;if(!s0)delete sk.spd;return r;}return _useSkill0(id,slot);};
function polySpeed(){const pc=S.polyOn&&S.eq.poly;return pc?pc.mspd:1;}
/* ---------- 듀얼리스트 몬스터 ---------- */
let DUPOOL=null;async function duPool(kind){const U=await duReady();if(!DUPOOL){DUPOOL={unit:[],boss:[]};Object.keys(U).forEach(k=>{if(k[0]==='_')return;const f=U[k].f;if(f==='boss')DUPOOL.boss.push(k);else if(f!=='critter'&&!/general/.test(k))DUPOOL.unit.push(k);});}return DUPOOL[kind]||DUPOOL.unit;}
async function mkDuelMob(d,o){const pool=await duPool(d.pool||'unit');const uid=o.unit||pick(pool);const A=await makeActor(uid,d.pool==='boss'?1.6:1.05);if(!A)return null;A.g.userData.actor=A;return A.g;}
function duelMobAnim(m,dt){const A=m.obj.userData.actor;if(!A)return;const moved=m._lx!=null?Math.hypot(m.pos.x-m._lx,m.pos.z-m._lz)/Math.max(dt,1e-4):0;m._lx=m.pos.x;m._lz=m.pos.z;
  actFace(A,P.pos.x-m.pos.x);if(m.dead)actPlay(A,'death',{force:true});else if(m.wind>0&&!m._atk){m._atk=1;actPlay(A,'attack',{once:true,restart:true,dur:Math.max(.35,m.wind+.25)});}
  else if(m.wind<=0)m._atk=0;if(!m.dead&&m.flashT>0&&!m._fl){m._fl=1;A.flashT=.1;if(A.state!=='attack')actPlay(A,'hit',{once:true,restart:true});}if(m.flashT<=0)m._fl=0;
  if(!m.dead&&A.state!=='attack'&&A.state!=='hit')actPlay(A,moved>.4?'run':'idle');actTick(A,dt);m.obj.rotation.set(0,0,0);if(m.dead)m.obj.position.y=Math.max(0,m.obj.position.y);}
MOBS.push({id:'d_fighter',name:'환영 전사',model:'duel',hp:38,atk:11,spd:2.3,ai:'melee'},{id:'d_rusher',name:'환영 돌격병',model:'duel',hp:30,atk:12,spd:2.6,ai:'charge'},
  {id:'d_caster',name:'환영 술사',model:'duel',hp:26,atk:10,spd:2,ai:'ranged'},{id:'d_blinker',name:'환영 암살자',model:'duel',hp:32,atk:13,spd:2.4,ai:'blink'});
BOSSES.push({id:'d_boss',name:'환영 군주',model:'duel',pool:'boss',hp:1600,atk:27,spd:1.8,ai:'melee',scale:1});
THEMES.duel=Object.assign({},THEMES.end,{name:'환영 전장',fog:0x140c22,light:0xffe6c0,torch:0xffa94a,mobs:['d_fighter','d_rusher','d_caster','d_blinker'],boss:['d_boss']});
/* ---------- 자동 사냥 (리니지라이크) ---------- */
const AUTO={on:false,t:0};
function autoTick(dt){if(!AUTO.on||P.dead||paused||MODE==='idle')return;AUTO.t-=dt;
  const tg=mobs.filter(m=>!m.dead&&!m.dummy).sort((a,b)=>a.pos.distanceTo(P.pos)-b.pos.distanceTo(P.pos))[0];
  const drop=drops[0];if(!tg&&drop){const to=drop.g.position.clone().setY(0).sub(P.pos);AUTO.dir={x:to.x,z:to.z};return;}
  if(!tg){if(stageClear&&portal){const to=portal.position.clone().sub(P.pos);AUTO.dir={x:to.x,z:to.z};}else AUTO.dir=null;return;}
  const d=tg.pos.distanceTo(P.pos);if(d>2+tg.radius){const to=tg.pos.clone().sub(P.pos);AUTO.dir={x:to.x,z:to.z};return;}AUTO.dir=null;
  if(P.act||AUTO.t>0)return;AUTO.t=.12;faceTo(tg);
  for(let i=0;i<4;i++){const id=S.slots[i];if(id&&owns(id)&&!(P.cd['UIOP'[i]]>0)&&SK[id]&&(!SK[id].wc||(S.eq.weapon&&SK[id].wc.includes(S.eq.weapon.wc)))){press('UIOP'[i]);if(P.act)return;}}
  press(S.eq.weapon&&Math.random()<.5?'K':'J');}
/* ---------- 변신 도감 (메이커 탭) ---------- */
let polySel=null,polyF='',polyQ='',polyPrev=null;
function thumbStyle(U){const i=U.i,c=32;return`background:url(du/_thumbs.png) -${(i%c)*48}px -${Math.floor(i/c)*48}px/${c*48}px auto no-repeat;image-rendering:pixelated`;}
async function tabPoly(el){el.innerHTML='<p class="note">유닛 목록 불러오는 중…</p>';const U=await duReady();DU._cache=U;
  const ids=Object.keys(U).filter(k=>(!polyF||U[k].f===polyF)&&(!polyQ||U[k].n.toLowerCase().includes(polyQ.toLowerCase())));
  const pc=S.eq.poly;
  el.innerHTML=`<p class="note">듀얼리스트 유닛 ${Object.keys(U).length}개로 변신할 수 있어요. 변신하면 대기·달리기·공격·맞음·쓰러짐 모션이 그 유닛 것으로 바뀌고, 등급에 따라 공격력·공격 속도·이동 속도·체력이 올라가요.</p>
  <div class="card">${pc?`지금 변신 카드: <b style="color:${RAR[pc.rar].col}">${esc(pc.name)}</b> · ${S.polyOn?'변신 중':'변신 해제됨'} <button id="pTog">${S.polyOn?'변신 풀기':'다시 변신'}</button>`:'변신 카드가 없어요. 몬스터가 떨어뜨리거나, 운영자는 아래에서 바로 받을 수 있어요.'}</div>
  <div class="card" id="pv" ${polySel?'':'hidden'} style="margin-top:8px"><div class="row" style="align-items:flex-start"><canvas id="pvC" width="140" height="140" style="background:#0f131a;border-radius:10px;width:140px;height:140px;image-rendering:pixelated"></canvas>
    <div style="flex:1"><h3 id="pvN" style="margin:0 0 4px;font-weight:400"></h3><div class="lab" id="pvF"></div><div class="row">${['idle','run','attack','hit','death','cast'].map(a=>`<button data-pa="${a}" style="padding:4px 8px;font-size:13px">${{idle:'대기',run:'달리기',attack:'공격',hit:'맞음',death:'쓰러짐',cast:'시전'}[a]}</button>`).join('')}</div></div></div>
    <div class="f"><label>등급</label><select id="pvR">${RARS.map(([r])=>`<option value="${r}">${RAR[r].name}</option>`).join('')}</select></div>
    <div class="row"><button class="pri" id="pvGo">🎭 지금 변신</button><button id="pvCard">변신 카드 받기</button><button id="pvMob">몬스터로 소환</button><button id="pvBoss">보스로 소환</button></div></div>
  <div class="row"><input id="pq" placeholder="이름 찾기 (영어)" value="${esc(polyQ)}" style="flex:1"><select id="pf"><option value="">모든 진영</option>${Object.keys(FACTION).map(f=>`<option value="${f}" ${f===polyF?'selected':''}>${FACTION[f]}</option>`).join('')}</select></div>
  <div class="lab">${ids.length}개</div><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(56px,1fr))">${ids.map(k=>`<div class="it" data-u="${k}" title="${esc(U[k].n)}" style="${k===polySel?'border-color:var(--ac)':''}"><div style="width:48px;height:48px;${thumbStyle(U[k])}"></div></div>`).join('')}</div>`;
  const q=s=>el.querySelector(s);
  q('#pq').onchange=e=>{polyQ=e.target.value.trim();renderTab();};q('#pf').onchange=e=>{polyF=e.target.value;renderTab();};
  if(q('#pTog'))q('#pTog').onclick=async()=>{S.polyOn=!S.polyOn;saveAll();await applyPoly();renderTab();};
  el.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>{polySel=b.dataset.u;renderTab();});
  if(polySel&&U[polySel]){const u=U[polySel];q('#pvN').textContent=u.n;q('#pvF').textContent=FACTION[u.f]+' · 모션: '+Object.keys(u.a).map(a=>a+' '+u.a[a].length).join(', ');q('#pvR').value=polyRar(polySel,u);
    const A=await makeActor(polySel,1);polyPrev=A;const cv=q('#pvC'),g=cv.getContext('2d');g.imageSmoothingEnabled=false;let st='idle',f=0,last=performance.now();
    const draw=now=>{if(polyPrev!==A||!cv.isConnected)return;requestAnimationFrame(draw);const fr=u.a[st]||u.a.idle;if(now-last>80){last=now;f=(f+1)%fr.length;}const [x,y,w,h]=fr[f];g.clearRect(0,0,140,140);const s=Math.min(140/w,140/h);g.drawImage(A.img,x,y,w,h,(140-w*s)/2,(140-h*s)/2,w*s,h*s);};requestAnimationFrame(draw);
    el.querySelectorAll('[data-pa]').forEach(b=>b.onclick=()=>{st=b.dataset.pa;f=0;});
    q('#pvGo').onclick=async()=>{await ensureTrain();S.eq.poly=makePoly(polySel,q('#pvR').value);S.polyOn=true;saveAll();await applyPoly();renderTab();toast('🎭 '+u.n+'(으)로 변신!',1400);};
    q('#pvCard').onclick=()=>offer({kind:'item',it:makePoly(polySel,q('#pvR').value)});
    q('#pvMob').onclick=async()=>{await ensureTrain();const p=dirPos('front',3.4);spawnMob('d_fighter',p.x,p.z,{unit:polySel});};
    q('#pvBoss').onclick=async()=>{await ensureTrain();const p=dirPos('front',5);const m=await spawnMob('d_boss',p.x,p.z,{unit:polySel});};}}
