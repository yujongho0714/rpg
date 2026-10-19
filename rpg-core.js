/* 정도 RPG — 기본 도구 · 설정 · 저장 · 소리 · 그림 불러오기 */
'use strict';
window.J = window.J || {};
(function(J){
/* ===== 설정 (운영자 모드 에디터에서 바꿀 수 있어요) ===== */
J.CFG0 = {
  goldMul: 1,      // 끝말잇기 몬스터 골드 × 이 값
  expMul: 1,       // [rpg-v39] 경험치 × 이 값 (실시간 이벤트에서도 써요)
  cubeMul: 1,      // 큐브 × 이 값 [rpg-v38] 0 → 1 (예전엔 큐브가 아예 안 나왔어요)
  dropP: 100,         // 일반 몬스터 장비 드롭 확률(%) — 끝말잇기와 같은 장비표
  dropBoss: 100,     // 보스 장비 드롭 확률(%)
  ticketP: 100,       // 변신·동료 뽑기권 드롭 검사 확률(%) — 끝말잇기와 같은 확률표를 이만큼만 돌려요
  quota: 14,         // 보스 문이 열리는 사냥 수 [rpg-v38] 18 → 14
  mapLen: 4200,      // 맵 길이
  bossHp: 2,       // 보스 체력 배율 [rpg-v38] 2.5 → 2
  monHp: 1, monAtk: 1, // 몬스터 체력·공격 배율
  heroAtk: 1, heroHp: 1, // 내 공격·체력 배율
  combo: [0.45, 0.45, 0.9],
  s1: 0.6, s1cd: 5,  // 회오리 (3번)
  s2: 1.6, s2cd: 9,  // 뇌전 가르기
  s3: 2.6, s3cd: 15, // 필살기 운석
  roll: 0.7, pot: 40, pots: 3,
  respawn: 7,        // 몬스터 다시 나오는 시간(초)
  hidP: 6,           // [rpg-v38] 3 → 6 (보스 잡으면 히든 포탈 확률 %)
  /* [rpg-v37] 끝말잇기와 같게 맞추는 값들 (1 = 켬 / 0 = 끔) — 골드·드랍·뽑기권은 위 숫자를 끝말잇기와 같게 바꿨어요 */
  diff: 1,           // 전직 단계별 몬스터 체력·공격 배율 (끝말잇기와 같음)
  dlGoldPow: 1,      // 듀얼리스트 몬스터 골드 배율의 거듭제곱 (1 = 끝말잇기와 같음 · 0.5 = 예전 제곱근)
  manGold: 1,        // 직접 플레이 골드 보너스(×2) 적용
  eliteTwice: 1,     // 정예는 장비를 한 번 더 굴림
  expOn: 1, expMin: 180, expCap: 60, expBoss: 1.5, expElite: 2,   // 처치 경험치 (전직 한 구간을 expMin분에 · 처치 사이 최대 expCap초)           // 보스 잡으면 히든 포탈 확률(%)
  curve: 0,          // 글로브뷰 휘어짐 (0 = 평평 · 어지러워서 기본은 끔)
  /* 타격감 — 1 = 기본, 0 = 끄기, 2 = 두 배. 최종 세기 = 전체 × 각 항목 */
  fxAll: 1, fxStop: 1, fxShake: 1, fxFlash: 1, fxSpark: 1, fxGlow: 1, fxPop: 1, fxZoom: 1, fxSquash: 1
};
J.CFG = Object.assign({}, J.CFG0);
/* [v20] 끝말잇기 쪽 성별·기본몸 함수는 RPG에 안 들어와요 → 가방 그림(L.draw)이 여자 몸으로 떨어지지 않게 여기서 남자로 고정 */
J.VER = 'rpg-v38';
/* [rpg-v38] 🛠 스테이지 보정 (update-v129): 예전에 열려 있던 스테이지 기록을 한 번만 처음으로 돌려요.
   · 끝말잇기(index3)와 같은 칸(jd_st_clr · jd_st_pick · jd_best_st · rpg_prog)을 같이 쓰므로 어느 쪽이 먼저 열려도 한 번만 실행돼요
   · 보정 뒤에 새로 깬 스테이지는 그대로 인정돼요 (jd_fix_st 표시가 있으면 다시는 안 건드려요)
   · 예전 기록은 jd_st_bak129 에 그대로 백업해 둬요 */
J.stageFix = function(){ try{
  const FK = 'jd_fix_st', FV = 129;
  if((parseInt(localStorage.getItem(FK), 10) || 0) >= FV) return false;
  const bak = {}; ['jd_st_clr', 'jd_st_pick', 'jd_best_st', 'rpg_prog'].forEach(k => { const v = localStorage.getItem(k); if(v != null) bak[k] = v; });
  localStorage.setItem('jd_st_bak129', JSON.stringify(bak));
  localStorage.removeItem('jd_st_clr'); localStorage.removeItem('jd_st_pick');
  localStorage.setItem('jd_best_st', '0'); localStorage.setItem('rpg_prog', JSON.stringify({ clr:0, pick:1 }));
  localStorage.setItem(FK, String(FV));
  return true;
}catch(_){ return false; } };
J.stageFix();
window.JD_HERO_SEX = window.JD_HERO_SEX || function(){ return 'M'; };
window.JD_HERO_IDLE = window.JD_HERO_IDLE || function(){ return J.moBase ? { im:J.moBase } : null; };
J.cfgApply = function(o){ if(!o || typeof o !== 'object') return; Object.keys(J.CFG0).forEach(k => { if(o[k] == null) return; if(Array.isArray(J.CFG0[k])){ if(Array.isArray(o[k]) && o[k].length === J.CFG0[k].length) J.CFG[k] = o[k].map(Number); } else if(isFinite(+o[k])) J.CFG[k] = +o[k]; }); };

/* ===== [rpg-v39] 실시간 전체 배율 — 운영자가 Firebase(jd_live/config)에 값을 넣으면 모든 폰이 새로고침 없이 바뀌어요 =====
   · 읽기만 해요 (쓰기는 3단계 운영자 화면에서) · 폰 저장값(rpg_cfg_local)에는 절대 쓰지 않아요 → 이벤트가 끝나면 저절로 원래 값
   · 인터넷이 없거나 Firebase가 안 불러와져도 게임은 그대로 돼요 */
J.live = (function(){
  const FB = { apiKey:'AIzaSyBhQaR8YuG4CovQgFBaPKd2nZSO7ZjP0PY', authDomain:'taekwondo-wordgame.firebaseapp.com', databaseURL:'https://taekwondo-wordgame-default-rtdb.asia-southeast1.firebasedatabase.app', projectId:'taekwondo-wordgame', storageBucket:'taekwondo-wordgame.firebasestorage.app', messagingSenderId:'376591184218', appId:'1:376591184218:web:d4a4ee50773e787e300363' };
  const VER = '10.12.2', LAST = 'rpg_live_last';
  /* 받을 수 있는 키와 범위 (이 밖의 키·숫자가 아닌 값·범위 밖 값은 무시) */
  const LIM = { goldMul:[0.01, 10], cubeMul:[0.01, 10], expMul:[0.01, 10], monHp:[0.01, 10], bossHp:[0.01, 10], dropP:[0, 1000], dropBoss:[0, 1000], ticketP:[0, 1000], hidP:[0, 100] };
  const S = { cfg:null, off:0, saved:{}, over:{}, ev:null, db:null, started:false, tried:0, first:true, sig:'' };
  const api = { onChange:null };
  const now = () => Date.now() + S.off;
  const num = (k, v) => { const L = LIM[k]; v = (typeof v === 'number') ? v : (typeof v === 'string' && v.trim() !== '' ? +v : NaN); return (isFinite(v) && v >= L[0] && v <= L[1]) ? v : null; };
  const fire = () => { try{ api.onChange && api.onChange(); }catch(_){ } };
  function calc(cfg){   /* 지금 켜져 있는 값만 골라요 (이벤트 시간이 지났으면 아무것도 안 켬) */
    const over = {}; let ev = null;
    if(!cfg || typeof cfg !== 'object') return { over, ev };
    const e = cfg.event;
    if(e && typeof e === 'object' && +e.endAt > 0){ if(+e.endAt <= now()) return { over, ev, ended:true }; ev = { name:String(e.name || ''), endAt:+e.endAt }; }
    Object.keys(LIM).forEach(k => { if(cfg[k] == null) return; const v = num(k, cfg[k]); if(v != null) over[k] = v; });
    return { over, ev };
  }
  function put(over){   /* J.CFG에 얹기 · 빠진 키는 원래 값으로 되돌리기 */
    Object.keys(S.saved).forEach(k => { if(!(k in over)){ J.CFG[k] = S.saved[k]; delete S.saved[k]; } });
    Object.keys(over).forEach(k => { if(!(k in S.saved)) S.saved[k] = J.CFG[k]; J.CFG[k] = over[k]; });
    S.over = over;
  }
  const sig = (o, ev) => JSON.stringify([o, ev && ev.endAt]);
  function refresh(quiet){
    const r = calc(S.cfg), s = sig(r.over, r.ev), had = Object.keys(S.over).length > 0;
    put(r.over); S.ev = r.ev;
    if(s !== S.sig){
      S.sig = s;
      if(!quiet){
        if(Object.keys(r.over).length) J.toast('🔥 ' + (r.ev && r.ev.name ? r.ev.name : '이벤트') + ' 시작! 위쪽 표시를 확인해요');
        else if(had) J.toast('⏰ 이벤트가 끝났어요. 원래 값으로 돌아갔어요');
      }
    }
    fire();
  }
  function save(){ try{ if(S.cfg) J.LS.set(LAST, { cfg:S.cfg, off:S.off }); else J.LS.set(LAST, null); }catch(_){ } }
  function loadJs(src){ return new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.async = true; s.onload = ok; s.onerror = () => no(new Error(src)); document.head.appendChild(s); }); }
  async function connect(){
    if(S.db) return;
    if(!(window.firebase && firebase.initializeApp && firebase.database)){
      const b = 'https://www.gstatic.com/firebasejs/' + VER + '/';
      if(!(window.firebase && firebase.initializeApp)) await loadJs(b + 'firebase-app-compat.js');
      if(!(firebase.database)) await loadJs(b + 'firebase-database-compat.js');
    }
    let app = null; try{ app = firebase.apps.find(a => a.name === 'jdlive'); }catch(_){ }
    if(!app) app = firebase.initializeApp(FB, 'jdlive');   /* 앱 이름 jdlive — 끝말잇기(online)·클라우드(jdcloud)와 안 겹쳐요 */
    S.db = app.database();
    S.db.ref('.info/serverTimeOffset').on('value', s => { S.off = Number(s && s.val()) || 0; refresh(true); });
    S.db.ref('jd_live/config').on('value', s => {
      S.cfg = s ? s.val() : null; save();
      const q = S.first; S.first = false; refresh(q);
    }, () => { });
  }
  api.start = function(){
    if(S.started) return; S.started = true;
    try{ const l = J.LS.get(LAST, null); if(l && l.cfg){ S.cfg = l.cfg; S.off = Number(l.off) || 0; refresh(true); } }catch(_){ }   /* 인터넷이 없어도 마지막 값(아직 안 끝났다면) */
    const go = () => { connect().catch(() => { S.db = null; }); };
    go();
    setInterval(() => { try{ if(!S.db && ++S.tried < 40) go(); refresh(false); }catch(_){ } }, 30000);   /* 30초마다: 이벤트가 끝났나 보고, 값을 다시 확인해요 */
  };
  /* 숫자 에디터가 J.CFG를 바꿔도 실시간 값이 이기도록 / 에디터에는 '원래 값'을 보여주도록 */
  api.base = function(k){ return (k in S.saved) ? S.saved[k] : J.CFG[k]; };
  api.rebase = function(o){ Object.keys(S.saved).forEach(k => { if(!o || (k in o)) S.saved[k] = J.CFG[k]; }); Object.keys(S.over).forEach(k => { J.CFG[k] = S.over[k]; }); fire(); };
  api.state = function(){ return { over:S.over, ev:S.ev, base:S.saved, now:now() }; };
  /* 위쪽 표시 글자: 원래와 다른 것만 */
  api.badge = function(){
    const o = S.over, b = k => (k in S.saved ? S.saved[k] : J.CFG[k]), p = [];
    const m = (k, nm) => { if(k in o && Math.abs(o[k] - b(k)) > 1e-9) p.push(nm + '×' + (Math.round(o[k] * 100) / 100)); };
    const q = (k, nm) => { if(k in o && Math.abs(o[k] - b(k)) > 1e-9) p.push(nm + ' ' + Math.round(o[k]) + '%'); };
    m('expMul', '경험치'); m('goldMul', '골드'); m('cubeMul', '큐브'); q('dropP', '장비 드롭'); q('dropBoss', '보스 드롭'); q('ticketP', '뽑기권');
    if(!p.length) return '';
    let t = '🔥 ' + p.join(' · ');
    if(S.ev){ const d = new Date(S.ev.endAt), z = n => ('0' + n).slice(-2), tm = z(d.getHours()) + ':' + z(d.getMinutes()); t += ' · ' + (S.ev.endAt - now() > 864e5 ? (d.getMonth() + 1) + '/' + d.getDate() + ' ' : '') + tm + '까지'; }
    return t;
  };

  /* ===== [rpg-v40] 운영자 쓰기 — 구글 로그인 + 전체 적용 (규칙: 운영자 이메일 + 이메일 인증된 구글 계정만 쓸 수 있어요) ===== */
  const OP = 'schp2223@gmail.com';
  api.now = now; api.lim = LIM; api.OP = OP; api.onAuth = null;
  function authReady(){
    return connect().then(async () => {
      if(!(firebase.auth)) await loadJs('https://www.gstatic.com/firebasejs/' + VER + '/firebase-auth-compat.js');
      if(!S.auth){
        S.auth = firebase.app('jdlive').auth();
        S.auth.onAuthStateChanged(() => { try{ api.onAuth && api.onAuth(); }catch(_){ } });
        try{ S.auth.getRedirectResult().catch(() => { }); }catch(_){ }
      }
      return S.auth;
    });
  }
  api.init = () => authReady();
  api.user = () => { try{ const u = S.auth && S.auth.currentUser; return u ? { email:u.email || '', ok:(u.email === OP && u.emailVerified === true) } : null; }catch(_){ return null; } };
  api.login = async function(){
    const a = await authReady(), p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt:'select_account' });
    try{ await a.signInWithPopup(p); }
    catch(e){
      const c = e && e.code;
      if(c === 'auth/popup-blocked' || c === 'auth/operation-not-supported-in-this-environment' || c === 'auth/web-storage-unsupported'){ await a.signInWithRedirect(p); return; }
      if(c === 'auth/popup-closed-by-user' || c === 'auth/cancelled-popup-request') return;
      throw e;
    }
  };
  api.logout = async function(){ const a = await authReady(); await a.signOut(); };
  /* 값 검사 — 문제가 있으면 쉬운 말 글자를, 괜찮으면 null */
  api.check = function(cfg){
    const ks = Object.keys(cfg || {}).filter(k => k in LIM);
    if(!ks.length) return '바꿀 값을 하나 이상 넣어 주세요';
    for(const k of ks){ if(num(k, cfg[k]) == null) return (k + ' 값이 범위 밖이에요 (' + LIM[k][0] + ' ~ ' + LIM[k][1] + ')'); }
    return null;
  };
  function needOp(){ const u = api.user(); if(!u) throw new Error('먼저 구글로 로그인해 주세요'); if(!u.ok) throw new Error('운영자 계정이 아니에요 (' + u.email + ')'); return u; }
  api.publish = async function(cfg, ev){
    const u = needOp(), bad = api.check(cfg); if(bad) throw new Error(bad);
    const out = {}; Object.keys(cfg).forEach(k => { if(k in LIM) out[k] = num(k, cfg[k]); });
    if(ev && ev.endAt){ if(ev.endAt <= now()) throw new Error('끝나는 시각이 이미 지났어요'); out.event = { name:String(ev.name || '이벤트').slice(0, 30), endAt:ev.endAt }; }
    out.updatedAt = firebase.database.ServerValue.TIMESTAMP; out.updatedBy = u.email;
    await connect(); await S.db.ref('jd_live/config').set(out);
  };
  api.clear = async function(){ needOp(); await connect(); await S.db.ref('jd_live/config').remove(); };
  api.db = () => S.db;   /* [rpg-v41] 우편함이 같은 연결을 쓰도록 */
  api.errText = function(e){ const c = e && e.code, m = (e && e.message) || ''; if(c === 'PERMISSION_DENIED' || /permission_denied/i.test(m)) return '운영자 계정이 아니라서 거부됐어요'; if(c === 'auth/unauthorized-domain') return '이 주소가 Firebase 로그인 허용 목록에 없어요 (콘솔 → Authentication → 설정 → 승인된 도메인)'; if(c === 'auth/network-request-failed') return '인터넷이 불안정해요'; return m || '실패했어요'; };
  return api;
})();
{ const _ca = J.cfgApply; J.cfgApply = function(o){ _ca(o); try{ J.live.rebase(o); }catch(_){ } }; }   /* 에디터·파일로 값을 넣어도 실시간 값이 먼저예요 */

