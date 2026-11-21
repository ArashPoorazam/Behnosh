package app

import (
	"github.com/jackc/pgx/v5"
	"net/http"
	"strings"
)

func (a *App) inventory(w http.ResponseWriter, r *http.Request, _ *Session) error {
	rows, err := a.DB.Query(r.Context(), `SELECT b.warehouse_id,w.name,b.variant_id,p.name,v.name,v.sku,b.on_hand,b.reserved,b.on_hand-b.reserved FROM inventory_balances b JOIN warehouses w ON w.id=b.warehouse_id JOIN variants v ON v.id=b.variant_id JOIN products p ON p.id=v.product_id ORDER BY w.id,v.id`)
	if err != nil {
		return err
	}
	defer rows.Close()
	items := []Inventory{}
	for rows.Next() {
		var i Inventory
		if err = rows.Scan(&i.WarehouseID, &i.WarehouseName, &i.VariantID, &i.ProductName, &i.VariantName, &i.SKU, &i.OnHand, &i.Reserved, &i.Available); err != nil {
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
func (a *App) adjustInventory(w http.ResponseWriter, r *http.Request, s *Session) error {
	var body struct {
		WarehouseID string `json:"warehouse_id"`
		VariantID   string `json:"variant_id"`
		Delta       int    `json:"delta"`
		Reason      string `json:"reason"`
	}
	if err := decode(w, r, &body); err != nil {
		return err
	}
	body.Reason = strings.TrimSpace(body.Reason)
	if body.Delta == 0 || body.Delta < -10000 || body.Delta > 10000 || len(body.Reason) < 3 || len(body.Reason) > 500 {
		return bad("تغییر موجودی و دلیل معتبر وارد کنید.")
	}
	err := a.transact(r.Context(), func(tx pgx.Tx) error {
		var onHand, reserved int
		if err := tx.QueryRow(r.Context(), "SELECT on_hand,reserved FROM inventory_balances WHERE warehouse_id=$1 AND variant_id=$2 FOR UPDATE", body.WarehouseID, body.VariantID).Scan(&onHand, &reserved); err != nil {
			return err
		}
		if onHand+body.Delta < reserved || onHand+body.Delta > 1000000 {
			return conflict("موجودی جدید نباید کمتر از رزرو یا بیش از یک میلیون باشد.")
		}
		if _, err := tx.Exec(r.Context(), "UPDATE inventory_balances SET on_hand=on_hand+$1 WHERE warehouse_id=$2 AND variant_id=$3", body.Delta, body.WarehouseID, body.VariantID); err != nil {
			return err
		}
		if _, err := tx.Exec(r.Context(), `INSERT INTO inventory_movements(warehouse_id,variant_id,delta,reason,admin_id) SELECT $1,$2,$3,$4,admin_id FROM sessions WHERE id=$5`, body.WarehouseID, body.VariantID, body.Delta, body.Reason, s.ID); err != nil {
			return err
		}
		return auditTx(r, tx, s, "inventory.adjust", body.WarehouseID+":"+body.VariantID, body.Reason)
	})
	if err != nil {
		return err
	}
	write(w, 200, map[string]bool{"ok": true})
	return nil
}
func (a *App) warehouses(w http.ResponseWriter, r *http.Request, _ *Session) error {
	rows, err := a.DB.Query(r.Context(), "SELECT id,name FROM warehouses WHERE active ORDER BY id")
	if err != nil {
		return err
	}
	defer rows.Close()
	items := []map[string]string{}
	for rows.Next() {
		var id, name string
		if err = rows.Scan(&id, &name); err != nil {
			return err
		}
		items = append(items, map[string]string{"id": id, "name": name})
	}
	if err = rows.Err(); err != nil {
		return err
	}
	write(w, 200, items)
	return nil
}
func (a *App) createWarehouse(w http.ResponseWriter, r *http.Request, s *Session) error {
	var body struct {
		Name string `json:"name"`
	}
	if err := decode(w, r, &body); err != nil {
		return err
	}
	body.Name = strings.TrimSpace(body.Name)
	if len(body.Name) < 3 || len(body.Name) > 100 {
		return bad("نام انبار معتبر نیست.")
	}
	id := token(12)
	err := a.transact(r.Context(), func(tx pgx.Tx) error {
		var exists bool
		if err := tx.QueryRow(r.Context(), "SELECT EXISTS(SELECT 1 FROM warehouses WHERE name=$1)", body.Name).Scan(&exists); err != nil {
			return err
		}
		if exists {
			return conflict("نام انبار تکراری است.")
		}
		if _, err := tx.Exec(r.Context(), "INSERT INTO warehouses(id,name) VALUES($1,$2)", id, body.Name); err != nil {
			return err
		}
		if _, err := tx.Exec(r.Context(), "INSERT INTO inventory_balances(warehouse_id,variant_id) SELECT $1,id FROM variants", id); err != nil {
			return err
		}
		return auditTx(r, tx, s, "warehouse.create", id, body.Name)
	})
	if err != nil {
		return err
	}
	write(w, 201, map[string]string{"id": id, "name": body.Name})
	return nil
}
func (a *App) movements(w http.ResponseWriter, r *http.Request, _ *Session) error {
	limit, offset, err := page(r)
	if err != nil {
		return err
	}
	rows, err := a.DB.Query(r.Context(), `SELECT m.id,w.name,v.sku,m.delta,m.reason,m.created_at FROM inventory_movements m JOIN warehouses w ON w.id=m.warehouse_id JOIN variants v ON v.id=m.variant_id ORDER BY m.id DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return err
	}
	defer rows.Close()
	items := []Movement{}
	for rows.Next() {
		var i Movement
		if err = rows.Scan(&i.ID, &i.Warehouse, &i.SKU, &i.Delta, &i.Reason, &i.CreatedAt); err != nil {
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
