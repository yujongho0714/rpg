/* 정도 게임 메이커 — 게임 (맵 · 플레이어 · 스킬 · 몬스터 · 보스 · 드랍) */
'use strict';
/* ================= 저장 ================= */
const SKEY='jd-gamemaker-v1';
const DB={skills:{},motions:{},items:{},stage:Object.assign({},DEF_STAGE),mobs:{}};
let S={coins:0,stage:0,best:0,bag:[],eq:{},slots:['huryeo','s540','backflip','narae'],combo:['ap','dol','yeopS','huryeo'],owned:[],skin:null,mcskin:null,op:true,god:false};
function saveAll(){try{localStorage.setItem(SKEY,JSON.stringify({S,DB}));}catch(e){toast('저장 공간이 부족해요',1500);}}
try{const t=JSON.parse(localStorage.getItem(SKEY)||'null');if(t){Object.assign(S,t.S||{});Object.assign(DB,t.DB||{});DB.stage=Object.assign({},DEF_STAGE,DB.stage||{});}}catch(e){}
function allSkills(){const m={};BASE_SKILLS.forEach(s=>m[s.id]=s);Object.keys(DB.skills).forEach(k=>m[k]=DB.skills[k]);return m;}
let SK=allSkills();
function skill(id){return SK[id];}
function owns(id){return S.op||S.owned.includes(id)||['ap','dol','yeopS','huryeo','jireugi'].includes(id);}

/* ================= 맵 ================= */
let MAP={N:30,solid:new Uint8Array(900),objs:[],theme:'dungeon'};
const isSolid=(x,z)=>{const N=MAP.N,H=N/2;const i=Math.floor(x+H),j=Math.floor(z+H);if(i<0||j<0||i>=N||j>=N)return true;return MAP.solid[j*N+i]===1;};
async function buildMap(themeKey,opt={}){MAP.objs.forEach(o=>{scene.remove(o);if(o.geometry)o.geometry.dispose();});MAP.objs=[];
  const th=THEMES[themeKey]||THEMES.dungeon;MAP.theme=themeKey;const N=opt.size||(24+2*Math.floor(rnd(0,6)));MAP.N=N;MAP.solid=new Uint8Array(N*N);const HALF=N/2;
  scene.background.set(th.fog);scene.fog.color.set(th.fog);sun.color.set(th.light);
  const names=new Set();th.floor.forEach(f=>names.add(f[0]));th.wall.forEach(n=>names.add(n));th.pillar.forEach(n=>names.add(n));if(th.tree){names.add('default_tree');names.add('default_tree_top');names.add('default_leaves');}
  const T={};await Promise.all([...names].map(async n=>{T[n]=await load('a/bl/'+n+'.png').catch(()=>null);}));
  const fc=cnv(N*16,N*16),fg=fc.getContext('2d');fg.imageSmoothingEnabled=false;
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){let r=Math.random(),acc=0,f=th.floor[0];for(const x of th.floor){acc+=x[1];if(r<acc){f=x;break;}}
    if(T[f[0]])fg.drawImage(T[f[0]],i*16,j*16,16,16);if(f[2]){fg.globalCompositeOperation='multiply';fg.fillStyle=f[2];fg.fillRect(i*16,j*16,16,16);fg.globalCompositeOperation='source-over';}}
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(N,N),new THREE.MeshLambertMaterial({map:tex(fc)}));floor.rotation.x=-PI/2;floor.receiveShadow=true;scene.add(floor);MAP.objs.push(floor);
  const blocks={};const add=(type,i,j,y)=>{(blocks[type]=blocks[type]||[]).push([i-HALF+.5,y+.5,j-HALF+.5]);};
  for(let i=0;i<N;i++)for(let j=0;j<N;j++){if(i===0||j===0||i===N-1||j===N-1){MAP.solid[j*N+i]=1;for(let y=0;y<2+(Math.random()<.4?1:0);y++)add(pick(th.wall),i,j,y);}}
  if(!opt.empty){const np=Math.floor(rnd(3,7));for(let k=0;k<np;k++){const i=Math.floor(rnd(3,N-5)),j=Math.floor(rnd(3,N-5));if(Math.abs(i-HALF)<4&&Math.abs(j-HALF)<4)continue;
      const tree=th.tree&&Math.random()<.5;if(tree){MAP.solid[j*N+i]=1;for(let y=0;y<3;y++)add('default_tree',i,j,y);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(let y=3;y<5;y++)if(!(y===4&&Math.abs(a)+Math.abs(b)===2))add('default_leaves',i+a,j+b,y);add('default_leaves',i,j,5);}
      else{const s=Math.random()<.5?2:1;const h=Math.floor(rnd(2,4));for(let a=0;a<s;a++)for(let b=0;b<s;b++){MAP.solid[(j+b)*N+i+a]=1;for(let y=0;y<h;y++)add(pick(th.pillar),i+a,j+b,y);}}}}
  const geo=new THREE.BoxGeometry(1,1,1);const dummy=new THREE.Object3D();
  Object.keys(blocks).forEach(type=>{if(!T[type])return;const t=tex(T[type]);let mat;
    if(type==='default_tree'){const top=tex(T.default_tree_top);mat=[t,t,top,top,t,t].map(m=>new THREE.MeshLambertMaterial({map:m}));}
    else if(type==='default_leaves')mat=new THREE.MeshLambertMaterial({map:t,transparent:true,alphaTest:.3,color:0x9ad06a});
    else if(type==='mcl_nether_glowstone')mat=new THREE.MeshLambertMaterial({map:t,emissive:0x6a4a10});
    else mat=new THREE.MeshLambertMaterial({map:t});
    const list=blocks[type];const im=new THREE.InstancedMesh(geo,mat,list.length);list.forEach((p,k)=>{dummy.position.set(p[0],p[1],p[2]);dummy.updateMatrix();im.setMatrixAt(k,dummy.matrix);});
    im.castShadow=true;im.receiveShadow=true;scene.add(im);MAP.objs.push(im);});
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>{const l=new THREE.PointLight(th.torch,.9,10,2);l.position.set(a*(HALF-2),2.2,b*(HALF-2));scene.add(l);MAP.objs.push(l);});}

/* ================= 플레이어 ================= */
const P={rig:null,pos:new V3(0,0,0),face:0,hp:100,max:100,act:null,cd:{},walk:0,inv:0,dead:false,combo:0,comboT:0,wcombo:0,wcomboT:0};
async function buildPlayer(){P.rig=makeRig();scene.add(P.rig.root);await refreshSkin();await refreshGear();}
const DOBOK={base:'#eeb592',hair:1,hairC:'#151515',eye:2,mouth:1,top:1,topC:'#f4f4f0',bottom:1,bottomC:'#f4f4f0',footwear:0,headwear:0,belt:'#151515'};
if(!S.skin)S.skin=Object.assign({},DOBOK);
async function composeSkin(k){const out=cnv(64,32),g=out.getContext('2d');g.imageSmoothingEnabled=false;
  const L=async(n,maskCol)=>{const t=await load('a/sk/mcl_skins_'+n+'.png').catch(()=>null);if(!t)return;
    if(maskCol){const m=await load('a/sk/mcl_skins_'+n+'_mask.png').catch(()=>null);if(m){const c=cnv(64,32),cg=c.getContext('2d');cg.drawImage(m,0,0);cg.globalCompositeOperation='source-in';cg.fillStyle=maskCol;cg.fillRect(0,0,64,32);g.drawImage(c,0,0);}}
    g.drawImage(t,0,0);};
  await L('base_1',k.base);if(k.footwear)await L('footwear_'+k.footwear);if(k.eye)await L('eye_'+k.eye);if(k.mouth)await L('mouth_'+k.mouth);
  if(k.bottom)await L('bottom_'+k.bottom,k.bottomC);if(k.top)await L('top_'+k.top,k.topC);if(k.belt){g.fillStyle=k.belt;g.fillRect(16,26,24,2);}
  if(k.hair)await L('hair_'+k.hair,k.hairC);if(k.headwear)await L('headwear_'+k.headwear);return out;}
