# Showcase product assets

Rebuild all nine featured products with `npm run assets:showcase` from the repository root. Blender, Node and the existing npm dependencies are required. The script skips unchanged products using source + recipe + generator hashes. Optimization writes self-contained GLBs and transparent WebP posters to `apps/web/public/assets/showcase`.

- `scripts/showcase-products.json`: the only per-product recipe: source image, profile, lacquer color, label bounds.
- `scripts/build-showcase.py`: shared lathe geometry, original-photo projection, crown or aluminium lid, condensation, studio lighting and poster rendering.
- `scripts/optimize-showcase.mjs`: welding, deduplication, embedded WebP textures, lightweight transparent posters and background compression.
- `source/`: unmodified product photographs supplied by the user. The tropical can reuses the existing project's original source photograph. Fresh source images can be read from `BEVERAGE_SOURCE_DIR` if they have not already been copied here.
- `antarctic.png`: generated backdrop, no generated branding or product artwork.
- `manifest.json`: generated runtime file-size report (ignored by Git).

The can shell has no photographed stripes: its oval label is a separate curved decal over smooth lacquer. Back surfaces, dimensions and hidden geometry are inferred, not production CAD. Labels retain the source resolution and cannot support microscopic close-ups. The four Dadli flavor notes are explicitly illustrative, not ingredient or nutritional declarations.

Runtime scenes use demand loading near the viewport, suspend offscreen animation, and show static posters for reduced motion or WebGL failure. The glacier uses these model renders, with a foreground ice layer. Procedural fruit meshes and textures live in the frontend; they require no generated/downloaded image assets.

Original Blender projects and earlier asset versions remain preserved. Change the runtime version suffix in the asset builder and consumers when replacing assets after deployment because the application serves these URLs with immutable caching.

Git keeps the source photographs, Antarctic backdrop, build recipes, and optimized runtime assets. Intermediate GLBs, PNG product renders, hash caches, and the generated size report are ignored and can be rebuilt with the command above. Removing them from tracking leaves local copies on disk.
