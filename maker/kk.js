/* 정도 게임 메이커 — 3D 그래픽 (KayKit 캐릭터·스켈레톤·던전, CC0) · 탈것 · 소환수 · 펫 · 공방(아이템 커스터마이징) */
'use strict';
const GL=new THREE.GLTFLoader();const KKC={};
function gltf(url){return KKC[url]||(KKC[url]=new Promise((res,rej)=>GL.load(url,res,undefined,rej)));}
async function kkClone(url){const g=await gltf(url);const s=THREE.SkeletonUtils.clone(g.scene);s.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.material=o.material.clone();if(o.material.map)o.material.map.anisotropy=4;}});return{s,anims:g.animations};}
const KK_CLASS={Knight:'기사',Barbarian:'바바리안',Mage:'마법사',Rogue:'도적',Rogue_Hooded:'두건 도적'};
if(!S.gfx)S.gfx='kk';if(!S.kkc)S.kkc='Knight';if(!S.kkTint)S.kkTint='#ffffff';
/* ---------- 3D 배우 ---------- */
async function makeKK(file,o={}){const {s,anims}=await kkClone('kk/ch/'+file+'.glb');const g=new THREE.Group();g.add(s);
  const b=new THREE.Box3().setFromObject(s);const h=Math.max(.5,b.max.y-b.min.y);const sc=(o.h||1.9)/h;s.scale.setScalar(sc);
  const mixer=new THREE.AnimationMixer(s);const A={g,s,mixer,clips:{},cur:null,curName:'',file,hR:s.getObjectByName('handslot.r'),hL:s.getObjectByName('handslot.l'),h:o.h||1.9,lock:0};
  anims.forEach(c=>A.clips[c.name]=c);
  // 기본으로 들고 있는 무기·방패는 숨기고 우리가 고른 것을 쥐어줌
  [A.hR,A.hL].forEach(hs=>{if(hs)hs.children.slice().forEach(ch=>{ch.visible=false;});});
  if(o.tint)kkTint(A,o.tint);mixer.addEventListener('finished',e=>{if(A.onDone)A.onDone(e.action);});kkPlay(A,'Idle');return A;}
function kkTint(A,col){const c=new THREE.Color(col);A.s.traverse(o=>{if(o.isSkinnedMesh||o.isMesh){if(A.hR&&isUnder(o,A.hR))return;if(A.hL&&isUnder(o,A.hL))return;o.material.color.copy(c);}});}
function isUnder(o,p){while(o){if(o===p)return true;o=o.parent;}return false;}
function kkPlay(A,name,o={}){if(!A)return;let c=A.clips[name];if(!c){const alt={Idle_Combat:'Idle',Walking_D_Skeletons:'Walking_A',Death_C_Skeletons:'Death_A',Spellcast_Summon:'Spellcast_Raise','1H_Melee_Attack_Jump_Chop':'1H_Melee_Attack_Chop'}[name];c=A.clips[alt]||A.clips.Idle;name=c.name;}
  if(A.curName===name&&!o.restart)return;const act=A.mixer.clipAction(c);act.reset();act.enabled=true;
  if(o.once){act.setLoop(THREE.LoopOnce,1);act.clampWhenFinished=true;}else act.setLoop(THREE.LoopRepeat,Infinity);
  act.timeScale=o.dur?c.duration/o.dur:(o.speed||1);if(A.cur&&A.cur!==act)act.crossFadeFrom(A.cur,o.fade??.12,false);act.play();A.cur=act;A.curName=name;A.once=!!o.once;}
async function kkHold(A,hand,it,o={}){const slot=hand==='r'?A.hR:A.hL;if(!slot)return;slot.children.filter(c=>c.userData.kkHeld).forEach(c=>slot.remove(c));if(!it)return;
  let m=null;if(it.img){const im=await itemImg(it).catch(()=>null);if(im){m=voxel(im,1,(it.size||1)*Math.min(.06,1.3/Math.max(im.width,im.height))/ (A.s.scale.x));m.geometry.computeBoundingBox();m.geometry.translate(0,-m.geometry.boundingBox.min.y-.05/A.s.scale.x,0);}}
  else{const f=kkWeaponModel(it);if(!f)return;const r=await kkClone('kk/w/'+f+'.gltf').catch(()=>null);if(!r)return;m=r.s;}
  m.userData.kkHeld=true;m.scale.multiplyScalar(it.img?1:(it.size||1));if(it.tint)m.traverse(x=>{if(x.isMesh)x.material.color.set(it.tint);});
  const gl=it.glow||(it.en>=7?(it.en>=9?'#ff5aa0':'#4aa3ff'):null);if(gl){const k=it.glow?.55:Math.min(.9,(it.en-6)*.25);m.traverse(x=>{if(x.isMesh&&x.material.emissive){x.material.emissive.set(gl);x.material.emissiveIntensity=k;}});}
  slot.add(m);}
