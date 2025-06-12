package handlers

import (
	"database/sql"
	"filesharing/backend/datab"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func GetFileHandler(ctx *gin.Context) {
	db := datab.ConnectDB()
	defer db.Close()
	fileID := ctx.Param("id")
	var fileData struct {
		ID                int
		Filename          string
		Filepath          string
		UploadedAt        string
		DownloadCount     string
		RealDownloadCount string
		Description       string
		YoutubeLink       string
		PreviewImage      string
	}
	err := db.QueryRow("SELECT id, filename, filepath, uploaded_at, download_count, real_download_count, description,youtube_link, preview_image FROM files WHERE id = $1", fileID).
		Scan(&fileData.ID, &fileData.Filename, &fileData.Filepath, &fileData.UploadedAt, &fileData.DownloadCount, &fileData.RealDownloadCount, &fileData.Description, &fileData.YoutubeLink, &fileData.PreviewImage)
	if err == sql.ErrNoRows {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Internal error"})
		return
	}

	output := gin.H{
		"id":                  fileData.ID,
		"filename":            fileData.Filename,
		"filepath":            fileData.Filepath,
		"description":         fileData.Description,
		"youtube_link":        fileData.YoutubeLink,
		"preview_image":       fileData.PreviewImage,
		"uploaded_at":         fileData.UploadedAt,
		"download_count":      fileData.DownloadCount,
		"real_download_count": fileData.RealDownloadCount,
	}
	ctx.JSON(http.StatusOK, output)
}
func GetAllFilesHandler(ctx *gin.Context) {
	db := datab.ConnectDB()
	defer db.Close()
	sortField := ctx.DefaultQuery("sort", "date") // дефолтное значени параетра в ссылке
	pageStr := ctx.DefaultQuery("page", "1")
	limitStr := ctx.DefaultQuery("limit", "10")

	page, _ := strconv.Atoi(pageStr)
	limit, _ := strconv.Atoi(limitStr)
	offset := (page - 1) * limit

	var orderBy string

	switch sortField {
	case "downloads":
		orderBy = "download_count DESC"
	case "name":
		orderBy = "filename ASC"
	default:
		orderBy = "uploaded_at DESC"
	}

	rows, err := db.Query("SELECT id, filename, filepath, description, youtube_link, preview_image, uploaded_at, download_count FROM files ORDER BY $1 LIMIT $2 OFFSET $3;", orderBy, limit, offset)
	if err != nil {
		log.Println("Ошибка при запросе к БД:", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при запросе к БД"})
		return
	}

	defer rows.Close()

	var output []gin.H

	for rows.Next() {

		var id int
		var filename string
		var filepath string
		var description string
		var youtubeLink string
		var previewImage string
		var uploadedAt string
		var downloadCount int
		if err := rows.Scan(&id, &filename, &filepath, &description, &youtubeLink, &previewImage, &uploadedAt, &downloadCount); err != nil {
			log.Println("Error while reading db")
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Error while reading db"})
			return
		}

		output = append(output, gin.H{
			"id":             id,
			"filename":       filename,
			"filepath":       filepath,
			"description":    description,
			"youtube_link":   youtubeLink,
			"preview_image":  previewImage,
			"uploaded_at":    uploadedAt,
			"download_count": downloadCount,
		})

		if err := rows.Err(); err != nil {
			log.Println("Ошибка при обработке данных:", err)
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при обработке данных"})
			return
		}
	}
	if err := rows.Err(); err != nil {
		log.Println("Ошибка при получения:", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получения"})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"files": output})
}

// ??
func DeleteFileHandler(ctx *gin.Context) {
	fileID := ctx.Param("id")
	if fileID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "ID не указан"})
		return
	}

	db := datab.ConnectDB()
	defer db.Close()

	// Получаем путь к файлу из базы
	var filePath string
	err := db.QueryRow("SELECT filepath FROM files WHERE id = $1", fileID).Scan(&filePath)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Файл не найден"})
		return
	}

	// Удаляем файл с диска
	if _, statErr := os.Stat(filePath); statErr == nil {
		if rmErr := os.Remove(filePath); rmErr != nil {
			log.Println("Ошибка при удалении файла с диска:", rmErr)
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при удалении файла с диска"})
			return
		}
	}

	// Удаляем запись из базы
	_, err = db.Exec("DELETE FROM files WHERE id = $1", fileID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при удалении записи из базы"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Файл успешно удалён"})
}

func DownloadByIDHandler(ctx *gin.Context) {
	fileID := ctx.Param("id")

	db := datab.ConnectDB()
	defer db.Close()

	var filepathstr string
	var downloadCount, realDownloadCount int
	err := db.QueryRow("SELECT filepath, download_count, real_download_count FROM files WHERE id = $1", fileID).Scan(&filepathstr, &downloadCount, &realDownloadCount)
	if err == sql.ErrNoRows {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Файл не найден в базе"})
		return
	} else if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка запроса к БД"})
		return
	}

	if _, err := os.Stat(filepathstr); os.IsNotExist(err) {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Файл не найден на диске"})
		return
	}

	absPath, err := filepath.Abs(filepathstr)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка преобразования пути"})
		return
	}

	uploadsDir, err := filepath.Abs("./uploads")
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка преобразования пути к uploads"})
		return
	}

	if !strings.HasPrefix(absPath, uploadsDir) {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "Недопустимый путь"})
		return
	}
	downloadCount++
	realDownloadCount++
	db.Exec("UPDATE files SET download_count = $1, real_download_count = $2 WHERE id = $3", downloadCount, realDownloadCount, fileID)
	ctx.Header("Content-Disposition", fmt.Sprintf("attachment; fileId=\"%s\"", fileID))
	ctx.File(absPath)
}

