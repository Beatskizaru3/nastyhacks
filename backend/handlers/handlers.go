package handlers

import (
	"fmt"
	"log"
	"net/http"
	"strconv" // Для конвертации строк в числа
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid" // Для генерации UUID
	"gorm.io/gorm"           // Для проверки gorm.ErrRecordNotFound

	"nasty/database"
	"nasty/models"     // Путь к вашей модели Card и User
	"nasty/repository" // Путь к вашему репозиторию
	"nasty/utils"      // Для работы с JWT и хешированием паролей
)

// Register - обработчик для регистрации нового пользователя
func Register(c *gin.Context) {
	var user models.User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Хешируем пароль
	hashedPassword, err := utils.HashPassword(user.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось хешировать пароль"})
		return
	}
	user.Password = hashedPassword
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()
	user.Role = "user" // По умолчанию роль "user"

	// ИСПРАВЛЕНИЕ 2: user.ID - тип uint. uuid.New().String() - тип string.
	// Если user.ID должен быть uint, вам НЕ НУЖЕН uuid.
	// Если user.ID должен быть string (как UUID), тогда измените тип в модели models.User
	// и в функциях репозитория, которые работают с ID пользователя.
	// Предполагаем, что user.ID должен быть UUID (string) для консистентности с card.ID.
	// Если же user.ID должен быть uint, просто удалите эту строку:
	user.ID = uuid.New().String() // Генерация UUID для пользователя. Если ID в модели uint, это вызовет ошибку!

	err = database.CreateUser(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось зарегистрировать пользователя: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Пользователь успешно зарегистрирован"})
}

// Login - обработчик для входа пользователя
// Login - обработчик для входа пользователя
func Login(c *gin.Context) {
	var req struct {
		Identifier string `json:"identifier" binding:"required"` // Может быть email или username
		Password   string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user *models.User
	var err error

	user, err = database.GetUserByEmail(req.Identifier)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			user, err = database.GetUserByUsername(req.Identifier)
			if err != nil {
				if err == gorm.ErrRecordNotFound {
					c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверное имя пользователя или пароль"})
					return
				}
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка сервера при входе"})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка сервера при входе"})
			return
		}
	}

	if !utils.CheckPasswordHash(req.Password, user.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверное имя пользователя или пароль"})
		return
	}

	// ИСПРАВЛЕНИЕ: user.ID уже string, поэтому передаем его напрямую
	token, err := utils.GenerateJWT(user.ID, user.Role) // user.ID уже string
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось сгенерировать токен"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Успешный вход", "token": token})
}

// Profile - обработчик для получения данных профиля пользователя
func Profile(c *gin.Context) {
	userID := c.GetString("userID") // ID пользователя из JWT, установленный AuthMiddleware
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Неавторизованный доступ"})
		return
	}

	user, err := database.GetUserByID(userID) // ИСПРАВЛЕНИЕ: database.GetUserByID или repository.GetUserByID
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Пользователь не найден"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка сервера при получении профиля"})
		return
	}

	// Получаем избранные ID карточек
	favoritedIDs, err := database.GetFavoriteCardIDsByUserID(userID) // ИСПРАВЛЕНИЕ: database.GetFavoriteCardIDsByUserID или repository.GetFavoriteCardIDsByUserID
	if err != nil {
		log.Printf("Ошибка при получении избранных ID для пользователя %s: %v", userID, err)
		// Не возвращаем ошибку клиенту, так как это не критично для профиля
		favoritedIDs = []string{}
	}

	c.JSON(http.StatusOK, gin.H{
		"id":        user.ID,
		"username":  user.Username,
		"email":     user.Email,
		"role":      user.Role,
		"favorites": favoritedIDs, // Добавляем список избранных ID
		// Не отправляйте хеш пароля клиенту!
	})
}

// CreateCardHandler создает новую карточку. (Требует авторизации)
func CreateCardHandler(c *gin.Context) {
	var card models.Card
	if err := c.ShouldBindJSON(&card); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных: " + err.Error()})
		return
	}

	// Предполагаем, что card.ID в models.Card - это string (UUID)
	card.ID = uuid.New().String() // Генерация UUID для карточки
	card.UploadedAt = time.Now()  // Устанавливаем время загрузки

	repository.AddToDb(&card) // Используем вашу функцию из репозитория
	c.JSON(http.StatusCreated, gin.H{"message": "Карточка успешно создана", "cardId": card.ID})
}