const KW={sword:'sword_1handed',rapier:'dagger',axe:'axe_1handed',blunt:'axe_2handed',spear:'Skeleton_Staff',staff:'staff',gun:'crossbow_1handed'};
function kkWeaponModel(it){if(it.kk)return it.kk;if(it.slot==='shield')return'shield_round';if(it.slot==='bow')return'crossbow_1handed';return KW[it.wc]||'sword_1handed';}
const TWO_H=['sword_2handed','sword_2handed_color','axe_2handed','staff','crossbow_2handed','Skeleton_Staff'];
/* ---------- 플레이어 ---------- */
const KP={A:null,file:null,rot:0,flip:0,actRef:null,mount:null,riding:false};
async function kkRebuild(){if(KP.A){scene.remove(KP.A.g);KP.A=null;}if(S.gfx!=='kk')return;KP.file=S.kkc;KP.A=await makeKK(S.kkc,{h:1.9,tint:S.kkTint!=='#ffffff'?S.kkTint:null});scene.add(KP.A.g);await kkGear();}
async function kkGear(){const A=KP.A;if(!A)return;await kkHold(A,'r',S.eq.weapon);await kkHold(A,'l',S.eq.shield||(S.eq.weapon&&S.eq.weapon.wc==='gun'?null:null));}
function twoH(){const w=S.eq.weapon;return w&&TWO_H.includes(kkWeaponModel(w))&&!S.eq.shield;}
const SPIN={s540:1.5,s720:2,s900:2.5,dol:1,huryeo:1,dwi:.5,boxcut:1,btwist:1,popturn:1,illusion:1,oebal:1,narae:1,spinkick:1,spinjumpkick:1.5,geodeup:0,w_spin:1,w_sweep:1};
const FLIP={backflip:-1,backflip2:-1,sideflip:-1,handspring:1,backhandspring:-1,monkeyflip:-1,cartwheel:0,cartwheel2:0,kickflip:-1};
function kkAnimFor(a){const sk=a.sk||{};const id=sk.id||'';const cat=sk.cat;const h2=twoH();
  if(id==='_roll')return'Dodge_Forward';if(a.mo&&a.mo.m===KEYMOTION.shoot)return S.eq.weapon&&S.eq.weapon.wc==='gun'?'1H_Ranged_Shoot':'1H_Ranged_Shoot';
  if(cat==='bow')return'1H_Ranged_Shoot';
  if(cat==='weapon'){const m={w_cut1:'Slice_Diagonal',w_cut2:'Slice_Horizontal',w_chop:'Chop',w_thrust:'Stab',w_slam:'Chop',w_flurry:'Slice'};
    if(id==='w_cast')return'Spellcast_Shoot';if(id==='w_spin'||id==='w_sweep')return'2H_Melee_Attack_Spin';if(id==='w_flurry')return'Dualwield_Melee_Attack_Slice';
    const k=m[id]||pick(['Slice_Diagonal','Chop','Stab','Slice_Horizontal']);return h2?('2H_Melee_Attack_'+(k==='Slice_Diagonal'||k==='Slice_Horizontal'?'Slice':k)):'1H_Melee_Attack_'+k;}
  if(cat==='magic'||cat==='ult')return pick(['Spellcast_Long','Spellcast_Raise','Spellcast_Shoot']);
  if(cat==='punch')return pick(['Unarmed_Melee_Attack_Punch_A','Unarmed_Melee_Attack_Punch_B']);
  if(FLIP[id]!=null)return'Jump_Full_Short';if(cat==='acro')return'Dodge_Forward';
  return'Unarmed_Melee_Attack_Kick';}
function kkTick(dt){const A=KP.A;if(!A)return;const polyOn=!!POLY.A;A.g.visible=!polyOn&&S.gfx==='kk';if(!A.g.visible)return;P.rig.root.visible=false;
  A.g.position.set(P.pos.x,0,P.pos.z);A.g.rotation.set(0,P.face,0);A.s.rotation.set(0,0,0);A.s.position.set(0,0,0);
  if(KP.riding&&KP.mount){mountTick(dt);}
  else if(P.dead)kkPlay(A,'Death_A',{once:true});
  else if(P.act){const a=P.act;if(KP.actRef!==a){KP.actRef=a;const nm=kkAnimFor(a);kkPlay(A,nm,{once:true,restart:true,dur:a.dur*.95});KP.spin=(SPIN[a.sk&&a.sk.id]||0);KP.flip=FLIP[a.sk&&a.sk.id];
      if(['narae','yeopJ','jumpkick','jumpkick2','jumpkick3','naeryeo','s720','s900','spinjumpkick','btwist'].includes(a.sk&&a.sk.id))KP.jump=1.1;else KP.jump=0;}
    const k=clamp(a.t/a.dur,0,1);if(KP.spin)A.s.rotation.y=-k*KP.spin*PI*2;if(KP.flip!=null&&KP.flip!==undefined){if(KP.flip)A.s.rotation.x=KP.flip*k*PI*2;else A.s.rotation.z=k*PI*2;A.s.position.y=Math.sin(k*PI)*1.1;}
    else if(KP.jump)A.s.position.y=Math.sin(k*PI)*KP.jump;}
  else{KP.actRef=null;if(P.blocking)kkPlay(A,'Blocking');else if(P._hurtT>0&&A.curName!=='Hit_A')kkPlay(A,'Hit_A',{once:true,restart:true});else if(A.once&&A.cur&&A.cur.isRunning())0;
    else{const d=inputDir();kkPlay(A,d?(hasBuff('haste')?'Running_B':'Running_A'):(S.eq.weapon?(twoH()?'2H_Melee_Idle':'Idle'):'Unarmed_Idle'));}}
  if(P.dead===false&&A.curName&&A.curName.startsWith('Death'))kkPlay(A,'Idle');
  A.g.visible=!(P.inv>0&&!P.act&&Math.floor(performance.now()/60)%2)||P.dead;A.mixer.update(dt);}
