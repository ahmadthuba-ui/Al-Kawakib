// sw.js — Verifikator Hisab Falak Al-Kawakib: offline cache
// PENTING: setiap kali index.html diperbarui, NAIKKAN nomor pada CACHE_NAME di bawah.
//
// Strategi (diperbaiki 26 Sep 2026 — versi lama SELALU menyajikan cache lama tanpa
// batas waktu utk dokumen HTML, sehingga pembaruan tidak pernah terlihat walau app
// dibuka-tutup berkali-kali):
//   • Dokumen HTML (index.html) → NETWORK-FIRST: coba ambil versi terbaru dulu;
//     cache hanya dipakai sbg cadangan kalau benar-benar offline. Update langsung
//     terlihat begitu ada koneksi internet, tanpa perlu tunggu siklus buka-tutup.
//   • Aset lain (ikon, dll.) → cache-first + revalidate di belakang layar (aset ini
//     jarang berubah, jadi kecepatan lebih diutamakan).

const CACHE_NAME = 'al-kawakib-verifikator-v63';

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

  const isDocument = e.request.mode === 'navigate' || e.request.destination === 'document';

  if (isDocument) {
    // NETWORK-FIRST: pembaruan index.html langsung terlihat begitu ada koneksi.
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => caches.match(e.request)) // offline → pakai cache kalau ada
    );
    return;
  }

  // Aset non-dokumen: cache-first, revalidate di belakang layar.
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
        .catch(() => cached);

      return cached || network;
    })
  );
});
