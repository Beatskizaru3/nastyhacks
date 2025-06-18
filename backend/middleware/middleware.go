package middleware

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"nasty/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5" // Убедитесь, что используете jwt/v5
)

var jwtSecret = []byte(os.Getenv("JWT_SECRET"))

func init() {
	if len(jwtSecret) == 0 {
		jwtSecret = []byte("super-secret-jwt-key-please-change-me")
		log.Println("Предупреждение: JWT_SECRET не установлен в переменных окружения. Используется ключ по умолчанию.")
	}
}

// AuthMiddleware проверяет наличие и валидность JWT токена.
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := c.GetHeader("Authorization")
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Необходим токен аутентификации"})
			c.Abort()
			return
		}

		if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
			tokenString = tokenString[7:]
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверный формат токена. Используйте 'Bearer <token>'"})
			c.Abort()
			return
		}

		claims := &models.UserClaims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("неожиданный метод подписи: %v", token.Header["alg"])
			}
			return jwtSecret, nil
		})

		if err != nil {
			// ИСПРАВЛЕНИЕ: Прямая проверка на jwt.ErrSignatureInvalid и jwt.ErrTokenExpired
			// В jwt/v5 ошибки валидации теперь чаще возвращаются напрямую или через Error()
			if err == jwt.ErrSignatureInvalid {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Недействительная подпись токена"})
				c.Abort()
				return
			}
			if err == jwt.ErrTokenExpired { // Это прямой тип ошибки для истекшего токена в v5
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Срок действия токена истек"})
				c.Abort()
				return
			}
			// Общая обработка других ошибок парсинга/валидации
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Не удалось разобрать токен или токен невалиден: " + err.Error()})
			c.Abort()
			return
		}

		if !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Недействительный токен"})
			c.Abort()
			return
		}

		c.Set("userID", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("userRole", claims.Role)

		c.Next()
	}
}

// AuthorizeRole проверяет роль пользователя.
func AuthorizeRole(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("userRole")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Информация о роли пользователя отсутствует. Убедитесь, что AuthMiddleware вызван."})
			c.Abort()
			return
		}

		roleStr, ok := userRole.(string)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при преобразовании роли пользователя"})
			c.Abort()
			return
		}

		found := false
		for _, allowed := range allowedRoles {
			if roleStr == allowed {
				found = true
				break
			}
		}

		if !found {
			c.JSON(http.StatusForbidden, gin.H{"error": "Недостаточно прав для выполнения операции."})
			c.Abort()
			return
		}

		c.Next()
	}
}
