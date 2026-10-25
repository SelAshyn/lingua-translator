
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json; charset=utf-8"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    if (url.pathname === "/" && request.method === "GET") {
      return json({ status: "Translation API is running." });
    }

    if (url.pathname !== "/api/translate" ||
        request.method !== "POST") {
      return json({ error: "Not found." }, 404);
    }

    if (!env.DEEPL_API_KEY) {
      return json({ error: "DeepL API key is not configured." }, 500);
    }

    let body;

    try {
      const length = Number(request.headers.get("Content-Length") || 0);

      if (length > 20000) {
        return json({ error: "Request is too large." }, 413);
      }

      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON request." }, 400);
    }

    const { text, target_lang } = body || {};

    if (typeof text !== "string" || !text.trim()) {
      return json({ error: "Please provide text to translate." }, 400);
    }

    if (new TextEncoder().encode(text).length > 5000) {
      return json({ error: "Selected text exceeds the 5 KB limit." }, 413);
    }

    const clientKey =
      request.headers.get("CF-Connecting-IP") || "unknown";

    const { success } = await env.TRANSLATE_LIMITER.limit({
      key: clientKey
    });

    if (!success) {
      return json(
        { error: "Too many requests. Please try again in a minute." },
        429
      );
    }

    const supportedTargets = new Set([
      "AR", "BG", "CS", "DA", "DE", "EL", "EN", "ES",
      "ET", "FI", "FR", "HU", "HI", "ID", "IT", "JA", "KO",
      "LT", "LV", "NB", "NE", "NL", "PL", "PT", "RO", "RU",
      "SK", "SL", "SV", "TR", "UK", "ZH"
    ]);

    const target = String(target_lang || "").toUpperCase();

    if (!supportedTargets.has(target)) {
      return json({ error: "Unsupported target language." }, 400);
    }

    try {
      const endpoint = env.DEEPL_API_URL ||
        "https://api-free.deepl.com/v2/translate";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `DeepL-Auth-Key ${env.DEEPL_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: [text.trim()],
          target_lang: target
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return json({
          error: data.message ||
            data.detail ||
            `DeepL request failed (HTTP ${response.status}).`
        }, 502);
      }

      const translation = data.translations?.[0]?.text;

      if (!translation) {
        return json({ error: "DeepL returned no translation." }, 502);
      }

      return json({ translation });
    } catch (error) {
      console.error("DeepL request failed:", error);
      return json({ error: "Could not connect to DeepL." }, 502);
    }
  }
};
