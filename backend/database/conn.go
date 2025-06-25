package database

import (
	"fmt"
	"log"
	"nasty/models"
	"os" // Импортируем os для работы с переменными окружения

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// DB - глобальная переменная, которая будет хранить подключение к базе данных.
var DB *gorm.DB

func GetDB() *gorm.DB {
	return DB
}
func InitDB() error {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		return fmt.Errorf("DATABASE_URL environment variable not set")
	}

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	log.Println("Database connection established successfully!")

	// Автоматическая миграция моделей
	// ОБЯЗАТЕЛЬНО ДОБАВЬТЕ models.DownloadLog ЗДЕСЬ
	err = DB.AutoMigrate(&models.User{}, &models.Card{}, &models.Tag{}, &models.DownloadLog{})
	if err != nil {
		return fmt.Errorf("failed to auto migrate database: %w", err)
	}
	log.Println("Автоматическая миграция завершена успешно!")

	return nil
}
