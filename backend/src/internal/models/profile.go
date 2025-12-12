package models

import (
	"time"

	"gorm.io/gorm"
)

type Profile struct {
	ID uint `json:"id"`

	UserID uint `json:"userId"`

	Name     string `json:"name"`
	Nickname string `json:"nickname"`

	BankName string `json:"bankName"`
	BankID   uint   `json:"bankId"`
	Bank     *Bank  `json:"bank" gorm:"foreignKey:BankID"`

	HolderName    string `json:"holderName"`
	AccountNumber string `json:"accountNumber" gorm:"size:50"`

	Birthday time.Time `json:"birthday,omitempty"`

	Phone         string `json:"phone" gorm:"size:50"`
	Mobile        string `json:"mobile" gorm:"size:50"`
	PhoneVerified bool   `json:"phoneVerified" gorm:"default:false"`

	Balance float64 `json:"balance" gorm:"type:float;precision:10;scale:2;default:0"`
	Roll    float64 `json:"roll" gorm:"default:0"`
	Wager   float64 `json:"wager" gorm:"type:float;precision:10;scale:2;default:0"`
	Point   int32   `json:"point"  gorm:"default:0"`
	Comp    int32   `json:"comp" gorm:"default:0"`
	Level   int32   `json:"level" gorm:"default:1"`
	Coupon  int32   `json:"coupon" gorm:"default:0"`

	Referral string `json:"referral" gorm:"size:50"`

	AvatarURL   string `json:"avatarUrl,omitempty" gorm:"size:255"`
	Bio         string `json:"bio,omitempty" gorm:"size:512"`
	SocialLinks string `json:"socialLinks,omitempty" gorm:"size:512"` // JSON or String format for external links

	LastDeposit  time.Time `json:"lastDeposit"`
	LastWithdraw time.Time `json:"lastWithdraw"`
	OrderNum     uint      `json:"orderNum" gorm:"default:1"`

	CreatedAt time.Time       `json:"createdAt"`
	UpdatedAt time.Time       `json:"updatedAt"`
	DeletedAt *gorm.DeletedAt `gorm:"index" json:"deletedAt,omitempty"`
}
