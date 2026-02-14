package main

import (
	"fmt"
	"rummikub/comb"
	"rummikub/game"
	"rummikub/table"
	"rummikub/tile"
)

func test3() {
	testSplitCombination()
}

func testSplitCombination() {
	type TileI = comb.TileI
	type PlayerI = game.PlayerI

	// 1️⃣ Criar jogo com 2 jogadores
	g := game.NewGame([]PlayerI{}, 1)
	alice, _ := g.Join("Alice")

	_ = g.Start()

	// Forçar turno para Alice
	fmt.Println("Current turn:", g.GetCurrentTurn())

	// 2️⃣ Criar combinação manual: [R3 R4 R5 R6]
	t0, _ := tile.NewTile(tile.Red, 2, false)
	t1, _ := tile.NewTile(tile.Red, 3, false)
	t2, _ := tile.NewTile(tile.Red, 4, false)
	t3, _ := tile.NewTile(tile.Red, 5, false)
	t4, _ := tile.NewTile(tile.Red, 6, false)
	t5, _ := tile.NewTile(tile.Red, 7, false)

	tiles := []TileI{t0, t1, t2, t3, t4, t5}
	originalComb, err := comb.NewComb(&tiles)
	if err != nil {
		panic(err)
	}

	// 3️⃣ Colocar a combinação na mesa
	tbl := g.GetTable()
	if err := tbl.Play(originalComb); err != nil {
		panic(err)
	}

	fmt.Println("\n== Table BEFORE split ==")
	fmt.Println(table.ToString(tbl))

	// 4️⃣ Dar tiles extra à Alice
	extraL, _ := tile.NewTile(tile.Red, 1, false) // para left
	extraR, _ := tile.NewTile(tile.Red, 8, false) // para right

	alice.AddTiles([]TileI{extraL, extraR})

	fmt.Println("Alice tiles before split:")
	printTiles(alice.GetTiles())

	// 5️⃣ Split no índice 2
	// Left:  R2 R3 R4  + R2
	// Right: R5 R6 R7 + R8
	err = g.SplitCombination(
		alice,
		originalComb,
		3,
		[]TileI{extraL},
		[]TileI{extraR},
	)

	if err != nil {
		fmt.Println("❌ Split failed:", err)
		return
	}

	// 6️⃣ Estado final
	fmt.Println("\n== Table AFTER split ==")
	fmt.Println(table.ToString(tbl))

	fmt.Println("\nAlice tiles after split:")
	printTiles(alice.GetTiles())
}

func printTiles(tiles []comb.TileI) {
	if len(tiles) == 0 {
		fmt.Print("No tiles")
		return
	}
	for _, t := range tiles {
		fmt.Printf("%s ", tile.ToString(t))
	}
	fmt.Println()
}