/* ---------- 몬스터 (스켈레톤) ---------- */
const KKW={Skeleton_Warrior:['Skeleton_Blade','Skeleton_Shield_Large_A'],Skeleton_Minion:['Skeleton_Blade',null],Skeleton_Rogue:['Skeleton_Axe',null],Skeleton_Mage:['Skeleton_Staff',null],Barbarian:['axe_2handed',null],Knight:['sword_2handed',null],Rogue:['dagger','dagger'],Mage:['staff',null],Rogue_Hooded:['crossbow_1handed',null]};
async function mkKKMob(d,o){const file=o.unit||d.file||'Skeleton_Minion';const A=await makeKK(file,{h:1.9*(d.kkh||1),tint:d.tint});const w=d.weap||KKW[file]||[];
  if(w[0])await kkHold(A,'r',{kk:w[0]});if(w[1])await kkHold(A,'l',{kk:w[1]});A.g.userData.kk=A;A.g.userData.ranged=d.ai==='ranged';return A.g;}
function kkMobAnim(m,dt){const A=m.obj.userData.kk;if(!A)return;const moved=m._lx!=null?Math.hypot(m.pos.x-m._lx,m.pos.z-m._lz)/Math.max(dt,1e-4):0;m._lx=m.pos.x;m._lz=m.pos.z;
  if(m.dead){kkPlay(A,A.clips.Death_C_Skeletons?'Death_C_Skeletons':'Death_A',{once:true});m.obj.rotation.set(0,m.face,0);m.obj.position.y=0;}
  else if(m.wind>0&&!m._atk){m._atk=1;const r=m.obj.userData.ranged;const nm=r?(A.file==='Skeleton_Mage'?'Spellcast_Shoot':'1H_Ranged_Shoot'):(m.d.model==='kk'&&m.boss?pick(['2H_Melee_Attack_Chop','2H_Melee_Attack_Spin','2H_Melee_Attack_Slice']):pick(['1H_Melee_Attack_Chop','1H_Melee_Attack_Slice_Diagonal','1H_Melee_Attack_Stab']));kkPlay(A,nm,{once:true,restart:true,dur:Math.max(.4,m.wind+.35)});}
  else if(m.wind<=0&&m._atk&&(!A.cur||!A.cur.isRunning())){m._atk=0;}
  if(!m.dead&&!m._atk){if(m.flashT>0&&!m._fl){m._fl=1;kkPlay(A,'Hit_A',{once:true,restart:true});}if(m.flashT<=0)m._fl=0;if(!(A.once&&A.cur&&A.cur.isRunning()))kkPlay(A,moved>.4?(A.clips.Walking_D_Skeletons&&moved<2.4?'Walking_D_Skeletons':'Running_A'):(A.clips.Idle_Combat?'Idle_Combat':'Idle'));}
  A.mixer.update(dt);}
MOBS.push({id:'k_minion',name:'해골 졸개',model:'kk',file:'Skeleton_Minion',hp:30,atk:9,spd:2.4,ai:'melee'},{id:'k_warrior',name:'해골 전사',model:'kk',file:'Skeleton_Warrior',hp:55,atk:12,spd:2,ai:'melee'},
  {id:'k_rogue',name:'해골 도적',model:'kk',file:'Skeleton_Rogue',hp:34,atk:13,spd:2.8,ai:'charge'},{id:'k_mage',name:'해골 마법사',model:'kk',file:'Skeleton_Mage',hp:28,atk:11,spd:1.9,ai:'ranged'},
  {id:'k_archer',name:'해골 궁수',model:'kk',file:'Skeleton_Minion',weap:['Skeleton_Crossbow',null],hp:26,atk:10,spd:2,ai:'ranged'});
BOSSES.push({id:'k_lord',name:'해골 기사단장',model:'kk',file:'Skeleton_Warrior',weap:['Skeleton_Axe','Skeleton_Shield_Large_B'],kkh:1.9,hp:1500,atk:28,spd:1.9,ai:'golem'},
  {id:'k_berserk',name:'타락한 광전사',model:'kk',file:'Barbarian',tint:'#8a7aa0',kkh:2,hp:1700,atk:30,spd:2.1,ai:'melee'},{id:'k_lich',name:'리치 대마법사',model:'kk',file:'Skeleton_Mage',tint:'#c0a0ff',kkh:1.8,hp:1300,atk:26,spd:1.7,ai:'wither'});
