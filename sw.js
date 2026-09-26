// sw.js — Verifikator Hisab Falak Al-Kawakib: offline cache
// Strategi: cache-first lalu update di belakang layar (stale-while-revalidate).
// Letakkan file ini SEJAJAR (folder yang sama) dengan index.html.
// PENTING: setiap kali index.html diperbarui, NAIKKAN nomor pada CACHE_NAME di bawah
// supaya cache lama terhapus dan pengguna langsung memuat versi baru.

const CACHE_NAME = 'al-kawakib-verifikator-v62';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const network = fetch(e.request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => cached); // offline → pakai cache kalau ada

      return cached || network;
    })
  );
});
