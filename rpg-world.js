/* 정도 RPG — 3D 세상 (Three.js): 글로브뷰(땅이 공처럼 휘어 보임) · 하늘 · 땅 · 나무 · 세워 둔 도트 그림 */
'use strict';
(function(J){
const T = THREE, W = J.W = {};
const U = W.U = { uCurve:{ value:0.00011 }, uCurveX:{ value:0.00033 }, uCam:{ value:new T.Vector2() } };
W.Z0 = -135; W.Z1 = 135;          /* 걸을 수 있는 앞뒤 폭 */

/* 모든 재질에 '공처럼 휘는' 효과를 넣어요 (에버플래닛 글로브뷰와 같은 방식: 카메라에서 멀수록 아래로) */
function curve(mat, flash){
  const extra = flash ? { uFlash:{ value:0 }, uFlashC:{ value:new T.Color(1, 1, 1) } } : null;
  mat.userData.fl = extra;
  mat.onBeforeCompile = sh => {
    sh.uniforms.uCurve = U.uCurve; sh.uniforms.uCurveX = U.uCurveX; sh.uniforms.uCam = U.uCam; if(extra){ sh.uniforms.uFlash = extra.uFlash; sh.uniforms.uFlashC = extra.uFlashC; }
    sh.vertexShader = 'uniform float uCurve;\nuniform float uCurveX;\nuniform vec2 uCam;\n' + sh.vertexShader.replace('#include <project_vertex>',
      'vec4 wpC = modelMatrix * vec4(transformed, 1.0);\nvec2 dC = wpC.xz - uCam;\nwpC.y -= uCurveX * dC.x * dC.x + uCurve * dC.y * dC.y;\nvec4 mvPosition = viewMatrix * wpC;\ngl_Position = projectionMatrix * mvPosition;');
    if(extra) sh.fragmentShader = 'uniform float uFlash;\nuniform vec3 uFlashC;\n' + sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.rgb = mix(gl_FragColor.rgb, uFlashC, uFlash);');
  };
  mat.customProgramCacheKey = () => flash ? 'jdcurveF' : 'jdcurve';
  return mat; }
W.curveAt = (x, z) => { const dx = x - U.uCam.value.x, dz = z - U.uCam.value.y; return U.uCurveX.value * dx * dx + U.uCurve.value * dz * dz; };

/* ===== 렌더러 · 카메라 ===== */
W.init = function(canvas){
  const r = W.R = new T.WebGLRenderer({ canvas, antialias:false, alpha:false, powerPreference:'high-performance' });
  r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); r.autoClear = false;
  W.scene = new T.Scene(); W.cam = new T.PerspectiveCamera(40, 1, 10, 9000);
  W.skyScene = new T.Scene(); W.skyCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 2);
  const sm = new T.MeshBasicMaterial({ color:0xffffff, depthWrite:false, depthTest:false });
  W.skyQuad = new T.Mesh(new T.PlaneGeometry(2, 2), sm); W.skyScene.add(W.skyQuad);
  W.scene.fog = new T.Fog(0xaaccee, 1800, 4200);
  W.resize(); window.addEventListener('resize', W.resize);
  W.shake = 0; W.zoom = 1; W.fovK = 0;
};
W.resize = function(){ const c = W.R.domElement, w = c.clientWidth || 360, h = c.clientHeight || 640; W.R.setSize(w, h, false); W.cw = w; W.ch = h; W.cam.aspect = w / h;
  /* 세로 화면이면 가까이, 가로면 조금 멀리: 보이는 가로 폭이 520~900 */
  const asp = w / h; W.dist = J.clamp(470 / (0.728 * asp), 720, 1300); W.cam.updateProjectionMatrix(); if(W.skyTex) W.fitSky(); };

/* ===== 그림 → 텍스처 ===== */
W.tex = function(img){ const t = new T.Texture(img); t.magFilter = T.NearestFilter; t.minFilter = T.NearestFilter; t.generateMipmaps = false; t.colorSpace = T.SRGBColorSpace; t.needsUpdate = true; return t; };
W.texSmooth = function(img, rep){ const t = new T.Texture(img); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; if(rep){ t.wrapS = t.wrapT = T.RepeatWrapping; } t.needsUpdate = true; return t; };
const PLANE = new T.PlaneGeometry(1, 1); PLANE.translate(0, .5, 0);
/* [v12] 움직이지 않는 장식(나무·덤불·바위)은 화면 밖이면 안 그려요. 글로브뷰(curve>0)를 켠 때만 예전처럼 항상 그려요(휘어진 모양이 잘려 보일 수 있어서) */
W.markStatic = function(s){ s.stat = true; s.mesh.frustumCulled = !(J.CFG.curve > 0); return s; };

