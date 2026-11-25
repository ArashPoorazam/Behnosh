"use client";

import { useEffect, useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { LatheGeometry, SRGBColorSpace, TextureLoader, Vector2 } from "three";
import models from "@/lib/brand-models.json";

export function BrandProductModel({ id }: { id: string }) {
  const model = models[id as keyof typeof models];
  const source = useLoader(TextureLoader, `/assets/catalog/${id}-v1.webp`);
  const texture = useMemo(() => {
    const result = source.clone();
    result.colorSpace = SRGBColorSpace;
    result.needsUpdate = true;
    return result;
  }, [source]);
  const [front, back] = useMemo(() => {
    const points = model.profile
      .map(
        (radius, index) =>
          new Vector2(radius, 1.7 - (index / (model.profile.length - 1)) * 3.4),
      )
      .reverse();
    const front = new LatheGeometry(points, 64, -Math.PI / 2, Math.PI);
    const back = new LatheGeometry(points, 64, Math.PI / 2, Math.PI);
    const positions = front.attributes.position;
    const uv = front.attributes.uv;
    for (let i = 0; i < positions.count; i++) {
      uv.setXY(
        i,
        0.5 + (positions.getX(i) / (3.4 * model.aspect)) * 0.96,
        ((positions.getY(i) + 1.7) / 3.4) * 0.992 + 0.004,
      );
    }
    return [front, back];
  }, [model]);
  useEffect(
    () => () => {
      front.dispose();
      back.dispose();
      texture.dispose();
    },
    [front, back, texture],
  );
  const can = model.kind === "can";
  const radius = model.profile[1];
  const capColor = can
    ? "#cbd0d6"
    : id === "127"
      ? "#df438a"
      : id === "143"
        ? "#d52b20"
        : "#bec2c8";
  return (
    <group>
      <mesh geometry={front}>
        <meshPhysicalMaterial
          map={texture}
          roughness={0.36}
          metalness={can ? 0.22 : 0.05}
          clearcoat={0.65}
          clearcoatRoughness={0.2}
        />
      </mesh>
      <mesh geometry={back}>
        <meshPhysicalMaterial
          color={model.color}
          roughness={0.3}
          metalness={can ? 0.45 : 0.12}
          clearcoat={1}
        />
      </mesh>
      <mesh position={[0, 1.69, 0]}>
        <cylinderGeometry
          args={[radius * 0.96, radius, can ? 0.045 : 0.075, 64]}
        />
        <meshStandardMaterial
          color={capColor}
          metalness={0.82}
          roughness={0.23}
        />
      </mesh>
      <mesh position={[0, -1.69, 0]}>
        <cylinderGeometry
          args={[model.profile.at(-2), model.profile.at(-2), 0.035, 64]}
        />
        <meshStandardMaterial
          color={can ? "#a3a8ad" : model.color}
          metalness={0.5}
          roughness={0.28}
        />
      </mesh>
      {can && (
        <>
          <mesh position={[0, 1.72, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[radius * 0.94, 0.018, 8, 64]} />
            <meshStandardMaterial
              color="#e8ebed"
              metalness={1}
              roughness={0.2}
            />
          </mesh>
          <mesh
            position={[0, 1.725, 0.04]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[0.65, 1, 1]}
          >
            <torusGeometry args={[radius * 0.28, 0.035, 8, 32]} />
            <meshStandardMaterial
              color="#a1a6aa"
              metalness={1}
              roughness={0.25}
            />
          </mesh>
        </>
      )}
    </group>
  );
}
