/* 정도 RPG 오프라인 — 한 번 열면 저장돼서 인터넷 없이도 열려요. 게임 파일을 고치면 VERSION을 하나 올려 주세요. */
const VERSION = 'rpg-v44';
const CACHE = 'jd-rpg-' + VERSION, ART = 'jd-dlx-3', BIG = 'jd-rpg-art-1', WG = 'jd-rpg-wg-1', MOC = 'jd-rpg-mo-2';   /* [v28] 모션 팩(mo-*.json)은 따로 저장: 폰에 남은 옛 사본이 새 목록과 어긋나 엉뚱한 그림(열기구·다른 캐릭터)이 나오던 문제 */
const FONT = ['fonts.googleapis.com', 'fonts.gstatic.com'];
const MUS = Array.from({ length: 10 }, (_, i) => 'bgm-' + ('0' + (i * 5 + 1)).slice(-2) + '-' + ('0' + (i * 5 + 5)).slice(-2) + '.mp3');
const SFX = ['swing1','swing2','swing3','hit1','hit2','hit3','crit','mdie','mdie2','hurt','roll','spin','ult','slam','warn','coin','clear','spawn','heal','ui','boss','loot'].map(k => 'sfx-' + k + '.m4a');
const ART_PRE = ['three.min.js', 'pix-ground.png', 'pix-props.png', 'fx-cloud1.png', 'fx-cloud2.png', 'fx-cloud3.png', 'fx-petal.png', 'prop-arch.png', 'prop-lantern.png', 'prop-palm1.png', 'prop-palm2.png', 'mo-index.json'].concat(Array.from({ length: 10 }, (_, i) => 'sky-' + ('0' + (i + 1)).slice(-2) + '.jpg'), SFX);   // 인터넷 없이 처음 열어도 되도록 미리 저장 (없는 파일은 건너뜀)   // 스테이지 음악 10곡: 처음 설치할 때 미리 저장 (이후 데이터 0)
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(Promise.all([caches.open(CACHE).then(c => c.addAll(['./', 'manifest.json', 'icon-192.png', 'icon-512.png', 'share.js', 'rpg-core.js', 'rpg-world.js', 'rpg-game.js', 'rpg-ui.js']).catch(() => {})), caches.open(BIG).then(c => Promise.all(MUS.concat(ART_PRE).map(u => c.match(u).then(h => h || c.add(u)).catch(() => {}))))])); });
self.addEventListener('activate', e => e.waitUntil((async () => { for (const k of await caches.keys()) if (k.startsWith('jd-rpg-') && ![CACHE, BIG, WG, MOC].includes(k)) await caches.delete(k); try { const a0 = await caches.open(ART); for (const k of await a0.keys()) if (/\/mo-[^\/]*\.json/.test(k.url)) await a0.delete(k); } catch (_) {} try { const b = await caches.open(BIG); for (const k of await b.keys()) if (/\/bgm-(field|boss|st\d+)\./.test(k.url) || /\/mo-index\.json|\/mo-[a-z]+-0[01]\d\./.test(k.url)) await b.delete(k); } catch (_) {} await self.clients.claim(); })()));
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url), same = u.origin === self.location.origin;
  if (!same && !FONT.includes(u.hostname)) return;
  const scope = new URL(self.registration.scope).pathname;
  const mop = same && /\/mo-[^\/]*\.json$/.test(u.pathname) && !/index\.json$/.test(u.pathname);
  const art = same && /\/dlx-[^\/]*$/.test(u.pathname) && !/index\.json$/.test(u.pathname);          // 캐릭터 그림: 한 번 받으면 계속
  const big = same && /\/(sky|prop|fx|sfx|bgm|pix)-[^\/]*$|three\.min\.js$/.test(u.pathname);                 // 하늘·나무·소리·음악·3D 엔진: 한 번 받으면 계속
  const wg = same && !u.pathname.startsWith(scope) && (r.mode !== 'navigate');                              // 끝말잇기 파일(맵·몬스터·가방): 저장본 먼저 보여 주고 뒤에서 새로 받기
  const fresh = r.mode === 'navigate' || /\/$|\.html$|\.js$|index\.json$|rpg-config\.json$/.test(u.pathname);
  e.respondWith((async () => {
    if (wg && /\/$|\.html$/.test(u.pathname)) {   // [v13] 끝말잇기 본체 페이지(가방·스타포스 코드): 와이파이면 새 것 먼저 → 끝말잇기를 고쳐도 RPG가 옛 코드를 계속 쓰지 않게 (셀룰러·데이터절약이면 예전처럼 저장본 먼저)
      const cn0 = self.navigator && self.navigator.connection;
      if (!(cn0 && (cn0.saveData || cn0.type === 'cellular'))) { try { const res = await fetch(r); if (res && res.ok) { (await caches.open(WG)).put(r, res.clone()); return res; } } catch (_) {} }
    }
    if (wg && /\/baram[-_][^\/]*\.json$/.test(u.pathname)) {   // [v18] 장비표 목록(baram-data.json)·장비표 조각(baram_all_*.json): 폰에 남은 옛 사본을 따라가지 않게 항상 새 것 먼저 (오프라인일 때만 저장본)
      try { const res = await fetch(r, { cache: 'no-store' }); if (res && res.ok) { (await caches.open(WG)).put(r, res.clone()); return res; } return res; } catch (_) {}
      for (const k of await caches.keys()) { const h = await (await caches.open(k)).match(r, { ignoreSearch: true }); if (h) return h; }
      return new Response('', { status: 504 });
    }
    if (wg) {   // 끝말잇기 파일: 끝말잇기 앱이 이미 저장해 둔 것을 먼저 쓰고(데이터 0), 없을 때만 받아요. 셀룰러·데이터절약에선 뒤에서 새로 받지 않아요
      for (const k of await caches.keys()) { if (k === WG) continue; const h = await (await caches.open(k)).match(r, { ignoreSearch: true }); if (h) return h; }
      const c = await caches.open(WG), hit = await c.match(r, { ignoreSearch: true }), cn = self.navigator && self.navigator.connection, lite = cn && (cn.saveData || cn.type === 'cellular');
      const net = hit && lite ? Promise.resolve(null) : fetch(r).then(res => { if (res && res.ok) c.put(r, res.clone()); return res; }).catch(() => null);
      if (hit) { e.waitUntil(net); return hit; } return (await net) || new Response('', { status: 504 });
    }
    const c = await caches.open(mop ? MOC : art ? ART : big ? BIG : CACHE);
    if (fresh && !art && !big) { try { const res = await fetch(r); if (res && res.ok) c.put(r, res.clone()); return res; } catch (err) { return (await c.match(r, { ignoreSearch: true })) || (r.mode === 'navigate' ? await c.match('./') : null) || new Response('오프라인이에요', { status: 503 }); } }
    const hit = await c.match(r, { ignoreSearch: same && !mop }); if (hit) return hit;
    try { const res = await fetch(r); if (res && (res.ok || res.type === 'opaque')) c.put(r, res.clone()); return res; } catch (err) { return new Response('', { status: 504 }); }
  })());
});