/* 세워 둔 그림 한 장 (몬스터·영웅·나무·이펙트) */
W.Spr = class {
  constructor(tex, o){ o = o || {};
    this.base = tex; this.t = tex.clone(); this.t.needsUpdate = true;
    this.iw = tex.image.width; this.ih = tex.image.height;
    const m = this.mat = curve(new T.MeshBasicMaterial({ map:this.t, transparent:true, depthWrite:false, alphaTest:.03, side:T.DoubleSide, fog:o.fog !== false }), true);
    if(o.add){ m.blending = T.AdditiveBlending; }
    this.mesh = new T.Mesh(PLANE, m); this.mesh.frustumCulled = false;
    this.mesh.rotation.x = -(o.tilt == null ? .3 : o.tilt);
    W.scene.add(this.mesh); this.frame(0, 0, this.iw, this.ih, false); }
  frame(sx, sy, sw, sh, flip){ const t = this.t, iw = this.iw, ih = this.ih;
    if(flip){ t.repeat.set(-sw / iw, sh / ih); t.offset.set((sx + sw) / iw, 1 - (sy + sh) / ih); } else { t.repeat.set(sw / iw, sh / ih); t.offset.set(sx / iw, 1 - (sy + sh) / ih); }
    this.sw = sw; this.sh = sh; }
  /* 발 위치(x,z) · 높이 y에, 픽셀 배율 s로, 발 자리(fx,fy: 칸 안의 픽셀)를 맞춰 세워요 */
  place(x, y, z, s, fx, fy, flip, sx, sy, rot){ const m = this.mesh, w = this.sw * s * (sx || 1), h = this.sh * s * (sy || 1);
    const ox = ((this.sw / 2) - (fx == null ? this.sw / 2 : fx)) * s * (sx || 1) * (flip ? -1 : 1), oy = -(this.sh - (fy == null ? this.sh : fy)) * s * (sy || 1);
    m.scale.set(w, h, 1); m.position.set(x + ox, y + oy, z); m.rotation.z = rot || 0; m.renderOrder = 1000 + Math.round((z + 2000) * 4); }
  flash(c, a){ const f = this.mat.userData.fl; f.uFlash.value = a || 0; if(c) f.uFlashC.value.set(c); }
  set alpha(a){ this.mat.opacity = a; }
  set visible(v){ this.mesh.visible = v; }
  dispose(){ W.scene.remove(this.mesh); this.t.dispose(); this.mat.dispose(); }
};

