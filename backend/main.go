package main

import (
	"filesharing/backend/admin"
	"filesharing/backend/handlers"
	"filesharing/backend/middleware"

	"github.com/gin-contrib/cors" // ← импортируем
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

func main() {
	router := gin.Default()

	// === CORS ===
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"}, // откуда приходят запросы
		AllowMethods:     []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// === Твои роуты ===
	auth := router.Group("/admin", middleware.AuthAdminMiddleWare())
	auth.POST("/upload", admin.UpLoadFileHandler)
	auth.PATCH("/files/:id", handlers.UpdateByIDHandler)
	auth.DELETE("/files/:id", handlers.DeleteFileHandler)
	auth.POST("/register", admin.RegisterHandler)

	router.POST("/login", admin.LoginUserHandler)
	router.GET("/files", handlers.GetAllFilesHandler)
	router.GET("/files/:id", handlers.GetFileHandler)
	router.GET("/downloads/:id", handlers.DownloadByIDHandler)

	// Статика
	router.Static("/uploads", "./uploads")

	router.Run(":8082")
}
