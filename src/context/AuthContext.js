import React, { useState, createContext, useEffect, useContext, useCallback } from 'react';
// УБЕДИТЕСЬ, ЧТО ИМПОРТА useNavigate ЗДЕСЬ НЕТ, так как AuthProvider не является прямым потомком <Router>
// import { useNavigate } from 'react-router-dom'; 

const AuthContext = createContext(null);

// Вспомогательная функция для декодирования JWT
const decodeJwt = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Ошибка декодирования JWT:", e);
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true); // Состояние загрузки AuthContext (для инициализации)
    const [favoritedIds, setFavoritedIds] = useState([]);

    // Логика выхода из системы
    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        setFavoritedIds([]);
        localStorage.removeItem('token');
        localStorage.removeItem('user'); 
        localStorage.removeItem('favoritedIds'); 
        // Перенаправление после выхода должно происходить в компоненте, который вызывает logout (например, ProfilePage)
    }, []); 

    // useEffect для первоначальной загрузки данных пользователя и избранного при монтировании AuthProvider
    // или при изменении токена (например, после входа или обновления страницы)
    useEffect(() => {
        const loadUserData = async () => {
            if (token) {
                try {
                    setIsLoading(true); // Начинаем загрузку

                    // 1. Извлекаем базовые данные пользователя непосредственно из токена
                    const decodedToken = decodeJwt(token);
                    // Проверяем, что токен декодирован и содержит необходимые поля
                    if (decodedToken && decodedToken.username && decodedToken.role) {
                        const currentUser = {
                            ID: decodedToken.user_id,
                            Username: decodedToken.username, // <--- ИСПОЛЬЗУЕМ username (строчные буквы)
                            Role: decodedToken.role,         // <--- ИСПОЛЬЗУЕМ role (строчные буквы)
                        };
                        setUser(currentUser); // Устанавливаем пользователя в состояние
                        localStorage.setItem('user', JSON.stringify(currentUser)); 
                        console.log('AuthContext: Пользователь загружен из токена:', currentUser);
                    } else {
                        // Если токен невалиден или не содержит нужных полей, выходим из системы
                        console.error('AuthContext: Токен не содержит необходимых данных пользователя (username/role). Выход.');
                        logout(); 
                        setIsLoading(false); // Завершаем загрузку даже при ошибке
                        return; // Прекращаем выполнение
                    }

                    // 2. Запрашиваем избранное с бэкенда через защищенный маршрут
                    const profileResponse = await fetch('/api/profile', { // Убедитесь, что это правильный эндпоинт для профиля/избранного
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`, 
                        },
                    });

                    if (profileResponse.ok) {
                        const profileData = await profileResponse.json();
                        // Убедитесь, что ваш бэкенд возвращает избранные ID в поле 'favorites'
                        setFavoritedIds(profileData.favorites || []);
                        console.log('AuthContext: favoritedIds установлен в:', profileData.favorites);
                        console.log('AuthContext: Избранное загружено из /api/profile.');
                    } else if (profileResponse.status === 401 || profileResponse.status === 403) {
                        // Если токен просрочен или невалиден на сервере
                        console.error('AuthContext: Ошибка аутентификации/авторизации при загрузке профиля. Выход.');
                        logout();
                    } else {
                        // Другие ошибки при загрузке профиля
                        console.error('AuthContext: Ошибка загрузки профиля (не 2xx, не 401/403):', profileResponse.status, profileResponse.statusText);
                        const errorData = await profileResponse.json();
                        console.error('AuthContext: Детали ошибки профиля:', errorData);
                        logout();
                    }

                } catch (error) {
                    // Обработка сетевых ошибок или ошибок парсинга JWT
                    console.error('AuthContext: Сетевая ошибка при загрузке данных/профиля или ошибка декодирования токена:', error);
                    logout();
                } finally {
                    setIsLoading(false); // Всегда завершаем загрузку
                }
            } else {
                // Если токена нет изначально (пользователь не залогинен), просто сбрасываем состояние и завершаем загрузку
                setUser(null);
                setFavoritedIds([]);
                localStorage.removeItem('user');
                setIsLoading(false);
            }
        };

        loadUserData(); // Вызываем функцию загрузки данных

    }, [token, logout]); // Зависимости: токен (для повторной загрузки при изменении) и logout (для использования в колбэке)

    // Функция для входа пользователя
    // Теперь она принимает username и password, выполняет fetch-запрос и сохраняет токен.
    // Перенаправление происходит в LoginPage.jsx
    const login = useCallback(async (newToken) => { // <-- ПРИНИМАЕТ ТОКЕН!
        setIsLoading(true); // Начинаем загрузку при попытке логина
        try {
            // *** УДАЛЯЕМ ОТСЮДА fetch-ЗАПРОС ***
            // Он уже сделан в LoginPage.jsx

            const decodedToken = decodeJwt(newToken);
            if (decodedToken && decodedToken.username && decodedToken.role) {
                const currentUser = {
                    ID: decodedToken.user_id,
                    Username: decodedToken.username, 
                    Role: decodedToken.role,         
                };
                setUser(currentUser);
                setToken(newToken);   
                localStorage.setItem('token', newToken); 
                localStorage.setItem('user', JSON.stringify(currentUser)); 
                console.log('AuthContext: Успешный вход. Данные пользователя установлены из токена:', currentUser);
                
                setFavoritedIds([]); // Пусто, если нет /api/profile

                return currentUser; 
            } else {
                console.error('AuthContext: Неверный формат токена или отсутствуют данные пользователя (username/role) для логина.');
                logout(); 
                throw new Error('Invalid token format or user data missing.');
            }
        } catch (error) {
            console.error('AuthContext: Ошибка обработки токена входа:', error); // Обновил сообщение
            logout(); 
            throw error; 
        } finally {
            setIsLoading(false); 
        }
    }, [logout]); 

    // Функция для добавления/удаления карточки из избранного
    const toggleFavorite = async (cardId) => {
        if (!user || !token) {
            console.warn('Действие невозможно: пользователь не авторизован.');
            alert('Пожалуйста, войдите, чтобы добавить в избранное!');
            return;
        }

        const isCurrentlyFavorited = favoritedIds.includes(cardId);

        // Оптимистическое обновление UI
        setFavoritedIds(prevFavorites =>
            isCurrentlyFavorited
                ? prevFavorites.filter(id => id !== cardId)
                : [...prevFavorites, cardId]
        );

        try {
            const response = await fetch(`/api/profile/favorite/${cardId}`, { // POST на этот URL для TOGGLE
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                // Откат локальных изменений при ошибке
                setFavoritedIds(prevFavorites =>
                    isCurrentlyFavorited
                        ? [...prevFavorites, cardId]
                        : prevFavorites.filter(id => id !== cardId)
                );
                const errorData = await response.json();
                throw new Error(errorData.message || `Ошибка сервера: ${response.status}`);
            }
            console.log(`AuthContext: Статус избранного для карточки ${cardId} успешно обновлен на сервере.`);

        } catch (error) {
            console.error('AuthContext: Ошибка при синхронизации избранного с бэкендом:', error);
            // Откат локальных изменений при сетевой ошибке
            setFavoritedIds(prevFavorites =>
                isCurrentlyFavorited
                    ? [...prevFavorites, cardId]
                    : prevFavorites.filter(id => id !== cardId)
            );
            alert('Произошла ошибка при сохранении избранного. Попробуйте снова.');
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, favoritedIds, login, logout, toggleFavorite }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);