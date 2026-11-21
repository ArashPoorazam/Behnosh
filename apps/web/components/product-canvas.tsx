"use client";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Box3, Group, Vector3, PMREMGenerator } from "three";
import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
export type Pose = {
  rotation: number;
  tilt: number;
  y: number;
  scale: number;
  invalidate?: () => void;
};
class CanvasBoundary extends Component<
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
    scene.environmentIntensity = 0.8;
    room.dispose();
    generator.dispose();
    return () => {
      scene.environment = null;
      target.dispose();
    };
  }, [gl, scene]);
  return null;
}
// Demand rendering has long idle gaps; sample only contiguous active frames.
function AdaptiveQuality() {
  const setDpr = useThree((state) => state.setDpr);
  const samples = useRef({ count: 0, total: 0, reduced: false });
  useFrame((_, delta) => {
    const sample = samples.current;
    if (sample.reduced || delta > 0.5 || delta < 0.001) return;
    sample.count += 1;
    sample.total += delta;
    if (sample.count === 16) {
      if (sample.total / sample.count > 0.032) {
        sample.reduced = true;
        setDpr(0.75);
      } else {
        sample.count = 0;
        sample.total = 0;
      }
    }
  });
  return null;
}
function Model({
  asset,
  pose,
  onReady,
}: {
  asset: string;
  pose: RefObject<Pose>;
  onReady: () => void;
}) {
  const gltf = useLoader(GLTFLoader, `/assets/${asset}-v1.glb`);
  const root = useRef<Group>(null);
  const invalidate = useThree((s) => s.invalidate);
  const normalized = useMemo(() => {
    const scene = gltf.scene.clone(true);
    const box = new Box3().setFromObject(scene);
    const center = box.getCenter(new Vector3());
    const size = box.getSize(new Vector3());
    scene.position.sub(center);
    return { scene, scale: 3.3 / size.y };
  }, [gltf]);
  useEffect(() => {
    pose.current.invalidate = invalidate;
    onReady();
    invalidate();
    return () => {
      delete pose.current.invalidate;
    };
  }, [invalidate, pose, onReady]);
  useFrame(() => {
    if (root.current) {
      const p = pose.current;
      root.current.rotation.set(0.08, p.rotation, p.tilt);
      root.current.position.y = p.y;
      root.current.scale.setScalar(p.scale);
    }
  });
  return (
    <group ref={root}>
      <group scale={normalized.scale}>
        <primitive object={normalized.scene} dispose={null} />
      </group>
    </group>
  );
}
export default function ProductCanvas({
  asset,
  pose,
  onReady,
  onError,
}: {
  asset: string;
  pose: RefObject<Pose>;
  onReady: () => void;
  onError: () => void;
}) {
  return (
    <CanvasBoundary onError={onError}>
      <Canvas
        frameloop="demand"
        dpr={[1, 1.25]}
        camera={{ position: [0, 0, 6.5], fov: 38 }}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        onCreated={({ gl }) => {
          gl.domElement.setAttribute("aria-hidden", "true");
          gl.domElement.addEventListener("webglcontextlost", onError, {
            once: true,
          });
        }}
      >
        <Studio />
        <AdaptiveQuality />
        <ambientLight intensity={1.1} />
        <hemisphereLight args={["#ffffff", "#6b8634", 2]} />
        <directionalLight position={[4, 5, 5]} intensity={4} />
        <directionalLight position={[-4, 2, 3]} intensity={2} />
        <directionalLight position={[0, 4, -3]} intensity={3} />
        <Suspense fallback={null}>
          <Model asset={asset} pose={pose} onReady={onReady} />
        </Suspense>
      </Canvas>
    </CanvasBoundary>
  );
}
