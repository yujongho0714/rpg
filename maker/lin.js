/* 정도 게임 메이커 — MMORPG 시스템 (레벨·MP·아데나·인벤토리·강화·물약·주문서·퀵슬롯·미니맵) + 모바일 MMO 화면 배치
   아이콘: rpg-icon-mega-pack (CC0) */
'use strict';
let ICO=null;fetch('ic/icons.json').then(r=>r.json()).then(j=>{ICO=j;try{linRefreshAll();}catch(e){}});
function ico(key,sz=32){const e=ICO&&ICO[key];if(!e)return`<span style="display:inline-block;width:${sz}px;height:${sz}px"></span>`;const i=e[0],c=40,s=sz/32;
  return`<span class="ic" style="width:${sz}px;height:${sz}px;background-position:-${(i%c)*sz}px -${Math.floor(i/c)*sz}px;background-size:${c*sz}px auto"></span>`;}
/* ---------- 상태 ---------- */
S.lin=Object.assign({lv:1,exp:0,mp:40,inv:{},qs:['pot_r','pot_o','pot_haste','pot_brave','scr_tel','scr_ret',null,null],autoHp:55,autoOn:true,buff:{},kit:false},S.lin||{});
const L=S.lin;
/* ---------- 아이템 사전 ---------- */
const CONS={
  pot_r:{n:'체력 회복제',ic:'potions/healing_potion_flask_cork',d:'체력을 40 회복해요.',price:25,use:()=>healP(40,'#ff6a6a')},
  pot_o:{n:'고급 체력 회복제',ic:'potions/healing_potion_square_bottle_cork',d:'체력을 90 회복해요.',price:70,use:()=>healP(90,'#ffa04a')},
  pot_c:{n:'강력 체력 회복제',ic:'potions/healing_elixir_bulb',d:'체력을 200 회복해요.',price:180,use:()=>healP(200,'#ffffff')},
  pot_mp:{n:'마나 회복제',ic:'potions/mana_potion_flask_cap',d:'마나를 30 회복해요.',price:60,use:()=>{L.mp=Math.min(mpMax(),L.mp+30);kp('magic_02',P.pos.clone().setY(.05),{color:0x4aa3ff,size:2,life:.5});return true;}},
  pot_haste:{n:'속도 향상 물약',ic:'potions/nature_potion_flask',d:'5분 동안 이동 속도가 1.3배가 돼요.',price:120,use:()=>buff('haste',300)},
  pot_brave:{n:'용기의 물약',ic:'potions/fire_potion_flask_cork',d:'5분 동안 공격 속도가 1.25배가 돼요.',price:200,use:()=>buff('brave',300)},
  scr_tel:{n:'순간이동 주문서',ic:'magic/rolled_scroll_wax_blue',d:'지금 있는 사냥터(또는 맵) 안 아무 곳으로 순간이동해요.',price:40,use:()=>teleport()},
  scr_ret:{n:'귀환 주문서',ic:'magic/rolled_scroll_wax_red',d:'정도 마을로 돌아가요.',price:60,use:()=>{msg('마을로 돌아갑니다');goWorld({x:ZONES[0].x,z:ZONES[0].z+4});return true;}},
  scr_poly:{n:'변신 주문서',ic:'magic/torn_scroll_gold',d:'무작위 유닛 변신 카드를 얻어요. 레벨이 높을수록 좋은 등급이 잘 나와요.',price:500,use:()=>{usePolyScroll();return true;}},
  scr_ew:{n:'무기 강화 주문서',ic:'magic/tied_scroll_wax_red',d:'무기를 +1 강화해요. 안전 강화(+6)를 넘으면 실패할 수 있고, 실패하면 무기가 사라져요.',price:800,ench:'w'},
  scr_ea:{n:'갑옷 강화 주문서',ic:'magic/tied_scroll_wax_blue',d:'방어구를 +1 강화해요. 안전 강화(+4)를 넘으면 실패할 수 있고, 실패하면 방어구가 사라져요.',price:500,ench:'a'},
  scr_bew:{n:'축복받은 무기 강화 주문서',ic:'magic/ancient_scroll_gold',d:'안전 강화 안에서는 +1~+3을 한 번에 올려요.',price:3000,ench:'w',bl:true},
  scr_bea:{n:'축복받은 갑옷 강화 주문서',ic:'magic/ancient_scroll_wax_red',d:'안전 강화 안에서는 +1~+3을 한 번에 올려요.',price:2000,ench:'a',bl:true},
};
const SHOP=['pot_r','pot_o','pot_c','pot_mp','pot_haste','pot_brave','scr_tel','scr_ret','scr_poly','scr_ew','scr_ea','scr_bew','scr_bea'];
/* 추가 장비 부위 */
const XSLOT={tshirt:['티셔츠',['armor/robes_chestplate']],cloak:['망토',['armor/red_traveler_cloak','armor/blue_traveler_cloak','armor/green_royal_cloak','armor/purple_hooded_cloak']],gloves:['장갑',['armor/glove_gauntlet','armor/leather_mitten_gauntlet','armor/iron_plate_gauntlet','armor/steel_clawed_gauntlet']],
  belt:['벨트',['armor/brown_square_belt','armor/black_gem_belt','armor/red_skull_belt']],ring1:['반지',['treasure/silver_ring_ruby','treasure/gold_ring_emerald','treasure/dark_ring_diamond']],ring2:['반지',['treasure/bronze_ring_ruby','treasure/gold_ring_diamond','treasure/silver_ring_emerald']],
  amulet:['목걸이',['treasure/teardrop_amulet_ruby','treasure/circle_amulet_sapphire','treasure/fang_amulet_amber']],earring:['귀걸이',['treasure/aqua_diamond_gem','treasure/rose_oval_gem','treasure/topaz_round_gem']]};
