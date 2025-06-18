package repository

import (
	"fmt"
	"log"
	"time"

	"nasty/database"
	"nasty/models" // Убедитесь, что путь к вашей модели Card правильный

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

// DeleteFromDb удаляет запись из базы данных по её ID.
func DeleteFromDb(cardID string) error {
	if database.DB == nil {
		return fmt.Errorf("Ошибка: Подключение к базе данных (database.DB) не инициализировано. Убедитесь, что database.InitDB() успешно вызван в main().")
	}

	// Создаем пустую модель Card, чтобы GORM знал, какую таблицу удалять.
	// Используем Where для указания условия удаления по ID.
	result := database.DB.Where("id = ?", cardID).Delete(&models.Card{})

	if result.Error != nil {
		return fmt.Errorf("Ошибка при удалении записи с ID %s: %w", cardID, result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("Запись с ID %s не найдена для удаления", cardID)
	}

	fmt.Printf("Успешно удалено %d записей с ID %s\n", result.RowsAffected, cardID)
	return nil
}

// UpdateInDb обновляет существующую запись в базе данных.
// Принимает ID записи для обновления и указатель на структуру models.Card
// с новыми значениями полей.
func UpdateInDb(cardID string, updatedCard *models.Card) error {
	if database.DB == nil {
		return fmt.Errorf("Ошибка: Подключение к базе данных (database.DB) не инициализировано. Убедитесь, что database.InitDB() успешно вызван в main().")
	}

	// Сначала найдем существующую запись. Это хорошая практика,
	// чтобы убедиться, что запись существует, и чтобы GORM мог
	// эффективно обновить только измененные поля, если мы используем .Updates().
	var existingCard models.Card
	if err := database.DB.Where("id = ?", cardID).First(&existingCard).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("Запись с ID %s не найдена для обновления", cardID)
		}
		return fmt.Errorf("Ошибка при поиске записи с ID %s: %w", cardID, err)
	}

	// Обновляем поля существующей записи данными из updatedCard.
	// Используем .Updates() для частичного обновления.
	// GORM обновит только поля, которые не являются нулевыми значениями для их типа
	// (например, пустая строка, 0, false). Если вам нужно обновить нулевые значения,
	// используйте Map или Select.
	result := database.DB.Model(&existingCard).Updates(updatedCard)

	if result.Error != nil {
		return fmt.Errorf("Ошибка при обновлении записи с ID %s: %w", cardID, result.Error)
	}

	if result.RowsAffected == 0 {
		// Это может произойти, если запись найдена, но никакие поля не изменились,
		// или если GORM не смог найти запись для обновления (хотя мы уже проверили это выше).
		return fmt.Errorf("Запись с ID %s найдена, но никаких изменений не было применено", cardID)
	}

	fmt.Printf("Успешно обновлено %d записей с ID %s\n", result.RowsAffected, cardID)
	return nil
}

// GetCardByID возвращает одну карточку по её ID.
func GetCardByID(cardID string) (*models.Card, error) {
	if database.DB == nil {
		return nil, fmt.Errorf("Ошибка: Подключение к базе данных не инициализировано.")
	}

	var card models.Card
	// First пытается найти первую запись, соответствующую условию.
	// Если запись не найдена, First() вернет gorm.ErrRecordNotFound.
	result := database.DB.Where("id = ?", cardID).First(&card)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("Карточка с ID %s не найдена", cardID)
		}
		return nil, fmt.Errorf("Ошибка при получении карточки с ID %s: %w", cardID, result.Error)
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
			return nil, fmt.Errorf("Неверный формат даты для фильтрации: %s. Ожидается YYYY-MM-DD: %w", *options.UploadDate, err)
		}
		startOfDay := parsedDate
		endOfDay := parsedDate.Add(24 * time.Hour)
		query = query.Where("uploaded_at >= ? AND uploaded_at < ?", startOfDay, endOfDay)
	}

	// --- Применение сортировки ---
	orderBy := "uploaded_at desc" // Сортировка по умолчанию
	order := "desc"
	if options.SortOrder == "asc" {
		order = "asc"
	}

	switch options.SortBy {
	case "title":
		orderBy = fmt.Sprintf("title %s", order)
	case "download_count":
		orderBy = fmt.Sprintf("download_count %s", order)
	case "uploaded_at":
		orderBy = fmt.Sprintf("uploaded_at %s", order)
	}
	query = query.Order(orderBy)

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
