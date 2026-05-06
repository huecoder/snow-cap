/*!
 * SnowCap.js v2.0.0
 * Procedural, topography-aware snow caps for any DOM element.
 * Zero dependencies. Vanilla JS. UMD.
 *
 * @license MIT
 * @see https://github.com/huecoder/snow-cap
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else {
        root.SnowCap = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var VERSION = '2.0.0';
    var _filterCounter = 0;
    var _sparkleStyleInjected = false;

    /**
     * Default options for SnowCap.
     * @type {Object}
     */
    var DEFAULTS = {
        // --- Geometry ---
        size: 12,            // base diameter of a snow blob (px)
        height: 1.0,         // vertical scale of blobs (1 = circle, 0.6 = oval)
        density: 1.0,        // probability that a scan column gets a blob (0..1)
        resolution: 2,       // scan step in px (smaller = denser detail)
        roughness: 3,        // random vertical jitter (px)
        bias: 0.5,           // "dome" effect: less snow towards edges (0..1)
        edgePadding: 2,      // ignore this many px near the silhouette edges
        maxAngle: 80,        // skip surfaces steeper than this many degrees
        offsetY: 0,          // vertical offset of the entire cap (px)
        wind: 0,             // horizontal lean of every blob (-1..1)

        // --- Appearance ---
        color: '#ffffff',    // snow color (any CSS color)
        blur: 3,             // gooey blur amount (px); 0 disables the effect
        shadow: false,       // soft drop shadow under each blob

        // --- Effects ---
        icicles: 0,          // probability per peak of spawning an icicle (0..1)
        icicleLength: 14,    // max icicle length (px)
        sparkle: false,      // animated twinkles on top of the cap
        sparkleCount: 8,     // number of twinkles
        sparkleColor: '#ffffff',

        // --- Behavior ---
        threshold: 50,       // alpha threshold (0..255) used to scan the silhouette
        autoResize: true,    // re-render when the host element resizes
        seed: null           // null => non-deterministic; pass a number for repeatable layout
    };

    /**
     * @param {Element|string} element  Target element or CSS selector
     * @param {Partial<typeof DEFAULTS>} [options]
     */
    function SnowCap(element, options) {
        if (!(this instanceof SnowCap)) return new SnowCap(element, options);

        this.el = typeof element === 'string' ? document.querySelector(element) : element;
        if (!this.el) throw new Error('[SnowCap] Element not found: ' + element);

        this.options = Object.assign({}, DEFAULTS, options || {});
        if (this.options.seed === null || this.options.seed === undefined) {
            this.options.seed = Math.random() * 1000;
        }

        this.filterId = 'snow-f-' + Date.now().toString(36) + '-' + (_filterCounter++).toString(36);

        // Back-compat alias for users coming from v1.x.
        this.setOptions = this.update.bind(this);

        this._init();
    }

    SnowCap.version = VERSION;
    SnowCap.defaults = DEFAULTS;

    /**
     * Apply SnowCap to every element matching `selector`.
     * @param {string} selector
     * @param {Partial<typeof DEFAULTS>} [options]
     * @returns {SnowCap[]}
     */
    SnowCap.applyAll = function (selector, options) {
        var nodes = document.querySelectorAll(selector);
        var out = [];
        for (var i = 0; i < nodes.length; i++) out.push(new SnowCap(nodes[i], options));
        return out;
    };

    SnowCap.prototype._init = function () {
        // Filtered layer holds blobs + icicles (gooey blur joins them into smooth shapes).
        this.layer = document.createElement('div');
        this.layer.className = 'snow-cap-layer';
        this.layer.style.cssText =
            'position:absolute;inset:0;width:100%;height:100%;' +
            'pointer-events:none;z-index:20;filter:url(#' + this.filterId + ');';

        // Unfiltered FX layer holds sparkles so they stay sharp.
        this.fxLayer = document.createElement('div');
        this.fxLayer.className = 'snow-cap-fx-layer';
        this.fxLayer.style.cssText =
            'position:absolute;inset:0;width:100%;height:100%;' +
            'pointer-events:none;z-index:21;';

        if (getComputedStyle(this.el).position === 'static') {
            this.el.style.position = 'relative';
        }
        this.el.appendChild(this.layer);
        this.el.appendChild(this.fxLayer);

        this._injectFilter();

        if (this.options.autoResize && typeof ResizeObserver !== 'undefined') {
            var self = this;
            this._resizeObserver = new ResizeObserver(function () {
                if (self._resizeRaf) cancelAnimationFrame(self._resizeRaf);
                self._resizeRaf = requestAnimationFrame(function () { self.refresh(); });
            });
            this._resizeObserver.observe(this.el);
        }

        // Initial render.
        var self2 = this;
        requestAnimationFrame(function () { self2.refresh(); });
    };

    SnowCap.prototype._injectFilter = function () {
        var NS = 'http://www.w3.org/2000/svg';
        var svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('aria-hidden', 'true');
        svg.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none;';

        var defs = document.createElementNS(NS, 'defs');
        var filter = document.createElementNS(NS, 'filter');
        filter.id = this.filterId;

        var blur = document.createElementNS(NS, 'feGaussianBlur');
        blur.setAttribute('in', 'SourceGraphic');
        blur.setAttribute('stdDeviation', this.options.blur);
        blur.setAttribute('result', 'blur');
        filter.appendChild(blur);

        var matrix = document.createElementNS(NS, 'feColorMatrix');
        matrix.setAttribute('in', 'blur');
        matrix.setAttribute('mode', 'matrix');
        matrix.setAttribute('values', '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9');
        filter.appendChild(matrix);

        defs.appendChild(filter);
        svg.appendChild(defs);
        document.body.appendChild(svg);

        this._svgRoot = svg;
        this._filterEl = blur;
    };

    /**
     * Update options and re-render. Accepts a partial options object.
     * @param {Partial<typeof DEFAULTS>} newOpts
     */
    SnowCap.prototype.update = function (newOpts) {
        Object.assign(this.options, newOpts || {});
        if (this._filterEl) this._filterEl.setAttribute('stdDeviation', this.options.blur);
        this.refresh();
    };

    SnowCap.prototype._mulberry32 = function (a) {
        return function () {
            var t = a += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    };

    /**
     * Force a re-scan of the host element and repaint.
     */
    SnowCap.prototype.refresh = function () {
        var self = this;
        requestAnimationFrame(function () { self._render(); });
    };

    SnowCap.prototype._render = async function () {
        if (!this.el || !this.layer) return;

        var w = this.el.offsetWidth;
        var h = this.el.offsetHeight;
        if (!w || !h) return;

        var cvs = document.createElement('canvas');
        cvs.width = w;
        cvs.height = h;
        var ctx = cvs.getContext('2d', { willReadFrequently: true });
        var st = window.getComputedStyle(this.el);

        ctx.clearRect(0, 0, w, h);

        // --- Rasterize the silhouette of the host element ---
        if (this.el.classList.contains('obj-text') || (this.el.tagName && /^H[1-6]$/.test(this.el.tagName))) {
            ctx.font = st.fontWeight + ' ' + st.fontSize + ' ' + st.fontFamily;
            ctx.fillStyle = '#ff0000';
            ctx.textBaseline = 'top';
            ctx.fillText(this.el.innerText, parseFloat(st.paddingLeft) || 0, parseFloat(st.paddingTop) || 0);
        } else if (this.el.querySelector('svg')) {
            var svgNode = this.el.querySelector('svg');
            var svgClone = svgNode.cloneNode(true);
            svgClone.setAttribute('width', w);
            svgClone.setAttribute('height', h);
            var xml = new XMLSerializer().serializeToString(svgClone);
            var img = new Image();
            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml)));
            await new Promise(function (r) { img.onload = r; img.onerror = r; });
            ctx.drawImage(img, 0, 0, w, h);
        } else {
            ctx.fillStyle = '#ff0000';
            var br = parseFloat(st.borderRadius) || 0;
            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
                ctx.roundRect(0, 0, w, h, br);
            } else {
                ctx.rect(0, 0, w, h);
            }
            ctx.fill();
        }

        // --- Build a topography map: top-most opaque y for each x column ---
        var idata = ctx.getImageData(0, 0, w, h).data;
        var map = new Int16Array(w);
        var T = this.options.threshold;
        for (var x = 0; x < w; x++) {
            map[x] = -1;
            for (var y = 0; y < h; y++) {
                if (idata[(y * w + x) * 4 + 3] > T) {
                    map[x] = y;
                    break;
                }
            }
        }

        // --- Paint ---
        this.layer.innerHTML = '';
        this.fxLayer.innerHTML = '';
        var seedInt = Math.floor(this.options.seed) >>> 0;
        var rand = this._mulberry32(seedInt || 1);
        var blobFrag = document.createDocumentFragment();
        var fxFrag = document.createDocumentFragment();

        this._paintSnow(blobFrag, map, w, h, rand);
        this._paintIcicles(blobFrag, map, w, h, rand);
        this._paintSparkles(fxFrag, map, w, h, rand);

        this.layer.appendChild(blobFrag);
        this.fxLayer.appendChild(fxFrag);
    };

    SnowCap.prototype._paintSnow = function (frag, map, w, h, rand) {
        var o = this.options;
        var res = Math.max(1, o.resolution);
        var pad = o.edgePadding;
        var maxAngleRad = o.maxAngle * (Math.PI / 180);
        var wind = Math.max(-1, Math.min(1, o.wind));

        for (var x = 0; x < w; x += res) {
            var y = map[x];
            if (y === -1) continue;
            if (x < pad || x > w - pad) continue;
            if (map[x - pad] === -1 || map[x + pad] === -1) continue;
            if (rand() > o.density) continue;

            // Slope check.
            var lookAhead = Math.min(w - 1, x + res);
            var nextY = map[lookAhead];
            if (nextY !== -1) {
                var dy = Math.abs(nextY - y);
                var angle = Math.atan2(dy, res);
                if (angle > maxAngleRad) continue;
            }

            // Dome bias: less snow toward horizontal edges.
            var nx = (x / w) * 2 - 1;
            var dome = 1 - (Math.abs(nx) * o.bias);
            if (dome <= 0) continue;

            var s = (o.size * (0.8 + rand() * 0.4)) * dome;
            var jitter = (rand() - 0.5) * o.roughness;
            var xOffset = wind * s * 0.5;

            var blob = document.createElement('div');
            blob.style.cssText =
                'position:absolute;' +
                'left:' + (x + xOffset) + 'px;' +
                'top:' + (y + o.offsetY - (s / 2) + jitter) + 'px;' +
                'width:' + s + 'px;' +
                'height:' + (s * o.height) + 'px;' +
                'background:' + o.color + ';' +
                'border-radius:50%;' +
                'transform:translate(-50%,0);' +
                (o.shadow ? 'box-shadow:0 1px 2px rgba(0,0,0,0.35);' : '');
            frag.appendChild(blob);
        }
    };

    SnowCap.prototype._paintIcicles = function (frag, map, w, h, rand) {
        var o = this.options;
        if (!o.icicles || o.icicles <= 0) return;
        var step = Math.max(8, o.resolution * 4);

        for (var x = step; x < w - step; x += step) {
            if (map[x] === -1) continue;
            if (rand() > o.icicles) continue;

            var y = map[x] + o.offsetY + o.size * 0.3;
            var len = (0.4 + rand() * 0.6) * o.icicleLength;
            var baseW = Math.max(2, o.size * 0.4);

            var ic = document.createElement('div');
            ic.style.cssText =
                'position:absolute;' +
                'left:' + x + 'px;' +
                'top:' + y + 'px;' +
                'width:' + baseW + 'px;' +
                'height:' + len + 'px;' +
                'background:' + o.color + ';' +
                'transform:translate(-50%,0);' +
                'clip-path:polygon(0 0, 100% 0, 50% 100%);';
            frag.appendChild(ic);
        }
    };

    SnowCap.prototype._paintSparkles = function (frag, map, w, h, rand) {
        var o = this.options;
        if (!o.sparkle) return;

        if (!_sparkleStyleInjected && typeof document !== 'undefined') {
            var style = document.createElement('style');
            style.id = 'snow-cap-sparkle-style';
            style.textContent =
                '@keyframes snow-cap-sparkle{' +
                '0%,100%{opacity:0;transform:translate(-50%,-50%) scale(.5) rotate(0deg)}' +
                '50%{opacity:1;transform:translate(-50%,-50%) scale(1) rotate(45deg)}}';
            document.head.appendChild(style);
            _sparkleStyleInjected = true;
        }

        var peaks = [];
        for (var x = 4; x < w - 4; x += 4) {
            if (map[x] !== -1) peaks.push(x);
        }
        if (!peaks.length) return;

        var count = Math.min(peaks.length, o.sparkleCount);
        for (var i = 0; i < count; i++) {
            var idx = Math.floor(rand() * peaks.length);
            var px = peaks[idx];
            var py = map[px] + o.offsetY - 2;
            var size = 3 + rand() * 4;
            var delay = rand() * 2;
            var dur = 1.5 + rand() * 2;

            var sp = document.createElement('div');
            sp.style.cssText =
                'position:absolute;' +
                'left:' + px + 'px;' +
                'top:' + py + 'px;' +
                'width:' + size + 'px;' +
                'height:' + size + 'px;' +
                'background:' + o.sparkleColor + ';' +
                'border-radius:50%;' +
                'box-shadow:0 0 ' + (size * 2) + 'px ' + o.sparkleColor + ';' +
                'animation:snow-cap-sparkle ' + dur + 's ease-in-out ' + delay + 's infinite;' +
                'transform:translate(-50%,-50%);';
            frag.appendChild(sp);
        }
    };

    /**
     * Permanently remove the snow layer and its associated SVG filter from the DOM.
     */
    SnowCap.prototype.destroy = function () {
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }
        if (this._resizeRaf) cancelAnimationFrame(this._resizeRaf);
        if (this.layer && this.layer.parentNode) this.layer.parentNode.removeChild(this.layer);
        if (this.fxLayer && this.fxLayer.parentNode) this.fxLayer.parentNode.removeChild(this.fxLayer);
        if (this._svgRoot && this._svgRoot.parentNode) this._svgRoot.parentNode.removeChild(this._svgRoot);
        this.el = null;
        this.layer = null;
        this.fxLayer = null;
        this._svgRoot = null;
        this._filterEl = null;
    };

    return SnowCap;
}));
