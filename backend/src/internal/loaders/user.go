package loaders

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/hotbrainy/go-betting/backend/db/initializers"
	"github.com/hotbrainy/go-betting/backend/graph/model"
	"github.com/hotbrainy/go-betting/backend/internal/helpers"
	"github.com/hotbrainy/go-betting/backend/internal/models"
	"gorm.io/gorm"
)

// userReader loads users from the DB
type userReader struct {
	db *gorm.DB
}

func (ur *userReader) getUsers(ctx context.Context, userIDs []uint) ([]*models.User, []error) {
	var users []*models.User
	err := ur.db.Where("id IN ?", userIDs).Order("order_num").Find(&users).Error
	if err != nil {
		return nil, []error{err}
	}

	userMap := make(map[uint]*models.User, len(users))
	for _, user := range users {
		userMap[user.ID] = user
	}

	results := make([]*models.User, len(userIDs))
	errs := make([]error, len(userIDs))
	for i, id := range userIDs {
		if u, ok := userMap[id]; ok {
			results[i] = u
			errs[i] = nil
		} else {
			results[i] = nil
			errs[i] = fmt.Errorf("user not found: %d", id)
		}
	}
	return results, errs
}

// GetProfiles returns many profiles by ids efficiently
func (ur *userReader) GetUsers(ctx context.Context) ([]*models.User, error) {
	// loaders := For(ctx)
	// return loaders.UserLoader.LoadAll(ctx, userIDs)

	var users []*models.User
	err := initializers.DB.Model(&models.User{}).Preload("Profile").Limit(10).Offset(0).Order("order_num").Find(&users).Error

	return users, err
}

// GetProfiles returns many profiles by ids efficiently
func GetUser(ctx context.Context, userID uint) (*models.User, error) {
	loaders := For(ctx)
	return loaders.UserLoader.Load(ctx, userID)
}

// DeleteProfile deletes a profile by ID (soft delete if GORM soft delete is enabled)
func (pr *userReader) ApproveUser(ctx context.Context, userID uint) error {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("Recovered from panic:", r)
		}
	}()
	fmt.Println(userID)

	me := models.User{}

	if err := initializers.DB.Model(&me).First(&me, "id = ?", userID).Error; err != nil {
		return err
	}
	me.Status = "A"

	tx := initializers.DB.Save(&me)

	return tx.Error
	// return pr.db.Delete(&models.Profile{}, profileID).Error
}

// DeleteProfile deletes a profile by ID (soft delete if GORM soft delete is enabled)
func (pr *userReader) BlockUser(ctx context.Context, userID uint) error {
	fmt.Println(userID)
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("Recovered from panic:", r)
		}
	}()
	fmt.Println(userID)

	me := models.User{}

	if err := initializers.DB.Model(&me).First(&me, "id = ?", userID).Error; err != nil {
		return err
	}
	me.Status = "B"

	tx := initializers.DB.Save(&me)

	return tx.Error
}

// DeleteUser permanently deletes a user by ID (hard delete)
func (pr *userReader) DeleteUser(ctx context.Context, userID uint) error {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("Recovered from panic:", r)
		}
	}()

	fmt.Println("Permanently deleting user ID:", userID)

	user := models.User{}

	// First, find the user (including soft-deleted ones)
	if err := initializers.DB.Unscoped().First(&user, "id = ?", userID).Error; err != nil {
		return fmt.Errorf("user not found: %w", err)
	}

	// Delete AdminPermission if it exists
	var adminPermission models.AdminPermission
	err := initializers.DB.Where("user_id = ?", userID).First(&adminPermission).Error
	if err == nil {
		// AdminPermission exists, delete it
		if err := initializers.DB.Unscoped().Delete(&adminPermission).Error; err != nil {
			fmt.Printf("Error deleting admin permission for user %d: %v\n", userID, err)
			return fmt.Errorf("failed to delete admin permission: %w", err)
		}
		fmt.Printf("Deleted admin permission for user %d\n", userID)
	}

	// Permanently delete the user and related profile (cascade delete should handle profile)
	if err := initializers.DB.Unscoped().Delete(&user).Error; err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	fmt.Println("User deleted successfully:", userID)
	return nil
}

