package config

import (
	"fmt"
	"net/url"
	"os"
	"time"
)

type Config struct {
	DatabaseURL, Address, Origin, AdminUsername, AdminPassword string
	SecureCookies                                              bool
	ReservationTTL                                             time.Duration
}

func Load() (Config, error) {
	c := Config{DatabaseURL: os.Getenv("DATABASE_URL"), Address: env("API_ADDRESS", "127.0.0.1:8080"), Origin: env("APP_ORIGIN", "http://127.0.0.1:3000"), AdminUsername: env("ADMIN_USERNAME", "admin"), AdminPassword: os.Getenv("ADMIN_PASSWORD"), ReservationTTL: 15 * time.Minute}
	if c.DatabaseURL == "" {
		return c, fmt.Errorf("DATABASE_URL is required")
	}
	u, err := url.Parse(c.Origin)
	if err != nil || u.Host == "" || (u.Scheme != "http" && u.Scheme != "https") || u.Path != "" {
		return c, fmt.Errorf("APP_ORIGIN must be an http(s) origin without trailing slash")
	}
	c.SecureCookies = u.Scheme == "https"
	if len(c.AdminPassword) < 12 {
		return c, fmt.Errorf("ADMIN_PASSWORD must contain at least 12 characters")
	}
	return c, nil
}
func env(k, fallback string) string {
	if s := os.Getenv(k); s != "" {
		return s
	}
	return fallback
}
