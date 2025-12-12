package controllers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/hotbrainy/go-betting/backend/db/initializers"
	format_errors "github.com/hotbrainy/go-betting/backend/internal/format-errors"
	"github.com/hotbrainy/go-betting/backend/internal/helpers"
	"github.com/hotbrainy/go-betting/backend/internal/models"
	"github.com/hotbrainy/go-betting/backend/internal/validations"
)

// CreateMiniBetOption creates a new mini bet option
func CreateMiniBetOption(c *gin.Context) {
	var userInput struct {
		Name     string              `json:"name" binding:"required,min=2,max=100"`
		Odds     string              `json:"odds" binding:"required"`
		Type     string              `json:"type" binding:"required,oneof=single combination"`
		Ball     *string             `json:"ball,omitempty"`
		Text     *string             `json:"text,omitempty"`
		Balls    []models.BallOption `json:"balls,omitempty"`
		GameType string              `json:"gameType" binding:"required"`
		Category string              `json:"category" binding:"required,oneof=powerball normalball"`
		Level    int                 `json:"level" binding:"required,min=1,max=15"`
		Enabled  bool                `json:"enabled"`
		OrderNum int                 `json:"orderNum"`
	}

	if err := c.ShouldBindJSON(&userInput); err != nil {
		if errs, ok := err.(validator.ValidationErrors); ok {
			c.JSON(http.StatusUnprocessableEntity, gin.H{
				"validations": validations.FormatValidationErrors(errs),
			})
			return
		}

		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Validate type-specific fields
	if userInput.Type == "single" {
		if userInput.Ball == nil || userInput.Text == nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Ball and Text are required for single type bets",
			})
			return
		}
	} else if userInput.Type == "combination" {
		if len(userInput.Balls) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Balls are required for combination type bets",
			})
			return
		}
	}

	// Create the mini bet option
	miniBetOption := models.MiniBetOption{
		Name:     userInput.Name,
		Odds:     userInput.Odds,
		Type:     userInput.Type,
		Ball:     userInput.Ball,
		Text:     userInput.Text,
		Balls:    userInput.Balls,
		GameType: userInput.GameType,
		Category: userInput.Category,
		Level:    userInput.Level,
		Enabled:  userInput.Enabled,
		OrderNum: userInput.OrderNum,
	}

	result := initializers.DB.Create(&miniBetOption)

	if err := result.Error; err != nil {
		format_errors.InternalServerError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    miniBetOption,
		"message": "Mini bet option created successfully",
	})
}

// GetMiniBetOptions gets all mini bet options with optional filtering
func GetMiniBetOptions(c *gin.Context) {
	var miniBetOptions []models.MiniBetOption

	// Get query parameters for filtering
	gameType := c.Query("gameType")
	category := c.Query("category")
	levelStr := c.Query("level")
	enabledStr := c.Query("enabled")

	query := initializers.DB.Model(&models.MiniBetOption{})

	// Apply filters
	if gameType != "" {
		query = query.Where("game_type = ?", gameType)
	}
	if category != "" {
		query = query.Where("category = ?", category)
	}
	if levelStr != "" {
		if level, err := strconv.Atoi(levelStr); err == nil {
			query = query.Where("level = ?", level)
		}
	}
	if enabledStr != "" {
		if enabled, err := strconv.ParseBool(enabledStr); err == nil {
			query = query.Where("enabled = ?", enabled)
		}
	}

	// Order by order_num and created_at
	query = query.Order("order_num ASC, created_at ASC")

	result := query.Find(&miniBetOptions)

	if err := result.Error; err != nil {
		format_errors.InternalServerError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    miniBetOptions,
		"count":   len(miniBetOptions),
	})
}

// GetMiniBetOption gets a single mini bet option by ID
func GetMiniBetOption(c *gin.Context) {
	id := c.Param("id")
	var miniBetOption models.MiniBetOption

	result := initializers.DB.First(&miniBetOption, id)

	if err := result.Error; err != nil {
		format_errors.NotFound(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    miniBetOption,
	})
}

