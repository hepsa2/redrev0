// 缓存版本（每次更新记得改这里）
const CACHE_NAME = 'app-cache-v1';

// 需要预缓存的页面
const URLS_TO_CACHE = [
  '/',
  '/index.html'
];

// =======================
// 安装阶段：预缓存资源
// =======================
self.addEventListener('install', event => {
  console.log('[SW] Installing...');

  // 立即激活新 SW
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching files');
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch(err => {
        console.error('[SW] Cache failed:', err);
      })
  );
});

// =======================
// 激活阶段：清理旧缓存
// =======================
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');

  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  // 接管所有页面（关键）
  self.clients.claim();
});

// =======================
// 请求拦截：缓存优先
// =======================
self.addEventListener('fetch', event => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {

        // 有缓存直接返回
        if (cachedResponse) {
          return cachedResponse;
        }

        // 没缓存就走网络
        return fetch(event.request)
          .then(networkResponse => {

            // 动态缓存新请求（可选）
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });

          })
          .catch(() => {
            // 离线 fallback（防白屏）
            return caches.match('/index.html');
          });

      })
  );
});
