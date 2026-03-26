export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    console.log("🔥 HIT:", url.pathname);

    // 🔥 HANDLE API PROXY
    if (url.pathname.startsWith("/api/proxy")) {
      const targetUrl = url.searchParams.get("target");

      if (!targetUrl) {
        return new Response("❌ Missing target URL", { status: 400 });
      }

      try {
        const res = await fetch(targetUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0",
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "id-ID,id;q=0.9",
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
    return env.ASSETS.fetch(request);
  },
};