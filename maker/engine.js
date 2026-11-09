/* 정도 게임 메이커 — 엔진 (렌더러 · 캐릭터 리그 · 스킨 · 모션 · 이펙트) */
'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)],clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const V3=THREE.Vector3,QU=THREE.Quaternion;
/* ---------- 렌더러 ---------- */
const cv=$('#game');
const R=new THREE.WebGLRenderer({canvas:cv,antialias:true});R.outputEncoding=THREE.sRGBEncoding;
R.setPixelRatio(Math.min(2,window.devicePixelRatio||1));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x0d0f14);scene.fog=new THREE.Fog(0x0d0f14,20,40);
const cam=new THREE.PerspectiveCamera(42,1,.1,120);
const hemi=new THREE.HemisphereLight(0xcfd9ff,0x2b2218,.65);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff1d6,.9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-18,right:18,top:18,bottom:-18,near:1,far:70});sun.shadow.bias=-.0005;scene.add(sun,sun.target);
function resize(){const w=innerWidth,h=innerHeight;R.setSize(w,h,false);cam.aspect=w/h;cam.fov=w<h?62:42;cam.updateProjectionMatrix();}
addEventListener('resize',resize);resize();
/* ---------- 그림 불러오기 ---------- */
let PACK={};const packReady=fetch('pack.json').then(r=>r.json()).then(j=>{PACK=j;}).catch(()=>{});
const IMG={};
function load(src){return IMG[src]||(IMG[src]=packReady.then(()=>new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(src);i.src=PACK[src]||src;})));}
const srcOf=s=>PACK[s]||s;
function cnv(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function crop(img,x,y,w,h,flip){const c=cnv(Math.max(1,w),Math.max(1,h)),g=c.getContext('2d');g.imageSmoothingEnabled=false;if(flip){g.translate(w,0);g.scale(-1,1);}g.drawImage(img,x,y,w,h,0,0,w,h);return c;}
function empty(c){const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;for(let i=3;i<d.length;i+=4)if(d[i]>10)return false;return true;}
function tex(c){const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.encoding=THREE.sRGBEncoding;t.generateMipmaps=false;return t;}
function avg(c){const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let r=0,g=0,b=0,n=0;for(let i=0;i<d.length;i+=4){if(d[i+3]<100)continue;r+=d[i];g+=d[i+1];b+=d[i+2];n++;}return n?`rgb(${r/n|0},${g/n|0},${b/n|0})`:'#777';}
function solid(col){const c=cnv(2,2),g=c.getContext('2d');g.fillStyle=col;g.fillRect(0,0,2,2);return c;}
// 마크식 전개도 → 6면
function faces(img,u,v,w,h,d,flip){const s=img.width/64;const C=(x,y,ww,hh)=>crop(img,Math.round(x*s),Math.round(y*s),Math.max(1,Math.round(ww*s)),Math.max(1,Math.round(hh*s)),flip);
  const f={top:C(u+d,v,w,d),bottom:C(u+d+w,v,w,d),right:C(u,v+d,d,h),front:C(u+d,v+d,w,h),left:C(u+d+w,v+d,d,h),back:C(u+2*d+w,v+d,w,h)};
  if(flip){const t=f.right;f.right=f.left;f.left=t;}return f;}
function facesAbs(img,u,v,w,h,d){const C=(x,y,ww,hh)=>crop(img,x,y,Math.max(1,ww),Math.max(1,hh));return{top:C(u+d,v,w,d),bottom:C(u+d+w,v,w,d),right:C(u,v+d,d,h),front:C(u+d,v+d,w,h),left:C(u+d+w,v+d,d,h),back:C(u+2*d+w,v+d,w,h)};}
const order=f=>[f.left,f.right,f.top,f.bottom,f.front,f.back];
function rows(c,y0,y1){const o=cnv(c.width,Math.max(1,y1-y0));const g=o.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(c,0,y0,c.width,y1-y0,0,0,c.width,y1-y0);return o;}
function halves(f){const H=f.front.height,m=Math.round(H/2);const mk=top=>{const r={};['right','front','left','back'].forEach(k=>r[k]=rows(f[k],top?0:m,top?m:H));
  const cc=cnv(8,4),g=cc.getContext('2d');['right','front','left','back'].forEach((k,i)=>g.drawImage(r[k],0,top?r[k].height-1:0,r[k].width,1,i*2,0,2,4));const cap=solid(avg(cc));
  r.top=top?f.top:cap;r.bottom=top?cap:f.bottom;return r;};return[mk(true),mk(false)];}
const INV=new THREE.MeshBasicMaterial({visible:false});
function mats(list,overlay,tint){return list.map(c=>{if(!c||(overlay&&empty(c)))return INV;const m=new THREE.MeshLambertMaterial({map:tex(c),transparent:!!overlay,alphaTest:overlay?.1:0,side:overlay?THREE.DoubleSide:THREE.FrontSide});if(tint)m.color.set(tint);return m;});}

/* ---------- 상자 캐릭터 리그 ---------- */
const PX=1/16*1.1;
function box(w,h,d,y,ex=0){const g=new THREE.BoxGeometry(w*PX+ex*2,h*PX+ex*2,d*PX+ex*2);g.translate(0,y*PX,0);return new THREE.Mesh(g,INV);}
const PARTS=['head','torso','uaL','laL','uaR','laR','thL','shL','thR','shR'];
function makeRig(o={}){
  const aw=o.aw||4,ad=o.ad||4,lw=o.lw||4,ld=o.ld||4,A=o.arm||6,L=o.leg||6,T=o.torso||12,hs=o.head||8;
  const r={root:new THREE.Group(),dims:{aw,ad,lw,ld,A,L,T,hs},legH:2*L*PX};
  r.hips=new THREE.Group();r.hips.rotation.order='YXZ';r.hips.position.y=2*L*PX;r.root.add(r.hips);
  r.torso=new THREE.Group();r.hips.add(r.torso);
  r.head=new THREE.Group();r.head.position.y=T*PX;r.torso.add(r.head);
  const sy=(T-2)*PX;
  r.uaR=new THREE.Group();r.uaR.position.set(-(4+aw/2)*PX,sy,0);r.torso.add(r.uaR);
  r.uaL=new THREE.Group();r.uaL.position.set((4+aw/2)*PX,sy,0);r.torso.add(r.uaL);
  r.laR=new THREE.Group();r.laR.position.y=-(A-2)*PX;r.uaR.add(r.laR);
  r.laL=new THREE.Group();r.laL.position.y=-(A-2)*PX;r.uaL.add(r.laL);
  r.thR=new THREE.Group();r.thR.position.x=-2*PX;r.hips.add(r.thR);
  r.thL=new THREE.Group();r.thL.position.x=2*PX;r.hips.add(r.thL);
  r.shR=new THREE.Group();r.shR.position.y=-L*PX;r.thR.add(r.shR);
  r.shL=new THREE.Group();r.shL.position.y=-L*PX;r.thL.add(r.shL);
  const spec={head:[hs,hs,hs,hs/2],torso:[8,T,4,T/2],uaL:[aw,A,ad,-A/2+2],uaR:[aw,A,ad,-A/2+2],laL:[aw,A,ad,-A/2],laR:[aw,A,ad,-A/2],thL:[lw,L,ld,-L/2],thR:[lw,L,ld,-L/2],shL:[lw,L,ld,-L/2],shR:[lw,L,ld,-L/2]};
  r.spec=spec;r.mesh={};r.layers={};
  PARTS.forEach(p=>{const s=spec[p];const m=box(s[0],s[1],s[2],s[3]);m.castShadow=true;r[p].add(m);r.mesh[p]=m;});
  r.hand=new THREE.Group();r.hand.position.set(0,-A*PX,0);r.laR.add(r.hand);
  r.handL=new THREE.Group();r.handL.position.set(0,-A*PX,0);r.laL.add(r.handL);
  r.tips=[['footL',r.shL,-L],['footR',r.shR,-L],['hR',r.laR,-A],['hL',r.laL,-A],['top',r.head,hs]].map(([n,p,y])=>{const o=new THREE.Object3D();o.position.y=y*PX;p.add(o);return o;});
  return r;}
function layer(r,name,ex){if(r.layers[name])return r.layers[name];const L={};PARTS.forEach(p=>{const s=r.spec[p];const m=box(s[0],s[1],s[2],s[3],ex*PX);m.visible=false;r[p].add(m);L[p]=m;});return r.layers[name]=L;}
// 마크 스킨 입히기 (64×64 / 64×32). 엔더맨처럼 팔다리가 긴 몸도 됨
function skinRig(r,img,o={}){const legacy=img.height*2===img.width;const {aw,ad,lw,ld,A,L,T,hs}=r.dims;
  const set=(target,p,list,ov)=>{const m=target[p];if(!m)return;m.material=mats(list,ov,o.tint);if(ov)m.visible=list.some(c=>c&&!empty(c));};
  const TT=r.mesh;const al=A*2,ll=L*2;
  set(TT,'head',order(faces(img,0,0,8,8,8)));set(TT,'torso',order(faces(img,o.bodyU??16,o.bodyV??16,8,o.bodyH||12,4)));
  const limb=(tgt,up,lo,f,ov)=>{const[a,b]=halves(f);set(tgt,up,order(a),ov);set(tgt,lo,order(b),ov);};
  const armUV=o.armUV||[40,16],legUV=o.legUV||[0,16];
  limb(TT,'uaR','laR',faces(img,armUV[0],armUV[1],aw,o.armLen||12,ad));limb(TT,'thR','shR',faces(img,legUV[0],legUV[1],lw,o.legLen||12,ld));
  if(legacy||o.mirrorLimbs){limb(TT,'uaL','laL',faces(img,armUV[0],armUV[1],aw,o.armLen||12,ad,true));limb(TT,'thL','shL',faces(img,legUV[0],legUV[1],lw,o.legLen||12,ld,true));}
  else{limb(TT,'uaL','laL',faces(img,32,48,aw,12,ad));limb(TT,'thL','shL',faces(img,16,48,lw,12,ld));}
  if(o.overlay!==false){const LL=layer(r,'skin2',.5);PARTS.forEach(p=>LL[p].visible=false);
    set(LL,'head',order(faces(img,32,0,8,8,8)),true);
    if(!legacy&&!o.mirrorLimbs){set(LL,'torso',order(faces(img,16,32,8,12,4)),true);limb(LL,'uaR','laR',faces(img,40,32,aw,12,ad),true);limb(LL,'uaL','laL',faces(img,48,48,aw,12,ad),true);limb(LL,'thR','shR',faces(img,0,32,lw,12,ld),true);limb(LL,'thL','shL',faces(img,0,48,lw,12,ld),true);}}}
const ARMOR_EX={helmet:1.1,chestplate:.8,leggings:.55,boots:.95};
function armorRig(r,slot,img,tint){const L=layer(r,'ar_'+slot,ARMOR_EX[slot]);PARTS.forEach(p=>{L[p].visible=false;});if(!img)return;
  const set=(p,list)=>{L[p].material=mats(list,true,tint);L[p].visible=list.some(c=>c&&!empty(c));};
  const parts=slot==='helmet'?['head']:slot==='chestplate'?['torso','arms']:slot==='leggings'?['torso','legs']:['legs'];
  if(parts.includes('head'))set('head',order(faces(img,32,0,8,8,8)));
  if(parts.includes('torso'))set('torso',order(faces(img,16,16,8,12,4)));
  const limb=(up,lo,f)=>{const[a,b]=halves(f);set(up,order(a));set(lo,order(b));};
  if(parts.includes('arms')){limb('uaR','laR',faces(img,40,16,4,12,4));limb('uaL','laL',faces(img,40,16,4,12,4,true));}
  if(parts.includes('legs')){limb('thR','shR',faces(img,0,16,4,12,4));limb('thL','shL',faces(img,0,16,4,12,4,true));}}

/* ---------- 자세 (키프레임) ---------- */
const JOINTS=['hips','torso','head','uaL','uaR','laL','laR','thL','thR','shL','shR'];
const Z=[0,0,0];
function pose(r,P,lift=0){JOINTS.forEach(j=>{const v=P[j]||Z;r[j].rotation.set(v[0]||0,v[1]||0,v[2]||0);});r.hips.position.set(0,r.legH+lift-(P.crouch||0),0);}
function mix(A,B,t){const o={};const ks=new Set([...Object.keys(A),...Object.keys(B)]);ks.forEach(k=>{const a=A[k],b=B[k];
  if(typeof a==='number'||typeof b==='number'){o[k]=(a||0)+((b||0)-(a||0))*t;}else{const x=a||Z,y=b||Z;o[k]=[x[0]+(y[0]-x[0])*t,(x[1]||0)+((y[1]||0)-(x[1]||0))*t,(x[2]||0)+((y[2]||0)-(x[2]||0))*t];}});return o;}
function ease(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;}
function track(keys,t){if(t<=keys[0][0])return keys[0][1];for(let i=1;i<keys.length;i++){if(t<=keys[i][0]){const a=keys[i-1],b=keys[i];return mix(a[1],b[1],ease((t-a[0])/(b[0]-a[0])));}}return keys[keys.length-1][1];}
const G={hips:[0,.35,0],torso:[0,-.25,0],head:[0,-.1,0],uaL:[-.55,0,.25],laL:[-1.9,0,0],uaR:[-.35,0,-.25],laR:[-2.1,0,0],thL:[-.3,0,.05],shL:[.35,0,0],thR:[.2,0,-.05],shR:[.25,0,0],crouch:PX};
const GW=Object.assign({},G,{uaR:[-.6,0,-.15],laR:[-1.2,0,0]});// 무기 들고 있을 때
function walkPose(ph,armed){const s=Math.sin(ph)*.75;const g=armed?GW:G;return Object.assign({},g,{hips:[0,.2,0],thL:[-s-.1,0,.04],thR:[s-.1,0,-.04],shL:[.25+Math.max(0,s)*.9,0,0],shR:[.25+Math.max(0,-s)*.9,0,0],uaL:[g.uaL[0]+s*.2,0,.25],uaR:[g.uaR[0]-s*.2,0,g.uaR[2]]});}
const PI=Math.PI;
const SIDE_C={...G,hips:[0,1.45,0],torso:[0,0,.35],thR:[-.5,0,-.9],shR:[2.0,0,0],thL:[-.1,0,.1],shL:[.2,0,0]};
const SIDE_K={...G,hips:[0,1.57,0],torso:[0,0,.55],thR:[0,0,-1.55],shR:[0,0,0],thL:[0,0,.1],shL:[.1,0,0],uaR:[-.3,0,-.5],uaL:[-.5,0,.4]};
const SPREAD={uaL:[-.2,0,1.35],uaR:[-.2,0,-1.35],laL:[0,0,0],laR:[0,0,0]};
/* 태권도·트릭킹·무기 동작 (키프레임) */
const KEYMOTION={
 ap:{name:'앞차기',dur:.42,keys:[[0,G],[.1,{...G,hips:[0,0,0],torso:[.12,0,0],thR:[-1.75,0,0],shR:[2.0,0,0],thL:[-.1,0,0],shL:[.15,0,0]}],[.2,{...G,hips:[0,0,0],torso:[-.15,0,0],thR:[-1.6,0,0],shR:[.05,0,0],thL:[-.05,0,0],shL:[.1,0,0]}],[.3,{...G,hips:[0,0,0],thR:[-1.7,0,0],shR:[1.9,0,0]}],[.42,G]]},
 dol:{name:'돌려차기',dur:.48,keys:[[0,G],[.12,{...G,hips:[0,1.0,0],torso:[0,-.7,.35],thR:[-.35,0,-1.35],shR:[1.9,0,0],thL:[0,0,.05],shL:[.1,0,0]}],[.24,{...G,hips:[0,1.55,0],torso:[0,-1.1,.45],thR:[-.15,0,-1.5],shR:[.05,0,0],thL:[0,0,.08],shL:[.05,0,0]}],[.36,{...G,hips:[0,1.2,0],torso:[0,-.7,.3],thR:[-.3,0,-1.3],shR:[1.8,0,0]}],[.48,G]]},
 yeopS:{name:'옆차기',dur:.48,keys:[[0,G],[.12,SIDE_C],[.24,SIDE_K],[.36,SIDE_C],[.48,G]]},
 dwi:{name:'뒤차기',dur:.52,keys:[[0,G],[.14,{...G,hips:[0,PI*.95,0],torso:[.3,0,0],thR:[-.9,0,0],shR:[2.1,0,0]}],[.26,{...G,hips:[0,PI,0],torso:[.55,0,0],thR:[1.45,0,0],shR:[.05,0,0],head:[-.4,0,0]}],[.4,{...G,hips:[0,PI*1.4,0],thR:[-.6,0,0],shR:[1.8,0,0]}],[.52,{...G,hips:[0,2*PI+.35,0]}]]},
 naeryeo:{name:'내려차기',dur:.52,keys:[[0,G],[.1,{...G,hips:[0,0,0],thR:[-1.2,0,-.3],shR:[.6,0,0]}],[.22,{...G,hips:[0,0,0],torso:[-.25,0,0],thR:[-2.7,0,0],shR:[0,0,0],thL:[0,0,0],shL:[.1,0,0]}],[.34,{...G,hips:[0,0,0],torso:[.3,0,0],thR:[-.7,0,0],shR:[.1,0,0]}],[.52,G]]},
 huryeo:{name:'뒤후려차기',dur:.62,keys:[[0,G],[.12,{...G,hips:[0,-1.2,0],torso:[0,.3,-.2],thR:[0,0,-.4],shR:[.6,0,0]}],[.33,{...G,hips:[0,-3.4,0],torso:[0,.2,-.45],thR:[-.1,0,-1.55],shR:[0,0,0],thL:[0,0,.1]}],[.48,{...G,hips:[0,-5.6,0],torso:[0,.1,-.2],thR:[-.2,0,-1.1],shR:[.9,0,0]}],[.62,{...G,hips:[0,-2*PI+.35,0]}]]},
 narae:{name:'나래차기',dur:.7,jump:.9,keys:[[0,G],[.12,{...G,hips:[0,1.3,0],thR:[-.3,0,-1.4],shR:[1.8,0,0],thL:[-1.2,0,0],shL:[1.9,0,0]}],[.22,{...G,hips:[0,1.6,0],thR:[-.1,0,-1.55],shR:[0,0,0],thL:[-1,0,0],shL:[1.8,0,0]}],[.36,{...G,hips:[0,-1.2,0],thL:[-.3,0,1.4],shL:[1.8,0,0],thR:[-1.2,0,0],shR:[1.9,0,0]}],[.48,{...G,hips:[0,-1.6,0],thL:[-.1,0,1.55],shL:[0,0,0],thR:[-1,0,0],shR:[1.7,0,0]}],[.7,G]]},
 geodeup:{name:'거듭옆차기',dur:.86,keys:[[0,G],[.1,SIDE_C],[.22,SIDE_K],[.34,SIDE_C],[.46,SIDE_K],[.58,SIDE_C],[.7,SIDE_K],[.86,G]]},
 yeopJ:{name:'뛰어옆차기',dur:.6,jump:.9,keys:[[0,G],[.1,{...G,hips:[0,1.57,0],torso:[0,0,.45],thL:[-1.3,0,0],shL:[2.0,0,0],thR:[-.2,0,-.9],shR:[1.7,0,0]}],[.22,{...SIDE_K,thL:[-1.4,0,0],shL:[2.1,0,0],uaR:[-.3,0,-1.2],uaL:[-.4,0,.6]}],[.48,{...SIDE_K,thL:[-1.3,0,0],shL:[2,0,0]}],[.6,G]]},
 s540:{name:'540 회전차기',dur:.9,jump:1.6,keys:[[0,G],[.15,{...G,hips:[0,-.8,0],crouch:3*PX,thL:[-.6,0,0],shL:[1.1,0,0],thR:[-.5,0,0],shR:[1.0,0,0]}],[.4,{...G,...SPREAD,hips:[0,-PI*1.6,0],thL:[-1.4,0,0],shL:[1.9,0,0],thR:[-.4,0,-.6],shR:[1.4,0,0]}],[.6,{...G,...SPREAD,hips:[0,-PI*2.6,0],torso:[0,0,-.4],thR:[-.1,0,-1.6],shR:[0,0,0],thL:[-1.2,0,0],shL:[1.6,0,0]}],[.9,{...G,hips:[0,-PI*3+.35,0]}]]},
 s720:{name:'720 회전차기',dur:1.05,jump:1.9,keys:[[0,G],[.15,{...G,hips:[0,-.8,0],crouch:3*PX}],[.38,{...G,...SPREAD,hips:[0,-PI*2,0],thL:[-1.5,0,0],shL:[2,0,0],thR:[-.2,0,-1.5],shR:[0,0,0]}],[.58,{...G,...SPREAD,hips:[0,-PI*3,0],thR:[-1.3,0,0],shR:[1.9,0,0],thL:[-.4,0,1.2],shL:[1.2,0,0]}],[.8,{...G,...SPREAD,hips:[0,-PI*4,0],torso:[0,0,-.4],thR:[-.1,0,-1.6],shR:[0,0,0],thL:[-1.2,0,0],shL:[1.6,0,0]}],[1.05,{...G,hips:[0,-PI*4+.35,0]}]]},
 s900:{name:'900 후리기',dur:1.2,jump:2.1,keys:[[0,G],[.15,{...G,hips:[0,.8,0],crouch:3*PX}],[.4,{...G,...SPREAD,hips:[0,-PI*2,0],thL:[-1.5,0,0],shL:[2,0,0],thR:[-1.2,0,0],shR:[1.8,0,0]}],[.7,{...G,...SPREAD,hips:[0,-PI*3.6,0],thR:[-.1,0,-1.55],shR:[0,0,0],thL:[-1.3,0,0],shL:[1.8,0,0]}],[.95,{...G,...SPREAD,hips:[0,-PI*5,0],thR:[-.2,0,-1.2],shR:[.6,0,0]}],[1.2,{...G,hips:[0,-PI*5+.35,0]}]]},
 boxcut:{name:'박스커터',dur:.95,jump:1.7,keys:[[0,G],[.15,{...G,hips:[0,.6,0],crouch:3*PX}],[.45,{...G,...SPREAD,hips:[0,-PI*1.8,.7],thL:[-1.6,0,0],shL:[2,0,0],thR:[-.6,0,-.4],shR:[1.4,0,0]}],[.7,{...G,...SPREAD,hips:[0,-PI*3,.6],thR:[-.1,0,-1.6],shR:[0,0,0],thL:[-1.4,0,0],shL:[1.9,0,0]}],[.95,{...G,hips:[0,-PI*3+.35,0]}]]},
 oebal:{name:'외발턴',dur:1.2,keys:[[0,G],[.12,{...G,...SPREAD,hips:[0,-.6,0],thR:[-.2,0,-1.5],shR:[0,0,0],thL:[0,0,0],shL:[0,0,0]}],[1.0,{...G,...SPREAD,hips:[0,-PI*6-.6,0],thR:[-.2,0,-1.5],shR:[0,0,0],thL:[0,0,0],shL:[0,0,0]}],[1.2,{...G,hips:[0,-PI*6+.35,0]}]]},
 btwist:{name:'비트위스트',dur:.95,jump:1.5,keys:[[0,G],[.15,{...G,hips:[0,.8,0],torso:[.5,0,0],crouch:4*PX}],[.38,{...G,...SPREAD,hips:[0,-1.6,1.45],thL:[-1.6,0,0],shL:[0,0,0],thR:[1.1,0,0],shR:[.2,0,0]}],[.62,{...G,...SPREAD,hips:[0,-4.4,1.45],thL:[1.1,0,0],shL:[.2,0,0],thR:[-1.6,0,0],shR:[0,0,0]}],[.95,{...G,hips:[0,-2*PI+.35,0]}]]},
 popturn:{name:'팝턴',dur:.72,jump:1.5,keys:[[0,G],[.12,{...G,crouch:4*PX,thL:[-.8,0,0],shL:[1.3,0,0],thR:[-.8,0,0],shR:[1.3,0,0]}],[.35,{...G,...SPREAD,hips:[0,-PI,0],thL:[-1.6,0,0],shL:[2.2,0,0],thR:[-1.6,0,0],shR:[2.2,0,0]}],[.52,{...G,...SPREAD,hips:[0,-PI*1.7,0],thR:[-.2,0,-1.5],shR:[0,0,0],thL:[-1.4,0,0],shL:[2,0,0]}],[.72,{...G,hips:[0,-2*PI+.35,0]}]]},
 illusion:{name:'일루젼',dur:.9,keys:[[0,G],[.12,{...G,hips:[0,0,0],torso:[1.1,0,0],thR:[1.0,0,0],shR:[.2,0,0],uaL:[0,0,1.2],uaR:[0,0,-1.2]}],[.4,{...G,hips:[0,-2.2,0],torso:[1.3,0,0],thR:[2.6,0,-.3],shR:[0,0,0],uaL:[0,0,1.3],uaR:[0,0,-1.3]}],[.66,{...G,hips:[0,-4.6,0],torso:[1.0,0,0],thR:[-.6,0,-1.3],shR:[0,0,0],uaL:[0,0,1.3],uaR:[0,0,-1.3]}],[.9,{...G,hips:[0,-2*PI+.35,0]}]]},
 roll:{name:'구르기',dur:.42,keys:[[0,G],[.42,{...G,hips:[-2*PI,0,0],crouch:6*PX,thL:[-1.6,0,0],shL:[2.2,0,0],thR:[-1.6,0,0],shR:[2.2,0,0],uaL:[-2,0,0],uaR:[-2,0,0]}]]},
 jireugi:{name:'지르기',dur:.32,keys:[[0,G],[.12,{...G,hips:[0,-.2,0],torso:[0,-.4,0],uaR:[-1.55,0,0],laR:[0,0,0]}],[.32,G]]},
 // 무기
 w_cut1:{name:'베기',dur:.42,keys:[[0,GW],[.12,{...GW,torso:[0,-.9,0],uaR:[-1.4,0,-1.0],laR:[-.3,0,0]}],[.22,{...GW,torso:[0,.9,0],uaR:[-1.35,0,.1],laR:[-.1,0,0]}],[.42,GW]]},
 w_cut2:{name:'되베기',dur:.42,keys:[[0,GW],[.12,{...GW,torso:[0,.9,0],uaR:[-1.5,0,.5],laR:[-.5,0,0]}],[.22,{...GW,torso:[0,-.8,0],uaR:[-1.3,0,-1.1],laR:[-.1,0,0]}],[.42,GW]]},
 w_chop:{name:'내려베기',dur:.5,keys:[[0,GW],[.16,{...GW,torso:[-.2,0,0],uaR:[-2.9,0,-.2],laR:[-.4,0,0],uaL:[-2.6,0,.3]}],[.28,{...GW,torso:[.35,0,0],crouch:3*PX,uaR:[-.9,0,0],laR:[-.1,0,0],uaL:[-.9,0,0]}],[.5,GW]]},
 w_thrust:{name:'찌르기',dur:.3,keys:[[0,GW],[.1,{...GW,torso:[0,-.5,0],uaR:[-1.2,0,0],laR:[-1.6,0,0]}],[.18,{...GW,torso:[.1,.4,0],uaR:[-1.57,0,0],laR:[0,0,0]}],[.3,GW]]},
 w_sweep:{name:'후리기',dur:.55,keys:[[0,GW],[.16,{...GW,hips:[0,-.6,0],torso:[0,-1.2,0],uaR:[-1.3,0,-1.2],uaL:[-1.3,0,-.4]}],[.32,{...GW,hips:[0,.6,0],torso:[0,1.3,0],uaR:[-1.3,0,.2],uaL:[-1.3,0,.6]}],[.55,GW]]},
 w_spin:{name:'회전베기',dur:.7,keys:[[0,GW],[.1,{...GW,uaR:[-1.4,0,-1.5],laR:[0,0,0]}],[.6,{...GW,hips:[0,-4*PI,0],uaR:[-1.4,0,-1.5],laR:[0,0,0],uaL:[-1,0,1.3]}],[.7,{...GW,hips:[0,-4*PI,0]}]]},
 w_slam:{name:'대지 가르기',dur:.85,jump:1.6,keys:[[0,GW],[.2,{...GW,crouch:4*PX}],[.45,{...GW,uaR:[-3.1,0,0],uaL:[-3.0,0,0],laR:[-.3,0,0],torso:[-.3,0,0]}],[.62,{...GW,torso:[.5,0,0],uaR:[-.7,0,0],uaL:[-.7,0,0],crouch:4*PX}],[.85,GW]]},
 w_flurry:{name:'연속찌르기',dur:.9,keys:[[0,GW],[.08,{...GW,uaR:[-1.2,0,0],laR:[-1.6,0,0]}],[.15,{...GW,uaR:[-1.57,0,0],laR:[0,0,0]}],[.25,{...GW,uaR:[-1.2,0,0],laR:[-1.6,0,0]}],[.32,{...GW,uaR:[-1.6,0,.15],laR:[0,0,0]}],[.42,{...GW,uaR:[-1.2,0,0],laR:[-1.6,0,0]}],[.5,{...GW,uaR:[-1.5,0,-.15],laR:[0,0,0]}],[.6,{...GW,uaR:[-1.2,0,0],laR:[-1.6,0,0]}],[.7,{...GW,torso:[.2,.4,0],uaR:[-1.6,0,0],laR:[0,0,0]}],[.9,GW]]},
 w_cast:{name:'마법 시전',dur:.5,keys:[[0,GW],[.18,{...GW,uaR:[-2.8,0,-.2],laR:[0,0,0],uaL:[-2.6,0,.2]}],[.3,{...GW,uaR:[-1.6,0,0],laR:[0,0,0],uaL:[-1.4,0,0]}],[.5,GW]]},
 shoot:{name:'활 쏘기',dur:.42,keys:[[0,G],[.12,{...G,hips:[0,.6,0],torso:[0,-.6,0],uaL:[-1.57,0,0],laL:[0,0,0],uaR:[-1.57,0,0],laR:[-1.9,0,0]}],[.3,{...G,hips:[0,.6,0],torso:[0,-.6,0],uaL:[-1.57,0,0],laL:[0,0,0],uaR:[-1.4,0,.3],laR:[-2.4,0,0]}],[.42,G]]},
};

/* ---------- 실제 사람 동작(모션캡처·영상) → 리그 관절 ---------- */
const CLIPS={};// id -> {name, src, dur, fps, frames:[{q:{...},r:V3}], peak}
const tmpM=new THREE.Matrix4(),DOWN=new V3(0,-1,0);
function basisQ(x,y){const xx=x.clone().normalize();const z=new V3().crossVectors(xx,y).normalize();const yy=new V3().crossVectors(z,xx).normalize();return new QU().setFromRotationMatrix(tmpM.makeBasis(xx,yy,z));}
function limbQ(ref,dir){const local=dir.clone().applyQuaternion(ref.clone().invert()).normalize();return ref.clone().multiply(new QU().setFromUnitVectors(DOWN,local));}
function retarget(f){// f.w: 33×3 (MediaPipe 좌표계) → 관절 로컬 회전
  const g=i=>new V3(f.w[i*3],-f.w[i*3+1],-f.w[i*3+2]);
  const shL=g(11),shR=g(12),hpL=g(23),hpR=g(24);const shM=shL.clone().add(shR).multiplyScalar(.5),hpM=hpL.clone().add(hpR).multiplyScalar(.5);
  const up=shM.clone().sub(hpM);
  const qPel=basisQ(hpL.clone().sub(hpR).add(shL.clone().sub(shR)).multiplyScalar(.5),up);const qChest=basisQ(shL.clone().sub(shR),up);
  const eL=g(7),eR=g(8),nose=g(0);const em=eL.clone().add(eR).multiplyScalar(.5);let qH=qChest.clone();const fwd=nose.clone().sub(em);
  if(fwd.length()>1e-4){const hx=eL.clone().sub(eR).normalize();const hz=fwd.clone().sub(hx.clone().multiplyScalar(fwd.dot(hx))).normalize();const hy=new V3().crossVectors(hz,hx);qH=qChest.clone().slerp(basisQ(hx,hy),.6);}
  const dir=(a,b)=>g(b).sub(g(a)).normalize();
  const qUL=limbQ(qChest,dir(11,13)),qLL=limbQ(qUL,dir(13,15)),qUR=limbQ(qChest,dir(12,14)),qLR=limbQ(qUR,dir(14,16));
  const qTL=limbQ(qPel,dir(23,25)),qSL=limbQ(qTL,dir(25,27)),qTR=limbQ(qPel,dir(24,26)),qSR=limbQ(qTR,dir(26,28));
  const inv=q=>q.clone().invert();
  return{hips:qPel,torso:inv(qPel).multiply(qChest),head:inv(qChest).multiply(qH),uaL:inv(qChest).multiply(qUL),laL:inv(qUL).multiply(qLL),uaR:inv(qChest).multiply(qUR),laR:inv(qUR).multiply(qLR),
    thL:inv(qPel).multiply(qTL),shL:inv(qTL).multiply(qSL),thR:inv(qPel).multiply(qTR),shR:inv(qTR).multiply(qSR)};}
function addClip(id,c){const fr=c.frames.map(f=>({q:retarget(f),r:new V3(f.r[0],f.r[1],f.r[2])}));
  // 첫 프레임의 몸 방향이 앞(+z)을 보게 맞추기
  const yaw0=new THREE.Euler().setFromQuaternion(fr[0].q.hips,'YXZ').y;const fix=new QU().setFromAxisAngle(new V3(0,1,0),-yaw0);
  fr.forEach(f=>{f.q.hips=fix.clone().multiply(f.q.hips);f.r.applyQuaternion(fix);});
  CLIPS[id]={id,name:c.name,src:c.src||'user',fps:c.fps,dur:fr.length/c.fps,frames:fr,peak:c.peak||{},raw:c.raw?c:null};return CLIPS[id];}
const _qa=new QU(),_qb=new QU();
function clipPose(r,clip,t,scale=1){const n=clip.frames.length;const x=clamp(t*clip.fps,0,n-1);const i=Math.floor(x),j=Math.min(n-1,i+1),k=x-i;
  const A=clip.frames[i],B=clip.frames[j];JOINTS.forEach(jn=>{_qa.copy(A.q[jn]);_qb.copy(B.q[jn]);r[jn].quaternion.copy(_qa.slerp(_qb,k));});
  const rr=A.r.clone().lerp(B.r,k);r.hips.position.set(rr.x*scale,rr.y*scale*(r.legH/.825),rr.z*scale);return rr;}
function groundFix(r){r.root.updateMatrixWorld(true);let min=Infinity;const p=new V3();r.tips.forEach(o=>{o.getWorldPosition(p);min=Math.min(min,p.y);});
  // 몸통 아래쪽도 확인
  r.mesh.torso.getWorldPosition(p);min=Math.min(min,p.y-.15);r.mesh.head.getWorldPosition(p);min=Math.min(min,p.y-.25);
  const base=r.root.position.y;if(min<base)r.hips.position.y+=base-min;}

/* ---------- 픽셀 그림 → 입체 아이템 ---------- */
function voxel(img,depth=1,size=.07){const c=cnv(img.width,img.height),g=c.getContext('2d');g.drawImage(img,0,0);const d=g.getImageData(0,0,c.width,c.height).data,W=c.width,H=c.height;
  const pos=[],col=[],nor=[];const color=new THREE.Color();const solidAt=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&d[(y*W+x)*4+3]>40;
  const F=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  const quad=(cx,cy,n)=>{const [nx,ny,nz]=n;const h=.5;let a,b;if(nx){a=[0,1,0];b=[0,0,1];}else if(ny){a=[1,0,0];b=[0,0,1];}else{a=[1,0,0];b=[0,1,0];}
    const ctr=[cx+nx*h,cy+ny*h,nz*h*depth];const v=(s,t)=>[ctr[0]+(a[0]*s+b[0]*t)*h,ctr[1]+(a[1]*s+b[1]*t)*h,ctr[2]+(a[2]*s+b[2]*t)*h*depth];
    const p=[v(-1,-1),v(1,-1),v(1,1),v(-1,-1),v(1,1),v(-1,1)];const cross=(nx+ny+nz)>0;
    (cross?p:[p[0],p[2],p[1],p[3],p[5],p[4]]).forEach(q=>{pos.push(q[0]*size,q[1]*size,q[2]*size);nor.push(nx,ny,nz);col.push(color.r,color.g,color.b);});};
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!solidAt(x,y))continue;const i=(y*W+x)*4;color.setRGB(d[i]/255,d[i+1]/255,d[i+2]/255);color.convertSRGBToLinear();
    const cx=x-W/2+.5,cy=H/2-y-.5;F.forEach(n=>{if(n[2]!==0||!solidAt(x+n[0],y-n[1]))quad(cx,cy,n);});}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  const m=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({vertexColors:true}));m.castShadow=true;return m;}

