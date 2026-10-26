import custom from "../data/enchants.json";
import vanilla from "../data/vanilla.json";
import type { Enchant, Limits } from "./rules";

export const ENCHANTS = [...(custom.enchants as Enchant[]), ...(vanilla.enchants as Enchant[])].sort((a, b) =>
  a.name.localeCompare(b.name),
);
export const LIMITS: Limits = custom.limits;
export const byId = new Map(ENCHANTS.map((e) => [e.id, e]));
