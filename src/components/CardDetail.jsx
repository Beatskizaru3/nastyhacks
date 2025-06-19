import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import HomePage from "./Home"; // Убедитесь, что это правильный импорт
import { useAuth } from '../context/AuthContext';

// Уберите mockCards, mockTools, mockExploits, если будете использовать API
// import { mockCards, mockTools, mockExploits} from '../mockData'; 

function CardDetail(){
    const { id } = useParams();
    const [ cardData, setCardData ] = useState(null);
    const [ loading, setLoading ] = useState(true);
    const [ error, setError ] = useState(null);

    // const allCards = mockCards.concat(mockTools, mockExploits) // Больше не нужно

    const { user, favoritedIds, toggleFavorite, isLoading: authLoading, getToken } = useAuth(); // Добавим getToken

    // isFavorite зависит от того, что данные авторизации уже загружены (!authLoading)
    // и есть ли ID текущей карточки (который теперь строковый, как в БД) в массиве favoritedIds.
    // Если id карточки из URL (id) является строкой, то favoritedIds тоже должен содержать строки.
    const isFavorite = !authLoading && favoritedIds.includes(id); // Используем id напрямую

    useEffect(()=>{
        const fetchCardDetails = async() =>{
            try{
                setLoading(true);
                setError(null);
                
                // --- ЗАПРОС К ВАШЕМУ GO-API ---
                const response = await fetch(`/cards/${id}`); // Предполагаем, что у вас есть эндпоинт для получения одной карточки
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('Карточка не найдена.');
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setCardData(data);
                
            } catch (err) {
                setError('Ошибка при загрузке данных: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCardDetails();
    }, [id]); // Зависимость только от id

    const handleFavoriteClick = () => {
        if (authLoading || !user) {
            console.warn('Действие отменено: данные пользователя еще загружаются или пользователь не авторизован.');
            alert('Пожалуйста, войдите, чтобы добавить в избранное!');
            return;
        }
        toggleFavorite(id); // Передаем строковый ID
    };

    if (loading) {
        return <div className="cardInfo container">Загрузка информации о карточке...</div>;
    }

    if (error) {
        return <div className="cardInfo container">Ошибка: {error}</div>;
    }

    if (!cardData) {
        return <div className="cardInfo container">Карточка не найдена.</div>;
    }

    // ВНИМАНИЕ: Деструктурируем поля с БОЛЬШОЙ БУКВЫ, как они приходят из Go-бэкенда!
    const { ImagePath, Title, Description, DownloadCount, UploadedAt } = cardData;

    // Форматируем дату. Здесь также используем UploadedAt с большой буквы.
    // Добавим проверку на "нулевую" дату, чтобы избежать "Invalid Date"
    const formattedUploadDate = UploadedAt === "0001-01-01T00:00:00Z" ? "Дата неизвестна" :
                                UploadedAt ? new Date(UploadedAt).toLocaleDateString() : '';
    return(
        <>
        <div className="cardInfo container">
            <div className="cardInfo__image">
                <img src={ImagePath} alt={Title || "Изображение карточки"} /> 
            </div>
            <div className="cardInfo__body">
                <p className="cardInfo__tag puddle">Script</p> 
                <h2 className="cardInfo__title">{ Title }</h2>
                <p className="cardInfo__description">{Description}</p>
                <div className="cardInfo__stats">
                <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M12 19L6 13M12 19L18 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="cardInfo__stats-downloads">{DownloadCount}</span>

                    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 7V12L13.5 14.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="cardInfo__stats-uploadDate">{formattedUploadDate}</span>
                </div>

                <div className="cardInfo__buttons">
                    <button>Get</button>
                    <div 
                        className={`cardInfo__buttons-add ${isFavorite ? 'is-favorite' : ''} ${!user || authLoading ? 'disabled' : ''}`}
                        onClick={handleFavoriteClick}>
                            <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                {isFavorite ? (
                                    <path fillRule="evenodd" clipRule="evenodd" d="M12 6.00019C10.2006 3.90317 7.19377 3.2551 4.93923 5.17534C2.68468 7.09558 2.36727 10.3061 4.13778 12.5772C5.60984 14.4654 10.0648 18.4479 11.5249 19.7369C11.6882 19.8811 11.7699 19.9532 11.8652 19.9815C11.9483 20.0062 12.0393 20.0062 12.1225 19.9815C12.2178 19.9532 12.2994 19.8811 12.4628 19.7369C13.9229 18.4479 18.3778 14.4654 19.8499 12.5772C21.6204 10.3061 21.3417 7.07538 19.0484 5.17534C16.7551 3.2753 13.7994 3.90317 12 6.00019Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                ) : (
                                    <path fillRule="evenodd" clipRule="evenodd" d="M12 6.00019C10.2006 3.90317 7.19377 3.2551 4.93923 5.17534C2.68468 7.09558 2.36727 10.3061 4.13778 12.5772C5.60984 14.4654 10.0648 18.4479 11.5249 19.7369C11.6882 19.8811 11.7699 19.9532 11.8652 19.9815C11.9483 20.0062 12.0393 20.0062 12.1225 19.9815C12.2178 19.9532 12.2994 19.8811 12.4628 19.7369C13.9229 18.4479 18.3778 14.4654 19.8499 12.5772C21.6204 10.3061 21.3417 7.07538 19.0484 5.17534C16.7551 3.2753 13.7994 3.90317 12 6.00019Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                )}
                            </svg>
                    </div>
                </div>
            </div>
        </div>
        <HomePage
            isCardDetailPage = {true}
            customLoadButton="View more on Home"
            customTitle="Other Scripts"
            // Здесь вам, возможно, понадобится получать другие карточки из API
            // или обновить логику `cardsData` в HomePage, чтобы она тоже брала из API
            cardsData={[]} // Заглушка, нужно будет изменить
            />
        </>
    );
}

export default CardDetail;