Object.keys(XSLOT).forEach(k=>SLOT_KO[k]=XSLOT[k][0]);
const SLOT_IC={helmet:['armor/iron_knight_helmet','armor/steel_nasal_helmet','armor/mithril_cuirass_chestplate'],chestplate:['armor/leather_chestplate','armor/iron_chainmail_chestplate','armor/steel_plate_chestplate','armor/mithril_plate_chestplate'],
  leggings:['armor/leather_greave','armor/iron_greave','armor/steel_greave'],boots:['armor/boot','armor/leather_sabaton','armor/iron_sabaton','armor/steel_sabaton'],shield:['armor/iron_kite_shield','armor/steel_tower_shield']};
const ACC=['ring1','ring2','amulet','earring','belt'];
const ARMORISH=[...ASLOTS,'tshirt','cloak','gloves','shield'];
function makeXItem(slot,tier,rar){const R=RAR[rar];const T=XSLOT[slot];const it={id:'x'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),slot,rar,tier,en:0,name:'',ic:T[1][Math.min(T[1].length-1,Math.floor(tier/3))]};
  const g=1+R.i;
  if(slot==='tshirt'){it.def=1+Math.floor(tier/3);it.name=['면','비단','용비늘'][Math.min(2,Math.floor(tier/4))]+' 티셔츠';}
  else if(slot==='cloak'){it.def=1+Math.floor(tier/2);it.name=['여행자','근위대','왕실','그림자'][Math.min(3,Math.floor(tier/3))]+' 망토';}
  else if(slot==='gloves'){it.def=1+Math.floor(tier/3);it.patk=g;it.name=['가죽','사슬','판금','발톱'][Math.min(3,Math.floor(tier/3))]+' 장갑';}
  else if(slot==='belt'){it.hp=10*g+tier*4;it.name=['가죽','보석','해골'][Math.min(2,Math.floor(tier/4))]+' 벨트';}
  else if(slot==='ring1'||slot==='ring2'){it.dmg=Math.ceil(g/2)+Math.floor(tier/4);it.name=['힘의','민첩의','파괴의','용사의'][Math.min(3,Math.floor(tier/3))]+' 반지';}
  else if(slot==='amulet'){it.hp=15*g+tier*5;it.def=Math.floor(g/2);it.name=['수호의','생명의','용맹의'][Math.min(2,Math.floor(tier/4))]+' 목걸이';}
  else if(slot==='earring'){it.mpx=8*g+tier*3;it.mreg=+(0.3*g).toFixed(1);it.name=['지혜의','마력의','현자의'][Math.min(2,Math.floor(tier/4))]+' 귀걸이';}
  return it;}
const _makeItem0=makeItem;makeItem=function(slot,tier,rar){if(XSLOT[slot])return makeXItem(slot,tier,rar);if(slot==='shield'){const it={id:'s'+Date.now().toString(36),slot:'shield',rar,tier,en:0,def:2+Math.floor(tier/2)+RAR[rar].i,name:['나무','강철','탑','기사'][Math.min(3,Math.floor(tier/3))]+' 방패',ic:SLOT_IC.shield[tier>4?1:0]};return it;}
  const it=_makeItem0(slot,tier,rar);it.en=0;if(SLOT_IC[slot])it.ic=SLOT_IC[slot][Math.min(SLOT_IC[slot].length-1,Math.floor(tier/3))];return it;};
const nm=it=>it?((it.en?'+'+it.en+' ':'')+it.name):'';
/* ---------- 능력치 ---------- */
const needExp=lv=>Math.round(60*Math.pow(lv,1.75));
function eqAll(){return Object.keys(S.eq).map(k=>S.eq[k]).filter(Boolean);}
function mpMax(){let m=40+L.lv*4;eqAll().forEach(i=>m+=i.mpx||0);return m;}
const _stats1=stats;stats=function(){const s=_stats1();const w=S.eq.weapon;if(w&&w.en){s.atk+=w.en*2+(w.en>6?(w.en-6)*2:0);}
  let dmg=0,hp=0,pa=0;eqAll().forEach(i=>{if(i!==w&&ARMORISH.includes(i.slot))s.def+=(i.en||0)+(XSLOT[i.slot]?i.def||0:0);dmg+=i.dmg||0;hp+=i.hp||0;pa+=i.patk||0;});
  s.atk+=dmg;s.kick+=dmg;s.atk=Math.round(s.atk*(1+pa/100));s.kick=Math.round(s.kick*(1+pa/100));s.max+=hp+(L.lv-1)*9;return s;};
