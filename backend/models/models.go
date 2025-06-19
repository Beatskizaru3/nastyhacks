package models

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID        uint   `gorm:"primaryKey"`
	Username  string `gorm:"unique;not null" json:"username" binding:"required"`
	Email     string `gorm:"unique;not null" json:"email" binding:"required,email"`
	Password  string `gorm:"not null" json:"password"` // <--- ДОЛЖНО БЫТЬ ТАК
	Role      string `gorm:"not null;default:'user'"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

type UserClaims struct {
	UserID   string `json:"user_id"`
	Role     string `json:"role"`
	Username string `json:"username"` // <-- ДОБАВЬ ЭТО ПОЛЕ!
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

// Favorite представляет запись об избранном
type Favorite struct {
	// ID - первичный ключ, GORM по умолчанию использует 'id'
	// Если ты хочешь SERIAL, можешь использовать `gorm:"primaryKey"`
	ID uint `gorm:"primaryKey"` // Если ты хочешь SERIAL, uint подойдет

	// UserID должен соответствовать типу ID в таблице пользователей
	// Если ID пользователя - int в базе, используй int
	UserID uint `gorm:"not null"` // Пример для int UserID

	// CardID должен соответствовать типу ID в таблице карточек (UUID)
	CardID uuid.UUID `gorm:"type:uuid;not null"` // Указываем тип UUID для PostgreSQL

	CreatedAt time.Time // GORM автоматически заполняет CreatedAt и UpdatedAt
	// UpdatedAt time.Time // Если тебе нужно UpdatedAt

	// Можешь добавить отношения, если хочешь, например:
	// User User `gorm:"foreignKey:UserID"`
	// Card Card `gorm:"foreignKey:CardID"`
}
type Card struct {
	gorm.Model `json:"-"` // <-- ДОБАВЛЕНО: Встраиваем gorm.Model. json:"-" означает, что эти поля не будут в JSON-ответе.
	// Если тебе нужны CreatedAt, UpdatedAt, DeletedAt в JSON, удали `json:"-"`
	// или явно объяви их в структуре.

	ID            uuid.UUID `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"ID"`
	Title         string    `gorm:"not null" json:"Title"`
	Description   string    `json:"Description"`
	DownloadCount int       `gorm:"default:0" json:"DownloadCount"`
	UploadedAt    time.Time `json:"UploadedAt"`
	// ИСПРАВЛЕНО: Добавлен gorm-тег для явного маппинга
	ImagePath string `gorm:"column:img_path" json:"ImagePath"`
	TagID     uint   `gorm:"column:tag_id" json:"TagID"` // <-- ДОБАВЛЕНО: Для маппинга tag_id
	// Если тебе нужны другие поля из БД, такие как file_path, real_downloads_count и т.д.,
	// их также нужно добавить сюда с соответствующими gorm-тегами:
	FilePath           string `gorm:"column:file_path" json:"FilePath"`
	RealDownloadsCount int    `gorm:"column:real_downloads_count" json:"RealDownloadsCount"`
	FakeDownloadsCount int    `gorm:"column:fake_downloads_count" json:"FakeDownloadsCount"`
	RealDownloadCount  int    `gorm:"column:real_download_count" json:"RealDownloadCount"`
}