// GetProfiles returns many profiles by ids efficiently
func (ur *userReader) FilterUsers(ctx context.Context, filters []*model.Filter, orders []*model.Order, pagination *model.Pagination) (*model.UserList, error) {
	// loaders := For(ctx)
	// return loaders.UserLoader.LoadAll(ctx, userIDs)
	var users []*models.User

	db := ur.db.Model(&models.User{}).Preload("Root").Preload("Parent").Joins("Profile")
	// Filtering

	db = helpers.ApplyFilters(db, filters)

	// Count total
	var count int64
	if err := db.Count(&count).Error; err != nil {
		return nil, err
	}

	// Ordering
	db = helpers.ApplyOrders(db, orders)

	db = db.Order("order_num")
	// Pagination

	db = helpers.ApplyPagination(db, pagination)

	// Query results

	if err := db.Find(&users).Error; err != nil {
		return nil, err
	}

	return &model.UserList{
		Users: users,
		Total: int32(count),
	}, nil
}

// GetProfiles returns many profiles by ids efficiently
func (ur *userReader) ConnectedUsers(ctx context.Context, filters []*model.Filter, orders []*model.Order, pagination *model.Pagination) (*model.UserList, error) {
	// loaders := For(ctx)
	// return loaders.UserLoader.LoadAll(ctx, userIDs)
	var users []*models.User

	db := ur.db.Model(&models.User{}).Preload("Parent").Preload("Root").Joins("Profile")
	// Filtering

	db = helpers.ApplyFilters(db, filters)

	// Ordering
	db = helpers.ApplyOrders(db, orders)

	db = db.Order("order_num")
	// Pagination

	db = helpers.ApplyPagination(db, pagination)
	fmt.Println(time.Now().Local().Add(time.Minute * -5).Format(time.RFC3339))
	fmt.Println(time.Now().Local().Format(time.RFC3339))
	// Current status is approved
	db = db.Where("users.updated_at > ? AND status = 'A'", time.Now().Local().Add(time.Minute*-5).Format(time.RFC3339))

	// Count total
	var count int64
	if err := db.Count(&count).Error; err != nil {
		return nil, err
	}
	// Query results

	if err := db.Find(&users).Error; err != nil {
		return nil, err
	}

	return &model.UserList{
		Users: users,
		Total: int32(count),
	}, nil
}

// DeleteProfile deletes a profile by ID (soft delete if GORM soft delete is enabled)
func (pr *userReader) CreateUser(ctx context.Context, input *model.NewUser) error {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("Recovered from panic:", r)
		}
	}()

	me := models.User{
		Userid: input.Userid,
		Role:   input.Role,
		Type:   input.Type.String(),
		Status: input.Status.String(),
	}

	if err := initializers.DB.Model(&me).First(&me, "userid = ?", input.Userid).Error; err == nil {
		if me.ID > 0 {
			return fmt.Errorf("UserID is existing...")
		}
	}

	if input.Name != nil {
		me.Name = *input.Name
	}
	if input.UsdtAddress != nil {
		me.USDTAddress = *input.UsdtAddress
	}
	if input.OrderNum != nil {
		me.OrderNum = *input.OrderNum
	}

	if input.BlackMemo != nil {
		me.BlackMemo = *input.BlackMemo
	}

	tx := initializers.DB.Save(&me)
	if tx.Error != nil {
		return tx.Error
	}
	myprofile := models.Profile{
		UserID: me.ID,
	}

	if input.Nickname != nil {
		myprofile.Nickname = *input.Nickname
	}

	if input.HolderName != nil {
		myprofile.HolderName = *input.HolderName
	}

	if input.Phone != nil {
		myprofile.Phone = *input.Phone
	}

	if input.BankID != nil {
		myprofile.BankID = *input.BankID
	}

	tx1 := initializers.DB.Save(&myprofile)
	if tx1.Error != nil {
		return tx1.Error
	}
	return nil
}

