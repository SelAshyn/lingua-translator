require("dotenv").config();

const express = require("express");
const http = require("http");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.DEEPL_API_KEY;

// Permissive CORS for local Chrome extension development.
// Chrome extension IDs are 32 chars of [a-p]; match any extension origin.
const EXTENSION_ORIGIN_RE = /^chrome-extension:\/\/[a-p]{32}$/;

app.use((req, res, next) => {
  const origin = req.headers.origin || "";

  if (
    EXTENSION_ORIGIN_RE.test(origin) ||
    origin.includes("localhost") ||
    origin.includes("127.0.0.1")
  ) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json({ limit: "20kb" }));

app.get("/", (req, res) => {
  res.json({ status: "DeepL translation backend is running." });
});

app.post("/api/translate", async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({
        error: "DeepL API key is missing from the backend .env file."
      });
    }

    const { text, target_lang } = req.body || {};

    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        error: "Text to translate is required."
      });
    }

    if (Buffer.byteLength(text, "utf8") > 100000) {
      return res.status(413).json({
        error: "Selected text is too long."
      });
    }

    if (
      typeof target_lang !== "string" ||
      !/^[A-Za-z-]{2,10}$/.test(target_lang)
    ) {
      return res.status(400).json({
        error: "Invalid target language code."
      });
    }

    // DeepL API Free and Pro use different endpoints.
    const endpoint =
      process.env.DEEPL_API_URL ||
      "https://api-free.deepl.com/v2/translate";

    const deeplResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `DeepL-Auth-Key ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: [text],
        target_lang: target_lang.toUpperCase()
      })
    });

    const data = await deeplResponse.json().catch(() => ({}));

    if (!deeplResponse.ok) {
      console.error("DeepL error:", deeplResponse.status, data);

      return res.status(deeplResponse.status).json({
        error:
          data.message ||
          data.detail ||
          `DeepL API request failed (HTTP ${deeplResponse.status}). Check your API key, endpoint, and supported language.`
      });
    }

    const translation = data.translations?.[0]?.text;

    if (!translation) {
      return res.status(502).json({
        error: "DeepL returned no translation."
      });
    }

    return res.json({ translation });
  } catch (error) {
    console.error("Backend error:", error);

    return res.status(500).json({
      error: "Could not contact DeepL. Check the backend connection."
    });
  }
});

http.createServer(app).listen(PORT, "127.0.0.1", () => {
  console.log(`DeepL backend running at http://localhost:${PORT}`);
});