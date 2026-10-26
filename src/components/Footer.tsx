import { Linking, StyleSheet, Text, View } from "react-native";
import { ENCHANTS } from "../lib/data";
import { SITE } from "../site";
import { colors, fonts } from "../ui/theme";

const vanilla = ENCHANTS.filter((e) => e.vanilla).length;
const updated = new Date(`${SITE.updated}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export function Footer() {
  return (
    <View style={styles.footer} role="contentinfo">
      <Text style={styles.by}>
        By <Text style={styles.author}>{SITE.author}</Text>
      </Text>
      <Text style={styles.meta}>
        Last updated {updated} · {ENCHANTS.length - vanilla} custom + {vanilla} vanilla enchantments · Minecraft {SITE.minecraft}
      </Text>
      <Text style={styles.legal}>
        A fan-made tool, not associated with or endorsed by{" "}
        <Text style={styles.link} accessibilityRole="link" onPress={() => Linking.openURL("https://litness.gg/")}>
          Litness.gg
        </Text>
        . Not an official Minecraft product. Not approved by or associated with Mojang or Microsoft.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { gap: 4, paddingTop: 16, marginTop: 8, borderTopWidth: 1, borderTopColor: colors.line },
  by: { color: colors.muted, fontFamily: fonts.pixel, fontSize: 14 },
  author: { color: colors.accent },
  meta: { color: colors.faint, fontFamily: fonts.body, fontSize: 12, lineHeight: 17 },
  legal: { color: colors.faint, fontFamily: fonts.body, fontSize: 11, lineHeight: 16 },
  link: { color: colors.muted, textDecorationLine: "underline" },
});
