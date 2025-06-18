package database

import (
	"fmt"
	"log"
	"os" // Импортируем os для работы с переменными окружения

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// DB - глобальная переменная, которая будет хранить подключение к базе данных.
var DB *gorm.DB

// InitDB инициализирует подключение к базе данных.
func InitDB() error {
	var err error
	// Получаем DSN из переменной окружения DATABASE_URL
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		// Если переменная окружения не установлена, используем вашу хардкодированную строку.
		// ВНИМАНИЕ: В ПРОДАКШЕНЕ ВСЕГДА ИСПОЛЬЗУЙТЕ ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ!
		log.Println("DATABASE_URL environment variable not set, using default DSN.")
		dsn = "host=localhost user=postgres password=Aezakmi1! dbname=postgres port=5432 sslmode=disable"
	}

	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		// Используем fmt.Errorf для оборачивания ошибки, чтобы caller мог обработать её.
		// log.Fatal завершит программу сразу, что не всегда желательно.
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	log.Println("Database connection established successfully!")
	return nil
}
