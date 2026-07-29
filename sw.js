/* 이 파일이 있어야 안드로이드 크롬이 홈 화면 바로가기가 아니라
   독립된 앱(WebAPK)으로 설치한다. 덤으로 인터넷이 끊겨도 마지막 화면이 열린다. */
const CACHE = 'family-app-v1';
const ASSETS = [
  './', './index.html', './manifest.json',
  './icon-180.png', './icon-192.png', './icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .catch(() => {})               // 파일 하나가 없어도 설치는 계속한다
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* 항상 새 내용을 먼저 받아오고, 실패했을 때만 저장해 둔 것을 쓴다.
   그래야 앱을 고쳐도 예전 화면이 계속 뜨지 않는다. */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;   // Supabase 같은 외부 요청은 건드리지 않는다

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then(hit => hit || caches.match('./index.html')))
  );
});