// UpdateMiniBetOption updates a mini bet option
func UpdateMiniBetOption(c *gin.Context) {
	id := c.Param("id")
	var miniBetOption models.MiniBetOption

	// Find the mini bet option
	result := initializers.DB.First(&miniBetOption, id)
	if err := result.Error; err != nil {
		format_errors.NotFound(c, err)
		return
	}

	// Get update data from request body
	var userInput struct {
		Name     string              `json:"name" binding:"required,min=2,max=100"`
		Odds     string              `json:"odds" binding:"required"`
		Type     string              `json:"type" binding:"required,oneof=single combination"`
		Ball     *string             `json:"ball,omitempty"`
		Text     *string             `json:"text,omitempty"`
		Balls    []models.BallOption `json:"balls,omitempty"`
		GameType string              `json:"gameType" binding:"required"`
		Category string              `json:"category" binding:"required,oneof=powerball normalball"`
		Level    int                 `json:"level" binding:"required,min=1,max=15"`
		Enabled  bool                `json:"enabled"`
		OrderNum int                 `json:"orderNum"`
	}

	if err := c.ShouldBindJSON(&userInput); err != nil {
		if errs, ok := err.(validator.ValidationErrors); ok {
			c.JSON(http.StatusUnprocessableEntity, gin.H{
				"validations": validations.FormatValidationErrors(errs),
			})
			return
		}

		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Validate type-specific fields
	if userInput.Type == "single" {
		if userInput.Ball == nil || userInput.Text == nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Ball and Text are required for single type bets",
			})
			return
		}
	} else if userInput.Type == "combination" {
		if len(userInput.Balls) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Balls are required for combination type bets",
			})
			return
		}
	}

	// Update the mini bet option
	miniBetOption.Name = userInput.Name
	miniBetOption.Odds = userInput.Odds
	miniBetOption.Type = userInput.Type
	miniBetOption.Ball = userInput.Ball
	miniBetOption.Text = userInput.Text
	miniBetOption.Balls = userInput.Balls
	miniBetOption.GameType = userInput.GameType
	miniBetOption.Category = userInput.Category
	miniBetOption.Level = userInput.Level
	miniBetOption.Enabled = userInput.Enabled
	miniBetOption.OrderNum = userInput.OrderNum

	result = initializers.DB.Save(&miniBetOption)

	if err := result.Error; err != nil {
		format_errors.InternalServerError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    miniBetOption,
		"message": "Mini bet option updated successfully",
	})
}

// DeleteMiniBetOption deletes a mini bet option (soft delete)
func DeleteMiniBetOption(c *gin.Context) {
	id := c.Param("id")
	var miniBetOption models.MiniBetOption

	result := initializers.DB.First(&miniBetOption, id)
	if err := result.Error; err != nil {
		format_errors.NotFound(c, err)
		return
	}

	// Soft delete
	result = initializers.DB.Delete(&miniBetOption)

	if err := result.Error; err != nil {
		format_errors.InternalServerError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Mini bet option deleted successfully",
	})
}

// ToggleMiniBetOption toggles the enabled status of a mini bet option
func ToggleMiniBetOption(c *gin.Context) {
	id := c.Param("id")
	var miniBetOption models.MiniBetOption

	result := initializers.DB.First(&miniBetOption, id)
	if err := result.Error; err != nil {
		format_errors.NotFound(c, err)
		return
	}

	// Toggle enabled status
	miniBetOption.Enabled = !miniBetOption.Enabled

	result = initializers.DB.Save(&miniBetOption)

	if err := result.Error; err != nil {
		format_errors.InternalServerError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    miniBetOption,
		"message": "Mini bet option status toggled successfully",
	})
}

// BulkUpdateMiniBetOptions updates multiple mini bet options at once
func BulkUpdateMiniBetOptions(c *gin.Context) {
	var userInput struct {
		Options []struct {
			ID       uint   `json:"id" binding:"required"`
			Enabled  bool   `json:"enabled"`
			Odds     string `json:"odds"`
			OrderNum int    `json:"orderNum"`
		} `json:"options" binding:"required"`
	}

	if err := c.ShouldBindJSON(&userInput); err != nil {
		if errs, ok := err.(validator.ValidationErrors); ok {
			c.JSON(http.StatusUnprocessableEntity, gin.H{
				"validations": validations.FormatValidationErrors(errs),
			})
			return
		}

		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Update each option
	for _, option := range userInput.Options {
		var miniBetOption models.MiniBetOption
		result := initializers.DB.First(&miniBetOption, option.ID)
		if err := result.Error; err != nil {
			continue // Skip if not found
		}

		miniBetOption.Enabled = option.Enabled
		if option.Odds != "" {
			miniBetOption.Odds = option.Odds
		}
		miniBetOption.OrderNum = option.OrderNum

		initializers.DB.Save(&miniBetOption)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Mini bet options updated successfully",
	})
}