/* ===== [rpg-v41] 📬 우편함 — 운영자가 jd_mail/box 에 올린 우편을 아이가 받아요 (골드·큐브·뽑기권) =====
   · 받기 순서: ① jd_mail/claimed/{아이키}/{우편id} 에 먼저 기록(이미 있으면 서버가 거부) → ② 성공했을 때만 지급 → 같은 우편은 한 번만
   · 인터넷이 없으면 받을 수 없어요(오프라인 지급 금지) · Firebase가 안 불러와져도 게임은 그대로 돼요 */
J.mail = (function(){
  const PEND = 'rpg_mail_pend', DEV = 'rpg_mail_dev';
  const S = { box:{}, boxOk:false, cl:{}, sig:'', refs:[], boxSub:false, conn:false, seen:null, busy:{}, started:false, tick:0 };
  const api = { onChange:null };
  const clean = n => String(n == null ? '' : n).replace(/[.$#\[\]\/]/g, '_');
  const fire = () => { try{ api.onChange && api.onChange(); }catch(_){ } };
  const cnt = v => { v = +v; return (isFinite(v) && v > 0) ? Math.floor(v) : 0; };
  function nameKey(){   /* 끝말잇기 랭킹과 같은 이름 → 키 */
    let n = null;
    try{ n = localStorage.getItem('online_last_name'); if(n){ try{ const j = JSON.parse(n); if(typeof j === 'string') n = j; }catch(_){ } } }catch(_){ }
    if(!n){ try{ const r = localStorage.getItem('jd_playerNames'); if(r){ let j = null; try{ j = JSON.parse(r); }catch(_){ j = r; } if(Array.isArray(j)){ const f = j[0]; n = (f && typeof f === 'object') ? (f.name || f.n) : f; } else if(typeof j === 'string') n = j; } }catch(_){ } }
    n = (n == null ? '' : String(n)).trim(); return n ? clean(n) : '';
  }
  function devKey(){ let d = ''; try{ d = localStorage.getItem(DEV) || ''; if(!d){ d = 'dev_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); localStorage.setItem(DEV, d); } }catch(_){ d = 'dev_tmp'; } return d; }
  const myKeys = () => { const a = [], n = nameKey(); if(n) a.push(n); a.push(devKey()); return a; };
  const claimKey = () => nameKey() || devKey();
  const isClaimed = id => { for(const k of Object.keys(S.cl)) if(S.cl[k] && S.cl[k][id] != null) return true; return false; };
  const loaded = () => { if(!S.boxOk) return false; const ks = myKeys(); return ks.every(k => S.cl[k]); };
  function items(it){ it = (it && typeof it === 'object') ? it : {}; const c = (it.cubes && typeof it.cubes === 'object') ? it.cubes : {}; return { gold:Math.min(cnt(it.gold), 1e10), sus:Math.min(cnt(c.sus), 1e6), red:Math.min(cnt(c.red), 1e6), black:Math.min(cnt(c.black), 1e6), t1:Math.min(cnt(it.t1), 1e6), t2:Math.min(cnt(it.t2), 1e6) }; }
  const empty = it => !(it.gold || it.sus || it.red || it.black || it.t1 || it.t2);
  api.text = function(it){ const p = [], f = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); if(it.gold) p.push('💰 골드 ' + f(it.gold)); if(it.sus) p.push('🔷 큐브 ' + f(it.sus)); if(it.red) p.push('🟥 큐브 ' + f(it.red)); if(it.black) p.push('⬛ 큐브 ' + f(it.black)); if(it.t1) p.push('🎫 뽑기권 ' + f(it.t1)); if(it.t2) p.push('🎟 뽑기권 ' + f(it.t2)); return p.join(' · ') || '(보상 없음)'; };
  function mine(m){ const t = m.to; if(t == null || t === 'all') return true; const n = nameKey(); return !!n && clean(t) === n; }
  api.list = function(){
    if(!loaded()) return [];
    const now = J.live.now(), out = [];
    Object.keys(S.box || {}).forEach(id => {
      const m = S.box[id]; if(!m || typeof m !== 'object' || !mine(m)) return;
      if(+m.expireAt > 0 && +m.expireAt <= now) return;
      if(isClaimed(id)) return;
      out.push({ id, title:String(m.title || '우편').slice(0, 40), body:String(m.body || '').slice(0, 500), createdAt:+m.createdAt || 0, expireAt:+m.expireAt || 0, personal:(m.to != null && m.to !== 'all'), items:items(m.items) });
    });
    out.sort((a, b) => b.createdAt - a.createdAt); return out;
  };
  api.online = () => !!(S.conn && navigator.onLine !== false);
  api.count = () => api.list().length;
  async function grant(it){   /* 실제 지급 (기존 지급 함수 그대로) */
    const L = J.L; if(!L) throw new Error('가방 없음');
    if(it.gold) L.addGold(it.gold);
    if(it.sus || it.red || it.black) L.addCubes({ sus:it.sus, red:it.red, black:it.black });
    if((it.t1 || it.t2) && L.dlx){ L.dlx.t1 = (L.dlx.t1 | 0) + it.t1; L.dlx.t2 = (L.dlx.t2 | 0) + it.t2; await J.kset('dlx', L.dlx); }
  }
  const pendGet = () => { const p = J.LS.get(PEND, {}); return (p && typeof p === 'object') ? p : {}; };
  const pendSet = p => J.LS.set(PEND, p);
  const pk = (k, id) => k + '|' + id;
  function pendDel(k, id){ const p = pendGet(); delete p[pk(k, id)]; pendSet(p); }
  async function paid(k, id, it){   /* 지급하고 '진행 중' 표시를 지워요 · 지급이 실패해도 받은 기록은 이미 있으니 운영자에게 알리도록 해요 */
    try{ await grant(it); }
    catch(e){ try{ console.error('[우편 지급 실패] 우편 id =', id, it, e); }catch(_){ } J.toast('⚠ 문제가 생겼어요. 운영자에게 알려 주세요 (우편 ' + id + ')'); }
    pendDel(k, id);
  }
  api.claim = async function(id){
    if(S.busy[id]) return { ok:false, msg:'처리 중이에요' };
    const L = J.L;
    if(!L || !L.addGold) return { ok:false, msg:'끝말잇기 가방을 못 불러왔어요. 끝말잇기를 한 번 연 다음 다시 눌러 주세요' };
    if(!api.online()) return { ok:false, msg:'📡 인터넷이 필요해요' };
    const m = api.list().find(x => x.id === id);
    if(!m) return { ok:false, msg:'이미 받았거나 없어진 우편이에요' };
    if((m.items.t1 || m.items.t2) && !L.dlx) return { ok:false, msg:'뽑기권 가방을 못 불러왔어요. 끝말잇기를 한 번 연 다음 다시 눌러 주세요' };
    const db = J.live.db(); if(!db) return { ok:false, msg:'📡 인터넷이 필요해요' };
    S.busy[id] = 1;
    const k = claimKey(), t = Math.floor(J.live.now());
    const p = pendGet(); p[pk(k, id)] = { k, id, t, it:m.items }; pendSet(p);   /* 지급 전에 적어 둬요 → 도중에 앱이 꺼져도 다음에 이어서 지급 */
    let w; try{ w = db.ref('jd_mail/claimed/' + k + '/' + id).set(t); }catch(e){ w = Promise.reject(e); }
    const r = await Promise.race([w.then(() => 'ok', e => ({ e })), new Promise(res => setTimeout(() => res('slow'), 12000))]);
    if(r === 'slow'){   /* 연결이 느려요 — 나중에 기록이 들어가면 그때 지급 */
      w.then(async () => { await paid(k, id, m.items); delete S.busy[id]; J.toast('📬 우편을 받았어요 ' + api.text(m.items)); refresh(true); }, () => { pendDel(k, id); delete S.busy[id]; refresh(true); });
      return { ok:false, msg:'연결이 느려요. 연결되면 자동으로 받아져요' };
    }
    if(r !== 'ok'){
      pendDel(k, id); delete S.busy[id];
      const e = r.e, c = e && e.code, mm = (e && e.message) || '';
      if(c === 'PERMISSION_DENIED' || /permission_denied/i.test(mm)) return { ok:false, msg:'이미 받은 우편이에요' };
      return { ok:false, msg:'받지 못했어요. 잠시 뒤 다시 눌러 주세요' };
    }
    await paid(k, id, m.items); delete S.busy[id]; refresh(true);
    return { ok:true, msg:'📬 받았어요! ' + api.text(m.items) };
  };
  api.claimAll = async function(){   /* 하나씩 순서대로 (동시에 하지 않아요) */
    const ls = api.list(); if(!ls.length) return { ok:false, msg:'받을 우편이 없어요' };
    let n = 0, last = '';
    for(const m of ls){ const r = await api.claim(m.id); if(r.ok) n++; else if(!/이미 받/.test(r.msg)){ last = r.msg; break; } }
    return n ? { ok:true, msg:'📬 우편 ' + n + '개를 받았어요' + (last ? ' · ' + last : '') } : { ok:false, msg:last || '받을 우편이 없어요' };
  };
  function recover(){   /* 앱이 꺼지기 전에 받은 기록은 남았는데 지급을 못 한 우편을 이어서 지급 (기록 숫자가 내가 쓴 것과 같을 때만) */
    if(!J.L) return;
    const p = pendGet(), ks = Object.keys(p); if(!ks.length) return;
    ks.forEach(key => {
      const e = p[key]; if(!e || S.busy[e.id] || !S.cl[e.k]) return;
      const v = S.cl[e.k][e.id];
      if(v === e.t){ S.busy[e.id] = 1; paid(e.k, e.id, items(e.it)).then(() => { delete S.busy[e.id]; J.toast('📬 우편을 지급했어요 ' + api.text(items(e.it))); refresh(true); }); }
      else if(Date.now() - (+e.t || 0) > 864e5 || v != null) pendDel(e.k, e.id);   /* 남이 먼저 받았거나 하루가 지난 기록은 정리 */
    });
  }
  function refresh(quiet){
    try{
      const ls = api.list(), ok = loaded();
      if(ok){
        const ids = {}; ls.forEach(m => { ids[m.id] = 1; });
        if(S.seen === null){ S.seen = ids; }   /* 처음 접속 때 이미 있던 우편은 빨간 점만, 알림은 없어요 */
        else{ let nw = 0; ls.forEach(m => { if(!S.seen[m.id]){ nw++; S.seen[m.id] = 1; } }); if(nw && !quiet) J.toast('📬 새 우편이 왔어요'); }
        recover();
      }
    }catch(_){ }
    fire();
  }
  function subClaims(db){
    const ks = myKeys(), sig = ks.join('|'); if(sig === S.sig) return; S.sig = sig;
    S.refs.forEach(r => { try{ r.ref.off('value', r.fn); }catch(_){ } }); S.refs = []; S.cl = {};
    ks.forEach(k => { const ref = db.ref('jd_mail/claimed/' + k), fn = s => { S.cl[k] = (s && s.val()) || {}; refresh(false); }; ref.on('value', fn, () => { }); S.refs.push({ ref, fn }); });
  }
  function sub(){
    const db = J.live && J.live.db && J.live.db(); if(!db) return false;
    if(!S.boxSub){ S.boxSub = true;
      db.ref('.info/connected').on('value', s => { S.conn = !!(s && s.val()); fire(); });
      db.ref('jd_mail/box').on('value', s => { S.box = (s && s.val()) || {}; S.boxOk = true; refresh(false); }, () => { }); }
    subClaims(db); return true;
  }
  api.start = function(){
    if(S.started) return; S.started = true;
    let n = 0; const wait = () => { try{ if(sub()) return; }catch(_){ } if(++n < 60) setTimeout(wait, 1500); };   /* 실시간 배율이 Firebase를 연결하면 이어서 붙어요 */
    wait();
    setInterval(() => { try{ if(!sub()) return; subClaims(J.live.db()); refresh(true); }catch(_){ } }, 30000);   /* 30초마다: 이름이 생겼는지·만료됐는지 확인 */
  };
  return api;
})();

/* ===== [rpg-v42] 📮 우편 보내기 (운영자) — 보내기·회수·받은 사람 수. 받는 쪽(J.mail)은 건드리지 않아요 ===== */
J.mailAdmin = (function(){
  const api = {}, LIMS = { gold:1e10, cube:1e6, tk:1e6 }, DAY = 864e5;
  const cn = v => { v = +v; return (isFinite(v) && v > 0) ? Math.floor(v) : 0; };
  api.limits = LIMS;
  /* 입력 검사 — 문제가 있으면 쉬운 말 글자, 괜찮으면 null */
  api.check = function(m){
    const t = String(m.title || '').trim(); if(!t) return '제목을 적어 주세요';
    if(t.length > 40) return '제목은 40글자까지예요';
    if(String(m.body || '').length > 500) return '내용은 500글자까지예요';
    if(m.to !== 'all' && !String(m.to || '').trim()) return '받을 아이 이름을 적어 주세요';
    const r = m.rw || {}, ks = ['gold', 'sus', 'red', 'black', 't1', 't2'];
    for(const k of ks){ const v = +r[k]; if(r[k] !== '' && r[k] != null && (!isFinite(v) || v < 0 || v !== Math.floor(v))) return '보상은 0 이상의 정수(소수점 없는 수)만 넣어요'; }
    const g = cn(r.gold), c = ['sus', 'red', 'black'].map(k => cn(r[k])), t12 = [cn(r.t1), cn(r.t2)];
    if(g > LIMS.gold) return '골드는 100억까지예요';
    if(c.some(v => v > LIMS.cube)) return '큐브는 한 종류당 100만 개까지예요';
    if(t12.some(v => v > LIMS.tk)) return '뽑기권은 한 종류당 100만 장까지예요';
    if(!(g || c[0] || c[1] || c[2] || t12[0] || t12[1])) return '보상을 하나 이상 넣어 주세요';
    return null;
  };
  /* 1억 골드 이상 · 뽑기권 100장 이상이면 한 번 더 물어봐요 */
  api.big = m => { const r = m.rw || {}; return cn(r.gold) >= 1e8 || cn(r.t1) >= 100 || cn(r.t2) >= 100; };
  function needOp(){ const u = J.live.user(); if(!u) throw new Error('먼저 구글로 로그인해 주세요'); if(!u.ok) throw new Error('운영자 계정이 아니에요 (' + u.email + ')'); return u; }
  api.send = async function(m){
    needOp(); const bad = api.check(m); if(bad) throw new Error(bad);
    await J.live.init(); const db = J.live.db(); if(!db) throw new Error('인터넷이 필요해요');
    const r = m.rw || {}, it = {}, now = Math.floor(J.live.now());
    if(cn(r.gold)) it.gold = cn(r.gold);
    const cu = {}; ['sus', 'red', 'black'].forEach(k => { if(cn(r[k])) cu[k] = cn(r[k]); }); if(Object.keys(cu).length) it.cubes = cu;
    if(cn(r.t1)) it.t1 = cn(r.t1); if(cn(r.t2)) it.t2 = cn(r.t2);
    const days = +m.days || 0;
    const ref = db.ref('jd_mail/box').push();
    await ref.set({ to:(m.to === 'all' ? 'all' : String(m.to).trim()), title:String(m.title).trim().slice(0, 40), body:String(m.body || '').slice(0, 500), createdAt:now, expireAt:(days > 0 ? now + days * DAY : 0), items:it });
    return ref.key;
  };
  api.remove = async function(id){ needOp(); await J.live.init(); const db = J.live.db(); if(!db) throw new Error('인터넷이 필요해요'); await db.ref('jd_mail/box/' + id).remove(); };
  /* 보낸 우편 최근 20개 + 받은 사람 수 (한 번만 읽어요 — 실시간 구독 안 함) */
  api.recent = async function(){
    await J.live.init(); const db = J.live.db(); if(!db) throw new Error('인터넷이 필요해요');
    const bs = await db.ref('jd_mail/box').once('value');
    let cl = null, okCl = true; try{ cl = (await db.ref('jd_mail/claimed').once('value')).val() || {}; }catch(_){ cl = null; okCl = false; }   /* 규칙이 전체 읽기를 막아도 목록은 보이게 (받은 수만 ?) */
    const box = bs.val() || {}, cnt = {}; if(!cl) cl = {};
    Object.keys(cl).forEach(k => { const o = cl[k]; if(o && typeof o === 'object') Object.keys(o).forEach(id => { cnt[id] = (cnt[id] || 0) + 1; }); });
    return Object.keys(box).map(id => ({ id, m:box[id], n:(okCl ? (cnt[id] || 0) : null) })).filter(x => x.m && typeof x.m === 'object').sort((a, b) => (+b.m.createdAt || 0) - (+a.m.createdAt || 0)).slice(0, 20);
  };
  return api;
})();

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
  /* [rpg-v37] 전투 보상이 쓰는 계급 도우미 — 지금 계급 레벨 · 전직 구간 필요 경험치 */
  window.RPG_LVNOW = function(){ const log = rkGet(), n = rkName(log); return n ? lvOf(+log[n] || 0) : 1; };
  window.RPG_RANK_SPAN = function(t){ t = Math.max(0, t | 0); const a = Math.max(1, 30 * t), b = Math.min(RK_MAX, 30 * (t + 1)); return Math.max(1, CUM[b] - CUM[a]); };
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
  try{ if(L.purgeOld) L.purgeOld(); }catch(_){ }
  try{ L._mf = 0; if(L.moFix) L.moFix(); }catch(_){ }
  try{ localStorage.setItem(KEY, sig); }catch(_){ }
  try{ J.toast && J.toast('🎁 장비 ' + n + '개를 받았어요'); }catch(_){ }
};
J.boot = async function(){
  J.msg('끝말잇기 정보 읽는 중… (처음 한 번은 조금 오래 걸려요)');
  try{ const r = await fetch('rpg-config.json', { cache:'no-cache' }); if(r.ok) J.cfgApply(await r.json()); }catch(_){ }
  J.cfgApply(J.LS.get('rpg_cfg_local', null));
  /* [rpg-v38] 밸런스 조정: 예전에 이 폰에 저장된 숫자가 있어도 보상 관련 값은 한 번만 새 기본값으로 맞춰요 (그 뒤 에디터에서 바꾼 값은 그대로) */
  try{ if(!J.LS.get('rpg_bal_v38', 0)){ ['cubeMul', 'quota', 'bossHp', 'hidP'].forEach(k => { J.CFG[k] = J.CFG0[k]; }); const sv = J.LS.get('rpg_cfg_local', null); if(sv && typeof sv === 'object'){ ['cubeMul', 'quota', 'bossHp', 'hidP'].forEach(k => { sv[k] = J.CFG0[k]; }); J.LS.set('rpg_cfg_local', sv); } J.LS.set('rpg_bal_v38', 1); } }catch(_){ }
  try{ J.live.start(); }catch(_){ }   /* [rpg-v39] 실시간 배율 (기다리지 않고 뒤에서 연결) */
  try{ J.mail.start(); }catch(_){ }   /* [rpg-v41] 우편함 (뒤에서 연결) */
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
/* [v26] 망토(cloak)·겉옷(outer)은 막았어요: 그림에 안 입히고, 레이어 창에도 안 나와요 (다시 켜려면 아래 두 줄과 DEF_ORDER에 되돌리기) */
const MOC = { weapon:'weapon', helmet:'helmet', armor:'coat', set:'set', shield:'shield', shoes:'shoes' };
/* [v24] 레이어 순서(아래 → 위)를 내가 정해요. 'body'는 기본 몸. 기본값은 v23과 똑같아요.
   저장 위치: localStorage 'rpg_layers' (⚙ 설정 → 🧅 레이어 순서). 빠진 칸·모르는 칸은 알아서 채워서 항상 8칸이에요 (v26: 망토·겉옷 뺌) */
const DEF_ORDER = ['body','shoes','weapon','shield','hair','helmet','set','coat'];
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
J.moPack = function(c, p, force){ const k = c + p; if(force || !MOP[k]) MOP[k] = fetch(J.MO.pre + 'mo-' + c + '-' + ('00' + p).slice(-3) + '.json' + (force ? '?r=' + Date.now() : ''), force ? { cache:'reload' } : undefined).then(r => r.json()).catch(() => null); return MOP[k]; };
async function moItem(c, nm){ const MO = J.MO; const idx = MO._i || (MO._i = (() => { const o = {}; Object.keys(MO.cats).forEach(c => { o[c] = {}; MO.cats[c].forEach(a => { o[c][a[0]] = [a[1], a[2]]; }); }); return o; })());
  const a = idx[c] && idx[c][nm]; if(!a) return null; let pk = await J.moPack(c, a[0]); let it = pk && pk.items[a[1]];
  if(!it || it.n !== nm){   /* [v28] 폰에 남은 옛 팩이면 이름이 안 맞아요 → 새로 받고, 그래도 어긋나면 이름으로 찾기 */
    J.moStale = (J.moStale || 0) + 1; pk = await J.moPack(c, a[0], true); it = pk && pk.items[a[1]]; if(!it || it.n !== nm) it = (pk && pk.items.find(q => q.n === nm)) || null; }
  if(!it) return null; if(!it._s){ it._s = await J.loadImg(it.s); it._e = it.e ? await J.loadImg(it.e) : null; } return it; }
/* [v29] 무기 그림 안에 "몸"이 같이 들어 있는 무기: 공격 그림에서 영웅 몸과 살짝 어긋나 두 명이 겹쳐 보여요 (고딕이브닝레드스피어 등).
   기본 몸에 쓰인 색(피부·머리·속옷)과 같은 색 점을 무기 그림에서 지워요. 아래 이름이 들어간 무기에만 적용해요 (다른 무기도 겹쳐 보이면 한 줄 더 적기).
   점검해 보니 공격 그림에 몸이 들어 있는 무기: 동명성왕신검, 고딕이브닝레이스우산, 진'주작선장, 착호갑사흑호도, 진'마하데바의활, 대취타나각, 모던검은지우산, 갈호박별화도, 시원한수박반통, 고딕이브닝레드스피어, 대취타등채, 트리슈라, 꽃들의전쟁홍매지우산, 꽃들의전쟁홍매검, [탐험]정의의칼 (검은 우산처럼 몸과 비슷한 색이 있는 무기는 같이 지워질 수 있어서 직접 보고 하나씩 넣어요) */
const BODY_WEAPON = ['고딕이브닝레드스피어'];
J.bodyWeapon = nm => BODY_WEAPON.some(k => String(nm || '').indexOf(k) >= 0);
let _bpal = null, _btc = null;
function bodyPal(){ if(_bpal || !J.moBase) return _bpal; const im = J.moBase, c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d', { willReadFrequently:true }); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; _bpal = new Set(); for(let i = 0; i < d.length; i += 4) if(d[i + 3] > 200) _bpal.add(((d[i] >> 2) << 16) | ((d[i + 1] >> 2) << 8) | (d[i + 2] >> 2)); return _bpal; }
function stripBody(src, W, H){ const pal = bodyPal(); if(!pal) return src; if(!_btc) _btc = document.createElement('canvas'); _btc.width = W; _btc.height = H; const t = _btc.getContext('2d', { willReadFrequently:true }); t.clearRect(0, 0, W, H); t.drawImage(src, 0, 0); const im = t.getImageData(0, 0, W, H), d = im.data;
  for(let i = 0; i < d.length; i += 4) if(d[i + 3] > 200 && pal.has(((d[i] >> 2) << 16) | ((d[i + 1] >> 2) << 8) | (d[i + 2] >> 2))) d[i + 3] = 0;
  t.putImageData(im, 0, 0); return _btc; }
J.stripBody = stripBody;
J.moHas = function(c, nm){ const MO = J.MO; if(!MO || !MO.cats || !MO.cats[c]) return false; const idx = MO._h || (MO._h = {}); if(!idx[c]){ idx[c] = {}; MO.cats[c].forEach(a => { idx[c][a[0]] = 1; }); } return !!idx[c][nm]; };
J.heroEq = async function(){ if(J.L && J.L.eq) return J.L.eq; return (await J.kget('eq')) || {}; };
J.buildHero = async function(){
  const MO = J.MO; if(!MO || !J.moBase) return null;
  const W = MO.W, H = MO.H, wear = {}, miss = [], hidC = [], eq = await J.heroEq(), order = J.layerOrder();
  J.moLog = [];   /* [v25] 장비 점검용: 장비마다 어떤 모션 이름으로 연결됐는지 기록 */
  Object.keys(eq || {}).forEach(gc => { const c = MOC[gc]; if(!c) return; const k = eq[gc]; if(!k) return; if(J.L && J.L.hid && J.L.hid[k]){ hidC.push(c); J.moLog.push({ c, nm:String(k).split('|')[1] || String(k), hid:1 }); return; } try{   /* [v22] 눈 표시로 숨긴 장비는 안 그려요 */ const bn = bareName(String(k).split('|')[1].split('@')[0]); wear[c] = (J.L && J.L.moName) ? J.L.moName(c, bn) : bn; J.moLog.push({ c, nm:String(k).split('|')[1] || String(k), bn, mo:wear[c] }); }catch(_){ } });
  const hair = J.LS.get('rpg_hair', null); if(hair) wear.hair = hair;
  J.wearNow = wear; J.wearHid = hidC;   /* [v24] 레이어 창이 지금 입은 것을 보여주는 데 써요 */
  const its = {}; for(const c of Object.keys(wear)){ const it = await moItem(c, wear[c]); if(it) its[c] = it; else miss.push(c); }
  J.outfitMiss = miss.map(c => CATN[c] + ': ' + wear[c]);
  /* [v25] 점검 기록 채우기: 모션 연결 여부 / 바뀌치기 여부 / 유난히 큰 그림 */
  J.moLog.forEach(e => { if(e.hid) return; e.has = !!(its[e.c]); e.swap = e.mo !== e.bn; e.hasBn = J.moHas(e.c, e.bn);
    const it = its[e.c]; if(it){ const v = it.v && (it.v.walk_r || it.v.walk_d || it.v.walk_f); if(v){ e.w = v[2]; e.h = v[3]; const lim = { weapon:260, shield:130, shoes:140, cape:140 }[e.c] || 110; e.big = Math.max(v[2], v[3]) >= lim; } } });
  const full = {}; let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for(const key of KEYS){ const bv = moK(MO.base.v, key), [bx, by, bw, bh] = MO.base.box, arr = [];
    for(let f = 0; f < bv.length; f++){ const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d', { willReadFrequently:true });
      for(const c of order){ if(c === 'body'){ x.drawImage(J.moBase, bv[f][0], bv[f][1], bw, bh, bx, by, bw, bh); continue; } const it = its[c]; if(!it) continue; const v = moK(it.v, key); if(!v) continue; const p = v[4][f] || v[4][v[4].length - 1];
        if(it._e){ x.globalCompositeOperation = 'destination-out'; x.drawImage(it._e, p[0], p[1], v[2], v[3], v[0], v[1], v[2], v[3]); x.globalCompositeOperation = 'source-over'; }
        if(it._s){ if(c === 'weapon' && J.bodyWeapon(wear.weapon)){ const tw = document.createElement('canvas'); tw.width = W; tw.height = H; tw.getContext('2d').drawImage(it._s, p[0], p[1], v[2], v[3], v[0], v[1], v[2], v[3]); x.drawImage(stripBody(tw, W, H), 0, 0); } else x.drawImage(it._s, p[0], p[1], v[2], v[3], v[0], v[1], v[2], v[3]); } }
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
/* [rpg-v34] ⚡ 총전투력: 끝말잇기 쪽 LOOT.pwSheet / pwCalc 를 그대로 써요 (공격·체력·치명·극치명·드랍·골드·변신·동료 모두). 못 불러오면 예전 식(공격력×10+체력) */
J.powSheet = function(){ const s = J.stats(), L = J.L; if(L && L.pwSheet){ try{ return L.pwSheet({ atk:s.atk, hp:s.hp }, true); }catch(e){ console.warn('pw', e); } } return null; };
let _pw = { t:0, v:0 };
J.power = function(force){ const n = Date.now(); if(!force && n - _pw.t < 900) return _pw.v; let v; try{ const S = J.powSheet(); v = S ? J.L.pwCalc(S).total : 0; }catch(_){ v = 0; } if(!v){ const s = J.stats(); v = s.atk * 10 + s.hp; } _pw = { t:n, v }; return v; };
J.powOpen = function(){ if(!J.L || !J.L.pwOpen){ J.toast('끝말잇기 가방을 못 불러왔어요'); return; } const s = J.stats(); J.L.pwOpen({ atk:s.atk, hp:s.hp }); };
J.stats = function(){ const sh = J.share(), h = sh.hero || {}, tf = sh.tfS || {}, cp = sh.cpS || {}, dx = sh.dex || {};   /* [rpg-v31] dx = 도감 힘(R 공격·Q 체력·D 방어·C 치명, %) */
  let atk0 = h.atk || 0, hp0 = h.hp || 100;
  try{ if(J.L && J.L.atk){ atk0 = J.L.atk(); hp0 = J.L.hp(); } }catch(_){ }
  return { atk: Math.round((40 + atk0) * (1 + ((tf.R || 0) + (dx.R || 0)) / 100) * J.CFG.heroAtk), hp: Math.round(Math.max(100, hp0) * (1 + ((tf.Q || 0) + (dx.Q || 0)) / 100) * J.CFG.heroHp), tier: h.tier || 0, def: dx.D || 0, crit: dx.C || 0, cpC: cp.C || 0, cp: sh.cp, tf: sh.tf }; };
})(window.J);
