package controllers

import (
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/golang-jwt/jwt/v5"
	adminControllers "github.com/hotbrainy/go-betting/backend/api/controllers/admin"
	"github.com/hotbrainy/go-betting/backend/db/initializers"
	format_errors "github.com/hotbrainy/go-betting/backend/internal/format-errors"
	"github.com/hotbrainy/go-betting/backend/internal/helpers"
	"github.com/hotbrainy/go-betting/backend/internal/honorlinkapi"
	"github.com/hotbrainy/go-betting/backend/internal/models"
	responses "github.com/hotbrainy/go-betting/backend/internal/response"
	"github.com/hotbrainy/go-betting/backend/internal/validations"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// Signup function is used to create a user or signup a user
func SignUp(c *gin.Context) {
	// Get the name, userid and password from request
	var userInput struct {
		Name          string    `json:"name" binding:"required,min=2,max=50"`
		HolderName    string    `json:"holderName"`
		Userid        string    `json:"userid" binding:"required,min=6"`
		Password      string    `json:"password" binding:"required,min=6"`
		PasswordSpell string    `json:"passwordSpell"` // Optional: will be set from Password if not provided
		SecPassword   string    `json:"securityPassword" binding:"required,min=3"`
		USDTAddress   string    `json:"usdtAddress"`
		AccountNumber string    `json:"accountNumber"`
		Bank          string    `json:"bank"`
		Birthday      time.Time `json:"birthday"`
		Phone         string    `json:"phone"`
		Referral      string    `json:"referral"`
		OS            string    `json:"os"`                        // Optional: OS from frontend
		Device        string    `json:"device"`                    // Optional: Device from frontend
		FingerPrint   string    `json:"fingerPrint"`               // Optional: FingerPrint from frontend
		Domain        string    `json:"domain" binding:"required"` // Domain from frontend
	}

	if err := c.ShouldBindJSON(&userInput); err != nil {
		if errs, ok := err.(validator.ValidationErrors); ok {
			format_errors.BadRequestError(c, errs)
			return
		}
		format_errors.BadRequestError(c, err)
		return
	}

	// Userid unique validation
	if validations.IsUniqueValue("users", "userid", userInput.Userid) {
		format_errors.ConflictError(c, fmt.Errorf("The userid is already exist!"))
		return
	}

	// Hash the password using bcrypt
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(userInput.Password), bcrypt.DefaultCost)
	if err != nil {
		format_errors.InternalServerError(c, fmt.Errorf("Failed to hash password: %v", err))
		return
	}

	// Get client IP
	clientIP := c.ClientIP()

	// Parse OS and Device from User-Agent if not provided in request
	var osValue, deviceValue string
	if userInput.OS != "" {
		osValue = userInput.OS
	} else {
		// Parse from User-Agent
		uaString := c.GetHeader("User-Agent")
		if uaString != "" {
			ua := helpers.ParseClient(uaString)
			osValue = ua.OS
			if userInput.Device == "" {
				deviceValue = ua.BrowserName + " " + ua.BrowserVersion
				if ua.Platform != "" {
					deviceValue = ua.Platform + " - " + deviceValue
				}
			}
		}
	}

	if userInput.Device != "" {
		deviceValue = userInput.Device
	}

	// Set PasswordSpell from Password if not provided
	passwordSpell := userInput.PasswordSpell
	if passwordSpell == "" {
		passwordSpell = userInput.Password
	}

	user := models.User{
		Name:        userInput.Name,
		Userid:      userInput.Userid,
		Password:    string(hashedPassword),
		SecPassword: userInput.SecPassword,
		PasswordSpell: passwordSpell,
		USDTAddress: userInput.USDTAddress,
		IP:          clientIP,
		CurrentIP:   clientIP,
		Domain:      userInput.Domain, // Store the domain string
	}

	// Set OS if we have a value
	if osValue != "" {
		user.OS = osValue
	}

	// Set Device if we have a value
	if deviceValue != "" {
		user.Device = deviceValue
	}

	// Set FingerPrint if provided
	if userInput.FingerPrint != "" {
		user.FingerPrint = userInput.FingerPrint
	}

	// Create the user
	result := initializers.DB.Create(&user)

	if err := result.Error; err != nil {
		format_errors.InternalServerError(c, err)
		return
	}

	// Find the bank by name if provided
	var bankID uint
	if userInput.Bank != "" {
		// Normalize the bank name: trim and lowercase
		normalizedBankName := strings.TrimSpace(strings.ToLower(userInput.Bank))
		var bank models.Bank
		err := initializers.DB.Where("LOWER(name) = ?", normalizedBankName).First(&bank).Error
		if err != nil {
			// If not found, create a new bank with status=false
			if err.Error() == "record not found" || err == gorm.ErrRecordNotFound {
				bank = models.Bank{
					Name:     normalizedBankName,
					Status:   false,
					OrderNum: 1,
				}
				if err := initializers.DB.Create(&bank).Error; err != nil {
					format_errors.BadRequestError(c, fmt.Errorf("Failed to create new bank: %v", err))
					return
				}
				bankID = bank.ID
			} else {
				format_errors.BadRequestError(c, fmt.Errorf("Invalid bank name provided"))
				return
			}
		} else {
			bankID = bank.ID
		}
	}

	// Create the profile
	profile := &models.Profile{
		UserID:        user.ID,
		Name:          userInput.Name,
		Nickname:      userInput.Name,
		BankName:      userInput.Bank,
		BankID:        bankID,
		HolderName:    userInput.HolderName,
		AccountNumber: userInput.AccountNumber,
		Birthday:      userInput.Birthday,
		Phone:         userInput.Phone,
		Referral:      userInput.Referral,
	}

	pr := initializers.DB.Create(&profile)

	// Check profile creation error first before proceeding with Honorlink integration
	if err := pr.Error; err != nil {
		format_errors.InternalServerError(c, err)
		return
	}

	// checking the user status on the honorlink api, then if it is not exist, creating the honorlink user account.
	// if the user is exist, skip the creating the honorlink user account.
	userExists, err := honorlinkapi.CheckUserExists(userInput.Userid)
	if err != nil {
		// Log error but don't fail the signup process
		fmt.Printf("Error checking Honorlink user: %v\n", err)
	} else if !userExists {
		// User doesn't exist, create it
		if err := honorlinkapi.CreateUser(userInput.Userid); err != nil {
			// Log error but don't fail the signup process
			fmt.Printf("Error creating Honorlink user: %v\n", err)
		}
	}

	// Create alert for admin
	title := "New User Registration"
	message := fmt.Sprintf("New user registered: %s (ID: %d, Name: %s)", userInput.Userid, user.ID, userInput.Name)
	redirectURL := "/admin/popup/member-join"
	adminControllers.CreateAlert("signup", title, message, user.ID, redirectURL)

	c.JSON(http.StatusOK, responses.Status{
		Data: user,
	})
}

