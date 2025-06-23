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

// deleteOldFile удаляет файл по указанному публичному пути.
// Корректно обрабатывает пути, начиная с "/uploads/".
func deleteOldFile(publicPath string) {
	if publicPath != "" {
		// Удаляем ведущий слэш, если он есть, чтобы получить локальный путь относительно корня проекта
		localPath := publicPath
		if len(localPath) > 0 && localPath[0] == '/' {
			localPath = localPath[1:]
		}
		filePathOnServer := filepath.Join(".", localPath) // Добавляем "." для правильного относительного пути

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

// saveFile - утилитарная функция для сохранения файла.
// Возвращает путь к файлу относительно корня "uploads" (например, "/uploads/images/...")
func saveFile(c *gin.Context, fileKey string, cardID uuid.UUID, subDir string) (string, error) {
	file, err := c.FormFile(fileKey)
	if err != nil {
		if err == http.ErrMissingFile {
			return "", nil // Файл не был предоставлен, это не ошибка в данном случае
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
	// Возвращаем путь, пригодный для URL (начинается с /uploads/)
	return fmt.Sprintf("/uploads/%s/%s", subDir, filename), nil
}

// IncrementDownloadCountHandler увеличивает счетчики загрузок карточки и отдает файл.
// IncrementDownloadCountHandler увеличивает счетчик загрузок и отдает файл
func IncrementDownloadCountHandler(c *gin.Context) {
	cardIDStr := c.Param("id")
	log.Printf("DEBUG: IncrementDownloadCountHandler: Получен запрос на скачивание для Card ID: %s", cardIDStr)

	// Преобразуем ID из строки в uint
	cardID, err := strconv.ParseUint(cardIDStr, 10, 64) // Используем ParseUint для беззнакового ID
	if err != nil {
		log.Printf("ERROR: IncrementDownloadCountHandler: Неверный формат ID карточки: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID карточки"})
		return
	}

	var card models.Card
	result := database.DB.Where("id = ?", cardID).First(&card)
	if result.Error != nil {
		if result.Error.Error() == "record not found" {
			log.Printf("WARNING: IncrementDownloadCountHandler: Карточка с ID %s не найдена.", cardIDStr)
			c.JSON(http.StatusNotFound, gin.H{"error": "Карточка не найдена."})
			return
		}
		log.Printf("ERROR: IncrementDownloadCountHandler: Ошибка при поиске карточки ID %s: %v", cardIDStr, result.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка базы данных при поиске карточки."})
		return
	}

	// --- ИЗМЕНЕНИЕ: Увеличиваем FakeDownloadsCount, DownloadCount и RealDownloadsCount ---
	card.DownloadCount++      // Общий счетчик
	card.RealDownloadsCount++ // Реальный счетчик
	card.FakeDownloadsCount++ // <--- ВОТ ЭТО ДОБАВЛЯЕМ/ИЗМЕНЯЕМ: Увеличиваем фейковый счетчик

	updateResult := database.DB.Save(&card) // Сохраняем обновленную карточку
	if updateResult.Error != nil {
		log.Printf("ERROR: IncrementDownloadCountHandler: Ошибка при обновлении счетчиков загрузок для ID %s: %v", cardIDStr, updateResult.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка базы данных при обновлении счетчиков."})
		return
	}
	log.Printf("DEBUG: IncrementDownloadCountHandler: Счетчик загрузок для ID %s увеличен. Новое FakeDownloadsCount: %d, DownloadCount: %d", cardIDStr, card.FakeDownloadsCount, card.DownloadCount)

	// Проверка, есть ли путь к файлу
	if card.FilePath == "" {
		log.Printf("WARNING: IncrementDownloadCountHandler: У карточки ID %s отсутствует путь к файлу.", cardIDStr)
		c.JSON(http.StatusNotFound, gin.H{"error": "Файл для этой карточки не найден."})
		return
	}

	// Определяем полный путь к файлу на сервере
	// Удаляем префикс "/uploads/" из FilePath, так как router.Static уже обрабатывает его
	filePathOnServer := fmt.Sprintf(".%s", card.FilePath) // Добавляем "." чтобы сделать путь относительным к текущей директории

	// Проверяем существование файла
	_, err = os.Stat(filePathOnServer)
	if os.IsNotExist(err) {
		log.Printf("ERROR: IncrementDownloadCountHandler: Файл не найден на диске: %s. Ошибка: %v", filePathOnServer, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Файл не найден на сервере по указанному пути."})
		return
	} else if err != nil {
		log.Printf("ERROR: IncrementDownloadCountHandler: Ошибка при проверке файла %s: %v", filePathOnServer, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка сервера при доступе к файлу."})
		return
	}

	// Отдаем файл
	fileName := filepath.Base(filePathOnServer) // Извлекаем только имя файла из пути
	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Transfer-Encoding", "binary")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", fileName))
	c.Header("Content-Type", "application/octet-stream") // Или соответствующий MIME-тип
	c.File(filePathOnServer)
	log.Printf("DEBUG: IncrementDownloadCountHandler: Файл %s успешно отдан для Card ID: %s", fileName, cardIDStr)
}

// UpdateCardDownloadsHandler обновляет фейковые счетчики скачиваний карточки.
func UpdateCardDownloadsHandler(c *gin.Context) {
	cardIDStr := c.Param("id")
	cardID, err := uuid.Parse(cardIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID карточки."})
		return
	}

	var card models.Card
	if err := database.DB.Where("id = ?", cardID).First(&card).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Карточка не найдена."})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении карточки: " + err.Error()})
		return
	}

	var updateInput struct {
		FakeDownloadsCount *int `json:"fakeDownloadsCount"` // Используем указатель для отличия отсутствия от нуля
	}

	if err := c.ShouldBindJSON(&updateInput); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверные входные данные: " + err.Error()})
		return
	}

	if updateInput.FakeDownloadsCount != nil {
		card.FakeDownloadsCount = *updateInput.FakeDownloadsCount
	}

	if err := database.DB.Save(&card).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось обновить счетчик скачиваний: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Счетчик фейковых скачиваний обновлен", "newFakeDownloadsCount": card.FakeDownloadsCount})
}

// CreateCardHandler создает новую карточку с загрузкой изображения и скрипта.
func CreateCardHandler(c *gin.Context) {
	log.Println("DEBUG: CreateCardHandler: Начат обработка запроса POST /admin/cards")

	var newCard models.Card // Используем models.Card напрямую

	// 1. Получение полей из формы
	newCard.Title = c.PostForm("title")
	log.Printf("DEBUG: CreateCardHandler: Получен Title: %s", newCard.Title)

	newCard.Description = c.PostForm("description")
	log.Printf("DEBUG: CreateCardHandler: Получен Description: %s", newCard.Description)

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
	newCard.TagID = uint(parsedTagID)
	log.Printf("DEBUG: CreateCardHandler: Parsed TagID (uint): %d", newCard.TagID)

	// 3. Проверка обязательных полей
	if newCard.Title == "" || newCard.Description == "" {
		log.Println("ERROR: CreateCardHandler: Название или описание отсутствуют.")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Название и описание являются обязательными."})
		return
	}

	// 4. Получение UploaderID из контекста
	userIDAny, exists := c.Get("userID")
	if !exists {
		log.Println("ERROR: CreateCardHandler: Uploader ID не найден в контексте. Middleware 'AuthMiddleware' не установил 'userID'.")
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

	// >>> ИСПРАВЛЕНИЕ #1: Сопоставляем тип UploaderID в модели Card
	// Если models.Card.UploaderID имеет тип uint, то парсим строку в uint.
	// Если models.Card.UploaderID имеет тип uuid.UUID, то парсим строку в uuid.UUID.
	// Судя по ошибке "cannot use uploaderID (variable of type uuid.UUID) as uint value in assignment",
	// models.Card.UploaderID - это uint.
	parsedUploaderID, err := strconv.ParseUint(uploaderIDStr, 10, 64)
	if err != nil {
		log.Printf("ERROR: CreateCardHandler: Ошибка парсинга Uploader ID '%s' в uint: %v", uploaderIDStr, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка парсинга ID загрузчика."})
		return
	}
	newCard.UploaderID = uint(parsedUploaderID) // Устанавливаем UploaderID как uint
	// <<< КОНЕЦ ИСПРАВЛЕНИЯ #1

	// 5. Генерация UUID для Card ID
	newCard.ID = uuid.New()
	log.Printf("DEBUG: CreateCardHandler: Сгенерирован новый Card ID: %s", newCard.ID.String())

	// 6. Сохранение файла изображения
	log.Println("DEBUG: CreateCardHandler: Попытка сохранить файл изображения.")
	imgPath, err := saveFile(c, "image", newCard.ID, "images")
	if err != nil {
		log.Printf("ERROR: CreateCardHandler: Ошибка при сохранении изображения: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при сохранении изображения: " + err.Error()})
		return
	}
	newCard.ImagePath = imgPath
	log.Printf("DEBUG: CreateCardHandler: Изображение сохранено по пути: %s", newCard.ImagePath)

	// 7. Сохранение файла скрипта
	log.Println("DEBUG: CreateCardHandler: Попытка сохранить файл скрипта.")
	filePath, err := saveFile(c, "scriptFile", newCard.ID, "scripts")
	if err != nil {
		log.Printf("ERROR: CreateCardHandler: Ошибка при сохранении файла скрипта: %v", err)
		// Если скрипт не сохранился, удаляем сохраненное изображение, если оно есть
		deleteOldFile(newCard.ImagePath)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при сохранении файла скрипта: " + err.Error()})
		return
	}
	newCard.FilePath = filePath
	log.Printf("DEBUG: CreateCardHandler: Файл скрипта сохранен по пути: %s", newCard.FilePath)

	// Инициализация счетчиков и времени загрузки
	newCard.UploadedAt = time.Now()
	newCard.DownloadCount = 0
	newCard.RealDownloadsCount = 0
	newCard.FakeDownloadsCount = 0

	// 8. Добавление карточки в базу данных
	log.Println("DEBUG: CreateCardHandler: Попытка добавить карточку в БД.")
	err = database.AddToDb(&newCard) // Используем database.AddToDb
	if err != nil {
		log.Printf("ERROR: CreateCardHandler: Ошибка при добавлении карточки в БД: %v", err)
		// Удаляем сохраненные файлы, если возникла ошибка БД
		deleteOldFile(newCard.ImagePath)
		deleteOldFile(newCard.FilePath)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при создании карточки в базе данных: " + err.Error()})
		return
	}
	log.Println("DEBUG: CreateCardHandler: Карточка успешно добавлена в БД.")

	// 9. Успешный ответ
	c.JSON(http.StatusCreated, gin.H{
		"message":  "Карточка успешно создана",
		"id":       newCard.ID.String(),
		"imageUrl": newCard.ImagePath,
		"filePath": newCard.FilePath,
	})
	log.Println("DEBUG: CreateCardHandler: Запрос POST /admin/cards успешно завершен.")
}

// RegisterUserHandler - обработчик для регистрации нового пользователя
func RegisterUserHandler(c *gin.Context) {
	log.Println("Register DEBUG: Начало обработки запроса регистрации.")

	var user models.User
	if err := c.ShouldBindJSON(&user); err != nil {
		log.Printf("Register DEBUG: Ошибка при ShouldBindJSON: %v", err)
		// Добавьте эту строку для отладки, чтобы увидеть сырые данные
		bodyBytes, _ := c.GetRawData()
		log.Printf("Register DEBUG: Сырые данные запроса при ошибке биндинга: %s", string(bodyBytes))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("Register DEBUG: User.Username после биндинга: '%s'", user.Username)
	log.Printf("Register DEBUG: User.Email после биндинга: '%s'", user.Email)
	// log.Printf("Register DEBUG: User.Password ДО хеширования (получено от Gin): '%s'", user.Password) // ВНИМАНИЕ: не логируйте пароли в продакшене!

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

	// log.Printf("Register DEBUG: User.Password ПОСЛЕ хеширования (будет сохранено): '%s'", user.Password) // ВНИМАНИЕ: не логируйте хешированные пароли в таком виде в продакшене!

	// Устанавливаем роль по умолчанию
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

// LoginUserHandler - обработчик для входа пользователя
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

	// Попытка найти пользователя по email
	user, err = database.GetUserByEmail(req.Identifier)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// Если по email не найден, пытаемся найти по username
			user, err = database.GetUserByUsername(req.Identifier)
			if err != nil {
				if err == gorm.ErrRecordNotFound {
					c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверное имя пользователя или пароль"})
					return
				}
				log.Printf("ERROR: LoginUserHandler: Ошибка БД при поиске пользователя по username: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка сервера при входе"})
				return
			}
		} else {
			log.Printf("ERROR: LoginUserHandler: Ошибка БД при поиске пользователя по email: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка сервера при входе"})
			return
		}
	}

	// Проверяем пароль
	if !utils.CheckPasswordHash(req.Password, user.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверное имя пользователя или пароль"})
		return
	}

	// Генерируем JWT токен. Используем utils.GenerateJWT
	// user.ID в вашей модели - uint. Если UserID в UserClaims - string (UUID), то нужно преобразовать.
	// Если UserID в UserClaims также uint (для пользователей), то оставьте fmt.Sprintf.
	token, err := utils.GenerateJWT(fmt.Sprintf("%d", user.ID), user.Role, user.Username) // Передаем username
	if err != nil {
		log.Printf("ERROR: LoginUserHandler: Не удалось сгенерировать токен для пользователя %s: %v", user.Username, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось сгенерировать токен"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Успешный вход", "token": token})
}

