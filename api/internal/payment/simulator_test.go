package payment

import (
	"context"
	"testing"
)

func TestDeterministicScenarios(t *testing.T) {
	for scenario, want := range map[string]string{"success": "succeeded", "failure": "failed", "cancel": "cancelled"} {
		for range 2 {
			result, err := (Simulator{}).Resolve(context.Background(), "same-reference", scenario)
			if err != nil || result.Status != want {
				t.Fatal(scenario, result, err)
			}
		}
	}
	if _, err := (Simulator{}).Resolve(context.Background(), "ref", "invalid"); err == nil {
		t.Fatal("invalid scenario accepted")
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if _, err := (Simulator{}).Resolve(ctx, "ref", "success"); err == nil {
		t.Fatal("cancellation ignored")
	}
}