/* ---------- 메시지 (시스템 로그) ---------- */
function msg(t,col){const box=$('#lmLog');if(!box)return;const e=document.createElement('div');e.innerHTML=t;if(col)e.style.color=col;box.appendChild(e);while(box.children.length>6)box.firstChild.remove();setTimeout(()=>{e.style.opacity=0;setTimeout(()=>e.remove(),600);},6000);}
/* ---------- 인벤토리 ---------- */
function give(k,n=1,quiet){L.inv[k]=(L.inv[k]||0)+n;if(!quiet)msg(`${ico(CONS[k].ic,16)} ${CONS[k].n} (${n}) 획득`,'#cfe8ff');qsTick();saveAll();}
function take(k,n=1){if((L.inv[k]||0)<n)return false;L.inv[k]-=n;if(!L.inv[k])delete L.inv[k];qsTick();return true;}
function weight(){let w=0;Object.keys(L.inv).forEach(k=>w+=L.inv[k]*.2);w+=S.bag.length*3;eqAll().forEach(()=>w+=2);return Math.min(100,Math.round(w/ (50+L.lv*2) *100));}
const potCd={t:0};
function useItem(k){const c=CONS[k];if(!c||!(L.inv[k]>0))return false;if(MODE==='idle'&&k!=='scr_poly'&&!c.ench){toast('게임을 시작한 뒤에 쓸 수 있어요',1000);return false;}
  if(c.ench){enchantPick(k);return true;}if(k.startsWith('pot_')&&potCd.t>0)return false;
  if(c.use()!==false){take(k);if(k.startsWith('pot_'))potCd.t=.35;sfx('Bonus',.25,1.4);saveAll();return true;}return false;}
function healP(v,col){if(P.dead)return false;if(P.hp>=P.max){msg('체력이 가득 차 있어요');return false;}P.hp=Math.min(P.max,P.hp+v);updHP();kp('magic_02',P.pos.clone().setY(.05),{color:new THREE.Color(col).getHex(),size:2,life:.5});dmgText(P.pos,'+'+v,'heal');return true;}
function buff(k,sec){L.buff[k]=performance.now()/1000+sec;msg((k==='haste'?'몸이 빨라집니다':'용기가 솟아납니다')+` (${Math.round(sec/60)}분)`,'#9fffb0');pfx('holy/heal-aoe',P.pos.clone().setY(.05),{scale:.7});buffUI();return true;}
const hasBuff=k=>(L.buff[k]||0)>performance.now()/1000;
function teleport(){const H=MAP.N/2-2;const Z=MODE==='world'&&typeof inZone==='function'?inZone():null;for(let i=0;i<60;i++){let x=rnd(-H,H),z=rnd(-H,H);if(MODE==='world'){const c=Z&&Z.lv?Z:pick(ZONES.filter(q=>q.lv&&q.lv<=L.lv+5).concat([ZONES[1]]));x=c.x+rnd(-HW*1.5,HW*1.5);z=c.z+rnd(-HW*1.5,HW*1.5);}if(!isSolid(x,z)&&!isSolid(x+.4,z)&&!isSolid(x-.4,z)){pfx('arcane/mana-burst',P.pos.clone().setY(.05),{scale:.9});P.pos.set(x,0,z);pfx('arcane/mana-burst',P.pos.clone().setY(.05),{scale:.9});sfx('Magic1',.3,1.6);cam.position.set(x,12,z+11);return true;}}return false;}
async function usePolyScroll(){const U=await duReady();DU._cache=U;const pool=await duPool(Math.random()<.04+L.lv*.002?'boss':'unit');const uid=pick(pool);offer({kind:'item',it:makePoly(uid,randRar(Math.min(.5,L.lv*.012)))});}
/* ---------- 강화 ---------- */
function enchantPick(k){const c=CONS[k];const box=$('#offerBox');openModal('#mOffer');
  const ok=it=>it&&(c.ench==='w'?it.slot==='weapon':ARMORISH.includes(it.slot));
  const list=[...Object.keys(S.eq).map(s=>({it:S.eq[s],eq:true})),...S.bag.map(it=>({it}))].filter(x=>ok(x.it));
  box.innerHTML=`<h2>${ico(c.ic,28)} ${c.n} <span class="lab" style="font-family:'Do Hyeon'">(${L.inv[k]||0}개)</span><button class="x" data-x>✕</button></h2><p class="note">${c.d}</p>
    <div class="list">${list.map((x,i)=>{const s=safeEn(x.it);const risk=(x.it.en||0)>=s;return`<div class="li" data-i="${i}" style="border-color:${RAR[x.it.rar].col}">${itemIcon(x.it)} <b>${esc(nm(x.it))}</b>${x.eq?' <span class="lab">장착 중</span>':''}<span class="r ${risk?'dn':'up'}">${risk?'성공 '+Math.round(enChance(x.it)*100)+'% · 실패 시 사라짐':'안전 강화'}</span></div>`;}).join('')||'<p class="note">강화할 장비가 없어요.</p>'}</div>`;
  box.onclick=e=>{if(e.target.closest('[data-x]')){closeModal('#mOffer');return;}const li=e.target.closest('[data-i]');if(!li)return;const x=list[+li.dataset.i];doEnchant(k,x.it,x.eq);};}
