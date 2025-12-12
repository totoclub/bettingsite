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
	"gorm.io/gorm"
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

	// Start level update poller
	StartLevelUpdatePoller()
}

// StartLevelUpdatePoller polls every 5 seconds to update user levels based on wager
func StartLevelUpdatePoller() {
	ticker := time.NewTicker(5 * time.Second)
	go func() {
		for range ticker.C {
			updateUserLevels()
		}
	}()
	log.Println("✅ Level update poller started (runs every 5 seconds)")
}

// updateUserLevels updates user levels based on their wager values
func updateUserLevels() {
	// Get all levels ordered by nextLevelTargetValue ascending
	var levels []models.Level
	if err := initializers.DB.Order("next_level_target_value ASC").Find(&levels).Error; err != nil {
		log.Printf("⚠️ Failed to fetch levels: %v", err)
		return
	}

	if len(levels) == 0 {
		log.Println("⚠️ No levels found in database")
		return
	}

	// Get admin user for inbox messages (use first admin user found)
	var adminUser models.User
	if err := initializers.DB.Where("role = ? OR userid = ?", "A", "admin").First(&adminUser).Error; err != nil {
		log.Printf("⚠️ Failed to find admin user: %v", err)
		// Continue without admin user, but log warning
	}

	// Get all profiles with wager
	var profiles []models.Profile
	if err := initializers.DB.Preload("User").Find(&profiles).Error; err != nil {
		log.Printf("⚠️ Failed to fetch profiles: %v", err)
		return
	}

	updatedCount := 0
	inboxCount := 0

	for _, profile := range profiles {
		// Skip if user doesn't exist
		if profile.UserID == 0 {
			continue
		}

		currentWager := profile.Wager
		currentLevel := int32(profile.Level)

		// Find the highest level where wager <= nextLevelTargetValue
		// Example: wager = 0, level 1 = 15000 -> level 1 (0 <= 15000)
		// Example: wager = 30000, level 1 = 15000, level 2 = 20000, level 3 = 30000 -> level 3 (30000 <= 30000)
		var newLevel int32 = 1 // Default to level 1
		var levelName string = "Level 1"

		// Iterate through levels to find the highest level where wager <= nextLevelTargetValue
		for i := len(levels) - 1; i >= 0; i-- {
			if currentWager <= levels[i].NextLevelTargetValue {
				newLevel = int32(levels[i].LevelNumber)
				levelName = levels[i].Name
				break
			}
		}

		// If wager is 0 or less than first level, set to level 1
		if currentWager < levels[0].NextLevelTargetValue {
			newLevel = int32(levels[0].LevelNumber)
			levelName = levels[0].Name
		}

		// Update level if it changed
		if newLevel != currentLevel {
			// Update profile level
			if err := initializers.DB.Model(&profile).Update("level", newLevel).Error; err != nil {
				log.Printf("⚠️ Failed to update level for user %d: %v", profile.UserID, err)
				continue
			}

			updatedCount++

			// Create inbox message if admin user exists
			if adminUser.ID > 0 {
				inbox := models.Inbox{
					UserID:      profile.UserID,
					FromID:      adminUser.ID,
					Type:        "level_upgrade",
					Title:       "Level Upgrade",
					Description: fmt.Sprintf("You have reached level %d. Congratulations!", newLevel),
					Status:      true,
					OrderNum:    1,
				}

				if err := initializers.DB.Create(&inbox).Error; err != nil {
					log.Printf("⚠️ Failed to create inbox for user %d: %v", profile.UserID, err)
				} else {
					inboxCount++
					log.Printf("✅ User %d upgraded from Level %d to Level %d (%s)", profile.UserID, currentLevel, newLevel, levelName)
				}
			}
		}
	}

	if updatedCount > 0 {
		log.Printf("📊 Level update completed: %d users updated, %d inbox messages sent", updatedCount, inboxCount)
	}
}
