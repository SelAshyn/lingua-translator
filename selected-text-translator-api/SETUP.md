# 🚀 Cloudflare Worker Setup Guide

## Overview

This is a Cloudflare Worker that proxies requests to the DeepL API. It adds:
- Rate limiting
- Input validation
- Security headers
- CORS support

---

## 📋 Prerequisites

1. **Cloudflare Account** - Free tier works fine
   - Sign up: https://dash.cloudflare.com/

2. **DeepL API Key** - Free or Pro
   - Get key: https://www.deepl.com/pro-api
   - Free tier: 500,000 characters/month

3. **Wrangler CLI** - Already installed
   ```bash
   npm install -g wrangler
   ```

---

## 🔧 Setup Instructions

### Step 1: Deploy to Cloudflare

```bash
# Navigate to this folder
cd selected-text-translator-api

# Login to Cloudflare
wrangler login

# Deploy the worker
wrangler deploy
```

**Output**: You'll get a URL like:
```
https://[your-worker-name].[your-account].workers.dev
```

### Step 2: Add DeepL API Key

```bash
# Add the secret to your Cloudflare Worker
wrangler secret put DEEPL_API_KEY

# Paste your DeepL API key when prompted
# (It won't be displayed)
```

**Via Cloudflare Dashboard**:
1. Go: https://dash.cloudflare.com/
2. Find your Worker
3. Settings → Variables
4. Add Environment Variable:
   - Name: `DEEPL_API_KEY`
   - Value: `[Your DeepL API Key]`
5. Click "Encrypt"

### Step 3: Test the Worker

```bash
# Test locally first
wrangler dev

# Then test in browser
curl -X POST http://localhost:8787/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello","target_lang":"FR"}'
```

### Step 4: Update Extension

Update the API URL in `popup.js`:
```javascript
const API_URL = "https://[your-worker-name].[your-account].workers.dev/api/translate";
```

---

## 🔑 Getting Your API Key

### DeepL Free API
1. Go: https://www.deepl.com/pro-api
2. Sign up (Free tier available)
3. Get API key from dashboard
4. Add to Cloudflare

### Important Notes
```
✓ Free tier: 500,000 characters/month
✓ No credit card needed for free tier
✓ Keep your API key secret
✓ Store ONLY in Cloudflare, never in code
```

---

## 🌐 Environment Variables

### Required
```
DEEPL_API_KEY    (Required)
                 Your DeepL API authentication key
```

### Optional
```
DEEPL_API_URL    (Optional, defaults to free API)
                 Override to use Pro API:
                 https://api.deepl.com/v2/translate
```

---

## 📊 Rate Limiting

Current settings:
```json
{
  "limit": 100,
  "period": 60
}
```

Means: **100 requests per 60 seconds** per IP address

To change:
1. Edit `wrangler.jsonc`
2. Update the `ratelimits` section
3. Run `wrangler deploy`

---

## 🧪 Testing

### Local Testing
```bash
# Start dev server
wrangler dev

# Test in another terminal
curl -X POST http://localhost:8787/api/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, how are you?",
    "target_lang": "FR"
  }'
```

### Expected Response
```json
{
  "translation": "Bonjour, comment allez-vous?"
}
```

### Production Testing
```bash
# Replace with your actual worker URL
curl -X POST https://[your-worker].workers.dev/api/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, how are you?",
    "target_lang": "FR"
  }'
```

---

## 📚 API Endpoints

### Health Check
```
GET /
Response: { status: "Translation API is running." }
```

### Translation
```
POST /api/translate
Content-Type: application/json

Body:
{
  "text": "Text to translate",
  "target_lang": "FR"
}

Response:
{
  "translation": "Texte à traduire"
}

Errors:
- 400: Invalid request (bad text/language)
- 413: Request too large
- 429: Rate limit exceeded
- 500: API key missing
- 502: DeepL API error
```

---

## ✅ Supported Languages

```
AR - Arabic
BG - Bulgarian
CS - Czech
DA - Danish
DE - German
EL - Greek
EN - English
ES - Spanish
ET - Estonian
FI - Finnish
FR - French
HU - Hungarian
HI - Hindi
ID - Indonesian
IT - Italian
JA - Japanese
KO - Korean
LT - Lithuanian
LV - Latvian
NB - Norwegian Bokmål
NE - Nepali
NL - Dutch
PL - Polish
PT - Portuguese
RO - Romanian
RU - Russian
SK - Slovak
SL - Slovenian
SV - Swedish
TR - Turkish
UK - Ukrainian
ZH - Chinese (Simplified)
```

---

## 🚨 Troubleshooting

### "DeepL API key is not configured"
```
Solution:
1. Go to Cloudflare Dashboard
2. Find your Worker
3. Settings → Environment Variables
4. Add DEEPL_API_KEY
5. Run: wrangler deploy
```

### "Unsupported target language"
```
Solution:
1. Check language code (must be 2-2 chars)
2. See supported languages above
3. Use uppercase letters (e.g., "FR" not "fr")
```

### "Too many requests"
```
Solution:
1. Rate limit: 100 requests/60 seconds
2. Wait a minute before retrying
3. Or edit wrangler.jsonc to increase limit
```

### "Text exceeds the 5 KB limit"
```
Solution:
1. Translate shorter text
2. Or split into multiple requests
```

---

## 📖 Documentation Links

- **Cloudflare Workers**: https://developers.cloudflare.com/workers/
- **Wrangler CLI**: https://developers.cloudflare.com/workers/cli-wrangler/
- **DeepL API**: https://www.deepl.com/docs-api
- **Environment Variables**: https://developers.cloudflare.com/workers/configuration/environment-variables/

---

## 🔄 Deployment Process

```
1. Local Development
   ↓ wrangler dev
   
2. Get Credentials
   ↓ DeepL API key
   
3. Deploy to Cloudflare
   ↓ wrangler deploy
   
4. Add API Key
   ↓ wrangler secret put DEEPL_API_KEY
   
5. Update Extension
   ↓ Set API_URL in popup.js
   
6. Test Everything
   ↓ Translate via extension
   
7. Live!
```

---

## 💡 Best Practices

```
✓ Keep API key in Cloudflare, never in code
✓ Use environment variables
✓ Test locally first with wrangler dev
✓ Monitor rate limits
✓ Log errors for debugging
✓ Update wrangler when needed
✓ Use HTTPS (automatic with Workers)
✓ Add request validation (already done)
```

---

## 🎯 Quick Start

```bash
# 1. Login
wrangler login

# 2. Deploy
wrangler deploy

# 3. Add secret
wrangler secret put DEEPL_API_KEY
# Paste your key when prompted

# 4. Get your URL
# Check Cloudflare Dashboard or output

# 5. Done!
```

---

**Questions? Check Cloudflare Docs or DeepL API docs!**
