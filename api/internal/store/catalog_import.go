package store

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type CatalogSnapshot struct {
	Source      string           `json:"source"`
	CollectedAt time.Time        `json:"collected_at"`
	Total       int              `json:"total"`
	Products    []CatalogProduct `json:"products"`
}

type CatalogProduct struct {
	SourceID     string            `json:"source_id"`
	SourceURL    string            `json:"source_url"`
	Name         string            `json:"name"`
	Description  string            `json:"description"`
	Brand        string            `json:"brand"`
	Category     string            `json:"category"`
	Flavor       string            `json:"flavor"`
	Size         string            `json:"size"`
	Pack         string            `json:"pack"`
	VolumeML     int               `json:"volume_ml"`
	ImageURL     string            `json:"image_url"`
	ImagePath    string            `json:"image_path"`
	ImageSHA256  string            `json:"image_sha256"`
	DetailSHA256 string            `json:"detail_sha256"`
	Facts        map[string]string `json:"facts"`
}

type showcaseMatch struct {
	ProductID, Brand, Flavor, Pack string
	VolumeML                       int
}

// Verified against the existing showcase recipes, packaging and source photos.
var showcaseMatches = map[string]showcaseMatch{
	"152": {"classic", "دلستر", "کلاسیک", "شیشه", 320},
	"232": {"bottle-tropical", "دلستر", "استوایی", "شیشه", 320},
	"182": {"tropical", "دلستر", "استوایی", "قوطی", 330},
	"185": {"can-lemon", "دلستر", "لیمو", "قوطی", 330},
	"186": {"can-peach", "دلستر", "هلو", "قوطی", 330},
	"126": {"can-pineapple", "دلستر", "آناناس", "قوطی", 330},
	"240": {"can-black", "دلستر", "بلک", "قوطی", 330},
	"199": {"dadli-orange", "دادلی", "پرتقال", "شیشه", 250},
	"198": {"dadli-peach", "دادلی", "هلو", "شیشه", 250},
	"197": {"dadli-coconut", "دادلی", "نارگیل", "شیشه", 250},
	"194": {"dadli-blue", "دادلی", "بلوتروپیکال", "شیشه", 250},
}

// LoadCatalog validates completeness, source identity and every saved image before
// allowing any database writes. repoRoot resolves the snapshot's portable paths.
func LoadCatalog(path, repoRoot string) (CatalogSnapshot, error) {
	var s CatalogSnapshot
	data, err := os.ReadFile(path)
	if err != nil {
		return s, err
	}
	if err = json.Unmarshal(data, &s); err != nil {
		return s, err
	}
	if s.Source != "https://behnoushiran.com" || s.Total == 0 || s.Total != len(s.Products) || s.CollectedAt.IsZero() {
		return s, fmt.Errorf("invalid or incomplete catalog snapshot")
	}
	ids, urls := map[string]bool{}, map[string]bool{}
	for _, r := range s.Products {
		if r.SourceID == "" || ids[r.SourceID] || urls[r.SourceURL] || r.Name == "" || r.Brand == "" || r.Category == "" || r.Pack == "" || r.VolumeML <= 0 ||
			!strings.HasPrefix(r.SourceURL, s.Source+"/") || !strings.HasPrefix(r.ImageURL, s.Source+"/") || len(r.DetailSHA256) != 64 {
			return s, fmt.Errorf("invalid/duplicate source product %q", r.SourceID)
		}
		ids[r.SourceID], urls[r.SourceURL] = true, true
		if r.ImagePath != "api/catalog/images/"+r.SourceID+".png" || strings.ContainsAny(r.SourceID, "/\\.") {
			return s, fmt.Errorf("invalid image path for %s", r.SourceID)
		}
		image, err := os.ReadFile(filepath.Join(repoRoot, r.ImagePath))
		if err != nil {
			return s, err
		}
		if fmt.Sprintf("%x", sha256.Sum256(image)) != r.ImageSHA256 {
			return s, fmt.Errorf("image checksum mismatch for %s", r.SourceID)
		}
		if m, ok := showcaseMatches[r.SourceID]; ok && (m.Brand != r.Brand || m.Flavor != r.Flavor || m.Pack != r.Pack || m.VolumeML != r.VolumeML) {
			return s, fmt.Errorf("showcase mapping changed for %s; review before importing", r.SourceID)
		}
	}
	for id := range showcaseMatches {
		if !ids[id] {
			return s, fmt.Errorf("snapshot is missing showcase source %s", id)
		}
	}
	return s, nil
}

