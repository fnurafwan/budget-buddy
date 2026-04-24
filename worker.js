export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    console.log("🔥 HIT:", url.pathname);

    if (url.pathname === "/api/trigger-harga-update") {
      console.log("🔥 MASUK FETCH:", url.pathname);
      await this.scheduled(null, env, ctx);
      return new Response("✅ Scheduled job selesai dijalankan", { status: 200 });
    }

    // 🔥 HANDLE API PROXY
    if (url.pathname.startsWith("/api/proxy")) {
      const targetUrl = url.searchParams.get("target");

      if (!targetUrl) {
        return new Response("❌ Missing target URL", { status: 400 });
      }

      try {
        const res = await fetch(targetUrl, {
          headers: {
            // "User-Agent": "Mozilla/5.0",
            // "Accept": "text/html,application/xhtml+xml",
            // "Accept-Language": "id-ID,id;q=0.9",
            // "Referer": targetUrl,
            // "Origin": new URL(targetUrl).origin,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "Referer": targetUrl,
            "Origin": new URL(targetUrl).origin,
          },
        });

        const html = await res.text();

        return new Response(html, {
          headers: {
            "Content-Type": "text/html;charset=UTF-8",
            "Access-Control-Allow-Origin": "*",
          },
        });

      } catch (err) {
        return new Response("❌ Proxy error", { status: 500 });
      }
    }

    // ✅ fallback ke SPA
    // return env.ASSETS.fetch(request);
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  },

  // Cron scheduler
  async scheduled(event, env, ctx) {
    try {
      const workerUrl = "https://budget-buddy.dwittamma19.workers.dev";

      const [{ buyHtml, sellHtml }, ubsHtml] = await Promise.all([
        scrapeAntam(workerUrl),
        scrapeUbs(workerUrl),
      ]);

      const antamList = parseAntamTable(buyHtml, sellHtml);
      const ubsList = parseUbsTable(ubsHtml);
      
      console.log("BUY HTML SAMPLE:", buyHtml.slice(0, 300));
      console.log("SELL HTML SAMPLE:", sellHtml.slice(0, 300));
      console.log("UBS HTML SAMPLE:", ubsHtml.slice(0, 300));

      console.log("antamList:", antamList);
      console.log("UbsList:", ubsList);


      const a1g = antamList.find(p => p.weight.replace(/\s/g, '').toLowerCase() === '1gr');
      const u1g = ubsList.find(p => p.weight.replace(/\s/g, '').toLowerCase() === '1gram');

      if (!a1g || !u1g) {
        console.warn("⚠️ Data 1gr tidak ditemukan");
        return;
      }

      await saveToFirestore(env, {
        antamBuy:     a1g.buyPrice,
        antamBuyback: a1g.buybackPrice || 0,
        ubsBuy:       u1g.buyPrice,
        ubsBuyback:   u1g.buybackPrice || 0,
      });

      console.log(`✅ Harga tersimpan: ${new Date().toISOString().split("T")[0]}`);
    } catch (err) {
      console.error("❌ Error:", err);
    }
  },
};

async function scrapeAntam(workerUrl) {
  const buyUrl = `${workerUrl}/api/proxy?target=` +
    encodeURIComponent('https://www.logammulia.com/id/harga-emas-hari-ini');
  const sellUrl = `${workerUrl}/api/proxy?target=` +
    encodeURIComponent('https://www.logammulia.com/id/sell/gold');

  const [buyRes, sellRes] = await Promise.all([
    fetch(buyUrl),
    fetch(sellUrl),
  ]);

  const buyHtml = await buyRes.text();
  const sellHtml = await sellRes.text();

  return { buyHtml, sellHtml };
}

async function scrapeUbs(workerUrl) {
  const url = `${workerUrl}/api/proxy?target=` +
    encodeURIComponent('https://ubslifestyle.com/harga-buyback-hari-ini/');
  const res = await fetch(url);
  return res.text();
}

// Parse HTML pakai regex (tidak ada DOMParser di Worker)
function parseAntamTable(buyHtml, sellHtml) {
  // Ambil base buyback price
  const basePriceMatch = sellHtml.match(/id="valBasePrice"[^>]*value="(\d+)"/);
  const baseBuybackPrice = basePriceMatch ? parseInt(basePriceMatch[1]) : 0;

  // Ambil semua row dari table.table-bordered
  const tableMatch = buyHtml.match(/<table[^>]*class="[^"]*table-bordered[^"]*"[^>]*>([\s\S]*?)<\/table>/);
  if (!tableMatch) return [];

  const rowMatches = [...tableMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];
  const results = [];
  const seenWeights = new Set();

  for (const rowMatch of rowMatches) {
    const cells = [...rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)]
      .map(m => m[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim());

    if (cells.length >= 2) {
      const weightText = cells[0];
      const priceText = cells[1];

      if (weightText.includes('gr') && !seenWeights.has(weightText)) {
        const buyPrice = parseInt(priceText.replace(/,/g, ''), 10);
        const weightNumber = parseFloat(weightText.replace(/[^0-9.]/g, ''));

        if (!isNaN(buyPrice) && !isNaN(weightNumber)) {
          seenWeights.add(weightText);

          let buybackPrice = 0;
          if (baseBuybackPrice > 0) {
            const estimatedPrice = baseBuybackPrice * weightNumber;
            const pph22 = estimatedPrice > 10000000 ? Math.round(estimatedPrice * 0.015) : 0;
            const materai = estimatedPrice <= 5000000 ? 0 : 10000;
            buybackPrice = estimatedPrice - pph22 - materai;
          } else {
            buybackPrice = buyPrice - 140000 * weightNumber;
          }

          results.push({ weight: weightText, buyPrice, buybackPrice });
        }
      }
    }
  }

  return results.sort((a, b) =>
    parseFloat(a.weight.replace(/[^0-9.]/g, '')) -
    parseFloat(b.weight.replace(/[^0-9.]/g, ''))
  );
}

function parseUbsTable(html) {
  const results = [];
  const rowMatches = [...html.matchAll(/<tr[^>]*class="[^"]*table-price[^"]*"[^>]*>([\s\S]*?)<\/tr>/g)];

  for (const rowMatch of rowMatches) {
    const cells = [...rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)]
      .map(m => m[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim());

    if (cells.length >= 3) {
      const weight = cells[0];
      const buyPrice = parseInt(cells[1].replace(/Rp/gi, '').replace(/\./g, ''), 10);
      const buybackPrice = parseInt(cells[2].replace(/Rp/gi, '').replace(/\./g, ''), 10);

      if (!isNaN(buyPrice)) {
        results.push({ weight, buyPrice, buybackPrice: isNaN(buybackPrice) ? undefined : buybackPrice });
      }
    }
  }

  return results;
}

async function saveToFirestore(env, price) {
  const today = new Date().toISOString().split("T")[0];
  const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/priceHistory/${today}?key=${env.FIREBASE_API_KEY}`;
  
  // console.log("🔥 PROJECT ID:", env.FIREBASE_PROJECT_ID);

  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: {
        date:         { stringValue: today },
        antamBuy:     { integerValue: String(price.antamBuy) },
        antamBuyback: { integerValue: String(price.antamBuyback) },
        ubsBuy:       { integerValue: String(price.ubsBuy) },
        ubsBuyback:   { integerValue: String(price.ubsBuyback) },
      },
    }),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

