package fetcher

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"time"

	"github.com/hotbrainy/go-betting/backend/db/initializers"
	"github.com/hotbrainy/go-betting/backend/internal/kafka"
	"github.com/hotbrainy/go-betting/backend/internal/models"
)

type MatchOdds struct {
	MatchID string  `json:"matchId"`
	Odds    float64 `json:"odds"`
}

func StartPolling() {
	ticker := time.NewTicker(40 * time.Second)
	go func() {
		for range ticker.C {
			// Fake fetch logic

			var leagues []models.League
			initializers.DB.Find(&leagues)
			if len(leagues) > 0 {
				n := rand.Intn(len(leagues)) // rand.Intn(5) returns 0–4, so add 1
				fmt.Println("Random number between 1-5:", n)

				data, _ := json.Marshal(leagues[n])
				// data := MatchOdds{MatchID: "match123", Odds: 2.35}
				// msg, _ := json.Marshal(data)
				log.Println("Fetched odds:", len(data))
				kafka.PublishMessage(data)
			}
		}
	}()

	// Start HonorLink fetcher
	honorLinkFetcher := NewHonorLinkFetcher()
	honorLinkFetcher.StartPeriodicFetching()

	// Start EOS Powerball fetcher
	eosPowerballFetcher := NewEOS1MinPowerballFetcher()
	eosPowerballFetcher.StartPeriodicFetching()
}
