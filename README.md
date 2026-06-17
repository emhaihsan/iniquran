# Ini Quran (iniquran)

Extension VS Code untuk membaca Al-Quran dengan navigasi mudah dan terjemahan Bahasa Indonesia.

## Fitur

- 📖 **Navigasi Surah & Juz**: Telusuri Quran berdasarkan Surah (1-114) atau Juz (1-30) langsung dari sidebar.
- 🇮🇩 **Terjemahan Indonesia**: Teks Arab (Uthmani) bersandingan dengan terjemahan Bahasa Indonesia yang akurat.
- 🔍 **Pencarian Ayat**: Cari ayat berdasarkan kata kunci (misal: "sabar", "shalat", "ramadhan").
- 🎨 **Integrasi Tema**: Mendukung tema gelap (Dark Mode) dan terang (Light Mode) VS Code.

## Cara Install (Development)

Jika Anda ingin menjalankan extension ini dari source code:

1.  **Clone atau buka folder ini** di VS Code.
2.  **Instal dependensi**:
    ```bash
    npm install
    ```
3.  **Kompilasi kode**:
    ```bash
    npm run compile
    ```
4.  **Jalankan Extension**:
    - Tekan `F5` di VS Code untuk membuka jendela *Extension Development Host*.
    - Extension akan aktif di jendela baru tersebut.

## Cara Pakai

1.  Klik ikon **Buku (Quran)** di Activity Bar (sebelah kiri).
2.  Pilih kategori **Surah** atau **Juz**.
3.  Klik pada item yang diinginkan untuk membuka tampilan baca di editor.
4.  Untuk mencari ayat, tekan `Ctrl+Shift+P` (atau `Cmd+Shift+P` di Mac) dan ketik **"Cari Ayat Quran"**.

## Sumber Data

Data Quran dan terjemahan diambil dari [Al Quran Cloud API](https://alquran.cloud/api).

---
Dibuat dengan ❤️ untuk memudahkan membaca Quran sambil ngoding.
