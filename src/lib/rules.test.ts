import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { solve } from "./anvil.ts";
import { costAt, type Enchant, fullName, usesForLevel } from "./rules.ts";

const vanilla: Enchant[] = JSON.parse(readFileSync(new URL("../data/vanilla.json", import.meta.url), "utf8")).enchants;
const v = (id: string) => vanilla.find((e) => e.id === id) as Enchant;

test("vanilla levels above Minecraft's max cost one book multiplier per level", () => {
  assert.equal(costAt(v("protection"), 5), 5);
  assert.equal(costAt(v("power"), 6), 6);
  assert.equal(costAt(v("unbreaking"), 4), 4);
  assert.equal(costAt(v("unbreaking"), 5), 5);
  assert.equal(costAt(v("thorns"), 3), v("thorns").cost); // the max level costs what the data says
  assert.equal(fullName(v("unbreaking"), 5), "Unbreaking V");
  assert.equal(fullName(v("mending")), "Mending");
});

test("a book above the max counts its anvil uses (Power VI step costs 15, as in game)", () => {
  assert.equal(usesForLevel(v("power"), 5), 0);
  assert.equal(usesForLevel(v("power"), 6), 1);
  assert.equal(usesForLevel(v("unbreaking"), 5), 2);
  // Thor VI + Explosive Arrow III onto Boss Hunter VIII + Power VI, merged as the player did.
  const merged = solve([5, costAt(v("power"), 6)], null, 39, "levels", [0, usesForLevel(v("power"), 6)]);
  assert.equal(merged?.uses, 2);
  assert.equal(1 + (2 ** merged!.uses - 1) + 5 + 6, 15);
});