/* 그림자 (바닥에 눕힌 동그라미) */
let shadowTex = null;
W.Shadow = class {
  constructor(r){ if(!shadowTex){ const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 2, 32, 32, 31); g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(.7, 'rgba(0,0,0,.3)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); shadowTex = W.texSmooth(c); }
    this.mat = curve(new T.MeshBasicMaterial({ map:shadowTex, transparent:true, depthWrite:false, fog:false }));
    this.mesh = new T.Mesh(new T.PlaneGeometry(1, 1), this.mat); this.mesh.rotation.x = -Math.PI / 2; this.mesh.renderOrder = 5; this.mesh.frustumCulled = false; W.scene.add(this.mesh); this.r = r; }
  at(x, z, r, a){ r = r || this.r; this.mesh.position.set(x, 1.5, z); this.mesh.scale.set(r * 2, r * .9, 1); this.mat.opacity = a == null ? 1 : a; }
  dispose(){ W.scene.remove(this.mesh); this.mat.dispose(); }
};

/* ===== 위험 표시 (보스 공격 범위) — 바닥에 그린 모양 = 실제로 맞는 범위 ===== */
const ZV = 'uniform float uCurve, uCurveX; uniform vec2 uCam; varying vec2 vUv; void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position, 1.0); vec2 d = wp.xz - uCam; wp.y -= uCurveX * d.x * d.x + uCurve * d.y * d.y; gl_Position = projectionMatrix * viewMatrix * wp; }';
const ZF = 'uniform float uK, uP, uR0, uA0, uA1, uT, uOn; uniform vec3 uC; varying vec2 vUv;\n' +
  'void main(){ vec2 p = vUv * 2.0 - 1.0; float r = length(p); float ins = 0.0, fill = 0.0, edge = 0.0;\n' +
  ' if(uK < 0.5){ ins = step(r, 1.0); fill = step(r, uP); edge = smoothstep(.86, .97, r) * ins; }\n' +
  ' else if(uK < 1.5){ ins = step(uR0, r) * step(r, 1.0); fill = ins * step(r, uR0 + (1.0 - uR0) * uP); edge = (smoothstep(.88, .98, r) + (1.0 - smoothstep(uR0, uR0 + .08, r))) * ins; }\n' +
  ' else if(uK < 2.5){ float a = atan(p.y, p.x); float da = abs(mod(a - uA0 + 3.14159265, 6.2831853) - 3.14159265); ins = step(r, 1.0) * step(da, uA1); fill = ins * step(r, uP); edge = ins * max(smoothstep(.88, .98, r), 1.0 - smoothstep(0.0, .06, uA1 - da)); }\n' +
  ' else { ins = 1.0; fill = step(vUv.x, uP); edge = max(1.0 - smoothstep(0.0, .05, min(vUv.y, 1.0 - vUv.y)), 1.0 - smoothstep(0.0, .015, min(vUv.x, 1.0 - vUv.x))); }\n' +
  ' float bl = .5 + .5 * sin(uT * 18.0);\n' +
  ' float a = ins * (.16 + .1 * bl) + fill * .34 + edge * .85; if(a < .01) discard; gl_FragColor = vec4(mix(uC, vec3(1.0), edge * .25), a * uOn); }';
W.Zone = class {
  /* k: 0 원 · 1 고리 · 2 부채꼴 · 3 띠(직사각형). 크기: 원/고리/부채꼴 = 반지름 r, 띠 = 길이 len · 폭 wd */
  constructor(k, o){ this.k = k; this.o = o;
    this.u = { uCurve:U.uCurve, uCurveX:U.uCurveX, uCam:U.uCam, uK:{ value:k }, uP:{ value:0 }, uR0:{ value:o.r0 || 0 }, uA0:{ value:o.a0 || 0 }, uA1:{ value:o.a1 || .6 }, uT:{ value:0 }, uOn:{ value:1 }, uC:{ value:new T.Color(o.safe ? 0x3cff7a : 0xff3030) } };
    this.mat = new T.ShaderMaterial({ uniforms:this.u, vertexShader:ZV, fragmentShader:ZF, transparent:true, depthWrite:false, depthTest:false });
    this.mesh = new T.Mesh(new T.PlaneGeometry(1, 1, 8, 8), this.mat); this.mesh.rotation.x = -Math.PI / 2; this.mesh.renderOrder = 6; this.mesh.frustumCulled = false; W.scene.add(this.mesh);
    this.set(o); }
  set(o){ Object.assign(this.o, o); const m = this.mesh, q = this.o;
    if(this.k === 3){ m.scale.set(q.len, q.wd, 1); m.rotation.z = -(q.ang || 0); const c = Math.cos(q.ang || 0), s = Math.sin(q.ang || 0); m.position.set(q.x + c * q.len / 2, 2, q.z + s * q.len / 2); }
    else { m.scale.set(q.r * 2, q.r * 2, 1); m.position.set(q.x, 2, q.z); m.rotation.z = 0; }
    if(q.a0 != null) this.u.uA0.value = -q.a0; }
  prog(p, t, on){ this.u.uP.value = p; this.u.uT.value = t; this.u.uOn.value = on == null ? 1 : on; }
  dispose(){ W.scene.remove(this.mesh); this.mesh.geometry.dispose(); this.mat.dispose(); }
};

/* ===== 테마 (듀얼리스트 CC0 하늘 + 직접 그린 땅) ===== */
/* 테마: 하늘(듀얼리스트 CC0) + 도트 땅·나무(AsLib/피포야 CC0)
   pg: 땅 타일 번호(0 연두풀 1 풀 2 밝은풀 3 짙은풀 4 흙모래 5 갈라진흙 6 모래 7 회색), pr: 길 타일, tint: [색, 세기]
   tr: 큰 나무(도트), sm: 작은 장식(도트), dp: 듀얼리스트 큰 그림 */
W.THEMES = [
  { nm:'무지개 들판', sky:1, pg:[0,0,2,1], pr:6, tr:['treeL','treeG','treeL'], sm:['bushL','bushG','flW','flP','flS','tuft','rockS','mushB'], dp:[], fog:'#bfe3f2' },
  { nm:'붉은 협곡', sky:2, pg:[4,4,6,5], pr:5, tr:['treeD','bigSand'], sm:['dry','rockS','rockB','bushD','stump','log'], dp:['arch'], fog:'#d9e6f0' },
  { nm:'노을 도시', sky:3, pg:[3,1], pr:5, tint:['#7a5aa6', .35], tr:['treeO','treeO','treeD'], sm:['bushO','crR','crY','rockS','mushP','grave'], dp:['lantern','pillars'], fog:'#c8a0b8' },
  { nm:'폭포 정글', sky:4, pg:[1,1,0,3], pr:6, tr:['treeG','treeG','treeL'], sm:['bushG','bushL','flB','flP','tuft','mushB','log'], dp:['palm1','palm2'], fog:'#9fe6d4' },
  { nm:'별밤 언덕', sky:5, pg:[3,3,1], pr:7, tint:['#2a3a7a', .45], tr:['treeD','bigDark','pine'], sm:['crB','crG','mushP','grave','cross','rockS'], dp:['lantern'], fog:'#5a6496' },
  { nm:'궁전 정원', sky:6, pg:[2,0,0], pr:4, tr:['treeL','treeG','treeO'], sm:['flS','flW','flP','flB','bushL','bushG'], dp:['lantern'], fog:'#bfeaf0' },
  { nm:'얼음 호수', sky:7, pg:[7,7], pr:7, tint:['#e8f2ff', .7], tr:['treeSnow','pine','treeDS'], sm:['crB','crW','bushSnow','bigSnow','rockS'], dp:['pillars'], fog:'#d6e8f4' },
  { nm:'붉은 바위산', sky:8, pg:[5,5,4], pr:6, tint:['#b0583c', .3], tr:['treeD','bigDark','bigSand'], sm:['crR','rockB','rockS','dry','stump'], dp:['arch'], fog:'#e8c8c0' },
  { nm:'떠 있는 섬', sky:9, pg:[2,0,1], pr:6, tr:['treeL','treeG'], sm:['flS','flB','bushL','tuft','rockS','log'], dp:['palm1','palm2'], fog:'#a8ecf0' },
  { nm:'눈 덮인 산', sky:10, pg:[7,7], pr:4, tint:['#f4f8ff', .78], tr:['treeSnow','treeSnow','pine','treeDS'], sm:['bushSnow','crW','bigSnow','scare','rockS'], dp:[], fog:'#e8f2fa' }
];
const PIX = {"treeL": [0, 0, 61, 64], "treeG": [63, 0, 61, 64], "treeO": [126, 0, 61, 64], "treeD": [189, 0, 58, 62], "bushL": [249, 0, 30, 32], "bushG": [281, 0, 30, 32], "bushO": [313, 0, 30, 32], "bushD": [345, 0, 30, 29], "stump": [377, 0, 22, 19], "log": [401, 0, 59, 27], "tuft": [462, 0, 21, 19], "dry": [485, 0, 23, 26], "flW": [0, 66, 24, 21], "flP": [26, 66, 25, 22], "flB": [53, 66, 26, 22], "flS": [81, 66, 30, 23], "mushB": [113, 66, 17, 16], "mushP": [132, 66, 17, 16], "rockS": [151, 66, 20, 13], "rockB": [173, 66, 31, 23], "grave": [206, 66, 29, 31], "cross": [237, 66, 23, 30], "crG": [262, 66, 32, 32], "crR": [296, 66, 32, 32], "crY": [330, 66, 32, 32], "crB": [364, 66, 32, 32], "crW": [398, 66, 32, 32], "bigSand": [432, 66, 64, 64], "bigDark": [0, 132, 64, 64], "bigSnow": [66, 132, 64, 64], "treeSnow": [132, 132, 62, 62], "pine": [196, 132, 60, 62], "treeDS": [258, 132, 54, 60], "bushSnow": [314, 132, 30, 30], "scare": [346, 132, 32, 46]};
let PIXIMG = null, PIXG = null;
async function pixLoad(){ if(PIXIMG === null){ PIXIMG = (await J.loadImg('pix-props.png')) || false; PIXG = (await J.loadImg('pix-ground.png')) || false; } return PIXIMG && PIXG; }
/* 도트 땅: 32칸 타일을 섞어 깔고, 풀·꽃을 몇 개 그려 넣어요 */
function pixGround(th){ const S = 1024, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  /* 같은 종류끼리 덩어리지게 (바둑판처럼 보이지 않게): 겹치는 물결 무늬로 고르기 · 가장자리가 이어지게 */
  const pg = [...new Set(th.pg)], N = S / 32, ph = [Math.random() * 6, Math.random() * 6, Math.random() * 6, Math.random() * 6];
  const nz = (tx, ty) => { const a = tx / N * Math.PI * 2, b = ty / N * Math.PI * 2; return (Math.sin(a * 2 + ph[0]) + Math.sin(b * 3 + ph[1]) + Math.sin((a + b) * 2 + ph[2]) * .7 + Math.sin((a - b) * 3 + ph[3]) * .5) / 3.2; };
  for(let ty = 0; ty < N; ty++) for(let tx = 0; tx < N; tx++){ const v = nz(tx, ty) + (Math.random() - .5) * .12; let t = pg[0]; if(pg.length > 1 && v > .28) t = pg[1]; if(pg.length > 2 && v < -.42) t = pg[2]; if(pg.length > 3 && v > .62) t = pg[3]; x.drawImage(PIXG, t * 32, 0, 32, 32, tx * 32, ty * 32, 32, 32); }
  const dec = ['tuft','flW','flP','rockS'].filter(k => th.sm.includes(k) || k === 'tuft'); for(let i = 0; i < 26; i++){ const k = J.pick(dec), q = PIX[k]; const px = (Math.random() * (S - q[2])) | 0, py = (Math.random() * (S - q[3])) | 0; x.drawImage(PIXIMG, q[0], q[1], q[2], q[3], px, py, q[2], q[3]); }
  if(th.tint){ x.globalCompositeOperation = 'source-atop'; x.globalAlpha = th.tint[1]; x.fillStyle = th.tint[0]; x.fillRect(0, 0, S, S); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; }
  return c; }
function pixRoad(th){ const W2 = 1024, H2 = 256, c = document.createElement('canvas'); c.width = W2; c.height = H2; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  for(let ty = 0; ty < H2 / 32; ty++) for(let tx = 0; tx < W2 / 32; tx++){ const edge = ty === 0 || ty === H2 / 32 - 1; if(edge && Math.random() < .55) continue; x.drawImage(PIXG, th.pr * 32, 0, 32, 32, tx * 32, ty * 32, 32, 32); }
  if(th.tint){ x.globalCompositeOperation = 'source-atop'; x.globalAlpha = th.tint[1] * .8; x.fillStyle = th.tint[0]; x.fillRect(0, 0, W2, H2); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; }
  return c; }
function pixTex(c){ const t = new T.Texture(c); t.magFilter = T.NearestFilter; t.minFilter = T.LinearMipmapLinearFilter; t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; t.needsUpdate = true; return t; }
/* 도트 장식 한 개 = 그림판에서 잘라 쓰는 세운 그림 */
let pixAtlasTex = null;
function pixSpr(k, x, z, sc, tilt){ const q = PIX[k]; if(!q) return null; if(!pixAtlasTex) pixAtlasTex = W.tex(PIXIMG); const s = new W.Spr(pixAtlasTex, { tilt:tilt == null ? .2 : tilt }); const fl = Math.random() < .5; s.frame(q[0], q[1], q[2], q[3], fl); s.place(x, 0, z, sc, null, null, fl); W.markStatic(s); W.objs.push(s); return s; }
const PROPIMG = {};
async function propImg(n){ if(PROPIMG[n] === undefined){ PROPIMG[n] = null; PROPIMG[n] = await J.loadImg('prop-' + n + '.png'); } return PROPIMG[n]; }

/* 땅 그림: 붓으로 칠한 느낌 (겹쳐도 이음새가 안 보이게 가장자리를 넘겨서 그려요) */
function paintGround(cols, size){ const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
  x.fillStyle = cols[0]; x.fillRect(0, 0, size, size);
  const blob = (px, py, r, col, a) => { for(const ox of [-size, 0, size]) for(const oy of [-size, 0, size]){ const g = x.createRadialGradient(px + ox, py + oy, 0, px + ox, py + oy, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); x.globalAlpha = a; x.fillStyle = g; x.fillRect(px + ox - r, py + oy - r, r * 2, r * 2); } x.globalAlpha = 1; };
  const hex = (h, a) => { const n = parseInt(h.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; };
  for(let i = 0; i < 90; i++) blob(Math.random() * size, Math.random() * size, J.rnd(40, 160), hex(cols[1 + (i % 3)], .9), J.rnd(.15, .4));
  for(let i = 0; i < 1600; i++){ const px = Math.random() * size, py = Math.random() * size, l = J.rnd(3, 9); x.strokeStyle = hex(cols[i % 2 ? 2 : 3], J.rnd(.15, .45)); x.lineWidth = J.rnd(1, 2.4); x.beginPath(); x.moveTo(px, py); x.lineTo(px + J.rnd(-2, 2), py - l); x.stroke(); }
  return c; }
function paintRoad(cols, w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  const hex = (hh, a) => { const n = parseInt(hh.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; };
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, hex(cols[0], 0)); g.addColorStop(.18, hex(cols[0], .85)); g.addColorStop(.5, hex(cols[0], 1)); g.addColorStop(.82, hex(cols[0], .85)); g.addColorStop(1, hex(cols[0], 0)); x.fillStyle = g; x.fillRect(0, 0, w, h);
  for(let i = 0; i < 260; i++){ const px = Math.random() * w, py = h * J.rnd(.2, .8), r = J.rnd(2, 6); for(const ox of [-w, 0, w]){ x.fillStyle = hex(cols[i % 2], J.rnd(.3, .7)); x.beginPath(); x.ellipse(px + ox, py, r * 1.6, r, 0, 0, 7); x.fill(); } }
  for(let i = 0; i < 40; i++){ const px = Math.random() * w, py = h * J.rnd(.15, .85); for(const ox of [-w, 0, w]){ const gg = x.createRadialGradient(px + ox, py, 0, px + ox, py, 60); gg.addColorStop(0, hex(cols[1], .35)); gg.addColorStop(1, hex(cols[1], 0)); x.fillStyle = gg; x.fillRect(px + ox - 60, py - 60, 120, 120); } }
  return c; }
/* 작은 장식 (덤불·꽃·바위·풀·수정)을 직접 그려요 */
function paintProp(kind, cols){ const c = document.createElement('canvas'), x = c.getContext('2d'); let w = 120, h = 90;
  if(kind === 'bush'){ w = 150; h = 100; c.width = w; c.height = h; for(let i = 0; i < 9; i++){ const px = J.rnd(30, w - 30), py = J.rnd(40, h - 22), r = J.rnd(18, 32); const g = x.createRadialGradient(px - r * .3, py - r * .4, 2, px, py, r); g.addColorStop(0, cols[3]); g.addColorStop(.6, cols[1]); g.addColorStop(1, cols[2]); x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); } }
  else if(kind === 'flower'){ w = 110; h = 50; c.width = w; c.height = h; const fc = ['#ff7aa8','#ffd84d','#ffffff','#b07aff','#ff9a4d']; for(let i = 0; i < 14; i++){ const px = J.rnd(8, w - 8), py = J.rnd(14, h - 6); x.strokeStyle = cols[2]; x.lineWidth = 2; x.beginPath(); x.moveTo(px, py); x.lineTo(px, py + 8); x.stroke(); x.fillStyle = J.pick(fc); for(let k = 0; k < 5; k++){ const a = k / 5 * 6.28; x.beginPath(); x.arc(px + Math.cos(a) * 3, py + Math.sin(a) * 3, 2.6, 0, 7); x.fill(); } x.fillStyle = '#fff3a0'; x.beginPath(); x.arc(px, py, 1.8, 0, 7); x.fill(); } }
  else if(kind === 'rock'){ w = 120; h = 80; c.width = w; c.height = h; const n = 7, pts = []; for(let i = 0; i < n; i++){ const a = Math.PI + i / (n - 1) * Math.PI; pts.push([60 + Math.cos(a) * J.rnd(40, 55), 76 + Math.sin(a) * J.rnd(38, 64)]); }
    const g = x.createLinearGradient(0, 10, 0, 80); g.addColorStop(0, '#d8d4cc'); g.addColorStop(1, '#6e6a72'); x.fillStyle = g; x.beginPath(); x.moveTo(pts[0][0], 78); pts.forEach(p => x.lineTo(p[0], p[1])); x.lineTo(pts[n - 1][0], 78); x.closePath(); x.fill(); x.strokeStyle = 'rgba(40,36,50,.5)'; x.lineWidth = 3; x.stroke(); x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.ellipse(48, 36, 14, 7, -.4, 0, 7); x.fill(); }
  else if(kind === 'crystal'){ w = 90; h = 120; c.width = w; c.height = h; const hue = J.pick(['#7fe3ff','#c79bff','#ff8fd0']); for(let i = 0; i < 4; i++){ const px = J.rnd(25, 65), ht = J.rnd(50, 110), wd = J.rnd(10, 18); const g = x.createLinearGradient(px - wd, 0, px + wd, 0); g.addColorStop(0, '#ffffff'); g.addColorStop(.4, hue); g.addColorStop(1, '#2a2a5a'); x.fillStyle = g; x.beginPath(); x.moveTo(px - wd, 118); x.lineTo(px - wd * .6, 118 - ht * .8); x.lineTo(px, 118 - ht); x.lineTo(px + wd * .6, 118 - ht * .8); x.lineTo(px + wd, 118); x.closePath(); x.fill(); } }
  else { w = 80; h = 50; c.width = w; c.height = h; for(let i = 0; i < 22; i++){ const px = J.rnd(6, w - 6), l = J.rnd(14, 40); x.strokeStyle = J.pick([cols[1], cols[2], cols[3]]); x.lineWidth = J.rnd(2, 3.5); x.beginPath(); x.moveTo(px, h); x.quadraticCurveTo(px + J.rnd(-6, 6), h - l * .6, px + J.rnd(-10, 10), h - l); x.stroke(); } }
  return c; }

/* ===== 스테이지 세상 만들기 ===== */
W.objs = [];
W.clear = function(){ for(const o of W.objs){ if(o.dispose) o.dispose(); else { W.scene.remove(o); if(o.geometry) o.geometry.dispose(); if(o.material){ if(o.material.map) o.material.map.dispose(); o.material.dispose(); } } } W.objs = []; W.clouds = []; };
W.build = async function(th, L){
  W.clear(); W.th = th; W.L = L;
  /* 하늘 */
  const sky = await J.loadImg('sky-' + ('0' + th.sky).slice(-2) + '.jpg');
  if(W.skyTex) W.skyTex.dispose(); W.skyTex = sky ? W.texSmooth(sky) : null; if(W.skyTex){ W.skyTex.wrapS = T.MirroredRepeatWrapping; } W.skyQuad.material.map = W.skyTex; W.skyQuad.material.needsUpdate = true; W.fitSky();
  W.scene.fog.color.set(th.fog); W.R.setClearColor(th.fog);
  const pix = await pixLoad(); if(pixAtlasTex){ pixAtlasTex.dispose(); pixAtlasTex = null; }
  /* 땅 (넓게 깔기) */
  const gw = L + 5000, gd = 7000;
  let gt; if(pix){ gt = pixTex(pixGround(th)); gt.repeat.set(gw / 2048, gd / 2048); } else { gt = W.texSmooth(paintGround(['#5fae3e','#7cc64c','#4b9634','#9ad86a'], 1024), true); gt.repeat.set(gw / 900, gd / 900); }
  const gg = new T.PlaneGeometry(gw, gd, Math.ceil(gw / 70), 90); gg.rotateX(-Math.PI / 2);
  const ground = new T.Mesh(gg, curve(new T.MeshBasicMaterial({ map:gt }))); ground.position.set(L / 2, 0, -gd / 2 + 900); ground.renderOrder = 0; W.scene.add(ground); W.objs.push(ground);
  /* 길 */
  let rt; if(pix){ rt = pixTex(pixRoad(th)); } else rt = W.texSmooth(paintRoad(['#d8bf86','#c7a86e'], 1024, 256), true);
  rt.wrapT = T.ClampToEdgeWrapping; rt.repeat.set((L + 1600) / 2048, 1);
  const rd = (W.Z1 - W.Z0) + 140, rg = new T.PlaneGeometry(L + 1600, rd, Math.ceil((L + 1600) / 60), 6); rg.rotateX(-Math.PI / 2);
  const road = new T.Mesh(rg, curve(new T.MeshBasicMaterial({ map:rt, transparent:true, depthWrite:false, alphaTest:.5 }))); road.position.set(L / 2, .8, (W.Z0 + W.Z1) / 2); road.renderOrder = 2; W.scene.add(road); W.objs.push(road);
  /* 나무·장식: 길 뒤쪽은 큰 도트 나무 숲, 길 가까이는 작은 장식, 앞쪽은 낮은 것만 */
  const big = (await Promise.all((th.dp || []).map(propImg))).filter(Boolean).map(im => W.tex(im));
  if(pix){
    for(let row = 0; row < 3; row++){ const z0 = [-330, -700, -1150][row]; for(let x = -1000; x < L + 1000; x += J.rnd(120, 230) * (1 + row * .3)){ const k = J.pick(th.tr), q = PIX[k]; const sc = (q[3] > 50 ? 4.6 : 3.6) * J.rnd(.85, 1.15); pixSpr(k, x, z0 + J.rnd(-90, 90), sc, .14); } }
    for(let x = -900; x < L + 900; x += J.rnd(70, 170)) pixSpr(J.pick(th.sm), x, J.rnd(W.Z0 - 150, W.Z0 - 40), J.rnd(2.6, 3.4), .25);
    for(let x = -700; x < L + 700; x += J.rnd(240, 480)){ const low = th.sm.filter(k => PIX[k] && PIX[k][3] <= 32); if(low.length) pixSpr(J.pick(low), x, J.rnd(W.Z1 + 70, W.Z1 + 260), J.rnd(2.6, 3.2), .35); }
    for(let x = -500; x < L + 500 && big.length; x += J.rnd(700, 1300)){ const sp = new W.Spr(J.pick(big), { tilt:.16 }); sp.place(x, 0, J.rnd(-900, -450), J.rnd(1, 1.4), null, null, Math.random() < .5); W.markStatic(sp); W.objs.push(sp); }
  } else {
    const small = ['bush','flower','rock','grass'].map(k => W.tex(paintProp(k, ['#5fae3e','#7cc64c','#4b9634','#9ad86a'])));
    for(let x = -900; x < L + 900; x += J.rnd(180, 340)){ const s2 = new W.Spr(J.pick(small), { tilt:.25 }); s2.place(x, 0, J.rnd(-700, W.Z0 - 30), J.rnd(.9, 1.4), null, null, Math.random() < .5); W.markStatic(s2); W.objs.push(s2); } }
  /* 구름 */
  W.clouds = []; const cl = (await Promise.all(['cloud1','cloud2','cloud3'].map(n => J.loadImg('fx-' + n + '.png')))).filter(Boolean).map(im => W.texSmooth(im));
  for(let i = 0; i < 9 && cl.length; i++){ const s = new W.Spr(J.pick(cl), { tilt:0, fog:false }); s.alpha = .75; s.cx = J.rnd(-1500, L + 1500); s.cy = J.rnd(500, 1300); s.cz = J.rnd(-3400, -2400); s.sc = J.rnd(1.4, 2.6); s.v = J.rnd(8, 22); W.clouds.push(s); W.objs.push(s); }
};
W.fitSky = function(){ const t = W.skyTex; if(!t) return; const ia = t.image.width / t.image.height, ca = W.cw / W.ch; if(ca < ia){ t.repeat.set(ca / ia, 1); } else t.repeat.set(1, ia / ca); };
W.portal = function(x, z){ /* 보스 문 (빛 기둥) */
  const c = document.createElement('canvas'); c.width = 128; c.height = 256; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 128, 0); gr.addColorStop(0, 'rgba(160,120,255,0)'); gr.addColorStop(.5, 'rgba(220,200,255,.95)'); gr.addColorStop(1, 'rgba(160,120,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 256);
  const vg = g.createLinearGradient(0, 0, 0, 256); vg.addColorStop(0, 'rgba(0,0,0,1)'); vg.addColorStop(.3, 'rgba(0,0,0,0)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = vg; g.fillRect(0, 0, 128, 256);
  const s = new W.Spr(W.texSmooth(c), { tilt:.1, add:true }); s.place(x, 0, z, 1.6); W.objs.push(s); return s; };

/* ===== 매 프레임: 카메라 · 하늘 · 구름 ===== */
const tv = new T.Vector3();
W.follow = function(x, z, dt){ const c = W.cam;
  W.tx = W.tx == null ? x : W.tx + (x - W.tx) * Math.min(1, dt * 5); W.tz = W.tz == null ? z : W.tz + (z - W.tz) * Math.min(1, dt * 3);
  U.uCurve.value = J.CFG.curve; U.uCurveX.value = J.CFG.curve * 3; U.uCam.value.set(W.tx, W.tz);
  const d = W.dist / W.zoom, pitch = .43, tr = W.shake * W.shake;
  c.position.set(W.tx + J.rnd(-1, 1) * tr * 26, 60 + Math.sin(pitch) * d + J.rnd(-1, 1) * tr * 18, W.tz + 40 + Math.cos(pitch) * d);
  c.lookAt(W.tx, 40, W.tz - 170); c.fov = 40 + W.fovK; c.updateProjectionMatrix();
  W.shake = Math.max(0, W.shake - dt * 1.9); W.zoom += (1 - W.zoom) * Math.min(1, dt * 6); W.fovK *= Math.max(0, 1 - dt * 6);
  if(W.skyTex){ W.skyTex.offset.x = (W.tx / 5200) % 2; W.skyTex.offset.y = (1 - W.skyTex.repeat.y) * .5; }
  { const fc = !(J.CFG.curve > 0); if(W._fc !== fc){ W._fc = fc; for(const o of W.objs) if(o.stat) o.mesh.frustumCulled = fc; } }
  for(const s of W.clouds){ s.cx += s.v * dt; if(s.cx > W.tx + 3000) s.cx -= 6000; s.place(s.cx, s.cy, s.cz, s.sc); } };
W.render = function(){ const r = W.R; r.clear(); r.render(W.skyScene, W.skyCam); r.clearDepth(); r.render(W.scene, W.cam); };
/* 3D 자리 → 화면 픽셀 (글자·체력바를 그 위에 그리려고) */
W.proj = function(x, y, z){ tv.set(x, y - W.curveAt(x, z), z).project(W.cam); return [(tv.x + 1) / 2 * W.cw, (1 - tv.y) / 2 * W.ch, tv.z]; };
/* 화면을 누른 자리 → 땅 위 자리 */
const ray = new T.Raycaster(), plane = new T.Plane(new T.Vector3(0, 1, 0), 0), hit = new T.Vector3();
W.unproj = function(px, py){ ray.setFromCamera({ x:px / W.cw * 2 - 1, y:-(py / W.ch * 2 - 1) }, W.cam); return ray.ray.intersectPlane(plane, hit) ? [hit.x, hit.z] : null; };
})(window.J);
