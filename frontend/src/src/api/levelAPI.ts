import api from "@/api";

export interface Level {
  id?: number;
  name: string;
  levelNumber: number;
  levelType: "regular" | "vip" | "premium";
  isActive: boolean;
  
  // Level Progression
  nextLevelTargetValue: number;
  
  // Deposit/Withdrawal Limits
  minimumDepositAmount: number;
  maximumDepositAmount: number;
  minimumWithdrawalAmount: number;
  maximumWithdrawalAmount: number;
  maximumDailyWithdrawalAmount: number;
  depositAmountUnit: number;
  withdrawalAmountUnit: number;
  
  // Account Security
  enterPasswordWhenInquiringAboutAccount: boolean;
  
  // Points System
  pointsAwardedWhenWritingAPost: number;
  dailyLimitOnNumberOfPostingPoints: number;
  
  // Mini Game Settings
  minigameSinglePoleDrawPoint: number;
  minigameCombinationWinningPoints: number;
  totalPointsLostInMinigames: number;
  minigameMinimumBetAmount: number;
  minigameMaxRolling: number;
  minigameMinimumRolling: number;
  
  // Sports Live Settings
  sportsLiveSinglePollDrawPoints: number;
  sportsLive2PoleDrawPoints: number;
  sportsLive3PoleDrawPoints: number;
  sportsLive4PoleDrawPoints: number;
  sportsLiveDapolLostPoints: number;
  sportsTotalLostPoints: number;
  
  // Sports Pre-Match Settings
  sportsPreMatchSinglePoleDrawPoints: number;
  sportsPreMatch2PoleDrawPoints: number;
  sportsPreMatch3PoleDrawPoints: number;
  sportsPreMatch4PoleDrawPoints: number;
  sportsPreMatchDapolLostPoints: number;
  sportsPreMatchTotalDrawPoints: number;
  maximumSportsLotteryPoints1Day: number;
  
  // Virtual Game Settings
  virtualGameSinlePoleDrawPoints: number;
  virtualGameDapolLosingPoints: number;
  virtualGameTotalLossPoints: number;
  virtualGameMaximumRolling: number;
  minimumRollingForVirtualGames: number;
  
  // Casino Settings
  casinoLiveMaximumRolling: number;
  casinoLiveMinimumRolling: number;
  casinoSlotsMaxRolling: number;
  casinoSlotsMinimumRolling: number;
  
  // Hold'em Settings
  holdemPokerMaximumRolling: number;
  holdemPokerMinimumRolling: number;
  
  // Sports Settings
  sportsMaxRolling: number;
  sportsMinimumRolling: number;
  
  // Lotus Settings
  lotusMaxRolling: number;
  lotusMinimumRolling: number;
  
  // MGM Settings
  mgmMaxRolling: number;
  mgmMinimumRolling: number;
  
  // Touch Settings
  touchGameMinimumRolling: number;
  touchGameMaximumRolling: number;
  
  // Rolling Conversion Settings
  rollingCoversionMinimumAmount: number;
  rollingCoversionLimitPerDay: number;
  rollingCoversion1DayAmountLimit: number;
  
  // Waiting Time Settings
  waitingTimeForReApplicationAfterExchangeIsCompleted: number;
  waitingTimeForReApplicationAfterChargingIsCompleted: number;
  waitingTimeForCurrencyExchangeRequestAfterChargingIsCompleted: number;
  timeLimitForExchangeingMoreThanXTimesOnTheSameDay: number;
  
  // Betting History Settings
  maximumAmountOfBettingHistoryReduction: number;
  reduceBettingAmountPerDay: number;
  
  // Deposit Bonuses
  firstDepositBonusWeekdays: number;
  firstDepositBonusWeekends: number;
  everyDayBonusWeekday: number;
  weekendBonus: number;
  signUpFirstDepositBonus: number;
  maximumBonusMoney1Time: number;
  maximumBonusMoney1Day: number;
  referralBonus: number;
  
  // Bonus Settings
  depositPlusPriorityApplicationForFirstDepositUponSigningUp: boolean;
  depositPlusPriorityApplicationForEachDeposit: boolean;
  rechargeBonusLimitMaximumAmountOfMoneyHeldPoints: number;
  sameDayFirstDepositBonusLimitAfterWithdrawal: boolean;
  sameDayReplenishmentBonusLimitAfterWithdrawal: boolean;
  replenishmentBonusLimitAfterWithdrawal: number;
  sameDayRepleishmentBonusAfterWithdrawal: number;
  
  // Surprise Bonus Settings
  surpriseBonusEnabled: boolean;
  surpriseBonusAmount: number;
  surpriseBonusRestrictions: boolean;
  restrictionsOnOtherBonusesBesidesSupriseBonuses: boolean;
  restrictionsOnOtherRechargebonusesAfterTheSurpriseBonusIsPaid: boolean;
  surpriseBonusRestrictionsOnFirstDepositOrFirstDeposit: boolean;
  surpriseBonusRestrictionAfterCashingOutWithinSurpriseBonusTime: boolean;
  restrictionsApplyAfterWithdrawalOfSurpriseBonus: boolean;
  maximumNumberOfDailySurpriseBonusPayments: number;
  maximumNumberOfSurpriseBonusPaymentsPerTimePeriod: number;
  
  // Game Access Control
  liveGameAccess: boolean;
  slotGameAccess: boolean;
  holdemGameAccess: boolean;
  miniGameAccess: boolean;
  sportsLiveGameAccess: boolean;
  sportsPreMatchGameAccess: boolean;
  virtualGameAccess: boolean;
  casinoGameAccess: boolean;
  lotusGameAccess: boolean;
  mgmGameAccess: boolean;
  touchGameAccess: boolean;
  
