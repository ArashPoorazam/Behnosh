package app

import (
	"behnosh/api/internal/store"
	"context"
	"encoding/json"
	"testing"
)

func TestCatalogDemo(t *testing.T) {
	f := setup(t)
	ctx := context.Background()
	if _, err := store.EnableCatalogDemo(ctx, f.db); err == nil {
		t.Fatal("incomplete catalog should not be enabled")
	}
	snapshot, err := store.LoadCatalog("../../catalog/products.json", "../../..")
	if err != nil {
		t.Fatal(err)
	}
	before, err := f.app.catalogProducts(ctx, false)
	if err != nil {
		t.Fatal(err)
	}
	if _, err = store.ImportCatalog(ctx, f.db, snapshot, false); err != nil {
		t.Fatal(err)
	}
	count, err := store.EnableCatalogDemo(ctx, f.db)
	if err != nil || count != 96 {
		t.Fatalf("enabled %d: %v", count, err)
	}
	all, err := f.app.catalogProducts(ctx, false)
	if err != nil || len(all) != 107 {
		t.Fatalf("public catalog: %d, %v", len(all), err)
	}
	for _, original := range before {
		found := false
		for _, current := range all {
			if original.ID != current.ID {
				continue
			}
			found = true
			a, _ := json.Marshal(original)
			b, _ := json.Marshal(current)
			if string(a) != string(b) {
				t.Fatalf("changed existing showcase offer %s", original.ID)
			}
		}
		if !found {
			t.Fatalf("lost showcase product %s", original.ID)
		}
	}
	for _, p := range all {
		if p.Asset == "" || len(p.Variants) == 0 {
			t.Fatalf("missing artwork/offer for %s", p.ID)
		}
	}
	shopper := f.shopper(t)
	status, body := shopper.call(t, "PUT", "/cart/items", map[string]any{"variant_id": "behnoush-118-demo-single", "quantity": 2})
	if status != 200 {
		t.Fatalf("add imported product: %d %s", status, body)
	}
	var basket Cart
	if err := json.Unmarshal(body, &basket); err != nil {
		t.Fatal(err)
	}
	if len(basket.Items) != 1 {
		t.Fatalf("cart has %d items", len(basket.Items))
	}
	// A subsequent setup must preserve operator edits and depleted inventory.
	if _, err = f.db.Exec(ctx, `UPDATE variants SET price_rial=990000 WHERE id='behnoush-118-demo-single';
		UPDATE inventory_balances SET on_hand=7 WHERE variant_id='behnoush-118-demo-single'`); err != nil {
		t.Fatal(err)
	}
	count, err = store.EnableCatalogDemo(ctx, f.db)
	if err != nil || count != 0 {
		t.Fatalf("repeat enabled %d: %v", count, err)
	}
	var price, stock, movements int
	if err = f.db.QueryRow(ctx, `SELECT v.price_rial,b.on_hand,(SELECT count(*) FROM inventory_movements WHERE variant_id=v.id)
		FROM variants v JOIN inventory_balances b ON b.variant_id=v.id WHERE v.id='behnoush-118-demo-single'`).Scan(&price, &stock, &movements); err != nil {
		t.Fatal(err)
	}
	if price != 990000 || stock != 7 || movements != 1 {
		t.Fatalf("repeat changed state: %d/%d/%d", price, stock, movements)
	}
}
