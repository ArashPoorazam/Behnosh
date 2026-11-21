package app

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"net/http"
)

func (a *App) catalogProducts(ctx context.Context, includeInactive bool) ([]Product, error) {
	rows, err := a.DB.Query(ctx, `SELECT p.id,p.name,p.description,p.asset,v.id,v.sku,v.name,v.units,v.price_rial,b.on_hand-b.reserved,v.active FROM products p JOIN variants v ON v.product_id=p.id JOIN inventory_balances b ON b.variant_id=v.id AND b.warehouse_id='tehran' WHERE (p.active AND v.active) OR $1 ORDER BY p.id DESC,v.units`, includeInactive)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	products := []Product{}
	indices := map[string]int{}
	for rows.Next() {
		var p Product
		var v Variant
		if err = rows.Scan(&p.ID, &p.Name, &p.Description, &p.Asset, &v.ID, &v.SKU, &v.Name, &v.Units, &v.Price, &v.Available, &v.Active); err != nil {
			return nil, err
		}
		i, ok := indices[p.ID]
		if !ok {
			i = len(products)
			indices[p.ID] = i
			p.Variants = []Variant{}
			products = append(products, p)
		}
		products[i].Variants = append(products[i].Variants, v)
	}
	return products, rows.Err()
}
func (a *App) catalog(w http.ResponseWriter, r *http.Request, _ *Session) error {
	products, err := a.catalogProducts(r.Context(), false)
	if err != nil {
		return err
	}
	body, err := json.Marshal(products)
	if err != nil {
		return err
	}
	etag := fmt.Sprintf(`"%x"`, sha256.Sum256(body))
	w.Header().Set("Cache-Control", "public, no-cache")
	w.Header().Set("ETag", etag)
	if r.Header.Get("If-None-Match") == etag {
		w.WriteHeader(304)
		return nil
	}
	write(w, 200, products)
	return nil
}
func (a *App) adminCatalog(w http.ResponseWriter, r *http.Request, _ *Session) error {
	products, err := a.catalogProducts(r.Context(), true)
	if err != nil {
		return err
	}
	write(w, 200, products)
	return nil
}