// Profile - обработчик для получения данных профиля пользователя
func Profile(c *gin.Context) {
	userIDStr := c.GetString("userID") // Получаем userID из контекста как строку

	if userIDStr == "" {
		log.Println("WARN: Profile: userID отсутствует в контексте.")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Неавторизованный доступ: ID пользователя отсутствует."})
		return
	}

	// Преобразуем строковый ID пользователя (который может быть UUID, если UserID в claims - UUID)
	// в тип, который используется в вашей модели User (предполагаем uint).
	userID, err := strconv.ParseUint(userIDStr, 10, 64) // Используем ParseUint для uint ID
	if err != nil {
		log.Printf("ERROR: Profile: Неверный формат ID пользователя '%s': %v", userIDStr, err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID пользователя."})
		return
	}

	user, err := database.GetUserByID(uint(userID)) // Используем database.GetUserByID
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			log.Printf("ERROR: Profile: Пользователь с ID %d не найден в БД.", userID)
			c.JSON(http.StatusNotFound, gin.H{"error": "Пользователь не найден."})
			return
		}
		log.Printf("ERROR: Profile: Ошибка БД при получении пользователя по ID %d: %v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка сервера при получении профиля."})
		return
	}

	// favorites в Profile - это список ID карточек.
	favoritedIDs, err := database.GetFavoriteCardIDsByUserID(uint(userID)) // Используем database.GetFavoriteCardIDsByUserID
	if err != nil {
		log.Printf("WARN: Profile: Ошибка при получении избранных ID для пользователя %s: %v", userIDStr, err)
		favoritedIDs = []string{} // Возвращаем пустой массив, если ошибка
	}

	c.JSON(http.StatusOK, gin.H{
		"id":        user.ID,       // Используем ID из БД
		"username":  user.Username, // Используем username из БД
		"email":     user.Email,
		"role":      user.Role, // Используем role из БД
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

// GetAllCardsHandler получает все карточки из базы данных с фильтрацией и пагинацией.
func GetAllCardsHandler(c *gin.Context) {
	var options database.GetAllCardsOptions
	c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
	c.Header("Pragma", "no-cache")
	c.Header("Expires", "0")
	c.Header("ETag", "")

	// Парсинг TagID
	if tagIDStr := c.Query("tagId"); tagIDStr != "" {
		tagID, err := strconv.ParseUint(tagIDStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат tagId"})
			return
		}
		uTagID := uint(tagID)
		options.TagID = &uTagID
	}

	// Парсинг sortBy и sortOrder
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

	// Поиск по названию
	options.SearchTitle = c.Query("search")

	// Фильтрация по минимальному количеству загрузок
	if minDownloadsStr := c.Query("minDownloads"); minDownloadsStr != "" {
		minDownloads, err := strconv.Atoi(minDownloadsStr)
		if err != nil {
			log.Printf("Ошибка парсинга minDownloads '%s': %v", minDownloadsStr, err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат minDownloads"})
			return
		}
		options.MinDownloads = &minDownloads
	}

	// Фильтрация по дате загрузки
	if uploadDateStr := c.Query("uploadDate"); uploadDateStr != "" {
		options.UploadDate = &uploadDateStr
	}

	// Пагинация: Limit
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

	// Пагинация: Offset
	if offsetStr := c.Query("offset"); offsetStr != "" {
		offset, err := strconv.Atoi(offsetStr)
		log.Printf("DEBUG: GetAllCardsHandler: Пытаемся распарсить offset: '%s'", offsetStr)
		if err != nil {
			log.Printf("ERROR: GetAllCardsHandler: Ошибка парсинга offset '%s': %v", offsetStr, err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат offset"})
			return
		}
		options.Offset = offset
	} else {
		options.Offset = 0 // Установите смещение по умолчанию
	}

	log.Printf("DEBUG: GetAllCardsHandler: Запрос на получение карточек с опциями: %+v", options)

	cards, err := database.GetAllCards(options)
	if err != nil {
		log.Printf("ERROR: GetAllCardsHandler: Ошибка при получении карточек из БД: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении карточек: " + err.Error()})
		return
	}

	totalCount, err := database.GetTotalCardCount(options)
	if err != nil {
		log.Printf("ERROR: GetAllCardsHandler: Ошибка при получении общего количества карточек: %v", err)
		totalCount = int64(len(cards)) // Fallback, если не удалось получить общее количество
	}

	log.Printf("DEBUG: GetAllCardsHandler: Получено %d карточек из базы данных. Общее количество: %d", len(cards), totalCount)
	if len(cards) > 0 {
		log.Printf("DEBUG: GetAllCardsHandler: Первая карточка (ID: %s, Title: %s)", cards[0].ID.String(), cards[0].Title)
	} else {
		log.Println("DEBUG: GetAllCardsHandler: Карточек для отправки нет.")
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

	// Получаем текущее состояние карточки как указатель
	existingCard, err := database.GetCardByIDfunc(cardID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Карточка не найдена для обновления."})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения существующей карточки: " + err.Error()})
		return
	}

	// Обновляем поля напрямую через указатель existingCard
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

	// Обработка файла изображения
	newImgPath, err := saveFile(c, "image", cardID, "images")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при загрузке изображения: " + err.Error()})
		return
	}
	if newImgPath != "" { // Если новый файл загружен
		deleteOldFile(existingCard.ImagePath)
		existingCard.ImagePath = newImgPath
	} else if c.PostForm("clearImage") == "true" { // Если запрошено удаление существующего
		deleteOldFile(existingCard.ImagePath)
		existingCard.ImagePath = ""
	}

	// Обработка файла скрипта
	newScriptPath, err := saveFile(c, "scriptFile", cardID, "scripts")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при загрузке скрипта: " + err.Error()})
		return
	}
	if newScriptPath != "" { // Если новый файл загружен
		deleteOldFile(existingCard.FilePath) // Удаляем старый файл
		existingCard.FilePath = newScriptPath
	} else if c.PostForm("clearScriptFile") == "true" { // Если запрошено удаление существующего
		deleteOldFile(existingCard.FilePath)
		existingCard.FilePath = ""
	}

	// Обновляем карточку в базе данных
	err = database.UpdateInDb(cardID, existingCard)
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

// DeleteCardHandler удаляет карточку и связанные с ней файлы.
func DeleteCardHandler(c *gin.Context) {
	cardIDStr := c.Param("id")
	cardID, err := uuid.Parse(cardIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID карточки."})
		return
	}

	// Получаем карточку, чтобы удалить связанные файлы
	var card models.Card
	if err := database.DB.Where("id = ?", cardID).First(&card).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Карточка не найдена."})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении карточки для удаления: " + err.Error()})
		return
	}

	// Удаляем связанные файлы с помощью универсальной функции deleteOldFile
	deleteOldFile(card.ImagePath)
	deleteOldFile(card.FilePath)

	if err := database.DB.Delete(&models.Card{}, "id = ?", cardID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось удалить карточку: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Карточка успешно удалена"})
}

