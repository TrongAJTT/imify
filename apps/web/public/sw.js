// Service Worker v5 - Next.js Static Export Native Offline Support
// Fixes SPA client-side routing and direct F5 navigate issues under offline mode.
const SW_VERSION = '2.3.0';

importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

if (workbox) {
  console.log('[SW] Workbox loaded — Next.js static export optimized');

  // ─── EXCLUSIONS ──────────────────────────────────────────────────────────────
 
  // Never intercept or cache runtime version descriptor
  workbox.routing.registerRoute(
    ({ url }) => url.pathname === '/version.json',
    new workbox.strategies.NetworkOnly()
  );

  // Skip analytics / tracking
  workbox.routing.registerRoute(
    ({ url }) =>
      url.hostname.includes('cloudflareinsights.com') ||
      url.hostname.includes('google-analytics.com') ||
      url.pathname.startsWith('/cdn-cgi/'),
    new workbox.strategies.NetworkOnly()
  );

  // CRITICAL: Never intercept AI model downloads from Hugging Face.
  // Web Workers fetch models directly; SW interception causes stalling.
  workbox.routing.registerRoute(
    ({ url }) =>
      url.hostname.includes('huggingface.co') ||
      url.hostname.includes('cloudfront.net'),
    new workbox.strategies.NetworkOnly()
  );

  // ─── PRE-CACHE: App Shell & Pages ──────────────────────────────────────────
  // We precache all clean static assets (.html & .txt RSC payload pairs).
  workbox.precaching.precacheAndRoute([
    // ── Home & Redirect ─────────────────────────────────────────────────────────
    { url: '/index.html',                          revision: '6' },
    { url: '/index.txt',                           revision: '6' },
    { url: '/redirect.html',                       revision: '6' },
    { url: '/redirect.txt',                        revision: '6' },

    // ── Single Feature Pages ────────────────────────────────────────────────────
    { url: '/upscaler.html',                       revision: '6' },
    { url: '/upscaler.txt',                        revision: '6' },
    { url: '/background-remover.html',             revision: '6' },
    { url: '/background-remover.txt',              revision: '6' },
    { url: '/diffchecker.html',                    revision: '6' },
    { url: '/diffchecker.txt',                     revision: '6' },
    { url: '/inspector.html',                      revision: '6' },
    { url: '/inspector.txt',                       revision: '6' },
    { url: '/qr-generator.html',                   revision: '6' },
    { url: '/qr-generator.txt',                    revision: '6' },
    { url: '/qr-reader.html',                      revision: '6' },
    { url: '/qr-reader.txt',                       revision: '6' },
    { url: '/extension.html',                      revision: '6' },
    { url: '/extension.txt',                       revision: '6' },
    { url: '/recovery.html',                       revision: '6' },
    { url: '/recovery.txt',                        revision: '6' },
    { url: '/pdf-studio.html',                     revision: '6' },
    { url: '/pdf-studio.txt',                      revision: '6' },
    { url: '/404.html',                            revision: '6' },

    // ── Single Processor ────────────────────────────────────────────────────────
    { url: '/single-processor.html',               revision: '6' },
    { url: '/single-processor.txt',                revision: '6' },
    { url: '/single-processor/work.html',          revision: '6' },
    { url: '/single-processor/work.txt',           revision: '6' },

    // ── Batch Processor ─────────────────────────────────────────────────────────
    { url: '/batch-processor.html',                revision: '6' },
    { url: '/batch-processor.txt',                 revision: '6' },
    { url: '/batch-processor/work.html',           revision: '6' },
    { url: '/batch-processor/work.txt',            revision: '6' },

    // ── Splitter ────────────────────────────────────────────────────────────────
    { url: '/splitter.html',                       revision: '6' },
    { url: '/splitter.txt',                        revision: '6' },
    { url: '/splitter/work.html',                  revision: '6' },
    { url: '/splitter/work.txt',                   revision: '6' },

    // ── Splicing ────────────────────────────────────────────────────────────────
    { url: '/splicing.html',                       revision: '6' },
    { url: '/splicing.txt',                        revision: '6' },
    { url: '/splicing/work.html',                  revision: '6' },
    { url: '/splicing/work.txt',                   revision: '6' },

    // ── Pattern Generator ───────────────────────────────────────────────────────
    { url: '/pattern-generator.html',              revision: '6' },
    { url: '/pattern-generator.txt',               revision: '6' },
    { url: '/pattern-generator/work.html',          revision: '6' },
    { url: '/pattern-generator/work.txt',           revision: '6' },

    // ── Collage Maker ───────────────────────────────────────────────────────────
    { url: '/collage-maker.html',                  revision: '6' },
    { url: '/collage-maker.txt',                   revision: '6' },

    // ── Filling ─────────────────────────────────────────────────────────────────
    { url: '/filling.html',                        revision: '6' },
    { url: '/filling.txt',                         revision: '6' },
    { url: '/filling/edit.html',                   revision: '6' },
    { url: '/filling/edit.txt',                    revision: '6' },
    { url: '/filling/fill.html',                   revision: '6' },
    { url: '/filling/fill.txt',                    revision: '6' },
    { url: '/filling/grid-design.html',            revision: '6' },
    { url: '/filling/grid-design.txt',             revision: '6' },
    { url: '/filling/symmetric-generate.html',     revision: '6' },
    { url: '/filling/symmetric-generate.txt',      revision: '6' },

    // ── Locale files (i18n) — English ──────────────────────────────────────────
    { url: '/locales/en/_meta.json',               revision: '5' },
    { url: '/locales/en/about.json',               revision: '5' },
    { url: '/locales/en/backgroundRemover.json',   revision: '5' },
    { url: '/locales/en/collageMaker.json',         revision: '5' },
    { url: '/locales/en/common.json',              revision: '5' },
    { url: '/locales/en/devMode.json',             revision: '5' },
    { url: '/locales/en/diffchecker.json',         revision: '5' },
    { url: '/locales/en/filling.json',             revision: '5' },
    { url: '/locales/en/homepage.json',            revision: '5' },
    { url: '/locales/en/inspector.json',           revision: '5' },
    { url: '/locales/en/pattern.json',             revision: '5' },
    { url: '/locales/en/pdfStudio.json',           revision: '5' },
    { url: '/locales/en/processor.json',           revision: '5' },
    { url: '/locales/en/qrGenerator.json',         revision: '5' },
    { url: '/locales/en/qrReader.json',            revision: '5' },
    { url: '/locales/en/settings.json',            revision: '5' },
    { url: '/locales/en/splicing.json',            revision: '5' },
    { url: '/locales/en/splitter.json',            revision: '5' },
    { url: '/locales/en/upscaler.json',            revision: '5' },
    { url: '/locales/en/workspace.json',           revision: '5' },

    // ── Locale files (i18n) — Vietnamese ───────────────────────────────────────
    { url: '/locales/vi/_meta.json',               revision: '5' },
    { url: '/locales/vi/about.json',               revision: '5' },
    { url: '/locales/vi/backgroundRemover.json',   revision: '5' },
    { url: '/locales/vi/collageMaker.json',         revision: '5' },
    { url: '/locales/vi/common.json',              revision: '5' },
    { url: '/locales/vi/devMode.json',             revision: '5' },
    { url: '/locales/vi/diffchecker.json',         revision: '5' },
    { url: '/locales/vi/filling.json',             revision: '5' },
    { url: '/locales/vi/homepage.json',            revision: '5' },
    { url: '/locales/vi/inspector.json',           revision: '5' },
    { url: '/locales/vi/pattern.json',             revision: '5' },
    { url: '/locales/vi/pdfStudio.json',           revision: '5' },
    { url: '/locales/vi/processor.json',           revision: '5' },
    { url: '/locales/vi/qrGenerator.json',         revision: '5' },
    { url: '/locales/vi/qrReader.json',            revision: '5' },
    { url: '/locales/vi/settings.json',            revision: '5' },
    { url: '/locales/vi/splicing.json',            revision: '5' },
    { url: '/locales/vi/splitter.json',            revision: '5' },
    { url: '/locales/vi/upscaler.json',            revision: '5' },
    { url: '/locales/vi/workspace.json',           revision: '5' },

    // ── WASM modules ────────────────────────────────────────────────────────────
    { url: '/assets/wasm/avif_enc.js',                   revision: '5' },
    { url: '/assets/wasm/avif_enc.wasm',                 revision: '5' },
    { url: '/assets/wasm/jsquash_magic_kernel.js',       revision: '5' },
    { url: '/assets/wasm/jsquash_magic_kernel_bg.wasm',  revision: '5' },
    { url: '/assets/wasm/jxl_enc.js',                    revision: '5' },
    { url: '/assets/wasm/jxl_enc.wasm',                  revision: '5' },
    { url: '/assets/wasm/mozjpeg_enc.js',                revision: '5' },
    { url: '/assets/wasm/mozjpeg_enc.wasm',              revision: '5' },
    { url: '/assets/wasm/oxipng.js',                     revision: '5' },
    { url: '/assets/wasm/squoosh_oxipng_bg.wasm',        revision: '5' },
    { url: '/assets/wasm/squoosh_resize.js',             revision: '5' },
    { url: '/assets/wasm/squoosh_resize_bg.wasm',        revision: '5' },
    { url: '/assets/wasm/squooshhqx.js',                 revision: '5' },
    { url: '/assets/wasm/squooshhqx_bg.wasm',            revision: '5' },
    { url: '/assets/wasm/webp_enc.js',                   revision: '5' },
    { url: '/assets/wasm/webp_enc.wasm',                 revision: '5' },

    // ── Core brand assets ───────────────────────────────────────────────────────
    { url: '/assets/icon.png',  revision: '5' },
  ]);

  // ─── RUNTIME CACHE STRATEGIES ────────────────────────────────────────────────

  // JS/CSS bundles: StaleWhileRevalidate — serve instantly from cache, refresh in background.
  // 'worker' destination is intentionally excluded — Web Workers fetch from HuggingFace directly.
  workbox.routing.registerRoute(
    ({ request }) =>
      request.destination === 'style' || request.destination === 'script',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-resources',
    })
  );

  // Images: CacheFirst — rarely change, serve from cache aggressively.
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'images',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        }),
      ],
    })
  );

  // Next.js App Router RSC Payloads (.txt / _rsc data fetched during client navigation)
  // We resolve the text payload directly from precached assets to avoid calling the network.
  workbox.routing.registerRoute(
    ({ url, request }) =>
      url.pathname.endsWith('.txt') ||
      url.pathname.endsWith('.rsc') ||
      request.headers.get('RSC') === '1',
    async ({ url }) => {
      let path = url.pathname;
      // If it doesn't end with .txt, force .txt for mapping
      if (!path.endsWith('.txt') && !path.endsWith('.rsc')) {
        path = `${path}.txt`;
      }
      if (path.endsWith('.rsc')) {
        path = path.replace(/\.rsc$/, '.txt');
      }

      // Try finding the key in precache cache using matchPrecache
      const response = await workbox.precaching.matchPrecache(path);
      if (response) {
        // CRITICAL: Next.js Client router checks Content-Type header.
        // If it isn't text/x-component or text/plain, it fails to parse as client component.
        const headers = new Headers(response.headers);
        headers.set('Content-Type', 'text/x-component; charset=utf-8');
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      }

      // Fallback: Fetch from network
      return fetch(url);
    }
  );

  // Navigation (HTML pages): Serve matching .html files from precache.
  // Supports clean URLs (e.g. /upscaler -> resolves /upscaler.html)
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    async ({ url }) => {
      let path = url.pathname;
      if (path === '/') {
        path = '/index.html';
      } else {
        if (path.endsWith('/')) {
          path = path.slice(0, -1);
        }
        if (!path.endsWith('.html')) {
          path = `${path}.html`;
        }
      }

      // Try finding the key in precache cache using matchPrecache
      const response = await workbox.precaching.matchPrecache(path);
      if (response) {
        const headers = new Headers(response.headers);
        headers.set('Content-Type', 'text/html; charset=utf-8');
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      }

      // Try fetching from network if available
      try {
        const networkResponse = await fetch(url);
        if (networkResponse && networkResponse.status !== 404) {
          return networkResponse;
        }
      } catch {
        // Network unavailable or offline
      }

      // SPA Fallback: serve index.html for any navigation route not explicitly mapped
      const indexResponse = await workbox.precaching.matchPrecache('/index.html');
      if (indexResponse) {
        const headers = new Headers(indexResponse.headers);
        headers.set('Content-Type', 'text/html; charset=utf-8');
        return new Response(indexResponse.body, {
          status: indexResponse.status,
          statusText: indexResponse.statusText,
          headers,
        });
      }

      // 404 / Error Fallback when offline or not found
      const notFoundResponse = await workbox.precaching.matchPrecache('/404.html');
      if (notFoundResponse) {
        const headers = new Headers(notFoundResponse.headers);
        headers.set('Content-Type', 'text/html; charset=utf-8');
        return new Response(notFoundResponse.body, {
          status: 404,
          statusText: 'Not Found',
          headers,
        });
      }

      const recoveryResponse = await workbox.precaching.matchPrecache('/recovery.html');
      if (recoveryResponse) {
        const headers = new Headers(recoveryResponse.headers);
        headers.set('Content-Type', 'text/html; charset=utf-8');
        return new Response(recoveryResponse.body, {
          status: 200,
          statusText: 'OK',
          headers,
        });
      }

      return fetch(url);
    }
  );

  // ─── LIFECYCLE ───────────────────────────────────────────────────────────────

  // Take control immediately on install — no need to wait for old SW to expire.
  self.addEventListener('install', () => {
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      clients.claim().then(() => {
        return self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((clientList) => {
          clientList.forEach((client) => {
            client.postMessage({ type: 'SW_CACHE_READY', version: SW_VERSION });
          });
        });
      })
    );
  });

  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });

} else {
  console.log('[SW] Workbox failed to load');
}
