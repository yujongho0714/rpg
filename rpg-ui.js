/* 정도 RPG — 조작 · 화면 위 정보 · 메뉴(가방·변신·뽑기·합성·스테이지·설정) · 운영자 모드 · 에디터 */
'use strict';
(function(J){
const $ = J.$, G = J.G, H = J.HERO, fmt = J.fmt, clamp = J.clamp;

/* ===== 조작: 조이스틱 · 버튼 · 키보드 ===== */
const INP = J.INP = { x:0, y:0, atk:false, kb:{} };
/* [v10] 조이스틱·버튼을 만져도 자동은 안 풀려요 — ⚔ 자동 / 🕹 직접 버튼을 눌러야만 바뀌어요 */
function manual(){ J.SND.ctx(); }
function autoUi(){ const b = $('b-auto'); b.classList.toggle('on', G.auto); b.textContent = G.auto ? '⚔ 자동' : '🕹 직접'; }
{ const Jy = $('joy'), base = Jy.querySelector('.base'), knob = Jy.querySelector('.knob'); let id = null, ox = 0, oy = 0;
  Jy.addEventListener('pointerdown', e => { if(id != null) return; id = e.pointerId; Jy.setPointerCapture(id); const r = Jy.getBoundingClientRect(); ox = e.clientX - r.left; oy = e.clientY - r.top; base.style.left = knob.style.left = ox + 'px'; base.style.top = knob.style.top = oy + 'px'; Jy.classList.add('on'); Jy.querySelector('.jhint').style.display = 'none'; manual(); });
  Jy.addEventListener('pointermove', e => { if(e.pointerId !== id) return; const r = Jy.getBoundingClientRect(); let dx = e.clientX - r.left - ox, dy = e.clientY - r.top - oy; const l = Math.hypot(dx, dy), M = 50; if(l > M){ dx *= M / l; dy *= M / l; } knob.style.left = (ox + dx) + 'px'; knob.style.top = (oy + dy) + 'px'; INP.x = dx / M; INP.y = dy / M; });
  const end = e => { if(e.pointerId !== id) return; id = null; INP.x = INP.y = 0; Jy.classList.remove('on'); };
  Jy.addEventListener('pointerup', end); Jy.addEventListener('pointercancel', end); }
function btn(id, fn, hold){ const b = $(id); b.addEventListener('pointerdown', e => { e.preventDefault(); try{ b.setPointerCapture(e.pointerId); }catch(_){ } b.classList.add('dn'); manual(); fn(); if(hold) INP.atk = true; });
  const up = () => { b.classList.remove('dn'); if(hold) INP.atk = false; }; b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('contextmenu', e => e.preventDefault()); }
btn('b-a', () => J.doAttack(), true); btn('b-s1', () => J.doSkill1()); btn('b-s2', () => J.doSkill2()); btn('b-s3', () => J.doSkill3()); btn('b-r', () => J.doRoll());
$('pot').onclick = () => { manual(); J.usePot(); };
$('b-auto').onclick = () => { J.SND.ctx(); G.auto = !G.auto; autoUi(); J.toast(G.auto ? '⚔ 자동 사냥! 🕹 직접 버튼을 눌러야 풀려요' : '🕹 직접 조종'); };
addEventListener('keydown', e => { if(e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; const k = e.key.toLowerCase(); if(INP.kb[k]) return; INP.kb[k] = true;
  if(['arrowleft','arrowright','arrowup','arrowdown','a','d','w','s'].includes(k)) manual();
  if(k === 'j' || k === ' '){ manual(); INP.atk = true; J.doAttack(); } if(k === 'k'){ manual(); J.doSkill1(); } if(k === 'l'){ manual(); J.doSkill2(); } if(k === 'u'){ manual(); J.doSkill3(); } if(k === 'shift' || k === 'i'){ manual(); J.doRoll(); } });
addEventListener('keyup', e => { const k = e.key.toLowerCase(); INP.kb[k] = false; if(k === 'j' || k === ' ') INP.atk = false; });
J.keyVec = () => { const kb = INP.kb; return [(kb.arrowright || kb.d ? 1 : 0) - (kb.arrowleft || kb.a ? 1 : 0), (kb.arrowdown || kb.s ? 1 : 0) - (kb.arrowup || kb.w ? 1 : 0)]; };

/* ===== 화면 위 정보 ===== */
let uiT = 0, lastG = -1;
J.uiTick = function(dt){ uiT += dt; if(uiT < .1) return; uiT = 0;
  const p = Math.max(0, G.php / G.pmax * 100); $('php').style.width = p + '%'; $('phpu').style.width = p + '%'; $('phpt').textContent = Math.max(0, Math.round(G.php)) + ' / ' + fmt(G.pmax); $('pot').textContent = '🧪' + (G.pot + (J.potStock ? J.potStock() : 0));
  $('stg').textContent = 'STAGE ' + (G.st + 1) + (G.hid ? ' 🕳' : '') + (G.repeat ? ' 🔁' : '');   /* [rpg-v35] 🎯 권장 전투력 */
  try{ const L = J.L; if(L && L.recPow && !G.hid){ const rv = L.recPow(G.st, 'rt'), tg = L.recTag(rv, J.power()); $('stg').textContent += ' · 권장 ⚡' + L.recFmt(rv) + ' ' + tg[0]; $('stg').style.color = tg[1]; } else $('stg').style.color = ''; }catch(_){ } const thn = $('thn'), pwT = ' ⚡' + (J.L && J.L.pwK ? J.L.pwK(J.power()) : fmt(J.power())); thn.textContent = (G.hid ? '히든 보스' : (G.theme ? G.theme.nm : '')) + pwT;
  if(!thn._pw){ thn._pw = 1; thn.style.pointerEvents = 'auto'; thn.style.cursor = 'pointer'; thn.title = '눌러서 전투력 자세히 보기'; thn.addEventListener('click', () => J.powOpen()); }   /* [rpg-v34] 전투력 */
  const q = $('quota'); if(G.phase === 'field'){ q.querySelector('i').style.width = Math.min(100, G.kills / G.quota * 100) + '%'; q.querySelector('span').textContent = '사냥 ' + G.kills + ' / ' + G.quota + ' → 보스 문'; q.classList.remove('gate'); }
  else if(G.phase === 'gate'){ q.querySelector('i').style.width = '100%'; q.querySelector('span').textContent = '🌀 보스 문 열림! 오른쪽 끝으로 →'; q.classList.add('gate'); }
  else { q.querySelector('i').style.width = '100%'; q.querySelector('span').textContent = G.phase === 'clear' ? '⭐ 클리어!' : '👑 보스전'; q.classList.add('gate'); }
  const L = J.L; const gold = L ? L.gold : 0; if(gold !== lastG){ lastG = gold; $('gold').textContent = fmt(gold); }
  const dx = L && L.dlx; $('t1').textContent = dx ? (dx.t1 | 0) : 0; $('t2').textContent = dx ? (dx.t2 | 0) : 0;
  const set = (id, v, max) => { const b = $(id), c = clamp(v / max, 0, 1).toFixed(3); if(b._c !== c){ if(b._c > 0 && +c === 0){ b.classList.remove('rdy'); void b.offsetWidth; b.classList.add('rdy'); } b._c = c; b.style.setProperty('--cd', c); } };
  set('b-s1', H.cd.s1, J.CFG.s1cd); set('b-s2', H.cd.s2, J.CFG.s2cd); set('b-s3', H.cd.s3, J.CFG.s3cd); set('b-r', H.cd.r, J.CFG.roll);
  infoBox(); };
/* 창이 '눈에 보일 때만' 멈춰요 (숨겨진 창이 남아 있어도 게임이 멈추지 않게) */
J.checkPause = () => { for(const e of document.querySelectorAll('#lt-bag, #dx-ov, #sf-ov, #cs-ov, #cp-ov, #res-ov, #st-ov, #pw-ov, .ov')){ if(e.id === 'lt-bag' && !e.classList.contains('on')) continue; if(!e.getClientRects().length) continue; const cs = getComputedStyle(e); if(cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue; return true; } return false; };
/* 폰 브라우저 확대(두 번 톡·두 손가락)를 막아요 — 버튼을 빨리 눌러도 화면이 커지지 않게 */
(function(){ let lastT = 0;
  document.addEventListener('touchend', e => { const t = e.target; if(t && (/INPUT|TEXTAREA|SELECT|BUTTON|LABEL|A/.test(t.tagName) || (t.closest && t.closest('button,label,a,input,select,[onclick]')))) return; const n = Date.now(); if(n - lastT < 350) e.preventDefault(); lastT = n; }, { passive:false });
  document.addEventListener('touchstart', e => { if(e.touches.length > 1) e.preventDefault(); }, { passive:false });
  document.addEventListener('touchmove', e => { if(e.touches.length > 1 || (e.scale && e.scale !== 1)) e.preventDefault(); }, { passive:false });
  ['gesturestart','gesturechange','dblclick'].forEach(k => document.addEventListener(k, e => e.preventDefault(), { passive:false }));
  if(window.visualViewport) visualViewport.addEventListener('resize', () => { if(visualViewport.scale > 1.01) J.toast('화면이 확대됐어요. 두 손가락으로 오므리면 돌아와요'); });
})();
/* 몬스터 정보 박스 (참고: 어드벤처 테일 노트 03 — 위 가운데에 초상화·이름·체력, 깎인 만큼 노란 흔적) */
let ibM = null, ibTrail = 1;
function infoBox(){ const m = J.target, box = $('ibox'); if(!m || (m.st === 'dead' && m.t > .6)){ box.classList.remove('on'); ibM = null; return; }
  box.classList.add('on'); box.classList.toggle('ibboss', !!m.boss);
  if(ibM !== m){ ibM = m; ibTrail = m.hp / m.max; $('ibn').textContent = m.nm || '몬스터'; const g = $('ibs'); g.textContent = m.dl ? m.dl.gn : m.el ? '정예' : m.boss ? '보스' : '';
    g.style.color = m.dl ? m.dl.col : m.el ? '#ffcc4d' : '#ff8a8a'; portrait(m); }
  $('ibsh').textContent = m.shMax ? (m.st === 'broken' ? '💫 BREAK!' : '방패 ' + m.sp) : '';
  const p = Math.max(0, m.hp / m.max); ibTrail = Math.max(p, ibTrail - .02); $('ibh').style.width = (p * 100) + '%'; $('ibt').style.width = (ibTrail * 100) + '%'; $('ibv').textContent = fmt(Math.max(0, m.hp)) + ' / ' + fmt(m.max); }
function portrait(m){ const c = $('ibp'), x = c.getContext('2d'); x.clearRect(0, 0, c.width, c.height); x.imageSmoothingEnabled = false;
  if(m.u && m.u.im){ const u = m.u, bb = u.bb, w = bb[2] - bb[0], h = bb[3] - bb[1], s = Math.min(c.width / w, c.height / h) * .95; x.drawImage(u.im, bb[0], bb[1], w, h, (c.width - w * s) / 2, (c.height - h * s) / 2, w * s, h * s); }
  else if(m.im){ const s = Math.min(c.width / m.im.width, c.height / m.im.height); x.imageSmoothingEnabled = true; x.drawImage(m.im, (c.width - m.im.width * s) / 2, (c.height - m.im.height * s) / 2, m.im.width * s, m.im.height * s); } }

/* ===== 창 띄우기 ===== */
function overlay(html){ const o = document.createElement('div'); o.className = 'ov'; o.innerHTML = html; document.body.appendChild(o); J.SND.play('ui');
  const close = () => { o.remove(); };
  o.addEventListener('click', e => { const b = e.target.closest('button'); if(e.target === o || (b && b.hasAttribute('data-x'))) close(); }); return { o, close }; }
J.overlay = overlay;
function needLoot(){ if(!J.L){ J.toast('끝말잇기 가방을 못 불러왔어요. 끝말잇기를 한 번 연 다음 다시 열어 주세요'); return false; } return true; }
$('m-bag').onclick = () => { if(needLoot()) J.L.openBag(); };
$('m-dlx').onclick = () => { if(needLoot()) J.L.dlxOpen('equip'); };
$('m-gacha').onclick = () => { if(needLoot()) J.L.dlxOpen('gacha'); };
$('m-syn').onclick = () => { if(needLoot()) J.L.dlxOpen('syn'); };
/* [rpg-v35] 📖 도감 · 🎁 출석·업적(반복 업적 포함) 버튼 — 메뉴에 없으면 만들어 붙여요 */
(function(){ const ref = $('m-syn'); if(!ref || !ref.parentNode) return;
  const add = (id, txt, fn) => { if($(id)) return; const b = document.createElement('button'); b.type = 'button'; b.id = id; b.className = ref.className; b.textContent = txt; b.onclick = () => { if(needLoot()) fn(); }; ref.parentNode.appendChild(b); };
  add('m-book', '📖 도감', () => J.L.dlxOpen('book'));
  add('m-bon', '🎁 출석·업적', () => { if(J.L.bonOpen) J.L.bonOpen(); else J.toast('끝말잇기를 한 번 열어 새 버전을 받은 다음 다시 눌러 주세요'); }); })();
$('m-stage').onclick = () => stageMenu();
$('m-set').onclick = () => setMenu();
function stageMenu(){ const R = J.prog(), c = Math.max(1, R.clr + 1), adm = isAdmin(); let h = '<div class="box"><h2>🗺 스테이지 <button type="button" data-x>✕</button></h2><p class="note" id="rec-note"></p><div class="mn"><button type="button" data-fit>🎯 내 전투력에 맞는 스테이지로</button></div><p class="note">깬 스테이지까지 아무 데서나 시작해요. 막히면 낮은 곳에서 골드·큐브를 모아 강화해요.' + (adm ? '\n(운영자: 모든 스테이지 열림)' : '') + '</p><div class="mn"><button type="button" data-rep>' + (G.repeat ? '🔁 선택 스테이지만 반복: 켬 (눌러서 끄기)' : '🔁 선택 스테이지만 반복: 끔 (눌러서 켜기)') + '</button></div><div class="sg">';
  const n = adm ? Math.max(c, 100) : c, L = J.L, mp = J.power(), rc = i => { try{ if(L && L.recPow){ const v = L.recPow(i - 1, 'rt'); return [L.recFmt(v), L.recTag(v, mp)[1]]; } }catch(_){ } return ['', '']; };
  for(let i = 1; i <= n; i++){ const q = rc(i); h += '<button type="button" data-s="' + i + '" class="' + (i === G.st + 1 ? 'on' : '') + '"' + (q[1] ? ' style="border-bottom:4px solid ' + q[1] + '"' : '') + '>' + i + (q[0] ? '<small style="display:block;font-size:9px;line-height:1;color:' + q[1] + '">' + q[0] + '</small>' : '') + '</button>'; }
  const { o, close } = overlay(h + '</div></div>'); try{ const L = J.L, mp = J.power(), rn = o.querySelector('#rec-note'); if(rn && L && L.recPow){ const cur = L.recPow(G.st, 'rt'), tg = L.recTag(cur, mp); rn.innerHTML = '⚡ 내 전투력 <b>' + L.recFmt(mp) + '</b> · 지금 STAGE ' + (G.st + 1) + ' 권장 <b>' + L.recFmt(cur) + '</b> <b style="color:' + tg[1] + '">(' + tg[0] + ')</b><br>숫자 = 스테이지 권장 전투력 · 아래 줄 색: 초록 쉬움 · 노랑 적정 · 주황 위험 · 빨강 불가'; } }catch(_){ }
  o.addEventListener('click', async e => { if(e.target.closest('[data-fit]')){ const L = J.L; if(!L || !L.recBest){ J.toast('끝말잇기 가방을 못 불러왔어요'); return; } const b = Math.min(L.recBest('rt', n, J.power()), n); close(); await J.goStage(b - 1); J.toast('🎯 STAGE ' + b + ' (내 전투력에 맞는 곳)'); return; } });
  o.addEventListener('click', async e => { if(e.target.closest('[data-rep]')){ G.repeat = !G.repeat; J.LS.set('rpg_repeat', G.repeat); close(); J.toast(G.repeat ? '🔁 지금 스테이지만 계속 반복해요' : '다음 스테이지로 넘어가요'); return; } const b = e.target.closest('[data-s]'); if(!b) return; close(); await J.goStage(+b.dataset.s - 1); J.toast('STAGE ' + b.dataset.s + '부터'); }); }
function setMenu(){ const tfL = J.LS.get('rpg_tflook', false);
  const { o, close } = overlay('<div class="box"><h2>⚙ 설정 <button type="button" data-x>✕</button></h2><div class="mn">' +
    '<button type="button" data-m="snd">' + (J.SND.on ? '🔊 효과음 끄기' : '🔇 효과음 켜기') + '</button><button type="button" data-m="bgm">' + (J.SND.mus ? '🎵 음악 끄기' : '🎵 음악 켜기') + '</button>' +
    '<button type="button" data-m="tf">' + (tfL ? '🧍 내 장비 모습으로' : '🦸 변신 모습으로 싸우기') + '</button><button type="button" data-m="hair">💇 헤어</button><button type="button" data-m="layer">🧅 레이어 순서</button>' +
    '<button type="button" data-m="pow">⚡ 전투력</button><button type="button" data-m="diag">🔍 그림 상태</button><button type="button" data-m="help">❓ 하는 법</button><button type="button" data-m="mail">📬 우편함</button><button type="button" data-m="admin">' + (isAdmin() ? '🛠 운영자 메뉴' : '🔐 운영자 모드') + '</button></div>' +
    (J.outfitMiss && J.outfitMiss.length ? '<p class="note">아직 움직이는 그림이 없는 장비예요 (자무주 수집기로 받으면 나와요)\n' + J.outfitMiss.join('\n').replace(/</g, '&lt;') + '</p>' : '') + '</div>');
  o.addEventListener('click', e => { const b = e.target.closest('[data-m]'); if(!b) return; const m = b.dataset.m; close();
    if(m === 'snd'){ J.SND.on = !J.SND.on; J.toast(J.SND.on ? '🔊 효과음 켰어요' : '🔇 효과음 껐어요'); }
    else if(m === 'bgm'){ J.SND.mus = !J.SND.mus; J.toast(J.SND.mus ? '🎵 음악 켰어요' : '음악 껐어요'); }
    else if(m === 'tf'){ const s = J.stats(); if(!tfL && !s.tf){ J.toast('먼저 🦸 변신·동료에서 변신 카드를 끼워 주세요'); return; } J.LS.set('rpg_tflook', !tfL); J.refreshHero(); }
    else if(m === 'pow') J.powOpen(); else if(m === 'hair') hairMenu(); else if(m === 'layer') layerMenu(); else if(m === 'help') help(); else if(m === 'diag') diag(); else if(m === 'admin') adminMenu(); else if(m === 'mail') mailBox(); }); }
function diag(){ const L = J.L, A = J.G.A || {}, eq = L && L.eq ? Object.keys(L.eq).length : 0, dlLoaded = J.DL ? J.DL.units.filter(u => u.im).length : 0;
  const rows = [
    ['끝말잇기 연결', J.LIB.map.length ? '✅ 됨' : '❌ 못 읽음 (인터넷 확인 후 다시 열기)'],
    ['스타포스 코드 버전', window.JD_SF_VER ? '✅ ' + window.JD_SF_VER : '⚠ 옛 버전 (끝말잇기를 최신으로 올린 뒤, RPG를 완전히 닫았다 다시 열기)'],
    ['가방·강화·변신', L ? '✅ 됨' : '❌ 안 됨'],
    ['아이템 목록', L && L.pack ? '✅ ' + (L.pack.items ? L.pack.items.length : 0) + '개' : '❌ 끝말잇기를 한 번 열어 주세요'],
    ['맵·몬스터 그림', J.LIB.map.length + '맵 · 몬스터 ' + J.LIB.mob.length + ' · 이번 판 ' + (A.mob ? A.mob.length : 0) + '종'],
    ['변신·동료 그림', J.DL ? '목록 ' + J.DL.units.length + '명 · 받은 것 ' + dlLoaded + '명' : '❌ 목록 못 받음'],
    ['이펙트', Object.keys(J.FX).length + '개'],
    ['RPG 파일 버전', J.VER || '⚠ 옛 버전 (v20 미만) — 파일을 다시 올리고 RPG를 완전히 닫았다 열기'],
    ['영웅 그림', J.HERO.tfU ? '🦸 변신 모습' : J.HERO.dress ? '👕 옷 입힌 그림 (방향별 그림을 못 만들었거나 rpg_dress 켜짐)' : '🚶 방향별 걷기·공격 그림'],
    ['레이어 순서 (아래→위)', J.layerOrder().map(c => J.CATN[c] || c).join(' → ')],
    ['걷기 그림 없는 장비', (J.outfitMiss && J.outfitMiss.length) ? J.outfitMiss.length + '개' : '없음']
  ];
  overlay('<div class="box"><h2>🔍 그림 상태 <button type="button" data-x>✕</button></h2><table class="dg">' + rows.map(r => '<tr><th>' + r[0] + '</th><td>' + r[1] + '</td></tr>').join('') + '</table>' + (J.outfitMiss && J.outfitMiss.length ? '<p class="note">' + J.outfitMiss.join('\n').replace(/</g, '&lt;') + '\n→ 자무주 수집기로 이 장비의 걷기 그림을 받으면 움직이는 모습이 나와요</p>' : '') + '<div class="mn"><button type="button" data-d="eq">🧰 장비 점검</button><button type="button" data-d="reload">🔄 다시 불러오기</button><button type="button" data-x>닫기</button></div></div>').o.addEventListener('click', e => { if(e.target.closest('[data-d="reload"]')) location.reload(); else if(e.target.closest('[data-d="eq"]')) equipCheck(); }); }
/* ===== [v25] 🧰 장비 점검: 입은 장비마다 어떤 모션 그림에 연결됐는지 보여줘요 ===== */
async function equipCheck(){
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'), NM = J.CATN;
  const { o } = overlay('<div class="box"><h2>🧰 장비 점검 <button type="button" data-x>✕</button></h2><p class="note">장비 그림을 다시 만들어 확인하는 중…</p></div>');
  try{ await J.buildHero(); }catch(e){ }
  const log = J.moLog || [], hasMO = !!(J.MO && J.moBase), hasMF = !!(J.L && J.L.moName);
  let bad = 0, swp = 0, big = 0, h = '<h2>🧰 장비 점검 <button type="button" data-x>✕</button></h2>';
  const rows = log.map(e => {
    if(e.hid) return '<tr><th>' + esc(NM[e.c] || e.c) + '</th><td>👁 숨김<br><small>' + esc(e.nm) + '</small></td></tr>';
    let st; if(!e.has){ bad++; st = '❌ 모션 그림 없음'; } else if(e.swap){ swp++; st = '🔀 다른 장비 그림으로 바뀜'; } else st = '✅ 연결됨';
    if(e.big){ big++; st += ' · 🐯 아주 큰 그림 ' + e.w + '×' + e.h; }
    return '<tr><th>' + esc(NM[e.c] || e.c) + '</th><td>' + st + '<br><small>장비: ' + esc(e.nm) + '<br>가방 이름→모션 이름: ' + esc(e.bn) + (e.hasBn ? ' (모션에 있음)' : ' (모션에 없음)') + ' → <b>' + esc(e.mo) + '</b></small></td></tr>'; }).join('');
  const hair = J.LS.get('rpg_hair', null);
  h += '<table class="dg">' + [
    ['모션 데이터', hasMO ? '✅ ' + Object.keys(J.MO.cats).length + '부위' : '❌ 못 읽음 (mo-index.json)'],
    ['이름 연결 함수 (moName)', hasMF ? '✅ 있음' : '⚠ 없음 — 장비 이름 그대로 찾아요'],
    ['옛 모션 파일 새로 받음', J.moStale ? '🔄 ' + J.moStale + '번 (폰에 옛 파일이 남아 있었어요)' : '없음'],
    ['입은 장비', log.length + '개'],
    ['연결 안 됨', bad ? '❌ ' + bad + '개' : '없음'],
    ['바뀌치기', swp ? '🔀 ' + swp + '개' : '없음'],
    ['아주 큰 그림', big ? '🐯 ' + big + '개' : '없음'],
    ['헤어', hair ? esc(hair) : '기본']
  ].map(r => '<tr><th>' + r[0] + '</th><td>' + r[1] + '</td></tr>').join('') + '</table>';
  h += '<h3 style="margin:10px 0 4px;font-size:.95rem">장비별 결과</h3>' + (rows ? '<table class="dg">' + rows + '</table>' : '<p class="note">입은 장비가 없어요. 🎒 가방에서 장비를 입고 다시 열어 주세요.</p>');
  h += '<p class="note">❌ = 이 장비 이름으로 움직이는 그림을 못 찾았어요. 🔀 = 이름이 달라서 다른 장비 그림으로 대신 입혔어요 (영상의 비행선·검은 낫이 이런 경우일 수 있어요). 🐯 = 원래 크기가 큰 소환수·효과 그림이에요.' + (J.HERO && J.HERO.dress ? '\n⚠ 지금 👕 옷 입힌 그림 모드라서 이 점검 결과와 화면 그림이 다를 수 있어요.' : '') + '</p>';
  h += '<div class="mn"><button type="button" data-ec="copy">📋 결과 복사</button><button type="button" data-x>닫기</button></div>';
  const box = o.querySelector('.box'); box.innerHTML = h;
  const txt = ['[장비 점검 ' + (J.VER || '') + ']'].concat(log.map(e => e.hid ? (NM[e.c] + ' 숨김 ' + e.nm) : (NM[e.c] + ' | ' + e.nm + ' | ' + (e.has ? (e.swap ? '바뀜' : '연결') : '없음') + ' | ' + e.bn + ' → ' + e.mo + (e.big ? ' | 큼 ' + e.w + 'x' + e.h : '')))).join('\n');
  box.addEventListener('click', e => { if(!e.target.closest('[data-ec="copy"]')) return; try{ navigator.clipboard.writeText(txt).then(() => J.toast('📋 복사했어요'), () => J.toast('복사가 막혔어요. 화면을 캡처해 주세요')); }catch(_){ J.toast('복사가 막혔어요. 화면을 캡처해 주세요'); } });
}
function help(){ overlay('<div class="box"><h2>❓ 하는 법 <button type="button" data-x>✕</button></h2><p class="note">🕹 왼쪽 아래를 손가락으로 끌면 걸어요 (앞뒤로도 움직여요)\n⚔ 공격: 누르고 있으면 1·2·3타 연속! 3타는 적을 띄워요\n🌀 회오리: 둘레를 3번 베어요\n⚡ 뇌전: 적 무리 가운데로 뛰어들어 번개!\n☄ 운석: 하늘에서 운석이 떨어져요\n💨 구르기: 구르는 동안은 안 맞아요\n\n❗ 몬스터 머리 위 느낌표 = 곧 때려요 → 먼저 때리면 끊어요\n🟥 보스가 바닥에 그린 빨간 곳 = 맞는 곳. 빨리 빠져나와요\n🟩 초록 원 = 안전한 곳\n🛡 방패가 있는 몬스터는 계속 때려서 방패를 다 깨면 BREAK! → 기절하고 데미지 1.5배 (치명타·스킬은 2칸씩 깨요)\n\n🗺 맵 곳곳의 몬스터를 잡으면 보스 문이 열려요 → 오른쪽 끝 빛기둥으로!\n⚔ 자동을 켜면 알아서 싸우고 피해요\n🎒 가방·🦸 변신·🎰 뽑기·⚗ 합성은 끝말잇기와 똑같고 저장도 같이 돼요</p></div>'); }
async function hairMenu(){ const MO = J.MO; if(!MO || !MO.cats.hair){ J.toast('헤어 그림이 아직 없어요'); return; } const { o, close } = overlay('<div class="box"><h2>💇 헤어 <button type="button" data-x>✕</button></h2><div class="hg"></div></div>');
  const tb = MO.thumbBox, cur = J.LS.get('rpg_hair', null), list = MO.cats.hair, hg = o.querySelector('.hg');
  const none = document.createElement('button'); none.type = 'button'; none.textContent = '기본'; none.style.cssText = 'aspect-ratio:' + tb[2] + '/' + tb[3] + ';color:#fff;font-family:var(--disp)'; none.onclick = () => { J.LS.set('rpg_hair', null); close(); }; hg.append(none);
  const packs = {}; for(const a of list){ if(!packs[a[1]]) packs[a[1]] = await J.moPack('hair', a[1]); const pk = packs[a[1]]; if(!pk || !o.isConnected) continue; const tc = pk.tc, rows = Math.ceil(pk.items.length / tc), i = a[2];
    const b = document.createElement('button'); b.type = 'button'; b.title = a[0]; b.style.aspectRatio = tb[2] + '/' + tb[3]; if(cur === a[0]) b.className = 'on'; const s = document.createElement('i'); s.style.backgroundImage = 'url(' + pk.thumb + ')'; s.style.backgroundSize = (tc * 100) + '% ' + (rows * 100) + '%'; s.style.backgroundPosition = (tc > 1 ? (i % tc) / (tc - 1) * 100 : 0) + '% ' + (rows > 1 ? Math.floor(i / tc) / (rows - 1) * 100 : 0) + '%'; b.append(s);
    b.onclick = () => { J.LS.set('rpg_hair', a[0]); close(); J.toast('💇 ' + a[0]); }; hg.append(b); } }

/* ===== [v24] 🧅 레이어 순서: 몸·장비가 겹칠 때 뭐가 앞에 보일지 정해요 ===== */
(function(){ const st = document.createElement('style');
  st.textContent = '.lyp{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:8px;position:sticky;top:0;z-index:2;background:var(--panel);padding-bottom:6px;box-shadow:0 -14px 0 var(--panel)}.lyp canvas{width:100%;aspect-ratio:100/112;background:#0006;border:2px solid var(--line);border-radius:10px;image-rendering:pixelated}' +
    '.lyl{display:grid;gap:6px;margin:8px 0 10px}.lyr{display:grid;grid-template-columns:58px 1fr 44px 44px;gap:6px;align-items:center;padding:3px 8px;border:2px solid var(--line);border-radius:12px;background:#0006}' +
    '.lyr b{font-family:var(--disp);font-weight:400;color:var(--gold)}.lyr span{font-size:.78rem;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.lyr button{padding:6px 0;border-radius:10px;border:2px solid var(--line);background:#0006;color:var(--fg);font-size:1rem}.lyr button:disabled{opacity:.28}';
  document.head.appendChild(st); })();
function layerMenu(){
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'), NM = J.CATN;
  const { o } = overlay('<div class="box"><h2>🧅 레이어 순서 <button type="button" data-x>✕</button></h2>' +
    '<div class="lyp"><canvas width="100" height="112" data-k="walk_r"></canvas><canvas width="100" height="112" data-k="walk_d"></canvas><canvas width="100" height="112" data-k="walk_u"></canvas><canvas width="100" height="112" data-k="atk_r"></canvas></div>' +
    '<p class="note" data-warn></p>' +
    '<p class="note">위에 있는 것이 앞에 보여요 (겹치면 위가 이겨요).\n▲ 앞으로 · ▼ 뒤로 — 누르면 위 그림에 바로 바뀌어요.\n무기·방패를 몸보다 뒤로 보내면 손이 가려질 수 있어요.</p>' +
    '<div class="lyl"></div><div class="mn"><button type="button" data-ly="reset">↺ 기본 순서로</button><button type="button" data-x>닫기</button></div></div>');
  const list = o.querySelector('.lyl'), warn = o.querySelector('[data-warn]');
  const desc = c => { if(c === 'body') return '기본 몸'; const w = J.wearNow && J.wearNow[c]; return w ? esc(w) : (J.wearHid && J.wearHid.includes(c) ? '👁 숨김' : '없음'); };
  const draw = () => { const ord = J.layerOrder().slice().reverse();   /* 화면에는 위 → 아래로 */
    list.innerHTML = ord.map((c, i) => '<div class="lyr"><b>' + NM[c] + '</b><span>' + (i === 0 ? '⬆ 맨 위 · ' : i === ord.length - 1 ? '⬇ 맨 아래 · ' : '') + desc(c) + '</span>' +
      '<button type="button" data-up="' + c + '"' + (i === 0 ? ' disabled' : '') + '>▲</button><button type="button" data-dn="' + c + '"' + (i === ord.length - 1 ? ' disabled' : '') + '>▼</button></div>').join('');
    warn.textContent = H.tfU ? '⚠ 지금은 🦸 변신 모습이라 바뀐 게 안 보여요. 설정에서 "내 장비 모습으로" 바꾸면 보여요.' : (H.dress ? '⚠ 지금은 👕 옷 입힌 그림이라 순서가 적용되지 않아요.' : ''); warn.style.display = warn.textContent ? '' : 'none'; };
  const move = (c, d) => { const a = J.layerOrder(), i = a.indexOf(c), j = i + d; if(i < 0 || j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; J.LS.set('rpg_layers', a); draw(); J.applyLayers(); };
  o.addEventListener('click', e => { const u = e.target.closest('[data-up]'), d = e.target.closest('[data-dn]'), r = e.target.closest('[data-ly="reset"]');
    if(u) move(u.dataset.up, 1); else if(d) move(d.dataset.dn, -1); else if(r){ J.LS.set('rpg_layers', J.DEF_ORDER.slice()); draw(); J.applyLayers(); J.toast('🧅 기본 순서로 돌렸어요'); } });
  draw();
  /* 미리보기: 옆·앞·뒤 걷기 + 공격을 계속 돌려요 (순서를 바꾸면 그림이 다시 만들어지는 동안 잠깐 예전 모습) */
  const cvs = [...o.querySelectorAll('.lyp canvas')];
  const loop = () => { if(!o.isConnected) return; const a = J.heroArt && J.heroArt();
    if(a && a.fr){ const t = performance.now(); cvs.forEach(c => { const k = c.dataset.k, fr = a.fr[k]; if(!fr || !fr.length) return;
      const f = fr[Math.floor(t / (k.indexOf('atk') === 0 ? 260 : 180)) % fr.length], x = c.getContext('2d'), s = Math.min((c.width - 8) / f[2], (c.height - 8) / f[3]), dw = f[2] * s, dh = f[3] * s;
      x.clearRect(0, 0, c.width, c.height); x.imageSmoothingEnabled = false; x.drawImage(a.canvas, f[0], f[1], f[2], f[3], (c.width - dw) / 2, c.height - 4 - dh, dw, dh); }); }
    requestAnimationFrame(loop); };
  loop();
}

/* ===== 운영자 모드 (비밀번호) ===== */
const hash = s => { let h = 5381; for(const ch of String(s)) h = ((h << 5) + h + ch.codePointAt(0)) | 0; return String(h >>> 0); };
const DEF_PW = hash('jungdo2');
function isAdmin(){ try{ return sessionStorage.getItem('rpg_admin') === '1'; }catch(_){ return false; } }
function adminMenu(){ if(!isAdmin()){ const { o, close } = overlay('<div class="box"><h2>🔐 운영자 모드 <button type="button" data-x>✕</button></h2><p class="note">운영자 비밀번호를 넣어 주세요.</p><input id="apw" type="password" class="inp" autocomplete="off"><div class="mn" style="margin-top:8px"><button type="button" id="apok">들어가기</button></div></div>');
    const go = () => { const v = o.querySelector('#apw').value; if(hash(v) === (J.LS.get('rpg_admin_pw', null) || DEF_PW)){ try{ sessionStorage.setItem('rpg_admin', '1'); }catch(_){ } close(); J.toast('🛠 운영자 모드 켜짐'); adminMenu(); document.body.classList.add('admin'); } else J.toast('비밀번호가 달라요'); };
    o.querySelector('#apok').onclick = go; o.querySelector('#apw').onkeydown = e => { if(e.key === 'Enter') go(); }; setTimeout(() => o.querySelector('#apw').focus(), 50); return; }
  const a = G.admin; const { o, close } = overlay('<div class="box"><h2>🛠 운영자 메뉴 <button type="button" data-x>✕</button></h2><div class="mn">' +
    '<button type="button" data-a="god" class="' + (a.god ? 'on' : '') + '">🛡 무적 ' + (a.god ? 'ON' : 'OFF') + '</button><button type="button" data-a="one" class="' + (a.one ? 'on' : '') + '">💥 한 방 ' + (a.one ? 'ON' : 'OFF') + '</button>' +
    '<button type="button" data-a="gate">🌀 보스 문 열기</button><button type="button" data-a="boss">👑 보스 바로</button>' +
    '<button type="button" data-a="kill">☠ 몬스터 다 쓰러뜨리기</button><button type="button" data-a="stage">🗺 스테이지 이동</button>' +
    '<button type="button" data-a="gold">💰 골드 +100만</button><button type="button" data-a="tk">🎫 뽑기권 +10장씩</button>' +
    '<button type="button" data-a="cube">🔷 큐브 +10개씩</button><button type="button" data-a="full">❤ 체력·물약 가득</button>' +
    '<button type="button" data-a="live" style="grid-column:1/-1;background:#7a2a00;color:#ffe9a8">🌐 전체 배율 (모든 폰에 적용)</button><button type="button" data-a="send" style="grid-column:1/-1;background:#1c3a7a;color:#cfe2ff">📮 우편 보내기 (모든 아이에게)</button><button type="button" data-a="edit">✏ 내 폰 숫자 (테스트용)</button><button type="button" data-a="pw">🔑 비밀번호 바꾸기</button>' +
    '<button type="button" data-a="off" style="grid-column:1/-1">운영자 모드 끄기</button></div><p class="note">운영자 모드는 이 폰·이 창에서만 켜져요. 앱을 다시 열면 꺼져요.</p></div>');
  o.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if(!b) return; const k = b.dataset.a, L = J.L;
    if(k === 'god'){ a.god = !a.god; b.classList.toggle('on', a.god); b.textContent = '🛡 무적 ' + (a.god ? 'ON' : 'OFF'); return; }
    if(k === 'one'){ a.one = !a.one; b.classList.toggle('on', a.one); b.textContent = '💥 한 방 ' + (a.one ? 'ON' : 'OFF'); return; }
    close();
    if(k === 'gate') J.adminGate(); else if(k === 'boss') J.adminBoss(); else if(k === 'kill') J.adminKillAll(); else if(k === 'stage') stageMenu();
    else if(k === 'gold'){ if(L){ L.addGold(1000000); J.toast('💰 +100만'); } }
    else if(k === 'tk'){ if(L && L.dlx){ L.dlx.t1 = (L.dlx.t1 | 0) + 10; L.dlx.t2 = (L.dlx.t2 | 0) + 10; J.kset('dlx', L.dlx); J.toast('🎫🎟 +10장씩'); } }
    else if(k === 'cube'){ if(L){ L.addCubes({ sus:10, red:10, black:10 }); J.toast('🔷🟥⬛ +10개씩'); } }
    else if(k === 'full'){ G.php = G.pmax; G.pot = J.CFG.pots; }
    else if(k === 'edit') editor();
    else if(k === 'live') livePanel(); else if(k === 'send') mailSend();
    else if(k === 'pw'){ const n = prompt('새 운영자 비밀번호 (4글자 이상)'); if(n && n.length >= 4){ J.LS.set('rpg_admin_pw', hash(n)); J.toast('🔑 바꿨어요 (이 폰에만 저장)'); } }
    else if(k === 'off'){ try{ sessionStorage.removeItem('rpg_admin'); }catch(_){ } a.god = a.one = false; document.body.classList.remove('admin'); J.toast('운영자 모드 껐어요'); } }); }

/* ===== [rpg-v40] 🌐 전체 배율 패널 (운영자) — 구글 로그인 후 모든 폰에 적용 ===== */
function livePanel(){
  const LV = J.live; if(!LV){ J.toast('실시간 기능이 아직 준비 안 됐어요'); return; }
  const MUL = [['expMul','경험치 ×'],['goldMul','골드 ×'],['cubeMul','큐브 ×']], PCT = [['dropP','장비 드롭 %'],['dropBoss','보스 드롭 %'],['ticketP','뽑기권 %']], ADV = [['monHp','몬스터 체력 ×'],['bossHp','보스 체력 ×'],['hidP','히든 포탈 %']];
  const st = LV.state(), bs = k => { const v = LV.base(k); return (typeof v === 'number') ? Math.round(v * 1000) / 1000 : ''; };
  const row = ([k, l]) => '<label><b>' + l + '</b><input class="inp" data-k="' + k + '" inputmode="decimal" placeholder="빈칸 = 안 바꿈" ><small>원래 ' + bs(k) + '</small></label>';
  let h = '<div class="box"><h2>🌐 전체 배율 <button type="button" data-x>✕</button></h2>' +
    '<p class="note">① 구글로 로그인 → ② 아래에서 고르거나 숫자를 넣기 → ③ [모든 폰에 적용]. 켜 있는 모든 폰이 새로고침 없이 바뀌어요. 빈칸은 원래 값 그대로예요.</p>' +
    '<div id="lv-st" class="note"></div>' +
    '<div class="mn"><button type="button" data-l="p60">⏱ 2배 1시간</button><button type="button" data-l="p120">⏱ 2배 2시간</button><button type="button" data-l="ptoday">🌙 오늘 끝까지 2배</button><button type="button" data-l="clear">↩ 기본으로 되돌리기</button></div>' +
    '<h3 style="margin:10px 0 2px;font-size:14px">직접 정하기</h3>' +
    '<label><b>이벤트 이름</b><input class="inp" id="lv-nm" value="2배 이벤트" maxlength="30"></label>' +
    '<label><b>끝나는 때</b><select class="inp" id="lv-du"><option value="60">지금부터 1시간</option><option value="120">지금부터 2시간</option><option value="180">지금부터 3시간</option><option value="today">오늘 밤 12시까지</option><option value="tomorrow">내일 밤 12시까지</option><option value="none">끝나는 시각 없음 (내가 되돌릴 때까지)</option></select></label>' +
    MUL.concat(PCT).map(row).join('') + '<details class="ed"><summary>더 보기 (체력·히든 포탈)</summary>' + ADV.map(row).join('') + '</details>' +
    '<div id="lv-er" class="note" style="color:#ff8a7a"></div>' +
    '<div class="mn" style="margin-top:8px"><button type="button" data-l="go" id="lv-go">✅ 모든 폰에 적용</button><button type="button" data-x>닫기</button></div></div>';
  const { o, close } = overlay(h), $q = s => o.querySelector(s), er = t => { $q('#lv-er').textContent = t || ''; };
  const fmt = t => { const d = new Date(t), z = n => ('0' + n).slice(-2); return z(d.getHours()) + ':' + z(d.getMinutes()); };
  function status(){
    const u = LV.user(), s = LV.state(), b = LV.badge(); let t = '';
    t += b ? '지금 적용 중: <b>' + b + '</b><br>' : '지금 적용 중인 이벤트 없음<br>';
    if(!u) t += '로그인 안 됨 <button type="button" data-l="login">🔑 구글로 로그인</button>';
    else if(!u.ok) t += '<span style="color:#ff8a7a">운영자 계정이 아니에요 (' + u.email + ')</span> <button type="button" data-l="logout">다른 계정으로</button>';
    else t += '로그인됨: ' + u.email + ' <button type="button" data-l="logout">로그아웃</button>';
    $q('#lv-st').innerHTML = t; const g = $q('#lv-go'); if(g) g.disabled = !(u && u.ok);
  }
  const prevCh = LV.onChange; LV.onChange = () => { try{ prevCh && prevCh(); }catch(_){ } status(); }; LV.onAuth = status;
  const obs = new MutationObserver(() => { if(!document.body.contains(o)){ LV.onChange = prevCh; LV.onAuth = null; obs.disconnect(); } }); obs.observe(document.body, { childList:true });
  status(); LV.init().then(status).catch(e => er(LV.errText(e)));
  const endOf = v => { const n = LV.now(); if(v === 'none') return 0; if(v === 'today' || v === 'tomorrow'){ const d = new Date(n); d.setHours(23, 59, 0, 0); return d.getTime() + (v === 'tomorrow' ? 864e5 : 0); } return n + (+v) * 6e4; };
  const read = () => { const c = {}; o.querySelectorAll('[data-k]').forEach(i => { const t = i.value.trim(); if(t !== '') c[i.dataset.k] = +t.replace(',', '.'); }); return c; };
  const sum = c => Object.keys(c).map(k => { const f = MUL.concat(PCT, ADV).find(x => x[0] === k); return f ? f[1] + c[k] : k + c[k]; }).join(', ');
  async function apply(c){
    er(''); const bad = LV.check(c); if(bad){ er('⚠ ' + bad); return; }
    const big = Object.keys(c).filter(k => /Mul$|Hp$/.test(k) && c[k] > 5);
    const du = $q('#lv-du').value, end = endOf(du), nm = $q('#lv-nm').value.trim() || '이벤트';
    if(big.length && !confirm('⚠ ' + sum(c) + '\n5배가 넘는 값이 있어요. 정말요?')) return;
    if(!confirm('정말 모든 폰에 적용할까요?\n' + sum(c) + '\n' + (end ? fmt(end) + '까지' + (end - LV.now() > 864e5 ? ' (하루 넘게 이어져요)' : '') : '끝나는 시각 없음 (직접 되돌려야 해요)'))) return;
    try{ await LV.publish(c, end ? { name:nm, endAt:end } : null); J.toast('✅ 모든 폰에 적용했어요'); status(); }catch(e){ er('⚠ ' + LV.errText(e)); }
  }
  o.addEventListener('click', async e => { const b = e.target.closest('[data-l]'); if(!b) return; const k = b.dataset.l; er('');
    try{
      if(k === 'login'){ await LV.login(); status(); }
      else if(k === 'logout'){ await LV.logout(); status(); }
      else if(k === 'go') await apply(read());
      else if(k === 'clear'){ if(confirm('이벤트를 끄고 모든 폰을 원래 값으로 돌릴까요?')){ await LV.clear(); J.toast('↩ 모든 폰이 원래 값으로 돌아가요'); status(); } }
      else if(k[0] === 'p'){   /* 빠른 선택: 경험치·골드 2배 */
        o.querySelectorAll('[data-k]').forEach(i => { i.value = ''; });
        $q('[data-k=expMul]').value = 2; $q('[data-k=goldMul]').value = 2; $q('#lv-nm').value = '2배 이벤트'; $q('#lv-du').value = (k === 'ptoday') ? 'today' : k.slice(1);
        await apply(read());
      }
    }catch(err){ er('⚠ ' + LV.errText(err)); } });
}

/* ===== 숫자 에디터 (운영자) — 쉬운 설명 · 묶음 상자 ===== */
const ED = [
  ['💰 보상', [['goldMul','골드 배율','끝말잇기 몬스터 골드 × 이 값'],['expMul','경험치 배율','잡을 때 얻는 경험치 × 이 값 (끝말잇기 경험치 이벤트와는 큰 값 하나만)'],['cubeMul','큐브 배율','큐브가 나오는 양 × 이 값'],['dropP','장비 드롭 %','일반 몬스터가 장비를 줄 확률 (정예는 3배)'],['dropBoss','보스 장비 드롭 %',''],['ticketP','뽑기권 검사 %','몬스터를 잡을 때 끝말잇기 뽑기권 확률표를 돌리는 비율']]],
  ['🗺 맵·진행', [['quota','보스 문 사냥 수','이만큼 잡으면 보스 문이 열려요'],['mapLen','맵 길이','길수록 오래 걸어요 (2000~8000)'],['respawn','몬스터 다시 나오는 초',''],['hidP','히든 포탈 %','보스를 잡으면 히든 보스가 나올 확률']]],
  ['👾 몬스터', [['monHp','몬스터 체력 배율',''],['monAtk','몬스터 공격 배율',''],['bossHp','보스 체력 배율','패턴을 보려면 2~3 추천']]],
  ['⚔ 내 캐릭터', [['heroAtk','내 공격 배율',''],['heroHp','내 체력 배율',''],['pots','물약 개수','스테이지마다'],['pot','물약 자동 사용 체력 %','']]],
  ['🌀 스킬', [['s1','회오리 위력','한 번 벨 때 공격력 × 이 값 (3번)'],['s1cd','회오리 쿨(초)',''],['s2','뇌전 위력',''],['s2cd','뇌전 쿨(초)',''],['s3','운석 위력',''],['s3cd','운석 쿨(초)',''],['roll','구르기 쿨(초)','']]],
  ['🌏 화면', [['curve','글로브뷰 휘어짐','0 = 평평(기본) · 0.00005~0.0001 = 살짝 공처럼 (클수록 어지러워요)']]],
  ['✨ 타격감', [['fxAll','타격감 전체 세기','1 = 기본 · 0 = 모두 끄기 · 2 = 두 배'],['fxStop','히트스톱','맞을 때 멈칫하는 정도 (0 = 없음)'],['fxShake','화면 흔들림',''],['fxFlash','화면 번쩍임','크리티컬·필살기 때 화면이 번쩍'],['fxSpark','불꽃 개수',''],['fxGlow','불꽃 빛번짐','0 = 끔 (폰이 느리면 0으로)'],['fxPop','데미지 숫자 튕김','숫자가 커졌다 줄어드는 정도'],['fxZoom','화면 확대 번쩍','크리티컬 때 살짝 확대'],['fxSquash','몬스터 찌그러짐','맞을 때 납작해지는 정도']]]
];
function editor(){ const cur = new Proxy(J.CFG, { get:(t, k) => (J.live ? J.live.base(k) : t[k]) });   /* 실시간 이벤트 값이 아니라 이 폰의 원래 값을 보여줘요 */ let h = '<div class="box"><h2>✏ 내 폰 숫자 (테스트용) <button type="button" data-x>✕</button></h2><p class="note">바꾸고 [이 폰에 적용]을 누르면 바로 바뀌어요.\n이벤트 중이어도 여기엔 이 폰의 원래 값이 보여요.\n모든 아이들에게 적용하려면 [파일로 받기] → rpg 저장소에 rpg-config.json 으로 올려요.</p>';
  for(const [nm, fs] of ED){ h += '<details class="ed"><summary>' + nm + '</summary>'; for(const [k, l, d] of fs) h += '<label><b>' + l + '</b><input class="inp" data-k="' + k + '" value="' + cur[k] + '" inputmode="decimal">' + (d ? '<small>' + d + '</small>' : '') + '</label>'; h += '</details>'; }
  h += '<div class="mn" style="margin-top:10px"><button type="button" data-e="apply">✅ 이 폰에 적용</button><button type="button" data-e="file">📥 파일로 받기</button><button type="button" data-e="reset">↩ 기본값</button><button type="button" data-x>닫기</button></div></div>';
  const { o, close } = overlay(h); o.querySelector('details').open = true;
  const read = () => { const out = {}; o.querySelectorAll('[data-k]').forEach(i => { const v = parseFloat(i.value); if(isFinite(v)) out[i.dataset.k] = v; }); return out; };
  o.addEventListener('click', e => { const b = e.target.closest('[data-e]'); if(!b) return; const k = b.dataset.e;
    if(k === 'apply'){ const v = read(); J.cfgApply(v); J.LS.set('rpg_cfg_local', v); J.toast('✅ 이 폰에 적용했어요 (맵 길이·보스 문은 다음 스테이지부터)'); }
    else if(k === 'reset'){ J.LS.set('rpg_cfg_local', null); Object.assign(J.CFG, J.CFG0); try{ J.live.rebase(); }catch(_){ } close(); J.toast('↩ 기본값으로 (rpg-config.json이 있으면 그 값)'); }
    else if(k === 'file'){ const v = Object.assign({}, J.CFG, read()); const blob = new Blob([JSON.stringify(v, null, 1)], { type:'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'rpg-config.json'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); J.toast('📥 rpg-config.json 받았어요 → rpg 저장소에 올리면 모두에게 적용'); } }); }

/* ===== [rpg-v39] 실시간 이벤트 표시 (화면 위쪽 작은 띠 · 눌러도 아무 일 없어요) ===== */
(function(){
  let el = null;
  function draw(){
    const t = J.live ? J.live.badge() : '';
    if(!t){ if(el) el.style.display = 'none'; return; }
    if(!el){ el = document.createElement('div'); el.id = 'live-badge';
      el.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top,0px) + 6px);z-index:30;max-width:92vw;padding:3px 12px;border-radius:14px;background:rgba(120,30,0,.82);color:#ffe9a8;font:700 12px/1.5 system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none;box-shadow:0 1px 6px rgba(0,0,0,.4)';
      document.body.appendChild(el); }
    el.textContent = t; el.style.display = '';
  }
  if(J.live) J.live.onChange = draw;
})();


/* ===== [rpg-v42] 📮 우편 보내기 패널 (운영자) ===== */
function mailSend(){
  const LV = J.live, MA = J.mailAdmin; if(!LV || !MA){ J.toast('우편 기능이 아직 준비 안 됐어요'); return; }
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const f = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const inp = (k, l) => '<label style="display:inline-block;margin:2px 6px 2px 0"><small>' + l + '</small><br><input class="inp" data-r="' + k + '" inputmode="numeric" placeholder="0" style="width:96px"></label>';
  const { o, close } = overlay('<div class="box"><h2>📮 우편 보내기 <button type="button" data-x>✕</button></h2>' +
    '<p class="note">① 받는 사람 → ② 제목·내용 → ③ 보상 → [보내기]. 보내면 아이들 폰 왼쪽 위에 📬 빨간 점이 떠요. 회수하면 바로 사라지지만, 이미 받은 보상은 안 돌려받아요.</p>' +
    '<div id="ms-st" class="note"></div>' +
    '<div class="mn"><button type="button" data-p="gift">🎁 이벤트 선물</button><button type="button" data-p="tk">🎫 뽑기권 10장</button><button type="button" data-p="gold">💰 골드 100만</button></div>' +
    '<label><b>① 받는 사람</b><select class="inp" id="ms-to"><option value="all">모든 아이</option><option value="one">한 명만 (이름 직접 입력)</option></select></label>' +
    '<input class="inp" id="ms-nm" placeholder="아이 이름 (랭킹에 쓰는 이름 그대로)" maxlength="30" style="display:none">' +
    '<label><b>② 제목</b><input class="inp" id="ms-ti" maxlength="40"></label>' +
    '<label><b>내용</b><textarea class="inp" id="ms-bo" rows="3" maxlength="500"></textarea></label>' +
    '<div><b>③ 보상</b><br>' + inp('gold', '💰 골드') + inp('sus', '🔷 큐브') + inp('red', '🟥 큐브') + inp('black', '⬛ 큐브') + inp('t1', '🎫 뽑기권') + inp('t2', '🎟 뽑기권') + '</div>' +
    '<label><b>④ 언제까지 받을 수 있나</b><select class="inp" id="ms-du"><option value="1">1일</option><option value="3">3일</option><option value="7" selected>7일</option><option value="30">30일</option><option value="0">기한 없음</option></select></label>' +
    '<div id="ms-er" class="note" style="color:#ff8a7a"></div>' +
    '<div class="mn" style="margin-top:8px"><button type="button" data-s="go" id="ms-go">📮 보내기</button><button type="button" data-x>닫기</button></div>' +
    '<h3 style="margin:12px 0 2px;font-size:14px">보낸 우편 (최근 20개)</h3><div id="ms-ls" class="note">불러오는 중…</div></div>');
  const $q = s => o.querySelector(s), er = t => { $q('#ms-er').textContent = t || ''; };
  const PRE = { gift:{ ti:'🎁 이벤트 선물', bo:'도장 친구들, 이벤트 선물이에요!', rw:{ gold:1000000, t1:5, t2:5 } }, tk:{ ti:'🎫 뽑기권 선물', bo:'뽑기권 10장을 보내요.', rw:{ t1:10 } }, gold:{ ti:'💰 골드 선물', bo:'골드 100만을 보내요.', rw:{ gold:1000000 } } };
  function status(){
    const u = LV.user();
    $q('#ms-st').innerHTML = !u ? '로그인 안 됨 <button type="button" data-s="login">🔑 구글로 로그인</button>' : (!u.ok ? '<span style="color:#ff8a7a">운영자 계정이 아니에요 (' + esc(u.email) + ')</span> <button type="button" data-s="logout">다른 계정으로</button>' : '로그인됨: ' + esc(u.email) + ' <button type="button" data-s="logout">로그아웃</button>');
    $q('#ms-go').disabled = !(u && u.ok);
  }
  const prevA = LV.onAuth; LV.onAuth = () => { try{ prevA && prevA(); }catch(_){ } status(); };
  const obs = new MutationObserver(() => { if(!document.body.contains(o)){ LV.onAuth = prevA; obs.disconnect(); } }); obs.observe(document.body, { childList:true });
  const when = t => { const d = new Date(+t); return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); };
  async function list(){
    const box = $q('#ms-ls');
    try{
      const rs = await MA.recent();
      if(!o.isConnected) return;
      box.innerHTML = rs.length ? rs.map(x => { const m = x.m, it = {}; try{ const c = (m.items && m.items.cubes) || {}; Object.assign(it, { gold:+(m.items && m.items.gold) || 0, sus:+c.sus || 0, red:+c.red || 0, black:+c.black || 0, t1:+(m.items && m.items.t1) || 0, t2:+(m.items && m.items.t2) || 0 }); }catch(_){ }
        return '<div style="border:1px solid #3a4a7a;border-radius:8px;padding:6px;margin:5px 0"><b>' + esc(m.title) + '</b> <small>· ' + (m.to === 'all' ? '모든 아이' : '💌 ' + esc(m.to)) + '</small><br><small>🎁 ' + esc(J.mail ? J.mail.text(it) : '') + '<br>' + (m.createdAt ? when(m.createdAt) + ' 보냄' : '') + (m.expireAt ? ' · ' + when(m.expireAt) + '까지' : ' · 기한 없음') + ' · 받은 사람 <b>' + (x.n == null ? '? (규칙 추가 필요)' : x.n + '명') + '</b></small>' +
          '<div class="mn"><button type="button" data-d="' + esc(x.id) + '">🗑 회수</button></div></div>'; }).join('') : '보낸 우편이 없어요';
    }catch(e){ box.textContent = '⚠ ' + LV.errText(e); }
  }
  status(); LV.init().then(status).catch(e => er('⚠ ' + LV.errText(e))); list();
  $q('#ms-to').onchange = () => { $q('#ms-nm').style.display = $q('#ms-to').value === 'one' ? '' : 'none'; };
  const read = () => { const rw = {}; o.querySelectorAll('[data-r]').forEach(i => { rw[i.dataset.r] = i.value.trim().replace(/,/g, ''); }); return { to:($q('#ms-to').value === 'one' ? $q('#ms-nm').value.trim() : 'all'), title:$q('#ms-ti').value, body:$q('#ms-bo').value, rw, days:+$q('#ms-du').value }; };
  o.addEventListener('click', async e => {
    const bp = e.target.closest('[data-p]'), bs = e.target.closest('[data-s]'), bd = e.target.closest('[data-d]');
    try{
      if(bp){ const p = PRE[bp.dataset.p]; $q('#ms-ti').value = p.ti; $q('#ms-bo').value = p.bo; o.querySelectorAll('[data-r]').forEach(i => { i.value = p.rw[i.dataset.r] || ''; }); er(''); return; }
      if(bd){ if(!confirm('이 우편을 회수할까요?\n아이 폰에서 바로 사라져요.\n(이미 받은 보상은 안 돌려받아요)')) return; er(''); await MA.remove(bd.dataset.d); J.toast('🗑 회수했어요'); list(); return; }
      if(!bs) return; const k = bs.dataset.s; er('');
      if(k === 'login'){ await LV.login(); status(); }
      else if(k === 'logout'){ await LV.logout(); status(); }
      else if(k === 'go'){
        const m = read(), bad = MA.check(m); if(bad){ er('⚠ ' + bad); return; }
        const r = m.rw, txt = J.mail ? J.mail.text({ gold:+r.gold || 0, sus:+r.sus || 0, red:+r.red || 0, black:+r.black || 0, t1:+r.t1 || 0, t2:+r.t2 || 0 }) : '';
        if(!confirm('정말 ' + (m.to === 'all' ? '모든 아이에게' : '「' + m.to + '」에게') + ' 보낼까요?\n' + m.title.trim() + '\n' + txt)) return;
        if(MA.big(m) && !confirm('⚠ 큰 보상이에요 (골드 1억 이상 또는 뽑기권 100장 이상).\n정말요?')) return;
        bs.disabled = true; try{ await MA.send(m); J.toast('📮 보냈어요'); $q('#ms-ti').value = ''; $q('#ms-bo').value = ''; o.querySelectorAll('[data-r]').forEach(i => { i.value = ''; }); list(); } finally { status(); }
      }
    }catch(err){ er('⚠ ' + LV.errText(err)); status(); }
  });
}

/* ===== [rpg-v41] 📬 우편함 화면 (설정 메뉴에도 있고, 안 받은 우편이 있으면 왼쪽 위에 작은 📬 버튼이 떠요) ===== */
let mailCur = null;
function mailBox(){
  const M = J.mail; if(!M){ J.toast('우편함이 아직 준비 안 됐어요'); return; }
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const { o, close } = overlay('<div class="box"><h2>📬 우편함 <button type="button" data-x>✕</button></h2><div id="ml-note" class="note"></div><div id="ml-list"></div><div class="mn" style="margin-top:8px"><button type="button" data-ml="__all" id="ml-all">📥 모두 받기</button><button type="button" data-x>닫기</button></div></div>');
  let busy = false;
  const draw = () => {
    const ls = M.list(), on = M.online(), off = (busy || !on) ? ' disabled' : '';
    o.querySelector('#ml-note').textContent = on ? '받기를 누르면 골드·큐브·뽑기권이 바로 들어와요. 같은 우편은 한 번만 받아져요.' : '📡 인터넷이 필요해요. 연결되면 받을 수 있어요.';
    o.querySelector('#ml-list').innerHTML = ls.length ? ls.map(m => '<div style="border:1px solid #3a4a7a;border-radius:8px;padding:8px;margin:6px 0;background:rgba(255,255,255,.04)"><b>' + (m.personal ? '💌 ' : '') + esc(m.title) + '</b>' +
      (m.body ? '<div style="white-space:pre-wrap;font-size:13px;margin:4px 0">' + esc(m.body) + '</div>' : '') +
      '<div style="font-size:13px;color:#ffe9a8;margin:4px 0">🎁 ' + esc(M.text(m.items)) + '</div>' +
      (m.expireAt ? '<small style="opacity:.7">' + (function(){ const d = new Date(m.expireAt); return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + '까지'; })() + '</small>' : '') +
      '<div class="mn"><button type="button" data-ml="' + esc(m.id) + '"' + off + '>받기</button></div></div>').join('') : '<p class="note">받을 우편이 없어요 🙂</p>';
    const all = o.querySelector('#ml-all'); all.disabled = busy || !on || !ls.length;
  };
  o.addEventListener('click', async e => {
    const b = e.target.closest('[data-ml]'); if(!b || b.disabled || busy) return;
    busy = true; draw();
    let r; try{ r = b.dataset.ml === '__all' ? await M.claimAll() : await M.claim(b.dataset.ml); }catch(_){ r = { ok:false, msg:'문제가 생겼어요. 다시 눌러 주세요' }; }
    busy = false; J.toast(r.msg); draw();
  });
  mailCur = { o, draw }; draw();
}
/* [rpg-v45] 우편이 오면 가운데에 공지 창이 떠요 + 📬 버튼을 크게·깜빡이게 */
(function(){
  if(!J.mail) return;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  if(!document.getElementById('mail-fab-css')){ const st = document.createElement('style'); st.id = 'mail-fab-css'; st.textContent = '@keyframes mailpulse{0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(255,212,90,.8)}50%{transform:scale(1.12);box-shadow:0 0 0 10px rgba(255,212,90,0)}}'; document.head.appendChild(st); }
  const fab = document.createElement('button'); fab.type = 'button'; fab.id = 'mail-fab';
  fab.style.cssText = 'position:fixed;left:8px;top:calc(env(safe-area-inset-top,0px) + 84px);z-index:30;width:58px;height:58px;border-radius:50%;border:3px solid #ffd45a;background:rgba(20,26,60,.95);font-size:30px;line-height:1;padding:0;animation:none;opacity:.9';
  const dot = document.createElement('i'); dot.style.cssText = 'position:absolute;top:-6px;right:-6px;min-width:24px;height:24px;border-radius:12px;background:#e02828;color:#fff;font:700 14px/24px sans-serif;font-style:normal;text-align:center;pointer-events:none;border:2px solid #fff;box-sizing:border-box';
  dot.style.display = 'none'; fab.textContent = '📬'; fab.appendChild(dot); fab.onclick = () => mailBox(); document.body.appendChild(fab);
  /* [rpg-v46] 🧪 소비 바로가기 — 가방의 소비 탭(큐브·뽑기권·골드보따리)을 바로 열어요 */
  const csb = document.createElement('button'); csb.type = 'button'; csb.id = 'cs-fab'; csb.textContent = '🧪';
  csb.style.cssText = 'position:fixed;left:8px;top:calc(env(safe-area-inset-top,0px) + 150px);z-index:30;width:58px;height:58px;border-radius:50%;border:3px solid #7be8e2;background:rgba(20,26,60,.95);font-size:30px;line-height:1;padding:0;opacity:.9';
  csb.onclick = () => { if(!needLoot()) return; try{ J.L.bulk = null; J.L.view = 'cs'; J.L.sel = null; }catch(_){ } J.L.openBag(); }; document.body.appendChild(csb);
  const told = {}; let popO = null, tm = 0;
  function notice(){
    try{
      if(popO && popO.isConnected) return;
      if(mailCur && mailCur.o.isConnected) return;
      const ls = J.mail.list().filter(m => !told[m.id]); if(!ls.length) return;
      ls.forEach(m => { told[m.id] = 1; });
      const top = ls.slice(0, 3);
      const html = '<div class="box" style="text-align:center"><h2 style="justify-content:center">📬 새 우편이 왔어요!</h2>' +
        '<div style="font-size:15px;margin:6px 0">안 받은 우편 <b style="color:#ffd45a">' + J.mail.count() + '통</b></div>' +
        top.map(m => '<div style="border:1px solid #3a4a7a;border-radius:8px;padding:8px;margin:6px 0;background:rgba(255,255,255,.05);text-align:left"><b>' + (m.personal ? '💌 ' : '') + esc(m.title) + '</b>' +
          (m.body ? '<div style="white-space:pre-wrap;font-size:13px;margin:4px 0">' + esc(m.body) + '</div>' : '') +
          '<div style="font-size:13px;color:#ffe9a8">🎁 ' + esc(J.mail.text(m.items)) + '</div></div>').join('') +
        (ls.length > 3 ? '<small style="opacity:.7">…그리고 ' + (ls.length - 3) + '통 더</small>' : '') +
        '<div class="mn" style="margin-top:8px"><button type="button" data-open>📬 우편함 열기</button><button type="button" data-x>나중에</button></div></div>';
      const r = overlay(html); popO = r.o;
      r.o.addEventListener('click', e => { if(e.target.closest('[data-open]')){ r.close(); mailBox(); } });
    }catch(_){ }
  }
  J.mail.onChange = () => { try{
    const n = J.mail.count(); dot.textContent = n > 9 ? '9+' : String(n); dot.style.display = n ? '' : 'none'; fab.style.animation = n ? 'mailpulse 1.6s infinite' : 'none'; fab.style.opacity = n ? '1' : '.9';
    if(mailCur && mailCur.o.isConnected) mailCur.draw();
    if(n){ clearTimeout(tm); tm = setTimeout(notice, 1200); }
  }catch(_){ } };
})();

/* ===== 시작 ===== */
J.loading = function(on){ $('veil').classList.toggle('on', !!on); };
(async function(){
  window.jdBaramLoad = () => J.toast('아이템 목록은 끝말잇기를 한 번 열면 들어와요');
  window.toast = window.toast || J.toast;
  try{
    await J.boot();
    J.W.init($('cv')); J.SND.load();
    J.msg('영웅 옷 입히는 중…');
    for(let i = 0; i < 30 && J.L && !J.L.goldOk; i++) await new Promise(r => setTimeout(r, 100)); /* 가방이 저장소를 다 읽을 때까지 */
    await J.refreshHero();
    const R = J.prog(); G.st = Math.max(0, Math.min(R.clr, (R.pick || 1) - 1));
    J.msg('스테이지 준비 중…'); await J.beginStage();
    J.ready = true; $('load').remove(); J.start();
    if(isAdmin()) document.body.classList.add('admin');
    if(!J.L || !J.LIB.map.length) J.toast('끝말잇기 그림을 다 못 불러왔어요. ⚙ 설정 → 🔍 그림 상태에서 다시 불러오기');
    if(!J.LS.get('rpg_help3', false)){ J.LS.set('rpg_help3', true); setTimeout(help, 400); }
    window.JD_RPG = J;
  }catch(e){ console.error(e); J.msg('시작하다 문제가 생겼어요: ' + (e && e.message)); }
})();
document.addEventListener('pointerdown', () => { J.SND.ctx(); if(J.ready) J.SND.music(J.bgmKey(G.st)); }, { once:true });
})(window.J);