// ToggleFavoriteHandler добавляет/удаляет карточку из избранного пользователя.
func ToggleFavoriteHandler(c *gin.Context) {
	userIDStr := c.GetString("userID") // Получаем userID из контекста как строку
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Неавторизованный доступ: ID пользователя отсутствует."})
		return
	}

	cardIDStr := c.Param("cardId")
	cardID, err := uuid.Parse(cardIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID карточки"})
		return
	}

	parsedUserID, parseErr := strconv.ParseUint(userIDStr, 10, 64)
	if parseErr != nil {
		log.Printf("ERROR: ToggleFavoriteHandler: Неверный формат userID из контекста '%s': %v", userIDStr, parseErr)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка сервера: неверный формат ID пользователя."})
		return
	}
	dbUserID := uint(parsedUserID) // Используем uint для взаимодействия с БД

	// >>> ИСПРАВЛЕНИЕ #2: Используем вашу функцию database.ToggleFavorite
	// Эта функция сама добавляет или удаляет карточку и возвращает результат
	// isAdded/isRemoved. Мы можем получить текущее состояние избранного
	// через GetUserByID и затем проверить.

	// Сначала получаем пользователя, чтобы узнать текущее состояние избранного
	user, err := database.GetUserByID(dbUserID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Пользователь не найден."})
			return
		}
		log.Printf("ERROR: ToggleFavoriteHandler: Ошибка при получении пользователя %d: %v", dbUserID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при проверке избранного пользователя."})
		return
	}

	initialFavoriteStatus := false
	for _, favID := range user.Favorites {
		if favID == cardID {
			initialFavoriteStatus = true
			break
		}
	}

	// Вызываем вашу универсальную функцию ToggleFavorite
	err = database.ToggleFavorite(dbUserID, cardID)
	if err != nil {
		log.Printf("ERROR: ToggleFavoriteHandler: Ошибка при переключении избранного для пользователя %d, карточки %s: %v", dbUserID, cardID.String(), err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при обновлении избранного."})
		return
	}

	// Проверяем новое состояние избранного после вызова ToggleFavorite
	// Для этого снова получаем пользователя или пересчитываем, основываясь на initialFavoriteStatus
	newFavoriteStatus := !initialFavoriteStatus // Если была в избранном, теперь удалена; если нет, теперь добавлена.

	if newFavoriteStatus {
		c.JSON(http.StatusOK, gin.H{"message": "Добавлено в избранное", "isFavorited": true})
	} else {
		c.JSON(http.StatusOK, gin.H{"message": "Удалено из избранного", "isFavorited": false})
	}
	// <<< КОНЕЦ ИСПРАВЛЕНИЯ #2
}

