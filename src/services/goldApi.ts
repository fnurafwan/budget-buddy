// src/services/goldApi.ts

export interface GoldPriceItem {
  weight: string;
  buyPrice: number;
  buybackPrice?: number;
}

export interface GoldPriceItem {
  weight: string;
  buyPrice: number;
  buybackPrice?: number;
}

// Fungsi helper meniru rumus asli dari script Antam
function calculateAntamBuyback(weightGrams: number, basePrice: number): number {
  const estimatedPrice = basePrice * weightGrams;
  let pph22 = 0;
  let materai = 10000;

  if (estimatedPrice > 10000000) {
    pph22 = Math.round(estimatedPrice * 0.015); // Asumsi user punya NPWP (1.5%)
  }
  if (estimatedPrice <= 5000000) {
    materai = 0;
  }
  return estimatedPrice - pph22 - materai;
}

const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const isDev = import.meta.env.DEV;

export async function fetchAntamPrices(): Promise<GoldPriceItem[]> {
  // Kita scrape dua halaman sekaligus: Halaman Beli dan Halaman Jual (Buyback)
  const proxyBuyUrl = isDev
  ? '/api/antam/id/harga-emas-hari-ini'
  : '/api/proxy?target=' + encodeURIComponent(
      'https://www.logammulia.com/id/harga-emas-hari-ini'
    );

const proxySellUrl = isDev
  ? '/api/antam/id/sell/gold'
  : '/api/proxy?target=' + encodeURIComponent(
      'https://www.logammulia.com/id/sell/gold'
    );

  try {
    const [buyRes, sellRes] = await Promise.all([
      fetch(proxyBuyUrl),
      fetch(proxySellUrl)
    ]);

    if (!buyRes.ok || !sellRes.ok) throw new Error("Gagal mengambil data dari Antam");
    
    const buyHtml = await buyRes.text();
    const sellHtml = await sellRes.text();
    
    const parser = new DOMParser();
    const buyDoc = parser.parseFromString(buyHtml, "text/html");
    const sellDoc = parser.parseFromString(sellHtml, "text/html");

    // 1. Ambil Base Price Buyback dari input hidden di halaman sell
    const baseBuybackInput = sellDoc.querySelector('#valBasePrice') as HTMLInputElement;
    const baseBuybackPrice = baseBuybackInput ? parseInt(baseBuybackInput.value, 10) : 0;

    // 2. Ambil tabel harga Beli
    const tables = buyDoc.querySelectorAll('table.table-bordered');
    if (tables.length === 0) return [];

    const rows = tables[0].querySelectorAll('tr');
    const results: GoldPriceItem[] = [];
    
    // TAMBAHAN: Buat Set untuk mengingat berat yang sudah dimasukkan
    const seenWeights = new Set();

    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 2) {
        const weightText = cells[0].textContent?.trim() || '';
        const priceText = cells[1].textContent?.trim() || '';
        
        // TAMBAHAN: Cek apakah berat ini belum pernah dimasukkan (!seenWeights.has)
        if (weightText.includes('gr') && !seenWeights.has(weightText)) {
          
          const buyPrice = parseInt(priceText.replace(/,/g, ''), 10);
          const weightNumber = parseFloat(weightText.replace(/[^0-9.]/g, ''));

          if (!isNaN(buyPrice) && !isNaN(weightNumber)) {
            // Tandai berat ini agar tidak dimasukkan lagi kalau ada edisi Gift/Imlek
            seenWeights.add(weightText);

            let buybackPrice = undefined;

            if (baseBuybackPrice > 0) {
              buybackPrice = calculateAntamBuyback(weightNumber, baseBuybackPrice);
            } else {
              const spreadEstimate = 140000 * weightNumber;
              buybackPrice = buyPrice - spreadEstimate;
            }

            results.push({ weight: weightText, buyPrice, buybackPrice });
          }
        }
      }
    });

    results.sort((a, b) => {
      // Ekstrak angka dari string "0.5 gr", "10 gr", dll
      const beratA = parseFloat(a.weight.replace(/[^0-9.]/g, ''));
      const beratB = parseFloat(b.weight.replace(/[^0-9.]/g, ''));
      return beratA - beratB;
    });

    console.log("✅ Berhasil fetch tabel Antam Beli");
    return results;

  } catch (error) {
    console.error("❌ Error fetching Antam prices:", error);
    return [];
  }
}

// ... [Fungsi fetchUbsPrices TETAP SAMA seperti kode sebelumnya] ...

export async function fetchUbsPrices(): Promise<GoldPriceItem[]> {
  const proxyUrl = isDev
    ? '/api/ubs/harga-buyback-hari-ini/' // vite proxy
    : '/api/proxy?target=' + encodeURIComponent(
        'https://ubslifestyle.com/harga-buyback-hari-ini/'
      );

  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error("Gagal mengambil data proxy lokal UBS");
    
    const html = await response.text();
    console.log("HTML UBS:", html.slice(0, 1000));
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const tables = doc.querySelectorAll('table.tw-table-auto');
    const results: GoldPriceItem[] = [];

    if (tables.length > 0) {
      const rows = tables[0].querySelectorAll('tbody tr.table-price');
      
      // Loop semua baris tabel UBS
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 3) {
          const weight = cells[0].textContent?.trim() || '';
          const buyText = cells[1].textContent?.trim() || '';
          const sellText = cells[2].textContent?.trim() || '';
          
          if (weight && buyText) {
            const buyPrice = parseInt(buyText.replace(/Rp/gi, '').replace(/\./g, ''), 10);
            const buybackPrice = parseInt(sellText.replace(/Rp/gi, '').replace(/\./g, ''), 10);
            
            if (!isNaN(buyPrice)) {
              results.push({ 
                weight, 
                buyPrice, 
                // Jika buybackPrice valid, masukkan, jika tidak biarkan kosong
                buybackPrice: isNaN(buybackPrice) ? undefined : buybackPrice 
              });
            }
          }
        }
      });
    }

    console.log("✅ Berhasil fetch tabel UBS:", results.length, "baris");
    return results;

  } catch (error) {
    console.error("❌ Error fetching UBS prices:", error);
    return [];
  }
}