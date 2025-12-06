package domain_test

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/domain"
)

func TestTransaction_Validate(t *testing.T) {
	validHash := "0x" + strings.Repeat("a", 64)
	validAddress := "0x" + strings.Repeat("b", 40)

	tests := []struct {
		name    string
		tx      domain.Transaction
		wantErr bool
		errMsg  string
	}{
		{
			name: "valid transaction",
			tx: domain.Transaction{
				Hash:        validHash,
				BlockHash:   validHash,
				BlockNumber: 100,
				From:        validAddress,
				To:          &validAddress,
				Value:       1000000000000000000,
				GasLimit:    21000,
				Nonce:       5,
			},
			wantErr: false,
		},
		{
			name: "valid contract creation - nil To",
			tx: domain.Transaction{
				Hash:        validHash,
				BlockHash:   validHash,
				BlockNumber: 100,
				From:        validAddress,
				To:          nil,
				Value:       0,
				GasLimit:    100000,
				Nonce:       5,
			},
			wantErr: false,
		},
		{
			name: "invalid hash format",
			tx: domain.Transaction{
				Hash:        "invalid",
				BlockHash:   validHash,
				BlockNumber: 100,
				From:        validAddress,
			},
			wantErr: true,
			errMsg:  "invalid transaction hash format",
		},
		{
			name: "invalid from address format",
			tx: domain.Transaction{
				Hash:        validHash,
				BlockHash:   validHash,
				BlockNumber: 100,
				From:        "invalid",
			},
			wantErr: true,
			errMsg:  "invalid from address format",
		},
		{
			name: "invalid to address format",
			tx: domain.Transaction{
				Hash:        validHash,
				BlockHash:   validHash,
				BlockNumber: 100,
				From:        validAddress,
				To:          stringPtr("invalid"),
			},
			wantErr: true,
			errMsg:  "invalid to address format",
		},
		{
			name: "negative block number",
			tx: domain.Transaction{
				Hash:        validHash,
				BlockHash:   validHash,
				BlockNumber: -1,
				From:        validAddress,
			},
			wantErr: true,
			errMsg:  "block number cannot be negative",
		},
		{
			name: "zero nonce is valid",
			tx: domain.Transaction{
				Hash:        validHash,
				BlockHash:   validHash,
				BlockNumber: 100,
				From:        validAddress,
				Nonce:       0,
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.tx.Validate()
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

func TestTransaction_IsContractCreation(t *testing.T) {
	validAddress := "0x" + strings.Repeat("b", 40)

	tests := []struct {
		name string
		tx   domain.Transaction
		want bool
	}{
		{
			name: "contract creation - nil To",
			tx: domain.Transaction{
				To: nil,
			},
			want: true,
		},
		{
			name: "regular transaction - has To",
			tx: domain.Transaction{
				To: &validAddress,
			},
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.want, tt.tx.IsContractCreation())
		})
	}
}

func stringPtr(s string) *string {
	return &s
}

