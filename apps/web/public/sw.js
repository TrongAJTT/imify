importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

if (workbox) {
  console.log('Workbox is loaded');

  // Skip analytics and external tracking services
  workbox.routing.registerRoute(
    ({ url }) => 
      url.hostname.includes('cloudflareinsights.com') || 
      url.hostname.includes('google-analytics.com') ||
      url.pathname.startsWith('/cdn-cgi/'),
    new workbox.strategies.NetworkOnly()
  );

  // Pre-cache WASM files
  workbox.precaching.precacheAndRoute([
    { url: '/assets/wasm/avif_enc.js', revision: '1' },
    { url: '/assets/wasm/avif_enc.wasm', revision: '1' },
    { url: '/assets/wasm/jsquash_magic_kernel.js', revision: '1' },
    { url: '/assets/wasm/jsquash_magic_kernel_bg.wasm', revision: '1' },
    { url: '/assets/wasm/jxl_enc.js', revision: '1' },
    { url: '/assets/wasm/jxl_enc.wasm', revision: '1' },
    { url: '/assets/wasm/mozjpeg_enc.js', revision: '1' },
    { url: '/assets/wasm/mozjpeg_enc.wasm', revision: '1' },
    { url: '/assets/wasm/oxipng.js', revision: '1' },
    { url: '/assets/wasm/squoosh_oxipng_bg.wasm', revision: '1' },
    { url: '/assets/wasm/squoosh_resize.js', revision: '1' },
    { url: '/assets/wasm/squoosh_resize_bg.wasm', revision: '1' },
    { url: '/assets/wasm/squooshhqx.js', revision: '1' },
    { url: '/assets/wasm/squooshhqx_bg.wasm', revision: '1' },
    { url: '/assets/wasm/webp_enc.js', revision: '1' },
    { url: '/assets/wasm/webp_enc.wasm', revision: '1' },
    // Core brand assets
    { url: '/assets/icon.png', revision: '1' }
  ]);

  // Cache static assets (CSS, JS) with StaleWhileRevalidate
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'style' || request.destination === 'script' || request.destination === 'worker',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-resources',
    })
  );

  // Cache images with CacheFirst
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'images',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
      ],
    })
  );

  // Default page caching (Next.js static export)
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: 'pages',
    })
  );

  // Allow the new service worker to take control immediately
  self.addEventListener('install', () => {
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
  });

  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });
} else {
  console.log('Workbox failed to load');
}
