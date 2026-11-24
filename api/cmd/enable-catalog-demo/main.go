// Explicitly enable simulated offers for imported products. Never uses real prices.
package main

import (
	"behnosh/api/internal/store"
	"context"
	"fmt"
	"os"
	"time"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
func run() error {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		return fmt.Errorf("DATABASE_URL is required")
	}
	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()
	db, err := store.Open(ctx, dsn)
	if err != nil {
		return err
	}
	defer db.Close()
	count, err := store.EnableCatalogDemo(ctx, db)
	if err != nil {
		return err
	}
	fmt.Printf("Enabled %d imported products with simulated prices and stock.\n", count)
	return nil
}
