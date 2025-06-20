package database

import (
	"fmt"
	"log"
	"strings"

	"nasty/models" // Убедитесь, что путь к вашим моделям правильный

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func CreateUser(user *models.User) error {
	if DB == nil {
		return fmt.Errorf("ошибка: подключение к базе данных не инициализировано")
	}

	log.Printf("CreateUser DEBUG: Сохраняется пользователь '%s', Email: '%s', пароль: '%s'", user.Username, user.Email, user.Password)

	result := DB.Create(user)
	if result.Error != nil {
		if strings.Contains(result.Error.Error(), "duplicate key value violates unique constraint") {
			log.Printf("CreateUser DEBUG: Дубликат пользователя для '%s': %v", user.Username, result.Error)
			return fmt.Errorf("пользователь с таким именем пользователя или email уже существует")
		}
		log.Printf("CreateUser DEBUG: Ошибка при записи в БД для пользователя '%s': %v", user.Username, result.Error)
		return fmt.Errorf("ошибка при создании пользователя: %w", result.Error)
	}

	log.Printf("CreateUser DEBUG: Пользователь '%s' успешно сохранен в БД.", user.Username)
	return nil
}

// GetUserByEmail получает пользователя по email.
func GetUserByEmail(email string) (*models.User, error) {
	if DB == nil {
		return nil, fmt.Errorf("ошибка: подключение к базе данных не инициализировано")
	}
	var user models.User
	result := DB.Where("email = ?", email).First(&user)
	if result.Error != nil {
		return nil, result.Error
	}
	return &user, nil
}

func GetUserByUsername(username string) (*models.User, error) {
	if DB == nil {
		return nil, fmt.Errorf("ошибка: подключение к базе данных не инициализировано")
	}
	var user models.User
	result := DB.Where("username = ?", username).First(&user)
	if result.Error != nil {
		return nil, result.Error
	}
	return &user, nil
}

// GetUserByID получает пользователя по ID.
func GetUserByID(userID uint) (*models.User, error) {
	if DB == nil {
		return nil, fmt.Errorf("ошибка: подключение к базе данных не инициализировано")
	}
	var user models.User
	result := DB.First(&user, "id = ?", userID)
	if result.Error != nil {
		return nil, result.Error
	}
	return &user, nil
}

func ToggleFavorite(userID uint, cardID uuid.UUID) error {
	if DB == nil {
		return fmt.Errorf("ошибка: подключение к базе данных не инициализировано")
	}

	user, err := GetUserByID(userID) // Получаем пользователя
	if err != nil {
		return fmt.Errorf("пользователь не найден: %w", err)
	}

	// Проверяем, есть ли карточка уже в избранном
	found := false
	newFavorites := []uuid.UUID{}
	for _, favID := range user.Favorites {
		if favID == cardID {
			found = true // Карточка найдена, её нужно удалить
		} else {
			newFavorites = append(newFavorites, favID) // Копируем все остальные
		}
	}

	if found {
		// Карточка была в избранном, удаляем её
		user.Favorites = newFavorites
		log.Printf("Карточка %s удалена из избранного пользователя %d\n", cardID, userID)
	} else {
		// Карточки не было, добавляем её
		user.Favorites = append(user.Favorites, cardID)
		log.Printf("Карточка %s добавлена в избранное пользователя %d\n", cardID, userID)
	}

	// Сохраняем обновленный список избранного обратно в БД
	if err := DB.Save(&user).Error; err != nil {
		return fmt.Errorf("ошибка при обновлении избранного пользователя: %w", err)
	}

	return nil
}

// GetFavoriteCardIDsByUserID возвращает список ID избранных карточек для пользователя.
func GetFavoriteCardIDsByUserID(userID uint) ([]string, error) {
	if DB == nil {
		return nil, fmt.Errorf("ошибка: подключение к базе данных не инициализировано")
	}

	user, err := GetUserByID(userID) // Получаем пользователя
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return []string{}, nil
		}
		return nil, fmt.Errorf("ошибка при получении пользователя для избранного: %w", err)
	}

	var cardIDs []string
	for _, favUUID := range user.Favorites {
		cardIDs = append(cardIDs, favUUID.String())
	}
	return cardIDs, nil
}

// GetCardsByUUIDs получает список объектов Card по их UUID
func GetCardsByUUIDs(uuids []uuid.UUID) ([]models.Card, error) {
	if DB == nil {
		return nil, fmt.Errorf("ошибка: подключение к базе данных не инициализировано")
	}

	var cards []models.Card
	if err := DB.Where("id IN ?", uuids).Find(&cards).Error; err != nil {
		return nil, fmt.Errorf("ошибка при получении карточек по UUIDs: %w", err)
	}
	return cards, nil
}

// GetAllUsers возвращает всех пользователей.
func GetAllUsers() ([]models.User, error) {
	if DB == nil {
		return nil, fmt.Errorf("ошибка: подключение к базе данных не инициализировано")
	}
	var users []models.User
	result := DB.Find(&users)
	if result.Error != nil {
		return nil, fmt.Errorf("ошибка при получении всех пользователей: %w", result.Error)
	}
	for i := range users {
		users[i].Password = ""
	}
	return users, nil
}