// Login function is used to log in a user
func Login(c *gin.Context) {
	// Get the userid and password from the request
	var userInput struct {
		Userid      string `json:"userid" binding:"required"`
		Password    string `json:"password" binding:"required"`
		OS          string `json:"os"`                        // Optional: OS from frontend
		Device      string `json:"device"`                    // Optional: Device from frontend
		FingerPrint string `json:"fingerPrint"`               // Optional: FingerPrint from frontend
		Domain      string `json:"domain" binding:"required"` // Domain from frontend
	}

	l := &models.Log{}
	l.IP = c.ClientIP()
	l.Type = "L"

	l.Path = c.Request.URL.Path

	if err := c.ShouldBindJSON(&userInput); err != nil {
		format_errors.BadRequestError(c, err)
		l.Data = err.Error()
		l.Status = "error"
		initializers.DB.Save(l)
		return
	}

	// Find the user by userid
	var user models.User
	initializers.DB.First(&user, "userid = ?", userInput.Userid).Preload("Profile")
	if user.ID == 0 {
		format_errors.NotFound(c, fmt.Errorf("Invalid UserID!"))
		l.Data = "Invalid UserID!"
		l.Status = "error"
		initializers.DB.Save(l)
		return
	}

	if user.Status != "A" {
		format_errors.ForbbidenError(c, fmt.Errorf("You are not allowed!"))
		l.Data = "You are not allowed!"
		l.Status = "error"
		initializers.DB.Save(l)
		return
	}

	// Compare the password with user password
	// Support bcrypt (primary), Base64 encoded, encrypted (AES), MD5 hash for backward compatibility
	var passwordValid bool
	
	// First try bcrypt (new primary method)
	if helpers.IsBcryptHash(user.Password) {
		err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(userInput.Password))
		passwordValid = (err == nil)
	} else {
		// Try to decode Base64 (backward compatibility)
		decoded, err := helpers.DecodePasswordBase64(user.Password)
		if err == nil {
			// Successfully decoded - compare plain text
			passwordValid = (decoded == userInput.Password)
		} else {
			// Try to decrypt (assuming it's encrypted with AES)
			decrypted, err := helpers.DecryptPassword(user.Password)
			if err == nil {
				// Successfully decrypted - compare plain text
				passwordValid = (decrypted == userInput.Password)
			} else if helpers.IsMD5Hash(user.Password) {
				// MD5 hash
				passwordValid = helpers.VerifyPasswordMD5(userInput.Password, user.Password)
			} else {
				// Plain text (not recommended)
				passwordValid = (user.Password == userInput.Password)
			}
		}
	}
	
	if !passwordValid {
		format_errors.UnauthorizedError(c, fmt.Errorf("Invalid password"))
		l.Data = "Invalid password"
		l.Status = "error"
		initializers.DB.Save(l)
		return
	}

	// Get client IP
	clientIP := c.ClientIP()

	// Parse OS and Device from User-Agent if not provided in request
	var osValue, deviceValue string
	if userInput.OS != "" {
		osValue = userInput.OS
	} else {
		// Parse from User-Agent
		uaString := c.GetHeader("User-Agent")
		if uaString != "" {
			ua := helpers.ParseClient(uaString)
			osValue = ua.OS
			if userInput.Device == "" {
				deviceValue = ua.BrowserName + " " + ua.BrowserVersion
				if ua.Platform != "" {
					deviceValue = ua.Platform + " - " + deviceValue
				}
			}
		}
	}

	if userInput.Device != "" {
		deviceValue = userInput.Device
	}

	// Update user information with login details
	user.IP = clientIP        // Update IP with current login IP
	user.CurrentIP = clientIP // Update CurrentIP
	user.OnlineStatus = true

	// Update OS if we have a value
	if osValue != "" {
		user.OS = osValue
	}

	// Update Device if we have a value
	if deviceValue != "" {
		user.Device = deviceValue
	}

	// Update FingerPrint if provided
	if userInput.FingerPrint != "" {
		user.FingerPrint = userInput.FingerPrint
	}

	// Generate a JWT token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": user.ID,
		"exp": time.Now().Add(time.Hour * 24 * 30).Unix(),
		"ip":  clientIP,
	})

	// Sign in and get the complete encoded token as a string using the .env secret
	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))

	if err != nil {
		format_errors.BadRequestError(c, err)
		l.Data = err.Error()
		l.Status = "error"
		initializers.DB.Save(l)
		return
	}

	// Set expiry time and send the token back

	c.SetSameSite(http.SameSiteLaxMode)

	c.SetCookie("Authorization", tokenString, 3600*24*30, "", "", false, true)

	// Save user with updated information
	initializers.DB.Save(&user)
	l.Phone = user.Profile.Phone
	l.Status = "success"
	l.UserID = &user.ID
	l.Data = "Authorized!"
	initializers.DB.Save(l)
	fmt.Println("authorized")
	c.JSON(http.StatusOK, responses.Status{
		Token:   tokenString,
		Data:    user,
		Message: "Authorized!",
	})
}

