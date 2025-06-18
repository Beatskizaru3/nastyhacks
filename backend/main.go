package main

import (
	"log"
	"net/http" // Добавил для http.StatusOK

	"nasty/database"
	"nasty/handlers"
	"nasty/middleware"

	"github.com/gin-gonic/gin"
)

func main() {
	// Инициализация базы данных
	if err := database.InitDB(); err != nil {
		log.Fatalf("Не удалось подключиться к базе данных: %v", err)
	}

	router := gin.Default()

	// --- Публичные роуты (не требуют аутентификации) ---
	// Соответствуют /login и /register на фронте
	router.POST("/login", handlers.LoginUserHandler)       // LoginUserHandler вместо Login
	router.POST("/register", handlers.RegisterUserHandler) // RegisterUserHandler вместо Register

	// Роуты для отображения карточек (на главной странице и других категориях)
	// Фронтенд использует / для HomePage, /exploits, /tools,
	// которые, вероятно, запрашивают данные через /api/cards
	// Мы оставляем /cards публичным для чтения, если нет нужды в аутентификации
	router.GET("/cards/:id", handlers.GetCardByIDHandler) // Получение одной карточки по ID
	router.GET("/cards", handlers.GetAllCardsHandler)     // Получение всех карточек (или фильтрованных по запросу)

	// --- Защищенные роуты для аутентифицированных пользователей ---
	// Соответствует /profile и CRUD-операциям с карточками
	authorized := router.Group("/api")          // Все роуты начинаются с /api/
	authorized.Use(middleware.AuthMiddleware()) // Применяем мидлвар аутентификации ко всей группе
	{
		// Роут для профиля пользователя
		// Соответствует /profile на фронте
		authorized.GET("/profile", handlers.Profile) // handlers.Profile уже должен быть настроен для получения данных профиля

		// Роуты для добавления/удаления карточек из избранного
		// Соответствует /profile/favorite/:cardId на фронте
		authorized.POST("/profile/favorite/:cardId", handlers.ToggleFavoriteHandler)

		// Роуты для CRUD операций с карточками (доступны всем аутентифицированным пользователям)
		// Соответствуют /cards, /cards/:id на фронте, но с POST/PUT/DELETE
		authorized.POST("/cards", handlers.CreateCardHandler)
		authorized.PUT("/cards/:id", handlers.UpdateCardHandler)
		authorized.DELETE("/cards/:id", handlers.DeleteCardHandler)
	}

	// --- Роуты для администраторов ---
	// Соответствует /admin/* на фронте
	// Эта группа наследует AuthMiddleware от родительской группы "/api"
	// и добавляет AuthorizeRole("admin") для проверки специфичной роли.
	admin := authorized.Group("/admin")          // /api/admin
	admin.Use(middleware.AuthorizeRole("admin")) // Применяем мидлвар для админов
	{
		// Получение списка всех пользователей
		// Соответствует /admin/users на фронте
		admin.GET("/users", handlers.GetUsersHandler)
		// Здесь можно добавить другие роуты, доступные только администраторам
		// например, admin.DELETE("/users/:id", handlers.DeleteUserHandler)
	}

	// Пример простого пинг-роута для проверки работоспособности
	router.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "pong"})
	})

	log.Println("Сервер запущен на порту :8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Ошибка запуска сервера: %v", err)
	}
}
