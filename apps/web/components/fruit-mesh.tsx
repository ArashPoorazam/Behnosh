"use client";
import { useMemo, useEffect } from "react";
import { fruitTexture } from "./fruit-textures";
import { Shape } from "three";
import type { FruitKind } from "@/lib/showcase";
function Leaf({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <mesh
      position={position}
      rotation={[0, 0, rotation]}
      scale={[0.13, 0.4, 0.045]}
    >
      <sphereGeometry args={[1, 16, 12]} />
      <meshStandardMaterial color="#397330" roughness={0.4} />
    </mesh>
  );
}
function useFoodTexture(kind: Parameters<typeof fruitTexture>[0]) {
  const map = useMemo(() => fruitTexture(kind), [kind]);
  useEffect(() => () => map.dispose(), [map]);
  return map;
}
function Citrus() {
  const map = useFoodTexture("citrus");
  const wedges = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const shape = new Shape();
        const a = (i * Math.PI) / 5 + 0.035,
          b = ((i + 1) * Math.PI) / 5 - 0.035;
        shape.moveTo(0.06 * Math.cos(a), 0.06 * Math.sin(a));
        shape.lineTo(0.53 * Math.cos(a), 0.53 * Math.sin(a));
        shape.absarc(0, 0, 0.53, a, b, false);
        shape.lineTo(0.06 * Math.cos(b), 0.06 * Math.sin(b));
        shape.closePath();
        return shape;
      }),
    [],
  );
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.64, 0.64, 0.18, 64]} />
        <meshStandardMaterial color="#f39916" roughness={0.42} />
      </mesh>
      <mesh position={[0, 0, 0.097]}>
        <circleGeometry args={[0.59, 64]} />
        <meshStandardMaterial color="#fff0b9" roughness={0.5} />
      </mesh>
      {wedges.map((shape, i) => (
        <mesh key={i} position={[0, 0, 0.105]}>
          <extrudeGeometry
            args={[
              shape,
              {
                depth: 0.025,
                bevelEnabled: true,
                bevelSize: 0.01,
                bevelThickness: 0.015,
                bevelSegments: 2,
                steps: 1,
              },
            ]}
          />
          <meshPhysicalMaterial
            map={map}
            bumpMap={map}
            bumpScale={0.025}
            color={i % 2 ? "#ffffff" : "#ffcf80"}
            roughness={0.32}
            clearcoat={0.4}
          />
        </mesh>
      ))}
      <Leaf position={[0.4, 0.65, 0]} rotation={-0.65} />
    </group>
  );
}
function Peach() {
  const flesh = useFoodTexture("peach");
  const pit = useFoodTexture("pit");
  return (
    <group>
      <mesh scale={[0.65, 0.63, 0.35]}>
        <sphereGeometry args={[1, 48, 32]} />
        <meshStandardMaterial color="#ef8b60" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0, 0.24]} scale={[0.57, 0.56, 0.13]}>
        <sphereGeometry args={[1, 48, 32]} />
        <meshPhysicalMaterial
          map={flesh}
          bumpMap={flesh}
          bumpScale={0.012}
          roughness={0.36}
          clearcoat={0.25}
        />
      </mesh>
      <mesh position={[0, -0.04, 0.35]} scale={[0.22, 0.29, 0.11]}>
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial
          map={pit}
          bumpMap={pit}
          bumpScale={0.06}
          roughness={0.9}
        />
      </mesh>
      <Leaf position={[0.23, 0.65, 0]} rotation={-0.7} />
    </group>
  );
}
function Coconut() {
  const shell = useFoodTexture("shell");
  return (
    <group>
      <mesh scale={[0.65, 0.62, 0.38]}>
        <sphereGeometry args={[1, 48, 32]} />
        <meshStandardMaterial
          map={shell}
          bumpMap={shell}
          bumpScale={0.05}
          roughness={0.96}
        />
      </mesh>
      <mesh position={[0, 0, 0.3]}>
        <ringGeometry args={[0.37, 0.58, 64]} />
        <meshStandardMaterial color="#fff5db" roughness={0.48} />
      </mesh>
      <mesh position={[0, 0, 0.24]}>
        <circleGeometry args={[0.38, 48]} />
        <meshPhysicalMaterial
          color="#b9d8c2"
          roughness={0.12}
          metalness={0.15}
          clearcoat={1}
        />
      </mesh>
    </group>
  );
}
function Pineapple() {
  return (
    <group scale={0.8}>
      <mesh scale={[0.6, 0.8, 0.5]}>
        <icosahedronGeometry args={[1, 3]} />
        <meshStandardMaterial color="#e6a32a" roughness={0.65} flatShading />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => (
        <Leaf
          key={i}
          position={[Math.sin(i) * 0.22, 0.9, Math.cos(i) * 0.12]}
          rotation={(i - 3) * 0.25}
        />
      ))}
    </group>
  );
}
export function FruitMesh({ kind }: { kind: FruitKind }) {
  return kind === "orange" ? (
    <Citrus />
  ) : kind === "peach" ? (
    <Peach />
  ) : kind === "coconut" ? (
    <Coconut />
  ) : (
    <Pineapple />
  );
}
