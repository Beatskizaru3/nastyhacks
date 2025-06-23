// src/admin/pages/UsersList/UsersList.jsx
import React, { useState, useEffect } from 'react';
import styles from './UsersList.module.scss';
import { useAuth } from '../../../context/AuthContext'; 

function UsersList() {
    const { token } = useAuth();
    const [users, setUsers] = useState([]);
    const [totalUsers, setTotalUsers] = useState(0); 
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(null); 
    const usersPerPage = 15;

    useEffect(() => {
        const fetchUsers = async () => {
            if (!token) {
                setError('Отсутствует токен авторизации.');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null); 

            try {
                const response = await fetch(`/api/admin/users?page=${currentPage}&limit=${usersPerPage}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`, 
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Ошибка получения списка пользователей: ${response.status}`);
                }

                // *** ИЗМЕНЕНИЕ ЗДЕСЬ ***
                const { total_count, users: fetchedUsers } = await response.json(); 
                
                if (Array.isArray(fetchedUsers)) {
                    setUsers(fetchedUsers);
                    setTotalUsers(total_count || 0); // Используем total_count из бэкенда
                } else {
                    // Это сообщение появится, если бэкенд не вернул объект с total_count и users
                    throw new Error('Некорректный формат данных: ожидался объект с массивом пользователей и общим количеством.');
                }

            } catch (err) {
                console.error('Ошибка при загрузке пользователей:', err);
                setError(err.message || 'Не удалось загрузить список пользователей.');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [currentPage, token]); 

    // totalPages теперь будет корректным, так как totalUsers приходит с бэкенда
    const totalPages = Math.ceil(totalUsers / usersPerPage); 

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
    };

    const formatDate = (dateString) => {
        try {
            const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' };
            return new Date(dateString).toLocaleDateString('ru-RU', options);
        } catch (e) {
            console.error("Ошибка форматирования даты:", dateString, e);
            return dateString;
        }
    };

    return (
        <div className={styles.usersList}>
            <h2>Пользователи</h2>

            <div className={styles.totalUsersInfo}>
                <p>Общее количество пользователей: <span>{totalUsers}</span></p>
                {/* Теперь это предупреждение можно удалить или оставить для отладки */}
                {totalUsers === users.length && totalPages > 1 && ( // Добавлено условие totalPages > 1
                    <p className={styles.warningMessage}>
                        (Примечание: Отображается количество на текущей странице, так как бэкенд не предоставляет общее количество.
                        Для полноценной пагинации Go-бэкенд должен вернуть "total_count".)
                    </p>
                )}
            </div>

            {loading && <p>Загрузка пользователей...</p>}
            {error && <p className={styles.errorMessage}>Ошибка: {error}</p>}

            {!loading && !error && (
                <div className={styles.tableContainer}>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Имя пользователя</th>
                                <th>Email</th>
                                <th>Дата регистрации</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan="4">Пользователей пока нет.</td>
                                </tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.ID}> 
                                        <td>{user.ID}</td>
                                        <td>{user.username}</td>
                                        <td>{user.email}</td>
                                        <td>{formatDate(user.CreatedAt)}</td> 
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <div className={styles.pagination}>
                <button 
                    onClick={handlePrevPage} 
                    disabled={currentPage === 1 || loading} 
                    className={styles.paginationButton}
                >
                    Предыдущая
                </button>
                <span>Страница {currentPage} из {totalPages}</span>
                <button 
                    onClick={handleNextPage} 
                    disabled={currentPage === totalPages || loading || totalPages === 0} // Добавлено totalPages === 0
                    className={styles.paginationButton}
                >
                    Следующая
                </button>
            </div>
        </div>
    );
}

export default UsersList;