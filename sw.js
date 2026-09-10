/* TOFS PWA 서비스워커 — 앱 화면은 네트워크 우선(항상 최신), 오프라인이면 캐시로 열림.
   데이터 통신(Supabase)은 건드리지 않음.
   2026-09-10: 앱 본체(./ 또는 index.html)만 index.html 캐시로 다룬다. recover.html 같은 다른 페이지는
   네트워크로만 열고, 그 응답을 index.html 캐시에 덮어쓰지 않는다. */
const CACHE='tofs-v2';
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'])));
  self.skipWaiting();
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(u.origin!==location.origin)return; /* Supabase·CDN 등 외부 요청은 그대로 통과 */
  const isApp=u.pathname.endsWith('/')||u.pathname.endsWith('/index.html');
  if(e.request.mode==='navigate'||isApp){
    if(!isApp)return; /* recover.html 등 다른 페이지는 브라우저가 그냥 네트워크로 연다 */
    e.respondWith(
      fetch(e.request).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',cp));return r;})
        .catch(()=>caches.match('./index.html'))
    );
    return;
  }
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return r;})));
});
