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

## Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/health` | Health check |
| `GET` | `/api/harga-bbm` | Ambil data harga BBM (dengan cache) |
| `GET` | `/api/harga-bbm?refresh=true` | Paksa ambil data baru dari isibens.in |
| `POST` | `/api/refresh` | Refresh data cache |

## Environment Variables

| Variable | Default | Deskripsi |
|----------|---------|-----------|
| `PORT` | `5010` | Port API server |
| `NODE_ENV` | `production` | Environment mode |

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