// GetFavoriteCardsHandler обрабатывает запрос на получение полных объектов избранных карточек.
func GetFavoriteCardsHandler(c *gin.Context) {
	userIDStr := c.GetString("userID") // Получаем userID из контекста
	if userIDStr == "" {
		log.Println("WARN: GetFavoriteCardsHandler: userID отсутствует в контексте.")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Неавторизованный доступ: ID пользователя отсутствует."})
		return
	}

	userID, err := strconv.ParseUint(userIDStr, 10, 64)
	if err != nil {
		log.Printf("ERROR: GetFavoriteCardsHandler: Неверный формат ID пользователя '%s': %v", userIDStr, err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID пользователя."})
		return
	}

	// Предполагаем, что database.GetFavoriteCardIDsByUserID принимает uint для userID
	favoritedUUIDsStrings, err := database.GetFavoriteCardIDsByUserID(uint(userID))
	if err != nil {
		log.Printf("ERROR: GetFavoriteCardsHandler: Ошибка при получении избранных ID для пользователя %d: %v", uint(userID), err)
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
			log.Printf("WARN: GetFavoriteCardsHandler: Ошибка парсинга UUID избранной карточки '%s': %v (пропускаем)", idStr, parseErr)
			continue
		}
		favoritedUUIDs = append(favoritedUUIDs, u)
	}

	if len(favoritedUUIDs) == 0 {
		// Все ID были некорректны или список стал пустым после фильтрации
		c.JSON(http.StatusOK, []models.Card{})
		return
	}

	favoriteCards, err := database.GetCardsByUUIDs(favoritedUUIDs)
	if err != nil {
		log.Printf("ERROR: GetFavoriteCardsHandler: Ошибка при получении избранных карточек по UUID: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении детальной информации об избранных карточках."})
		return
	}

	c.JSON(http.StatusOK, favoriteCards)
}

