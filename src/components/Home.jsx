// src/components/HomePage.jsx
import Card from './Card';
import { useState, useEffect, useRef } from "react";
// ОБНОВЛЕНО: Добавлен useLocation из react-router-dom
import { useClickOutside } from '../hooks/useClickOutside'; 
import { Link, useLocation } from "react-router-dom"; 
import { useAuth } from '../context/AuthContext';
import '../styles/main.scss'; // Убедись, что стили для HomePage импортированы


const CARDS_PER_LOAD = 9;

function HomePage({ isCardDetailPage, customLoadButton, customTitle, tagId }) {
  const { favoritedIds, toggleFavorite, user, isLoading: authLoading } = useAuth();
  // *** ВСЕ ВЫЗОВЫ ХУКОВ ДОЛЖНЫ БЫТЬ ЗДЕСЬ, ВНАЧАЛЕ КОМПОНЕНТА ***
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [sortBy, setSortBy] = useState('recent');
  // Логика для фильтра
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);
  useClickOutside(filterRef, () => setIsFilterOpen(false));

  // ОБНОВЛЕНО: Получаем объект location с помощью хука useLocation()
  const location = useLocation(); 

  
  const fetchCardsData = async (pageNumber, currentSortBy, currentTagId) => { // ОБНОВЛЕНО: Параметры для сортировки и tagId
    console.log('fetchCardsData вызвана с pageNumber:', pageNumber, 'sortBy:', currentSortBy, 'tagId:', currentTagId);
    try {
      setLoading(true);
      setError(null);

      const limit = CARDS_PER_LOAD; // Используем константу
      const offset = (pageNumber - 1) * limit;
      let url = `/cards?limit=${limit}&offset=${offset}&sortBy=${currentSortBy}`; 

      if (currentTagId) { // Используем currentTagId
        url += `&tagId=${currentTagId}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! Status: ${response.status}. Response: ${errorText}`);
      }
      const data = await response.json();

      // Если это первая страница, заменяем все карточки.
      // Иначе добавляем к существующим.
      setCards(prevCards => {
        if (pageNumber === 1) {
          return data.cards || [];
        }
        const newCards = data.cards;
        const uniqueNewCards = newCards.filter(
          newCard => !prevCards.some(existingCard => existingCard.ID === newCard.ID)
        );
        return [...prevCards, ...uniqueNewCards];
      });
      setHasMore(data.cards.length === limit);

    } catch (err) {
      setError('Ошибка при загрузке карточек: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ЭФФЕКТ ДЛЯ ПЕРВОНАЧАЛЬНОЙ ЗАГРУЗКИ / СМЕНЫ МАРШРУТА / СОРТИРОВКИ
  useEffect(() => {
    // Сброс состояния при смене tagId (маршрута) или sortBy
    setCards([]);       // Очищаем карточки
    setPage(1);         // Сбрасываем страницу на первую
    setHasMore(true);   // Сбрасываем флаг "есть ещё"
    // Загружаем данные для первой страницы с текущей сортировкой и tagId
    fetchCardsData(1, sortBy, tagId); 
  }, [tagId, sortBy, location.pathname]); // ОБНОВЛЕНО: location.pathname в зависимостях

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchCardsData(nextPage, sortBy, tagId); // Передаем текущие sortBy и tagId
    }
  };

  if (loading && cards.length === 0) {
    return <div className="main container">Загрузка карточек...</div>;
  }

  if (error) {
    return <div className="main container error-message">Ошибка: {error}</div>;
  }

  if (cards.length === 0 && !loading) {
    return <div className="main container">Карточки не найдены.</div>;
  }
  
  const handleSortChange = (sortOption) => {
    // Если выбран тот же вариант сортировки, ничего не делаем
    if (sortBy === sortOption) {
      setIsFilterOpen(false);
      return;
    }
    setSortBy(sortOption);     // Устанавливаем новое значение сортировки
    // useEffect выше сработает и перезагрузит данные с page=1
    setIsFilterOpen(false);    // Закрываем меню фильтрации после выбора
  };

  const toggleFilter = () => { 
    setIsFilterOpen(prev => !prev);
  };

  // Условные рендеры (ранние возвраты)
  if (loading && cards.length === 0) { // Показываем загрузку, только если карточек ещё нет
    return <div className="main container">Загрузка карточек...</div>;
  }

  if (error) {
    return <div className="main container error-message">Ошибка: {error}</div>;
  }

  if (cards.length === 0 && !loading) { // Показываем "нет карточек" только после загрузки
    return <div className="main container">Карточки не найдены.</div>;
  }

  return (
    <div className="main container">
      <div className="main__top">
        <h2 className="main__top-title">{customTitle}</h2>
        <div className="main__top-filter" ref={filterRef}>
          <button className="main__top-filter-button" onClick={toggleFilter}>
            Filter
            <svg className="main__top-filter-button-svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 12H18M3 6H21M9 18H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className={`main__top-filter-body ${isFilterOpen ? 'active' : ''}`}>
            <ul className="main__top-filter-list">
              <li className="main__top-filter-item" onClick={() => handleSortChange('recent')}>Recent</li>
              <li className="main__top-filter-item" onClick={() => handleSortChange('oldest')}>Oldest</li>
              <li className="main__top-filter-item" onClick={() => handleSortChange('downloads')}>Most Downloaded</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="main__cards">
        {cards.map(card => {
          const isDateUnknown = card.UploadedAt === "0001-01-01T00:00:00Z";

          if (isDateUnknown) {
            return null;
          }
          return(
            <Card
            key={card.ID}
            card={card}
            isFavorite={favoritedIds.includes(card.ID)} // Используем favoritedIds из контекста
              toggleFavorite={toggleFavorite} // Используем toggleFavorite из контекста
              disableFavorite={!user || authLoading} // Отключаем кнопку, если не авторизован или данные грузятся
          />
          )
})}
      </div>
      {hasMore && (
        <button onClick={handleLoadMore} disabled={loading} className="main__load-button">
          {loading ? 'Загрузка...' : customLoadButton}
        </button>
      )}
    </div>
  );
}

export default HomePage;