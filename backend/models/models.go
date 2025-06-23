package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UUIDs []uuid.UUID

// Scan реализует интерфейс sql.Scanner для UUIDs
func (u *UUIDs) Scan(value interface{}) error {
	if value == nil {
		*u = nil
		return nil
	}
	// PostgreSQL jsonb возвращает []byte
	bytes, ok := value.([]byte)
	if !ok {
		return fmt.Errorf("failed to unmarshal JSONB value: %v", value)
	}
	return json.Unmarshal(bytes, u) // Десериализуем JSON в []uuid.UUID
}

// Value реализует интерфейс driver.Valuer для UUIDs
func (u UUIDs) Value() (driver.Value, error) {
	if u == nil {
		return nil, nil
	}
	// Сериализуем []uuid.UUID в JSON []byte
	bytes, err := json.Marshal(u)
	if err != nil {
		return nil, err
	}
	return string(bytes), nil // Возвращаем как строку
}

type User struct {
	ID        uint   `gorm:"primaryKey"`
	Username  string `gorm:"unique;not null" json:"username" binding:"required"`
	Email     string `gorm:"unique;not null" json:"email" binding:"required,email"`
	Password  string `gorm:"not null" json:"password"`
	Role      string `gorm:"not null;default:'user'"`
	CreatedAt time.Time
	UpdatedAt time.Time
	// --- ИЗМЕНЯЕМ ТИП ПОЛЯ Favorites на наш новый UUIDs ---
	Favorites UUIDs `gorm:"type:jsonb;default:'[]'" json:"favorites"`
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

type Card struct {
	ID        uuid.UUID      `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"ID"`
	CreatedAt time.Time      `json:"createdAt"`      // Явно указываем для JSON
	UpdatedAt time.Time      `json:"updatedAt"`      // Явно указываем для JSON
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"` // Для soft delete, скрываем из JSON

	// Оригинальные поля, которые есть в БД и должны быть в JSON
	Title         string    `gorm:"not null" json:"title"`
	Description   string    `json:"description"`
	UploadedAt    time.Time `json:"uploadedAt"`                     // Поле уже есть в твоей БД
	DownloadCount int       `gorm:"default:0" json:"downloadCount"` // Общий счетчик загрузок

	// Пути к файлам
	ImagePath string `gorm:"column:img_path" json:"imageUrl"`  // Соответствует 'img_path' в БД, json 'imageUrl'
	FilePath  string `gorm:"column:file_path" json:"filePath"` // Соответствует 'file_path' в БД, json 'filePath'

	// Поля для счетчиков загрузок
	RealDownloadsCount int `gorm:"column:real_downloads_count;default:0" json:"realDownloadsCount"` // <-- Важно: json:"realDownloadsCount"
	FakeDownloadsCount int `gorm:"column:fake_downloads_count;default:0" json:"fakeDownloadsCount"` // <-- Важно: json:"fakeDownloadsCount"

	// Связь с Tag
	TagID uint `gorm:"column:tag_id" json:"tagId"`  // Соответствует 'tag_id' в БД, json 'tagId'
	Tag   Tag  `gorm:"foreignKey:TagID" json:"tag"` // Загрузка связанного тега

	UploaderID uint `gorm:"not null" json:"uploaderId"` // ID пользователя, который загрузил
}

type Tag struct {
	ID   uint   `gorm:"primaryKey" json:"id"`
	Name string `gorm:"unique;not null" json:"name"`
}

// BeforeCreate hook для автоматической инициализации UUID и UploadedAt
func (c *Card) BeforeCreate(tx *gorm.DB) (err error) {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	// UploadedAt устанавливаем здесь, если GORM не делает это автоматически
	// или если хотим управлять им отдельно от CreatedAt.
	// Если CreatedAt от GORM.Model уже есть и используется, это поле может быть избыточным.
	// Если UploadedAt в БД существует отдельно, оставляем.
	if c.UploadedAt.IsZero() {
		c.UploadedAt = time.Now()
	}
	return
}

// BeforeUpdate hook (опционально, если нужно что-то делать перед обновлением)
func (c *Card) BeforeUpdate(tx *gorm.DB) (err error) {
	// GORM автоматически обновляет UpdatedAt
	return
}

// DownloadLog модель - регистрирует каждое скачивание
type DownloadLog struct {
	gorm.Model
	CardID       uuid.UUID `gorm:"type:uuid;not null" json:"cardId"` // ID карточки, которая была скачана
	DownloadTime time.Time `gorm:"not null" json:"downloadTime"`     // Точное время скачивания
	// UserID       uint      // Опционально: если хотите отслеживать, кто скачал (нужен FK на User)
}
