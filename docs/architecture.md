# Behnosh MVP architecture

## Scope and reversible assumptions
A Persian, RTL beverage showcase with a four-stage 3D story, catalog variants, persistent anonymous cart, simulated checkout, order tracking, and authenticated inventory/order administration. Existing product assets are immutable source inputs. The tropical HQ asset is the first prototype candidate; derivatives live under `apps/web/public/assets`. Prices and stock are demonstration data, not commercial claims. Two real supplied product forms (tropical can and classic bottle) and pack-size SKUs avoid inventing artwork for flavors we do not have.

Local deployment is the delivery target: Next.js presentation on :3000, a Go modular monolith on :8080, PostgreSQL on :5432 (development script uses :55432). A production reverse proxy routes `/api/*` directly to Go and all other requests to Next.js, under one HTTPS origin. Next's development rewrite supplies the same routing locally. No Next business API, Redis, remote fonts, payment credentials, or mandatory external CDN. Iranian network/provider reachability must be measured before choosing hosting.

## Repository and boundaries
- `apps/web`: strict TypeScript, Next App Router, React, GSAP/ScrollTrigger, R3F/Three, self-hosted Persian font; separate admin route chunk.
- `api/internal/app`: HTTP boundary, validation/authentication and business capabilities in focused files.
- `api/internal/store`: PostgreSQL pool, versioned migration runner and repeatable demonstration seed.
- `api/internal/payment`: replaceable deterministic payment adapter; never touches inventory.
- `api/migrations`: relational constraints and indexes; no core JSON storage.
- `api/openapi.json`: API contract; generated TypeScript schema and typed fetch client.
- `scripts`, `tests`, `docs`: reproducible setup, browser flow checks, decisions and measured results.
Go alone owns prices, totals, stock, permissions, reservation and payment state transitions. Frontend money utilities only format integer rials as tomans.

## Data and invariants
A product identifies marketing content; a variant identifies a sellable pack with unique SKU and integer rial price. Product categories and warehouse identities are normalized. Inventory is counted in sellable packs, per variant/warehouse. `on_hand` includes reserved stock; `available = on_hand - reserved`. Both balances are nonnegative and `reserved <= on_hand`. All stock mutations lock balance rows in sorted SKU order, update balances, append signed movements for physical changes, and write audit records in one transaction. Reservations are separate allocation records with expiry and status. A single fulfillment warehouse per order is the deliberate MVP constraint.

Carts belong to an opaque server-side anonymous session. Checkout locks the cart, re-reads current prices, locks stock, snapshots order lines, and reserves atomically. The cart revision prevents two idempotency keys from checking out the same contents. Checkout keys are unique per session; payment attempts are unique per order/key. Payment effects lock the order and reservation: success decrements on-hand and reserved once; failure keeps reservation for retry; cancellation releases it. A periodic sweeper releases reservations after 15 minutes and marks pending orders expired. Transactions never span a provider request. A future remote gateway needs verified callbacks/reconciliation; the current adapter resolves deterministically and locally.

Order-line names, SKU, unit price and quantity are intentional historical snapshots: later catalog edits must not rewrite the purchase. Totals are integer `BIGINT` rials and checked for overflow; quantities and maximum prices are bounded. Display conversion is 10 rials = 1 toman, centralized. Operational entities are deactivated, not blanket soft deleted. Foreign keys restrict deletion of referenced history; only ephemeral cart items cascade with their cart. Inventory and payment histories are immutable through the API. Admin order workflow is paid → processing → shipped; paid-order refunds are deferred, so cancellation applies only to pending orders.

## API, sessions and authorization
JSON API `/api/v1`; explicit runtime decoding, unknown-field rejection, length/range validation and bounded request bodies. OpenAPI describes requests/responses. Uniform error envelope with request ID. Cookie tokens use cryptographic randomness and only SHA-256 digests are persisted. HttpOnly, SameSite=Lax, path=/, Secure in HTTPS deployments. Session bootstrap returns a CSRF token; all unsafe requests require matching Origin and the session CSRF token. Admin login rotates the session, uses bcrypt, bounded attempts and expiry. Every admin endpoint checks the server-side role. Anonymous order reads are scoped to the same session. No PII is needed for simulated fulfillment.

## Motion and accessibility
One persistent product stage spans hero → ingredient reveal → product choice → purchase. GSAP owns the scene pose and section choreography; R3F reads an imperative pose and renders only when invalidated. No React updates per frame. Rotation is driven by scroll, with a finite entrance float. Responsive framing/DPR cap; no postprocessing. Static locally generated product poster remains meaningful before model loading or if WebGL fails. Reduced motion uses the poster and unpinned semantic sections. Animation cleanup uses scoped GSAP contexts. Persian copy animates by block/word, never disconnected letters. All shopping controls are DOM controls outside canvas; focus, keyboard, responsive layouts, error/empty states and dialog focus restoration are required.

## Caching, operations and deferred work
Versioned assets use immutable cache headers. Catalog responses use ETag/revalidation with `no-cache`; ETags are hashes of the complete current response including stock, so catalog edits and reservations invalidate correctly without a server cache. Sessions, carts, orders and admin use `private, no-store`. Go revalidates checkout irrespective of browser state. Bounded pool and HTTP timeouts, context propagation, structured request logs without payloads/tokens, graceful shutdown and readiness checks. No claim of production readiness; MFA, password reset, real customer accounts, shipping integration, refunds, multi-warehouse allocation and real payments are deferred.

## Acceptance evidence
First inspect desktop/mobile motion prototype with actual model. Then exercise cart → payment success/failure/cancel/retry → admin inventory; test concurrency, expiration, duplicate keys, access control, money arithmetic. Build strict TypeScript and Go race tests. Report browser/device environment, asset size and geometry; distinguish lab timings from field CWV and measured FPS. Finish with maintainability review and documented limitations.