async function refreshSkin(){let img=null;if(S.mcskin)img=await load(S.mcskin).catch(()=>null);if(!img)img=await composeSkin(S.skin);skinRig(P.rig,img);}
const HELD={};
async function itemImg(it){if(it.img)return load(it.img);if(!it.icon&&it.ic&&typeof ICO!=='undefined'&&ICO&&ICO[it.ic]){const a=await load('ic/icons.png');const i=ICO[it.ic][0];return crop(a,(i%40)*32,Math.floor(i/40)*32,32,32);}return load(it.icon);}
async function refreshGear(){
  for(const s of ASLOTS){const it=S.eq[s];armorRig(P.rig,s,it?await load(it.tex).catch(()=>null):null);}
  ['w','b','s'].forEach(k=>{if(HELD[k]){HELD[k].parent.remove(HELD[k]);HELD[k]=null;}});
  const w=S.eq.weapon;if(w){const im=await itemImg(w).catch(()=>null);if(im){const m=voxel(im,1,(w.size||1)*Math.min(.065,1.3/Math.max(im.width,im.height)));m.geometry.computeBoundingBox();const bb=m.geometry.boundingBox;
      if(w.wc==='gun'){m.geometry.translate(0,0,0);m.rotation.set(0,PI/2,PI/2);m.position.set(0,-.05,.25);}else{m.geometry.translate(0,-bb.min.y-.06,0);m.rotation.set(1.75,0,0);m.position.set(0,-.02,.02);}
      const g=new THREE.Group();g.add(m);P.rig.hand.add(g);HELD.w=g;}}
  const sh=S.eq.shield;const b=S.eq.bow;const left=sh||b;
  if(left){const im=await itemImg(left).catch(()=>null);if(im){const m=voxel(im,1,(left.size||1)*Math.min(.06,1.1/Math.max(im.width,im.height)));if(left===sh){m.rotation.set(0,PI/2,0);m.position.set(.2,-.1,0);}else{m.rotation.set(0,PI/2,PI/2);m.position.set(0,-.05,0);}P.rig.handL.add(m);HELD.b=m;}}
  updStats();}
function stats(){let def=0,kick=0;ASLOTS.forEach(s=>{const it=S.eq[s];if(it){def+=it.def||0;kick+=it.kick||0;}});if(S.eq.shield)def+=S.eq.shield.def||0;
  const w=S.eq.weapon;return{def,kick:10+kick,atk:w?w.atk:5,bow:S.eq.bow?S.eq.bow.atk:0,max:100+def*4};}
function updStats(){const s=stats();P.max=s.max;P.hp=Math.min(P.hp,P.max);$('#sAtk').textContent=s.atk;$('#sKick').textContent=s.kick;$('#sDef').textContent=s.def;updHP();}
function updHP(){$('#hpT').textContent=Math.ceil(P.hp)+'/'+P.max;$('#hpB').style.width=(100*P.hp/P.max)+'%';}

/* ================= 데미지 숫자 (데미지 스킨) ================= */
const floaters=[];
function dmgText(pos,v,kind){if(floaters.length>45)return;const ds=DSKINS.find(d=>d.id===(S.eq.dskin&&S.eq.dskin.k))||DSKINS[0];const e=document.createElement('div');
  const hurt=kind==='hurt',dot=['burn','poison','bleed','shock'].includes(kind);e.className='dmg '+(kind==='heal'?'ds-heal ':'')+(hurt?'ds-hurt':dot?'ds-dot ds-'+kind:ds.cls)+(kind==='crit'?' crit':kind==='big'?' big':kind==='burst'?' crit':'');
  e.textContent=(hurt||dot?'':(ds.pre||''))+v+(kind==='crit'?'!':'');document.body.appendChild(e);const p=pos.clone();p.y+=2.1+rnd(0,.4);p.x+=rnd(-.3,.3);floaters.push({el:e,p,t:0,life:kind==='crit'?1:.8});}
function floatTick(dt){for(let i=floaters.length-1;i>=0;i--){const f=floaters[i];f.t+=dt;const k=f.t/f.life;const p=f.p.clone();p.y+=k*1.2;p.project(cam);
  f.el.style.left=((p.x+1)/2*innerWidth)+'px';f.el.style.top=((1-p.y)/2*innerHeight)+'px';f.el.style.opacity=1-k*k;if(k>=1){f.el.remove();floaters.splice(i,1);}}}
let toastT=0;function toast(t,ms=1600){const e=$('#toast');e.innerHTML=t;e.style.opacity=1;clearTimeout(toastT);toastT=setTimeout(()=>e.style.opacity=0,ms);}
let mvT=0;function showMove(t,col){const e=$('#movename');e.textContent=t;e.style.color=col||'#fff';e.style.opacity=1;clearTimeout(mvT);mvT=setTimeout(()=>e.style.opacity=0,600);}

/* ================= 몬스터 · 보스 · 허수아비 ================= */
const mobs=[];let SKINS=[];for(let i=0;i<102;i++)SKINS.push('us/'+String(i).padStart(3,'0')+'.png');
function mobDef(id){return Object.assign({},MOBS.find(m=>m.id===id)||BOSSES.find(m=>m.id===id)||{},DB.mobs[id]||{});}
function mkSpider(img){const g=new THREE.Group();const s=PX;const part=(w,h,d,u,v,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w*s,h*s,d*s),mats(order(faces(img,u,v,w,h,d))));m.position.set(x*s,y*s,z*s);m.castShadow=true;g.add(m);return m;};
  part(10,8,12,0,12,0,9,-7);part(6,6,6,0,0,0,9,1);part(8,8,8,32,4,0,9,8);const legs=[];const lm=mats(order(faces(img,18,0,16,2,2)));
  for(let i=0;i<8;i++){const side=i<4?1:-1;const k=i%4;const pv=new THREE.Group();pv.position.set(side*3*s,9*s,(-3+k*2.4)*s);const m=new THREE.Mesh(new THREE.BoxGeometry(16*s,2*s,2*s),lm);m.position.x=side*8*s;m.castShadow=true;pv.add(m);pv.rotation.z=side*.6;pv.rotation.y=side*(-.6+k*.4);g.add(pv);legs.push(pv);}
  g.userData.legs=legs;return g;}
function mkSlime(img){const g=new THREE.Group();const s=PX;const inner=new THREE.Mesh(new THREE.BoxGeometry(6*s,6*s,6*s),mats(order(faces(img,0,16,6,6,6))));inner.position.y=4*s;g.add(inner);
  const outer=new THREE.Mesh(new THREE.BoxGeometry(8*s,8*s,8*s),mats(order(faces(img,0,0,8,8,8))).map(m=>{if(m.map){m.transparent=true;m.opacity=.75;m.depthWrite=false;}return m;}));outer.position.y=4*s;outer.castShadow=true;g.add(outer);g.scale.setScalar(1.6);return g;}
function mkGolem(img){const g=new THREE.Group();const s=PX*1.15;const B=(w,h,d,u,v,par,x,y,z,piv)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w*s,h*s,d*s),mats(order(facesAbs(img,u,v,w,h,d))));m.castShadow=true;
    if(piv){const p=new THREE.Group();p.position.set(x*s,y*s,z*s);m.position.y=-h/2*s;p.add(m);par.add(p);return p;}m.position.set(x*s,y*s,z*s);par.add(m);return m;};
  const legL=B(6,16,5,60,0,g,4,16,0,true),legR=B(6,16,5,37,0,g,-4,16,0,true);
  const body=new THREE.Group();body.position.y=16*s;g.add(body);B(9,5,6,0,70,body,0,2.5,0);B(18,12,11,0,40,body,0,11,0);
  const head=new THREE.Group();head.position.set(0,17*s,-2*s);body.add(head);B(8,10,8,0,0,head,0,5,0);B(2,4,2,24,0,head,0,3,4.5);
  const armR=B(4,30,6,60,21,body,-11,16,0,true),armL=B(4,30,6,60,58,body,11,16,0,true);
  g.userData={legL,legR,armL,armR,body,head};return g;}
function mkDragon(img){const g=new THREE.Group();const s=PX*.9;const M=(c)=>new THREE.MeshLambertMaterial({map:tex(c)});
  const scale=crop(img,0,24,64,32),belly=crop(img,0,64,48,24);const bm=M(scale);
  const body=new THREE.Mesh(new THREE.BoxGeometry(24*s,24*s,64*s),mats(order(facesAbs(img,0,0,24,24,64))));body.castShadow=true;g.add(body);
  const neck=[];let prev=g;for(let i=0;i<5;i++){const n=new THREE.Group();n.position.set(0,i?0:4*s,i?10*s:32*s);prev.add(n);const m=new THREE.Mesh(new THREE.BoxGeometry(10*s,10*s,10*s),bm);m.position.z=5*s;m.castShadow=true;n.add(m);neck.push(n);prev=n;}
  const head=new THREE.Group();head.position.z=10*s;prev.add(head);const hf=crop(img,112,40,64,24);
  const hm=new THREE.Mesh(new THREE.BoxGeometry(16*s,14*s,18*s),[bm,bm,bm,bm,M(hf),bm]);hm.position.z=9*s;hm.castShadow=true;head.add(hm);
  const jaw=new THREE.Mesh(new THREE.BoxGeometry(12*s,4*s,16*s),bm);jaw.position.set(0,-8*s,10*s);head.add(jaw);
  const tail=[];prev=g;for(let i=0;i<9;i++){const n=new THREE.Group();n.position.set(0,0,i?-10*s:-32*s);prev.add(n);const m=new THREE.Mesh(new THREE.BoxGeometry(10*s*(1-i*.06),10*s*(1-i*.06),10*s),bm);m.position.z=-5*s;m.castShadow=true;n.add(m);tail.push(n);prev=n;}
  const wingTex=tex(crop(img,0,92,112,50)),tipTex=tex(crop(img,12,145,100,48));const wings=[];
  [-1,1].forEach(side=>{const w=new THREE.Group();w.position.set(side*12*s,8*s,10*s);g.add(w);const bone=new THREE.Mesh(new THREE.BoxGeometry(56*s,4*s,4*s),bm);bone.position.x=side*28*s;w.add(bone);
    const mem=new THREE.Mesh(new THREE.PlaneGeometry(56*s,40*s),new THREE.MeshLambertMaterial({map:wingTex,transparent:true,alphaTest:.3,side:THREE.DoubleSide}));mem.rotation.x=-PI/2;mem.position.set(side*28*s,0,-20*s);if(side<0)mem.scale.x=-1;w.add(mem);
    const tip=new THREE.Group();tip.position.x=side*56*s;w.add(tip);const tm=new THREE.Mesh(new THREE.PlaneGeometry(56*s,40*s),new THREE.MeshLambertMaterial({map:tipTex,transparent:true,alphaTest:.3,side:THREE.DoubleSide}));tm.rotation.x=-PI/2;tm.position.set(side*28*s,0,-20*s);if(side<0)tm.scale.x=-1;tip.add(tm);
    w.userData.tip=tip;wings.push(w);});
  g.userData={neck,head,jaw,tail,wings};return g;}
