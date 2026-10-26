import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { type Build, BUILDS, type Goal } from "../data/builds";
import { solve } from "../lib/anvil";
import { buildLink, shareLink } from "../lib/share";
import { byId } from "../lib/data";
import { type Enchant, fullName, ITEMS } from "../lib/rules";
import { colors, fonts, hovered, typeColor } from "../ui/theme";
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

export function BuildsPage({ onOpen }: { onOpen: (b: Build) => void }) {
  const [goal, setGoal] = useState<Goal | "All">("All");
  const sections = useMemo(
    () =>
      ITEMS.map((item) => ({ item, builds: BUILDS.filter((b) => b.item === item.id && (goal === "All" || b.goal === goal)) })).filter(
        (s) => s.builds.length > 0,
      ),
    [goal],
  );

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.intro}>
        <Text style={styles.h1}>Best builds</Text>
        <Text style={styles.lead}>
          The strongest combinations for each item, picked from what every enchantment does. Each build follows the server's limits (12 per item, 1
          Unique, 1 Spell, no conflicts), vanilla enchantments included. Costs are for every book in the build, on a new item.
        </Text>
      </View>
      <View style={styles.filters} accessibilityRole="radiogroup">
        {(["All", ...GOALS] as const).map((g) => (
          <Pressable
            key={g}
            onPress={() => setGoal(g)}
            accessibilityRole="radio"
            accessibilityState={{ checked: goal === g }}
            style={[styles.chip, goal === g && styles.chipOn]}
          >
            <Text style={[styles.chipText, { color: g === "All" ? colors.text : goalColor[g] }]}>{g}</Text>
          </Pressable>
        ))}
      </View>
      {sections.map(({ item, builds }) => (
        <View key={item.id} style={styles.section}>
          <View style={styles.sectionHead}>
            <Image source={icons[item.id]} style={item.id === "shield" ? styles.shieldIcon : styles.itemIcon} />
            <Text style={styles.h2}>{item.label}</Text>
          </View>
          <View style={styles.cards}>
            {builds.map((b) => (
              <BuildCard key={b.id} build={b} onOpen={() => onOpen(b)} />
            ))}
          </View>
        </View>
      ))}
      <Footer />
    </ScrollView>
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
          <Pressable onPress={share} accessibilityRole="button" accessibilityLabel={`Copy a link to ${b.title}`} style={(s) => [styles.shareBtn, hovered(s) && styles.shareHover]}>
            <Text style={styles.shareText}>{shared ?? "Share"}</Text>
          </Pressable>
          <Pressable onPress={onOpen} accessibilityRole="button" style={(s) => [styles.open, hovered(s) && styles.openHover]}>
            <Text style={styles.openText}>Open in planner</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, gap: 22, maxWidth: 1280, width: "100%", alignSelf: "center" },
  intro: { gap: 6 },
  h1: { color: colors.text, fontFamily: fonts.pixel, fontSize: 28, fontWeight: "600" },
  lead: { color: colors.muted, fontFamily: fonts.body, fontSize: 14, lineHeight: 20, maxWidth: 680 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.line },
  chipOn: { backgroundColor: colors.raised, borderColor: colors.accent },
  chipText: { fontFamily: fonts.pixel, fontSize: 14 },
  section: { gap: 10 },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  itemIcon: { width: 32, height: 32 },
  shieldIcon: { width: 18, height: 33, marginHorizontal: 7 },
  h2: { color: colors.text, fontFamily: fonts.pixel, fontSize: 20 },
  cards: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    flexGrow: 1,
    flexBasis: 340,
    maxWidth: 620,
    minWidth: 0,
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
