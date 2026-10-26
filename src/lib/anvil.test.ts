import assert from "node:assert/strict";
import { test } from "node:test";
import { solve, xpFor } from "./anvil.ts";

// Tries every merge tree: the slow, obviously-correct answer.
function brute(costs: number[], itemUses: number | null, maxStep: number, score: (c: number) => number) {
  type Node = { v: number; u: number; item: boolean };
  let best = Number.POSITIVE_INFINITY;
  const go = (pool: Node[], acc: number) => {
    if (pool.length === 1) return void (best = Math.min(best, acc));
    for (let i = 0; i < pool.length; i++)
      for (let j = 0; j < pool.length; j++) {
        const L = pool[i];
        const R = pool[j];
        if (i === j || R.item) continue;
        const c = 2 ** L.u - 1 + (2 ** R.u - 1) + R.v;
        if (c > maxStep) continue;
        const rest = pool.filter((_, k) => k !== i && k !== j);
        go([...rest, { v: L.v + R.v, u: Math.max(L.u, R.u) + 1, item: L.item }], acc + score(c));
      }
  };
  const leaves: Node[] = costs.map((v) => ({ v, u: 0, item: false }));
  if (itemUses !== null) leaves.push({ v: 0, u: itemUses, item: true });
  go(leaves, 0);
  return best;
}

test("matches brute force on random cases", () => {
  let seed = 7;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  for (let t = 0; t < 300; t++) {
    const costs = Array.from({ length: 2 + Math.floor(rnd() * 4) }, () => Math.floor(rnd() * 20));
    const item = rnd() < 0.5 ? null : Math.floor(rnd() * 3);
    const max = rnd() < 0.3 ? 12 : 39;
    const objective = rnd() < 0.5 ? "xp" : "levels";
    const plan = solve(costs, item, max, objective);
    const got = plan ? (objective === "xp" ? plan.xp : plan.levels) : Number.POSITIVE_INFINITY;
    assert.equal(got, brute(costs, item, max, objective === "xp" ? xpFor : (c) => c), JSON.stringify({ costs, item, max }));
    if (plan) assert.equal(plan.steps.reduce((s, x) => s + x.cost, 0), plan.levels);
  }
});

test("12 books onto an item stays fast", () => {
  const t0 = performance.now();
  solve([7, 5, 4, 15, 7, 19, 14, 13, 7, 9, 7, 2], 0, 39, "xp");
  assert.ok(performance.now() - t0 < 1500);
});