function mkWither(img){const g=new THREE.Group();const s=PX*1.1;const tint=0xd0d0dc;
  const spine=new THREE.Mesh(new THREE.BoxGeometry(3*s,14*s,3*s),mats(order(faces(img,12,22,3,10,3)),false,tint));spine.position.y=7*s;g.add(spine);
  const ribs=new THREE.Mesh(new THREE.BoxGeometry(11*s,8*s,4*s),mats(order(faces(img,24,22,11,2,2)),false,tint));ribs.position.y=13*s;g.add(ribs);
  const top=new THREE.Mesh(new THREE.BoxGeometry(20*s,3*s,3*s),mats(order(faces(img,0,16,20,3,3)),false,tint));top.position.y=18*s;g.add(top);
  const heads=[];[[0,24,8,0,0],[-9,21,6,32,0],[9,21,6,32,0]].forEach(([x,y,sz,u,v])=>{const h=new THREE.Mesh(new THREE.BoxGeometry(sz*s,sz*s,sz*s),mats(order(faces(img,u,v,sz,sz,sz)),false,tint));h.position.set(x*s,y*s,0);h.castShadow=true;g.add(h);heads.push(h);});
  g.userData={heads};return g;}
async function mkScarecrow(){const g=new THREE.Group();const wood=tex(await load('a/bl/default_tree.png')),hay=tex(await load('a/bl/mcl_farming_hayblock_side.png')),hayT=tex(await load('a/bl/mcl_farming_hayblock_top.png'));
  const pf=tex(await load('a/bl/farming_pumpkin_face.png')),ps=tex(await load('a/bl/farming_pumpkin_side.png')),pt=tex(await load('a/bl/farming_pumpkin_top.png'));const L=t=>new THREE.MeshLambertMaterial({map:t});
  const post=new THREE.Mesh(new THREE.BoxGeometry(.25,1.6,.25),L(wood));post.position.y=.8;g.add(post);
  const body=new THREE.Mesh(new THREE.BoxGeometry(.8,.9,.45),[L(hay),L(hay),L(hayT),L(hayT),L(hay),L(hay)]);body.position.y=1.45;body.castShadow=true;g.add(body);
  const arm=new THREE.Mesh(new THREE.BoxGeometry(1.9,.2,.2),L(wood));arm.position.y=1.65;g.add(arm);
  const head=new THREE.Mesh(new THREE.BoxGeometry(.6,.6,.6),[L(ps),L(ps),L(pt),L(pt),L(pf),L(ps)]);head.position.y=2.2;head.castShadow=true;g.add(head);return g;}
async function spawnMob(id,x,z,o={}){const d=mobDef(id);if(!d.id)return null;let obj,rig=null;let img=null;
  const skin=o.skin||(d.skin==='any'?pick(SKINS):d.tex);if(skin)img=await load(skin).catch(()=>null);
  if(d.model==='hum'){rig=makeRig(d.thin?{aw:2,ad:2,lw:2,ld:2}:{});if(img)skinRig(rig,img);obj=rig.root;}
  else if(d.model==='enderman'){img=await load('a/boss/enderman.png');rig=makeRig({aw:2,ad:2,lw:2,ld:2,arm:15,leg:15});skinRig(rig,img,{bodyU:32,bodyV:16,armUV:[56,0],legUV:[56,0],armLen:30,legLen:30,mirrorLimbs:true,overlay:false});
    const eyes=await load('a/boss/enderman_eyes.png');const L=layer(rig,'eyes',.05);L.head.material=order(faces(eyes,0,0,8,8,8)).map(c=>empty(c)?INV:new THREE.MeshBasicMaterial({map:tex(c),transparent:true,alphaTest:.1}));L.head.visible=true;obj=rig.root;}
  else if(d.model==='spider')obj=mkSpider(img);else if(d.model==='slime')obj=mkSlime(img);
  else if(d.model==='golem')obj=mkGolem(await load('a/boss/iron_golem.png'));else if(d.model==='dragon')obj=mkDragon(await load('a/boss/dragon.png'));else if(d.model==='wither')obj=mkWither(await load('a/boss/wither.png'));
  else if(d.model==='dummy')obj=await mkScarecrow();
  else if(d.model==='duel'){obj=await mkDuelMob(d,o);if(!obj)return null;}
  else if(d.model==='kk'){obj=await mkKKMob(d,o);if(!obj)return null;}
  const sc=(d.scale||1)*(o.scale||1);obj.scale.multiplyScalar(sc);obj.position.set(x,0,z);scene.add(obj);
  const lv=o.level||Math.max(1,S.stage);const hpMul=1+(lv-1)*DB.stage.hpGrow,atkMul=1+(lv-1)*.1;
  const m={id,d,obj,rig,pos:obj.position,hp:(d.hp||30)*hpMul,max:(d.hp||30)*hpMul,atk:(d.atk||8)*atkMul,spd:d.spd||2,cd:rnd(.6,1.6),wind:0,face:o.face||0,kb:new V3(),vy:0,lift:0,hurt:0,dead:0,boss:!!BOSSES.find(b=>b.id===id),ph:Math.random()*6,hop:0,radius:(d.model==='kk'&&BOSSES.find(b=>b.id===id)?.9:d.pool==='boss'?1:d.model==='dragon'?2.2:d.model==='golem'?1:.45)*sc,squash:0,dummy:d.model==='dummy',st:null,t:0,fly:d.model==='dragon'?4:d.model==='wither'?2.5:0};
  if(m.dummy){m.hp=m.max=1e9;}
  const bar=document.createElement('div');bar.className='mbar'+(m.boss?' boss':'');bar.innerHTML='<i></i>';document.body.appendChild(bar);m.bar=bar;
  if(m.boss){$('#bossbar').hidden=false;$('#bossName').textContent=d.name;}
  mobs.push(m);return m;}
function removeMob(m){scene.remove(m.obj);m.bar.remove();const i=mobs.indexOf(m);if(i>=0)mobs.splice(i,1);}

/* ================= 상태이상 (파티클로 표시) ================= */
function applyStatus(m,el,v){if(m.dead||!el)return;m.st=m.st||{};let s=m.st[el];if(!s)s=m.st[el]={n:0,t:0,d:Math.max(2,v*.18),tick:0,fx:0};
  s.t=el==='bleed'?6:el==='frost'?2.2:4;s.n=Math.min(el==='poison'?10:5,s.n+1);s.d=Math.max(s.d,v*.18);
  if(el==='bleed'&&s.n>=5){s.n=0;hurtMob(m,v*2.5+20,false,null,{dot:'burst'});pfx('impacts/crit-hit',m.pos.clone().setY(1),{over:true,scale:.8,opt:{palette:['#1a0006','#3d000c','#6e0016','#a3001f','#d6002a','#ff2a4a','#ff8a9a','#ffffff']}});sfx('Explosion',.3,1.4);hitStop=Math.max(hitStop,.06);}
  if(el==='shock'){const near=mobs.filter(x=>!x.dead&&x!==m&&x.pos.distanceTo(m.pos)<5).slice(0,2);near.forEach(x=>{beam('spark_05',m.pos.clone().setY(1.2),x.pos.clone().setY(1.2),{color:0x9fd4ff,w:.7});hurtMob(x,v*.4,false,null,{dot:'shock'});});}}
