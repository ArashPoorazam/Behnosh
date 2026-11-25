const clamp = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => {
  const t = clamp(v);
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const tau = Math.PI * 2;
const slots = [Math.PI, 0, 0.72, 2.25, 4.85];
const radii = [2.75, 3.1, 2.6, 3.45, 3.0];
const entries = [0, 0, 0.34, 0.42, 0.5];
const finish = [
  [1.0, -0.55, 1.1],
  [4.0, -0.45, 0.8],
  [2.7, -0.8, 1.5],
  [1.8, 1.0, -1.0],
  [3.6, 1.15, -1.2],
];
export type OrbitPose = {
  x: number;
  y: number;
  z: number;
  pitch: number;
  rotation: number;
  turn: number;
  scale: number;
  visible: boolean;
};

function rawPose(index: number, p: number, time: number): OrbitPose {
  const join = index < 2 ? 1 : smooth((p - entries[index]) / 0.16);
  const travel = smooth((p - 0.06) / 0.72);
  const settle = smooth((p - 0.68) / 0.32);
  // A shared left-to-right revolution, with unequal radii and staggered arrivals.
  const phase = slots[index] + travel * tau;
  const radius = radii[index];
  const opening = smooth((p - 0.03) / 0.16);
  const idle = Math.sin(time * 0.9 + index * 1.8);
  const x = mix(index === 0 ? -3.65 : 3.65, Math.cos(phase) * radius, opening);
  const y = Math.sin(phase) * 0.48 + idle * 0.1;
  const z = opening * (0.65 + Math.sin(phase) * 0.55);
  const [targetX, finalY, finalZ] = finish[index];
  const finalX = targetX - 0.55;
  return {
    x: mix(index < 2 ? x : Math.cos(phase) * radius, finalX, settle),
    y:
      mix(index < 2 ? y : mix(8 + index * 0.7, y, join), finalY, settle) +
      idle * 0.045,
    z: mix(z, finalZ, settle),
    pitch:
      0.12 + Math.sin(phase) * 0.14 + Math.sin(time * 0.65 + index) * 0.035,
    rotation:
      mix(
        (index % 2 ? -0.24 : 0.24) + Math.sin(phase) * 0.22,
        index % 2 ? -0.12 : 0.12,
        settle,
      ) +
      idle * 0.025,
    turn: Math.sin(phase) * 0.24 + Math.sin(time * 0.6 + index) * 0.055,
    scale: mix(
      index < 2 ? mix(1.02, 0.83, smooth((p - 0.24) / 0.45)) : 0.76,
      index === 0 ? 0.82 : 0.76,
      settle,
    ),
    visible: index < 2 || p > entries[index],
  };
}

// Upright cans use an elongated collision envelope instead of a tumble-sized sphere.
// Deterministic projection prevents intersections without a frame-dependent physics loop.
function separate(poses: OrbitPose[]) {
  for (let pass = 0; pass < 24; pass++) {
    let overlap = false;
    for (let i = 0; i < poses.length; i++)
      for (let j = i + 1; j < poses.length; j++) {
        const a = poses[i],
          b = poses[j];
        if (!a.visible || !b.visible) continue;
        const dx = b.x - a.x,
          dy = b.y - a.y,
          dz = b.z - a.z;
        const distance = Math.hypot(dx, dy * 0.4, dz);
        const clearance = 0.78 * (a.scale + b.scale) + 0.04;
        if (distance >= clearance) continue;
        const push = (clearance - distance) / (2 * Math.max(distance, 0.00001));
        a.x -= dx * push;
        a.y -= dy * push;
        a.z -= dz * push;
        b.x += dx * push;
        b.y += dy * push;
        b.z += dz * push;
        overlap = true;
      }
    if (!overlap) break;
  }
}
let cached:
  | { p: number; time: number; compact: boolean; poses: OrbitPose[] }
  | undefined;
/** Shared frame calculation for WebGL and the depth-aware image fallback. */
export function orbitPose(
  index: number,
  progress: number,
  time = 0,
  compact = false,
): OrbitPose {
  const p = clamp(progress);
  if (
    !cached ||
    cached.p !== p ||
    cached.time !== time ||
    cached.compact !== compact
  ) {
    const poses = Array.from({ length: 5 }, (_, i) => rawPose(i, p, time));
    separate(poses);
    const size = compact ? 0.7 : 1;
    for (const pose of poses) {
      pose.x *= size;
      pose.y = pose.y * size - (compact ? 1.15 : 0);
      pose.z *= size;
      pose.scale *= size;
    }
    cached = { p, time, compact, poses };
  }
  return cached.poses[index];
}
