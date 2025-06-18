package handlers

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time" // Используется для jwt.NewNumericDate

	"nasty/database"
	"nasty/models"
	"nasty/utils"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5" // Правильный импорт для v5
)

// JWTSecret - секретный ключ для подписи JWT токенов.
var jwtSecret = []byte(os.Getenv("JWT_SECRET"))

func init() {
	if len(jwtSecret) == 0 {
		jwtSecret = []byte("super-secret-jwt-key-please-change-me")
		log.Println("Предупреждение: JWT_SECRET не установлен в переменных окружения. Используется ключ по умолчанию.")
	}
}

// RegisterUserHandler обрабатывает запрос регистрации пользователя.
func RegisterUserHandler(c *gin.Context) {
	var input struct {
		Username string `json:"username" binding:"required"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user := models.User{
		Username: input.Username,
		Email:    input.Email,
		Password: input.Password,
		Role:     "user",
	}

	if err := database.CreateUser(&user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось зарегистрировать пользователя: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Пользователь успешно зарегистрирован!"})
}

// LoginUserHandler обрабатывает запрос логина пользователя и выдает JWT токен.
func LoginUserHandler(c *gin.Context) {
	var input struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := database.GetUserByUsername(input.Username)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверное имя пользователя или пароль"})
		return
	}

	if !utils.CheckPasswordHash(input.Password, user.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверное имя пользователя или пароль"})
		return
	}

	// Генерация JWT токена
	claims := models.UserClaims{
		UserID:   user.ID,
		Username: user.Username,
		Role:     user.Role,
		// ИСПРАВЛЕНИЕ: Используйте jwt.RegisteredClaims вместо jwt.StandardClaims
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * 24)), // Используйте NewNumericDate
			IssuedAt:  jwt.NewNumericDate(time.Now()),                     // Используйте NewNumericDate
			Issuer:    "nasty-app",
		},
	}

	// ИСПРАВЛЕНИЕ: Передайте УКАЗАТЕЛЬ на claims в NewWithClaims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, &claims) // <-- Вот здесь было изменение
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось сгенерировать токен"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Успешный вход", "token": tokenString})
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
			// Это то, что мы делали в `middleware/auth.go` и что теперь нужно тут.
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

		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("user_role", claims.Role)

		c.Next()
	}
}

// AuthorizeRole проверяет роль пользователя.
func AuthorizeRole(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("user_role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Информация о роли пользователя отсутствует"})
			c.Abort()
			return
		}

		roleStr, ok := userRole.(string) // Добавил ok-check для type assertion
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
			c.JSON(http.StatusForbidden, gin.H{"error": "Недостаточно прав для выполнения операции. Требуется роль: " + fmt.Sprint(allowedRoles)})
			c.Abort()
			return
		}

		c.Next()
	}
}