// GetMiniGameConfigs gets mini game configurations
func GetMiniGameConfigs(c *gin.Context) {
	var configs []models.MiniGameConfig

	gameType := c.Query("gameType")
	levelStr := c.Query("level")

	query := initializers.DB.Model(&models.MiniGameConfig{})

	if gameType != "" {
		query = query.Where("game_type = ?", gameType)
	}
	if levelStr != "" {
		if level, err := strconv.Atoi(levelStr); err == nil {
			query = query.Where("level = ?", level)
		}
	}

	result := query.Find(&configs)

	if err := result.Error; err != nil {
		format_errors.InternalServerError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    configs,
	})
}

// UpdateMiniGameConfig updates mini game configuration
func UpdateMiniGameConfig(c *gin.Context) {
	var userInput struct {
		GameType        string  `json:"gameType" binding:"required"`
		Level           int     `json:"level" binding:"required,min=1,max=15"`
		MaxBettingValue float64 `json:"maxBettingValue" binding:"required,min=1"`
		MinBettingValue float64 `json:"minBettingValue" binding:"required,min=1"`
		IsActive        bool    `json:"isActive"`
	}

	if err := c.ShouldBindJSON(&userInput); err != nil {
		if errs, ok := err.(validator.ValidationErrors); ok {
			c.JSON(http.StatusUnprocessableEntity, gin.H{
				"validations": validations.FormatValidationErrors(errs),
			})
			return
		}

		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Find or create config
	var config models.MiniGameConfig
	result := initializers.DB.Where("game_type = ? AND level = ?", userInput.GameType, userInput.Level).First(&config)

	if err := result.Error; err != nil {
		// Create new config if not found
		config = models.MiniGameConfig{
			GameType:        userInput.GameType,
			Level:           userInput.Level,
			MaxBettingValue: userInput.MaxBettingValue,
			MinBettingValue: userInput.MinBettingValue,
			IsActive:        userInput.IsActive,
		}
		result = initializers.DB.Create(&config)
	} else {
		// Update existing config
		config.MaxBettingValue = userInput.MaxBettingValue
		config.MinBettingValue = userInput.MinBettingValue
		config.IsActive = userInput.IsActive
		result = initializers.DB.Save(&config)
	}

	if err := result.Error; err != nil {
		format_errors.InternalServerError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    config,
		"message": "Mini game configuration updated successfully",
	})
}

