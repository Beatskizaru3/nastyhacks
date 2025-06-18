package models

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

type User struct {
	ID        string `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()"`
	Username  string `gorm:"uniqueIndex;not null"`
	Email     string `gorm:"uniqueIndex;not null"`
	Password  string `gorm:"not null"`
	Role      string `gorm:"default:'user'"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

type UserClaims struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

// Удалите или закомментируйте GetAudience() метод:
/*
func (c *UserClaims) GetAudience() (jwt.Audience, error) {
	return c.RegisteredClaims.GetAudience()
}
*/

func (c *UserClaims) GetExpirationTime() (*jwt.NumericDate, error) {
	return c.RegisteredClaims.GetExpirationTime()
}

func (c *UserClaims) GetIssuedAt() (*jwt.NumericDate, error) {
	return c.RegisteredClaims.GetIssuedAt()
}

func (c *UserClaims) GetIssuer() (string, error) {
	return c.RegisteredClaims.GetIssuer()
}

func (c *UserClaims) GetNotBefore() (*jwt.NumericDate, error) {
	return c.RegisteredClaims.GetNotBefore()
}

func (c *UserClaims) GetSubject() (string, error) {
	return c.RegisteredClaims.GetSubject()
}

type Card struct {
	ID            string `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()"`
	Title         string `gorm:"not null"`
	Description   string
	DownloadCount int `gorm:"default:0"`
	UploadedAt    time.Time
}

type Favorite struct {
	ID        uint   `gorm:"primaryKey"`
	UserID    string `gorm:"index;not null"`
	CardID    string `gorm:"index;not null"`
	CreatedAt time.Time
}
