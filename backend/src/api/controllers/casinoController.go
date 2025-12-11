package controllers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/hotbrainy/go-betting/backend/db/initializers"
	"github.com/hotbrainy/go-betting/backend/internal/models"
)

// GameConfig holds the configuration for different game types
type GameConfig struct {
	GameID any
	Vendor string
}

// gameConfigs maps game names to their configurations
var gameConfigs = map[string]GameConfig{
	"evolution":      {GameID: "evolution_all_games", Vendor: "evolution"},
	"vivo":           {GameID: "vivo_lobby", Vendor: "vivo"},
	"ezugi":          {GameID: "ezugi", Vendor: "ezugi"},
	"live88":         {GameID: "bb_Live88Lobby", Vendor: "live88"},
	"virtual":        {GameID: "vir2al-desktop", Vendor: "virtual"},
	"jili":           {GameID: "80", Vendor: "jili"},
	"microgaming":    {GameID: "MGL_GRAND_LobbyAll", Vendor: "microgaming"},
	"oriental":       {GameID: "og-lobby", Vendor: "oriental"},
	"pgsoft":         {GameID: "pglobby", Vendor: "pgsoft"},
	"pragmatic":      {GameID: "101", Vendor: "pragmatic"},
	"superspade":     {GameID: "ssg_lobby", Vendor: "superspade"},
	"wm":             {GameID: "wmcasino", Vendor: "wm"},
	"xprogaming":     {GameID: "c_Lobby", Vendor: "xprogaming"},
	"alg":            {GameID: "absolutelive", Vendor: "absolute"},
	"inrace":         {GameID: "inrace", Vendor: "inrace"},
	"globalbet":      {GameID: "globalbet-web", Vendor: "globalbet"},
	"fachai":         {GameID: "FaChaiLobby", Vendor: "fachai"},
	"dreamgaming":    {GameID: "dgcasino", Vendor: "dreamgaming"},
	"dowin":          {GameID: "dowin", Vendor: "dowin"},
	"bti":            {GameID: "sportsbook", Vendor: "bti"},
	"bota":           {GameID: "bota", Vendor: "bota"},
	"bitville":       {GameID: "bitville", Vendor: "bitville"},
	"ag":             {GameID: "0", Vendor: "ag"},
}

// Default game configuration
var defaultGameConfig = GameConfig{
	GameID: "evolution_baccarat_sicbo",
	Vendor: "evolution",
}

// API configuration
const (
	baseURL     = "https://api.honorlink.org/api"
	bearerToken = "srDiqct6lH61a0zHNKPUu0IwE0mg7Ht38sALu3oWb5bf8e9d"
)

// TestAPIConnection tests the connection to the HonorLink API
func TestAPIConnection(c *gin.Context) {
	client := &http.Client{}
	req, err := http.NewRequest("GET", fmt.Sprintf("%s/user", baseURL), nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create test request",
			"details": err.Error(),
		})
		return
	}

	req.Header.Set("Authorization", "Bearer "+bearerToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to connect to API",
			"details": err.Error(),
		})
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to read response",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":       "API connection test completed",
		"status_code":  resp.StatusCode,
		"response":     string(body),
		"base_url":     baseURL,
		"bearer_token": bearerToken[:10] + "...", // Only show first 10 chars for security
	})
}

// GetBalance retrieves the balance of a user from the HonorLink API
func GetBalance(c *gin.Context) {
	username := c.Query("username")

	// Validate required parameters
	if username == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Username parameter is required",
		})
		return
	}

	// Make request to HonorLink API
	reqURL, err := url.Parse(fmt.Sprintf("%s/user", baseURL))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to parse URL",
			"details": err.Error(),
		})
		return
	}

	q := reqURL.Query()
	q.Set("username", username)
	reqURL.RawQuery = q.Encode()

	req, err := http.NewRequest("GET", reqURL.String(), nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create request",
			"details": err.Error(),
		})
		return
	}

	req.Header.Set("Authorization", "Bearer "+bearerToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		createUser(username)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to read response",
			"details": err.Error(),
		})
		return
	}

	if resp.StatusCode != 200 {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get balance",
			"details": fmt.Sprintf("Status: %d, Response: %s", resp.StatusCode, string(body)),
		})
		return
	}

	// Parse response to get balance
	var response map[string]interface{}
	if err := json.Unmarshal(body, &response); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to parse response",
			"details": err.Error(),
		})
		return
	}

	// Extract balance from response
	balance, ok := response["balance"]
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Balance not found in response",
			"details": string(body),
		})
		return
	}

	// Return success response with balance
	c.JSON(http.StatusOK, gin.H{
		"message":  "Balance retrieved successfully",
		"balance":  balance,
		"username": username,
	})
}

