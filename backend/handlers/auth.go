package handlers

import (
	"fmt"
	"log"
	"net/http"

	"nasty/models" // Правильный импорт для вашей модели UserClaims

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// jwtSecret - это переменная должна быть инициализирована функцией SetJWTSecret,
// которая вызывается в main.go, устанавливая секрет из .env.
var jwtSecret []byte

// SetJWTSecret устанавливает секретный ключ JWT для этого пакета.
// Эту функцию должен вызвать главный пакет (main.go) после загрузки .env.
func SetJWTSecret(secret []byte) {
	if len(secret) == 0 {
		log.Println("Внимание: JWT secret установлен в пакете handlers как пустой. Это небезопасно для продакшена.")
	}
	jwtSecret = secret
}

// AuthMiddleware проверяет наличие и валидность JWT токена.
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		log.Println("DEBUG AuthMiddleware: Начат мидлвар.")
		tokenString := c.GetHeader("Authorization")
		// log.Printf("DEBUG AuthMiddleware: Заголовок Authorization: %s", tokenString) // Не логируем полный токен для безопасности

		if tokenString == "" {
			log.Println("WARN AuthMiddleware: Заголовок Authorization отсутствует.")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Необходим токен аутентификации"})
			c.Abort()
			return
		}

		if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
			tokenString = tokenString[7:]
		} else {
			log.Println("WARN AuthMiddleware: Неверный формат токена.")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверный формат токена. Используйте 'Bearer <token>'"})
			c.Abort()
			return
		}
		// log.Printf("DEBUG AuthMiddleware: Извлеченный токен: %s...", tokenString[:min(len(tokenString), 30)]) // Не логируем полный токен

		claims := &models.UserClaims{} // ИСПОЛЬЗУЕМ models.UserClaims
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("неожиданный метод подписи: %v", token.Header["alg"])
			}
			if len(jwtSecret) == 0 { // Важная проверка секретного ключа
				return nil, fmt.Errorf("JWT secret не инициализирован в пакете handlers")
			}
			return jwtSecret, nil
		})

		if err != nil {
			log.Printf("ERROR AuthMiddleware: Ошибка парсинга или валидации токена: %v", err)
			if err == jwt.ErrSignatureInvalid {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Недействительная подпись токена"})
				c.Abort()
				return
			}
			if err == jwt.ErrTokenExpired {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Срок действия токена истек"})
				c.Abort()
				return
			}
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Не удалось разобрать токен или токен невалиден: " + err.Error()})
			c.Abort()
			return
		}

		if !token.Valid {
			log.Println("WARN AuthMiddleware: Токен невалиден.")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Недействительный токен"})
			c.Abort()
			return
		}

		// Установка данных пользователя в контекст Gin
		c.Set("userID", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("userRole", claims.Role)
		log.Printf("DEBUG AuthMiddleware: Токен валиден. Установлены userID: %s, username: %s, userRole: %s", claims.UserID, claims.Username, claims.Role)

		c.Next()
	}
}

// AuthorizeRole проверяет, имеет ли пользователь одну из разрешенных ролей.
func AuthorizeRole(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRoleAny, exists := c.Get("userRole") // Получаем по ключу "userRole"
		if !exists {
			log.Println("ERROR AuthorizeRole: userRole не найден в контексте. AuthMiddleware должен быть вызван первым.")
			c.JSON(http.StatusForbidden, gin.H{"error": "Информация о роли пользователя отсутствует"})
			c.Abort()
			return
		}

		roleStr, ok := userRoleAny.(string)
		if !ok {
			log.Printf("ERROR AuthorizeRole: userRole в контексте имеет неожиданный тип: %T", userRoleAny)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при преобразовании роли пользователя"})
			c.Abort()
			return
		}
		log.Printf("DEBUG AuthorizeRole: Получена роль пользователя из контекста: '%s'. Требуемые роли: %v", roleStr, allowedRoles)

		found := false
		for _, allowed := range allowedRoles {
			if roleStr == allowed {
				found = true
				break
			}
		}

		if !found {
			log.Printf("WARN AuthorizeRole: Пользователь с ролью '%s' не имеет требуемой роли из списка %v.", roleStr, allowedRoles)
			c.JSON(http.StatusForbidden, gin.H{"error": "Недостаточно прав для выполнения операции. Требуется роль: " + fmt.Sprint(allowedRoles)})
			c.Abort()
			return
		}
		log.Println("DEBUG AuthorizeRole: Роль пользователя подтверждена. Продолжаем.")
		c.Next()
	}
}

// min - вспомогательная функция для логирования (для ограничения длины строки).
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
