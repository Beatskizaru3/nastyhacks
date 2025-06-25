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

      const API_BASE_URL = process.env.REACT_APP_API_URL;

      let url = `${API_BASE_URL}/cards?limit=${limit}&offset=${offset}&sortBy=${currentSortBy}`;

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
        // --- ИСПРАВЛЕНИЕ: Преобразуем относительные URL изображений в полные ---
        const transformedCards = (data.cards || []).map(card => {
            let finalImageUrl = card.imageUrl;
            // Проверяем, что URL существует и является относительным
            if (finalImageUrl && !finalImageUrl.startsWith('http://') && !finalImageUrl.startsWith('https://')) {
                finalImageUrl = `${API_BASE_URL}${finalImageUrl}`;
            }
            // (Условие для плейсхолдера удалено, если вы так решили)
            return { ...card, imageUrl: finalImageUrl };
      });
      if (pageNumber === 1) {
        return transformedCards; // Возвращаем преобразованные карточки
    }
    const newCards = transformedCards;
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

 
      {pathname === '/' && ( 
       <section class="stat container"><h2 class="stat__title">Our Modest Statistics</h2><p class="stat__description">Thank you for being a part of our community and contributing to these figures. Together, we are making an impact!</p><div class="stat__blocks"><div class="stat__blocks-dashboard"><div class="stat__blocks-img"><svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 10V20M12 20L9.5 17.5M12 20L14.5 17.5" stroke="#currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M6.3218 7.05726C7.12925 4.69709 9.36551 3 12 3C14.6345 3 16.8708 4.69709 17.6782 7.05726C19.5643 7.37938 21 9.02203 21 11C21 13.2091 19.2091 15 17 15H16C15.4477 15 15 14.5523 15 14C15 13.4477 15.4477 13 16 13H17C18.1046 13 19 12.1046 19 11C19 9.89543 18.1046 9 17 9C16.9776 9 16.9552 9.00037 16.9329 9.0011C16.4452 9.01702 16.0172 8.67854 15.9202 8.20023C15.5502 6.37422 13.9345 5 12 5C10.0655 5 8.44979 6.37422 8.07977 8.20023C7.98284 8.67854 7.55482 9.01702 7.06706 9.0011C7.04476 9.00037 7.02241 9 7 9C5.89543 9 5 9.89543 5 11C5 12.1046 5.89543 13 7 13H8C8.55228 13 9 13.4477 9 14C9 14.5523 8.55228 15 8 15H7C4.79086 15 3 13.2091 3 11C3 9.02203 4.43567 7.37938 6.3218 7.05726Z" fill="currentColor"></path></svg></div><h3 class="stat__blocks-counter">5.5M</h3><p class="stat__blocks-description">Downloads</p></div><div class="stat__blocks-dashboard"><div class="stat__blocks-img"><svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 10V9C7 6.23858 9.23858 4 12 4C14.7614 4 17 6.23858 17 9V10C19.2091 10 21 11.7909 21 14C21 15.4806 20.1956 16.8084 19 17.5M7 10C4.79086 10 3 11.7909 3 14C3 15.4806 3.8044 16.8084 5 17.5M7 10C7.43285 10 7.84965 10.0688 8.24006 10.1959M12 12V21M12 12L15 15M12 12L9 15" stroke="#currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg></div><h3 class="stat__blocks-counter">2.1K</h3><p class="stat__blocks-description">Uploads</p></div><div class="stat__blocks-dashboard"><div class="stat__blocks-img"><svg width="800px" height="800px" viewBox="0 -0.5 25 25" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M14.9238 7.281C14.9227 8.5394 13.9018 9.55874 12.6435 9.558C11.3851 9.55726 10.3654 8.53673 10.3658 7.27833C10.3662 6.01994 11.3864 5 12.6448 5C13.2495 5.00027 13.8293 5.24073 14.2567 5.6685C14.6841 6.09627 14.924 6.67631 14.9238 7.281Z" stroke="#currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M14.9968 12.919H10.2968C8.65471 12.9706 7.35028 14.3166 7.35028 15.9595C7.35028 17.6024 8.65471 18.9484 10.2968 19H14.9968C16.6388 18.9484 17.9432 17.6024 17.9432 15.9595C17.9432 14.3166 16.6388 12.9706 14.9968 12.919V12.919Z" stroke="#currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M20.6878 9.02403C20.6872 9.98653 19.9066 10.7664 18.9441 10.766C17.9816 10.7657 17.2016 9.9852 17.2018 9.0227C17.202 8.06019 17.9823 7.28003 18.9448 7.28003C19.4072 7.28003 19.8507 7.4638 20.1776 7.7909C20.5045 8.11799 20.688 8.56158 20.6878 9.02403V9.02403Z" stroke="#currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M4.3338 9.02401C4.3338 9.98664 5.11417 10.767 6.0768 10.767C7.03943 10.767 7.8198 9.98664 7.8198 9.02401C7.8198 8.06137 7.03943 7.28101 6.0768 7.28101C5.11417 7.28101 4.3338 8.06137 4.3338 9.02401V9.02401Z" stroke="#currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M19.4368 12.839C19.0226 12.839 18.6868 13.1748 18.6868 13.589C18.6868 14.0032 19.0226 14.339 19.4368 14.339V12.839ZM20.7438 13.589L20.7593 12.8392C20.7541 12.839 20.749 12.839 20.7438 12.839V13.589ZM20.7438 18.24V18.99C20.749 18.99 20.7541 18.9899 20.7593 18.9898L20.7438 18.24ZM19.4368 17.49C19.0226 17.49 18.6868 17.8258 18.6868 18.24C18.6868 18.6542 19.0226 18.99 19.4368 18.99V17.49ZM5.58477 14.339C5.99899 14.339 6.33477 14.0032 6.33477 13.589C6.33477 13.1748 5.99899 12.839 5.58477 12.839V14.339ZM4.27777 13.589V12.839C4.27259 12.839 4.26741 12.839 4.26222 12.8392L4.27777 13.589ZM4.27777 18.24L4.26222 18.9898C4.26741 18.9899 4.27259 18.99 4.27777 18.99V18.24ZM5.58477 18.99C5.99899 18.99 6.33477 18.6542 6.33477 18.24C6.33477 17.8258 5.99899 17.49 5.58477 17.49V18.99ZM19.4368 14.339H20.7438V12.839H19.4368V14.339ZM20.7282 14.3388C21.5857 14.3566 22.2715 15.0568 22.2715 15.9145H23.7715C23.7715 14.2405 22.4329 12.8739 20.7593 12.8392L20.7282 14.3388ZM22.2715 15.9145C22.2715 16.7722 21.5857 17.4724 20.7282 17.4902L20.7593 18.9898C22.4329 18.9551 23.7715 17.5885 23.7715 15.9145H22.2715ZM20.7438 17.49H19.4368V18.99H20.7438V17.49ZM5.58477 12.839H4.27777V14.339H5.58477V12.839ZM4.26222 12.8392C2.58861 12.8739 1.25 14.2405 1.25 15.9145H2.75C2.75 15.0568 3.43584 14.3566 4.29332 14.3388L4.26222 12.8392ZM1.25 15.9145C1.25 17.5885 2.58861 18.9551 4.26222 18.9898L4.29332 17.4902C3.43584 17.4724 2.75 16.7722 2.75 15.9145H1.25ZM4.27777 18.99H5.58477V17.49H4.27777V18.99Z" fill="#currentColor"></path></svg></div><h3 class="stat__blocks-counter">76.2K</h3><p class="stat__blocks-description">Users</p></div><div class="stat__blocks-dashboard"><div class="stat__blocks-img"><svg width="800px" height="800px" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M8.5 11C9.32843 11 10 10.3284 10 9.5C10 8.67157 9.32843 8 8.5 8C7.67157 8 7 8.67157 7 9.5C7 10.3284 7.67157 11 8.5 11Z" fill="currentColor"></path><path d="M17 9.5C17 10.3284 16.3284 11 15.5 11C14.6716 11 14 10.3284 14 9.5C14 8.67157 14.6716 8 15.5 8C16.3284 8 17 8.67157 17 9.5Z" fill="currentColor"></path><path d="M8.88875 13.5414C8.63822 13.0559 8.0431 12.8607 7.55301 13.1058C7.05903 13.3528 6.8588 13.9535 7.10579 14.4474C7.18825 14.6118 7.29326 14.7659 7.40334 14.9127C7.58615 15.1565 7.8621 15.4704 8.25052 15.7811C9.04005 16.4127 10.2573 17.0002 12.0002 17.0002C13.7431 17.0002 14.9604 16.4127 15.7499 15.7811C16.1383 15.4704 16.4143 15.1565 16.5971 14.9127C16.7076 14.7654 16.8081 14.6113 16.8941 14.4485C17.1387 13.961 16.9352 13.3497 16.4474 13.1058C15.9573 12.8607 15.3622 13.0559 15.1117 13.5414C15.0979 13.5663 14.9097 13.892 14.5005 14.2194C14.0401 14.5877 13.2573 15.0002 12.0002 15.0002C10.7431 15.0002 9.96038 14.5877 9.49991 14.2194C9.09071 13.892 8.90255 13.5663 8.88875 13.5414Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23ZM12 20.9932C7.03321 20.9932 3.00683 16.9668 3.00683 12C3.00683 7.03321 7.03321 3.00683 12 3.00683C16.9668 3.00683 20.9932 7.03321 20.9932 12C20.9932 16.9668 16.9668 20.9932 12 20.9932Z" fill="currentColor"></path></svg></div><h3 class="stat__blocks-counter">79</h3><p class="stat__blocks-description">Online</p></div></div><div class="stat__inTouch"><h3>Get in Touch</h3><p>We value your feedback and suggestions. If you have something to say or any questions to ask, don't hesitate to reach out to us! Your input is essential in making our platform better for everyone.</p><button>Send Message <svg fill="currentColor" width="800px" height="800px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M29.919 6.163l-4.225 19.925c-0.319 1.406-1.15 1.756-2.331 1.094l-6.438-4.744-3.106 2.988c-0.344 0.344-0.631 0.631-1.294 0.631l0.463-6.556 11.931-10.781c0.519-0.462-0.113-0.719-0.806-0.256l-14.75 9.288-6.35-1.988c-1.381-0.431-1.406-1.381 0.288-2.044l24.837-9.569c1.15-0.431 2.156 0.256 1.781 2.013z"></path></svg></button></div></section>
      )} 
      
    </div>
  );
}

export default HomePage;