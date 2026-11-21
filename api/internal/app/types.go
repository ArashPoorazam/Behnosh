package app

import "time"

type Session struct {
	ID    string `json:"-"`
	CSRF  string `json:"csrf"`
	Admin bool   `json:"admin"`
}
type Product struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Asset       string    `json:"asset"`
	Variants    []Variant `json:"variants"`
}
type Variant struct {
	Active    bool   `json:"active"`
	ID        string `json:"id"`
	SKU       string `json:"sku"`
	Name      string `json:"name"`
	Units     int    `json:"units"`
	Price     int64  `json:"price_rial"`
	Available int    `json:"available"`
}
type CartItem struct {
	VariantID   string `json:"variant_id"`
	ProductName string `json:"product_name"`
	VariantName string `json:"variant_name"`
	Asset       string `json:"asset"`
	Quantity    int    `json:"quantity"`
	UnitPrice   int64  `json:"unit_price_rial"`
}
type Cart struct {
	Items []CartItem `json:"items"`
	Total int64      `json:"total_rial"`
}
type OrderItem struct {
	VariantID   string `json:"variant_id"`
	ProductName string `json:"product_name"`
	VariantName string `json:"variant_name"`
	SKU         string `json:"sku"`
	Quantity    int    `json:"quantity"`
	UnitPrice   int64  `json:"unit_price_rial"`
}
type Attempt struct {
	ID        string    `json:"id"`
	Scenario  string    `json:"scenario"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}
type Order struct {
	ID        string      `json:"id"`
	Status    string      `json:"status"`
	Total     int64       `json:"total_rial"`
	CreatedAt time.Time   `json:"created_at"`
	ExpiresAt time.Time   `json:"expires_at"`
	Items     []OrderItem `json:"items"`
	Payments  []Attempt   `json:"payments"`
}
type Inventory struct {
	WarehouseID   string `json:"warehouse_id"`
	WarehouseName string `json:"warehouse_name"`
	VariantID     string `json:"variant_id"`
	ProductName   string `json:"product_name"`
	VariantName   string `json:"variant_name"`
	SKU           string `json:"sku"`
	OnHand        int    `json:"on_hand"`
	Reserved      int    `json:"reserved"`
	Available     int    `json:"available"`
}
type Movement struct {
	ID        int64     `json:"id"`
	Warehouse string    `json:"warehouse"`
	SKU       string    `json:"sku"`
	Delta     int       `json:"delta"`
	Reason    string    `json:"reason"`
	CreatedAt time.Time `json:"created_at"`
}
type Audit struct {
	ID        int64     `json:"id"`
	Actor     string    `json:"actor"`
	Action    string    `json:"action"`
	EntityID  string    `json:"entity_id"`
	Detail    string    `json:"detail"`
	CreatedAt time.Time `json:"created_at"`
}