// PlaceMiniBet creates a new mini bet
func PlaceMiniBet(c *gin.Context) {
	// Get authenticated user
	user, err := helpers.GetGinAuthUser(c)
	if err != nil {
		format_errors.UnauthorizedError(c, err)
		return
	}

	var betInput struct {
		GameType    string `json:"gameType" binding:"required"`
		Category    string `json:"category" binding:"required"`
		Pick        string `json:"pick" binding:"required"`
		Odds        string `json:"odds" binding:"required"`
		Amount      string `json:"amount" binding:"required"`
		BetOptionID uint   `json:"betOptionId"` // ID of the MiniBetOption
	}

	if err := c.ShouldBindJSON(&betInput); err != nil {
		if errs, ok := err.(validator.ValidationErrors); ok {
			c.JSON(http.StatusUnprocessableEntity, gin.H{
				"validations": validations.FormatValidationErrors(errs),
			})
			return
		}

		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Parse odds to float64
	odds, err := strconv.ParseFloat(betInput.Odds, 64)
	if err != nil || odds <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid odds value",
		})
		return
	}

	// Parse amount to float64
	amount, err := strconv.ParseFloat(betInput.Amount, 64)
	if err != nil || amount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid amount value",
		})
		return
	}

	// Fetch game distribution to get current round
	client := &http.Client{}
	req, err := http.NewRequest("GET", "https://ntry.com/data/json/games/dist.json", nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch game distribution",
		})
		return
	}

	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch game distribution",
		})
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to read game distribution data",
		})
		return
	}

	var gameData map[string]interface{}
	err = json.Unmarshal(body, &gameData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to parse game distribution data",
		})
		return
	}

	// Map internal game types to result JSON API URLs
	resultURLMap := map[string]string{
		"eos1min": "https://ntry.com/data/json/games/eos_powerball/1min/result.json",
		"eos2min": "https://ntry.com/data/json/games/eos_powerball/2min/result.json",
		"eos3min": "https://ntry.com/data/json/games/eos_powerball/3min/result.json",
		"eos4min": "https://ntry.com/data/json/games/eos_powerball/4min/result.json",
		"eos5min": "https://ntry.com/data/json/games/eos_powerball/5min/result.json",
	}

	// Get the result URL for the game type
	resultURL := resultURLMap[betInput.GameType]
	var currentRound uint

	// Fetch from result.json to get current date_round
	if resultURL != "" {
		resultReq, err := http.NewRequest("GET", resultURL, nil)
		if err == nil {
			if resultResp, err := client.Do(resultReq); err == nil {
				defer resultResp.Body.Close()
				resultBody, err := io.ReadAll(resultResp.Body)
				if err == nil {
					var resultData map[string]interface{}
					if err := json.Unmarshal(resultBody, &resultData); err == nil {
						if dateRound, ok := resultData["date_round"]; ok {
							// Parse date_round which can be int or string
							switch v := dateRound.(type) {
							case float64:
								currentRound = uint(v)
							case int:
								currentRound = uint(v)
							case string:
								// Parse string to int, removing leading zeros (e.g., "092" -> 92, "0122" -> 122)
								if parsed, parseErr := strconv.ParseUint(v, 10, 64); parseErr == nil {
									currentRound = uint(parsed)
								} else {
									currentRound = uint(time.Now().Unix())
								}
							default:
								currentRound = uint(time.Now().Unix())
							}
						} else {
							currentRound = uint(time.Now().Unix())
						}
					} else {
						currentRound = uint(time.Now().Unix())
					}
				} else {
					currentRound = uint(time.Now().Unix())
				}
			} else {
				currentRound = uint(time.Now().Unix())
			}
		} else {
			currentRound = uint(time.Now().Unix())
		}
	} else {
		// Fallback to dist.json for other game types
		// Map internal game types to API keys
		gameTypeMap := map[string]string{
			"eos1min": "eos_powerball_1",
			"eos2min": "eos_powerball_2",
			"eos3min": "eos_powerball_3",
			"eos4min": "eos_powerball_4",
			"eos5min": "eos_powerball_5",
		}

		// Get the API key for the game type
		apiKey := gameTypeMap[betInput.GameType]
		if apiKey == "" {
			apiKey = betInput.GameType
		}

		// Try to get round from game distribution data (field name is "rd" not "round")
		if gameInfo, exists := gameData[apiKey].(map[string]interface{}); exists {
			if roundValue, ok := gameInfo["rd"]; ok {
				// Handle different possible types for round value
				switch v := roundValue.(type) {
				case float64:
					currentRound = uint(v)
				case int:
					currentRound = uint(v)
				case string:
					// Try to parse string to uint
					if parsed, parseErr := strconv.ParseUint(v, 10, 64); parseErr == nil {
						currentRound = uint(parsed)
					} else {
						// If parsing fails, use timestamp as round
						currentRound = uint(time.Now().Unix())
					}
				default:
					// Use timestamp as fallback round
					currentRound = uint(time.Now().Unix())
				}
			} else {
				// No round found in game data, use timestamp
				currentRound = uint(time.Now().Unix())
			}
		} else {
			// Game type not found, use timestamp as fallback
			currentRound = uint(time.Now().Unix())
		}
	}

	// Check user balance
	var profile models.Profile
	if err := initializers.DB.Where("user_id = ?", user.ID).First(&profile).Error; err != nil {
		format_errors.InternalServerError(c, err)
		return
	}

	if profile.Balance < amount {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Insufficient balance",
		})
		return
	}

	// Create the bet record
	powerballBet := models.PowerballHistory{
		GameType:      betInput.GameType,
		Category:      betInput.Category,
		UserID:        user.ID,
		Amount:        amount,
		Odds:          odds,
		PickSelection: betInput.Pick,
		Result:        "pending",
		Status:        "pending",
		Round:         currentRound,
		BetOptionID:   &betInput.BetOptionID,
	}

	// Fetch and store bet option details if BetOptionID is provided
	if betInput.BetOptionID > 0 {
		var betOption models.MiniBetOption
		if err := initializers.DB.First(&betOption, betInput.BetOptionID).Error; err == nil {
			powerballBet.BetType = betOption.Type
			powerballBet.BetBall = betOption.Ball
			powerballBet.BetText = betOption.Text
			powerballBet.BetBalls = betOption.Balls
		}
	}

	// Start transaction
	tx := initializers.DB.Begin()

	// Save bet to database
	if err := tx.Create(&powerballBet).Error; err != nil {
		tx.Rollback()
		format_errors.InternalServerError(c, err)
		return
	}

	// Save transaction for the bet
	transaction := models.Transaction{
		UserID:        user.ID,
		Type:          "minigame_place",
		Amount:        amount,
		BalanceBefore: profile.Balance,
		BalanceAfter:  profile.Balance - amount,
		Explation:     fmt.Sprintf("%d", powerballBet.ID),
		Status:        "A",
	}
	
	// plus the betting amount to profile wager amount
	if err := tx.Model(&profile).Update("wager", profile.Wager + amount).Error; err != nil {
		tx.Rollback()
		format_errors.InternalServerError(c, err)
		return
	}

	if err := tx.Create(&transaction).Error; err != nil {
		tx.Rollback()
		format_errors.InternalServerError(c, err)
		return
	}

	// Deduct amount from user balance
	profile.Balance -= amount
	if err := tx.Model(&profile).Updates(map[string]interface{}{
		"balance": profile.Balance,
	}).Error; err != nil {
		tx.Rollback()
		format_errors.InternalServerError(c, err)
		return
	}

	// Commit transaction
	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    powerballBet,
		"message": "Bet placed successfully",
	})
}

