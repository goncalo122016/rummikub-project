package tile

type Color string

const (
	Red    Color = "red"
	Blue   Color = "blue"
	Yellow Color = "yellow"
	Black  Color = "black"
)

const Reset = "\033[0m"

func (c Color) ANSI() string {
	switch c {
	case Red:
		return "\033[31m" // Red
	case Blue:
		return "\033[34m" // Blue
	case Yellow:
		return "\033[33m" // Yellow
	case Black:
		return "\033[90m" // Bright black / gray (more visible)
	default:
		return Reset
	}
}