// GetCardByIDHandler возвращает одну карточку по ID. (Публичный)
func GetCardByIDHandler(c *gin.Context) {
	cardID := c.Param("id")

	card, err := repository.GetCardByID(cardID) // Используем вашу функцию из репозитория
	if err != nil {
		// Проверяем на конкретную ошибку "не найдено"
		if err.Error() == fmt.Sprintf("Карточка с ID %s не найдена", cardID) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Карточка не найдена."})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при загрузке данных: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, card)
}

// GetAllCardsHandler возвращает все карточки с фильтрацией и пагинацией. (Публичный)
func GetAllCardsHandler(c *gin.Context) {
	var options repository.GetAllCardsOptions

	// Парсинг параметров запроса
	if tagIDStr := c.Query("tagId"); tagIDStr != "" {
		tagID, err := strconv.ParseUint(tagIDStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат tagId"})
			return
		}
		uTagID := uint(tagID)
		options.TagID = &uTagID
	}

	options.SortBy = c.DefaultQuery("sortBy", "uploaded_at") // По умолчанию сортировка по дате загрузки
	options.SortOrder = c.DefaultQuery("sortOrder", "desc")  // По умолчанию по убыванию
	options.SearchTitle = c.Query("search")

	if minDownloadsStr := c.Query("minDownloads"); minDownloadsStr != "" {
		minDownloads, err := strconv.Atoi(minDownloadsStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат minDownloads"})
			return
		}
		options.MinDownloads = &minDownloads
	}

	if uploadDateStr := c.Query("uploadDate"); uploadDateStr != "" {
		options.UploadDate = &uploadDateStr
	}

	if limitStr := c.Query("limit"); limitStr != "" {
		limit, err := strconv.Atoi(limitStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат limit"})
			return
		}
		options.Limit = limit
	}

	if offsetStr := c.Query("offset"); offsetStr != "" {
		offset, err := strconv.Atoi(offsetStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат offset"})
			return
		}
		options.Offset = offset
	}

	cards, err := repository.GetAllCards(options)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении карточек: " + err.Error()})
		return
	}

	totalCount, err := repository.GetTotalCardCount(options)
	if err != nil {
		log.Printf("Ошибка при получении общего количества карточек: %v", err)
		totalCount = int64(len(cards)) // Fallback к количеству в текущем запросе
	}

	c.JSON(http.StatusOK, gin.H{
		"cards":      cards,
		"totalCount": totalCount,
	})
}

// UpdateCardHandler обновляет существующую карточку. (Требует авторизации)
func UpdateCardHandler(c *gin.Context) {
	cardID := c.Param("id")
	var updatedCard models.Card
	if err := c.ShouldBindJSON(&updatedCard); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных: " + err.Error()})
		return
	}

	// Убедитесь, что ID в теле запроса (если есть) соответствует ID из URL
	if updatedCard.ID != "" && updatedCard.ID != cardID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID карточки в теле запроса не соответствует ID в URL"})
		return
	}
	updatedCard.ID = cardID // Устанавливаем ID для обновления

	err := repository.UpdateInDb(cardID, &updatedCard)
	if err != nil {
		if err.Error() == fmt.Sprintf("Запись с ID %s не найдена для обновления", cardID) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Карточка не найдена для обновления."})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при обновлении карточки: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Карточка успешно обновлена"})
}

// DeleteCardHandler удаляет карточку. (Требует авторизации)
func DeleteCardHandler(c *gin.Context) {
	cardID := c.Param("id")

	err := repository.DeleteFromDb(cardID)
	if err != nil {
		if err.Error() == fmt.Sprintf("Запись с ID %s не найдена для удаления", cardID) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Карточка не найдена для удаления."})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при удалении карточки: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Карточка успешно удалена"})
}

// ToggleFavoriteHandler - добавляет/удаляет карточку из избранного (Требует авторизации)
func ToggleFavoriteHandler(c *gin.Context) { // ИСПРАВЛЕНИЕ 1: Changed *hostnames.Context to *gin.Context
	userID := c.GetString("userID") // Получаем userID из контекста, установленного AuthMiddleware
	cardID := c.Param("cardId")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не авторизован."})
		return
	}

	// ИСПРАВЛЕНИЕ 3: Вызывайте функции из пакета repository, а не database,
	// если repository предназначен для всех операций с БД.
	err := database.ToggleFavorite(userID, cardID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при обновлении избранного: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Избранное успешно обновлено."})
}

// GetUsersHandler (пример админского роута)
func GetUsersHandler(c *gin.Context) {
	// Можно добавить проверку роли администратора здесь, если middleware не делает это автоматически
	// userRole := c.GetString("userRole")
	// if userRole != "admin" {
	// 	c.JSON(http.StatusForbidden, gin.H{"error": "Доступ запрещен. Требуется роль администратора."})
	// 	return
	// }

	// ИСПРАВЛЕНИЕ 3: Вызывайте функции из пакета repository, а не database.
	users, err := database.GetAllUsers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении списка пользователей: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, users)
}