/* ---------- pixelfx 이펙트 244개 (MIT) ---------- */
const PFXL=(window.PFX&&PFX.all&&PFX.all.effects)||{};
const PFX_IDS=Object.keys(PFXL);
// 캐릭터 위에 덧그리는 이펙트용: 마크 캐릭터 모양(16×32) 실루엣
const MCACTOR=(function(){const w=16,h=32,data=new Uint8Array(w*h);const fill=(x0,y0,x1,y1)=>{for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)data[y*w+x]=1;};
  fill(4,0,12,8);fill(4,8,12,20);fill(0,8,4,20);fill(12,8,16,20);fill(4,20,12,32);
  return{mask:{w,h,data},pixels:new Uint32Array(w*h),x:-8,y:-32,w,h,k:2,head:[0,-32],chest:[0,-22],eyes:[[6,3],[9,3]]};})();
const pfxList=[];const PXW=.03;
function pfx(id,pos,o={}){if(!window.PFX||pfxList.length>30)return null;const mod=PFXL[id];if(!mod)return null;const M=mod.meta||{};const [w,h]=M.size||[128,128],[ox,oy]=M.origin||[w/2,h/2];
  const opt=Object.assign({x:0,y:0,seed:(Math.random()*1e5)|0},o.opt||{});const actorFx=!!(M.actor);if(actorFx)opt.actor=MCACTOR;
  let fx;try{fx=PFX.createFx(mod,opt);}catch(e){return null;}
  const frame=PFX.createFrame(w,h,-ox,-oy);const c=cnv(w,h),g=c.getContext('2d'),img=g.createImageData(w,h);const t=tex(c);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,depthTest:o.over?false:true}));
  const S=(o.scale||1)*PXW*(actorFx?2.3:1);sp.scale.set(w*S,h*S,1);sp.center.set(ox/w,1-oy/h);sp.position.copy(pos);sp.renderOrder=o.over?10:2;scene.add(sp);
  const e={fx,frame,img,g,t,sp,follow:o.follow,off:o.off||new V3(),life:o.life||(M.loop?2.5:0),age:0};pfxList.push(e);return e;}
