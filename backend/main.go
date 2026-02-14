package main

import (
	"net/http"
	"os"
	"rummikub/api"
)

func main() {

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// WebSocket
	http.HandleFunc("/ws", api.WSHandler)

	// Servir frontend
	fs := http.FileServer(http.Dir("./dist"))
	http.Handle("/", fs)

	http.ListenAndServe(":"+port, nil)
}
