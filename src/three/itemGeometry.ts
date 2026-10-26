import * as THREE from "three/webgpu";

/** Pixel colours from scripts/sprites.mjs: 8 hex digits (RGBA) per pixel, rows top to bottom. */
export type Sprite = { w: number; h: number; front: string; back?: string };

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

/**
 * Extrudes a sprite the way Minecraft draws held items: each opaque pixel
 * becomes a slab one pixel thick, and an edge pixel colours the side it faces.
 * One geometry with vertex colours; `uv` spans the sprite, for the glint.
 */
export function buildItemGeometry(sprite: Sprite, pixel = 0.1): THREE.BufferGeometry {
  const { w, h } = sprite;
  const rgba = (hex: string, x: number, y: number) => {
    const i = (y * w + x) * 8;
    return [0, 2, 4, 6].map((o) => Number.parseInt(hex.slice(i + o, i + o + 2), 16) / 255);
  };
  const opaque = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && rgba(sprite.front, x, y)[3] > 0.1;

  const pos: number[] = [];
  const nor: number[] = [];
  const col: number[] = [];
  const uv: number[] = [];
  const quad = (corners: number[][], normal: number[], c: number[], u: number, v: number) => {
    for (const i of [0, 1, 2, 0, 2, 3]) {
      pos.push(...corners[i]);
      nor.push(...normal);
      col.push(toLinear(c[0]), toLinear(c[1]), toLinear(c[2]));
      uv.push(u, v);
    }
  };

  const t = pixel / 2;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!opaque(x, y)) continue;
      const x0 = (x - w / 2) * pixel;
      const x1 = x0 + pixel;
      const y0 = (h / 2 - y - 1) * pixel;
      const y1 = y0 + pixel;
      const c = rgba(sprite.front, x, y);
      // Seen from behind, the back image's columns run right to left.
      const back = sprite.back ? rgba(sprite.back, w - 1 - x, y) : c;
      const u = (x + 0.5) / w;
      const v = 1 - (y + 0.5) / h;
      quad([[x0, y0, t], [x1, y0, t], [x1, y1, t], [x0, y1, t]], [0, 0, 1], c, u, v);
      quad([[x1, y0, -t], [x0, y0, -t], [x0, y1, -t], [x1, y1, -t]], [0, 0, -1], back, u, v);
      if (!opaque(x, y - 1)) quad([[x0, y1, t], [x1, y1, t], [x1, y1, -t], [x0, y1, -t]], [0, 1, 0], c, u, v);
      if (!opaque(x, y + 1)) quad([[x0, y0, -t], [x1, y0, -t], [x1, y0, t], [x0, y0, t]], [0, -1, 0], c, u, v);
      if (!opaque(x + 1, y)) quad([[x1, y0, t], [x1, y0, -t], [x1, y1, -t], [x1, y1, t]], [1, 0, 0], c, u, v);
      if (!opaque(x - 1, y)) quad([[x0, y0, -t], [x0, y0, t], [x0, y1, t], [x0, y1, -t]], [-1, 0, 0], c, u, v);
    }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.computeBoundingSphere();
  return g;
}
