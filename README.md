# Floating Music Widget

Pemutar musik mengambang (pojok layar) dengan gaya dark glassmorphism. HTML/CSS/JS murni, tanpa framework, dan bisa dipasang di website mana pun hanya dengan **satu tag `<script>`**.

- Slide-in halus, equalizer animasi, progress & volume
- **Playlist**: tombol **Next / Prev** dan tombol **Ulangi** (putar berurutan ↔ ulangi lagu ini). Ingat lagu & mode terakhir selama sesi
- **Play/Pause**, **Minimize** (musik lanjut), **Close** (musik berhenti + ikon kecil untuk membuka lagi)
- Autoplay dicoba sekali; kalau diblokir browser, widget siap dengan tombol Play (tanpa trik bypass)
- Tampilan diisolasi dengan **closed Shadow DOM**; CSS website pemasang tidak bisa meng-override warna maupun gaya widget
- Tidak mengubah layout website; satu instance saja walau script ter-load dua kali
- Mendukung desktop & mobile, `prefers-reduced-motion`, navigasi keyboard, dan Media Session (kontrol lock-screen)

## File

| File | Fungsi |
|---|---|
| `music-player.js` | Logika widget. Memuat `music-player.css` otomatis |
| `music-player.css` | Tampilan & animasi |
| `index.html` | Halaman demo untuk uji lokal |
| `Assets/Musik/*.mp3` | Playlist bawaan (3 lagu) |
| `demo-track.mp3` | Lagu contoh buatan sendiri (bebas dipakai) |

## Pasang di website (paling mudah)

Tempel sebelum `</body>` di website mana pun. **Satu baris saja**; ketiga lagu di `Assets/Musik` ikut otomatis:

```html
<script src="https://cdn.jsdelivr.net/gh/fixsarts/MusicWidgets@main/music-player.js" defer></script>
```

> **Kenapa portable?** Path relatif (mis. `Assets/Musik/lagu.mp3`) dibaca **relatif terhadap lokasi `music-player.js`**, bukan terhadap website yang memasang. Dulu `data-src="./Assets/Musik/…"` dicari di server website pemasang, sehingga tampilan muncul tapi musik tidak terbaca. Ubah acuannya dengan `data-base="page"` bila memang ingin relatif ke halaman.

### Satu lagu saja (tanpa tombol Next/Prev/Ulangi)

```html
<script
  src="https://cdn.jsdelivr.net/gh/fixsarts/MusicWidgets@main/music-player.js"
  data-src="Assets/Musik/Game%20of%20Thrones.mp3"
  data-title="Game of Thrones"
  data-artist="Game Of Thrones"
  defer></script>
```

### Playlist sendiri

```html
<script
  src="https://cdn.jsdelivr.net/gh/fixsarts/MusicWidgets@main/music-player.js"
  data-tracks='[
    {"src":"Assets/Musik/Game of Thrones.mp3","title":"GoT","artist":"Game Of Thrones"},
    {"src":"https://situsku.com/lagu.mp3","title":"Lagu lain"}
  ]'
  defer></script>
```

Atau lewat `window.FMWConfig = { tracks: [...] }` sebelum script. Playlist bawaan (kalau tidak mengisi `data-src`/`data-tracks`) diatur di konstanta `DEFAULT_TRACKS` pada `music-player.js`.

### Versi "Link Rel" (CSS dipasang manual)

Kalau ingin memuat CSS lewat `<link>` sendiri (misalnya untuk preload), widget akan memakai URL link `music-player.css` tersebut di dalam Shadow DOM. Tambahkan `data-css="none"` agar widget mendeteksi link manual:

```html
<link rel="preconnect" href="https://cdn.jsdelivr.net">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/USERNAME/REPO@v1.0.0/music-player.css">
<script
  src="https://cdn.jsdelivr.net/gh/USERNAME/REPO@v1.0.0/music-player.js"
  data-css="none"
  data-src="https://situsmu.com/musik/lagu.mp3"
  data-title="Judul Lagu"
  data-artist="Nama Artis"
  defer></script>
```

## Hosting lewat GitHub

1. Buat repo (mis. `floating-music-widget`) dan upload `music-player.js`, `music-player.css`, `README.md`.
2. Buat release/tag, mis. `v1.0.0`.
3. Pakai salah satu URL ini:

