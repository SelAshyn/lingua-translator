# 🌐 Lingua - Instant Translator

> A modern, lightning-fast Chrome extension that translates any text with a single click. Powered by DeepL's industry-leading translation engine.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Chrome](https://img.shields.io/badge/chrome-extension-yellow)

## ✨ Features

- **⚡ Instant Translation** - Translate text from any webpage instantly
- **🌍 30+ Languages** - Support for major languages worldwide including English, Spanish, French, German, Chinese, Japanese, Hindi, Nepali, Arabic, and more
- **🔍 Auto-Detection** - Automatically detects source language
- **🌙 Dark Mode** - Eye-friendly dark theme with automatic system preference detection
- **⌨️ Keyboard Shortcut** - Press `Ctrl+Enter` (or `Cmd+Enter` on Mac) to translate
- **📋 One-Click Copy** - Copy translations to clipboard with a single click
- **🔒 Privacy First** - All translations processed through secure DeepL API
- **✨ Modern UI** - Beautiful, responsive interface with smooth animations and glass-morphism design

## 🚀 Quick Start

### Installation
1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the project directory

### Setup Backend API (Cloudflare Worker)

The extension uses a Cloudflare Worker backend to proxy DeepL API requests securely.

**Quick Setup:**
```bash
# 1. Go to the API folder
cd selected-text-translator-api

# 2. Login to Cloudflare
wrangler login

# 3. Deploy the worker
wrangler deploy

# 4. Add your DeepL API Key
wrangler secret put DEEPL_API_KEY
# Paste your key when prompted

# 5. Update API URL in popup.js with your worker URL
```

**Full Setup Guide**: See `selected-text-translator-api/SETUP.md`

**Get DeepL API Key**: https://www.deepl.com/pro-api (Free tier available)

### Usage
1. **Select** any text on a webpage
2. **Click** the Lingua icon in your toolbar
3. **Choose** your target language
4. **Click** Translate
5. **Copy** the result with one click

## 🎨 Design Highlights

### Modern Interface
- **Gradient Header** - Eye-catching blue gradient with glass-morphism elements
- **Clean Layout** - Intuitive sections for language selection, input, and output
- **Responsive Design** - Works perfectly on any screen size
- **Smooth Animations** - Polished interactions with subtle transitions
- **Accessible** - Full keyboard navigation and ARIA labels

### New Branding
- **Name**: Lingua (meaning "language" in Latin/Italian/Spanish)
- **Logo**: Globe with speech bubbles representing global communication
- **Icons**: Modern gradient-based SVG icons (16x16, 48x48, 128x128)

## 🛠 Project Structure

```
lingua-translator/
├── manifest.json                    # Extension manifest v3
├── popup.html                       # Modern popup UI
├── popup.css                        # Redesigned styles
├── popup.js                         # Extension logic
├── background.js                    # Service worker
├── content.js                       # Content script
├── content.css                      # Webpage injected styles
├── icons/                           # Modern SVG icons
│   ├── icon-16.svg
│   ├── icon-48.svg
│   └── icon-128.svg
├── deepl-backend/                   # Local backend (optional)
│   ├── server.js
│   └── package.json
└── selected-text-translator-api/    # Cloudflare Worker
    ├── src/index.js
    ├── wrangler.jsonc
    └── package.json
```

## 🌐 Supported Languages

English, Spanish, French, German, Chinese (Simplified), Japanese, Korean, Arabic, Russian, Portuguese, Italian, Dutch, Polish, Turkish, Ukrainian, Czech, Danish, Greek, Hungarian, Finnish, Swedish, Bulgarian, Romanian, Slovak, Slovenian, Estonian, Latvian, Lithuanian, Norwegian Bokmål, Chinese (Traditional), Vietnamese, Indonesian, Thai, Hindi, Nepali, and more...

## 🔐 Privacy & Security

- ✅ Your text is only sent to DeepL's secure servers
- ✅ No tracking or analytics
- ✅ No personal data collection
- ✅ Transparent about all permissions
- ✅ Open source code for transparency

## 💻 Technologies

- **DeepL API** - Industry-leading neural machine translation
- **Cloudflare Workers** - Serverless backend for scalability
- **Vanilla JavaScript** - No dependencies, minimal bundle size
- **Chrome Extensions API v3** - Modern secure extension manifest
- **CSS3 with Variables** - Dynamic theming support

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` / `Cmd+Enter` | Translate text |
| `Tab` | Navigate between elements |

## 🎯 Performance

- ⚡ **<1s translation time** - Optimized API calls
- 📦 **Minimal bundle** - No external dependencies
- 🔄 **Smart caching** - Remembers your language preference
- 🚀 **Instant UI** - Responsive and snappy interface

## 🚀 Development

### Local Development

```bash
# Load extension in Chrome
1. Navigate to chrome://extensions/
2. Enable Developer Mode
3. Click "Load unpacked"
4. Select this project directory
```

### Backend Setup (Cloudflare Worker)

```bash
# Install dependencies
cd selected-text-translator-api
npm install

# Deploy to Cloudflare
npm run deploy

# Set API key
wrangler secret put DEEPL_API_KEY
```

### Rate Limiting Configuration

The Cloudflare Worker includes rate limiting. Adjust in `wrangler.jsonc`:

```json
"ratelimits": [
  {
    "name": "TRANSLATE_LIMITER",
    "namespace_id": "1001",
    "simple": {
      "limit": 100,
      "period": 60
    }
  }
]
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Translation not working | Check internet connection and DeepL API status |
| Extension not visible | Reload tab and verify extension is enabled in `chrome://extensions` |
| Text not detected | Try typing directly or check if text is selectable |
| Rate limit reached | Wait a minute or adjust rate limits in backend config |

## 📝 License

MIT License © 2024

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.

## 🙏 Acknowledgments

- **DeepL** - For the amazing translation API
- **Cloudflare** - For the Workers platform
- **Chrome Extensions Team** - For the modern Manifest V3

## 📧 Support

For issues, feature requests, or suggestions, please open an issue on GitHub or contact us directly.

---

**Made with ❤️ for language learners and multilingual users everywhere**