// GetAllTagsHandler - получает все доступные теги.
func GetAllTagsHandler(c *gin.Context) {
	tags, err := database.GetAllTagsFromDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении тегов: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, tags)
}

func GetPaginatedUsers(limit, offset int) ([]models.User, error) {
	var users []models.User
	// Используем GORM для применения лимита и смещения
	result := database.DB.Limit(limit).Offset(offset).Find(&users)
	if result.Error != nil {
		return nil, result.Error
	}
	return users, nil
}

// GetTotalUsersCount возвращает общее количество пользователей в базе данных.
func GetTotalUsersCount() (int64, error) {
	var count int64
	// Используем GORM для подсчета всех записей в таблице User
	result := database.DB.Model(&models.User{}).Count(&count)
	if result.Error != nil {
		return 0, result.Error
	}
	return count, nil
}

// GetUsersHandler получает пользователей с пагинацией и общее количество
func GetUsersHandler(c *gin.Context) {
	// Получаем параметры пагинации из запроса
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "15") // Лимит по умолчанию 15, как во фронтенде

	page, err := strconv.Atoi(pageStr)
	if err != nil || page <= 0 {
		page = 1 // Дефолтная страница 1, если некорректно
	}
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 15 // Дефолтный лимит 15, если некорректно
	}

	offset := (page - 1) * limit // Расчет смещения

	// Получаем общее количество пользователей
	totalUsersCount, err := GetTotalUsersCount()
	if err != nil {
		log.Printf("Ошибка GetTotalUsersCount: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении общего количества пользователей"})
		return
	}

	// Получаем пагинированных пользователей
	users, err := GetPaginatedUsers(limit, offset)
	if err != nil {
		log.Printf("Ошибка GetPaginatedUsers: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении пользователей"})
		return
	}

	// Формируем структурированный ответ
	c.JSON(http.StatusOK, gin.H{
		"total_count": totalUsersCount,
		"users":       users,
	})
}