type CatalogImportResult struct {
	Sources  int `json:"sources"`
	Created  int `json:"products_created"`
	Existing int `json:"products_reused"`
}

// ImportCatalog is atomic and repeatable. It updates source metadata only; an
// existing product's curated text, active status, offers and stock are untouched.
func ImportCatalog(ctx context.Context, db *pgxpool.Pool, s CatalogSnapshot, dryRun bool) (CatalogImportResult, error) {
	result := CatalogImportResult{}
	tx, err := db.Begin(ctx)
	if err != nil {
		return result, err
	}
	defer tx.Rollback(ctx)
	if _, err = tx.Exec(ctx, "SELECT pg_advisory_xact_lock(712039)"); err != nil {
		return result, err
	}
	for _, match := range showcaseMatches {
		var exists bool
		if err = tx.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM products WHERE id=$1)", match.ProductID).Scan(&exists); err != nil {
			return result, err
		}
		if !exists {
			return result, fmt.Errorf("missing showcase product %s: start the API once to seed the existing catalog before importing", match.ProductID)
		}
	}
	for _, r := range s.Products {
		id := "behnoush-" + r.SourceID
		if m, ok := showcaseMatches[r.SourceID]; ok {
			id = m.ProductID
		}
		// Reuse broad existing categories for the showcase; exact source taxonomy
		// is always retained on product_sources.
		categoryID := fmt.Sprintf("source-%x", sha256.Sum256([]byte(r.Category)))[:19]
		if r.Category == "نوشیدنی مالت بدون الکل" {
			categoryID = "malt"
		} else if r.Brand == "دادلی" {
			categoryID = "fruit"
		}
		if _, err = tx.Exec(ctx, `INSERT INTO categories(id,name) VALUES($1,$2) ON CONFLICT(id) DO NOTHING`, categoryID, r.Category); err != nil {
			return result, err
		}
		tag, err := tx.Exec(ctx, `INSERT INTO products(id,category_id,slug,name,description,asset,active)
			VALUES($1,$2,$1,$3,$4,'',false) ON CONFLICT(id) DO NOTHING`, id, categoryID, r.Name, r.Description)
		if err != nil {
			return result, err
		}
		if tag.RowsAffected() == 1 {
			result.Created++
		} else {
			result.Existing++
		}
		facts, err := json.Marshal(r.Facts)
		if err != nil {
			return result, err
		}
		_, err = tx.Exec(ctx, `INSERT INTO product_sources(
			product_id,source_site,source_product_id,source_url,source_name,source_description,
			brand,category,flavor,packaging,volume_label,volume_ml,image_url,image_path,
			image_sha256,detail_sha256,facts,collected_at)
			VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
			ON CONFLICT(source_site,source_product_id) DO UPDATE SET
			source_url=excluded.source_url,source_name=excluded.source_name,source_description=excluded.source_description,
			brand=excluded.brand,category=excluded.category,flavor=excluded.flavor,packaging=excluded.packaging,
			volume_label=excluded.volume_label,volume_ml=excluded.volume_ml,image_url=excluded.image_url,
			image_path=excluded.image_path,image_sha256=excluded.image_sha256,detail_sha256=excluded.detail_sha256,
			facts=excluded.facts,collected_at=excluded.collected_at`, id, s.Source, r.SourceID, r.SourceURL,
			r.Name, r.Description, r.Brand, r.Category, r.Flavor, r.Pack, r.Size, r.VolumeML, r.ImageURL,
			r.ImagePath, r.ImageSHA256, r.DetailSHA256, facts, s.CollectedAt)
		if err != nil {
			return result, fmt.Errorf("source %s: %w", r.SourceID, err)
		}
		result.Sources++
	}
	if dryRun {
		return result, tx.Rollback(ctx)
	}
	return result, tx.Commit(ctx)
}