function statusTick(m,dt){if(!m.st)return;for(const el in m.st){const s=m.st[el];s.t-=dt;s.fx-=dt;const p=m.pos.clone();
  if(s.fx<=0){s.fx=.12;if(el==='fire')kb(pick(['flame_01','flame_02','flame_04']),p.clone().add(new V3(rnd(-.3,.3),rnd(.4,1.6),rnd(-.3,.3))),{color:0xff7a1a,size:.6,life:.5,vel:new V3(0,1.8,0)});
    else if(el==='poison')kb('circle_02',p.clone().add(new V3(rnd(-.3,.3),rnd(.5,1.7),rnd(-.3,.3))),{color:0x7bff4a,size:.3,life:.6,vel:new V3(0,1.2,0)});
    else if(el==='bleed')kb('light_01',p.clone().add(new V3(rnd(-.25,.25),rnd(.8,1.6),rnd(-.25,.25))),{color:0xff1a3a,size:.25,life:.6,vel:new V3(0,0,0),g:6});
    else if(el==='frost')kb('star_04',p.clone().add(new V3(rnd(-.4,.4),rnd(.3,1.8),rnd(-.4,.4))),{color:0x9fe8ff,size:.35,life:.5});}
  if(el==='fire'){s.tick+=dt;if(s.tick>=.5){s.tick=0;hurtMob(m,s.d,false,null,{dot:'burn'});}}
  if(s.t<=0)delete m.st[el];}}

/* ================= 타격 · 타격감 ================= */
let hitStop=0,shake=0;
function flash(m,on){m.obj.traverse(o=>{if(o.isMesh)(Array.isArray(o.material)?o.material:[o.material]).forEach(mt=>{if(mt.emissive)mt.emissive.setRGB(on?1:0,on?1:0,on?1:0);});});}
let killed=0;
function hurtMob(m,v,crit,kb3,o={}){if(!m||m.dead)return;
  if(m.st&&m.st.poison)v*=1+.1*m.st.poison.n;v=Math.max(1,Math.round(v));
  m.hp-=v;if(kb3&&!m.boss)m.kb.add(kb3);else if(kb3)m.kb.addScaledVector(kb3,.25);
  if(!o.dot){flash(m,true);m.flashT=.08;m.squash=1;const hp=m.pos.clone().setY((m.fly||0)+(m.boss?1.8:1.05));
    if(crit||o.big){pfx(crit?'impacts/crit-hit':'explosions/cartoon-pow',hp,{over:true,scale:crit?1:.8});hitStop=Math.max(hitStop,crit?.1:.07);shake=Math.max(shake,crit?.22:.16);}
    else{pfx(o.blunt?'impacts/blunt-hit':'impacts/hit-spark',hp,{over:true,scale:1.05,opt:{flip:Math.random()<.5}});hitStop=Math.max(hitStop,.045);shake=Math.max(shake,.08);}
    for(let i=0;i<5;i++)kb('spark_01',hp.clone(),{color:crit?0xffd24a:0xffffff,size:.35,life:.25,vel:new V3(rnd(-6,6),rnd(1,5),rnd(-6,6)),grow:.5});
    sfx(pick(['Hit','Hit2']),.5,rnd(.85,1.15));if(crit||o.big)sfx('Hit',.4,.7);
    dmgText(m.pos.clone().setY(m.fly||0),v,crit?'crit':o.big?'big':'');}
  else dmgText(m.pos.clone().setY(m.fly||0),v,o.dot);
  if(o.elem)applyStatus(m,o.elem,v);
  if(m.dummy){m.hp=m.max;m.dmgSum=(m.dmgSum||0)+v;m.dmgN=(m.dmgN||0)+1;return;}
  if(m.hp<=0){m.dead=.001;flash(m,false);killed++;sfx(m.boss?'Explosion':'Kill',.5);
    // 쓰러질 때: 날아가며 회전 + 블록 조각
    const away=(kb3||new V3(rnd(-1,1),0,rnd(-1,1))).clone().setY(0).normalize();m.vdie=away.multiplyScalar(m.boss?2:7);m.vy=m.boss?3:6;m.spin=rnd(6,12)*(Math.random()<.5?-1:1);
    for(let i=0;i<12;i++){const c=new THREE.Mesh(new THREE.BoxGeometry(.12,.12,.12),new THREE.MeshLambertMaterial({color:new THREE.Color().setHSL(Math.random(),.4,.5)}));c.position.copy(m.pos).setY(1);scene.add(c);gibs.push({m:c,v:new V3(rnd(-4,4),rnd(3,7),rnd(-4,4)),t:0});}
    pfx(m.boss?'shadow/dark-explosion':'spawn/poof',m.pos.clone().setY(.05),{scale:m.boss?1.3:1});
    if(m.st&&m.st.fire)mobs.filter(x=>!x.dead&&x!==m).sort((a,b)=>a.pos.distanceTo(m.pos)-b.pos.distanceTo(m.pos)).slice(0,3).forEach(x=>{if(x.pos.distanceTo(m.pos)<6)applyStatus(x,'fire',m.st.fire.d);});
    if(MODE==='play'||MODE==='world'){S.coins+=m.boss?25:2;$('#coinT').textContent=S.coins;dropCoins(m.pos,m.boss?10:2);rollLoot(m);updWave();}
    if(m.boss){$('#bossbar').hidden=true;}}}
const gibs=[];

/* ================= 스킬 실행 ================= */
function motionOf(sk){const [t,k]=(sk.mot||'k:ap').split(':');if(t==='k')return{type:'k',m:KEYMOTION[k]||KEYMOTION.ap,dur:(KEYMOTION[k]||KEYMOTION.ap).dur};const c=CLIPS[k];if(!c)return{type:'k',m:KEYMOTION.ap,dur:.42};return{type:'c',c,dur:c.dur};}
function hitTimes(sk,mo){// -1 = 모션의 가장 빠른 순간(발·손 끝 속도 최고점)
  return (sk.hits||[]).map((h,i)=>{let t=h.t;if(t<0){const pk=mo.c&&mo.c.peak&&mo.c.peak[sk.peak||'anR'];t=pk!=null?pk/mo.dur:.5;if(h.t<-.9)t=t;else t=Math.min(.98,t+.25);}return Object.assign({},h,{tt:t});});}
function nearest(maxD,from){from=from||P.pos;let best=null,bd=maxD;mobs.forEach(m=>{if(m.dead)return;const d=m.pos.distanceTo(from);if(d<bd){bd=d;best=m;}});return best;}
function faceTo(m){if(m)P.face=Math.atan2(m.pos.x-P.pos.x,m.pos.z-P.pos.z);}
function canUse(sk){if(!sk)return false;if(sk.wc&&sk.cat!=='bow'){const w=S.eq.weapon;if(!w||!sk.wc.includes(w.wc)){toast('이 스킬은 '+sk.wc.map(c=>WCLASS[c]).join('·')+' 무기가 필요해요',1300);return false;}}return true;}
function useSkill(id,slotKey){if(P.dead||paused)return;const sk=skill(id);if(!sk||!canUse(sk))return;
  if(P.act&&!(P.act.chain&&P.act.t>P.act.dur*.55))return;
  const cdKey=(slotKey==='J'||slotKey==='K')?slotKey+id:slotKey;
  if(cdKey&&(P.cd[cdKey]||0)>0)return;
  const mo=motionOf(sk);const spd=sk.spd||1;const dur=mo.dur/spd;
  faceTo(nearest(sk.cat==='magic'?14:6));
  P.act={sk,mo,t:0,dur,spd,hits:hitTimes(sk,mo),done:new Set(),fxDone:new Set(),chain:slotKey==='J'||slotKey==='K',origin:P.pos.clone(),contactHit:new Set()};
  if(sk.inv)P.inv=dur*.9;
  if(cdKey&&sk.cd)P.cd[cdKey]=sk.cd;
  const r=RAR[sk.rar]||RAR.N;showMove(sk.name,r.col);sfx('Fx',.3,sk.cat==='trick'?.8:1.2);
  if(['U','L','M','O'].includes(sk.rar)){kp('magic_02',P.pos.clone().setY(.05),{color:new THREE.Color(r.col).getHex(),size:3.2,life:.6,spin:2});}return true;}