// ??
func UpdateByIDHandler(ctx *gin.Context) {
	// Получаем ID файла из URL
	fileID := ctx.Param("id")
	if fileID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Empty id"})
		return
	}

	db := datab.ConnectDB()
	defer db.Close()

	// Получаем текущую информацию о файле из БД
	var currentInfo struct {
		ID           int
		Filename     string
		FilePath     string
		Description  string
		YouTubeLink  string
		PreviewImage string
	}
	err := db.QueryRow("SELECT id, filename, filepath, description, youtube_link, preview_image FROM files WHERE id = $1", fileID).
		Scan(&currentInfo.ID, &currentInfo.Filename, &currentInfo.FilePath, &currentInfo.Description, &currentInfo.YouTubeLink, &currentInfo.PreviewImage)
	if err != nil {
		ctx.String(http.StatusNotFound, "File not found")
		return
	}

	// Получаем новые данные из формы. Если отсутствуют — оставляем старые.
	newDesc := ctx.DefaultPostForm("description", currentInfo.Description)
	newYouTubeLink := ctx.DefaultPostForm("youtube_link", currentInfo.YouTubeLink)
	// Параметр, который пользователь хочет отобразить на сайте (без префиксов времени)
	providedNewName := ctx.PostForm("filename")

	// ========= Обработка основного файла =========
	var newFilePath string
	var newFileName string
	newMainFile, fileErr := ctx.FormFile("file")
	if fileErr == nil {
		// Новый основной файл передан. Удаляем старый (если существует).
		if _, statErr := os.Stat(currentInfo.FilePath); statErr == nil {
			if rmErr := os.Remove(currentInfo.FilePath); rmErr != nil {
				log.Println("Ошибка при удалении старого файла:", rmErr)
				ctx.String(http.StatusInternalServerError, "Ошибка при удалении старого файла")
				return
			}
			log.Println("Старый основной файл удалён")
		}
		// Сохраняем новый файл с уникальным именем для диска
		uniqueDiskName := fmt.Sprintf("%d-%s", time.Now().Unix(), newMainFile.Filename)
		newFilePath = fmt.Sprintf("./uploads/%s", uniqueDiskName)
		if saveErr := ctx.SaveUploadedFile(newMainFile, newFilePath); saveErr != nil {
			log.Println("Ошибка при сохранении нового файла:", saveErr)
			ctx.String(http.StatusInternalServerError, "Ошибка при сохранении нового файла")
			return
		}
		// Записываем в базу имя из запроса, если передано, иначе берем имя из загруженного файла
		if providedNewName != "" {
			newFileName = providedNewName
		} else {
			newFileName = newMainFile.Filename
		}
	} else {
		// Новый основной файл не передан.
		// Если в запросе передано новое имя и оно отличается, то переименовываем старый файл.
		if providedNewName != "" && providedNewName != currentInfo.Filename {
			// Получаем расширение текущего файла
			ext := filepath.Ext(currentInfo.FilePath)
			uniqueDiskName := fmt.Sprintf("%d-%s%s", time.Now().Unix(), providedNewName, ext)
			newFilePath = fmt.Sprintf("./uploads/%s", uniqueDiskName)
			if renameErr := os.Rename(currentInfo.FilePath, newFilePath); renameErr != nil {
				log.Println("Ошибка при переименовании файла:", renameErr)
				ctx.String(http.StatusInternalServerError, "Ошибка при переименовании файла")
				return
			}
			newFileName = providedNewName
		} else {
			newFileName = currentInfo.Filename
			newFilePath = currentInfo.FilePath
		}
	}

	// ========= Обработка превью изображения =========
	var newPreviewPath string
	previewHeader, prevErr := ctx.FormFile("preview_image")
	if prevErr == nil {
		// Если новое превью передано, удаляем старое (если существует)
		if currentInfo.PreviewImage != "" {
			if rmErr := os.Remove(currentInfo.PreviewImage); rmErr != nil {
				log.Println("Ошибка при удалении старого превью:", rmErr)
				// Логируем, но продолжаем обновление
			} else {
				log.Println("Старое превью удалено")
			}
		}
		uniquePreviewName := fmt.Sprintf("%d-%s", time.Now().Unix(), previewHeader.Filename)
		newPreviewPath = fmt.Sprintf("./uploads/thumbs/%s", uniquePreviewName)
		if saveErr := ctx.SaveUploadedFile(previewHeader, newPreviewPath); saveErr != nil {
			log.Println("Ошибка при сохранении нового превью:", saveErr)
			ctx.String(http.StatusInternalServerError, "Ошибка при сохранении нового превью")
			return
		}
	} else {
		newPreviewPath = currentInfo.PreviewImage
	}

	// ========= Обновление записи в базе данных =========
	query := "UPDATE files SET filename=$1, filepath=$2, description=$3, youtube_link=$4, preview_image=$5 WHERE id=$6"
	_, err = db.Exec(query, newFileName, newFilePath, newDesc, newYouTubeLink, newPreviewPath, fileID)
	if err != nil {
		log.Println("Ошибка при обновлении данных файла:", err)
		ctx.String(http.StatusInternalServerError, "Ошибка при обновлении данных файла")
		return
	}

	ctx.String(http.StatusOK, fmt.Sprintf("Файл '%s' успешно обновлён", newFileName))
}
