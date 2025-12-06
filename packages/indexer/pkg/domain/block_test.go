package domain_test

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/domain"
)

func TestBlock_Validate(t *testing.T) {
	tests := []struct {
		name    string
		block   domain.Block
		wantErr bool
		errMsg  string
	}{
		{
			name: "valid block",
			block: domain.Block{
				Hash:      "0x" + strings.Repeat("a", 64),
				Number:    100,
				Timestamp: 1706150400000,
				ParentHashes: []string{"0x" + strings.Repeat("b", 64)},
			},
			wantErr: false,
		},
		{
			name: "invalid hash - too short",
			block: domain.Block{
				Hash:   "0xabc",
				Number: 100,
			},
			wantErr: true,
			errMsg:  "invalid block hash format",
		},
		{
			name: "invalid hash - no 0x prefix",
			block: domain.Block{
				Hash:   strings.Repeat("a", 64),
				Number: 100,
			},
			wantErr: true,
			errMsg:  "invalid block hash format",
		},
		{
			name: "invalid hash - invalid hex characters",
			block: domain.Block{
				Hash:   "0x" + strings.Repeat("g", 64),
				Number: 100,
			},
			wantErr: true,
			errMsg:  "invalid block hash format",
		},
		{
			name: "negative block number",
			block: domain.Block{
				Hash:   "0x" + strings.Repeat("a", 64),
				Number: -1,
			},
			wantErr: true,
			errMsg:  "block number cannot be negative",
		},
		{
			name: "zero timestamp",
			block: domain.Block{
				Hash:      "0x" + strings.Repeat("a", 64),
				Number:    100,
				Timestamp: 0,
			},
			wantErr: true,
			errMsg:  "timestamp must be positive",
		},
		{
			name: "negative timestamp",
			block: domain.Block{
				Hash:      "0x" + strings.Repeat("a", 64),
				Number:    100,
				Timestamp: -1,
			},
			wantErr: true,
			errMsg:  "timestamp must be positive",
		},
		{
			name: "invalid parent hash format",
			block: domain.Block{
				Hash:      "0x" + strings.Repeat("a", 64),
				Number:    100,
				Timestamp: 1706150400000,
				ParentHashes: []string{"invalid"},
			},
			wantErr: true,
			errMsg:  "invalid parent hash format",
		},
		{
			name: "genesis block - zero number",
			block: domain.Block{
				Hash:      "0x" + strings.Repeat("a", 64),
				Number:    0,
				Timestamp: 1706150400000,
				ParentHashes: []string{},
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.block.Validate()
			if tt.wantErr {
				require.Error(t, err)
				if tt.errMsg != "" {
					assert.Contains(t, err.Error(), tt.errMsg)
				}
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestBlock_IsGenesis(t *testing.T) {
	tests := []struct {
		name  string
		block domain.Block
		want  bool
	}{
		{
			name: "genesis block",
			block: domain.Block{Number: 0},
			want:  true,
		},
		{
			name: "non-genesis block",
			block: domain.Block{Number: 1},
			want:  false,
		},
		{
			name: "high block number",
			block: domain.Block{Number: 1000},
			want:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.want, tt.block.IsGenesis())
		})
	}
}

func TestBlock_ParentCount(t *testing.T) {
	tests := []struct {
		name  string
		block domain.Block
		want  int
	}{
		{
			name:  "no parents",
			block: domain.Block{ParentHashes: []string{}},
			want:  0,
		},
		{
			name:  "single parent",
			block: domain.Block{ParentHashes: []string{"0xabc"}},
			want:  1,
		},
		{
			name:  "multiple parents",
			block: domain.Block{ParentHashes: []string{"0xabc", "0xdef", "0x123"}},
			want:  3,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.want, tt.block.ParentCount())
		})
	}
}

