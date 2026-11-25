const TAU = Math.PI * 2;
const PEAK_SPEED = 60;

export type ProductSpin = {
  displayed: string;
  phase: "idle" | "accelerate" | "decelerate";
  angle: number;
  speed: number;
  elapsed: number;
  duration: number;
  from: number;
  target: number;
  initialSpeed: number;
};

export function createProductSpin(displayed: string): ProductSpin {
  return {
    displayed,
    phase: "idle",
    angle: 0,
    speed: 0,
    elapsed: 0,
    duration: 0,
    from: 0,
    target: 0,
    initialSpeed: 0,
  };
}

// Exchange products while their backs face the camera, at maximum angular speed.
// Carry velocity through interruptions and finish on an exact front-facing turn.
export function advanceProductSpin(
  spin: ProductSpin,
  selected: string,
  dt: number,
) {
  if (selected !== spin.displayed && spin.phase !== "accelerate") {
    spin.phase = "accelerate";
    spin.from = spin.angle;
    spin.target = Math.PI + TAU * Math.ceil((spin.angle + TAU - Math.PI) / TAU);
    spin.initialSpeed = spin.speed;
    spin.duration = (2 * (spin.target - spin.from)) / (spin.speed + PEAK_SPEED);
    spin.elapsed = 0;
  }
  if (spin.phase === "idle") return;
  spin.elapsed = Math.min(spin.elapsed + dt, spin.duration);
  const p = spin.elapsed / spin.duration;
  const distance = spin.target - spin.from;
  if (spin.phase === "accelerate") {
    const acceleration = (PEAK_SPEED - spin.initialSpeed) / spin.duration;
    spin.angle =
      spin.from +
      spin.initialSpeed * spin.elapsed +
      (acceleration * spin.elapsed ** 2) / 2;
    spin.speed = spin.initialSpeed + acceleration * spin.elapsed;
    if (p === 1) {
      spin.displayed = selected;
      spin.phase = "decelerate";
      spin.from = spin.target;
      spin.target += 3 * Math.PI;
      spin.duration = (3 * (spin.target - spin.from)) / PEAK_SPEED;
      spin.elapsed = 0;
    }
  } else {
    spin.angle = spin.from + distance * (1 - (1 - p) ** 3);
    spin.speed = ((3 * distance) / spin.duration) * (1 - p) ** 2;
    if (p === 1) {
      spin.phase = "idle";
      spin.angle = 0;
      spin.speed = 0;
    }
  }
}