func AddToDb(card *models.Card) error {
	if DB == nil {
		return fmt.Errorf("ошибка: подключение к базе данных не инициализировано")
	}
	result := DB.Create(card)
	if result.Error != nil {
		return fmt.Errorf("ошибка при создании карточки: %w", result.Error)
	}
	return nil
}

// GetCardByIDfunc получает карточку по ID
func GetCardByIDfunc(cardID uuid.UUID) (*models.Card, error) {
	if DB == nil {
		return nil, fmt.Errorf("ошибка: подключение к базе данных не инициализировано")
	}
	var card models.Card
	result := DB.Preload("Tag").Where("id = ?", cardID).First(&card) // Добавлено Preload("Tag")
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, gorm.ErrRecordNotFound
		}
		return nil, fmt.Errorf("ошибка при получении карточки по ID: %w", result.Error)
	}
	return &card, nil
}

// UpdateInDb обновляет существующую карточку
func UpdateInDb(cardID uuid.UUID, updatedCard *models.Card) error {
	if DB == nil {
		return fmt.Errorf("ошибка: подключение к базе данных не инициализировано")
	}
	// Используем Model(&models.Card{}) для обновления по UUID
	// GORM.Updates() обновит только не-нулевые поля в updatedCard
	result := DB.Model(&models.Card{}).Where("id = ?", cardID).Updates(updatedCard)
	if result.Error != nil {
		return fmt.Errorf("ошибка при обновлении карточки: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

// DeleteFromDb удаляет карточку по ID
func DeleteFromDb(cardID uuid.UUID) error {
	if DB == nil {
		return fmt.Errorf("ошибка: подключение к базе данных не инициализировано")
	}
	result := DB.Delete(&models.Card{}, "id = ?", cardID)
	if result.Error != nil {
		return fmt.Errorf("ошибка при удалении карточки: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

type GetAllCardsOptions struct {
	TagID        *uint
	SortBy       string
	SortOrder    string
	SearchTitle  string
	MinDownloads *int
	UploadDate   *string
	Limit        int
	Offset       int
}

func GetAllCards(options GetAllCardsOptions) ([]models.Card, error) {
	if DB == nil {
		return nil, fmt.Errorf("ошибка: подключение к базе данных не инициализировано")
	}
	var cards []models.Card
	query := DB.Model(&models.Card{}).Preload("Tag") // ДОБАВЛЕНО: Preload("Tag") для всех карточек
	if options.TagID != nil {
		query = query.Where("tag_id = ?", *options.TagID)
	}
	if options.SearchTitle != "" {
		query = query.Where("LOWER(title) LIKE LOWER(?)", "%"+options.SearchTitle+"%")
	}
	if options.MinDownloads != nil {
		query = query.Where("download_count >= ?", *options.MinDownloads)
	}
	if options.UploadDate != nil {
		query = query.Where("uploaded_at >= ? AND uploaded_at < DATE(?) + INTERVAL '1 day'", *options.UploadDate, *options.UploadDate)
	}
	if options.SortBy != "" {
		order := fmt.Sprintf("%s %s", options.SortBy, options.SortOrder)
		query = query.Order(order)
	}
	if options.Limit > 0 {
		query = query.Limit(options.Limit)
	}
	if options.Offset >= 0 {
		query = query.Offset(options.Offset)
	}
	result := query.Find(&cards)
	if result.Error != nil {
		return nil, fmt.Errorf("ошибка при получении всех карточек: %w", result.Error)
	}
	return cards, nil
}

func GetTotalCardCount(options GetAllCardsOptions) (int64, error) {
	if DB == nil {
		return 0, fmt.Errorf("ошибка: подключение к базе данных не инициализировано")
	}
	var count int64
	query := DB.Model(&models.Card{})
	if options.TagID != nil {
		query = query.Where("tag_id = ?", *options.TagID)
	}
	if options.SearchTitle != "" {
		query = query.Where("LOWER(title) LIKE LOWER(?)", "%"+options.SearchTitle+"%")
	}
	if options.MinDownloads != nil {
		query = query.Where("download_count >= ?", *options.MinDownloads)
	}
	if options.UploadDate != nil {
		query = query.Where("uploaded_at >= ? AND uploaded_at < DATE(?) + INTERVAL '1 day'", *options.UploadDate, *options.UploadDate)
	}
	if err := query.Count(&count).Error; err != nil {
		return 0, fmt.Errorf("ошибка при подсчете карточек: %w", err)
	}
	return count, nil
}

// GetAllTagsFromDB получает все доступные теги из базы данных.
func GetAllTagsFromDB() ([]models.Tag, error) {
	if DB == nil {
		return nil, fmt.Errorf("ошибка: подключение к базе данных не инициализировано")
	}
	var tags []models.Tag
	result := DB.Find(&tags)
	if result.Error != nil {
		return nil, fmt.Errorf("ошибка при получении тегов: %w", result.Error)
	}
	return tags, nil
}
