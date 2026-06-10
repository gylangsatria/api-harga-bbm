# BBM API

API untuk mengambil data harga BBM dari isibens.in

## Prasyarat

- **Node.js 20+** (untuk tanpa Docker)
- **Docker & Docker Compose** (untuk via Docker, opsional)

## Instalasi

### Via Docker (recommended untuk development)

```bash
# Build & jalankan
npm run docker:run

# Atau manual:
docker compose up -d

# Lihat logs
docker compose logs -f

# Hentikan
docker compose down
```

### Via Host (tanpa Docker)

```bash
# Install dependencies
npm install

# Copy environment
cp .env.example .env

# Jalankan development (dengan auto-reload)
npm run dev

# Atau production
npm start
```

## Fitur Real-time

- **Auto-refresh server**: Data di-scrape otomatis setiap 5 menit (bisa diatur via env `REFRESH_INTERVAL` dalam ms)
- **SSE (Server-Sent Events)**: Push real-time ke semua client yang terhubung
- **Frontend dashboard**: Buka `http://localhost:5010` untuk melihat harga BBM secara live
- **Polling fallback**: Halaman frontend akan polling setiap 30 detik jika koneksi SSE terputus

## Endpoints

| Method | Endpoint                      | Deskripsi                                     |
| ------ | ----------------------------- | --------------------------------------------- |
| `GET`  | `/`                           | Frontend dashboard harga BBM real-time        |
| `GET`  | `/health`                     | Health check                                  |
| `GET`  | `/api/harga-bbm`              | Ambil data harga BBM (dengan cache)           |
| `GET`  | `/api/harga-bbm?refresh=true` | Paksa ambil data baru dari isibens.in         |
| `POST` | `/api/refresh`                | Refresh data dan kirim update ke semua client |
| `GET`  | `/api/stream`                 | SSE endpoint untuk real-time push             |

## Environment Variables

| Variable           | Default        | Deskripsi                        |
| ------------------ | -------------- | -------------------------------- |
| `PORT`             | `5010`         | Port server                      |
| `REFRESH_INTERVAL` | `300000`       | Interval auto-refresh (dalam ms) |
| `NODE_ENV`         | `production`   | Environment mode                 |

## Kustomisasi Docker Compose

### Mengganti Port

Ubah port dengan environment variable:

```bash
API_PORT=8080 docker compose up -d
```

Atau buat file `.env`:

```env
API_PORT=8080
```

### Cloudflare Tunnel

Service sudah terhubung ke external network `cloudflare-tunnel`. Jika network tersebut belum ada, buat terlebih dahulu:

```bash
docker network create cloudflare-tunnel
```

Jika ingin menonaktifkannya, hapus baris berikut dari `docker-compose.yml`:

```yaml
networks:
  - cloudflare-tunnel # ← hapus baris ini
```

dan pada bagian `networks:` di akhir file:

```yaml
cloudflare-tunnel: # ← hapus blok ini
  external: true
```

### Menambahkan Network Lain

```yaml
services:
  bbm-api:
    networks:
      - bbm-network
      - cloudflare-tunnel
      - nama-network-anda # ← tambahkan di sini

networks:
  nama-network-anda:
    external: true
```

## Struktur Folder

## Struktur Folder

```
.
├── data/               # Cache data JSON
├── src/
│   ├── server.js       # Express server
│   └── scraper.js      # Scraper isibens.in
├── Dockerfile
├── docker-compose.yml
└── package.json
```
