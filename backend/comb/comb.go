package comb

import (
	"fmt"
	"rummikub/tile"
	"sort"

	"github.com/google/uuid"
)

type TileI = tile.TileI
type Color = tile.Color

type CombI interface {
	Validate() bool
	GetTiles() []TileI
	GetID() string
	GetTotalValue() int
	IsSeq() bool
	IsSet() bool
	Exists(tile TileI) bool
	Equals(other CombI) bool
}

type Comb struct {
	Id    string  `json:"id"`
	Tiles []TileI `json:"tiles"`
	Seq   bool    `json:"is_seq"`
	Set   bool    `json:"is_set"`
}

func NewComb(tiles *[]TileI) (CombI, error) {
	comb := &Comb{
		Id:    uuid.NewString(),
		Tiles: *tiles,
	}

	if len(comb.Tiles) < 3 {
		return nil, fmt.Errorf("Uma combinação deve ter pelo menos 3 peças!")
	}

	if nJokers(comb.Tiles) == len(comb.Tiles) {
		comb.Seq = true
		comb.Set = true
		return comb, nil
	}

	comb.Seq = validateSeq(comb.Tiles)
	comb.Set = validateSet(comb.Tiles)

	if comb.Seq {
		comb.Tiles = normalizeSeq(comb.Tiles)
		return comb, nil
	}

	if comb.Seq || comb.Set {
		return comb, nil
	}

	return nil, fmt.Errorf("Uma combinação deve ser uma sequência válida ou um conjunto válido!")
}

func (c *Comb) IsSeq() bool {
	return c.Seq
}

func (c *Comb) IsSet() bool {
	return c.Set
}

func (c *Comb) Validate() bool {
	if len(c.Tiles) < 3 {
		return false
	}
	if nJokers(c.Tiles) == len(c.Tiles) {
		return true
	}
	return validateSeq(c.Tiles) || validateSet(c.Tiles)
}

func SortByNumber(tiles []TileI) []TileI {
	sort.Slice(tiles, func(i, j int) bool {
		return tiles[i].GetNumber() < tiles[j].GetNumber()
	})
	return tiles
}

func nJokers(tiles []TileI) int {
	if len(tiles) == 0 {
		return 0
	}
	counter := 0
	for _, t := range tiles {
		if t.IsJoker() {
			counter++
		}
	}
	return counter
}

func validateSeq(tiles []TileI) bool {
	tiles = SortByNumber(tiles)
	nJokers := nJokers(tiles)
	baseColor := tiles[nJokers].GetColor()

	for i := 1 + nJokers; i < len(tiles); i++ {
		t1 := tiles[i-1]
		t2 := tiles[i]
		if (t1.GetColor() != baseColor) || (t2.GetColor() != baseColor) {
			return false
		}

		diff := t2.GetNumber() - t1.GetNumber()
		if diff > 1 {
			if nJokers >= diff-1 {
				nJokers -= diff - 1
			} else {
				return false
			}
		}
	}

	return true
}

func validateSet(tiles []TileI) bool {
	tiles = SortByNumber(tiles)
	nJokers := nJokers(tiles)
	colorsSeen := make(map[Color]bool)
	var baseNumber int = tiles[nJokers].GetNumber()

	for i := nJokers; i < len(tiles); i++ {
		if tiles[i].GetNumber() != baseNumber {
			return false
		}
		if colorsSeen[tiles[i].GetColor()] {
			return false
		}
		colorsSeen[tiles[i].GetColor()] = true
	}
	return true
}

func (c *Comb) GetTiles() []TileI {
	return c.Tiles
}

func (c *Comb) GetID() string {
	return c.Id
}

func (c *Comb) GetTotalValue() int {
	total := 0
	for _, t := range c.Tiles {
		if t.IsJoker() {
			total += 30
		} else {
			total += t.GetNumber()
		}
	}
	return total
}

func (c *Comb) Equals(other CombI) bool {
	if other == nil {
		return false
	}
	tiles1 := c.GetTiles()
	tiles2 := other.GetTiles()

	if len(tiles1) != len(tiles2) {
		return false
	}

	counts := make(map[string]int)
	for _, t := range tiles1 {
		counts[t.GetID()]++
	}
	for _, t := range tiles2 {
		counts[t.GetID()]--
		if counts[t.GetID()] < 0 {
			return false
		}
	}
	return true
}

func ToString(c CombI) string {
	str := ""
	for _, t := range c.GetTiles() {
		str += tile.ToString(t) + " "
	}
	return str
}

func (c *Comb) Exists(tile TileI) bool {
	for _, t := range c.Tiles {
		if t.GetID() == tile.GetID() {
			return true
		}
	}
	return false
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

func normalizeSeq(tiles []TileI) []TileI {
	var jokers []TileI
	var normals []TileI

	for _, t := range tiles {
		if t.IsJoker() {
			jokers = append(jokers, t)
		} else {
			normals = append(normals, t)
		}
	}

	// ordenar normais
	sort.Slice(normals, func(i, j int) bool {
		return normals[i].GetNumber() < normals[j].GetNumber()
	})

	var result []TileI
	usedJokers := 0

	// construir sequência com jokers a tapar buracos
	for i := 0; i < len(normals)-1; i++ {
		result = append(result, normals[i])

		diff := normals[i+1].GetNumber() - normals[i].GetNumber()
		for diff > 1 && usedJokers < len(jokers) {
			result = append(result, jokers[usedJokers])
			usedJokers++
			diff--
		}
	}

	// último tile normal
	result = append(result, normals[len(normals)-1])

	// jokers NÃO usados → vão para o INÍCIO
	if usedJokers < len(jokers) {
		remaining := jokers[usedJokers:]
		result = append(remaining, result...)
	}

	return result
}
