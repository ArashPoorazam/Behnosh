# بهنوش · Behnosh

A working Persian RTL beverage showcase: scroll-choreographed real 3D products, product/pack selection, persistent anonymous carts, explicitly simulated payments, order tracking, and authenticated warehouse/order administration. **No real payments or shipping.**

## Run locally

Requires Node 22.9+ (tested with Node 26.2), npm, Go 1.26+ (tested Go 1.27.1), PostgreSQL 16+ executables (including `initdb`, `pg_ctl`, `psql`). Do not run the database script as root.

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm ci
cp .env.example .env
./scripts/dev.sh
```

Open **http://127.0.0.1:3000** (use this exact hostname for Origin/CSRF matching). Admin: **http://127.0.0.1:3000/admin**. Local demonstration login: `admin` / `Behnosh-demo-2026!`. These are development credentials, not hidden secrets. Configure your own before exposing the service. Seed only creates a missing admin and does not reset an existing password.

The script initializes a dedicated `.local/postgres` cluster on port **55432**, builds and starts Go on **8080**, and starts Next on **3000**. Ctrl-C stops the app processes; the local database intentionally persists. Stop it with `pg_ctl -D "$PWD/.local/postgres" stop`. Original assets in `output/` and all original Blender/build files are preserved.

If PostgreSQL is already managed elsewhere, set `DATABASE_URL` in `.env` and run the API/frontend separately instead of `scripts/dev.sh`:

```bash
set -a; source .env; set +a
(cd api && go run -buildvcs=false ./cmd/server)
# In a second terminal:
npm run dev
```

For a production-mode local preview: `npm run build`, then `npm run start -w apps/web`; run Go separately. The `.env.example` documents database URL, bind address, app origin, API origin, and seed admin credentials. HTTPS `APP_ORIGIN` enables Secure session cookies. The Next development/standalone rewrite routes API calls to Go; deployment should route `/api/*` directly at a single-origin reverse proxy. No mandatory external fonts/CDN or real gateway service.

## What works

- Redesigned product journey: glossy three-can hero, restrained editorial typography, four-color Dadli tasting experience, Antarctic ice scene, and connected product selection/purchase.
- Nine repeatably generated showcase models; stripe-free lacquered cans, original-photo Dadli sleeves, and independent tropical/classic single/six-pack SKUs.
- Session-owned carts, live authoritative prices, atomic reservations, idempotent checkout.
- Deterministic success/failure/cancellation; retry after failure; 15-minute reservation expiry.
- Session-scoped order history; admin paid → processing → shipped transitions.
- Multiple inventory warehouses, signed stock adjustments with reasons, movement and audit history, warehouse creation, catalog price/name edits and variant activation.
- Reduced-motion posters, model failure fallback, RTL keyboard flavor tabs, focus-trapped cart dialog, mobile compositions, locally hosted Vazirmatn. Header scrolls away with the opening section.

## Source map

| Location | Responsibility |
|---|---|
| `apps/web/app`, `components`, `lib`, `styles` | Next presentation, GSAP motion, typed API consumer, storefront/admin UI |
| `api/internal/app` | Request validation, authorization, capability-specific business transactions |
| `api/internal/store` | Bounded PostgreSQL pool, migration runner, repeatable seed |
| `api/internal/payment` | Deterministic replaceable simulator boundary |
| `api/migrations` | Versioned relational schema |
| `api/openapi.json` | OpenAPI contract (integer-rial money) |
| `tests`, `scripts` | Browser flows, local setup, asset build and lab measurement |
| `docs` | Architecture, ER diagram, measurements and limitations |

Read [architecture](docs/architecture.md), [data model / ER diagram](docs/data-model.md), [API notes](docs/api.md), [performance and assets](docs/performance.md), and [verification / next steps](docs/verification.md).

## Verification

```bash
npm run typecheck
npm run build
cd api
TEST_DATABASE_URL='postgres://behnosh:behnosh-local@127.0.0.1:55432/behnosh?sslmode=disable' go test -race ./...
cd ..
# With both servers running; Chromium at /usr/bin/chromium or set CHROMIUM_PATH:
npm run test:e2e
node scripts/performance.mjs
```

Go integration tests create/drop isolated random schemas and do not reset application data. Browser tests create clearly simulated orders, consume a tropical six-pack and restore that pack with an audited adjustment. The test fixture assumes the seeded 120-pack stock; use a fresh demonstration database if you have changed inventory. Screenshots and a machine-readable flow report go to ignored `test-results/`. Performance measurements go to `docs/`.

After changing the API contract: edit `scripts/api-contract.py`, run `python scripts/api-contract.py && npm run api:types`. Generated types are committed source artifacts; Go still performs runtime input validation.

## Asset regeneration

Git tracks the editable Blender models, original GLBs, source textures, asset documentation, and optimized runtime assets. Generated standalone preview HTML, ZIP packages, studio renders, diagnostic screenshots, logs, and Blender backup files are ignored. They remain on disk when cleaning an existing checkout; a fresh clone can regenerate previews with `python package_preview.py`, `python package_can.py`, and `python package_can_hq.py`. The bundled `output/model-viewer.min.js` is retained as the offline packaging dependency and marked vendored for GitHub statistics. Render studio images from the saved Blender scenes before creating ZIP bundles. Nothing is removed from existing Git history by this cleanup.

Shipped optimized GLBs and posters require no Blender at runtime. To regenerate, with Blender 4.3+ and source files present:

```bash
mkdir -p .local
blender -b -t 4 --python scripts/render-posters.py
npm run assets
```

Derivatives are written separately under `apps/web/public/assets`. The tropical HQ print is AI-reconstructed and is **not original production artwork**; small lettering and imagery differ. Back surfaces and dimensions are inferred. A supplied high-resolution label is required for brand-accurate close-ups. WebP textures and simplification are used; Draco/Meshopt bitstream compression and KTX2 are deferred until device/decode benchmarks justify them. Version filenames must change whenever deployed asset bytes change.

This is a maintainable showcase MVP, not production certification. No field Core Web Vitals or real-phone frame-rate guarantee is claimed.

## Redesigned showcase assets

Run `npm run assets:showcase` to rebuild the featured product models and compressed web assets in one batch. Source photographs are preserved under `output/showcase/source`; unchanged model recipes are cached. Intermediate showcase GLBs, product renders, hash caches, and size reports are ignored; source images and shipped web assets stay tracked. See [showcase asset notes](output/showcase/README.md) for projection, styling, provenance and versioning. The existing two-product catalog, stock and simulated checkout remain connected; Dadli is a flavor showcase.
