package domain

import "math/big"

// GHOSTDAGData represents GHOSTDAG consensus data for a block
type GHOSTDAGData struct {
	BlockHash      string
	BlueScore      uint64
	BlueWork       *big.Int
	SelectedParent string
	MergeSetBlues  []string
	MergeSetReds   []string
}

// IsBlue returns true if the block is in the blue set
func (g *GHOSTDAGData) IsBlue() bool {
	return g.BlueScore > 0
}

// MergeSetSize returns the total size of the merge set
func (g *GHOSTDAGData) MergeSetSize() int {
	return len(g.MergeSetBlues) + len(g.MergeSetReds)
}

