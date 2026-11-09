/* 정도 게임 메이커 — 화면 · 조작 · 장착 창 · 메이커 */
'use strict';
WCLASS.gun='총';SLOT_KO.shield='방패';
const ROLL={id:'_roll',name:'구르기',rar:'N',cat:'acro',mot:'k:roll',dash:10,dashT:[0,.85],inv:true,hits:[],cd:.7,nodrop:true};
function refreshSK(){SK=allSkills();SK._roll=ROLL;}
refreshSK();
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const rarTag=r=>`<span class="rar" style="background:${RAR[r].col}">${RAR[r].name}</span>`;
const WCOMBO={sword:['w_cut1','w_cut2','w_chop'],axe:['w_cut1','w_chop','w_sweep'],blunt:['w_chop','w_sweep'],spear:['w_thrust','w_thrust','w_sweep'],rapier:['w_thrust','w_thrust','w_flurry'],staff:['w_cast']};

/* ================= 운영자 비밀번호 ================= */
const hash=s=>{let h=5381;for(const ch of String(s))h=((h<<5)+h+ch.codePointAt(0))|0;return String(h>>>0);};
const PW=hash('jungdo2');
const isAdmin=()=>{try{return sessionStorage.getItem('jd_maker_admin')==='1';}catch(e){return false;}};
S.op=isAdmin();
function needAdmin(then){if(isAdmin()){then();return;}const m=$('#mPw');m.hidden=false;$('#pwIn').value='';setTimeout(()=>$('#pwIn').focus(),50);
  const ok=()=>{if(hash($('#pwIn').value)===PW){try{sessionStorage.setItem('jd_maker_admin','1');}catch(e){}S.op=true;m.hidden=true;toast('🛠 운영자 모드 켜짐 · 모든 스킬을 써볼 수 있어요',1800);buildPad();then();}else toast('비밀번호가 달라요',1200);};
  $('#pwOk').onclick=ok;$('#pwIn').onkeydown=e=>{if(e.key==='Enter')ok();};$('#pwNo').onclick=()=>m.hidden=true;}

/* ================= 조작 ================= */
const keys={};const joy={x:0,z:0};
addEventListener('keydown',e=>{if(e.target.matches('input,select,textarea'))return;const k=e.key.length===1?e.key.toLowerCase():e.key;keys[k]=true;
  if(e.repeat)return;const map={j:'J',k:'K',l:'L',u:'U',i:'I',o:'O',p:'P',' ':'SP'};const ko={ㅓ:'J',ㅏ:'K',ㅣ:'L',ㅕ:'U',ㅑ:'I',ㅐ:'O',ㅔ:'P'};const a=map[k]||ko[k];if(a){e.preventDefault();press(a);}
  if(k==='Escape'){closeModals();}});
