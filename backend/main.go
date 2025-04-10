package main

import "github.com/gin-gonic/gin"

func main() {
	router := gin.Default()

	router.GET("/files", func(c *gin.Context) {
		//получаемв ответ полный список файлов
		var request string
		c.ShouldBindJSON(&request)

		c.JSON(200, gin.H{"response": request})
	})

	router.GET("/files/:filename??", func(ctx *gin.Context) {
		//из тела запроса считывалось какой айдишник файла
		//и затем искало файл по айди и скачивало

	})
	router.POST("/upload", func(ctx *gin.Context) {

		//считывало тело запроса, распаршивало его в структуру с биндами
		//и затем сохраняло поле из структуры в папку отдельную
		//файл должен иметь свой уникальный айли для того чтобы юзеры могли его скачать
	})
	router.Run()
}