function skillDamage(sk,h){const st=stats();const base=sk.cat==='weapon'||sk.cat==='magic'?st.atk*1.1+st.kick*.3:sk.cat==='punch'?st.kick*.8:st.kick;return base*(h.mul||1)*(sk.mul||1)*(RAR[sk.rar]||RAR.N).mul;}
function skillElem(sk){return sk.cat==='weapon'||sk.cat==='magic'?(S.eq.weapon&&S.eq.weapon.elem):(S.eq.boots&&S.eq.boots.elem);}
function doSkillHit(a,h){const sk=a.sk;const fw=new V3(Math.sin(P.face),0,Math.cos(P.face));let hits=0;const elem=skillElem(sk);
  const reach=(sk.cat==='weapon'&&S.eq.weapon?Math.max(h.range,S.eq.weapon.reach):h.range);
  mobs.forEach(m=>{if(m.dead)return;const to=m.pos.clone().sub(P.pos);to.y=0;const dist=to.length()-m.radius;if(dist>reach)return;
    const ang=Math.abs(Math.atan2(Math.sin(Math.atan2(to.x,to.z)-P.face),Math.cos(Math.atan2(to.x,to.z)-P.face)));
    if(h.shape==='cone'&&ang>(h.arc||1.2)/2&&dist>.6)return;if(h.shape==='line'){const side=Math.abs(to.x*fw.z-to.z*fw.x);if(side>.9+m.radius||to.dot(fw)<0)return;}
    const crit=Math.random()<.15;const big=(h.mul||1)*(sk.mul||1)>=1.8;hurtMob(m,skillDamage(sk,h)*(crit?1.8:1)*rnd(.9,1.1),crit,to.normalize().multiplyScalar(big?10:6),{elem,big,blunt:sk.cat==='weapon'&&S.eq.weapon&&S.eq.weapon.wc==='blunt'});hits++;});
  // 타격 모양 이펙트
  const col=new THREE.Color((RAR[sk.rar]||RAR.N).col).getHex();
  if(h.shape==='circle'){kp('circle_03',P.pos.clone().setY(.08),{color:sk.ring||col,size:h.range*2,life:.35,grow:1.3});kp(sk.trail||'twirl_01',P.pos.clone().setY(1),{color:0xffffff,size:h.range*1.8,life:.25,spin:-9});}
  else{const p=P.pos.clone().addScaledVector(fw,Math.min(1.4,reach*.55)).setY(1);kp(sk.trail||'slash_02',p,{color:sk.cat==='weapon'?0x9fd4ff:0xffffff,size:reach*1.3,life:.22,rot:P.face+PI/2,grow:1.2});
    if(h.shape==='line')beam('trace_01',P.pos.clone().setY(1),P.pos.clone().addScaledVector(fw,reach).setY(1),{color:0xffffff,w:.5,life:.18});}
  if(S.dbg)showHitShape(h,reach,fw);
  if(!hits)sfx('Fx',.2,1.6);}
function showHitShape(h,reach,fw){if(h.shape==='circle'){kp('circle_02',P.pos.clone().setY(.07),{color:0xff3d5a,size:reach*2,life:.6,grow:1});}
  else if(h.shape==='line'){beam('light_01',P.pos.clone().setY(.07),P.pos.clone().addScaledVector(fw,reach).setY(.07),{color:0xff3d5a,w:1.8,life:.6});}
  else{const g=new THREE.CircleGeometry(reach,24,-(h.arc||1.2)/2,(h.arc||1.2));g.rotateX(-PI/2);const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0xff3d5a,transparent:true,opacity:.35,depthWrite:false,side:THREE.DoubleSide}));
    m.rotation.y=P.face-PI/2;m.position.copy(P.pos).setY(.07);scene.add(m);setTimeout(()=>scene.remove(m),600);}}
function doSkillFx(a,f){const fw=new V3(Math.sin(P.face),0,Math.cos(P.face));let pos;
  if(f.at==='self')pos=P.pos.clone().setY(.05);else if(f.at==='target'){const tg=nearest(14);pos=(tg?tg.pos.clone():P.pos.clone().addScaledVector(fw,5)).setY(.05);a.tpos=pos;}
  else pos=P.pos.clone().addScaledVector(fw,1.6).setY(.05);
  if(f.id.startsWith('k:'))kp(f.id.slice(2),pos.clone().setY(.08),{color:f.color||0xffffff,size:(f.scale||1)*3,life:.5,spin:3});else pfx(f.id,pos,{scale:f.scale||1,over:f.at!=='self'});}
function updateAct(dt){const a=P.act;a.t+=dt;const k=Math.min(1,a.t/a.dur);const sk=a.sk;
  // 모션
  let lift=0;if(a.mo.type==='k'){if(a.mo.m.jump)lift=Math.sin(k*PI)*a.mo.m.jump;pose(P.rig,track(a.mo.m.keys,k*a.mo.m.dur),lift);}
  else{const rr=clipPose(P.rig,a.mo.c,k*a.mo.dur);P.rig.root.position.set(P.pos.x,0,P.pos.z);P.rig.root.rotation.y=P.face;groundFix(P.rig);a.lastR=rr;}
  // 돌진
  if(sk.dash){const t0=(sk.dashT||[0,1])[0],t1=(sk.dashT||[0,1])[1];if(k>=t0&&k<=t1){const fw=new V3(Math.sin(P.face),0,Math.cos(P.face));moveCircle(P.pos,fw.x*sk.dash*dt,fw.z*sk.dash*dt,.35);}}
  if(sk.contact&&k>=sk.contact.t0&&k<=sk.contact.t1){const fw=new V3(Math.sin(P.face),0,Math.cos(P.face));mobs.forEach(m=>{if(m.dead||a.contactHit.has(m))return;if(m.pos.distanceTo(P.pos)<sk.contact.r+m.radius){a.contactHit.add(m);const crit=Math.random()<.2;hurtMob(m,skillDamage(sk,{mul:sk.contact.mul})*(crit?1.8:1),crit,fw.clone().multiplyScalar(9),{elem:skillElem(sk),big:true});}});
    if(Math.random()<.5)kb('trace_01',P.pos.clone().setY(1),{color:0x9fd4ff,size:1.2,life:.25,rot:P.face});}
  a.hits.forEach((h,i)=>{if(!a.done.has(i)&&k>=h.tt){a.done.add(i);if(sk.delayHit){setTimeout(()=>{const save=P.pos.clone();if(a.tpos)P.pos.copy(a.tpos);doSkillHit(a,h);P.pos.copy(save);},50);}else doSkillHit(a,h);}});
  (sk.fx||[]).forEach((f,i)=>{let tt=f.t;if(tt<0){const pk=a.mo.c&&a.mo.c.peak&&a.mo.c.peak[sk.peak||'anR'];tt=pk!=null?pk/a.mo.dur:.5;}if(!a.fxDone.has(i)&&k>=tt){a.fxDone.add(i);doSkillFx(a,f);}});
  if(sk.proj&&!a.projDone&&k>=.5){a.projDone=true;for(let i=0;i<(sk.proj.n||1);i++)projectile('p',P.pos.clone().setY(1.3),nearest(16),skillDamage(sk,{mul:sk.proj.mul}),{fx:sk.proj.fx,speed:sk.proj.speed,homing:true});}
  if(sk.strike&&!a.strDone&&k>=.5){a.strDone=true;mobs.filter(m=>!m.dead).sort((x,y)=>x.pos.distanceTo(P.pos)-y.pos.distanceTo(P.pos)).slice(0,sk.strike.n).forEach((m,i)=>setTimeout(()=>{if(m.dead)return;pfx(sk.strike.fx,m.pos.clone().setY(.05),{scale:.7});hurtMob(m,skillDamage(sk,{mul:sk.strike.mul}),Math.random()<.2,null,{elem:'shock',big:true});},i*120));}
  if(k>=1){// 몸이 이동한 만큼 위치 확정 (공중돌기 등)
    if(a.mo.type==='c'&&a.lastR){const off=new V3(a.lastR.x,0,a.lastR.z).applyAxisAngle(new V3(0,1,0),P.face);const np=P.pos.clone().add(off);if(!isSolid(np.x,np.z))P.pos.copy(np);}
    P.act=null;}}

/* ================= 활 9종 · 투사체 ================= */
const projs=[];let ARROWIMG=null;
function projectile(side,from,target,dmg,o={}){const g=new THREE.Group();g.position.copy(from);let dir;
  if(target){dir=target.pos.clone().setY(from.y).sub(from);}else{dir=new V3(Math.sin(P.face),0,Math.cos(P.face));}
  dir.y=0;dir.normalize();if(o.angle)dir.applyAxisAngle(new V3(0,1,0),o.angle);
  if(o.fx){const e=pfx(o.fx,from,{scale:.6,over:true});if(e){e.follow={pos:g.position,dead:false};g.userData.fe=e;}}
  else if(ARROWIMG&&side==='p'&&!o.bullet){const m=voxel(ARROWIMG,1,.05);m.rotation.y=-PI/2;g.add(m);}
  else{const s=kb(o.bullet?'light_01':'star_06',from,{color:side==='p'?0xffe08a:0xff6a4a,size:o.bullet?.3:.6,life:3});g.userData.sp=s;}
  g.rotation.y=Math.atan2(dir.x,dir.z);scene.add(g);projs.push({g,v:dir.multiplyScalar(o.speed||20),side,dmg,t:0,pierce:o.pierce,hitSet:new Set(),homing:o.homing?target:null,explode:o.explode,elem:o.elem,trail:o.trail});}
