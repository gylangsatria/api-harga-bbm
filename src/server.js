const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");
const { scrapeHargaBBM } = require("./scraper");

const app = express();
const PORT = process.env.PORT || 5010;
const DATA_FILE = path.join(__dirname, "../data/harga-bbm.json");

app.use(cors());
app.use(express.json());

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

// Endpoint GET /api/harga-bbm
app.get("/api/harga-bbm", async (req, res) => {
  try {
    // Coba baca dari cache terlebih dahulu
    let data = await readCacheData();

    // Jika cache tidak ada atau force refresh
    if (!data || req.query.refresh === "true") {
      console.log("Mengambil data fresh dari isibens.in...");
      data = await scrapeHargaBBM();
      await writeCacheData(data);
    }

    res.json({
      success: true,
      data: data,
      fromCache: !(!data || req.query.refresh === "true"),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Endpoint untuk force refresh
app.post("/api/refresh", async (req, res) => {
  try {
    const data = await scrapeHargaBBM();
    await writeCacheData(data);
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

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