func AddBalance(c *gin.Context) {
	username := c.Query("username")

	// Validate required parameters
	if username == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Username parameter is required",
		})
		return
	}

	// get the id value of users table that has userid = username
	var user models.User
	if err := initializers.DB.Where("userid = ?", username).First(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get user",
			"details": err.Error(),
		})
		return
	}

	// get the profile's balance value that has same userid value = id value of users table that has userid = username on profile table
	var profile models.Profile
	if err := initializers.DB.Where("user_id = ?", user.ID).First(&profile).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get profile",
			"details": err.Error(),
		})
		return
	}

	// Check if profile has balance to transfer
	if profile.Balance <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "No balance to transfer",
			"details": "Profile balance is zero or negative",
		})
		return
	}

	// Store the amount to transfer
	amountToTransfer := profile.Balance

	// Call HonorLink API to add balance to casino account
	reqURL := fmt.Sprintf("%s/user/add-balance", baseURL)

	requestBody := map[string]string{
		"username": username,
		"amount":   strconv.FormatFloat(amountToTransfer, 'f', -1, 64),
	}
	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to marshal request body",
			"details": err.Error(),
		})
		return
	}

	req, err := http.NewRequest("POST", reqURL, bytes.NewBuffer(jsonBody))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create request",
			"details": err.Error(),
		})
		return
	}

	req.Header.Set("Authorization", "Bearer "+bearerToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to make request",
			"details": err.Error(),
		})
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to read response",
			"details": err.Error(),
		})
		return
	}

	if resp.StatusCode != 200 {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to add balance to casino account",
			"details": fmt.Sprintf("Status: %d, Response: %s", resp.StatusCode, string(body)),
		})
		return
	}

	// Set profile balance to 0 after successful transfer to casino
	if err := initializers.DB.Model(&profile).Updates(map[string]interface{}{
		"balance": 0,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to update profile balance",
			"details": err.Error(),
		})
		return
	}

	//Add the deposited transaction to the transaction table
	transaction := models.Transaction{
		UserID:        user.ID,
		Amount:        amountToTransfer,
		Type:          "DepositCasino",
		Shortcut:      "Casino",
		Explation:     "DepositCasino",
		BalanceBefore: 0,
		BalanceAfter:  amountToTransfer,
		Status:        "success",
	}

	if err := initializers.DB.Create(&transaction).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to add transaction",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":           "Balance transferred to casino successfully",
		"transferredAmount": amountToTransfer,
		"newProfileBalance": 0,
	})
}

func GetGameLink(c *gin.Context) {
	// Get parameters from query
	username := c.Query("username")
	gameName := c.Query("gameName")

	// Validate required parameters
	if username == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Username parameter is required",
		})
		return
	}

	// Set nickname to be the same as username
	nickname := username

	// Get game configuration
	gameConfig := getGameConfig(gameName)

	// Debug: Log the request details
	fmt.Printf("Debug: Checking user existence for username: %s, gameName: %s\n", username, gameName)

	// Ensure user exists
	if err := ensureUserExists(username); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to ensure user exists",
			"details": err.Error(),
		})
		return
	}

	// Get game launch link
	gameLink, err := getGameLaunchLink(username, nickname, gameConfig)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get game link",
			"details": err.Error(),
		})
		return
	}

	// Return success response
	c.JSON(http.StatusOK, gin.H{
		"message": "Game link retrieved successfully",
		"link":    gameLink,
	})
}

// getGameConfig returns the game configuration for the given game name
func getGameConfig(gameName string) GameConfig {
	if gameName == "" {
		return defaultGameConfig
	}

	if config, exists := gameConfigs[gameName]; exists {
		return config // Do NOT overwrite Vendor!
	}

	// Return default config with gameName as vendor
	return GameConfig{
		GameID: "evolution_baccarat_sicbo",
		Vendor: strings.ToLower(strings.ReplaceAll(gameName, " ", "")),
	}
}

// ensureUserExists checks if user exists and creates if necessary
func ensureUserExists(username string) error {
	userExists, err := checkUserExists(username)
	if err != nil {
		return fmt.Errorf("failed to check user existence: %w", err)
	}

	if !userExists {
		if err := createUser(username); err != nil {
			return fmt.Errorf("failed to create user: %w", err)
		}
	}

	return nil
}