const safeEn=it=>it.slot==='weapon'?6:4;
const enChance=it=>{const e=it.en||0,s=safeEn(it);return e<s?1:Math.max(.08,(it.slot==='weapon'?.5:.4)-(e-s)*.07);};
function doEnchant(k,it,eq){if(!take(k))return;const c=CONS[k];const box=$('#offerBox');const e0=it.en||0;const s=safeEn(it);let up=0;
  const ok=Math.random()<enChance(it);if(ok){up=c.bl&&e0<s?Math.min(s-e0,1+Math.floor(Math.random()*3)):1;}
  box.innerHTML=`<div style="text-align:center;padding:20px"><div style="display:inline-block;transform:scale(2.4);margin:24px">${itemIcon(it)}</div><div id="enT" style="font-family:'Black Han Sans';font-size:22px">강화 중…</div></div>`;sfx('Magic1',.35,.9);
  setTimeout(()=>{const T=$('#enT');if(ok){const before=nm(it);it.en=e0+up;T.innerHTML=`<span style="color:#7ad0ff">${esc(before)}</span> → <span style="color:#ffd24a">${esc(nm(it))}</span><br><span class="up">강화 성공!</span>`;msg(`${esc(before)} 강화 성공 → <b>+${it.en}</b>`,'#7ad0ff');sfx('Success1',.45);
      if(it.en>=7)pfx('holy/heal-aoe',P.pos.clone().setY(.05),{scale:1.2});}
    else{T.innerHTML=`<span class="dn">${esc(nm(it))}이(가) 강화에 실패해서 사라졌어요…</span>`;msg(`${esc(nm(it))} 강화 실패 · 사라짐`,'#ff6a6a');sfx('GameOver',.35,1.3);
      if(eq){Object.keys(S.eq).forEach(s=>{if(S.eq[s]===it)delete S.eq[s];});refreshGear().then(buildPad);}else{const i=S.bag.indexOf(it);if(i>=0)S.bag.splice(i,1);}}
    saveAll();updStats();setTimeout(()=>{if(!$('#mOffer').hidden)closeModal('#mOffer');},1600);},900);}
/* ---------- 레벨 · 경험치 · 아데나 · 드랍 ---------- */
const _hurtMob0=hurtMob;hurtMob=function(m,v,crit,kb3,o){const was=m&&!m.dead;_hurtMob0(m,v,crit,kb3,o);if(was&&m.dead&&!m.dummy)onKill(m);};
function onKill(m){const ex=Math.round(m.max*.6*(m.boss?3:1));addExp(ex);const ad=Math.round((m.boss?150:8)*(1+S.stage*.15)*rnd(.7,1.3));S.coins+=ad;
  msg(`${ico('treasure/gold_coins_pile',16)} 아데나 (${ad}) 획득`,'#ffe08a');const r=Math.random();
  if(r<.22)give('pot_r',1+Math.floor(Math.random()*3));else if(r<.27)give('pot_o',1);else if(r<.30)give('scr_tel',1);else if(r<.315)give('scr_ea',1);else if(r<.325)give('scr_ew',1);else if(r<.33)give('scr_poly',1);
  if(m.boss){give('scr_bew',1);give('pot_c',3);}if(Math.random()<.06){const sl=pick(Object.keys(XSLOT));dropThing({kind:'item',it:makeXItem(sl,clamp(Math.floor(S.stage/2+rnd(0,2)),0,9),randRar(m.boss?.35:0))},m.pos.clone().add(new V3(.6,0,-.6)));}
  $('#coinT').textContent=S.coins;linHUD();}
function addExp(v){L.exp+=v;let up=false;while(L.exp>=needExp(L.lv)){L.exp-=needExp(L.lv);L.lv++;up=true;}
  if(up){updStats();P.hp=P.max;L.mp=mpMax();updHP();msg(`<b>레벨 업!</b> Lv.${L.lv}`,'#ffd24a');showMove('LEVEL UP!  Lv.'+L.lv,'#ffd24a');pfx('holy/heal-aoe',P.pos.clone().setY(.05),{scale:1.4});sfx('Success1',.5,1.1);}saveAll();}
const _die0=die;die=function(){const lost=Math.round(needExp(L.lv)*.03);L.exp=Math.max(0,L.exp-lost);msg(`경험치 ${lost} 잃음`,'#ff6a6a');_die0();};
/* MP를 쓰는 스킬 (U I O P) */
const mpCost=sk=>sk?3+((RAR[sk.rar]||RAR.N).i)*2+(sk.cd>4?3:0):0;
const _useSkill1=useSkill;useSkill=function(id,slot){const sk=SK[id];const paid='UIOP'.includes(slot||'_')&&slot;const c=paid?mpCost(sk):0;
  if(c&&L.mp<c&&!S.god){msg('마나가 부족해요','#7ab8ff');return false;}
  const pc=(hasBuff('brave'))&&sk&&!sk._fast;let r;if(pc){const s0=sk.spd;sk.spd=(s0||1)*1.25;r=_useSkill1(id,slot);sk.spd=s0;if(!s0)delete sk.spd;}else r=_useSkill1(id,slot);
  if(r&&c&&!S.god)L.mp-=c;return r;};
const _polySpeed0=polySpeed;polySpeed=function(){return _polySpeed0()*(hasBuff('haste')?1.3:1);};
/* ---------- 매 프레임 ---------- */
let linT=0;
function linTick(dt){if(potCd.t>0)potCd.t-=dt;if(!P.dead&&MODE!=='idle'){let reg=.8+L.lv*.04;eqAll().forEach(i=>reg+=i.mreg||0);L.mp=Math.min(mpMax(),L.mp+reg*dt);
    if(L.autoOn&&P.hp/P.max*100<L.autoHp&&potCd.t<=0){for(const k of ['pot_r','pot_o','pot_c'])if(L.inv[k]>0){useItem(k);break;}}}
  linT+=dt;if(linT>.15){linT=0;linHUD();miniMap();}}
/* ---------- 화면 (모바일 MMO 배치) ---------- */
function linHUD(){const s=stats();$('#lmLv').textContent=L.lv;$('#lmHpB').style.width=(100*P.hp/P.max)+'%';$('#lmHpT').textContent=Math.ceil(P.hp)+' / '+P.max;
  const mm=mpMax();$('#lmMpB').style.width=(100*L.mp/mm)+'%';$('#lmMpT').textContent=Math.floor(L.mp)+' / '+mm;const ne=needExp(L.lv);$('#lmExpB').style.width=(100*L.exp/ne)+'%';$('#lmExpT').textContent='Lv.'+L.lv+'  '+(100*L.exp/ne).toFixed(2)+'%';
  $('#lmAd').textContent=S.coins.toLocaleString();$('#lmWt').textContent=weight()+'%';$('#lmAtk').textContent=s.atk;$('#lmAc').textContent=s.def;buffUI();}
