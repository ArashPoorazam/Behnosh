package app

import (
	"context"
	"github.com/jackc/pgx/v5"
	"math"
	"net/http"
)

func lineTotal(price int64, quantity int) (int64, error) {
	if price < 0 || quantity < 1 || quantity > 24 || price > math.MaxInt64/int64(quantity) {
		return 0, bad("مبلغ یا تعداد معتبر نیست.")
	}
	return price * int64(quantity), nil
}
func addTotal(total, line int64) (int64, error) {
	if line < 0 || total < 0 || total > math.MaxInt64-line {
		return 0, bad("مبلغ سفارش بیش از حد مجاز است.")
	}
	return total + line, nil
}
func (a *App) getCart(ctx context.Context, sessionID string) (Cart, error) {
	c := Cart{Items: []CartItem{}}
	rows, err := a.DB.Query(ctx, `SELECT v.id,p.name,v.name,p.asset,i.quantity,v.price_rial FROM carts c JOIN cart_items i ON i.cart_id=c.id JOIN variants v ON v.id=i.variant_id JOIN products p ON p.id=v.product_id WHERE c.session_id=$1 ORDER BY v.id`, sessionID)
	if err != nil {
		return c, err
	}
	defer rows.Close()
	for rows.Next() {
		var i CartItem
		if err = rows.Scan(&i.VariantID, &i.ProductName, &i.VariantName, &i.Asset, &i.Quantity, &i.UnitPrice); err != nil {
			return c, err
		}
		line, e := lineTotal(i.UnitPrice, i.Quantity)
		if e != nil {
			return c, e
		}
		c.Total, e = addTotal(c.Total, line)
		if e != nil {
			return c, e
		}
		c.Items = append(c.Items, i)
	}
	return c, rows.Err()
}
func (a *App) cart(w http.ResponseWriter, r *http.Request, s *Session) error {
	c, err := a.getCart(r.Context(), s.ID)
	if err != nil {
		return err
	}
	write(w, 200, c)
	return nil
}
func (a *App) setCartItem(w http.ResponseWriter, r *http.Request, s *Session) error {
	var body struct {
		VariantID string `json:"variant_id"`
		Quantity  int    `json:"quantity"`
	}
	if err := decode(w, r, &body); err != nil {
		return err
	}
	if body.Quantity < 0 || body.Quantity > 24 || len(body.VariantID) > 80 {
		return bad("تعداد باید بین صفر و ۲۴ باشد.")
	}
	err := a.transact(r.Context(), func(tx pgx.Tx) error {
		var cartID string
		if err := tx.QueryRow(r.Context(), "SELECT id FROM carts WHERE session_id=$1 FOR UPDATE", s.ID).Scan(&cartID); err != nil {
			return err
		}
		if body.Quantity == 0 {
			if _, err := tx.Exec(r.Context(), "DELETE FROM cart_items WHERE cart_id=$1 AND variant_id=$2", cartID, body.VariantID); err != nil {
				return err
			}
		} else {
			var available int
			if err := tx.QueryRow(r.Context(), `SELECT b.on_hand-b.reserved FROM inventory_balances b JOIN variants v ON v.id=b.variant_id JOIN products p ON p.id=v.product_id WHERE v.id=$1 AND b.warehouse_id='tehran' AND v.active AND p.active`, body.VariantID).Scan(&available); err != nil {
				return err
			}
			if available < body.Quantity {
				return conflict("موجودی این محصول کافی نیست.")
			}
			if _, err := tx.Exec(r.Context(), `INSERT INTO cart_items(cart_id,variant_id,quantity) VALUES($1,$2,$3) ON CONFLICT(cart_id,variant_id) DO UPDATE SET quantity=excluded.quantity`, cartID, body.VariantID, body.Quantity); err != nil {
				return err
			}
		}
		_, err := tx.Exec(r.Context(), "UPDATE carts SET revision=revision+1 WHERE id=$1", cartID)
		return err
	})
	if err != nil {
		return err
	}
	return a.cart(w, r, s)
}