// checkUserExists checks if a user exists in the HonorLink API
func checkUserExists(username string) (bool, error) {
	reqURL, err := url.Parse(fmt.Sprintf("%s/user", baseURL))
	if err != nil {
		return false, fmt.Errorf("failed to parse URL: %w", err)
	}

	q := reqURL.Query()
	q.Set("username", username)
	reqURL.RawQuery = q.Encode()

	req, err := http.NewRequest("GET", reqURL.String(), nil)
	if err != nil {
		return false, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+bearerToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return false, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	// Read response body for debugging
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return false, fmt.Errorf("failed to read response body: %w", err)
	}

	switch resp.StatusCode {
	case 200:
		return true, nil
	case 404:
		return false, nil
	case 403:
		return false, nil
	default:
		return false, fmt.Errorf("unexpected status code: %d, response: %s", resp.StatusCode, string(body))
	}
}

// createUser creates a new user in the HonorLink API
func createUser(username string) error {
	reqURL := fmt.Sprintf("%s/user/create", baseURL)

	requestBody := map[string]string{
		"username": username,
		"nickname": username,
	}
	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", reqURL, bytes.NewBuffer(jsonBody))
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", "Bearer "+bearerToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	if resp.StatusCode != 200 {
		return fmt.Errorf("failed to create user, status: %d, response: %s", resp.StatusCode, string(body))
	}

	return nil
}

// getGameLaunchLink retrieves the game launch link with token refresh handling
func getGameLaunchLink(username, nickname string, gameConfig GameConfig) (string, error) {
	// First try with the original bearer token
	gameLink, err := requestGameLaunchLink(username, nickname, gameConfig, bearerToken, "")
	if err == nil {
		return gameLink, nil
	}

	// If we get a 403 or 401 error, try to refresh the token and retry
	if err != nil && (strings.Contains(err.Error(), "status: 403") || strings.Contains(err.Error(), "status: 401")) {
		newToken, refreshErr := refreshUserToken(username)
		if refreshErr != nil {
			return "", fmt.Errorf("failed to refresh token: %v, original error: %v", refreshErr, err)
		}

		gameLink, err = requestGameLaunchLink(username, nickname, gameConfig, "", newToken)
		if err != nil {
			return "", fmt.Errorf("failed to get game link with refreshed token: %v", err)
		}

		return gameLink, nil
	}

	return "", err
}

// refreshUserToken refreshes the user token
func refreshUserToken(username string) (string, error) {
	reqURL := fmt.Sprintf("%s/user/refresh-token", baseURL)

	requestBody := map[string]string{
		"username": username,
	}
	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest("PATCH", reqURL, bytes.NewBuffer(jsonBody))
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", "Bearer "+bearerToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("failed to refresh token, status: %d, response: %s", resp.StatusCode, string(body))
	}

	var response map[string]interface{}
	if err := json.Unmarshal(body, &response); err != nil {
		return "", err
	}

	if token, ok := response["token"].(string); ok {
		return token, nil
	}

	return "", fmt.Errorf("token not found in response: %s", string(body))
}

// requestGameLaunchLink makes the actual API request to get the game launch link
func requestGameLaunchLink(username, nickname string, gameConfig GameConfig, bearerToken, userToken string) (string, error) {
	reqURL, err := url.Parse(fmt.Sprintf("%s/game-launch-link", baseURL))
	if err != nil {
		return "", err
	}

	q := reqURL.Query()
	q.Set("username", username)
	q.Set("nickname", nickname)
	q.Set("game_id", fmt.Sprintf("%v", gameConfig.GameID))
	q.Set("vendor", gameConfig.Vendor)

	// Use user token if provided, otherwise use bearer token
	if userToken != "" {
		// q.Set("token", userToken)
	}

	reqURL.RawQuery = q.Encode()

	req, err := http.NewRequest("GET", reqURL.String(), nil)
	if err != nil {
		return "", err
	}

	// Set appropriate headers
	if bearerToken != "" {
		req.Header.Set("Authorization", "Bearer "+bearerToken)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("failed to get game link, status: %d, body: %s", resp.StatusCode, string(body))
	}

	// Parse response to get the link
	var response map[string]interface{}
	if err := json.Unmarshal(body, &response); err != nil {
		return "", err
	}

	// Try different possible response field names
	for _, field := range []string{"link", "url", "game_link"} {
		if link, ok := response[field].(string); ok {
			return link, nil
		}
	}

	// If no link found in response, return the raw response
	return string(body), nil
}

