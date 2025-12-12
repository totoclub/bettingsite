package models

import (
	"time"
)

type Level struct {
	ID uint `json:"id" gorm:"primaryKey"`

	// Basic Level Information
	Name        string `json:"name" gorm:"not null"`        // "Level 1", "VIP 1", "Premium"
	LevelNumber int    `json:"levelNumber" gorm:"not null"` // 1-12 for regular, 13-14 for VIP, 15 for Premium
	LevelType   string `json:"levelType" gorm:"not null"`   // "regular", "vip", "premium"
	IsActive    bool   `json:"isActive" gorm:"default:true"`

	// Level Progression
	NextLevelTargetValue float64 `json:"nextLevelTargetValue" gorm:"default:0"` // Target value to reach next level

	// Deposit/Withdrawal Limits
	MinimumDepositAmount         float64 `json:"minimumDepositAmount" gorm:"default:0"`
	MaximumDepositAmount         float64 `json:"maximumDepositAmount" gorm:"default:0"`
	MinimumWithdrawalAmount      float64 `json:"minimumWithdrawalAmount" gorm:"default:0"`
	MaximumWithdrawalAmount      float64 `json:"maximumWithdrawalAmount" gorm:"default:0"`
	MaximumDailyWithdrawalAmount float64 `json:"maximumDailyWithdrawalAmount" gorm:"default:0"`
	DepositAmountUnit            int     `json:"depositAmountUnit" gorm:"default:0"`
	WithdrawalAmountUnit         int     `json:"withdrawalAmountUnit" gorm:"default:0"`

	// Account Security
	EnterPasswordWhenInquiringAboutAccount bool `json:"enterPasswordWhenInquiringAboutAccount" gorm:"default:false;column:enter_password_inquiry"`

	// Points System
	PointsAwardedWhenWritingAPost     float64 `json:"pointsAwardedWhenWritingAPost" gorm:"default:0"`
	DailyLimitOnNumberOfPostingPoints int     `json:"dailyLimitOnNumberOfPostingPoints" gorm:"default:0"`

	// Mini Game Settings
	MinigameSinglePoleDrawPoint      float64 `json:"minigameSinglePoleDrawPoint" gorm:"default:0"`
	MinigameCombinationWinningPoints float64 `json:"minigameCombinationWinningPoints" gorm:"default:0"`
	TotalPointsLostInMinigames       float64 `json:"totalPointsLostInMinigames" gorm:"default:0"`
	MinigameMinimumBetAmount         float64 `json:"minigameMinimumBetAmount" gorm:"default:0"`
	MinigameMaxRolling               float64 `json:"minigameMaxRolling" gorm:"default:0"`
	MinigameMinimumRolling           float64 `json:"minigameMinimumRolling" gorm:"default:0"`

	// Sports Live Settings
	SportsLiveSinglePollDrawPoints float64 `json:"sportsLiveSinglePollDrawPoints" gorm:"default:0"`
	SportsLive2PoleDrawPoints      float64 `json:"sportsLive2PoleDrawPoints" gorm:"default:0"`
	SportsLive3PoleDrawPoints      float64 `json:"sportsLive3PoleDrawPoints" gorm:"default:0"`
	SportsLive4PoleDrawPoints      float64 `json:"sportsLive4PoleDrawPoints" gorm:"default:0"`
	SportsLiveDapolLostPoints      float64 `json:"sportsLiveDapolLostPoints" gorm:"default:0"`
	SportsTotalLostPoints          float64 `json:"sportsTotalLostPoints" gorm:"default:0"`

	// Sports Pre-Match Settings
	SportsPreMatchSinglePoleDrawPoints float64 `json:"sportsPreMatchSinglePoleDrawPoints" gorm:"default:0"`
	SportsPreMatch2PoleDrawPoints      float64 `json:"sportsPreMatch2PoleDrawPoints" gorm:"default:0"`
	SportsPreMatch3PoleDrawPoints      float64 `json:"sportsPreMatch3PoleDrawPoints" gorm:"default:0"`
	SportsPreMatch4PoleDrawPoints      float64 `json:"sportsPreMatch4PoleDrawPoints" gorm:"default:0"`
	SportsPreMatchDapolLostPoints      float64 `json:"sportsPreMatchDapolLostPoints" gorm:"default:0"`
	SportsPreMatchTotalDrawPoints      float64 `json:"sportsPreMatchTotalDrawPoints" gorm:"default:0"`
	MaximumSportsLotteryPoints1Day     float64 `json:"maximumSportsLotteryPoints1Day" gorm:"default:0"`

	// Virtual Game Settings
	VirtualGameSinlePoleDrawPoints float64 `json:"virtualGameSinlePoleDrawPoints" gorm:"default:0"`
	VirtualGameDapolLosingPoints   float64 `json:"virtualGameDapolLosingPoints" gorm:"default:0"`
	VirtualGameTotalLossPoints     float64 `json:"virtualGameTotalLossPoints" gorm:"default:0"`

	// Casino Rolling Settings
	CasinoLiveMaximumRolling  float64 `json:"casinoLiveMaximumRolling" gorm:"default:0"`
	CasinoLiveMinimumRolling  float64 `json:"casinoLiveMinimumRolling" gorm:"default:0"`
	CasinoSlotsMaxRolling     float64 `json:"casinoSlotsMaxRolling" gorm:"default:0"`
	CasinoSlotsMinimumRolling float64 `json:"casinoSlotsMinimumRolling" gorm:"default:0"`

	// Hold'em Poker Settings
	HoldemPokerMaximumRolling float64 `json:"holdemPokerMaximumRolling" gorm:"default:0"`
	HoldemPokerMinimumRolling float64 `json:"holdemPokerMinimumRolling" gorm:"default:0"`

	// Sports Rolling Settings
	SportsMaxRolling     float64 `json:"sportsMaxRolling" gorm:"default:0"`
	SportsMinimumRolling float64 `json:"sportsMinimumRolling" gorm:"default:0"`

	// Virtual Game Rolling Settings
	VirtualGameMaximumRolling     float64 `json:"virtualGameMaximumRolling" gorm:"default:0"`
	MinimumRollingForVirtualGames float64 `json:"minimumRollingForVirtualGames" gorm:"default:0"`

	// Lotus Rolling Settings
	LotusMaxRolling     float64 `json:"lotusMaxRolling" gorm:"default:0"`
	LotusMinimumRolling float64 `json:"lotusMinimumRolling" gorm:"default:0"`

	// MGM Rolling Settings
	MgmMaxRolling     float64 `json:"mgmMaxRolling" gorm:"default:0"`
	MgmMinimumRolling float64 `json:"mgmMinimumRolling" gorm:"default:0"`

	// Touch Game Rolling Settings
	TouchGameMaximumRolling float64 `json:"touchGameMaximumRolling" gorm:"default:0"`
	TouchGameMinimumRolling float64 `json:"touchGameMinimumRolling" gorm:"default:0"`

	// Rolling Conversion Settings
	RollingCoversionMinimumAmount   float64 `json:"rollingCoversionMinimumAmount" gorm:"default:0"`
	RollingCoversionLimitPerDay     int     `json:"rollingCoversionLimitPerDay" gorm:"default:0"`
	RollingCoversion1DayAmountLimit int     `json:"rollingCoversion1DayAmountLimit" gorm:"default:0"`

	// Waiting Time Settings
	WaitingTimeForReApplicationAfterExchangeIsCompleted           int `json:"waitingTimeForReApplicationAfterExchangeIsCompleted" gorm:"default:0;column:waiting_time_re_app_exchange"`
	WaitingTimeForReApplicationAfterChargingIsCompleted           int `json:"waitingTimeForReApplicationAfterChargingIsCompleted" gorm:"default:0;column:waiting_time_re_app_charging"`
	WaitingTimeForCurrencyExchangeRequestAfterChargingIsCompleted int `json:"waitingTimeForCurrencyExchangeRequestAfterChargingIsCompleted" gorm:"default:0;column:waiting_time_currency_exchange"`
	TimeLimitForExchangeingMoreThanXTimesOnTheSameDay             int `json:"timeLimitForExchangeingMoreThanXTimesOnTheSameDay" gorm:"default:0;column:time_limit_exchange_same_day"`

	// Betting History Settings
	MaximumAmountOfBettingHistoryReduction float64 `json:"maximumAmountOfBettingHistoryReduction" gorm:"default:0;column:max_betting_history_reduction"`
	ReduceBettingAmountPerDay              int     `json:"reduceBettingAmountPerDay" gorm:"default:0;column:reduce_betting_per_day"`

	// Deposit Bonuses
	FirstDepositBonusWeekdays float64 `json:"firstDepositBonusWeekdays" gorm:"default:0"`
	FirstDepositBonusWeekends float64 `json:"firstDepositBonusWeekends" gorm:"default:0"`
	EveryDayBonusWeekday      float64 `json:"everyDayBonusWeekday" gorm:"default:0"`
	WeekendBonus              float64 `json:"weekendBonus" gorm:"default:0"`
	SignUpFirstDepositBonus   float64 `json:"signUpFirstDepositBonus" gorm:"default:0"`
	MaximumBonusMoneyOneTime  float64 `json:"maximumBonusMoneyOneTime" gorm:"default:0"`
	MaximumBonusMoneyOneDay   float64 `json:"maximumBonusMoneyOneDay" gorm:"default:0"`

	// Referral Bonuses
	ReferralBonus        float64 `json:"referralBonus" gorm:"default:0"`
	ReferralBonusOneTime float64 `json:"referralBonusOneTime" gorm:"default:0"`
	ReferralBonusOneDay  float64 `json:"referralBonusOneDay" gorm:"default:0"`

	// Game-Specific Rolling Rates (%)
	LiveRollingRate        float64 `json:"liveRollingRate" gorm:"default:0"`
	SlotRollingRate        float64 `json:"slotRollingRate" gorm:"default:0"`
	HoldemRollingRate      float64 `json:"holdemRollingRate" gorm:"default:0"`
	MiniRollingRate        float64 `json:"miniRollingRate" gorm:"default:0"`
	SportsRollingRate      float64 `json:"sportsRollingRate" gorm:"default:0"`
	VirtualGameRollingRate float64 `json:"virtualGameRollingRate" gorm:"default:0"`
	LotusRollingRate       float64 `json:"lotusRollingRate" gorm:"default:0"`
	MgmRollingRate         float64 `json:"mgmRollingRate" gorm:"default:0"`
	TouchRollingRate       float64 `json:"touchRollingRate" gorm:"default:0"`

	// Sports-Specific Rolling Rates
	SportsDanpolRollingRate float64 `json:"sportsDanpolRollingRate" gorm:"default:0"`
	SportsDupolRollingRate  float64 `json:"sportsDupolRollingRate" gorm:"default:0"`
	Sports3PoleRollingRate  float64 `json:"sports3PoleRollingRate" gorm:"default:0"`
	Sports4PoleRollingRate  float64 `json:"sports4PoleRollingRate" gorm:"default:0"`
	Sports5PoleRollingRate  float64 `json:"sports5PoleRollingRate" gorm:"default:0"`
	SportsDapolRollingRate  float64 `json:"sportsDapolRollingRate" gorm:"default:0"`

	// Mini-Specific Rolling Rates
	MiniDanpolRollingRate      float64 `json:"miniDanpolRollingRate" gorm:"default:0"`
	MiniCombinationRollingRate float64 `json:"miniCombinationRollingRate" gorm:"default:0"`

	// Payback Settings
	StartDateAndTime                                    *time.Time `json:"startDateAndTime"`
	Deadline                                            *time.Time `json:"deadline"`
	PaymentDate                                         *time.Time `json:"paymentDate"`
	ApplicabliltyByGame                                 string     `json:"applicabliltyByGame" gorm:"type:text"` // JSON string of selected games
	PaybackPercent                                      float64    `json:"paybackPercent" gorm:"default:0"`
	IfTheAmountIsNegativeProcessedAsZero                bool       `json:"ifTheAmountIsNegativeProcessedAsZero" gorm:"default:false"`
	NonPaymentWhenDepositWithdrawalDifferenceIsNegative bool       `json:"nonPaymentWhenDepositWithdrawalDifferenceIsNegative" gorm:"default:false"`
	PaymentToDistributorsAsWell                         bool       `json:"paymentToDistributorsAsWell" gorm:"default:false"`
	MaximumPaymentAmount                                float64    `json:"maximumPaymentAmount" gorm:"default:0"`
	PaymentUponDepositOfXOrMoreTimes                    int        `json:"paymentUponDepositOfXOrMoreTimes" gorm:"default:0"`
	PaymentUponDepositForXDaysOrMore                    int        `json:"paymentUponDepositForXDaysOrMore" gorm:"default:0"`

	// Bonus Limits and Restrictions
	RechargeBonusLimit               float64 `json:"rechargeBonusLimit" gorm:"default:0"`
	SameDayFirstDepositBonusLimit    bool    `json:"sameDayFirstDepositBonusLimit" gorm:"default:false"`
	SameDayReplenishmentBonusLimit   bool    `json:"sameDayReplenishmentBonusLimit" gorm:"default:false"`
	ReplenishmentBonusLimit          bool    `json:"replenishmentBonusLimit" gorm:"default:false"`
	SameDayReplenishmentBonusPercent float64 `json:"sameDayReplenishmentBonusPercent" gorm:"default:0"`

	// Surprise Bonus Settings
	SurpriseBonusEnabled                                           bool    `json:"surpriseBonusEnabled" gorm:"default:false"`
	SurpriseBonusAmount                                            float64 `json:"surpriseBonusAmount" gorm:"default:0"`
	SurpriseBonusRestrictions                                      bool    `json:"surpriseBonusRestrictions" gorm:"default:false"`
	RestrictionsOnOtherBonusesBesidesSupriseBonuses                bool    `json:"restrictionsOnOtherBonusesBesidesSupriseBonuses" gorm:"default:false;column:restrictions_other_bonuses"`
	RestrictionsOnOtherRechargebonusesAfterTheSurpriseBonusIsPaid  bool    `json:"restrictionsOnOtherRechargebonusesAfterTheSurpriseBonusIsPaid" gorm:"default:false;column:restrictions_after_surprise_bonus"`
	SurpriseBonusRestrictionsOnFirstDepositOrFirstDeposit          bool    `json:"surpriseBonusRestrictionsOnFirstDepositOrFirstDeposit" gorm:"default:false;column:surprise_bonus_first_deposit"`
	SurpriseBonusRestrictionAfterCashingOutWithinSurpriseBonusTime bool    `json:"surpriseBonusRestrictionAfterCashingOutWithinSurpriseBonusTime" gorm:"default:false;column:surprise_bonus_cashout_restriction"`
	RestrictionsApplyAfterWithdrawalOfSurpriseBonus                bool    `json:"restrictionsApplyAfterWithdrawalOfSurpriseBonus" gorm:"default:false;column:restrictions_after_withdrawal"`
	MaximumNumberOfDailySurpriseBonusPayments                      int     `json:"maximumNumberOfDailySurpriseBonusPayments" gorm:"default:0;column:max_daily_surprise_payments"`
	MaximumNumberOfSurpriseBonusPaymentsPerTimePeriod              float64 `json:"maximumNumberOfSurpriseBonusPaymentsPerTimePeriod" gorm:"default:0;column:max_surprise_payments_period"`

	// Game Access Control
	LiveGameAccess                  bool `json:"liveGameAccess" gorm:"default:true"`
	SlotGameAccess                  bool `json:"slotGameAccess" gorm:"default:true"`
	HoldemGameAccess                bool `json:"holdemGameAccess" gorm:"default:true"`
	MiniGameAccess                  bool `json:"miniGameAccess" gorm:"default:true"`
	SportsGameAccess                bool `json:"sportsGameAccess" gorm:"default:true"`
	VirtualGameAccess               bool `json:"virtualGameAccess" gorm:"default:true"`
	LotusGameAccess                 bool `json:"lotusGameAccess" gorm:"default:true"`
	MgmGameAccess                   bool `json:"mgmGameAccess" gorm:"default:true"`
	TouchGameAccess                 bool `json:"touchGameAccess" gorm:"default:true"`
	ChangeIndividualGameUsageStatus bool `json:"changeIndividualGameUsageStatus" gorm:"default:false"`

	// Special Features
	DepositPlusPriorityFirstDeposit bool `json:"depositPlusPriorityFirstDeposit" gorm:"default:false"`
	DepositPlusPriorityEachDeposit  bool `json:"depositPlusPriorityEachDeposit" gorm:"default:false"`
	UseRechargeBonusSelection       bool `json:"useRechargeBonusSelection" gorm:"default:false"`
	NumberOfBonusPaymentTypes       int  `json:"numberOfBonusPaymentTypes" gorm:"default:1"`

	// Referral Benefits by Game Type
	ReferralBenefitsLive    float64 `json:"referralBenefitsLive" gorm:"default:0"`
	ReferralBenefitsSlot    float64 `json:"referralBenefitsSlot" gorm:"default:0"`
	ReferralBenefitsHoldem  float64 `json:"referralBenefitsHoldem" gorm:"default:0"`
	ReferralBenefitsMini    float64 `json:"referralBenefitsMini" gorm:"default:0"`
	ReferralBenefitsSports  float64 `json:"referralBenefitsSports" gorm:"default:0"`
	ReferralBenefitsVirtual float64 `json:"referralBenefitsVirtual" gorm:"default:0"`
	ReferralBenefitsLotus   float64 `json:"referralBenefitsLotus" gorm:"default:0"`
	ReferralBenefitsMgm     float64 `json:"referralBenefitsMgm" gorm:"default:0"`
	ReferralBenefitsTouch   float64 `json:"referralBenefitsTouch" gorm:"default:0"`

	// Sports-Specific Referral Benefits
	ReferralBenefitsSportsDanpol float64 `json:"referralBenefitsSportsDanpol" gorm:"default:0"`
	ReferralBenefitsSportsDupol  float64 `json:"referralBenefitsSportsDupol" gorm:"default:0"`
	ReferralBenefitsSports3Pole  float64 `json:"referralBenefitsSports3Pole" gorm:"default:0"`
	ReferralBenefitsSports4Pole  float64 `json:"referralBenefitsSports4Pole" gorm:"default:0"`
	ReferralBenefitsSportsDapol  float64 `json:"referralBenefitsSportsDapol" gorm:"default:0"`

	// Mini-Specific Referral Benefits
	ReferralBenefitsMiniDanpol      float64 `json:"referralBenefitsMiniDanpol" gorm:"default:0"`
	ReferralBenefitsMiniCombination float64 `json:"referralBenefitsMiniCombination" gorm:"default:0"`

	// Additional Settings
	PaymentUponDepositXTimes int `json:"paymentUponDepositXTimes" gorm:"default:0"`
	PaymentUponDepositXDays  int `json:"paymentUponDepositXDays" gorm:"default:0"`
	Episode                  int `json:"episode" gorm:"default:1"`

	// Bonus Amount Settings (JSON string for complex bonus structures)
	BonusAmountSettings string `json:"bonusAmountSettings" gorm:"type:text"`
	BonusTimeSettings   string `json:"bonusTimeSettings" gorm:"type:text"`

	// Charging Bonus Selection Settings
	ChargingBonusSelectionSettings string `json:"chargingBonusSelectionSettings" gorm:"type:text"`

	// Metadata
	Description string     `json:"description" gorm:"type:text"`
	SortOrder   int        `json:"sortOrder" gorm:"default:0"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
	DeletedAt   *time.Time `json:"deletedAt,omitempty" gorm:"index"`
}
