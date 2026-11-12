
const CACHE_NAME = "worshipverse-v3";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // Save the offline page so it can be opened without internet.
      await cache.add(OFFLINE_URL);

      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();

      await Promise.all(
        cacheNames
          .filter(
            (name) =>
              name.startsWith("worshipverse-") &&
              name !== CACHE_NAME
          )
          .map((name) => caches.delete(name))
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle GET requests from this website.
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  // Never cache authentication, API, or private account pages.
  const privatePaths = [
    "/api/",
    "/auth/",
    "/login",
    "/admin",
    "/profile",
    "/favourites",
    "/favorites",
    "/playlists",
    "/settings",
  ];

  if (privatePaths.some((path) => url.pathname.startsWith(path))) {
    return;
  }

  // Let Next.js internal and server-component requests use the network.
  if (
    url.pathname.startsWith("/_next/") &&
    !url.pathname.startsWith("/_next/static/")
  ) {
    return;
  }

  if (
    request.headers.has("RSC") ||
    url.searchParams.has("_rsc")
  ) {
    return;
  }

  // Cache-first for versioned Next.js static assets.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);

        if (cached) return cached;

        const response = await fetch(request);

        if (response.ok) {
          await cache.put(request, response.clone());
        }

        return response;
      })()
    );

    return;
  }

  // Network-first for page navigation.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);

          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
          }

          return response;
        } catch {
          // Use the previously visited page if it is cached.
          const cachedPage = await caches.match(request);

          if (cachedPage) return cachedPage;

          // Otherwise send the visitor to the offline song library.
          return Response.redirect(
            new URL(OFFLINE_URL, self.location.origin),
            302
          );
        }
      })()
    );

    return;
  }

  // Cache-first for images, icons, and the web app manifest.
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);

        if (cached) return cached;

        const response = await fetch(request);

        if (response.ok) {
          await cache.put(request, response.clone());
        }

        return response;
      })()
    );
  }
});
