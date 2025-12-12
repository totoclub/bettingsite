package seeders

import (
	"fmt"
	"log"

	"github.com/hotbrainy/go-betting/backend/db/initializers"
	"github.com/hotbrainy/go-betting/backend/internal/models"
)

// UpdateNextLevelTargetValues updates NextLevelTargetValue for all existing levels
// This ensures existing levels get the default values even if they were created before this field existed
func UpdateNextLevelTargetValues() error {
	var levels []models.Level
	if err := initializers.DB.Order("level_number ASC").Find(&levels).Error; err != nil {
		return err
	}

	updatedCount := 0
	for _, level := range levels {
		expectedValue := calculateNextLevelTargetValue(level.LevelNumber)
		// Only update if the value is 0 (default) or significantly different (allowing for manual overrides)
		if level.NextLevelTargetValue == 0 || level.NextLevelTargetValue < 1000 {
			level.NextLevelTargetValue = expectedValue
			if err := initializers.DB.Model(&level).Update("next_level_target_value", expectedValue).Error; err != nil {
				log.Printf("⚠️ Failed to update NextLevelTargetValue for level %d: %v", level.LevelNumber, err)
				continue
			}
			updatedCount++
		}
	}

	if updatedCount > 0 {
		fmt.Printf("✅ Updated NextLevelTargetValue for %d levels\n", updatedCount)
	}
	return nil
}

// AutoSeedLevels checks if the levels table is empty and seeds it if needed
// This function should be called after database initialization
func AutoSeedLevels() {
	var count int64
	err := initializers.DB.Model(&models.Level{}).Count(&count).Error
	if err != nil {
		log.Printf("⚠️ Failed to check levels count: %v", err)
		return
	}

	if count == 0 {
		fmt.Println("🌱 Levels table is empty, seeding default levels...")
		err := SeedLevels()
		if err != nil {
			log.Printf("❌ Failed to seed levels: %v", err)
			return
		}
		fmt.Println("✅ Successfully seeded 15 default levels!")
		fmt.Println("📊 Created levels:")
		fmt.Println("   - 12 Regular levels (Level 1-12)")
		fmt.Println("   - 2 VIP levels (VIP 1-2)")
		fmt.Println("   - 1 Premium level")
	} else {
		fmt.Printf("ℹ️ Levels table already has %d records, skipping seeding\n", count)
		// Update NextLevelTargetValue for existing levels
		fmt.Println("🔄 Updating NextLevelTargetValue for existing levels...")
		if err := UpdateNextLevelTargetValues(); err != nil {
			log.Printf("⚠️ Failed to update NextLevelTargetValues: %v", err)
		}
	}
}
