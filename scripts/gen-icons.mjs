// Generates simple branded PNG icons for the PWA manifest.
// Runs once during setup; the output PNGs are committed, the script is not.

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "..", "public");
mkdirSync(outDir, { recursive: true });

const BG = [10, 13, 15];
const ACCENT = [184, 243, 61];
const WHITE = [245, 247, 248];
const sizes = [192, 512];

function crc32(data) {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = (crc ^ data[i]) >>> 0;
    for (let k = 0; k < 8; k++) {
      crc = (crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1) >>> 0;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Array.from(Buffer.from(type, "latin1"));
  const body = data instanceof Uint8Array ? Array.from(data) : data;
  const length = Buffer.alloc(4);
  length.writeUInt32BE(body.length, 0);
  const crcData = [...typeBytes, ...body];
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);
  return [...length, ...typeBytes, ...body, ...crc];
}

function chefHat(width, height) {
  const canvas = Array.from({ length: width * height }, () => BG[0]);

  const markW = Math.round(width * 0.52);
  const markH = Math.round(width * 0.52);
  const markX = Math.round((width - markW) / 2);
  const markY = Math.round((height - markH) / 2);
  for (let i = 0; i < markW * markH; i++) canvas[i] = ACCENT[0];

  const hatTop = Math.round(markY - width * 0.16);
  const brimY = Math.round(markY + markH * 0.22);
  const brimW = Math.round(markW * 0.9);
  const brimX = Math.round((markW - brimW) / 2) + markX;
  const center = brimX + brimW / 2;
  const domeH = width * 0.16;
  for (let py = hatTop; py <= brimY; py++) {
    for (let px = brimX; px < brimX + brimW; px++) {
      const relX = px - center;
      if (Math.abs(relX) <= domeH) {
        const idx = py * width + px;
        if (idx >= 0 && idx < canvas.length) canvas[idx] = WHITE[0];
      }
    }
  }

  const fcx = Math.round(width / 2);
  const fcy = Math.round(markY + markH * 0.55);
  const fr = Math.round(markH * 0.16);
  for (let py = fcy - fr; py <= fcy + fr; py++) {
    for (let px = fcx - fr; px <= fcx + fr; px++) {
      const idx = py * width + px;
      if (
        idx >= 0 &&
        idx < canvas.length &&
        Math.hypot(px - fcx, py - fcy) <= fr
      ) {
        canvas[idx] = WHITE[0];
      }
    }
  }

  return Uint8Array.from(canvas);
}

function buildPng(width, height) {
  const pixels = chefHat(width, height);
  const premultiplied = pixels.map((a) => {
    const alpha = a / 255;
    const r = (a >> 16) & 0xff;
    const g = (a >> 8) & 0xff;
    const b = a & 0xff;
    return [
      Math.round(r * alpha),
      Math.round(g * alpha),
      Math.round(b * alpha),
      a,
    ];
  });

  const raw = [];
  for (let y = 0; y < height; y++) {
    raw.push(0);
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      raw.push(
        premultiplied[i][0],
        premultiplied[i][1],
        premultiplied[i][2],
        premultiplied[i][3],
      );
    }
  }

  const filtered = deflateSync(Uint8Array.from(raw));
  const ihdr = [
    (width >>> 24) & 0xff,
    (width >>> 16) & 0xff,
    (width >>> 8) & 0xff,
    width & 0xff,
    (height >>> 24) & 0xff,
    (height >>> 16) & 0xff,
    (height >>> 8) & 0xff,
    height & 0xff,
    8,
    6,
    0,
    0,
    0,
  ];
  const png = [
    ...[137, 80, 78, 71, 13, 10, 26, 10],
    ...chunk("IHDR", ihdr),
    ...chunk("IDAT", filtered),
    ...chunk("IEND", []),
  ];
  return Buffer.from(png);
}

for (const size of sizes) {
  const buffer = buildPng(size, size);
  const file = resolve(outDir, `pwa-${size}.png`);
  writeFileSync(file, buffer);
  console.log(`Wrote ${file} (${buffer.length} bytes)`);
}
