# Floating Music Widget

Pemutar musik mengambang (pojok layar) dengan gaya dark glassmorphism. HTML/CSS/JS murni, tanpa framework, dan bisa dipasang di website mana pun hanya dengan **satu tag `<script>`**.

- Slide-in halus, equalizer animasi, progress & volume
- **Play/Pause**, **Minimize** (musik lanjut), **Close** (musik berhenti + ikon kecil untuk membuka lagi)
- Autoplay dicoba sekali; kalau diblokir browser, widget siap dengan tombol Play (tanpa trik bypass)
- Semua class/ID berawalan `fmw-` → aman dari bentrok CSS/JS website lain
- Tidak mengubah layout website; satu instance saja walau script ter-load dua kali
- Mendukung desktop & mobile, `prefers-reduced-motion`, navigasi keyboard, dan Media Session (kontrol lock-screen)

## File

| File | Fungsi |
|---|---|
| `music-player.js` | Logika widget. Memuat `music-player.css` otomatis |
| `music-player.css` | Tampilan & animasi |
| `index.html` | Halaman demo untuk uji lokal |
| `demo-track.mp3` | Lagu contoh buatan sendiri (bebas dipakai) |

## Pasang di website (paling mudah)

Tempel sebelum `</body>` (atau di `<head>` dengan `defer`):

```html
<script
  src="https://cdn.jsdelivr.net/gh/USERNAME/REPO@v1.0.0/music-player.js"
  data-src="https://situsmu.com/musik/lagu.mp3"
  data-title="Judul Lagu"
  data-artist="Nama Artis"
  defer></script>
```

Ganti `USERNAME`, `REPO`, dan URL lagu. CSS dimuat otomatis dari folder yang sama dengan JS.

### Versi "Link Rel" (CSS dipasang manual)

Kalau ingin CSS lewat `<link>` sendiri (misalnya untuk preload), matikan auto-load dengan `data-css="none"`:

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
- File lagu bisa ikut di repo yang sama (jsDelivr maks. 50 MB per file), atau di hosting lain selama URL-nya langsung ke file `.mp3`/`.ogg`/`.m4a`.

## Konfigurasi

Ada dua cara, dan data-attribute menang atas `window.FMWConfig`.

**1. Data-attribute pada tag `<script>`**

```html
<script src=".../music-player.js"
  data-src="lagu.mp3"
  data-title="Judul" data-artist="Artis"
  data-position="bottom-left"
  data-accent="#7dd3fc"
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
    accent: '#7dd3fc',
    labels: { play: 'Play', pause: 'Pause' }   // ganti teks/bahasa
  };
</script>
<script src=".../music-player.js" defer></script>
```

| Opsi (`data-…`) | Default | Keterangan |
|---|---|---|
| `src` | **wajib** | URL file audio |
| `title` / `artist` | `Untitled` / kosong | Judul & nama artis |
| `cover` | kosong | URL gambar sampul (opsional) |
| `position` | `bottom-right` | `bottom-right`, `bottom-left`, `top-right`, `top-left` |
| `offset-x` / `offset-y` | `20` | Jarak dari tepi (angka = px, atau `"1.5rem"`) |
| `accent` | `#0bd4f4` | Warna aksen untuk tombol, slider, glow, dan indikator; format CSS apa pun. Jika tidak diisi, warna di bagian Pengaturan warna pada `music-player.css` yang digunakan |
| `volume` | `0.35` | Volume awal 0–1 |
| `autoplay` | `true` | Coba putar otomatis saat dimuat |
| `loop` | `true` | Ulangi lagu |
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

Untuk mengubah warna default, edit bagian **Pengaturan warna** di awal `music-player.css`. Cukup ubah `--fmw-accent` untuk mengganti warna aksen; warna glow dan kontras tombol akan disesuaikan otomatis. Kamu juga bisa mengubah warna permukaan widget melalui `--fmw-glass-start`, `--fmw-glass-end`, `--fmw-cover-start`, dan `--fmw-cover-end`. Atribut `data-accent` atau opsi `accent` di `window.FMWConfig` akan menimpa warna aksen CSS tersebut.

Variabel posisi juga bisa di-override dari stylesheet website:

```css
#fmw-root { --fmw-w: 320px; --fmw-oy: 90px; /* naikkan agar tidak menutupi tombol chat */ }
```

## Perilaku tombol

| Tombol | Efek |
|---|---|
| ▶ / ❚❚ | Putar / jeda lagu |
| − (Minimize) | Card mengecil jadi pill; **musik tetap jalan** |
| ⤢ (di pill) | Perbesar kembali |
| × (Close) | Widget hilang dengan animasi, **musik berhenti** dan posisi di-reset. Ikon musik kecil muncul untuk membuka lagi (atau widget dihapus bila `close-behavior="remove"`) |

## Autoplay

Browser modern umumnya memblokir audio bersuara sebelum pengunjung berinteraksi dengan halaman. Widget mencoba `play()` sekali saat dimuat. Jika ditolak, statusnya berubah menjadi *"Ketuk Play untuk mulai"* dan tombol Play berdenyut halus. Begitu pengunjung menekan Play, musik langsung jalan. Widget tidak memakai trik (muted-autoplay, simulasi klik, dsb.).

## API JavaScript (opsional)

```js
FloatingMusicWidget.play();
FloatingMusicWidget.pause();
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
| Widget tidak muncul | Cek Console. Biasanya `data-src` kosong, atau `music-player.css` gagal dimuat (path/CORS) |
| Tampilan berantakan | CSS tidak termuat. Pastikan `.css` ada di folder yang sama dengan `.js`, atau pakai `data-css="URL"` |
| Teks "Musik gagal dimuat" | URL audio salah, bukan link langsung ke file, atau format tak didukung browser (pakai `.mp3`) |
| Musik tidak otomatis jalan | Normal — diblokir browser. Pengunjung cukup menekan Play |
| Slider volume tidak ada di iPhone | Disengaja: iOS tidak mengizinkan JavaScript mengatur volume |
| Menutupi tombol chat/WhatsApp | Ubah `data-position`, atau naikkan `--fmw-oy` |

## Lisensi

MIT — bebas dipakai dan dimodifikasi.
