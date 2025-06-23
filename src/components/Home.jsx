// src/components/HomePage.jsx
import Card from './Card';
import { useState, useEffect, useRef } from "react";
import { useClickOutside } from '../hooks/useClickOutside'; 
import { Link, useLocation } from "react-router-dom"; // useLocation уже импортирован
import { useAuth } from '../context/AuthContext';
import '../styles/main.scss'; // Убедись, что стили для HomePage импортированы

// Импорт SVG-иконок, если они у вас как отдельные компоненты
// import { Users2, DownloadCloud, FileText, Tag, SendHorizontal } from 'lucide-react'; // Пример, если используете react-icons или подобное

const CARDS_PER_LOAD = 9;

function HomePage({ isCardDetailPage, customLoadButton, customTitle, tagId }) {
  const { favoritedIds, toggleFavorite, user, isLoading: authLoading } = useAuth();
  
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [sortBy, setSortBy] = useState('recent');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);
  useClickOutside(filterRef, () => setIsFilterOpen(false));

  const location = useLocation(); // Получаем объект location
  const { pathname } = location; // Извлекаем текущий путь

  
  const fetchCardsData = async (pageNumber, currentSortBy, currentTagId) => {
    console.log('fetchCardsData вызвана с pageNumber:', pageNumber, 'sortBy:', currentSortBy, 'tagId:', currentTagId);
    try {
      setLoading(true);
      setError(null);

      const limit = CARDS_PER_LOAD;
      const offset = (pageNumber - 1) * limit;
      let url = `/cards?limit=${limit}&offset=${offset}&sortBy=${currentSortBy}`; 

      if (currentTagId) {
        url += `&tagId=${currentTagId}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! Status: ${response.status}. Response: ${errorText}`);
      }
      const data = await response.json();

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

  useEffect(() => {
    setCards([]);
    setPage(1);
    setHasMore(true);
    fetchCardsData(1, sortBy, tagId); 
  }, [tagId, sortBy, pathname]); // Используем pathname из useLocation

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchCardsData(nextPage, sortBy, tagId);
    }
  };
  
  const handleSortChange = (sortOption) => {
    if (sortBy === sortOption) {
      setIsFilterOpen(false);
      return;
    }
    setSortBy(sortOption);
    setIsFilterOpen(false);
  };

  const toggleFilter = () => { 
    setIsFilterOpen(prev => !prev);
  };

  // Ранние возвраты для состояний загрузки/ошибки/отсутствия карточек
  // Важно: эти возвраты должны быть здесь, чтобы не рендерить остальную часть
  // компонента, если данные ещё не загружены или есть ошибка.
  if (loading && cards.length === 0) {
    return <div className="main container">Загрузка карточек...</div>;
  }

  if (error) {
    return <div className="main container error-message">Ошибка: {error}</div>;
  }

  if (cards.length === 0 && !loading) {
    return <div className="main container">Карточки не найдены.</div>;
  }

  return (
    <div className="main container">
      {/* Секция с основным контентом (карточки, фильтр) */}
      <section className="main"> {/* Здесь class "main" будет от styles, если main.scss импортирован как styles */}
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
                isFavorite={favoritedIds.includes(card.ID)}
                toggleFavorite={toggleFavorite}
                disableFavorite={!user || authLoading}
              />
            );
          })}
        </div>
        {hasMore && (
          <button onClick={handleLoadMore} disabled={loading} className="main__load-button">
            {loading ? 'Загрузка...' : customLoadButton}
          </button>
        )}
      </section>

      {/* --- СЕКЦИЯ СТАТИСТИКИ (ОТОБРАЖАЕТСЯ ТОЛЬКО НА ГЛАВНОЙ СТРАНИЦЕ) --- */}
      {/* Проверяем, что текущий путь - это корневой путь "/" */}
      {pathname === '/' && ( 
        <section className="stat"> {/* Используйте `styles.stat` если стили импортируются как объект `styles` */}
          <h2 className="stat__title">Статистика использования платформы</h2>
          <p className="stat__description">Показатели активности пользователей и контента.</p>

          <div className="stat__blocks">
            <div className="stat__blocks-dashboard">
              {/* Если у вас иконки как компоненты, используйте их: <Users2 /> */}
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users-2"><path d="M14 19a6 6 0 0 0-12 0"/><circle cx="8" cy="9" r="4"/><path d="M22 19a6 6 0 0 0-12 0"/><circle cx="16" cy="9" r="4"/></svg>
              <h3>Всего пользователей</h3>
              <p>1000+</p> {/* Замените на динамические данные из API, если они есть */}
            </div>
            <div className="stat__blocks-dashboard">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download-cloud"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.099"/><path d="M12 12v6"/><path d="m15 15-3 3-3-3"/></svg>
              <h3>Общее количество скачиваний</h3>
              <p>5000+</p>
            </div>
            <div className="stat__blocks-dashboard">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
              <h3>Всего файлов</h3>
              <p>200+</p>
            </div>
            <div className="stat__blocks-dashboard">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-tag"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414L19 21.414a2 2 0 0 0 2.828 0l2.586-2.586a2 2 0 0 0 0-2.828Z"/><path d="M7 7h.01"/></svg>
              <h3>Категорий</h3>
              <p>15+</p>
            </div>
          </div>

          <div className="stat__inTouch">
            <h3>Оставайтесь на связи</h3>
            <p>Присоединяйтесь к нашему сообществу, чтобы быть в курсе последних обновлений и эксклюзивных предложений!</p>
            <button>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send-horizontal"><path d="m3 3 3 9-3 9 19-9Z"/><path d="M22 12H6"/></svg>
              Написать нам
            </button>
          </div>
        </section>
      )} {/* Конец условного рендеринга для секции статистики */}

      {/* Футер */}
      <footer className="footer"> {/* Здесь class "footer" будет от styles */}
        <div className="footer__creds">
          <p>&copy; 2025 NastyHacks. Все права защищены.</p>
        </div>
        <div className="footer__useful">
          <span><Link to="/terms">Условия использования</Link></span> {/* Используйте Link для навигации */}
          <span><Link to="/privacy">Политика конфиденциальности</Link></span>
          <span><Link to="/contact">Контакты</Link></span>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;