| Cara | URL |
|---|---|
| **jsDelivr** (disarankan) | `https://cdn.jsdelivr.net/gh/USERNAME/REPO@v1.0.0/music-player.js` |
| **GitHub Pages** | `https://USERNAME.github.io/REPO/music-player.js` |

> ⚠️ **Jangan pakai `raw.githubusercontent.com`.** GitHub mengirim file di sana sebagai `text/plain` + `nosniff`, jadi browser menolak menjalankannya sebagai script/CSS.

Tips:
- Pin ke tag (`@v1.0.0`) supaya website lain tidak ikut berubah saat kamu update. `@main` di-cache lama oleh CDN.
- Setelah mengubah tampilan di file master, upload **`music-player.js` dan `music-player.css`** bersama-sama ke repository hosting. Jika memakai URL bertag seperti `@v1.0.0`, buat tag versi baru (mis. `@v1.0.1`) lalu ubah URL JavaScript dan CSS di website pemasang ke tag yang sama. Website yang memakai salinan lama tidak otomatis mengambil perubahan master.
- Warna aksen hanya diatur dari `--fmw-accent` di `music-player.css`. Setelah mengubahnya, unggah `music-player.css` terbaru ke URL yang digunakan semua website.
- File lagu bisa ikut di repo yang sama (jsDelivr maks. 50 MB per file), atau di hosting lain selama URL-nya langsung ke file `.mp3`/`.ogg`/`.m4a`.

## Konfigurasi

Ada dua cara, dan data-attribute menang atas `window.FMWConfig`.

**1. Data-attribute pada tag `<script>`**

```html
<script src=".../music-player.js"
  data-src="lagu.mp3"
  data-title="Judul" data-artist="Artis"
  data-position="bottom-left"
  data-volume="0.4"
  data-close-behavior="remove"
  defer></script>
```

**2. Objek JavaScript (jalankan sebelum script widget)**

```html
<script>
  window.FMWConfig = {
    src: 'lagu.mp3',
    title: 'Judul',
    artist: 'Artis',
    labels: { play: 'Play', pause: 'Pause' }   // ganti teks/bahasa
  };
</script>
<script src=".../music-player.js" defer></script>
```

| Opsi (`data-…`) | Default | Keterangan |
|---|---|---|
| `src` | kosong | Satu lagu. Jika kosong dan `tracks` kosong, dipakai playlist bawaan |
| `tracks` | playlist bawaan | JSON array `[{src,title,artist,cover}]` (lewat `data-tracks`) |
| `repeat` | `all` | `all` = putar berurutan, `one` = ulangi lagu ini |
| `base` | `script` | Acuan path relatif: `script`, `page`, atau URL |
| `title` / `artist` | `Untitled` / kosong | Judul & nama artis |
| `cover` | kosong | URL gambar sampul (opsional) |
| `position` | `bottom-right` | `bottom-right`, `bottom-left`, `top-right`, `top-left` |
| `offset-x` / `offset-y` | `20` | Jarak dari tepi (angka = px, atau `"1.5rem"`) |
| `volume` | `0.35` | Volume awal 0–1 |
| `autoplay` | `true` | Coba putar otomatis saat dimuat |
| `loop` | `true` | Ulangi lagu (hanya mode 1 lagu; pada playlist pakai tombol Ulangi) |
| `initial-state` | `open` | `open`, `minimized`, atau `closed` |
| `mobile-state` | sama dgn `initial-state` | State awal khusus layar ≤ 480px |
| `close-behavior` | `launcher` | `launcher` = tampil ikon musik kecil; `remove` = widget dihapus total |
| `play-on-reopen` | `true` | Putar lagi saat ikon musik ditekan setelah Close |
| `remember` | `session` | `session`, `local`, atau `none` — mengingat minimize/close/pause antar halaman |
| `delay` | `350` | Jeda (ms) sebelum slide-in |
| `z-index` | `2147483000` | Naikkan/turunkan bila bentrok dengan elemen lain |
| `width` | `300` | Lebar card (px) |
| `css` | `auto` | `auto`, `none`, atau URL stylesheet sendiri |

### Warna & gaya

