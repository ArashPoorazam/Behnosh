package main

import (
	"behnosh/api"
	"behnosh/api/internal/app"
	"behnosh/api/internal/config"
	"behnosh/api/internal/payment"
	"behnosh/api/internal/store"
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	log := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	if err := run(log); err != nil {
		log.Error("server stopped", "error", err.Error())
		os.Exit(1)
	}
}
func run(log *slog.Logger) error {
	c, err := config.Load()
	if err != nil {
		return err
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	startup, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()
	db, err := store.Open(startup, c.DatabaseURL)
	if err != nil {
		return err
	}
	defer db.Close()
	if err = store.Migrate(startup, db, api.Migrations); err != nil {
		return err
	}
	if err = store.Seed(startup, db, c.AdminUsername, c.AdminPassword); err != nil {
		return err
	}
	application := &app.App{DB: db, Config: c, Payments: payment.Simulator{}, Log: log}
	srv := &http.Server{Addr: c.Address, Handler: application.Handler(), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 15 * time.Second, WriteTimeout: 20 * time.Second, IdleTimeout: 60 * time.Second, MaxHeaderBytes: 16 << 10}
	workerDone := make(chan struct{})
	go func() {
		defer close(workerDone)
		ticker := time.NewTicker(15 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				job, cancel := context.WithTimeout(ctx, 10*time.Second)
				if err := application.ExpireReservations(job); err != nil && !errors.Is(err, context.Canceled) {
					log.Error("reservation cleanup failed", "error", err.Error())
				}
				cancel()
			}
		}
	}()
	serverErrors := make(chan error, 1)
	go func() { log.Info("listening", "address", c.Address); serverErrors <- srv.ListenAndServe() }()
	select {
	case err = <-serverErrors:
		stop()
	case <-ctx.Done():
	}
	shutdown, cancelShutdown := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancelShutdown()
	shutdownErr := srv.Shutdown(shutdown)
	stop()
	<-workerDone
	if err != nil && !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	return shutdownErr
}
