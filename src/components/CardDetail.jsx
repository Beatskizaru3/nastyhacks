import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";


function CardDetail(){
    const { id } = useParams();
    const [ cardData, setCardData ] = useState(null);

    const [ loading, setLoading ] = useState(true);
    const [ error, setError ] = useState(null);

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
                    const mockCards = [
                        {
                        "id": 1,
                        "title": "Инструмент для веб-разработки",
                        "description": "Ускоряет процесс создания пользовательских интерфейсов с помощью готовых компонентов.",
                        "uploadDate": "2025-06-15",
                        "downloads": 152,
                        "img": "https://scriptrb.com/cdn-cgi/image/medium-low,format=auto,height=420/https://scriptrb.com/img/uploads/684692b90d5e1_106989035172456074720.webp"
                        },
                        {
                        "id": 2,
                        "title": "Пакет иконок 'Минимализм'",
                        "description": "Коллекция из 500+ векторных иконок для современных и чистых дизайнов.",
                        "uploadDate": "2025-06-14",
                        "downloads": 345,
                        "img": "https://scriptrb.com/cdn-cgi/image/medium-low,format=auto,height=420/https://scriptrb.com/img/uploads/684692b90d5e1_106989035172456074720.webp"
                        },
                        {
                        "id": 3,
                        "title": "Шаблон для админ-панели",
                        "description": "Готовый к использованию, адаптивный шаблон панели администратора на React.",
                        "uploadDate": "2025-06-12",
                        "downloads": 99,
                        "img": "https://scriptrb.com/cdn-cgi/image/medium-low,format=auto,height=420/https://scriptrb.com/img/uploads/684692b90d5e1_106989035172456074720.webp"
                        },
                        {
                        "id": 4,
                        "title": "UI Kit для мобильных приложений",
                        "description": "Набор элементов интерфейса для быстрого прототипирования приложений для iOS и Android.",
                        "uploadDate": "2025-06-11",
                        "downloads": 512,
                        "img": "https://scriptrb.com/cdn-cgi/image/medium-low,format=auto,height=420/https://scriptrb.com/img/uploads/684692b90d5e1_106989035172456074720.webp"
                        },
                        {
                        "id": 5,
                        "title": "Скрипт для аналитики",
                        "description": "Легкий скрипт для отслеживания поведения пользователей на вашем сайте без Google Analytics.",
                        "uploadDate": "2025-06-10",
                        "downloads": 76,
                        "img": "https://scriptrb.com/cdn-cgi/image/medium-low,format=auto,height=420/https://scriptrb.com/img/uploads/684692b90d5e1_106989035172456074720.webp"
                        },
                        {
                        "id": 6,
                        "title": "Набор 3D иллюстраций 'Бизнес'",
                        "description": "Высококачественные 3D-рендеры на тему бизнеса и стартапов для ваших лендингов.",
                        "uploadDate": "2025-06-08",
                        "downloads": 843,
                        "img": "https://scriptrb.com/cdn-cgi/image/medium-low,format=auto,height=420/https://scriptrb.com/img/uploads/684692b90d5e1_106989035172456074720.webp"
                        },
                        {
                        "id": 7,
                        "title": "Плагин для Figma 'Экспорт кода'",
                        "description": "Экспортирует ваши дизайны из Figma напрямую в HTML/CSS или React компоненты.",
                        "uploadDate": "2025-06-05",
                        "downloads": 221,
                        "img": "https://scriptrb.com/cdn-cgi/image/medium-low,format=auto,height=420/https://scriptrb.com/img/uploads/684692b90d5e1_106989035172456074720.webp"
                        },
                        {
                        "id": 8,
                        "title": "Генератор цветовых палитр",
                        "description": "Помогает дизайнерам и разработчикам создавать гармоничные цветовые схемы.",
                        "uploadDate": "2025-06-02",
                        "downloads": 1024,
                        "img": "https://scriptrb.com/cdn-cgi/image/medium-low,format=auto,height=420/https://scriptrb.com/img/uploads/684692b90d5e1_106989035172456074720.webp"
                        },
                        {
                        "id": 9,
                        "title": "Шрифтовая пара 'Элегант'",
                        "description": "Идеальное сочетание шрифтов (заголовок + текст) для блогов и портфолио.",
                        "uploadDate": "2025-05-30",
                        "downloads": 489,
                        "img": "https://scriptrb.com/cdn-cgi/image/medium-low,format=auto,height=420/https://scriptrb.com/img/uploads/684692b90d5e1_106989035172456074720.webp"
                        }
                    ];

                    const foundCard = mockCards.find(card => card.id === parseInt(id)); // Важно: id из useParams - это строка, преобразуйте в число

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
        <div className="cardInfo container">
            <div className="cardInfo__image">
                <img src={cardData.img} alt="" />
            </div>
            <div className="cardInfo__body">
                <p className="cardInfo__tag">Script</p> 
                {/* надо добавить теги */}
                <h2 className="cardInfo__title">{cardData.title}</h2>
                <p className="cardInfo__description">{cardData.description}</p>
                <div className="cardInfo__stats">
                    <span className="cardInfo__stats-downloads">{cardData.downloads}</span>
                    <span className="cardInfo__stats-uploadDate">{cardData.uploadDate}</span>
                </div>
            </div>
        </div>
    )
}

export default CardDetail;