function fireBow(){const b=S.eq.bow;if(!b){toast('활이 없어요! 몬스터가 떨어뜨리는 활을 주워요',1200);return;}
  if((P.cd.L||0)>0||P.act)return;const st=stats();const tg=nearest(16);faceTo(tg);const from=P.pos.clone().setY(1.3);const d=st.bow*(RAR[b.rar]||RAR.N).mul*.8;const el=b.elem;
  P.act={sk:{name:'활',cat:'bow',hits:[]},mo:{type:'k',m:KEYMOTION.shoot,dur:.42},t:0,dur:.42,hits:[],done:new Set(),fxDone:new Set()};
  P.cd.L=.8;showMove(BOWTYPES[b.shot][0]+' 화살',RAR[b.rar].col);sfx('Fx',.35,1.5);
  const t=b.shot;
  if(t==='single')projectile('p',from,tg,d,{elem:el,trail:1});
  else if(t==='rapid'){for(let i=0;i<4;i++)setTimeout(()=>projectile('p',P.pos.clone().setY(1.3),nearest(16),d*.7,{elem:el,trail:1}),i*90);}
  else if(t==='multi'){[-.5,-.25,0,.25,.5].forEach(a=>projectile('p',from,tg,d*.8,{angle:a,elem:el,trail:1}));}
  else if(t==='pierce')projectile('p',from,tg,d*1.3,{pierce:true,elem:el,trail:2,speed:26});
  else if(t==='homing'){[-.6,0,.6].forEach(a=>projectile('p',from,tg,d*.9,{angle:a,homing:true,elem:el,trail:1,speed:14}));}
  else if(t==='explode')projectile('p',from,tg,d*1.2,{explode:2.4,elem:el,trail:1});
  else if(t==='chain'){let cur=null,src=from,hit=new Set();for(let i=0;i<4;i++){const nx=mobs.filter(m=>!m.dead&&!hit.has(m)).sort((a,b2)=>a.pos.distanceTo(cur?cur.pos:P.pos)-b2.pos.distanceTo(cur?cur.pos:P.pos))[0];if(!nx||nx.pos.distanceTo(cur?cur.pos:P.pos)>8)break;
      const to=nx.pos.clone().setY(1.2);beam('spark_05',src,to,{color:0xbfe6ff,w:.9,life:.3});beam('spark_06',src,to,{color:0x6ab8ff,w:.6,life:.25});pfx('lightning/zap-hit',nx.pos.clone().setY(1),{over:true,scale:.8});hurtMob(nx,d*(1.3-i*.15),Math.random()<.2,null,{elem:'shock',big:i===0});hit.add(nx);cur=nx;src=to;}sfx('Magic1',.4,1.4);}
  else if(t==='laser'){const fw=new V3(Math.sin(P.face),0,Math.cos(P.face));const end=from.clone().addScaledVector(fw,16);beam('trace_01',from,end,{color:0xff5aa0,w:1.1,life:.35});beam('light_01',from,end,{color:0xffffff,w:.4,life:.3});kb('flare_01',from.clone().addScaledVector(fw,.4),{color:0xff9ad0,size:1.6,life:.3});
    mobs.forEach(m=>{if(m.dead)return;const to=m.pos.clone().sub(P.pos);to.y=0;const along=to.dot(fw),side=Math.abs(to.x*fw.z-to.z*fw.x);if(along>0&&along<16&&side<.8+m.radius){hurtMob(m,d*1.6,Math.random()<.25,fw.clone().multiplyScalar(4),{elem:el,big:true});kb('flare_01',m.pos.clone().setY(1.1),{color:0xff9ad0,size:1.2,life:.25});}});sfx('Magic1',.4,1.8);}
  else if(t==='rain'){const c=(tg?tg.pos.clone():P.pos.clone().addScaledVector(new V3(Math.sin(P.face),0,Math.cos(P.face)),6)).setY(0);kp('magic_03',c.clone().setY(.08),{color:0xffd24a,size:5,life:1.2,spin:1.5,grow:1});
    for(let i=0;i<10;i++)setTimeout(()=>{const p=c.clone().add(new V3(rnd(-2,2),0,rnd(-2,2)));kb('trace_02',p.clone().setY(2.5),{color:0xffe08a,size:1.6,life:.2});pfx('impacts/hit-spark',p.clone().setY(.4),{scale:.6});
      mobs.forEach(m=>{if(!m.dead&&m.pos.distanceTo(p)<1.1+m.radius)hurtMob(m,d*.7,Math.random()<.15,null,{elem:el});});},300+i*70);}}
function projTick(dt){for(let i=projs.length-1;i>=0;i--){const a=projs[i];a.t+=dt;
  if(a.homing&&!a.homing.dead){const want=a.homing.pos.clone().setY(a.g.position.y).sub(a.g.position).normalize().multiplyScalar(a.v.length());a.v.lerp(want,Math.min(1,dt*5));a.g.rotation.y=Math.atan2(a.v.x,a.v.z);}
  a.g.position.addScaledVector(a.v,dt);if(a.g.userData.sp)a.g.userData.sp.position.copy(a.g.position);
  if(a.trail&&Math.random()<.7)kb('trace_04',a.g.position.clone(),{color:a.trail===2?0x9fd4ff:0xfff0c0,size:a.trail===2?.9:.5,life:.18,rot:-a.g.rotation.y+PI/2});
  let hit=false;
  if(a.side==='p'){for(const m of mobs){if(m.dead||a.hitSet.has(m))continue;const mp=m.pos.clone().setY(0),ap=a.g.position.clone().setY(0);if(mp.distanceTo(ap)<.6+m.radius&&Math.abs(a.g.position.y-(m.fly||0)-1)<1.6+m.radius){a.hitSet.add(m);const crit=Math.random()<.2;
        hurtMob(m,a.dmg*(crit?1.8:1),crit,a.v.clone().normalize().multiplyScalar(3),{elem:a.elem});
        if(a.explode){pfx('explosions/plasma-explosion',m.pos.clone().setY(.1),{scale:.55});mobs.forEach(o=>{if(o!==m&&!o.dead&&o.pos.distanceTo(m.pos)<a.explode)hurtMob(o,a.dmg*.7,false,o.pos.clone().sub(m.pos).setY(0).normalize().multiplyScalar(6),{elem:a.elem});});shake=.2;}
        if(!a.pierce){hit=true;break;}}}}
  else if(!P.dead&&P.pos.distanceTo(a.g.position.clone().setY(0))<.55){hurtPlayer(a.dmg,a.v.clone().normalize());hit=true;}
  if(hit||a.t>3||isSolid(a.g.position.x,a.g.position.z)){if(a.g.userData.fe)a.g.userData.fe.follow.dead=true;if(a.g.userData.sp){a.g.userData.sp.material.opacity=0;}scene.remove(a.g);projs.splice(i,1);}}}
// 총 (무기 종류 gun)
function fireGun(){const st=stats();const tg=nearest(16);faceTo(tg);const from=P.pos.clone().setY(1.3).addScaledVector(new V3(Math.sin(P.face),0,Math.cos(P.face)),.7);
  kb('muzzle_01',from,{color:0xffd08a,size:1,life:.08});for(let i=0;i<3;i++)setTimeout(()=>projectile('p',P.pos.clone().setY(1.3),nearest(16),st.atk*.6,{bullet:true,speed:34,elem:S.eq.weapon.elem}),i*80);sfx('Hit2',.3,2);}

/* ================= 이동 ================= */
function moveCircle(pos,dx,dz,r){const nx=pos.x+dx;if(!isSolid(nx+Math.sign(dx)*r,pos.z)&&!isSolid(nx+Math.sign(dx)*r,pos.z+r*.7)&&!isSolid(nx+Math.sign(dx)*r,pos.z-r*.7))pos.x=nx;
  const nz=pos.z+dz;if(!isSolid(pos.x,nz+Math.sign(dz)*r)&&!isSolid(pos.x+r*.7,nz+Math.sign(dz)*r)&&!isSolid(pos.x-r*.7,nz+Math.sign(dz)*r))pos.z=nz;}
function angLerp(a,b,t){let d=b-a;while(d>PI)d-=PI*2;while(d<-PI)d+=PI*2;return a+d*t;}
function hurtPlayer(v,dir){if(P.inv>0||P.dead||S.god)return;const s=stats();let d=v*100/(100+s.def*9);if(S.eq.shield&&P.blocking)d*=.3;P.hp-=d;P.inv=.35;
  dmgText(P.pos,'-'+Math.round(d),'hurt');pfx('impacts/hit-spark',P.pos.clone().setY(1.1),{over:true,scale:.9,opt:{palette:['#200','#600','#a00','#f22','#f66','#fcc']}});sfx('Hit',.4,.8);shake=.15;
  if(dir)moveCircle(P.pos,dir.x*.35,dir.z*.35,.35);updHP();if(P.hp<=0){P.hp=0;updHP();die();}}

