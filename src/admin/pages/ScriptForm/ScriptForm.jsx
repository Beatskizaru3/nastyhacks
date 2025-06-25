// src/admin/pages/ScriptForm/ScriptForm.jsx
import React, { useState, useEffect, useRef } from 'react'; // Добавлен useRef
import { useParams, useNavigate } from 'react-router-dom';
import styles from './ScriptForm.module.scss';

// ИСПРАВЛЕНИЕ: Добавляем определение PLACEHOLDER_IMAGE_URL
const PLACEHOLDER_IMAGE_URL = 'https://placehold.co/150x150/cccccc/333333?text=No Image';

function ScriptForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imageUrl, setImageUrl] = useState('');

    const [scriptFile, setScriptFile] = useState(null);
    const [scriptFileName, setScriptFileName] = useState('');

    const [selectedTag, setSelectedTag] = useState('');
    const [availableTags, setAvailableTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const API_BASE_URL = process.env.REACT_APP_API_URL;

    const getAuthToken = () => {
        return localStorage.getItem('token');
    };

    // useEffect для загрузки тегов
    useEffect(() => {
        const fetchTags = async () => {
            console.log("FRONTEND DEBUG (Tags): Загрузка тегов..."); // Лог начала загрузки тегов
            console.log("FRONTEND DEBUG (Tags): API_BASE_URL для тегов:", API_BASE_URL); // Дополнительный лог
            try {
                const response = await fetch(`${API_BASE_URL}/tags`);
                if (!response.ok) {
                    throw new Error(`Ошибка загрузки тегов: ${response.statusText}`);
                }
                const data = await response.json();
                console.log("FRONTEND DEBUG (Tags): Теги получены:", data); // Лог полученных тегов
                setAvailableTags(data.map(tag => ({ id: String(tag.id), name: tag.name })));
            } catch (err) {
                console.error("FRONTEND ERROR (Tags): Ошибка загрузки тегов:", err);
                setError("Не удалось загрузить теги.");
            }
        };
        fetchTags();
    }, [API_BASE_URL]);

    useEffect(() => {
        if (isEditMode) {
            setLoading(true);
            setError('');
            const fetchScriptData = async () => {
                console.log(`FRONTEND DEBUG (Edit): Загрузка данных скрипта ID: ${id} для редактирования.`); // Лог загрузки данных для редактирования
                console.log("FRONTEND DEBUG (Edit): API_BASE_URL для редактирования:", API_BASE_URL); // Дополнительный лог
                try {
                    const token = getAuthToken();
                    if (!token) {
                        setError('Необходимо авторизоваться для редактирования.');
                        setLoading(false);
                        return;
                    }

                    const response = await fetch(`${API_BASE_URL}/cards/${id}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || `Ошибка загрузки скрипта: ${response.statusText}`);
                    }
                    const data = await response.json();
                    console.log("FRONTEND DEBUG (Edit): Данные скрипта получены:", data);

                    setTitle(data.Title);
                    setDescription(data.Description);
                    setSelectedTag(String(data.TagID));

                    // ИСПРАВЛЕНИЕ ЗДЕСЬ: Преобразуем относительный URL изображения в полный
                    // Проверяем, является ли data.ImagePath уже полным URL (http/https)
                    let finalImageUrl = data.ImagePath;
                    if (finalImageUrl && !finalImageUrl.startsWith('http://') && !finalImageUrl.startsWith('https://')) {
                        finalImageUrl = `${API_BASE_URL}${finalImageUrl}`;
                    } else if (!finalImageUrl || finalImageUrl === "") {
                        // Если URL пустой или отсутствует, используем плейсхолдер
                        finalImageUrl = PLACEHOLDER_IMAGE_URL;
                    }
                    setImageUrl(finalImageUrl);
                    console.log("FRONTEND DEBUG (Edit): Установлен imageUrl:", finalImageUrl);


                    // Для scriptFileName: Path содержит полный URL из Cloudinary, нам нужно только имя файла.
                    // Если filePath пуст, устанавливаем пустое имя файла.
                    setScriptFileName(data.FilePath ? data.FilePath.split('/').pop() : '');
                    console.log("FRONTEND DEBUG (Edit): Установлен scriptFileName:", data.FilePath ? data.FilePath.split('/').pop() : '');

                } catch (err) {
                    setError(err.message);
                    console.error("FRONTEND ERROR (Edit): Ошибка загрузки данных скрипта:", err); // Лог ошибки загрузки данных
                } finally {
                    setLoading(false);
                }
            };
            fetchScriptData();
        }
    }, [id, isEditMode, API_BASE_URL]); // Добавил API_BASE_URL в зависимости

    const handleImageChange = (e) => {
        console.log("FRONTEND DEBUG: Выбран файл изображения:", e.target.files[0]); // Лог выбора файла изображения
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
            setImageUrl(URL.createObjectURL(e.target.files[0])); // Для локального предпросмотра
        } else {
            setImageFile(null);
            // Если в режиме редактирования очищаем выбранный файл,
            // но не хотим очищать текущий imageUrl из БД, если пользователь не загрузил новый.
            // При загрузке новой карточки, если файл не выбран, imageUrl должен быть пустым.
            if (!isEditMode) {
                setImageUrl('');
            } else if (imageUrl !== PLACEHOLDER_IMAGE_URL && imageUrl !== cardData.ImagePath) {
                // Если пользователь очистил выбранный файл, и это не плейсхолдер,
                // и не оригинальный путь из БД, то очищаем.
                // Возможно, здесь нужна кнопка "Очистить текущее изображение"
                // которая будет отправлять 'clearImage: true' на бэкенд.
                // В текущей логике, если пользователь загрузил новое изображение, а потом отменил его,
                // imageUrl будет сброшен на пустую строку, но оригинальное изображение из БД не восстановится.
                // ВАЖНО: Текущий бэкенд ожидает поле `clearImage=true` для удаления существующего.
                // Если `imageFile` равен `null`, это не означает удаление на бэкенде.
            }
        }
    };

    const handleScriptFileChange = (e) => {
        console.log("FRONTEND DEBUG: Выбран файл скрипта:", e.target.files[0]); // Лог выбора файла скрипта
        if (e.target.files && e.target.files[0]) {
            setScriptFile(e.target.files[0]);
            setScriptFileName(e.target.files[0].name);
        } else {
            setScriptFile(null);
            if (!isEditMode) setScriptFileName('');
        }
    };

    const handleTagChange = (e) => {
        console.log("FRONTEND DEBUG: Выбран тег:", e.target.value); // Лог выбора тега
        setSelectedTag(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        console.log("FRONTEND DEBUG (Submit): Начата отправка формы."); // Лог начала отправки формы
        console.log("FRONTEND DEBUG (Submit): Значения полей: Title:", title, "Description:", description, "Selected Tag:", selectedTag);
        console.log("FRONTEND DEBUG (Submit): Image File:", imageFile ? imageFile.name : "Нет", "Script File:", scriptFile ? scriptFile.name : "Нет");

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('tagId', selectedTag);

        if (imageFile) {
            formData.append('image', imageFile);
        } else if (isEditMode && imageUrl === PLACEHOLDER_IMAGE_URL && cardData.ImagePath !== "") {
            // Если в режиме редактирования изображение было удалено (стал плейсхолдер)
            // Изначально было изображение, но теперь его нет (и не был загружен новый файл)
            formData.append('clearImage', 'true');
            console.log("FRONTEND DEBUG (Submit): Установлен флаг clearImage=true.");
        }


        if (scriptFile) {
            formData.append('scriptFile', scriptFile);
        } else if (isEditMode && scriptFileName === '' && cardData.FilePath !== "") {
             // Если в режиме редактирования файл скрипта был удален (стал пустым)
            // Изначально был файл, но теперь его нет (и не был загружен новый файл)
            formData.append('clearScriptFile', 'true');
            console.log("FRONTEND DEBUG (Submit): Установлен флаг clearScriptFile=true.");
        }


        const token = getAuthToken();
        console.log("FRONTEND DEBUG (Submit): Получен токен:", token ? "есть" : "нет"); // Лог наличия токена

        try {
            if (!token) {
                throw new Error('Необходимо авторизоваться для выполнения операции.');
            }

            const method = isEditMode ? 'PUT' : 'POST';
            console.log("FRONTEND DEBUG (Submit): API_BASE_URL:", API_BASE_URL);
            const url = isEditMode ? `${API_BASE_URL}/api/admin/cards/${id}` : `${API_BASE_URL}/api/admin/cards`;

            console.log(`FRONTEND DEBUG (Submit): Отправка запроса: Метод: ${method}, URL: ${url}`); // Лог URL и метода
            // Можно вывести содержимое FormData, но это не всегда удобно для файлов.
            // for (let pair of formData.entries()) {
            //     console.log(pair[0]+ ': ' + pair[1]); 
            // }

            const response = await fetch(url, {
                method: method,
                body: formData,
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log("FRONTEND DEBUG (Submit): Получен ответ от сервера:", response.status, response.statusText); // Лог статуса ответа

            if (!response.ok) {
                const errorData = await response.json();
                console.error("FRONTEND ERROR (Submit): Ошибка ответа сервера:", errorData); // Лог ошибки ответа
                throw new Error(errorData.error || errorData.message || 'Ошибка при сохранении скрипта');
            }

            const result = await response.json();
            console.log('FRONTEND DEBUG (Submit): Скрипт успешно сохранен:', result);
            alert(`Скрипт успешно ${isEditMode ? 'обновлен' : 'добавлен'}!`);
            navigate('/admin/scripts');

        } catch (err) {
            setError(err.message);
            console.error("FRONTEND ERROR (Submit): Ошибка в handleSubmit:", err); // Лог ошибки в submit
        } finally {
            setLoading(false);
            console.log("FRONTEND DEBUG (Submit): Отправка формы завершена."); // Лог завершения
        }
    };

    if (loading && isEditMode) {
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
                        accept="image/*"
                        onChange={handleImageChange}
                    />
                    {imageUrl && ( // Показываем предпросмотр, если imageUrl не пуст
                        <div className={styles.imagePreview}>
                            <p>Предварительный просмотр:</p>
                            <img src={imageUrl} alt="Предварительный просмотр" />
                            {/* Кнопка "Очистить" изображение */}
                            {isEditMode && imageFile === null && imageUrl !== PLACEHOLDER_IMAGE_URL && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setImageUrl(PLACEHOLDER_IMAGE_URL); // Устанавливаем плейсхолдер
                                        setImageFile(null); // Важно: сбрасываем файл
                                        // Этот флаг 'clearImage' будет отправлен при submit
                                    }}
                                    className={styles.clearImageButton}
                                >
                                    Очистить изображение
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="scriptFile">Файл скрипта:</label>
                    <input
                        type="file"
                        id="scriptFile"
                        onChange={handleScriptFileChange}
                        required={!isEditMode}
                    />
                    {scriptFileName && (
                        <p className={styles.fileNamePreview}>Выбран файл: <strong>{scriptFileName}</strong></p>
                    )}
                     {/* Кнопка "Очистить" файл скрипта */}
                    {isEditMode && scriptFile === null && scriptFileName !== '' && (
                        <button
                            type="button"
                            onClick={() => {
                                setScriptFileName(''); // Очищаем имя файла
                                setScriptFile(null); // Важно: сбрасываем файл
                                // Этот флаг 'clearScriptFile' будет отправлен при submit
                            }}
                            className={styles.clearFileButton}
                        >
                            Очистить файл скрипта
                        </button>
                    )}
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="tag">Тег:</label>
                    <select
                        id="tag"
                        value={selectedTag}
                        onChange={handleTagChange}
                        className={styles.tagsSelect}
                        required
                    >
                        <option value="">Выберите тег</option>
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