addEventListener('keyup',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;keys[k]=false;if(k==='Shift')keys.Shift=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
(function(){const J=$('#joy'),K=J.querySelector('i');let id=null,cx=0,cy=0;
  J.addEventListener('pointerdown',e=>{id=e.pointerId;J.setPointerCapture(id);const r=J.getBoundingClientRect();cx=r.left+r.width/2;cy=r.top+r.height/2;mv(e);});
  const mv=e=>{if(e.pointerId!==id)return;let dx=e.clientX-cx,dy=e.clientY-cy;const l=Math.hypot(dx,dy),m=50;if(l>m){dx*=m/l;dy*=m/l;}K.style.transform=`translate(${dx}px,${dy}px)`;joy.x=dx/m;joy.z=dy/m;};
  J.addEventListener('pointermove',mv);const up=e=>{if(e.pointerId!==id)return;id=null;joy.x=joy.z=0;K.style.transform='';};J.addEventListener('pointerup',up);J.addEventListener('pointercancel',up);
  // 예전 폰(포인터 이벤트 없음)은 터치 이벤트로
  if(!window.PointerEvent){const T=e=>{const t=e.changedTouches[0];return{pointerId:'t',clientX:t.clientX,clientY:t.clientY};};
    J.addEventListener('touchstart',e=>{e.preventDefault();id='t';const r=J.getBoundingClientRect();cx=r.left+r.width/2;cy=r.top+r.height/2;mv(T(e));},{passive:false});
    J.addEventListener('touchmove',e=>{e.preventDefault();mv(T(e));},{passive:false});J.addEventListener('touchend',e=>up({pointerId:'t'}));J.addEventListener('touchcancel',e=>up({pointerId:'t'}));
    $$('#pad').forEach(()=>{});}})();
// 폰에서 메이커가 열려 있을 때 게임 화면을 누르면 닫기
$('#game').addEventListener('pointerdown',()=>{if(innerWidth<=600)$('#maker').classList.remove('open');});
function inputDir(){let x=joy.x,z=joy.z;if(keys.a||keys.ArrowLeft||keys['ㅁ'])x-=1;if(keys.d||keys.ArrowRight||keys['ㅇ'])x+=1;if(keys.w||keys.ArrowUp||keys['ㅈ'])z-=1;if(keys.s||keys.ArrowDown||keys['ㄴ'])z+=1;const l=Math.hypot(x,z);if(l>.15)return{x:x/Math.max(1,l),z:z/Math.max(1,l),l:Math.min(1,l)};if(AUTO.on&&AUTO.dir){const q=Math.hypot(AUTO.dir.x,AUTO.dir.z);if(q>.2)return{x:AUTO.dir.x/q,z:AUTO.dir.z/q,l:1};}return null;}
function nextJ(){const list=S.combo.filter(id=>SK[id]);return list.length?list[P.combo%list.length]:'ap';}
function nextK(){const w=S.eq.weapon;if(!w)return['jireugi','bn_punch1'][P.wcombo%2];if(w.wc==='gun')return null;const l=WCOMBO[w.wc]||WCOMBO.sword;return l[P.wcombo%l.length];}
function press(a){if(paused||P.dead||MODE==='idle')return;
  if(a==='J'){const id=nextJ();if(useSkill(id,'J')){P.combo++;P.comboT=1.1;}}
  else if(a==='K'){const w=S.eq.weapon;if(w&&w.wc==='gun'){if((P.cd.K||0)>0||P.act)return;P.cd.K=.4;P.act={sk:{name:'사격',cat:'weapon',hits:[]},mo:{type:'k',m:KEYMOTION.shoot,dur:.3},t:0,dur:.3,hits:[],done:new Set(),fxDone:new Set()};fireGun();return;}
    const id=nextK();if(useSkill(id,'K')){P.wcombo++;P.wcomboT=1.1;}}
  else if(a==='L')fireBow();
  else if(a==='SP'){const d=inputDir();if(useSkill('_roll','SP')&&d)P.face=Math.atan2(d.x,d.z);}
  else if(a==='SH'){P.blockT=.6;}
  else if(a==='AU'){AUTO.on=!AUTO.on;toast(AUTO.on?'🤖 자동 사냥 켜짐':'자동 사냥 꺼짐',900);buildPad();}
  else if(a==='PO'){if(!S.eq.poly)return;S.polyOn=!S.polyOn;saveAll();applyPoly();toast(S.polyOn?'🎭 변신!':'변신을 풀었어요',900);}
  else{const i='UIOP'.indexOf(a);const id=S.slots[i];if(!id){toast('비어 있는 슬롯이에요. 🎒 가방에서 스킬을 넣어요',1300);return;}if(!owns(id)){toast('아직 없는 스킬이에요',1000);return;}useSkill(id,a);}}
function buildPad(){const pad=$('#pad');const B=(k,lab,em,nm)=>`<div class="sk" data-k="${k}"><b>${lab}</b><em>${em}</em><span class="nm">${esc(nm||'')}</span><i class="cd"></i></div>`;
  const s=i=>{const sk=SK[S.slots[i]];return sk?sk.name:'비어 있음';};const ic=i=>{const sk=SK[S.slots[i]];return sk?(CAT[sk.cat]||['✨'])[0]:'·';};
  pad.innerHTML=B('U','U',ic(0),s(0))+B('I','I',ic(1),s(1))+B('O','O',ic(2),s(2))+B('P','P',ic(3),s(3))+B('J','J','🦶','발차기')+B('K','K',S.eq.weapon?(S.eq.weapon.wc==='gun'?'🔫':'⚔'):'👊',S.eq.weapon?S.eq.weapon.name:'지르기')+B('L','L','🏹',S.eq.bow?BOWTYPES[S.eq.bow.shot][0]:'활 없음')+B('SP','Space','💨','구르기')+(S.eq.shield?B('SH','Shift','🛡','막기'):'')+B('AU','자동',AUTO.on?'🤖':'🤖',AUTO.on?'자동 ON':'자동 사냥')+(S.eq.poly?B('PO','변신','🎭',S.polyOn?'변신 풀기':'변신'):'');
  pad.querySelectorAll('.sk').forEach(el=>{if(!window.PointerEvent)el.addEventListener('touchstart',e=>{e.preventDefault();const k=el.dataset.k;if(k==='SH'){keys.Shift=true;return;}press(k);},{passive:false});el.addEventListener('pointerdown',e=>{e.preventDefault();const k=el.dataset.k;if(k==='SH'){keys.Shift=true;return;}press(k);});
    el.addEventListener('pointerup',()=>{if(el.dataset.k==='SH')keys.Shift=false;});el.addEventListener('pointerleave',()=>{if(el.dataset.k==='SH')keys.Shift=false;});});}
function padTick(){$$('#pad .sk').forEach(el=>{const k=el.dataset.k;let cd=0,max=1;
  if(k==='J'){const id=nextJ();cd=P.cd['J'+id]||0;max=(SK[id]||{}).cd||1;el.querySelector('.nm').textContent=(SK[id]||{}).name||'';}
  else if(k==='K'){const id=nextK();if(id){cd=P.cd['K'+id]||0;max=(SK[id]||{}).cd||1;}else{cd=P.cd.K||0;max=.4;}}
  else if(k==='L'){cd=P.cd.L||0;max=.8;}else if(k==='SP'){cd=P.cd.SP||0;max=.7;}
  else if('UIOP'.includes(k)){cd=P.cd[k]||0;max=(SK[S.slots['UIOP'.indexOf(k)]]||{}).cd||1;}
  el.querySelector('.cd').style.transform=`scaleY(${clamp(cd/max,0,1)})`;});}

/* ================= 플레이어 움직임 ================= */
function playerTick(dt){P.inv=Math.max(0,P.inv-dt);for(const k in P.cd)P.cd[k]=Math.max(0,P.cd[k]-dt);
  P.comboT-=dt;if(P.comboT<=0)P.combo=0;P.wcomboT-=dt;if(P.wcomboT<=0)P.wcombo=0;
  const armed=!!S.eq.weapon&&S.eq.weapon.wc!=='gun';P.blocking=!!(keys.Shift&&S.eq.shield&&!P.act);
  if(P.act){updateAct(dt);}
  else{const d=inputDir();if(d&&!P.dead){P.face=angLerp(P.face,Math.atan2(d.x,d.z),Math.min(1,dt*14));const sp=(P.blocking?2.2:5.4)*d.l*polySpeed();moveCircle(P.pos,d.x*sp*dt,d.z*sp*dt,.35);P.walk+=dt*11*d.l;}
    let p=d?walkPose(P.walk,armed):Object.assign({},armed?GW:G);if(!d){const b=Math.sin(performance.now()/500)*.04;p.torso=[b,p.torso[1],0];}
    if(P.blocking)p=Object.assign({},p,{uaL:[-1.5,0,-.4],laL:[-.3,0,0]});
    if(P.dead)p=Object.assign({},G,{hips:[-1.5,0,0]});pose(P.rig,p,P.dead?-.6:0);}
  P.rig.root.position.set(P.pos.x,0,P.pos.z);P.rig.root.rotation.y=P.face;
  P.rig.root.visible=!(P.inv>0&&!P.act&&Math.floor(performance.now()/60)%2);}

/* ================= 화면 갱신 ================= */
const camOff=new V3(0,10.5,9.8),camLook=new V3(),camVO={x:0,y:0};
function camTick(dt){const want=P.pos.clone().add(innerWidth<innerHeight?new V3(0,13,11):camOff);cam.position.lerp(want,Math.min(1,dt*6));camLook.lerp(new V3(P.pos.x,1,P.pos.z),Math.min(1,dt*8));
  cam.lookAt(camLook);if(shake>0){cam.position.x+=rnd(-1,1)*shake*.5;cam.position.y+=rnd(-1,1)*shake*.5;shake=Math.max(0,shake-dt*1.4);}
  // 메이커 창이 열려 있으면 캐릭터가 창에 가리지 않게 화면을 옮김
  const open=$('#maker').classList.contains('open');const mob=innerWidth<=600;const mw=$('#maker').offsetWidth,mh=$('#maker').offsetHeight;
  const tx=open&&!mob?mw/2:0,ty=open&&mob?-mh/2:0;camVO.x+=(tx-camVO.x)*Math.min(1,dt*8);camVO.y+=(ty-camVO.y)*Math.min(1,dt*8);
  if(Math.abs(camVO.x)>.5||Math.abs(camVO.y)>.5)cam.setViewOffset(innerWidth,innerHeight,camVO.x,camVO.y,innerWidth,innerHeight);else if(cam.view&&cam.view.enabled)cam.clearViewOffset();
  sun.position.set(P.pos.x+7,16,P.pos.z+9);sun.target.position.set(P.pos.x,0,P.pos.z);}
const _v=new V3();
function barsTick(){let boss=null;mobs.forEach(m=>{if(m.barH==null){const b=new THREE.Box3().setFromObject(m.obj);m.barH=b.max.y-m.obj.position.y+.25;}
  _v.copy(m.pos);_v.y=m.obj.position.y+m.barH;_v.project(cam);const vis=_v.z<1&&!m.dead;m.bar.style.display=vis&&(!m.boss)?'block':'none';
  m.bar.style.left=((_v.x+1)/2*innerWidth)+'px';m.bar.style.top=((1-_v.y)/2*innerHeight)+'px';
  if(m.dummy){const t=(m.label||'')+(m.dmgSum?' · '+Math.round(m.dmgSum):'');if(m.bar.textContent!==t)m.bar.textContent=t;if(!m.bar.classList.contains('dummy'))m.bar.classList.add('dummy');}
  else m.bar.firstChild.style.width=Math.max(0,100*m.hp/m.max)+'%';if(m.boss&&!m.dead)boss=m;});
  if(boss){$('#bossbar').hidden=false;$('#bossName').textContent=boss.d.name+' · Lv.'+Math.max(1,S.stage);$('#bossHp').style.width=(100*Math.max(0,boss.hp)/boss.max)+'%';}else $('#bossbar').hidden=true;}

/* ================= 비교 · 장착 창 ================= */
const TR={passive:false,dps:[],last:0};let prevPaused=false;
function openModal(id){if(!$(id).hidden)return;prevPaused=paused;if(MODE==='play')paused=true;$(id).hidden=false;}
function closeModal(id){$(id).hidden=true;if(!$$('.modal').some(m=>!m.hidden&&m.id!=='start'))paused=MODE==='idle'?true:false;}
function closeModals(){['#mOffer','#mBag','#mPw'].forEach(id=>{if(!$(id).hidden)closeModal(id);});}
function skillPower(sk){if(!sk)return 0;let p=(sk.hits||[]).reduce((a,h)=>a+(h.mul||1),0);if(sk.contact)p+=sk.contact.mul;if(sk.proj)p+=sk.proj.mul*(sk.proj.n||1);if(sk.strike)p+=sk.strike.mul*sk.strike.n*.6;return p*(sk.mul||1)*(RAR[sk.rar]||RAR.N).mul;}
function skillRange(sk){let r=0;(sk.hits||[]).forEach(h=>r=Math.max(r,h.range));if(sk.proj||sk.strike)r=Math.max(r,14);if(sk.contact)r=Math.max(r,(sk.dash||0)*.6);return r;}
const SHAPE_KO={cone:'앞쪽 부채꼴',circle:'주변 원형',line:'앞으로 일직선'};
function skillCard(sk,title){if(!sk)return`<div class="card"><div class="lab">${title||''}</div><h3 class="same">비어 있음</h3></div>`;const c=CAT[sk.cat]||['✨',''];
  const shapes=[...new Set((sk.hits||[]).map(h=>SHAPE_KO[h.shape]))].join(', ')||(sk.proj?'날아가는 탄':sk.strike?'적 위에 낙뢰':sk.contact?'몸통 박치기':'-');
  return`<div class="card" style="border-color:${RAR[sk.rar].col}"><div class="lab">${title||''}</div><h3>${c[0]} ${esc(sk.name)}</h3>${rarTag(sk.rar)}<span class="lab">${c[1]}${sk.wc?' · '+sk.wc.map(w=>WCLASS[w]).join('/'):''}</span>
    <div class="diff">위력 <b>${Math.round(skillPower(sk)*100)}</b> · 타격 ${(sk.hits||[]).length||1}번</div><div class="diff">재사용 ${sk.cd||0}초 · 범위 ${skillRange(sk).toFixed(1)}칸</div><div class="diff lab">${shapes}${sk.inv?' · 동작 중 무적':''}${sk.dash?' · 돌진':''}</div></div>`;}
function diffLine(lab,a,b,unit='',lowerBetter){if(a==null&&b==null)return'';a=a||0;b=b||0;const d=Math.round((b-a)*10)/10;const good=lowerBetter?d<0:d>0;
  return`<div class="diff">${lab}: ${Math.round(a*10)/10}${unit} → <b>${Math.round(b*10)/10}${unit}</b> <span class="${d===0?'same':good?'up':'dn'}">${d===0?'같음':(d>0?'+':'')+d+unit}</span></div>`;}
function itemIcon(it,cls='ico'){if(!it)return'';if(it.ic&&!it.img&&typeof ico==='function'){const sz=cls==='ico32'?32:44;return`<span class="${cls}" style="display:inline-flex;align-items:center;justify-content:center">${ico(it.ic,sz)}</span>`;}if(it.slot==='poly'){const U=DU&&DU._cache&&DU._cache[it.u];return U?`<div style="width:48px;height:48px;display:inline-block;vertical-align:middle;${thumbStyle(U)}"></div>`:'🎭';}if(it.slot==='dskin'){const d=DSKINS.find(x=>x.id===it.k)||DSKINS[0];return`<span class="dmg ${d.cls}" style="position:static;transform:none;animation:none;font-size:20px">${d.pre||''}77</span>`;}
  return`<img class="${cls}" src="${esc(it.img||srcOf(it.icon))}" alt="">`;}
function itemStats(it){if(!it)return'<div class="same">없음</div>';const L=[];if(it.atk)L.push((it.slot==='bow'?'활 공격력 ':'공격력 ')+it.atk);if(it.def)L.push('방어력 '+it.def);if(it.kick)L.push('발차기 +'+it.kick);if(it.reach)L.push('사거리 '+it.reach);
  if(it.wc)L.push('종류: '+WCLASS[it.wc]);if(it.shot)L.push('화살: '+BOWTYPES[it.shot][0]+' — '+BOWTYPES[it.shot][1]);if(it.elem)L.push(ELEM[it.elem][0]+' — '+ELEM[it.elem][1]);if(it.hp)L.push('최대 체력 +'+it.hp);if(it.mpx)L.push('최대 마나 +'+it.mpx);if(it.mreg)L.push('마나 회복 +'+it.mreg+'/초');if(it.dmg)L.push('추가 피해 +'+it.dmg);if(it.patk&&it.slot!=='poly')L.push('공격력 +'+it.patk+'%');if(it.en)L.push('강화 +'+it.en+(it.slot==='weapon'?' (공격력 +'+(it.en*2+(it.en>6?(it.en-6)*2:0))+')':' (방어 +'+it.en+')'));if(it.slot==='poly'){L.push('공격력 +'+it.patk+'%','공격 속도 ×'+it.aspd,'이동 속도 ×'+it.mspd,'체력 +'+it.php);const U=DU&&DU._cache&&DU._cache[it.u];if(U)L.push('진영: '+FACTION[U.f]);}return L.map(x=>`<div class="diff">${x}</div>`).join('');}
function itemCard(it,title){if(!it)return`<div class="card"><div class="lab">${title}</div><h3 class="same">없음</h3></div>`;return`<div class="card" style="border-color:${RAR[it.rar].col}"><div class="lab">${title}</div><div class="row" style="margin:0">${itemIcon(it)}<div><h3>${esc(nm(it))}</h3>${rarTag(it.rar)}</div></div>${itemStats(it)}</div>`;}
function slotOf(it){return it.slot;}
function equip(it,fromBag){const s=slotOf(it);const old=S.eq[s];if(fromBag){const i=S.bag.findIndex(x=>x.id===it.id);if(i>=0)S.bag.splice(i,1);}
  if(old)S.bag.push(old);S.eq[s]=it;if(s==='poly'){S.polyOn=true;applyPoly();}if(s==='dskin'){toast('데미지 스킨 장착: '+it.name,1200);}else refreshGear().then(buildPad);saveAll();buildPad();}
function offer(th,fromBag){const box=$('#offerBox');openModal('#mOffer');sfx('Bonus',.4);
  const close=()=>{closeModal('#mOffer');};
  if(th.kind==='skill'){const sk=SK[th.id];if(!sk){close();return;}const isNew=!S.owned.includes(sk.id);if(isNew)S.owned.push(sk.id);saveAll();
    const slotBtns=[0,1,2,3].map(i=>{const cur=SK[S.slots[i]];const dp=cur?Math.round((skillPower(sk)/Math.max(.01,skillPower(cur))-1)*100):null;const dc=cur?Math.round(((sk.cd||0)-(cur.cd||0))*10)/10:null;
      return`<button class="slotb" data-slot="${i}"><b>${'UIOP'[i]} 슬롯</b> · ${cur?esc(cur.name)+' '+`<span style="color:${RAR[cur.rar].col}">${RAR[cur.rar].name}</span>`:'<span class="same">비어 있음</span>'}<br>
        ${cur?`위력 <span class="${dp>0?'up':dp<0?'dn':'same'}">${dp>0?'+':''}${dp}%</span> · 재사용 <span class="${dc<0?'up':dc>0?'dn':'same'}">${dc>0?'+':''}${dc}초</span>`:'<span class="up">새로 넣기</span>'}</button>`;}).join('');
    box.innerHTML=`<h2>📜 스킬북 ${isNew?'<span class="up" style="font-size:15px">새 스킬!</span>':''}<button class="x" data-x>✕</button></h2>${skillCard(sk,'얻은 스킬')}
      <p class="note">어느 슬롯의 스킬과 바꿀까요? 바뀌는 점을 보고 골라요.</p><div class="slots">${slotBtns}</div>
      <div class="btns"><button data-j>J 연속기에 넣기</button><button data-x>가방에만 넣기</button></div>`;
    box.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.slot!=null){S.slots[+b.dataset.slot]=sk.id;saveAll();buildPad();toast(sk.name+' → '+'UIOP'[+b.dataset.slot]+' 슬롯',1200);close();}
      else if(b.dataset.j!=null){if(!S.combo.includes(sk.id)){S.combo.push(sk.id);if(S.combo.length>6)S.combo.shift();}saveAll();toast('J 연속기: '+S.combo.map(i=>(SK[i]||{}).name).join(' → '),1600);close();}
      else if(b.dataset.x!=null)close();};return;}
  const it=th.it;const s=slotOf(it);const cur=S.eq[s];
  if(s==='dskin'){const d=DSKINS.find(x=>x.id===it.k)||DSKINS[0];const c=cur&&DSKINS.find(x=>x.id===cur.k);
    box.innerHTML=`<h2>💥 데미지 스킨 ${rarTag(it.rar)}<button class="x" data-x>✕</button></h2><div class="cmp"><div><div class="lab">지금</div><div class="dsprev"><span class="dmg ${(c||DSKINS[0]).cls}">${(c||DSKINS[0]).pre||''}1234</span> <span class="dmg crit ${(c||DSKINS[0]).cls}">5678!</span></div><div class="note">${c?esc(c.name):'기본'}</div></div>
      <div><div class="lab">새 스킨</div><div class="dsprev"><span class="dmg ${d.cls}">${d.pre||''}1234</span> <span class="dmg crit ${d.cls}">5678!</span></div><div class="note">${esc(d.name)}</div></div></div>
      <p class="note">데미지 스킨은 모양만 바뀌고 피해량은 같아요.</p><div class="btns"><button data-bag>보관하기</button><button class="pri" data-eq>장착하기</button></div>`;}
  else{const st0=stats();
    let diffs='';if(s==='weapon'){diffs+=diffLine('공격력',cur?cur.atk:5,it.atk);diffs+=diffLine('사거리',cur?cur.reach:1.9,it.reach,'칸');if(cur&&cur.wc!==it.wc)diffs+=`<div class="diff">무기 종류: ${WCLASS[cur.wc]} → <b>${WCLASS[it.wc]}</b> <span class="lab">(K 공격과 무기 스킬이 바뀌어요)</span></div>`;}
    else if(s==='bow')diffs+=diffLine('활 공격력',cur?cur.atk:0,it.atk);
    else if(s==='poly'){diffs+=diffLine('공격력 보너스',cur?cur.patk:0,it.patk,'%');diffs+=diffLine('공격 속도',cur?cur.aspd:1,it.aspd,'배');diffs+=diffLine('이동 속도',cur?cur.mspd:1,it.mspd,'배');diffs+=diffLine('체력',cur?cur.php:0,it.php);}
    else{diffs+=diffLine('방어력',cur?cur.def:0,it.def);if(s==='boots')diffs+=diffLine('발차기',cur?cur.kick:0,it.kick);diffs+=diffLine('최대 체력',st0.max,st0.max+((it.def||0)-(cur?cur.def||0:0))*4);}
    if((cur&&cur.elem)!==it.elem)diffs+=`<div class="diff">속성: ${cur&&cur.elem?ELEM[cur.elem][0]:'없음'} → <b>${it.elem?ELEM[it.elem][0]:'없음'}</b></div>`;
    box.innerHTML=`<h2>${fromBag?'🎒':'✨'} ${SLOT_KO[s]} ${fromBag?'':'획득!'}<button class="x" data-x>✕</button></h2><div class="cmp">${itemCard(cur,'지금 장착 중')}${itemCard(it,fromBag?'가방':'새로 얻은 것')}</div>
      <h4 style="margin:12px 0 4px;color:var(--ac);font-weight:400">바뀌는 점</h4>${diffs||'<div class="same">같아요</div>'}
      <div class="btns"><button class="bad" data-sell>팔기 (+${(RAR[it.rar].i+1)*3}🪙)</button>${fromBag?'':'<button data-bag>가방에 넣기</button>'}<button class="pri" data-eq>장착하기</button></div>`;}
  box.onclick=e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.eq!=null){equip(it,fromBag);close();if(fromBag)openBag();}
    else if(b.dataset.bag!=null){S.bag.push(it);saveAll();toast('가방에 넣었어요',900);close();}
    else if(b.dataset.sell!=null){if(fromBag){const i=S.bag.findIndex(x=>x.id===it.id);if(i>=0)S.bag.splice(i,1);}S.coins+=(RAR[it.rar].i+1)*3;$('#coinT').textContent=S.coins;saveAll();sfx('Coin',.3);close();if(fromBag)openBag();}
    else if(b.dataset.x!=null)close();};}
