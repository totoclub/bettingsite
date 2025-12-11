package fetcher

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	// "strings"
	"time"

	"github.com/hotbrainy/go-betting/backend/db/initializers"
	"github.com/hotbrainy/go-betting/backend/internal/models"
)

// EOSPowerballResult represents the result from the EOS Powerball API
type EOSPowerballResult struct {
	Date           string        `json:"date"`
	Times          int64         `json:"times"`
	DateRound      interface{}   `json:"date_round"`      // Can be int or string
	Ball           []interface{} `json:"ball"`            // Can be numbers or string
	PowBallOE      string        `json:"pow_ball_oe"`     // 홀 (odd) / 짝 (even)
	PowBallUnover  string        `json:"pow_ball_unover"` // 오버 (over) / 언더 (under)
	DefBallSum     string        `json:"def_ball_sum"`
	DefBallOE      string        `json:"def_ball_oe"`      // 홀 (odd) / 짝 (even)
	DefBallUnover  string        `json:"def_ball_unover"`  // 오버 (over) / 언더 (under)
	DefBallSize    string        `json:"def_ball_size"`    // 작 (small) / 중 (medium) / 큰 (large)
	DefBallSection string        `json:"def_ball_section"` // A, B, C, D, E
	FixedDateRound string        `json:"fixed_date_round"`
}

type EOSPowerballFetcher struct {
	BaseURL  string
	Client   *http.Client
	GameType string // eos1min, eos2min, etc.
}

func NewEOS1MinPowerballFetcher() *EOSPowerballFetcher {
	return &EOSPowerballFetcher{
		BaseURL:  "https://ntry.com/data/json/games/eos_powerball/1min/result.json",
		GameType: "eos1min",
		Client: &http.Client{
			Timeout: 40 * time.Second,
		},
	}
}

func NewEOS2MinPowerballFetcher() *EOSPowerballFetcher {
	return &EOSPowerballFetcher{
		BaseURL:  "https://ntry.com/data/json/games/eos_powerball/2min/result.json",
		GameType: "eos2min",
		Client: &http.Client{
			Timeout: 110 * time.Second,
		},
	}
}

func NewEOS3MinPowerballFetcher() *EOSPowerballFetcher {
	return &EOSPowerballFetcher{
		BaseURL:  "https://ntry.com/data/json/games/eos_powerball/3min/result.json",
		GameType: "eos3min",
		Client: &http.Client{
			Timeout: 160 * time.Second,
		},
	}
}

func NewEOS4MinPowerballFetcher() *EOSPowerballFetcher {
	return &EOSPowerballFetcher{
		BaseURL:  "https://ntry.com/data/json/games/eos_powerball/4min/result.json",
		GameType: "eos4min",
		Client: &http.Client{
			Timeout: 210 * time.Second,
		},
	}
}

func NewEOS5MinPowerballFetcher() *EOSPowerballFetcher {
	return &EOSPowerballFetcher{
		BaseURL:  "https://ntry.com/data/json/games/eos_powerball/5min/result.json",
		GameType: "eos5min",
		Client: &http.Client{
			Timeout: 260 * time.Second,
		},
	}
}

// FetchResult fetches the current EOS Powerball result
func (e *EOSPowerballFetcher) FetchResult() (*EOSPowerballResult, error) {
	// Create request
	req, err := http.NewRequest("GET", e.BaseURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	// Add headers
	req.Header.Add("Content-Type", "application/json")
	req.Header.Add("Accept", "application/json")
	req.Header.Add("User-Agent", "EOS-Powerball-Fetcher/1.0")

	// Make request
	resp, err := e.Client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %v", err)
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %v", err)
	}

	// Check if response is successful
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(body))
	}

	// Parse response
	var result EOSPowerballResult
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %v", err)
	}

	return &result, nil
}

// StartPeriodicFetching starts the periodic fetching of EOS Powerball results
func (e *EOSPowerballFetcher) StartPeriodicFetching() {
	ticker := time.NewTicker(10 * time.Second)

	go func() {
		fmt.Println("🚀 Starting EOS Powerball API polling every 10 seconds...")

		// Initial fetch
		e.fetchAndLogResult()

		// Periodic fetching
		for range ticker.C {
			e.fetchAndLogResult()
		}
	}()
}

// ManualFetch allows manual triggering of the fetch for testing
func (e *EOSPowerballFetcher) ManualFetch() {
	fmt.Println("🔄 Manual fetch triggered...")
	e.fetchAndLogResult()
}

