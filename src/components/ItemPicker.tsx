import { Image, StyleSheet, Text, View } from "react-native";
import { ITEMS } from "../lib/rules";
import { Tap } from "../ui/motion";
import { colors, fonts } from "../ui/theme";
import { icons } from "./icons";

export function ItemPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {ITEMS.map((item) => {
        const on = item.id === value;
        return (
          <Tap
            key={item.id}
            onPress={() => onChange(item.id)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={item.label}
            style={[styles.cell, on && styles.on]}
            hoverStyle={on ? styles.lift : styles.hover}
            pressedStyle={styles.pressed}
          >
            <Image source={icons[item.id]} style={item.id === "shield" ? styles.shield : styles.icon} />
            <Text style={[styles.label, on && styles.labelOn]} numberOfLines={1}>
              {item.label}
            </Text>
          </Tap>
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
  hover: { borderColor: colors.faint, transform: [{ translateY: -2 }] },
  lift: { transform: [{ translateY: -2 }] },
  pressed: { transform: [{ scale: 0.96 }] },
  on: { borderColor: colors.accent, backgroundColor: colors.raised },
  icon: { width: 32, height: 32 },
  shield: { width: 18, height: 33 },
  label: { color: colors.muted, fontFamily: fonts.body, fontSize: 11 },
  labelOn: { color: colors.text },
});
