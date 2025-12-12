package fetcher

import (
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/hotbrainy/go-betting/backend/db/initializers"
	"github.com/hotbrainy/go-betting/backend/internal/models"
)

type User struct {
	Username string `json:"username"`
}

type HonorLinkTransaction struct {
	ID            interface{} `json:"id"` // Can be string or number
	UserID        string      `json:"userId"`
	Username      string      `json:"username"`
	Amount        float64     `json:"amount"`
	Type          string      `json:"type"`
	Status        string      `json:"status"`
	User          User        `json:"user"`
	Details       Details     `json:"details"`
	CreatedAt     time.Time   `json:"createdAt"`
	UpdatedAt     time.Time   `json:"updatedAt"`
	BalanceBefore float64     `json:"before"`
}

type Details struct {
	Game Game `json:"game"`
}

type Game struct {
	Vendor string `json:"vendor"`
	Type   string `json:"type"`
	Id     string `json:"id"`
	Title  string `json:"title"`
	Round  string `json:"round"`
}

// GetIDString returns the ID as a string, handling both string and numeric IDs
func (t *HonorLinkTransaction) GetIDString() string {
	switch v := t.ID.(type) {
	case string:
		return v
	case float64:
		// Use fmt.Sprintf with %.0f to avoid scientific notation for large numbers
		return fmt.Sprintf("%.0f", v)
	case int:
		return strconv.Itoa(v)
	case int64:
		return strconv.FormatInt(v, 10)
	default:
		return fmt.Sprintf("%v", v)
	}
}

type HonorLinkResponse struct {
	Success bool                   `json:"success"`
	Data    []HonorLinkTransaction `json:"data"`
	Total   int                    `json:"total"`
	Page    int                    `json:"page"`
	PerPage int                    `json:"perPage"`
}

type HonorLinkFetcher struct {
	BaseURL string
	Token   string
	Client  *http.Client
}

func NewHonorLinkFetcher() *HonorLinkFetcher {
	token := os.Getenv("HONORLINK_TOKEN")
	if token == "" {
		token = "srDiqct6lH61a0zHNKPUu0IwE0mg7Ht38sALu3oWb5bf8e9d" // fallback
	}

	return &HonorLinkFetcher{
		BaseURL: "https://api.honorlink.org/api/transactions",
		Token:   token,
		Client: &http.Client{
			Timeout: 40 * time.Second, // Increased timeout to 60 seconds
		},
	}
}

func (h *HonorLinkFetcher) FetchTransactions(start, end time.Time, page, perPage int) (*HonorLinkResponse, error) {
	// Create URL with query parameters
	baseURL, err := url.Parse(h.BaseURL)
	if err != nil {
		return nil, fmt.Errorf("invalid base URL: %v", err)
	}

	params := url.Values{}
	params.Add("start", start.Format("2006-01-02 15:04:05"))
	params.Add("end", end.Format("2006-01-02 15:04:05"))
	params.Add("page", fmt.Sprintf("%d", page))
	params.Add("perPage", fmt.Sprintf("%d", perPage))

	baseURL.RawQuery = params.Encode()

	// Create request
	req, err := http.NewRequest("GET", baseURL.String(), nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	// Add authorization header and other headers for better connection
	req.Header.Add("Authorization", "Bearer "+h.Token)
	req.Header.Add("Content-Type", "application/json")
	req.Header.Add("User-Agent", "HonorLink-Fetcher/1.0")
	req.Header.Add("Accept", "application/json")
	req.Header.Add("Connection", "keep-alive")

	// Make request
	resp, err := h.Client.Do(req)
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
	var response HonorLinkResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("failed to parse response: %v", err)
	}

	return &response, nil
}

func (h *HonorLinkFetcher) StartPeriodicFetching() {
	ticker := time.NewTicker(2 * time.Minute) // Increased to 2 minutes to reduce API load

	go func() {
		fmt.Println("🚀 Starting HonorLink API polling every 2 minutes...")

		// Initial fetch with a slight delay to allow system startup
		time.Sleep(10 * time.Second)
		h.fetchAndLogTransactions()

		// Periodic fetching
		for range ticker.C {
			h.fetchAndLogTransactions()
		}
	}()
}

// ManualFetch allows manual triggering of the fetch for testing
func (h *HonorLinkFetcher) ManualFetch() {
	fmt.Println("🔄 Manual fetch triggered...")
	h.fetchAndLogTransactions()
}

