package app

import (
	"fmt"
	"github.com/jackc/pgx/v5"
	"net/http"
	"strings"
)

func auditTx(r *http.Request, tx pgx.Tx, s *Session, action, id, detail string) error {
	_, err := tx.Exec(r.Context(), `INSERT INTO audit_records(admin_id,action,entity_id,detail) SELECT admin_id,$1,$2,$3 FROM sessions WHERE id=$4`, action, id, detail, s.ID)
	return err
}
func (a *App) updateOrder(w http.ResponseWriter, r *http.Request, s *Session) error {
	var body struct {
		Status string `json:"status"`
	}
	if err := decode(w, r, &body); err != nil {
		return err
	}
	if body.Status != "processing" && body.Status != "shipped" {
		return bad("وضعیت مقصد معتبر نیست.")
	}
	id := r.PathValue("id")
	err := a.transact(r.Context(), func(tx pgx.Tx) error {
		var status string
		if err := tx.QueryRow(r.Context(), "SELECT status FROM orders WHERE id=$1 FOR UPDATE", id).Scan(&status); err != nil {
			return err
		}
		if status == body.Status {
			return nil
		}
		if !(status == "paid" && body.Status == "processing" || status == "processing" && body.Status == "shipped") {
			return conflict("این تغییر وضعیت مجاز نیست.")
		}
		if _, err := tx.Exec(r.Context(), "UPDATE orders SET status=$1 WHERE id=$2", body.Status, id); err != nil {
			return err
		}
		return auditTx(r, tx, s, "order.status", id, status+" -> "+body.Status)
	})
	if err != nil {
		return err
	}
	o, err := a.getOrder(r.Context(), id, s.ID, true)
	if err != nil {
		return err
	}
	write(w, 200, o)
	return nil
}
func (a *App) updateVariant(w http.ResponseWriter, r *http.Request, s *Session) error {
	var body struct {
		Name   string `json:"name"`
		Price  int64  `json:"price_rial"`
		Active *bool  `json:"active"`
	}
	if err := decode(w, r, &body); err != nil {
		return err
	}
	body.Name = strings.TrimSpace(body.Name)
	if body.Price < 10 || body.Price > 1000000000 || body.Price%10 != 0 || len(body.Name) < 2 || len(body.Name) > 160 || body.Active == nil {
		return bad("قیمت (ریال)، نام و وضعیت معتبر وارد کنید.")
	}
	id := r.PathValue("id")
	err := a.transact(r.Context(), func(tx pgx.Tx) error {
		tag, err := tx.Exec(r.Context(), "UPDATE variants SET name=$1,price_rial=$2,active=$3 WHERE id=$4", body.Name, body.Price, *body.Active, id)
		if err != nil {
			return err
		}
		if tag.RowsAffected() == 0 {
			return notFound
		}
		if _, err = tx.Exec(r.Context(), "UPDATE catalog_revision SET revision=revision+1"); err != nil {
			return err
		}
		return auditTx(r, tx, s, "variant.update", id, fmt.Sprintf("name=%s price_rial=%d active=%t", body.Name, body.Price, *body.Active))
	})
	if err != nil {
		return err
	}
	write(w, 200, map[string]bool{"ok": true})
	return nil
}
func (a *App) audit(w http.ResponseWriter, r *http.Request, _ *Session) error {
	limit, offset, err := page(r)
	if err != nil {
		return err
	}
	rows, err := a.DB.Query(r.Context(), `SELECT a.id,u.username,a.action,a.entity_id,a.detail,a.created_at FROM audit_records a JOIN admin_users u ON u.id=a.admin_id ORDER BY a.id DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return err
	}
	defer rows.Close()
	items := []Audit{}
	for rows.Next() {
		var i Audit
		if err = rows.Scan(&i.ID, &i.Actor, &i.Action, &i.EntityID, &i.Detail, &i.CreatedAt); err != nil {
			return err
		}
		items = append(items, i)
	}
	if err = rows.Err(); err != nil {
		return err
	}
	write(w, 200, items)
	return nil
}
