package admin

import (
	"filesharing/backend/datab"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

func UpLoadFileHandler(ctx *gin.Context) {
	// Получаем основной файл
	file, err := ctx.FormFile("file")
	if err != nil {
		ctx.String(http.StatusBadRequest, "Файл не был загружен")
		return
	}

	// Создаём уникальное имя и путь
	uniqueFileName := fmt.Sprintf("%d-%s", time.Now().Unix(), file.Filename)
	dst := fmt.Sprintf("./uploads/%s", uniqueFileName)

	// Создаём папку,
	if _, err := os.Stat("./uploads"); os.IsNotExist(err) {
		err = os.Mkdir("./uploads", os.ModePerm)
		if err != nil {
			log.Println("Ошибка при создании папки uploads:", err)
			ctx.String(http.StatusInternalServerError, "Ошибка сервера")
			return
		}
		log.Println("uploads dir created")
	}

	if err := ctx.SaveUploadedFile(file, dst); err != nil {
		log.Println("Ошибка при сохранении файла:", err)
		ctx.String(http.StatusInternalServerError, "Ошибка при сохранении файла")
		return
	}

	desc := ctx.PostForm("description")
	youtubeLink := ctx.PostForm("youtube_link")

	if _, err := os.Stat("./uploads/thumbs"); os.IsNotExist(err) {
		err = os.Mkdir("./uploads/thumbs", os.ModePerm)
		if err != nil {
			log.Println("Ошибка при создании папки thumbs:", err)
			ctx.String(http.StatusInternalServerError, "Ошибка сервера")
			return
		}
		log.Println("thumbs dir created")
	}

	// Обработка превьюшки
	var thumbnailPath string
	previewHeader, err := ctx.FormFile("preview_image")

	if err == nil {
		previewFileName := fmt.Sprintf("%d-%s", time.Now().Unix(), file.Filename)
		thumbnailPath = fmt.Sprintf("./uploads/thumbs/%s", previewFileName) // save thumb to dir

		if err := ctx.SaveUploadedFile(previewHeader, thumbnailPath); err != nil {
			log.Println("Ошибка при сохранении превью:", err)
			ctx.String(http.StatusInternalServerError, "Ошибка при сохранении превью")
			return
		}
	} else {
		log.Println("Превью не было загружено или отсутствует — продолжаем без него")
		thumbnailPath = "" // Можно оставить пустым или NULL в БД
	}

	db := datab.ConnectDB()
	defer db.Close()

	err = datab.AddFileNameDB(db, file.Filename, dst, desc, youtubeLink, thumbnailPath)
	if err != nil {
		log.Println("Ошибка при записи в БД:", err)
		ctx.String(http.StatusInternalServerError, "Ошибка при записи в БД")
		return
	}

	ctx.String(http.StatusOK, fmt.Sprintf("'%s' успешно загружен!", file.Filename))
}
