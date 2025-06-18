import Card from './Card';
import { useState, useEffect, useRef } from "react";
import { useClickOutside } from '../hooks/useClickOutside';
import { Link } from "react-router-dom";
import { useAuth } from '../context/AuthContext'; 

const CARDS_PER_LOAD = 9;

function HomePage({ isCardDetailPage, customLoadButton, customTitle, tagId }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Функцию fetchCards можно сделать более универсальной
  const fetchCards = async (pageNumber) => {
    try {
      setLoading(true);
      setError(null);

      // Формируем URL запроса с учетом tagId, пагинации и т.д.
      // Допустим, ваш API принимает limit и offset
      const limit = 10;
      const offset = (pageNumber - 1) * limit;
      let url = `/api/cards?limit=${limit}&offset=${offset}`;

      if (tagId) {
        url += `&tagId=${tagId}`;
      }
      // Можно добавить sortBy, sortOrder, search и другие параметры

      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! Status: ${response.status}. Response: ${errorText}`);
      }
      const data = await response.json(); // Ожидаем { cards: [], totalCount: 0 }

      setCards(prevCards => {
        const newCards = data.cards;
        // Фильтруем дубликаты, если есть (если ID уникальны)
        const uniqueNewCards = newCards.filter(
          newCard => !prevCards.some(existingCard => existingCard.id === newCard.id)
        );
        return [...prevCards, ...uniqueNewCards];
      });

      // Проверяем, есть ли еще данные для загрузки
      setHasMore(data.cards.length === limit);

    } catch (err) {
      setError('Ошибка при загрузке карточек: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCards([]); // Очищаем карточки при изменении tagId (или при первом рендере)
    setPage(1); // Сбрасываем страницу
    setHasMore(true); // Сбрасываем флаг "есть еще"
    fetchCards(1); // Загружаем первую страницу
  }, [tagId]); // Перезагружаем при изменении tagId (т.е. при переходе между / и /exploits)

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage(prevPage => prevPage + 1);
      fetchCards(page + 1);
    }
  };

  if (loading && cards.length === 0) {
    return <div className="container">Загрузка карточек...</div>;
  }

  if (error) {
    return <div className="container">Ошибка: {error}</div>;
  }

  if (cards.length === 0 && !loading) {
    return <div className="container">Карточки не найдены.</div>;
  }

  return (
    <div className="home-page container">
      {/* ... ваш остальной JSX код HomePage */}
      <h2 className="section__title">{customTitle}</h2>
      <div className="card-grid">
        {cards.map(card => (
          <div key={card.id} className="card">
            <img src={card.imgPath} alt={card.title} className="card__image" />
            <div className="card__body">
              <span className="card__tag">Script</span> {/* Здесь можно отобразить actual tag name */}
              <h3 className="card__title">{card.title}</h3>
              <p className="card__description">{card.description}</p>
              <div className="card__stats">
                {/* SVG и другие элементы */}
                <span>{card.downloadCount}</span>
                <span>{new Date(card.uploadedAt).toLocaleDateString()}</span>
              </div>
              <div className="card__buttons">
                <button>Get</button>
                {/* Кнопка избранного, аналогично CardDetail */}
              </div>
            </div>
          </div>
        ))}
      </div>
      {hasMore && (
        <button onClick={handleLoadMore} disabled={loading} className="load-more-button">
          {loading ? 'Загрузка...' : customLoadButton}
        </button>
      )}
    </div>
  );
}

export default HomePage;