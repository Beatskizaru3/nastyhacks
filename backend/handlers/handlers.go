package handlers

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"nasty/database"
	"nasty/models"
	"nasty/utils"
)

func deleteOldFile(publicPath string) {
	if publicPath != "" {
		filePathOnServer := filepath.Join(".", publicPath)
		if _, statErr := os.Stat(filePathOnServer); statErr == nil {
			if removeErr := os.Remove(filePathOnServer); removeErr != nil {
				log.Printf("Предупреждение: Не удалось удалить старый файл %s: %v", filePathOnServer, removeErr)
			} else {
				log.Printf("Старый файл успешно удален: %s", filePathOnServer)
			}
		} else {
			log.Printf("Предупреждение: Файл по пути %s не найден на сервере (возможно, уже удален).", filePathOnServer)
		}
	}
}

// Утилитарная функция для сохранения файла
func saveFile(c *gin.Context, fileKey string, cardID uuid.UUID, subDir string) (string, error) {
	file, err := c.FormFile(fileKey)
	if err != nil {
		if err == http.ErrMissingFile {
			return "", nil
		}
		return "", fmt.Errorf("ошибка получения файла %s: %w", fileKey, err)
	}

	uploadDir := filepath.Join("./uploads", subDir)
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			return "", fmt.Errorf("не удалось создать директорию для загрузок %s: %w", uploadDir, err)
		}
	}

	filename := fmt.Sprintf("%s-%d%s", cardID.String(), time.Now().UnixNano(), filepath.Ext(file.Filename))
	filePathOnServer := filepath.Join(uploadDir, filename)

	if err := c.SaveUploadedFile(file, filePathOnServer); err != nil {
		return "", fmt.Errorf("не удалось сохранить файл %s: %w", fileKey, err)
	}
	return fmt.Sprintf("/uploads/%s/%s", subDir, filename), nil
}

