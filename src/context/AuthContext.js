import React, { useState, createContext, useEffect, useContext, useCallback } from 'react';

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
    const [isLoading, setIsLoading] = useState(true);
    const [favoritedIds, setFavoritedIds] = useState([]);

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        setFavoritedIds([]);
        localStorage.removeItem('token');
        localStorage.removeItem('user'); 
        localStorage.removeItem('favoritedIds'); 
    }, []); 

    useEffect(() => {
        const loadUserData = async () => {
            if (token) {
                try {
                    setIsLoading(true);
                    // 1. Извлекаем базовые данные пользователя непосредственно из токена
                    const decodedToken = decodeJwt(token);
                    if (decodedToken && decodedToken.username && decodedToken.role) {
                        const currentUser = {
                            ID: decodedToken.user_id,
                            Username: decodedToken.username,
                            Role: decodedToken.role,
                            // Если email есть в токене, добавь: Email: decodedToken.email || '',
                        };
                        setUser(currentUser);
                        localStorage.setItem('user', JSON.stringify(currentUser)); 
                        console.log('Пользователь загружен из токена:', currentUser);
                    } else {
                        console.error('Токен не содержит необходимых данных пользователя (username/role). Выход.');
                        logout(); 
                        return;
                    }

                    // 2. Запрашиваем избранное с бэкенда через защищенный маршрут
                    const profileResponse = await fetch('/api/profile', { // Маршрут для получения профиля и избранного
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`, 
                        },
                    });

                    if (profileResponse.ok) {
                        const profileData = await profileResponse.json();
                        // Убедись, что твой бэкенд возвращает favoritedIds в этом ответе
                        setFavoritedIds(profileData.favoritedIds || []);
                        console.log('Избранное загружено из /api/profile.');
                    } else if (profileResponse.status === 401 || profileResponse.status === 403) {
                        console.error('Ошибка аутентификации/авторизации при загрузке профиля. Выход.');
                        logout();
                    } else {
                        console.error('Ошибка загрузки профиля (не 2xx, не 401/403):', profileResponse.status, profileResponse.statusText);
                        const errorData = await profileResponse.json();
                        console.error('Детали ошибки профиля:', errorData);
                        logout();
                    }

                } catch (error) {
                    console.error('Сетевая ошибка при загрузке данных/профиля:', error);
                    logout();
                } finally {
                    setIsLoading(false);
                }
            } else {
                // Если токена нет изначально, просто сбросим состояние
                setUser(null);
                setFavoritedIds([]);
                localStorage.removeItem('user');
                setIsLoading(false);
            }
        };

        loadUserData();
    }, [token, logout]); 

    // Функция для входа пользователя
    const login = useCallback((newToken) => {
        const decodedToken = decodeJwt(newToken);
        if (decodedToken && decodedToken.username && decodedToken.role) {
            const currentUser = {
                ID: decodedToken.user_id,
                Username: decodedToken.username,
                Role: decodedToken.role,
                // Добавь email, если он есть в токене: Email: decodedToken.email || '',
            };
            setUser(currentUser);
            setToken(newToken);
            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(currentUser)); 
            console.log('Login successful. User data set from token:', currentUser);
            // useEffect выше сработает и загрузит favoritedIds
        } else {
            console.error('Неверный формат токена или отсутствуют данные пользователя (username/role) для логина.');
            logout();
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
                // Тело запроса не требуется, если бэкенд берет cardId из URL и сам определяет, добавить или удалить
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
            console.log(`Статус избранного для карточки ${cardId} успешно обновлен на сервере.`);

        } catch (error) {
            console.error('Ошибка при синхронизации избранного с бэкендом:', error);
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