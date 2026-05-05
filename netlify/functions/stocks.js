export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  const symbols = (event.queryStringParameters?.symbols || "").split(",").filter(Boolean);
  if (!symbols.length) return { statusCode: 400, headers, body: JSON.stringify({ error: "No symbols" }) };
  const results = {};
  await Promise.all(symbols.map(async (sym) => {
    try {
      const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      if (res.ok) {
        const data = await res.json();
        const meta = data?.chart?.result?.[0]?.meta;
        if (meta?.regularMarketPrice > 0) {
          const price = meta.regularMarketPrice;
          const prev = meta.previousClose || meta.chartPreviousClose;
          results[sym.toUpperCase()] = { price, change24h: prev ? ((price-prev)/prev)*100 : null };
        }
      }
    } catch {}
  }));
  return { statusCode: 200, headers, body: JSON.stringify(results) };
}
