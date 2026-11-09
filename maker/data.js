/* 정도 게임 메이커 — 데이터 (등급 · 스킬 · 장비 · 데미지 스킨 · 몬스터 · 보스 · 테마) */
'use strict';
const RARS=[['N','노말','#d9d9d9',1],['R','레어','#4aa3ff',1.25],['E','에픽','#b36bff',1.55],['U','유니크','#ffd24a',1.9],['L','레전드리','#ff8a1f',2.3],['M','신화','#ff3d5a',2.8],['O','유일','#5ff7e0',3.4]];
const RAR={};RARS.forEach((r,i)=>RAR[r[0]]={k:r[0],name:r[1],col:r[2],mul:r[3],i});
const CAT={kick:['🦶','발차기'],acro:['🤸','체조·회피'],trick:['🌀','트릭킹'],punch:['👊','지르기'],weapon:['⚔','무기'],magic:['✨','마법']};
const WCLASS={sword:'검',rapier:'레이피어',axe:'도끼',blunt:'둔기',spear:'창',staff:'지팡이'};
/* 스킬 기본값: hits/fx의 t는 동작 길이에 대한 비율(0~1) */
function H(t,range,arc,mul,shape){return{t,range,arc,mul:mul||1,shape:shape||(arc>=6?'circle':'cone')};}
function F(t,id,at,scale,o){return Object.assign({t,id,at:at||'front',scale:scale||1},o||{});}
const BASE_SKILLS=[
 // 발차기 (겨루기)
 {id:'ap',name:'앞차기',rar:'N',cat:'kick',mot:'k:ap',hits:[H(.48,2.3,1)],fx:[],cd:0,trail:'trace_02'},
 {id:'dol',name:'돌려차기',rar:'N',cat:'kick',mot:'k:dol',hits:[H(.5,2.4,1.6,1.3)],cd:0,trail:'twirl_02'},
 {id:'yeopS',name:'옆차기',rar:'N',cat:'kick',mot:'k:yeopS',hits:[H(.5,2.7,.8,1.4)],cd:0,trail:'trace_01'},
 {id:'huryeo',name:'뒤후려차기',rar:'R',cat:'kick',mot:'k:huryeo',hits:[H(.53,2.7,6.3,1.8)],fx:[F(.5,'impacts/hit-spark','front',1.2)],cd:2,trail:'twirl_01'},
 {id:'dwi',name:'뒤차기',rar:'R',cat:'kick',mot:'k:dwi',hits:[H(.5,2.6,.8,1.9)],fx:[F(.5,'explosions/cartoon-pow','front',.7)],cd:2.5,trail:'trace_04'},
 {id:'naeryeo',name:'내려차기',rar:'R',cat:'kick',mot:'k:naeryeo',hits:[H(.65,2.4,1.1,2.1)],fx:[F(.65,'nature/quake','front',.6)],cd:3,trail:'slash_03'},
 {id:'narae',name:'나래차기',rar:'E',cat:'kick',mot:'k:narae',dash:3,hits:[H(.32,2.5,1.6,1.4),H(.69,2.5,1.6,1.6)],cd:3.5,trail:'twirl_02'},
 {id:'geodeup',name:'거듭옆차기',rar:'E',cat:'kick',mot:'k:geodeup',dash:4,hits:[H(.26,2.7,.8,1.2),H(.53,2.7,.8,1.3),H(.81,2.8,.8,1.8)],cd:4,trail:'trace_01'},
 {id:'yeopJ',name:'뛰어옆차기',rar:'E',cat:'kick',mot:'k:yeopJ',dash:7,dashT:[.1,.8],contact:{t0:.15,t1:.8,r:1.3,mul:2.2},hits:[],fx:[F(.95,'nature/quake','self',.7)],cd:4,trail:'trace_01'},
 {id:'jumpkick',name:'뛰어차기',rar:'R',cat:'kick',mot:'c:jumpkick',hits:[H(-1,2.6,1.2,1.8)],fx:[F(-1,'impacts/crit-hit','front',.6)],cd:3,peak:'anR'},
 {id:'bn_kick1',name:'발차기 A (모캡)',rar:'N',cat:'kick',mot:'c:bn_kick1',hits:[H(-1,2.5,1.2,1.2)],cd:1,peak:'anR'},
 {id:'bn_kick3',name:'발차기 C (모캡)',rar:'N',cat:'kick',mot:'c:bn_kick3',hits:[H(-1,2.5,1.2,1.2)],cd:1,peak:'anL'},
 // 트릭킹·시범
 {id:'s540',name:'540 회전차기',rar:'U',cat:'trick',mot:'k:s540',hits:[H(.62,3.6,7,3.2)],fx:[F(.1,'fire/fire-tornado','self',.9),F(.62,'impacts/ground-slam','self',1.2)],cd:6,ring:0xffd24a},
 {id:'s720',name:'720 회전차기',rar:'L',cat:'trick',mot:'k:s720',hits:[H(.45,3.4,7,2.2),H(.78,3.9,7,3.2)],fx:[F(.1,'fire/fire-tornado','self',1.1),F(.78,'explosions/plasma-explosion','self',.8)],cd:7,ring:0xff8a1f},
 {id:'s900',name:'900 후리기',rar:'M',cat:'trick',mot:'k:s900',hits:[H(.5,3.6,7,2.4),H(.82,4.3,7,3.8)],fx:[F(.1,'nature/tornado','self',1.1),F(.82,'impacts/ground-slam','self',1.6)],cd:9,ring:0xff3d5a},
 {id:'boxcut',name:'박스커터',rar:'L',cat:'trick',mot:'k:boxcut',hits:[H(.74,3.8,7,3.3)],fx:[F(.74,'lightning/zap-hit','self',1.5)],cd:7,ring:0x8ad7ff},
 {id:'oebal',name:'외발턴',rar:'U',cat:'trick',mot:'k:oebal',hits:[.22,.36,.5,.64,.78].map(t=>H(t,2.9,7,.75)),fx:[F(.05,'fire/fire-tornado','self',1)],cd:6},
 {id:'btwist',name:'비트위스트',rar:'L',cat:'trick',mot:'k:btwist',hits:[H(.6,3.3,7,2.6)],fx:[F(.62,'arcane/mana-burst','self',.9)],cd:6.5,ring:0xb36bff},
 {id:'popturn',name:'팝턴',rar:'E',cat:'trick',mot:'k:popturn',hits:[H(.7,2.8,7,1.9)],cd:4.5,ring:0xffffff},
 {id:'illusion',name:'일루젼',rar:'M',cat:'trick',mot:'k:illusion',hits:[H(.45,3,7,1.8),H(.72,3.4,7,2.6)],fx:[F(.45,'shadow/shadow-tendrils','self',1)],cd:7},
 {id:'spinkick',name:'회전 점프킥 (모캡)',rar:'E',cat:'trick',mot:'c:spinkick',hits:[H(-1,3,7,2.4)],fx:[F(-1,'impacts/crit-hit','self',.8)],cd:5,peak:'anR'},
 {id:'spinjumpkick',name:'회전 뛰어차기 (모캡)',rar:'U',cat:'trick',mot:'c:spinjumpkick',spd:1.6,hits:[H(-1,3.2,7,2.6)],cd:6,peak:'anR'},
 {id:'kickflip',name:'킥플립 (모캡)',rar:'L',cat:'trick',mot:'c:kickflip',hits:[H(-1,3.2,7,2.8)],fx:[F(-1,'lightning/lightning-strike','self',.7)],cd:7,peak:'anR'},
 {id:'handstandkick',name:'물구나무 발차기 (모캡)',rar:'M',cat:'trick',mot:'c:handstandkick',hits:[H(-1,3.2,7,2.0),H(-.5,3.2,7,2.0)],cd:7,peak:'toR'},
 // 체조 (회피 + 착지 충격파)
 {id:'backflip',name:'뒤공중돌기 (모캡)',rar:'E',cat:'acro',mot:'c:backflip',inv:true,hits:[H(.9,2.6,7,1.4)],fx:[F(.9,'nature/quake','self',.8)],cd:4},
 {id:'cartwheel',name:'옆돌기 (모캡)',rar:'R',cat:'acro',mot:'c:cartwheel',inv:true,hits:[H(.85,2.3,7,1)],cd:3},
 {id:'sideflip',name:'측전 (모캡)',rar:'U',cat:'acro',mot:'c:sideflip',inv:true,hits:[H(.85,2.8,7,1.8)],fx:[F(.85,'impacts/ground-slam','self',.8)],cd:5},
 {id:'handspring',name:'핸드스프링 (모캡)',rar:'E',cat:'acro',mot:'c:handspring',inv:true,hits:[H(.85,2.6,7,1.6)],cd:4},
 {id:'backhandspring',name:'백핸드스프링 (모캡)',rar:'L',cat:'acro',mot:'c:backhandspring',inv:true,hits:[H(.85,2.8,7,2)],fx:[F(.85,'arcane/mana-burst','self',.8)],cd:5},
 {id:'monkeyflip',name:'원숭이 뒤공중돌기 (모캡)',rar:'M',cat:'acro',mot:'c:monkeyflip',inv:true,hits:[H(.85,3,7,2.4)],fx:[F(.85,'explosions/plasma-explosion','self',.7)],cd:6},
 // 지르기
 {id:'jireugi',name:'지르기',rar:'N',cat:'punch',mot:'k:jireugi',hits:[H(.4,1.9,.9,.8)],cd:0,trail:'muzzle_01'},
 {id:'punch',name:'지르기 연타 (모캡)',rar:'R',cat:'punch',mot:'c:punch',hits:[H(.3,2,1,.8),H(.5,2,1,.8),H(.7,2,1,1)],cd:2.5},
 {id:'bn_punch1',name:'지르기 A (모캡)',rar:'N',cat:'punch',mot:'c:bn_punch1',hits:[H(-1,2,1,.9)],cd:1,peak:'wrR'},
 // 무기 (무기 종류가 맞아야 씀)
 {id:'w_cut1',name:'베기',rar:'N',cat:'weapon',wc:['sword','axe'],mot:'k:w_cut1',hits:[H(.5,2.6,1.8)],cd:0,trail:'slash_02'},
 {id:'w_cut2',name:'되베기',rar:'N',cat:'weapon',wc:['sword','axe'],mot:'k:w_cut2',hits:[H(.5,2.6,1.8)],cd:0,trail:'slash_02'},
 {id:'w_chop',name:'내려베기',rar:'R',cat:'weapon',wc:['sword','axe','blunt'],mot:'k:w_chop',hits:[H(.56,2.6,1.1,1.6)],fx:[F(.56,'nature/quake','front',.6)],cd:0,trail:'slash_03'},
 {id:'bn_slash1',name:'연속베기 A (모캡)',rar:'R',cat:'weapon',wc:['sword','axe'],mot:'c:bn_slash1',hits:[H(-1,2.7,1.8,1.3)],cd:1.5,peak:'wrR',trail:'slash_01'},
 {id:'bn_slash3',name:'연속베기 B (모캡)',rar:'E',cat:'weapon',wc:['sword','axe'],mot:'c:bn_slash3',hits:[H(-1,2.7,1.8,1.5)],cd:2,peak:'wrR',trail:'slash_01'},
 {id:'w_sweep',name:'후리기',rar:'R',cat:'weapon',wc:['axe','blunt','spear','sword'],mot:'k:w_sweep',hits:[H(.58,2.9,2.8,1.5)],cd:1.5,trail:'twirl_03'},
 {id:'w_spin',name:'회전베기',rar:'U',cat:'weapon',wc:['sword','axe'],mot:'k:w_spin',hits:[.2,.4,.6,.8].map(t=>H(t,3,7,.9)),fx:[F(.05,'nature/tornado','self',.9)],cd:5,trail:'twirl_01'},
 {id:'w_thrust',name:'찌르기',rar:'N',cat:'weapon',wc:['rapier','spear'],mot:'k:w_thrust',hits:[H(.6,3.2,.5,1.1,'line')],cd:0,trail:'trace_01'},
 {id:'w_flurry',name:'연속찌르기',rar:'E',cat:'weapon',wc:['rapier','spear'],mot:'k:w_flurry',hits:[.17,.36,.56,.78].map(t=>H(t,3.3,.6,.8,'line')),cd:3,trail:'trace_02'},
 {id:'w_slam',name:'대지 가르기',rar:'L',cat:'weapon',wc:['blunt','axe','sword'],mot:'k:w_slam',hits:[H(.74,3.8,7,3.2)],fx:[F(.74,'impacts/ground-slam','front',1.3),F(.74,'nature/earth-spike','front',1)],cd:7},
 {id:'spinattack',name:'회전 공격 (모캡)',rar:'U',cat:'weapon',wc:['sword','axe','blunt','spear'],mot:'c:spinattack',hits:[H(.4,3,7,1.4),H(.7,3,7,1.6)],cd:5},
 {id:'w_cast',name:'마법탄',rar:'R',cat:'magic',wc:['staff'],mot:'k:w_cast',proj:{fx:'projectiles/magic-missile',speed:14,mul:1.4,n:1},hits:[],cd:0},
 {id:'w_meteor',name:'메테오',rar:'M',cat:'magic',wc:['staff'],mot:'k:w_cast',hits:[H(.9,4,7,4)],fx:[F(.3,'fire/meteor','target',1.2)],cd:10,delayHit:true},
 {id:'w_thunder',name:'천둥 소환',rar:'L',cat:'magic',wc:['staff'],mot:'k:w_cast',strike:{n:5,mul:2.4,fx:'lightning/lightning-strike'},hits:[],cd:7},
];
/* ---------- 장비 ---------- */
const MATS=[['wood','나무'],['bronze','청동'],['steel','강철'],['gold','황금'],['diamond','다이아'],['mithril','미스릴'],['crystal','수정']];
const ASLOTS=['helmet','chestplate','leggings','boots'];
const SLOT_KO={helmet:'투구',chestplate:'갑옷',leggings:'바지',boots:'신발',weapon:'무기',bow:'활',dskin:'데미지 스킨'};
const WEAPONS=[['Club','몽둥이','blunt',6,.42,2.2],['Sword','검','sword',8,.4,2.4],['Sword2','기사검','sword',9,.4,2.5],['Rapier','레이피어','rapier',8,.3,2.8],['Katana','카타나','sword',11,.36,2.6],['Axe','도끼','axe',13,.46,2.4],['Lance','창','spear',11,.44,3.2],['BigSword','대검','sword',15,.55,2.8],['Hammer','망치','blunt',17,.6,2.5],['MagicWand','마법 지팡이','staff',12,.4,2.6]];
const BOWTYPES={single:['기본','화살 한 발'],rapid:['연발','화살 4발을 빠르게 연속으로'],multi:['다발','부채꼴로 5발 동시에'],pierce:['관통','적을 꿰뚫고 계속 날아가요'],homing:['유도','적을 따라가는 화살 3발'],explode:['폭발','맞으면 주변까지 폭발'],chain:['번개 연쇄','번개가 적 4마리를 차례로 감전'],laser:['레이저','일직선 위의 적 전부에게 레이저'],rain:['화살비','목표 지점에 화살 10발이 쏟아져요']};
const BOW_BY_RAR={N:['single','rapid'],R:['rapid','multi'],E:['multi','pierce','homing'],U:['explode','homing','pierce'],L:['chain','explode','laser'],M:['laser','rain','chain'],O:['rain','laser']};
const ELEM={fire:['🔥 불꽃','불타요. 불타던 적이 쓰러지면 가까운 3마리에게 옮겨붙어요'],poison:['🧪 독','쌓일수록 받는 피해가 10%씩 늘어요'],bleed:['🩸 출혈','5번 쌓이면 폭발해요'],frost:['❄ 얼음','느려져요'],shock:['⚡ 감전','주변 적에게 번개가 튀어요']};
let uid=Date.now()%1e6;
function rarIdx(k){return RAR[k].i;}
function makeItem(slot,tier,rar){const it={id:'i'+(uid++),slot,tier,rar};const rm=RAR[rar].mul;
  if(slot==='weapon'){const w=WEAPONS[clamp(tier,0,WEAPONS.length-1)];Object.assign(it,{k:w[0],name:w[1],wc:w[2],atk:Math.round(w[3]*rm),spd:w[4],reach:w[5],icon:'a/wp/'+w[0]+'.png'});}
  else if(slot==='bow'){const b=tier>3?'Bow2':'Bow';const t=pick(BOW_BY_RAR[rar]);Object.assign(it,{k:b,shot:t,name:BOWTYPES[t][0]+' '+(b==='Bow2'?'장궁':'활'),atk:Math.round((6+tier*2)*rm),icon:'a/wp/'+b+'.png'});}
  else if(slot==='dskin'){const d=pick(DSKINS.filter(x=>x.rar===rar))||DSKINS[0];Object.assign(it,{k:d.id,name:d.name+' 데미지 스킨',icon:null});}
  else{const m=MATS[clamp(tier,0,MATS.length-1)];const base={helmet:2,chestplate:4,leggings:3,boots:2}[slot];
    Object.assign(it,{k:m[0],name:m[1]+' '+SLOT_KO[slot],def:Math.round(base*(1+tier*.7)*rm),icon:'a/ar/inv_'+slot+'_'+m[0]+'.png',tex:'a/ar/'+slot+'_'+m[0]+'.png'});
    if(slot==='boots')it.kick=Math.round((4+tier*4)*rm);}
  if(slot==='weapon'||slot==='boots'||slot==='bow'){const ri=RAR[rar].i;if(ri>=2)it.elem=pick(ri>=4?['fire','shock','bleed','frost','poison']:['bleed','poison','frost']);}
  return it;}
