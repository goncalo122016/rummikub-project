package tile

import (
	"fmt"

	"github.com/google/uuid"
)

type TileI interface {
	GetID() string
	GetNumber() int
	GetColor() Color
	IsJoker() bool
}

const JOKER_NUMBER = -1

type Tile struct {
	ID     string `json:"id"`
	Number int    `json:"number"`
	Color  Color  `json:"color"`
	Joker  bool   `json:"joker"`
}

func NewTile(color Color, number int, joker bool) (TileI, error) {
	if joker {
		return &Tile{
			ID:     uuid.NewString(),
			Number: JOKER_NUMBER,
			Color:  color,
			Joker:  true,
		}, nil
	}

	if number < 1 || number > 13 {
		return nil, fmt.Errorf("Número de peça inválido: %d", number)
	}

	return &Tile{
		ID:     uuid.NewString(),
		Number: number,
		Color:  color,
		Joker:  false,
	}, nil
}

func (t *Tile) GetID() string {
	return t.ID
}

func (t *Tile) GetColor() Color {
	return t.Color
}

func (t *Tile) GetNumber() int {
	return t.Number
}

func (t *Tile) IsJoker() bool {
	return t.Joker
}

func ToString(t TileI) string {
	if t.IsJoker() {
		return "\033[35m[ J]" + Reset
	}

	c := t.GetColor()
	return fmt.Sprintf(
		"%s[%2d]%s",
		c.ANSI(),
		t.GetNumber(),
		Reset,
	)
}
