// Reads item textures from an unzipped resource pack and writes:
//   src/data/sprites.json  pixel colours for the 3D item models
//   assets/icons/<id>.png  the same sprites scaled 4x with sharp pixels, for 2D icons
//   assets/glint.png       the enchantment glint
// Usage: node scripts/sprites.mjs <unzipped pack folder>
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PNG } from "pngjs";

const pack = process.argv[2];
if (!pack) throw new Error("Pass the unzipped resource pack folder");
const tex = (p) => join(pack, "assets/minecraft/textures", p);

const SPRITES = {
  sword: { file: "item/netherite_sword.png" },
  axe: { file: "item/netherite_axe.png" },
  pickaxe: { file: "item/netherite_pickaxe.png" },
  shovel: { file: "item/netherite_shovel.png" },
  hoe: { file: "item/netherite_hoe.png" },
  bow: { file: "item/bow.png" },
  crossbow: { file: "item/crossbow_standby.png" },
  trident: { file: "item/trident.png" },
  fishing_rod: { file: "item/fishing_rod.png" },
  helmet: { file: "item/netherite_helmet.png" },
  chestplate: { file: "item/netherite_chestplate.png" },
  leggings: { file: "item/netherite_leggings.png" },
  boots: { file: "item/netherite_boots.png" },
  elytra: { file: "item/elytra.png" },
  book: { file: "item/enchanted_book.png" },
  // The shield has no item sprite: its 12x22 plate is cut from the entity texture (box UV layout).
  shield: { file: "entity/shield/shield_base_nopattern.png", front: [1, 1, 12, 22], back: [14, 1, 12, 22] },
};

function crop(png, [x0, y0, w, h]) {
  let hex = "";
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++) {
      const i = (y * png.width + x) * 4;
      for (let c = 0; c < 4; c++) hex += png.data[i + c].toString(16).padStart(2, "0");
    }
  return hex;
}

function upscale(hex, w, h, k) {
  const out = new PNG({ width: w * k, height: h * k });
  for (let y = 0; y < h * k; y++)
    for (let x = 0; x < w * k; x++) {
      const s = (Math.floor(y / k) * w + Math.floor(x / k)) * 8;
      const d = (y * w * k + x) * 4;
      for (let c = 0; c < 4; c++) out.data[d + c] = Number.parseInt(hex.slice(s + c * 2, s + c * 2 + 2), 16);
    }
  return PNG.sync.write(out);
}

mkdirSync("src/data", { recursive: true });
mkdirSync("assets/icons", { recursive: true });
const data = {};
for (const [id, s] of Object.entries(SPRITES)) {
  const png = PNG.sync.read(readFileSync(tex(s.file)));
  const front = s.front ?? [0, 0, png.width, png.height];
  const [, , w, h] = front;
  data[id] = { w, h, front: crop(png, front), ...(s.back && { back: crop(png, s.back) }) };
  writeFileSync(`assets/icons/${id}.png`, upscale(data[id].front, w, h, 4));
}
writeFileSync("src/data/sprites.json", `${JSON.stringify(data)}\n`);
copyFileSync(tex("misc/enchanted_glint_item.png"), "assets/glint.png");
console.log(`wrote ${Object.keys(data).length} sprites`);
