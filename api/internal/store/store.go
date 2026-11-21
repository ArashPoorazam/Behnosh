package store

import (
	"context"
	"embed"
	"fmt"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
	"io/fs"
	"sort"
	"time"
)

func Open(ctx context.Context, dsn string) (*pgxpool.Pool, error) {
	c, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, err
	}
	c.MaxConns = 12
	c.MinConns = 1
	c.MaxConnLifetime = time.Hour
	c.MaxConnIdleTime = 5 * time.Minute
	c.ConnConfig.ConnectTimeout = 5 * time.Second
	p, err := pgxpool.NewWithConfig(ctx, c)
	if err != nil {
		return nil, err
	}
	if err = p.Ping(ctx); err != nil {
		p.Close()
		return nil, err
	}
	return p, nil
}
func Migrate(ctx context.Context, p *pgxpool.Pool, files embed.FS) error {
	tx, err := p.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	if _, err = tx.Exec(ctx, `SELECT pg_advisory_xact_lock(712039); CREATE TABLE IF NOT EXISTS schema_migrations(version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`); err != nil {
		return err
	}
	names, err := fs.Glob(files, "migrations/*.sql")
	if err != nil {
		return err
	}
	sort.Strings(names)
	for _, name := range names {
		var exists bool
		if err = tx.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version=$1)", name).Scan(&exists); err != nil {
			return err
		}
		if exists {
			continue
		}
		sql, e := files.ReadFile(name)
		if e != nil {
			return e
		}
		if _, err = tx.Exec(ctx, string(sql)); err != nil {
			return fmt.Errorf("migration %s: %w", name, err)
		}
		if _, err = tx.Exec(ctx, "INSERT INTO schema_migrations(version) VALUES($1)", name); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}
func Seed(ctx context.Context, p *pgxpool.Pool, username, password string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return err
	}
	tx, err := p.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	_, err = tx.Exec(ctx, `SELECT pg_advisory_xact_lock(712039);
 INSERT INTO categories VALUES('malt','نوشیدنی مالت') ON CONFLICT DO NOTHING;
 INSERT INTO products(id,category_id,slug,name,description,asset) VALUES
 ('tropical','malt','tropical','دلستر استوایی','یک جرعه، یک حال‌وهوای تازه. طعم استوایی در قوطی خنک.','tropical'),
 ('classic','malt','classic','دلستر کلاسیک','طعم آشنای مالت، در بطری شیشه‌ای کلاسیک.','classic') ON CONFLICT DO NOTHING;
 INSERT INTO variants(id,product_id,sku,name,units,price_rial) VALUES
 ('tropical-single','tropical','DL-TR-01','تک قوطی',1,450000),('tropical-six','tropical','DL-TR-06','بسته ۶ عددی',6,2520000),
 ('classic-single','classic','DL-CL-01','تک بطری',1,390000),('classic-six','classic','DL-CL-06','بسته ۶ عددی',6,2220000) ON CONFLICT DO NOTHING;
 INSERT INTO warehouses VALUES('tehran','انبار تهران',true),('karaj','انبار کرج',true) ON CONFLICT DO NOTHING;
 WITH inserted AS (INSERT INTO inventory_balances(warehouse_id,variant_id,on_hand) SELECT w.id,v.id,CASE WHEN w.id='tehran' THEN 120 ELSE 40 END FROM warehouses w CROSS JOIN variants v ON CONFLICT DO NOTHING RETURNING *)
 INSERT INTO inventory_movements(warehouse_id,variant_id,delta,reason) SELECT warehouse_id,variant_id,on_hand,'موجودی آغازین نمونه' FROM inserted;`)
	if err != nil {
		return err
	}
	_, err = tx.Exec(ctx, "INSERT INTO admin_users(id,username,password_hash,role_id) VALUES('demo-admin',$1,$2,'admin') ON CONFLICT DO NOTHING", username, string(hash))
	if err != nil {
		return err
	}
	return tx.Commit(ctx)
}
