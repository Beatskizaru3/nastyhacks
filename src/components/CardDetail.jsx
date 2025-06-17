import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import HomePage from "./Home";

import { useAuth } from '../context/AuthContext';

import { mockCards, mockTools, mockExploits} from '../mockData';


function CardDetail(){
    const { id } = useParams();
    const [ cardData, setCardData ] = useState(null);

    const [ loading, setLoading ] = useState(true);
    const [ error, setError ] = useState(null);

    const allCards = mockCards.concat(mockTools, mockExploits)

    // Деструктурируем значения из AuthContext.
    // isLoading из AuthContext переименовываем в authLoading, чтобы не конфликтовать с локальным 'loading'.
    const { user, favoritedIds, toggleFavorite, isLoading: authLoading } = useAuth();

    // ID из useParams - это строка, поэтому преобразуем её в число для сравнения.
    const cardIdNum = parseInt(id); 

    // isFavorite зависит от того, что данные авторизации уже загружены (!authLoading)
    // и есть ли числовой ID текущей карточки в массиве favoritedIds.
    const isFavorite = !authLoading && favoritedIds.includes(cardIdNum);

    // useEffect для загрузки данных карточки.
    // ЭТОТ ХУК ДОЛЖЕН БЫТЬ НА ВЕРХНЕМ УРОВНЕ КОМПОНЕНТА!
    useEffect(()=>{
        const fetchCardDetails = async() =>{
            try{
                setLoading(true); // Начинаем загрузку данных карточки
                setError(null); // Сбрасываем предыдущие ошибки
                
                // Здесь будет ваш запрос к API:
                // const response = await fetch(`/api/card/${id}`);
                // if (!response.ok) {
                //     throw new Error(`HTTP error! status: ${response.status}`);
                // }
                // const data = await response.json();
                // setCardData(data);
                
                // Пока используем моковые данные
                const foundCard = allCards.find(card => card.id === cardIdNum); 
                
                if (foundCard) {
                    setCardData(foundCard);
                } else {
                    setError('Карточка не найдена.');
                }
            } catch (err) {
                setError('Ошибка при загрузке данных: ' + err.message);
            } finally {
                setLoading(false); // Загрузка завершена (успешно или с ошибкой)
            }
        };

        fetchCardDetails();
    }, [cardIdNum, allCards]); // <-- ИСПРАВЛЕНО: Зависимости: cardIdNum и allCards


    // Обработчик клика по кнопке "Избранное".
    // ЭТА ФУНКЦИЯ ДОЛЖНА БЫТЬ НА ВЕРХНЕМ УРОВНЕ КОМПОНЕНТА!
    const handleFavoriteClick = () => { // Имя функции изменено на camelCase
        if (authLoading || !user) { // Используем authLoading, а не isLoading
            console.warn('Действие отменено: данные пользователя еще загружаются или пользователь не авторизован.');
            alert('Пожалуйста, войдите, чтобы добавить в избранное!');
            return;
        }
        toggleFavorite(cardIdNum); // Передаем числовой ID
    };

    // --- УСЛОВНЫЙ РЕНДЕРИНГ КОМПОНЕНТА (НА ВЕРХНЕМ УРОВНЕ CardDetail) ---
    // ЭТИ ПРОВЕРКИ ДОЛЖНЫ БЫТЬ ВЫШЕ ОСНОВНОГО return JSX

    if (loading) {
        return <div className="cardInfo container">Загрузка информации о карточке...</div>;
    }

    if (error) {
        return <div className="cardInfo container">Ошибка: {error}</div>;
    }

    if (!cardData) { // Если не загружается и нет ошибки, но данных нет (например, ID не найден)
        return <div className="cardInfo container">Карточка не найдена.</div>;
    }

    // Если мы дошли до сюда, значит cardData точно не null и содержит данные
    // Можно деструктурировать для удобства или использовать cardData.property
    // ИСПРАВЛЕНО: Эти деструктурированные переменные теперь будут использоваться
    const { img, title, description, downloads, uploadDate } = cardData;
    
    return(
        <>
        <div className="cardInfo container">
            <div className="cardInfo__image">
                <img src={img} alt={title || "Изображение карточки"} /> {/* Использование деструктурированных img и title */}
            </div>
            <div className="cardInfo__body">
                <p className="cardInfo__tag puddle">Script</p> 
                {/* надо добавить теги */}
                <h2 className="cardInfo__title">{title}</h2> {/* Использование деструктурированного title */}
                <p className="cardInfo__description">{description}</p> {/* Использование деструктурированного description */}
                <div className="cardInfo__stats">
                <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Атрибуты SVG должны быть в camelCase (strokeWidth, strokeLinecap, strokeLinejoin) */}
                    <path d="M12 5V19M12 19L6 13M12 19L18 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="cardInfo__stats-downloads">{downloads}</span> {/* Использование деструктурированного downloads */}

                    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Атрибуты SVG должны быть в camelCase */}
                    <path d="M12 7V12L13.5 14.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="cardInfo__stats-uploadDate">{uploadDate}</span> {/* Использование деструктурированного uploadDate */}
                </div>

                <div className="cardInfo__buttons">
                    <button>Get</button>
                    <div 
                        className={`cardInfo__buttons-add ${isFavorite ? 'is-favorite' : ''} ${!user || authLoading ? 'disabled' : ''}`}
                        onClick={handleFavoriteClick}> {/* Использование функции handleFavoriteClick в camelCase */}
                            <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                {/* Логика для заполненного/незаполненного сердца */}
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
            cardsData={allCards}
            />
        </>
    ); // Закрывающая скобка return и функции CardDetail
}

export default CardDetail;