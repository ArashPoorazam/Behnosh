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
import { advanceProductSpin, createProductSpin } from "@/lib/product-spin";

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
function Scene({ onReady, ...props }: SceneProps & { onReady: () => void }) {
  const root = useRef<Group>(null);
  const { invalidate, viewport } = useThree();
  const spin = useRef(createProductSpin(props.selected));
  const motion = useRef({
    displayed: props.selected,
    phase: "idle" as "idle" | "exit" | "enter",
    elapsed: 0,
    x: 0,
    from: 0,
    turn: 0,
  });
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
  }, [props.selected, props.active, props.reduced, invalidate]);
  useFrame(({ clock }, dt) => {
    if (!root.current) return;
    const m = motion.current;
    const race = props.brand === "synergy";
    const start = props.brand === "start";
    const fit = Math.min(viewport.height / 4.05, viewport.width / 2.5);
    // Fully clear the camera frustum before exchanging the visible model.
    const travel = viewport.width / 2 + fit * 1.7;
    const exitDuration = race ? 0.16 : 0.24;
    const enterDuration = race ? 0.24 : 0.48;
    if (props.reduced) {
      spin.current = createProductSpin(props.selected);
      m.displayed = props.selected;
      m.phase = "idle";
      m.x = 0;
    } else if (start) {
      const s = spin.current;
      m.x = 0;
      if (s.phase === "idle") s.angle = m.turn;
      if (props.active) {
        const wasSpinning = s.phase !== "idle";
        advanceProductSpin(s, props.selected, Math.min(dt, 0.05));
        if (wasSpinning || s.phase !== "idle") m.turn = s.angle;
      }
      m.displayed = s.displayed;
    } else if (props.active) {
      if (m.displayed !== props.selected && m.phase !== "exit") {
        m.phase = "exit";
        m.from = m.x;
        m.elapsed = 0;
      }
      m.elapsed += Math.min(dt, 0.05);
      if (m.phase === "exit") {
        const p = Math.min(1, m.elapsed / exitDuration);
        m.x = MathUtils.lerp(m.from, -travel, p * p);
        if (p === 1) {
          m.displayed = props.selected;
          m.phase = "enter";
          m.elapsed = 0;
          m.x = race ? -travel : travel;
          m.turn = 0;
        }
      } else if (m.phase === "enter") {
        const p = Math.min(1, m.elapsed / enterDuration);
        m.x = (race ? -travel : travel) * Math.pow(1 - p, 3);
        if (p === 1) m.phase = "idle";
      }
    }
    if (props.reduced) m.turn = props.pose.current.turn;
    else if (!start || spin.current.phase === "idle")
      m.turn = MathUtils.damp(
        m.turn,
        props.pose.current.turn,
        10,
        Math.min(dt, 0.05),
      );
    const o = root.current;
    for (const child of o.children) child.visible = child.name === m.displayed;
    const bob = props.reduced ? 0 : Math.sin(clock.elapsedTime * 0.9) * 0.025;
    o.position.set(m.x, bob, 0);
    o.rotation.set(
      0.06 + props.pose.current.tilt,
      m.turn,
      race ? 0.08 : props.brand === "aloe" ? -0.07 : -0.06,
    );
    o.scale.setScalar(fit);
    if (props.active && !props.reduced) invalidate();
  });
  return (
    <group ref={root}>
      {props.products.map((product) => (
        <group
          key={product.id}
          name={product.id}
          visible={product.id === motion.current.displayed}
        >
          <BrandProductModel id={product.id} />
        </group>
      ))}
    </group>
  );
}
type SceneProps = {
  products: BrandProduct[];
  selected: string;
  brand: string;
  pose: RefObject<BrandPose>;
  reduced: boolean;
  active: boolean;
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
