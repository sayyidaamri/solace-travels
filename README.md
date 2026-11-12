# Solace Travels — static HTML rebuild

Situs HTML/CSS/JS statis yang meniru tata letak & perilaku referensi `vita-travel.webflow.io`, dengan brand, teks, foto, logo, dan kode buatan sendiri.

## Cara membuka
Buka `index.html` langsung di browser (klik dua kali). Tidak butuh server atau internet: font, GSAP, ikon, dan gambar semuanya ada di folder `assets/`.

Untuk deploy, upload seluruh isi folder ini ke hosting statis apa pun (Vercel, Netlify, GitHub Pages, dll.).

## Struktur
```
index.html                   Beranda
retreats/*.html              6 halaman detail retreat
coaches.html                 Daftar coach (hover/tap → detail bio)
contacts.html                Form kontak (validasi + state "Thank you!")
privacy-policy.html          Legal + daftar isi yang mengikuti scroll
terms-and-conditions.html
404.html
assets/
  css/style.css              Semua gaya (token warna di :root)
  js/main.js                 Interaksi & animasi
  vendor/                    GSAP (ScrollTrigger, ScrollSmoother, SplitText, ScrollTo)
  fonts/                     Inter (variable, woff2)
  svg/                       Logo, ikon, peta dunia (dots.json = titik peta)
  img/                       Foto Unsplash — sumber di assets/img/CREDITS.md
```

### Halaman retreat
- `7-day-carpathian-highlands-retreat-romania.html`
- `7-day-solo-travelers-retreat-bali.html`
- `8-day-juice-cleanse-retreat-portugal.html`
- `photography-journey-magical-morocco.html`
- `sahara-nights-morocco-holiday.html`
- `yoga-outdoor-retreat-tuscany-italy.html`

## Mengubah konten
Semua file HTML diedit langsung (tidak ada generator/build step di folder ini). Teks yang sama muncul di beberapa halaman (nama brand, telepon, email, footer), jadi gunakan find & replace di seluruh folder agar konsisten.

## State & interaksi yang dibuat
- Header: garis frame beranimasi saat load, blur saat discroll, hover/pressed oranye, link "Retreats" aktif saat section retreat terlihat.
- Menu mobile (burger → X), banner cookie (Accept/Decline/Close, diingat di localStorage).
- Animasi scroll per section (typewriter heading, line-reveal, warna teks mengisi, garis grid tumbuh, titik peta berdenyut).
- Smooth scroll (desktop), sidebar retreat & daftar isi legal ter-pin, nav section mobile yang sticky.
- Slider swipe di mobile (statistik, praktisi, foto retreat dengan dots).
- Kartu coach: hover (desktop) / tap (mobile) menampilkan bio.
- Form kontak: error per field, email tidak valid, sukses. **Tidak ada data yang dikirim** — sambungkan ke backend/form service sendiri di `assets/js/main.js` (fungsi `send`).

## Placeholder yang perlu diganti
- Nama brand, telepon `+1 415 555 0192`, email `hello@solace-travels.com`.
- Nama coach, host, alamat villa, harga, tanggal → fiktif.
- Studio "Northfold Studio" di footer → fiktif.
- Teks Privacy/Terms → contoh, perlu ditinjau secara hukum.
