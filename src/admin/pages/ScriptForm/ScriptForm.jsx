// src/admin/pages/ScriptForm/ScriptForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './ScriptForm.module.scss';

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
            console.log("FRONTEND DEBUG: Загрузка тегов..."); // Лог начала загрузки тегов
            try {
                const response = await fetch(`${API_BASE_URL}/tags`);
                if (!response.ok) {
                    throw new Error(`Ошибка загрузки тегов: ${response.statusText}`);
                }
                const data = await response.json();
                console.log("FRONTEND DEBUG: Теги получены:", data); // Лог полученных тегов
                setAvailableTags(data.map(tag => ({ id: String(tag.id), name: tag.name })));
            } catch (err) {
                console.error("FRONTEND ERROR: Ошибка загрузки тегов:", err);
                setError("Не удалось загрузить теги.");
            }
        };
        fetchTags();
    }, []);

    useEffect(() => {
        if (isEditMode) {
            setLoading(true);
            setError('');
            const fetchScriptData = async () => {
                console.log(`FRONTEND DEBUG: Загрузка данных скрипта ID: ${id} для редактирования.`); // Лог загрузки данных для редактирования
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
                    console.log("FRONTEND DEBUG: Данные скрипта получены:", data); // Лог полученных данных скрипта

                    setTitle(data.Title);
                    setDescription(data.Description);
                    setImageUrl(data.ImagePath ? `${API_BASE_URL}${data.ImagePath}` : '');
                    setScriptFileName(data.FilePath ? data.FilePath.split('/').pop() : '');
                    setSelectedTag(String(data.TagID));

                } catch (err) {
                    setError(err.message);
                    console.error("FRONTEND ERROR: Ошибка загрузки данных скрипта:", err); // Лог ошибки загрузки данных
                } finally {
                    setLoading(false);
                }
            };
            fetchScriptData();
        }
    }, [id, isEditMode]);

    const handleImageChange = (e) => {
        console.log("FRONTEND DEBUG: Выбран файл изображения:", e.target.files[0]); // Лог выбора файла изображения
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
            setImageUrl(URL.createObjectURL(e.target.files[0])); 
        } else {
            setImageFile(null);
            if (!isEditMode) setImageUrl('');
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

        console.log("FRONTEND DEBUG: Начата отправка формы."); // Лог начала отправки формы
        console.log("FRONTEND DEBUG: Значения полей: Title:", title, "Description:", description, "Selected Tag:", selectedTag);
        console.log("FRONTEND DEBUG: Image File:", imageFile ? imageFile.name : "Нет", "Script File:", scriptFile ? scriptFile.name : "Нет");

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('tagId', selectedTag);

        if (imageFile) {
            formData.append('image', imageFile);
        }
        if (scriptFile) {
            formData.append('scriptFile', scriptFile); 
        }

        const token = getAuthToken();
        console.log("FRONTEND DEBUG: Получен токен:", token ? "есть" : "нет"); // Лог наличия токена

        try {
            if (!token) {
                throw new Error('Необходимо авторизоваться для выполнения операции.');
            }

            const method = isEditMode ? 'PUT' : 'POST';
            const url = isEditMode ? `${API_BASE_URL}/api/admin/cards/${id}` : `${API_BASE_URL}/api/admin/cards`;

            console.log(`FRONTEND DEBUG: Отправка запроса: Метод: ${method}, URL: ${url}`); // Лог URL и метода
            // Можно вывести содержимое FormData, но это не всегда удобно для файлов.
            // for (let pair of formData.entries()) {
            //     console.log(pair[0]+ ': ' + pair[1]); 
            // }

            const response = await fetch(url, {
                method: method,
                body: formData,
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log("FRONTEND DEBUG: Получен ответ от сервера:", response.status, response.statusText); // Лог статуса ответа

            if (!response.ok) {
                const errorData = await response.json();
                console.error("FRONTEND ERROR: Ошибка ответа сервера:", errorData); // Лог ошибки ответа
                throw new Error(errorData.error || errorData.message || 'Ошибка при сохранении скрипта');
            }

            const result = await response.json();
            console.log('FRONTEND DEBUG: Скрипт успешно сохранен:', result);
            alert(`Скрипт успешно ${isEditMode ? 'обновлен' : 'добавлен'}!`);
            navigate('/admin/scripts');

        } catch (err) {
            setError(err.message);
            console.error("FRONTEND ERROR: Ошибка в handleSubmit:", err); // Лог ошибки в submit
        } finally {
            setLoading(false);
            console.log("FRONTEND DEBUG: Отправка формы завершена."); // Лог завершения
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
                    {imageUrl && (
                        <div className={styles.imagePreview}>
                            <p>Предварительный просмотр:</p>
                            <img src={imageUrl} alt="Предварительный просмотр" />
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