/* ---------- 던전 (KayKit) ---------- */
const KKTH={kk_tomb:{name:'지하 무덤',floor:['floor_tile_large','floor_tile_large','floor_tile_large_rocks','floor_tile_big_grate'],wall:['wall','wall','wall_cracked','wall_arched','wall_broken'],fog:0x0c0d14,light:0xb8c4ff,torch:0xff9a40,mobs:['k_minion','k_warrior','k_rogue','k_mage','k_archer'],boss:['k_lord','k_lich']},
  kk_mine:{name:'버려진 광산',floor:['floor_dirt_large','floor_dirt_large','floor_dirt_large_rocky'],wall:['wall','wall_broken','wall_cracked'],fog:0x15100c,light:0xffd8a8,torch:0xffa040,mobs:['k_minion','k_rogue','k_archer','k_warrior'],boss:['k_berserk','k_lord']},
  kk_fort:{name:'해골 요새',floor:['floor_wood_large','floor_wood_large_dark','floor_wood_large'],wall:['wall','wall_window_closed','wall_shelves','wall_arched'],fog:0x100c10,light:0xffe0c0,torch:0xff8a3a,mobs:['k_warrior','k_mage','k_archer','k_rogue'],boss:['k_lich','k_berserk']}};
Object.keys(KKTH).forEach(k=>{THEMES[k]=Object.assign({},THEMES.dungeon,KKTH[k]);});
const DECO=[['barrel_large',1],['barrel_small_stack',1],['box_stacked',1],['crates_stacked',1],['chest',1],['rubble_large',1],['keg_decorated',1],['table_medium_decorated_A',1],['trunk_large_A',1],['coin_stack_large',0],['candle_triple',0],['sword_shield',0]];
const _buildMap0=buildMap;
buildMap=async function(themeKey,opt={}){scene.fog.near=20;scene.fog.far=40;if(!(themeKey in KKTH))return _buildMap0(themeKey,opt);
  MAP.objs.forEach(o=>{scene.remove(o);});MAP.objs=[];const th=KKTH[themeKey];MAP.theme=themeKey;const N=opt.size?opt.size+(opt.size%2):(24+2*Math.floor(rnd(0,5)));MAP.N=N;MAP.solid=new Uint8Array(N*N);const H=N/2;
  scene.background.set(th.fog);scene.fog.color.set(th.fog);sun.color.set(th.light);sun.intensity=.75;
  const add=async(name,x,z,ry=0,s=.5,y=0)=>{const r=await kkClone('kk/d/'+name+'.glb').catch(()=>null);if(!r)return null;r.s.scale.setScalar(s);r.s.position.set(x,y,z);r.s.rotation.y=ry;scene.add(r.s);MAP.objs.push(r.s);return r.s;};
  const jobs=[];
  for(let j=0;j<N;j+=2)for(let i=0;i<N;i+=2)jobs.push(add(pick(th.floor),i-H+1,j-H+1,Math.floor(rnd(0,4))*PI/2));
  for(let i=0;i<N;i++){MAP.solid[i]=1;MAP.solid[(N-1)*N+i]=1;MAP.solid[i*N]=1;MAP.solid[i*N+N-1]=1;}
  for(let k=0;k<N;k+=2){const c=k-H+1;jobs.push(add(pick(th.wall),c,-H+.5,0));jobs.push(add(pick(th.wall),c,H-.5,PI));jobs.push(add(pick(th.wall),-H+.5,c,PI/2));jobs.push(add(pick(th.wall),H-.5,c,-PI/2));}
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>jobs.push(add('pillar',a*(H-.5),b*(H-.5),0)));
  // 횃불 + 깃발
  for(let k=4;k<N-2;k+=6){const c=k-H+1;jobs.push(add('torch_mounted',c,-H+1.05,0,.6,1.1));jobs.push(add('torch_mounted',c,H-1.05,PI,.6,1.1));if(k%12===4){jobs.push(add(pick(['banner_red','banner_patternA_red','banner_blue','banner_shield_blue']),c+1.5,-H+1.05,0,.5,0));}
    const l=new THREE.PointLight(th.torch,1.1,9,2);l.position.set(c,1.6,-H+1.6);scene.add(l);MAP.objs.push(l);l.userData.flick=Math.random()*6;const l2=l.clone();l2.position.z=H-1.6;scene.add(l2);MAP.objs.push(l2);}
  const amb=new THREE.PointLight(th.light,.6,30,1.5);amb.position.set(0,6,0);scene.add(amb);MAP.objs.push(amb);
  if(!opt.empty){const np=Math.floor(rnd(5,10));for(let k=0;k<np;k++){const i=Math.floor(rnd(3,N-4)),j=Math.floor(rnd(3,N-4));if(Math.abs(i-H)<4&&Math.abs(j-H)<4)continue;if(MAP.solid[j*N+i])continue;
      const x=i-H+.5,z=j-H+.5;if(Math.random()<.4){MAP.solid[j*N+i]=1;jobs.push(add(pick(['pillar','pillar_decorated','column']),x,z,0,.5));}else{const dd=pick(DECO);if(dd[1])MAP.solid[j*N+i]=1;jobs.push(add(dd[0],x,z,rnd(0,6.28),.5));}}}
  await Promise.all(jobs);MAP.objs.forEach(o=>{o.traverse&&o.traverse(x=>{if(x.isMesh){x.castShadow=true;x.receiveShadow=true;}});});};
