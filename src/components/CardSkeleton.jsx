// src/components/CardSkeleton.jsx
import React from 'react';
// Предполагаем, что общие стили, включая переменные $color-accent, $color-card, $shadow,
// определены и доступны, например, через main.scss
import '../styles/main.scss'; 
import '../styles/CardSkeleton.scss'; // Создадим отдельный файл стилей для скелета

function CardSkeleton() {
    return (
        <div className="main__card card-skeleton">
            {/* Заполнитель для кнопки избранного */}
            <div className="main__card-favorite-btn skeleton-shimmer skeleton-favorite-placeholder"></div>
            
            {/* Заполнитель для изображения */}
            <div className="main__card-img skeleton-shimmer skeleton-img-placeholder"></div>
            
            <div className="main__card-body">
                <div>
                    {/* Заполнитель для заголовка */}
                    <div className="main__card-title skeleton-shimmer skeleton-line" style={{ width: '80%', height: '18px' }}></div>
                    {/* Заполнитель для описания */}
                    <p className="main__card-description skeleton-shimmer skeleton-line" style={{ width: '95%', height: '40px', marginTop: '10px' }}></p>
                </div>
                <div className="main__card-additional">
                    {/* Заполнитель для кнопки "Download" */}
                    <button className="skeleton-shimmer skeleton-button"></button>
                    <div className="main__card-stat">
                        {/* Заполнители для иконок статистики */}
                        <div className="skeleton-shimmer skeleton-icon-placeholder"></div>
                        <p className="main__card-stat-downloads skeleton-shimmer skeleton-line" style={{ width: '30px', display: 'inline-block', marginLeft: '5px' }}></p>
                        <div className="skeleton-shimmer skeleton-icon-placeholder" style={{ marginLeft: '10px' }}></div>
                        <p className="main__card-stat-date skeleton-shimmer skeleton-line" style={{ width: '50px', display: 'inline-block', marginLeft: '5px' }}></p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CardSkeleton;