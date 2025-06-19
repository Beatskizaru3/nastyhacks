package handlers

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"nasty/database"
	"nasty/models"
	"nasty/repository"
	"nasty/utils"
)

// Register - обработчик для регистрации нового пользователя
func RegisterUserHandler(c *gin.Context) {
	log.Println("Register DEBUG: Начало обработки запроса регистрации.")

	var user models.User
	// Пытаемся привязать JSON к структуре User
	if err := c.ShouldBindJSON(&user); err != nil {
		log.Printf("Register DEBUG: Ошибка при ShouldBindJSON: %v", err)
		// Для отладки также печатаем содержимое запроса, если ошибка
		bodyBytes, _ := c.GetRawData() // Получаем сырые данные запроса
		log.Printf("Register DEBUG: Сырые данные запроса при ошибке биндинга: %s", string(bodyBytes))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// --- ОЧЕНЬ ВАЖНЫЙ ЛОГ №1: Пароль, полученный от Gin ---
	// Это покажет нам, что положил Gin в user.Password из входящего JSON.
	// Если здесь пустая строка, то проблема в теге `json:"password"` (который мы уже проверяли)
	// ИЛИ в том, как фронтенд отправляет JSON.
	log.Printf("Register DEBUG: User.Username после биндинга: '%s'", user.Username)
	log.Printf("Register DEBUG: User.Email после биндинга: '%s'", user.Email)
	log.Printf("Register DEBUG: User.Password ДО хеширования (получено от Gin): '%s'", user.Password)

	// Проверяем, что пароль не пустой перед хешированием
	if user.Password == "" {
		log.Println("Register DEBUG: User.Password пуст после биндинга, хеширование невозможно.")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Пароль не может быть пустым."})
		return
	}

	// Хешируем пароль
	hashedPassword, err := utils.HashPassword(user.Password)
	if err != nil {
		log.Printf("Register DEBUG: Ошибка хеширования пароля для пользователя '%s': %v", user.Username, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось хешировать пароль"})
		return
	}
	user.Password = hashedPassword // Присваиваем хешированный пароль

	// --- ОЧЕНЬ ВАЖНЫЙ ЛОГ №2: Пароль после хеширования ---
	// Это покажет, какой пароль хранится в user.Password перед передачей в GORM.
	// Если здесь по-прежнему чистый пароль или пустая строка, значит, проблема в utils.HashPassword.
	log.Printf("Register DEBUG: User.Password ПОСЛЕ хеширования (будет сохранено): '%s'", user.Password)

	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()
	user.Role = "user" // По умолчанию роль "user"

	log.Printf("Register DEBUG: Попытка создания пользователя '%s' в базе данных...", user.Username)
	err = database.CreateUser(&user)
	if err != nil {
		log.Printf("Register DEBUG: Ошибка при создании пользователя в БД для '%s': %v", user.Username, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось зарегистрировать пользователя: " + err.Error()})
		return
	}

	log.Printf("Register DEBUG: Пользователь '%s' успешно зарегистрирован.", user.Username)
	c.JSON(http.StatusCreated, gin.H{"message": "Пользователь успешно зарегистрирован"})
}

// Login - обработчик для входа пользователя
func LoginUserHandler(c *gin.Context) {
	var req struct {
		Identifier string `json:"identifier" binding:"required"`
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

	// --- КЛЮЧЕВОЕ ИЗМЕНЕНИЕ ЗДЕСЬ: Передаем user.Username ---
	token, err := utils.GenerateJWT(fmt.Sprintf("%d", user.ID), user.Role, user.Username) // <-- ДОБАВЛЕНО user.Username
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось сгенерировать токен"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Успешный вход", "token": token})
}

// Profile - обработчик для получения данных профиля пользователя
func Profile(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Неавторизованный доступ"})
		return
	}

	userID, err := strconv.ParseUint(userIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID пользователя."})
		return
	}

	user, err := database.GetUserByID(uint(userID))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Пользователь не найден"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка сервера при получении профиля"})
		return
	}

	favoritedIDs, err := database.GetFavoriteCardIDsByUserID(uint(userID))
	if err != nil {
		log.Printf("Ошибка при получении избранных ID для пользователя %s: %v", userIDStr, err)
		favoritedIDs = []string{}
	}

	c.JSON(http.StatusOK, gin.H{
		"id":        user.ID,
		"username":  user.Username,
		"email":     user.Email,
		"role":      user.Role,
		"favorites": favoritedIDs,
	})
}

