package player

import (
	"fmt"
	"rummikub/comb"
	"rummikub/table"
	"rummikub/tile"
	"rummikub/utils"
)

type TileI = tile.TileI
type CombI = comb.CombI
type TableI = table.TableI

type PlayerI interface {
	Play(tiles []TileI, tbl TableI, tblComb CombI) error
	PlayTilesIntoAComb(tiles []TileI, tbl TableI, combination CombI) error
	GrabOneTile(tbl TableI) (TileI, error)
	GetTiles() []TileI
	GetTileByID(id string) (TileI, error)
	AddTiles(tiles []TileI)
	RemoveTiles(tiles []TileI) error
	SetPlayedThisTurn(played bool)
	ClearFirstPlayBuffer()
	GetName() string
	Finished() bool
}

type Player struct {
	Name           string  `json:"name"`
	Tiles          []TileI `json:"tiles"`
	FirstPlayDone  bool    `json:"first_play_done"`
	FirstPlayBuf   []CombI `json:"first_play_buf"`
	PlayedThisTurn bool    `json:"played_this_turn"`
}

func NewPlayer(name string) PlayerI {
	return &Player{
		Name:           name,
		Tiles:          []TileI{},
		FirstPlayDone:  false,
		FirstPlayBuf:   []CombI{},
		PlayedThisTurn: false,
	}
}

func (p *Player) GetName() string {
	return p.Name
}

func (p *Player) GetTiles() []TileI {
	return p.Tiles
}

func (p *Player) GetTileByID(id string) (TileI, error) {
	for _, t := range p.Tiles {
		if t.GetID() == id {
			return t, nil
		}
	}
	return nil, fmt.Errorf("Peça com o ID %s não encontrada nas peças do jogador", id)
}

func (p *Player) AddTiles(tiles []TileI) {
	p.Tiles = append(p.Tiles, tiles...)
}

func (p *Player) RemoveTiles(tiles []TileI) error {
	for _, t := range tiles {
		var ok bool
		p.Tiles, ok = utils.RemoveFromSlice(p.Tiles, t)
		if !ok {
			return fmt.Errorf("Peça não encontrada nas peças do jogador")
		}
	}
	return nil
}

func (p *Player) Play(tiles []TileI, tbl TableI, tblComb CombI) error {
	p.PlayedThisTurn = true

	if tblComb != nil {
		// If a tile is if from a combination on the table, it means the player wants to add tiles to that combination
		isInTable := false
		var fromComb CombI = nil
		t := tiles[0]
		for _, c := range tbl.GetCombs() {
			if c.Exists(t) {
				isInTable = true
				fromComb = c
				break
			}
		}
		if isInTable {
			return tbl.ChangeTileBetweenCombs(t, fromComb, tblComb)
		} else {
			// Ao jogar tiles numa combinação existente apenas verifica a validez de tiles + tableComb
			return p.PlayTilesIntoAComb(tiles, tbl, tblComb)
		}
	}

	combination, err := comb.NewComb(&tiles)
	if err != nil {
		return err
	}

	// PRIMEIRA JOGADA
	if !p.FirstPlayDone {

		// impedir combinações repetidas
		for _, c := range p.FirstPlayBuf {
			if c.Equals(combination) {
				return fmt.Errorf("combinação já adicionada à primeira jogada")
			}
		}

		p.FirstPlayBuf = append(p.FirstPlayBuf, combination)

		// tentar validar TODAS juntas
		if err := tbl.FirstPlay(p.FirstPlayBuf); err != nil {
			return fmt.Errorf("primeira jogada ainda não é válida: %w", err)
		}

		// remover tiles da mão
		for _, comb := range p.FirstPlayBuf {
			if err := p.RemoveTiles(comb.GetTiles()); err != nil {
				return fmt.Errorf("não foi possível remover peças da mão: %w", err)
			}
		}

		// jogar TODAS as combinações na mesa
		for _, comb := range p.FirstPlayBuf {
			if err := tbl.Play(comb); err != nil {
				return fmt.Errorf("falha ao jogar a combinação na mesa: %w", err)
			}
		}

		// estado final
		p.FirstPlayDone = true
		p.FirstPlayBuf = nil

		return nil
	}

	// JOGADAS NORMAIS
	if err := p.RemoveTiles(combination.GetTiles()); err != nil {
		return fmt.Errorf("não foi possível jogar a combinação: %w", err)
	}

	return tbl.Play(combination)
}

func (p *Player) SetPlayedThisTurn(played bool) {
	p.PlayedThisTurn = played
}

func (p *Player) ClearFirstPlayBuffer() {
	p.FirstPlayBuf = nil
}

func (p *Player) PlayTilesIntoAComb(tiles []TileI, tbl TableI, combination CombI) error {
	err := tbl.PlayTilesIntoAComb(tiles, combination)
	if err != nil {
		return err
	}

	if err := p.RemoveTiles(tiles); err != nil {
		return fmt.Errorf("não foi possível remover peças da mão do jogador: %w", err)
	}

	return nil
}

func (p *Player) GrabOneTile(tbl TableI) (TileI, error) {
	if p.PlayedThisTurn {
		return nil, fmt.Errorf("não pode tirar uma peça depois de jogar no mesmo turno")
	}
	tile, err := tbl.GrabOneTile()
	if err != nil {
		return nil, err
	}
	p.AddTiles([]TileI{tile})
	return tile, nil
}

func (p *Player) Finished() bool {
	return len(p.Tiles) == 0
}
