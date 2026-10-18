/* 정도 RPG — 싸움 · 몬스터 · 보스 패턴 · 자동 사냥 · 진행 */
'use strict';
(function(J){
const W = J.W, C = () => J.CFG, rnd = J.rnd, clamp = J.clamp, pick = J.pick, fmt = J.fmt;
/* 타격감 세기: 전체(fxAll) × 각 항목. 에디터의 ✨ 타격감 숫자로 바꿔요 */
const FK = k => { const c = C(), a = c.fxAll == null ? 1 : c.fxAll, v = c[k] == null ? 1 : c[k]; return Math.max(0, a * v); };
const zk = z => 1 + (z - 1) * FK('fxZoom');
const G = J.G = { st:0, phase:'field', kills:0, quota:18, boss:null, hid:null, pot:3, php:100, pmax:100, auto:true, combo:0, comboT:0, comboTimer:0, over:0, banner:null, admin:{ god:false, one:false } };
G.repeat = !!J.LS.get('rpg_repeat', false);   /* [v10] 켜면 보스를 깨도 다음 스테이지로 안 가고 같은 스테이지를 반복 */
const H = J.HERO = { x:200, z:0, y:0, vx:0, vz:0, vy:0, face:1, st:'idle', t:0, dist:0, ci:0, queued:false, inv:0, hurtT:0, cd:{ s1:0, s2:0, s3:0, r:0 }, ghosts:[], dir:'r' };
let MON = [], ZN = [], FXS = [], PT = [], DN = [], COINS = [], SPAWNS = [];
const CP = { x:100, z:0, t:0, st:'b', at:0, cd:1, tgt:null, done:false, face:1 };
let stopT = 0, slowT = 0, flashA = 0, flashC = '#fff';
J.mons = () => MON;

/* ===== 소리 줄임말 ===== */
const S = (k, v) => J.SND.play(k, v);

/* ===== 그림 준비 ===== */
let HERO_ART = null, heroSpr = null, heroSh = null, cpSpr = null, cpSh = null, cpKey = '';
const DLT = {}; /* 듀얼리스트 유닛 텍스처 */
function dlTex(u){ if(!u.im) return null; if(!DLT[u.k]) DLT[u.k] = W.tex(u.im); return DLT[u.k]; }
const IMT = new Map(); /* [v12] 스테이지마다 새로 읽은 그림이 계속 쌓이지 않게 beginStage에서 비워요 */
function imTex(im){ if(!IMT.has(im)) IMT.set(im, W.tex(im)); return IMT.get(im); }
/* [rpg-v35] 🃏 카드광대: 끝말잇기와 같은 그림·확률(L.CLN.p%) · 일반 몬스터 자리에 나오고, 잡으면 카드 1장 + 뽑기권 (L.clownKill) */
let CLNIM = null, clnTry = false;
function clnOk(){ const L = J.L; if(!L || !L.CLN || !L.treArt || !L.clownKill) return false;
  if(window.jdpOn && !window.jdpOn('treas')) return false;
  if(!clnTry){ clnTry = true; try{ const svg = L.treArt('cln').replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" '); J.loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)).then(im => { CLNIM = im; }); }catch(e){ console.warn('cln', e); } }
  return !!CLNIM && Math.random() * 100 < L.CLN.p; }
J.refreshHero = async function(){
  const tfLook = J.LS.get('rpg_tflook', false), s = J.stats();
  H.tfU = null;
  if(tfLook && s.tf && J.DLB[s.tf]){ const u = J.DLB[s.tf]; await J.dlPack(u.p); if(u.im) H.tfU = u; }
  if(!H.tfU){ const art = await J.buildHero(); if(art){ HERO_ART = art; HERO_ART.tex = W.tex(art.canvas); } }
  /* [v20] 걷기 그림이 없는 장비가 있어도 남자 몸 방향별 모션(HERO_ART)은 그대로 쓰고, 없는 장비만 빠져요 (예전엔 여자 몸 '옷 입힌 그림'으로 바뀌었어요). '옷 입힌 그림'은 HERO_ART를 못 만들었거나 rpg_dress를 켠 때만 써요 */
  H.dress = null;
  if(!H.tfU && J.L && J.L.pack && J.L.draw && (!HERO_ART || J.LS.get('rpg_dress', false))){
    try{ const P = J.L.pack, c = document.createElement('canvas'); c.width = P.W || 288; c.height = P.H || 251; const x = c.getContext('2d', { willReadFrequently:true });
      let okd = false; for(let i = 0; i < 20 && !okd; i++){ okd = J.L.draw(c, x, performance.now(), null); if(!okd) await new Promise(r => setTimeout(r, 150)); }
      if(okd){ await new Promise(r => setTimeout(r, 300)); J.L.draw(c, x, performance.now(), null); const d = x.getImageData(0, 0, c.width, c.height).data; let x0 = c.width, x1 = 0, y0 = c.height, y1 = 0;
        for(let yy = 0; yy < c.height; yy++) for(let xx = 0; xx < c.width; xx++) if(d[(yy * c.width + xx) * 4 + 3] > 20){ if(xx < x0) x0 = xx; if(xx > x1) x1 = xx; if(yy < y0) y0 = yy; if(yy > y1) y1 = yy; }
        if(x1 > x0){ const t = W.tex(c); H.dress = { c, x, tex:t, foot:[(x0 + x1) / 2, y1 + 1], sc:clamp(195 / Math.max(40, y1 - y0), 1, 3.2) }; } } }catch(e){ console.warn('dress', e); } }
  if(heroSpr){ heroSpr.dispose(); heroSpr = null; }
  const tex = H.tfU ? dlTex(H.tfU) : H.dress ? H.dress.tex : HERO_ART && HERO_ART.tex; if(tex) heroSpr = new W.Spr(tex);
  if(!heroSh) heroSh = new W.Shadow(36);
  G.pmax = J.stats().hp; G.php = Math.min(G.php || G.pmax, G.pmax);
  J.eqSig = eqSig(); };
function eqSig(){ try{ const s = J.share(); return JSON.stringify(J.L ? J.L.eq : null) + '|' + JSON.stringify(J.L ? J.L.hid : null) + '|' + s.tf + '|' + s.cp + '|' + J.LS.get('rpg_hair', '') + '|' + J.LS.get('rpg_tflook', false) + '|' + JSON.stringify(J.LS.get('rpg_layers', null)); }catch(_){ return ''; } }
setInterval(() => { if(J.ready && !J.paused && !J._rhBusy && eqSig() !== J.eqSig){ J._rhBusy = true; Promise.resolve(J.refreshHero()).catch(e => console.warn('hero', e)).then(() => { J._rhBusy = false; }); } }, 1500);   /* [v12] 옷 입힌 그림 만드는 중에 또 시작하지 않게 */

/* [v24] 레이어 순서 창 도우미: 지금 영웅 그림을 알려주고, 순서를 바꾸면 0.25초 뒤 바로 다시 만들어요(다른 그림 만들기와 겹치지 않게 기다려요) */
J.heroArt = () => HERO_ART;
J.applyLayers = function(){ clearTimeout(J._lyT); J._lyT = setTimeout(async function run(){ if(J._rhBusy){ J._lyT = setTimeout(run, 300); return; } J._rhBusy = true; try{ await J.refreshHero(); }catch(e){ console.warn('layer', e); } J._rhBusy = false; }, 250); };

/* ===== 파티클 · 숫자 · 이펙트 (화면 위에 그리는 것들) ===== */
function sparks(x, y, z, n, col, sp){ n = Math.round(n * FK('fxSpark')); for(let i = 0; i < n; i++){ const a = rnd(0, 6.283), v = rnd(.4, 1) * (sp || 520); PT.push({ k:'spark', x, y, z, vx:Math.cos(a) * v, vy:Math.sin(a) * v * .8 + 180, vz:rnd(-80, 80), g:-1100, t:0, life:rnd(.18, .38), col:col || '#fff6c8', w:rnd(2, 4) }); } }
function dust(x, z, n, sp){ for(let i = 0; i < n; i++) PT.push({ k:'dust', x:x + rnd(-14, 14), y:rnd(2, 10), z:z + rnd(-6, 6), vx:rnd(-1, 1) * (sp || 60), vy:rnd(10, 40), vz:rnd(-20, 20), g:0, t:0, life:rnd(.35, .6), col:'#e8dcc0', r:rnd(5, 10) }); }
function chunks(x, y, z, n, col){ for(let i = 0; i < n; i++) PT.push({ k:'chunk', x, y, z, vx:rnd(-1, 1) * 380, vy:rnd(260, 620), vz:rnd(-120, 120), g:-1500, t:0, life:rnd(.5, .9), col:col || '#c9b', r:rnd(3, 6), rot:rnd(0, 6), vr:rnd(-12, 12) }); }
function ring(x, z, col, r1){ PT.push({ k:'ring', x, y:2, z, t:0, life:.3, col:col || '#fff', r1:r1 || 90 }); }
function num(x, y, z, v, kind){ const sup = kind === 'sup', crit = kind === 'crit' || sup, big = kind === 'big';
  DN.push({ x:x + rnd(-14, 14), y, z, vx:rnd(-40, 40), vy:crit || big ? 420 : 340, t:0, txt:(kind === 'hurt' ? '-' : '') + fmt(v), col:kind === 'hurt' ? '#ff6b6b' : sup ? '#ff6bf0' : crit ? '#ffd34d' : big ? '#ff9a3c' : kind === 'cp' ? '#8ff3e0' : '#ffffff', sz:sup ? 52 : crit ? 40 : big ? 46 : kind === 'cp' ? 22 : 28, crit:crit || big, sup }); }
function label(x, y, z, txt, col, sz){ DN.push({ x, y, z, vx:0, vy:120, t:0, txt, col, sz:sz || 22, lab:true }); }
J.label = label;
function fx(name, x, y, z, o){ const f = J.FX[name]; if(!f) return null; o = o || {}; if(!f.tex) f.tex = W.tex(f.im);
  const s = new W.Spr(f.tex, { add:o.add !== false, tilt:.3 }); const e = { f, s, x, y, z, t:0, rate:o.rate || 16, sc:(o.sc || 1) * f.s * 1.6, flip:!!o.flip, vx:o.vx || 0, vy:o.vy || 0, loop:o.loop || 0, life:o.life || 0 }; FXS.push(e); fxDraw(e); return e; }
function fxDraw(e){ const f = e.f, i = Math.floor(e.t * e.rate) % f.n; e.s.frame((i % f.c) * f.w, Math.floor(i / f.c) * f.h, f.w, f.h, e.flip); e.s.place(e.x, e.y - f.h * e.sc / 2, e.z + 30, e.sc); }
function hitStop(s){ stopT = Math.max(stopT, s * FK('fxStop')); }
function shake(a){ W.shake = Math.min(1, W.shake + a * FK('fxShake')); }

/* ===== 몬스터 ===== */
function region(){ return J.REG.length ? J.REG[G.st % J.REG.length] : null; }
async function prepAssets(){
  const rg = region(), A = { mob:[], boss:null, dl:[], bossDl:null };
  if(rg){ A.mob = (await Promise.all(rg.mob.slice(0, 8).map(i => J.loadImg(J.LIB.mob[i])))).filter(Boolean); if(rg.boss.length) A.boss = await J.loadImg(J.LIB.boss[pick(rg.boss)]); }
  if(J.DL){ const low = J.DL.units.filter(u => u.g <= 2 && u.p <= 3), sel = [], seed = G.st * 7919 + 13;
    for(let i = 0; i < 3 && low.length; i++) sel.push(low[(seed + i * 131) % low.length]);
    const hi = J.DL.units.filter(u => u.g >= 4 && u.p <= 3); if(hi.length) A.bossDl = hi[(seed + 17) % hi.length];
    await Promise.all([...new Set(sel.concat(A.bossDl ? [A.bossDl] : []).map(u => u.p))].map(J.dlPack));
    A.dl = sel.filter(u => u.im); if(A.bossDl && !A.bossDl.im) A.bossDl = null; }
  if(G.hid) A.hidIm = await J.loadImg(G.hid.img && G.hid.img.boss);
  G.A = A; }
function mkMon(kind, x, z, boss, minion){
  const st = G.st, A = G.A || {}; let hp = boss ? 300 + 60 * st : 140 + 25 * st, atk = (20 + 2 * st) * (boss ? 2 : 1);
  hp *= Math.pow(1.1, Math.floor(st / 10)) * C().monHp; atk *= Math.pow(1.05, Math.floor(st / 10)) * C().monAtk;
  if(boss) hp *= C().bossHp;
  const el = !boss && !minion && Math.random() < .08; if(el){ hp *= 2; atk *= 1.3; }
  if(minion){ hp *= .5; atk *= .6; }
  const m = { armor:0, stun:0, x, z, y:boss ? 900 : 700, vx:0, vz:0, vy:0, face:-1, boss:!!boss, el, minion:!!minion, hid:false, st:'spawn', t:0, at:0, cd:rnd(.6, 1.4), flash:0, hp, max:hp, atk, nm:'', im:null, dl:null, u:null, shk:0, ang:0, va:0, hb:1, hbT:0, slot:rnd(-1, 1), home:x, aggro:!!boss || !!minion, wander:0 };
  if(boss && G.hid){ m.hid = true; m.hp = m.max = (G.hid.hpB + G.hid.hpP * st) * 2 * C().monHp; m.atk = G.hid.aB + G.hid.aP * st; m.im = A.hidIm; m.nm = '🕳 ' + G.hid.nm; }
  else if(kind === 'dl' || (boss && !A.boss && A.bossDl)){ const u = boss ? A.bossDl : pick(A.dl); const gr = boss ? 3 + (Math.random() * 3 | 0) : (el ? 3 : u.g - 1);
    m.u = u; m.dl = { gn:J.DLG.nm[gr], col:J.DLG.col[gr], gold:J.DLG.gold[gr] }; m.hp = m.max = hp * J.DLG.hp[gr] / (boss ? 1.6 : 1); m.atk = atk * J.DLG.atk[gr]; m.nm = (boss ? '👑 ' : '') + u.ko; }
  else { m.im = boss ? A.boss : pick(A.mob); m.nm = boss ? '👑 지역 보스' : el ? '⭐ 정예 몬스터' : '몬스터'; }
  if(!boss && !minion && !el && !m.hid && clnOk()){ m.cln = true; m.u = null; m.dl = null; m.im = CLNIM; m.hp *= 1.5; m.nm = '🃏 카드광대'; }   /* [rpg-v35] */
  m.hp = m.max = Math.round(m.hp); m.atk = Math.round(m.atk);
  if(m.u){ const bb = m.u.bb; m.sc = boss ? 3.4 : 2.6; m.w = (bb[2] - bb[0]) * m.sc; m.h = (bb[3] - bb[1]) * m.sc; m.spr = new W.Spr(dlTex(m.u)); }
  else if(m.im){ m.h = (boss ? 300 : 170) * (el ? 1.15 : 1) * (minion ? .8 : 1); m.w = m.im.width * m.h / m.im.height; m.spr = new W.Spr(imTex(m.im)); }
  else { m.h = boss ? 200 : 110; m.w = m.h; }
  m.r = clamp(m.w * .36, 26, 120); m.range = m.r + 70; m.spd = boss ? 105 : rnd(85, 125);
  /* 브레이크 방패 (참고: 옥토패스 트래블러) — 보스·정예·영웅 이상 듀얼리스트 몬스터. 방패를 다 깨면 기절 + 데미지 1.5배 */
  m.shMax = boss ? Math.min(16, 8 + Math.floor(G.st / 5)) : (el || (m.dl && ['영웅','전설','신화','유일'].includes(m.dl.gn))) ? 5 : 0; m.sp = m.shMax; m.broken = 0;
  m.sh = new W.Shadow(m.r);
  MON.push(m); return m; }
function killMonVisual(m){ if(m.spr){ m.spr.dispose(); m.spr = null; } if(m.sh){ m.sh.dispose(); m.sh = null; } }

/* 맵 곳곳의 사냥터 (메이플처럼 맵 전체에 몬스터가 살아요) */
function fieldSpawns(){ SPAWNS = []; const L = W.L; for(let x = 650; x < L - 450; x += rnd(300, 420)) SPAWNS.push({ x, n:0 }); }
function spawnField(sp){ const A = G.A || {}; const useDl = A.dl && A.dl.length && (!A.mob || !A.mob.length || Math.random() < .35);
  const m = mkMon(useDl ? 'dl' : 'img', sp.x + rnd(-120, 120), rnd(W.Z0 + 20, W.Z1 - 20), false); m.sp = sp; sp.n++; m.home = m.x; return m; }
function fieldCount(){ return MON.filter(m => !m.boss && !m.minion && m.st !== 'dead').length; }
let respawnT = 0;

/* ===== 맞기 · 쓰러뜨리기 ===== */
function hurtMon(m, dmg, o){ if(m.st === 'dead') return; o = o || {};
  if(m.broken > 0) dmg = Math.round(dmg * 1.5);
  if(G.admin.one) dmg = Math.max(dmg, m.hp);
  if(m.shMax && m.broken <= 0 && m.st !== 'spawn'){ m.sp -= (o.kind === 'crit' || o.kind === 'sup' || o.kind === 'big') ? (o.kind === 'sup' ? 3 : 2) : 1; m.shHit = .25; if(m.sp <= 0){ m.sp = 0; breakMon(m); } }
  m.hp -= dmg; m.flash = .09; m.shk = .12; m.hbT = 1.4; m.aggro = true; G.combo++; G.comboT = 2.2; J.target = m;
  const dir = o.dir || (m.x >= H.x ? 1 : -1), wall = (dir > 0 ? m.x > W.L - 80 : m.x < 80) ? .2 : 1, kb = (o.kb || 220) * (m.boss ? .1 : 1) * wall;
  m.vx += dir * kb;
  if(o.launch && !m.boss) m.vy = Math.max(m.vy, o.launch);
  /* 계속 맞기만 하면 잠깐 '버티기'(노란 빛) — 몬스터도 반격할 틈이 있어야 재밌어요. 보스는 경직 없음 */
  if(!m.boss && m.armor <= 0 && m.st !== 'spawn' && m.st !== 'cast' && m.st !== 'broken'){ if(m.st === 'wind') label(m.x, m.h + 60, m.z, '끊었다!', '#7fe3ff', 20); m.st = 'hurt'; m.t = 0; m.stun = (m.stun || 0) + .32; if(m.stun > 1.1){ m.armor = 1.4; m.stun = 0; } }
  num(m.x, m.y + m.h * .8, m.z, dmg, o.kind || 'n');
  if(m.hp <= 0) killMon(m, o); }
function breakMon(m){ m.broken = m.boss ? 4 : 3; m.st = 'broken'; m.t = 0; m.vx += (m.x >= H.x ? 1 : -1) * 260 * (m.boss ? .3 : 1);
  if(m.boss){ for(const q of ZN){ q.done = true; if(q.safes) q.safes.forEach(sz => sz.dispose()); } m.pat = null; m.leap = null; m.dash = null; m.y = 0; }
  label(m.x, m.h + 110, m.z, 'BREAK!', '#7fe3ff', 46); for(let i = 0; i < 18; i++){ const a = rnd(0, 6.283); PT.push({ k:'chunk', x:m.x, y:m.h * .6, z:m.z, vx:Math.cos(a) * rnd(200, 520), vy:rnd(200, 600), vz:rnd(-80, 80), g:-1400, t:0, life:rnd(.6, 1), col:J.pick(['#bff4ff','#7fe3ff','#ffffff']), r:rnd(3, 7), rot:rnd(0, 6), vr:rnd(-14, 14) }); }
  ring(m.x, m.z, '#7fe3ff', 220); S('crit'); S('slam', .5); hitStop(.14); slowT = Math.max(slowT, .35); shake(.45); flashA = .3; flashC = '#bff4ff'; W.zoom = zk(1.06); }
function rewardEl(m){ /* 끝말잇기 아이템 날아가는 연출이 시작될 자리 */ const p = W.proj(m.x, m.y + m.h * .5, m.z), e = J.$('dropAnchor'); e.style.left = p[0] + 'px'; e.style.top = p[1] + 'px'; return e; }
function killMon(m, o){
  m.st = 'dead'; m.t = 0; m.hp = 0; const dir = (o && o.dir) || (m.x >= H.x ? 1 : -1);
  if(!m.u){ m.vy = Math.max(m.vy, 520); m.va = dir * rnd(8, 14); m.vx = dir * 320; } else m.vx = dir * 160;
  chunks(m.x, m.y + m.h * .45, m.z, m.boss ? 22 : 10, m.dl ? m.dl.col : '#e8d7b0'); ring(m.x, m.z, '#fff', m.boss ? 180 : 100);
  hitStop(m.boss ? .22 : .08); shake(m.boss ? .9 : .25); S(m.boss ? 'mdie2' : 'mdie', m.boss ? 1 : .8);
  if(m.minion) return;
  if(!m.boss){ G.kills++; if(m.sp) m.sp.n--; if(G.kills === G.quota) bossGateOpen(); }
  /* 보상: 끝말잇기와 같은 시스템 (골드·큐브·뽑기권·장비) */
  const L = J.L, el = rewardEl(m); let gold = 0;
  try{ if(L && L.goldKill) gold = Math.round(L.goldKill(G.st, m.boss, m.el, m.hid) * C().goldMul * (m.dl ? Math.sqrt(m.dl.gold) : 1)); }catch(_){ }
  if(!gold){ const s = J.stats(); gold = Math.round((60 + 12 * G.st) * (m.boss ? 5 : 1) * (m.el ? 3 : 1) * (1 + 1.5 * s.tier) * C().goldMul); }
  const cub = {}; const rr = v => { v *= C().cubeMul; let n = Math.floor(v); if(Math.random() < v - n) n++; return n; };
  if(m.boss){ cub.red = rr(2); cub.black = rr(2); cub.sus = rr(5); } else { cub.sus = rr(1); if(Math.random() < .2 * C().cubeMul) cub[Math.random() < .5 ? 'red' : 'black'] = 1; }
  if(L && L.addGold){ L.addGold(gold); try{ L.addCubes(cub); }catch(_){ } try{ if(Math.random() * 100 < C().ticketP || m.boss) L.dlxKill(m.hid ? 'hid' : m.boss ? 'boss' : m.el ? 'elite' : 'mob', null, el); else if(L.bonKill) L.bonKill(); }catch(_){ }   /* [rpg-v35] 뽑기권을 안 줘도 업적 처치 수는 매번 쌓아요 */
    try{ if(Math.random() * 100 < (m.boss ? C().dropBoss : m.el ? C().dropP * 3 : C().dropP)){ window.RPG.st = G.st; L.drop(m.boss, el, m.hid ? 'h' + (G.hid.i || 0) : G.st); S('loot'); } }catch(e){ console.warn(e); } }
  else J.fallbackReward(gold, cub);
  if(m.cln){ try{ L.clownKill(el); label(m.x, m.h + 120, m.z, '🃏 카드광대 선물!', '#ffd23f', 26); }catch(e){ console.warn(e); } }   /* [rpg-v35] */
  const nc = m.boss ? 14 : m.el ? 6 : 3; for(let i = 0; i < nc; i++) COINS.push({ x:m.x, z:m.z, y:m.h * .5, vx:rnd(-1, 1) * 240, vz:rnd(-1, 1) * 60, vy:rnd(380, 680), t:0, v:i === 0 ? gold : 0 });
  let k = 0; [['sus','🔷'],['red','🟥'],['black','⬛']].forEach(([c, e]) => { if(cub[c]) label(m.x + 50, m.h + 80 + (k++) * 28, m.z, e + '×' + cub[c], '#e6f6ff', 20); });
  if(m.boss) bossDown(m); }
J.fallbackReward = async function(g, c){ const v = Number(await J.kget('gold')) || 0; await J.kset('gold', v + g); const cb = (await J.kget('cube')) || {}; Object.keys(c).forEach(k => cb[k] = (cb[k] || 0) + (c[k] || 0)); await J.kset('cube', cb); };

/* ===== 영웅 ===== */
/* [rpg-v34] 치명타·극치명타: 끝말잇기 쪽 LOOT.critRoll 과 같은 계산 (기본 15% · 도감 치명 · 전직 · 각성 · 세트로 올라가요) */
function heroDmg(mul){ const s = J.stats(); let cr, sup = false, k = 1.5;
  try{ if(J.L && J.L.critRoll){ const r = J.L.critRoll({}); cr = r.cr; sup = r.sup; if(cr) k = r.mul; } else cr = Math.random() < .15 + (s.crit || 0) / 100; }catch(_){ cr = Math.random() < .15 + (s.crit || 0) / 100; }
  return { d:Math.max(1, Math.round(s.atk * mul * (cr ? k : 1) * rnd(.9, 1.1))), cr, sup }; }
function inFront(m, reach, depth){ const dx = (m.x - H.x) * H.face; return dx > -20 - m.r * .3 && dx < reach + m.r && Math.abs(m.z - H.z) < depth; }
function alive(m){ return m.st !== 'dead' && m.st !== 'spawn'; }
function canAct(){ return H.st === 'idle' || H.st === 'walk'; }
function nearest(maxD){ let b = null, bd = maxD || 1e9; for(const m of MON){ if(!alive(m)) continue; const d = Math.abs(m.x - H.x) + Math.abs(m.z - H.z) * 1.6; if(d < bd){ bd = d; b = m; } } return b; }
J.nearest = nearest;
const ATK = [ { w:.07, end:.26, reach:150, depth:62, kb:200, lunge:26 }, { w:.06, end:.24, reach:155, depth:62, kb:220, lunge:30 }, { w:.12, end:.42, reach:185, depth:78, kb:520, lunge:46, launch:520 } ];
J.doAttack = function(){ if(G.over) return; if(H.st === 'atk'){ if(H.t > .1) H.queued = true; return; } if(!canAct()) return;
  const t = nearest(500); if(t && Math.abs(t.x - H.x) > 8) H.face = t.x > H.x ? 1 : -1;
  if(G.comboTimer <= 0) H.ci = 0; H.st = 'atk'; H.t = 0; H.hitSet = new Set(); H.queued = false; H.struck = false; S('swing' + (H.ci + 1)); };
function strike(){ const a = ATK[H.ci], mul = C().combo[H.ci]; let any = false, crit = false;
  for(const m of MON){ if(!alive(m) || H.hitSet.has(m) || !inFront(m, a.reach, a.depth)) continue;
    H.hitSet.add(m); const h = heroDmg(mul); any = true; crit = crit || h.cr;
    hurtMon(m, h.d, { dir:H.face, kb:a.kb, launch:a.launch, kind:h.sup ? 'sup' : h.cr ? 'crit' : 'n', stagger:H.ci === 2 });
    sparks(m.x - H.face * m.r * .4, m.y + m.h * .5, m.z, h.cr ? 16 : 9, h.cr ? '#ffe27a' : '#fff6c8');
    fx(H.ci === 2 ? 'impact' : 'clawslash', m.x - H.face * m.r * .3, m.y + m.h * .55, m.z, { sc:H.ci === 2 ? 1.6 : 1.2, flip:H.face < 0 }); }
  if(any){ S(crit || H.ci === 2 ? 'crit' : 'hit' + (1 + (Math.random() * 3 | 0))); hitStop(H.ci === 2 ? .11 : crit ? .085 : .06); shake(H.ci === 2 ? .32 : crit ? .2 : .1); if(H.ci === 2 || crit) W.zoom = zk(1.045); }
  H.slash = { t:0, ci:H.ci, face:H.face }; }
J.doSkill1 = function(){ if(G.over || H.cd.s1 > 0 || !(canAct() || H.st === 'atk')) return; H.st = 'spin'; H.t = 0; H.hits = 0; H.cd.s1 = C().s1cd; S('spin'); fx('crossslash', H.x, 90, H.z, { sc:1.8, rate:30 }); };
/* 뇌전 가르기: 가까운 적 무리 가운데로 뛰어들어 번개로 내려쳐요 (도착한 자리 둘레만 맞아요) */
J.doSkill2 = function(){ if(G.over || H.cd.s2 > 0 || !(canAct() || H.st === 'atk')) return;
  let tx = H.x + H.face * 260, tz = H.z; const t = nearest(700); if(t){ let sx = 0, sz = 0, n = 0; for(const m of MON) if(alive(m) && Math.hypot(m.x - t.x, m.z - t.z) < 220){ sx += m.x; sz += m.z; n++; } tx = sx / n; tz = sz / n; }
  const dx = tx - H.x, dz = tz - H.z, d = Math.hypot(dx, dz), mx = 420; if(d > mx){ tx = H.x + dx / d * mx; tz = H.z + dz / d * mx; }
  H.st = 'leap'; H.t = 0; H.lx0 = H.x; H.lz0 = H.z; H.lx1 = clamp(tx, 60, W.L - 60); H.lz1 = clamp(tz, W.Z0, W.Z1); H.cd.s2 = C().s2cd; H.done = false; if(Math.abs(dx) > 5) H.face = dx > 0 ? 1 : -1;
  H.zl = new W.Zone(0, { x:H.lx1, z:H.lz1, r:200, safe:true }); S('roll'); };
/* 필살기 운석: 하늘에 불구멍이 열리고 운석이 실제로 떨어져요. 땅에 닿는 순간 데미지 */
J.doSkill3 = function(){ if(G.over || H.cd.s3 > 0 || !(canAct() || H.st === 'atk')) return;
  const t = nearest(800); const tx = t ? t.x : H.x + H.face * 260, tz = t ? t.z : H.z;
  H.st = 'cast'; H.t = 0; H.cd.s3 = C().s3cd; flashA = .4; flashC = '#ffd27a'; slowT = .2;
  METEORS.push({ x:tx, z:tz, t:0, zone:new W.Zone(0, { x:tx, z:tz, r:240 }), hit:false }); S('ult'); };
const METEORS = [];
J.doRoll = function(){ if(G.over || H.cd.r > 0 || H.st === 'roll' || H.st === 'dead' || H.st === 'leap') return;
  let dx = J.INP.x, dz = J.INP.y; if(Math.hypot(dx, dz) < .2){ dx = H.face; dz = 0; } const l = Math.hypot(dx, dz); H.rdx = dx / l; H.rdz = dz / l; if(Math.abs(H.rdx) > .1) H.face = H.rdx > 0 ? 1 : -1;
  H.st = 'roll'; H.t = 0; H.inv = Math.max(H.inv, .32); H.cd.r = C().roll; S('roll'); dust(H.x, H.z, 6, 120); };
function hurtHero(dmg, from){ if(H.inv > 0 || H.st === 'dead' || G.over || G.admin.god) return false;
  { const df = J.stats().def || 0; if(df > 0) dmg = Math.max(1, Math.round(dmg * (1 - df / 100))); }   /* [rpg-v31] 도감 방어력 */
  G.php -= dmg; H.inv = .7; H.hurtT = .25; S('hurt'); shake(.3); hitStop(.05); num(H.x, 170, H.z, dmg, 'hurt'); flashA = .22; flashC = '#ff2a2a';
  const dir = from ? (H.x >= from.x ? 1 : -1) : -H.face; H.vx += dir * 380;
  if(H.st !== 'cast' && H.st !== 'leap'){ H.st = 'hurt'; H.t = 0; }
  if(G.php <= G.pmax * C().pot / 100 && G.pot > 0 && G.php > 0) J.usePot();
  if(G.php <= 0) heroDie(); return true; }
J.usePot = function(){ if(G.pot <= 0 || G.php >= G.pmax || G.over) return; G.pot--; const v = Math.round(G.pmax * .3); G.php = Math.min(G.pmax, G.php + v); label(H.x, 200, H.z, '🧪 +' + v, '#8fff9a', 26); S('heal'); for(let i = 0; i < 10; i++) PT.push({ k:'spark', x:H.x + rnd(-30, 30), y:rnd(0, 140), z:H.z, vx:0, vy:rnd(80, 180), vz:0, g:0, t:0, life:rnd(.4, .8), col:'#8fff9a', w:3 }); };
function heroDie(){ G.php = 0; H.st = 'dead'; H.t = 0; G.over = 1; slowT = .6; shake(.6); S('mdie2');
  G.banner = { txt:'쓰러졌어요…', sub:'STAGE ' + (G.st + 1) + ' 처음부터 다시!', t:0, col:'#ff8a8a' }; clearTimeout(J._dieT); J._dieT = setTimeout(() => J.beginStage(), 2600); }

/* ===== 자동 사냥 두뇌 ===== */
const AI = { x:0, z:0 };
function zoneHit(z, x, zz){ const o = z.o; const dx = x - o.x, dz = zz - o.z;
  if(z.k === 0) return Math.hypot(dx, dz) < o.r; if(z.k === 1){ const d = Math.hypot(dx, dz); return d < o.r && d > o.r * o.r0; }
  if(z.k === 2){ const d = Math.hypot(dx, dz); if(d > o.r) return false; let a = Math.atan2(dz, dx) - o.a0; a = Math.atan2(Math.sin(a), Math.cos(a)); return Math.abs(a) < o.a1; }
  const c = Math.cos(o.ang || 0), s = Math.sin(o.ang || 0), t = dx * c + dz * s, p = -dx * s + dz * c; return t > 0 && t < o.len && Math.abs(p) < o.wd / 2; }
function dangerAt(x, z){ for(const q of ZN){ if(q.done || q.safe) continue; if(q.z && zoneHit(q.z, x, z)) return q; } return null; }
function safeSpot(){ for(const q of ZN) if(q.safeZones && !q.done) return q.safeZones; return null; }
function autoBrain(){ AI.x = 0; AI.z = 0; if(H.st === 'dead' || G.over) return;
  const sz = safeSpot(); if(sz){ let b = null, bd = 1e9; for(const s of sz){ const d = Math.hypot(s.o.x - H.x, s.o.z - H.z); if(d < bd){ bd = d; b = s; } } if(b && bd > b.o.r * .5){ AI.x = (b.o.x - H.x) / bd; AI.z = (b.o.z - H.z) / bd; if(bd > 220 && H.cd.r <= 0){ J.INP.x = AI.x; J.INP.y = AI.z; J.doRoll(); J.INP.x = J.INP.y = 0; } } return; }
  const dz = dangerAt(H.x, H.z);
  if(dz){ let best = null; for(let a = 0; a < 16; a++){ const ang = a / 16 * 6.283, px = H.x + Math.cos(ang) * 170, pz = clamp(H.z + Math.sin(ang) * 170, W.Z0, W.Z1); if(!dangerAt(px, pz)){ best = [Math.cos(ang), Math.sin(ang)]; break; } }
    if(best){ AI.x = best[0]; AI.z = best[1]; if(H.cd.r <= 0 && dz.p > .5){ J.INP.x = best[0]; J.INP.y = best[1]; J.doRoll(); J.INP.x = J.INP.y = 0; } } return; }
  if(G.phase === 'gate'){ AI.x = 1; AI.z = (0 - H.z) / 200; return; }
  const t = nearest(); if(!t){ if(G.phase === 'field'){ AI.x = 1; } return; }
  let near = 0; for(const m of MON) if(alive(m) && Math.abs(m.x - H.x) < 220 && Math.abs(m.z - H.z) < 100) near++;
  if(H.cd.s3 <= 0 && (near >= 3 || (t.boss && Math.abs(t.x - H.x) < 500))){ J.doSkill3(); return; }
  if(H.cd.s2 <= 0 && near >= 2 && Math.random() < .5){ J.doSkill2(); return; }
  if(H.cd.s1 <= 0 && (near >= 2 || (t.boss && near))){ J.doSkill1(); return; }
  const side = t.x >= H.x ? -1 : 1, gx = t.x + side * (t.r + 70), gz = t.z, ddx = gx - H.x, ddz = gz - H.z;
  if(Math.abs(ddx) > 26 || Math.abs(ddz) > 22){ const l = Math.hypot(ddx, ddz); AI.x = ddx / l; AI.z = ddz / l; }
  if(Math.abs(t.x - H.x) < t.r + 150 && Math.abs(t.z - H.z) < 55){ H.face = t.x > H.x ? 1 : -1; J.doAttack(); } }

/* ===== 업데이트: 영웅 ===== */
function updHero(dt){
  H.t += dt; if(H.inv > 0) H.inv -= dt; if(H.hurtT > 0) H.hurtT -= dt; for(const k in H.cd) if(H.cd[k] > 0) H.cd[k] -= dt; if(G.comboTimer > 0) G.comboTimer -= dt;
  let mx, mz; const kv = J.keyVec();
  if(G.auto){ autoBrain(); mx = AI.x; mz = AI.z; } else { mx = J.INP.x + kv[0]; mz = J.INP.y + kv[1]; const l = Math.hypot(mx, mz); if(l > 1){ mx /= l; mz /= l; } if(J.INP.atk) J.doAttack(); }
  const sp = 320;
  if(H.st === 'idle' || H.st === 'walk'){ const l = Math.hypot(mx, mz);
    if(l > .15){ H.x += mx * sp * dt; H.z += mz * sp * .8 * dt; if(Math.abs(mx) > .2) H.face = mx > 0 ? 1 : -1; const d0 = H.dist; H.dist += Math.hypot(mx * sp, mz * sp * .8) * dt; H.st = 'walk';
      H.dir = Math.abs(mz) > Math.abs(mx) * 1.6 ? (mz > 0 ? 'd' : 'u') : 'r'; const st = 28; if(Math.floor(d0 / st) !== Math.floor(H.dist / st) && Math.floor(H.dist / st) % 2 === 0) dust(H.x - H.face * 10, H.z, 1, 30); }
    else { H.st = 'idle'; H.dir = 'r'; } }
  else if(H.st === 'atk'){ const a = ATK[H.ci];
    if(!H.struck && H.t >= a.w){ H.struck = true; let lg = a.lunge; for(const m of MON){ if(m.st === 'dead' || Math.abs(m.z - H.z) > 50) continue; const d = (m.x - H.x) * H.face; if(d > 0) lg = Math.min(lg, Math.max(0, d - m.r - 30)); } H.x += H.face * lg; strike(); }
    if(H.t >= a.end){ if(H.queued || (J.INP.atk && !G.auto)){ H.ci = (H.ci + 1) % 3; H.t = 0; H.hitSet = new Set(); H.queued = false; H.struck = false; S('swing' + (H.ci + 1)); const t = nearest(); if(t && Math.abs(t.x - H.x) > 8 && Math.abs(t.x - H.x) < 320) H.face = t.x > H.x ? 1 : -1; }
      else { G.comboTimer = .45; H.ci = (H.ci + 1) % 3; H.st = 'idle'; } } }
  else if(H.st === 'spin'){ const ticks = [.08, .26, .44]; H.inv = Math.max(H.inv, .05);
    while(H.hits < 3 && H.t >= ticks[H.hits]){ H.hits++; let any = false;
      for(const m of MON){ if(!alive(m)) continue; if(Math.abs(m.x - H.x) < 190 + m.r && Math.abs(m.z - H.z) < 90){ any = true; const d = heroDmg(C().s1); hurtMon(m, d.d, { dir:m.x >= H.x ? 1 : -1, kb:H.hits === 3 ? 420 : 120, launch:H.hits === 3 ? 380 : 0, kind:d.sup ? 'sup' : d.cr ? 'crit' : 'n', stagger:true }); sparks(m.x, m.y + m.h * .5, m.z, 8, '#9fe8ff'); } }
      ring(H.x, H.z, '#9fe8ff', 200); S(any ? 'hit2' : 'swing2'); if(any){ hitStop(.05); shake(.12); } }
    H.x += mx * sp * .5 * dt; H.z += mz * sp * .4 * dt; if(H.t >= .6) H.st = 'idle'; }
  else if(H.st === 'leap'){ const p = clamp(H.t / .2, 0, 1), e = 1 - Math.pow(1 - p, 3); H.inv = Math.max(H.inv, .1);
    H.x = H.lx0 + (H.lx1 - H.lx0) * e; H.z = H.lz0 + (H.lz1 - H.lz0) * e; H.y = Math.sin(p * Math.PI) * 60; if(Math.random() < .7) H.ghosts.push({ x:H.x, z:H.z, y:H.y, t:0, face:H.face });
    if(H.zl) H.zl.prog(p, H.t);
    if(!H.done && H.t >= .2){ H.done = true; H.y = 0; let any = false;
      for(const m of MON){ if(!alive(m)) continue; if(Math.hypot(m.x - H.x, m.z - H.z) < 200 + m.r * .5){ any = true; const d = heroDmg(C().s2); hurtMon(m, d.d, { dir:m.x >= H.x ? 1 : -1, kb:300, launch:300, kind:d.sup ? 'sup' : d.cr ? 'crit' : 'big', stagger:true }); } }
      fx('heaven', H.x, 120, H.z - 5, { sc:1.5, rate:22 }); fx('blueelec', H.x, 60, H.z + 4, { sc:3, rate:20 }); ring(H.x, H.z, '#bfe8ff', 220); sparks(H.x, 60, H.z, 20, '#bfe8ff', 700);
      S('crit'); shake(.4); hitStop(.08); flashA = .25; flashC = '#cfeaff'; }
    if(H.t >= .42){ H.st = 'idle'; if(H.zl){ H.zl.dispose(); H.zl = null; } } }
  else if(H.st === 'cast'){ H.inv = Math.max(H.inv, .1); if(H.t >= .45) H.st = 'idle'; }
  else if(H.st === 'roll'){ const p = H.t / .3, v = (1 - p) * 1050 + 120; H.x += H.rdx * v * dt; H.z += H.rdz * v * .7 * dt; if(Math.random() < .5) H.ghosts.push({ x:H.x, z:H.z, y:0, t:0, face:H.face }); if(H.t >= .3){ H.st = 'idle'; dust(H.x, H.z, 4, 80); } }
  else if(H.st === 'hurt'){ if(H.t >= .25) H.st = 'idle'; }
  H.x += H.vx * dt; H.vx *= Math.pow(.0008, dt);
  if(H.st !== 'roll' && H.st !== 'leap') for(const m of MON){ if(!alive(m) || m.y > 40) continue; const dx = H.x - m.x, lim = m.r * .75; if(Math.abs(dx) < lim && Math.abs(H.z - m.z) < 26){ H.x += (dx >= 0 ? 1 : -1) * (lim - Math.abs(dx)) * Math.min(1, dt * 12); } }
  const xmin = G.phase === 'boss' || G.phase === 'clear' ? W.L - 1150 : 50; H.x = clamp(H.x, xmin, W.L - 40); H.z = clamp(H.z, W.Z0, W.Z1);
  H.ghosts.forEach(o => o.t += dt); H.ghosts = H.ghosts.filter(o => o.t < .22);
  if(H.slash){ H.slash.t += dt; if(H.slash.t > .16) H.slash = null; }
  for(let i = METEORS.length - 1; i >= 0; i--){ const me = METEORS[i]; me.t += dt; me.zone.prog(clamp(me.t / .75, 0, 1), me.t);
    if(!me.hit && me.t >= .75){ me.hit = true; for(const m of MON){ if(!alive(m)) continue; if(Math.hypot(m.x - me.x, m.z - me.z) < 240 + m.r * .4){ const d = heroDmg(C().s3); hurtMon(m, d.d, { dir:m.x >= me.x ? 1 : -1, kb:600, launch:560, kind:'big', stagger:true }); } }
      fx('fireimpact', me.x, 70, me.z + 5, { sc:4, rate:14 }); fx('tremor', me.x, 50, me.z, { sc:1.8, rate:24 }); chunks(me.x, 20, me.z, 24, '#ff9a4d'); sparks(me.x, 40, me.z, 30, '#ffb347', 800); ring(me.x, me.z, '#ffb347', 260);
      S('slam'); shake(.7); hitStop(.1); W.zoom = zk(1.07); flashA = .35; flashC = '#ffcf8a'; }
    if(me.t > 1.1){ me.zone.dispose(); METEORS.splice(i, 1); } } }

/* ===== 업데이트: 몬스터 ===== */
function updMon(m, dt){ m.t += dt; m.at += dt; if(m.armor > 0) m.armor -= dt; if(m.stun > 0) m.stun = Math.max(0, m.stun - dt * .35); if(m.flash > 0) m.flash -= dt; if(m.shk > 0) m.shk -= dt; if(m.hbT > 0) m.hbT -= dt;
  m.hb += (m.hp / m.max - m.hb) * Math.min(1, dt * 3); if(m.hb < m.hp / m.max) m.hb = m.hp / m.max;
  if(m.y > 0 || m.vy > 0){ m.vy -= 2000 * dt; m.y += m.vy * dt; if(m.y <= 0){ const hard = m.vy < -500; m.y = 0; if(m.st === 'spawn' || hard){ dust(m.x, m.z, m.boss ? 14 : 6, m.boss ? 220 : 120); if(m.boss){ shake(.6); S('slam'); ring(m.x, m.z, '#fff', 260); } else if(m.st === 'spawn'){ shake(.05); } }
      m.vy = (m.st !== 'dead' && m.vy < -300) ? -m.vy * .28 : 0; if(m.st === 'spawn' && m.vy === 0){ m.st = 'move'; m.t = 0; } } }
  m.x += m.vx * dt; m.vx *= Math.pow(.004, dt); m.ang += m.va * dt; m.x = clamp(m.x, 40, W.L - 40);
  if(m.st === 'dead'){ m.va *= .98; return; }
  if(m.minion && (m.t > 16 || (G.boss && G.boss.st === 'dead'))){ m.hp = 0; m.st = 'dead'; m.t = 0; return; }
  if(m.shHit > 0) m.shHit -= dt;
  if(m.st === 'broken'){ m.broken -= dt; if(m.broken <= 0){ m.broken = 0; m.sp = m.shMax; m.st = 'move'; m.t = 0; m.cd = .8; label(m.x, m.h + 80, m.z, '방패 회복', '#bfe8ff', 20); } return; }
  if(m.st === 'spawn' || G.over) return;
  if(m.st === 'hurt'){ if(m.t > (m.boss ? .12 : .32) && m.y <= 0){ m.st = 'move'; m.t = 0; m.cd = Math.max(m.cd, .35); } return; }
  if(!m.aggro){ if(Math.abs(H.x - m.x) < 420 && Math.abs(H.z - m.z) < 260) { m.aggro = true; label(m.x, m.h + 50, m.z, '!', '#ffd34d', 26); }
    m.wander -= dt; if(m.wander <= 0){ m.wander = rnd(1.5, 3.5); m.wx = clamp(m.home + rnd(-140, 140), 60, W.L - 60); m.wz = rnd(W.Z0, W.Z1); }
    const dx = m.wx - m.x, dz = m.wz - m.z, l = Math.hypot(dx, dz); if(l > 8){ m.x += dx / l * m.spd * .4 * dt; m.z += dz / l * m.spd * .3 * dt; m.walk = true; m.face = dx > 0 ? 1 : -1; } else m.walk = false; return; }
  m.face = H.x >= m.x ? 1 : -1;
  if(m.boss && m.st === 'move' && m.cd <= 0 && !m.pat){ bossPattern(m); return; }
  if(m.st === 'cast'){ bossCast(m, dt); return; }
  if(m.st === 'move'){ m.cd -= dt;
    const side = H.x >= m.x ? -1 : 1, gx = H.x + side * (m.range - 20), gz = clamp(H.z + m.slot * 34, W.Z0, W.Z1), dx = gx - m.x, dz = gz - m.z, l = Math.hypot(dx, dz);
    if(l > 10){ m.x += dx / l * m.spd * dt; m.z += dz / l * m.spd * .7 * dt; m.walk = true; } else m.walk = false;
    for(const o of MON){ if(o === m || o.st === 'dead') continue; const ox = m.x - o.x, oz = (m.z - o.z) * 2.2, d = Math.hypot(ox, oz), want = (m.r + o.r) * .9; if(d < want && d > .01){ const p = (want - d) / want * 140 * dt; m.x += ox / d * p; m.z += oz / d * p * .4; } }
    m.z = clamp(m.z, W.Z0, W.Z1);
    if(!m.boss && m.cd <= 0 && Math.abs(H.x - m.x) < m.range + 10 && Math.abs(H.z - m.z) < 52 && H.st !== 'dead'){ m.st = 'wind'; m.t = 0; } }
  else if(m.st === 'wind'){ if(m.t >= (m.boss ? .55 : .55)){ m.st = 'atk'; m.t = 0; m.struck = false; m.at = 0; } }
  else if(m.st === 'atk'){ const dur = m.u ? Math.max(.35, m.u.n[1] * .055) : .38;
    if(!m.struck && m.t >= dur * .5){ m.struck = true; if(Math.abs(H.x - m.x) < m.range + 30 && Math.abs(H.z - m.z) < 60 && (H.x - m.x) * m.face > -20){ if(hurtHero(m.atk, m)) sparks(H.x, 90, H.z, 8, '#ff9a9a'); } else if(H.st === 'roll') label(H.x, 190, H.z, '피했다!', '#9fe8ff', 22); }
    if(m.t >= dur){ m.st = 'move'; m.t = 0; m.cd = rnd(1.7, 2.7) * (m.boss ? .8 : 1); } } }

/* ===== 보스 패턴 (참고: 어드벤처 테일 개발 노트 38 — 큰 공격 = 차례로 치는 판정 여러 개, 바닥 경고 = 실제 범위) ===== */
const PATS = ['slam', 'charge', 'fan', 'mines', 'rings', 'summon', 'safe', 'windmill'];
function bossPats(){ return PATS.slice(0, clamp(3 + Math.floor(G.st / 4), 3, PATS.length)); }
/* [v10] 장판 지우기 — 두 번 지워도 괜찮게 */
function disposeZone(z){ if(!z || z._dsp) return; z._dsp = true; try{ z.dispose(); }catch(_){ } }
function strikeZ(z, at, warn, dmgMul, o){ ZN.push(Object.assign({ z, at, warn, t:0, dmg:dmgMul, p:0, done:false }, o || {})); z.prog(0, 0, warn > 0 ? 0 : 1); }
function bossPattern(m){ const near = Math.abs(H.x - m.x) < m.range + 20 && Math.abs(H.z - m.z) < 40;
  if(near && Math.random() < .3){ m.st = 'wind'; m.t = 0; return; }
  const pat = pick(bossPats()); m.pat = pat; m.st = 'cast'; m.t = 0; m.pz = []; G.patName = { slam:'내려찍기', charge:'연속 돌진', fan:'부채꼴 숨결', mines:'지뢰밭', rings:'조여 오는 고리', summon:'졸개 부르기', safe:'안전 지대를 찾아라!', windmill:'풍차 베기' }[pat]; G.patT = 1.6; S('warn', .6);
  const A = m.atk, hx = H.x, hz = H.z, aim = Math.atan2(H.z - m.z, H.x - m.x);
  if(pat === 'slam'){ const z = new W.Zone(0, { x:hx, z:hz, r:160 }); strikeZ(z, 1.0, 0, 1.4, { leap:m }); m.leap = { x0:m.x, z0:m.z, x1:hx, z1:hz }; m.end = 1.4; }
  else if(pat === 'charge'){ m.charges = G.st >= 8 ? 3 : 2; m.ci = 0; m.end = 99; nextCharge(m); }
  else if(pat === 'fan'){ for(let i = 0; i < 2; i++){ const z = new W.Zone(2, { x:m.x, z:m.z, r:560, a0:aim, a1:.55 }); strikeZ(z, 1.0 + i * 1.0, i ? .55 + i * 1.0 - .6 : 0, 1.2, { reaim:i > 0, own:m }); } m.end = 2.6; }
  else if(pat === 'mines'){ const n = G.st >= 10 ? 11 : 8, pts = []; for(let i = 0; i < n; i++){ pts.push([clamp(hx + (i ? rnd(-420, 420) : 0), W.L - 1120, W.L - 60), clamp(hz + (i ? rnd(-140, 140) : 0), W.Z0, W.Z1)]); }
    pts.sort((a, b) => Math.hypot(a[0] - hx, a[1] - hz) - Math.hypot(b[0] - hx, b[1] - hz)); pts.forEach((p, i) => strikeZ(new W.Zone(0, { x:p[0], z:p[1], r:95 }), .9 + i * .18, 0, 1.1)); m.end = 1.3 + n * .18; }
  else if(pat === 'rings'){ [[.66, 560, 1.0], [.4, 370, 1.45], [.18, 230, 1.9]].forEach(r => strikeZ(new W.Zone(1, { x:m.x, z:m.z, r:r[1], r0:r[0] }), r[2], 0, 1.2)); m.end = 2.3; }
  else if(pat === 'summon'){ for(let i = 0; i < 3; i++){ const a = i / 3 * 6.283 + rnd(0, 1), px = clamp(m.x + Math.cos(a) * 220, W.L - 1100, W.L - 60), pz = clamp(m.z + Math.sin(a) * 150, W.Z0, W.Z1); strikeZ(new W.Zone(0, { x:px, z:pz, r:90 }), .9, 0, .8, { summon:[px, pz] }); } m.end = 1.3; }
  else if(pat === 'safe'){ const big = new W.Zone(0, { x:m.x, z:m.z, r:900 }); const safes = []; for(let i = 0; i < 2; i++){ let px, pz, k = 0; do{ const a = rnd(0, 6.283), d = rnd(250, 430); px = clamp(hx + Math.cos(a) * d, W.L - 1100, W.L - 70); pz = clamp(hz + Math.sin(a) * d * .5, W.Z0, W.Z1); k++; } while(k < 20 && safes.some(s => Math.hypot(s.o.x - px, s.o.z - pz) < 260)); safes.push(new W.Zone(0, { x:px, z:pz, r:95, safe:true })); }
    strikeZ(big, 1.9, 0, 2, { safes }); safes.forEach(s => ZN.push({ z:s, safe:true, at:1.9, warn:0, t:0, p:0, done:false, safeOnly:true })); ZN[ZN.length - 3].safeZones = safes; m.end = 2.3; }
  else if(pat === 'windmill'){ const n = 7, arms = G.st >= 12 ? 3 : 2; for(let i = 0; i < n; i++) for(let a = 0; a < arms; a++){ const ang = aim + i * .55 + a * 6.283 / arms; strikeZ(new W.Zone(3, { x:m.x, z:m.z, len:620, wd:90, ang }), .8 + i * .42, Math.max(0, .8 + i * .42 - .75), .9); } m.end = .8 + n * .42 + .3; } }
function nextCharge(m){ const ang = Math.atan2(H.z - m.z, H.x - m.x), z = new W.Zone(3, { x:m.x, z:m.z, len:900, wd:120, ang }); strikeZ(z, .75, 0, 1.2, { charge:m, ang }); m.ct = 0; }
function bossCast(m, dt){
  if(m.leap){ const p = clamp(m.t / 1.0, 0, 1); if(p > .4){ const q = (p - .4) / .6; m.x = m.leap.x0 + (m.leap.x1 - m.leap.x0) * q; m.z = m.leap.z0 + (m.leap.z1 - m.leap.z0) * q; m.y = Math.sin(q * Math.PI) * 280; m.vy = 0; } if(p >= 1){ m.y = 0; m.leap = null; } }
  if(m.dash){ m.x += Math.cos(m.dash.ang) * 1250 * dt; m.z += Math.sin(m.dash.ang) * 1250 * .9 * dt; m.face = Math.cos(m.dash.ang) > 0 ? 1 : -1; if(Math.random() < .6) dust(m.x, m.z, 1, 60);
    if(!m.dash.hit && Math.hypot(H.x - m.x, H.z - m.z) < m.r + 40){ if(hurtHero(Math.round(m.atk * 1.2), m)){ m.dash.hit = true; H.vx += Math.cos(m.dash.ang) * 600; } }
    m.dash.t += dt; m.x = clamp(m.x, W.L - 1120, W.L - 60); m.z = clamp(m.z, W.Z0, W.Z1);
    if(m.dash.t > .72){ m.dash = null; shake(.3); dust(m.x, m.z, 10, 200); m.ci++; if(m.ci < m.charges) nextCharge(m); else m.end = m.t + .4; } }
  if(m.t >= m.end && !ZN.some(q => !q.done && !q.safeOnly)){ m.st = 'move'; m.pat = null; m.cd = rnd(1.4, 2.2); m.t = 0; } }
function updZones(dt){
  for(const q of ZN){ if(q.done){ q.dn = (q.dn || 0) + dt; continue; } q.t += dt; const vis = q.t >= q.warn;
    if(q.reaim && !q.aimed && vis){ q.aimed = true; const o = q.own; if(o) q.z.set({ x:o.x, z:o.z, a0:Math.atan2(H.z - o.z, H.x - o.x) }); }
    q.p = clamp((q.t - q.warn) / Math.max(.01, q.at - q.warn), 0, 1); q.z.prog(q.p, q.t, vis ? 1 : 0);
    if(q.safeOnly){ if(q.t >= q.at){ q.done = true; } continue; }
    if(q.t >= q.at){ q.done = true; const o = q.z.o;
      if(q.charge){ q.charge.dash = { ang:q.ang, t:0, hit:false }; S('roll', .8); continue; }
      let hit = zoneHit(q.z, H.x, H.z); if(q.safes && q.safes.some(s => Math.hypot(H.x - s.o.x, H.z - s.o.z) < s.o.r)) hit = false;
      const boss = G.boss, dmg = Math.round((boss ? boss.atk : 50) * q.dmg);
      if(hit) hurtHero(dmg, { x:o.x }); else if(Math.hypot(H.x - o.x, H.z - o.z) < (o.r || 300) * 1.4) label(H.x, 190, H.z, '피했다!', '#9fe8ff', 22);
      const fxn = q.z.k === 3 ? 'twinstrike' : q.z.k === 2 ? 'fireimpact' : 'tremor'; const cx = q.z.k === 3 ? o.x + Math.cos(o.ang) * o.len * .5 : o.x, cz = q.z.k === 3 ? o.z + Math.sin(o.ang) * o.len * .5 : o.z;
      fx(fxn, cx, 50, cz, { sc:q.z.k === 0 ? Math.max(1, o.r / 110) : 1.8, rate:24 }); dust(cx, cz, 8, 200); S('slam', .7); shake(.35);
      if(q.summon){ const mm = mkMon('img', q.summon[0], q.summon[1], false, true); mm.y = 0; mm.st = 'move'; }
      if(q.safes) q.safes.forEach(s => disposeZone(s)); } }
  for(let i = ZN.length - 1; i >= 0; i--){ const q = ZN[i]; if(q.done && (q.dn || 0) > .15){ disposeZone(q.z); ZN.splice(i, 1); } } }

/* ===== 동료: 늘 옆에서 같이 싸워요 ===== */
function updCp(dt){ const s = J.stats(); const u = s.cp && J.DLB[s.cp]; if(!u){ if(cpSpr){ cpSpr.dispose(); cpSpr = null; cpSh.dispose(); cpSh = null; } return; } if(!u.im){ J.dlPack(u.p); return; }
  if(cpKey !== u.k){ if(cpSpr) cpSpr.dispose(); cpSpr = new W.Spr(dlTex(u)); if(!cpSh) cpSh = new W.Shadow(26); cpKey = u.k; CP.x = H.x - 120; CP.z = H.z; }
  CP.u = u; const tx = H.x - H.face * 125, tz = H.z - 50; CP.x += (tx - CP.x) * Math.min(1, dt * 3.5); CP.z += (tz - CP.z) * Math.min(1, dt * 3.5); CP.t += dt; CP.at += dt; CP.cd -= dt;
  CP.face = CP.tgt && CP.tgt.st !== 'dead' ? (CP.tgt.x >= CP.x ? 1 : -1) : H.face;
  if(CP.st === 'b' && CP.cd <= 0 && !G.over){ let b = null, bd = 340; for(const m of MON){ if(!alive(m)) continue; const d = Math.abs(m.x - CP.x); if(d < bd){ bd = d; b = m; } } if(b){ CP.st = 'a'; CP.at = 0; CP.tgt = b; CP.done = false; } else CP.cd = .3; }
  if(CP.st === 'a'){ const dur = Math.max(.4, u.n[1] * .055); if(!CP.done && CP.at >= dur * .55){ CP.done = true; const m = CP.tgt; if(m && alive(m)){ const d = Math.max(1, Math.round(s.atk * Math.max(s.cpC, 15) / 100 * rnd(.9, 1.1))); hurtMon(m, d, { dir:m.x >= CP.x ? 1 : -1, kb:90, kind:'cp' }); fx('blueelec', m.x, m.y + m.h * .55, m.z, { sc:1.6 }); sparks(m.x, m.h * .5, m.z, 6, '#8ff3e0'); } }
    if(CP.at >= dur){ CP.st = 'b'; CP.cd = 1.4; } } }

function updCoins(dt){ for(const c of COINS){ c.t += dt;
  if(c.t < .55){ c.vy -= 1900 * dt; c.y += c.vy * dt; if(c.y < 0){ c.y = 0; c.vy = -c.vy * .45; } c.x += c.vx * dt; c.z += c.vz * dt; c.vx *= .98; }
  else { const dx = H.x - c.x, dz = H.z - c.z, dy = 90 - c.y, l = Math.hypot(dx, dz, dy), sp = (600 + (c.t - .55) * 2400) * dt; if(l < 26){ c.got = true; S('coin'); if(c.v) label(H.x, 230, H.z, '💰+' + fmt(c.v), '#ffd34d', 26); } else { const k = Math.min(l, sp) / l; c.x += dx * k; c.z += dz * k; c.y += dy * k; } } }
  COINS = COINS.filter(c => !c.got && c.t < 3); }
function updFx(dt){ for(const p of PT){ p.t += dt; p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += (p.vz || 0) * dt; if(p.k === 'chunk'){ p.rot += p.vr * dt; if(p.y < 0){ p.y = 0; p.vy *= -.35; p.vx *= .6; p.vr *= .5; } } if(p.k === 'dust') p.vx *= .92; }
  PT = PT.filter(p => p.t < p.life);
  for(const e of FXS){ e.t += dt; e.x += e.vx * dt; e.y += e.vy * dt; if((!e.loop && e.t * e.rate >= e.f.n) || (e.life && e.t > e.life)){ e.dead = true; e.s.dispose(); } else fxDraw(e); } FXS = FXS.filter(e => !e.dead); }
function updNums(dt){ for(const d of DN){ d.t += dt; d.x += d.vx * dt; d.y += d.vy * dt; d.vy -= (d.lab ? 40 : 1100) * dt; if(!d.lab && d.vy < -100) d.vy = -100; } DN = DN.filter(d => d.t < (d.lab ? 1.3 : .95)); }

/* ===== 진행: 사냥터 → 보스 문 → 보스 → 다음 스테이지 ===== */
function bossGateOpen(){ G.phase = 'gate'; G.gate = W.portal(W.L - 140, 0); G.banner = { txt:'보스 문이 열렸어요!', sub:'오른쪽 끝 빛기둥으로 가요 →', t:0, col:'#c9a8ff' }; S('clear', .6); }
function enterBoss(){ if(G.gate){ G.gate.alpha = 0; G.gate.visible = false; } G.phase = 'bosswarn'; G.bwT = 0; for(const m of MON) if(!m.boss && m.st !== 'dead'){ m.st = 'dead'; m.t = .5; m.hp = 0; }
  G.banner = { txt:'⚠ BOSS ⚠', sub:G.hid ? '히든 보스가 나타났어요!' : '빨간 곳을 피하세요! 초록 원은 안전해요', t:0, col:'#ff5a6a', warn:true }; S('boss'); S('warn'); J.SND.music(J.bgmKey(G.st)); }
function bossDown(m){ slowT = 1.1; flashA = .7; flashC = '#fff'; W.zoom = zk(1.1); S('crit'); setTimeout(() => S('clear'), 500);
  G.phase = 'clear'; G.cT = 3.4; for(const o of MON) if(o !== m && o.st !== 'dead'){ o.hp = 0; o.st = 'dead'; o.t = 0; o.vy = 400; }
  for(const q of ZN){ q.done = true; disposeZone(q.z); } ZN.length = 0; G.banner = G.hid ? { txt:'히든보스 격파!', sub:'', t:0, col:'#c79bff' } : { txt:'STAGE CLEAR!', sub:'다음 스테이지로!', t:0, col:'#ffd34d' };
  J.noteClear(); }
J.noteClear = function(){ const R = J.prog(); if(!G.hid){ if(G.st + 1 > R.clr){ R.clr = G.st + 1; } R.pick = G.repeat ? G.st + 1 : G.st + 2; J.LS.set('rpg_prog', R); try{ if(J.L && J.L.noteClr) J.L.noteClr(G.st + 1); }catch(_){ } } };
J.prog = () => J.LS.get('rpg_prog', { clr:0, pick:1 });
function updFlow(dt){
  if(G.banner){ G.banner.t += dt; if(G.banner.t > (G.banner.warn ? 2 : 1.6)) G.banner = null; }
  if(G.patT > 0) G.patT -= dt;
  if(G.phase === 'field' || G.phase === 'gate'){ respawnT -= dt;
    if(respawnT <= 0){ respawnT = C().respawn / 3; if(fieldCount() < 13){ const far = SPAWNS.filter(s => s.n < 3 && Math.abs(s.x - H.x) > 520); if(far.length) spawnField(pick(far)); } } }
  if(G.phase === 'gate' && H.x > W.L - 230){ enterBoss(); }
  else if(G.phase === 'bosswarn'){ G.bwT += dt; if(G.bwT > 1.6){ G.phase = 'boss'; const m = mkMon('img', clamp(H.x + 360, W.L - 1000, W.L - 120), 0, true); m.y = 900; G.boss = m; J.target = m; } }
  else if(G.phase === 'clear'){ G.cT -= dt; if(G.cT <= 0){ G.phase = 'next'; nextStage(); } }
  if(G.comboT > 0){ G.comboT -= dt; if(G.comboT <= 0) G.combo = 0; }
  for(let i = MON.length - 1; i >= 0; i--){ const m = MON[i]; if(m.st === 'dead' && m.t > 1.1){ killMonVisual(m); MON.splice(i, 1); } } }
async function nextStage(){
  if(G.hid) G.hid = null;
  else { if(!G.repeat) G.st++; if(!G.repeat && J.HID && J.HID.maps && J.HID.maps.length && Math.random() * 100 < C().hidP){ G.hid = J.HID.maps[Math.random() * J.HID.maps.length | 0]; J.toast('🌀 히든 포탈이 열렸어요!'); } }
  await J.beginStage(); }
J.goStage = async function(st){ G.st = st; G.hid = null; const R = J.prog(); R.pick = st + 1; J.LS.set('rpg_prog', R); await J.beginStage(); };
const beginStageRun = async function(){
  clearTimeout(J._dieT); J.loading(true); G.over = 0; G.pot = C().pots; G.boss = null; G.combo = 0; G.kills = 0; G.quota = Math.round(C().quota); G.gate = null; J.target = null;
  for(const m of MON) killMonVisual(m); MON = []; IMT.clear(); for(const q of ZN) disposeZone(q.z); ZN.length = 0; for(const e of FXS) e.s.dispose(); FXS = []; for(const me of METEORS) me.zone.dispose(); METEORS.length = 0; COINS = []; PT = []; DN = [];
  const th = W.THEMES[G.st % W.THEMES.length]; G.theme = th;
  await W.build(th, Math.round(C().mapLen)); await prepAssets();
  G.pmax = J.stats().hp; G.php = G.pmax; H.st = 'idle'; H.x = 160; H.z = 0; H.y = 0; H.inv = 1; H.vx = 0; W.tx = H.x; W.tz = 0;
  fieldSpawns();
  if(G.hid){ G.phase = 'gate'; H.x = W.L - 700; W.tx = H.x; G.kills = G.quota; enterBoss(); }
  else { G.phase = 'field'; for(const sp of SPAWNS){ const n = sp.x < 900 ? 1 : 2; for(let i = 0; i < n; i++){ const m = spawnField(sp); m.y = 0; m.st = 'move'; } } J.SND.music(J.bgmKey(G.st));
    G.banner = { txt:'STAGE ' + (G.st + 1), sub:th.nm + (region() ? '' : ''), t:0, col:'#fff' }; }
  window.RPG.st = G.st; J.loading(false); };
/* [v12] 스테이지 만들기가 끝나기 전에 또 불리면(죽음 예약 + 운영자 이동 등) 끝난 뒤 한 번만 다시 만들어요. 중간에 오류가 나도 로딩 화면이 안 멈춰요 */
J.beginStage = function(){ if(J._bsP){ J._bsAgain = true; return J._bsP; }
  J._bsP = beginStageRun().catch(e => { console.warn('stage', e); try{ J.loading(false); }catch(_){ } }).then(() => { J._bsP = null; if(J._bsAgain){ J._bsAgain = false; return J.beginStage(); } });
  return J._bsP; };

/* ===== 그리기: 3D 그림 자리 맞추기 ===== */
function dlFrame(u, seg, t, rate, once){ const sg = J.dlSeg(u, seg), n = Math.max(1, sg[1]); let i = Math.floor(t * rate); i = once ? Math.min(i, n - 1) : i % n; return sg[0] + i; }
function placeDl(spr, u, f, x, y, z, s, flip, sx, sy){ const bb = u.bb; spr.frame((f % u.c) * u.w, Math.floor(f / u.c) * u.h, u.w, u.h, flip); spr.place(x, y, z, s, (bb[0] + bb[2]) / 2, bb[3], flip, sx, sy); }
function drawMon(m){ if(!m.spr){ return; } const a = m.st === 'dead' ? clamp(1 - (m.t - .55) / .5, 0, 1) : 1; const jit = m.shk > 0 ? rnd(-4, 4) : 0;
  m.spr.alpha = a; m.spr.visible = a > 0;
  if(m.sh) m.sh.at(m.x, m.z, m.r * 1.1 * clamp(1 - m.y / 600, .3, 1), a);
  if(m.st === 'broken' && m.flash <= 0) m.spr.flash('#8fa6c8', .35); else if(m.flash > 0) m.spr.flash(m.armor > 0 ? '#ffe27a' : '#ffffff', .95); else if(m.armor > 0) m.spr.flash('#ffd34d', .18 + .12 * Math.sin(m.t * 20)); else if(m.st === 'wind' || (m.st === 'cast' && m.pat === 'charge' && !m.dash)) m.spr.flash('#ff2020', .25 + .3 * Math.abs(Math.sin(m.t * 18))); else m.spr.flash(null, 0);
  if(m.u){ const u = m.u; let f, flip = m.face < 0;
    if(m.st === 'dead') f = dlFrame(u, 'd', m.t, 16, true); else if(m.st === 'hurt' || m.st === 'broken') f = dlFrame(u, 'h', m.st === 'broken' ? .05 : m.t, 14, true);
    else if(m.st === 'atk' || m.dash) f = dlFrame(u, 'a', m.dash ? m.dash.t * .5 : m.t, 1 / .055, true); else if(m.st === 'cast') f = dlFrame(u, 'a', Math.min(m.t, .2), 1 / .055, true);
    else f = dlFrame(u, 'b', m.at, 11, false);
    const sq = m.st === 'wind' ? 1 + .05 * Math.sin(m.t * 20) : m.st === 'hurt' ? 1 + .12 * (1 - clamp(m.t / .32, 0, 1)) * FK('fxSquash') : 1;
    /* 걸을 때는 통통 뛰듯이 (듀얼리스트 유닛엔 걷는 그림이 없어서) */
    let hop = 0; if(m.walk && (m.st === 'move' || !m.aggro)) hop = Math.abs(Math.sin(m.at * 9)) * 10;
    placeDl(m.spr, u, f, m.x + jit, m.y + hop, m.z, m.sc, flip, sq, 1 / sq); }
  else { const im = m.im; let sx = 1, sy = 1, lean = 0, off = 0, lunge = 0;
    if(m.st === 'move' && m.walk || (!m.aggro && m.walk)){ const ph = m.at * 7; sy = 1 + Math.sin(ph * 2) * .05; sx = 1 / sy; off = Math.abs(Math.sin(ph)) * 12; }
    else if(m.st === 'move' || m.st === 'spawn' || !m.aggro){ const b = Math.sin(m.at * 3); sy = 1 + b * .03; sx = 1 - b * .02; }
    if(m.st === 'wind'){ const p = clamp(m.t / .55, 0, 1); sy = 1 - .12 * p; sx = 1 + .1 * p; lean = -m.face * .12 * p; }
    if(m.st === 'atk'){ const p = clamp(m.t / .38, 0, 1); sy = 1 + .1 * Math.sin(p * Math.PI); sx = 1 - .06 * Math.sin(p * Math.PI); lean = m.face * .18 * Math.sin(p * Math.PI); lunge = Math.sin(p * Math.PI) * 50 * m.face; }
    if(m.st === 'hurt'){ const p = clamp(m.t / .32, 0, 1); sx = 1 + .14 * (1 - p) * FK('fxSquash'); sy = 1 - .1 * (1 - p) * FK('fxSquash'); lean = -m.face * .2 * (1 - p); }
    if(m.dash) lean = m.face * .25;
    if(m.st === 'broken'){ lean = Math.sin(m.t * 3) * .12 - m.face * .1; sy = .94; }
    const s = m.h / im.height; m.spr.place(m.x + jit + lunge, m.y + off, m.z, s, null, null, m.face > 0, sx, sy, -(lean + m.ang)); } }
function dressDraw(h, rot){ const D = h.dress, now = performance.now(); if(['atk','spin','cast','leap'].includes(h.st)){ if(!h.atkT0 || now - h.atkT0 > 420) h.atkT0 = now; } else h.atkT0 = 0;
  if(!D.last || now - D.last > 33){ D.last = now; J.L.draw(D.c, D.x, now, h.atkT0 ? { t:h.atkT0 } : null); heroSpr.t.needsUpdate = true; }
  let sx = 1, sy = 1, y = h.y, lunge = 0;
  if(h.st === 'walk'){ const ph = h.dist / 28 * Math.PI; y += Math.abs(Math.sin(ph)) * 7; sy = 1 + Math.sin(ph * 2) * .03; sx = 1 / sy; }
  else if(h.st === 'idle'){ const b = Math.sin(now / 420); sx = 1 - b * .012; sy = 1 + b * .018; }
  else if(h.st === 'atk'){ const a = ATK[h.ci]; if(h.t < a.w){ sx = 1.05; sy = .96; } else { const p = clamp((h.t - a.w) / .12, 0, 1); lunge = Math.sin(p * Math.PI) * 18 * h.face; sx = .97; sy = 1.04; } }
  else if(h.st === 'roll'){ sy = .8; sx = 1.12; }
  heroSpr.frame(0, 0, D.c.width, D.c.height, h.face < 0); heroSpr.place(h.x + lunge, y, h.z, D.sc, D.foot[0], D.foot[1], h.face < 0, sx, sy, rot); }
function heroDraw(){ if(!heroSpr) return; const h = H; let tint = null, ta = 0, alpha = 1;
  if(h.hurtT > 0){ tint = '#ff3030'; ta = .65; } else if(h.inv > 0 && !['roll','spin','leap','cast'].includes(h.st) && Math.floor(h.inv * 20) % 2) alpha = .55;
  if(h.st === 'cast'){ tint = '#ffd27a'; ta = .3 + .3 * Math.sin(h.t * 60); }
  heroSpr.flash(tint, ta); heroSpr.alpha = alpha;
  heroSh.at(h.x, h.z, 38, 1);
  const rot = h.st === 'dead' ? -h.face * Math.min(1.45, h.t * 5) : 0;
  if(h.dress){ dressDraw(h, rot); return; }
  if(h.tfU){ const u = h.tfU; let f; if(h.st === 'atk' || h.st === 'spin' || h.st === 'cast' || h.st === 'leap') f = dlFrame(u, 'a', h.st === 'atk' ? (h.t < ATK[h.ci].w ? 0 : (h.t - ATK[h.ci].w) * 3 + .1) : h.t, 1 / .055, true); else if(h.st === 'hurt') f = dlFrame(u, 'h', h.t, 14, true); else if(h.st === 'dead') f = dlFrame(u, 'd', h.t, 14, true); else f = dlFrame(u, 'b', performance.now() / 1000, 11, false);
    let hop = h.st === 'walk' ? Math.abs(Math.sin(h.dist / 28 * Math.PI)) * 8 : 0; placeDl(heroSpr, u, f, h.x, h.y + hop, h.z, 2.2, h.face < 0); return; }
  const A = HERO_ART; if(!A) return; let key = 'walk_r', fi = 0, flip = h.face < 0, sx = 1, sy = 1, bob = 0;
  if(h.st === 'atk'){ key = 'atk_r'; fi = h.t < ATK[h.ci].w ? 0 : 1; if(h.t < ATK[h.ci].w){ sx = 1.04; sy = .97; } else if(h.t < ATK[h.ci].w + .06){ sx = .96; sy = 1.04; } }
  else if(h.st === 'spin'){ const k = Math.floor(h.t / .07); key = 'atk_r'; fi = k % 2; flip = (k >> 1) % 2 === 0 ? h.face < 0 : h.face > 0; }
  else if(h.st === 'cast' || h.st === 'leap'){ key = 'atk_r'; fi = h.t < .15 ? 0 : 1; }
  else if(h.st === 'roll'){ fi = Math.floor(h.t * 24) % 4; sy = .82; sx = 1.1; }
  else if(h.st === 'walk'){ key = 'walk_' + h.dir; fi = Math.floor(h.dist / 28) % 4; if(h.dir !== 'r') flip = false; bob = Math.abs(Math.sin(h.dist / 28 * Math.PI)) * 4; }
  else if(h.st === 'idle'){ const b = Math.sin(performance.now() / 420); sx = 1 - b * .012; sy = 1 + b * .018; }
  const fr = A.fr[key][fi] || A.fr.walk_r[0]; heroSpr.frame(fr[0], fr[1], fr[2], fr[3], flip);
  heroSpr.place(h.x, h.y + bob, h.z, 2.0, A.foot[0] - fr[0] * 0 , A.foot[1], flip, sx, sy, rot); }
function cpDraw(){ if(!cpSpr || !CP.u) return; const u = CP.u, f = CP.st === 'a' ? dlFrame(u, 'a', CP.at, 1 / .055, true) : dlFrame(u, 'b', CP.t, 11, false);
  cpSh.at(CP.x, CP.z, 28, .8); placeDl(cpSpr, u, f, CP.x, Math.sin(CP.t * 2.4) * 4, CP.z, 1.6, CP.face < 0); }

/* ===== 화면 위에 그리기 (숫자·파티클·체력바·배너) ===== */
let OV = null, og = null, dpr = 1;
function ovFit(){ dpr = Math.min(2, window.devicePixelRatio || 1); OV.width = Math.round(W.cw * dpr); OV.height = Math.round(W.ch * dpr); }
function drawOverlay(){ const g = og; if(OV.width !== Math.round(W.cw * dpr)) ovFit(); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W.cw, W.ch);
  /* 잔상 */
  /* 파티클 */
  for(const p of PT){ const k = 1 - p.t / p.life, q = W.proj(p.x, p.y, p.z); if(q[2] > 1) continue; const sc = 1.2;
    if(p.k === 'spark'){ const q2 = W.proj(p.x - p.vx * .03, p.y - p.vy * .03, p.z), gl = FK('fxGlow');
      if(gl > 0){ g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = p.col; g.globalAlpha = k * .4 * Math.min(1, gl); g.lineWidth = p.w * 3.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(q[0], q[1]); g.lineTo(q2[0], q2[1]); g.stroke(); g.restore(); }
      g.strokeStyle = p.col; g.globalAlpha = k; g.lineWidth = p.w; g.lineCap = 'round'; g.beginPath(); g.moveTo(q[0], q[1]); g.lineTo(q2[0], q2[1]); g.stroke(); }
    else if(p.k === 'dust'){ g.globalAlpha = k * .55; g.fillStyle = p.col; g.beginPath(); g.arc(q[0], q[1], p.r * (1.6 - k * .6) * .6, 0, 7); g.fill(); }
    else if(p.k === 'chunk'){ g.globalAlpha = Math.min(1, k * 2); g.fillStyle = p.col; g.save(); g.translate(q[0], q[1]); g.rotate(p.rot); g.fillRect(-p.r * .7, -p.r * .7, p.r * 1.4, p.r * 1.4); g.restore(); }
    else if(p.k === 'ring'){ const r = W.proj(p.x + p.r1 * (1 - k * .8), p.y, p.z); const rr = Math.abs(r[0] - q[0]); g.globalAlpha = k; g.strokeStyle = p.col; g.lineWidth = 5 * k + 1; g.beginPath(); g.ellipse(q[0], q[1], rr, rr * .4, 0, 0, 7); g.stroke(); } }
  g.globalAlpha = 1;
  /* 칼 궤적 */
  if(H.slash){ const s = H.slash, p = s.t / .16, big = s.ci === 2, c0 = W.proj(H.x + s.face * 20, 80, H.z), c1 = W.proj(H.x + s.face * 160, 80, H.z), R0 = Math.abs(c1[0] - c0[0]) * (big ? 1.1 : .85);
    g.save(); g.translate(c0[0], c0[1]); g.scale(s.face, big ? .62 : .5); g.rotate(s.ci === 1 ? .5 : -.2); const a0 = -Math.PI * .85 + p * .5, a1 = a0 + Math.PI * (big ? 1.25 : 1.05) * Math.min(1, p * 3);
    g.globalAlpha = 1 - p; g.globalCompositeOperation = 'lighter'; for(let i = 0; i < 3; i++){ g.beginPath(); g.arc(0, 0, R0 - i * 8, a0, a1); g.lineWidth = (big ? 20 : 14) * (1 - i * .3); g.strokeStyle = i === 0 ? (big ? 'rgba(255,200,90,.9)' : 'rgba(160,230,255,.85)') : 'rgba(255,255,255,.8)'; g.lineCap = 'round'; g.stroke(); } g.restore(); }
  /* 운석 */
  for(const me of METEORS){ const p = clamp((me.t - .2) / .55, 0, 1); if(me.t < .2 || me.hit){ if(!me.hit){ const q = W.proj(me.x - 260, 700, me.z); g.globalAlpha = me.t / .2; const gr = g.createRadialGradient(q[0], q[1], 2, q[0], q[1], 60); gr.addColorStop(0, '#fff3c0'); gr.addColorStop(.4, '#ff6a2a'); gr.addColorStop(1, 'rgba(120,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(q[0], q[1], 70, 34, 0, 0, 7); g.fill(); g.globalAlpha = 1; } continue; }
    const e = p * p, x = me.x - 260 * (1 - e), y = 700 * (1 - e), q = W.proj(x, y, me.z); for(let k = 3; k >= 0; k--){ const pk = Math.max(0, e - k * .06), qq = W.proj(me.x - 260 * (1 - pk), 700 * (1 - pk), me.z); g.globalAlpha = .25 + (3 - k) * .2; const r = 26 - k * 4; const gr = g.createRadialGradient(qq[0], qq[1], 1, qq[0], qq[1], r); gr.addColorStop(0, '#fff8d0'); gr.addColorStop(.5, '#ff8a2a'); gr.addColorStop(1, 'rgba(255,60,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(qq[0], qq[1], r, 0, 7); g.fill(); }
    g.globalAlpha = 1; g.fillStyle = '#5a2a1a'; g.beginPath(); g.arc(q[0], q[1], 14, 0, 7); g.fill(); }
  /* 코인 */
  for(const c of COINS){ const q = W.proj(c.x, c.y, c.z), sp = Math.abs(Math.cos(c.t * 10)); g.fillStyle = '#ffcc33'; g.strokeStyle = '#8a5a00'; g.lineWidth = 2; g.beginPath(); g.ellipse(q[0], q[1], 8 * sp + 2, 8, 0, 0, 7); g.fill(); g.stroke(); }
  /* 몬스터 머리 위 */
  for(const m of MON){ if(m.st === 'dead') continue; const top = W.proj(m.x, m.y + m.h + 14, m.z);
    if(m.st === 'wind' || (m.st === 'cast' && m.t < .5)){ g.font = '34px "Do Hyeon",sans-serif'; g.textAlign = 'center'; g.lineWidth = 5; g.strokeStyle = '#000'; const yy = top[1] - 10 - Math.abs(Math.sin(m.t * 12)) * 6; g.strokeText('!', top[0], yy); g.fillStyle = '#ff4040'; g.fillText('!', top[0], yy); }
    if(m.st === 'broken'){ g.save(); g.font = '22px sans-serif'; g.textAlign = 'center'; for(let i = 0; i < 3; i++){ const a = performance.now() / 300 + i * 2.09; g.fillText('💫', top[0] + Math.cos(a) * 26, top[1] - 6 + Math.sin(a) * 7); } g.restore(); }
    if(m.shMax && m.st !== 'broken' && m.aggro){ const sx = top[0] + (m.boss ? 0 : 40), sy = top[1] - (m.boss ? 14 : 4), sc = m.shHit > 0 ? 1.25 : 1; g.save(); g.translate(sx, sy); g.scale(sc, sc); g.fillStyle = '#1d3a5a'; g.strokeStyle = '#bfe8ff'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -13); g.lineTo(11, -8); g.lineTo(9, 6); g.lineTo(0, 13); g.lineTo(-9, 6); g.lineTo(-11, -8); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.font = '15px "Do Hyeon",sans-serif'; g.textAlign = 'center'; g.fillText(m.sp, 0, 5); g.restore(); }
    if(!m.boss && (m.hbT > 0 || m.el || m.dl) && m.aggro){ const bw = 58, bx = top[0] - bw / 2, by = top[1];
      g.fillStyle = '#000a'; g.fillRect(bx - 1, by - 1, bw + 2, 8); g.fillStyle = '#fff'; g.fillRect(bx, by, bw * m.hb, 6); g.fillStyle = m.el ? '#ffcc4d' : '#ff5a6a'; g.fillRect(bx, by, bw * Math.max(0, m.hp / m.max), 6);
      if(m.dl || m.el){ g.font = '14px "Do Hyeon",sans-serif'; g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = '#000'; const t = m.dl ? m.dl.gn : '정예'; g.strokeText(t, top[0], by - 5); g.fillStyle = m.dl ? m.dl.col : '#ffcc4d'; g.fillText(t, top[0], by - 5); } } }
  /* 숫자 */
  g.textAlign = 'center'; for(const d of DN){ const life = d.lab ? 1.3 : .95, a = clamp((life - d.t) / .3, 0, 1); let s = 1; if(!d.lab){ s = d.t < .08 ? 1.7 - d.t / .08 * .7 : 1; if(d.crit && d.t < .12) s *= 1.15; s = 1 + (s - 1) * FK('fxPop'); } const q = W.proj(d.x, d.y, d.z);
    g.save(); g.globalAlpha = a; g.translate(q[0], q[1]); g.scale(s, s); g.font = d.sz + 'px "Do Hyeon",sans-serif'; g.lineJoin = 'round'; g.lineWidth = Math.max(4, d.sz * .16); g.strokeStyle = '#1a0d00'; g.strokeText(d.txt, 0, 0); g.fillStyle = d.col; g.fillText(d.txt, 0, 0);
    if(d.crit){ g.font = (d.sz * .45) + 'px "Do Hyeon",sans-serif'; g.lineWidth = 3; const lb = d.sup ? '극치명타!' : '치명타!'; g.strokeText(lb, 0, -d.sz * .8); g.fillStyle = d.sup ? '#ffd1fb' : '#fff3b0'; g.fillText(lb, 0, -d.sz * .8); } g.restore(); }
  /* 보스 문 방향 화살표 */
  if(G.phase === 'gate'){ const q = W.proj(W.L - 140, 200, 0); if(q[0] > W.cw - 20){ const y = W.ch * .45 + Math.sin(performance.now() / 200) * 6; g.fillStyle = '#c9a8ff'; g.font = '26px "Do Hyeon",sans-serif'; g.textAlign = 'right'; g.lineWidth = 5; g.strokeStyle = '#000'; g.strokeText('보스 문 ▶', W.cw - 12, y); g.fillText('보스 문 ▶', W.cw - 12, y); } }
  /* 콤보 */
  if(G.combo >= 3){ const p = clamp(G.comboT / 2.2, 0, 1); g.save(); g.globalAlpha = Math.min(1, p * 3); g.textAlign = 'right'; g.font = '46px "Do Hyeon",sans-serif'; g.lineWidth = 6; g.strokeStyle = '#000'; const x = W.cw - 14, y = W.ch * .36; g.strokeText(G.combo, x, y); g.fillStyle = G.combo >= 30 ? '#ff7a3c' : G.combo >= 10 ? '#ffd34d' : '#fff'; g.fillText(G.combo, x, y); g.font = '18px "Do Hyeon",sans-serif'; g.strokeText('COMBO', x, y + 22); g.fillStyle = '#fff'; g.fillText('COMBO', x, y + 22); g.restore(); }
  /* 보스 패턴 이름 */
  if(G.patT > 0 && G.patName){ g.save(); g.globalAlpha = clamp(G.patT / .4, 0, 1); g.textAlign = 'center'; g.font = '24px "Do Hyeon",sans-serif'; g.lineWidth = 5; g.strokeStyle = '#000'; g.strokeText('⚠ ' + G.patName, W.cw / 2, W.ch * .3); g.fillStyle = '#ffb0b0'; g.fillText('⚠ ' + G.patName, W.cw / 2, W.ch * .3); g.restore(); }
  /* 배너 */
  if(G.banner){ const b = G.banner, t = b.t, s = t < .18 ? .4 + t / .18 * .75 : t < .28 ? 1.15 - (t - .18) : 1.05, a = clamp(((b.warn ? 2 : 1.6) - t) / .3, 0, 1);
    g.save(); g.globalAlpha = a; if(b.warn){ g.fillStyle = 'rgba(160,0,0,' + (.18 + .12 * Math.sin(t * 14)) + ')'; g.fillRect(0, 0, W.cw, W.ch); g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, W.ch * .3 - 46, W.cw, 92); }
    g.translate(W.cw / 2, W.ch * .3); g.scale(s, s); g.textAlign = 'center'; g.font = '50px "Do Hyeon",sans-serif'; g.lineWidth = 7; g.strokeStyle = '#000'; g.strokeText(b.txt, 0, 0); g.fillStyle = b.col; g.fillText(b.txt, 0, 0);
    if(b.sub){ g.font = '20px "Do Hyeon",sans-serif'; g.lineWidth = 5; g.strokeText(b.sub, 0, 32); g.fillStyle = '#fff'; g.fillText(b.sub, 0, 32); } g.restore(); }
  if(flashA > 0){ g.globalAlpha = Math.min(1, flashA * FK('fxFlash')); g.fillStyle = flashC; g.fillRect(0, 0, W.cw, W.ch); g.globalAlpha = 1; }
  const v = g.createRadialGradient(W.cw / 2, W.ch * .6, W.ch * .35, W.cw / 2, W.ch * .6, W.ch * .85); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.3)'); g.fillStyle = v; g.fillRect(0, 0, W.cw, W.ch); }

/* ===== 메인 루프 ===== */
let last = performance.now();
J.frame = 0;
function loop(now){ let dt = Math.min(.05, (now - last) / 1000); last = now;
  if(J.ready && J.checkPause && (J.frame & 7) === 0) J.paused = J.checkPause(); if(J.paused) J.frame++;
  if(!document.hidden && !J.paused && J.ready){
    if(flashA > 0) flashA = Math.max(0, flashA - dt * 2.5);
    if(slowT > 0){ slowT -= dt; dt *= .3; }
    if(stopT > 0){ stopT -= dt; updNums(dt * .4); }
    else { updHero(dt); for(const m of MON) updMon(m, dt); updZones(dt); updCp(dt); updCoins(dt); updFx(dt); updNums(dt); updFlow(dt); }
    W.follow(H.x + H.face * 40, H.z, Math.min(.05, (now - (J._lf || now)) / 1000) || .016); J._lf = now;
    for(const m of MON) drawMon(m); heroDraw(); cpDraw();
    W.render(); drawOverlay(); J.frame++;
    J.uiTick && J.uiTick(dt); }
  else { J._lf = now; if(J.ready && J.paused && !document.hidden && (J.frame & 3) === 0){ W.render(); } }
  requestAnimationFrame(loop); }
J.start = function(){ OV = J.$('ov'); og = OV.getContext('2d'); ovFit(); window.addEventListener('resize', () => setTimeout(ovFit, 50)); requestAnimationFrame(loop); };

/* ===== 운영자 도구 ===== */
J.adminKillAll = () => { for(const m of MON) if(alive(m)) hurtMon(m, m.hp + 1, { kind:'big' }); };
J.adminGate = () => { if(G.phase === 'field'){ G.kills = G.quota; bossGateOpen(); } };
J.adminBoss = () => { if(G.phase === 'field' || G.phase === 'gate'){ if(!G.gate) bossGateOpen(); H.x = W.L - 240; W.tx = H.x; enterBoss(); } };
})(window.J);