function buffUI(){const b=$('#lmBuff');if(!b)return;const now=performance.now()/1000;let h='';
  [['haste','pot_haste'],['brave','pot_brave']].forEach(([k,c])=>{const t=(L.buff[k]||0)-now;if(t>0)h+=`<span class="bf">${ico(CONS[c].ic,20)}<i>${Math.ceil(t/60)}분</i></span>`;});
  if(S.polyOn&&S.eq.poly)h+=`<span class="bf" title="${esc(S.eq.poly.name)}">🎭<i>변신</i></span>`;if(AUTO.on)h+=`<span class="bf">🤖<i>자동</i></span>`;if(b.innerHTML!==h)b.innerHTML=h;}
function qsBuild(){const q=$('#lmQuick');q.innerHTML=L.qs.map((k,i)=>`<div class="qs" data-q="${i}">${k&&CONS[k]?ico(CONS[k].ic,32):''}<b>${i+1}</b><i>${k&&CONS[k]?(L.inv[k]||0):''}</i></div>`).join('')+`<div class="qs auto ${L.autoOn?'on':''}" data-q="ap" title="자동 물약">❤<b>자동</b><i>${L.autoHp}%</i></div>`;
  q.querySelectorAll('.qs').forEach(el=>el.addEventListener('pointerdown',e=>{e.preventDefault();const i=el.dataset.q;if(i==='ap'){openSettings();return;}const k=L.qs[+i];if(!k){openInv();return;}useItem(k);}));}
function qsTick(){$$('#lmQuick .qs').forEach(el=>{const i=el.dataset.q;if(i==='ap'){el.classList.toggle('on',L.autoOn);el.querySelector('i').textContent=L.autoHp+'%';return;}const k=L.qs[+i];const n=k?(L.inv[k]||0):0;el.querySelector('i').textContent=k?n:'';el.style.opacity=k&&!n?.45:1;});}
addEventListener('keydown',e=>{if(e.target.matches('input,select,textarea'))return;if(/^[1-8]$/.test(e.key)){const k=L.qs[+e.key-1];if(k)useItem(k);}if(e.key==='Tab'||e.key==='b'||e.key==='ㅠ'){e.preventDefault();$('#mBag').hidden?openInv():closeModal('#mBag');}if(e.key==='c'||e.key==='ㅊ'){openChar();}});
/* 미니맵 */
function miniMap(){if(MODE==='world'&&typeof worldMini==='function')return worldMini();const c=$('#lmMap');if(!c||!MAP.solid)return;const g=c.getContext('2d'),W=c.width,N=MAP.N,s=W/N,H=N/2;g.fillStyle='rgba(8,10,16,.85)';g.fillRect(0,0,W,W);g.fillStyle='#3a4254';
  for(let j=0;j<N;j++)for(let i=0;i<N;i++)if(MAP.solid[j*N+i])g.fillRect(i*s,j*s,s+.5,s+.5);
  const dot=(x,z,col,r)=>{g.fillStyle=col;g.beginPath();g.arc((x+H)*s,(z+H)*s,r,0,7);g.fill();};
  drops.forEach(d=>dot(d.g.position.x,d.g.position.z,'#ffd24a',2));mobs.forEach(m=>{if(!m.dead)dot(m.pos.x,m.pos.z,m.dummy?'#9a7a4a':m.boss?'#c07bff':'#ff4a4a',m.boss?4:2.2);});
  if(portal)dot(portal.position.x,portal.position.z,'#4aa3ff',4);
  const px=(P.pos.x+H)*s,pz=(P.pos.z+H)*s;g.save();g.translate(px,pz);g.rotate(-P.face+Math.PI);g.fillStyle='#fff';g.beginPath();g.moveTo(0,-5);g.lineTo(4,4);g.lineTo(-4,4);g.fill();g.restore();
  $('#lmMapT').textContent=MODE==='train'?'마을 · 연습장':MODE==='play'?(THEMES[MAP.theme]||{}).name+' '+S.stage+'층':'';}