// GetDownloadStatsHandler собирает статистику скачиваний для графика по периодам
func GetDownloadStatsHandler(c *gin.Context) {
	timeframe := c.Query("timeframe")
	log.Printf("DEBUG: GetDownloadStatsHandler: Запрос статистики для timeframe: %s", timeframe)

	var (
		labels []string
		data   []int64
	)

	now := time.Now()
	db := database.DB // GORM DB instance

	// Используем мапу для агрегации, чтобы обеспечить правильный порядок и нулевые значения
	// для периодов без скачиваний.
	aggregatedDataMap := make(map[string]int64)

	switch timeframe {
	case "day":
		// За последние 24 часа, по часам
		for i := 0; i < 24; i++ {
			hour := now.Add(time.Duration(i-23) * time.Hour) // От -23ч до текущего часа
			labels = append(labels, hour.Format("15:00"))

			startOfHour := time.Date(hour.Year(), hour.Month(), hour.Day(), hour.Hour(), 0, 0, 0, hour.Location())
			endOfHour := startOfHour.Add(1 * time.Hour)

			var downloadsInHour int64
			// Считаем записи в DownloadLog для каждого часа
			db.Model(&models.DownloadLog{}).
				Where("download_time BETWEEN ? AND ?", startOfHour, endOfHour).
				Count(&downloadsInHour) // Count() возвращает int64 по умолчанию

			aggregatedDataMap[hour.Format("15:00")] = downloadsInHour
		}

	case "week":
		// За последние 7 дней, по дням
		for i := 0; i < 7; i++ {
			day := now.AddDate(0, 0, i-6) // От -6 дней до сегодня
			labels = append(labels, day.Format("Mon"))

			startOfDay := time.Date(day.Year(), day.Month(), day.Day(), 0, 0, 0, 0, day.Location())
			endOfDay := startOfDay.AddDate(0, 0, 1).Add(-time.Second)

			var downloadsInDay int64
			db.Model(&models.DownloadLog{}).
				Where("download_time BETWEEN ? AND ?", startOfDay, endOfDay).
				Count(&downloadsInDay)

			aggregatedDataMap[day.Format("Mon")] = downloadsInDay
		}

	case "month":
		// За последние 30 дней, по дням
		for i := 0; i < 30; i++ {
			day := now.AddDate(0, 0, i-29) // От -29 дней до сегодня
			labels = append(labels, day.Format("02 Jan"))

			startOfDay := time.Date(day.Year(), day.Month(), day.Day(), 0, 0, 0, 0, day.Location())
			endOfDay := startOfDay.AddDate(0, 0, 1).Add(-time.Second)

			var downloadsInDay int64
			db.Model(&models.DownloadLog{}).
				Where("download_time BETWEEN ? AND ?", startOfDay, endOfDay).
				Count(&downloadsInDay)

			aggregatedDataMap[day.Format("02 Jan")] = downloadsInDay
		}

	default:
		log.Printf("WARNING: GetDownloadStatsHandler: Неизвестный timeframe: %s. Возвращаем Bad Request.", timeframe)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неизвестный период времени."})
		return
	}

	// Заполняем окончательный массив `data` в правильном порядке
	data = make([]int64, len(labels))
	for i, label := range labels {
		data[i] = aggregatedDataMap[label]
	}

	c.JSON(http.StatusOK, gin.H{
		"labels": labels,
		"data":   data,
	})
	log.Printf("DEBUG: GetDownloadStatsHandler: Успешно отправлена статистика для timeframe: %s", timeframe)
}

