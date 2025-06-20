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
	"nasty/utils"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func init() {
	log.Println("--- DEBUG INIT: Начало функции init ---") // Лог начала init
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

	log.Println("--- DEBUG INIT: Завершение функции init ---") // Лог завершения init
}

func main() {
	log.Println("--- DEBUG MAIN: Начало функции main ---") // Лог начала main

	// Инициализация базы данных
	if err := database.InitDB(); err != nil {
		log.Fatalf("Не удалось подключиться к базе данных: %v", err)
	}

	router := gin.Default()
	log.Println("DEBUG MAIN: Gin роутер инициализирован.")

	// Настройка CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))
	log.Println("DEBUG MAIN: CORS Middleware сконфигурирован и применен.")

	// Публичные маршруты
	log.Println("DEBUG MAIN: Регистрация публичных маршрутов...")
	router.POST("/login", handlers.LoginUserHandler)
	log.Println("DEBUG MAIN:   -> POST /login")
	router.POST("/register", handlers.RegisterUserHandler)
	log.Println("DEBUG MAIN:   -> POST /register")
	router.GET("/cards/:id", handlers.GetCardByIDHandler)
	log.Println("DEBUG MAIN:   -> GET /cards/:id")
	router.GET("/cards", handlers.GetAllCardsHandler)
	log.Println("DEBUG MAIN:   -> GET /cards")
	router.GET("/tags", handlers.GetAllTagsHandler)
	log.Println("DEBUG MAIN:   -> GET /tags")
	log.Println("DEBUG MAIN: Публичные маршруты зарегистрированы.")

	// Авторизованные маршруты (группа /api)
	log.Println("DEBUG MAIN: Инициализация группы 'authorized' (/api)...")
	authorized := router.Group("/api") // Группа на /api
	authorized.Use(middleware.AuthMiddleware())
	{
		log.Println("DEBUG MAIN: Регистрация авторизованных маршрутов внутри /api...")
		authorized.GET("/profile", handlers.Profile)
		log.Println("DEBUG MAIN:   -> GET /api/profile")
		authorized.POST("/profile/favorite/:cardId", handlers.ToggleFavoriteHandler)
		log.Println("DEBUG MAIN:   -> POST /api/profile/favorite/:cardId")
		authorized.POST("/cards/favorites", handlers.GetFavoriteCardsHandler)
		log.Println("DEBUG MAIN:   -> POST /api/cards/favorites")
		log.Println("DEBUG MAIN: Авторизованные маршруты внутри /api зарегистрированы.")
	}
	log.Println("DEBUG MAIN: Группа 'authorized' (/api) инициализирована.")

	// Админские маршруты (группа /admin, которая является подгруппой authorized)
	// Это означает, что для доступа к этим маршрутам нужен JWT токен И роль "admin".
	log.Println("DEBUG MAIN: Инициализация группы 'admin' (подгруппа /api/admin)...")
	admin := authorized.Group("/admin") // Теперь это /api/admin
	admin.Use(middleware.AuthorizeRole("admin"))
	{
		log.Println("DEBUG MAIN: Регистрация админских маршрутов внутри /api/admin...")
		admin.GET("/users", handlers.GetUsersHandler)
		log.Println("DEBUG MAIN:   -> GET /api/admin/users")
		admin.PUT("/cards/:id", handlers.UpdateCardHandler)
		log.Println("DEBUG MAIN:   -> PUT /api/admin/cards/:id")
		admin.POST("/cards", handlers.CreateCardHandler) // ВАШ МАРШРУТ!
		log.Println("DEBUG MAIN:   -> POST /api/admin/cards")
		admin.DELETE("/cards/:id", handlers.DeleteCardHandler)
		log.Println("DEBUG MAIN:   -> DELETE /api/admin/cards/:id")
		admin.GET("/tags", handlers.GetAllTagsHandler)
		log.Println("DEBUG MAIN:   -> GET /api/admin/tags")
		log.Println("DEBUG MAIN: Админские маршруты внутри /api/admin зарегистрированы.")
	}
	log.Println("DEBUG MAIN: Группа 'admin' инициализирована.")

	// Маршрут для проверки работоспособности
	router.GET("/ping", func(c *gin.Context) {
		log.Println("DEBUG MAIN: Получен GET /ping")
		c.JSON(http.StatusOK, gin.H{"message": "pong"})
	})
	log.Println("DEBUG MAIN: Маршрут GET /ping зарегистрирован.")

	log.Println("--- DEBUG MAIN: Завершение конфигурации маршрутов. ---")

	log.Println("Сервер запущен на порту :8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Ошибка запуска сервера: %v", err)
	}
}
