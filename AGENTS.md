# AGENTS.md — Sistem Antrean Rumah Sakit (TypeScript + HTML + CSS)

## Ringkasan
Aplikasi frontend tanpa framework: TypeScript di `src/` dikompilasi ke `dist/` (ES module browser),
halaman HTML di root, style di `css/style.css`, data di `localStorage`. Auth memakai API DummyJSON.

## Struktur
- `login.html` → `src/login.ts` → `dist/login.js` (login + redirect berdasar role)
- `ambil-antrian.html` (kiosk) → `src/ambil-antrian.ts` (seed poli A/B/C, tiket `A-001`, modal, polling 3 dtk)
- `index.html` (dashboard admin, placeholder) → `src/index.ts` (cek session + logout)
- `operator.html` (panel operator) → `src/operator.ts` → `dist/operator.js` (auth guard, sortir prioritas VIP > Disabilitas > Lansia > Normal, panggil/lewati/selesai/ulang, Web Speech API)
- `layar.html` (monitor antrean) → `src/layar.ts` → `dist/layar.js` (monitor publik, jam digital, polling 2 dtk, Fullscreen API, banner highlight panggilan, audio monitor)
- `src/types.ts`, `src/utils/storage.ts` (wrapper `localStorage`: `hospital_session`, `hospital_queue_types`, `hospital_tickets`), `src/utils/priority.ts`, `src/utils/speech.ts`
- `css/style.css` — style login, kiosk, operator, dan layar monitor

## Perintah
- `npm run build` — compile TS ke `dist/` (wajib sebelum uji browser)
- `npx tsc --noEmit` — cek error tanpa emit
- Uji browser: serve root folder (VS Code Live Server / `npx serve .`), buka `login.html` dan `ambil-antrian.html`

## Konvensi (jangan dilanggar)
- `tsconfig.json`: `module: ESNext`, `moduleResolution: bundler` (nilai `node` sudah dihapus di TS 7, jangan dikembalikan)
- Semua `<script src="dist/...">` di HTML WAJIB `type="module"`
- Semua import antar file TS WAJIB pakai ekstensi `.js` (contoh: `'./types.js'`, `'./utils/storage.js'`)
- `package.json` tetap `"type": "commonjs"` — output `dist/` adalah ESM untuk browser, jadi `node --check dist/*.js` akan gagal dan itu BUKAN bug
- Pesan error guard DOM: `Elemen #<id> tidak ditemukan di ambil-antrian.html.`

## Auth DummyJSON (fakta terverifikasi via curl)
- `POST https://dummyjson.com/auth/login` → mengembalikan `accessToken` + `firstName`, TANPA `role`
- `GET https://dummyjson.com/auth/me` dengan header `Authorization: Bearer <accessToken>` → mengembalikan `role` (`admin|moderator|user`)
- `src/login.ts` melakukan kedua panggilan itu; fallback ke `'user'` bila `/auth/me` gagal
- Redirect: `admin/moderator → index.html`, `user → operator.html`
- Akun uji: `emilys / emilyspass` (admin). Kredensial salah → API `{"message":"Invalid credentials"}` → UI menampilkan `Username atau password salah.`

## Riwayat perbaikan (jangan di-revert tanpa alasan)
1. `moduleResolution: node → bundler` (perbaiki TS5108 di TS 7.0.2)
2. `login.html` tambah `type="module"`
3. `storage.ts` import `../types.js`
4. `package.json` tambah script `build`
5. `login.ts` ambil role via `/auth/me`
6. `ambil-antrian.ts` helper `getRequiredElement` (guard null)
7. Hapus `src/audit.ts` + `dist/audit.*` (file dummy tak terpakai)
8. Implementasi Halaman Operator (`operator.html`, `src/operator.ts`), sorting prioritas (`src/utils/priority.ts`), dan aksi panggil/lewati/selesai
9. Implementasi Layar Antrean publik (`layar.html`, `src/layar.ts`), jam digital, polling 2 dtk, Fullscreen API, banner highlight, dan audio speech (`src/utils/speech.ts`)

## Batasan
- Jangan membuat ulang project, menghapus fitur, atau merombak struktur tanpa konfirmasi
- Jangan mengubah `operator.html` / `layar.html` / isi dashboard admin (milik anggota lain)
- Jangan mengarang hasil uji — jalankan perintahnya dan laporkan output sebenarnya
- Jelaskan singkat sebelum mengubah file
