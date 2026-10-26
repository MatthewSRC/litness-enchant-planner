import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { ITEMS } from "../lib/rules";
import { colors, fonts, hovered } from "../ui/theme";
import { icons } from "./icons";

export function ItemPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {ITEMS.map((item) => {
        const on = item.id === value;
        return (
          <Pressable
            key={item.id}
            onPress={() => onChange(item.id)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={item.label}
            style={(state) => [styles.cell, hovered(state) && styles.hover, on && styles.on]}
          >
            <Image source={icons[item.id]} style={item.id === "shield" ? styles.shield : styles.icon} />
            <Text style={[styles.label, on && styles.labelOn]} numberOfLines={1}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  cell: {
    flexBasis: "22%",
    flexGrow: 1,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
  },
  hover: { borderColor: colors.faint },
  on: { borderColor: colors.accent, backgroundColor: colors.raised },
  icon: { width: 32, height: 32 },
  shield: { width: 18, height: 33 },
  label: { color: colors.muted, fontFamily: fonts.body, fontSize: 11 },
  labelOn: { color: colors.text },
});