func Withdraw(c *gin.Context) {
	username := c.Query("username")

	// Validate required parameters
	if username == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Username parameter is required",
		})
		return
	}

	// get the id value of users table that has userid = username
	var user models.User
	if err := initializers.DB.Where("userid = ?", username).First(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get user",
			"details": err.Error(),
		})
		return
	}

	// get the profile's balance value that has same userid value = id value of users table that has userid = username on profile table
	var profile models.Profile
	if err := initializers.DB.Where("user_id = ?", user.ID).First(&profile).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get profile",
			"details": err.Error(),
		})
		return
	}

	// Get balance before withdrawal from HonorLink API
	balanceBefore, err := getHonorLinkBalance(username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get balance before withdrawal",
			"details": err.Error(),
		})
		return
	}

	// Check if there's any balance to withdraw
	if balanceBefore <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "No balance to withdraw",
			"details": "Casino account balance is zero or negative",
		})
		return
	}

	// Call HonorLink API to withdraw all balance
	reqURL := fmt.Sprintf("%s/user/sub-balance-all", baseURL)

	requestBody := map[string]string{
		"username": username,
	}
	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to marshal request body",
			"details": err.Error(),
		})
		return
	}

	req, err := http.NewRequest("POST", reqURL, bytes.NewBuffer(jsonBody))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create request",
			"details": err.Error(),
		})
		return
	}

	req.Header.Set("Authorization", "Bearer "+bearerToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to make request",
			"details": err.Error(),
		})
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to read response",
			"details": err.Error(),
		})
		return
	}

	if resp.StatusCode != 200 {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to withdraw balance from casino account",
			"details": fmt.Sprintf("Status: %d, Response: %s", resp.StatusCode, string(body)),
		})
		return
	}

	// Get balance after withdrawal from HonorLink API
	balanceAfter, err := getHonorLinkBalance(username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get balance after withdrawal",
			"details": err.Error(),
		})
		return
	}

	// Calculate withdrawn amount
	withdrawnAmount := balanceBefore - balanceAfter

	// Verify that the withdrawal was successful (balance should be 0 or close to 0)
	if balanceAfter > 0.01 { // Allow for small floating point differences
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Withdrawal may not have been completed fully",
			"details": fmt.Sprintf("Remaining balance: %f", balanceAfter),
		})
		return
	}

	// Add the withdrawn amount to the local profile balance
	newBalance := profile.Balance + withdrawnAmount
	if err := initializers.DB.Model(&profile).Updates(map[string]interface{}{
		"balance": newBalance,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to update profile balance",
			"details": err.Error(),
		})
		return
	}

	//Add the withdrawn transaction to the transaction table
	transaction := models.Transaction{
		UserID:        user.ID,
		Amount:        withdrawnAmount,
		Type:          "WithdrawalCasino",
		Shortcut:      "Casino",
		Explation:     "WithdrawalCasino",
		BalanceBefore: float64(profile.Balance),
		BalanceAfter:  newBalance,
		Status:        "success",
	}

	if err := initializers.DB.Create(&transaction).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to add transaction",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":            "Balance withdrawn from casino successfully",
		"withdrawnAmount":    withdrawnAmount,
		"newProfileBalance":  newBalance,
		"casinoBalanceAfter": balanceAfter,
	})
}

// getHonorLinkBalance retrieves the balance of a user from the HonorLink API
func getHonorLinkBalance(username string) (float64, error) {
	reqURL, err := url.Parse(fmt.Sprintf("%s/user", baseURL))
	if err != nil {
		return 0, fmt.Errorf("failed to parse URL: %w", err)
	}

	q := reqURL.Query()
	q.Set("username", username)
	reqURL.RawQuery = q.Encode()

	req, err := http.NewRequest("GET", reqURL.String(), nil)
	if err != nil {
		return 0, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+bearerToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return 0, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != 200 {
		return 0, fmt.Errorf("failed to get balance, status: %d, response: %s", resp.StatusCode, string(body))
	}

	// Parse response to get balance
	var response map[string]interface{}
	if err := json.Unmarshal(body, &response); err != nil {
		return 0, fmt.Errorf("failed to parse response: %w", err)
	}

	// Extract balance from response
	balance, ok := response["balance"]
	if !ok {
		return 0, fmt.Errorf("balance not found in response: %s", string(body))
	}

	// Convert balance to float64
	switch v := balance.(type) {
	case float64:
		return v, nil
	case int:
		return float64(v), nil
	case string:
		if f, err := strconv.ParseFloat(v, 64); err == nil {
			return f, nil
		}
		return 0, fmt.Errorf("invalid balance format: %s", v)
	default:
		return 0, fmt.Errorf("unexpected balance type: %T", balance)
	}
}
