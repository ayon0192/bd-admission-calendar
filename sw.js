"use strict";
const CACHE_NAME = "admission-calendar-v24";
const DATA_CACHE = "admission-data-v1";
const APP_SHELL = [
  "./", "./index.html",
  "./assets/css/main-shell.css?v=20261127-final-1",
  "./assets/js/main-shell.js?v=20261127-final-1",
  "./assets/css/release-updates.css?v=20261128-polling-1",
  "./assets/js/release-updates.js?v=20261128-polling-1",
  "./assets/js/theme-init.js",
  "./assets/fonts/hind-siliguri-400.woff2",
  "./assets/fonts/hind-siliguri-600.woff2",
  "./assets/favicon.svg"
];
self.addEventListener("install", event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(APP_SHELL);
  await self.skipWaiting();
})()));
self.addEventListener("activate", event => event.waitUntil((async () => {
  const names = await caches.keys();
  await Promise.all(names.filter(name => name.startsWith("admission-calendar-") && name !== CACHE_NAME).map(name => caches.delete(name)));
  await self.clients.claim();
})()));
self.addEventListener("fetch", event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.endsWith("/data/admission-records.json") || url.pathname === "/data/admission-records.json") {
    event.respondWith((async () => {
      const cache = await caches.open(DATA_CACHE);
      try {
        const network = await fetch(request);
        if (network.ok) await cache.put(request, network.clone());
        return network;
      } catch (error) {
        const cached = await cache.match(request);
        if (cached) {
          const headers = new Headers(cached.headers);
          headers.set("X-Calendar-Cache", "offline");
          return new Response(await cached.blob(), { status: cached.status, statusText: cached.statusText, headers });
        }
        throw error;
      }
    })());
    return;
  }
  const isShell = APP_SHELL.some(p => new URL(p, self.registration.scope).pathname === url.pathname);
  if (!isShell && request.mode !== "navigate") return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request, { ignoreSearch: isShell });
    const networkPromise = fetch(request).then(async network => {
      if (network && network.ok) await cache.put(request, network.clone());
      return network;
    }).catch(() => null);
    if (cached) {
      event.waitUntil(networkPromise);
      return cached;
    }
    const network = await networkPromise;
    if (network) return network;
    if (request.mode === "navigate") {
      const fallback = await cache.match("./index.html");
      if (fallback) return fallback;
    }
    return Response.error();
  })());
});

self.addEventListener("push", event => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch (_) {}
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const isReminder = payload.type === "admission-reminder";
    const message = { type: "calendar-release-update", release: typeof payload.release === "string" ? payload.release : "" };
    if (!isReminder) for (const client of windows) client.postMessage(message);
    const visible = windows.some(client => client.visibilityState === "visible");
    if (isReminder || !visible) {
      await self.registration.showNotification(payload.title || (isReminder ? "ভর্তি ক্যালেন্ডার রিমাইন্ডার" : "ভর্তি ক্যালেন্ডার আপডেট"), {
        body: payload.body || (isReminder ? "তোমার সংরক্ষিত ভর্তি রিমাইন্ডার।" : "ক্যালেন্ডারে নতুন তথ্য প্রকাশিত হয়েছে।"),
        tag: typeof payload.tag === "string" ? payload.tag : "admission-calendar-release",
        renotify: false,
        data: { url: "/", release: message.release, type: isReminder ? "admission-reminder" : "release" }
      });
    }
  })());
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const data = event.notification.data || {};
    const target = new URL(data.url || "./", self.registration.scope).href;
    const existing = windows.find(client => new URL(client.url).origin === self.location.origin);
    if (existing) {
      await existing.focus();
      existing.postMessage(data.type === "admission-reminder"
        ? { type: "calendar-reminder-open" }
        : { type: "calendar-release-update", release: data.release || "" });
      return;
    }
    await self.clients.openWindow(target);
  })());
});
