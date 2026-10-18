/* 정도 RPG — 기본 도구 · 설정 · 저장 · 소리 · 그림 불러오기 */
'use strict';
window.J = window.J || {};
(function(J){
/* ===== 설정 (운영자 모드 에디터에서 바꿀 수 있어요) ===== */
J.CFG0 = {
  goldMul: 0.5,      // 끝말잇기 몬스터 골드 × 이 값
  cubeMul: 0.5,      // 큐브 × 이 값
  dropP: 12,         // 일반 몬스터 장비 드롭 확률(%) — 끝말잇기와 같은 장비표
  dropBoss: 100,     // 보스 장비 드롭 확률(%)
  ticketP: 30,       // 변신·동료 뽑기권 드롭 검사 확률(%) — 끝말잇기와 같은 확률표를 이만큼만 돌려요
  quota: 18,         // 보스 문이 열리는 사냥 수
  mapLen: 4200,      // 맵 길이
  bossHp: 2.5,       // 보스 체력 배율
  monHp: 1, monAtk: 1, // 몬스터 체력·공격 배율
  heroAtk: 1, heroHp: 1, // 내 공격·체력 배율
  combo: [0.45, 0.45, 0.9],
  s1: 0.6, s1cd: 5,  // 회오리 (3번)
  s2: 1.6, s2cd: 9,  // 뇌전 가르기
  s3: 2.6, s3cd: 15, // 필살기 운석
  roll: 0.7, pot: 40, pots: 3,
  respawn: 7,        // 몬스터 다시 나오는 시간(초)
  hidP: 3,           // 보스 잡으면 히든 포탈 확률(%)
  curve: 0,          // 글로브뷰 휘어짐 (0 = 평평 · 어지러워서 기본은 끔)
  /* 타격감 — 1 = 기본, 0 = 끄기, 2 = 두 배. 최종 세기 = 전체 × 각 항목 */
  fxAll: 1, fxStop: 1, fxShake: 1, fxFlash: 1, fxSpark: 1, fxGlow: 1, fxPop: 1, fxZoom: 1, fxSquash: 1
};
J.CFG = Object.assign({}, J.CFG0);
/* [v20] 끝말잇기 쪽 성별·기본몸 함수는 RPG에 안 들어와요 → 가방 그림(L.draw)이 여자 몸으로 떨어지지 않게 여기서 남자로 고정 */
J.VER = 'rpg-v24';
window.JD_HERO_SEX = window.JD_HERO_SEX || function(){ return 'M'; };
window.JD_HERO_IDLE = window.JD_HERO_IDLE || function(){ return J.moBase ? { im:J.moBase } : null; };
J.cfgApply = function(o){ if(!o || typeof o !== 'object') return; Object.keys(J.CFG0).forEach(k => { if(o[k] == null) return; if(Array.isArray(J.CFG0[k])){ if(Array.isArray(o[k]) && o[k].length === J.CFG0[k].length) J.CFG[k] = o[k].map(Number); } else if(isFinite(+o[k])) J.CFG[k] = +o[k]; }); };

/* ===== 작은 도구 ===== */
J.$ = id => document.getElementById(id);
J.rnd = (a, b) => a + Math.random() * (b - a);
J.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
J.pick = a => a[Math.random() * a.length | 0];
J.fmt = n => { n = Math.floor(n || 0); return n >= 1e8 ? (n / 1e8).toFixed(1) + '억' : n >= 1e4 ? Math.floor(n / 1e4) + '만' + (n % 1e4 >= 1000 ? ' ' + Math.floor(n % 1e4 / 1000) + '천' : '') : String(n); };
J.loadImg = src => new Promise(r => { if(!src){ r(null); return; } const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
J.LS = { get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(_){ return d; } }, set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(_){ } } };
J.toast = function(s){ const t = J.$('toast'); if(!t) return; t.textContent = s; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2300); };
J.msg = s => { const e = J.$('lmsg'); if(e) e.textContent = s; };

/* ===== 같이 쓰는 저장소 (가방이 안 열렸을 때를 위한 예비 길) ===== */
function db(){ return new Promise((res, rej) => { const r = indexedDB.open('jd-loot', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
J.kget = async function(k){ try{ const d = await db(); return await new Promise(res => { const q = d.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(null); }); }catch(_){ return null; } };
J.kset = async function(k, v){ try{ const d = await db(); await new Promise(res => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = res; t.onerror = res; }); }catch(_){ } try{ localStorage.setItem('jd_sync', String(Date.now())); }catch(_){ } };
J.share = () => J.LS.get('jd_share', null) || {};

/* ===== 분해·감정 경험치 (정도 RPG 화면용) =====
   가방의 분해·감정은 window.RPG_GIVE_EXP / RPG_SPEND_EXP 를 불러 쓰는데, 이 둘은 끝말잇기 화면 안에만 있었어요.
   그래서 정도 RPG 화면에서는 "경험치를 받을 플레이어가 없어요"가 떴어요 → 여기서 똑같이 만들어 둬요.
   끝말잇기와 같은 저장 칸(jumprope_wordgame-rank-log)을 읽고 써서 같은 경험치를 같이 써요.
   ※ 아래 계급 숫자(RK_*)는 끝말잇기 index.html의 레벨링(RANK_EXP_PER_MIN·최대 870)과 같아야 해요. */
(function(){
  const RK_MAX = 870, RK_PER_MIN = 2400, RK_KEY = 'jumprope_wordgame-rank-log';
  const rkStep = l => l < 30 ? 120 / 29 : l < 60 ? 240 / 30 : l < 90 ? 360 / 30 : 720 / 30;
  const CUM = [0, 0]; for(let l = 1; l < RK_MAX; l++) CUM[l + 1] = CUM[l] + Math.round(rkStep(l) * RK_PER_MIN);
  const lvOf = t => { t = +t; if(!isFinite(t) || t < 0) t = 0; let lo = 1, hi = RK_MAX; while(lo < hi){ const m = (lo + hi + 1) >> 1; if(CUM[m] <= t) lo = m; else hi = m - 1; } return lo; };
  const rkGet = () => { try{ return JSON.parse(localStorage.getItem(RK_KEY) || '{}') || {}; }catch(_){ return {}; } };
  const rkPut = o => { try{ localStorage.setItem(RK_KEY, JSON.stringify(o)); localStorage.setItem('jd_sync', String(Date.now())); }catch(_){ } };
  /* 이 폰 주인 이름: 온라인 최근 이름 → 내 플레이어 1 → (둘 다 없으면) 경험치 기록이 가장 많은 사람 */
  function rkName(log){
    let n = ''; try{ n = localStorage.getItem('online_last_name') || ''; }catch(_){ }
    if(!n){ try{ n = ((JSON.parse(localStorage.getItem('jd_playerNames')) || []).filter(x => x && String(x).toUpperCase() !== 'CPU')[0]) || ''; }catch(_){ } }
    n = String(n || '').trim();
    if(!n){ let best = -1; Object.keys(log).forEach(k => { if(String(k).toUpperCase().includes('CPU')) return; const v = +log[k] || 0; if(v > best){ best = v; n = k; } }); }
    return n;
  }
  if(!window.RPG_GIVE_EXP) window.RPG_GIVE_EXP = function(n){
    n = Math.max(0, Math.round(n)); if(!n) return null;
    const log = rkGet(), name = rkName(log); if(!name) return null;
    const prevT = +log[name] || 0, nextT = prevT + n;
    log[name] = nextT; rkPut(log);
    try{ window.RPG_LV = lvOf(nextT); }catch(_){ }
    return { name, add:n, prev:lvOf(prevT), next:lvOf(nextT) };
  };
  if(!window.RPG_SPEND_EXP) window.RPG_SPEND_EXP = function(n){
    n = Math.max(0, Math.round(n));
    const log = rkGet(), name = rkName(log); if(!name) return { ok:false, why:'noplayer' };
    if(!n) return { ok:true, add:0 };
    const pt = +log[name] || 0; if(pt < n) return { ok:false, why:'low' };
    const nt = pt - n, nx = lvOf(nt); if(nx < lvOf(pt)) return { ok:false, why:'lv' };
    log[name] = nt; rkPut(log); try{ window.RPG_LV = nx; }catch(_){ }
    return { ok:true, add:-n };
  };
})();

/* ===== 소리: 듀얼리스트 효과음(CC0) + 배경음악 ===== */
J.SND = (function(){
  let ac = null, on = J.LS.get('rpg_snd', true), mus = J.LS.get('rpg_bgm', true), buf = {}, last = {}, bgm = null, bgmKey = '';
  const LIST = ['swing1','swing2','swing3','hit1','hit2','hit3','crit','mdie','mdie2','hurt','roll','spin','ult','slam','warn','coin','clear','spawn','heal','ui','boss','loot'];
  const VOL = { swing1:.5, swing2:.5, swing3:.6, hit1:.8, hit2:.8, hit3:.9, crit:1, mdie:.7, mdie2:.7, hurt:.8, roll:.5, spin:.8, ult:.9, slam:.9, warn:.6, coin:.35, clear:.8, spawn:.4, heal:.6, ui:.5, boss:.8, loot:.6 };
  function ctx(){ if(!ac){ try{ ac = new (window.AudioContext || window.webkitAudioContext)(); }catch(_){ } } if(ac && ac.state === 'suspended') ac.resume(); return ac; }
  async function load(){ const a = ctx(); if(!a) return; await Promise.all(LIST.map(async k => { try{ const r = await fetch('sfx-' + k + '.m4a'); if(!r.ok) return; const ab = await r.arrayBuffer(); buf[k] = await a.decodeAudioData(ab); }catch(_){ } })); }
  function play(k, v, rate){ if(!on) return; const a = ctx(); if(!a) return; const t = a.currentTime; if(last[k] && t - last[k] < .045) return; last[k] = t;
    const b = buf[k]; if(!b){ synth(a, t, k); return; } const s = a.createBufferSource(); s.buffer = b; s.playbackRate.value = rate || J.rnd(.94, 1.06); const g = a.createGain(); g.gain.value = (VOL[k] || .6) * (v == null ? 1 : v); s.connect(g); g.connect(a.destination); s.start(); }
  /* 효과음 파일을 못 쓰는 기기에서는 짧게 만들어서 내요 */
  let nb = null; function noise(a){ if(nb) return nb; const bb = a.createBuffer(1, a.sampleRate * .5, a.sampleRate), d = bb.getChannelData(0); for(let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return nb = bb; }
  function env(a, t, v, at, dec){ const g = a.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + at); g.gain.exponentialRampToValueAtTime(.0001, t + at + dec); g.connect(a.destination); return g; }
  function nz(a, t, v, f0, f1, dur, type){ const s = a.createBufferSource(); s.buffer = noise(a); const f = a.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur); s.connect(f); f.connect(env(a, t, v, .008, dur)); s.start(t); s.stop(t + dur + .05); }
  function tone(a, t, v, f0, f1, dur, type){ const o = a.createOscillator(); o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur); o.connect(env(a, t, v, .005, dur)); o.start(t); o.stop(t + dur + .05); }
  function synth(a, t, k){ try{ if(/^swing|roll/.test(k)) nz(a, t, .18, 700, 2600, .13); else if(/^hit/.test(k)){ tone(a, t, .5, 170, 55, .13); nz(a, t, .35, 2200, 600, .07, 'lowpass'); } else if(k === 'crit'){ tone(a, t, .55, 220, 50, .2); nz(a, t, .4, 4000, 900, .1); } else if(k === 'slam' || k === 'ult' || /^mdie/.test(k)){ tone(a, t, .6, 120, 35, .4); nz(a, t, .45, 1500, 120, .35, 'lowpass'); } else if(k === 'coin'){ tone(a, t, .1, 1046, 1046, .06, 'square'); tone(a, t + .06, .1, 1568, 1568, .1, 'square'); } else if(k === 'hurt') tone(a, t, .35, 300, 90, .2, 'sawtooth'); else if(k === 'warn' || k === 'boss'){ tone(a, t, .16, 520, 520, .12, 'square'); tone(a, t + .16, .16, 520, 520, .12, 'square'); } else if(k === 'clear'){ [523, 659, 784, 1046].forEach((f, i) => tone(a, t + i * .09, .14, f, f, .18, 'square')); } else tone(a, t, .12, 660, 880, .08, 'triangle'); }catch(_){ } }
  /* 스테이지 → 음악 파일 이름: 1~5 → bgm-01-05.mp3, 6~10 → bgm-06-10.mp3 … 46~50 → bgm-46-50.mp3 (50 넘으면 마지막 곡) */
  J.bgmKey = st => { const g = Math.min(9, Math.max(0, Math.floor((st | 0) / 5))), lo = g * 5 + 1, p = n => ('0' + n).slice(-2); return p(lo) + '-' + p(lo + 4); };
  function music(k){ if(bgmKey === k && bgm) { if(mus && bgm.paused) bgm.play().catch(() => {}); return; } bgmKey = k; try{ if(bgm){ bgm.pause(); } bgm = new Audio('bgm-' + k + '.mp3'); bgm.loop = true; bgm.volume = .35; if(mus) bgm.play().catch(() => {}); }catch(_){ } }
  document.addEventListener('visibilitychange', () => { if(!bgm) return; if(document.hidden) bgm.pause(); else if(mus) bgm.play().catch(() => {}); });
  return { load, play, ctx, music, get on(){ return on; }, set on(v){ on = v; J.LS.set('rpg_snd', v); }, get mus(){ return mus; }, set mus(v){ mus = v; J.LS.set('rpg_bgm', v); if(bgm){ if(v) bgm.play().catch(() => {}); else bgm.pause(); } } };
})();

/* ===== 끝말잇기에서 맵·몬스터·이펙트·변신 그림 가져오기 ===== */
J.autoPack = async function(){
  const L = J.L, B = (typeof JDSHARE !== 'undefined') ? JDSHARE.base : ''; if(!L || !L.applyPack || !B) return;
  let m = null; try{ const r = await fetch(B + 'baram-data.json', { cache:'no-store' }); if(!r.ok) return; m = await r.json(); }catch(_){ return; }
  if(!m || !m.files || !m.files.length) return;
  const KEY = 'jd-baram-rpg'; let done = ''; try{ done = localStorage.getItem(KEY) || ''; }catch(_){ }
  const sig = String(m.v) + '|' + m.files.join(','); if(done === sig) return;
  J.msg('새 장비표 받는 중…');
  const got = {}; let total = 0;
  for(const f of m.files){
    const alt = String(f).replace(/ \(\d+\)(?=\.json$)/, ''), names = [String(f), alt !== String(f) ? alt : String(f).replace(/\.json$/, ' (1).json')];
    let r = null; for(const nm of names){ r = await fetch(B + nm.split('/').map(encodeURIComponent).join('/'), { cache:'no-store' }); if(r.ok) break; }   /* 이름 뒤 ' (1)' 있든 없든 둘 다 시도 */
    if(!r.ok){ J.toast && J.toast('새 장비표 파일을 못 받았어요 (' + r.status + '): ' + f); return; }
    const p = await r.json(); if(!p || p.format !== 'baram-part') continue; got[p.idx] = p; total = p.total;
  }
  if(!total) return; for(let i = 1; i <= total; i++) if(!got[i]){ J.toast && J.toast('장비표 조각 ' + i + '번이 없어요'); return; }
  const meta = got[1], loot = Object.assign({}, meta.loot, { items:(meta.items || []).slice(), store:Object.assign({}, meta.store) });
  for(let i = 2; i <= total; i++){ loot.items = loot.items.concat(got[i].items || []); Object.assign(loot.store, got[i].store || {}); }
  if(!loot.items.length) return;
  for(let i = 0; i < 60 && !L.goldOk; i++) await new Promise(r => setTimeout(r, 100));   /* 가방이 저장소를 다 읽은 뒤에 적용 (안 그러면 옛 장비표가 덮어써요) */
  if(!L.goldOk) return;
  const n = L.applyPack(loot);
  try{ L._mf = 0; if(L.moFix) L.moFix(); }catch(_){ }
  try{ localStorage.setItem(KEY, sig); }catch(_){ }
  try{ J.toast && J.toast('🎁 장비 ' + n + '개를 받았어요'); }catch(_){ }
};
J.boot = async function(){
  J.msg('끝말잇기 정보 읽는 중… (처음 한 번은 조금 오래 걸려요)');
  try{ const r = await fetch('rpg-config.json', { cache:'no-cache' }); if(r.ok) J.cfgApply(await r.json()); }catch(_){ }
  J.cfgApply(J.LS.get('rpg_cfg_local', null));
  const sh = J.share(), cands = [];
  try{ if(sh.page){ const u = new URL(sh.page, location.href); if(u.origin === location.origin) cands.push(u.pathname); } }catch(_){ }
  cands.push('/index3/', '../index3/', '../', 'index3.html');
  const ok = await JDSHARE.load(cands);
  J.LIB = (ok && JDSHARE.json('jd-lib')) || { map:[], mob:[], boss:[], st:[] };
  J.HID = ok ? JDSHARE.json('jd-hidden') : null;
  const FXD = ok ? JDSHARE.json('jd-dlx-fx') : null;
  J.REG = []; (J.LIB.st || []).forEach((c, i) => { if(c && c.m >= 0 && J.LIB.map[c.m] && c.mob && c.mob.length) J.REG.push({ i, map:c.m, mob:c.mob.filter(x => J.LIB.mob[x]), boss:(c.boss || []).filter(x => J.LIB.boss[x]) }); });
  J.FX = {}; if(FXD) await Promise.all(Object.keys(FXD).map(async k => { const d = FXD[k], im = await J.loadImg(d.src); if(im) J.FX[k] = { im, w:d.w, h:d.h, n:d.n, c:d.c, s:d.s || 1 }; }));
  /* 가방·강화·변신 같은 시스템 붙이기 */
  window.RPG_TIER = () => { const s = J.share(); return (s.hero && s.hero.tier) | 0; };
  window.jdpOn = window.jdpOn || function(k){ return !window.JDP || JDP.on(k); };
  window.RPG = window.RPG || { st:0 };
  if(sh.base) window.JD_DLX_SRC = sh.base;
  if(ok){ J.msg('가방·강화·변신 연결 중…'); try{ JDSHARE.inject(); }catch(e){ console.warn('loot', e); } }
  J.L = window.LOOT || null;
  /* [rpg-v17] 새 장비표(baram-data.json 이 가리키는 baram_all_*.json)를 RPG가 직접 받아 적용 — 끝말잇기를 따로 안 열어도 되게 */
  try{ await J.autoPack(); }catch(e){ console.warn('autoPack', e); }
  /* 듀얼리스트 유닛(몬스터·변신·동료) */
  J.msg('변신·동료 그림 읽는 중…');
  const cb = ['dlx-', 'dlx/']; if(sh.base) cb.push(sh.base); try{ const s = localStorage.getItem('jd_dlx_src'); if(s) cb.push(s); }catch(_){ } cb.push(JDSHARE.base + 'dlx-', '/index3/dlx-');
  J.DL = null; J.DLB = {}; J.DLP = {};
  for(const b of cb){ try{ const r = await fetch(b + 'index.json'); if(r.ok){ J.DL = await r.json(); J.DL.base = b; break; } }catch(_){ } }
  if(J.DL) J.DL.units.forEach((u, i) => { u.o = i; J.DLB[u.k] = u; });
  /* 자무주 모션 팩 (영웅) */
  J.msg('캐릭터 그림 읽는 중…');
  J.MO = null; for(const b of ['mo-index.json', '/rpg/mo-index.json']){ try{ const r = await fetch(b); if(r.ok){ J.MO = await r.json(); J.MO.pre = b.replace(/mo-index\.json$/, ''); break; } }catch(_){ } }
  J.moBase = J.MO ? await J.loadImg(J.MO.base.s) : null;
  return ok;
};
J.dlPack = function(p){ if(!J.DL) return Promise.resolve(false); if(J.DLP[p]) return J.DLP[p]; J.DLP[p] = fetch(J.DL.base + 'pack-' + ('00' + p).slice(-3) + '.json').then(r => r.json()).then(async d => { await Promise.all(Object.keys(d).map(async k => { if(J.DLB[k]) J.DLB[k].im = await J.loadImg(d[k]); })); return true; }).catch(() => { delete J.DLP[p]; return false; }); return J.DLP[p]; };
J.dlSeg = function(u, m){ const n = u.n; return m === 'a' ? [n[0], n[1]] : m === 'h' ? [n[0] + n[1], n[2]] : m === 'd' ? [n[0] + n[1] + n[2], n[3]] : [0, n[0]]; };
J.DLG = { hp:[1.3,1.6,2,2.6,3.4,4.5], atk:[1.1,1.2,1.35,1.5,1.7,2], gold:[2,3,5,8,12,20], col:['#5fd38a','#4aa3ff','#b45cff','#ff9a2e','#ff4b4b','#46d7ff'], nm:['고급','희귀','영웅','전설','신화','유일'] };

/* ===== 영웅 그림 (내 장비를 입혀서 한 장의 그림판으로) ===== */
const MOC = { weapon:'weapon', helmet:'helmet', armor:'coat', set:'set', outer:'armor', shield:'shield', cloak:'cape', shoes:'shoes' };
/* [v24] 레이어 순서(아래 → 위)를 내가 정해요. 'body'는 기본 몸. 기본값은 v23과 똑같아요.
   저장 위치: localStorage 'rpg_layers' (⚙ 설정 → 🧅 레이어 순서). 빠진 칸·모르는 칸은 알아서 채워서 항상 10칸이에요 */
const DEF_ORDER = ['body','shoes','cape','weapon','shield','hair','helmet','set','coat','armor'];
J.DEF_ORDER = DEF_ORDER.slice();
J.layerOrder = function(){ const o = J.LS.get('rpg_layers', null), out = [];
  if(Array.isArray(o)) for(const c of o) if(DEF_ORDER.includes(c) && !out.includes(c)) out.push(c);
  for(const c of DEF_ORDER) if(!out.includes(c)) out.push(c);
  return out; };
const KEYS = ['walk_r','walk_d','walk_u','atk_r','atk_d','atk_u'];
const CATN = { body:'몸', cape:'망토', set:'세트옷', armor:'겉옷', coat:'갑옷', shoes:'신발', helmet:'투구', shield:'방패', weapon:'무기', hair:'헤어' };
J.CATN = CATN;
const bareName = n => String(n || '').replace(/^(갑옷|헤어|얼굴장식|얼굴|목_어깨장식|장신구|방패_보조무기|방패|망토|신발|세트옷|무기|겉옷|투구)_/, '');
const MOP = {};
/* [v14] 새 모션 파일은 앞/뒤를 _f/_b로 저장(옛 파일은 _d/_u) → 둘 다 읽게 */
const moK = (o, k) => o[k] || o[k.replace(/_d$/, '_f').replace(/_u$/, '_b')] || o[k.replace(/_f$/, '_d').replace(/_b$/, '_u')];
J.moPack = function(c, p){ const k = c + p; if(!MOP[k]) MOP[k] = fetch(J.MO.pre + 'mo-' + c + '-' + ('00' + p).slice(-3) + '.json').then(r => r.json()).catch(() => null); return MOP[k]; };
async function moItem(c, nm){ const MO = J.MO; const idx = MO._i || (MO._i = (() => { const o = {}; Object.keys(MO.cats).forEach(c => { o[c] = {}; MO.cats[c].forEach(a => { o[c][a[0]] = [a[1], a[2]]; }); }); return o; })());
  const a = idx[c] && idx[c][nm]; if(!a) return null; const pk = await J.moPack(c, a[0]); if(!pk) return null; const it = pk.items[a[1]]; if(!it) return null; if(!it._s){ it._s = await J.loadImg(it.s); it._e = it.e ? await J.loadImg(it.e) : null; } return it; }
J.heroEq = async function(){ if(J.L && J.L.eq) return J.L.eq; return (await J.kget('eq')) || {}; };
J.buildHero = async function(){
  const MO = J.MO; if(!MO || !J.moBase) return null;
  const W = MO.W, H = MO.H, wear = {}, miss = [], hidC = [], eq = await J.heroEq(), order = J.layerOrder();
  Object.keys(eq || {}).forEach(gc => { const c = MOC[gc]; if(!c) return; const k = eq[gc]; if(!k) return; if(J.L && J.L.hid && J.L.hid[k]){ hidC.push(c); return; } try{   /* [v22] 눈 표시로 숨긴 장비는 안 그려요 */ const bn = bareName(String(k).split('|')[1].split('@')[0]); wear[c] = (J.L && J.L.moName) ? J.L.moName(c, bn) : bn; }catch(_){ } });
  const hair = J.LS.get('rpg_hair', null); if(hair) wear.hair = hair;
  J.wearNow = wear; J.wearHid = hidC;   /* [v24] 레이어 창이 지금 입은 것을 보여주는 데 써요 */
  const its = {}; for(const c of Object.keys(wear)){ const it = await moItem(c, wear[c]); if(it) its[c] = it; else miss.push(c); }
  J.outfitMiss = miss.map(c => CATN[c] + ': ' + wear[c]);
  const full = {}; let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for(const key of KEYS){ const bv = moK(MO.base.v, key), [bx, by, bw, bh] = MO.base.box, arr = [];
    for(let f = 0; f < bv.length; f++){ const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d', { willReadFrequently:true });
      for(const c of order){ if(c === 'body'){ x.drawImage(J.moBase, bv[f][0], bv[f][1], bw, bh, bx, by, bw, bh); continue; } const it = its[c]; if(!it) continue; const v = moK(it.v, key); if(!v) continue; const p = v[4][f] || v[4][v[4].length - 1];
        if(it._e){ x.globalCompositeOperation = 'destination-out'; x.drawImage(it._e, p[0], p[1], v[2], v[3], v[0], v[1], v[2], v[3]); x.globalCompositeOperation = 'source-over'; }
        if(it._s) x.drawImage(it._s, p[0], p[1], v[2], v[3], v[0], v[1], v[2], v[3]); }
      const d = x.getImageData(0, 0, W, H).data;
      for(let yy = 0; yy < H; yy += 2) for(let xx = 0; xx < W; xx += 2) if(d[(yy * W + xx) * 4 + 3] > 8){ if(xx < x0) x0 = xx; if(xx > x1) x1 = xx; if(yy < y0) y0 = yy; if(yy > y1) y1 = yy; }
      arr.push(cv); }
    full[key] = arr; }
  if(x1 <= x0){ x0 = 0; y0 = 0; x1 = W - 1; y1 = H - 1; }
  x0 = Math.max(0, x0 - 4); y0 = Math.max(0, y0 - 4); x1 = Math.min(W - 1, x1 + 4); y1 = Math.min(H - 1, y1 + 4);
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1, cols = 4, at = document.createElement('canvas'); at.width = cw * cols; at.height = ch * KEYS.length; const ax = at.getContext('2d');
  const fr = {};
  KEYS.forEach((key, r) => { fr[key] = full[key].map((cv, i) => { ax.drawImage(cv, -x0 + i * cw, -y0 + r * ch); return [i * cw, r * ch, cw, ch]; }); });
  return { canvas:at, fr, w:cw, h:ch, foot:[MO.foot[0] - x0, MO.foot[1] - y0] };
};

/* ===== 능력치: 끝말잇기 가방(장비) + 변신·동료 ===== */
J.stats = function(){ const sh = J.share(), h = sh.hero || {}, tf = sh.tfS || {}, cp = sh.cpS || {};
  let atk0 = h.atk || 0, hp0 = h.hp || 100;
  try{ if(J.L && J.L.atk){ atk0 = J.L.atk(); hp0 = J.L.hp(); } }catch(_){ }
  return { atk: Math.round((40 + atk0) * (1 + (tf.R || 0) / 100) * J.CFG.heroAtk), hp: Math.round(Math.max(100, hp0) * (1 + (tf.Q || 0) / 100) * J.CFG.heroHp), tier: h.tier || 0, cpC: cp.C || 0, cp: sh.cp, tf: sh.tf }; };
})(window.J);
