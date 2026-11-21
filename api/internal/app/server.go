package app

import (
	"behnosh/api/internal/config"
	"behnosh/api/internal/payment"
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"io"
	"log/slog"
	"net/http"
	"strconv"
	"time"
)

type App struct {
	DB       *pgxpool.Pool
	Config   config.Config
	Payments payment.Provider
	Log      *slog.Logger
}
type fault struct {
	status        int
	code, message string
}

func (e *fault) Error() string      { return e.message }
func bad(message string) error      { return &fault{400, "invalid_input", message} }
func conflict(message string) error { return &fault{409, "conflict", message} }

var notFound = &fault{404, "not_found", "موردی پیدا نشد."}

type endpoint func(http.ResponseWriter, *http.Request, *Session) error

func (a *App) Handler() http.Handler {
	m := http.NewServeMux()
	m.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()
		if err := a.DB.Ping(ctx); err != nil {
			http.Error(w, "unavailable", 503)
			return
		}
		write(w, 200, map[string]string{"status": "ok"})
	})
	m.HandleFunc("GET /api/v1/catalog", a.wrap(false, false, a.catalog))
	m.HandleFunc("GET /api/v1/session", a.wrap(false, false, a.session))
	m.HandleFunc("POST /api/v1/login", a.wrap(true, false, a.login))
	m.HandleFunc("POST /api/v1/logout", a.wrap(true, false, a.logout))
	m.HandleFunc("GET /api/v1/cart", a.wrap(true, false, a.cart))
	m.HandleFunc("PUT /api/v1/cart/items", a.wrap(true, false, a.setCartItem))
	m.HandleFunc("POST /api/v1/checkout", a.wrap(true, false, a.checkout))
	m.HandleFunc("GET /api/v1/orders", a.wrap(true, false, a.orders))
	m.HandleFunc("GET /api/v1/orders/{id}", a.wrap(true, false, a.order))
	m.HandleFunc("POST /api/v1/orders/{id}/payments", a.wrap(true, false, a.pay))
	m.HandleFunc("GET /api/v1/admin/catalog", a.wrap(true, true, a.adminCatalog))
	m.HandleFunc("GET /api/v1/admin/inventory", a.wrap(true, true, a.inventory))
	m.HandleFunc("POST /api/v1/admin/inventory", a.wrap(true, true, a.adjustInventory))
	m.HandleFunc("GET /api/v1/admin/warehouses", a.wrap(true, true, a.warehouses))
	m.HandleFunc("POST /api/v1/admin/warehouses", a.wrap(true, true, a.createWarehouse))
	m.HandleFunc("GET /api/v1/admin/orders", a.wrap(true, true, a.adminOrders))
	m.HandleFunc("PATCH /api/v1/admin/orders/{id}", a.wrap(true, true, a.updateOrder))
	m.HandleFunc("PATCH /api/v1/admin/variants/{id}", a.wrap(true, true, a.updateVariant))
	m.HandleFunc("GET /api/v1/admin/movements", a.wrap(true, true, a.movements))
	m.HandleFunc("GET /api/v1/admin/audit", a.wrap(true, true, a.audit))
	return m
}
func (a *App) wrap(auth, admin bool, h endpoint) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		requestID := token(12)
		w.Header().Set("X-Request-ID", requestID)
		w.Header().Set("Cache-Control", "private, no-store")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()
		r = r.WithContext(ctx)
		status := 200
		defer func() {
			if recovered := recover(); recovered != nil {
				a.Log.Error("handler panic", "request_id", requestID)
				a.respondError(w, fmt.Errorf("handler panic"), requestID)
				status = 500
			}
			a.Log.Info("request", "request_id", requestID, "method", r.Method, "path", r.URL.Path, "status", status, "duration_ms", time.Since(start).Milliseconds())
		}()
		var s *Session
		var err error
		if auth {
			s, err = a.readSession(r)
			if err == nil && admin && !s.Admin {
				err = &fault{403, "forbidden", "دسترسی مدیر لازم است."}
			}
			if err == nil && r.Method != "GET" {
				err = a.checkCSRF(r, s)
			}
		}
		if err == nil {
			err = h(w, r, s)
		}
		if err != nil {
			status = a.respondError(w, err, requestID)
		}
	}
}
func (a *App) respondError(w http.ResponseWriter, err error, id string) int {
	f := &fault{500, "internal_error", "خطایی رخ داد. دوباره تلاش کنید."}
	var known *fault
	if errors.As(err, &known) {
		f = known
	} else if errors.Is(err, pgx.ErrNoRows) {
		f = notFound
	} else {
		a.Log.Error("operation failed", "request_id", id, "error", err.Error())
	}
	write(w, f.status, map[string]any{"error": map[string]string{"code": f.code, "message": f.message, "request_id": id}})
	return f.status
}
func write(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
func decode(w http.ResponseWriter, r *http.Request, v any) error {
	if r.Header.Get("Content-Type") != "application/json" {
		return bad("فرمت درخواست باید JSON باشد.")
	}
	r.Body = http.MaxBytesReader(w, r.Body, 8192)
	d := json.NewDecoder(r.Body)
	d.DisallowUnknownFields()
	if err := d.Decode(v); err != nil {
		return bad("داده‌های درخواست معتبر نیست.")
	}
	if err := d.Decode(&struct{}{}); err != io.EOF {
		return bad("درخواست باید یک شیء JSON باشد.")
	}
	return nil
}
func token(n int) string {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}
	return hex.EncodeToString(b)
}
func hash(s string) string { v := sha256.Sum256([]byte(s)); return hex.EncodeToString(v[:]) }
func idKey(s string) error {
	if len(s) < 8 || len(s) > 100 {
		return bad("شناسه درخواست معتبر نیست.")
	}
	return nil
}
func page(r *http.Request) (int, int, error) {
	offset := 0
	limit := 20
	var err error
	if v := r.URL.Query().Get("offset"); v != "" {
		offset, err = strconv.Atoi(v)
		if err != nil || offset < 0 || offset > 100000 {
			return 0, 0, bad("صفحه معتبر نیست.")
		}
	}
	if v := r.URL.Query().Get("limit"); v != "" {
		limit, err = strconv.Atoi(v)
		if err != nil || limit < 1 || limit > 100 {
			return 0, 0, bad("اندازه صفحه معتبر نیست.")
		}
	}
	return limit, offset, nil
}
func (a *App) transact(ctx context.Context, fn func(pgx.Tx) error) error {
	tx, err := a.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	if err = fn(tx); err != nil {
		return err
	}
	return tx.Commit(ctx)
}
