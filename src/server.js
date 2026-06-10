const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");
const { scrapeHargaBBM } = require("./scraper");

const app = express();
const PORT = process.env.PORT || 5010;
const REFRESH_INTERVAL = process.env.REFRESH_INTERVAL || 5 * 60 * 1000; // 5 menit default
const DATA_FILE = path.join(__dirname, "../data/harga-bbm.json");

// Cache in-memory + SSE clients
let cachedData = null;
let sseClients = [];

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// Baca data dari file cache
async function readCacheData() {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

// Simpan data ke file cache
async function writeCacheData(data) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("Gagal menyimpan cache:", error);
    return false;
  }
}

// Kirim data ke semua client SSE
function broadcastToSSEClients(data) {
  const payload = JSON.stringify({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  });
  sseClients.forEach((client) => {
    client.write(`data: ${payload}\n\n`);
  });
}

// Fungsi untuk refresh data (dipakai oleh interval & endpoint)
async function refreshData({ broadcast = true } = {}) {
  try {
    console.log("[Auto-Refresh] Mengambil data fresh dari isibens.in...");
    const data = await scrapeHargaBBM();
    await writeCacheData(data);
    cachedData = data;
    if (broadcast) {
      broadcastToSSEClients(data);
    }
    console.log(
      "[Auto-Refresh] Data berhasil di-update:",
      new Date().toISOString(),
    );
    return data;
  } catch (error) {
    console.error("[Auto-Refresh] Gagal refresh:", error.message);
    return null;
  }
}

// Endpoint GET /api/harga-bbm
app.get("/api/harga-bbm", async (req, res) => {
  try {
    // Pakai cache in-memory jika ada
    let data = cachedData;

    // Jika belum ada cache atau force refresh, ambil fresh
    if (!data || req.query.refresh === "true") {
      data = await refreshData({ broadcast: true });
    }

    if (!data) {
      // Fallback ke file
      data = await readCacheData();
    }

    res.json({
      success: true,
      data: data,
      fromCache: !(!cachedData || req.query.refresh === "true"),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Endpoint SSE untuk real-time updates
app.get("/api/stream", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  // Kirim data terkini saat client connect
  if (cachedData) {
    const payload = JSON.stringify({
      success: true,
      data: cachedData,
      timestamp: new Date().toISOString(),
    });
    res.write(`data: ${payload}\n\n`);
  }

  // Tambahkan client ke daftar
  sseClients.push(res);
  console.log(`[SSE] Client connected. Total: ${sseClients.length}`);

  // Hapus client saat disconnect
  req.on("close", () => {
    sseClients = sseClients.filter((client) => client !== res);
    console.log(`[SSE] Client disconnected. Total: ${sseClients.length}`);
  });
});

// Endpoint untuk force refresh
app.post("/api/refresh", async (req, res) => {
  try {
    const data = await refreshData({ broadcast: true });
    res.json({
      success: true,
      message: "Data berhasil di-refresh",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", service: "bbm-api" });
});

// Auto-refresh berkala — update data setiap REFRESH_INTERVAL ms
setInterval(() => {
  refreshData({ broadcast: true });
}, REFRESH_INTERVAL);

// Inisialisasi: muat data dari cache file saat startup
async function init() {
  const data = await readCacheData();
  if (data) {
    cachedData = data;
    console.log("[Init] Data dimuat dari cache file");
  }
  // Langsung scrape data fresh saat pertama kali jalan
  refreshData({ broadcast: false });
}

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
  console.log(`Auto-refresh setiap ${REFRESH_INTERVAL / 1000 / 60} menit`);
  init();
});