function openBag(){const box=$('#bagBox');openModal('#mBag');
  const eqSlots=['weapon','shield','bow','helmet','chestplate','leggings','boots','dskin','poly'];
  const eqH=eqSlots.map(s=>{const it=S.eq[s];return`<div class="it" data-eqs="${s}" style="${it?'border-color:'+RAR[it.rar].col:''}">${it?itemIcon(it):'<span class="same">·</span>'}<small>${it?esc(nm(it)):SLOT_KO[s]}</small></div>`;}).join('');
  const bagH=S.bag.map((it,i)=>`<div class="it" data-bi="${i}" style="border-color:${RAR[it.rar].col}">${itemIcon(it)}<small>${esc(nm(it))}</small></div>`).join('')||'<p class="note">가방이 비었어요. 몬스터를 쓰러뜨리면 장비가 떨어져요.</p>';
  const mine=Object.values(SK).filter(s=>s.id[0]!=='_'&&owns(s.id)).sort((a,b)=>RAR[b.rar].i-RAR[a.rar].i);
  const skH=mine.map(s=>`<div class="li" data-sk="${s.id}"><span class="dot" style="background:${RAR[s.rar].col}"></span>${(CAT[s.cat]||['✨'])[0]} ${esc(s.name)}<span class="r">${RAR[s.rar].name}${S.slots.includes(s.id)?' · '+'UIOP'[S.slots.indexOf(s.id)]:''}${S.combo.includes(s.id)?' · J':''}</span></div>`).join('');
  box.innerHTML=`<h2>🎒 가방 <span class="lab" style="font-family:Do Hyeon">🪙 ${S.coins}</span><button class="x" data-x>✕</button></h2>
    <div class="lab">장착 중 (누르면 빼기)</div><div class="grid" style="margin:6px 0 12px">${eqH}</div>
    <div class="lab">가방 (누르면 비교하고 장착)</div><div class="grid" style="margin:6px 0 12px">${bagH}</div>
    <div class="lab">J 연속기: ${S.combo.map(i=>esc((SK[i]||{}).name||i)).join(' → ')} <button data-cr style="padding:2px 8px;font-size:12px">기본으로</button></div>
    <div class="lab" style="margin-top:10px">내 스킬 ${mine.length}개 (누르면 슬롯 바꾸기)</div><div class="list" style="margin-top:6px;max-height:34vh;overflow:auto">${skH}</div>`;
  box.onclick=e=>{const t=e.target.closest('[data-eqs],[data-bi],[data-sk],[data-x],[data-cr]');if(!t)return;
    if(t.dataset.x!=null){closeModal('#mBag');return;}
    if(t.dataset.cr!=null){S.combo=['ap','dol','yeopS','huryeo'];saveAll();openBag2();return;}
    if(t.dataset.eqs){const s=t.dataset.eqs;const it=S.eq[s];if(!it)return;delete S.eq[s];S.bag.push(it);saveAll();refreshGear().then(buildPad);openBag2();return;}
    if(t.dataset.bi!=null){const it=S.bag[+t.dataset.bi];closeModal('#mBag');offer({kind:'item',it},true);return;}
    if(t.dataset.sk){closeModal('#mBag');offer({kind:'skill',id:t.dataset.sk},true);}};}
function openBag2(){$('#mBag').hidden=true;openBag();}

/* ================= 메인 루프 ================= */
let lastT=performance.now(),dpsT=0;
function loop(now){requestAnimationFrame(loop);let dt=Math.min(.05,(now-lastT)/1000);lastT=now;
  if(hitStop>0){hitStop-=dt;dt*=.06;}
  if(!paused&&P.rig){if(ST.on&&!P.act&&$('#maker').classList.contains('open')&&curTab==='motion')studioTick(dt);else{autoTick(dt);playerTick(dt);polyTick(dt);}if(window.linTick)linTick(dt);
    for(let i=mobs.length-1;i>=0;i--){const m=mobs[i];if(m.spd0==null)m.spd0=m.spd;if(MODE==='train'&&TR.passive&&!m.dummy){m.cd=Math.max(m.cd,1);m.wind=0;m.charging=0;m.spd=0;}else m.spd=m.spd0;
      mobTick(m,dt);if(m.dead>1.6)removeMob(m);}
    projTick(dt);pickupTick(dt);stageTick(dt);}
  pfxTick(dt);kfxTick(dt);floatTick(dt);if(P.rig)camTick(dt);barsTick();padTick();
  dpsT+=dt;if(dpsT>.5){dpsT=0;trainTick();}
  R.render(scene,cam);}
function trainTick(){if(MODE!=='train')return;const sum=mobs.filter(m=>m.dummy).reduce((a,m)=>a+(m.dmgSum||0),0);const now=performance.now()/1000;TR.dps.push([now,sum]);while(TR.dps.length&&now-TR.dps[0][0]>5)TR.dps.shift();
  if(TR.dps.length>1&&sum<TR.dps[TR.dps.length-2][1])TR.dps=[[now,sum]];const a=TR.dps[0];const dps=a&&now-a[0]>.4?(sum-a[1])/(now-a[0]):0;const el=$('#dpsT');if(el)el.textContent=`초당 피해 ${Math.round(dps)} · 허수아비 누적 ${Math.round(sum)}`;
  $('#killT').textContent='허수아비 4개(앞·왼쪽·오른쪽·뒤) · 초당 피해 '+Math.round(dps);}

/* ================= 시작 · 버튼 ================= */
function hideStart(){$('#start').hidden=true;}
async function goPlay(n){hideStart();$('#mOver').hidden=true;P.dead=false;P.hp=P.max;updHP();paused=false;await startStage(n);}
async function goTrain(){hideStart();$('#mOver').hidden=true;P.dead=false;P.hp=P.max;updHP();paused=false;TR.dps=[];await startTrain();}
$('#sNew').onclick=()=>goPlay(1);$('#sCont').onclick=()=>goPlay(Math.max(1,S.best));$('#sTrain').onclick=goTrain;$('#sMaker').onclick=()=>needAdmin(()=>{goTrain().then(()=>openMaker('train'));});
$('#oRetry').onclick=()=>goPlay(Math.max(1,S.stage));$('#oFirst').onclick=()=>goPlay(1);$('#oTrain').onclick=goTrain;
$('#bPlay').onclick=()=>{if(MODE==='play'&&!confirm('지금 스테이지를 처음부터 다시 할까요?'))return;goPlay(MODE==='play'?S.stage:Math.max(1,S.best||1));};
$('#bTrain').onclick=goTrain;$('#bBag').onclick=()=>openBag();$('#bMaker').onclick=()=>needAdmin(()=>{if(MODE==='idle')goTrain();openMaker();});
$('#bSnd').onclick=()=>{sndOn=!sndOn;$('#bSnd').textContent=sndOn?'🔊':'🔇';if(BGM){if(sndOn)BGM.play().catch(()=>{});else BGM.pause();}};
let BGM=null;function bgm(){if(BGM||!sndOn)return;BGM=new Audio('a/s/bgm.ogg');BGM.loop=true;BGM.volume=.22;BGM.play().catch(()=>{BGM=null;});}
addEventListener('pointerdown',bgm,{once:true});addEventListener('keydown',bgm,{once:true});

/* ================= 메이커 ================= */
const TABS=[['train','🎯 연습장'],['skill','📜 스킬'],['motion','🎥 모션'],['item','🗡 아이템'],['mob','👾 몬스터·스킨'],['stage','🗺 스테이지'],['poly','🎭 변신'],['op','👑 운영자'],['save','💾 저장']];
let curTab='train';
function openMaker(t){$('#maker').classList.add('open');if(t)curTab=t;renderTabs();renderTab();}
$('#mkClose').onclick=()=>$('#maker').classList.remove('open');
function renderTabs(){$('#tabs').innerHTML=TABS.map(([k,n])=>`<button data-t="${k}" class="${k===curTab?'on':''}">${n}</button>`).join('');}
$('#tabs').onclick=e=>{const b=e.target.closest('[data-t]');if(!b)return;curTab=b.dataset.t;renderTabs();renderTab();};
function renderTab(){const f={train:tabTrain,skill:tabSkill,motion:tabMotion,item:tabItem,mob:tabMob,stage:tabStage,poly:tabPoly,op:tabOp,save:tabSave}[curTab];$('#tab').innerHTML='';const d=document.createElement('div');$('#tab').appendChild(d);f(d);}
const allMobIds=()=>[...MOBS.filter(m=>m.id!=='dummy'),...BOSSES];
function dirPos(dir,dist=3.2){const f=P.face;const fw=new V3(Math.sin(f),0,Math.cos(f)),lf=new V3(Math.cos(f),0,-Math.sin(f));const v={front:fw,back:fw.clone().negate(),left:lf,right:lf.clone().negate()}[dir];
  const p=P.pos.clone().addScaledVector(v,dist);const H=MAP.N/2-1.5;p.x=clamp(p.x,-H,H);p.z=clamp(p.z,-H,H);return p;}
async function ensureTrain(){if(MODE!=='train'){await goTrain();}}
function tabTrain(el){el.innerHTML=`<p class="note">허수아비는 앞·왼쪽·오른쪽·뒤에 서 있어요. 몸을 돌려 방향별로 때려보고, 몬스터나 보스도 불러서 시험해요.</p>
  <div class="row"><button class="pri" id="tStart">연습장 새로 시작</button><button id="tDbg" class="${S.dbg?'on':''}">타격 범위 보기 ${S.dbg?'ON':'OFF'}</button><button id="tPas" class="${TR.passive?'on':''}">몬스터 가만히 ${TR.passive?'ON':'OFF'}</button></div>
  <div class="card" id="dpsT" style="font-size:16px">초당 피해 0</div>
  <h4>몬스터 불러오기</h4><div class="f"><label>몬스터</label><select id="tMob">${allMobIds().map(m=>`<option value="${m.id}">${BOSSES.includes(m)?'👑 ':''}${m.name}</option>`).join('')}</select>
  <label>레벨</label><input id="tLv" type="number" min="1" max="99" value="${Math.max(1,S.stage||1)}"></div>
  <div class="row"><button data-d="front">앞에</button><button data-d="left">왼쪽에</button><button data-d="right">오른쪽에</button><button data-d="back">뒤에</button><button data-d="ring">사방에 4마리</button></div>
  <div class="row"><button id="tDum">허수아비 다시 세우기</button><button id="tClr" class="bad">몬스터 모두 지우기</button><button id="tGod" class="${S.god?'on':''}">무적 ${S.god?'ON':'OFF'}</button></div>
  <h4>지금 슬롯</h4><div class="list">${[0,1,2,3].map(i=>{const s=SK[S.slots[i]];return`<div class="li" data-try="${S.slots[i]||''}"><b>${'UIOP'[i]}</b> ${s?esc(s.name):'비어 있음'}<span class="r">${s?RAR[s.rar].name:''} · 눌러서 써보기</span></div>`;}).join('')}</div>`;
  el.querySelector('#tStart').onclick=()=>goTrain().then(renderTab);
  el.querySelector('#tDbg').onclick=()=>{S.dbg=!S.dbg;renderTab();};el.querySelector('#tPas').onclick=()=>{TR.passive=!TR.passive;renderTab();};el.querySelector('#tGod').onclick=()=>{S.god=!S.god;renderTab();};
  el.querySelector('#tClr').onclick=()=>{[...mobs].filter(m=>!m.dummy).forEach(removeMob);};
  el.querySelector('#tDum').onclick=async()=>{[...mobs].filter(m=>m.dummy).forEach(removeMob);for(const [d,n] of [['front','앞'],['left','왼쪽'],['right','오른쪽'],['back','뒤']]){const p=dirPos(d,2.4);const m=await spawnMob('dummy',p.x,p.z);if(m){m.label=n;m.face=Math.atan2(P.pos.x-p.x,P.pos.z-p.z);m.obj.rotation.y=m.face;}}TR.dps=[];};
  el.querySelectorAll('[data-d]').forEach(b=>b.onclick=async()=>{await ensureTrain();const id=$('#tMob').value,lv=+$('#tLv').value||1;const ds=b.dataset.d==='ring'?['front','left','right','back']:[b.dataset.d];
    for(const d of ds){const p=dirPos(d,BOSSES.find(x=>x.id===id)?5:3.4);const m=await spawnMob(id,p.x,p.z,{level:lv});if(m)pfx('spawn/poof',p.clone().setY(.05),{scale:.8});}});
  el.querySelectorAll('[data-try]').forEach(li=>li.onclick=()=>{const id=li.dataset.try;if(id){$('#maker').classList.remove('open');setTimeout(()=>useSkill(id),150);}});}