// CreateCardHandler обрабатывает создание новой карточки с загрузкой изображения и файла скрипта.
func CreateCardHandler(c *gin.Context) {
	log.Println("DEBUG: CreateCardHandler: Начат обработка запроса POST /admin/cards")

	var card models.Card

	// 1. Получение полей из формы
	card.Title = c.PostForm("title")
	log.Printf("DEBUG: CreateCardHandler: Получен Title: %s", card.Title)

	card.Description = c.PostForm("description")
	log.Printf("DEBUG: CreateCardHandler: Получен Description: %s", card.Description)

	// 2. Обработка TagID
	tagIDStr := c.PostForm("tagId")
	log.Printf("DEBUG: CreateCardHandler: Получен TagID (строка): %s", tagIDStr)
	if tagIDStr == "" {
		log.Println("ERROR: CreateCardHandler: Тег является обязательным (пустая строка).")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Тег является обязательным."})
		return
	}
	parsedTagID, err := strconv.ParseUint(tagIDStr, 10, 64)
	if err != nil {
		log.Printf("ERROR: CreateCardHandler: Неверный формат ID тега '%s': %v", tagIDStr, err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID тега."})
		return
	}
	card.TagID = uint(parsedTagID)
	log.Printf("DEBUG: CreateCardHandler: Parsed TagID (uint): %d", card.TagID)

	// 3. Проверка обязательных полей
	if card.Title == "" || card.Description == "" {
		log.Println("ERROR: CreateCardHandler: Название или описание отсутствуют.")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Название и описание являются обязательными."})
		return
	}

	// 4. Получение UploaderID из контекста
	userIDAny, exists := c.Get("userID")
	if !exists {
		log.Println("ERROR: CreateCardHandler: Uploader ID не найден в контексте (middleware отсутствует или не сработал).")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не авторизован или ID не найден."})
		return
	}
	uploaderIDStr, ok := userIDAny.(string) // Убедитесь, что userID в контексте - это строка
	if !ok {
		log.Printf("ERROR: CreateCardHandler: Неожиданный тип для userID в контексте: %T", userIDAny)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения Uploader ID из контекста."})
		return
	}
	log.Printf("DEBUG: CreateCardHandler: Получен Uploader ID (строка) из контекста: %s", uploaderIDStr)
	uploaderID, err := strconv.ParseUint(uploaderIDStr, 10, 64)
	if err != nil {
		log.Printf("ERROR: CreateCardHandler: Ошибка парсинга Uploader ID '%s': %v", uploaderIDStr, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка парсинга Uploader ID."})
		return
	}
	card.UploaderID = uint(uploaderID)
	log.Printf("DEBUG: CreateCardHandler: Parsed Uploader ID (uint): %d", card.UploaderID)

	// 5. Генерация UUID для Card ID
	card.ID = uuid.New()
	log.Printf("DEBUG: CreateCardHandler: Сгенерирован новый Card ID: %s", card.ID.String())

	// 6. Сохранение файла изображения
	log.Println("DEBUG: CreateCardHandler: Попытка сохранить файл изображения.")
	imgPath, err := saveFile(c, "image", card.ID, "images") // Убедитесь, что saveFile доступен
	if err != nil {
		log.Printf("ERROR: CreateCardHandler: Ошибка при сохранении изображения: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при сохранении изображения: " + err.Error()})
		return
	}
	card.ImagePath = imgPath
	log.Printf("DEBUG: CreateCardHandler: Изображение сохранено по пути: %s", card.ImagePath)

	// 7. Сохранение файла скрипта
	log.Println("DEBUG: CreateCardHandler: Попытка сохранить файл скрипта.")
	filePath, err := saveFile(c, "scriptFile", card.ID, "scripts") // Убедитесь, что saveFile доступен
	if err != nil {
		log.Printf("ERROR: CreateCardHandler: Ошибка при сохранении файла скрипта: %v", err)
		// Если скрипт не сохранился, удаляем сохраненное изображение, если оно есть
		if card.ImagePath != "" {
			fullImagePath := filepath.Join(".", card.ImagePath) // Важно: путь должен быть полным
			if removeErr := os.Remove(fullImagePath); removeErr != nil {
				log.Printf("ERROR: CreateCardHandler: Не удалось удалить изображение '%s' после ошибки сохранения скрипта: %v", fullImagePath, removeErr)
			} else {
				log.Printf("DEBUG: CreateCardHandler: Удалено изображение '%s' после ошибки сохранения скрипта.", fullImagePath)
			}
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при сохранении файла скрипта: " + err.Error()})
		return
	}
	card.FilePath = filePath
	log.Printf("DEBUG: CreateCardHandler: Файл скрипта сохранен по пути: %s", card.FilePath)

	// 8. Добавление карточки в базу данных
	log.Println("DEBUG: CreateCardHandler: Попытка добавить карточку в БД.")
	err = database.AddToDb(&card) // Используем database.AddToDb
	if err != nil {
		log.Printf("ERROR: CreateCardHandler: Ошибка при добавлении карточки в БД: %v", err)
		// Удаляем сохраненные файлы, если возникла ошибка БД
		if card.ImagePath != "" {
			fullImagePath := filepath.Join(".", card.ImagePath)
			if removeErr := os.Remove(fullImagePath); removeErr != nil {
				log.Printf("ERROR: CreateCardHandler: Не удалось удалить изображение '%s' после ошибки БД: %v", fullImagePath, removeErr)
			}
		}
		if card.FilePath != "" {
			fullFilePath := filepath.Join(".", card.FilePath)
			if removeErr := os.Remove(fullFilePath); removeErr != nil {
				log.Printf("ERROR: CreateCardHandler: Не удалось удалить файл скрипта '%s' после ошибки БД: %v", fullFilePath, removeErr)
			}
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при создании карточки в базе данных: " + err.Error()})
		return
	}
	log.Println("DEBUG: CreateCardHandler: Карточка успешно добавлена в БД.")

	// 9. Успешный ответ
	c.JSON(http.StatusCreated, gin.H{
		"message":  "Карточка успешно создана",
		"id":       card.ID.String(),
		"imageUrl": card.ImagePath,
		"filePath": card.FilePath,
	})
	log.Println("DEBUG: CreateCardHandler: Запрос POST /admin/cards успешно завершен.")
}

// Register - обработчик для регистрации нового пользователя
func RegisterUserHandler(c *gin.Context) {
	log.Println("Register DEBUG: Начало обработки запроса регистрации.")

	var user models.User
	if err := c.ShouldBindJSON(&user); err != nil {
		log.Printf("Register DEBUG: Ошибка при ShouldBindJSON: %v", err)
		bodyBytes, _ := c.GetRawData()
		log.Printf("Register DEBUG: Сырые данные запроса при ошибке биндинга: %s", string(bodyBytes))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("Register DEBUG: User.Username после биндинга: '%s'", user.Username)
	log.Printf("Register DEBUG: User.Email после биндинга: '%s'", user.Email)
	log.Printf("Register DEBUG: User.Password ДО хеширования (получено от Gin): '%s'", user.Password)

	if user.Password == "" {
		log.Println("Register DEBUG: User.Password пуст после биндинга, хеширование невозможно.")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Пароль не может быть пустым."})
		return
	}

	hashedPassword, err := utils.HashPassword(user.Password)
	if err != nil {
		log.Printf("Register DEBUG: Ошибка хеширования пароля для пользователя '%s': %v", user.Username, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось хешировать пароль"})
		return
	}
	user.Password = hashedPassword

	log.Printf("Register DEBUG: User.Password ПОСЛЕ хеширования (будет сохранено): '%s'", user.Password)

	user.Role = "user"

	log.Printf("Register DEBUG: Попытка создания пользователя '%s' в базе данных...", user.Username)
	err = database.CreateUser(&user) // Используем database.CreateUser
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

	user, err = database.GetUserByEmail(req.Identifier) // Используем database.GetUserByEmail
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			user, err = database.GetUserByUsername(req.Identifier) // Используем database.GetUserByUsername
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

	token, err := utils.GenerateJWT(fmt.Sprintf("%d", user.ID), user.Role, user.Username)
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

	user, err := database.GetUserByID(uint(userID)) // Используем database.GetUserByID
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Пользователь не найден"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка сервера при получении профиля"})
		return
	}

	favoritedIDs, err := database.GetFavoriteCardIDsByUserID(uint(userID)) // Используем database.GetFavoriteCardIDsByUserID
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

// GetCardByIDHandler возвращает одну карточку по ID. (Публичный)
func GetCardByIDHandler(c *gin.Context) {
	cardIDStr := c.Param("id")

	cardID, err := uuid.Parse(cardIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID карточки."})
		return
	}

	card, err := database.GetCardByIDfunc(cardID) // Используем database.GetCardByIDfunc
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
	var options database.GetAllCardsOptions
	c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
	c.Header("Pragma", "no-cache")
	c.Header("Expires", "0")
	c.Header("ETag", "")

	// ... (остальной код получения параметров из запроса, как у вас) ...
	if tagIDStr := c.Query("tagId"); tagIDStr != "" {
		tagID, err := strconv.ParseUint(tagIDStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат tagId"})
			return
		}
		uTagID := uint(tagID)
		options.TagID = &uTagID
	}

	// --- ИЗМЕНЕНИЯ ЗДЕСЬ ---
	// Получаем sortBy и преобразуем его в имя столбца БД
	sortByParam := c.DefaultQuery("sortBy", "recent") // "recent" по умолчанию для фронтенда
	switch sortByParam {
	case "recent":
		options.SortBy = "uploaded_at" // Имя столбца для "recent"
		options.SortOrder = "desc"     // Для "recent" обычно desc
	case "popular":
		options.SortBy = "download_count" // Пример: столбец для популярных
		options.SortOrder = "desc"
	case "title": // Если вы хотите сортировать по названию
		options.SortBy = "title"
		options.SortOrder = c.DefaultQuery("sortOrder", "asc") // Позволяем менять asc/desc для названия
	// Добавьте другие варианты сортировки по мере необходимости
	default:
		// Если пришло что-то неожиданное, используем безопасное значение по умолчанию
		options.SortBy = "uploaded_at"
		options.SortOrder = "desc"
	}
	log.Printf("DEBUG: GetAllCardsHandler: sortByParam '%s' преобразован в SortBy: '%s', SortOrder: '%s'", sortByParam, options.SortBy, options.SortOrder)
	// --- КОНЕЦ ИЗМЕНЕНИЙ ---

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
	} else {
		options.Limit = 9 // Установите лимит по умолчанию, если он не указан
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
	} else {
		options.Offset = 0 // Установите смещение по умолчанию
	}

	log.Printf("Запрос на получение карточек с опциями: %+v", options)

	cards, err := database.GetAllCards(options)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении карточек: " + err.Error()})
		return
	}

	totalCount, err := database.GetTotalCardCount(options)
	if err != nil {
		log.Printf("Ошибка при получении общего количества карточек: %v", err)
		totalCount = int64(len(cards)) // Fallback, если не удалось получить общее количество
	}

	log.Printf("Получено %d карточек из базы данных.", len(cards))
	if len(cards) > 0 {
		log.Printf("Первая карточка (ID: %s, Title: %s)", cards[0].ID.String(), cards[0].Title)
	} else {
		log.Println("Карточек для отправки нет.")
	}

	c.JSON(http.StatusOK, gin.H{
		"cards":      cards,
		"totalCount": totalCount,
	})
}

// UpdateCardHandler обрабатывает обновление существующей карточки с возможностью изменения изображений и файлов.
func UpdateCardHandler(c *gin.Context) {
	cardIDStr := c.Param("id")
	cardID, err := uuid.Parse(cardIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID карточки."})
		return
	}

	existingCard, err := database.GetCardByIDfunc(cardID) // Используем database.GetCardByIDfunc
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Карточка не найдена для обновления."})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения существующей карточки: " + err.Error()})
		return
	}

	if title := c.PostForm("title"); title != "" {
		existingCard.Title = title
	}
	if desc := c.PostForm("description"); desc != "" {
		existingCard.Description = desc
	}
	if tagIDStr := c.PostForm("tagId"); tagIDStr != "" {
		if parsedTagID, err := strconv.ParseUint(tagIDStr, 10, 64); err == nil {
			existingCard.TagID = uint(parsedTagID)
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID тега."})
			return
		}
	}

	newImgPath, err := saveFile(c, "image", cardID, "images")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if newImgPath != "" {
		deleteOldFile(existingCard.ImagePath)
		existingCard.ImagePath = newImgPath
	} else if c.PostForm("clearImage") == "true" {
		deleteOldFile(existingCard.ImagePath)
		existingCard.ImagePath = ""
	}

	newScriptPath, err := saveFile(c, "scriptFile", cardID, "scripts")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if newScriptPath != "" {
		deleteOldFile(existingCard.FilePath)
		existingCard.FilePath = newScriptPath
	} else if c.PostForm("clearScriptFile") == "true" {
		deleteOldFile(existingCard.FilePath)
		existingCard.FilePath = ""
	}

	// Создаем временную модель, чтобы обновить только переданные поля.
	// Использование существующей карточки (existingCard) напрямую в Updates()
	// может привести к обновлению всех полей, включая те, что не были изменены.
	// Лучше использовать struct{} с нужными полями.
	// Однако, если existingCard уже содержит все нужные обновления, то такой вызов тоже сработает.
	// Для чистоты и избежания неожиданных побочных эффектов, если
	// существующая карточка содержит другие, не связанные с обновлением полей данные,
	// можно создать новую структуру с обновленными полями.
	// Например:
	// updates := models.Card{
	// 	Title: existingCard.Title,
	// 	Description: existingCard.Description,
	// 	TagID: existingCard.TagID,
	// 	ImagePath: existingCard.ImagePath,
	// 	FilePath: existingCard.FilePath,
	// }
	// err = database.UpdateInDb(cardID, &updates)
	// Но пока оставим как есть, если existingCard - это именно та модель, которую ты хочешь сохранить.
	err = database.UpdateInDb(cardID, existingCard) // Используем database.UpdateInDb
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Карточка не найдена для обновления."})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при обновлении карточки в базе данных: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Карточка успешно обновлена",
		"imageUrl": existingCard.ImagePath,
		"filePath": existingCard.FilePath,
	})
}