func (e *EOSPowerballFetcher) fetchAndLogResult() {
	result, err := e.FetchResult()
	if err != nil {
		fmt.Printf("❌ Failed to fetch EOS Powerball result: %v\n", err)
		return
	}

	// Parse date_round which can be int or string
	round := 0
	switch v := result.DateRound.(type) {
	case float64:
		round = int(v)
	case int:
		round = v
	case string:
		// Parse string to int, removing leading zeros
		fmt.Sscanf(v, "%d", &round)
	}

	// Settle pending bets for this round if not already settled
    var alreadySettled int64
    today := time.Now().Format("2006-01-02")
    initializers.DB.Model(&models.PowerballHistory{}).
        Where("round = ? AND game_type = ? AND status = ? AND DATE(created_at) = ?", round, e.GameType, "done", today).
        Count(&alreadySettled)
    if alreadySettled > 0 {
        fmt.Printf("⏭️  Powerball %s round %d already settled today (%d done)\n", e.GameType, round, alreadySettled)
        return
    }

	// Log the results
	// fmt.Printf("✅ EOS Powerball %s Result:\n", e.GameType)
	// fmt.Printf("   Date: %s\n", result.Date)
	// fmt.Printf("   Round: %d\n", round)
	// fmt.Printf("   Times: %d\n", result.Times)
	// fmt.Printf("   Balls: %v\n", result.Ball)
	// fmt.Printf("   Power Ball OE: %s, Unover: %s\n", result.PowBallOE, result.PowBallUnover)
	// fmt.Printf("   Def Ball Sum: %s, OE: %s, Unover: %s, Size: %s, Section: %s\n",
	// 	result.DefBallSum, result.DefBallOE, result.DefBallUnover, result.DefBallSize, result.DefBallSection)
    // fmt.Printf("   Fixed Date Round: %s\n", result.FixedDateRound)
	// fmt.Printf("   Fetched at: %s\n", time.Now().Format("2006-01-02 15:04:05"))
	// fmt.Println("   " + strings.Repeat("-", 50))

    // Parse balls
    var d1, d2, d3, d4, d5, pwr int
    if len(result.Ball) >= 6 {
        toInt := func(v interface{}) int {
            switch t := v.(type) {
            case float64:
                return int(t)
            case int:
                return t
            case string:
                var iv int
                fmt.Sscanf(t, "%d", &iv)
                return iv
            default:
                return 0
            }
        }
        d1 = toInt(result.Ball[0])
        d2 = toInt(result.Ball[1])
        d3 = toInt(result.Ball[2])
        d4 = toInt(result.Ball[3])
        d5 = toInt(result.Ball[4])
        pwr = toInt(result.Ball[5])
    }

    // Compute helpers
    isOdd := func(n int) string { if n%2 != 0 { return "홀" } ; return "짝" }
    overUnder := func(n int) string { if n >= 5 { return "오버" } ; return "언더" } // for powerball size threshold guess
    // Sum and derived values from API already provided for default balls

    // Translation map for English pick selections to Korean API results
    translatePick := func(pick string) string {
        translation := map[string]string{
            "Odd":   "홀",
            "Even":  "짝",
            "Under": "언더",
            "Over":  "오버",
        }
        if translated, ok := translation[pick]; ok {
            return translated
        }
        return pick // Return as-is if already in Korean or unknown
    }

    // Settle all pending bets for this round created today
    var pendingBets []models.PowerballHistory
    if err := initializers.DB.Where("round = ? AND game_type = ? AND status = ? AND DATE(created_at) = ?", round, e.GameType, "pending", today).Find(&pendingBets).Error; err != nil {
        fmt.Printf("❌ Failed to load pending bets: %v\n", err)
        return
    }

    for i := range pendingBets {
        bet := &pendingBets[i]

        // Determine win based on bet option structure
        won := false
        
        // Helper to check if a value is odd/even type
        isOddEvenValue := func(val string) bool {
            return val == "홀" || val == "짝"
        }
        
        // Helper to check if a value is under/over type
        isUnderOverValue := func(val string) bool {
            return val == "언더" || val == "오버"
        }
        
        // Check if we have structured bet option data
        if bet.BetType != "" {
            // Use structured bet option for comparison
            if bet.BetType == "single" && bet.BetText != nil {
                // Single bet: translate and compare
                translatedText := translatePick(*bet.BetText)
                
                if bet.Category == "powerball" {
                    if isOddEvenValue(translatedText) && translatedText == result.PowBallOE {
                        won = true
                    } else if isUnderOverValue(translatedText) && translatedText == result.PowBallUnover {
                        won = true
                    }
                } else if bet.Category == "normalball" {
                    if isOddEvenValue(translatedText) && translatedText == result.DefBallOE {
                        won = true
                    } else if isUnderOverValue(translatedText) && translatedText == result.DefBallUnover {
                        won = true
                    }
                }
            } else if bet.BetType == "combination" && len(bet.BetBalls) > 0 {
                // Combination bet: all conditions must be met
                won = true
                for _, ball := range bet.BetBalls {
                    translatedText := translatePick(ball.Text)
                    ballWon := false
                    
                    if bet.Category == "powerball" {
                        if isOddEvenValue(translatedText) && translatedText == result.PowBallOE {
                            ballWon = true
                        } else if isUnderOverValue(translatedText) && translatedText == result.PowBallUnover {
                            ballWon = true
                        }
                    } else if bet.Category == "normalball" {
                        if isOddEvenValue(translatedText) && translatedText == result.DefBallOE {
                            ballWon = true
                        } else if isUnderOverValue(translatedText) && translatedText == result.DefBallUnover {
                            ballWon = true
                        }
                    }
                    
                    if !ballWon {
                        won = false
                        break
                    }
                }
            }
        } else {
            // Fallback to old string-based comparison if no structured data
            // Translate English pick selection to Korean for comparison
            translatedPick := translatePick(bet.PickSelection)
            
            switch bet.Category {
            case "powerball":
                // Powerball: Odd/Even bets check PowBallOE, Under/Over bets check PowBallUnover
                if isOddEvenValue(translatedPick) {
                // Bet is on Odd/Even - check the Odd/Even result field
                if translatedPick == result.PowBallOE {
                    won = true
                }
            } else if isUnderOverValue(translatedPick) {
                // Bet is on Under/Over - check the Under/Over result field
                if translatedPick == result.PowBallUnover {
                    won = true
                }
            }
        case "normalball":
            // Normalball can bet on various metrics - check the appropriate result field
            if isOddEvenValue(translatedPick) {
                // Odd/Even bet
                if translatedPick == result.DefBallOE {
                    won = true
                }
            } else if isUnderOverValue(translatedPick) {
                // Under/Over bet
                if translatedPick == result.DefBallUnover {
                    won = true
                }
            } else if translatedPick == result.DefBallSize || translatedPick == result.DefBallSection || (result.DefBallSum != "" && translatedPick == result.DefBallSum) {
                // Size, Section, or Sum bet
                won = true
            }
        default:
            // Fallback: check against computed powerball odd/even or under/over
            if isOddEvenValue(translatedPick) {
                if translatedPick == isOdd(pwr) {
                    won = true
                }
            } else if isUnderOverValue(translatedPick) {
                if translatedPick == overUnder(pwr) {
                    won = true
                }
            }
            }
        }

        // Begin transaction per bet to avoid partial updates
        tx := initializers.DB.Begin()
        // Update drawing/result fields
        update := map[string]interface{}{
            "drawing_date":     result.Date,
            "times":            result.Times,
            "fixed_date_round": result.FixedDateRound,
            "ball1":            d1,
            "ball2":            d2,
            "ball3":            d3,
            "ball4":            d4,
            "ball5":            d5,
            "power_ball":       pwr,
            "pow_ball_oe":      result.PowBallOE,
            "pow_ball_unover":  result.PowBallUnover,
            "def_ball_sum":     result.DefBallSum,
            "def_ball_oe":      result.DefBallOE,
            "def_ball_unover":  result.DefBallUnover,
            "def_ball_size":    result.DefBallSize,
            "def_ball_section": result.DefBallSection,
            "status":           "done",
            "result":           func() string { if won { return "win" } ; return "lose" }(),
        }

        if err := tx.Model(bet).Where("id = ?", bet.ID).Updates(update).Error; err != nil {
            tx.Rollback()
            fmt.Printf("❌ Failed to update bet %d: %v\n", bet.ID, err)
            continue
        }

        if won {
            // Credit winnings: payout = amount * odds
            var profile models.Profile
            if err := tx.Where("user_id = ?", bet.UserID).First(&profile).Error; err == nil {
                payout := bet.Amount * bet.Odds
                balanceBefore := profile.Balance
                balanceAfter := profile.Balance + payout
                
                if err := tx.Model(&profile).Updates(map[string]interface{}{
                    "balance": balanceAfter,
                }).Error; err != nil {
                    tx.Rollback()
                    fmt.Printf("❌ Failed to credit user %d for bet %d: %v\n", bet.UserID, bet.ID, err)
                    continue
                }
                
                // Save transaction for the win
                transaction := models.Transaction{
                    UserID:        bet.UserID,
                    Type:          "minigame_Win",
                    Amount:        payout,
                    BalanceBefore: balanceBefore,
                    BalanceAfter:  balanceAfter,
                    Explation:     fmt.Sprintf("%d", bet.ID),
                    Status:        "A",
                }
                
                if err := tx.Create(&transaction).Error; err != nil {
                    tx.Rollback()
                    fmt.Printf("❌ Failed to create transaction for bet %d: %v\n", bet.ID, err)
                    continue
                }
                
                fmt.Printf("✅ Transaction created for bet %d: payout=%.2f, balance %.2f -> %.2f\n", 
                    bet.ID, payout, balanceBefore, balanceAfter)
            }
        }

        tx.Commit()
    }
}
