package main

import (
	"fmt"
	"rummikub/game"
	"rummikub/table"
	"rummikub/tile"
)

func test2() {
	type TileI = tile.TileI
	type PlayerI = game.PlayerI

	g := game.NewGame([]PlayerI{}, 2)
	g.Join("Alice")
	g.Join("Bob")
	err := g.Start()
	if err != nil {
		fmt.Println("Error starting game:", err)
		return
	}

	// Alice grabs a tile
	_, _ = g.GetPlayers()[0].GrabOneTile(g.GetTable())

	for _, p := range g.GetPlayers() {
		fmt.Printf("Player %s has %d tiles: ", p.GetName(), len(p.GetTiles()))
		PrintTiles(p.GetTiles())
		fmt.Println()
	}

	tbl := g.GetTable()
	fmt.Println(table.ToString(tbl))
}

func PrintTiles(tiles []TileI) {
	if len(tiles) == 0 {
		fmt.Print("No tiles")
		return
	}
	for _, t := range tiles {
		fmt.Printf("%s ", tile.ToString(t))
	}
	fmt.Println()
}