Untuk mengubah warna, edit **hanya** `--fmw-accent` di bagian **Pengaturan warna** pada awal `music-player.css`. Tombol, slider, equalizer, glow, dan warna kontras tombol mengambil warna dari token ini; warna efek transparan dihitung otomatis. JavaScript tidak memiliki warna aksen terpisah dan konfigurasi `data-accent`/`FMWConfig.accent` tidak digunakan. Untuk semua website mengikuti warna master, unggah CSS ini ke URL publik yang sama. Kamu juga bisa mengubah warna permukaan widget melalui `--fmw-glass-start`, `--fmw-glass-end`, `--fmw-cover-start`, dan `--fmw-cover-end`.

CSS widget dimuat **di dalam Shadow DOM tertutup**, jadi selector atau deklarasi `!important` dari stylesheet website tidak dapat menimpa warna/gaya widget. Untuk mengubah warna atau desain, edit `music-player.css` milik widget; jangan menambahkan override CSS dari halaman pemasang. Posisi dan ukuran tetap dapat diatur melalui opsi `data-position`, `data-offset-x`, `data-offset-y`, `data-width`, dan `data-z-index`.

## Perilaku tombol

| Tombol | Efek |
|---|---|
| ▶ / ❚❚ | Putar / jeda lagu |
| − (Minimize) | Card mengecil jadi pill; **musik tetap jalan** |
| ⤢ (di pill) | Perbesar kembali |
| ⏮ / ⏭ | Lagu sebelumnya (jika sudah >3 detik: ulang dari awal) / lagu berikutnya |
| 🔁 Ulangi | Ketuk untuk **ulangi lagu ini** (ikon bertanda 1, warna aksen). Ketuk lagi untuk putar berurutan (setelah lagu terakhir kembali ke lagu pertama) |
| × (Close) | Widget hilang dengan animasi, **musik berhenti** dan posisi di-reset. Ikon musik kecil muncul untuk membuka lagi (atau widget dihapus bila `close-behavior="remove"`) |

## Autoplay

Browser modern umumnya memblokir audio bersuara sebelum pengunjung berinteraksi dengan halaman. Widget mencoba `play()` sekali saat dimuat. Jika ditolak, statusnya berubah menjadi *"Ketuk Play untuk mulai"* dan tombol Play berdenyut halus. Begitu pengunjung menekan Play, musik langsung jalan. Widget tidak memakai trik (muted-autoplay, simulasi klik, dsb.).

## API JavaScript (opsional)

```js
FloatingMusicWidget.play();
FloatingMusicWidget.pause();
FloatingMusicWidget.next();
FloatingMusicWidget.prev();
FloatingMusicWidget.goTo(2);          // pindah ke lagu ke-3
FloatingMusicWidget.setRepeat('one'); // 'one' | 'all'
FloatingMusicWidget.minimize();
FloatingMusicWidget.expand();
FloatingMusicWidget.close();   // berhenti + tutup
FloatingMusicWidget.open();    // buka lagi
FloatingMusicWidget.setTrack({ src: 'baru.mp3', title: 'Judul Baru', artist: 'Artis' });
FloatingMusicWidget.destroy(); // hapus widget sepenuhnya
```

## Uji lokal

```bash
cd floating-music-widget
python3 -m http.server 8000
# buka http://localhost:8000
```

(Gunakan server lokal, bukan klik dua kali `index.html`, agar CSS & audio termuat dengan benar.)

## Pemecahan masalah

| Gejala | Penyebab / solusi |
|---|---|
| Tampilan ada tapi musik "gagal dimuat" | Path lagu salah. Path relatif dibaca dari lokasi `music-player.js`; pastikan file ada di `Assets/Musik/` di samping script, atau pakai URL penuh |
| Widget tidak muncul | Cek Console. Biasanya `data-src` kosong, atau `music-player.css` gagal dimuat (path/CORS) |
| Tampilan berantakan | CSS tidak termuat. Pastikan `.css` ada di folder yang sama dengan `.js`, atau pakai `data-css="URL"` |
| Teks "Musik gagal dimuat" | URL audio salah, bukan link langsung ke file, atau format tak didukung browser (pakai `.mp3`) |
| Musik tidak otomatis jalan | Normal — diblokir browser. Pengunjung cukup menekan Play |
| Slider volume tidak ada di iPhone | Disengaja: iOS tidak mengizinkan JavaScript mengatur volume (tombol mute tetap ada) |
| Menutupi tombol chat/WhatsApp | Ubah `data-position`, atau naikkan `--fmw-oy` |

## Lisensi

MIT — bebas dipakai dan dimodifikasi.