/* ---------- 스킬 만들기 ---------- */
let skSel='s540',skFilter={q:'',cat:'',rar:''};
function motionOptions(sel){const k=Object.keys(KEYMOTION).map(id=>[`k:${id}`,'🎬 '+(KEYMOTION[id].name||id)]);const c=Object.keys(CLIPS).filter(id=>id[0]!=='_').map(id=>[`c:${id}`,(CLIPS[id].src==='user'||CLIPS[id].src==='video'?'🎥 내 모션: ':'🧍 모캡: ')+(CLIPS[id].name||id)]);
  return[...k,...c].map(([v,n])=>`<option value="${v}" ${v===sel?'selected':''}>${esc(n)}</option>`).join('');}
function fxDatalist(){if($('#fxlist'))return;const d=document.createElement('datalist');d.id='fxlist';d.innerHTML=[...PFX_IDS,...KFX_LIST.map(k=>'k:'+k)].map(x=>`<option value="${x}">`).join('');document.body.appendChild(d);}
function tabSkill(el){fxDatalist();const list=Object.values(SK).filter(s=>s.id[0]!=='_'&&(!skFilter.cat||s.cat===skFilter.cat)&&(!skFilter.rar||s.rar===skFilter.rar)&&(!skFilter.q||s.name.includes(skFilter.q))).sort((a,b)=>RAR[a.rar].i-RAR[b.rar].i);
  const sk=SK[skSel]||list[0];if(sk)skSel=sk.id;const base=BASE_SKILLS.find(b=>b.id===skSel);const mine=!!DB.skills[skSel];
  el.innerHTML=`<div class="row"><input id="sq" placeholder="이름 찾기" value="${esc(skFilter.q)}" style="flex:1"><select id="scat"><option value="">모든 종류</option>${Object.keys(CAT).map(c=>`<option value="${c}" ${c===skFilter.cat?'selected':''}>${CAT[c].join(' ')}</option>`).join('')}</select>
    <select id="srar"><option value="">모든 등급</option>${RARS.map(([r])=>`<option value="${r}" ${r===skFilter.rar?'selected':''}>${RAR[r].name}</option>`).join('')}</select></div>
    <div class="list" style="max-height:26vh;overflow:auto">${list.map(s=>`<div class="li ${s.id===skSel?'on':''}" data-s="${s.id}"><span class="dot" style="background:${RAR[s.rar].col}"></span>${(CAT[s.cat]||['✨'])[0]} ${esc(s.name)}<span class="r">${RAR[s.rar].name}${DB.skills[s.id]?' · 수정됨':''}</span></div>`).join('')}</div>
    <div class="row"><button class="blue" id="sNewB">＋ 새 스킬</button><button id="sDup">복제</button>${mine?`<button class="bad" id="sDel">${base?'기본값으로 되돌리기':'삭제'}</button>`:''}</div>
    ${sk?skillForm(sk):''}`;
  el.querySelector('#sq').oninput=e=>{skFilter.q=e.target.value;const pos=e.target.selectionStart;renderTab();const q=$('#sq');q.focus();q.setSelectionRange(pos,pos);};
  el.querySelector('#scat').onchange=e=>{skFilter.cat=e.target.value;renderTab();};el.querySelector('#srar').onchange=e=>{skFilter.rar=e.target.value;renderTab();};
  el.querySelectorAll('[data-s]').forEach(li=>li.onclick=()=>{skSel=li.dataset.s;renderTab();});
  el.querySelector('#sNewB').onclick=()=>{const id='u'+Date.now().toString(36);DB.skills[id]={id,name:'새 스킬',rar:'N',cat:'kick',mot:'k:ap',hits:[H(.5,2.4,1.2,1)],fx:[],cd:1,user:true};saveAll();refreshSK();skSel=id;renderTab();};
  el.querySelector('#sDup').onclick=()=>{if(!sk)return;const id='u'+Date.now().toString(36);DB.skills[id]=JSON.parse(JSON.stringify(Object.assign({},sk,{id,name:sk.name+' 복사',user:true})));saveAll();refreshSK();skSel=id;renderTab();};
  const del=el.querySelector('#sDel');if(del)del.onclick=()=>{if(!confirm(base?'기본값으로 되돌릴까요?':'이 스킬을 지울까요?'))return;delete DB.skills[skSel];S.slots=S.slots.map(x=>x===skSel&&!base?null:x);saveAll();refreshSK();if(!base)skSel='s540';renderTab();buildPad();};
  if(sk)wireSkillForm(el,sk);}
function skillForm(sk){const hits=(sk.hits||[]).map((h,i)=>hitRow(h,i)).join('');const fx=(sk.fx||[]).map((f,i)=>fxRow(f,i)).join('');
  return`<h4>${esc(sk.name)} 편집</h4><div class="f">
    <label>이름</label><input id="e_name" value="${esc(sk.name)}">
    <label>등급</label><select id="e_rar">${RARS.map(([r])=>`<option value="${r}" ${r===sk.rar?'selected':''}>${RAR[r].name} (×${RAR[r].mul})</option>`).join('')}</select>
    <label>종류</label><select id="e_cat">${Object.keys(CAT).map(c=>`<option value="${c}" ${c===sk.cat?'selected':''}>${CAT[c].join(' ')}</option>`).join('')}</select>
    <label>모션</label><select id="e_mot">${motionOptions(sk.mot)}</select>
    <label>모션 속도</label><input id="e_spd" type="number" step=".1" min=".3" max="3" value="${sk.spd||1}">
    <label>전체 위력</label><input id="e_mul" type="number" step=".1" min=".1" max="20" value="${sk.mul||1}">
    <label>재사용(초)</label><input id="e_cd" type="number" step=".5" min="0" max="60" value="${sk.cd||0}">
    <label>돌진 속도</label><input id="e_dash" type="number" step="1" min="0" max="20" value="${sk.dash||0}">
    <label>무적</label><span><input id="e_inv" type="checkbox" ${sk.inv?'checked':''}> 동작 중 안 맞음</span>
    <label>드랍</label><span><input id="e_drop" type="checkbox" ${sk.nodrop?'':'checked'}> 몬스터가 스킬북으로 떨어뜨림</span>
    <label>필요 무기</label><span>${Object.keys(WCLASS).map(w=>`<label style="white-space:nowrap;margin-right:6px"><input type="checkbox" class="e_wc" value="${w}" ${(sk.wc||[]).includes(w)?'checked':''}> ${WCLASS[w]}</label>`).join('')}</span>
    <label>휘두름 궤적</label><select id="e_trail"><option value="">기본</option>${KFX_LIST.map(k=>`<option ${k===sk.trail?'selected':''}>${k}</option>`).join('')}</select>
  </div>
  <h4>타격 (시점 0~1, -1은 모캡의 가장 빠른 순간)</h4><div class="hitrow lab"><span>시점</span><span>거리</span><span>각도</span><span>배율</span><span>모양</span><span></span></div><div id="e_hits">${hits}</div><button id="e_addh">＋ 타격 추가</button>
  <h4>이펙트 (244개 pixelfx + Kenney k:)</h4><div class="hitrow lab" style="grid-template-columns:1fr 3fr 1.3fr 1fr 28px"><span>시점</span><span>이펙트</span><span>위치</span><span>크기</span><span></span></div><div id="e_fx">${fx}</div><button id="e_addf">＋ 이펙트 추가</button>
  <div class="card" style="margin-top:10px" id="e_sum">${skillCard(sk,'미리 보기')}</div>
  <div class="btns" style="justify-content:flex-start"><button class="blue" id="e_try">▶ 써보기</button><button class="pri" id="e_save">💾 저장 (게임에 적용)</button></div>
  <div class="row"><span class="lab">슬롯에 넣기:</span>${[0,1,2,3].map(i=>`<button data-put="${i}">${'UIOP'[i]}</button>`).join('')}<button data-put="J">J 연속기</button><button id="e_book">📜 스킬북으로 받기</button></div>`;}
function hitRow(h,i){return`<div class="hitrow" data-h="${i}"><input type="number" step=".05" value="${h.t}" data-k="t"><input type="number" step=".1" value="${h.range}" data-k="range"><input type="number" step=".1" value="${h.arc}" data-k="arc"><input type="number" step=".1" value="${h.mul||1}" data-k="mul">
  <select data-k="shape">${Object.keys(SHAPE_KO).map(s=>`<option value="${s}" ${s===h.shape?'selected':''}>${SHAPE_KO[s].replace('앞쪽 ','').replace('앞으로 ','')}</option>`).join('')}</select><button data-rmh="${i}">✕</button></div>`;}
function fxRow(f,i){return`<div class="hitrow" data-f="${i}" style="grid-template-columns:1fr 3fr 1.3fr 1fr 28px"><input type="number" step=".05" value="${f.t}" data-k="t"><input list="fxlist" value="${esc(f.id)}" data-k="id">
  <select data-k="at">${[['self','내 발밑'],['front','내 앞'],['target','가까운 적']].map(([v,n])=>`<option value="${v}" ${v===f.at?'selected':''}>${n}</option>`).join('')}</select><input type="number" step=".1" value="${f.scale||1}" data-k="scale"><button data-rmf="${i}">✕</button></div>`;}
function readSkillForm(el,sk){const o=JSON.parse(JSON.stringify(sk));const v=id=>el.querySelector('#'+id);
  o.name=v('e_name').value.trim()||'이름 없는 스킬';o.rar=v('e_rar').value;o.cat=v('e_cat').value;o.mot=v('e_mot').value;o.spd=+v('e_spd').value||1;o.mul=+v('e_mul').value||1;o.cd=+v('e_cd').value||0;o.dash=+v('e_dash').value||0;if(!o.dash)delete o.dash;
  o.inv=v('e_inv').checked;o.nodrop=!v('e_drop').checked;const wc=[...el.querySelectorAll('.e_wc:checked')].map(x=>x.value);if(wc.length)o.wc=wc;else delete o.wc;o.trail=v('e_trail').value||undefined;
  o.hits=[...el.querySelectorAll('#e_hits .hitrow')].map(r=>{const g=k=>r.querySelector(`[data-k=${k}]`).value;return{t:+g('t'),range:+g('range'),arc:+g('arc'),mul:+g('mul')||1,shape:g('shape')};});
  o.fx=[...el.querySelectorAll('#e_fx .hitrow')].map(r=>{const g=k=>r.querySelector(`[data-k=${k}]`).value;return{t:+g('t'),id:g('id').trim(),at:g('at'),scale:+g('scale')||1};}).filter(f=>f.id&&(PFXL[f.id]||f.id.startsWith('k:')));
  if(o.mot.startsWith('c:')){const c=CLIPS[o.mot.slice(2)];if(c&&c.peak){const pk=Object.entries(c.peak).sort((a,b)=>0);o.peak=o.peak||(c.peak.anR!=null?'anR':Object.keys(c.peak)[0]);}}
  return o;}
