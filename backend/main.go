package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"nasty/database"
	"nasty/handlers"
	"nasty/middleware"
	"nasty/utils"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func init() {
	log.Println("--- DEBUG INIT: Начало функции init ---")
	err := godotenv.Load()
	if err != nil {
		log.Printf("Внимание: Не удалось загрузить файл .env. %v. Переменные окружения будут браться из системы.", err)
	} else {
		log.Println("DEBUG INIT: .env файл успешно загружен.")
	}

	secret := os.Getenv("JWT_SECRET")
	if len(secret) == 0 {
		log.Println("DEBUG INIT: JWT_SECRET не установлен. Используется ключ по умолчанию (НЕБЕЗОПАСНО ДЛЯ ПРОДАКШЕНА).")
		secret = "super-secret-jwt-key-please-change-me" // Дефолтное значение для разработки
	} else {
		log.Println("DEBUG INIT: JWT_SECRET успешно загружен.")
	}

	utils.SetJWTSecret([]byte(secret))
	middleware.SetJWTSecret([]byte(secret))
	handlers.SetJWTSecret([]byte(secret))
	log.Println("DEBUG INIT: JWT Secret установлен в utils, middleware, handlers.")

	log.Println("--- DEBUG INIT: Завершение функции init ---")
}

func main() {
	log.Println("--- DEBUG MAIN: Начало функции main ---")

	// Инициализация базы данных
	if err := database.InitDB(); err != nil {
		log.Fatalf("Не удалось подключиться к базе данных: %v", err)
	}

	router := gin.Default()
	log.Println("DEBUG MAIN: Gin роутер инициализирован.")

	router.Static("/uploads", "./uploads")
	log.Println("DEBUG MAIN: Настройка отдачи статических файлов из /uploads/.")

	// Настройка CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "https://kaleidoscopic-sopapillas-25f79d.netlify.app", "https://nastyhacks.onrender.com"}, // Исправлено: без лишних скобок и слэшей
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))
	log.Println("DEBUG MAIN: CORS Middleware сконфигурирован и применен.")

	// Публичные маршруты
	router.POST("/login", handlers.LoginUserHandler)
	router.POST("/register", handlers.RegisterUserHandler)
	router.GET("/cards/:id", handlers.GetCardByIDHandler)
	router.GET("/cards", handlers.GetAllCardsHandler)
	router.GET("/tags", handlers.GetAllTagsHandler)
	router.GET("/download/cards/:id", handlers.IncrementDownloadCountHandler)

	// Маршрут для проверки работоспособности (ТОЖЕ ВЫНОСИМ ЗА ГРУППУ!)
	router.GET("/ping", func(c *gin.Context) {
		log.Println("DEBUG MAIN: Получен GET /ping")
		c.JSON(http.StatusOK, gin.H{"message": "pong"})
	})
	log.Println("DEBUG MAIN: Маршрут GET /ping зарегистрирован.")

	// Авторизованные маршруты (группа /api)
	log.Println("DEBUG MAIN: Инициализация группы 'authorized' (/api)...")
	authorized := router.Group("/api") // Группа на /api
	authorized.Use(middleware.AuthMiddleware())
	{
		authorized.GET("/profile", handlers.Profile)
		authorized.POST("/profile/favorite/:cardId", handlers.ToggleFavoriteHandler)
		authorized.POST("/cards/favorites", handlers.GetFavoriteCardsHandler)

		log.Println("DEBUG MAIN: Группа 'authorized' (/api) инициализирована.")

		admin := authorized.Group("/admin") // Теперь это /api/admin
		admin.Use(middleware.AuthorizeRole("admin"))
		{
			admin.GET("/users", handlers.GetUsersHandler)
			admin.POST("/cards", handlers.CreateCardHandler)
			admin.DELETE("/cards/:id", handlers.DeleteCardHandler)
			admin.GET("/cards", handlers.GetAllCardsHandler)
			admin.GET("/tags", handlers.GetAllTagsHandler)
			admin.PATCH("/cards/:id/downloads", handlers.UpdateCardDownloadsHandler)
			admin.GET("/stats/downloads", handlers.GetDownloadStatsHandler)
			admin.GET("/stats/top-files", handlers.GetTopFilesHandler)
		}
		log.Println("DEBUG MAIN: Группа 'admin' инициализирована.")
	} // <-- Закрывающая скобка для authorized группы

	log.Println("--- DEBUG MAIN: Завершение конфигурации маршрутов. ---")
	// --- ВОТ ЭТО ИСПРАВЛЕНИЕ: Получаем порт из переменных окружения ---
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // Порт по умолчанию для локальной разработки
	}
	log.Printf("Сервер запускается на порту :%s", port) // Изменено для вывода правильного порта
	if err := router.Run(":" + port); err != nil {      // <-- Используем полученный порт
		log.Fatalf("Ошибка запуска сервера: %v", err)
	}
	log.Println("--- DEBUG MAIN: Завершение функции main ---")
}
