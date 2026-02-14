package main

import (
	"fmt"
	"rummikub/comb"
	"rummikub/table"
	"rummikub/tile"
)

func main() {
	type TileI = tile.TileI
	type CombI = comb.CombI
	type TableI = table.TableI

	var c1, c2, c5 CombI
	fmt.Println("---- Sequence (3-4-5 Red) ----")
	{
		t1, _ := tile.NewTile(tile.Red, 3, false)
		t2, _ := tile.NewTile(tile.Red, 4, false)
		t3, _ := tile.NewTile(tile.Red, 5, false)

		tiles := []TileI{t1, t2, t3}
		c1 = testComb(tiles)
	}

	fmt.Println("\n---- Set (7 Red, Blue, Black) ----")
	{
		t1, _ := tile.NewTile(tile.Red, 7, false)
		t2, _ := tile.NewTile(tile.Blue, 7, false)
		t3, _ := tile.NewTile(tile.Black, 7, false)

		tiles := []TileI{t1, t2, t3}
		c2 = testComb(tiles)
	}

	fmt.Println("\n---- Sequence with Joker (3, J, 5 Red) ----")
	{
		t1, _ := tile.NewTile(tile.Red, 3, false)
		j, _ := tile.NewTile(tile.Red, 0, true)
		t3, _ := tile.NewTile(tile.Red, 5, false)

		tiles := []TileI{t1, j, t3}
		testComb(tiles)
	}

	fmt.Println("\n---- Set with Joker (9 Red, 9 Blue, J) ----")
	{
		t1, _ := tile.NewTile(tile.Red, 9, false)
		t2, _ := tile.NewTile(tile.Blue, 9, false)
		j, _ := tile.NewTile(tile.Black, 0, true)

		tiles := []TileI{t1, t2, j}
		testComb(tiles)
	}

	fmt.Println("\n---- Invalid combination ----")
	{
		t1, _ := tile.NewTile(tile.Red, 2, false)
		t2, _ := tile.NewTile(tile.Blue, 5, false)
		t3, _ := tile.NewTile(tile.Black, 9, false)

		tiles := []TileI{t1, t2, t3}
		c5 = testComb(tiles)
	}

	fmt.Println("\n---- All Jokers ----")
	{
		j1, _ := tile.NewTile(tile.Red, 0, true)
		j2, _ := tile.NewTile(tile.Blue, 0, true)
		j3, _ := tile.NewTile(tile.Black, 0, true)

		tiles := []TileI{j1, j2, j3}
		testComb(tiles)
	}

	tbl := table.NewTable([]TileI{})
	fmt.Println("\n---- Playing on Table ----")
	list := []CombI{}

	list = append(list, c1)
	list = append(list, c2)
	list = append(list, c5) // invalid
	err := tbl.FirstPlay(list)
	if err != nil {
		fmt.Println("First play failed as expected:", err)
	}

	fmt.Println("Table after first play:\n" + table.ToString(tbl))

	// Valid first play
	list = []CombI{}
	list = append(list, c1)
	list = append(list, c2)
	err = tbl.FirstPlay(list)
	if err != nil {
		fmt.Println("First play failed unexpectedly:", err)
	} else {
		fmt.Println("First play succeeded!")
	}

	fmt.Println("Table after second play:\n" + table.ToString(tbl))
}

type TileI = tile.TileI
type CombI = comb.CombI

func testComb(tiles []TileI) CombI {
	c, err := comb.NewComb(&tiles)
	if err != nil {
		fmt.Println("❌ Invalid combination:", err)
		return nil
	}

	for _, t := range tiles {
		fmt.Printf("%s ", tile.ToString(t))
	}
	fmt.Println()	

	fmt.Println("✅ Valid combination")
	fmt.Println("Is Sequence:", c.IsSeq())
	fmt.Println("Is Set     :", c.IsSet())
	fmt.Println("Total Value:", c.GetTotalValue())
	return c
}
