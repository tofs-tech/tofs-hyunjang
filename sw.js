/* TOFS PWA 서비스워커 — 앱 화면은 네트워크 우선(항상 최신), 오프라인이면 캐시로 열림.
   데이터 통신(Supabase)은 건드리지 않음. */
const CACHE='tofs-v1';
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
  if(e.request.mode==='navigate'||u.pathname.endsWith('/index.html')){
    e.respondWith(
      fetch(e.request).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',cp));return r;})
        .catch(()=>caches.match('./index.html'))
    );
    return;
  }
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return r;})));
});
