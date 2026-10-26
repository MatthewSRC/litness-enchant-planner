import { useMemo, useRef, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { type Build, BUILDS, type Goal } from "../data/builds";
import { solve } from "../lib/anvil";
import { buildLink, shareLink } from "../lib/share";
import { byId } from "../lib/data";
import { type Enchant, fullName, type Item, ITEMS } from "../lib/rules";
import { FadeIn, Tap } from "../ui/motion";
import { colors, fonts, typeColor } from "../ui/theme";
import { Footer } from "./Footer";
import { icons } from "./icons";

const GOALS: Goal[] = ["PvP", "PvE", "Bosses", "Gathering", "Team"];
export const goalColor: Record<Goal, string> = {
  PvP: "#ff7a6b",
  PvE: "#5dff5d",
  Bosses: "#c58bff",
  Gathering: "#ffd84a",
  Team: "#55c8ff",
};

/** Every enchantment in a build, custom then vanilla, as the planner loads it. */
export const enchantsOf = (b: Build) => [...b.picks.map(([id]) => id), ...b.vanilla].map((id) => byId.get(id) as Enchant);

const WITH_BUILDS = ITEMS.filter((i) => BUILDS.some((b) => b.item === i.id));
const goalsOf = (itemId: string) => GOALS.filter((g) => BUILDS.some((b) => b.item === itemId && b.goal === g));

export function BuildsPage({ onOpen }: { onOpen: (b: Build) => void }) {
  const [itemId, setItemId] = useState<string | null>(null);
  const [goal, setGoal] = useState<Goal | "All">("All");
  const scroll = useRef<ScrollView>(null);
  const show = (id: string | null) => {
    setItemId(id);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  const item = WITH_BUILDS.find((i) => i.id === itemId);

  return (
    <ScrollView ref={scroll} contentContainerStyle={styles.page}>
      {item ? (
        <ItemBuilds key={item.id} item={item} onBack={() => show(null)} onOpen={onOpen} />
      ) : (
        <FadeIn key="grid" rise={false}>
          <View style={styles.view}>
            <View style={styles.intro}>
              <Text style={styles.h1}>Best builds</Text>
              <Text style={styles.lead}>
                The strongest combinations for each item, picked from what every enchantment does. Pick an item to see its builds. Each one follows the
                server's limits (12 per item, 1 Unique, 1 Spell, no conflicts), vanilla enchantments included.
              </Text>
            </View>
            <View style={styles.filters} accessibilityRole="radiogroup">
              {(["All", ...GOALS] as const).map((g) => (
                <Tap
                  key={g}
                  onPress={() => setGoal(g)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: goal === g }}
                  style={[styles.chip, goal === g && styles.chipOn]}
                  hoverStyle={goal !== g && styles.chipHover}
                >
                  <Text style={[styles.chipText, { color: g === "All" ? colors.text : goalColor[g] }]}>{g}</Text>
                </Tap>
              ))}
            </View>
            <ItemGrid goal={goal} onPick={show} />
          </View>
        </FadeIn>
      )}
      <Footer />
    </ScrollView>
  );
}

function ItemGrid({ goal, onPick }: { goal: Goal | "All"; onPick: (id: string) => void }) {
  const width = useWindowDimensions().width;
  const columns = width >= 1100 ? 5 : width >= 760 ? 4 : width >= 480 ? 3 : 2;
  const items = WITH_BUILDS.filter((i) => goal === "All" || goalsOf(i.id).includes(goal));
  return (
    <View style={styles.grid}>
      {items.map((item, i) => {
        const count = BUILDS.filter((b) => b.item === item.id).length;
        return (
          <FadeIn key={`${item.id}-${goal}`} delay={Math.min(i, 14) * 28} style={[styles.tileWrap, { width: `${100 / columns}%` }]}>
            <Tap
              onPress={() => onPick(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`${item.label}: ${count} ${count === 1 ? "build" : "builds"}`}
              style={styles.tile}
              hoverStyle={styles.tileHover}
              pressedStyle={styles.tilePressed}
            >
              <Image source={icons[item.id]} style={item.id === "shield" ? styles.tileShield : styles.tileIcon} />
              <Text style={styles.tileName}>{item.label}</Text>
              <Text style={styles.tileCount}>
                {count} {count === 1 ? "build" : "builds"}
              </Text>
              <View style={styles.tileGoals}>
                {goalsOf(item.id).map((g) => (
                  <Text key={g} style={[styles.tileGoal, { color: goalColor[g] }]}>
                    {g}
                  </Text>
                ))}
              </View>
            </Tap>
          </FadeIn>
        );
      })}
    </View>
  );
}

function ItemBuilds({ item, onBack, onOpen }: { item: Item; onBack: () => void; onOpen: (b: Build) => void }) {
  const builds = BUILDS.filter((b) => b.item === item.id);
  return (
    <View style={styles.view}>
      <FadeIn rise={false}>
        <View style={styles.detailHead}>
          <Tap onPress={onBack} accessibilityRole="button" style={styles.back} hoverStyle={styles.backHover}>
            <Text style={styles.backText}>← All items</Text>
          </Tap>
          <View style={styles.detailTitle}>
            <Image source={icons[item.id]} style={item.id === "shield" ? styles.detailShield : styles.detailIcon} />
            <View style={styles.detailText}>
              <Text style={styles.h1}>{item.label}</Text>
              <Text style={styles.lead}>
                {builds.length} {builds.length === 1 ? "build" : "builds"}: {goalsOf(item.id).join(", ")}
              </Text>
            </View>
          </View>
        </View>
      </FadeIn>
      <View style={styles.cards}>
        {builds.map((b, i) => (
          <FadeIn key={b.id} delay={80 + i * 70} style={styles.cardWrap}>
            <BuildCard build={b} onOpen={() => onOpen(b)} />
          </FadeIn>
        ))}
      </View>
    </View>
  );
}

function BuildCard({ build: b, onOpen }: { build: Build; onOpen: () => void }) {
  const enchants = enchantsOf(b);
  const plan = useMemo(() => solve(enchants.map((e) => e.cost), 0, 39, "xp"), [enchants]);
  const [shared, setShared] = useState<string | null>(null);
  const share = async () => {
    const result = await shareLink(buildLink(b.id), `${b.title}: ${b.goal} ${ITEMS.find((i) => i.id === b.item)?.label.toLowerCase()} build`);
    setShared(result === "copied" ? "Link copied" : result === "shared" ? "Shared" : "Couldn't copy");
    setTimeout(() => setShared(null), 2000);
  };
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.title}>{b.title}</Text>
        <Text style={[styles.goal, { color: goalColor[b.goal], borderColor: goalColor[b.goal] }]}>{b.goal}</Text>
      </View>
      <Text style={styles.summary}>{b.summary}</Text>
      <View style={styles.picks}>
        {b.picks.map(([id, why], i) => (
          <View key={id} style={styles.pick}>
            <Text style={[styles.pickName, { color: typeColor[enchants[i].type] }]}>{fullName(enchants[i])}</Text>
            <Text style={styles.why}>{why}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.vanilla}>
        <Text style={styles.label}>Vanilla </Text>
        {enchants.slice(b.picks.length).map(fullName).join(" · ")}
      </Text>
      {b.note && <Text style={styles.note}>{b.note}</Text>}
      <View style={styles.foot}>
        {plan && (
          <Text style={styles.cost}>
            <Text style={styles.costLv}>{plan.levels} lv</Text>
            {`  ·  ${Math.round(plan.xp).toLocaleString()} XP  ·  biggest step ${plan.top}`}
          </Text>
        )}
        <View style={styles.actions}>
          <Tap onPress={share} accessibilityRole="button" accessibilityLabel={`Copy a link to ${b.title}`} style={styles.shareBtn} hoverStyle={styles.shareHover}>
            <Text style={styles.shareText}>{shared ?? "Share"}</Text>
          </Tap>
          <Tap onPress={onOpen} accessibilityRole="button" style={styles.open} hoverStyle={styles.openHover}>
            <Text style={styles.openText}>Open in planner</Text>
          </Tap>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, gap: 22, maxWidth: 1280, width: "100%", alignSelf: "center" },
  view: { gap: 22 },
  intro: { gap: 6 },
  h1: { color: colors.text, fontFamily: fonts.pixel, fontSize: 28, fontWeight: "600" },
  lead: { color: colors.muted, fontFamily: fonts.body, fontSize: 14, lineHeight: 20, maxWidth: 680 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.line },
  chipHover: { borderColor: colors.faint },
  chipOn: { backgroundColor: colors.raised, borderColor: colors.accent },
  chipText: { fontFamily: fonts.pixel, fontSize: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 },
  tileWrap: { padding: 6 },
  tile: {
    gap: 6,
    padding: 16,
    minHeight: 168,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
  },
  tileHover: { borderColor: colors.accent, backgroundColor: colors.raised, transform: [{ translateY: -3 }] },
  tilePressed: { transform: [{ scale: 0.98 }] },
  tileIcon: { width: 48, height: 48, marginBottom: 6 },
  tileShield: { width: 27, height: 50, marginBottom: 4 },
  tileName: { color: colors.text, fontFamily: fonts.pixel, fontSize: 18 },
  tileCount: { color: colors.muted, fontFamily: fonts.body, fontSize: 12 },
  tileGoals: { flexDirection: "row", flexWrap: "wrap", columnGap: 8, rowGap: 2, marginTop: "auto" },
  tileGoal: { fontFamily: fonts.pixel, fontSize: 12 },
  detailHead: { gap: 16 },
  back: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4, borderWidth: 1, borderColor: colors.line },
  backHover: { borderColor: colors.faint, backgroundColor: colors.raised },
  backText: { color: colors.text, fontFamily: fonts.pixel, fontSize: 13 },
  detailTitle: { flexDirection: "row", alignItems: "center", gap: 16 },
  detailIcon: { width: 64, height: 64 },
  detailShield: { width: 35, height: 64, marginHorizontal: 14 },
  detailText: { flex: 1, minWidth: 0, gap: 2 },
  cards: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  cardWrap: { flexGrow: 1, flexBasis: 340, maxWidth: 620, minWidth: 0 },
  card: {
    flex: 1,
    gap: 10,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
  },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  title: { color: colors.text, fontFamily: fonts.pixel, fontSize: 19, flexShrink: 1 },
  goal: { fontFamily: fonts.pixel, fontSize: 12, borderWidth: 1, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 1 },
  summary: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
  picks: { gap: 5, paddingVertical: 4, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line },
  pick: { flexDirection: "row", gap: 10, alignItems: "baseline", paddingVertical: 2 },
  pickName: { fontFamily: fonts.pixel, fontSize: 14, width: 132, flexShrink: 0 },
  why: { color: colors.muted, fontFamily: fonts.body, fontSize: 12, flex: 1, minWidth: 0 },
  vanilla: { color: colors.text, fontFamily: fonts.body, fontSize: 12 },
  label: { color: colors.faint, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6 },
  note: { color: colors.faint, fontFamily: fonts.body, fontSize: 12, lineHeight: 17 },
  foot: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: "auto" },
  cost: { color: colors.muted, fontFamily: fonts.body, fontSize: 12 },
  costLv: { color: colors.xp, fontFamily: fonts.pixel, fontSize: 15 },
  actions: { flexDirection: "row", gap: 6 },
  shareBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 4, borderWidth: 1, borderColor: colors.line },
  shareHover: { borderColor: colors.faint },
  shareText: { color: colors.text, fontFamily: fonts.pixel, fontSize: 13 },
  open: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 4, backgroundColor: colors.accent },
  openHover: { backgroundColor: "#b896ff" },
  openText: { color: colors.bg, fontFamily: fonts.pixel, fontSize: 13 },
});
