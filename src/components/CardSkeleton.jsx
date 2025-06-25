// src/components/CardSkeleton.jsx
import React from 'react';
import ContentLoader from 'react-content-loader'; // Импортируем ContentLoader
import '../styles/main.scss'; 
import '../styles/cardSkeleton.scss'; // Ваши стили для внешней оболочки карточки и общих цветов

function CardSkeleton() {
    // Размеры viewBox определяют внутреннюю систему координат SVG.
    // Они должны быть пропорциональны типичным размерам вашей карточки.
    // Например, если ваша карточка имеет соотношение сторон 220px ширины к 300px высоты.
    const viewBoxWidth = 220; 
    const viewBoxHeight = 300; 

    // Цвета для скелета, адаптированные к вашей темной теме:
    // backgroundColor - базовый цвет скелета (например, чуть светлее фона вашей карточки)
    // foregroundColor - цвет, который "мерцает" для эффекта загрузки
    // Используем цвета, близкие к вашим $color-card и $color-accent
    const bgColor = "#282828"; // Темно-серый, как фон карточки
    const fgColor = "#4a4a4a"; // Чуть светлее серый для мерцания

    return (
        // div.main__card сохраняет общие стили вашей карточки (границы, тени, скругления)
        // Класс .card-skeleton здесь используется, чтобы применить специфичные для скелета стили
        // (например, background-color, border-color из CardSkeleton.scss), если они переопределяют main.scss
        <div className="main__card card-skeleton">
            <ContentLoader 
                speed={2}
                // width и height "100%" заставляют ContentLoader заполнять родительский div,
                // который уже управляется гридом и имеет адаптивные размеры.
                width="100%" 
                height="100%"
                viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} // Внутренняя система координат
                backgroundColor={bgColor}
                foregroundColor={fgColor}
            >
                {/* Заполнитель для изображения (верхняя часть карточки) */}
                {/* rx/ry для скругления, чтобы соответствовать скруглению карточки сверху */}
                <rect x="0" y="0" rx="30" ry="30" width={viewBoxWidth} height="150" />

                {/* Заполнитель для кнопки избранного (верхний правый угол) */}
                <circle cx={viewBoxWidth - 25} cy="25" r="15" />

                {/* Заполнитель для основного содержимого (заголовок, описание, кнопки, статистика) */}
                {/* Группа <g> смещает все элементы ниже изображения, имитируя структуру body карточки */}
                <g transform="translate(15, 170)"> {/* Отступ слева и сверху от начала body */}
                    {/* Заголовок */}
                    <rect x="0" y="0" rx="4" ry="4" width="80%" height="18" />
                    {/* Описание (две строки) */}
                    <rect x="0" y="28" rx="4" ry="4" width="95%" height="10" />
                    <rect x="0" y="44" rx="4" ry="4" width="90%" height="10" />

                    {/* Кнопка "Get" */}
                    <rect x="0" y="75" rx="20" ry="20" width="80" height="36" />

                    {/* Статистика (иконки + текст) */}
                    {/* Первая иконка и текст */}
                    <circle cx="120" cy="93" r="8" /> 
                    <rect x="135" y="87" rx="4" ry="4" width="30" height="12" /> 

                    {/* Вторая иконка и текст */}
                    <circle cx="180" cy="93" r="8" /> 
                    <rect x="195" y="87" rx="4" ry="4" width="40" height="12" /> 
                </g>
            </ContentLoader>
        </div>
    );
}

export default CardSkeleton;
