package table

import (
	"fmt"
	"rummikub/comb"
	"rummikub/tile"
	"rummikub/utils"
)

type TileI = tile.TileI
type CombI = comb.CombI

type TableI interface {
	Reset()
	Play(combination CombI) error
	PlayTilesIntoAComb(tiles []TileI, combination CombI) error
	ChangeTileBetweenCombs(tile TileI, fromComb CombI, toComb CombI) error
	FirstPlay(combs []CombI) error
	GrabOneTile() (TileI, error)
	GetCombs() []CombI
	GetCombByID(id string) (CombI, error)
	GetTilesByIDs(ids []string) ([]TileI, error)
	RemoveComb(combination CombI) error
	IsPileEmpty() bool
	AddTilesToPile(tiles []TileI)
	ExistsComb(combination CombI) (bool, int)
}

type Table struct {
	allCombs []CombI
	pile     []TileI
}

func NewTable(pile []TileI) TableI {
	return &Table{
		allCombs: []CombI{},
		pile:     pile,
	}
}

func (t *Table) Reset() {
	t.allCombs = []CombI{}
	t.pile = []TileI{}
}

func (t *Table) Play(combination CombI) error {
	t.allCombs = append(t.allCombs, combination)
	return nil
}

func (t *Table) PlayTilesIntoAComb(tiles []TileI, combination CombI) error {
	exists, i := t.ExistsComb(combination)
	if !exists || combination == nil || len(tiles) == 0 {
		return fmt.Errorf("a combinação não existe na mesa")
	}

	newTiles := append(combination.GetTiles(), tiles...)
	newComb, err := comb.NewComb(&newTiles)
	if err != nil {
		return fmt.Errorf("não foi possível formar nova combinação: %w", err)
	}

	// substituir a combinação antiga pela nova
	t.allCombs[i] = newComb
	return nil
}

func (t *Table) ChangeTileBetweenCombs(tile TileI, fromComb CombI, toComb CombI) error {
	// Verificar se as combinações existem na mesa
	fromExists, fromIndex := t.ExistsComb(fromComb)
	toExists, toIndex := t.ExistsComb(toComb)
	if !fromExists || !toExists {
		return fmt.Errorf("uma ou ambas as combinações não existem na mesa")
	}

	// Remover tiles da combinação de origem
	fromTiles := fromComb.GetTiles()
	remainingFromTiles, _ := utils.RemoveFromSlice(fromTiles, tile)
	newFromComb, err := comb.NewComb(&remainingFromTiles)
	if err != nil {
		return fmt.Errorf("não foi possível formar nova combinação de origem: %w", err)
	}
	t.allCombs[fromIndex] = newFromComb

	// Adicionar tile à combinação de destino
	toTiles := toComb.GetTiles()
	newToTiles := append(toTiles, tile)
	newToComb, err := comb.NewComb(&newToTiles)
	if err != nil {
		return fmt.Errorf("não foi possível formar nova combinação de destino: %w", err)
	}
	t.allCombs[toIndex] = newToComb

	return nil
}

func (t *Table) FirstPlay(combs []CombI) error {
	oneSeq := false
	totalValue := 0

	for _, c := range combs {
		if c == nil {
			return fmt.Errorf("Não é possível jogar uma combinação nula")
		}
		if c.IsSeq() {
			oneSeq = true
		}
		totalValue += c.GetTotalValue()
	}
	if oneSeq && totalValue >= 30 {
		// Primeira jogada válida
		return nil
	}
	return fmt.Errorf("A primeira jogada deve incluir pelo menos uma sequência e um valor total de pelo menos 30")
}

func (t *Table) GrabOneTile() (TileI, error) {
	if len(t.pile) == 0 {
		return nil, fmt.Errorf("Não há mais peças na pilha")
	}

	tile, newPile := utils.TakeOneRandom(t.pile)
	t.pile = newPile
	return tile, nil
}

func (t *Table) GetCombs() []CombI {
	return t.allCombs
}

func (t *Table) GetCombByID(id string) (CombI, error) {
	for _, comb := range t.allCombs {
		if comb.GetID() == id {
			return comb, nil
		}
	}
	return nil, fmt.Errorf("Combinação com o ID %s não encontrada na mesa", id)
}

func (t *Table) GetTilesByIDs(ids []string) ([]TileI, error) {
	var tiles []TileI
	for _, id := range ids {
		found := false
		for _, comb := range t.allCombs {
			for _, tile := range comb.GetTiles() {
				if tile.GetID() == id {
					tiles = append(tiles, tile)
					found = true
					break
				}
			}
			if found {
				break
			}
		}
		if !found {
			return nil, fmt.Errorf("Peça com o ID %s não encontrada na mesa", id)
		}
	}
	return tiles, nil
}

func (t *Table) RemoveComb(combination CombI) error {
	exists, index := t.ExistsComb(combination)
	if !exists {
		return fmt.Errorf("A combinação não existe na mesa")
	}
	t.allCombs = append(t.allCombs[:index], t.allCombs[index+1:]...)
	return nil
}

func (t *Table) IsPileEmpty() bool {
	return len(t.pile) == 0
}

func (t *Table) AddTilesToPile(tiles []TileI) {
	t.pile = append(t.pile, tiles...)
}

func (tbl *Table) ExistsComb(combination CombI) (bool, int) {
	for i, c := range tbl.allCombs {
		if c.Equals(combination) {
			return true, i
		}
	}
	return false, -1
}

func ToString(t TableI) string {
	if len(t.GetCombs()) == 0 {
		return "Table is empty."
	}
	result := "Table Content:\n"
	for i, c := range t.GetCombs() {
		result += fmt.Sprintf("%d: %s\n", i+1, comb.ToString(c))
	}
	return result
}
