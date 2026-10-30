export type EnchantType = "normal" | "unique" | "spell" | "curse";

export type Enchant = {
  id: string;
  name: string;
  maxLevel: number;
  type: EnchantType;
  rarity: string;
  cost: number;
  appliesTo: string[];
  requirements: string[];
  conflicts: string[];
  description: string;
  /** Minecraft's own enchantments: they don't use the Unique or Spell slots. */
  vanilla?: boolean;
};

export type Item = { id: string; label: string; tags: string[] };

export type Limits = { total: number; unique: number; spell: number };

/** Targets you can enchant. `tags` match the "Applies to" names in the data. */
export const ITEMS: Item[] = [
  { id: "sword", label: "Sword", tags: ["Swords"] },
  { id: "axe", label: "Axe", tags: ["Axes"] },
  { id: "pickaxe", label: "Pickaxe", tags: ["Pickaxes"] },
  { id: "shovel", label: "Shovel", tags: ["Shovels"] },
  { id: "hoe", label: "Hoe", tags: ["Hoes"] },
  { id: "bow", label: "Bow", tags: ["Bows"] },
  { id: "crossbow", label: "Crossbow", tags: ["Crossbows"] },
  { id: "trident", label: "Trident", tags: ["Tridents"] },
  { id: "fishing_rod", label: "Fishing Rod", tags: ["Fishing Rods"] },
  { id: "helmet", label: "Helmet", tags: ["Helmets", "Armor"] },
  { id: "chestplate", label: "Chestplate", tags: ["Chestplates", "Armor"] },
  { id: "leggings", label: "Leggings", tags: ["Leggings", "Armor"] },
  { id: "boots", label: "Boots", tags: ["Boots", "Armor"] },
  { id: "elytra", label: "Elytra", tags: ["Elytra"] },
  { id: "shield", label: "Shield", tags: ["Shields"] },
  { id: "book", label: "Book", tags: [] },
];

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
export const fullName = (e: Enchant, level = e.maxLevel) =>
  e.maxLevel > 1 || level > 1 ? `${e.name} ${ROMAN[level] ?? level}` : e.name;

/** Vanilla levels the server allows above Minecraft's max (Unbreaking V, Power VI). */
export const MAX_VANILLA_LEVEL = 10;

/** A book's anvil cost at `level`: the cost per level (book multiplier) times the level. */
export const costAt = (e: Enchant, level = e.maxLevel) => Math.round((e.cost / e.maxLevel) * level);

/** A book holds anything; any other item takes what lists it (or "All"). */
export const fits = (e: Enchant, item: Item) =>
  item.id === "book" || e.appliesTo.some((t) => t === "All" || item.tags.includes(t));

/** Conflicts count both ways: the data lists some on one side only (Timber → Veinminer). */
export const conflict = (a: Enchant, b: Enchant) =>
  a.conflicts.includes("*") || b.conflicts.includes("*") || a.conflicts.includes(b.name) || b.conflicts.includes(a.name);

/** Why `e` can't be added to `picked` on `item`, or null if it can. */
export function blockReason(e: Enchant, picked: Enchant[], item: Item, limits: Limits): string | null {
  if (!fits(e, item)) return `Doesn't go on a ${item.label.toLowerCase()}`;
  const clash = picked.find((p) => conflict(e, p));
  if (clash) return `Conflicts with ${clash.name}`;
  if (picked.length >= limits.total) return `${limits.total} enchantments is the limit`;
  if (e.type === "unique" && picked.filter((p) => p.type === "unique").length >= limits.unique) return "Only 1 Unique per item";
  if (e.type === "spell" && picked.filter((p) => p.type === "spell").length >= limits.spell) return "Only 1 Spell per item";
  return null;
}