/* ---------- 데미지 스킨 (직접 만든 컨셉) ---------- */
const DSKINS=[
 {id:'basic',name:'기본',rar:'N',cls:'ds-basic'},
 {id:'mint',name:'민트초코',rar:'N',cls:'ds-mint'},
 {id:'fire',name:'불꽃',rar:'R',cls:'ds-fire',pre:''},
 {id:'ice',name:'얼음',rar:'R',cls:'ds-ice'},
 {id:'retro',name:'레트로 픽셀',rar:'E',cls:'ds-retro'},
 {id:'candy',name:'사탕',rar:'E',cls:'ds-candy'},
 {id:'thunder',name:'번개',rar:'U',cls:'ds-thunder'},
 {id:'belt',name:'검은띠',rar:'U',cls:'ds-belt',pre:'🥋'},
 {id:'gold',name:'황금',rar:'L',cls:'ds-gold'},
 {id:'cyber',name:'사이버',rar:'L',cls:'ds-cyber'},
 {id:'star',name:'별빛',rar:'M',cls:'ds-star',pre:'✦'},
 {id:'blood',name:'붉은 달',rar:'M',cls:'ds-blood'},
 {id:'rainbow',name:'무지개',rar:'O',cls:'ds-rainbow'},
 {id:'dragon',name:'용의 숨결',rar:'O',cls:'ds-dragon',pre:'🐉'},
];
/* ---------- 몬스터 ---------- */
// ai: melee(근접) · charge(돌진) · ranged(원거리) · blink(순간이동) · hop(점프)
const MOBS=[
 {id:'zombie',name:'좀비',model:'hum',tex:'a/mob/zombie.png',ai:'melee',hp:30,atk:8,spd:2.1,arms:'fwd'},
 {id:'husk',name:'허스크',model:'hum',tex:'a/mob/husk.png',ai:'melee',hp:42,atk:11,spd:2.3,arms:'fwd'},
 {id:'skeleton',name:'스켈레톤',model:'hum',thin:1,tex:'a/mob/skeleton.png',ai:'ranged',hp:26,atk:9,spd:2.0},
 {id:'stray',name:'스트레이',model:'hum',thin:1,tex:'a/mob/stray.png',ai:'ranged',hp:34,atk:12,spd:2.0},
 {id:'wither_sk',name:'위더 스켈레톤',model:'hum',thin:1,tex:'a/mob/wither_skeleton.png',ai:'melee',hp:80,atk:16,spd:2.4,scale:1.25},
 {id:'spider',name:'거미',model:'spider',tex:'a/mob/spider.png',ai:'charge',hp:28,atk:9,spd:3.6},
 {id:'slime',name:'슬라임',model:'slime',tex:'a/mob/slime.png',ai:'hop',hp:36,atk:8,spd:2.4},
 {id:'brawler',name:'싸움꾼',model:'hum',skin:'any',ai:'melee',hp:36,atk:10,spd:2.4},
 {id:'runner',name:'돌격대',model:'hum',skin:'any',ai:'charge',hp:28,atk:12,spd:3.2},
 {id:'thrower',name:'투척꾼',model:'hum',skin:'any',ai:'ranged',hp:26,atk:9,spd:2.1},
 {id:'shadow',name:'그림자 닌자',model:'hum',skin:'any',ai:'blink',hp:34,atk:13,spd:2.6},
 {id:'brute',name:'거한',model:'hum',skin:'any',ai:'melee',hp:110,atk:18,spd:1.7,scale:1.45},
];
const BOSSES=[
 {id:'enderman',name:'엔더맨',model:'enderman',hp:900,atk:22,spd:3,scale:1.35,ai:'blink'},
 {id:'golem',name:'철 골렘',model:'golem',hp:1400,atk:28,spd:1.8,scale:1,ai:'golem'},
 {id:'dragon',name:'엔더드래곤',model:'dragon',hp:2200,atk:30,spd:5,scale:1,ai:'dragon'},
 {id:'wither',name:'위더',model:'wither',hp:1800,atk:26,spd:2.6,scale:1.3,ai:'wither'},
 {id:'giant',name:'거인',model:'hum',skin:'any',hp:1200,atk:26,spd:1.6,scale:2.6,ai:'melee'},
];
/* ---------- 스테이지 테마 ---------- */
const THEMES={
 forest:{name:'초록 숲',floor:[['mcl_core_grass_block_top',.7,'#79c05a'],['default_dirt',.15],['default_gravel',.15]],wall:['default_cobble','default_mossycobble'],pillar:['default_tree'],tree:1,fog:0x1a2a1c,light:0xfff1d6,torch:0xffb060,mobs:['zombie','spider','slime','brawler','runner','thrower'],boss:['giant','golem']},
 dungeon:{name:'지하 감옥',floor:[['default_stone_brick',.62],['mcl_core_stonebrick_mossy',.2],['mcl_core_stonebrick_cracked',.1],['default_gravel',.08]],wall:['default_cobble','default_mossycobble'],pillar:['default_stone_brick','mcl_core_stonebrick_mossy'],fog:0x0d0f14,light:0xd8e0ff,torch:0xffa64d,mobs:['zombie','skeleton','husk','brawler','shadow','brute'],boss:['golem','giant']},
 snow:{name:'얼음 설원',floor:[['default_snow',.75],['default_ice',.25]],wall:['default_snow','default_ice'],pillar:['default_ice'],fog:0xb9c9d8,light:0xffffff,torch:0x9fd4ff,mobs:['stray','skeleton','runner','thrower','slime'],boss:['enderman','giant']},
 desert:{name:'모래 사막',floor:[['default_sand',.8],['mcl_core_sandstone_top',.2]],wall:['mcl_core_sandstone_top','default_sand'],pillar:['mcl_core_sandstone_top'],fog:0xd8b98a,light:0xfff0c8,torch:0xffc070,mobs:['husk','spider','thrower','runner','brute'],boss:['giant','golem']},
 nether:{name:'불꽃 지옥',floor:[['mcl_nether_netherrack',.85],['mcl_nether_glowstone',.05],['mcl_nether_nether_brick',.1]],wall:['mcl_nether_nether_brick','mcl_nether_netherrack'],pillar:['mcl_nether_nether_brick','mcl_nether_glowstone'],fog:0x2a0a08,light:0xffb08a,torch:0xff5a2a,mobs:['wither_sk','husk','shadow','brute','slime'],boss:['wither']},
 end:{name:'디 엔드',floor:[['mcl_end_end_stone',.85],['mcl_end_purpur_block',.15]],wall:['default_obsidian','mcl_end_end_stone'],pillar:['default_obsidian','mcl_end_purpur_block'],fog:0x0e0a18,light:0xe0d0ff,torch:0xb06bff,mobs:['shadow','skeleton','runner','brute'],boss:['dragon','enderman']},
};
const DEF_STAGE={themes:Object.keys(THEMES),waves:2,perWave:5,grow:2,bossEvery:5,hpGrow:.18,dropEquip:.3,dropSkill:.08,dropDskin:.03};
