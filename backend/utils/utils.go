// nasty/utils/utils.go
package utils

import (
	"fmt"
	"log"
	"nasty/models"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var jwtSecret []byte // Эта переменная будет инициализирована извне

// JWTClaims определяет структуру для кастомных утверждений в JWT
type JWTClaims struct {
	UserID string `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// SetJWTSecret устанавливает секретный ключ JWT для этого пакета.
// Эту функцию должен вызвать главный пакет (main.go) после загрузки .env.
func SetJWTSecret(secret []byte) {
	// Здесь можно добавить логирование, если секрет пустой,
	// но основную проверку лучше оставить в main.go
	jwtSecret = secret
}

// GenerateJWT генерирует JWT токен
func GenerateJWT(userID string, role string, username string) (string, error) { // <-- ДОБАВЛЕН username!
	if len(jwtSecret) == 0 {
		return "", fmt.Errorf("JWT secret not initialized in utils package")
	}

	expirationTime := time.Now().Add(24 * time.Hour)

	claims := &models.JWTClaims{ // Используй ту же структуру, что и в твоём коде
		UserID:   userID,
		Role:     role,
		Username: username, // <-- Теперь мы можем использовать username здесь!
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// ParseJWT парсит и валидирует JWT токен
func ParseJWT(tokenString string) (*JWTClaims, error) {
	if len(jwtSecret) == 0 { // Важная проверка!
		return nil, fmt.Errorf("JWT secret not initialized in utils package")
	}
	// ... остальной код ParseJWT
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("неожиданный метод подписи: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("невалидный токен")
	}
	return claims, nil
}

// HashPassword хеширует обычный пароль с использованием bcrypt.
func HashPassword(password string) (string, error) {
	// --- НОВЫЙ ЛОГ №1: Что функция HashPassword получила ---
	log.Printf("HashPassword DEBUG: Получен пароль для хеширования (длина: %d): '%s'", len(password), password)

	// Если пароль пустой, bcrypt все равно может его хешировать, но это может указывать на проблему.
	if password == "" {
		log.Println("HashPassword DEBUG: ВНИМАНИЕ! Получен пустой пароль для хеширования.")
	}

	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("HashPassword DEBUG: Ошибка при хешировании пароля: %v", err)
		return "", fmt.Errorf("не удалось сгенерировать хеш пароля: %w", err)
	}

	hashed := string(bytes)
	// --- НОВЫЙ ЛОГ №2: Что функция HashPassword возвращает ---
	log.Printf("HashPassword DEBUG: Возвращаемый хеш пароля (длина: %d): '%s'", len(hashed), hashed)

	return hashed, nil
}

// CheckPasswordHash сравнивает хешированный пароль с обычным
func CheckPasswordHash(password, hash string) bool {
	log.Printf("CheckPasswordHash DEBUG: Сравнение: пароль '%s' (чистый) с хешем '%s'", password, hash) // DEBUG-лог
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	if err != nil {
		log.Printf("CheckPasswordHash DEBUG: Пароли НЕ совпадают: %v", err)
	} else {
		log.Println("CheckPasswordHash DEBUG: Пароли совпадают!")
	}
	return err == nil
}
