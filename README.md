# Ruang Rasa Mood Tracker

Proyek praktikum Komputasi Awan Aura Iftitah, 102062400107, IS0702.

HTML/CSS/JavaScript menyajikan jurnal mood. Flask dan Gunicorn melayani halaman dan API. PostgreSQL menyimpan catatan melalui volume Docker. Ini adalah demo bersama tanpa autentikasi; gunakan data uji, bukan jurnal pribadi.

## Menjalankan

1. Salin `.env.example` menjadi `.env` dan ganti password dengan nilai acak.
2. Jalankan `docker compose up -d --build --wait`.
3. Buka `http://IP_VM` dan periksa `docker compose ps`.

Database hanya bergabung ke network backend internal dan tidak menerbitkan port host. Aplikasi menunggu database healthy. Kedua service menggunakan `restart: unless-stopped`.

## Pengujian

- Tambahkan catatan melalui browser, jalankan `docker compose down` lalu `docker compose up -d --wait`, dan muat ulang halaman. Volume `postgres_data` mempertahankan catatan. Jangan gunakan `down -v` jika data ingin dipertahankan.
- `docker network inspect ruang-rasa_backend` menunjukkan `Internal: true`.
- `docker inspect ruang-rasa-database-1 --format '{{json .HostConfig.PortBindings}}'` menghasilkan `{}`.
- `docker stop ruang-rasa-app-1` adalah penghentian manual. Jalankan `docker compose start app` untuk menyalakannya kembali. Restart policy tidak membatalkan penghentian manual.
- Untuk mensimulasikan crash, hentikan PID utama dari host, lalu periksa `RestartCount` dan status healthy. Jangan menggunakan metode ini pada sistem produksi.

## API

- `GET /api/health`
- `GET /api/entries`
- `PUT /api/entries/<uuid>`
- `DELETE /api/entries/<uuid>`

File `.env` diabaikan Git dan Docker build. Hanya `.env.example` boleh masuk repository.