let flickT=0;function torchTick(dt){flickT+=dt;MAP.objs.forEach(o=>{if(o.isPointLight&&o.userData.flick!=null)o.intensity=1+Math.sin(flickT*9+o.userData.flick)*.15+Math.sin(flickT*23+o.userData.flick)*.08;});}
/* ---------- 탈것 ---------- */
const MOUNTS=[['붉은 여우',null,'N'],['눈여우','#f2f4ff','R'],['은빛 늑대여우','#a8b0c0','E'],['흑요 여우','#3a3448','U'],['황금 여우','#ffd24a','L'],['불꽃 여우','#ff6a3a','M'],['영혼 여우','#7affe8','O']];
SLOT_KO.mount='탈것';SLOT_KO.summon='소환수';SLOT_KO.pet='펫';
function makeMount(i,rar){const m=MOUNTS[i];const r=rar||m[2];return{id:'mt'+Date.now().toString(36),slot:'mount',rar:r,name:m[0],tint:m[1],mspd:+(1.45+RAR[r].i*.08).toFixed(2),ic:'treasure/ornate_key_single'};}
async function mountBuild(){if(KP.mount){scene.remove(KP.mount.g);KP.mount=null;}const it=S.eq.mount;if(!it)return;const r=await kkClone('kk/m/Fox.glb');const g=new THREE.Group();r.s.scale.setScalar(.019);g.add(r.s);
  if(it.tint)r.s.traverse(o=>{if(o.isMesh)o.material.color.set(it.tint);});if(['M','O'].includes(it.rar))r.s.traverse(o=>{if(o.isMesh&&o.material.emissive){o.material.emissive.set(it.tint||'#ff6a3a');o.material.emissiveIntensity=.35;}});
  const mixer=new THREE.AnimationMixer(r.s);const clips={};r.anims.forEach(c=>clips[c.name]=c);KP.mount={g,s:r.s,mixer,clips,cur:null,name:''};g.visible=false;scene.add(g);}
function mountPlay(n){const M=KP.mount;if(!M||M.name===n)return;const a=M.mixer.clipAction(M.clips[n]);a.reset().play();if(M.cur)a.crossFadeFrom(M.cur,.2,false);M.cur=a;M.name=n;}
function mountTick(dt){const M=KP.mount,A=KP.A;M.g.visible=true;M.g.position.set(P.pos.x,0,P.pos.z);M.g.rotation.y=P.face;const d=inputDir();mountPlay(d?'Run':'Survey');M.mixer.update(dt*(d?1.4:1));
  A.g.position.y=.78;A.s.position.z=-.15;kkPlay(A,'Sit_Chair_Idle');if(d)A.g.position.y+=Math.abs(Math.sin(performance.now()/110))*.07;}
function setRide(on){if(on&&!S.eq.mount){toast('탈것이 없어요',900);return;}KP.riding=on&&!!KP.mount;if(KP.mount)KP.mount.g.visible=KP.riding;if(KP.riding){pfx('spawn/poof',P.pos.clone().setY(.05),{scale:.9});msg(S.eq.mount.name+'에 탔어요','#9fffb0');}buildPad();}
const _polySpeed1=polySpeed;polySpeed=function(){return _polySpeed1()*(KP.riding&&S.eq.mount?S.eq.mount.mspd:1);};
const _useSkill2=useSkill;useSkill=function(id,slot){if(KP.riding&&id!=='_roll'){setRide(false);}return _useSkill2(id,slot);};
/* ---------- 소환수 (같이 싸우는 동료) ---------- */
const SUMMONS=[['Knight','기사 수호령','탱커 · 적을 붙잡고 오래 버텨요'],['Barbarian','광전사 영혼','공격형 · 큰 도끼로 강하게 때려요'],['Mage','마법사 영혼','원거리 · 마법탄을 쏴요'],['Rogue','그림자 도적','빠름 · 연속으로 찔러요']];
function makeSummon(i,rar){const s=SUMMONS[i];return{id:'sm'+Date.now().toString(36),slot:'summon',rar:rar||'R',name:s[1],u:s[0],ic:'magic/violet_spellbook_moon',desc:s[2]};}
const ALLY={m:null,A:null,cd:0,t:0,dead:0,hp:0,max:0,bar:null};
async function summonBuild(){if(ALLY.A){scene.remove(ALLY.A.g);ALLY.A=null;}if(ALLY.bar){ALLY.bar.remove();ALLY.bar=null;}const it=S.eq.summon;if(!it||!S.sumOn)return;
  const A=await makeKK(it.u,{h:1.75,tint:it.rar==='O'?'#9ffff0':it.rar==='M'?'#ffb0b0':null});const w=KKW[it.u]||[];if(w[0])await kkHold(A,'r',{kk:w[0],glow:RAR[it.rar].i>=4?RAR[it.rar].col:null});if(w[1])await kkHold(A,'l',{kk:w[1]});
  A.g.position.copy(P.pos).add(new V3(1.4,0,1));scene.add(A.g);ALLY.A=A;ALLY.max=ALLY.hp=Math.round(P.max*(.6+RAR[it.rar].i*.15));ALLY.dead=0;pfx('arcane/mana-burst',A.g.position.clone().setY(.05),{scale:1});
  const b=document.createElement('div');b.className='mbar ally';b.innerHTML='<i></i>';document.body.appendChild(b);ALLY.bar=b;}
function allyTick(dt){const A=ALLY.A;if(!A)return;const it=S.eq.summon;if(!it){summonBuild();return;}if(ALLY.dead>0){ALLY.dead-=dt;if(ALLY.dead<=0){summonBuild();}A.mixer.update(dt);return;}
  const pos=A.g.position;ALLY.cd-=dt;const tg=mobs.filter(m=>!m.dead&&!m.dummy&&m.pos.distanceTo(P.pos)<11).sort((a,b)=>a.pos.distanceTo(pos)-b.pos.distanceTo(pos))[0];
  const ranged=it.u==='Mage';const reach=ranged?7:1.6;let want=null;
  if(tg){const d=tg.pos.distanceTo(pos)-tg.radius;if(d>reach)want=tg.pos.clone().sub(pos);else{A.g.rotation.y=Math.atan2(tg.pos.x-pos.x,tg.pos.z-pos.z);if(ALLY.cd<=0){ALLY.cd=it.u==='Rogue'?.55:it.u==='Barbarian'?1.1:.9;
        const dmg=stats().atk*(.5+RAR[it.rar].i*.18)*(it.u==='Barbarian'?1.5:1);if(ranged){kkPlay(A,'Spellcast_Shoot',{once:true,restart:true,dur:.5});setTimeout(()=>{if(!tg.dead)projectile('p',pos.clone().setY(1.3),tg,dmg,{fx:'projectiles/magic-missile',speed:16,homing:true});},200);}
        else{kkPlay(A,pick(it.u==='Rogue'?['Dualwield_Melee_Attack_Stab','1H_Melee_Attack_Stab']:['1H_Melee_Attack_Chop','1H_Melee_Attack_Slice_Diagonal','2H_Melee_Attack_Chop']),{once:true,restart:true,dur:.5});setTimeout(()=>{if(!tg.dead)hurtMob(tg,dmg*rnd(.9,1.1),Math.random()<.12,tg.pos.clone().sub(pos).setY(0).normalize().multiplyScalar(4));},220);}}}}
  else{const to=P.pos.clone().add(new V3(Math.sin(P.face+2.3)*1.6,0,Math.cos(P.face+2.3)*1.6)).sub(pos);if(to.length()>1.2)want=to;}
  if(want){want.y=0;const l=want.length();want.normalize();const sp=Math.min(l*3,(KP.riding?8:5.2));moveCircle(pos,want.x*sp*dt,want.z*sp*dt,.3);A.g.rotation.y=Math.atan2(want.x,want.z);if(!(A.once&&A.cur&&A.cur.isRunning()))kkPlay(A,'Running_A');}
  else if(!(A.once&&A.cur&&A.cur.isRunning()))kkPlay(A,it.u==='Barbarian'?'2H_Melee_Idle':'Idle');
  if(pos.distanceTo(P.pos)>16){pos.copy(P.pos);}
  // 적이 동료도 노림
  mobs.forEach(m=>{if(!m.dead&&m.wind>0&&m.wind<dt*1.5&&m.pos.distanceTo(pos)<1.8+m.radius&&m.pos.distanceTo(pos)<m.pos.distanceTo(P.pos)){ALLY.hp-=m.atk*.7;kkPlay(A,'Hit_A',{once:true,restart:true});if(ALLY.hp<=0){ALLY.dead=20;kkPlay(A,'Death_A',{once:true});msg(it.name+'이(가) 쓰러졌어요 · 20초 뒤 다시 와요','#ffb0b0');}}});
  A.mixer.update(dt);const v=pos.clone().setY(2.2).project(cam);ALLY.bar.style.left=((v.x+1)/2*innerWidth)+'px';ALLY.bar.style.top=((1-v.y)/2*innerHeight)+'px';ALLY.bar.firstChild.style.width=(100*Math.max(0,ALLY.hp)/ALLY.max)+'%';}
function setSummon(on){if(on&&!S.eq.summon){toast('소환수가 없어요',900);return;}S.sumOn=on;saveAll();summonBuild();buildPad();if(on)msg(S.eq.summon.name+' 소환!','#c9b8ff');}
/* ---------- 펫 (따라다니며 줍기) ---------- */
const PET={A:null};
function makePet(uid,rar){return{id:'pt'+Date.now().toString(36),slot:'pet',rar:rar||'R',u:uid,name:'펫 · '+((DU&&DU._cache&&DU._cache[uid]&&DU._cache[uid].n)||uid),ic:'monsters/green_slime_happy',range:+(3+RAR[rar||'R'].i*.8).toFixed(1)};}
async function petBuild(){if(PET.A){scene.remove(PET.A.g);PET.A=null;}const it=S.eq.pet;if(!it)return;const a=await makeActor(it.u,.75);if(!a)return;PET.A=a;a.g.position.copy(P.pos).add(new V3(-1,0,1));scene.add(a.g);}
function petTick(dt){const A=PET.A,it=S.eq.pet;if(!A||!it)return;const pos=A.g.position;let tgt=drops.find(d=>d.g.position.distanceTo(pos)<it.range+4&&d.t>.4);let want;
  if(tgt){want=tgt.g.position.clone().sub(pos);if(want.length()<.7){tgt.g.position.copy(P.pos);}}else{want=P.pos.clone().add(new V3(Math.sin(P.face-2.4)*1.3,0,Math.cos(P.face-2.4)*1.3)).sub(pos);}
  want.y=0;const l=want.length();if(l>.3){want.normalize();const sp=Math.min(l*4,KP.riding?9:6.5);pos.x+=want.x*sp*dt;pos.z+=want.z*sp*dt;actFace(A,want.x);actPlay(A,'run');}else actPlay(A,'idle');if(pos.distanceTo(P.pos)>14)pos.copy(P.pos);actTick(A,dt);}