// Logout function is used to log out a user
func Logout(c *gin.Context) {
	// Get the authenticated user before clearing the cookie
	user, err := helpers.GetGinAuthUser(c)
	if err == nil && user != nil {
		// Set user offline
		user.OnlineStatus = false
		initializers.DB.Save(&user)
	}

	// Clear the cookie
	c.SetCookie("Authorization", "", 0, "", "", false, true)

	c.JSON(http.StatusOK, responses.Status{
		Message: "Logout successfully.",
	})
}

func Me(c *gin.Context) {

	// Create a post
	user, err := helpers.GetGinAuthUser(c)
	if err != nil {
		format_errors.InternalServerError(c, err)
		return
	}

	if user != nil {
		// Load profile data
		initializers.DB.Model(user).Preload("Profile").Find(user, "userid = ?", user.Userid)

		// Generate a JWT token
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"sub": user.ID,
			"exp": time.Now().Add(time.Hour * 24 * 30).Unix(),
			"ip":  c.ClientIP(),
		})

		// Sign in and get the complete encoded token as a string using the .env secret
		tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))

		if err != nil {
			format_errors.BadRequestError(c, err)
			return
		}

		// Set expiry time and send the token back
		c.SetSameSite(http.SameSiteLaxMode)
		c.SetCookie("Authorization", tokenString, 3600*24*30, "", "", false, true)
		c.JSON(http.StatusOK, responses.Status{
			Token:   tokenString,
			Data:    user,
			Message: "Authorized!",
		})
	} else {
		format_errors.UnauthorizedError(c, fmt.Errorf("No user founded!"))
		return
	}

}

func GetMyProfile(c *gin.Context) {

	// Create a post
	user, err := helpers.GetGinAuthUser(c)
	if err != nil {
		format_errors.InternalServerError(c, err)
		return
	}
	initializers.DB.Model(user).Preload("Profile").Find(user, "userid = ?", user.Userid)
	if user != nil {
		c.JSON(http.StatusOK, responses.Status{
			Data:    user,
			Message: "Authorized!",
		})
	} else {
		format_errors.UnauthorizedError(c, fmt.Errorf("User Not Found!"))
		return
	}

}

