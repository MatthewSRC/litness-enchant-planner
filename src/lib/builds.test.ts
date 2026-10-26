import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { BUILDS } from "../data/builds.ts";
import { solve } from "./anvil.ts";
import { blockReason, type Enchant, ITEMS } from "./rules.ts";

const read = (f: string) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8"));
const data = read("enchants.json");
const byId = new Map<string, Enchant>([...data.enchants, ...read("vanilla.json").enchants].map((e: Enchant) => [e.id, e]));

for (const b of BUILDS)
  test(`${b.id} follows the server rules and fits under the anvil cap`, () => {
    const item = ITEMS.find((i) => i.id === b.item);
    assert.ok(item, `unknown item ${b.item}`);
    const picked: Enchant[] = [];
    for (const id of [...b.picks.map(([id]) => id), ...b.vanilla]) {
      const e = byId.get(id);
      assert.ok(e, `unknown enchantment ${id}`);
      assert.equal(blockReason(e, picked, item, data.limits), null, `${e.name}: ${blockReason(e, picked, item, data.limits)}`);
      picked.push(e);
    }
    assert.ok(solve(picked.map((e) => e.cost), 0, 39, "xp"), "no order stays under 40 levels per step");
  });

test("ids are unique across custom and vanilla", () => assert.equal(byId.size, data.enchants.length + read("vanilla.json").enchants.length));

test("build ids are unique", () => assert.equal(new Set(BUILDS.map((b) => b.id)).size, BUILDS.length));
