"use client";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Box3, Group, PMREMGenerator, Vector3, MathUtils } from "three";
import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import {
  dadliFlavors,
  modelUrl,
  type SceneProduct,
  type FruitKind,
} from "@/lib/showcase";
import { orbitPose } from "@/lib/orbit";
import { FruitMesh } from "./fruit-mesh";
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
    const pmrem = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const target = pmrem.fromScene(room, 0.03);
    scene.environment = target.texture;
    scene.environmentIntensity = 1.1;
    room.dispose();
    pmrem.dispose();
    return () => {
      scene.environment = null;
      target.dispose();
    };
  }, [gl, scene]);
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[-4, 5, 5]} intensity={2.2} />
      <directionalLight position={[4, 2, 0]} intensity={1.5} />
    </>
  );
}
function Product({
  item,
  index,
  onReady,
  progress,
  hero,
  selected = true,
}: {
  selected?: boolean;
  progress?: RefObject<number>;
  hero?: boolean;
  item: SceneProduct;
  index: number;
  onReady: () => void;
}) {
  const gltf = useLoader(GLTFLoader, modelUrl(item.asset));
  const group = useRef<Group>(null);
  const presence = useRef(selected ? 1 : 0);
  const aspect = useThree((s) => s.size.width / s.size.height);
  const model = useMemo(() => {
    const scene = gltf.scene.clone(true);
    const box = new Box3().setFromObject(scene);
    const size = box.getSize(new Vector3());
    scene.position.sub(box.getCenter(new Vector3()));
    return { scene, scale: 3.45 / size.y };
  }, [gltf]);
  useEffect(() => {
    onReady();
  }, [onReady]);
  useFrame(({ clock, pointer }, delta) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    const o = group.current;
    if (hero && progress) {
      const pose = orbitPose(index, progress.current, t);
      o.visible = pose.visible;
      o.position.set(pose.x, pose.y * Math.max(1, 1 / aspect), pose.z);
      o.rotation.set(
        0.17 + Math.sin(t * 0.55 + index) * 0.035,
        pose.turn,
        pose.rotation,
      );
      o.scale.setScalar(pose.scale);
      return;
    }
    presence.current = MathUtils.damp(
      presence.current,
      selected ? 1 : 0,
      7,
      Math.min(delta, 0.05),
    );
    o.visible = presence.current > 0.015;
    o.position.x = item.position[0] + (1 - presence.current) * 3.2;
    o.scale.setScalar((item.scale ?? 1) * presence.current);
    o.position.y = MathUtils.damp(
      o.position.y,
      item.position[1] + Math.sin(t * 0.8 + index) * 0.07,
      5,
      Math.min(delta, 0.05),
    );
    o.rotation.y = MathUtils.damp(
      o.rotation.y,
      item.rotation[1] + pointer.x * 0.12,
      4,
      Math.min(delta, 0.05),
    );
    o.rotation.z = item.rotation[2] + Math.sin(t * 0.6 + index) * 0.018;
  });
  return (
    <group
      ref={group}
      visible={selected}
      position={item.position}
      rotation={item.rotation}
      scale={selected ? (item.scale ?? 1) : 0}
    >
      <group scale={model.scale}>
        <primitive object={model.scene} dispose={null} />
      </group>
    </group>
  );
}
function Fruits({ kind }: { kind: FruitKind }) {
  const group = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (group.current) {
      group.current.position.y = Math.sin(clock.getElapsedTime()) * 0.08;
      group.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.6) * 0.035;
    }
  });
  return (
    <group ref={group}>
      <group
        position={[-1.25, 0.65, 0.1]}
        rotation={[0.16, -0.3, 0.35]}
        scale={0.73}
      >
        <FruitMesh kind={kind} />
      </group>
      <group
        position={[1.15, -0.9, 0.5]}
        rotation={[0.15, 0.25, -0.45]}
        scale={0.9}
      >
        <FruitMesh kind={kind} />
      </group>
    </group>
  );
}
function Composition({
  products,
  fruit,
  onReady,
  progress,
  hero,
  activeAsset,
}: {
  activeAsset?: string;
  progress?: RefObject<number>;
  hero?: boolean;
  products: SceneProduct[];
  fruit?: FruitKind;
  onReady: () => void;
}) {
  const { width, height } = useThree((s) => s.size);
  return (
    <group scale={hero ? Math.min(1, (width / height) * 0.78) : 1}>
      {products.map((p, i) => (
        <Product
          key={`${p.asset}-${i}`}
          item={p}
          index={i}
          onReady={onReady}
          progress={progress}
          hero={hero}
          selected={!activeAsset || p.asset === activeAsset}
        />
      ))}
      {activeAsset
        ? dadliFlavors.map((f) => (
            <group key={f.id} visible={activeAsset === `dadli-${f.id}`}>
              <Fruits kind={f.fruit} />
            </group>
          ))
        : fruit && <Fruits kind={fruit} />}
    </group>
  );
}
export default function ShowcaseCanvas({
  products,
  fruit,
  active,
  progress,
  hero,
  activeAsset,
  onReady,
  onError,
}: {
  progress?: RefObject<number>;
  hero?: boolean;
  activeAsset?: string;
  products: SceneProduct[];
  fruit?: FruitKind;
  active: boolean;
  onReady: () => void;
  onError: () => void;
}) {
  return (
    <Boundary onError={onError}>
      <Canvas
        resize={{ offsetSize: true }}
        frameloop={active ? "always" : "never"}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 8.6], fov: 34 }}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        onCreated={({ gl }) => {
          gl.domElement.setAttribute("aria-hidden", "true");
          gl.domElement.addEventListener("webglcontextlost", onError, {
            once: true,
          });
        }}
      >
        <Studio />
        <Suspense fallback={null}>
          <Composition
            products={products}
            fruit={fruit}
            onReady={onReady}
            progress={progress}
            hero={hero}
            activeAsset={activeAsset}
          />
        </Suspense>
      </Canvas>
    </Boundary>
  );
}
