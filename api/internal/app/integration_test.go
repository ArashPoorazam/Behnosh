package app

import (
	"behnosh/api"
	"behnosh/api/internal/config"
	"behnosh/api/internal/payment"
	"behnosh/api/internal/store"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"github.com/jackc/pgx/v5/pgxpool"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"sync"
	"testing"
	"time"
)

type fixture struct {
	app    *App
	server *httptest.Server
	db     *pgxpool.Pool
}

func setup(t *testing.T) *fixture {
	t.Helper()
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("set TEST_DATABASE_URL to run real PostgreSQL integration tests")
	}
	ctx := context.Background()
	root, err := store.Open(ctx, dsn)
	if err != nil {
		t.Fatal(err)
	}
	schema := "test_" + token(8)
	if _, err = root.Exec(ctx, "CREATE SCHEMA "+schema); err != nil {
		t.Fatal(err)
	}
	c, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		t.Fatal(err)
	}
	c.ConnConfig.RuntimeParams["search_path"] = schema
	c.MaxConns = 12
	db, err := pgxpool.NewWithConfig(ctx, c)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { db.Close(); _, _ = root.Exec(ctx, "DROP SCHEMA "+schema+" CASCADE"); root.Close() })
	if err = store.Migrate(ctx, db, api.Migrations); err != nil {
		t.Fatal(err)
	}
	if err = store.Seed(ctx, db, "admin", "integration-password"); err != nil {
		t.Fatal(err)
	}
	a := &App{DB: db, Config: config.Config{Origin: "http://test.local", ReservationTTL: 15 * time.Minute}, Payments: payment.Simulator{}, Log: slog.New(slog.NewTextHandler(io.Discard, nil))}
	srv := httptest.NewServer(a.Handler())
	t.Cleanup(srv.Close)
	return &fixture{a, srv, db}
}

type shopper struct {
	f      *fixture
	cookie *http.Cookie
	csrf   string
}

