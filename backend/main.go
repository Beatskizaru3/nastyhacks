// nasty/main.go
package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"nasty/database"
	"nasty/handlers"
	"nasty/middleware"
	"nasty/utils" // <-- Теперь импортируем utils

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func init() {
	// Загружаем переменные окружения из файла .env ТОЛЬКО ЗДЕСЬ
	err := godotenv.Load()
	if err != nil {
		log.Printf("Внимание: Не удалось загрузить файл .env. %v. Переменные окружения будут браться из системы.", err)
	}

	// Получаем JWT_SECRET после загрузки .env
	secret := os.Getenv("JWT_SECRET")
	if len(secret) == 0 {
		log.Println("Предупреждение: JWT_SECRET не установлен. Используется ключ по умолчанию (НЕБЕЗОПАСНО ДЛЯ ПРОДАКШЕНА).")
		secret = "super-secret-jwt-key-please-change-me" // Дефолтное значение для разработки
	}

	// Инициализируем секрет в пакетах, которым он нужен
	utils.SetJWTSecret([]byte(secret))      // <-- Передаем секрет в utils
	middleware.SetJWTSecret([]byte(secret)) // <-- Передаем секрет в middleware (если у него есть такой же SetSecret)
	handlers.SetJWTSecret([]byte(secret))   // <-- Передаем секрет в handlers (если у него есть такой же SetSecret)

	// Предполагается, что database.InitDB() не требует JWT_SECRET напрямую,
	// а скорее переменные для подключения к БД, которые также будут в .env
}

func main() {
	// Инициализация базы данных
	if err := database.InitDB(); err != nil {
		log.Fatalf("Не удалось подключиться к базе данных: %v", err)
	}

	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},                             // Разрешаем запросы только с этого источника
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},           // Разрешенные HTTP методы
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"}, // Разрешенные заголовки
		ExposeHeaders:    []string{"Content-Length"},                                    // Заголовки, которые можно прочитать фронтенду
		AllowCredentials: true,                                                          // Разрешаем отправку куки и заголовков авторизации
		MaxAge:           12 * time.Hour,                                                // Время кэширования CORS-заголовков браузером
	}))

	router.POST("/login", handlers.LoginUserHandler)
	router.POST("/register", handlers.RegisterUserHandler)
	router.GET("/cards/:id", handlers.GetCardByIDHandler)
	router.GET("/cards", handlers.GetAllCardsHandler)

	authorized := router.Group("/api")
	authorized.Use(middleware.AuthMiddleware())
	{
		authorized.GET("/profile", handlers.Profile)
		authorized.POST("/profile/favorite/:cardId", handlers.ToggleFavoriteHandler)

	}

	admin := authorized.Group("/admin")
	admin.Use(middleware.AuthorizeRole("admin"))
	{
		admin.GET("/users", handlers.GetUsersHandler)
		admin.PUT("/cards/:id", handlers.UpdateCardHandler)
		admin.POST("/cards", handlers.CreateCardHandler)
		authorized.DELETE("/cards/:id", handlers.DeleteCardHandler)
	}

	router.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "pong"})
	})

	log.Println("Сервер запущен на порту :8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Ошибка запуска сервера: %v", err)
	}
}
