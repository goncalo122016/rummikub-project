package api

import (
	"rummikub/game"
	"github.com/gorilla/websocket"
)

type Client struct {
	conn   *websocket.Conn
	send chan ServerMessage
	player game.PlayerI
}

