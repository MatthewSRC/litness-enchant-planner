import { type ReactNode, useMemo, useState } from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  type CSSTransitionProperties,
  Easing,
  FadeIn as Fade,
  FadeInDown,
  ReduceMotion,
  useReducedMotion,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Ease-out cubic as a bezier: web layout animations only accept bezier (or a few named) easings.
const EASE_OUT = Easing.bezier(0.33, 1, 0.68, 1);

// Built-in presets only: on the web, Reanimated pins elements with a custom Keyframe entering
// animation to `position: absolute` once it ends, which takes them out of the layout.
const entry = (delay: number, rise: boolean) =>
  (rise ? FadeInDown.duration(320) : Fade.duration(220)).delay(delay).easing(EASE_OUT).reduceMotion(ReduceMotion.System);

/**
 * Fades its content in when mounted, rising into place unless `rise` is false.
 * Give it a new `key` to play it again; `delay` staggers lists. Off when the system asks for reduced motion.
 */
export function FadeIn({ delay = 0, rise = true, style, children }: { delay?: number; rise?: boolean; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const entering = useMemo(() => entry(delay, rise), [delay, rise]);
  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
}

// Reanimated CSS transition: style changes ease instead of snapping.
const ease: CSSTransitionProperties<ViewStyle> = {
  transitionProperty: ["transform", "backgroundColor", "borderColor", "opacity"],
  transitionDuration: 160,
  transitionTimingFunction: "ease-out",
};

type TapProps = Omit<PressableProps, "style" | "children"> & {
  style?: StyleProp<ViewStyle>;
  hoverStyle?: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/** A Pressable whose hover and press styles ease in and out. */
export function Tap({ style, hoverStyle, pressedStyle, onHoverIn, onHoverOut, onPressIn, onPressOut, ...rest }: TapProps) {
  const [hover, setHover] = useState(false);
  const [down, setDown] = useState(false);
  const reduce = useReducedMotion();
  return (
    <AnimatedPressable
      {...rest}
      onHoverIn={(e) => {
        setHover(true);
        onHoverIn?.(e);
      }}
      onHoverOut={(e) => {
        setHover(false);
        onHoverOut?.(e);
      }}
      onPressIn={(e) => {
        setDown(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setDown(false);
        onPressOut?.(e);
      }}
      style={[style, !reduce && ease, hover && hoverStyle, down && pressedStyle]}
    />
  );
}

/** A View whose style changes ease, for state shown inside a Tap (a checkbox filling in). */
export function Eased({ style, children }: { style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  const reduce = useReducedMotion();
  return <Animated.View style={[style, !reduce && ease]}>{children}</Animated.View>;
}
