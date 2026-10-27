// Cheapest anvil order under Minecraft Java rules: each step costs
// (2^a - 1) + (2^b - 1) + the right-slot books' costs, where a and b are the
// prior anvil uses of each side, and the result has max(a, b) + 1 uses.

export type Objective = "xp" | "levels";

/** One anvil step. `left` and `right` are bitmasks over the inputs (books, then the item). */
export type Step = { left: number; right: number; cost: number; uses: number };

export type Plan = { steps: Step[]; levels: number; xp: number; top: number; uses: number };

/** XP points needed to reach level `level` from 0 (Java Edition). */
export function xpFor(level: number): number {
  if (level <= 16) return level * level + 6 * level;
  if (level <= 31) return 2.5 * level * level - 40.5 * level + 360;
  return 4.5 * level * level - 162.5 * level + 2220;
}

/**
 * Exact search over (subset, anvil uses): later costs depend only on those two,
 * so keeping the best per pair is optimal.
 * @param costs right-slot cost of each book
 * @param itemUses prior anvil uses of the item, or null to merge books only
 * @param bookUses prior anvil uses of each book (a book made from two books has 1); default 0
 */
export function solve(costs: number[], itemUses: number | null, maxStep: number, objective: Objective, bookUses: number[] = []): Plan | null {
  const n = costs.length;
  const hasItem = itemUses !== null;
  const N = n + (hasItem ? 1 : 0);
  if (N < 2) return null;
  const full = (1 << N) - 1;
  const itemBit = hasItem ? 1 << n : 0;
  const U = N + Math.max(itemUses ?? 0, ...bookUses) + 1;
  const size = (full + 1) * U;

  const value = new Int32Array(full + 1);
  for (let m = 1; m <= full; m++) {
    const b = 31 - Math.clz32(m & -m);
    value[m] = value[m & (m - 1)] + (b < n ? costs[b] : 0);
  }
  const obj = new Float64Array(size).fill(Number.POSITIVE_INFINITY);
  const lv = new Int32Array(size);
  const top = new Int32Array(size);
  const left = new Int32Array(size).fill(-1);
  const leftUses = new Int8Array(size);
  const rightUses = new Int8Array(size);
  const usesOf = new Int32Array(full + 1); // bit u set when (mask, u) is reachable

  for (let i = 0; i < n; i++) {
    const u = bookUses[i] ?? 0;
    obj[(1 << i) * U + u] = 0;
    usesOf[1 << i] = 1 << u;
  }
  if (hasItem) {
    obj[itemBit * U + itemUses] = 0;
    usesOf[itemBit] = 1 << itemUses;
  }

  for (let m = 1; m <= full; m++) {
    if (!(m & (m - 1))) continue;
    for (let A = (m - 1) & m; A > 0; A = (A - 1) & m) {
      const B = m ^ A;
      if (B & itemBit) continue; // the item always sits in the left slot
      for (let ua = 0, sa = usesOf[A]; sa; ua++, sa >>= 1) {
        if (!(sa & 1)) continue;
        const ia = A * U + ua;
        for (let ub = 0, sb = usesOf[B]; sb; ub++, sb >>= 1) {
          if (!(sb & 1)) continue;
          const cost = 2 ** ua - 1 + (2 ** ub - 1) + value[B];
          if (cost > maxStep) continue;
          const ib = B * U + ub;
          const u = Math.max(ua, ub) + 1;
          const o = obj[ia] + obj[ib] + (objective === "xp" ? xpFor(cost) : cost);
          const l = lv[ia] + lv[ib] + cost;
          const t = Math.max(top[ia], top[ib], cost);
          const k = m * U + u;
          if (o < obj[k] || (o === obj[k] && (l < lv[k] || (l === lv[k] && t < top[k])))) {
            obj[k] = o;
            lv[k] = l;
            top[k] = t;
            left[k] = A;
            leftUses[k] = ua;
            rightUses[k] = ub;
            usesOf[m] |= 1 << u;
          }
        }
      }
    }
  }

  let best = -1;
  for (let u = 0; u < U; u++) if (obj[full * U + u] < (best < 0 ? Number.POSITIVE_INFINITY : obj[full * U + best])) best = u;
  if (best < 0) return null;

  const steps: Step[] = [];
  const walk = (m: number, u: number) => {
    const k = m * U + u;
    const A = left[k];
    if (A < 0) return;
    const B = m ^ A;
    walk(A, leftUses[k]);
    walk(B, rightUses[k]);
    steps.push({ left: A, right: B, cost: lv[k] - lv[A * U + leftUses[k]] - lv[B * U + rightUses[k]], uses: u });
  };
  walk(full, best);
  const k = full * U + best;
  return { steps, levels: lv[k], xp: steps.reduce((s, x) => s + xpFor(x.cost), 0), top: top[k], uses: best };
}
