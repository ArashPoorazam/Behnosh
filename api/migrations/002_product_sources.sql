-- Official catalog metadata is separate from sellable offers and demo artwork.
-- New imported products stay inactive and have no price or stock until configured.
CREATE TABLE product_sources (
    product_id text PRIMARY KEY REFERENCES products(id),
    source_site text NOT NULL,
    source_product_id text NOT NULL,
    source_url text NOT NULL UNIQUE,
    source_name text NOT NULL,
    source_description text NOT NULL,
    brand text NOT NULL,
    category text NOT NULL,
    flavor text NOT NULL,
    packaging text NOT NULL,
    volume_label text NOT NULL,
    volume_ml integer NOT NULL CHECK (volume_ml > 0),
    image_url text NOT NULL,
    image_path text NOT NULL,
    image_sha256 text NOT NULL CHECK (length(image_sha256) = 64),
    detail_sha256 text NOT NULL CHECK (length(detail_sha256) = 64),
    facts jsonb NOT NULL,
    collected_at timestamptz NOT NULL,
    UNIQUE (source_site, source_product_id)
);
CREATE INDEX product_sources_brand ON product_sources(brand);