/* ---------- 창: 인벤토리 ---------- */
let invSel=null;
function invCell(o){if(o.k){const c=CONS[o.k];return`<div class="iv" data-k="${o.k}">${ico(c.ic,32)}<i>${L.inv[o.k]}</i></div>`;}const it=o.it;return`<div class="iv" data-b="${o.i}" style="border-color:${RAR[it.rar].col}">${itemIcon(it,'ico32')}${it.en?`<em>+${it.en}</em>`:''}</div>`;}
function openInv(){const box=$('#bagBox');openModal('#mBag');const cells=[...Object.keys(L.inv).filter(k=>CONS[k]).map(k=>({k})),...S.bag.map((it,i)=>({it,i}))];
  let det='<p class="note">아이템을 누르면 자세히 보여요. 숫자키 1~8은 퀵슬롯이에요.</p>';
  if(invSel&&invSel.k&&CONS[invSel.k]){const c=CONS[invSel.k];det=`<div class="row">${ico(c.ic,40)}<div><b style="font-size:18px">${c.n}</b> <span class="lab">× ${L.inv[invSel.k]||0}</span><div class="note" style="margin:2px 0">${c.d}</div></div></div>
    <div class="btns" style="justify-content:flex-start"><button class="pri" data-use>${c.ench?'강화하기':'사용'}</button><span class="lab">퀵슬롯:</span>${[0,1,2,3,4,5,6,7].map(i=>`<button data-qs="${i}" style="padding:4px 9px" class="${L.qs[i]===invSel.k?'on':''}">${i+1}</button>`).join('')}<button class="bad" data-drop>버리기</button></div>`;}
  else if(invSel&&invSel.it&&S.bag.includes(invSel.it)){const it=invSel.it;det=`<div class="row">${itemIcon(it)}<div><b style="font-size:18px;color:${RAR[it.rar].col}">${esc(nm(it))}</b> ${rarTag(it.rar)} <span class="lab">${SLOT_KO[it.slot]||''}</span>${itemStats(it)}</div></div>
    <div class="btns" style="justify-content:flex-start"><button class="pri" data-eqi>장착 비교</button><button class="bad" data-sell>팔기 (+${sellPrice(it)})</button></div>`;}
  box.innerHTML=`<h2>🎒 인벤토리<button class="x" data-x>✕</button></h2><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(48px,1fr))">${cells.map(invCell).join('')}${'<div class="iv empty"></div>'.repeat(Math.max(0,24-cells.length))}</div>
    <div class="card" style="margin-top:10px">${det}</div>
    <div class="row" style="justify-content:space-between;margin-top:10px"><span>${ico('treasure/gold_coins_pile',20)} <b>${S.coins.toLocaleString()}</b> 아데나</span><span class="lab">무게 ${weight()}%</span><span><button data-ch>👤 장비창</button> <button data-shop>🏪 상점</button></span></div>`;
  box.onclick=e=>{const t=e.target.closest('[data-x],[data-k],[data-b],[data-use],[data-qs],[data-drop],[data-eqi],[data-sell],[data-ch],[data-shop]');if(!t)return;const d=t.dataset;
    if(d.x!=null){closeModal('#mBag');return;}if(d.k){invSel={k:d.k};return reInv();}if(d.b!=null){invSel={it:S.bag[+d.b]};return reInv();}
    if(d.use!=null){const k=invSel.k;closeModal('#mBag');useItem(k);return;}if(d.qs!=null){L.qs=L.qs.map(x=>x===invSel.k?null:x);L.qs[+d.qs]=invSel.k;saveAll();qsBuild();return reInv();}
    if(d.drop!=null){if(confirm(CONS[invSel.k].n+'을(를) 모두 버릴까요?')){delete L.inv[invSel.k];invSel=null;saveAll();qsTick();reInv();}return;}
    if(d.eqi!=null){const it=invSel.it;closeModal('#mBag');offer({kind:'item',it},true);return;}
    if(d.sell!=null){const it=invSel.it;const i=S.bag.indexOf(it);if(i>=0)S.bag.splice(i,1);S.coins+=sellPrice(it);msg(`${esc(nm(it))} 판매 (+${sellPrice(it)} 아데나)`);invSel=null;saveAll();reInv();return;}
    if(d.ch!=null){closeModal('#mBag');openChar();return;}if(d.shop!=null){closeModal('#mBag');openShop();}};}
function reInv(){$('#mBag').hidden=true;openInv();}
const sellPrice=it=>Math.round((RAR[it.rar].i+1)*12*(1+(it.tier||0)*.3)*(1+(it.en||0)*.5));
/* ---------- 창: 장비 (캐릭터) ---------- */
function openChar(){const box=$('#bagBox');openModal('#mBag');const s=stats();
  const slot=k=>{const it=S.eq[k];return`<div class="eqs" data-s="${k}" style="${it?'border-color:'+RAR[it.rar].col:''}">${it?itemIcon(it,'ico32')+(it.en?`<em>+${it.en}</em>`:''):`<small>${SLOT_KO[k]}</small>`}</div>`;};
  box.innerHTML=`<h2>👤 장비<button class="x" data-x>✕</button></h2>
   <div class="paper"><div class="pcol">${['helmet','tshirt','chestplate','cloak','leggings','boots'].map(slot).join('')}</div>
     <div class="pmid"><canvas id="pdoll" width="96" height="192"></canvas><div class="pst"><b>Lv.${L.lv}</b><br>공격 ${s.atk} · 발차기 ${s.kick}<br>방어(AC) ${s.def}<br>HP ${P.max} · MP ${mpMax()}<br>공속 ×${(((S.polyOn&&S.eq.poly)?S.eq.poly.aspd:1)*(hasBuff('brave')?1.25:1)).toFixed(2)} · 이속 ×${polySpeed().toFixed(2)}</div></div>
     <div class="pcol">${['weapon','shield','gloves','belt','bow','poly'].map(slot).join('')}</div></div>
   <div class="row" style="justify-content:center">${['mount','summon','pet'].map(slot).join('')}</div>
   <div class="row" style="justify-content:center">${['amulet','earring','ring1','ring2','dskin'].map(slot).join('')}</div>
   <p class="note">칸을 누르면 빼요. 장비는 🎒 인벤토리에서 눌러서 장착해요.</p><div class="btns"><button data-fg>⚒ 공방</button><button data-lk>🧍 외형</button><button data-inv>🎒 인벤토리</button></div>`;
  drawDoll();
  box.onclick=e=>{const t=e.target.closest('[data-x],[data-s],[data-inv],[data-fg],[data-lk]');if(!t)return;if(t.dataset.fg!=null){closeModal('#mBag');openForge();return;}if(t.dataset.lk!=null){closeModal('#mBag');openLook();return;}if(t.dataset.x!=null){closeModal('#mBag');return;}if(t.dataset.inv!=null){closeModal('#mBag');openInv();return;}
    const k=t.dataset.s;const it=S.eq[k];if(!it)return;delete S.eq[k];S.bag.push(it);if(k==='poly'){S.polyOn=false;applyPoly();}if(k==='mount'){setRide(false);mountBuild();}if(k==='summon'){S.sumOn=false;summonBuild();}if(k==='pet')petBuild();saveAll();refreshGear().then(buildPad);$('#mBag').hidden=true;openChar();};}
