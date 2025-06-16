

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import HomePage from "./Home";

import { mockCards, mockTools, mockExploits} from '../mockData';


function CardDetail(){
    const { id } = useParams();
    const [ cardData, setCardData ] = useState(null);

    const [ loading, setLoading ] = useState(true);
    const [ error, setError ] = useState(null);

    const allCards = mockCards.concat(mockTools, mockExploits)

    useEffect(()=>{
            const fetchCardDetails = async() =>{
                try{
                    // Здесь будет ваш запрос к API:
                    // const response = await fetch(`/api/card/${id}`);
                    // if (!response.ok) {
                    //     throw new Error(`HTTP error! status: ${response.status}`);
                    // }
                    // const data = await response.json();
                    // setCardData(data);
                    

                    
                    const foundCard = allCards.find(card => card.id === parseInt(id)); // Важно: id из useParams - это строка, преобразуйте в число
                    
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
        }, [id]); // Зависимость: эффект перезапустится, если id в URL изменится
    
            // --> ВОТ ЗДЕСЬ ДОБАВЛЯЕМ УСЛОВНЫЙ РЕНДЕРИНГ <--
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
    const { img, title, description, downloads, uploadDate } = cardData;
    
    
    

    return(
        <>
        <div className="cardInfo container">
            <div className="cardInfo__image">
                <img src={cardData.img} alt="" />
            </div>
            <div className="cardInfo__body">
                <p className="cardInfo__tag puddle">Script</p> 
                {/* надо добавить теги */}
                <h2 className="cardInfo__title">{cardData.title}</h2>
                <p className="cardInfo__description">{cardData.description}</p>
                <div className="cardInfo__stats">
                <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 5V19M12 19L6 13M12 19L18 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
                    <span className="cardInfo__stats-downloads">{cardData.downloads}</span>

                    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 7V12L13.5 14.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
                    <span className="cardInfo__stats-uploadDate">{cardData.uploadDate}</span>
                </div>

                <div className="cardInfo__buttons">
                    <button>Get</button>
                    <div className="cardInfo__buttons-add">
                            <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M12 6.00019C10.2006 3.90317 7.19377 3.2551 4.93923 5.17534C2.68468 7.09558 2.36727 10.3061 4.13778 12.5772C5.60984 14.4654 10.0648 18.4479 11.5249 19.7369C11.6882 19.8811 11.7699 19.9532 11.8652 19.9815C11.9483 20.0062 12.0393 20.0062 12.1225 19.9815C12.2178 19.9532 12.2994 19.8811 12.4628 19.7369C13.9229 18.4479 18.3778 14.4654 19.8499 12.5772C21.6204 10.3061 21.3417 7.07538 19.0484 5.17534C16.7551 3.2753 13.7994 3.90317 12 6.00019Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
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
    )
}

export default CardDetail;