package game

import (
	"fmt"
	"rummikub/comb"
	"rummikub/player"
	"rummikub/table"
	"rummikub/tile"
	"rummikub/utils"
	"sync"
)

const DEFAULT_N_TILES_FOR_PLAYER = 14
const DEFAULT_N_JOKERS = 2
const DEFAULT_N_TILES = 106

type TileI = comb.TileI
type Color = tile.Color
type CombI = comb.CombI
type TableI = table.TableI
type PlayerI = player.PlayerI

type GameI interface {
	GetTable() TableI
	IsPileEmpty() bool
	Join(name string) (PlayerI, error)
	GetPlayers() []PlayerI
	GetPlayerByName(name string) (PlayerI, error)
	RemovePlayer(player PlayerI) error
	GetMaxPlayers() int
	GetTilesByIDs(ids []string) ([]TileI, error)
	Configure(maxPlayers int, args ...int) error
	Start(args ...int) error
	IsStarted() bool
	IsFinished() bool
	GetCurrentTurn() string
	PlayTurn(player PlayerI, tiles []TileI, tblComb []TileI) error
	GrabOneTile(player PlayerI) (TileI, error)
	SplitCombination(p PlayerI, combToSplit CombI, index int, addedLeft, addedRight []TileI) error
	SkipTurn(player PlayerI) error
	Reset(maxPlayers int)
}

type Game struct {
	table       TableI
	players     []PlayerI
	started     bool
	finished    bool
	maxPlayers  int
	currentTurn int
	startArgs   []int
	configured  bool
	lock        *sync.Mutex
}

func NewGame(players []PlayerI, maxPlayers int) GameI {
	return &Game{
		table:       table.NewTable([]TileI{}),
		players:     players,
		maxPlayers:  maxPlayers,
		started:     false,
		finished:    false,
		currentTurn: 0,
		startArgs:   []int{},
		configured:  false,
		lock:        &sync.Mutex{},
	}
}

func (g *Game) GetTable() TableI {
	return g.table
}

func (g *Game) IsPileEmpty() bool {
	return g.table.IsPileEmpty()
}

func (g *Game) Join(name string) (PlayerI, error) {
	g.lock.Lock()
	defer g.lock.Unlock()

	if g.started {
		return nil, fmt.Errorf("não é possível entrar num jogo que já começou")
	}

	newPlayer := player.NewPlayer(name)
	g.players = append(g.players, newPlayer)

	fmt.Println(name, "joined:", len(g.players), "/", g.maxPlayers)

	if len(g.players) == g.maxPlayers {
		g.started = true
		g.Start()
	}

	return newPlayer, nil
}

func (g *Game) GetPlayers() []PlayerI {
	return g.players
}

func (g *Game) GetPlayerByName(name string) (PlayerI, error) {
	for _, p := range g.players {
		if p.GetName() == name {
			return p, nil
		}
	}
	return nil, fmt.Errorf("Jogador não encontrado")
}

func (g *Game) RemovePlayer(player PlayerI) error {
	if g == nil || player == nil {
		return fmt.Errorf("O jogo ou jogador não existe")
	}

	g.lock.Lock()
	defer g.lock.Unlock()

	g.GetTable().AddTilesToPile(player.GetTiles())
	player.AddTiles([]TileI{})

	// If the player leaving is the current turn, move to the next turn
	if len(g.players) > 0 && g.players[g.currentTurn] == player {
		g.nextTurn(player)
	}

	var ok bool
	g.players, ok = utils.RemoveFromSlice(g.players, player)

	if !ok {
		return fmt.Errorf("Jogador não encontrado no jogo")
	}
	return nil
}

func (g *Game) GetMaxPlayers() int {
	return g.maxPlayers
}

func (g *Game) GetTilesByIDs(ids []string) ([]TileI, error) {
	return g.table.GetTilesByIDs(ids)
}

// Optional args: use Configure(nPlayers, nTilesForPlayer, nJokers, nTiles)
func (g *Game) Configure(maxPlayers int, args ...int) error {
	g.lock.Lock()
	defer g.lock.Unlock()

	if g.configured {
		return fmt.Errorf("O jogo já está configurado")
	}
	g.maxPlayers = maxPlayers
	g.startArgs = args
	g.configured = true
	return nil
}

// Optional args: use Start(nTiles, nJokers, nTilesForPlayer)
func (g *Game) Start(args ...int) error {
	nTiles := DEFAULT_N_TILES
	nJokers := DEFAULT_N_JOKERS
	nTilesForPlayer := DEFAULT_N_TILES_FOR_PLAYER

	if g.startArgs != nil {
		if len(g.startArgs) > 0 {
			nTiles = g.startArgs[0]
		}
		if len(g.startArgs) > 1 {
			nJokers = g.startArgs[1]
		}
		if len(g.startArgs) > 2 {
			nTilesForPlayer = g.startArgs[2]
		}
	}

	// Generate all tiles
	allTiles := generateTiles(nTiles, nJokers)

	// Shuffle tiles
	utils.ShuffleSlice(allTiles)

	// Distribute tiles to players
	if nTiles/nTilesForPlayer < len(g.players) {
		return fmt.Errorf("Não há peças suficientes para distribuir por todos os jogadores")
	}
	for i, j := 0, 0; i < len(allTiles) && j < len(g.players); i, j = i+nTilesForPlayer, j+1 {
		hand := []TileI{}
		hand = utils.CopyFromSliceIdx(allTiles, hand, i, i+nTilesForPlayer)
		g.players[j].AddTiles(hand)
	}

	// Remaining tiles go to the table pile
	remainingTiles := []TileI{}
	remainingTiles = utils.CopyFromSliceIdx(allTiles, remainingTiles, nTilesForPlayer*len(g.players), len(allTiles))
	g.table.AddTilesToPile(remainingTiles)

	return nil
}

