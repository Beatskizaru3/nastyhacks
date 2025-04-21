package admin

import (
	"filesharing/backend/datab"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

const SECRETCODE = "DKSaxkldj2eojr9HWDH83FOPJW2901!!2w1939&*%&*"

func RegisterUser(username, password string) error {

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	db := datab.ConnectDB()
	defer db.Close()
	var exists bool
	db.QueryRow("SELECT EXISTS(SELECT username FROM users WHERE username = $1)", username).Scan(&exists)
	if exists {
		return fmt.Errorf("User has already exist")
	}
	_, err := db.Exec("INSERT INTO users (username, password) VALUES ($1, $2)", username, string(hashedPassword))
	return err
}

func RegisterHandler(ctx *gin.Context) {
	var inputData struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := ctx.ShouldBindJSON(&inputData); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Something went wrong"})
		return
	}
	err := RegisterUser(inputData.Username, inputData.Password)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err})
		return
	}
}
func LoginUserHandler(ctx *gin.Context) {
	var inputData struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := ctx.BindJSON(&inputData); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Wrong input"})
		return
	}

	var hashedPassword string
	db := datab.ConnectDB()
	defer db.Close()

	err := db.QueryRow("SELECT password FROM users WHERE username = $1", inputData.Username).Scan(&hashedPassword)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Wrong username or password"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(inputData.Password)); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Wrong username or password"})
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"username": inputData.Username,
		"admin":    true,
	})

	tokenString, err := token.SignedString([]byte(SECRETCODE))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Error while signing"})
		fmt.Println(err)
		return
	}
	ctx.JSON(200, gin.H{"token": tokenString})
	log.Println("Login request body:", tokenString)

}
