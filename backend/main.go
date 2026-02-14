package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"rummikub/api"
)

func main() {
	fmt.Println("Starting Rummikub Game Server...")

	http.HandleFunc("/ws", api.WSHandler)

	// Render define a porta via variável de ambiente
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // fallback para desenvolvimento local
	}

	fmt.Println("Server running on port :", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}