import { useNavigate } from 'react-router-dom';
import styles from './ScriptsList.module.scss';
import { useEffect, useState } from 'react';

function ScriptsList(){

    const navigate = useNavigate();
    const [scripts, setScripts] = useState([]);
    const [editingDownloadsId, setEditingDownloadsId] = useState(null); // ID скрипта, для которого редактируем скачивания
    const [newDownloadCount, setNewDownloadCount] = useState(''); // Новое значение скачиваний
    const [error, setError] = useState(null); // Состояние для обработки ошибок загрузки
    const API_BASE_URL = process.env.REACT_APP_API_URL;
    useEffect(() => {
        const fetchScripts = async () => {
            try {
                // 1. Получаем токен из localStorage
                const token = localStorage.getItem('token'); 
                if (!token) {
                    setError('Вы не авторизованы. Пожалуйста, войдите.');
                    navigate(`${API_BASE_URL}/login`); // Перенаправляем на страницу логина, если токена нет
                    return;
                }

                // 2. Выполняем API запрос к GoLang бэкенду
                // Используем /api/admin/cards, который вы уже реализовали с GetAllCardsHandler
                const response = await fetch(`${API_BASE_URL}/api/admin/cards`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` // Отправляем токен для аутентификации
                    }
                });

                // 3. Обработка ответа
                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) {
                        // Если токен недействителен или нет прав
                        setError('Недостаточно прав для просмотра списка скриптов. Пожалуйста, залогиньтесь как администратор.');
                        localStorage.removeItem('token'); // Удаляем невалидный токен
                        navigate('/login'); 
                    } else {
                        // Другие ошибки сервера
                        const errorData = await response.json();
                        throw new Error(errorData.error || `Ошибка загрузки скриптов: ${response.statusText}`);
                    }
                }

                const responseData = await response.json();
                // Ваш GetAllCardsHandler возвращает объект с { cards: [], totalCount: N }
                const data = responseData.cards; 
                
                // 4. Приводим данные с бэкенда к формату, ожидаемому компонентом
                // Убедитесь, что имена полей соответствуют вашей модели Card на бэкенде и тем, что вы хотите отобразить
                const formattedScripts = data.map(card => ({
                    id: card.ID, // UUID из Go-бэкенда
                    title: card.title,
                    description: card.description,
                    // Используем RealDownloadsCount и FakeDownloadsCount из вашей модели Card
                    downloadsSet: card.fakeDownloadsCount, 
                    downloadsReal: card.realDownloadsCount,
                    // Если нужно отобразить TagID и UploaderID в таблице, добавьте их сюда
                    tagId: card.tagId,
                    uploaderId: card.uploaderId,
                    // ... другие поля, если необходимо
                }));
                setScripts(formattedScripts);
                setError(null); // Сбрасываем ошибку, если загрузка успешна

            } catch (err) {
                console.error("Ошибка при получении скриптов:", err);
                setError(`Не удалось загрузить скрипты: ${err.message}`);
            }
        };
        fetchScripts();
    }, [navigate]); // navigate добавлен в зависимости, чтобы избежать предупреждений eslint

    // Обработчик для кнопки "Загрузить скрипт"
    const handleUploadClick = () => {
        navigate(`/admin/scripts/new`);
    };

    // Обработчик для кнопки "Редактировать"
    const handleEditClick = (scriptId) => {
        // Здесь пока заглушка, но в будущем это будет navigate к форме редактирования
        navigate(`/admin/scripts/edit/${scriptId}`);
        // alert(`Функционал редактирования для ID ${scriptId} пока не реализован.`);
    };

    // Обработчик для кнопки "Удалить" (с API-запросом)
    const handleDeleteClick = async (scriptId) => {
        if (window.confirm('Вы уверены, что хотите удалить этот скрипт?')) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_BASE_URL}/api/admin/cards/${scriptId}`, { // API-эндпоинт для удаления
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}` // Отправляем токен
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Не удалось удалить скрипт.');
                }

                // Обновляем состояние, удаляя скрипт из списка
                setScripts(scripts.filter(script => script.id !== scriptId));
                alert('Скрипт успешно удален!');
            } catch (err) {
                console.error("Ошибка при удалении скрипта:", err);
                alert(`Ошибка при удалении скрипта: ${err.message}`);
            }
        }
    };

// Обработчик для кнопки "Установить количество скачиваний"
const handleSetDownloadsClick = (script) => {
    setEditingDownloadsId(script.id);
    // ИЗМЕНЕНИЕ ЗДЕСЬ: используем оператор ?? 0, чтобы гарантировать, что это число, 
    // прежде чем вызывать toString().
    setNewDownloadCount((script.downloadsSet ?? 0).toString()); 
};

    // Обработчик изменения поля ввода для скачиваний
    const handleDownloadInputChange = (e) => {
        setNewDownloadCount(e.target.value);
    };

    // Сохранение нового количества скачиваний (с API-запросом)
    const handleSaveDownloads = async (scriptId) => {
        const value = parseInt(newDownloadCount, 10);
        if (isNaN(value) || value < 0) {
            alert('Пожалуйста, введите корректное число.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            // Предполагаемый API-эндпоинт для обновления только fakeDownloadsCount
            const response = await fetch(`${API_BASE_URL}/api/admin/cards/${scriptId}/downloads`, { 
                method: 'PATCH', // PATCH для частичного обновления
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ FakeDownloadsCount: value }) // Отправляем только это поле
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Не удалось обновить количество скачиваний.');
            }

            // Обновляем состояние после успешного запроса
            setScripts(prevScripts => 
                prevScripts.map(script => 
                    script.id === scriptId ? { ...script, downloadsSet: value } : script
                )
            );
            setEditingDownloadsId(null); // Скрываем поле ввода
            setNewDownloadCount('');
            alert('Количество скачиваний обновлено!');
        } catch (err) {
            console.error("Ошибка при обновлении скачиваний:", err);
            alert(`Ошибка при обновлении скачиваний: ${err.message}`);
        }
    };

    // Отмена редактирования скачиваний
    const handleCancelEditDownloads = () => {
        setEditingDownloadsId(null);
        setNewDownloadCount('');
    };

    return(
        <div className={styles.scriptsList}>
            <div className={styles.header}>
                <h2>Управление скриптами</h2>
                <button 
                    className={styles.uploadButton}
                    onClick={handleUploadClick}
                >
                    Загрузить скрипт
                </button>
            </div>

            {error && <p className={styles.errorMessage}>{error}</p>} {/* Отображение ошибок */}

            <div className={styles.tableContainer}>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Имя</th>
                            <th>Описание</th>
                            <th>Задано (Fake)</th> {/* Обновил название */}
                            <th>Реально (Real)</th> {/* Обновил название */}
                            <th>Tag ID</th> {/* Добавил для отладки */}
                            <th>Uploader ID</th> {/* Добавил для отладки */}
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scripts.length === 0 && !error ? ( // Показываем "Скриптов пока нет.", только если нет ошибок
                            <tr>
                                <td colSpan="8">Скриптов пока нет.</td> {/* Обновил colSpan */}
                            </tr>
                        ) : (
                            scripts.map(script => (
                                <tr key={script.id}>
                                    <td>{script.id}</td>
                                    <td>{script.title}</td>
                                    <td>{script.description}</td>
                                    <td className={styles.downloadsCell}>
                                        {editingDownloadsId === script.id ? (
                                            <div className={styles.editDownloadsInput}>
                                                <input 
                                                    type="number" 
                                                    value={newDownloadCount}
                                                    onChange={handleDownloadInputChange}
                                                />
                                                <button onClick={() => handleSaveDownloads(script.id)} className={styles.saveBtn}>✓</button>
                                                <button onClick={handleCancelEditDownloads} className={styles.cancelBtn}>✕</button>
                                            </div>
                                        ) : (
                                            script.downloadsSet
                                        )}
                                    </td>
                                    <td>{script.downloadsReal}</td>
                                    <td>{script.tagId}</td> {/* Отображаем Tag ID */}
                                    <td>{script.uploaderId}</td> {/* Отображаем Uploader ID */}
                                    <td className={styles.actions}>
                                        <button 
                                            className={styles.actionButton}
                                            onClick={() => handleEditClick(script.id)}
                                            title="Редактировать"
                                        >
                                            ✏️
                                        </button>
                                        <button 
                                            className={styles.actionButton}
                                            onClick={() => handleSetDownloadsClick(script)}
                                            title="Установить количество скачиваний"
                                        >
                                            🔢
                                        </button>
                                        <button 
                                            className={`${styles.actionButton} ${styles.deleteButton}`}
                                            onClick={() => handleDeleteClick(script.id)}
                                            title="Удалить"
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {/* Здесь будет пагинация */}
            <div className={styles.pagination}>
                {/* <button>Предыдущая</button> */}
                {/* <span>Страница 1 из N</span> */}
                {/* <button>Следующая</button> */}
            </div>
        </div>
    );

}

export default ScriptsList;