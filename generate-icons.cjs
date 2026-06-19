// Génère des icônes PNG placeholder simples pour le manifeste Office Add-in
// Utilise uniquement les modules natifs de Node.js (zlib pour PNG, pas de dépendances externes)

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function makePng(size, r, g, b) {
  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // Image data: each row prefixed with filter byte 0
  const rowLen = size * 3 + 1;
  const raw = Buffer.alloc(rowLen * size);
  for (let y = 0; y < size; y++) {
    raw[y * rowLen] = 0; // filter
    for (let x = 0; x < size; x++) {
      const off = y * rowLen + 1 + x * 3;
      // Simple gradient/diagonal for visual interest
      const t = (x + y) / (2 * size);
      raw[off] = Math.round(r * (1 - t * 0.3));
      raw[off + 1] = Math.round(g * (1 - t * 0.3));
      raw[off + 2] = Math.round(b * (1 - t * 0.3));
    }
  }
  const idat = zlib.deflateSync(raw);

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const assetsDir = path.join(__dirname, "public", "assets");
fs.mkdirSync(assetsDir, { recursive: true });

// Blue color matching Fluent UI accent
const r = 0,
  g = 120,
  b = 212;

const sizes = [16, 32, 64, 80, 128];
for (const size of sizes) {
  const png = makePng(size, r, g, b);
  const filename = `icon-${size}.png`;
  fs.writeFileSync(path.join(assetsDir, filename), png);
  console.log(`Generated ${filename} (${png.length} bytes)`);
}

console.log("All icons generated in public/assets/");
