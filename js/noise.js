/**
 * @file noise.js
 * @description 2D Perlin noise utility for organic particle motion.
 */

class PerlinNoise {
  constructor() {
    this._p = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this._p[i], this._p[j]] = [this._p[j], this._p[i]];
    }
    this._perm = [...this._p, ...this._p];
  }
  _fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  _lerp(a, b, t) { return a + t * (b - a); }
  _grad(hash, x, y) {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  }
  get(x, y) {
    const X  = Math.floor(x) & 255;
    const Y  = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u  = this._fade(xf);
    const v  = this._fade(yf);
    const n00 = this._grad(this._perm[X     + this._perm[Y    ]], xf,     yf    );
    const n10 = this._grad(this._perm[X + 1 + this._perm[Y    ]], xf - 1, yf    );
    const n01 = this._grad(this._perm[X     + this._perm[Y + 1]], xf,     yf - 1);
    const n11 = this._grad(this._perm[X + 1 + this._perm[Y + 1]], xf - 1, yf - 1);
    return this._lerp(this._lerp(n00, n10, u), this._lerp(n01, n11, u), v);
  }
  fbm(x, y, octaves = 4) {
    let value = 0, amplitude = 0.5, frequency = 1, maxVal = 0;
    for (let i = 0; i < octaves; i++) {
      value    += this.get(x * frequency, y * frequency) * amplitude;
      maxVal   += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return value / maxVal;
  }
}
const noise = new PerlinNoise();