// DeleteProfile deletes a profile by ID (soft delete if GORM soft delete is enabled)
func (pr *userReader) UpdateUser(ctx context.Context, userID uint, updates model.UpdateUser) error {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("Recovered from panic:", r)
		}
	}()

	me := models.User{}

	if err := initializers.DB.Model(&me).First(&me, "id = ?", userID).Error; err != nil {
		return err
	}

	// Store old role before updating
	oldRole := me.Role
	roleChanged := false
	newRole := ""

	if updates.Name != nil {
		me.Name = *updates.Name
	}
	if updates.OrderNum != nil {
		me.OrderNum = *updates.OrderNum
	}
	if updates.Role != nil {
		newRole = *updates.Role
		if oldRole != newRole {
			roleChanged = true
		}
		me.Role = newRole
	}
	if updates.Type != nil {
		me.Type = string(*updates.Type)
	}
	if updates.UsdtAddress != nil {
		me.USDTAddress = *updates.UsdtAddress
	}
	if updates.Status != nil {
		me.Status = string(*updates.Status)
	}

	// Handle losing-related fields
	if updates.Live != nil {
		me.Live = *updates.Live
	}
	if updates.Slot != nil {
		me.Slot = *updates.Slot
	}
	if updates.Hold != nil {
		me.Hold = *updates.Hold
	}
	if updates.EntireLosing != nil {
		me.EntireLosing = *updates.EntireLosing
	}
	if updates.LiveLosingBeDang != nil {
		me.LiveLosingBeDang = *updates.LiveLosingBeDang
	}
	if updates.SlotLosingBeDang != nil {
		me.SlotLosingBeDang = *updates.SlotLosingBeDang
	}
	if updates.HoldLosingBeDang != nil {
		me.HoldLosingBeDang = *updates.HoldLosingBeDang
	}
	if updates.LosingMethod != nil {
		me.LosingMethod = *updates.LosingMethod
	}

	// Handle domainIds field
	// Note: GraphQL [ID!] is automatically converted to []uint by gqlgen (see gqlgen.yml)
	// Convert []uint to UintArray for proper PostgreSQL array encoding
	if updates.DomainIds != nil {
		// Update domain IDs (empty array means clear all domain IDs)
		me.DomainIDs = models.UintArray(updates.DomainIds)
		fmt.Printf("Updating user %d domain IDs: %v\n", userID, me.DomainIDs)
	}

	// Save all fields including DomainIDs
	tx := initializers.DB.Save(&me)

	if tx.Error != nil {
		fmt.Printf("Error saving user: %v\n", tx.Error)
		return tx.Error
	}

	if updates.DomainIds != nil {
		fmt.Printf("Successfully updated user %d with domain IDs: %v\n", userID, me.DomainIDs)
	}

	// Handle admin_permission based on role change
	if roleChanged {
		if newRole == "A" {
			// Role changed to Admin - create AdminPermission if it doesn't exist
			var existingPermission models.AdminPermission
			err := initializers.DB.Where("user_id = ?", userID).First(&existingPermission).Error
			if err != nil {
				// AdminPermission doesn't exist, create it with default values
				adminPermission := models.AdminPermission{
					UserID:      userID,
					Membership:  false,
					Financials:  false,
					Qna:         false,
					Game:        false,
					Settlement:  false,
					Sale:        false,
					Statistical: false,
					IP:          false,
					Dwdelete:    false,
					Status:      false,
				}
				if err := initializers.DB.Create(&adminPermission).Error; err != nil {
					fmt.Printf("Error creating admin permission for user %d: %v\n", userID, err)
					return err
				}
				fmt.Printf("Created admin permission for user %d (role changed to Admin)\n", userID)
			}
		} else if newRole == "P" || newRole == "U" {
			// Role changed to Partner or User - delete AdminPermission if it exists
			var existingPermission models.AdminPermission
			err := initializers.DB.Where("user_id = ?", userID).First(&existingPermission).Error
			if err == nil {
				// AdminPermission exists, delete it
				if err := initializers.DB.Delete(&existingPermission).Error; err != nil {
					fmt.Printf("Error deleting admin permission for user %d: %v\n", userID, err)
					return err
				}
				fmt.Printf("Deleted admin permission for user %d (role changed to %s)\n", userID, newRole)
			}
		}
	}

	return nil
}

