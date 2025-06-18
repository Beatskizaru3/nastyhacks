// src/admin/pages/ScriptForm/ScriptForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './ScriptForm.module.scss'; // Создайте этот SCSS модуль

function ScriptForm() {
    const { id } = useParams(); // Получаем id из URL, если это режим редактирования
    const navigate = useNavigate();
    const isEditMode = Boolean(id); // Определяем, находимся ли мы в режиме редактирования

    // Состояния для полей формы
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState(null); // Для загружаемого файла
    const [imageUrl, setImageUrl] = useState(''); // Для отображения существующей картинки (в режиме редактирования)
    const [selectedTag, setSelectedTag] = useState(''); // Выбранный тег (один ID)
    const [availableTags, setAvailableTags] = useState([ // Заглушка для доступных тегов
        { id: 't1', name: 'Автоматизация' },
        { id: 't2', name: 'Сеть' },
        { id: 't3', name: 'Безопасность' },
        { id: 't4', name: 'Веб' },
        { id: 't5', name: 'Системное администрирование' },
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Если это режим редактирования, загружаем данные скрипта
        if (isEditMode) {
            setLoading(true);
            setError('');
            const fetchScriptData = async () => {
                try {
                    // !!! ЗАГЛУШКА API запроса GET /api/admin/scripts/:id !!!
                    // const response = await fetch(`/api/admin/scripts/${id}`);
                    // if (!response.ok) {
                    //     throw new Error(`Ошибка загрузки скрипта: ${response.statusText}`);
                    // }
                    // const data = await response.json();

                    // --- ВРЕМЕННЫЕ ДАННЫЕ (ЗАГЛУШКА) ---
                    const data = {
                        id: 'mock-123',
                        title: 'Существующий скрипт для теста',
                        description: 'Это описание существующего скрипта. Оно может быть довольно длинным и подробным, чтобы проверить, как оно отображается в текстовом поле.',
                        imageUrl: 'https://via.placeholder.com/150/0000FF/FFFFFF?text=Existing+Image', // Пример URL существующей картинки
                        tag: 't1' // ОДИН ID выбранного тега
                    };
                    // --- КОНЕЦ ЗАГЛУШКИ ---

                    setTitle(data.title);
                    setDescription(data.description);
                    setImageUrl(data.imageUrl); // Устанавливаем URL для отображения
                    setSelectedTag(data.tag); // Устанавливаем выбранный тег (один ID)

                } catch (err) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };
            fetchScriptData();
        }
    }, [id, isEditMode]);

    // Обработчик изменения файла изображения
    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
            // Для мгновенного превью нового изображения
            setImageUrl(URL.createObjectURL(e.target.files[0])); 
        } else {
            setImageFile(null);
            // Если файл отменен, и мы не в режиме редактирования (где есть существующая картинка), 
            // то сбрасываем URL превью.
            // Если в режиме редактирования, оставляем существующую картинку, пока не будет выбрана новая.
            if (!isEditMode) setImageUrl(''); 
        }
    };

    // Обработчик изменения тега (одиночный выбор)
    const handleTagChange = (e) => {
        setSelectedTag(e.target.value); // Получаем одно выбранное значение
    };

    // Обработчик отправки формы
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        if (imageFile) {
            formData.append('image', imageFile); // Добавляем новый файл изображения
        }
        formData.append('tag', selectedTag); // Отправляем один выбранный тег

        // Логика отправки данных на бэкенд
        try {
            const method = isEditMode ? 'PUT' : 'POST';
            const url = isEditMode ? `/api/admin/scripts/${id}` : '/api/admin/scripts';

            // !!! ЗАГЛУШКА API запроса POST/PUT /api/admin/scripts или /api/admin/scripts/:id !!!
            // const response = await fetch(url, {
            //     method: method,
            //     body: formData, // FormData для отправки файлов и других данных
            //     // headers: { 'Authorization': `Bearer ${token}` } // Добавьте токен аутентификации
            // });

            // if (!response.ok) {
            //     const errorData = await response.json();
            //     throw new Error(errorData.message || 'Ошибка при сохранении скрипта');
            // }

            // const result = await response.json();
            console.log('Скрипт успешно сохранен:', { title, description, selectedTag, imageFile, id });
            alert(`Скрипт успешно ${isEditMode ? 'обновлен' : 'добавлен'}!`);
            navigate('/admin/scripts'); // Перенаправляем обратно в список скриптов

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditMode) { // Если в режиме редактирования и идет загрузка данных
        return <div className={styles.loading}>Загрузка данных скрипта...</div>;
    }

    return (
        <div className={styles.scriptFormContainer}>
            <h2>{isEditMode ? 'Редактировать скрипт' : 'Добавить новый скрипт'}</h2>

            {error && <p className={styles.errorMessage}>{error}</p>}

            <form onSubmit={handleSubmit} className={styles.scriptForm}>
                <div className={styles.formGroup}>
                    <label htmlFor="title">Название:</label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="description">Описание:</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows="5"
                        required
                    ></textarea>
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="image">Изображение:</label>
                    <input
                        type="file"
                        id="image"
                        accept="image/*" // Принимать только изображения
                        onChange={handleImageChange}
                    />
                    {imageUrl && (
                        <div className={styles.imagePreview}>
                            <p>Предварительный просмотр:</p>
                            <img src={imageUrl} alt="Предварительный просмотр" />
                        </div>
                    )}
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="tag">Тег:</label>
                    <select
                        id="tag"
                        value={selectedTag} // Одно выбранное значение
                        onChange={handleTagChange}
                        className={styles.tagsSelect}
                        required // Теперь тег обязателен
                    >
                        <option value="">Выберите тег</option> {/* Опция по умолчанию */}
                        {availableTags.map(tag => (
                            <option key={tag.id} value={tag.id}>
                                {tag.name}
                            </option>
                        ))}
                    </select>
                </div>

                <button type="submit" disabled={loading} className={styles.submitButton}>
                    {loading ? 'Сохранение...' : (isEditMode ? 'Сохранить изменения' : 'Добавить скрипт')}
                </button>
                <button type="button" onClick={() => navigate('/admin/scripts')} className={styles.cancelButton}>
                    Отмена
                </button>
            </form>
        </div>
    );
}

export default ScriptForm;