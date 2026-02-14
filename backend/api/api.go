package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"rummikub/game"
	"sync"

	"github.com/gorilla/websocket"
)

type GameI = game.GameI
type TileI = game.TileI
type CombI = game.CombI
type PlayerI = game.PlayerI

var currentGame game.GameI
var gameLock sync.Mutex

const DEFAULT_GAME_PLAYERS = 1

type ServerMessage struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

var (
	clients    = make(map[*Client]bool)
	clientsLock sync.Mutex
)

func GetCurrentGame() GameI {
	gameLock.Lock()
	defer gameLock.Unlock()
	return currentGame
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // allow all origins for dev
	},
}

func (c *Client) GetCurrentGameState(game GameI) ServerMessage {
	payload := map[string]interface{}{
		"me": c.player,
		"table":        game.GetTable().GetCombs(),
		"pile_empty":   game.IsPileEmpty(),
		"players":      game.GetPlayers(),
		"max_players":  game.GetMaxPlayers(),
		"current_turn": game.GetCurrentTurn(),
		"game_finished": game.IsFinished(),
		"game_started": game.IsStarted(),
	}

	return ServerMessage{
		Type: "sync",
		Data: payload,
	}
}

func WSHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	gameLock.Lock()
	if currentGame == nil {
		currentGame = game.NewGame([]PlayerI{}, DEFAULT_GAME_PLAYERS)
	}
	gameLock.Unlock()

	client := &Client{
		conn: conn,
		send: make(chan ServerMessage, 16),
	}

	go client.writePump()

	clientsLock.Lock()
	clients[client] = true
	clientsLock.Unlock()
	go client.Listen()
}

func (c *Client) Listen() {
	defer func() {
	    clientsLock.Lock()
	    delete(clients, c)
	    clientsLock.Unlock()

	    close(c.send)
	    c.conn.Close()
	}()


	for {
		var msg ClientMessage
		err := c.conn.ReadJSON(&msg)
		fmt.Printf("Received: %s, %v\n", msg.Type, msg.Data)
		if err != nil {
			clientsLock.Lock()
			delete(clients, c)
			clientsLock.Unlock()
			break
		}

		c.handleMessage(msg)
	}
}

func (c *Client) writePump() {
    for msg := range c.send {
        err := c.conn.WriteJSON(msg)
        if err != nil {
            fmt.Println("write error:", err)
            return
        }
    }
}
func (c *Client) Send(msg ServerMessage) {
    c.send <- msg
}

func broadcastGameState() {
	gameLock.Lock()
	game := currentGame
	gameLock.Unlock()

	clientsLock.Lock()
	defer clientsLock.Unlock()

	for client := range clients {
		client.Send(client.GetCurrentGameState(game))
	}
}

func BroadcastWaitingUpdate() {
	clientsLock.Lock()
	defer clientsLock.Unlock()

	playersNames := []string{}
	for _, p := range currentGame.GetPlayers() {
		playersNames = append(playersNames, p.GetName())
	}

	payld := struct {
		Players []string `json:"players"`
		MaxPlayers int    `json:"max_players"`
	}{
		Players: playersNames,
		MaxPlayers: currentGame.GetMaxPlayers(),
	}

	for client := range clients {
	    if client.player != nil {
	        client.Send(ServerMessage{
	            Type: "waiting",
	            Data: payld,
	        })
	    }
	}
}