function wireSkillForm(el,sk){const upd=()=>{const o=readSkillForm(el,sk);el.querySelector('#e_sum').innerHTML=skillCard(o,'미리 보기');return o;};
  el.addEventListener('input',e=>{if(e.target.closest('.f,#e_hits,#e_fx'))upd();});el.addEventListener('change',e=>{if(e.target.closest('.f,#e_hits,#e_fx'))upd();});
  el.querySelector('#e_addh').onclick=()=>{const o=upd();o.hits.push(H(.5,2.5,1.2,1));DB.skills[sk.id]=o;saveAll();refreshSK();renderTab();};
  el.querySelector('#e_addf').onclick=()=>{const o=upd();o.fx.push(F(.5,'impacts/hit-spark','front',1));DB.skills[sk.id]=o;saveAll();refreshSK();renderTab();};
  el.querySelectorAll('[data-rmh]').forEach(b=>b.onclick=()=>{const o=upd();o.hits.splice(+b.dataset.rmh,1);DB.skills[sk.id]=o;saveAll();refreshSK();renderTab();});
  el.querySelectorAll('[data-rmf]').forEach(b=>b.onclick=()=>{const o=upd();o.fx.splice(+b.dataset.rmf,1);DB.skills[sk.id]=o;saveAll();refreshSK();renderTab();});
  el.querySelector('#e_try').onclick=async()=>{const o=upd();o.id='_try';SK._try=o;o.wc=undefined;await ensureTrain();P.act=null;P.cd={};useSkill('_try');};
  el.querySelector('#e_save').onclick=()=>{const o=upd();DB.skills[sk.id]=o;saveAll();refreshSK();buildPad();toast('저장했어요 · 게임에서 바로 쓸 수 있어요',1400);renderTab();};
  el.querySelectorAll('[data-put]').forEach(b=>b.onclick=()=>{const o=upd();DB.skills[sk.id]=o;refreshSK();const k=b.dataset.put;if(k==='J'){if(!S.combo.includes(sk.id))S.combo.push(sk.id);if(S.combo.length>6)S.combo.shift();}else S.slots[+k]=sk.id;
    if(!S.owned.includes(sk.id))S.owned.push(sk.id);saveAll();buildPad();toast(o.name+' → '+(k==='J'?'J 연속기':'UIOP'[+k]+' 슬롯'),1200);});
  el.querySelector('#e_book').onclick=()=>{const o=upd();DB.skills[sk.id]=o;saveAll();refreshSK();dropThing({kind:'skill',id:sk.id,rar:o.rar},P.pos.clone().add(new V3(Math.sin(P.face)*1.6,0,Math.cos(P.face)*1.6)));toast('앞에 스킬북을 떨어뜨렸어요. 주워 보세요',1500);};}

/* ---------- 모션: 영상 → 모션 ---------- */
let poseP=null;const MEM={};
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej(new Error(src+' 를 못 불러왔어요'));document.head.appendChild(s);});}
async function loadModels(){const names=['pose_landmark_full.tflite','pose_solution_packed_assets.data','pose_web.binarypb'];
  for(const n of names){if(MEM[n])continue;const t=await(await fetch('mp/'+n+'.txt')).text();const bin=atob(t.trim());const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);MEM[n]=u.buffer;}
  const hit=u=>{const s=String(u&&u.url||u);for(const k in MEM)if(s.endsWith(k))return k;return null;};
  const Fo=window.fetch;window.fetch=function(u,o){const k=hit(u);if(k)return Promise.resolve(new Response(MEM[k].slice(0),{status:200}));return Fo.apply(this,arguments);};
  const XO=XMLHttpRequest.prototype.open,XS=XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open=function(m,u){this._mem=hit(u);if(this._mem)return;return XO.apply(this,arguments);};
  XMLHttpRequest.prototype.send=function(){if(!this._mem)return XS.apply(this,arguments);const x=this,buf=MEM[this._mem].slice(0);
    Object.defineProperty(x,'status',{value:200});Object.defineProperty(x,'readyState',{value:4});Object.defineProperty(x,'response',{value:buf});
    setTimeout(()=>{const ev={loaded:buf.byteLength,total:buf.byteLength,lengthComputable:true,target:x};x.onprogress&&x.onprogress(ev);x.onload&&x.onload(ev);x.onreadystatechange&&x.onreadystatechange(ev);},0);};}
function getPose(){if(poseP)return poseP;poseP=(async()=>{if(!window.Pose)await loadScript('mp/pose.js');await loadModels();const p=new Pose({locateFile:f=>'mp/'+f});
  p.setOptions({modelComplexity:1,smoothLandmarks:true,enableSegmentation:false,minDetectionConfidence:.5,minTrackingConfidence:.5});await p.initialize();return p;})();poseP.catch(()=>{poseP=null;});return poseP;}
let exAbort=false;$('#exStop').onclick=()=>exAbort=true;
async function videoToClip(file,name){exAbort=false;$('#mEx').hidden=false;$('#exBar').style.width='0%';$('#exTxt').textContent='모션 인식 엔진 준비 중… (처음 한 번은 조금 걸려요)';
  const url=URL.createObjectURL(file);const v=document.createElement('video');v.muted=true;v.playsInline=true;v.src=url;v.preload='auto';
  try{await new Promise((res,rej)=>{v.onloadeddata=res;v.onerror=()=>rej(new Error('영상을 열 수 없어요'));});
    const ps=await getPose();const fps=24;const dur=Math.min(v.duration||0,20);const N=Math.floor(dur*fps);const raw=[];let last=null,got=0;
    for(let i=0;i<N;i++){if(exAbort)break;v.currentTime=i/fps;await new Promise(r=>{const h=()=>{v.removeEventListener('seeked',h);r();};v.addEventListener('seeked',h);});
      const r=await new Promise(res=>{ps.onResults(res);ps.send({image:v});});
      if(r.poseWorldLandmarks&&r.poseLandmarks){const w=[];r.poseWorldLandmarks.forEach(p=>w.push(p.x,p.y,p.z));const nl=r.poseLandmarks;
        last={w,n:[(nl[23].x+nl[24].x)/2,(nl[23].y+nl[24].y)/2,Math.max(nl[27].y,nl[28].y,nl[31].y,nl[32].y)]};got++;}
      if(last)raw.push(last);$('#exBar').style.width=(100*(i+1)/N)+'%';$('#exTxt').textContent=`동작 분석 중… ${i+1} / ${N} 프레임`;}
    if(exAbort){URL.revokeObjectURL(url);return null;}if(got<N*.3)throw new Error('사람을 거의 찾지 못했어요. 몸 전체가 크게 나오는 영상으로 다시 해보세요.');
    const c=buildClip(raw,fps,v.videoWidth/v.videoHeight,name);c._url=url;return c;}
  catch(e){URL.revokeObjectURL(url);throw e;}
  finally{$('#mEx').hidden=true;}}
function buildClip(raw,fps,aspect,name){const n=raw.length,W=5;const sm=raw.map((f,i)=>{const w=new Array(99).fill(0);let c=0;for(let j=Math.max(0,i-2);j<=Math.min(n-1,i+2);j++){raw[j].w.forEach((x,k)=>w[k]+=x);c++;}return{w:w.map(x=>Math.round(x/c*1000)/1000),n:f.n};});
  const feet=sm.map(f=>f.n[2]).sort((a,b)=>a-b);const ground=feet[Math.floor(feet.length*.9)];const hipH0=Math.max(.05,ground-sm[0].n[1]);const s=.825/hipH0;const x0=sm[0].n[0];
  const frames=sm.map(f=>({w:f.w,r:[Math.round((f.n[0]-x0)*aspect*s*1000)/1000,Math.round(Math.max(.3,(ground-f.n[1])*s)*1000)/1000,0]}));
  const sp=idx=>frames.map((f,i)=>i?Math.hypot(f.w[idx*3]-frames[i-1].w[idx*3],f.w[idx*3+1]-frames[i-1].w[idx*3+1],f.w[idx*3+2]-frames[i-1].w[idx*3+2]):0);
  const peak={};[['anL',27],['anR',28],['wrL',15],['wrR',16],['toL',31],['toR',32]].forEach(([k,i])=>{const a=sp(i);let b=0;a.forEach((x,j)=>{if(x>a[b])b=j;});peak[k]=Math.round(b/fps*1000)/1000;});
  return{name,fps,frames,peak,dur:Math.round(frames.length/fps*100)/100,src:'video'};}
/* ---------- 모션 스튜디오 (메이커 안에서 바로 동작 만들기) ---------- */
const RAW={};const VIDS={};
const ST={on:false,mot:null,t:0,play:true,spd:1,mir:false,a:0,b:0,hit:null,lastT:0};
function motInfo(mot){if(!mot)return null;const [k,id]=mot.split(':');if(k==='k'){const m=KEYMOTION[id];return m?{type:'k',m,dur:m.dur,name:m.name||id,id}:null;}const c=CLIPS[id];return c?{type:'c',c,dur:c.dur,name:c.name||id,id,user:!!DB.motions[id]}:null;}
function stLoad(mot){const i=motInfo(mot);if(!i)return;Object.assign(ST,{on:true,mot,t:0,a:0,b:i.dur,hit:null,mir:false,play:true,_mirOf:null});P.act=null;
  if(i.type==='c'){const pk=i.c.peak||{};const k=['anR','anL','wrR','wrL'].find(x=>pk[x]!=null);if(k)ST.hit=Math.min(i.dur,pk[k]);}else ST.hit=i.dur*.5;}
function stClip(i){if(ST.mir&&i.type==='c'){if(ST._mirOf!==i.id){const raw=RAW[i.id];if(raw){addClip('_mir',Object.assign({},raw,{frames:raw.frames.map(f=>mirrorFrame({w:f.w,r:Array.isArray(f.r)?f.r:[f.r.x,f.r.y,f.r.z]}))}));ST._mirOf=i.id;}}return CLIPS._mir||i.c;}return i.c;}
function studioTick(dt){const i=motInfo(ST.mot);if(!i){ST.on=false;return;}
  const prev=ST.t;if(ST.play){ST.t+=dt*ST.spd;if(ST.t>ST.b||ST.t<ST.a)ST.t=ST.a;}
  if(ST.play&&ST.hit!=null&&prev<ST.hit&&ST.t>=ST.hit){const fw=new V3(Math.sin(P.face),0,Math.cos(P.face));pfx('impacts/hit-spark',P.pos.clone().addScaledVector(fw,1.2).setY(1),{over:true,scale:.8});sfx('Hit',.25,1.3);}
  P.rig.root.position.set(P.pos.x,0,P.pos.z);P.rig.root.rotation.y=P.face;P.rig.root.visible=true;
  if(i.type==='k'){const k=clamp(ST.t/i.dur,0,1);pose(P.rig,track(i.m.keys,ST.t),i.m.jump?Math.sin(k*PI)*i.m.jump:0);}
  else{clipPose(P.rig,stClip(i),ST.t);groundFix(P.rig);}
  stUI(i);}
function stUI(i){const sk=$('#stSeek');if(!sk)return;if(document.activeElement!==sk)sk.value=ST.t;$('#stTm').textContent=ST.t.toFixed(2)+' / '+i.dur.toFixed(2)+'초';
  const pc=x=>(100*x/i.dur)+'%';$('#stRange').style.left=pc(ST.a);$('#stRange').style.width=(100*(ST.b-ST.a)/i.dur)+'%';const h=$('#stHit');h.hidden=ST.hit==null;if(ST.hit!=null)h.style.left=pc(ST.hit);
  const v=$('#stVid');if(v&&!v.hidden&&v.readyState>=1){const want=(RAW[i.id]&&RAW[i.id].v0||0)+ST.t;if(Math.abs(v.currentTime-want)>.08&&!v.seeking)v.currentTime=want;}}
function stTrimmedRaw(i){const raw=RAW[i.id];if(!raw)return null;const fps=raw.fps||30;const fa=Math.max(0,Math.round(ST.a*fps)),fb=Math.min(raw.frames.length,Math.max(fa+4,Math.round(ST.b*fps)));
  let fr=raw.frames.slice(fa,fb).map(f=>({w:f.w,r:Array.isArray(f.r)?f.r:[f.r.x,f.r.y,f.r.z]}));if(ST.mir)fr=fr.map(mirrorFrame);const x0=fr[0].r[0],z0=fr[0].r[2];fr=fr.map(f=>({w:f.w,r:[Math.round((f.r[0]-x0)*1000)/1000,f.r[1],Math.round((f.r[2]-z0)*1000)/1000]}));
  const pk={};Object.keys(raw.peak||{}).forEach(k=>pk[k]=clamp(raw.peak[k]-fa/fps,0,fr.length/fps));if(ST.hit!=null){const h=clamp(ST.hit-fa/fps,0,fr.length/fps);pk.anR=pk.anL=pk.wrR=pk.wrL=h;}
  return{name:raw.name,fps,frames:fr,peak:pk,dur:Math.round(fr.length/fps*100)/100,src:'video',v0:(raw.v0||0)+fa/fps};}
function stSave(name,asNew){const i=motInfo(ST.mot);if(!i||i.type!=='c')return null;const c=stTrimmedRaw(i);if(!c)return null;c.name=name||c.name;
  const id=(!asNew&&i.user)?i.id:'v'+Date.now().toString(36);DB.motions[id]=c;RAW[id]=c;addClip(id,c);CLIPS[id].src='video';if(VIDS[i.id])VIDS[id]=VIDS[i.id];saveAll();const hit=ST.hit!=null?clamp(ST.hit-ST.a,0,c.dur):null;stLoad('c:'+id);ST.hit=hit;return id;}
