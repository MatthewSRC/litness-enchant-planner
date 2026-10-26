import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { BuildsPage, enchantsOf, goalColor } from "./src/components/BuildsPage";
import { Footer } from "./src/components/Footer";
import { EnchantList } from "./src/components/EnchantList";
import { ItemPicker } from "./src/components/ItemPicker";
import { ItemViewer } from "./src/components/ItemViewer";
import { type PlanOptions, PlanPanel } from "./src/components/PlanPanel";
import { type Build, BUILDS } from "./src/data/builds";
import { type Enchant, fits, ITEMS } from "./src/lib/rules";
import { buildFromUrl, setBuildInUrl } from "./src/lib/share";
import { SITE } from "./src/site";
import { FadeIn, Tap } from "./src/ui/motion";
import { colors, fonts } from "./src/ui/theme";

export default function App() {
  const wide = useWindowDimensions().width >= 980;
  const [page, setPage] = useState<"planner" | "builds">("planner");
  const [itemId, setItemId] = useState("sword");
  const [picked, setPicked] = useState<Enchant[]>([]);
  const [options, setOptions] = useState<PlanOptions>({ priorUses: 0, maxStep: 39, objective: "xp" });
  const [shown, setShown] = useState<Build | null>(null); // the build loaded, until it's changed
  const item = ITEMS.find((i) => i.id === itemId) ?? ITEMS[0];

  const chooseItem = (id: string) => {
    const next = ITEMS.find((i) => i.id === id) ?? ITEMS[0];
    setItemId(id);
    setPicked((p) => p.filter((e) => fits(e, next)));
    leaveBuild();
  };
  const leaveBuild = () => {
    setShown(null);
    setBuildInUrl(null);
  };
  const openBuild = (b: Build) => {
    setItemId(b.item);
    setPicked(enchantsOf(b));
    setOptions((o) => ({ ...o, priorUses: 0 }));
    setPage("planner");
    setShown(b);
    setBuildInUrl(b.id);
  };
  const toggle = (e: Enchant) => {
    setPicked((p) => (p.some((x) => x.id === e.id) ? p.filter((x) => x.id !== e.id) : [...p, e]));
    leaveBuild();
  };

  // A shared link (?build=<id>) opens the planner with that build loaded.
  useEffect(() => {
    const b = BUILDS.find((x) => x.id === buildFromUrl());
    if (b) openBuild(b);
  }, []);

  const header = (
    <View style={styles.header}>
      <Text style={styles.sub}>Pick an item and its enchantments. The planner finds the anvil order that costs the least XP.</Text>
      {shown && (
        <FadeIn key={shown.id} rise={false}>
        <View style={styles.shown}>
          <Text style={styles.shownText}>
            Build: <Text style={styles.shownTitle}>{shown.title}</Text> <Text style={{ color: goalColor[shown.goal] }}>{shown.goal}</Text>
          </Text>
          <Pressable onPress={() => setPage("builds")} accessibilityRole="link">
            <Text style={styles.shownLink}>All builds</Text>
          </Pressable>
        </View>
        </FadeIn>
      )}
    </View>
  );
  const viewer = (
    <View style={[styles.viewer, { height: wide ? 300 : 240 }]}>
      <ItemViewer itemId={item.id} enchanted={picked.length > 0} />
      <Text style={styles.viewerLabel}>{item.label}</Text>
    </View>
  );
  const picker = <ItemPicker value={item.id} onChange={chooseItem} />;
  const plan = <PlanPanel item={item} picked={picked} options={options} onOptions={setOptions} onRemove={toggle} />;
  const list = <EnchantList item={item} picked={picked} onToggle={toggle} />;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.bar}>
        <View style={styles.barInner}>
          <Text style={styles.brand}>{SITE.name}</Text>
          <View style={styles.tabs} accessibilityRole="tablist">
            {(["planner", "builds"] as const).map((p) => (
              <Tap
                key={p}
                onPress={() => setPage(p)}
                accessibilityRole="tab"
                accessibilityState={{ selected: page === p }}
                style={[styles.tab, page === p && styles.tabOn]}
                hoverStyle={page !== p && styles.tabHover}
              >
                <Text style={[styles.tabText, page === p && styles.tabTextOn]}>{p === "planner" ? "Planner" : "Best builds"}</Text>
              </Tap>
            ))}
          </View>
        </View>
      </View>
      <FadeIn key={page} rise={false} style={styles.pageFade}>
      {page === "builds" ? (
        <BuildsPage onOpen={openBuild} />
      ) : wide ? (
        <View style={styles.columns}>
          <ScrollView style={styles.left} contentContainerStyle={styles.colContent}>
            {header}
            {viewer}
            {picker}
            {plan}
            <Footer />
          </ScrollView>
          <ScrollView style={styles.right} contentContainerStyle={styles.colContent}>
            {list}
          </ScrollView>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.colContent}>
          {header}
          {viewer}
          {picker}
          {plan}
          {list}
          <Footer />
        </ScrollView>
      )}
      </FadeIn>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  columns: { flex: 1, flexDirection: "row", maxWidth: 1280, width: "100%", alignSelf: "center" },
  left: { width: 460, flexGrow: 0, borderRightWidth: 1, borderRightColor: colors.line },
  right: { flex: 1 },
  colContent: { padding: 20, gap: 18 },
  bar: { borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.bg },
  barInner: {
    maxWidth: 1280,
    width: "100%",
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  brand: { color: colors.text, fontFamily: fonts.pixel, fontSize: 24, fontWeight: "600" },
  tabs: { flexDirection: "row", gap: 4, padding: 3, borderRadius: 6, borderWidth: 1, borderColor: colors.line },
  tab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 4 },
  tabHover: { backgroundColor: colors.raised },
  tabOn: { backgroundColor: colors.accent },
  pageFade: { flex: 1 },
  tabText: { color: colors.muted, fontFamily: fonts.pixel, fontSize: 14 },
  tabTextOn: { color: colors.bg },
  header: { gap: 10 },
  shown: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.raised,
  },
  shownText: { color: colors.muted, fontFamily: fonts.pixel, fontSize: 14 },
  shownTitle: { color: colors.text },
  shownLink: { color: colors.accent, fontFamily: fonts.pixel, fontSize: 13, textDecorationLine: "underline" },
  sub: { color: colors.muted, fontFamily: fonts.body, fontSize: 14, lineHeight: 20, maxWidth: 520 },
  viewer: { borderRadius: 8, overflow: "hidden", borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel },
  viewerLabel: { position: "absolute", left: 12, bottom: 10, color: colors.muted, fontFamily: fonts.pixel, fontSize: 14 },
});
