package database

import (
	"fmt"
	"log"
	"time"

	"nasty/models" // Убедитесь, что путь к вашим моделям правильный

	"gorm.io/gorm"
)

// AddToDb, DeleteFromDb, UpdateInDb, GetCardByID, GetAllCards, GetTotalCardCount
// (эти функции у вас уже должны быть)

// CreateUser создает нового пользователя в базе данных.
func CreateUser(user *models.User) error {
	if DB == nil {
		return fmt.Errorf("ошибка: подключение к базе данных не инициализировано")
	}
	result := DB.Create(user)
	if result.Error != nil {
		return fmt.Errorf("ошибка при создании пользователя: %w", result.Error)
	}
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
		return nil, result.Error // gorm.ErrRecordNotFound будет передан
	}
	return &user, nil
}

func GetUserByUsername(username string) (*models.User, error) {
	if DB == nil {
		return nil, fmt.Errorf("ошибка: подключение к базе данных не инициализировано")
	}
	var user models.User
	// Ищем пользователя по полю Username
	result := DB.Where("username = ?", username).First(&user)
	if result.Error != nil {
		return nil, result.Error // gorm.ErrRecordNotFound будет передан
	}
	return &user, nil
}

// GetUserByID получает пользователя по ID.
func GetUserByID(userID string) (*models.User, error) {
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

// ToggleFavorite добавляет или удаляет карточку из избранного пользователя.
func ToggleFavorite(userID, cardID string) error {
	if DB == nil {
		return fmt.Errorf("ошибка: подключение к базе данных не инициализировано")
	}

	var favorite models.Favorite
	// Проверяем, существует ли уже такая запись
	result := DB.Where("user_id = ? AND card_id = ?", userID, cardID).First(&favorite)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			// Записи нет, нужно добавить
			newFavorite := models.Favorite{
				UserID:    userID,
				CardID:    cardID,
				CreatedAt: time.Now(),
			}
			if err := DB.Create(&newFavorite).Error; err != nil {
				return fmt.Errorf("ошибка при добавлении в избранное: %w", err)
			}
			log.Printf("Карточка %s добавлена в избранное пользователя %s\n", cardID, userID)
		} else {
			// Другая ошибка при запросе
			return fmt.Errorf("ошибка при проверке избранного: %w", result.Error)
		}
	} else {
		// Запись найдена, нужно удалить
		if err := DB.Delete(&favorite).Error; err != nil {
			return fmt.Errorf("ошибка при удалении из избранного: %w", err)
		}
		log.Printf("Карточка %s удалена из избранного пользователя %s\n", cardID, userID)
	}
	return nil
}

// GetFavoriteCardIDsByUserID возвращает список ID избранных карточек для пользователя.
func GetFavoriteCardIDsByUserID(userID string) ([]string, error) {
	if DB == nil {
		return nil, fmt.Errorf("ошибка: подключение к базе данных не инициализировано")
	}

	var favorites []models.Favorite
	if err := DB.Where("user_id = ?", userID).Find(&favorites).Error; err != nil {
		return nil, fmt.Errorf("ошибка при получении избранных карточек: %w", err)
	}

	var cardIDs []string
	for _, fav := range favorites {
		cardIDs = append(cardIDs, fav.CardID)
	}
	return cardIDs, nil
}

// GetAllUsers возвращает всех пользователей. (Для админ-панели)
func GetAllUsers() ([]models.User, error) {
	if DB == nil {
		return nil, fmt.Errorf("ошибка: подключение к базе данных не инициализировано")
	}
	var users []models.User
	result := DB.Find(&users)
	if result.Error != nil {
		return nil, fmt.Errorf("ошибка при получении всех пользователей: %w", result.Error)
	}
	// Удаляем хеши паролей из ответа перед возвратом для безопасности
	for i := range users {
		users[i].Password = ""
	}
	return users, nil
}
