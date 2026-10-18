/* 끝말잇기(index3)에 있는 가방·장비창·강화(스타포스)·큐브·변신·동료·합성·뽑기를 그대로 가져와서 이 게임에서도 같이 써요.
   끝말잇기 파일을 고치면(에디터 포함) 여기도 자동으로 똑같이 바뀌어요. 저장도 같은 곳(IndexedDB 'jd-loot')이라 늘 같이 움직여요. */
window.JDSHARE = (function(){
  const CSS = ['loot-css','loot-layout-v2','cube-css','loot-perf-v3','loot-extra-css','hero-solo-css','jd-bag-big-css','jd-v17-css','jd-th-css','jd-v75-css','jd-fix-css'];
  const JSONS = ['jd-patch','jd-optcfg','jd-hset','jd-bossdrop','jd-dlx-units','jd-dlx-fx','jd-tierpct'];
  const SCRIPTS = ['jd-patch-rt','rpg-loot'];
  let page = '', url = '';
  function tagBody(t, tag, id, wantJson){
    const re = new RegExp('<' + tag + '[^>]*id="' + id + '"[^>]*>', 'g'); let m;
    while((m = re.exec(t))){ const s = re.lastIndex, e = t.indexOf('</' + tag + '>', s); if(e < 0) return null; const b = t.slice(s, e);
      if(!wantJson || /^\s*[\[{]/.test(b)) return b; }
    return null; }
  async function load(cands, onProg){
    for(const c of cands){ try{ const r = await fetch(c); if(!r.ok) continue; const x = await r.text(); if(x.indexOf('id="rpg-loot"') >= 0 && x.indexOf('id="jd-lib"') >= 0){ page = x; url = new URL(c, location.href).href; break; } }catch(_){ } }
    return !!page; }
  function json(id){ const b = tagBody(page, 'script', id, true); if(!b) return null; try{ return JSON.parse(b); }catch(_){ return null; } }
  function inject(){
    const wg = url.replace(/[?#].*$/, '');
    window.JD_WG_PAGE = wg;
    for(const id of CSS){ const b = tagBody(page, 'style', id); if(b == null || document.getElementById(id)) continue; const s = document.createElement('style'); s.id = id; s.textContent = b; document.head.appendChild(s); }
    for(const id of JSONS){ const b = tagBody(page, 'script', id, true); if(b == null || document.getElementById(id)) continue; const s = document.createElement('script'); s.type = 'application/json'; s.id = id; s.textContent = b; document.head.appendChild(s); }
    for(const id of SCRIPTS){ let b = tagBody(page, 'script', id); if(b == null) continue;
      /* jd_share 안의 '끝말잇기 주소'는 끝말잇기 주소 그대로 두기 (RPG 주소로 바뀌면 다른 게임이 끝말잇기를 못 찾아요) */
      b = b.split('page:location.origin+location.pathname').join('page:(window.JD_WG_PAGE||location.origin+location.pathname)');
      const s = document.createElement('script'); s.id = id; s.textContent = b; try{ document.body.appendChild(s); }catch(_){ } }
    return !!window.LOOT; }
  return { load, json, inject, get url(){ return url; }, get base(){ return url.replace(/[^\/]*$/, ''); } };
})();
