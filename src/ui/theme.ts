import type { EnchantType } from "../lib/rules";

// Dark enchanting-table palette: purple-black panels like the in-game tooltip, XP green for costs.
export const colors = {
  bg: "#0f0d14",
  panel: "#17131f",
  raised: "#211a2c",
  line: "#2f2641",
  border: "#4a2fa0",
  text: "#ece6f5",
  muted: "#9a90ab",
  faint: "#6a6178",
  accent: "#a47cff",
  xp: "#8cff3c",
  warn: "#ff7a6b",
};

export const fonts = {
  pixel: "'Pixelify Sans', ui-monospace, monospace",
  body: "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

export const rarityColor: Record<string, string> = {
  Common: "#d9d9d9",
  Uncommon: "#5dff5d",
  Rare: "#55c8ff",
  Epic: "#c58bff",
  Legendary: "#ffb02e",
  Special: "#ffd84a",
  "Very Special": "#ff7a3d",
  Vanilla: "#b8c4d6",
};

/** Name colours from the server's GUI. */
export const typeColor: Record<EnchantType, string> = {
  normal: colors.text,
  unique: "#ffb02e",
  spell: "#4fa8ff",
  curse: "#ff5a5a",
};

export const typeLabel: Record<EnchantType, string> = {
  normal: "Normal",
  unique: "Unique",
  spell: "Spell",
  curse: "Curse",
};
