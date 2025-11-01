# Aplikasi Tarif Parkir

Aplikasi web untuk menghitung tarif parkir secara cepat dan akurat, dilengkapi tampilan resi yang dapat dicetak dan riwayat transaksi.

## Cerita di Balik Proyek

Saya membuat aplikasi ini untuk membantu teman kerja saya yang mengalami kesulitan dalam menghitung tarif parkir. Dengan banyaknya aturan per jam dan variasi tarif, perhitungan manual sering memakan waktu dan rawan salah. Aplikasi ini hadir untuk menyederhanakan proses, meningkatkan ketelitian, dan menyajikan hasil yang mudah dipahami.

## Penjelasan Singkat Proyek

- Menghitung tarif parkir berbasis durasi (jam pertama dan jam berikutnya)
- Menampilkan resi yang bisa dicetak untuk keperluan dokumentasi
- Menyimpan riwayat transaksi di perangkat (localStorage)
- Tampilan responsif yang mudah digunakan di perangkat desktop maupun mobile
- Tersedia aset untuk penggunaan di Android melalui Cordova

## Cara Menjalankan

Gunakan salah satu opsi berikut untuk menjalankan secara lokal:

```bash
# Opsi 1: Python (simple HTTP server)
python -m http.server 8000
# Buka: http://localhost:8000/

# Opsi 2: Node.js (http-server)
npx http-server -p 8080
# Buka: http://127.0.0.1:8080/
```

## Struktur Proyek

```
├── index.html       # Halaman utama
├── history.html     # Riwayat transaksi
├── receipt.html     # Tampilan resi
├── script.js        # Logika aplikasi (web)
├── styles.css       # Gaya global
└── apk-cordova/     # Aset untuk aplikasi Android (Cordova)
    └── www/
```

## Cara Menggunakan

- Pilih jenis kendaraan dan isi jam masuk/keluar
- Klik `Hitung Tarif` untuk melihat rincian perhitungan
- Klik `Buka Resi` untuk menampilkan resi dan mencetak
- Buka `Riwayat Transaksi` untuk melihat transaksi sebelumnya

## Lisensi

MIT License — bebas digunakan dan dimodifikasi sesuai kebutuhan.