async function drawDoll(){if(S.gfx==='kk'&&typeof KP!=='undefined'&&KP.A){const c=$('#pdoll');if(!c)return;const g=c.getContext('2d');g.fillStyle='#e9edf5';g.font='15px Do Hyeon';g.textAlign='center';g.fillText(KK_CLASS[S.kkc]||'',48,180);g.font='60px serif';g.fillText({Knight:'🛡',Barbarian:'🪓',Mage:'🔮',Rogue:'🗡',Rogue_Hooded:'🏹'}[S.kkc]||'🧍',48,110);return;}const c=$('#pdoll');if(!c)return;const g=c.getContext('2d');g.imageSmoothingEnabled=false;let img=null;if(S.mcskin)img=await load(S.mcskin).catch(()=>null);if(!img)img=await composeSkin(S.skin);const k=img.width/64,u=6;
  const B=(sx,sy,sw,sh,dx,dy)=>g.drawImage(img,sx*k,sy*k,sw*k,sh*k,dx*u,dy*u,sw*u,sh*u);B(8,8,8,8,4,0);B(40,8,8,8,4,0);B(20,20,8,12,4,8);B(44,20,4,12,0,8);B(44,20,4,12,12,8);B(4,20,4,12,4,20);B(4,20,4,12,8,20);}
/* ---------- 창: 상점 ---------- */
function openShop(){const box=$('#bagBox');openModal('#mBag');
  box.innerHTML=`<h2>🏪 잡화 상점<button class="x" data-x>✕</button></h2><div class="list">${SHOP.map(k=>{const c=CONS[k];return`<div class="li">${ico(c.ic,32)}<div style="flex:1"><b>${c.n}</b> <span class="lab">보유 ${L.inv[k]||0}</span><div class="lab">${c.d}</div></div><span style="white-space:nowrap">${c.price.toLocaleString()} <button data-buy="${k}" data-n="1">1개</button> <button data-buy="${k}" data-n="10">10개</button></span></div>`;}).join('')}</div>
   <div class="row" style="justify-content:space-between;margin-top:10px"><span>${ico('treasure/gold_coins_pile',20)} <b id="shAd">${S.coins.toLocaleString()}</b> 아데나</span><button data-inv>🎒 인벤토리</button></div>`;
  box.onclick=e=>{const t=e.target.closest('[data-x],[data-buy],[data-inv]');if(!t)return;if(t.dataset.x!=null){closeModal('#mBag');return;}if(t.dataset.inv!=null){closeModal('#mBag');openInv();return;}
    const k=t.dataset.buy,n=+t.dataset.n,cost=CONS[k].price*n;if(S.coins<cost){toast('아데나가 부족해요',900);return;}S.coins-=cost;give(k,n);$('#shAd').textContent=S.coins.toLocaleString();$('#coinT').textContent=S.coins;sfx('Coin',.3);};}
/* ---------- 창: 설정 (자동 물약) ---------- */
function openSettings(){const box=$('#bagBox');openModal('#mBag');
  box.innerHTML=`<h2>⚙ 자동 물약<button class="x" data-x>✕</button></h2><div class="f"><label>자동 물약</label><span><input type="checkbox" id="apOn" ${L.autoOn?'checked':''}> 켜기</span><label>체력이 몇 %보다 낮으면</label><span><input type="range" id="apHp" min="10" max="90" step="5" value="${L.autoHp}"> <b id="apV">${L.autoHp}%</b></span></div>
   <p class="note">체력 회복제 → 고급 → 강력 순서로 있는 것을 먼저 먹어요.</p>`;
  $('#apOn').onchange=e=>{L.autoOn=e.target.checked;saveAll();qsTick();};$('#apHp').oninput=e=>{L.autoHp=+e.target.value;$('#apV').textContent=L.autoHp+'%';saveAll();qsTick();};
  box.onclick=e=>{if(e.target.closest('[data-x]'))closeModal('#mBag');};}
/* ---------- 오른쪽 아래: 공격 버튼 + 스킬 링 ---------- */
const SKIC={kick:['magic/storm_rune_cross','magic/storm_rune_x','magic/storm_rune_star','magic/storm_rune_zigzag','magic/storm_rune_fork'],trick:['magic/arcane_orb_swirl','magic/storm_orb_swirl','magic/frost_rune_star','magic/frost_rune_zigzag'],
  acro:['ui/status_haste','ui/arrow_up_gold','magic/nature_orb_swirl'],weapon:['magic/ember_rune_cross','magic/ember_rune_x','magic/blood_rune_star','magic/ember_rune_fork'],punch:['magic/blood_rune_cross','magic/blood_rune_x'],magic:['magic/fire_orb_plain','magic/frost_orb_plain','magic/shadow_orb_plain','magic/holy_orb_plain','magic/storm_orb_plain'],ult:['magic/crimson_spellbook_star','magic/obsidian_spellbook_eye','magic/violet_spellbook_moon']};