function tabMotion(el){if(!ST.mot||!motInfo(ST.mot))stLoad('c:'+(Object.keys(DB.motions)[0]||'spinkick'));ST.on=true;const i=motInfo(ST.mot);const user=Object.keys(DB.motions);
  el.innerHTML=`<div class="card" id="stud"><b>🎬 모션 스튜디오</b> <span class="lab">아래 캐릭터가 바로 따라 해요</span>
    <div class="row"><select id="stSel" style="flex:1">${motionOptions(ST.mot)}</select></div>
    <video id="stVid" muted playsinline preload="auto" style="width:100%;max-height:150px;background:#000;border-radius:8px;${ST.mir?'transform:scaleX(-1)':''}" ${VIDS[i.id]?'':'hidden'}></video>
    <div style="position:relative;height:30px;margin-top:6px"><div style="position:absolute;left:0;right:0;top:12px;height:6px;background:#0f131a;border-radius:3px"></div><div id="stRange" style="position:absolute;top:12px;height:6px;background:var(--ac2);border-radius:3px"></div>
      <div id="stHit" style="position:absolute;top:2px;width:3px;height:26px;margin-left:-1px;background:var(--ac);box-shadow:0 0 6px var(--ac)"></div>
      <input type="range" id="stSeek" min="0" max="${i.dur}" step="0.01" value="${ST.t}" style="position:absolute;inset:0;width:100%;opacity:.55"></div>
    <div class="row"><button id="stPlay">${ST.play?'⏸ 멈춤':'▶ 재생'}</button><span id="stTm" class="lab"></span>${[.25,.5,1].map(s=>`<button data-spd="${s}" class="${ST.spd===s?'on':''}">${s}×</button>`).join('')}${i.type==='c'?`<button id="stMir" class="${ST.mir?'on':''}">좌우반전</button>`:''}</div>
    <div class="row"><button id="stPrev">◀ 한 칸</button><button id="stNext">한 칸 ▶</button>${i.type==='c'?'<button id="stA">[ 여기서 시작</button><button id="stB">여기서 끝 ]</button>':''}<button id="stH">⚡ 여기가 타격 순간</button></div>
    <p class="note">파란 줄이 쓸 구간, 노란 줄이 타격 순간이에요. 멈추고 줄을 끌어서 맞춰요.</p>
    <div class="f"><label>이름</label><input id="stName" value="${esc(i.name)}"></div>
    <div class="btns" style="justify-content:flex-start">${i.type==='c'?`<button class="pri" id="stSave">💾 ${i.user?'잘라서 저장':'내 모션으로 저장'}</button>`:''}<button class="blue" id="stSk">📜 이 모션으로 스킬 만들기</button>${i.user?'<button class="bad" id="stDel">삭제</button>':''}</div></div>
  <div class="card" style="margin-top:10px"><b>＋ 새 모션 만들기</b>
    <div class="row"><input id="mvName" placeholder="모션 이름 (예: 내 540)" style="flex:1"></div>
    <div class="row"><button class="pri" id="camOpen">📷 카메라로 바로 찍기</button><select id="camSec">${[3,5,8].map(s=>`<option value="${s}" ${s===5?'selected':''}>${s}초</option>`).join('')}</select><button id="mvUp">🎞 영상 올리기</button></div>
    <p class="note">몸 전체가 화면에 나오게 서서 찍어요. 사람 한 명만 나오는 겨루기·품새·시범 영상, 다른 게임 영상도 돼요. 영상은 이 기기 안에서만 분석돼요.</p><p class="note" id="mvMsg"></p></div>
  <h4>내가 만든 모션 ${user.length}개</h4><div class="list">${user.map(id=>`<div class="li ${'c:'+id===ST.mot?'on':''}" data-ld="c:${id}">🎥 ${esc(DB.motions[id].name)}<span class="r">${DB.motions[id].dur}초</span></div>`).join('')||'<p class="note">아직 없어요.</p>'}</div>
  <h4>모캡 모션 (사람이 실제로 한 동작)</h4><div class="list">${Object.keys(CLIPS).filter(id=>!DB.motions[id]&&id[0]!=='_').map(id=>`<div class="li ${'c:'+id===ST.mot?'on':''}" data-ld="c:${id}">🧍 ${esc(CLIPS[id].name||id)}<span class="r">${CLIPS[id].dur.toFixed(1)}초</span></div>`).join('')}</div>
  <h4>키프레임 모션 (태권도·트릭킹·무기)</h4><div class="list">${Object.keys(KEYMOTION).map(id=>`<div class="li ${'k:'+id===ST.mot?'on':''}" data-ld="k:${id}">🎬 ${esc(KEYMOTION[id].name||id)}</div>`).join('')}</div>`;
  const q=s=>el.querySelector(s);const vid=q('#stVid');if(VIDS[i.id]){vid.src=VIDS[i.id];}
  stUI(i);
  q('#stSel').onchange=e=>{stLoad(e.target.value);renderTab();};
  el.querySelectorAll('[data-ld]').forEach(li=>li.onclick=()=>{stLoad(li.dataset.ld);renderTab();$('#tab').scrollTop=0;});
  q('#stPlay').onclick=()=>{ST.play=!ST.play;q('#stPlay').textContent=ST.play?'⏸ 멈춤':'▶ 재생';};
  q('#stSeek').oninput=e=>{ST.play=false;ST.t=+e.target.value;q('#stPlay').textContent='▶ 재생';};
  el.querySelectorAll('[data-spd]').forEach(b=>b.onclick=()=>{ST.spd=+b.dataset.spd;el.querySelectorAll('[data-spd]').forEach(x=>x.classList.toggle('on',x===b));});
  const step=d=>{ST.play=false;ST.t=clamp(ST.t+d,0,i.dur);q('#stPlay').textContent='▶ 재생';};q('#stPrev').onclick=()=>step(-1/30);q('#stNext').onclick=()=>step(1/30);
  if(q('#stMir'))q('#stMir').onclick=()=>{ST.mir=!ST.mir;ST._mirOf=null;q('#stMir').classList.toggle('on',ST.mir);vid.style.transform=ST.mir?'scaleX(-1)':'';};
  if(q('#stA'))q('#stA').onclick=()=>{ST.a=Math.min(ST.t,ST.b-.15);};if(q('#stB'))q('#stB').onclick=()=>{ST.b=Math.max(ST.t,ST.a+.15);};
  q('#stH').onclick=()=>{ST.hit=ST.t;toast('⚡ 타격 순간: '+ST.t.toFixed(2)+'초',900);};
  if(q('#stSave'))q('#stSave').onclick=()=>{const id=stSave(q('#stName').value.trim(),!i.user);if(id){toast('저장했어요 · 스킬 모션 목록에 들어가요',1300);renderTab();}};
  q('#stSk').onclick=()=>{let mot=ST.mot,hit=null;const cur=motInfo(ST.mot);
    if(cur.type==='c'&&(ST.a>.02||ST.b<cur.dur-.02||ST.mir||!cur.user)){const id=stSave(q('#stName').value.trim()||cur.name,!cur.user);mot='c:'+id;}
    const ni=motInfo(mot);hit=ST.hit!=null?clamp(ST.hit/ni.dur,.02,.98):null;makeSkillFromMotion(mot,hit,q('#stName').value.trim());};
  if(q('#stDel'))q('#stDel').onclick=()=>{if(!confirm('이 모션을 지울까요?'))return;delete DB.motions[i.id];delete CLIPS[i.id];delete RAW[i.id];saveAll();stLoad('c:spinkick');renderTab();};
  q('#mvUp').onclick=()=>$('#fVideo').click();q('#camOpen').onclick=()=>camOpen(+q('#camSec').value,q('#mvName').value.trim());}
function makeSkillFromMotion(mot,hitFrac,nm0){const id='u'+Date.now().toString(36);const nm=nm0||(mot.startsWith('c:')?(CLIPS[mot.slice(2)]||{}).name:(KEYMOTION[mot.slice(2)]||{}).name);
  const c=mot.startsWith('c:')?CLIPS[mot.slice(2)]:null;const peak=c&&c.peak?(['anR','anL','wrR','wrL'].find(k=>c.peak[k]!=null)):undefined;const t=hitFrac!=null?hitFrac:(c?-1:.5);
  DB.skills[id]={id,name:(nm||'새')+' 스킬',rar:'R',cat:'kick',mot,hits:[H(t,2.6,1.4,1.4)],fx:[F(t,'impacts/hit-spark','front',1)],cd:2,peak,user:true};saveAll();refreshSK();skSel=id;curTab='skill';ST.on=false;renderTabs();renderTab();toast('모션으로 스킬을 만들었어요. 이름·등급·피해·효과를 정하고 저장하세요',2200);}
function mirrorFrame(f){const w=f.w.slice();const sw=[[11,12],[13,14],[15,16],[17,18],[19,20],[21,22],[23,24],[25,26],[27,28],[29,30],[31,32],[1,4],[2,5],[3,6],[7,8],[9,10]];
  for(let i=0;i<33;i++)w[i*3]=-w[i*3];sw.forEach(([a,b])=>{for(let k=0;k<3;k++){const t=w[a*3+k];w[a*3+k]=w[b*3+k];w[b*3+k]=t;}});return{w,r:[-f.r[0],f.r[1],f.r[2]]};}
function addUserMotion(c,url){const id='v'+Date.now().toString(36);c.v0=0;DB.motions[id]=c;RAW[id]=c;addClip(id,c);CLIPS[id].src='video';if(url)VIDS[id]=url;saveAll();stLoad('c:'+id);curTab='motion';renderTabs();renderTab();
  toast('모션을 만들었어요! 구간과 타격 순간을 맞추고 스킬로 만들어요',2400);}
$('#fVideo').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;const nmEl=$('#mvName');const name=(nmEl&&nmEl.value.trim())||f.name.replace(/\.[^.]+$/,'').slice(0,20)||'내 모션';
  try{const c=await videoToClip(f,name);if(!c)return;const url=c._url;delete c._url;addUserMotion(c,url);}
  catch(err){const m=$('#mvMsg');if(m)m.textContent='모션을 못 만들었어요: '+(err.message||err);toast('모션을 못 만들었어요',1400);}};
/* 카메라로 바로 찍기 */
let CAM={stream:null,face:'user',busy:false,secs:5,name:''};
async function camStart(){camStop();try{CAM.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:CAM.face,width:{ideal:640},height:{ideal:480}},audio:false});}
  catch(e){$('#camT').textContent='카메라를 켤 수 없어요. 카메라 권한을 허용해 주세요.';return false;}const v=$('#camV');v.srcObject=CAM.stream;v.style.transform=CAM.face==='user'?'scaleX(-1)':'';await v.play().catch(()=>{});return true;}
function camStop(){if(CAM.stream){CAM.stream.getTracks().forEach(t=>t.stop());CAM.stream=null;}}
async function camOpen(secs,name){CAM.secs=secs||5;CAM.name=name;$('#mCam').hidden=false;$('#camT').textContent='모션 인식 엔진 준비 중…';$('#camGo').disabled=true;
  try{await getPose();}catch(e){$('#camT').textContent='모션 인식 엔진을 못 불러왔어요';return;}
  if(await camStart()){$('#camT').textContent='몸 전체가 나오게 서서 [시작]을 눌러요';$('#camGo').disabled=false;}}
$('#camX').onclick=()=>{CAM.busy=false;camStop();$('#mCam').hidden=true;};
$('#camFlip').onclick=async()=>{if(CAM.busy)return;CAM.face=CAM.face==='user'?'environment':'user';await camStart();};
$('#camGo').onclick=async()=>{if(CAM.busy||!CAM.stream)return;CAM.busy=true;$('#camGo').disabled=true;const T=$('#camT'),v=$('#camV');
  for(let n=3;n>0;n--){T.textContent=n;sfx('Fx',.3,1.5);await new Promise(r=>setTimeout(r,800));if(!CAM.busy)return;}
  T.textContent='시작!';sfx('Fx',.4,2);const ps=await getPose();const raw=[];const t0=performance.now();let last=null;
  ps.onResults(r=>{if(r.poseWorldLandmarks&&r.poseLandmarks){const w=[];r.poseWorldLandmarks.forEach(p=>w.push(p.x,p.y,p.z));const nl=r.poseLandmarks;last={w,n:[(nl[23].x+nl[24].x)/2,(nl[23].y+nl[24].y)/2,Math.max(nl[27].y,nl[28].y,nl[31].y,nl[32].y)]};}});
  while(CAM.busy&&performance.now()-t0<CAM.secs*1000){const t=(performance.now()-t0)/1000;await ps.send({image:v});if(last)raw.push({t,w:last.w,n:last.n});T.textContent='● 녹화 중 '+t.toFixed(1)+'초';}
  const aspect=v.videoWidth/v.videoHeight||4/3;camStop();CAM.busy=false;$('#mCam').hidden=true;
  if(raw.length<6){toast('사람을 거의 찾지 못했어요. 몸 전체가 나오게 다시 찍어요',1800);return;}
  const fps=24,N=Math.floor(raw[raw.length-1].t*fps);const rs=[];let j=0;for(let k=0;k<=N;k++){const tt=k/fps;while(j<raw.length-1&&Math.abs(raw[j+1].t-tt)<=Math.abs(raw[j].t-tt))j++;let f=raw[j];
    if(CAM.face==='environment'){}rs.push({w:f.w,n:f.n});}
  const c=buildClip(rs,fps,aspect,CAM.name||'카메라 모션');addUserMotion(c,null);};