function pfxTick(dt){for(let i=pfxList.length-1;i>=0;i--){const e=pfxList[i];e.age+=dt;
  if(e.follow){if(e.follow.dead){e.fx.stop();}else e.sp.position.copy(e.follow.pos).add(e.off);}
  if(e.life&&e.age>e.life)e.fx.stop();
  try{e.fx.update(dt);PFX.clearFrame(e.frame);e.fx.draw(e.frame);PFX.composite(e.frame,e.img.data,null,1.2);e.g.putImageData(e.img,0,0);e.t.needsUpdate=true;}catch(err){e.fx.stop();e.age=99;}
  if(e.fx.done()||e.age>12){scene.remove(e.sp);e.t.dispose();e.sp.material.dispose();pfxList.splice(i,1);}}}

/* ---------- Kenney 파티클 (CC0): 궤적·레이저·마법진·불꽃 ---------- */
const KT={};
function ktex(n){if(KT[n])return KT[n];const t=new THREE.Texture();t.encoding=THREE.sRGBEncoding;load('k/'+n+'.png').then(i=>{t.image=i;t.needsUpdate=true;});return KT[n]=t;}
const kfx=[];
function kb(n,pos,o={}){const mat=new THREE.SpriteMaterial({map:ktex(n),color:o.color??0xffffff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:o.op??1});
  const sp=new THREE.Sprite(mat);sp.position.copy(pos);const s=o.size||1;sp.scale.set(s,s,1);if(o.rot)mat.rotation=o.rot;scene.add(sp);kfx.push({o:sp,t:0,life:o.life||.4,s0:s,grow:o.grow??1.3,vel:o.vel,g:o.g||0,spin:o.spin||0,op:o.op??1});return sp;}
