package domain_test

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/domain"
)

func TestLog_Validate(t *testing.T) {
	tests := []struct {
		name    string
		log     *domain.Log
		wantErr bool
	}{
		{
			name: "valid log",
			log: &domain.Log{
				TransactionHash: "0x" + strings.Repeat("a", 64),
				Address:        "0x" + strings.Repeat("b", 40),
				Topics:         []string{"0xtopic1"},
			},
			wantErr: false,
		},
		{
			name: "missing transaction hash",
			log: &domain.Log{
				Address: "0x" + strings.Repeat("b", 40),
			},
			wantErr: true,
		},
		{
			name: "missing address",
			log: &domain.Log{
				TransactionHash: "0x" + strings.Repeat("a", 64),
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.log.Validate()
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestLog_HasTopic(t *testing.T) {
	log := &domain.Log{
		TransactionHash: "0x" + strings.Repeat("a", 64),
		Address:        "0x" + strings.Repeat("b", 40),
		Topics:         []string{"0xtopic1", "0xtopic2", "0xtopic3"},
	}

	assert.True(t, log.HasTopic("0xtopic1"))
	assert.True(t, log.HasTopic("0xtopic2"))
	assert.True(t, log.HasTopic("0xtopic3"))
	assert.False(t, log.HasTopic("0xtopic4"))
}

func TestLog_TopicCount(t *testing.T) {
	tests := []struct {
		name  string
		log   *domain.Log
		count int
	}{
		{
			name: "no topics",
			log: &domain.Log{
				TransactionHash: "0x" + strings.Repeat("a", 64),
				Address:        "0x" + strings.Repeat("b", 40),
				Topics:         []string{},
			},
			count: 0,
		},
		{
			name: "three topics",
			log: &domain.Log{
				TransactionHash: "0x" + strings.Repeat("a", 64),
				Address:        "0x" + strings.Repeat("b", 40),
				Topics:         []string{"0xtopic1", "0xtopic2", "0xtopic3"},
			},
			count: 3,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.count, tt.log.TopicCount())
		})
	}
}

