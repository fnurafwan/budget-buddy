export async function onRequest(context) {
  const url = new URL(context.request.url);
  const targetUrl = url.searchParams.get('target');
  
  if (!targetUrl) {
    return new Response('URL target tidak ditemukan', { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        // Header ini penting agar kita tidak dianggap bot oleh Antam/UBS
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });

    const html = await response.text();

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Access-Control-Allow-Origin': '*' // Mengizinkan bypass CORS
      }
    });
  } catch (error) {
    return new Response('Error fetching data', { status: 500 });
  }
}