func (h *HonorLinkFetcher) fetchAndLogTransactions() {
	// Use UTC timezone
	loc := time.UTC

	// Set time range to last 3 minutes in UTC timezone
	now := time.Now().In(loc)
	end := now                         // Current time UTC
	start := end.Add(-2 * time.Minute) // 3 minutes ago in UTC
	fmt.Println(start, end, "date------------- (UTC Time)")

	// Retry logic for API calls with fallback time ranges
	var response *HonorLinkResponse
	var err error
	maxRetries := 3
	timeRanges := []time.Duration{3 * time.Minute}

	for attempt := 1; attempt <= maxRetries; attempt++ {
		// Use different time ranges for each retry
		var currentStart time.Time
		if attempt <= len(timeRanges) {
			currentStart = end.Add(-timeRanges[attempt-1])
		} else {
			currentStart = start
		}

		timeRangeIndex := attempt - 1
		if timeRangeIndex >= len(timeRanges) {
			timeRangeIndex = len(timeRanges) - 1
		}
		fmt.Printf("🔄 Attempt %d/%d: Fetching %v of data...\n", attempt, maxRetries, timeRanges[timeRangeIndex])
		response, err = h.FetchTransactions(currentStart, end, 1, 1000) // Reduced perPage to 50
		if err == nil {
			// Update start time if we had to use a smaller range
			if attempt > 1 {
				start = currentStart
			}
			break // Success, exit retry loop
		}

		fmt.Printf("❌ Attempt %d/%d failed: %v\n", attempt, maxRetries, err)
		if attempt < maxRetries {
			// Wait before retrying (exponential backoff)
			waitTime := time.Duration(attempt*attempt) * time.Second
			fmt.Printf("⏳ Waiting %v before retry...\n", waitTime)
			time.Sleep(waitTime)
		}
	}

	if err != nil {
		fmt.Printf("❌ Failed to fetch HonorLink transactions after %d attempts: %v\n", maxRetries, err)
		return
	}

	// Log the results
	fmt.Printf("✅ HonorLink API Response:\n")
	fmt.Printf("   Time Range: %s to %s (UTC Time)\n", start.Format("2006-01-02 15:04:05"), end.Format("2006-01-02 15:04:05"))
	fmt.Printf("   Success: %t\n", response.Success)
	fmt.Printf("   Total Transactions: %d\n", response.Total)
	fmt.Printf("   end: %s\n", now.Format("2006-01-02 15:04:05"))
	fmt.Printf("   start: %s\n", start.Format("2006-01-02 15:04:05"))
	fmt.Printf(" ✅✅✅  Transactions in this page: %d\n", len(response.Data))

	if len(response.Data) > 0 {
		fmt.Printf("   Sample transactions:\n")
		for i, transaction := range response.Data {
			// if i >= 5 { // Show only first 5 transactions
			// 	break
			// }
			// check transaction id is exist in transaction table explation
			var transactionDB models.Transaction
			transactionIDStr := transaction.GetIDString()
			if err := initializers.DB.Where("explation = ?", transactionIDStr).First(&transactionDB).Error; err == nil {
				fmt.Printf("❌ Transaction with explation %s already exists\n", transactionIDStr)
				continue
			} else {
				fmt.Printf("%d. ID: %s, UserID: %s, Username: '%s', Amount: %.2f, Type: %s, Status: %s\n",
					i+1, transactionIDStr, transaction.UserID, transaction.User.Username, transaction.Amount, transaction.Type, transaction.Status)
				h.processTransaction(transaction)
			}
		}
	} else {
		fmt.Printf("   No transactions found in the specified time range\n")
	}

	fmt.Printf("   Fetched at: %s (UTC Time)\n", time.Now().In(loc).Format("2006-01-02 15:04:05"))
	fmt.Println("   " + strings.Repeat("-", 50))
}


