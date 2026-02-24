# Aplikasi Tarif Parkir (AI + React SPA)

Aplikasi web untuk menghitung tarif parkir Gandaria City secara cepat dan cerdas. Proyek ini telah berevolusi menjadi sebuah **Single Page Application (SPA)** menggunakan **React, Vite, dan Tailwind CSS**, serta dilengkapi dengan fitur-fitur Kecerdasan Buatan (AI).

## 🚀 Fitur Inovasi Unggulan

- **Deteksi Kendaraan AI**: Gunakan kamera (didukung oleh TensorFlow `COCO-SSD`) untuk mendeteksi mobil/motor secara otomatis.
- **Perintah Suara (Voice Command)**: Gunakan Web Speech API untuk mengontrol fitur menggunakan suara berbahasa Indonesia.
- **Scanner Karcis QR**: Dilengkapi karcis QR pintar saat masuk dan pemindai interaktif saat keluar.
- **Prediksi Kepadatan AI**: Mempelajari histori riwayat parkir lokal untuk memprediksi jam-jam sibuk.
- **Dashboard Analitik (Live Chart)**: Manajemen riwayat transaksi dengan Visualisasi Data (*Chart.js*).
- **Share & Ekspor Resi**: Kirim detail tagihan ke WhatsApp dengan sekali klik, atau unduh resi sebagai gambar berkat `html2canvas`.

## 🛠️ Tech Stack & Arsitektur

- **Framework**: `React 18` + `Vite`
- **Styling**: `Tailwind CSS v3` (Tema Glassmorphism)
- **Routing**: `React Router v6`
- **AI & ML**: `@tensorflow/tfjs`, `@tensorflow-models/coco-ssd`
- **Utility**: `jsQR`, `qrcode`, `html2canvas`, `chart.js`, `lucide-react`

## 📦 Menjalankan Secara Lokal

Pastikan Anda memiliki [Node.js](https://nodejs.org/) terinstal (rekomendasi: versi 18 ke atas).

```bash
# Clone repository
git clone https://github.com/daffarizki190/parking-receipt-gandaria-city.git
cd parking-receipt-gandaria-city

# Install dependensi
npm install

# Jalankan server pengembangan Vite
npm run dev
```

Buka `http://localhost:5173` di browser Anda.

## 🌍 Cara Mengonline-kan (Platform Deployment)

Aplikasi ini sudah dikonfigurasi sepenuhnya untuk kemudahan *Deployment* berkelanjutan.

### Opsi 1: Vercel (Sangat Disarankan)

Aplikasi ini sudah berisi file konfigurasi `vercel.json` dan otomatis akan beradaptasi.
1. Masuk ke [Vercel Dashboard](https://vercel.com/dashboard).
2. Klik **Add New Project** dan import repositori GitHub ini.
3. Vercel akan otomatis mendeteksi bahwa ini adalah proyek `Vite`.
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Klik **Deploy**. Selesai!

### Opsi 2: GitHub Pages (Otomatis Action)

Proyek ini juga sudah memuat konfigurasi **GitHub Actions** (`.github/workflows/deploy-react.yml`).
1. Cukup lakukan `git push` ke branch `feature/react-migration` atau `main`.
2. Action akan otomatis berjalan dan me-*compile* *build* ke GitHub Pages.
3. Pastikan Anda mengaktifkan **Settings > Pages > Source:** `GitHub Actions`.

## Lisensi

MIT License — bebas digunakan dan dimodifikasi sesuai kebutuhan pendidikan.