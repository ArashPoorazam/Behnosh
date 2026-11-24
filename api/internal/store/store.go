package store

import (
	"context"
	"embed"
	"fmt"
	"github.com/jackc/pgx/v5"
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
 INSERT INTO categories VALUES('malt','نوشیدنی مالت'),('fruit','نوشیدنی میوه‌ای') ON CONFLICT DO NOTHING;
 INSERT INTO products(id,category_id,slug,name,description,asset) VALUES
 ('tropical','malt','tropical','دلستر استوایی','یک جرعه، یک حال‌وهوای تازه. طعم استوایی در قوطی خنک.','tropical'),
 ('classic','malt','classic','دلستر کلاسیک','طعم آشنای مالت، در بطری شیشه‌ای کلاسیک.','classic'),
 ('can-lemon','malt','can-lemon','دلستر لیمویی','نوشیدنی مالت با طعم لیمو، قوطی ۳۳۰ میلی‌لیتری.','can-lemon'),
 ('can-peach','malt','can-peach','دلستر هلو','نوشیدنی مالت با طعم هلو، قوطی ۳۳۰ میلی‌لیتری.','can-peach'),
 ('can-pineapple','malt','can-pineapple','دلستر آناناس','نوشیدنی مالت با طعم آناناس، قوطی ۳۳۰ میلی‌لیتری.','can-pineapple'),
 ('can-black','malt','can-black','دلستر بلک','نوشیدنی مالت بلک، قوطی ۳۳۰ میلی‌لیتری.','can-black'),
 ('bottle-tropical','malt','bottle-tropical','دلستر استوایی شیشه‌ای','نوشیدنی مالت استوایی، بطری ۳۲۰ میلی‌لیتری.','bottle-tropical'),
 ('dadli-orange','fruit','dadli-orange','دادلی پرتقال','نوشیدنی گازدار با طعم پرتقال، بطری ۲۵۰ میلی‌لیتری.','dadli-orange'),
 ('dadli-peach','fruit','dadli-peach','دادلی هلو','نوشیدنی گازدار با طعم هلو، بطری ۲۵۰ میلی‌لیتری.','dadli-peach'),
 ('dadli-coconut','fruit','dadli-coconut','دادلی نارگیل','نوشیدنی گازدار با طعم نارگیل، بطری ۲۵۰ میلی‌لیتری.','dadli-coconut'),
 ('dadli-blue','fruit','dadli-blue','دادلی بلوتروپیکال','نوشیدنی گازدار با طعم استوایی، بطری ۲۵۰ میلی‌لیتری.','dadli-blue') ON CONFLICT DO NOTHING;
 INSERT INTO variants(id,product_id,sku,name,units,price_rial) VALUES
 ('tropical-single','tropical','DL-TR-01','تک قوطی',1,450000),('tropical-six','tropical','DL-TR-06','بسته ۶ عددی',6,2520000),
 ('classic-single','classic','DL-CL-01','تک بطری',1,390000),('classic-six','classic','DL-CL-06','بسته ۶ عددی',6,2220000) ON CONFLICT DO NOTHING;
 INSERT INTO variants(id,product_id,sku,name,units,price_rial)
 SELECT p.id || '-single', p.id, 'DEMO-' || upper(p.id) || '-01', CASE WHEN p.asset LIKE 'can-%' THEN 'تک قوطی' ELSE 'تک بطری' END, 1, CASE WHEN p.category_id='fruit' THEN 420000 ELSE 450000 END
 FROM products p WHERE p.id = ANY($1::text[]) AND p.id NOT IN ('tropical','classic') ON CONFLICT DO NOTHING;
 INSERT INTO variants(id,product_id,sku,name,units,price_rial)
 SELECT p.id || '-six', p.id, 'DEMO-' || upper(p.id) || '-06', 'بسته ۶ عددی', 6, CASE WHEN p.category_id='fruit' THEN 2350000 ELSE 2520000 END
 FROM products p WHERE p.id = ANY($1::text[]) AND p.id NOT IN ('tropical','classic') ON CONFLICT DO NOTHING;
 INSERT INTO warehouses VALUES('tehran','انبار تهران',true),('karaj','انبار کرج',true) ON CONFLICT DO NOTHING;
 WITH inserted AS (INSERT INTO inventory_balances(warehouse_id,variant_id,on_hand) SELECT w.id,v.id,CASE WHEN w.id='tehran' THEN 120 ELSE 40 END FROM warehouses w CROSS JOIN variants v WHERE v.product_id = ANY($1::text[]) ON CONFLICT DO NOTHING RETURNING *)
 INSERT INTO inventory_movements(warehouse_id,variant_id,delta,reason) SELECT warehouse_id,variant_id,on_hand,'موجودی آغازین نمونه' FROM inserted;`, pgx.QueryExecModeSimpleProtocol, demoProductIDs)
	if err != nil {
		return err
	}
	_, err = tx.Exec(ctx, "INSERT INTO admin_users(id,username,password_hash,role_id) VALUES('demo-admin',$1,$2,'admin') ON CONFLICT DO NOTHING", username, string(hash))
	if err != nil {
		return err
	}
	return tx.Commit(ctx)
}

// Only these showcase fixtures receive simulated offers and opening stock.
// Official catalog imports must never acquire fabricated prices on server restart.
var demoProductIDs = []string{
	"tropical", "classic", "can-lemon", "can-peach", "can-pineapple", "can-black",
	"bottle-tropical", "dadli-orange", "dadli-peach", "dadli-coconut", "dadli-blue",
}
