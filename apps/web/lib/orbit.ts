const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

/** Fixed angular slots preserve order: the opening pair never pass through each other. */
export function orbitPose(index: number, progress: number, time = 0) {
  const p = clamp(progress);
  const spread = smooth(p / 0.25);
  const rotation = smooth((p - 0.16) / 0.84) * Math.PI * 1.6;
  const slots = [
    Math.PI,
    Math.PI * 1.8,
    Math.PI * 0.2,
    Math.PI * 0.6,
    Math.PI * 1.4,
  ];
  const angle =
    slots[index] + (index === 1 ? (1 - spread) * Math.PI * 0.2 : 0) + rotation;
  const arrival = index < 2 ? 1 : smooth((p - 0.26 - (index - 2) * 0.1) / 0.22);
  const radius = 1.75 + spread * 1.7 + (1 - arrival) * 6;
  const idle = Math.sin(time * 0.85 + index * 2.1);
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * (0.12 + spread * 1.65) + idle * 0.055,
    z: Math.sin(angle) * (0.1 + spread * 0.3),
    rotation: -Math.cos(angle) * 0.26 + Math.sin(time * 0.65 + index) * 0.025,
    turn: Math.sin(angle) * 0.25 + Math.sin(time * 0.5 + index) * 0.045,
    scale: 0.85 - spread * 0.42,
    visible: arrival > 0,
  };
}