// GetProfiles returns many profiles by ids efficiently
func (ur *userReader) GetDistributors(ctx context.Context, filters []*model.Filter, orders []*model.Order, pagination *model.Pagination) (*model.UserList, error) {
	// loaders := For(ctx)
	// return loaders.UserLoader.LoadAll(ctx, userIDs)
	var users []*models.User

	db := ur.db.Model(&models.User{}).Preload("Root").Preload("Parent").Joins("Profile")
	// Filtering

	db = helpers.ApplyFilters(db, filters)

	// Count total
	var count int64
	if err := db.Count(&count).Error; err != nil {
		return nil, err
	}

	// Ordering
	db = helpers.ApplyOrders(db, orders)

	db = db.Order("order_num")
	// Pagination

	db = helpers.ApplyPagination(db, pagination)

	// Query results

	if err := db.Find(&users).Error; err != nil {
		return nil, err
	}

	return &model.UserList{
		Users: users,
		Total: int32(count),
	}, nil
}

// GetDistributorDetails returns detailed distributor statistics with calculated financial data
func (ur *userReader) GetDistributorDetails(ctx context.Context, filters []*model.Filter, orders []*model.Order, pagination *model.Pagination) (*model.UserList, error) {
	var users []*models.User

	db := ur.db.Model(&models.User{}).Preload("Root").Preload("Parent").Joins("Profile")

	// Filtering
	db = helpers.ApplyFilters(db, filters)

	// Count total
	var count int64
	if err := db.Count(&count).Error; err != nil {
		return nil, err
	}

	// Ordering
	db = helpers.ApplyOrders(db, orders)
	db = db.Order("order_num")

	// Pagination
	db = helpers.ApplyPagination(db, pagination)

	// Query results
	if err := db.Find(&users).Error; err != nil {
		return nil, err
	}

	// Calculate additional statistics for each user
	for _, user := range users {
		// Calculate membership deposit/withdrawal from transactions
		var membershipDeposit, membershipWithdrawal, totalWithdrawal float64
		var numberOfMembers int64

		// Get deposit transactions
		if err := ur.db.Model(&models.Transaction{}).
			Where("user_id = ? AND type = 'deposit' AND status = 'A'", user.ID).
			Select("COALESCE(SUM(amount), 0)").
			Scan(&membershipDeposit).Error; err != nil {
			return nil, err
		}

		// Get withdrawal transactions
		if err := ur.db.Model(&models.Transaction{}).
			Where("user_id = ? AND type = 'withdrawal' AND status = 'A'", user.ID).
			Select("COALESCE(SUM(amount), 0)").
			Scan(&membershipWithdrawal).Error; err != nil {
			return nil, err
		}

		// Get total withdrawal (including pending)
		if err := ur.db.Model(&models.Transaction{}).
			Where("user_id = ? AND type = 'withdrawal'", user.ID).
			Select("COALESCE(SUM(amount), 0)").
			Scan(&totalWithdrawal).Error; err != nil {
			return nil, err
		}

		// Count number of members (children users)
		if err := ur.db.Model(&models.User{}).
			Where("parent_id = ?", user.ID).
			Count(&numberOfMembers).Error; err != nil {
			return nil, err
		}

		// Set calculated values
		user.MembershipDeposit = membershipDeposit
		user.MembershipWithdrawal = membershipWithdrawal
		user.TotalWithdrawal = totalWithdrawal
		user.NumberOfMembers = int(numberOfMembers)
		
		// Calculate rolling holdings (sum of all rolling fields)
		user.RollingHoldings = user.Live + user.Slot + user.Hold +
			user.MiniDanpolRolling + user.MiniCombinationRolling +
			user.SportsDanpolRolling + user.SportsDupolRolling +
			user.Sports3PoleRolling + user.Sports4PoleRolling +
			user.Sports5PoleRolling + user.SportsDapolRolling +
			user.VirtualGameRolling + user.LotusRolling +
			user.MgmRolling + user.TouchRolling

		// Calculate rolling rate (percentage)
		denominator := user.MembershipDeposit + user.MembershipWithdrawal
		if user.RollingHoldings > 0 && denominator > 0 {
			user.RollingRate = (user.RollingHoldings / denominator) * 100
		} else {
			user.RollingRate = 0
		}

		// Calculate rolling transition
		user.RollingTransition = user.RollingHoldings

		// Calculate losing rate and settlement
		user.LosingRate = user.EntireLosing
		user.LosingSettlement = user.LiveLosingBeDang + user.SlotLosingBeDang + user.HoldLosingBeDang

		// Calculate betting/winning statistics from transactions and bets
		// Get casino bets (live and slot) from CasinoBet table
		var casinoBets []models.CasinoBet
		if err := ur.db.Model(&models.CasinoBet{}).
			Where("user_id = ?", user.ID).
			Find(&casinoBets).Error; err == nil {
			for _, bet := range casinoBets {
				gameNameLower := strings.ToLower(bet.GameName)
				if bet.Type == "bet" {
					if strings.Contains(gameNameLower, "live") {
						user.LiveBetting += bet.Amount
					} else if strings.Contains(gameNameLower, "slot") {
						user.SlotBetting += bet.Amount
					}
				} else if bet.Type == "win" {
					if strings.Contains(gameNameLower, "live") {
						user.LiveWinning += float64(bet.WinningAmount)
					} else if strings.Contains(gameNameLower, "slot") {
						user.SlotJackpot += float64(bet.WinningAmount)
					}
				}
			}
		}

		// Get mini game bets from PowerballHistory
		var miniBets []models.PowerballHistory
		if err := ur.db.Model(&models.PowerballHistory{}).
			Where("user_id = ?", user.ID).
			Find(&miniBets).Error; err == nil {
			for _, bet := range miniBets {
				if bet.BetType == "single" {
					user.MiniDanpolBetting += bet.Amount
					if bet.Result == "won" {
						user.MiniDanpolWinner += bet.Amount * bet.Odds
					}
				} else if bet.BetType == "combination" {
					user.MiniCombinationBetting += bet.Amount
					if bet.Result == "won" {
						user.MiniCombinationWinnings += bet.Amount * bet.Odds
					}
				}
			}
		}

		// Get sports bets from Bet table
		var sportsBets []models.Bet
		if err := ur.db.Model(&models.Bet{}).
			Where("user_id = ?", user.ID).
			Find(&sportsBets).Error; err == nil {
			for _, bet := range sportsBets {
				sportsBettingAmount := bet.Stake
				sportsWinningAmount := 0.0
				if bet.Status == "won" && bet.Result != nil && *bet.Result == "win" {
					sportsWinningAmount = bet.PotentialPayout
				}

				// Distribute sports bets evenly across different bet types
				// This is a simplified approach - you may need to adjust based on actual market structure
				user.SportsDanpolBetting += sportsBettingAmount * 0.1
				user.SportsDanpolWinner += sportsWinningAmount * 0.1
				user.SportsDupolBetting += sportsBettingAmount * 0.1
				user.SportsDupolWinner += sportsWinningAmount * 0.1
				user.Sports3poleBetting += sportsBettingAmount * 0.2
				user.Sports3poleWinner += sportsWinningAmount * 0.2
				user.Sports4poleBetting += sportsBettingAmount * 0.2
				user.Sports4poleWinner += sportsWinningAmount * 0.2
				user.Sports5poleBetting += sportsBettingAmount * 0.2
				user.Sports5poleWinner += sportsWinningAmount * 0.2
				user.SportsDapolBetting += sportsBettingAmount * 0.2
				user.SportsDapolWinner += sportsWinningAmount * 0.2
			}
		}

		// Get general betting/winning from transactions if not already categorized
		var generalBetting float64
		if err := ur.db.Model(&models.Transaction{}).
			Where("user_id = ? AND type = 'betting/placingBet'", user.ID).
			Select("COALESCE(SUM(amount), 0)").
			Scan(&generalBetting).Error; err == nil {
			// Distribute to live/slot if not already set
			if user.LiveBetting == 0 && user.SlotBetting == 0 {
				user.LiveBetting = generalBetting * 0.5
				user.SlotBetting = generalBetting * 0.5
			}
		}

		var generalWinning float64
		if err := ur.db.Model(&models.Transaction{}).
			Where("user_id = ? AND type = 'bettingSettlement'", user.ID).
			Select("COALESCE(SUM(amount), 0)").
			Scan(&generalWinning).Error; err == nil {
			// Distribute to live/slot if not already set
			if user.LiveWinning == 0 && user.SlotJackpot == 0 {
				user.LiveWinning = generalWinning * 0.5
				user.SlotJackpot = generalWinning * 0.5
			}
		}

		// Calculate partnership statistics
		user.PartnershipRolling = user.RollingHoldings
		if user.Profile != nil {
			user.PartnershipMoneyInHand = user.Profile.Balance
		}
	}

	return &model.UserList{
		Users: users,
		Total: int32(count),
	}, nil
}
