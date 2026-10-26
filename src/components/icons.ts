import type { ImageSourcePropType } from "react-native";

// 4x-scaled sprites from scripts/sprites.mjs, so they stay sharp at 32 and 64 px.
export const icons: Record<string, ImageSourcePropType> = {
  sword: require("../../assets/icons/sword.png"),
  axe: require("../../assets/icons/axe.png"),
  pickaxe: require("../../assets/icons/pickaxe.png"),
  shovel: require("../../assets/icons/shovel.png"),
  hoe: require("../../assets/icons/hoe.png"),
  bow: require("../../assets/icons/bow.png"),
  crossbow: require("../../assets/icons/crossbow.png"),
  trident: require("../../assets/icons/trident.png"),
  fishing_rod: require("../../assets/icons/fishing_rod.png"),
  helmet: require("../../assets/icons/helmet.png"),
  chestplate: require("../../assets/icons/chestplate.png"),
  leggings: require("../../assets/icons/leggings.png"),
  boots: require("../../assets/icons/boots.png"),
  elytra: require("../../assets/icons/elytra.png"),
  shield: require("../../assets/icons/shield.png"),
  book: require("../../assets/icons/book.png"),
};
