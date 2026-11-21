package payment

import (
	"context"
	"fmt"
)

type Result struct{ Status string }
type Provider interface {
	Resolve(context.Context, string, string) (Result, error)
}
type Simulator struct{}

func (Simulator) Resolve(ctx context.Context, reference, scenario string) (Result, error) {
	if err := ctx.Err(); err != nil {
		return Result{}, err
	}
	switch scenario {
	case "success":
		return Result{"succeeded"}, nil
	case "failure":
		return Result{"failed"}, nil
	case "cancel":
		return Result{"cancelled"}, nil
	default:
		return Result{}, fmt.Errorf("unknown simulated scenario")
	}
}
