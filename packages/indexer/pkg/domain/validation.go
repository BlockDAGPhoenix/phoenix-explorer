package domain

import (
	"errors"
	"regexp"
)

var (
	hashRegex    = regexp.MustCompile(`^0x[0-9a-fA-F]{64}$`)
	addressRegex = regexp.MustCompile(`^0x[0-9a-fA-F]{40}$`)
)

var (
	ErrInvalidHash    = errors.New("invalid hash format")
	ErrInvalidAddress = errors.New("invalid address format")
)

