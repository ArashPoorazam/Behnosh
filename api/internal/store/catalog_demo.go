package store

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// EnableCatalogDemo is an explicit opt-in, never part of normal server startup.
// Only imported drafts without offers are activated; existing commercial edits,
// reservations, prices and stock are preserved, including on subsequent runs.
func EnableCatalogDemo(ctx context.Context, db *pgxpool.Pool) (int, error) {
	tx, err := db.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)
	if _, err = tx.Exec(ctx, "SELECT pg_advisory_xact_lock(712039)"); err != nil {
		return 0, err
	}
	var count int
	if err = tx.QueryRow(ctx, "SELECT count(*) FROM product_sources").Scan(&count); err != nil {
		return 0, err
	}
	if count != 107 {
		return 0, fmt.Errorf("import the complete 107-product catalog before enabling demo offers")
	}
	var warehouseReady bool
	if err = tx.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM warehouses WHERE id='tehran' AND active)").Scan(&warehouseReady); err != nil {
		return 0, err
	}
	if !warehouseReady {
		return 0, fmt.Errorf("the seeded Tehran warehouse must be active before enabling demo offers")
	}
	rows, err := tx.Query(ctx, `SELECT p.id,s.source_product_id,s.volume_ml FROM products p
		JOIN product_sources s ON s.product_id=p.id WHERE NOT p.active
		AND NOT EXISTS (SELECT 1 FROM variants v WHERE v.product_id=p.id)`)
	if err != nil {
		return 0, err
	}
	type draft struct {
		id, source string
		volume     int
	}
	var drafts []draft
	for rows.Next() {
		var d draft
		if err = rows.Scan(&d.id, &d.source, &d.volume); err != nil {
			rows.Close()
			return 0, err
		}
		drafts = append(drafts, d)
	}
	rows.Close()
	if err = rows.Err(); err != nil {
		return 0, err
	}
	for _, d := range drafts {
		// Demonstration formula only: 35,000 toman base + 20 toman/ml.
		price := 350000 + d.volume*200
		variant := d.id + "-demo-single"
		if _, err = tx.Exec(ctx, `UPDATE products SET active=true,asset=$2 WHERE id=$1`, d.id, "catalog-"+d.source); err != nil {
			return 0, err
		}
		if _, err = tx.Exec(ctx, `INSERT INTO variants(id,product_id,sku,name,units,price_rial)
			VALUES($1,$2,$3,'تک عددی · نمایشی',1,$4)`, variant, d.id, "DEMO-CATALOG-"+d.source, price); err != nil {
			return 0, err
		}
		if _, err = tx.Exec(ctx, `WITH inserted AS (
			INSERT INTO inventory_balances(warehouse_id,variant_id,on_hand)
			SELECT id,$1,120 FROM warehouses WHERE id='tehran' RETURNING *)
			INSERT INTO inventory_movements(warehouse_id,variant_id,delta,reason)
			SELECT warehouse_id,variant_id,on_hand,'فعال‌سازی صریح کاتالوگ نمایشی' FROM inserted`, variant); err != nil {
			return 0, err
		}
	}
	return len(drafts), tx.Commit(ctx)
}
