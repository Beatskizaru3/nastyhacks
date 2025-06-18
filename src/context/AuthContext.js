import React, { useState, createContext, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);
    const [favoritedIds, setFavoritedIds] = useState([]);

    const logout = () => {
        setUser(null);
        setToken(null);
        setFavoritedIds([]);
        localStorage.removeItem('token');
    };

   useEffect(() => {
    const loadUserData = async () => {
      if (token) {
        
          try {
                setIsLoading(true);
                  // !!! ЗАГЛУШКА ДЛЯ API. Замените на реальный эндпоинт GoLang бэкенда !!!
                // Ваш GoLang эндпоинт /api/auth/me должен проверять JWT и возвращать
                // данные пользователя и массив его favoriteScriptIds из базы данных.
                const response = await fetch('/user/favorited', {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Отправляем JWT для аутентификации
                  },
                });

                if (response.ok) {
                  const data = await response.json();

                  setUser(data.user); // вытягиваем из json логин пользователя
                  setFavoritedIds(data.favorites || []); // Обновляем локальный кэш избранного
                  console.log('Пользователь и избранное загружены')
                  console.log('Роль пользователя:', data.user.role); 
                } 
                else if (response.status === 401) {
                    console.error('Ошибка аутентификации: токен недействителен. Выход.');
                  logout(); // Разлогиниваем пользователя
                } 
                else {
                  console.error('Ошибка загрузки данных пользователя:', response.status);
                  logout();
                }
              } 
              
              catch (error) {
                console.error('Сетевая ошибка при загрузке данных:', error);
                logout();
              }   
              finally {
                setIsLoading(false);
              } 
      } 
      else {
        setIsLoading(false)
      }
    };

    loadUserData();
  }, [token]); //запускаем эффект при изменении токена

   // 5. Функция для входа пользователя
   const login = (userData, newToken, userFavorites = []) => {
    setUser(userData);
    setToken(newToken);
    setFavoritedIds(userFavorites); // Инициализируем избранное при входе
    localStorage.setItem('token', newToken); // Сохраняем токен в localStorage
  };

  // 6. Функция для добавления/удаления скрипта из избранного
  const toggleFavorite = async(scriptId) => {
    if (!user || !token){
      console.warn('Действие невозможно: пользователь не авторизован.');
      alert('Пожалуйста, войдите, чтобы добавить в избранное!');
      return;
    }

    const isCurrentlyFavorited = favoritedIds.includes(scriptId);

    setFavoritedIds(prevFavorites => 
      isCurrentlyFavorited
        ? prevFavorites.filter(id => id !== scriptId) //  создаёт новый массив, пропуская только те элементы, которые НЕ равны scriptId.
        : [...prevFavorites, scriptId] 
    );

    try {
      // !!! ЗАГЛУШКА ДЛЯ API. Замените на реальный эндпоинт GoLang бэкенда !!!
      const method = isCurrentlyFavorited ? 'DELETE' : 'POST';
      // Если DELETE, ID скрипта в URL: /api/favorites/SCRIPT_ID
      // Если POST, ID скрипта в теле запроса: /api/favorites
      const url = isCurrentlyFavorited ? `/api/favorites/${scriptId}` : '/api/favorites';
      const response = await fetch(url, {
       method: method,
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${token}`, // Отправляем JWT для аутентификации
       },
       body: isCurrentlyFavorited ? null : JSON.stringify({ scriptId }),
      });

      if (!response.ok){
        // Если бэкенд вернул ошибку, ОТКАТЫВАЕМ локальные изменения, чтобы UI соответствовал бэкенду
        setFavoritedIds(prevFavorites => 
          isCurrentlyFavorited
            ? [...prevFavorites, scriptId]
            : prevFavorites.filter(id => id !== scriptId)
        );
        const errorData = await response.json();
        throw new Error(errorData.message || `Ошибка сервера: ${response.status}`);
      }
      console.log(`Статус избранного для скрипта ${scriptId} успешно обновлен на сервере.`);
    } 
    catch (error) {
      console.error('Ошибка при синхронизации избранного с бэкендом:', error);
      // В случае сетевой ошибки, также ОТКАТЫВАЕМ локальные изменения
      setFavoritedIds(prevFavorites =>
        isCurrentlyFavorited
          ? [...prevFavorites, scriptId]
          : prevFavorites.filter(id => id !== scriptId)
      );
      alert('Произошла ошибка при сохранении избранного. Попробуйте снова.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, favoritedIds, login, logout, toggleFavorite }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext);