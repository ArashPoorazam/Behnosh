"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Component,
  Suspense,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { Group, MathUtils, PMREMGenerator } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { BrandProductModel } from "./brand-product-model";
import type { BrandProduct } from "@/lib/brand-experiences";

export type BrandPose = {
  turn: number;
  tilt: number;
  dragging: boolean;
  invalidate?: () => void;
};
class Boundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
function Studio() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const generator = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const target = generator.fromScene(room, 0.04);
    scene.environment = target.texture;
    scene.environmentIntensity = 0.65;
    room.dispose();
    generator.dispose();
    return () => {
      scene.environment = null;
      target.dispose();
    };
  }, [gl, scene]);
  return (
    <>
      <ambientLight intensity={1.35} />
      <directionalLight position={[-3, 4, 5]} intensity={2} />
      <directionalLight position={[4, 1, -2]} intensity={2.8} />
    </>
  );
}
function Product({
  id,
  selected,
  brand,
  pose,
  reduced,
  active,
}: {
  id: string;
  selected: boolean;
  brand: string;
  pose: RefObject<BrandPose>;
  reduced: boolean;
  active: boolean;
}) {
  const root = useRef<Group>(null);
  const presence = useRef(selected ? 1 : 0);
  const turn = useRef(0);
  const viewport = useThree((s) => s.viewport);
  useFrame(({ clock, invalidate }, dt) => {
    if (!root.current) return;
    const delta = Math.min(dt, 0.05);
    presence.current = reduced
      ? Number(selected)
      : MathUtils.damp(presence.current, Number(selected), 6, delta);
    turn.current = reduced
      ? pose.current.turn
      : MathUtils.damp(turn.current, pose.current.turn, 8, delta);
    const p = presence.current;
    const t = clock.elapsedTime;
    const missing = 1 - p;
    const o = root.current;
    o.visible = p > 0.008;
    const isAloe = brand === "aloe",
      isStart = brand === "start",
      isRace = brand === "synergy";
    const bob = reduced ? 0 : Math.sin(t * (isRace ? 1.5 : 0.9)) * 0.035;
    o.position.set(
      isRace ? missing * 3.8 : isStart ? -missing * 1.2 : 0,
      isAloe ? -missing * 2.2 + bob : bob,
      -missing * 1.5,
    );
    o.rotation.set(
      0.08 + pose.current.tilt,
      turn.current +
        (reduced ? 0 : Math.sin(t * 0.6) * 0.045) +
        (isStart ? missing * 2.2 : isAloe ? missing * 0.5 : -missing * 0.8),
      (isAloe ? -0.08 : isRace ? 0.17 : -0.1) + (isStart ? missing * 0.4 : 0),
    );
    // Fit both wide bottles and slim cans, including shallow landscape viewports.
    const fit = Math.min(viewport.height / 4.5, viewport.width / 2.15);
    o.scale.setScalar(fit * (isStart ? 0.65 + 0.35 * p : p));
    if (active && !reduced) invalidate();
  });
  return (
    <group ref={root} visible={selected}>
      <BrandProductModel id={id} />
    </group>
  );
}
function Scene({ onReady, ...props }: SceneProps & { onReady: () => void }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    props.pose.current.invalidate = invalidate;
    return () => {
      delete props.pose.current.invalidate;
    };
  }, [props.pose, invalidate]);
  useEffect(() => {
    onReady();
  }, [onReady]);
  useEffect(() => {
    invalidate();
  }, [props.selected, props.active, props.reduced, props.spin, invalidate]);
  return (
    <>
      {props.products.map((p) => (
        <Product
          key={p.id}
          id={p.id}
          selected={p.id === props.selected}
          brand={props.brand}
          pose={props.pose}
          reduced={props.reduced}
          active={props.active}
        />
      ))}
    </>
  );
}
type SceneProps = {
  products: BrandProduct[];
  selected: string;
  brand: string;
  pose: RefObject<BrandPose>;
  reduced: boolean;
  active: boolean;
  spin: number;
};
export default function BrandProductCanvas({
  onReady,
  onError,
  ...props
}: SceneProps & { onReady: () => void; onError: () => void }) {
  return (
    <Boundary onError={onError}>
      <Canvas
        frameloop="demand"
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 7], fov: 35 }}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener("webglcontextlost", onError, {
            once: true,
          });
        }}
      >
        <Studio />
        <Suspense fallback={null}>
          <Scene {...props} onReady={onReady} />
        </Suspense>
      </Canvas>
    </Boundary>
  );
}
