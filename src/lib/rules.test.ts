import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { costAt, type Enchant, fullName } from "./rules.ts";

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
