const axios = require("axios");
const cheerio = require("cheerio");

async function scrapeHargaBBM() {
  try {
    const { data } = await axios.get("https://isibens.in", {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const $ = cheerio.load(data);

    const result = {
      bensin: [],
      solar: [],
      lastUpdate: "",
      wilayah: "Jabodetabek",
    };

    // Extract update date
    const bodyText = $("body").text();
    const updateMatch = bodyText.match(/Update harga per (\d+ \w+ \d+)/);
    if (updateMatch) {
      result.lastUpdate = updateMatch[1];
    }

    // Parse tabel HTML dari isibens.in
    $("h4").each((i, el) => {
      const heading = $(el).text().trim();

      if (heading.includes("Bensin")) {
        const table = $(el).nextAll("table").first();
        if (!table.length) return;

        table.find("tr").each((j, row) => {
          const cells = $(row).find("td, th");
          if (cells.length < 2) return;

          const firstCell = $(cells[0]).text().trim();
          // Skip header row
          if (firstCell.toLowerCase() === "ron") return;

          const ron = parseInt(firstCell);
          if (isNaN(ron)) return;

          for (let k = 1; k < cells.length; k++) {
            const cellText = $(cells[k]).text().trim();
            if (cellText === "-" || cellText === "") continue;

            // Format cell: "12345 NamaProduk"
            const priceMatch = cellText.match(/^([\d.,]+)\s+(.+)/);
            if (priceMatch) {
              let price = priceMatch[1].replace(/\./g, "").replace(/,/g, "");
              price = parseInt(price);
              const name = priceMatch[2].trim();
              if (!isNaN(price) && name) {
                result.bensin.push({ name, price, ron });
              }
            }
          }
        });
      }

      if (heading.includes("Diesel") || heading.includes("Solar")) {
        const table = $(el).nextAll("table").first();
        if (!table.length) return;

        table.find("tr").each((j, row) => {
          const cells = $(row).find("td, th");
          if (cells.length < 2) return;

          const firstCell = $(cells[0]).text().trim();
          // Skip header row
          if (firstCell.toLowerCase() === "cn") return;

          const cetane = parseInt(firstCell);
          if (isNaN(cetane)) return;

          for (let k = 1; k < cells.length; k++) {
            const cellText = $(cells[k]).text().trim();
            if (cellText === "-" || cellText === "") continue;

            // Format cell: "12345 NamaProduk"
            const priceMatch = cellText.match(/^([\d.,]+)\s+(.+)/);
            if (priceMatch) {
              let price = priceMatch[1].replace(/\./g, "").replace(/,/g, "");
              price = parseInt(price);
              const name = priceMatch[2].trim();
              if (!isNaN(price) && name) {
                result.solar.push({ name, price, cetane });
              }
            }
          }
        });
      }
    });

    // Fallback data jika scraping gagal parsing
    if (result.bensin.length === 0 && result.solar.length === 0) {
      return getFallbackData();
    }

    return result;
  } catch (error) {
    console.error("Scraping error:", error);
    return getFallbackData();
  }
}

function getFallbackData() {
  return {
    bensin: [
      { name: "Pertalite", price: 10000, ron: 90 },
      { name: "Pertamax", price: 12300, ron: 92 },
      { name: "Pertamax Green", price: 12900, ron: 95 },
      { name: "Pertamax Turbo", price: 20750, ron: 98 },
    ],
    solar: [
      { name: "BioSolar", price: 6800, cetane: 48 },
      { name: "DexLite", price: 23000, cetane: 51 },
      { name: "Dex", price: 24800, cetane: 53 },
    ],
    lastUpdate: "1 Juni 2026",
    wilayah: "Jabodetabek",
    isFallback: true,
  };
}

module.exports = { scrapeHargaBBM };