func DeleteCardHandler(c *gin.Context) {
	cardIDStr := c.Param("id")
	cardID, err := uuid.Parse(cardIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID карточки."})
		return
	}

	cardToDelete, err := database.GetCardByIDfunc(cardID) // Используем database.GetCardByIDfunc
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Карточка не найдена для удаления."})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения карточки для удаления: " + err.Error()})
		return
	}

	err = database.DeleteFromDb(cardID) // Используем database.DeleteFromDb
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Карточка не найдена для удаления."})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при удалении карточки из базы данных: " + err.Error()})
		return
	}

	deleteOldFile(cardToDelete.ImagePath)
	deleteOldFile(cardToDelete.FilePath)

	c.JSON(http.StatusOK, gin.H{"message": "Карточка и связанные файлы успешно удалены"})
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

	err = database.ToggleFavorite(uint(userID), cardID) // Используем database.ToggleFavorite
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при обновлении избранного: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Избранное успешно обновлено."})
}

// GetFavoriteCardsHandler обрабатывает запрос на получение полных объектов избранных карточек
func GetFavoriteCardsHandler(c *gin.Context) {
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

	favoritedUUIDsStrings, err := database.GetFavoriteCardIDsByUserID(uint(userID)) // Используем database.GetFavoriteCardIDsByUserID
	if err != nil {
		log.Printf("Ошибка при получении избранных ID для пользователя %s: %v", userIDStr, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении списка избранного."})
		return
	}

	if len(favoritedUUIDsStrings) == 0 {
		c.JSON(http.StatusOK, []models.Card{})
		return
	}

	var favoritedUUIDs []uuid.UUID
	for _, idStr := range favoritedUUIDsStrings {
		u, parseErr := uuid.Parse(idStr)
		if parseErr != nil {
			log.Printf("Ошибка парсинга UUID избранной карточки '%s': %v", idStr, parseErr)
			continue
		}
		favoritedUUIDs = append(favoritedUUIDs, u)
	}

	if len(favoritedUUIDs) == 0 {
		c.JSON(http.StatusOK, []models.Card{})
		return
	}

	favoriteCards, err := database.GetCardsByUUIDs(favoritedUUIDs) // Используем database.GetCardsByUUIDs
	if err != nil {
		log.Printf("Ошибка при получении избранных карточек по UUID: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении детальной информации об избранных карточках."})
		return
	}

	c.JSON(http.StatusOK, favoriteCards)
}