func (g *Game) IsStarted() bool {
	return g.started
}

func (g *Game) IsFinished() bool {
	return g.finished
}

func generateTiles(nTiles, nJokers int) []TileI {
	tiles := []TileI{}
	colors := []Color{tile.Red, tile.Blue, tile.Black, tile.Yellow}

	nTilesPerColor := (nTiles - nJokers) / len(colors)
	for _, color := range colors {
		for i := 1; i <= nTilesPerColor/2; i++ {
			t1, _ := tile.NewTile(color, i, false)
			t2, _ := tile.NewTile(color, i, false)
			tiles = append(tiles, t1, t2)
		}
	}

	for j := 0; j < nJokers; j++ {
		joker, _ := tile.NewTile(tile.Black, 0, true)
		tiles = append(tiles, joker)
	}

	return tiles
}

func (g *Game) GetCurrentTurn() string {
	g.lock.Lock()
	defer g.lock.Unlock()
	if len(g.players) == 0 {
		return ""
	}
	return g.players[g.currentTurn].GetName()
}

func (g *Game) PlayTurn(p PlayerI, tiles []TileI, tblTiles []TileI) error {
	if g.players[g.currentTurn] != p {
		return fmt.Errorf("Não é a sua vez!")
	}
	tblComb, _ := comb.NewComb(&tblTiles)

	err := p.Play(tiles, g.table, tblComb)
	if err != nil {
		return err
	}

	if p.Finished() && !g.finished {
		g.finished = true
		fmt.Println("Player", p.GetName(), "has won the game!")
		return nil
	}

	return nil
}

func (g *Game) GrabOneTile(p PlayerI) (TileI, error) {
	if g.players[g.currentTurn] != p {
		return nil, fmt.Errorf("Não é a sua vez!")
	}

	tile, err := p.GrabOneTile(g.table)
	if err != nil {
		return nil, err
	}

	g.nextTurn(p)
	return tile, nil
}

func (g *Game) SplitCombination(
	p PlayerI,
	combToSplit CombI,
	index int,
	addedLeft, addedRight []TileI,
) error {

	if g.players[g.currentTurn] != p {
		return fmt.Errorf("não é a sua vez")
	}

	original := combToSplit.GetTiles()

	if index <= 0 || index >= len(original) {
		return fmt.Errorf("índice de divisão inválido")
	}

	// Criar slices novos (não usar os originais!)
	leftTiles := append([]TileI{}, original[:index]...)
	rightTiles := append([]TileI{}, original[index:]...)

	// Adicionar tiles vindos da mão do jogador
	leftTiles = append(leftTiles, addedLeft...)
	rightTiles = append(rightTiles, addedRight...)

	// Criar novas combinações já completas
	leftComb, err := comb.NewComb(&leftTiles)
	if err != nil {
		return fmt.Errorf("combinação à esquerda inválida: %w", err)
	}

	rightComb, err := comb.NewComb(&rightTiles)
	if err != nil {
		return fmt.Errorf("combinação à direita inválida: %w", err)
	}

	// Remover tiles da mão do jogador
	if err := p.RemoveTiles(append(addedLeft, addedRight...)); err != nil {
		return fmt.Errorf("o jogador não possui as peças adicionadas")
	}

	// Atualizar mesa (operação atómica)
	if err := g.table.RemoveComb(combToSplit); err != nil {
		return fmt.Errorf("falha ao remover a combinação original: %w", err)
	}

	if err := g.table.Play(leftComb); err != nil {
		return err
	}

	if err := g.table.Play(rightComb); err != nil {
		return err
	}

	return nil
}

func (g *Game) SkipTurn(p PlayerI) error {
	if g.players[g.currentTurn] != p {
		return fmt.Errorf("Não é a sua vez!")
	}
	g.nextTurn(p)
	return nil
}

func (g *Game) nextTurn(p PlayerI) {
	g.currentTurn = (g.currentTurn + 1) % len(g.players)
	p.SetPlayedThisTurn(false)
}

func (g *Game) Reset(maxPlayers int) {
	g.lock.Lock()
	defer g.lock.Unlock()

	g.table = table.NewTable([]TileI{})
	g.players = []PlayerI{}
	g.started = false
	g.finished = false
	g.currentTurn = 0
	g.maxPlayers = maxPlayers
	g.configured = false
	g.startArgs = []int{}
}