// GetMiniBetHistory gets betting history for authenticated user
func GetMiniBetHistory(c *gin.Context) {
	// Get authenticated user
	user, err := helpers.GetGinAuthUser(c)
	if err != nil {
		format_errors.UnauthorizedError(c, err)
		return
	}

	// Get query parameters
	gameType := c.Query("gameType")
	status := c.Query("status")

	// Build query
	query := initializers.DB.Model(&models.PowerballHistory{}).
		Where("user_id = ?", user.ID)

	// Apply filters
	if gameType != "" {
		query = query.Where("game_type = ?", gameType)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// Get pagination parameters - default page to 1
	page := 1
	limit := 20
	if pageStr := c.Query("page"); pageStr != "" {
		if p, parseErr := strconv.Atoi(pageStr); parseErr == nil && p > 0 {
			page = p
		}
	}
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, parseErr := strconv.Atoi(limitStr); parseErr == nil && l > 0 {
			limit = l
		}
	}

	// Get total count
	var totalCount int64
	countQuery := initializers.DB.Model(&models.PowerballHistory{}).
		Where("user_id = ?", user.ID)

	if gameType != "" {
		countQuery = countQuery.Where("game_type = ?", gameType)
	}
	if status != "" {
		countQuery = countQuery.Where("status = ?", status)
	}

	if err := countQuery.Count(&totalCount).Error; err != nil {
		format_errors.InternalServerError(c, err)
		return
	}

	// Calculate offset
	offset := (page - 1) * limit

	// Get betting history with pagination
	var betHistory []models.PowerballHistory
	result := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&betHistory)

	if result.Error != nil {
		format_errors.InternalServerError(c, result.Error)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    betHistory,
		"count":   totalCount,
	})
}

// GetGameDistribution fetches game distribution data from ntry.com
func GetGameDistribution(c *gin.Context) {
	client := &http.Client{}
	req, err := http.NewRequest("GET", "https://ntry.com/data/json/games/dist.json", nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create request",
			"details": err.Error(),
		})
		return
	}

	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch game distribution",
			"details": err.Error(),
		})
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to read response body",
			"details": err.Error(),
		})
		return
	}

	var gameData map[string]interface{}
	err = json.Unmarshal(body, &gameData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to parse game distribution data",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    gameData,
	})
}
