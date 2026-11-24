package app

import (
	"behnosh/api/internal/store"
	"context"
	"encoding/json"
	"testing"
)

func TestOfficialCatalogImport(t *testing.T) {
	f := setup(t)
	ctx := context.Background()
	snapshot, err := store.LoadCatalog("../../catalog/products.json", "../../..")
	if err != nil {
		t.Fatal(err)
	}
	publicBefore, err := f.app.catalogProducts(ctx, false)
	if err != nil {
		t.Fatal(err)
	}
	before, _ := json.Marshal(publicBefore)
	assertCounts := func(products, sources, variants, balances int) {
		t.Helper()
		var p, s, v, b int
		err := f.db.QueryRow(ctx, `SELECT (SELECT count(*) FROM products),
			(SELECT count(*) FROM product_sources),(SELECT count(*) FROM variants),
			(SELECT count(*) FROM inventory_balances)`).Scan(&p, &s, &v, &b)
		if err != nil || p != products || s != sources || v != variants || b != balances {
			t.Fatalf("counts = %d/%d/%d/%d, want %d/%d/%d/%d: %v", p, s, v, b, products, sources, variants, balances, err)
		}
	}
	result, err := store.ImportCatalog(ctx, f.db, snapshot, true)
	if err != nil || result.Created != 96 || result.Existing != 11 || result.Sources != 107 {
		t.Fatalf("dry run: %+v, %v", result, err)
	}
	assertCounts(11, 0, 22, 44)
	// A failure late in the batch must roll back all earlier inserted records.
	broken := snapshot
	broken.Products = append([]store.CatalogProduct(nil), snapshot.Products...)
	broken.Products[len(broken.Products)-1].SourceURL = broken.Products[0].SourceURL
	if _, err = store.ImportCatalog(ctx, f.db, broken, false); err == nil {
		t.Fatal("expected duplicate source URL to reject the entire batch")
	}
	assertCounts(11, 0, 22, 44)
	result, err = store.ImportCatalog(ctx, f.db, snapshot, false)
	if err != nil || result.Created != 96 || result.Existing != 11 {
		t.Fatalf("import: %+v, %v", result, err)
	}
	assertCounts(107, 107, 22, 44)
	result, err = store.ImportCatalog(ctx, f.db, snapshot, false)
	if err != nil || result.Created != 0 || result.Existing != 107 {
		t.Fatalf("repeat import: %+v, %v", result, err)
	}
	// Simulate the server's next startup: no fake offers/stock for the 96 drafts.
	if err = store.Seed(ctx, f.db, "admin", "integration-password"); err != nil {
		t.Fatal(err)
	}
	assertCounts(107, 107, 22, 44)
	var inactive int
	if err = f.db.QueryRow(ctx, "SELECT count(*) FROM products WHERE NOT active").Scan(&inactive); err != nil || inactive != 96 {
		t.Fatalf("inactive products = %d, %v", inactive, err)
	}
	publicAfter, err := f.app.catalogProducts(ctx, false)
	if err != nil {
		t.Fatal(err)
	}
	after, _ := json.Marshal(publicAfter)
	if string(before) != string(after) {
		t.Fatal("import or reseed changed the public catalog, demo pricing or stock")
	}
	var name, brand, pack string
	var volume int
	if err = f.db.QueryRow(ctx, `SELECT source_name,brand,packaging,volume_ml FROM product_sources WHERE product_id='classic'`).Scan(&name, &brand, &pack, &volume); err != nil || name != "دلستر شیشه کلاسیک" || brand != "دلستر" || pack != "شیشه" || volume != 320 {
		t.Fatalf("existing product source mapping: %s/%s/%s/%d, %v", name, brand, pack, volume, err)
	}
}
