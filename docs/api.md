# API contract and security

Open `api/openapi.json` in an OpenAPI viewer. TypeScript `api-schema.d.ts` is generated with openapi-typescript, consumed through openapi-fetch in `apps/web/lib/api.ts`. `scripts/api-contract.py` generates the specification. Browser calls go to the same-origin `/api/v1` namespace; Go owns every business operation.

1. `GET /session` creates/reuses an anonymous HttpOnly SameSite=Lax session and returns `{csrf,admin}`. Only a hash of the cookie token is stored. Customer session expiry is seven days; admin sessions expire after eight hours.
2. Unsafe methods require `Content-Type: application/json` when they accept bodies, exact `Origin: APP_ORIGIN` and `X-CSRF-Token` from that session. Browser middleware adds the latter; browsers provide Origin automatically. CSRF and Origin headers are marked optional in generated call types because middleware/browser own them, but they are **required at runtime**.
3. `GET /catalog`; `GET /cart`; `PUT /cart/items` with `{variant_id,quantity}` (0 deletes, 1–24 sets absolute quantity).
4. `POST /checkout` with `{idempotency_key}` reserves the cart and returns an order. Save and reuse the key after ambiguous network failure.
5. `POST /orders/{id}/payments` with `{idempotency_key,scenario}` accepts `success`, `failure`, or `cancel`. Same key/scenario returns the current order without duplicate effects; differing scenario under the same key conflicts. Failure permits a new attempt/key before expiry.
6. `GET /orders` and `/orders/{id}` are session-scoped. Do not clear the cookie if you need access to anonymous order history.
7. `POST /login`, `/logout` rotate cookie and CSRF tokens. Admin operations check current server-side active user/role on every call, never the UI. Login attempts are limited by hashed direct peer IP in PostgreSQL (10 per 15 minutes); reverse-proxy deployments need a reviewed trusted-proxy rate-limit strategy.
8. Admin endpoints: catalog (includes inactive variants), inventory, warehouses, orders, movements and audit. Variant updates accept integer rial prices. Order updates allow only paid → processing → shipped. Inventory corrections require a nonzero bounded signed delta and reason. Lists of orders/movements/audit support `limit` (1–100) and `offset` (0–100000).

Errors have `{error:{code,message,request_id}}`; `X-Request-ID` correlates structured Go logs. Requests are body-size bounded, reject unknown fields/trailing JSON and enforce ranges. Database failures return generic Persian errors; logs exclude credentials and request bodies. Go uses ten-second request contexts and bounded connection pools. `GET /api/health` checks database readiness.

Public catalog uses content-hash ETags with `public, no-cache`, so both price changes and reservation/stock changes are revalidated. All identity/cart/order/admin responses are private/no-store. No shared user cache. Exact integer rial values are the wire/storage unit; only UI formatting divides by ten.
