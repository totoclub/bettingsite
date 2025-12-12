package seeders

import (
	"github.com/hotbrainy/go-betting/backend/db/initializers"
	"github.com/hotbrainy/go-betting/backend/internal/models"
)

// Helper function to calculate NextLevelTargetValue based on level number
// Level 1: 15000
// Level 2: 3 * Level 1 = 45000
// Level 3: 3 * Level 2 = 135000
// Level 4: 3 * Level 3 = 405000
// etc.
func calculateNextLevelTargetValue(levelNumber int) float64 {
	if levelNumber == 1 {
		return 15000.0
	}
	// Calculate: 15000 * (3 ^ (levelNumber - 1))
	result := 15000.0
	for i := 1; i < levelNumber; i++ {
		result *= 3.0
	}
	return result
}

// Helper function to create a level with default values
func createLevel(name string, levelNumber int, levelType string, sortOrder int, description string) models.Level {
	baseBonus := float64(levelNumber) * 0.5
	maxDeposit := float64(levelNumber) * 100000
	maxBonus := float64(levelNumber) * 50000

	return models.Level{
		Name: name, LevelNumber: levelNumber, LevelType: levelType, IsActive: true,
		
		// Level Progression
		NextLevelTargetValue: calculateNextLevelTargetValue(levelNumber),

		// Deposit/Withdrawal Limits
		MinimumDepositAmount: maxDeposit * 0.1, MaximumDepositAmount: maxDeposit,
		MinimumWithdrawalAmount: maxDeposit * 0.1, MaximumWithdrawalAmount: maxDeposit * 0.5,
		MaximumDailyWithdrawalAmount: maxDeposit * 0.2, DepositAmountUnit: 10000,
		WithdrawalAmountUnit: 10000,

		// Account Security
		EnterPasswordWhenInquiringAboutAccount: levelNumber >= 10,

		// Points System
		PointsAwardedWhenWritingAPost: 10, DailyLimitOnNumberOfPostingPoints: 100,

		// Mini Game Settings
		MinigameSinglePoleDrawPoint: 5.0, MinigameCombinationWinningPoints: 3.0,
		TotalPointsLostInMinigames: 2.0, MinigameMinimumBetAmount: 1000,
		MinigameMaxRolling: 10.0, MinigameMinimumRolling: 5.0,

		// Sports Live Settings
		SportsLiveSinglePollDrawPoints: 5.0, SportsLive2PoleDrawPoints: 3.0,
		SportsLive3PoleDrawPoints: 2.0, SportsLive4PoleDrawPoints: 1.5,
		SportsLiveDapolLostPoints: 2.0, SportsTotalLostPoints: 1.0,

		// Sports Pre-Match Settings
		SportsPreMatchSinglePoleDrawPoints: 5.0, SportsPreMatch2PoleDrawPoints: 3.0,
		SportsPreMatch3PoleDrawPoints: 2.0, SportsPreMatch4PoleDrawPoints: 1.5,
		SportsPreMatchDapolLostPoints: 2.0, SportsPreMatchTotalDrawPoints: 1.0,
		MaximumSportsLotteryPoints1Day: 10000,

		// Virtual Game Settings
		VirtualGameSinlePoleDrawPoints: 5.0, VirtualGameDapolLosingPoints: 2.0,
		VirtualGameTotalLossPoints: 1.0,

		// Casino Rolling Settings
		CasinoLiveMaximumRolling: 12.0, CasinoLiveMinimumRolling: 8.0,
		CasinoSlotsMaxRolling: 10.0, CasinoSlotsMinimumRolling: 6.0,

		// Hold'em Poker Settings
		HoldemPokerMaximumRolling: 10.0, HoldemPokerMinimumRolling: 6.0,

		// Sports Rolling Settings
		SportsMaxRolling: 10.0, SportsMinimumRolling: 6.0,

		// Virtual Game Rolling Settings
		VirtualGameMaximumRolling: 10.0, MinimumRollingForVirtualGames: 6.0,

		// Lotus Rolling Settings
		LotusMaxRolling: 10.0, LotusMinimumRolling: 6.0,

		// MGM Rolling Settings
		MgmMaxRolling: 10.0, MgmMinimumRolling: 6.0,

		// Touch Game Rolling Settings
		TouchGameMaximumRolling: 10.0, TouchGameMinimumRolling: 6.0,

		// Rolling Conversion Settings
		RollingCoversionMinimumAmount: 10000, RollingCoversionLimitPerDay: 5,
		RollingCoversion1DayAmountLimit: 30,

		// Waiting Time Settings
		WaitingTimeForReApplicationAfterExchangeIsCompleted:           10,
		WaitingTimeForReApplicationAfterChargingIsCompleted:           5,
		WaitingTimeForCurrencyExchangeRequestAfterChargingIsCompleted: 15,
		TimeLimitForExchangeingMoreThanXTimesOnTheSameDay:             60,

		// Betting History Settings
		MaximumAmountOfBettingHistoryReduction: 100000, ReduceBettingAmountPerDay: 10,

		// Deposit Bonuses
		FirstDepositBonusWeekdays: baseBonus, FirstDepositBonusWeekends: baseBonus + 2.0,
		EveryDayBonusWeekday: baseBonus * 0.4, WeekendBonus: baseBonus * 0.6,
		SignUpFirstDepositBonus: baseBonus * 2, MaximumBonusMoneyOneTime: maxBonus,
		MaximumBonusMoneyOneDay: maxBonus * 2,

		// Referral Bonuses
		ReferralBonus: baseBonus * 0.2, ReferralBonusOneTime: maxBonus * 0.05,
		ReferralBonusOneDay: maxBonus * 0.1,

		// Game-Specific Rolling Rates
		LiveRollingRate: 12.0, SlotRollingRate: 10.0, HoldemRollingRate: 10.0,
		MiniRollingRate: 10.0, SportsRollingRate: 10.0, VirtualGameRollingRate: 10.0,
		LotusRollingRate: 10.0, MgmRollingRate: 10.0, TouchRollingRate: 10.0,

		// Sports-Specific Rolling Rates
		SportsDanpolRollingRate: 10.0, SportsDupolRollingRate: 10.0,
		Sports3PoleRollingRate: 10.0, Sports4PoleRollingRate: 10.0,
		Sports5PoleRollingRate: 10.0, SportsDapolRollingRate: 10.0,

		// Mini-Specific Rolling Rates
		MiniDanpolRollingRate: 10.0, MiniCombinationRollingRate: 10.0,

		// Payback Settings
		StartDateAndTime:                     nil,
		Deadline:                             nil,
		PaymentDate:                          nil,
		ApplicabliltyByGame:                  `[]`,
		PaybackPercent:                       baseBonus * 0.1,
		IfTheAmountIsNegativeProcessedAsZero: false,
		NonPaymentWhenDepositWithdrawalDifferenceIsNegative: false,
		PaymentToDistributorsAsWell:                         false,
		MaximumPaymentAmount:                                maxBonus,
		PaymentUponDepositOfXOrMoreTimes:                    1,
		PaymentUponDepositForXDaysOrMore:                    1,

		// Bonus Limits and Restrictions
		RechargeBonusLimit: maxBonus * 2, SameDayFirstDepositBonusLimit: false,
		SameDayReplenishmentBonusLimit: false, ReplenishmentBonusLimit: false,
		SameDayReplenishmentBonusPercent: 0,

		// Surprise Bonus Settings
		SurpriseBonusEnabled: levelNumber >= 13, SurpriseBonusAmount: maxBonus * 0.1,
		SurpriseBonusRestrictions: false, RestrictionsOnOtherBonusesBesidesSupriseBonuses: false,
		RestrictionsOnOtherRechargebonusesAfterTheSurpriseBonusIsPaid:  false,
		SurpriseBonusRestrictionsOnFirstDepositOrFirstDeposit:          false,
		SurpriseBonusRestrictionAfterCashingOutWithinSurpriseBonusTime: false,
		RestrictionsApplyAfterWithdrawalOfSurpriseBonus:                false,
		MaximumNumberOfDailySurpriseBonusPayments:                      0,
		MaximumNumberOfSurpriseBonusPaymentsPerTimePeriod:              0.0,

		// Game Access Control
		LiveGameAccess: true, SlotGameAccess: true, HoldemGameAccess: true,
		MiniGameAccess: true, SportsGameAccess: true, VirtualGameAccess: true,
		LotusGameAccess: true, MgmGameAccess: true, TouchGameAccess: true,
		ChangeIndividualGameUsageStatus: false,

		// Special Features
		DepositPlusPriorityFirstDeposit: levelNumber >= 13, DepositPlusPriorityEachDeposit: levelNumber >= 13,
		UseRechargeBonusSelection: levelNumber >= 13, NumberOfBonusPaymentTypes: 1,

		// Referral Benefits
		ReferralBenefitsLive: baseBonus * 0.2, ReferralBenefitsSlot: baseBonus * 0.2,
		ReferralBenefitsHoldem: baseBonus * 0.2, ReferralBenefitsMini: baseBonus * 0.2,
		ReferralBenefitsSports: baseBonus * 0.2, ReferralBenefitsVirtual: baseBonus * 0.2,
		ReferralBenefitsLotus: baseBonus * 0.2, ReferralBenefitsMgm: baseBonus * 0.2,
		ReferralBenefitsTouch: baseBonus * 0.2,

		// Sports-Specific Referral Benefits
		ReferralBenefitsSportsDanpol: baseBonus * 0.2, ReferralBenefitsSportsDupol: baseBonus * 0.2,
		ReferralBenefitsSports3Pole: baseBonus * 0.2, ReferralBenefitsSports4Pole: baseBonus * 0.2,
		ReferralBenefitsSportsDapol: baseBonus * 0.2,

		// Mini-Specific Referral Benefits
		ReferralBenefitsMiniDanpol: baseBonus * 0.2, ReferralBenefitsMiniCombination: baseBonus * 0.2,

		// Additional Settings
		PaymentUponDepositXTimes: 0, PaymentUponDepositXDays: 0, Episode: 1,

		// Bonus Settings (JSON strings for complex structures)
		BonusAmountSettings:            `[{"amount":100000,"bonus":3000},{"amount":300000,"bonus":10000}]`,
		BonusTimeSettings:              `[{"from":"21:00","to":"23:00"},{"from":"02:00","to":"05:00"}]`,
		ChargingBonusSelectionSettings: `{"enabled":false,"types":1}`,

		SortOrder: sortOrder, Description: description,
	}
}

