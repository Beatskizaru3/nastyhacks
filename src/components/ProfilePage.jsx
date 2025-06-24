// src/pages/ProfilePage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card'; // Путь к твоему компоненту Card
import '../styles/profilePage.scss';
import { useNavigate } from 'react-router-dom'; // <--- УБЕДИСЬ, ЧТО ЭТОТ ИМПОРТ ЕСТЬ

function ProfilePage(){
    console.log('ProfilePage: Начало рендера');
    
    // favoritedIds теперь будет источником истины для того, что ИЗБРАНО
    const { user, favoritedIds, isLoading: authLoading, token, toggleFavorite, logout } = useAuth(); 
    // favoriteCards теперь будут просто отображением тех карточек, что мы загрузили
    const [favoriteCards, setFavoriteCards] = useState([]);
    const [loadingInitialFavorites, setLoadingInitialFavorites] = useState(true); // Переименовал для ясности

    const navigate = useNavigate();
    
    const API_BASE_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        console.log('ProfilePage: useEffect (загрузка избранного) сработал. authLoading:', authLoading, 'user:', user, 'favoritedIds:', favoritedIds);

        const fetchInitialFavoriteCards = async () => {
            // Если пользователь не авторизован или токена нет, или AuthContext ещё загружается
            if (!user || !token || authLoading) {
                setLoadingInitialFavorites(false);
                setFavoriteCards([]); // Сбросить, если нет юзера
                return;
            }

            // Если favoritedIds пуст, не делаем запрос к API, просто сбрасываем и завершаем
            if (favoritedIds.length === 0) {
                setFavoriteCards([]);
                setLoadingInitialFavorites(false);
                console.log('ProfilePage: favoritedIds пуст, нет избранных карточек для загрузки.');
                return;
            }

            try {
                setLoadingInitialFavorites(true);
                // Отправляем запрос только если у нас есть ID, которые нужно загрузить
                // Бэкенд GetFavoriteCardsHandler теперь сам берет favoritedIds из БД
                const response = await fetch(`${API_BASE_URL}/api/cards/favorites`, {
                    method: 'POST', // Твой бэкенд ожидает POST
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    // НЕ ОТПРАВЛЯЕМ favoritedIds в теле, если бэкенд сам их получает по userID
                    // Если твой бэкенд ожидает body: JSON.stringify({ card_ids: favoritedIds }), то раскомментируй
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json(); // Ожидаем массив полных объектов карточек
                setFavoriteCards(data);
                console.log('ProfilePage: Установлены favoriteCards из API:', data);

            } catch (error) {
                console.error('ProfilePage: Ошибка при загрузке избранных карточек из API:', error);
                setFavoriteCards([]);
            } finally {
                setLoadingInitialFavorites(false);
            }
        };

        // Загружаем карточки ТОЛЬКО при первой загрузке компонента или если user/token меняются.
        // favoritedIds уже обновляются оптимистично в AuthContext,
        // поэтому мы будем использовать их для фильтрации уже загруженных карточек.
        fetchInitialFavoriteCards();

        return () => {
            console.log('ProfilePage: useEffect Cleanup (размонтирование/перерендер)');
        };
    }, [user, token, authLoading]); // Зависимости для fetchInitialFavoriteCards

    // *** НОВОЕ ДОБАВЛЕНИЕ: Мемоизация и фильтрация favoriteCards ***
    // Этот useMemo будет реагировать на изменения favoritedIds из AuthContext
    // и фильтровать уже загруженные favoriteCards, чтобы удалить те, которые больше не в избранном.
    const displayedFavoriteCards = useMemo(() => {
        // Если favoritedIds изменился (пользователь удалил/добавил что-то),
        // фильтруем уже загруженные карточки.
        // Это предотвратит полный перезапрос данных каждый раз, когда что-то меняется.
        return favoriteCards.filter(card => favoritedIds.includes(card.ID));
    }, [favoriteCards, favoritedIds]); // Зависимости: сами загруженные карточки и актуальные ID избранного

    if (authLoading || loadingInitialFavorites) {
        console.log('ProfilePage: Рендер - Загрузка данных профиля...');
        return <div className="container">Загрузка данных профиля...</div>;
    }

    if (!user) {
        console.log('ProfilePage: Рендер - Пользователь не авторизован...');
        return <div className="container">Вы не авторизованы. Пожалуйста, войдите в систему.</div>;
    }

    console.log(`ProfilePage: Завершение рендера JSX. displayedFavoriteCards.length: ${displayedFavoriteCards.length}`);

    const handleLogout = async () => { // <--- НОВАЯ ФУНКЦИЯ ДЛЯ ВЫХОДА
        try {
            await logout(); // Вызываем функцию logout из AuthContext
            navigate('/'); // Перенаправляем пользователя на главную страницу после выхода
            console.log('Пользователь успешно вышел из системы.');
        } catch (error) {
            console.error('Ошибка при выходе из системы:', error);
            // Можно добавить уведомление пользователю об ошибке
        }
    };
    return(
        <div className="profile container">
            <div className="profile__header">
            <h2 className="profile__title">
                My profile
            </h2>
            <button 
                className='profile__logout' 
                onClick={handleLogout} // <--- ДОБАВЬ ОБРАБОТЧИК К КНОПКЕ
                disabled={authLoading} // <--- ОПЦИОНАЛЬНО: Отключаем кнопку во время загрузки аутентификации
            >
                Log out
            </button>
            </div>
            <div className="profile__body">
                <svg fill="#000000" version="1.1" id="Ebene_1"
                    width="50px" height="50px" viewBox="0 0 64 64" enableBackground="new 0 0 64 64" > {/* ИСПРАВЛЕНО */}
                    <g>
                        <path d="M32,42c8.271,0,15-8.523,15-19S40.271,4,32,4s-15,8.523-15,19S23.729,42,32,42z M32,8c5.963,0,11,6.869,11,15
                            s-5.037,15-11,15s-11-6.869-11-15S26.037,8,32,8z"/>
                        <path d="M4.103,45.367l-4,12c-0.203,0.61-0.101,1.28,0.275,1.802C0.753,59.691,1.357,60,2,60h60c0.643,0,1.247-0.309,1.622-0.831
                            c0.376-0.521,0.479-1.191,0.275-1.802l-4-12c-0.209-0.626-0.713-1.108-1.348-1.29l-14-4c-0.482-0.139-0.996-0.09-1.444,0.134
                            L32,45.764l-11.105-5.553c-0.448-0.224-0.962-0.272-1.444-0.134l-14,4C4.815,44.259,4.312,44.741,4.103,45.367z M19.802,44.137
                            l11.304,5.652c0.562,0.281,1.227,0.281,1.789,0l11.304-5.652l12.238,3.496L59.226,56H4.774l2.789-8.367L19.802,44.137z"/>
                    </g>
                </svg>
                <h4 className="profile__nick">{user ? user.Username : "Гость"}</h4>
            </div>
            <div className="profile__favorites">
                <h2 className="profile__favorites-title">My Favorites</h2>
                {displayedFavoriteCards.length > 0 ? ( // Используем displayedFavoriteCards
                    <div className="profile__cards">
                        {displayedFavoriteCards.map(card => { // Используем displayedFavoriteCards
                            console.log('ProfilePage: Рендер Card для ID:', card.ID, 'Title:', card.Title);
                            return (
                                <Card
                                    key={card.ID}
                                    card={card}
                                    // Теперь isFavorite определяется динамически из favoritedIds
                                    isFavorite={favoritedIds.includes(card.ID)}
                                    toggleFavorite={toggleFavorite}
                                    disableFavorite={authLoading}
                                />
                            );
                        })}
                    </div>
                ) : (
                    <p>У вас пока нет избранных карточек.</p>
                )}
            </div>
        </div>
    )
}

export default ProfilePage;