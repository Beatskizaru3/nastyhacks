// src/components/Card.jsx
import { Link } from 'react-router-dom';

function Card({ card, isFavorite, toggleFavorite, disableFavorite }){
  // Используем деструктуризацию с именами полей, как в JSON-ответе (маленькие буквы)
  const { ID, title, description, downloadCount, uploadedAt, imageUrl } = card;

  // ИЗМЕНЕНИЕ: Обновляем логирование для отладки, чтобы использовать новые имена
  console.log(`Card ${ID}: isFavorite = ${isFavorite}, card.ID = ${ID}, favoritedIds (from context) = `, isFavorite ? 'True' : 'False');
  console.log('Card Component: Полученный пропс `card`:', card);
  console.log('Card Component: Деструктурированные поля:', { ID, title, description, downloadCount, uploadedAt, imageUrl });

  const handleFavoriteClick = (e) => {
    e.stopPropagation(); // Отменяем всплытие события, чтобы не триггерить навигацию
    if (!disableFavorite){
      toggleFavorite(ID); // Используем ID (он уже был корректным)
    }
  };

  // ИЗМЕНЕНИЕ: Определяем SRC и ALT для изображения, используя 'imageUrl' и 'title'
  const imgSrc = imageUrl && imageUrl !== "" ? imageUrl : 'https://via.placeholder.com/150'; // Замените на свой путь к заглушке
  const imgAlt = title ? title : "Card thumbnail"; // Используем title для alt
  return(
    <div className="main__card">
      <div
        className={`main__card-favorite-btn ${isFavorite ? 'is-favorite' : ''} ${disableFavorite ? 'disabled' : ''}`}
        onClick={handleFavoriteClick}
      >
      <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {isFavorite ? (
          <path fillRule="evenodd" clipRule="evenodd" d="M12 6.00019C10.2006 3.90317 7.19377 3.2551 4.93923 5.17534C2.68468 7.09558 2.36727 10.3061 4.13778 12.5772C5.60984 14.4654 10.0648 18.4479 11.5249 19.7369C11.6882 19.8811 11.7699 19.9532 11.8652 19.9815C11.9483 20.0062 12.0393 20.0062 12.1225 19.9815C12.2178 19.9532 12.2994 19.8811 12.4628 19.7369C13.9229 18.4479 18.3778 14.4654 19.8499 12.5772C21.6204 10.3061 21.3417 7.07538 19.0484 5.17534C16.7551 3.2753 13.7994 3.90317 12 6.00019Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        ) : (
          <path fillRule="evenodd" clipRule="evenodd" d="M12 6.00019C10.2006 3.90317 7.19377 3.2551 4.93923 5.17534C2.68468 7.09558 2.36727 10.3061 4.13778 12.5772C5.60984 14.4654 10.0648 18.4479 11.5249 19.7369C11.6882 19.8811 11.7699 19.9532 11.8652 19.9815C11.9483 20.0062 12.0393 20.0062 12.1225 19.9815C12.2178 19.9532 12.2994 19.8811 12.4628 19.7369C13.9229 18.4479 18.3778 14.4654 19.8499 12.5772C21.6204 10.3061 21.3417 7.07538 19.0484 5.17534C16.7551 3.2753 13.7994 3.90317 12 6.00019Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        )}
      </svg>
  </div>
        <img src={imgSrc} alt={imgAlt} className="main__card-img" />
        <div className="main__card-body">
          <div>
            <div className="main__card-title">{title}</div> {/* ИСПОЛЬЗУЕМ title */}
            <p className="main__card-description">{description}</p> {/* ИСПОЛЬЗУЕМ description */}
          </div>
          <div className="main__card-additional">
            <Link to={`/card/${ID}`}>
                <button>Download</button>
            </Link>
            <div className="main__card-stat">
              <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M12 19L6 13M12 19L18 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="main__card-stat-downloads">{downloadCount}</p> {/* ИСПОЛЬЗУЕМ downloadCount */}
              <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 7V12L13.5 14.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="main__card-stat-date">
  {(() => {
      // ИСПОЛЬЗУЕМ uploadedAt
      const dateString = uploadedAt === "0001-01-01T00:00:00Z" ? null : uploadedAt;
      const date = new Date(dateString);

      if (isNaN(date.getTime()) || !dateString) {
          return "Дата неизвестна";
      }
      
      return date.toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' });
  })()}
</p>
            </div>
          </div>
        </div>
      </div>
)
}

export default Card;