func (f *fixture) shopper(t *testing.T) *shopper {
	t.Helper()
	c := &shopper{f: f}
	status, body := c.call(t, "GET", "/session", nil)
	if status != 200 {
		t.Fatal(status, string(body))
	}
	var s Session
	if err := json.Unmarshal(body, &s); err != nil {
		t.Fatal(err)
	}
	c.csrf = s.CSRF
	return c
}
func (c *shopper) call(t *testing.T, method, path string, body any) (int, []byte) {
	t.Helper()
	data, _ := json.Marshal(body)
	r, _ := http.NewRequest(method, c.f.server.URL+"/api/v1"+path, bytes.NewReader(data))
	r.Header.Set("Content-Type", "application/json")
	r.Header.Set("Origin", "http://test.local")
	r.Header.Set("X-CSRF-Token", c.csrf)
	if c.cookie != nil {
		r.AddCookie(c.cookie)
	}
	resp, err := http.DefaultClient.Do(r)
	if err != nil {
		t.Error(err)
		return 0, nil
	}
	defer resp.Body.Close()
	for _, cookie := range resp.Cookies() {
		c.cookie = cookie
	}
	b, _ := io.ReadAll(resp.Body)
	return resp.StatusCode, b
}
func (c *shopper) add(t *testing.T, qty int) {
	t.Helper()
	status, b := c.call(t, "PUT", "/cart/items", map[string]any{"variant_id": "tropical-single", "quantity": qty})
	if status != 200 {
		t.Fatalf("cart: %d %s", status, b)
	}
}
func (c *shopper) checkout(t *testing.T, key string) (int, Order) {
	t.Helper()
	status, b := c.call(t, "POST", "/checkout", map[string]string{"idempotency_key": key})
	var o Order
	_ = json.Unmarshal(b, &o)
	return status, o
}
func (c *shopper) pay(t *testing.T, o Order, key, scenario string) (int, Order) {
	t.Helper()
	status, b := c.call(t, "POST", "/orders/"+o.ID+"/payments", map[string]string{"idempotency_key": key, "scenario": scenario})
	var next Order
	_ = json.Unmarshal(b, &next)
	return status, next
}
func (f *fixture) stock(t *testing.T) (int, int) {
	t.Helper()
	var on, res int
	if err := f.db.QueryRow(context.Background(), "SELECT on_hand,reserved FROM inventory_balances WHERE warehouse_id='tehran' AND variant_id='tropical-single'").Scan(&on, &res); err != nil {
		t.Fatal(err)
	}
	return on, res
}
func TestCheckoutPaymentIdempotencyAndSnapshots(t *testing.T) {
	f := setup(t)
	c := f.shopper(t)
	c.add(t, 2)
	status, o := c.checkout(t, "checkout-0001")
	if status != 200 || o.Total != 900000 || len(o.Items) != 1 {
		t.Fatalf("order: %d %+v", status, o)
	}
	on, res := f.stock(t)
	if on != 120 || res != 2 {
		t.Fatal(on, res)
	}
	_, same := c.checkout(t, "checkout-0001")
	if same.ID != o.ID {
		t.Fatal("duplicate order")
	}
	status, _ = c.checkout(t, "checkout-0002")
	if status != 409 {
		t.Fatal("empty cart checked out", status)
	}
	if _, err := f.db.Exec(context.Background(), "UPDATE variants SET price_rial=990000,name='edited' WHERE id='tropical-single'"); err != nil {
		t.Fatal(err)
	}
	status, failed := c.pay(t, o, "payment-0001", "failure")
	if status != 200 || failed.Status != "pending" {
		t.Fatal(status, failed)
	}
	status, paid := c.pay(t, o, "payment-0002", "success")
	if status != 200 || paid.Status != "paid" || paid.Total != 900000 || paid.Items[0].UnitPrice != 450000 {
		t.Fatal(status, paid)
	}
	status, paid = c.pay(t, o, "payment-0002", "success")
	if status != 200 || len(paid.Payments) != 2 {
		t.Fatal("duplicate payment effect", status, paid)
	}
	on, res = f.stock(t)
	if on != 118 || res != 0 {
		t.Fatal(on, res)
	}
	status, _ = c.pay(t, o, "payment-0002", "failure")
	if status != 409 {
		t.Fatal("key payload mismatch", status)
	}
	var count int
	_ = f.db.QueryRow(context.Background(), "SELECT count(*) FROM inventory_movements WHERE order_id=$1", o.ID).Scan(&count)
	if count != 1 {
		t.Fatal("duplicate movement", count)
	}
}
func TestConcurrentCheckoutNeverOversells(t *testing.T) {
	f := setup(t)
	_, err := f.db.Exec(context.Background(), "UPDATE inventory_balances SET on_hand=5 WHERE warehouse_id='tehran' AND variant_id='tropical-single'")
	if err != nil {
		t.Fatal(err)
	}
	customers := make([]*shopper, 16)
	for i := range customers {
		customers[i] = f.shopper(t)
		customers[i].add(t, 1)
	}
	var wg sync.WaitGroup
	statuses := make(chan int, 16)
	for i, c := range customers {
		wg.Add(1)
		go func(i int, c *shopper) {
			defer wg.Done()
			status, _ := c.checkout(t, fmt.Sprintf("checkout-%08d", i))
			statuses <- status
		}(i, c)
	}
	wg.Wait()
	close(statuses)
	success := 0
	for status := range statuses {
		if status == 200 {
			success++
		} else if status != 409 {
			t.Fatal("unexpected checkout status", status)
		}
	}
	if success != 5 {
		t.Fatal("oversold or lost sales", success)
	}
	on, res := f.stock(t)
	if on != 5 || res != 5 {
		t.Fatal(on, res)
	}
}
func TestConcurrentPaymentIsAppliedOnce(t *testing.T) {
	f := setup(t)
	c := f.shopper(t)
	c.add(t, 3)
	_, o := c.checkout(t, "checkout-concurrent")
	var wg sync.WaitGroup
	for range 12 {
		wg.Add(1)
		go func() {
			defer wg.Done()
			status, _ := c.pay(t, o, "same-payment-key", "success")
			if status != 200 {
				t.Errorf("payment status %d", status)
			}
		}()
	}
	wg.Wait()
	on, res := f.stock(t)
	if on != 117 || res != 0 {
		t.Fatal(on, res)
	}
}
func TestReservationReleaseAndExpiry(t *testing.T) {
	f := setup(t)
	c := f.shopper(t)
	c.add(t, 4)
	_, o := c.checkout(t, "checkout-cancelled")
	status, next := c.pay(t, o, "cancel-payment", "cancel")
	if status != 200 || next.Status != "cancelled" {
		t.Fatal(status, next)
	}
	on, res := f.stock(t)
	if on != 120 || res != 0 {
		t.Fatal(on, res)
	}
	c.add(t, 3)
	_, o = c.checkout(t, "checkout-expired")
	_, err := f.db.Exec(context.Background(), "UPDATE orders SET expires_at=now()-interval '1 second' WHERE id=$1", o.ID)
	if err != nil {
		t.Fatal(err)
	}
	status, _ = c.pay(t, o, "late-payment-1", "success")
	if status != 409 {
		t.Fatal("expired payment accepted", status)
	}
	on, res = f.stock(t)
	if on != 120 || res != 0 {
		t.Fatal(on, res)
	}
	c.add(t, 2)
	_, o = c.checkout(t, "checkout-sweeper")
	_, _ = f.db.Exec(context.Background(), "UPDATE orders SET expires_at=now()-interval '1 second' WHERE id=$1", o.ID)
	if err = f.app.ExpireReservations(context.Background()); err != nil {
		t.Fatal(err)
	}
	if err = f.app.ExpireReservations(context.Background()); err != nil {
		t.Fatal(err)
	}
	on, res = f.stock(t)
	if on != 120 || res != 0 {
		t.Fatal(on, res)
	}
}
func TestAuthorizationCSRFAndValidation(t *testing.T) {
	f := setup(t)
	c := f.shopper(t)
	other := f.shopper(t)
	for _, path := range []string{"/admin/inventory", "/admin/orders", "/admin/warehouses", "/admin/catalog", "/admin/movements", "/admin/audit"} {
		status, _ := c.call(t, "GET", path, nil)
		if status != 403 {
			t.Fatal(path, status)
		}
	}
	c.add(t, 1)
	_, o := c.checkout(t, "owned-checkout")
	status, _ := other.call(t, "GET", "/orders/"+o.ID, nil)
	if status != 404 {
		t.Fatal("order leak", status)
	}
	status, _ = other.pay(t, o, "stolen-payment", "success")
	if status != 404 {
		t.Fatal("payment ownership", status)
	}
	original := c.csrf
	c.csrf = "wrong"
	status, _ = c.call(t, "PUT", "/cart/items", map[string]any{"variant_id": "tropical-single", "quantity": 1})
	if status != 403 {
		t.Fatal("missing csrf allowed", status)
	}
	c.csrf = original
	status, _ = c.call(t, "PUT", "/cart/items", map[string]any{"variant_id": "tropical-single", "quantity": 1, "price_rial": 1})
	if status != 400 {
		t.Fatal("untrusted price accepted", status)
	}
	oldCookie := c.cookie.Value
	status, b := c.call(t, "POST", "/login", map[string]string{"username": "admin", "password": "integration-password"})
	if status != 200 {
		t.Fatal(status, string(b))
	}
	var session Session
	_ = json.Unmarshal(b, &session)
	c.csrf = session.CSRF
	if c.cookie.Value == oldCookie {
		t.Fatal("session was not rotated")
	}
	status, _ = c.call(t, "GET", "/admin/inventory", nil)
	if status != 200 {
		t.Fatal(status)
	}
	status, _ = c.call(t, "POST", "/admin/inventory", map[string]any{"warehouse_id": "tehran", "variant_id": "tropical-single", "delta": -120, "reason": "count adjustment"})
	if status != 409 {
		t.Fatal("reserved stock removed", status)
	}
	status, _ = c.call(t, "POST", "/logout", nil)
	if status != 200 {
		t.Fatal(status)
	}
	status, _ = c.call(t, "GET", "/admin/inventory", nil)
	if status != 403 {
		t.Fatal("logout retained privilege", status)
	}
}
func TestSeedRepeatability(t *testing.T) {
	f := setup(t)
	if err := store.Seed(context.Background(), f.db, "admin", "integration-password"); err != nil {
		t.Fatal(err)
	}
	var count int
	_ = f.db.QueryRow(context.Background(), "SELECT count(*) FROM inventory_movements").Scan(&count)
	if count != 44 {
		t.Fatal("seed duplicated movements", count)
	}
}

func TestEveryShowcaseProductCanBePurchased(t *testing.T) {
	f := setup(t)
	c := f.shopper(t)
	status, body := c.call(t, "GET", "/catalog", nil)
	if status != 200 {
		t.Fatal(status, string(body))
	}
	var products []Product
	if err := json.Unmarshal(body, &products); err != nil {
		t.Fatal(err)
	}
	if len(products) != 11 {
		t.Fatalf("expected all 11 showcase products, got %d", len(products))
	}
	var expected int64
	for _, product := range products {
		if len(product.Variants) != 2 {
			t.Fatalf("%s has no single/six-pack choice", product.ID)
		}
		for _, variant := range product.Variants {
			status, body = c.call(t, "PUT", "/cart/items", map[string]any{"variant_id": variant.ID, "quantity": 2})
			if status != 200 {
				t.Fatalf("%s: %d %s", variant.ID, status, body)
			}
			expected += variant.Price * 2
		}
	}
	status, order := c.checkout(t, "all-showcase-products")
	if status != 200 {
		t.Fatal("checkout", status)
	}
	if order.Total != expected || len(order.Items) != 22 {
		t.Fatalf("incorrect catalog order: %+v", order)
	}
}
