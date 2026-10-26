import { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ENCHANTS, LIMITS } from "../lib/data";
import { blockReason, type Enchant, type EnchantType, fits, fullName, type Item } from "../lib/rules";
import { colors, fonts, hovered, rarityColor, typeColor, typeLabel } from "../ui/theme";
import { icons } from "./icons";

type Filter = "all" | EnchantType | "vanilla";
const FILTERS: Filter[] = ["all", "normal", "unique", "spell", "curse", "vanilla"];

/** Type filters show the server's custom enchantments; "vanilla" shows Minecraft's own. */
const passes = (e: Enchant, f: Filter) => f === "all" || (f === "vanilla" ? !!e.vanilla : !e.vanilla && e.type === f);

const matches = (e: Enchant, q: string) =>
  !q || [e.name, e.description, e.rarity, ...e.appliesTo, ...e.conflicts].some((s) => s.toLowerCase().includes(q));

export function EnchantList({ item, picked, onToggle }: { item: Item; picked: Enchant[]; onToggle: (e: Enchant) => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [everything, setEverything] = useState(false);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ENCHANTS.filter((e) => (everything || fits(e, item)) && passes(e, filter) && matches(e, q));
  }, [query, filter, everything, item]);

  return (
    <View style={styles.wrap}>
      <TextInput
        nativeID="search"
        value={query}
        onChangeText={setQuery}
        placeholder="Search names, effects, conflicts…"
        placeholderTextColor={colors.faint}
        style={styles.search}
        accessibilityLabel="Search enchantments"
      />
      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === f }}
            style={[styles.chip, filter === f && styles.chipOn]}
          >
            <Text style={[styles.chipText, { color: f === "all" || f === "normal" ? colors.text : f === "vanilla" ? rarityColor.Vanilla : typeColor[f] }]}>
              {f === "all" ? "All" : f === "vanilla" ? "Vanilla" : typeLabel[f]}
            </Text>
          </Pressable>
        ))}
        {item.id !== "book" && <Pressable
          onPress={() => setEverything((v) => !v)}
          accessibilityRole="switch"
          accessibilityState={{ checked: everything }}
          style={[styles.chip, everything && styles.chipOn, styles.push]}
        >
          <Text style={styles.chipText}>{everything ? "Showing every item's" : `Only for ${item.label.toLowerCase()}`}</Text>
        </Pressable>}
      </View>
      <Text style={styles.count}>
        {shown.length} of {ENCHANTS.length} enchantments
      </Text>
      <View style={styles.list}>
        {shown.map((e) => {
          const on = picked.some((p) => p.id === e.id);
          const reason = on ? null : blockReason(e, picked, item, LIMITS);
          return <Row key={e.id} enchant={e} on={on} reason={reason} onPress={() => onToggle(e)} />;
        })}
        {shown.length === 0 && <Text style={styles.empty}>Nothing matches. Try another word or turn off the filters.</Text>}
      </View>
    </View>
  );
}

function Row({ enchant: e, on, reason, onPress }: { enchant: Enchant; on: boolean; reason: string | null; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!!reason}
      accessibilityRole="checkbox"
      accessibilityLabel={reason ? `${fullName(e)}: ${reason}` : fullName(e)}
      accessibilityState={{ checked: on, disabled: !!reason }}
      style={(state) => [styles.row, hovered(state) && !reason && styles.rowHover, on && styles.rowOn, !!reason && styles.rowBlocked]}
    >
      <Image source={icons.book} style={styles.book} />
      <View style={styles.body}>
        <View style={styles.titleLine}>
          <Text style={[styles.name, { color: typeColor[e.type] }]}>{fullName(e)}</Text>
          <Text style={[styles.rarity, { color: rarityColor[e.rarity] ?? colors.muted }]}>{e.rarity}</Text>
          {e.type !== "normal" && !e.vanilla && <Text style={[styles.badge, { color: typeColor[e.type], borderColor: typeColor[e.type] }]}>{typeLabel[e.type]}</Text>}
        </View>
        <Text style={styles.desc}>{e.description}</Text>
        <Text style={styles.meta}>
          {e.appliesTo.join(", ")}
          {e.conflicts.length > 0 && <Text style={styles.metaConflict}>{`  ·  Conflicts: ${e.conflicts[0] === "*" ? "everything" : e.conflicts.join(", ")}`}</Text>}
        </Text>
        {reason && <Text style={styles.reason}>{reason}</Text>}
      </View>
      <View style={styles.side}>
        <Text style={styles.cost}>+{e.cost}</Text>
        <Text style={styles.costUnit}>levels</Text>
        <View style={[styles.check, on && styles.checkOn]}>{on && <Text style={styles.tick}>✓</Text>}</View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  search: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.line },
  chipOn: { backgroundColor: colors.raised, borderColor: colors.accent },
  chipText: { fontFamily: fonts.pixel, fontSize: 13, color: colors.text },
  push: { marginLeft: "auto" },
  count: { color: colors.faint, fontFamily: fonts.body, fontSize: 12 },
  list: { gap: 6 },
  empty: { color: colors.muted, fontFamily: fonts.body, padding: 24, textAlign: "center" },
  row: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    alignItems: "flex-start",
  },
  rowHover: { borderColor: colors.faint },
  rowOn: { borderColor: colors.accent, backgroundColor: colors.raised },
  rowBlocked: { opacity: 0.45 },
  book: { width: 32, height: 32, marginTop: 2 },
  body: { flex: 1, minWidth: 0, gap: 3 },
  titleLine: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 8, rowGap: 2 },
  name: { fontFamily: fonts.pixel, fontSize: 17 },
  rarity: { fontFamily: fonts.pixel, fontSize: 13 },
  badge: { fontFamily: fonts.pixel, fontSize: 11, borderWidth: 1, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1 },
  desc: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  meta: { color: colors.faint, fontFamily: fonts.body, fontSize: 12 },
  metaConflict: { color: "#d07a8a" },
  reason: { color: colors.warn, fontFamily: fonts.body, fontSize: 12, fontWeight: "600" },
  side: { alignItems: "flex-end", gap: 2, minWidth: 52 },
  cost: { color: colors.xp, fontFamily: fonts.pixel, fontSize: 18, fontVariant: ["tabular-nums"] },
  costUnit: { color: colors.faint, fontFamily: fonts.body, fontSize: 11 },
  check: {
    marginTop: 6,
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.faint,
    alignItems: "center",
    justifyContent: "center",
  },
  checkOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  tick: { color: colors.bg, fontSize: 13, fontWeight: "700", lineHeight: 15 },
});
