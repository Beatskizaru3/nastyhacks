package datab

import (
	"database/sql"
	"fmt"
	"log"
	"time"
)

func AddFileNameDB(db *sql.DB, fileName string, filePath string, descripton string, yotubeLink string, thumbnail string) error {
	uniqueFileName := fmt.Sprintf("%d-%s", time.Now().Unix(), fileName)
	_, err := db.Exec("INSERT INTO files(filename, filepath, description, youtube_link, preview_image) VALUES ($1, $2, $3, $4, $5)", uniqueFileName, filePath, descripton, yotubeLink, thumbnail)
	if err != nil {
		log.Println(err)
		return err
	}
	return nil
}

func ConnectDB() *sql.DB {
	connStr := "host=172.17.0.2 port=5432 user=postgres password=Aezakmi1! dbname=postgres sslmode=disable"
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("Ошибка подключения к БД:", err)
	}

	if err = db.Ping(); err != nil {
		log.Fatal("База недоступна:", err)
	}

	log.Println("БД подключена успешно!")
	return db
}
