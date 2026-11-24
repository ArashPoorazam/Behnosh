# Official product catalog import

Collected on 24 November 2026 from [Behnoush Iran](https://behnoushiran.com/محصولات).

The official product feed contains **107 distinct source product IDs across nine pages, 13 brands and nine source categories**. Every ID was checked against the purchase selector on every detail page. Each product's name, description, brand, flavor, packaging and volume was read from the listing and detail page; all detail facts agree with the listing. Original Persian wording is preserved. Volume is also normalized to integer milliliters.

| Brand | Source products |
|---|---:|
| دلستر | 48 |
| مالشعیر بهنوش | 4 |
| تاک | 9 |
| دوغ آبعلی | 4 |
| موهیتو | 3 |
| لیموناد | 3 |
| سینرژی | 4 |
| ویتامین سی | 1 |
| استارت | 5 |
| آلوئه ورا | 2 |
| دادلی | 13 |
| ایراندا | 9 |
| آب آشامیدنی | 2 |

## Database behavior

- **96 new products** are inserted into `products` with `active=false`, an empty 3D `asset`, and no sellable variants, prices or inventory. Presentation and commerce setup are deferred.
- **11 existing showcase products** are matched by verified source ID, brand, flavor, packaging and volume. Their current names, descriptions, 3D assets, active status, demo variants, prices and stock are preserved.
- `product_sources` has one row per official source product, linked to `products`. It stores the official title and description separately from curated storefront copy, exact source category, brand, flavor, packaging, original volume label, normalized volume, source URL and ID, image location and checksum, detail checksum, raw detail facts and collection time.
- Repeating the import updates source metadata without duplicating products or overwriting storefront edits. The batch uses a transaction and the same advisory lock as migrations/seeding. It never deletes products absent from a later snapshot.
- The demo seed is restricted to its original eleven products. Restarting the API does not assign fabricated offers or stock to catalog drafts.
- The current public and admin commerce catalog queries require variants and warehouse balances. The 96 drafts are intentionally database-only for now; they will need a separate catalog-management/presentation flow later.

## Saved source data

`api/catalog/products.json` contains all 107 records and their provenance. `api/catalog/images/` contains 107 unmodified PNG files (approximately 14.4 MB total). Paths stored in the database are repository-relative original asset paths, not public URLs or 3D model identifiers. Source image URLs are also retained. Images are not added to the web bundle yet.

There are 105 distinct image checksums: the official website reuses the same barrel photograph for classic and lemon at each of the 10-liter and 20-liter sizes. These remain distinct products. The title for source **142** says glass (`شیشه`) while its structured packaging says PET (`پت`), volume 1000 ml. Both source values are preserved for later editorial review. Names are not used as unique keys because several package sizes share a title. No prices, stock, ingredient lists, nutrition claims or manufacturer SKUs were invented.

## Repeat the import

Start the API once on a new database to apply migrations and create the original showcase seed. Then, from the repository root:

```bash
set -a
source .env
set +a
cd api
go run -buildvcs=false ./cmd/import-catalog -dry-run
go run -buildvcs=false ./cmd/import-catalog
```

The dry run validates all saved image checksums and exercises the complete import, then rolls back product/source changes. It still applies schema migrations. The command requires the original showcase seed to exist, preventing a fresh import from occupying its IDs before its demo assets are seeded.

To recollect source data, run `python scripts/collect-catalog.py` from the root. It uses only Python's standard library, four concurrent detail/image requests, retries and a local cache under `.local/catalog-source/`. Remove that cache before requesting a fresh snapshot; otherwise it resumes the cached collection. It validates all pagination counts, unique IDs/URLs, the purchase dropdown, image signatures and detail titles before writing the final snapshot. Recollection is separate from the database import and does not publish anything.

## Verification

The local `behnosh` database was imported successfully: **107 products, 107 source records, 11 active showcase products and 96 inactive drafts**. A second actual import created zero additional products. Before/after comparisons confirmed that all existing product rows, 22 variants, inventory balances, stock movements and orders were unchanged. All 107 saved PNG files decode successfully. `go test -race ./...` passed against PostgreSQL; the focused catalog test also passed after the final seeded-catalog guard was added.

`TestOfficialCatalogImport` uses an isolated PostgreSQL schema to verify the 96/11 mapping, dry-run rollback, atomic rollback on a late duplicate URL, repeat import, exact preservation of the public catalog and prevention of new demo offers/stock on reseeding. Existing API integration tests exercise cart, checkout, payment, inventory and admin behavior.

A pre-import PostgreSQL backup is retained locally at `.local/before-catalog-import.dump` (ignored by Git).