/* ================= 몬스터 행동 ================= */
function mobTick(m,dt){m.t+=dt;if(m.flashT>0){m.flashT-=dt;if(m.flashT<=0)flash(m,false);}
  if(m.dead){m.dead+=dt;if(m.d.model==='duel')duelMobAnim(m,dt);if(m.d.model==='kk'){kkMobAnim(m,dt);m.vdie=null;if(m.dead>2.2)m.obj.position.y-=dt*.8;return;}if(m.vdie){m.pos.addScaledVector(m.vdie,dt);m.vy-=18*dt;m.lift=Math.max(-.2,(m.lift||0)+m.vy*dt);m.obj.position.y=m.lift;m.obj.rotation.x+=m.spin*dt*.5;m.obj.rotation.z+=m.spin*dt*.3;}if(m.dead>1.1)m.obj.scale.multiplyScalar(1-dt*3);return;}
  statusTick(m,dt);m.squash=Math.max(0,m.squash-dt*6);
  const d=m.d;const to=P.pos.clone().sub(m.pos);to.y=0;const dist=to.length();const dir=to.clone().normalize();
  if(m.dummy){m.obj.rotation.z=Math.sin(m.t*20)*m.squash*.25;m.obj.rotation.x=m.kb.length()*.05;m.kb.set(0,0,0);return;}
  m.face=angLerp(m.face,Math.atan2(dir.x,dir.z),Math.min(1,dt*(m.boss?3:8)));
  let want=new V3();const ai=d.ai||'melee';let sp=m.spd;
  if(!P.dead&&MODE!=='idle'){
    if(ai==='ranged'){if(dist>9)want.copy(dir);else if(dist<5.5)want.copy(dir).negate();}
    else if(ai==='dragon'){m.ang=(m.ang||0)+dt*.5;const cx=Math.cos(m.ang)*8,cz=Math.sin(m.ang)*8;want.set(P.pos.x+cx-m.pos.x,0,P.pos.z+cz-m.pos.z);if(want.length()>1)want.normalize();sp=m.spd;m.face=Math.atan2(want.x,want.z);}
    else if(ai==='wither'){if(dist>7)want.copy(dir);else if(dist<4)want.copy(dir).negate();}
    else if(dist>1.1+m.radius)want.copy(dir);}
  mobs.forEach(o=>{if(o===m||o.dead)return;const s=m.pos.clone().sub(o.pos);s.y=0;const l=s.length();const rr=m.radius+o.radius;if(l<rr&&l>0)want.addScaledVector(s.normalize(),(rr-l)*2);});
  if(ai==='hop'){m.hop+=dt*2.2;sp*=Math.max(0,Math.sin(m.hop*PI))*1.6;}
  if(m.charging>0){m.charging-=dt;sp=m.spd*3.2;want.copy(m.chDir);}
  if(m.wind>0)sp*=.15;if(m.st&&m.st.frost)sp*=.45;
  moveCircle(m.pos,(want.x*sp+m.kb.x)*dt,(want.z*sp+m.kb.z)*dt,.3*Math.min(2,m.radius*2));m.kb.multiplyScalar(Math.max(0,1-dt*6));
  // 공격
  m.cd-=dt;
  if(!P.dead&&MODE!=='idle'){
    if(ai==='ranged'&&m.cd<=0&&dist<13){m.cd=rnd(2,2.8);m.wind=.5;m.attack='shot';}
    else if(ai==='charge'&&m.cd<=0&&dist<8&&dist>2){m.cd=rnd(2.5,3.5);m.wind=.6;m.attack='charge';kp('trace_01',m.pos.clone().addScaledVector(dir,3).setY(.06),{color:0xff3d5a,sx:6,sz:.8,rot:-Math.atan2(dir.z,dir.x),life:.6,grow:1});}
    else if(ai==='blink'&&m.cd<=0&&dist>3){m.cd=rnd(2.5,4);const b=P.pos.clone().addScaledVector(new V3(-Math.sin(P.face),0,-Math.cos(P.face)),1.6);if(!isSolid(b.x,b.z)){pfx('spawn/poof',m.pos.clone(),{scale:.7,opt:{palette:['#1b0f3a','#3a2470','#6a45b8','#9a7bff','#c9b8ff','#ffffff']}});m.pos.copy(b);m.wind=.35;m.attack='melee';}}
    else if(ai==='golem'&&m.cd<=0&&dist<3.2){m.cd=rnd(2.2,3);m.wind=.8;m.attack='slam';}
    else if(ai==='dragon'&&m.cd<=0){m.cd=rnd(1.6,2.4);m.wind=.4;m.attack='breath';}
    else if(ai==='wither'&&m.cd<=0){m.cd=rnd(1.2,1.8);m.wind=.3;m.attack='skull';}
    else if((ai==='melee'||ai==='hop'||ai==='golem'||ai==='blink')&&m.cd<=0&&dist<1.5+m.radius){m.cd=rnd(1.1,1.6);m.wind=.45;m.attack='melee';}}
  if(m.wind>0){m.wind-=dt;if(m.wind<=0){const a=m.attack;
    if(a==='shot')projectile('m',m.pos.clone().setY(1.3),{pos:P.pos},m.atk,{speed:11});
    else if(a==='charge'){m.charging=.5;m.chDir=dir.clone();}
    else if(a==='slam'){pfx('impacts/ground-slam',m.pos.clone().addScaledVector(dir,1.5).setY(.05),{scale:1.1});shake=.35;if(dist<3.8){hurtPlayer(m.atk,dir);P.pos.y=0;}sfx('Explosion',.5,.7);}
    else if(a==='breath'){for(let i=0;i<3;i++)setTimeout(()=>{if(!m.dead)projectile('m',m.pos.clone().setY(m.fly),{pos:P.pos.clone().add(new V3(rnd(-1.5,1.5),0,rnd(-1.5,1.5)))},m.atk*.7,{speed:12,fx:'fire/fireball'});},i*150);}
    else if(a==='skull'){projectile('m',m.pos.clone().setY(m.fly+1),{pos:P.pos},m.atk*.8,{speed:10,fx:'shadow/void-orb'});}
    else if(dist<1.9+m.radius)hurtPlayer(m.atk,dir);}}
  if(m.charging>0&&dist<1+m.radius){hurtPlayer(m.atk*1.2,dir);m.charging=0;}
  // 애니메이션
  m.obj.rotation.y=m.face;const s=Math.sin(m.t*m.spd*3)*.6;const sq=1+m.squash*.25;
  if(m.rig){const archer=ai==='ranged';const arms=d.arms==='fwd'?-1.45:archer?-1.4:-.2;const w=m.wind>0?-.6:0;
    pose(m.rig,{thL:[s,0,0],thR:[-s,0,0],shL:[Math.max(0,s)*.5,0,0],shR:[Math.max(0,-s)*.5,0,0],uaL:[arms+w,0,archer?.3:0],uaR:[arms+w,0,archer?-.3:0],hips:[m.squash>0?-.3*m.squash:0,0,0]});
    m.rig.root.scale.y=(d.scale||1)*(m.boss&&d.model==='hum'?1:1)*(1/sq);}
  else if(d.model==='spider')m.obj.userData.legs.forEach((l,i)=>{l.rotation.x=Math.sin(m.t*12+i)*.3;});
  else if(d.model==='slime'){const k=Math.sin(m.hop*PI);m.obj.position.y=Math.max(0,k)*.6;}
  else if(d.model==='golem'){const u=m.obj.userData;u.legL.rotation.x=s*.5;u.legR.rotation.x=-s*.5;const up=m.wind>0&&m.attack==='slam'?-2.8:0;u.armL.rotation.x=up||-s*.4;u.armR.rotation.x=up||s*.4;}
  else if(d.model==='dragon'){const u=m.obj.userData;const f=Math.sin(m.t*3);u.wings.forEach((w,i)=>{w.rotation.z=(i?1:-1)*f*.6;w.userData.tip.rotation.z=(i?1:-1)*f*.4;});u.tail.forEach((t,i)=>t.rotation.y=Math.sin(m.t*2+i*.5)*.15);u.neck.forEach((n,i)=>n.rotation.x=Math.sin(m.t*1.5+i)*.06);u.jaw.rotation.x=m.wind>0?.5:.1;m.obj.position.y=m.fly+Math.sin(m.t*1.5)*.4;}
  else if(d.model==='duel')duelMobAnim(m,dt);
  else if(d.model==='kk')kkMobAnim(m,dt);
  else if(d.model==='wither'){m.obj.position.y=m.fly+Math.sin(m.t*2)*.3;m.obj.userData.heads.forEach((h,i)=>h.rotation.y=Math.sin(m.t+i)*.3);}
  if(d.model!=='dragon'&&d.model!=='wither'&&d.model!=='slime')m.obj.position.y=0;}

