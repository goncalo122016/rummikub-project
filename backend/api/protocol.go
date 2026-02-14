package api

import (
	"encoding/json"
)

type ClientMessage struct {
	Type string          `json:"type"`
	Data json.RawMessage `json:"data"`
}
