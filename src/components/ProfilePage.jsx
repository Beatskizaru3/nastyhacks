import React, { useState, useEffect, useMemo } from 'react'; // Добавлен useMemo
import { useAuth } from '../context/AuthContext'; 
import Card from './Card'; 
import '../styles/profilePage.scss';
import { mockCards, mockTools, mockExploits } from '../mockData'; // Импортируем моковые данные

function ProfilePage(){
    console.log('ProfilePage: Начало рендера');

    const { user, favoritedIds, isLoading: authLoading, toggleFavorite } = useAuth(); 
    const [favoriteCards, setFavoriteCards] = useState([]); 
    const [loadingFavorites, setLoadingFavorites] = useState(true); 

    // *** ИСПРАВЛЕНИЕ 1: Мемоизируем allAvailableCards ***
    // Это гарантирует, что allAvailableCards будет создан только один раз,
    // предотвращая бесконечный цикл useEffect.
    const allAvailableCards = useMemo(() => {
        console.log('ProfilePage: allAvailableCards мемоизированы');
        return [...mockCards, ...mockTools, ...mockExploits]; 
    }, []); // Пустой массив зависимостей означает, что он будет создан только при первом рендере

    useEffect(() => { 
        console.log('ProfilePage: useEffect (загрузка избранного) сработал. authLoading:', authLoading, 'user:', user, 'favoritedIds:', favoritedIds);
        // Ждем, пока данные аутентификации загрузятся 
        if (!authLoading) { 
            if (user && favoritedIds) { 
                // Фильтруем все доступные карточки, чтобы получить только избранные 
                const foundFavoriteCards = allAvailableCards.filter(card =>  
                    // *** ВАЖНО: Используй card.id или card.ID в зависимости от регистра в mockData ***
                    // Мы предполагаем, что favoritedIds содержит ID с тем же регистром, 
                    // что и поле ID в объектах card из mockData.
                    // Если mockData имеет поле 'id' (маленькая буква), используй card.id
                    // Если mockData имеет поле 'ID' (большая буква), используй card.ID
                    favoritedIds.includes(card.id) // Здесь я предполагаю `card.id` (маленькая буква)
                ); 
                setFavoriteCards(foundFavoriteCards); 
                console.log('ProfilePage: Установлены favoriteCards:', foundFavoriteCards);
            } else { 
                // Если пользователь не авторизован или нет избранных, сбрасываем список 
                setFavoriteCards([]);  
                console.log('ProfilePage: favoriteCards сброшены (пользователь/избранное нет)');
            } 
            setLoadingFavorites(false); // Завершаем загрузку избранного 
            console.log('ProfilePage: loadingFavorites установлен в false');
        } 
        
        return () => {
            console.log('ProfilePage: useEffect Cleanup (размонтирование/перерендер)');
        };
    }, [user, favoritedIds, authLoading, allAvailableCards]); // allAvailableCards теперь стабилен

    // --- ИСПРАВЛЕНИЕ 2: Раскомментируем условный рендеринг --- 
    if (authLoading || loadingFavorites) { 
        console.log('ProfilePage: Рендер - Загрузка данных профиля...');
        return <div className="container">Загрузка данных профиля...</div>; 
    } 

    if (!user) { 
        console.log('ProfilePage: Рендер - Пользователь не авторизован...');
        return <div className="container">Вы не авторизованы. Пожалуйста, войдите в систему.</div>; 
    } 
    
    console.log(`ProfilePage: Завершение рендера JSX. favoriteCards.length: ${favoriteCards.length}`);

    return( 
        <div className="profile container"> 
            <h2 className="profile__title"> 
                My profile 
            </h2> 
            <div className="profile__body"> 
                <svg fill="#000000" version="1.1" id="Ebene_1"  
                    width="50px" height="50px" viewBox="0 0 64 64" enable-background="new 0 0 64 64" > 
                    <g> 
                        <path d="M32,42c8.271,0,15-8.523,15-19S40.271,4,32,4s-15,8.523-15,19S23.729,42,32,42z M32,8c5.963,0,11,6.869,11,15 
                            s-5.037,15-11,15s-11-6.869-11-15S26.037,8,32,8z"/> 
                        <path d="M4.103,45.367l-4,12c-0.203,0.61-0.101,1.28,0.275,1.802C0.753,59.691,1.357,60,2,60h60c0.643,0,1.247-0.309,1.622-0.831 
                            c0.376-0.521,0.479-1.191,0.275-1.802l-4-12c-0.209-0.626-0.713-1.108-1.348-1.29l-14-4c-0.482-0.139-0.996-0.09-1.444,0.134 
                            L32,45.764l-11.105-5.553c-0.448-0.224-0.962-0.272-1.444-0.134l-14,4C4.815,44.259,4.312,44.741,4.103,45.367z M19.802,44.137 
                            l11.304,5.652c0.562,0.281,1.227,0.281,1.789,0l11.304-5.652l12.238,3.496L59.226,56H4.774l2.789-8.367L19.802,44.137z"/> 
                    </g> 
                </svg> 
                {/* ИСПРАВЛЕНИЕ 3: Отображаем реальное имя пользователя */}
                <h4 className="profile__nick">{user ? user.Username : "Гость"}</h4> 
            </div> 
            <div className="profile__favorites"> 
                <h2 className="profile__favorites-title">My Favorites</h2> 
                {favoriteCards.length > 0 ? ( // Проверяем, есть ли избранные карточки
                    favoriteCards.map(card => { 
                        // *** ИСПРАВЛЕНИЕ 4: Добавляем 'return' в map-функцию ***
                        console.log('ProfilePage: Рендер Card для ID:', card.id || card.ID, 'Title:', card.title || card.Title);
                        return (
                            <Card  
                                // *** ВАЖНО: Используй card.id или card.ID в зависимости от регистра в mockData ***
                                // Здесь я предполагаю `card.id`
                                key={card.id} 
                                card={card} 
                                isFavorite={true} // Предполагаем, что все карточки в этом списке избранные
                                toggleFavorite={toggleFavorite} 
                                disableFavorite={authLoading} // Отключаем кнопку, если идет загрузка Auth 
                            /> 
                        );
                    })
                ) : ( // Если favoriteCards пуст, показываем сообщение
                    <p>У вас пока нет избранных карточек.</p>
                )}
            </div> 
        </div> 
    ) 
} 

export default ProfilePage;