  // Referral Benefits
  referralBenefitsMini: string;
  referralBenefitsVirtual: string;
  referralBenefitsSportsSinglePole: string;
  referralBenefitsSports2Pole: string;
  referralBenefitsSports3Pole: string;
  referralBenefitsSports4Pole: string;
  
  // Charging Bonus Selection Settings
  useTheRechargeBonousSelection: boolean;
  numberOfBonusPaymentTypes: number;
  
  // Payback Settings
  applicabliltyByGame: string;
  
  // Bonus Amount Settings (JSON string for complex bonus structures)
  bonusAmountSettings: string;
  bonusTimeSettings: string;
  chargingBonusSelectionSettings: string;
  
  // Metadata
  description: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface LevelResponse {
  result?: {
    page: number;
    perPage: number;
    total: number;
    lastPage: number;
  };
  levels: Level[];
}

export interface SingleLevelResponse {
  level: Level;
}

export interface BulkUpdateRequest {
  levels: Level[];
}

export interface SurpriseBonus {
  id?: number;
  levelId: number;
  number: number;
  timeInterval: string;
  bonusPercent: number;
  paymentStatus: "paid" | "unpaid";
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface SurpriseBonusResponse {
  surpriseBonuses: SurpriseBonus[];
}

export interface SingleSurpriseBonusResponse {
  surpriseBonus: SurpriseBonus;
}

export interface ChargeBonusTableLevel {
  id?: number;
  levelId: number;
  chargeBonusNumber: number;
  type: "amount" | "time";
  data: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface ChargeBonusTableLevelResponse {
  chargeBonusTables: ChargeBonusTableLevel[];
}

export interface SingleChargeBonusTableLevelResponse {
  chargeBonusTable: ChargeBonusTableLevel;
}

// Level API functions
export const levelAPI = {
  // Get all levels with pagination
  getLevels: async (page: number = 1, perPage: number = 15): Promise<LevelResponse> => {
    return api(`admin/levels/?page=${page}&perPage=${perPage}`, {
      method: "GET",
    });
  },

  // Get a single level by ID
  getLevel: async (id: number): Promise<SingleLevelResponse> => {
    return api(`admin/levels/${id}`, {
      method: "GET",
    });
  },

  // Update an existing level
  updateLevel: async (id: number, level: Partial<Level>): Promise<SingleLevelResponse> => {
    return api(`admin/levels/${id}/update`, {
      method: "PUT",
      data: level,
    });
  },

  // Bulk update multiple levels
  bulkUpdateLevels: async (levels: Level[]): Promise<{ message: string }> => {
    return api("admin/levels/bulk-update", {
      method: "POST",
      data: { levels },
    });
  },

  // Surprise Bonus API functions
  // Get surprise bonuses for a level
  getSurpriseBonuses: async (levelId: number): Promise<SurpriseBonusResponse> => {
    return api(`admin/surprise-bonuses/level/${levelId}`, {
      method: "GET",
    });
  },

  // Create a new surprise bonus
  createSurpriseBonus: async (levelId: number, surpriseBonus: Omit<SurpriseBonus, "id" | "levelId" | "createdAt" | "updatedAt" | "deletedAt">): Promise<SingleSurpriseBonusResponse> => {
    return api(`admin/surprise-bonuses/level/${levelId}`, {
      method: "POST",
      data: surpriseBonus,
    });
  },

  // Update an existing surprise bonus
  updateSurpriseBonus: async (id: number, surpriseBonus: Partial<SurpriseBonus>): Promise<SingleSurpriseBonusResponse> => {
    return api(`admin/surprise-bonuses/${id}`, {
      method: "PUT",
      data: surpriseBonus,
    });
  },

  // Delete a surprise bonus
  deleteSurpriseBonus: async (id: number): Promise<{ message: string }> => {
    return api(`admin/surprise-bonuses/${id}`, {
      method: "DELETE",
    });
  },

  // Charge Bonus Table Level API functions
  // Get charge bonus table data for a specific level and charge bonus number
  getChargeBonusTableLevels: async (levelId: number, chargeBonusNumber: number): Promise<ChargeBonusTableLevelResponse> => {
    return api(`admin/charge-bonus-tables/level/${levelId}/charge/${chargeBonusNumber}`, {
      method: "GET",
    });
  },

  // Get a single charge bonus table entry
  getChargeBonusTableLevel: async (id: number): Promise<SingleChargeBonusTableLevelResponse> => {
    return api(`admin/charge-bonus-tables/${id}`, {
      method: "GET",
    });
  },

  // Create a new charge bonus table entry
  createChargeBonusTableLevel: async (chargeBonusTable: Omit<ChargeBonusTableLevel, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<SingleChargeBonusTableLevelResponse> => {
    return api("admin/charge-bonus-tables", {
      method: "POST",
      data: chargeBonusTable,
    });
  },

  // Update an existing charge bonus table entry
  updateChargeBonusTableLevel: async (id: number, chargeBonusTable: Partial<ChargeBonusTableLevel>): Promise<SingleChargeBonusTableLevelResponse> => {
    return api(`admin/charge-bonus-tables/${id}`, {
      method: "PUT",
      data: chargeBonusTable,
    });
  },

  // Delete a charge bonus table entry
  deleteChargeBonusTableLevel: async (id: number): Promise<{ message: string }> => {
    return api(`admin/charge-bonus-tables/${id}`, {
      method: "DELETE",
    });
  },

  // Upsert (create or update) charge bonus table data
  upsertChargeBonusTableLevel: async (chargeBonusTable: Omit<ChargeBonusTableLevel, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<SingleChargeBonusTableLevelResponse> => {
    return api("admin/charge-bonus-tables/upsert", {
      method: "POST",
      data: chargeBonusTable,
    });
  },
};

export default levelAPI;