// processTransaction handles individual HonorLink transactions
func (h *HonorLinkFetcher) processTransaction(hlTransaction HonorLinkTransaction) {
	// Find user by matching transaction.Username or UserID with user.userid field
	var user models.User
	var err error

	// Try to find user by Username first, then by UserID if Username is empty
	useridToSearch := hlTransaction.User.Username
	if useridToSearch == "" {
		useridToSearch = hlTransaction.UserID
	}

	if useridToSearch == "" {
		fmt.Printf("❌ Both Username and UserID are empty for transaction ID %s\n", hlTransaction.GetIDString())
		return
	}

	if err = initializers.DB.Where("userid = ?", useridToSearch).First(&user).Error; err != nil {
		fmt.Printf("❌ Error finding user with userid %s: %v\n", useridToSearch, err)
		return
	}

	// Get user's profile to check current balance
	var profile models.Profile
	if err := initializers.DB.Where("user_id = ?", user.ID).First(&profile).Error; err != nil {
		fmt.Printf("❌ Error finding user profile for ID %d: %v\n", user.ID, err)
		return
	}

	//insert the bet history on CasinoBet table
	if hlTransaction.Type == "bet" || hlTransaction.Type == "win" {
		// Convert Unix timestamp to proper uint - use a reasonable timestamp
		var bettingTime uint
		timestamp := hlTransaction.CreatedAt.Unix()

		// Ensure timestamp is within reasonable bounds for uint
		if timestamp < 0 {
			bettingTime = uint(time.Now().Unix())
		} else if timestamp > math.MaxInt32 {
			// If timestamp is too large, use current time
			bettingTime = uint(time.Now().Unix())
		} else {
			bettingTime = uint(timestamp)
		}

		// Check if casino bet already exists to avoid duplicates
		var existingCasinoBet models.CasinoBet
		if err := initializers.DB.Where("trans_id = ?", hlTransaction.GetIDString()).First(&existingCasinoBet).Error; err == nil {
			fmt.Printf("❌ Casino bet with TransID %s already exists\n", hlTransaction.GetIDString())
		} else {
			casinoBet := models.CasinoBet{
				UserID:        user.ID,
				GameID:        0, // Set default GameID
				Amount:        hlTransaction.Amount,
				Type:          hlTransaction.Type,
				GameName:      hlTransaction.Details.Game.Vendor + "|" + hlTransaction.Details.Game.Type,
				TransID:       hlTransaction.GetIDString(),
				Details:       hlTransaction.Details,
				BeforeAmount:  hlTransaction.BalanceBefore,
				AfterAmount:   hlTransaction.BalanceBefore + hlTransaction.Amount,
				Status:        hlTransaction.Status,
				BettingTime:   bettingTime,
				WinningAmount: 0, // Set default WinningAmount
			}
			if err := initializers.DB.Create(&casinoBet).Error; err != nil {
				fmt.Printf("❌ Error creating casino bet record: %v\n", err)
				return
			}
		}
	}

	// Calculate balance before and after
	var balanceBefore float64
	var gameType string
	balanceBefore = hlTransaction.BalanceBefore
	if hlTransaction.Type == "bet" {
		gameType = "bet"
	} else if hlTransaction.Type == "win" {
		gameType = "win"
	}

	fmt.Println(hlTransaction.CreatedAt, "hlTransaction.CreatedAt")

	if hlTransaction.Type == "bet" || hlTransaction.Type == "win" {
		//Create transaction record
		transactionIDStr := hlTransaction.GetIDString()
		transaction := models.Transaction{
			UserID:        user.ID,
			Amount:        hlTransaction.Amount,
			Type:          gameType,
			Shortcut:      hlTransaction.Details.Game.Vendor + "|" + hlTransaction.Details.Game.Type,
			Explation:     transactionIDStr,
			BalanceBefore: balanceBefore,
			BalanceAfter:  balanceBefore + hlTransaction.Amount,
			Status:        "success",
			TransactionAt:     hlTransaction.CreatedAt,
		}

		// Save transaction to database
		if err := initializers.DB.Create(&transaction).Error; err != nil {
			fmt.Printf("❌ Error creating transaction record: %v\n", err)
			return
		}

		rollingGoldAmount := math.Abs(hlTransaction.Amount * float64(user.Live) / 100)
		rollValue := float64(profile.Roll) + rollingGoldAmount
		if err := initializers.DB.Model(&profile).Update("roll", rollValue).Error; err != nil {
			fmt.Printf("❌ Error updating user roll value: %v\n", err)
			return
		}
		transactionRolling := models.Transaction{
			UserID:        user.ID,
			Amount:        rollingGoldAmount,
			Type:          "Rolling",
			Shortcut:      hlTransaction.Details.Game.Vendor + "|" + hlTransaction.Details.Game.Type,
			Explation:     transactionIDStr + "_rolling",
			BalanceBefore: float64(profile.Roll),
			BalanceAfter:  float64(profile.Roll) + rollingGoldAmount,
			Status:        "success",
			TransactionAt:     hlTransaction.CreatedAt,
		}

		if hlTransaction.Type == "bet" {
			// plus the betting amount to profile wager amount
			if err := initializers.DB.Model(&profile).Update("wager", profile.Wager + math.Abs(hlTransaction.Amount)).Error; err != nil {
				fmt.Printf("❌ Error updating user wager value: %v\n", err)
				return
			}
		}

		if err := initializers.DB.Create(&transactionRolling).Error; err != nil {
			fmt.Printf("❌ Error creating transaction record: %v\n", err)
			return
		}

		fmt.Printf("✅ Successfully processed HonorLink transaction: ID=%s, User=%d, Amount=%.2f\n",
			hlTransaction.GetIDString(), user.ID, hlTransaction.Amount)
	}
}