/* ---------- 아이템: 사진 → 무기 ---------- */
const ITYPES=[['sword','검','weapon'],['rapier','레이피어','weapon'],['axe','도끼','weapon'],['blunt','둔기·망치','weapon'],['spear','창','weapon'],['staff','지팡이','weapon'],['gun','총','weapon'],['shield','방패','shield'],['bow','활','bow']];
const PH={img:null,tol:40,px:32,rot:0,out:null};
function fileImg(file){return new Promise((res,rej)=>{const u=URL.createObjectURL(file);const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=u;});}
function processPhoto(){if(!PH.img)return null;const im=PH.img;const sc=Math.min(1,256/Math.max(im.width,im.height));const W=Math.max(1,Math.round(im.width*sc)),Hh=Math.max(1,Math.round(im.height*sc));
  const c=cnv(W,Hh),g=c.getContext('2d');g.drawImage(im,0,0,W,Hh);const d=g.getImageData(0,0,W,Hh),px=d.data;
  const at=(x,y)=>(y*W+x)*4;const corners=[at(0,0),at(W-1,0),at(0,Hh-1),at(W-1,Hh-1)];const transp=corners.every(i=>px[i+3]<20);
  if(!transp){const bg=[0,1,2].map(k=>corners.reduce((a,i)=>a+px[i+k],0)/4);const tol=PH.tol*PH.tol*3;const seen=new Uint8Array(W*Hh);const q=[];
    const near=i=>{const dr=px[i]-bg[0],dg=px[i+1]-bg[1],db=px[i+2]-bg[2];return dr*dr+dg*dg+db*db<tol;};
    for(let x=0;x<W;x++){q.push(x,0,x,Hh-1);}for(let y=0;y<Hh;y++){q.push(0,y,W-1,y);}
    while(q.length){const y=q.pop(),x=q.pop();if(x<0||y<0||x>=W||y>=Hh)continue;const k=y*W+x;if(seen[k])continue;seen[k]=1;const i=k*4;if(!near(i))continue;px[i+3]=0;q.push(x+1,y,x-1,y,x,y+1,x,y-1);}
    g.putImageData(d,0,0);}
  let x0=W,y0=Hh,x1=-1,y1=-1;for(let y=0;y<Hh;y++)for(let x=0;x<W;x++)if(px[at(x,y)+3]>40){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
  if(x1<0)return null;const cw=x1-x0+1,ch=y1-y0+1;
  // 회전
  const rot=PH.rot*PI/180;const rw=Math.ceil(Math.abs(cw*Math.cos(rot))+Math.abs(ch*Math.sin(rot))),rh=Math.ceil(Math.abs(cw*Math.sin(rot))+Math.abs(ch*Math.cos(rot)));
  const r=cnv(rw,rh),rg=r.getContext('2d');rg.translate(rw/2,rh/2);rg.rotate(rot);rg.drawImage(c,x0,y0,cw,ch,-cw/2,-ch/2,cw,ch);
  const s2=PH.px/Math.max(rw,rh);const ow=Math.max(1,Math.round(rw*s2)),oh=Math.max(1,Math.round(rh*s2));const o=cnv(ow,oh),og=o.getContext('2d');og.imageSmoothingEnabled=true;og.imageSmoothingQuality='high';og.drawImage(r,0,0,ow,oh);
  const od=og.getImageData(0,0,ow,oh);for(let i=3;i<od.data.length;i+=4)od.data[i]=od.data[i]>110?255:0;og.putImageData(od,0,0);return o;}
function tabItem(el){const made=Object.values(DB.items);
  el.innerHTML=`<div class="card"><b>📷 사진으로 장비 만들기</b><p class="note">칼·방패·총·활 사진이나 그림을 올리면 배경을 지우고 픽셀 아이템으로 만들어 캐릭터 손에 들려줘요. 무기는 <b>손잡이가 아래</b>로 오게 돌려 주세요.</p>
    <div class="row"><button class="pri" id="phUp">사진 고르기</button></div>
    <div class="row" style="align-items:flex-start"><canvas id="phPrev" width="160" height="160" style="background:repeating-conic-gradient(#222 0 25%,#2c2c2c 0 50%) 0 0/16px 16px;border-radius:10px;image-rendering:pixelated;width:160px;height:160px"></canvas>
      <div class="f" style="flex:1;grid-template-columns:70px 1fr"><label>배경 지우기</label><input id="phTol" type="range" min="0" max="120" value="${PH.tol}"><label>픽셀 크기</label><input id="phPx" type="range" min="12" max="64" value="${PH.px}"><label>돌리기</label><span><button id="phL">↺</button> <button id="phR">↻</button> <button id="ph45">45°</button> <span class="lab" id="phRot">${PH.rot}°</span></span></div></div>
    <div class="f"><label>종류</label><select id="phT">${ITYPES.map(([k,n])=>`<option value="${k}">${n}</option>`).join('')}</select>
      <label>이름</label><input id="phN" placeholder="예: 내 검">
      <label>등급</label><select id="phRar">${RARS.map(([r])=>`<option value="${r}">${RAR[r].name}</option>`).join('')}</select>
      <label id="phSL">공격력</label><input id="phS" type="number" value="12" min="1" max="999">
      <label>사거리</label><input id="phRe" type="number" step=".1" value="2.5" min="1" max="6">
      <label>활 종류</label><select id="phShot">${Object.keys(BOWTYPES).map(k=>`<option value="${k}">${BOWTYPES[k][0]} — ${BOWTYPES[k][1]}</option>`).join('')}</select>
      <label>속성</label><select id="phEl"><option value="">없음</option>${Object.keys(ELEM).map(k=>`<option value="${k}">${ELEM[k][0]}</option>`).join('')}</select>
      <label>손에 든 크기</label><input id="phSz" type="range" min=".5" max="2.5" step=".1" value="1"></div>
    <div class="btns"><button class="pri" id="phMake">만들어서 장착 창 열기</button></div></div>
  <h4>만든 아이템 ${made.length}개</h4><div class="grid">${made.map(it=>`<div class="it" data-gi="${it.id}" style="border-color:${RAR[it.rar].col}">${itemIcon(it)}<small>${esc(nm(it))}</small></div>`).join('')||'<p class="note">아직 없어요.</p>'}</div>
  ${made.length?'<p class="note">누르면 하나 더 받아요. 길게 생각할 것 없이 가방에서 바꿔 끼면 돼요.</p>':''}`;
  const draw=()=>{const o=processPhoto();PH.out=o;const pc=el.querySelector('#phPrev'),g=pc.getContext('2d');g.clearRect(0,0,160,160);if(!o)return;g.imageSmoothingEnabled=false;const s=Math.floor(150/Math.max(o.width,o.height))||1;g.drawImage(o,(160-o.width*s)/2,(160-o.height*s)/2,o.width*s,o.height*s);};
  const typeUpd=()=>{const t=el.querySelector('#phT').value;el.querySelector('#phSL').textContent=t==='shield'?'방어력':t==='bow'?'활 공격력':'공격력';el.querySelector('#phShot').disabled=t!=='bow';el.querySelector('#phRe').disabled=!['sword','rapier','axe','blunt','spear','staff'].includes(t);};
  el.querySelector('#phT').onchange=typeUpd;typeUpd();draw();
  el.querySelector('#phUp').onclick=()=>$('#fPhoto').click();
  el.querySelector('#phTol').oninput=e=>{PH.tol=+e.target.value;draw();};el.querySelector('#phPx').oninput=e=>{PH.px=+e.target.value;draw();};
  const rot=a=>{PH.rot=((PH.rot+a)%360+360)%360;el.querySelector('#phRot').textContent=PH.rot+'°';draw();};el.querySelector('#phL').onclick=()=>rot(-90);el.querySelector('#phR').onclick=()=>rot(90);el.querySelector('#ph45').onclick=()=>rot(45);
  el.querySelector('#phMake').onclick=()=>{if(!PH.out){toast('먼저 사진을 골라요',1000);return;}const t=el.querySelector('#phT').value;const ty=ITYPES.find(x=>x[0]===t);const rar=el.querySelector('#phRar').value;const v=+el.querySelector('#phS').value||10;
    const it={id:'p'+Date.now().toString(36),slot:ty[2],rar,name:el.querySelector('#phN').value.trim()||('내 '+ty[1]),img:PH.out.toDataURL('image/png'),size:+el.querySelector('#phSz').value||1,made:true};
    if(ty[2]==='weapon'){Object.assign(it,{wc:t,atk:v,spd:.4,reach:t==='gun'?14:+el.querySelector('#phRe').value||2.5});}else if(ty[2]==='shield')it.def=v;else{it.atk=v;it.shot=el.querySelector('#phShot').value;}
    const elx=el.querySelector('#phEl').value;if(elx)it.elem=elx;DB.items[it.id]=it;saveAll();renderTab();offer({kind:'item',it:Object.assign({},it,{id:'i'+Date.now().toString(36)})});};
  el.querySelectorAll('[data-gi]').forEach(b=>b.onclick=()=>{const it=DB.items[b.dataset.gi];offer({kind:'item',it:Object.assign({},it,{id:'i'+Date.now().toString(36)})});});}
$('#fPhoto').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{PH.img=await fileImg(f);PH.rot=0;if(curTab==='item')renderTab();}catch(err){toast('사진을 열 수 없어요',1200);}};

/* ---------- 몬스터 · 스킨 ---------- */
const skinThumbs={};
async function skinThumb(src){if(skinThumbs[src])return skinThumbs[src];const im=await load(src);const s=im.width/64;const c=cnv(32,32),g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(im,8*s,8*s,8*s,8*s,0,0,32,32);g.drawImage(im,40*s,8*s,8*s,8*s,0,0,32,32);return skinThumbs[src]=c;}
const partCount=p=>Object.keys(PACK).filter(k=>new RegExp('^a/sk/mcl_skins_'+p+'_\\d+\\.png$').test(k)).length;
let skinPick=null;
function tabMob(el){const ms=allMobIds();
  el.innerHTML=`<h4>내 캐릭터</h4><div class="f"><label>도복 윗옷</label><input type="color" id="cTop" value="${S.skin.topC}"><label>도복 바지</label><input type="color" id="cBot" value="${S.skin.bottomC}"><label>띠</label><input type="color" id="cBelt" value="${S.skin.belt||'#151515'}">
    <label>피부</label><input type="color" id="cBase" value="${S.skin.base}"><label>머리색</label><input type="color" id="cHairC" value="${S.skin.hairC}">
    <label>머리 모양</label><input type="number" id="cHair" min="0" max="${partCount('hair')}" value="${S.skin.hair}"><label>눈</label><input type="number" id="cEye" min="0" max="${partCount('eye')}" value="${S.skin.eye}"><label>모자</label><input type="number" id="cHead" min="0" max="${partCount('headwear')}" value="${S.skin.headwear}"></div>
    <div class="row"><button id="cMc">마크 스킨 파일 올리기 (64×64)</button>${S.mcskin?'<button id="cMcX" class="bad">스킨 빼고 도복으로</button>':''}<button id="cReset">기본 도복</button></div>
  <h4>몬스터 능력치 (바꾸면 바로 적용)</h4><div class="list">${ms.map(m=>{const d=mobDef(m.id);return`<div class="li" style="flex-wrap:wrap"><b style="min-width:84px">${BOSSES.includes(m)?'👑 ':''}${esc(d.name)}</b>
    <span class="lab">체력</span><input data-mo="${m.id}" data-k="hp" type="number" value="${d.hp}" style="width:62px"><span class="lab">공격</span><input data-mo="${m.id}" data-k="atk" type="number" value="${d.atk}" style="width:48px"><span class="lab">속도</span><input data-mo="${m.id}" data-k="spd" type="number" step=".1" value="${d.spd}" style="width:48px"><span class="lab">크기</span><input data-mo="${m.id}" data-k="scale" type="number" step=".1" value="${d.scale||1}" style="width:48px"><button data-sp="${m.id}">소환</button></div>`;}).join('')}</div>
  <div class="row"><button id="moReset">능력치 처음으로</button></div>
  <h4>올린 스킨 ${SKINS.length}개 · 누르면 쓰임새 고르기</h4><div class="row" id="skAct" ${skinPick?'':'hidden'}><span class="lab">고른 스킨:</span><button data-sa="mob">싸움꾼으로 소환</button><button data-sa="boss">거인 보스로 소환</button><button data-sa="me">내 캐릭터 스킨으로</button></div><div class="skins" id="skG"></div>`;
  const sk=()=>{S.skin.topC=$('#cTop').value;S.skin.bottomC=$('#cBot').value;S.skin.belt=$('#cBelt').value;S.skin.base=$('#cBase').value;S.skin.hairC=$('#cHairC').value;S.skin.hair=+$('#cHair').value;S.skin.eye=+$('#cEye').value;S.skin.headwear=+$('#cHead').value;S.mcskin=null;saveAll();refreshSkin();};
  ['cTop','cBot','cBelt','cBase','cHairC','cHair','cEye','cHead'].forEach(i=>el.querySelector('#'+i).onchange=sk);
  el.querySelector('#cMc').onclick=()=>$('#fSkin').click();const mx=el.querySelector('#cMcX');if(mx)mx.onclick=()=>{S.mcskin=null;saveAll();refreshSkin();renderTab();};
  el.querySelector('#cReset').onclick=()=>{S.skin=Object.assign({},DOBOK);S.mcskin=null;saveAll();refreshSkin();renderTab();};
  el.querySelectorAll('[data-mo]').forEach(i=>i.onchange=()=>{const id=i.dataset.mo;DB.mobs[id]=DB.mobs[id]||{};DB.mobs[id][i.dataset.k]=+i.value;saveAll();});
  el.querySelectorAll('[data-sp]').forEach(b=>b.onclick=async()=>{await ensureTrain();const p=dirPos('front',BOSSES.find(x=>x.id===b.dataset.sp)?5:3.4);spawnMob(b.dataset.sp,p.x,p.z);});
  el.querySelector('#moReset').onclick=()=>{DB.mobs={};saveAll();renderTab();};
  const G2=el.querySelector('#skG');SKINS.forEach(src=>{skinThumb(src).then(c=>{const k=cnv(32,32);k.getContext('2d').drawImage(c,0,0);k.title=src;if(src===skinPick)k.style.borderColor='var(--ac)';k.onclick=()=>{skinPick=src;G2.querySelectorAll('canvas').forEach(x=>x.style.borderColor='');k.style.borderColor='var(--ac)';el.querySelector('#skAct').hidden=false;};G2.appendChild(k);}).catch(()=>{});});
  el.querySelectorAll('[data-sa]').forEach(b=>b.onclick=async()=>{if(!skinPick)return;const a=b.dataset.sa;if(a==='me'){S.mcskin=skinPick;saveAll();await refreshSkin();toast('내 캐릭터 스킨을 바꿨어요',1000);return;}
    await ensureTrain();const p=dirPos('front',a==='boss'?5:3.4);spawnMob(a==='boss'?'giant':'brawler',p.x,p.z,{skin:skinPick});});}