func CheckPassword(c *gin.Context) {

	// Get the userid and password from the request
	var userInput struct {
		Userid      uint   `json:"userid" binding:"required"`
		SecPassword string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&userInput); err != nil {
		format_errors.BadRequestError(c, err)
		return
	}

	// Find the user by userid
	var user models.User
	initializers.DB.Model(&models.User{}).Preload("Profile").Find(&user, "id = ?", userInput.Userid)
	if user.ID == 0 {
		format_errors.NotFound(c, fmt.Errorf("Invalid UserID!"))
		return
	}

	// err := bcrypt.CompareHashAndPassword([]byte(user.SecPassword), []byte(userInput.SecPassword))
	// if err != nil {
	// 	format_errors.UnauthorizedError(c, err)
	// 	return
	// }
	if user.SecPassword == userInput.SecPassword {
		c.JSON(http.StatusOK, responses.Status{
			Message: "correct",
		})
	} else {
		c.JSON(http.StatusOK, responses.Status{
			Message: "incorrect",
		})
	}

}

func GetInfo(c *gin.Context) {
	today := time.Now().Truncate(24 * time.Hour)
	now := time.Now()

	// 1. Today's deposit amount (approved only)
	var depositToday float64
	initializers.DB.Model(&models.Transaction{}).
		Where("type = ? AND status = ? AND DATE(transaction_at) = ?", "deposit", "A", today.Format("2006-01-02")).
		Select("COALESCE(SUM(amount),0)").
		Scan(&depositToday)

	// 2. Today's withdraw amount (approved only)
	var withdrawToday float64
	initializers.DB.Model(&models.Transaction{}).
		Where("type = ? AND status = ? AND DATE(transaction_at) = ?", "withdrawal", "A", today.Format("2006-01-02")).
		Select("COALESCE(SUM(amount),0)").
		Scan(&withdrawToday)

	// 3. Total balance and points of all users
	var totalBalance float64
	var totalPoints int64
	initializers.DB.Model(&models.Profile{}).Select("COALESCE(SUM(balance),0)").Scan(&totalBalance)
	initializers.DB.Model(&models.Profile{}).Select("COALESCE(SUM(point),0)").Scan(&totalPoints)

	// 4. Count today's winners on bet (status = 'won' and settled today)
	var todayWinners int64
	initializers.DB.Model(&models.Bet{}).
		Where("status = ? AND DATE(settled_at) = ?", "won", today.Format("2006-01-02")).
		Count(&todayWinners)

	// 5. bettingToday: Total stake of all bets placed today, grouped by placed_at (so simultaneous bets are counted as one)
	var bettingToday float64
	initializers.DB.
		Table("(SELECT placed_at, MAX(stake) as stake FROM bets WHERE DATE(placed_at) = ? GROUP BY placed_at) as grouped_bets", today.Format("2006-01-02")).
		Select("COALESCE(SUM(stake),0)").
		Scan(&bettingToday)

	// 6. totalLoss: Total stake of lost bets settled today
	var totalLoss float64
	initializers.DB.Model(&models.Bet{}).
		Where("status = ? AND DATE(settled_at) = ?", "lost", today.Format("2006-01-02")).
		Select("COALESCE(SUM(stake),0)").
		Scan(&totalLoss)

	// 7. totalSalesLossToday: Alias for totalLoss
	totalSalesLossToday := totalLoss

	// 8. todaysDistributionRolling: Total stake of all bets placed today (or use a specific transaction type if you have one)
	todaysDistributionRolling := bettingToday

	// 9. sportsPendingBetting: Count of bets with status 'pending' placed today
	var sportsPendingBetting int64
	initializers.DB.Model(&models.Bet{}).
		Where("status = ? AND DATE(placed_at) = ?", "pending", today.Format("2006-01-02")).
		Count(&sportsPendingBetting)

	// 10. sportsRebateBetting: Placeholder (set to 0 or implement if you have logic)
	sportsRebateBetting := 0

	c.JSON(http.StatusOK, gin.H{
		"depositToday":              depositToday,
		"withdrawToday":             withdrawToday,
		"totalBalance":              totalBalance,
		"totalPoints":               totalPoints,
		"todayWinners":              todayWinners,
		"bettingToday":              bettingToday,
		"totalLoss":                 totalLoss,
		"totalSalesLossToday":       totalSalesLossToday,
		"todaysDistributionRolling": todaysDistributionRolling,
		"sportsPendingBetting":      sportsPendingBetting,
		"sportsRebateBetting":       sportsRebateBetting,
		"now":                       now,
	})
}

func UpdateMe(c *gin.Context) {

	// Create a post
	user, err := helpers.GetGinAuthUser(c)
	if err != nil {
		format_errors.InternalServerError(c, err)
		return
	}

	if user != nil {
		c.JSON(http.StatusOK, responses.Status{
			Data:    user,
			Message: "Authorized!",
		})
	} else {
		format_errors.UnauthorizedError(c, fmt.Errorf("User Not Found!"))
		return
	}

}
