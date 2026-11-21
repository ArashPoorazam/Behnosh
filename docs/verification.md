# Verification and maintainability review

Verified on 2026-11-21. This is a local showcase, not a production-readiness certification.

## Evidence

- `npm run build`: Next production build and strict TypeScript passed; storefront, orders and admin routes generated successfully.
- `go test -race ./...` with `TEST_DATABASE_URL`: passed using real PostgreSQL isolated schemas. Unit coverage exercises integer totals, overflow, invalid quantities and deterministic/cancelled simulator calls. Integration coverage exercises 16 concurrent customers competing for 5 units (exactly 5 succeed), 12 duplicate concurrent payment requests (one consumption), failure/retry, cancellation, expiry at payment and periodic expiry, historical price snapshots, duplicate checkout keys, role enforcement, cross-session order ownership, CSRF mismatch, untrusted price rejection, session rotation/logout and repeatable seed history.
- Complete Chromium browser flow passed in development and production at 1440×1000 and mobile emulation 390×844. The report and screenshots are generated in `test-results/`. Pack choice and backend total, cart modal Escape/focus restoration, checkout, failed payment then successful retry, admin login, processing/shipped transitions, stock decrement and audited replenishment all passed. Mobile classic selection and cancellation passed. Reduced motion used a poster without canvas. Blocked GLB downloads retained the poster and usable shopping controls. Navigation away/back re-created the scene without uncaught errors.
- Database reconciliation after browser flow returned zero mismatches between on-hand/movement sums and reserved/active reservations. Query plans are in `query-plans.txt`; indexed paths were observed on the small demo dataset, not a load test.
- Desktop/mobile hero and ingredient compositions were visually inspected using the actual Vazirmatn font. Fixed initial horizontal overflow, mobile heading overlap, unlit metallic can rims, and desktop product placement obscuring ingredient copy. Text remains connected Persian; no character splitting.

## Review outcomes

Business logic stays in Go. Request handlers and transactions are grouped by capability, with a single payment finalization path shared by payment/cancellation/expiry. Database ownership and lock ordering are explicit. Only the payment provider has an interface because that is an actual replacement boundary. Frontend components are split into motion, commerce, order and admin panels; formatting expands JSX rather than hiding complexity on single lines. Admin code/styles are route-separated. CSS is divided into base, story, commerce and admin. Readable direct SQL is intentional for this small schema; a generic repository abstraction would add indirection without value.

The motion coordinator owns rotation/tilt/scale and stage translation; entrance animation owns vertical float. Rendering reads refs, not per-frame React state. GSAP media contexts handle breakpoint changes and cleanup. R3F demand rendering stops when settled, visibility suppresses invalidation, and rendering resolution drops once under sustained slow frame timings. Environment textures are disposed on unmount; loaded product resources are cached and reused. There is no perpetual product animation or remote environment asset.

## Limits and prioritized next work

1. **Performance acceptance remains open.** The measured software-GPU environment did not meet consistent 60 fps or the 200 ms interaction target. Test representative midrange Android and iOS hardware on Iranian mobile networks, tune rendering/LOD and input scheduling, then collect field CWV. Lab LCP/CLS alone do not establish field performance.
2. Replace reconstructed tropical artwork with licensed high-resolution/vector print and verify inferred packaging dimensions. Simplification is visually adequate for this prototype, not approved production artwork.
3. Before public production: account recovery/MFA, trusted reverse-proxy rate limiting, operational backups/restores, retention policy, CSP review and deployment/network reachability testing. No provider/CDN recommendation is assumed.
4. Real payment adoption requires verified gateway callbacks, durable initiation/reconciliation, verified amount/reference mapping and refund policy. Do not use the simulator with real money.
5. Multi-warehouse fulfillment/transfer workflow, refunds, customer accounts and shipping are deferred. Extra warehouses support stock management, while customer orders allocate only Tehran stock. Order items/quantities are fixed after checkout.
6. Admin supports existing variant price/name/activation edits; product/variant creation, media uploads, batch import, warehouse renaming and rich order search are not implemented. Order lists support bounded pagination and fulfillment transitions.
7. Accessibility checks cover semantic controls, labels, visible focus, dialog keyboard behavior, reduced motion and responsive overflow; a screen-reader audit and automated contrast audit remain to be performed.

No Git commit was created: the supplied workspace has no usable Git repository metadata. Original source assets were not modified.

Final regression caught a product-switch readiness bug: readiness had been reset by a parent effect while the model's effect did not depend on the new asset. Readiness now tracks the loaded asset identity, with an asset-specific callback; switching assets cannot silently retain another product's readiness flag. The final production browser suite was rerun after this fix.
