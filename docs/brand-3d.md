# Brand product scenes

The four campaign pages use procedural Three.js meshes, not rotating flat images.
`scripts/prepare-brand-models.mjs` samples the alpha silhouettes of the existing
catalog photos to generate `apps/web/lib/brand-models.json`. Front photographs
are projected onto the curved meshes. Unseen backs, caps and bases are inferred
surfaces, not manufacturer-supplied CAD or complete packaging artwork.

Run `node scripts/prepare-brand-models.mjs` after changing a catalog photograph.
The models add no new image downloads: they reuse the small catalog WebP files.
WebGL is dynamically loaded. Original photos remain visible while loading and
when WebGL is unavailable or loses context. Reduced motion retains static 3D
and direct keyboard/drag rotation, but disables idle motion, spins and bursts.
Rendering pauses while the document is hidden.

- Aloe: leaf-shaped choices, rising product transition, dew and water ripple.
- Start: gold medallions, twisting reveal, gold spark burst.
- Synergy: instrument dials on an oval track, lateral change, red/blue streaks.
- Vitamin C: a single product with an orbit button, full rotation and fizz burst.

Drag products to rotate. Left/right arrow keys rotate a focused model; Home
resets its orientation. Product selectors also support left/right, Home and End.
