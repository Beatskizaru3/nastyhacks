import { Link } from 'react-router-dom';

function Card({ card, isFavorite, toggleFavorite, disableFavorite }){

  const { id, img, title, description, downloads, uploadDate } = card;

  const handleFavoriteClick = (e) => {
    e.stopPropagation(); // Отменяем всплытие события, чтобы не триггерить навигацию
    if (!disableFavorite){ // Проверяем, не отключена ли кнопка
      toggleFavorite(id); // Используем ID карточки, как и было
    }
  };

  return(
      <div className="main__card">
        {/* Кнопка избранного */}
        {/* SVG находится внутри контейнера, это нормально. */}
        {/* Поместите SVG прямо внутри div, чтобы он был частью clickable области */}
        <div
          className={`main__card-favorite-btn ${isFavorite ? 'is-favorite' : ''} ${disableFavorite ? 'disabled' : ''}`}
          onClick={handleFavoriteClick}
        >
        <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {isFavorite ? (
            // Путь для ЗАПОЛНЕННОГО сердца
            <path fillRule="evenodd" clipRule="evenodd" d="M12 6.00019C10.2006 3.90317 7.19377 3.2551 4.93923 5.17534C2.68468 7.09558 2.36727 10.3061 4.13778 12.5772C5.60984 14.4654 10.0648 18.4479 11.5249 19.7369C11.6882 19.8811 11.7699 19.9532 11.8652 19.9815C11.9483 20.0062 12.0393 20.0062 12.1225 19.9815C12.2178 19.9532 12.2994 19.8811 12.4628 19.7369C13.9229 18.4479 18.3778 14.4654 19.8499 12.5772C21.6204 10.3061 21.3417 7.07538 19.0484 5.17534C16.7551 3.2753 13.7994 3.90317 12 6.00019Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          ) : (
            // Путь для НЕЗАПОЛНЕННОГО (только обводка) сердца
            <path fillRule="evenodd" clipRule="evenodd" d="M12 6.00019C10.2006 3.90317 7.19377 3.2551 4.93923 5.17534C2.68468 7.09558 2.36727 10.3061 4.13778 12.5772C5.60984 14.4654 10.0648 18.4479 11.5249 19.7369C11.6882 19.8811 11.7699 19.9532 11.8652 19.9815C11.9483 20.0062 12.0393 20.0062 12.1225 19.9815C12.2178 19.9532 12.2994 19.8811 12.4628 19.7369C13.9229 18.4479 18.3778 14.4654 19.8499 12.5772C21.6204 10.3061 21.3417 7.07538 19.0484 5.17534C16.7551 3.2753 13.7994 3.90317 12 6.00019Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          )}
        </svg>
    </div>
          <img src={img} alt="" className="main__card-img" />
          <div className="main__card-body">
            <div>
              <div className="main__card-title">{title}</div>
              <p className="main__card-description">{description}</p>
            </div>
            <div className="main__card-additional">
              <Link to={`/card/${id}`}>
                  <button>Download</button>
              </Link>
              <div className="main__card-stat">
                <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M12 19L6 13M12 19L18 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p className="main__card-stat-downloads">{downloads}</p>
                <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 7V12L13.5 14.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p className="main__card-stat-date">{uploadDate}</p>
              </div>
            </div>
            </div>
          </div>
  )
}

export default Card;