/* ---------- 공방: 아이템 커스터마이징 ---------- */
const WMODELS={sword:['sword_1handed','sword_2handed','sword_2handed_color','dagger','Skeleton_Blade'],rapier:['dagger','sword_1handed'],axe:['axe_1handed','axe_2handed','Skeleton_Axe'],blunt:['axe_2handed','Skeleton_Axe'],spear:['Skeleton_Staff','staff'],staff:['staff','wand','Skeleton_Staff','spellbook_open'],gun:['crossbow_1handed','crossbow_2handed','Skeleton_Crossbow'],
  shield:['shield_round','shield_round_color','shield_square','shield_square_color','shield_spikes','shield_spikes_color','shield_badge','shield_badge_color','Skeleton_Shield_Small_A','Skeleton_Shield_Large_A','Skeleton_Shield_Large_B'],bow:['crossbow_1handed','crossbow_2handed','Skeleton_Crossbow']};
const WM_KO={sword_1handed:'한손검',sword_2handed:'양손검',sword_2handed_color:'장식 양손검',dagger:'단검',Skeleton_Blade:'뼈칼',axe_1handed:'한손 도끼',axe_2handed:'양손 도끼',Skeleton_Axe:'뼈도끼',Skeleton_Staff:'해골 지팡이',staff:'지팡이',wand:'완드',spellbook_open:'마법서',crossbow_1handed:'한손 석궁',crossbow_2handed:'양손 석궁',Skeleton_Crossbow:'뼈 석궁',
  shield_round:'원형 방패',shield_round_color:'색 원형 방패',shield_square:'사각 방패',shield_square_color:'색 사각 방패',shield_spikes:'가시 방패',shield_spikes_color:'색 가시 방패',shield_badge:'문장 방패',shield_badge_color:'색 문장 방패',Skeleton_Shield_Small_A:'뼈 소형 방패',Skeleton_Shield_Large_A:'뼈 대형 방패',Skeleton_Shield_Large_B:'뼈 탑 방패'};
const FORGE_COST=300;
function openForge(slotSel){const box=$('#bagBox');openModal('#mBag');const slots=['weapon','shield','bow'].filter(s=>S.eq[s]);let sl=slotSel&&S.eq[slotSel]?slotSel:slots[0];
  if(!sl){box.innerHTML=`<h2>⚒ 공방<button class="x" data-x>✕</button></h2><p class="note">무기나 방패를 먼저 장착해요.</p>`;box.onclick=e=>{if(e.target.closest('[data-x]'))closeModal('#mBag');};return;}
  const it=S.eq[sl];const pool=sl==='weapon'?(WMODELS[it.wc]||WMODELS.sword):WMODELS[sl];const cur=kkWeaponModel(it);
  box.innerHTML=`<h2>⚒ 공방 · 아이템 꾸미기<button class="x" data-x>✕</button></h2>
   <div class="row">${slots.map(s=>`<button data-sl="${s}" class="${s===sl?'on':''}">${SLOT_KO[s]}</button>`).join('')}</div>
   <div class="card" style="border-color:${RAR[it.rar].col}"><div class="row" style="margin:0">${itemIcon(it)}<b style="font-size:18px">${esc(nm(it))}</b></div>
   <div class="f" style="margin-top:8px"><label>이름</label><input id="fgN" value="${esc(it.name)}" maxlength="16">
    <label>모양</label><select id="fgM">${pool.map(m=>`<option value="${m}" ${m===cur?'selected':''}>${WM_KO[m]||m}</option>`).join('')}</select>
    <label>색</label><span><input type="color" id="fgC" value="${it.tint||'#ffffff'}"> <button id="fgCx" style="padding:3px 8px">원래 색</button></span>
    <label>빛 (오라)</label><span><input type="checkbox" id="fgGo" ${it.glow?'checked':''}> <input type="color" id="fgG" value="${it.glow||'#4aa3ff'}"></span>
    <label>크기</label><span><input type="range" id="fgS" min=".7" max="1.6" step=".05" value="${it.size||1}"> <b id="fgSv">${(it.size||1).toFixed(2)}</b></span>
    <label>속성</label><select id="fgE"><option value="">없음</option>${Object.keys(ELEM).map(k=>`<option value="${k}" ${it.elem===k?'selected':''}>${ELEM[k][0]}</option>`).join('')}</select></div>
   <p class="note">바꾸면 캐릭터 손에 바로 보여요. 속성을 바꿀 때만 ${FORGE_COST} 아데나가 들어요. 강화 +7부터는 따로 오라를 안 켜도 무기가 빛나요.</p></div>
   <div class="btns"><button data-x>닫기</button></div>`;
  const live=async()=>{it.name=$('#fgN').value.trim()||it.name;it.kk=$('#fgM').value;it.size=+$('#fgS').value;$('#fgSv').textContent=it.size.toFixed(2);it.glow=$('#fgGo').checked?$('#fgG').value:null;saveAll();await kkGear();await refreshGear();};
  ['fgN','fgM','fgS','fgGo','fgG'].forEach(i=>$('#'+i).addEventListener('input',live));$('#fgC').addEventListener('input',e=>{it.tint=e.target.value;live();});$('#fgCx').onclick=()=>{delete it.tint;live();openForge(sl);};
  $('#fgE').onchange=e=>{const v=e.target.value||null;if(v===(it.elem||null))return;if(S.coins<FORGE_COST){toast('아데나가 부족해요',900);e.target.value=it.elem||'';return;}S.coins-=FORGE_COST;if(v)it.elem=v;else delete it.elem;msg(esc(nm(it))+' 속성 변경','#ffd24a');saveAll();linHUD();};
  box.onclick=e=>{const t=e.target.closest('[data-x],[data-sl]');if(!t)return;if(t.dataset.x!=null){closeModal('#mBag');return;}$('#mBag').hidden=true;openForge(t.dataset.sl);};}
