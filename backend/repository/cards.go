package repository

import (
	"fmt"
	"log"
	"time"

	"nasty/database"
	"nasty/models" // Убедитесь, что путь к вашей модели Card правильный

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// DB - глобальная переменная, которая должна быть инициализирована в database/database.go
// var DB *gorm.DB // Эта строка не нужна здесь, она должна быть в database/database.go

// AddToDb добавляет новый элемент в базу данных.
// Она использует уже инициализированное глобальное подключение DB.
func AddToDb(item *models.Card) {
	if database.DB == nil {
		log.Fatalf("Ошибка: Подключение к базе данных (database.DB) не инициализировано. Убедитесь, что database.InitDB() успешно вызван в main().")
		return
	}

	result := database.DB.Create(item)

	if result.Error != nil {
		fmt.Printf("Ошибка при добавлении записи в базу данных: %v\n", result.Error)
	} else {
		fmt.Printf("Успешно добавлено записей: %d\n", result.RowsAffected)
		fmt.Printf("Новый ID карточки: %s\n", item.ID)
	}
}

func DeleteFromDb(cardID uuid.UUID) error {
	if database.DB == nil {
		return fmt.Errorf("ошибка: подключение к базе данных не инициализировано")
	}

	// GORM должен уметь работать с uuid.UUID напрямую
	result := database.DB.Delete(&models.Card{}, "id = ?", cardID)
	if result.Error != nil {
		return fmt.Errorf("ошибка при удалении карточки: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound // Если ничего не удалилось, значит, карточка не найдена
	}
	return nil
}

// UpdateInDb обновляет существующую запись в базе данных.
// Принимает ID записи для обновления и указатель на структуру models.Card
// с новыми значениями полей.
func UpdateInDb(cardID uuid.UUID, updatedCard *models.Card) error {
	if database.DB == nil {
		return fmt.Errorf("ошибка: подключение к базе данных не инициализировано")
	}

	// GORM должен уметь работать с uuid.UUID напрямую
	result := database.DB.Model(&models.Card{}).Where("id = ?", cardID).Updates(updatedCard)
	if result.Error != nil {
		return fmt.Errorf("ошибка при обновлении карточки: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound // Если ничего не обновилось, значит, карточка не найдена
	}
	return nil
}

// GetCardByID возвращает одну карточку по её ID.
func GetCardByID(cardID uuid.UUID) (*models.Card, error) {
	if database.DB == nil {
		return nil, fmt.Errorf("ошибка: подключение к базе данных не инициализировано")
	}
	var card models.Card
	// GORM должен уметь работать с uuid.UUID напрямую
	result := database.DB.Where("id = ?", cardID).First(&card)
	if result.Error != nil {
		return nil, result.Error
	}
	return &card, nil
}

// GetAllCardsOptions определяет параметры для получения и сортировки карточек.
type GetAllCardsOptions struct {
	TagID        *uint   // Указатель, чтобы отличать 0 от отсутствия фильтра
	SortBy       string  // "uploaded_at", "title", "download_count"
	SortOrder    string  // "asc", "desc"
	SearchTitle  string  // Для поиска по названию
	MinDownloads *int    // Указатель, чтобы отличать 0 от отсутствия фильтра
	UploadDate   *string // Дата в формате "YYYY-MM-DD"
	Limit        int     // Количество записей для выборки (для пагинации)
	Offset       int     // Смещение (для пагинации)
}

// GetAllCards возвращает все карточки из базы данных с опциональной сортировкой, фильтрацией и пагинацией.
func GetAllCards(options GetAllCardsOptions) ([]models.Card, error) {
	if database.DB == nil {
		return nil, fmt.Errorf("Ошибка: Подключение к базе данных не инициализировано.")
	}

	var cards []models.Card
	query := database.DB.Model(&models.Card{})

	// --- Применение фильтров ---
	if options.TagID != nil {
		query = query.Where("tag_id = ?", *options.TagID)
	}
	if options.SearchTitle != "" {
		query = query.Where("title ILIKE ?", "%"+options.SearchTitle+"%") // ILIKE для PostgreSQL (регистронезависимый LIKE)
	}
	if options.MinDownloads != nil {
		query = query.Where("download_count >= ?", *options.MinDownloads)
	}
	if options.UploadDate != nil && *options.UploadDate != "" {
		parsedDate, err := time.Parse("2006-01-02", *options.UploadDate)
		if err != nil {
			return nil, fmt.Errorf("Неверный формат даты для фильтрации: %s. ОжидаетсяYYYY-MM-DD: %w", *options.UploadDate, err)
		}
		startOfDay := parsedDate
		endOfDay := parsedDate.Add(24 * time.Hour)
		query = query.Where("uploaded_at >= ? AND uploaded_at < ?", startOfDay, endOfDay)
	}

	// --- Применение сортировки ---
	switch options.SortBy {
	case "oldest": // Старые сверху, нулевые даты в конце
		query = query.Order("CASE WHEN uploaded_at = '0001-01-01 00:00:00+00' THEN 1 ELSE 0 END ASC, uploaded_at ASC")
	case "downloads": // По убыванию загрузок
		query = query.Order("download_count DESC")
	case "recent": // Новые сверху (по умолчанию на фронтенде), нулевые даты в конце
		query = query.Order("CASE WHEN uploaded_at = '0001-01-01 00:00:00+00' THEN 1 ELSE 0 END ASC, uploaded_at DESC")
	default: // Если sortBy не указан или неизвестен, сортируем как recent
		query = query.Order("CASE WHEN uploaded_at = '0001-01-01 00:00:00+00' THEN 1 ELSE 0 END ASC, uploaded_at DESC")
	}
	// !!! ЭТУ СТРОКУ НАДО УДАЛИТЬ !!!
	// query = query.Order(orderBy) // <--- УДАЛИ ЭТУ СТРОКУ

	// --- Применение пагинации ---
	if options.Limit > 0 {
		query = query.Limit(options.Limit)
	}
	if options.Offset >= 0 {
		query = query.Offset(options.Offset)
	}

	result := query.Find(&cards)

	if result.Error != nil {
		return nil, fmt.Errorf("Ошибка при получении карточек: %w", result.Error)
	}

	return cards, nil
}

// GetTotalCardCount возвращает общее количество карточек, соответствующих заданным опциям фильтрации.
// Это полезно для пагинации.
func GetTotalCardCount(options GetAllCardsOptions) (int64, error) {
	if database.DB == nil {
		return 0, fmt.Errorf("Ошибка: Подключение к базе данных не инициализировано.")
	}

	var count int64
	query := database.DB.Model(&models.Card{})

	// --- Применение фильтров (как в GetAllCards) ---
	if options.TagID != nil {
		query = query.Where("tag_id = ?", *options.TagID)
	}
	if options.SearchTitle != "" {
		query = query.Where("title ILIKE ?", "%"+options.SearchTitle+"%")
	}
	if options.MinDownloads != nil {
		query = query.Where("download_count >= ?", *options.MinDownloads)
	}
	if options.UploadDate != nil && *options.UploadDate != "" {
		parsedDate, err := time.Parse("2006-01-02", *options.UploadDate)
		if err != nil {
			// В случае ошибки парсинга даты, вернем ошибку
			return 0, fmt.Errorf("Неверный формат даты для подсчета: %s. Ожидается YYYY-MM-DD: %w", *options.UploadDate, err)
		}
		startOfDay := parsedDate
		endOfDay := parsedDate.Add(24 * time.Hour)
		query = query.Where("uploaded_at >= ? AND uploaded_at < ?", startOfDay, endOfDay)
	}

	result := query.Count(&count)

	if result.Error != nil {
		return 0, fmt.Errorf("Ошибка при получении общего количества карточек: %w", result.Error)
	}

	return count, nil
}