/* ================= 드랍 · 장착 창 ================= */
const drops=[],coinsL=[];let COINTEX=null;
async function dropThing(th,p){let mesh;const g=new THREE.Group();
  if(th.kind==='skill'){const sp=kb('magic_01',new V3(),{color:new THREE.Color(RAR[th.rar].col).getHex(),size:1.4,life:1e9,grow:1});scene.remove(sp);kfx.pop();g.add(sp);sp.position.y=.9;const b=kb('star_06',new V3(),{color:0xffffff,size:.7,life:1e9,grow:1});scene.remove(b);kfx.pop();g.add(b);b.position.y=.9;mesh=sp;}
  else if(th.kind==='item'&&(th.it.icon||th.it.img)){const im=await itemImg(th.it).catch(()=>null);if(im){mesh=voxel(im,1,Math.min(.05,.9/Math.max(im.width,im.height)));mesh.position.y=.8;g.add(mesh);}}
  if(!mesh){const sp=kb('star_01',new V3(),{color:0xffd24a,size:1,life:1e9,grow:1});scene.remove(sp);kfx.pop();sp.position.y=.9;g.add(sp);mesh=sp;}
  const rar=th.rar||th.it.rar;const beamM=new THREE.Mesh(new THREE.CylinderGeometry(.12,.35,3.4,8,1,true),new THREE.MeshBasicMaterial({color:RAR[rar].col,transparent:true,opacity:.18+RAR[rar].i*.06,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));beamM.position.y=1.7;g.add(beamM);
  g.position.set(p.x,0,p.z);scene.add(g);drops.push({th,g,mesh,t:0});}
function dropCoins(p,n){if(!COINTEX)return;for(let i=0;i<n;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:COINTEX}));sp.scale.set(.32,.32,1);sp.position.set(p.x+rnd(-.6,.6),.3,p.z+rnd(-.6,.6));scene.add(sp);coinsL.push({sp,t:0,v:new V3(rnd(-2,2),rnd(3,5),rnd(-2,2))});}}
function randRar(boost=0){const r=Math.random()+boost+S.stage*.012;return r>1.55?'O':r>1.38?'M':r>1.22?'L':r>1.06?'U':r>.86?'E':r>.6?'R':'N';}
function rollLoot(m){const st=DB.stage;const boss=m.boss;
  if(Math.random()<(boss?1:st.dropEquip)){const slot=pick(['helmet','chestplate','leggings','boots','weapon','bow','weapon','shieldx'].filter(s=>s!=='shieldx'));const tier=clamp(Math.floor(S.stage/2+rnd(-1,1.5)+(boss?1:0)),0,9);dropThing({kind:'item',it:makeItem(slot,tier,randRar(boss?.35:0))},m.pos);}
  if(Math.random()<(boss?.8:st.dropSkill)){const r=randRar(boss?.3:0);const pool=Object.values(SK).filter(s=>s.rar===r&&s.cat!=='weapon'&&!s.nodrop&&s.id[0]!=='_');const s=pick(pool.length?pool:Object.values(SK));dropThing({kind:'skill',id:s.id,rar:s.rar},m.pos.clone().add(new V3(.8,0,.3)));}
  if(Math.random()<(boss?.5:(st.dropPoly??.04))){const pos=m.pos.clone().add(new V3(0,0,-.9));duReady().then(async U=>{DU._cache=U;const pool=await duPool(boss&&Math.random()<.3?'boss':'unit');const uid=pick(pool);dropThing({kind:'item',it:makePoly(uid,randRar(boss?.35:0))},pos);});}
  if(Math.random()<(boss?.4:st.dropDskin)){const r=randRar(boss?.4:.1);dropThing({kind:'item',it:makeItem('dskin',0,DSKINS.some(d=>d.rar===r)?r:'R')},m.pos.clone().add(new V3(-.8,0,.3)));}}
function pickupTick(dt){for(let i=drops.length-1;i>=0;i--){const d=drops[i];d.t+=dt;if(d.mesh){d.mesh.rotation.y+=dt*2;d.mesh.position.y=.85+Math.sin(d.t*3)*.12;}
  if(!P.dead&&d.t>.5&&d.g.position.distanceTo(P.pos.clone().setY(0))<1.1){scene.remove(d.g);drops.splice(i,1);offer(d.th);}}
  for(let i=coinsL.length-1;i>=0;i--){const c=coinsL[i];c.t+=dt;if(c.t<.5){c.v.y-=18*dt;c.sp.position.addScaledVector(c.v,dt);if(c.sp.position.y<.25){c.sp.position.y=.25;c.v.y*=-.4;}}
    else{const to=P.pos.clone().setY(1).sub(c.sp.position);c.sp.position.addScaledVector(to,Math.min(1,dt*9));if(to.length()<.4){scene.remove(c.sp);coinsL.splice(i,1);sfx('Coin',.12,1.3);}}}
  for(let i=gibs.length-1;i>=0;i--){const g=gibs[i];g.t+=dt;g.v.y-=18*dt;g.m.position.addScaledVector(g.v,dt);if(g.m.position.y<.06){g.m.position.y=.06;g.v.multiplyScalar(.4);g.v.y*=-.3;}g.m.rotation.x+=dt*8;if(g.t>1.6){scene.remove(g.m);gibs.splice(i,1);}}}

/* ================= 스테이지 (무한 랜덤) ================= */
let portalFx=null,MODE='idle',paused=true,wave=0,waveQ=[],toKill=0,stageClear=false,portal=null;
function updWave(){if(MODE==='world'){$('#waveT').textContent='';$('#killT').textContent='';return;}$('#waveT').textContent=MODE==='train'?'연습장':'스테이지 '+S.stage+' · '+(THEMES[MAP.theme]||{}).name;$('#killT').textContent=MODE==='train'?'허수아비와 몬스터를 때려보세요':'웨이브 '+wave+'/'+DB.stage.waves+' · 남은 '+Math.max(0,toKill-killed);}
function clearField(){[...mobs].forEach(removeMob);projs.forEach(a=>scene.remove(a.g));projs.length=0;drops.forEach(d=>scene.remove(d.g));drops.length=0;if(portal){scene.remove(portal);portal=null;}if(portalFx){portalFx.fx.stop();portalFx=null;}$('#bossbar').hidden=true;}
async function startStage(n){S.stage=n;S.best=Math.max(S.best,n);saveAll();MODE='play';clearField();const st=DB.stage;const th=pick(st.themes.length?st.themes:Object.keys(THEMES));
  await buildMap(th);P.pos.set(0,0,0);P.face=PI;wave=0;stageClear=false;nextWave();updWave();toast('스테이지 '+n+' · '+THEMES[th].name,1800);}
function nextWave(){wave++;killed=0;const st=DB.stage;const th=THEMES[MAP.theme];const n=st.perWave+Math.floor((S.stage-1)*st.grow/2);waveQ=[];for(let i=0;i<n;i++)waveQ.push(pick(th.mobs));
  if(wave===st.waves&&S.stage%st.bossEvery===0)waveQ.push('BOSS:'+pick(th.boss));toKill=waveQ.length;updWave();if(wave>1)toast('웨이브 '+wave,1200);}
let spawnT=0;
function stageTick(dt){if(MODE!=='play'||P.dead)return;spawnT-=dt;const alive=mobs.filter(m=>!m.dead).length;
  if(waveQ.length&&spawnT<=0&&alive<12){spawnT=.6;const t=waveQ.shift();const H=MAP.N/2;let x,z,k=0;do{const a=rnd(0,PI*2),r=rnd(8,12);x=clamp(P.pos.x+Math.cos(a)*r,-H+2,H-2);z=clamp(P.pos.z+Math.sin(a)*r,-H+2,H-2);k++;}while((isSolid(x,z)||Math.hypot(x-P.pos.x,z-P.pos.z)<6)&&k<20);
    if(t.startsWith('BOSS:')){spawnMob(t.slice(5),x,z).then(m=>{if(m)toast('⚠ 보스 '+m.d.name+' 등장!',1800);});sfx('Explosion',.5,.6);}else spawnMob(t,x,z);pfx('spawn/poof',new V3(x,.05,z),{scale:.8,opt:{palette:['#1b0f3a','#3a2470','#6a45b8','#9a7bff','#c9b8ff','#ffffff']}});}
  if(!waveQ.length&&killed>=toKill&&!stageClear){if(wave<DB.stage.waves)nextWave();else{stageClear=true;P.hp=Math.min(P.max,P.hp+P.max*.3);updHP();toast('스테이지 클리어! 포털로 들어가면 다음 스테이지',2200);sfx('Success1',.5);
      pfx('holy/heal-aoe',P.pos.clone(),{scale:1});portal=new THREE.Group();portal.position.set(0,0,-3);scene.add(portal);portalFx=pfx('arcane/portal',new V3(0,.05,-3),{scale:1.4,life:999});}}
  if(stageClear&&portal&&P.pos.distanceTo(portal.position)<1.4){stageClear=false;startStage(S.stage+1);}}
async function startTrain(){MODE='train';clearField();await buildMap(S.gfx==='kk'?'kk_fort':'forest',{empty:true,size:26});P.pos.set(0,0,2);P.face=PI;
  // 허수아비: 앞·왼쪽·오른쪽·뒤
  const spots=[[0,-1.8,'앞'],[-2.6,2,'왼쪽'],[2.6,2,'오른쪽'],[0,5.2,'뒤']];for(const [x,z,n] of spots){const m=await spawnMob('dummy',x,z);if(m){m.face=Math.atan2(P.pos.x-x,P.pos.z-z);m.obj.rotation.y=m.face;m.label=n;}}
  updWave();toast('연습장: 허수아비를 때려보세요. 메이커에서 몬스터도 불러올 수 있어요',2400);}
function die(){P.dead=true;sfx('GameOver',.5);S.best=Math.max(S.best,S.stage);saveAll();setTimeout(()=>{$('#overT').innerHTML='스테이지 <b>'+S.stage+'</b>에서 쓰러졌어요';$('#mOver').hidden=false;},900);}
MOBS.push({id:'dummy',name:'허수아비',model:'dummy',hp:1e9,atk:0,spd:0,ai:'none'});