func (c *Client) handleMessage(msg ClientMessage) {
	switch msg.Type {
		case "create":
			gameLock.Lock()

			var payload struct {
				Name            string `json:"name"`
				NumPlayers      int    `json:"numPlayers"`
				TotalTiles      int    `json:"totalTiles"`
				Jokers          int    `json:"jokers"`
				TilesPerPlayer  int    `json:"tilesPerPlayer"`
			}
		
			raw, _ := json.Marshal(msg.Data)
			json.Unmarshal(raw, &payload)
		
			currentGame = game.NewGame([]PlayerI{}, payload.NumPlayers)
		
			args := []int{}
			if payload.TotalTiles > 0 {
				args = append(args, payload.TotalTiles)
			}
			if payload.Jokers > 0 {
				args = append(args, payload.Jokers)
			}
			if payload.TilesPerPlayer > 0 {
				args = append(args, payload.TilesPerPlayer)
			}
		
			err := currentGame.Configure(payload.NumPlayers, args...)
			if err != nil {
				gameLock.Unlock()
				c.Send(ServerMessage{Type: "error", Data: err.Error()})
				return
			}
		
			gameLock.Unlock()
		
			p, err := currentGame.Join(payload.Name)
			if err != nil {
				c.Send(ServerMessage{Type: "error", Data: err.Error()})
				return
			}
			c.player = p
		
			c.Send(ServerMessage{
				Type: "created",
				Data: c.GetCurrentGameState(currentGame).Data,
			})
		
			playersNames := []string{}
			for _, pl := range currentGame.GetPlayers() {
				playersNames = append(playersNames, pl.GetName())
			}
		
			c.Send(ServerMessage{
				Type: "waiting",
				Data: struct {
					Players    []string `json:"players"`
					MaxPlayers int      `json:"max_players"`
				}{
					Players:    playersNames,
					MaxPlayers: currentGame.GetMaxPlayers(),
				},
			})
		
			if currentGame.IsStarted() {
				broadcastGameState()
			}
		
			fmt.Printf("Player %s created and joined the game. Current players: %v\n", c.player.GetName(), playersNames)

		case "join":
			var payload struct {
				Name string `json:"name"`
			}
			raw, _ := json.Marshal(msg.Data)
			json.Unmarshal(raw, &payload)
		
			p, err := currentGame.Join(payload.Name)
			if err != nil {
				c.Send(ServerMessage{
					Type: "sync_error",
					Data: err.Error(),
				})
				return
			}
		
			c.player = p
		
			c.Send(ServerMessage{
				Type: "joined",
				Data: c.GetCurrentGameState(GetCurrentGame()).Data,
			})

			BroadcastWaitingUpdate()

			if currentGame.IsStarted() {
				broadcastGameState()
			}

		case "play":
			var payload struct {
				TilesIDs []string `json:"tiles"`
				TableComb   []string   `json:"table_comb,omitempty"`
			}
			raw, _ := json.Marshal(msg.Data)
			json.Unmarshal(raw, &payload)

			var tiles []TileI

			// Map tile IDs to actual TileI objects from player's hand
			for _, id := range payload.TilesIDs {
				tile, err := c.player.GetTileByID(id)
				if err != nil {
					// Tile is from table combination
					t , _ := GetCurrentGame().GetTilesByIDs([]string{id})
					tiles = append(tiles, t[0])
					break
				}

				tiles = append(tiles, tile)
			}

			tblComb, err := GetCurrentGame().GetTilesByIDs(payload.TableComb)
			if err != nil {
				c.Send(ServerMessage{
					Type: "error",
					Data: "One or more tiles in table_comb not found on the table",
				})
				return
			}

			err = GetCurrentGame().PlayTurn(c.player, tiles, tblComb)
			if err != nil {
				c.Send(ServerMessage{
					Type: "error",
					Data: err.Error(),
				})
				return
			}
			broadcastGameState()

		case "split":
			var payload struct {
				CombId 	 string   `json:"combId"`
				Index int      	  `json:"index"`
				AddedLeftIDs  []string `json:"added_left"`
				AddedRightIDs []string `json:"added_right"`
			}
			raw, _ := json.Marshal(msg.Data)
			json.Unmarshal(raw, &payload)
			
			// Get the combination to split from the table
			combToSplit, err := GetCurrentGame().GetTable().GetCombByID(payload.CombId)
			if err != nil {
				c.Send(ServerMessage{
					Type: "error",
					Data: "Combination to split not found on the table",
				})
				return
			}

			// Map added left tile IDs to actual TileI objects from player's hand
			var addedLeftTiles []TileI
			for _, id := range payload.AddedLeftIDs {
				tile, err := c.player.GetTileByID(id)
				if err != nil {
					c.Send(ServerMessage{
						Type: "error",
						Data: "One or more tiles in added_left not found in player's hand",
					})
					return
				}
				
				addedLeftTiles = append(addedLeftTiles, tile)
			}

			// Map added right tile IDs to actual TileI objects from player's hand
			var addedRightTiles []TileI
			for _, id := range payload.AddedRightIDs {
				tile, err := c.player.GetTileByID(id)
				if err != nil {
					c.Send(ServerMessage{
						Type: "error",
						Data: "One or more tiles in added_right not found in player's hand",
					})
					return
				}
				
				addedRightTiles = append(addedRightTiles, tile)
			}

			err = GetCurrentGame().SplitCombination(c.player, combToSplit, payload.Index, addedLeftTiles, addedRightTiles)
			if err != nil {
				c.Send(ServerMessage{
					Type: "error",
					Data: err.Error(),
				})
				return
			}
			broadcastGameState()

		case "grab":
			t, err := c.player.GrabOneTile(GetCurrentGame().GetTable())
			if err != nil {
				c.Send(ServerMessage{
					Type: "error",
					Data: err.Error(),
				})
				return
			}
			c.Send(ServerMessage{
				Type: "tile_grabbed",
				Data: t,
			})
			// Depois de tirar um tile, avançar a vez
			GetCurrentGame().SkipTurn(c.player)
			c.player.ClearFirstPlayBuffer()

			broadcastGameState()

		case "skip":
			GetCurrentGame().SkipTurn(c.player)
			c.player.ClearFirstPlayBuffer()
			broadcastGameState()

		case "sync":
			var payload struct {
				Name string `json:"name"`
			}
			raw, _ := json.Marshal(msg.Data)
			json.Unmarshal(raw, &payload)
		
			if c.player == nil {
				p, err := GetCurrentGame().GetPlayerByName(payload.Name)
				if err != nil {
					c.Send(ServerMessage{
						Type: "sync_error",
						Data: err.Error(),
					})
					return
				}
				c.player = p
			}
			c.Send(c.GetCurrentGameState(GetCurrentGame()))

		case "leave":
		    gameLock.Lock()
				
		    err := currentGame.RemovePlayer(c.player)
		    if err != nil {
		        gameLock.Unlock()
		        c.Send(ServerMessage{
		            Type: "error",
		            Data: "Player not found in the game",
		        })
		        return
		    }
		
		    // Se já não há jogadores, recria o jogo e termina aqui
		    if len(currentGame.GetPlayers()) == 0 {
		        currentGame.Reset(currentGame.GetMaxPlayers())
		        gameLock.Unlock()
		        return
		    }
		
		    started := currentGame.IsStarted()
		
		    gameLock.Unlock()
		
		    if !started {
		        BroadcastWaitingUpdate()
		    } else {
		        broadcastGameState()
		    }

		case "reset":
			clientsLock.Lock()
			clientsSnapshot := make([]*Client, 0, len(clients))
			for c := range clients {
				clientsSnapshot = append(clientsSnapshot, c)
			}
			clientsLock.Unlock()

			gameLock.Lock()
			currentGame = game.NewGame([]PlayerI{}, DEFAULT_GAME_PLAYERS)
			gameLock.Unlock()
			
			for _, c := range clientsSnapshot {
				c.Send(ServerMessage{
					Type: "reset",
					Data: "Game has been reset.",
				})
				c.player = nil
			}
	}
}
