package domain

// Log represents an event log from a transaction
type Log struct {
	TransactionHash string
	LogIndex        uint64
	Address         string
	Topics          []string
	Data            []byte
	BlockNumber     int64
	BlockHash       string
}

// Validate validates the log structure
func (l *Log) Validate() error {
	if l.TransactionHash == "" {
		return ErrInvalidHash
	}

	if l.Address == "" {
		return ErrInvalidAddress
	}

	return nil
}

// HasTopic returns true if log has the specified topic
func (l *Log) HasTopic(topic string) bool {
	for _, t := range l.Topics {
		if t == topic {
			return true
		}
	}
	return false
}

// TopicCount returns the number of topics
func (l *Log) TopicCount() int {
	return len(l.Topics)
}

