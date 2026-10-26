import { useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { type Objective, solve, xpFor } from "../lib/anvil";
import { LIMITS } from "../lib/data";
import { type Enchant, fullName, type Item } from "../lib/rules";
import { smooth } from "../ui/motion";
import { colors, fonts, typeColor } from "../ui/theme";
import { icons } from "./icons";

export type PlanOptions = { priorUses: number; maxStep: number; objective: Objective };

type Props = {
  item: Item;
  picked: Enchant[];
  options: PlanOptions;
  onOptions: (o: PlanOptions) => void;
  onRemove: (e: Enchant) => void;
};

export function PlanPanel({ item, picked, options, onOptions, onRemove }: Props) {
  const isBook = item.id === "book";
  const plan = useMemo(
    () => solve(picked.map((e) => e.cost), isBook ? null : options.priorUses, options.maxStep, options.objective),
    [picked, isBook, options],
  );
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
        <Text style={styles.limits}>
          {n}/{LIMITS.total} · <Text style={{ color: typeColor.unique }}>Unique {count("unique")}/{LIMITS.unique}</Text> ·{" "}
          <Text style={{ color: typeColor.spell }}>Spell {count("spell")}/{LIMITS.spell}</Text>
        </Text>
      </View>
      {n === 0 ? (
        <Text style={styles.hint}>Tick enchantments in the list to add them.</Text>
      ) : (
        <View style={styles.chips}>
          {picked.map((e) => (
            <Pressable key={e.id} onPress={() => onRemove(e)} accessibilityLabel={`Remove ${e.name}`} style={styles.pick}>
              <Text style={[styles.pickName, { color: typeColor[e.type] }]}>{fullName(e)}</Text>
              <Text style={styles.pickCost}>+{e.cost}</Text>
              <Text style={styles.pickX}>×</Text>
            </Pressable>
          ))}
        </View>
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
            <Pressable
              key={o}
              onPress={() => onOptions({ ...options, objective: o })}
              accessibilityRole="radio"
              accessibilityState={{ checked: options.objective === o }}
              style={[styles.segBtn, smooth, options.objective === o && styles.segOn]}
            >
              <Text style={[styles.segText, options.objective === o && styles.segTextOn]}>{o === "xp" ? "Fewest XP points" : "Fewest levels"}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Text style={styles.h2}>Cheapest order</Text>
      {!enough ? (
        <Text style={styles.hint}>{isBook ? "Pick at least two enchantments to merge into one book." : "Pick at least one enchantment."}</Text>
      ) : !plan ? (
        <Text style={styles.error}>
          No order keeps every step at {options.maxStep} levels or less. Drop an enchantment, or raise the limit if your server allows it.
        </Text>
      ) : (
        <>
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
                    <Slot label="Left" icon={l.item ? item.id : "book"} text={[...(l.item ? [item.label] : []), ...l.names.map(fullName)].join(" + ")} />
                    <Slot label="Right" icon="book" text={r.names.map(fullName).join(" + ")} />
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
  headLine: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", gap: 8 },
  h2: { color: colors.text, fontFamily: fonts.pixel, fontSize: 18 },
  limits: { color: colors.muted, fontFamily: fonts.pixel, fontSize: 13 },
  hint: { color: colors.muted, fontFamily: fonts.body, fontSize: 13 },
  error: { color: colors.warn, fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  pick: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 5,
    borderRadius: 4,
    backgroundColor: colors.raised,
    borderWidth: 1,
    borderColor: colors.line,
  },
  pickName: { fontFamily: fonts.pixel, fontSize: 13 },
  pickCost: { color: colors.xp, fontFamily: fonts.pixel, fontSize: 12 },
  pickX: { color: colors.faint, fontSize: 15, lineHeight: 15 },
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