// GetAllTagsHandler - получает все доступные теги
func GetAllTagsHandler(c *gin.Context) {
	tags, err := database.GetAllTagsFromDB() // Используем database.GetAllTagsFromDB
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении тегов: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, tags)
}

// IncrementDownloadCountHandler увеличивает счетчик загрузок для карточки
func IncrementDownloadCountHandler(c *gin.Context) {
	cardIDStr := c.Param("id")
	cardID, err := uuid.Parse(cardIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID карточки."})
		return
	}

	card, err := database.GetCardByIDfunc(cardID) // Получаем карточку через database
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Карточка не найдена."})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении карточки: " + err.Error()})
		return
	}

	card.DownloadCount++
	card.RealDownloadsCount++

	// Создаем временную модель, содержащую только те поля, которые мы хотим обновить.
	// Это предотвращает случайное обнуление других полей.
	updates := models.Card{
		DownloadCount:      card.DownloadCount,
		RealDownloadsCount: card.RealDownloadsCount,
	}

	if err := database.UpdateInDb(cardID, &updates); err != nil { // Передаем только те поля, которые нужно обновить
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось обновить счетчик загрузок: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Счетчик загрузок обновлен", "newDownloadCount": card.DownloadCount})
}

func GetUsersHandler(c *gin.Context) {
	users, err := database.GetAllUsers() // Используем функцию из database пакета
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении пользователей: " + err.Error()})
		return
	}

	// Опционально: очищаем пароли перед отправкой клиенту
	// Это уже сделано в database.GetAllUsers, но можно перепроверить
	for i := range users {
		users[i].Password = "" // Убеждаемся, что пароли не отправляются
	}

	c.JSON(http.StatusOK, users)
}