func SeedLevels() error {
	levels := []models.Level{
		// Regular Levels 1-12
		createLevel("Level 1", 1, "regular", 1, "Entry level for new members"),
		createLevel("Level 2", 2, "regular", 2, "Second tier regular level"),
		createLevel("Level 3", 3, "regular", 3, "Third tier regular level"),
		createLevel("Level 4", 4, "regular", 4, "Fourth tier regular level"),
		createLevel("Level 5", 5, "regular", 5, "Fifth tier regular level"),
		createLevel("Level 6", 6, "regular", 6, "Sixth tier regular level"),
		createLevel("Level 7", 7, "regular", 7, "Seventh tier regular level"),
		createLevel("Level 8", 8, "regular", 8, "Eighth tier regular level"),
		createLevel("Level 9", 9, "regular", 9, "Ninth tier regular level"),
		createLevel("Level 10", 10, "regular", 10, "Tenth tier regular level"),
		createLevel("Level 11", 11, "regular", 11, "Eleventh tier regular level"),
		createLevel("Level 12", 12, "regular", 12, "Twelfth tier regular level - highest regular level"),

		// VIP Levels
		createLevel("VIP 1", 13, "vip", 13, "VIP level 1 - exclusive benefits and higher bonuses"),
		createLevel("VIP 2", 14, "vip", 14, "VIP level 2 - premium VIP benefits and exclusive features"),

		// Premium Level
		createLevel("Premium", 15, "premium", 15, "Premium level - highest tier with maximum benefits and exclusive features"),
	}

	// Create levels in database
	for _, level := range levels {
		if err := initializers.DB.Create(&level).Error; err != nil {
			return err
		}
	}

	return nil
}
