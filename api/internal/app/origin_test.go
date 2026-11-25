package app

import (
	"behnosh/api/internal/config"
	"net/http/httptest"
	"testing"
)

func TestCSRFOrigins(t *testing.T) {
	const local = "http://127.0.0.1:3000"
	const prod = "https://shop.example.com"
	for _, tc := range []struct {
		name, configured, incoming, token string
		allowed                           bool
	}{
		{"exact local", local, local, "valid", true},
		{"localhost alias", local, "http://localhost:3000", "valid", true},
		{"numeric alias", "http://localhost:3000", local, "valid", true},
		{"wrong token on alias", local, "http://localhost:3000", "wrong", false},
		{"missing token on alias", local, "http://localhost:3000", "", false},
		{"wrong token exact", local, local, "wrong", false},
		{"different port", local, "http://localhost:3001", "valid", false},
		{"missing port", local, "http://localhost", "valid", false},
		{"different scheme", local, "https://localhost:3000", "valid", false},
		{"foreign host", local, "http://attacker.example:3000", "valid", false},
		{"hostname suffix", local, "http://localhost.attacker.example:3000", "valid", false},
		{"hostname prefix", local, "http://other.localhost:3000", "valid", false},
		{"userinfo", local, "http://attacker@localhost:3000", "valid", false},
		{"path", local, "http://localhost:3000/path", "valid", false},
		{"query", local, "http://localhost:3000?query", "valid", false},
		{"fragment", local, "http://localhost:3000#fragment", "valid", false},
		{"missing origin", local, "", "valid", false},
		{"null origin", local, "null", "valid", false},
		{"malformed origin", local, "http://[", "valid", false},
		{"exact production", prod, prod, "valid", true},
		{"production rejects localhost", prod, "http://localhost:3000", "valid", false},
		{"production rejects foreign host", prod, "https://attacker.example", "valid", false},
	} {
		t.Run(tc.name, func(t *testing.T) {
			a := &App{Config: config.Config{Origin: tc.configured}}
			r := httptest.NewRequest("PUT", "/api/v1/cart/items", nil)
			r.Header.Set("Origin", tc.incoming)
			r.Header.Set("X-CSRF-Token", tc.token)
			err := a.checkCSRF(r, &Session{CSRF: "valid"})
			if (err == nil) != tc.allowed {
				t.Fatalf("allowed = %v, want %v: %v", err == nil, tc.allowed, err)
			}
		})
	}
}
