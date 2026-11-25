import assert from "node:assert/strict";
import {
  advanceProductSpin,
  createProductSpin,
} from "../apps/web/lib/product-spin.ts";
const step = 1 / 240;
const spin = createProductSpin("242");
let swapped = false;
let previousSpeed = 0;
let elapsed = 0;
while (elapsed < 1.2) {
  const phase = spin.phase;
  advanceProductSpin(spin, "243", step);
  elapsed += step;
  if (spin.displayed === "242") {
    assert.ok(spin.speed >= previousSpeed, "Outgoing product accelerates");
  } else if (!swapped) {
    swapped = true;
    assert.ok(
      Math.abs(Math.cos(spin.angle) + 1) < 1e-9,
      "Exchange occurs with the back toward the camera",
    );
    assert.equal(spin.speed, 60, "Exchange occurs at peak spin speed");
    assert.ok(elapsed < 0.35, "Spin reaches the exchange quickly");
  } else if (phase === "decelerate") {
    assert.ok(
      spin.speed <= previousSpeed,
      "Incoming product slows down continuously",
    );
  }
  previousSpeed = spin.speed;
  if (swapped && spin.phase === "idle") break;
}
assert.ok(swapped);
assert.equal(spin.displayed, "243");
assert.equal(spin.angle, 0, "Final label faces forward");
assert.equal(spin.speed, 0, "Spin settles completely");
assert.ok(elapsed < 0.85, "Transition completes in under a second");

for (const initialAngle of [-4, -0.4, 1, 8]) {
  const s = createProductSpin("242");
  s.angle = initialAngle;
  for (let i = 0; i < 300; i++) advanceProductSpin(s, "241", step);
  assert.equal(s.displayed, "241");
  assert.equal(
    s.angle,
    0,
    "Dragging before selection still finishes front-facing",
  );
}

const rapid = createProductSpin("242");
for (let i = 0; i < 600; i++) {
  const selected = i < 20 ? "243" : i < 105 ? "241" : i < 140 ? "242" : "145";
  const previousAngle = rapid.angle;
  advanceProductSpin(rapid, selected, step);
  if (rapid.phase !== "idle") {
    assert.ok(
      rapid.angle >= previousAngle,
      "Rapid selection never reverses or jumps backwards",
    );
    assert.ok(
      rapid.angle - previousAngle <= 60 * step + 1e-8,
      "Interruptions preserve angular continuity",
    );
  }
  assert.ok(
    rapid.speed <= 60 + 1e-8,
    "Rapid selection cannot run away to excessive speed",
  );
}
assert.equal(rapid.displayed, "145", "Latest selection wins");
assert.equal(rapid.phase, "idle");
assert.equal(rapid.angle, 0);
console.log(
  "PASS Start: acceleration, rear-facing exchange, deceleration, forward stop, drag continuity and rapid selection",
);
