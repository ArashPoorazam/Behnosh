package app

import (
	"errors"
	"github.com/jackc/pgx/v5"
	"net/http"
	"time"
)

func (a *App) checkout(w http.ResponseWriter, r *http.Request, s *Session) error {
	var body struct {
		Key string `json:"idempotency_key"`
	}
	if err := decode(w, r, &body); err != nil {
		return err
	}
	if err := idKey(body.Key); err != nil {
		return err
	}
	var orderID string
	err := a.transact(r.Context(), func(tx pgx.Tx) error {
		var cartID string
		var revision int
		if err := tx.QueryRow(r.Context(), "SELECT id,revision FROM carts WHERE session_id=$1 FOR UPDATE", s.ID).Scan(&cartID, &revision); err != nil {
			return err
		}
		err := tx.QueryRow(r.Context(), "SELECT id FROM orders WHERE session_id=$1 AND checkout_key=$2", s.ID, body.Key).Scan(&orderID)
		if err == nil {
			return nil
		}
		if !errors.Is(err, pgx.ErrNoRows) {
			return err
		}
		rows, err := tx.Query(r.Context(), `SELECT v.id,v.sku,p.name,v.name,v.price_rial,i.quantity,v.active AND p.active FROM cart_items i JOIN variants v ON v.id=i.variant_id JOIN products p ON p.id=v.product_id WHERE i.cart_id=$1 ORDER BY v.id FOR SHARE OF v,p`, cartID)
		if err != nil {
			return err
		}
		items := []OrderItem{}
		var total int64
		for rows.Next() {
			var item OrderItem
			var active bool
			if err = rows.Scan(&item.VariantID, &item.SKU, &item.ProductName, &item.VariantName, &item.UnitPrice, &item.Quantity, &active); err != nil {
				rows.Close()
				return err
			}
			if !active {
				rows.Close()
				return conflict("یکی از محصولات دیگر قابل فروش نیست.")
			}
			line, e := lineTotal(item.UnitPrice, item.Quantity)
			if e != nil {
				rows.Close()
				return e
			}
			total, e = addTotal(total, line)
			if e != nil {
				rows.Close()
				return e
			}
			items = append(items, item)
		}
		rows.Close()
		if err = rows.Err(); err != nil {
			return err
		}
		if len(items) == 0 {
			return conflict("سبد خرید خالی است.")
		}
		for _, item := range items {
			var available int
			if err = tx.QueryRow(r.Context(), "SELECT on_hand-reserved FROM inventory_balances WHERE warehouse_id='tehran' AND variant_id=$1 FOR UPDATE", item.VariantID).Scan(&available); err != nil {
				return err
			}
			if available < item.Quantity {
				return conflict("موجودی کافی نیست؛ تعداد سبد را کاهش دهید.")
			}
		}
		orderID = token(16)
		expires := time.Now().Add(a.Config.ReservationTTL)
		if _, err = tx.Exec(r.Context(), `INSERT INTO orders(id,session_id,cart_id,cart_revision,checkout_key,status,total_rial,warehouse_id,expires_at) VALUES($1,$2,$3,$4,$5,'pending',$6,'tehran',$7)`, orderID, s.ID, cartID, revision, body.Key, total, expires); err != nil {
			return err
		}
		for _, item := range items {
			if _, err = tx.Exec(r.Context(), `INSERT INTO order_items(order_id,variant_id,sku,product_name,variant_name,unit_price_rial,quantity) VALUES($1,$2,$3,$4,$5,$6,$7)`, orderID, item.VariantID, item.SKU, item.ProductName, item.VariantName, item.UnitPrice, item.Quantity); err != nil {
				return err
			}
			if _, err = tx.Exec(r.Context(), `UPDATE inventory_balances SET reserved=reserved+$1 WHERE warehouse_id='tehran' AND variant_id=$2`, item.Quantity, item.VariantID); err != nil {
				return err
			}
			if _, err = tx.Exec(r.Context(), `INSERT INTO reservations(id,order_id,warehouse_id,variant_id,quantity,status,expires_at) VALUES($1,$2,'tehran',$3,$4,'active',$5)`, token(16), orderID, item.VariantID, item.Quantity, expires); err != nil {
				return err
			}
		}
		if _, err = tx.Exec(r.Context(), "DELETE FROM cart_items WHERE cart_id=$1", cartID); err != nil {
			return err
		}
		_, err = tx.Exec(r.Context(), "UPDATE carts SET revision=revision+1 WHERE id=$1", cartID)
		return err
	})
	if err != nil {
		return err
	}
	order, err := a.getOrder(r.Context(), orderID, s.ID, false)
	if err != nil {
		return err
	}
	write(w, 200, order)
	return nil
}