const PLANE=new THREE.PlaneGeometry(1,1);PLANE.rotateX(-PI/2);
function kp(n,pos,o={}){const mat=new THREE.MeshBasicMaterial({map:ktex(n),color:o.color??0xffffff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:o.op??1,side:THREE.DoubleSide});
  const m=new THREE.Mesh(PLANE,mat);m.position.copy(pos);const s=o.size||1;m.scale.set(o.sx||s,1,o.sz||s);m.rotation.y=o.rot||0;if(o.tilt)m.rotation.x=o.tilt;scene.add(m);
  kfx.push({o:m,t:0,life:o.life||.4,s0:s,sx:o.sx||s,sz:o.sz||s,grow:o.grow??1.2,spin:o.spin||0,op:o.op??1,plane:true});return m;}
function beam(n,a,b,o={}){const d=b.clone().sub(a);const len=d.length();const mid=a.clone().add(b).multiplyScalar(.5);
  const mat=new THREE.MeshBasicMaterial({map:ktex(n),color:o.color??0xffffff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
  const m=new THREE.Mesh(PLANE,mat);m.position.copy(mid);m.scale.set(len,1,o.w||.6);m.rotation.y=-Math.atan2(d.z,d.x);scene.add(m);kfx.push({o:m,t:0,life:o.life||.25,beam:true,w:o.w||.6,op:1,len});return m;}
function kfxTick(dt){for(let i=kfx.length-1;i>=0;i--){const f=kfx[i];f.t+=dt;const k=f.t/f.life;
  if(f.beam){f.o.scale.z=f.w*(1-k*.6);f.o.material.opacity=1-k;}
  else if(f.plane){const s=1+(f.grow-1)*k;f.o.scale.set(f.sx*s,1,f.sz*s);f.o.rotation.y+=f.spin*dt;f.o.material.opacity=f.op*(1-k);}
  else{const s=f.s0*(1+(f.grow-1)*k);f.o.scale.set(s,s,1);if(f.vel){f.vel.y-=f.g*dt;f.o.position.addScaledVector(f.vel,dt);}f.o.material.rotation+=f.spin*dt;f.o.material.opacity=f.op*(1-k*k);}
  if(k>=1){scene.remove(f.o);f.o.material.dispose();kfx.splice(i,1);}}}
const KFX_LIST=['circle_02','circle_03','light_01','magic_01','magic_02','magic_03','magic_04','flare_01','star_01','star_04','star_06','spark_01','spark_02','spark_05','spark_06','trace_01','trace_02','trace_04','slash_01','slash_02','slash_03','twirl_01','twirl_02','twirl_03','fire_01','flame_01','flame_02','flame_04','smoke_01','smoke_04','scorch_01','muzzle_01','muzzle_02'];
/* ---------- 소리 ---------- */
let sndOn=true;
function sfx(n,v=.45,r=1){if(!sndOn)return;try{const a=new Audio('a/s/'+n+'.wav');a.volume=Math.min(1,v);a.playbackRate=r;a.play().catch(()=>{});}catch(e){}}
