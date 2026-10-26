# Litness Enchants Planner

Pick an item and the server's custom enchantments, and get the anvil order
that costs the least XP (Minecraft Java rules). The item spins in 3D with the
enchantment glint, rendered with [Apricot](https://matthiasbrandolin.dev/apricot).

Expo 57, web only for now.

```bash
npm install
npm run dev        # http://localhost:8091
npm test           # solver vs. brute force
npm run typecheck
SITE_URL=https://your.domain npm run export   # static site in dist/
npm run og         # re-render the link-preview banner (public/og.png, needs Chrome)
npm run serve      # serve dist/ on http://localhost:8093
```

## Where things are

| What | Where |
| --- | --- |
| Enchantments (read from the server's GUI) | `src/data/enchants.json` |
| Vanilla enchantments, with Java book costs | `src/data/vanilla.json` |
| Item list, conflicts, limits | `src/lib/rules.ts` |
| Cheapest-order solver | `src/lib/anvil.ts` |
| Best builds per item (PvP, PvE, bosses, gathering, team); `npm test` checks each against the rules and the 39-level cap | `src/data/builds.ts` |
| 3D item: one slab per texture pixel, like held items in game | `src/three/itemGeometry.ts` |
| Spinning viewer and glint | `src/components/ItemViewer.tsx` |

## Hosting on Vercel

Import the GitHub repo in Vercel; `vercel.json` sets the build (`npm run export`) and output (`dist`). Link previews use the project's production domain automatically (Vercel's `VERCEL_PROJECT_PRODUCTION_URL`); set `SITE_URL` in the project's environment variables to use a custom domain instead.

## Sharing

- A build's link is `<site>/?build=<id>` (the Share button on each card copies it). It opens the planner with that build loaded.
- Link previews use `public/og.png` (from `scripts/og.html`). Chat apps need its absolute URL, so pass `SITE_URL` to `npm run export`.
- The footer's "Last updated" is the day you run `npm run export`.

## Textures

`src/data/sprites.json`, `assets/icons/` and `assets/glint.png` come from the
vanilla 26.3 resource pack. To rebuild them from another pack, unzip it and run:

```bash
npm run sprites -- /path/to/unzipped-pack
```

The textures are Mojang's artwork. Check that's fine before hosting the site publicly.
