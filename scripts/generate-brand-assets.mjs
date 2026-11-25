import { readFile, writeFile, copyFile } from "node:fs/promises";
import sharp from "sharp";

// The approved Version 1 SVG is the sole artwork source. Do not redraw it.
const directory = new URL("../public/brand/lenaqar-v1/", import.meta.url);
const master = await readFile(new URL("lenaqar-v1.svg", directory));
const sizes = [96, 180, 192, 512];
for (const size of sizes) {
  await sharp(master).resize(size, size).png().toFile(
    new URL(`icon-${size}.png`, directory).pathname,
  );
}

// ICO directory with three independent PNG-encoded image entries.
const frames = await Promise.all([16, 32, 48].map(async (size) => ({
  size,
  png: await sharp(master).resize(size, size).png().toBuffer(),
})));
const header = Buffer.alloc(6 + frames.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(frames.length, 4);
let offset = header.length;
frames.forEach(({ size, png }, index) => {
  const entry = 6 + index * 16;
  header[entry] = size;
  header[entry + 1] = size;
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(png.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += png.length;
});
await writeFile(new URL("favicon.ico", directory), Buffer.concat([header, ...frames.map(({ png }) => png)]));
await copyFile(new URL("favicon.ico", directory), new URL("../public/favicon.ico", import.meta.url));
await copyFile(new URL("lenaqar-v1.svg", directory), new URL("../public/favicon.svg", import.meta.url));
await copyFile(new URL("icon-180.png", directory), new URL("../public/apple-touch-icon.png", import.meta.url));

// Generous white space retains the supplied artwork's proportions and padding.
const icon = await sharp(master).resize(430, 430).png().toBuffer();
const typography = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <text x="580" y="292" font-family="Arial, sans-serif" font-size="90" font-weight="700" fill="#23335c">Lenaqar</text>
  <text x="584" y="365" font-family="Arial, sans-serif" font-size="36" fill="#4b5c7d">Your home. Your choice.</text>
</svg>`);
await sharp({ create: { width: 1200, height: 630, channels: 3, background: "#fff" } })
  .composite([{ input: icon, left: 90, top: 100 }, { input: typography, left: 0, top: 0 }])
  .png()
  .toFile(new URL("social-preview.png", directory).pathname);

// The live instructional illustrations also contained two old Lenaqar marks.
// Retain the original illustrations as historical sources, replacing only the
// embedded brand squares with direct SVG renders (including its white ground).
for (const audience of ["buyer", "seller-broker"]) {
  const source = new URL(`../designs/lenaqar-icon/history/flow-${audience}.png`, import.meta.url);
  await sharp(source.pathname)
    .composite([
      { input: await sharp(master).resize(80, 80).png().toBuffer(), left: 946, top: 44 },
      { input: await sharp(master).resize(44, 44).png().toBuffer(), left: 114, top: 343 },
    ])
    .png()
    .toFile(new URL(`flow-${audience}.png`, directory).pathname);
}
console.log("Generated Lenaqar Version 1 icons and 1200×630 social preview.");
