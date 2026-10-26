import { type ReactNode, useEffect, useRef } from "react";
import { AccessibilityInfo, Animated, Easing, Platform, type StyleProp, type ViewStyle } from "react-native";

const web = Platform.OS === "web" && typeof window !== "undefined";

// Read once: on the web synchronously, so the first frame already knows.
let reduceMotion = web && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
if (!web) AccessibilityInfo.isReduceMotionEnabled().then((v) => (reduceMotion = v), () => {});

/** Fades its content in while it rises a few pixels. `delay` staggers lists. */
export function FadeIn({ delay = 0, distance = 8, style, children }: { delay?: number; distance?: number; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const t = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  useEffect(() => {
    if (reduceMotion) return;
    const run = Animated.timing(t, { toValue: 1, duration: 260, delay, easing: Easing.out(Easing.cubic), useNativeDriver: !web });
    run.start();
    return () => run.stop();
  }, [t, delay]);
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] });
  return <Animated.View style={[style, { opacity: t, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

/** On the web, hover and press changes ease over 160 ms instead of snapping. react-native-web reads these CSS props. */
export const smooth = (
  web && !reduceMotion
    ? { transitionProperty: "transform, background-color, border-color, opacity", transitionDuration: "160ms", transitionTimingFunction: "ease-out" }
    : {}
) as ViewStyle;