/* 외형 (직업 모델 · 옷 색) */
function openLook(){const box=$('#bagBox');openModal('#mBag');
  box.innerHTML=`<h2>🧍 외형<button class="x" data-x>✕</button></h2>
   <div class="f"><label>그래픽</label><span><button data-g="kk" class="${S.gfx==='kk'?'on':''}">3D 모험가</button> <button data-g="mc" class="${S.gfx==='mc'?'on':''}">도장 (마크 스킨·모캡)</button></span>
    <label>캐릭터</label><span>${Object.keys(KK_CLASS).map(k=>`<button data-c="${k}" class="${S.kkc===k?'on':''}" style="margin:2px">${KK_CLASS[k]}</button>`).join('')}</span>
    <label>옷 색</label><span><input type="color" id="lkT" value="${S.kkTint||'#ffffff'}"> <button id="lkTx" style="padding:3px 8px">원래 색</button></span></div>
   <p class="note">도장 모드는 태권도 마크 스킨과 모캡 동작(뒤공중돌기·540 등)을 그대로 보여줘요.</p><div class="btns"><button data-x>닫기</button></div>`;
  box.onclick=async e=>{const t=e.target.closest('[data-x],[data-g],[data-c],#lkTx');if(!t)return;if(t.dataset.x!=null){closeModal('#mBag');return;}
    if(t.dataset.g){S.gfx=t.dataset.g;P.rig.root.visible=S.gfx==='mc';}if(t.dataset.c)S.kkc=t.dataset.c;if(t.id==='lkTx')S.kkTint='#ffffff';saveAll();await kkRebuild();$('#mBag').hidden=true;openLook();};
  $('#lkT').onchange=async e=>{S.kkTint=e.target.value;saveAll();if(KP.A)kkTint(KP.A,S.kkTint);};}
/* ---------- 연결 ---------- */
const _refreshGear0=refreshGear;refreshGear=async function(){await _refreshGear0();try{await kkGear();}catch(e){}};
async function kkInit(){await kkRebuild().catch(e=>console.warn('kk',e));await mountBuild().catch(()=>{});if(S.sumOn)summonBuild();petBuild();
  if(!S.v3){S.v3=1;DB.stage.themes=Object.keys(KKTH);if(!S.eq.mount)S.bag.push(makeMount(0,'N'));if(!S.eq.summon)S.bag.push(makeSummon(0,'R'));saveAll();}
  DEF_STAGE.themes=Object.keys(KKTH);}
function kkFrame(dt){kkTick(dt);allyTick(dt);petTick(dt);torchTick(dt);}

const _onKill0=onKill;onKill=function(m){_onKill0(m);const r=Math.random();const p=m.pos.clone().add(new V3(-.7,0,.7));
  if(r<(m.boss?.35:.012))dropThing({kind:'item',it:makeMount(Math.floor(Math.random()*MOUNTS.length),randRar(m.boss?.4:.05))},p);
  else if(r<(m.boss?.6:.022))dropThing({kind:'item',it:makeSummon(Math.floor(Math.random()*SUMMONS.length),randRar(m.boss?.4:.05))},p);
  else if(r<(m.boss?.75:.03))duReady().then(async U=>{DU._cache=U;const c=Object.keys(U).filter(k=>U[k].f==='critter'||/neutral_.*(critter|pet|imp|wisp)/.test(k));const uid=pick(c.length?c:Object.keys(U));dropThing({kind:'item',it:makePet(uid,randRar(.1))},p);});};
