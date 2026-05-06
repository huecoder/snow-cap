# SnowCap.js

> Procedural, topography-aware snow caps for any DOM element. Zero dependencies. Vanilla JavaScript. Works on text, buttons, SVGs and arbitrary boxes.

[![License: MIT](https://img.shields.io/badge/License-MIT-white.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-2.0.0-black.svg?style=flat-square)](https://github.com/huecoder/snow-cap)
[![Size](https://img.shields.io/badge/size-~6kb%20gz-9cf.svg?style=flat-square)](snow-cap.js)
[![CDN](https://img.shields.io/badge/jsDelivr-active-brightgreen.svg?style=flat-square)](https://www.jsdelivr.com/package/gh/huecoder/snow-cap)

SnowCap.js scans the silhouette of an element and lays a procedurally generated layer of snow on top of every visible peak — letters, button outlines, mountain SVGs, anything. No CSS edits, no manual hand-placement, no images.

---

## Live Demo

**[Open the playground →](https://huecoder.github.io/snow-cap/)**

The demo lets you spawn text, buttons, and SVG icons, drag them around, tune every parameter live, and copy the resulting init code straight into your project.

---

## Highlights

- **Topography aware** — scans element pixels and only places snow on top edges.
- **Zero dependencies** — single ~6 KB gzipped file. No build step required.
- **Highly tunable** — size, density, dome bias, slope cutoff, wind lean, sparkle, icicles, etc.
- **Auto-responsive** — uses `ResizeObserver` to redraw when the host resizes.
- **Per-instance lifecycle** — `update()`, `refresh()`, `destroy()`.
- **Works with text, buttons, raw boxes, and inline SVGs.**

---

## Install

### CDN

```html
<script src="https://cdn.jsdelivr.net/gh/huecoder/snow-cap@main/snow-cap.js"></script>
```

### Local

```bash
git clone https://github.com/huecoder/snow-cap.git
```

```html
<script src="snow-cap.js"></script>
```

The library exposes a global `SnowCap` (browser), and supports CommonJS / AMD if you load it through a bundler.

---

## Quick Start

```html
<button class="frosted">Buy Now</button>

<script src="snow-cap.js"></script>
<script>
  const snow = new SnowCap('.frosted', {
    size: 14,
    density: 0.95,
    blur: 3,
    color: '#ffffff'
  });
</script>
```

Apply to many elements at once:

```js
SnowCap.applyAll('.snowy', { size: 10, density: 0.9 });
```

---

## Configuration

All options are optional. Pass any subset:

| Option           | Type    | Default     | Description |
| ---------------- | ------- | ----------- | ----------- |
| `size`           | number  | `12`        | Base diameter of a snow blob (px). |
| `height`         | number  | `1.0`       | Vertical scale of blobs (1 = circle, 0.6 = oval). |
| `density`        | number  | `1.0`       | Probability that a column gets snow (0..1). |
| `resolution`     | number  | `2`         | Scan step in px. Smaller = denser detail, slower. |
| `roughness`      | number  | `3`         | Random vertical jitter (px). |
| `bias`           | number  | `0.5`       | Dome effect — less snow toward the horizontal edges (0..1). |
| `edgePadding`    | number  | `2`         | Ignore this many px near the silhouette edges. |
| `maxAngle`       | number  | `80`        | Skip surfaces steeper than this many degrees. |
| `offsetY`        | number  | `0`         | Vertical offset of the entire cap (px). |
| `wind`           | number  | `0`         | Horizontal lean of every blob, `-1..1`. |
| `color`          | string  | `'#ffffff'` | Snow color (any CSS color). |
| `blur`           | number  | `3`         | Gooey blur amount (px). `0` disables it. |
| `shadow`         | boolean | `false`     | Soft drop shadow under each blob. |
| `icicles`        | number  | `0`         | Probability per peak of spawning an icicle (0..1). |
| `icicleLength`   | number  | `14`        | Max icicle length (px). |
| `sparkle`        | boolean | `false`     | Animated twinkles on top of the cap. |
| `sparkleCount`   | number  | `8`         | Number of twinkles. |
| `sparkleColor`   | string  | `'#ffffff'` | Twinkle color. |
| `threshold`      | number  | `50`        | Alpha threshold (0..255) used to scan the silhouette. |
| `autoResize`     | boolean | `true`      | Re-render automatically when the host resizes. |
| `seed`           | number  | `null`      | Pass a number for a repeatable cap layout; `null` randomizes. |

### Presets used in the playground

```js
const PRESETS = {
  'Light Dust':  { size: 8,  density: 0.7, blur: 2, bias: 0.4, roughness: 2 },
  'Heavy Snow':  { size: 18, density: 1.0, blur: 4, bias: 0.3, roughness: 4 },
  'Frosty':      { size: 6,  density: 1.0, blur: 1, bias: 0.6, sparkle: true, sparkleCount: 14 },
  'Fluffy Caps': { size: 22, density: 0.95, blur: 6, bias: 0.55, roughness: 5 },
  'Icy Edge':    { size: 10, density: 0.9, blur: 2, icicles: 0.6, icicleLength: 22 },
  'Windswept':   { size: 14, density: 0.85, blur: 3, wind: 0.6 },
  'Festive':     { size: 14, density: 1.0, blur: 3, sparkle: true, sparkleColor: '#ffe89e',
                   icicles: 0.3, icicleLength: 16 }
};
```

---

## API

### `new SnowCap(target, options?)`

Creates and applies a snow cap. `target` is an `Element` or a CSS selector string.

```js
const snow = new SnowCap('#hero-title', { size: 16, sparkle: true });
```

### `snow.update(partialOptions)`

Merge new options into the instance and repaint. Cheaper than recreating.

```js
snow.update({ density: 0.6, color: '#e8f4ff' });
```

`snow.setOptions(...)` is provided as an alias for backwards compatibility with v1.x.

### `snow.refresh()`

Force a re-scan and repaint without changing options. Useful if the host element's *content* changed (e.g. you swapped the inner text and want the cap to re-shape). Size changes are picked up automatically when `autoResize: true`.

### `snow.destroy()`

Removes the snow layer and the SVG filter from the DOM, disconnects observers, and releases references. Call this when the host element is removed.

### `SnowCap.applyAll(selector, options?)`

Applies SnowCap to every element matching the selector. Returns an array of instances.

```js
const all = SnowCap.applyAll('.snowy', { density: 0.9 });
all.forEach(s => s.update({ blur: 4 }));
```

### `SnowCap.version`, `SnowCap.defaults`

The library version string and the default options object.

---

## Recipes

### Christmas hero text

```js
new SnowCap('#hero h1', {
  size: 22,
  density: 1.0,
  blur: 5,
  bias: 0.45,
  sparkle: true,
  sparkleCount: 18,
  sparkleColor: '#ffe89e'
});
```

### Frosted call-to-action

```js
new SnowCap('.cta-buy', {
  size: 10,
  blur: 2,
  shadow: true,
  icicles: 0.4,
  icicleLength: 14
});
```

### Skyline of UI buttons

```js
SnowCap.applyAll('.btn', {
  size: 8,
  density: 0.85,
  blur: 2,
  bias: 0.6
});
```

### Repeatable layouts

Useful for SSR snapshots or visual regression tests:

```js
new SnowCap('.logo', { seed: 42 });
```

---

## Notes

- For text-based caps, add the class `obj-text` (or use a heading tag `H1`–`H6`) so the library uses canvas text rasterization. Otherwise it treats the element as a rounded box.
- For SVG-based caps, place the SVG as a direct child of the element. The library serializes and rasterizes it at the element's size.
- The blobs are rendered as absolutely positioned divs inside an injected `.snow-cap-layer`. They use a single `feGaussianBlur + feColorMatrix` SVG filter (per instance) to glue themselves into a smooth gooey shape.
- The host element is forced to `position: relative` if it was `static`.

---

## Browser Support

Modern evergreen browsers (Chrome, Edge, Firefox, Safari). The library uses:

- `Canvas2D` + `getImageData` for silhouette scanning.
- SVG filters for the gooey effect.
- `ResizeObserver` (with a graceful fallback to manual `refresh()`).

---

## Development

```bash
git clone https://github.com/huecoder/snow-cap.git
cd snow-cap
# any static server works
python3 -m http.server 8000
```

Open `http://localhost:8000/` in a browser. The playground in `index.html` loads `snow-cap.js` directly.

---

## Changelog

### 2.0.0
- New options: `wind`, `icicles`, `icicleLength`, `sparkle`, `sparkleCount`, `sparkleColor`, `shadow`, `threshold`, `autoResize`, `seed`.
- New API: `destroy()`, `SnowCap.applyAll()`, `SnowCap.version`, `SnowCap.defaults`.
- Auto-redraw on host resize via `ResizeObserver`.
- UMD wrapper (browser global / CommonJS / AMD).
- New playground (`index.html`) with layers panel, preset library, copy-as-code, animated background.
- README rewritten with full option reference and recipes.

### 1.4.0
- Initial public release.

---

## License

[MIT](LICENSE) © [huecoder](https://huecoder.lol)
