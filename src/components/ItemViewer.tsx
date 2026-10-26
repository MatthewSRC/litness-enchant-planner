import { Group, Mesh, Scene, Spin } from "@apricotjs/react-native";
import { useTexture } from "@apricotjs/react-native/model";
import { useEffect, useMemo, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { float, rotateUV, texture, time, uv, vec2 } from "three/tsl";
import * as THREE from "three/webgpu";
import sprites from "../data/sprites.json";
import { buildItemGeometry, type Sprite } from "../three/itemGeometry";
import { colors, fonts } from "../ui/theme";
import { icons } from "./icons";

const SPRITES = sprites as Record<string, Sprite>;

/** Minecraft's item glint: two layers of the glint texture, rotated and scrolling, added on top. */
function useGlintMaterial() {
  const glint = useTexture(require("../../assets/glint.png"), { repeat: true });
  const material = useMemo(() => {
    if (!glint) return null;
    const m = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const base = uv().mul(0.4);
    const a = texture(glint, rotateUV(base, float(Math.PI / 18)).add(vec2(time.mul(0.06), 0))).rgb;
    const b = texture(glint, rotateUV(base, float((-50 * Math.PI) / 180)).add(vec2(time.mul(-0.04), 0))).rgb;
    // The game blends with (SRC_COLOR, ONE), so each layer adds its colour squared: dim parts vanish, streaks stay.
    m.colorNode = a.mul(a).add(b.mul(b)).mul(0.7);
    return m;
  }, [glint]);
  useEffect(() => () => material?.dispose(), [material]);
  return material;
}

function Item({ id, enchanted }: { id: string; enchanted: boolean }) {
  const geometry = useMemo(() => buildItemGeometry(SPRITES[id]), [id]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const glint = useGlintMaterial();
  return (
    <>
      <Mesh geometry={geometry} material={{ preset: "matte", color: "#ffffff", roughness: 1, metalness: 0, vertexColors: true }} />
      {glint && <Mesh geometry={geometry} material={glint} visible={enchanted} />}
    </>
  );
}

export function ItemViewer({ itemId, enchanted }: { itemId: string; enchanted: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <View style={styles.fallback}>
        <Image source={icons[itemId]} style={styles.fallbackIcon} />
        <Text style={styles.note}>This browser can't draw 3D, so here's the flat icon.</Text>
      </View>
    );
  return (
    <Scene
      style={styles.scene}
      look="studio"
      // No tone mapping: pixel art keeps its colours, and the background shows exactly as the card's.
      toneMapping="none"
      background={colors.panel}
      camera={{ position: [0, 0.25, 3.4], fov: 35 }}
      onError={() => setFailed(true)}
      // The flat icon covers the canvas until the first 3D frame (blank white while shaders compile).
      loading={
        <View style={styles.loading}>
          <Image source={icons[itemId]} style={itemId === "shield" ? styles.loadingShield : styles.loadingIcon} />
        </View>
      }
    >
      <Group rotation={[0.12, 0, 0]}>
        <Spin speed={0.9}>
          <Item id={itemId} enchanted={enchanted} />
        </Spin>
      </Group>
    </Scene>
  );
}

const styles = StyleSheet.create({
  scene: { flex: 1 },
  fallback: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: colors.panel },
  fallbackIcon: { width: 128, height: 128 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.panel },
  loadingIcon: { width: 128, height: 128, opacity: 0.5 },
  loadingShield: { width: 70, height: 128, opacity: 0.5 },
  note: { color: colors.muted, fontFamily: fonts.body, fontSize: 13 },
});
