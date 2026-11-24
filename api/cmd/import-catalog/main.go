// Import the verified official catalog without creating offers or publishing it.
package main

import (
	"behnosh/api"
	"behnosh/api/internal/store"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

func main() {
	file := flag.String("file", "catalog/products.json", "verified catalog snapshot")
	root := flag.String("root", "..", "repository root for original image paths")
	dryRun := flag.Bool("dry-run", false, "roll back product changes (schema migrations still apply)")
	flag.Parse()
	if err := run(*file, *root, *dryRun); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run(file, root string, dryRun bool) error {
	root, err := filepath.Abs(root)
	if err != nil {
		return err
	}
	snapshot, err := store.LoadCatalog(file, root)
	if err != nil {
		return err
	}
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		return fmt.Errorf("DATABASE_URL is required")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()
	db, err := store.Open(ctx, dsn)
	if err != nil {
		return err
	}
	defer db.Close()
	if err = store.Migrate(ctx, db, api.Migrations); err != nil {
		return err
	}
	result, err := store.ImportCatalog(ctx, db, snapshot, dryRun)
	if err != nil {
		return err
	}
	return json.NewEncoder(os.Stdout).Encode(struct {
		DryRun bool `json:"dry_run"`
		store.CatalogImportResult
	}{dryRun, result})
}