function skillIco(sk){if(!sk)return'';const l=SKIC[sk.cat]||SKIC.magic;return ico(l[hashN(sk.id)%l.length],30);}
buildPad=function(){const pad=$('#pad');pad.className='ring';const sk=i=>SK[S.slots[i]];
  const B=(k,x,y,sz,inner,nmT,lab)=>`<div class="sk${sz>70?' big':''}" data-k="${k}" style="right:${x}px;bottom:${y}px;width:${sz}px;height:${sz}px">${lab?`<b>${lab}</b>`:''}${inner}<span class="nm">${esc(nmT||'')}</span><i class="cd"></i></div>`;
  const r1=[[96,4],[90,62],[56,104],[4,112]];
  let h=B('J',0,0,88,'<em>🦶</em>','발차기','J');
  [0,1,2,3].forEach(i=>{const s=sk(i);h+=B('UIOP'[i],r1[i][0],r1[i][1],58,s?`<em>${CATI[s.cat]||'✨'}</em><u>${esc(shortNm(s.name))}</u><s>MP${mpCost(s)}</s>`:'<em>＋</em><u>스킬 넣기</u>','','UIOP'[i]);});
  h+=B('K',154,0,52,'<em>'+(S.eq.weapon?(S.eq.weapon.wc==='gun'?'🔫':'⚔'):'👊')+'</em>',S.eq.weapon?nm(S.eq.weapon):'지르기','K');
  h+=B('L',152,58,48,'<em>🏹</em>',S.eq.bow?BOWTYPES[S.eq.bow.shot][0]:'활','L');
  h+=B('SP',112,112,46,'<em>💨</em>','구르기','␣');
  h+=B('AU',0,170,50,'<em>🤖</em>',AUTO.on?'자동 ON':'자동','');
  if(S.eq.poly)h+=B('PO',56,166,46,'<em>🎭</em>',S.polyOn?'해제':'변신','');
  if(S.eq.shield)h+=B('SH',158,112,44,'<em>🛡</em>','막기','⇧');
  if(S.eq.mount)h+=B('MT',104,166,46,'<em>🦊</em>',typeof KP!=='undefined'&&KP.riding?'내리기':'타기','');
  if(S.eq.summon)h+=B('SM',152,166,46,'<em>👻</em>',S.sumOn?'소환 해제':'소환','');
  pad.innerHTML=h;const au=pad.querySelector('[data-k=AU]');if(au)au.classList.toggle('on',AUTO.on);
  pad.querySelectorAll('.sk').forEach(el=>{let lp=0;el.addEventListener('pointerdown',e=>{e.preventDefault();const k=el.dataset.k;if(k==='SH'){keys.Shift=true;return;}if(k.length===1&&'UIOP'.includes(k)&&!S.slots['UIOP'.indexOf(k)]){openSkillBook();return;}press(k);clearTimeout(lp);if('UIOPJ'.includes(k))lp=setTimeout(()=>{const id=k==='J'?nextJ():S.slots['UIOP'.indexOf(k)];toast(skillDesc(SK[id]),2600);},450);});el.addEventListener('pointerup',()=>clearTimeout(lp));
    el.addEventListener('pointerup',()=>{if(el.dataset.k==='SH')keys.Shift=false;});el.addEventListener('pointerleave',()=>{if(el.dataset.k==='SH')keys.Shift=false;});});};
function openSkillBook(){openBag();}
const CATI={kick:'🦶',trick:'🌀',acro:'🤸',weapon:'⚔',punch:'👊',magic:'✨',ult:'💥'};
const shortNm=n=>String(n).replace(/\s*\(.*?\)\s*/g,'').replace(/\s+/g,'').slice(0,5);
function skillDesc(sk){if(!sk)return'';const sh=[...new Set((sk.hits||[]).map(h=>SHAPE_KO[h.shape]))].join('·')||(sk.proj?'날아가는 탄':sk.strike?'적 위 낙뢰':sk.contact?'돌진 박치기':'');
  return`<b style="color:${RAR[sk.rar].col}">${esc(sk.name)}</b> <span style="color:${RAR[sk.rar].col}">[${RAR[sk.rar].name}]</span><br>${CAT[sk.cat]?CAT[sk.cat].join(' '):''} · ${sh} ${skillRange(sk).toFixed(1)}칸<br>위력 ${Math.round(skillPower(sk)*100)} · 재사용 ${sk.cd||0}초 · MP ${mpCost(sk)}${sk.inv?' · 동작 중 무적':''}${sk.dash?' · 돌진':''}`;}
/* ---------- 데미지 숫자: 회복 ---------- */
document.head.insertAdjacentHTML('beforeend','<style>.ds-heal{color:#7aff9a;-webkit-text-stroke:1.5px #003a10;font-size:22px}</style>');
/* ---------- 시작 키트 · 연결 ---------- */
function linRefreshAll(){if(!$('#lmQuick'))return;qsBuild();linHUD();buildPad();}
function linInit(){if(!L.kit){L.kit=true;Object.assign(L.inv,{pot_r:30,pot_o:5,scr_tel:5,scr_ret:3,scr_ew:3,scr_ea:3,pot_haste:2,pot_brave:1,scr_poly:1});S.coins=Math.max(S.coins,1000);saveAll();}
  $('#lmInv').onclick=openInv;$('#lmChar').onclick=openChar;$('#lmShop').onclick=openShop;$('#bBag').onclick=openInv;qsBuild();linHUD();buildPad();}
const _updHP0=updHP;updHP=function(){_updHP0();try{linHUD();}catch(e){}};
