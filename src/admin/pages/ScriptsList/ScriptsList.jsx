import { useNavigate } from 'react-router-dom';
import styles from './ScriptsList.module.scss';
import { useEffect, useState } from 'react';

function ScriptsList(){

    const navigate = useNavigate();
    const [scripts, setScripts] = useState([]);
    const [editingDownloadsId, setEditingDownloadsId] = useState(null); // ID скрипта, для которого редактируем скачивания
    const [newDownloadCount, setNewDownloadCount] = useState(''); // Новое значение скачиваний

    // Заглушка для получения данных скриптов
    useEffect(() => {
        // Здесь будет API запрос к вашему GoLang бэкенду, например GET /api/admin/scripts
        const fetchScripts = async () => {
            // const response = await fetch('/api/admin/scripts');
            // const data = await response.json();
            // setScripts(data);

            // ВРЕМЕННЫЕ ДАННЫЕ (ЗАГЛУШКА)
            setScripts([
                { id: '1', title: 'Скрипт А', description: 'Краткое описание скрипта А...', downloadsSet: 100, downloadsReal: 125 },
                { id: '2', title: 'Скрипт B', description: 'Описание скрипта B, чуть длиннее.', downloadsSet: 50, downloadsReal: 48 },
                { id: '3', title: 'Скрипт C', description: 'Очень краткое описание C.', downloadsSet: 200, downloadsReal: 198 },
                { id: '4', title: 'Скрипт D', description: 'Описание самого крутого скрипта D, который делает что-то очень крутое и важное для пользователя.', downloadsSet: 500, downloadsReal: 512 },
            ]);
        };
        fetchScripts();
    }, []);

    // Обработчик для кнопки "Загрузить скрипт"
    const handleUploadClick = () => {
        navigate('/admin/scripts/new');
    };

    // Обработчик для кнопки "Редактировать"
    const handleEditClick = (scriptId) => {
        navigate(`/admin/scripts/edit/${scriptId}`);
    };

    // Обработчик для кнопки "Удалить"
    const handleDeleteClick = async (scriptId) => {
        if (window.confirm('Вы уверены, что хотите удалить этот скрипт?')) {
            // Здесь будет API запрос DELETE /api/admin/scripts/:id
            console.log(`Удаление скрипта с ID: ${scriptId}`);
            // После успешного запроса:
            setScripts(scripts.filter(script => script.id !== scriptId));
            alert('Скрипт успешно удален!');
        }
    };

    // Обработчик для кнопки "Установить количество скачиваний"
    const handleSetDownloadsClick = (script) => {
        setEditingDownloadsId(script.id);
        setNewDownloadCount(script.downloadsSet.toString()); // Инициализируем текущим значением
    };

    // Обработчик изменения поля ввода для скачиваний
    const handleDownloadInputChange = (e) => {
        setNewDownloadCount(e.target.value);
    };

    // Сохранение нового количества скачиваний
    const handleSaveDownloads = async (scriptId) => {
        const value = parseInt(newDownloadCount, 10);
        if (isNaN(value) || value < 0) {
            alert('Пожалуйста, введите корректное число.');
            return;
        }

        // Здесь будет API запрос PATCH/PUT /api/admin/scripts/:id с обновленным downloadsSet
        console.log(`Сохранение для ${scriptId}: новое значение ${value}`);
        
        // Обновляем состояние после успешного запроса
        setScripts(scripts.map(script => 
            script.id === scriptId ? { ...script, downloadsSet: value } : script
        ));
        setEditingDownloadsId(null); // Скрываем поле ввода
        setNewDownloadCount('');
        alert('Количество скачиваний обновлено!');
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

            <div className={styles.tableContainer}>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Имя</th>
                            <th>Описание</th>
                            <th>Задано</th>
                            <th>Реально</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scripts.length === 0 ? (
                            <tr>
                                <td colSpan="6">Скриптов пока нет.</td>
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
                                    <td className={styles.actions}>
                                        <button 
                                            className={styles.actionButton}
                                            onClick={() => handleEditClick(script.id)}
                                            title="Редактировать"
                                        >
                                            ✏️ {/* Иконка "Редактировать" */}
                                        </button>
                                        <button 
                                            className={styles.actionButton}
                                            onClick={() => handleSetDownloadsClick(script)}
                                            title="Установить количество скачиваний"
                                        >
                                            🔢 {/* Иконка "Установить скачивания" */}
                                        </button>
                                        <button 
                                            className={`${styles.actionButton} ${styles.deleteButton}`}
                                            onClick={() => handleDeleteClick(script.id)}
                                            title="Удалить"
                                        >
                                            🗑️ {/* Иконка "Удалить" */}
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