package app

import (
	"context"
	"errors"
	"github.com/jackc/pgx/v5"
	"net/http"
	"time"
)

func (a *App) pay(w http.ResponseWriter, r *http.Request, s *Session) error {
	var body struct {
		Key      string `json:"idempotency_key"`
		Scenario string `json:"scenario"`
	}
	if err := decode(w, r, &body); err != nil {
		return err
	}
	if err := idKey(body.Key); err != nil {
		return err
	}
	if body.Scenario != "success" && body.Scenario != "failure" && body.Scenario != "cancel" {
		return bad("سناریوی پرداخت معتبر نیست.")
	}
	orderID := r.PathValue("id")
	// Ownership checked before invoking the adapter. Provider call is outside transaction.
	if _, err := a.getOrder(r.Context(), orderID, s.ID, false); err != nil {
		return err
	}
	result, err := a.Payments.Resolve(r.Context(), orderID+":"+body.Key, body.Scenario)
	if err != nil {
		return err
	}
	expired := false
	err = a.transact(r.Context(), func(tx pgx.Tx) error {
		var status string
		var expires time.Time
		if err := tx.QueryRow(r.Context(), "SELECT status,expires_at FROM orders WHERE id=$1 AND session_id=$2 FOR UPDATE", orderID, s.ID).Scan(&status, &expires); err != nil {
			return err
		}
		var priorScenario string
		err := tx.QueryRow(r.Context(), "SELECT scenario FROM payment_attempts WHERE order_id=$1 AND idempotency_key=$2", orderID, body.Key).Scan(&priorScenario)
		if err == nil {
			if priorScenario != body.Scenario {
				return conflict("شناسه تکراری برای سناریوی متفاوت قابل استفاده نیست.")
			}
			return nil
		}
		if !errors.Is(err, pgx.ErrNoRows) {
			return err
		}
		if status != "pending" {
			return conflict("این سفارش دیگر در انتظار پرداخت نیست.")
		}
		if !time.Now().Before(expires) {
			expired = true
			return a.finishReservation(r.Context(), tx, orderID, "expired", false)
		}
		if _, err = tx.Exec(r.Context(), `INSERT INTO payment_attempts(id,order_id,idempotency_key,scenario,status) VALUES($1,$2,$3,$4,$5)`, token(16), orderID, body.Key, body.Scenario, result.Status); err != nil {
			return err
		}
		switch result.Status {
		case "succeeded":
			return a.finishReservation(r.Context(), tx, orderID, "paid", true)
		case "cancelled":
			return a.finishReservation(r.Context(), tx, orderID, "cancelled", false)
		case "failed":
			return nil
		default:
			return errors.New("unsupported provider result")
		}
	})
	if err != nil {
		return err
	}
	if expired {
		return conflict("مهلت پرداخت تمام شده و موجودی آزاد شد.")
	}
	o, err := a.getOrder(r.Context(), orderID, s.ID, false)
	if err != nil {
		return err
	}
	write(w, 200, o)
	return nil
}

// Caller must hold the order row lock. Every stock operation uses variant order.
func (a *App) finishReservation(ctx context.Context, tx pgx.Tx, orderID, status string, consume bool) error {
	type allocation struct {
		Warehouse, Variant string
		Quantity           int
	}
	rows, err := tx.Query(ctx, "SELECT warehouse_id,variant_id,quantity FROM reservations WHERE order_id=$1 AND status='active' ORDER BY variant_id,warehouse_id", orderID)
	if err != nil {
		return err
	}
	allocations := []allocation{}
	for rows.Next() {
		var v allocation
		if err = rows.Scan(&v.Warehouse, &v.Variant, &v.Quantity); err != nil {
			rows.Close()
			return err
		}
		allocations = append(allocations, v)
	}
	rows.Close()
	if err = rows.Err(); err != nil {
		return err
	}
	for _, v := range allocations {
		decrement := 0
		if consume {
			decrement = v.Quantity
		}
		if _, err = tx.Exec(ctx, "UPDATE inventory_balances SET reserved=reserved-$1,on_hand=on_hand-$2 WHERE warehouse_id=$3 AND variant_id=$4", v.Quantity, decrement, v.Warehouse, v.Variant); err != nil {
			return err
		}
		if consume {
			if _, err = tx.Exec(ctx, "INSERT INTO inventory_movements(warehouse_id,variant_id,delta,reason,order_id) VALUES($1,$2,$3,'فروش نمایشی',$4)", v.Warehouse, v.Variant, -v.Quantity, orderID); err != nil {
				return err
			}
		}
	}
	reservationStatus := "released"
	if consume {
		reservationStatus = "consumed"
	}
	if _, err = tx.Exec(ctx, "UPDATE reservations SET status=$1 WHERE order_id=$2 AND status='active'", reservationStatus, orderID); err != nil {
		return err
	}
	_, err = tx.Exec(ctx, "UPDATE orders SET status=$1 WHERE id=$2", status, orderID)
	return err
}
func (a *App) ExpireReservations(ctx context.Context) error {
	return a.transact(ctx, func(tx pgx.Tx) error {
		rows, err := tx.Query(ctx, "SELECT id FROM orders WHERE status='pending' AND expires_at<=now() ORDER BY expires_at LIMIT 100 FOR UPDATE SKIP LOCKED")
		if err != nil {
			return err
		}
		ids := []string{}
		for rows.Next() {
			var id string
			if err = rows.Scan(&id); err != nil {
				rows.Close()
				return err
			}
			ids = append(ids, id)
		}
		rows.Close()
		if err = rows.Err(); err != nil {
			return err
		}
		for _, id := range ids {
			if err = a.finishReservation(ctx, tx, id, "expired", false); err != nil {
				return err
			}
		}
		return nil
	})
}