// GetTopFilesHandler возвращает топовые файлы по скачиваниям за определенный период
func GetTopFilesHandler(c *gin.Context) {
	period := c.Query("period")
	limitStr := c.DefaultQuery("limit", "5")
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		log.Printf("ERROR: GetTopFilesHandler: Неверный формат лимита: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат лимита."})
		return
	}
	log.Printf("DEBUG: GetTopFilesHandler: Запрос топовых файлов для period: %s, limit: %d", period, limit)

	var cutoffTime time.Time
	now := time.Now()

	switch period {
	case "24h":
		cutoffTime = now.Add(-24 * time.Hour)
	case "week":
		cutoffTime = now.AddDate(0, 0, -7)
	case "month":
		cutoffTime = now.AddDate(0, -1, 0)
	case "": // Если период не указан, берем топовые за все время
		// cutoffTime останется нулевым, фильтрации не будет
	default:
		log.Printf("WARNING: GetTopFilesHandler: Неизвестный период: %s. Возвращаем Bad Request.", period)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неизвестный период."})
		return
	}

	var results []struct {
		CardID    uuid.UUID
		Title     string
		Downloads int64
	}

	query := database.DB.Model(&models.DownloadLog{}).
		Select("download_logs.card_id, cards.title, COUNT(download_logs.id) as downloads").
		Joins("INNER JOIN cards ON download_logs.card_id = cards.id")

	if !cutoffTime.IsZero() {
		query = query.Where("download_logs.download_time >= ?", cutoffTime)
	}

	err = query.Group("download_logs.card_id, cards.title").
		Order("downloads DESC").
		Limit(limit).
		Find(&results).Error

	if err != nil {
		log.Printf("ERROR: GetTopFilesHandler: Ошибка при получении топовых файлов: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении топовых файлов."})
		return
	}

	var formattedTopCards []gin.H
	for _, res := range results {
		formattedTopCards = append(formattedTopCards, gin.H{
			"id":        res.CardID.String(), // Отдаем UUID как строку
			"title":     res.Title,
			"downloads": res.Downloads,
		})
	}

	c.JSON(http.StatusOK, formattedTopCards)
	log.Printf("DEBUG: GetTopFilesHandler: Успешно отправлены топовые файлы для period: %s, limit: %d. Количество: %d", period, limit, len(formattedTopCards))
}
