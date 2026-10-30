import { useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { type Objective, solve, xpFor } from "../lib/anvil";
import { LIMITS } from "../lib/data";
import { costAt, type Enchant, fullName, type Item, MAX_VANILLA_LEVEL } from "../lib/rules";
import { Tap } from "../ui/motion";
import { colors, fonts, typeColor } from "../ui/theme";
import { icons } from "./icons";

export type PlanOptions = { priorUses: number; maxStep: number; objective: Objective };

type Props = {
  item: Item;
  picked: Enchant[];
  options: PlanOptions;
  onOptions: (o: PlanOptions) => void;
  onRemove: (e: Enchant) => void;
  /** Prior anvil uses per enchantment id, for books made by combining books. */
  worked: Record<string, number>;
  onWork: (e: Enchant, uses: number) => void;
  /** Chosen level per vanilla enchantment id, when it isn't Minecraft's max. */
  levels: Record<string, number>;
  onLevel: (e: Enchant, level: number) => void;
  onClear: () => void;
};

export function PlanPanel({ item, picked, options, onOptions, onRemove, worked, onWork, levels, onLevel, onClear }: Props) {
  const isBook = item.id === "book";
  const bookUses = picked.map((e) => worked[e.id] ?? 0);
  const anyWorked = bookUses.some((u) => u > 0);
  const [plan, fresh] = useMemo(() => {
    const costs = picked.map((e) => costAt(e, levels[e.id]));
    const run = (uses?: number[]) => solve(costs, isBook ? null : options.priorUses, options.maxStep, options.objective, uses);
    // `fresh` is the same plan with new books, to show what combined books cost.
    return [run(bookUses), anyWorked ? run() : null];
  }, [picked, isBook, options, bookUses.join(), anyWorked, levels]);
  const label = (e: Enchant) => fullName(e, levels[e.id]) + (worked[e.id] ? " ⚒" : "");
  const count = (t: Enchant["type"]) => picked.filter((e) => e.type === t).length;
  const n = picked.length;
  const slot = (mask: number) => {
    const names = picked.filter((_, i) => mask & (1 << i));
    return { item: !!(mask & (1 << n)), names };
  };
  const enough = n + (isBook ? 0 : 1) >= 2;

  return (
    <View style={styles.wrap}>
      <View style={styles.headLine}>
        <Text style={styles.h2}>Your enchantments</Text>
        <View style={styles.headRight}>
          <Text style={styles.limits}>
            {n}/{LIMITS.total} · <Text style={{ color: typeColor.unique }}>Unique {count("unique")}/{LIMITS.unique}</Text> ·{" "}
            <Text style={{ color: typeColor.spell }}>Spell {count("spell")}/{LIMITS.spell}</Text>
          </Text>
          {n > 0 && (
            <Tap onPress={onClear} accessibilityRole="button" accessibilityLabel="Remove all enchantments" style={styles.clear} hoverStyle={styles.clearHover}>
              <Text style={styles.clearText}>Clear</Text>
            </Tap>
          )}
        </View>
      </View>
      {n === 0 ? (
        <Text style={styles.hint}>Tick enchantments in the list to add them.</Text>
      ) : (
        <>
          <View style={styles.chips}>
            {picked.map((e) => {
              const uses = worked[e.id] ?? 0;
              const level = levels[e.id] ?? e.maxLevel;
              const levelled = e.vanilla && e.maxLevel > 1;
              return (
                <View key={e.id} style={[styles.pick, uses > 0 && styles.pickWorked]}>
                  {levelled && (
                    <Tap
                      onPress={() => onLevel(e, level - 1)}
                      disabled={level <= 1}
                      accessibilityRole="button"
                      accessibilityLabel={`Lower ${e.name} to level ${level - 1}`}
                      style={[styles.x, level <= 1 && styles.off]}
                      hoverStyle={styles.xHover}
                    >
                      <Text style={styles.pickX}>−</Text>
                    </Tap>
                  )}
                  <Text style={[styles.pickName, { color: level > e.maxLevel ? colors.accent : typeColor[e.type] }]}>{fullName(e, level)}</Text>
                  {levelled && (
                    <Tap
                      onPress={() => onLevel(e, level + 1)}
                      disabled={level >= MAX_VANILLA_LEVEL}
                      accessibilityRole="button"
                      accessibilityLabel={`Raise ${e.name} to level ${level + 1}`}
                      style={[styles.x, level >= MAX_VANILLA_LEVEL && styles.off]}
                      hoverStyle={styles.xHover}
                    >
                      <Text style={styles.pickX}>+</Text>
                    </Tap>
                  )}
                  <Text style={styles.pickCost}>+{costAt(e, level)}</Text>
                  <Tap
                    onPress={() => onWork(e, (uses + 1) % 4)}
                    accessibilityRole="button"
                    accessibilityLabel={`${e.name} book made in an anvil ${uses} ${uses === 1 ? "time" : "times"}. Change`}
                    style={[styles.anvil, uses > 0 && styles.anvilOn]}
                    hoverStyle={styles.anvilHover}
                  >
                    <Text style={[styles.anvilText, uses > 0 && styles.anvilTextOn]}>⚒{uses > 0 ? ` ${uses}` : ""}</Text>
                  </Tap>
                  <Tap onPress={() => onRemove(e)} accessibilityRole="button" accessibilityLabel={`Remove ${e.name}`} style={styles.x} hoverStyle={styles.xHover}>
                    <Text style={styles.pickX}>×</Text>
                  </Tap>
                </View>
              );
            })}
          </View>
          <Text style={styles.hint}>
            Made a book by combining two in an anvil (like two Ignis Fury I into II)? Tap its ⚒ once per anvil use: combined books cost more to apply.
            {picked.some((e) => e.vanilla && e.maxLevel > 1) &&
              " Vanilla books go above Minecraft's max with − and + (like Unbreaking V); each level adds its book cost again."}
          </Text>
        </>
      )}

      <View style={styles.options}>
        {!isBook && (
          <Stepper
            label={`${item.label} already used in an anvil`}
            value={options.priorUses}
            min={0}
            max={5}
            suffix={options.priorUses === 1 ? "time" : "times"}
            onChange={(priorUses) => onOptions({ ...options, priorUses })}
          />
        )}
        <Stepper
          label="Most levels one step may cost"
          value={options.maxStep}
          min={1}
          max={99}
          suffix="levels"
          onChange={(maxStep) => onOptions({ ...options, maxStep })}
        />
        <View style={styles.seg} accessibilityRole="radiogroup">
          {(["xp", "levels"] as Objective[]).map((o) => (
            <Tap
              key={o}
              onPress={() => onOptions({ ...options, objective: o })}
              accessibilityRole="radio"
              accessibilityState={{ checked: options.objective === o }}
              style={[styles.segBtn, options.objective === o && styles.segOn]}
            >
              <Text style={[styles.segText, options.objective === o && styles.segTextOn]}>{o === "xp" ? "Fewest XP points" : "Fewest levels"}</Text>
            </Tap>
          ))}
        </View>
      </View>

      <Text style={styles.h2}>Cheapest order</Text>
      {!enough ? (
        <Text style={styles.hint}>{isBook ? "Pick at least two enchantments to merge into one book." : "Pick at least one enchantment."}</Text>
      ) : !plan ? (
        <Text style={styles.error}>
          {fresh
            ? `Your combined books (⚒) make this too expensive: some step would go over ${options.maxStep} levels. With new books it works: ${fresh.levels} levels, biggest step ${fresh.top}.`
            : `No order keeps every step at ${options.maxStep} levels or less. Drop an enchantment, or raise the limit if your server allows it.`}
        </Text>
      ) : (
        <>
          {fresh && (
            <Text style={plan.levels > fresh.levels ? styles.warnNote : styles.okNote}>
              {plan.levels > fresh.levels
                ? `Combined books (⚒) add ${plan.levels - fresh.levels} ${plan.levels - fresh.levels === 1 ? "level" : "levels"} (biggest step ${fresh.top} → ${plan.top}). Every step still fits under ${options.maxStep + 1}.`
                : "Your combined books (⚒) don't change the cost of this plan."}
            </Text>
          )}
          <View style={styles.stats}>
            <Stat value={plan.levels} label="Total levels" />
            <Stat value={Math.round(plan.xp).toLocaleString()} label="XP points" />
            <Stat value={plan.top} label="Biggest step" />
            <Stat value={plan.uses} label="Anvil uses after" />
          </View>
          <View style={styles.steps}>
            {plan.steps.map((s, i) => {
              const l = slot(s.left);
              const r = slot(s.right);
              return (
                <View key={`${s.left}-${s.right}`} style={styles.step}>
                  <Text style={styles.stepNo}>{i + 1}</Text>
                  <View style={styles.stepBody}>
                    <Slot label="Left" icon={l.item ? item.id : "book"} text={[...(l.item ? [item.label] : []), ...l.names.map(label)].join(" + ")} />
                    <Slot label="Right" icon="book" text={r.names.map(label).join(" + ")} />
                  </View>
                  <View style={styles.stepCost}>
                    <Text style={styles.stepLv}>{s.cost} lv</Text>
                    <Text style={styles.stepXp}>{Math.round(xpFor(s.cost))} xp</Text>
                  </View>
                </View>
              );
            })}
          </View>
          <Text style={styles.note}>
            XP points assume you start each step with exactly the levels it costs. Steps above 39 levels show "Too Expensive!" in survival.
          </Text>
        </>
      )}
    </View>
  );
}

function Slot({ label, icon, text }: { label: string; icon: string; text: string }) {
  return (
    <View style={styles.slot}>
      <Image source={icons[icon]} style={icon === "shield" ? styles.slotShield : styles.slotIcon} />
      <Text style={styles.slotText}>
        <Text style={styles.slotLabel}>{label} </Text>
        {text}
      </Text>
    </View>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Stepper(props: { label: string; value: number; min: number; max: number; suffix: string; onChange: (v: number) => void }) {
  const { label, value, min, max, suffix, onChange } = props;
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperCtl}>
        <Pressable onPress={() => onChange(Math.max(min, value - 1))} accessibilityLabel={`Less: ${label}`} style={styles.stepperBtn}>
          <Text style={styles.stepperSign}>−</Text>
        </Pressable>
        <Text style={styles.stepperValue}>
          {value} <Text style={styles.stepperSuffix}>{suffix}</Text>
        </Text>
        <Pressable onPress={() => onChange(Math.min(max, value + 1))} accessibilityLabel={`More: ${label}`} style={styles.stepperBtn}>
          <Text style={styles.stepperSign}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  headLine: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8 },
  headRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  clear: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: colors.line },
  clearHover: { borderColor: colors.warn },
  clearText: { color: colors.muted, fontFamily: fonts.pixel, fontSize: 12 },
  h2: { color: colors.text, fontFamily: fonts.pixel, fontSize: 18 },
  limits: { color: colors.muted, fontFamily: fonts.pixel, fontSize: 13 },
  hint: { color: colors.muted, fontFamily: fonts.body, fontSize: 13 },
  error: { color: colors.warn, fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
  warnNote: { color: "#ffd84a", fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
  okNote: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  pick: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 10,
    paddingRight: 4,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: colors.raised,
    borderWidth: 1,
    borderColor: colors.line,
  },
  pickName: { fontFamily: fonts.pixel, fontSize: 13 },
  pickCost: { color: colors.xp, fontFamily: fonts.pixel, fontSize: 12 },
  pickWorked: { borderColor: "#8a7a3a" },
  pickX: { color: colors.faint, fontSize: 15, lineHeight: 15 },
  anvil: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3, borderWidth: 1, borderColor: "transparent" },
  anvilOn: { backgroundColor: "#2e2814", borderColor: "#8a7a3a" },
  anvilHover: { borderColor: colors.faint },
  anvilText: { color: colors.faint, fontSize: 13 },
  anvilTextOn: { color: "#ffd84a", fontFamily: fonts.pixel },
  x: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  xHover: { backgroundColor: colors.line },
  off: { opacity: 0.3 },
  options: { gap: 10, padding: 12, borderRadius: 6, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" },
  stepperLabel: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, flexShrink: 1 },
  stepperCtl: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperSign: { color: colors.text, fontSize: 16, lineHeight: 18 },
  stepperValue: { color: colors.text, fontFamily: fonts.pixel, fontSize: 15, minWidth: 74, textAlign: "center" },
  stepperSuffix: { color: colors.faint, fontSize: 12 },
  seg: { flexDirection: "row", borderRadius: 4, borderWidth: 1, borderColor: colors.line, overflow: "hidden" },
  segBtn: { flex: 1, paddingVertical: 8, alignItems: "center" },
  segOn: { backgroundColor: colors.accent },
  segText: { color: colors.muted, fontFamily: fonts.pixel, fontSize: 13 },
  segTextOn: { color: colors.bg },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  stat: { flexGrow: 1, flexBasis: 90, padding: 10, borderRadius: 6, backgroundColor: "#16220f", gap: 2 },
  statValue: { color: colors.xp, fontFamily: fonts.pixel, fontSize: 22, fontVariant: ["tabular-nums"] },
  statLabel: { color: colors.muted, fontFamily: fonts.body, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6 },
  steps: { gap: 6 },
  step: {
    flexDirection: "row",
    gap: 10,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    alignItems: "center",
  },
  stepNo: { color: colors.faint, fontFamily: fonts.pixel, fontSize: 16, width: 18, textAlign: "center" },
  stepBody: { flex: 1, minWidth: 0, gap: 6 },
  slot: { flexDirection: "row", alignItems: "center", gap: 8 },
  slotIcon: { width: 20, height: 20 },
  slotShield: { width: 11, height: 20, marginHorizontal: 4 },
  slotText: { color: colors.text, fontFamily: fonts.body, fontSize: 13, flexShrink: 1 },
  slotLabel: { color: colors.faint, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6 },
  stepCost: { alignItems: "flex-end" },
  stepLv: { color: colors.xp, fontFamily: fonts.pixel, fontSize: 16, fontVariant: ["tabular-nums"] },
  stepXp: { color: colors.faint, fontFamily: fonts.body, fontSize: 11 },
  note: { color: colors.faint, fontFamily: fonts.body, fontSize: 12, lineHeight: 17 },
});
