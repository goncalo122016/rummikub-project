package utils

import (
	"math/rand"
)

func RemoveFromSlice[T comparable](slice []T, target T) ([]T, bool) {
	for i, v := range slice {
		if v == target {
			return append(slice[:i], slice[i+1:]...), true
		}
	}
	return slice, false
}

func ShuffleSlice[T any](slice []T) []T {
	n := len(slice)
	for i := n - 1; i > 0; i-- {
		j := rand.Intn(i + 1)
		slice[i], slice[j] = slice[j], slice[i]
	}
	return slice
}

func TakeOneRandom[T comparable](slice []T) (T, []T) {
	n := len(slice)
	if n == 0 {
		var zero T
		return zero, slice
	}

	idx := rand.Intn(n)
	chosen := slice[idx]

	// Remove chosen element from slice
	newSlice, _ := RemoveFromSlice(slice, chosen)
	return chosen, newSlice
}

func CopyFromSliceIdx[T comparable](src, dst []T, from, to int) []T {
	for i := from; i < to && i < len(src); i++ {
		dst = append(dst, src[i])
	}
	return dst
}