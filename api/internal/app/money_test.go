package app

import (
	"math"
	"testing"
)

func TestMoney(t *testing.T) {
	for _, tc := range []struct {
		price   int64
		qty     int
		want    int64
		invalid bool
	}{{450000, 6, 2700000, false}, {2520000, 2, 5040000, false}, {math.MaxInt64, 2, 0, true}, {450000, 0, 0, true}, {450000, 25, 0, true}, {-1, 1, 0, true}} {
		got, err := lineTotal(tc.price, tc.qty)
		if (err != nil) != tc.invalid || (!tc.invalid && got != tc.want) {
			t.Fatalf("lineTotal(%d,%d)=%d,%v", tc.price, tc.qty, got, err)
		}
	}
	if _, err := addTotal(math.MaxInt64, 1); err == nil {
		t.Fatal("overflow accepted")
	}
	if total, err := addTotal(2700000, 390000); err != nil || total != 3090000 {
		t.Fatal(total, err)
	}
}
