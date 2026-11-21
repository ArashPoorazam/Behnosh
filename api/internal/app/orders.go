package app

import (
	"context"
	"net/http"
)

func (a *App) getOrder(ctx context.Context, id, sessionID string, admin bool) (Order, error) {
	o := Order{Items: []OrderItem{}, Payments: []Attempt{}}
	err := a.DB.QueryRow(ctx, "SELECT id,status,total_rial,created_at,expires_at FROM orders WHERE id=$1 AND (session_id=$2 OR $3)", id, sessionID, admin).Scan(&o.ID, &o.Status, &o.Total, &o.CreatedAt, &o.ExpiresAt)
	if err != nil {
		return o, err
	}
	rows, err := a.DB.Query(ctx, "SELECT variant_id,sku,product_name,variant_name,unit_price_rial,quantity FROM order_items WHERE order_id=$1 ORDER BY variant_id", id)
	if err != nil {
		return o, err
	}
	for rows.Next() {
		var i OrderItem
		if err = rows.Scan(&i.VariantID, &i.SKU, &i.ProductName, &i.VariantName, &i.UnitPrice, &i.Quantity); err != nil {
			rows.Close()
			return o, err
		}
		o.Items = append(o.Items, i)
	}
	rows.Close()
	if err = rows.Err(); err != nil {
		return o, err
	}
	attempts, err := a.DB.Query(ctx, "SELECT id,scenario,status,created_at FROM payment_attempts WHERE order_id=$1 ORDER BY created_at,id", id)
	if err != nil {
		return o, err
	}
	defer attempts.Close()
	for attempts.Next() {
		var p Attempt
		if err = attempts.Scan(&p.ID, &p.Scenario, &p.Status, &p.CreatedAt); err != nil {
			return o, err
		}
		o.Payments = append(o.Payments, p)
	}
	return o, attempts.Err()
}
func (a *App) order(w http.ResponseWriter, r *http.Request, s *Session) error {
	o, err := a.getOrder(r.Context(), r.PathValue("id"), s.ID, false)
	if err != nil {
		return err
	}
	write(w, 200, o)
	return nil
}
func (a *App) orders(w http.ResponseWriter, r *http.Request, s *Session) error {
	return a.listOrders(w, r, s, false)
}
func (a *App) adminOrders(w http.ResponseWriter, r *http.Request, s *Session) error {
	return a.listOrders(w, r, s, true)
}
func (a *App) listOrders(w http.ResponseWriter, r *http.Request, s *Session, admin bool) error {
	limit, offset, err := page(r)
	if err != nil {
		return err
	}
	rows, err := a.DB.Query(r.Context(), "SELECT id,status,total_rial,created_at,expires_at FROM orders WHERE session_id=$1 OR $2 ORDER BY created_at DESC,id DESC LIMIT $3 OFFSET $4", s.ID, admin, limit, offset)
	if err != nil {
		return err
	}
	defer rows.Close()
	list := []Order{}
	for rows.Next() {
		o := Order{Items: []OrderItem{}, Payments: []Attempt{}}
		if err = rows.Scan(&o.ID, &o.Status, &o.Total, &o.CreatedAt, &o.ExpiresAt); err != nil {
			return err
		}
		list = append(list, o)
	}
	if err = rows.Err(); err != nil {
		return err
	}
	write(w, 200, list)
	return nil
}
