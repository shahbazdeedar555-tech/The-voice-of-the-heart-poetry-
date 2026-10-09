
// ======================================================
// 🌹 اَحساسَن جو ويسُ — ڪَويتا
// OFFLINE SERVICE WORKER
// VERSION 2 — NETWORK FIRST
// ======================================================

const CACHE_NAME = "kavita-offline-v2";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./categories.html",
  "./poets.html",
  "./poet.html",
  "./ghazal.html",
  "./geet.html",
  "./nazam.html",
  "./bet.html",
  "./waai.html",
  "./satrango.html",
  "./other.html",
  "./category.html"
];

// ======================================================
// INSTALL
// ======================================================

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return Promise.all(
          APP_FILES.map(file =>
            cache.add(file).catch(error => {
              console.log("Cache skipped:", file, error);
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// ======================================================
// ACTIVATE — DELETE OLD CACHE
// ======================================================

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key =>
              key.startsWith("kavita-offline-") &&
              key !== CACHE_NAME
            )
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ======================================================
// FETCH — NETWORK FIRST, CACHE FALLBACK
// ======================================================

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // Only handle this website's own files.
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.ok && response.type === "basic") {
          const copy = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => cache.put(request, copy))
            .catch(error => {
              console.log("Cache update failed:", error);
            });
        }

        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);

        if (cached) {
          return cached;
        }

        // Offline homepage fallback.
        if (request.mode === "navigate") {
          const homepage = await caches.match("./index.html");

          if (homepage) {
            return homepage;
          }
        }

        return new Response(
          "هي صفحو آف لائين موجود ناهي. مهرباني ڪري انٽرنيٽ سان ٻيهر کوليو.",
          {
            status: 503,
            headers: {
              "Content-Type": "text/plain; charset=utf-8"
            }
          }
        );
      })
  );
});
