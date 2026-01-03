# ❄️ SnowCap.js

> Minimalist JavaScript library for adding procedural snow caps to any UI element. 

[![License: MIT](https://img.shields.io/badge/License-MIT-white.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![NPM Version](https://img.shields.io/badge/version-1.0.0-black.svg?style=flat-square)](https://github.com/huecoder/snow-cap)
[![CDN](https://img.shields.io/badge/jsDelivr-active-brightgreen.svg?style=flat-square)](https://www.jsdelivr.com/)

**SnowCap.js** automatically scans the topography of your buttons, text, or containers and covers them with a layer of procedural snow. Perfect for winter holidays branding without touching your CSS.

[View Live Playground](ССЫЛКА_НА_ТВОЙ_PLAYGROUND)

---

## ✨ Features

- **Topography Aware**: Scans element boundaries and text shapes.
- **Zero Dependencies**: Pure vanilla JavaScript.
- **Lightweight**: Minimal performance footprint using Canvas API for scanning.
- **Highly Customizable**: Control density, size, blur, and "gravity bias".
- **Dynamic**: Responsive to window resizing.

## 🚀 Quick Start

### CDN
Include the script in your HTML:
```html
<script src="https://cdn.jsdelivr.net/gh/huecoder/snow-cap@main/snow-cap.js"></script>
```

### Usage
Initialize SnowCap on any element:
```javascript
const snow = new SnowCap('.my-button', {
    size: 12,
    density: 0.8,
    color: '#ffffff'
});
```

## ⚙️ Configuration

| Parameter | Default | Description |
| :--- | :--- | :--- |
| `size` | `10` | Base size of snow blobs |
| `density` | `0.8` | Probability of snow appearing (0 to 1) |
| `blur` | `4` | Softness of the snow layer |
| `bias` | `0` | Center-gravity effect (creates a "dome" look) |
| `color` | `#fff` | Snow color |

## 🛠 Development

1. Clone the repo: `git clone https://github.com/huecoder/snow-cap.git`
2. Open `index.html` in your browser.
3. Edit `snow-cap.js` and see changes.

---

## 📄 License
Licensed under the [MIT License](LICENSE). 

Built with ❄️ by [huecoder](https://huecoder.lol)