// CreateCardHandler создает новую карточку. (Требует авторизации)
func CreateCardHandler(c *gin.Context) {
	var card models.Card
	if err := c.ShouldBindJSON(&card); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных: " + err.Error()})
		return
	}

	card.ID = uuid.New() // Здесь мы ожидаем, что card.ID имеет тип uuid.UUID

	card.UploadedAt = time.Now()

	repository.AddToDb(&card)
	c.JSON(http.StatusCreated, gin.H{"message": "Карточка успешно создана", "cardId": card.ID.String()})
}

// GetCardByIDHandler возвращает одну карточку по ID. (Публичный)
func GetCardByIDHandler(c *gin.Context) {
	cardIDStr := c.Param("id")

	cardID, err := uuid.Parse(cardIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID карточки."})
		return
	}

	card, err := repository.GetCardByID(cardID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
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
	c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
	c.Header("Pragma", "no-cache")
	c.Header("Expires", "0")
	c.Header("ETag", "")

	if tagIDStr := c.Query("tagId"); tagIDStr != "" {
		tagID, err := strconv.ParseUint(tagIDStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат tagId"})
			return
		}
		uTagID := uint(tagID)
		options.TagID = &uTagID
	}

	options.SortBy = c.DefaultQuery("sortBy", "uploaded_at")
	options.SortOrder = c.DefaultQuery("sortOrder", "desc")
	options.SearchTitle = c.Query("search")

	if minDownloadsStr := c.Query("minDownloads"); minDownloadsStr != "" {
		minDownloads, err := strconv.Atoi(minDownloadsStr)
		if err != nil {
			log.Printf("Ошибка парсинга minDownloads '%s': %v", minDownloadsStr, err)
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
			log.Printf("Ошибка парсинга limit '%s': %v", limitStr, err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат limit"})
			return
		}
		options.Limit = limit
	}

	if offsetStr := c.Query("offset"); offsetStr != "" {
		offset, err := strconv.Atoi(offsetStr)
		log.Printf("Пытаемся распарсить offset: '%s'", offsetStr)
		if err != nil {
			log.Printf("Ошибка парсинга offset '%s': %v", offsetStr, err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат offset"})
			return
		}
		options.Offset = offset
	}

	log.Printf("Запрос на получение карточек с опциями: %+v", options)

	cards, err := repository.GetAllCards(options)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении карточек: " + err.Error()})
		return
	}

	totalCount, err := repository.GetTotalCardCount(options)
	if err != nil {
		log.Printf("Ошибка при получении общего количества карточек: %v", err)
		totalCount = int64(len(cards))
	}

	log.Printf("Получено %d карточек из репозитория.", len(cards))
	if len(cards) > 0 {
		log.Printf("Первая карточка: %+v", cards[0])
	} else {
		log.Println("Карточек для отправки нет.")
	}

	c.JSON(http.StatusOK, gin.H{
		"cards":      cards,
		"totalCount": totalCount,
	})
}

// UpdateCardHandler обновляет существующую карточку. (Требует авторизации)
func UpdateCardHandler(c *gin.Context) {
	cardIDStr := c.Param("id")
	var updatedCard models.Card
	if err := c.ShouldBindJSON(&updatedCard); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных: " + err.Error()})
		return
	}

	cardID, err := uuid.Parse(cardIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID карточки."})
		return
	}

	if updatedCard.ID != uuid.Nil && updatedCard.ID != cardID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID карточки в теле запроса не соответствует ID в URL"})
		return
	}
	updatedCard.ID = cardID

	err = repository.UpdateInDb(cardID, &updatedCard)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
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
	cardIDStr := c.Param("id")

	cardID, err := uuid.Parse(cardIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID карточки."})
		return
	}

	err = repository.DeleteFromDb(cardID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Карточка не найдена для удаления."})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при удалении карточки: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Карточка успешно удалена"})
}

// ToggleFavoriteHandler - добавляет/удаляет карточку из избранного (Требует авторизации)
func ToggleFavoriteHandler(c *gin.Context) {
	userIDStr := c.GetString("userID")
	cardIDStr := c.Param("cardId")

	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не авторизован."})
		return
	}

	userID, err := strconv.ParseUint(userIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID пользователя."})
		return
	}

	cardID, err := uuid.Parse(cardIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID карточки."})
		return
	}

	// *** ИСПРАВЛЕНИЕ: Передаем uint(userID) как первый аргумент, так как ToggleFavorite теперь ожидает uint ***
	err = database.ToggleFavorite(uint(userID), cardID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при обновлении избранного: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Избранное успешно обновлено."})
}

// GetUsersHandler (пример админского роута)
func GetUsersHandler(c *gin.Context) {
	users, err := database.GetAllUsers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении списка пользователей: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, users)
}