$('#fSkin').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;const r=new FileReader();r.onload=async()=>{const im=await load(r.result).catch(()=>null);if(!im||im.width<64){toast('64×64 마크 스킨 PNG를 올려요',1400);return;}S.mcskin=r.result;saveAll();await refreshSkin();toast('내 스킨을 입혔어요',1000);if(curTab==='mob')renderTab();};r.readAsDataURL(f);};

/* ---------- 스테이지 ---------- */
function tabStage(el){const st=DB.stage;const num=(k,lab,step,min,max)=>`<label>${lab}</label><input data-st="${k}" type="number" step="${step}" min="${min}" max="${max}" value="${st[k]}">`;
  el.innerHTML=`<p class="note">스테이지는 매번 랜덤 지도로 만들어지고 끝없이 이어져요. 여기서 규칙을 정해요.</p>
  <h4>나오는 테마</h4><div class="row">${Object.keys(THEMES).map(k=>`<label style="white-space:nowrap"><input type="checkbox" class="stT" value="${k}" ${st.themes.includes(k)?'checked':''}> ${THEMES[k].name}</label>`).join('')}</div>
  <div class="f">${num('waves','웨이브 수',1,1,10)}${num('perWave','웨이브당 몬스터',1,1,30)}${num('grow','스테이지마다 증가',1,0,10)}${num('bossEvery','보스 간격',1,1,20)}${num('hpGrow','체력 증가율',.02,0,2)}${num('dropEquip','장비 드랍 확률',.01,0,1)}${num('dropSkill','스킬북 드랍',.01,0,1)}${num('dropDskin','데미지 스킨 드랍',.01,0,1)}${num('dropPoly','변신 카드 드랍',.01,0,1)}</div>
  <p class="note">보스 간격이 5면 5·10·15… 스테이지 마지막 웨이브에 보스가 나와요. 확률은 0~1 (0.3 = 30%).</p>
  <div class="row"><button class="pri" id="stGo">이 규칙으로 스테이지 1부터</button><button id="stNext">다음 스테이지 바로 가기</button><button id="stDef">처음 값으로</button></div>`;
  el.querySelectorAll('.stT').forEach(c=>c.onchange=()=>{st.themes=[...el.querySelectorAll('.stT:checked')].map(x=>x.value);saveAll();});
  el.querySelectorAll('[data-st]').forEach(i=>i.onchange=()=>{st[i.dataset.st]=+i.value;saveAll();});
  el.querySelector('#stGo').onclick=()=>{$('#maker').classList.remove('open');goPlay(1);};el.querySelector('#stNext').onclick=()=>{$('#maker').classList.remove('open');goPlay((S.stage||0)+1);};
  el.querySelector('#stDef').onclick=()=>{DB.stage=Object.assign({},DEF_STAGE);saveAll();renderTab();};}

/* ---------- 운영자 ---------- */
function tabOp(el){el.innerHTML=`<div class="row"><button id="oGod" class="${S.god?'on':''}">🛡 무적 ${S.god?'ON':'OFF'}</button><button id="oKill">☠ 몬스터 다 쓰러뜨리기</button><button id="oHeal">❤ 체력 가득</button><button id="oCoin">🪙 +1000</button></div>
  <p class="note">운영자 모드에서는 모든 스킬을 가지고 있는 것처럼 써볼 수 있어요.</p>
  <h4>아이템 주기 (장착 창이 떠요)</h4><div class="f"><label>부위</label><select id="gS">${['weapon','bow','helmet','chestplate','leggings','boots','dskin'].map(s=>`<option value="${s}">${SLOT_KO[s]}</option>`).join('')}</select>
    <label>등급</label><select id="gR">${RARS.map(([r])=>`<option value="${r}">${RAR[r].name}</option>`).join('')}</select><label>단계</label><input id="gT" type="number" min="0" max="9" value="3"></div>
  <div class="row"><button class="pri" id="gGo">받기</button><button id="gDrop">바닥에 떨어뜨리기</button><button id="gAllDs">데미지 스킨 전부 가방에</button></div>
  <h4>스킬북 주기</h4><div class="row"><select id="gSk" style="flex:1">${Object.values(SK).filter(s=>s.id[0]!=='_').map(s=>`<option value="${s.id}">[${RAR[s.rar].name}] ${esc(s.name)}</option>`).join('')}</select><button id="gSkGo">받기</button></div>
  <h4>스테이지 이동</h4><div class="row"><input id="gSt" type="number" min="1" max="999" value="${Math.max(1,S.stage||1)}" style="width:90px"><button id="gStGo">이동</button></div>
  <h4>보스 바로 부르기</h4><div class="row">${BOSSES.map(b=>`<button data-boss="${b.id}">${b.name}</button>`).join('')}</div>
  <div class="row"><button class="bad" id="oOff">운영자 모드 끄기</button></div>`;
  el.querySelector('#oGod').onclick=()=>{S.god=!S.god;renderTab();};el.querySelector('#oKill').onclick=()=>mobs.filter(m=>!m.dead&&!m.dummy).forEach(m=>hurtMob(m,m.hp+1,true));
  el.querySelector('#oHeal').onclick=()=>{P.hp=P.max;updHP();};el.querySelector('#oCoin').onclick=()=>{S.coins+=1000;$('#coinT').textContent=S.coins;saveAll();};
  const mk=()=>makeItem($('#gS').value,+$('#gT').value||0,$('#gR').value);
  el.querySelector('#gGo').onclick=()=>offer({kind:'item',it:mk()});el.querySelector('#gDrop').onclick=()=>{dropThing({kind:'item',it:mk()},dirPos('front',1.8));$('#maker').classList.remove('open');};
  el.querySelector('#gAllDs').onclick=()=>{DSKINS.forEach(d=>{const it=makeItem('dskin',0,d.rar);it.k=d.id;it.name=d.name+' 데미지 스킨';S.bag.push(it);});saveAll();toast('데미지 스킨 '+DSKINS.length+'개를 가방에 넣었어요',1400);};
  el.querySelector('#gSkGo').onclick=()=>offer({kind:'skill',id:$('#gSk').value});
  el.querySelector('#gStGo').onclick=()=>{$('#maker').classList.remove('open');goPlay(+$('#gSt').value||1);};
  el.querySelectorAll('[data-boss]').forEach(b=>b.onclick=async()=>{if(MODE==='idle')await goTrain();const p=dirPos('front',6);spawnMob(b.dataset.boss,p.x,p.z);});
  el.querySelector('#oOff').onclick=()=>{try{sessionStorage.removeItem('jd_maker_admin');}catch(e){}S.op=false;S.god=false;$('#maker').classList.remove('open');buildPad();toast('운영자 모드를 껐어요',1000);};}

/* ---------- 저장 ---------- */
function tabSave(el){const n=Object.keys(DB.skills).length,m=Object.keys(DB.motions).length,i=Object.keys(DB.items).length;
  el.innerHTML=`<p class="note">만든 것은 이 기기에 자동 저장돼요. 다른 폰·컴퓨터로 옮기려면 파일로 내보내고, 거기서 불러와요.</p>
  <div class="card">스킬 ${n}개 · 모션 ${m}개 · 아이템 ${i}개 · 최고 스테이지 ${S.best||0}</div>
  <div class="row"><button class="pri" id="svEx">📤 파일로 내보내기</button><button id="svIm">📥 파일 불러오기</button></div>
  <div class="row"><button class="bad" id="svRs">게임 진행만 초기화</button><button class="bad" id="svAll">전부 지우기</button></div>`;
  el.querySelector('#svEx').onclick=()=>{const d=new Date();const ymd=d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0');
    const blob=new Blob([JSON.stringify({app:'jungdo-game-maker',v:1,DB,S:{slots:S.slots,combo:S.combo,skin:S.skin,mcskin:S.mcskin}})],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='jungdo_maker_'+ymd+'.json';a.click();};
  el.querySelector('#svIm').onclick=()=>$('#fJson').click();
  el.querySelector('#svRs').onclick=()=>{if(!confirm('코인·가방·장비·스테이지 기록을 지울까요? (만든 스킬·모션·아이템은 남아요)'))return;Object.assign(S,{coins:0,stage:0,best:0,bag:[],eq:{},owned:[]});saveAll();location.reload();};
  el.querySelector('#svAll').onclick=()=>{if(!confirm('정말 전부 지울까요? 만든 것도 모두 사라져요.'))return;try{localStorage.removeItem(SKEY);}catch(e){}location.reload();};}
$('#fJson').onchange=e=>{const f=e.target.files[0];e.target.value='';if(!f)return;const r=new FileReader();r.onload=()=>{try{const j=JSON.parse(r.result);if(!j.DB)throw 0;
  Object.assign(DB.skills,j.DB.skills||{});Object.assign(DB.motions,j.DB.motions||{});Object.assign(DB.items,j.DB.items||{});if(j.DB.stage)DB.stage=Object.assign({},DEF_STAGE,j.DB.stage);if(j.DB.mobs)DB.mobs=j.DB.mobs;
  if(j.S){['slots','combo','skin','mcskin'].forEach(k=>{if(j.S[k]!==undefined)S[k]=j.S[k];});}
  Object.assign(RAW,DB.motions);Object.keys(DB.motions).forEach(id=>{addClip(id,DB.motions[id]);CLIPS[id].src='video';});saveAll();refreshSK();buildPad();refreshSkin();renderTab();toast('불러왔어요',1000);}catch(err){toast('맞는 파일이 아니에요',1200);}};r.readAsText(f);};

/* ================= 시작 ================= */
(async function init(){$('#waveT').textContent='불러오는 중…';
  await packReady;
  try{const cj=await (await fetch('clips.json')).json();Object.assign(RAW,cj);Object.keys(cj).forEach(id=>{try{addClip(id,cj[id]);CLIPS[id].src='mocap';}catch(e){}});}catch(e){console.warn('clips',e);}
  Object.assign(RAW,DB.motions);Object.keys(DB.motions).forEach(id=>{try{addClip(id,DB.motions[id]);CLIPS[id].src='video';}catch(e){}});
  COINTEX=tex(await load('a/fx/Coin2.png').then(i=>{const c=cnv(i.height,i.height);c.getContext('2d').drawImage(i,0,0);return c;}).catch(()=>solid('#ffd24a')));
  ARROWIMG=await load('a/wp/Arrow.png').catch(()=>null);
  if(!S.eq.weapon){S.eq.weapon=makeItem('weapon',1,'N');S.eq.bow=makeItem('bow',0,'N');}
  if(!S.owned.length)S.owned=[...new Set([...S.slots,...S.combo].filter(Boolean))];
  if(!S.v2){if(!DB.stage.themes.includes('duel'))DB.stage.themes.push('duel');S.v2=1;}DEF_STAGE.themes=Object.keys(THEMES);if(DB.stage.dropPoly==null)DB.stage.dropPoly=.04;DEF_STAGE.dropPoly=.04;
  duReady().then(U=>{DU._cache=U;}).catch(()=>{});
  await buildMap('forest',{empty:true,size:24});await buildPlayer();if(S.polyOn&&S.eq.poly)applyPoly();buildPad();$('#coinT').textContent=S.coins;if(window.linInit)linInit();
  if(S.best>1){$('#sCont').hidden=false;$('#sCont').textContent='▶ 이어하기 (스테이지 '+S.best+')';}
  $('#waveT').textContent='정도 게임 메이커';requestAnimationFrame(loop);})();
