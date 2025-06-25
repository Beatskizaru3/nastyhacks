import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import HomePage from "./Home"; // Убедитесь, что это правильный импорт
import { useAuth } from '../context/AuthContext';

function CardDetail() {
    const { id } = useParams();
    const [cardData, setCardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { user, favoritedIds, toggleFavorite, isLoading: authLoading, getToken } = useAuth();

    const isFavorite = !authLoading && favoritedIds.includes(id);
    const API_BASE_URL = process.env.REACT_APP_API_URL;
    useEffect(() => {
        const fetchCardDetails = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log(`[CardDetail] Запрос данных для карточки ID: ${id}`);
                const response = await fetch(`${API_BASE_URL}/cards/${id}`);
                if (!response.ok) {
                    if (response.status === 404) {
                        console.error(`[CardDetail] Ошибка 404: Карточка с ID ${id} не найдена.`);
                        throw new Error('Карточка не найдена.');
                    }
                    console.error(`[CardDetail] HTTP ошибка при загрузке карточки: ${response.status}`);
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                console.log(`[CardDetail] Данные карточки получены:`, data);

                // ИСПРАВЛЕНО: Удалена строка, которая добавляла API_BASE_URL к URL Cloudinary.
                // Теперь data.imageUrl уже содержит полный и корректный URL от бэкенда.
                // data.imageUrl = `${API_BASE_URL}${data.imageUrl}` 
                
                console.log(data);
                setCardData(data); // <--- Важно: cardData будет содержать актуальное fakeDownloadsCount
                                    // после первой загрузки страницы.
            } catch (err) {
                console.error(`[CardDetail] Ошибка при загрузке данных карточки:`, err);
                setError('Ошибка при загрузке данных: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCardDetails();
    }, [id]);

    const handleFavoriteClick = () => {
        if (authLoading || !user) {
            console.warn('[CardDetail] Действие отменено: данные пользователя еще загружаются или пользователь не авторизован.');
            alert('Пожалуйста, войдите, чтобы добавить в избранное!');
            return;
        }
        console.log(`[CardDetail] Переключение избранного для карточки ID: ${id}`);
        toggleFavorite(id);
    };

    const handleDownload = async () => {
        if (!cardData || !cardData.filePath) {
            console.warn('[CardDetail] Невозможно скачать: filePath не определен.');
            alert('Файл для скачивания не найден.');
            return;
        }

        try {
            console.log(`[CardDetail] Инициирование скачивания для карточки ID: ${id}, путь: ${cardData.filePath}`);
            // Этот запрос отправляется на ваш бэкенд, который затем должен перенаправить или обслужить файл из Cloudinary.
            const response = await fetch(`${API_BASE_URL}/download/cards/${id}`);

            if (!response.ok) {
                console.error(`[CardDetail] Ошибка HTTP при скачивании файла: ${response.status}`);
                if (response.status === 404) {
                    alert('Файл не найден на сервере. Убедитесь, что маршрут /download/cards/:id зарегистрирован.');
                } else if (response.status === 500) {
                    alert('Произошла ошибка на сервере при попытке скачивания.');
                } else {
                    alert('Не удалось скачать файл. Попробуйте снова.');
                }
                return;
            }

            const blob = await response.blob();
            // ... (получение имени файла, создание ссылки, имитация клика)
            let filename = 'downloaded_file';
            const contentDisposition = response.headers.get('Content-Disposition');
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename\*?=['"]?(?:UTF-8'')?([^;"\n]+)['"]?/i);
                if (filenameMatch && filenameMatch[1]) {
                    filename = decodeURIComponent(filenameMatch[1].replace(/\+/g, ' '));
                }
            }

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            console.log(`[CardDetail] Файл ${filename} успешно инициирован для скачивания.`);

            // --- ИЗМЕНЕНИЕ: Обновляем и fakeDownloadsCount, и downloadCount ---
            setCardData(prevCardData => ({
                ...prevCardData,
                downloadCount: (prevCardData.downloadCount || 0) + 1, // Обновляем общий счетчик
                fakeDownloadsCount: (prevCardData.fakeDownloadsCount || 0) + 1 // Обновляем фейковый счетчик
            }));
            // Важно: cardData в следующем console.log может быть не сразу обновлено
            // console.log(`[CardDetail] Локально обновлен счетчик загрузок для карточки ID: ${id}. 
            //              Новое FakeDownloadsCount: ${cardData.fakeDownloadsCount + 1},
            //              Новое DownloadCount: ${cardData.downloadCount + 1}`);

        } catch (err) {
            console.error(`[CardDetail] Ошибка при обработке скачивания:`, err);
            alert('Произошла непредвиденная ошибка при попытке скачивания: ' + err.message);
        }
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

    const {
        ID,
        title,
        description,
        uploadedAt,
        imageUrl, // Теперь это уже полный URL Cloudinary
        fakeDownloadsCount,
        tag
    } = cardData;

    const displayedDownloads = fakeDownloadsCount ?? 0;

    const tagName = tag && tag.name ? tag.name : "Категория";

    const formattedUploadDate = uploadedAt === "0001-01-01T00:00:00Z" ? "Дата неизвестна" :
        uploadedAt ? new Date(uploadedAt).toLocaleDateString() : '';

    return (
        <>
            <div className="cardInfo container">
                <div className="cardInfo__image">
                    {console.log("Отображаемый URL изображения:", imageUrl)}
                    <img src={imageUrl} alt={title || "Изображение карточки"} />
                </div>
                <div className="cardInfo__body">
                    <p className="cardInfo__tag puddle">{tagName}</p>
                    <h2 className="cardInfo__title">{title}</h2>
                    <p className="cardInfo__description">{description}</p>
                    <div className="cardInfo__stats">
                        <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 5V19M12 19L6 13M12 19L18 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="cardInfo__stats-downloads">{displayedDownloads}</span>

                        <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 7V12L13.5 14.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="cardInfo__stats-uploadDate">{formattedUploadDate}</span>
                    </div>

                    <div className="cardInfo__buttons">
                        <button onClick={handleDownload}>Get</button>
                        <div
                            className={`cardInfo__buttons-add ${isFavorite ? 'is-favorite' : ''} ${!user || authLoading ? 'disabled' : ''}`}
                            onClick={handleFavoriteClick}>
                            <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                {isFavorite ? (
                                    <path fillRule="evenodd" clipRule="evenodd" d="M12 6.00019C10.2006 3.90317 7.19377 3.2551 4.93923 5.17534C2.68468 7.09558 2.36727 10.3061 4.13778 12.5772C5.60984 14.4654 10.0648 18.4479 11.5249 19.7369C11.6882 19.8811 11.7699 19.9532 11.8652 19.9815C11.9483 20.0062 12.0393 20.0062 12.1225 19.9815C12.2178 19.9532 12.2994 19.8811 12.4628 19.7369C13.9229 18.4479 18.3778 14.4654 19.8499 12.5772C21.6204 10.3061 21.3417 7.07538 19.0484 5.17534C16.7551 3.2753 13.7994 3.90317 12 6.00019Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                ) : (
                                    <path fillRule="evenodd" clipRule="evenodd" d="M12 6.00019C10.2006 3.90317 7.19377 3.2551 4.93923 5.17534C2.68468 7.09558 2.36727 10.3061 4.13778 12.5772C5.60984 14.4654 10.0648 18.4479 11.5249 19.7369C11.6882 19.8811 11.7699 19.9532 11.8652 19.9815C11.9483 20.0062 12.0393 20.0062 12.1225 19.9815C12.2178 19.9532 12.2994 19.8811 12.4628 19.7369C13.9229 18.4479 18.3778 14.4654 19.8499 12.5772C21.6204 10.3061 21.3417 7.07538 19.0484 5.17534C16.7551 3.2753 13.7994 3.90317 12 6.00019Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                )}
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
            <HomePage
                isCardDetailPage={true}
                customLoadButton="View more on Home"
                customTitle="Other Scripts"
                cardsData={[]}
            />
        </>
    );
}

export default CardDetail;
