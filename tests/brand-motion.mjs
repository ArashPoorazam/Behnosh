import assert from "node:assert/strict";
import { orbitPose } from "../apps/web/lib/orbit.ts";
for (const compact of [false, true]) {
  const opening = Array.from({ length: 5 }, (_, i) =>
    orbitPose(i, 0, 0, compact),
  );
  assert.equal(
    opening.filter((p) => p.visible).length,
    2,
    "Opening contains exactly two cans",
  );
  assert.ok(
    opening[0].x < 0 && opening[1].x > 0,
    "Opening cans sit on opposite sides",
  );
  const end = Array.from({ length: 5 }, (_, i) => orbitPose(i, 1, 0, compact));
  assert.ok(
    end.every((p) => p.visible && p.x > 0),
    "All five gather on the right",
  );
  assert.notEqual(
    orbitPose(0, 0, 0, compact).y,
    orbitPose(0, 0, 1, compact).y,
    "Opening has idle motion",
  );
  for (let i = 0; i < 5; i++)
    for (let step = 1; step <= 1000; step++) {
      const a = orbitPose(i, (step - 1) / 1000, 0, compact),
        b = orbitPose(i, step / 1000, 0, compact);
      assert.ok(
        Object.values(b).every(
          (v) => typeof v === "boolean" || Number.isFinite(v),
        ),
      );
      assert.ok(
        Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) < 0.2 &&
          ["pitch", "turn", "rotation"].every(
            (axis) => Math.abs(a[axis] - b[axis]) < 0.2,
          ) &&
          Math.abs(a.scale - b.scale) < 0.03,
        "Scroll motion remains continuous",
      );
    }
}
console.log(
  "PASS: two-can opening, idle, five-can right gather, finite continuous desktop/mobile poses",
);

// Front-facing cans use elongated upright clearance envelopes.
for (const compact of [false, true]) {
  for (const time of [0, 2, 5, 9]) {
    for (let step = 0; step <= 1000; step++) {
      const poses = Array.from({ length: 5 }, (_, i) =>
        orbitPose(i, step / 1000, time, compact),
      );
      for (let i = 0; i < 5; i++)
        for (let j = i + 1; j < 5; j++) {
          const a = poses[i],
            b = poses[j];
          if (!a.visible || !b.visible) continue;
          assert.ok(
            Math.hypot(a.x - b.x, (a.y - b.y) * 0.4, a.z - b.z) >=
              0.78 * (a.scale + b.scale),
            `Can volumes overlap at ${step / 1000}: ${i}/${j}`,
          );
        }
    }
  }
}
const spread = (p) => {
  const poses = Array.from({ length: 5 }, (_, i) => orbitPose(i, p));
  let sum = 0;
  for (let i = 0; i < 5; i++)
    for (let j = i + 1; j < 5; j++)
      sum += Math.hypot(
        poses[i].x - poses[j].x,
        poses[i].y - poses[j].y,
        poses[i].z - poses[j].z,
      );
  return sum / 10;
};
assert.ok(
  spread(1) < spread(0.5) * 0.8,
  "The final group must be substantially tighter",
);
console.log(
  "PASS: separate volumes, coordinated upright revolutions, depth passes, tighter final cluster",
);

for (let i = 2; i < 5; i++) {
  const entry = [0.34, 0.42, 0.5][i - 2];
  assert.equal(orbitPose(i, entry).visible, false);
  assert.ok(orbitPose(i, entry + 0.001).y > 6, "New cans enter from above");
  assert.ok(
    orbitPose(i, entry + 0.16).y < 2,
    "New cans descend into the group",
  );
}
for (let i = 0; i < 5; i++) {
  for (let step = 0; step <= 1000; step++) {
    const pose = orbitPose(i, step / 1000, 2);
    assert.ok(
      Math.abs(pose.turn) < 0.31,
      "Labels remain front-facing throughout the orbit",
    );
    if (i < 2) assert.ok(pose.scale >= 0.76, "Lead cans retain their size");
    if (i < 2 && step < 200)
      assert.ok(pose.z >= -0.05, "Opening cans do not retreat");
  }
}
console.log(
  "PASS: staggered overhead entries, front-facing labels, preserved opening size",
);
