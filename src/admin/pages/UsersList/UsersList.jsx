// src/admin/pages/UsersList/UsersList.jsx
import React, { useState, useEffect } from 'react';
import styles from './UsersList.module.scss'; // Создайте этот SCSS модуль

function UsersList() {
    const [users, setUsers] = useState([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 15; // Аналогично пагинации скриптов

    useEffect(() => {
        const fetchUsers = async () => {
            // Здесь будет API запрос к вашему GoLang бэкенду, например GET /api/admin/users
            // Ваш бэкенд должен возвращать список пользователей, отсортированный по дате регистрации (DESC),
            // и общее количество пользователей.
            // Возможно, эндпоинт будет поддерживать пагинацию, например: /api/admin/users?page=1&limit=15

            // --- ЗАГЛУШКА ДЛЯ ДАННЫХ ---
            const dummyUsers = [
                { id: 'u1', username: 'john_doe', email: 'john@example.com', registeredAt: '2025-06-17T10:00:00Z' },
                { id: 'u2', username: 'jane_smith', email: 'jane@example.com', registeredAt: '2025-06-16T15:30:00Z' },
                { id: 'u3', username: 'alex_one', email: 'alex@example.com', registeredAt: '2025-06-16T11:00:00Z' },
                { id: 'u4', username: 'maria_k', email: 'maria@example.com', registeredAt: '2025-06-15T09:10:00Z' },
                { id: 'u5', username: 'peter_pan', email: 'peter@example.com', registeredAt: '2025-06-14T22:00:00Z' },
                { id: 'u6', username: 'sara_connor', email: 'sara@example.com', registeredAt: '2025-06-14T08:00:00Z' },
                { id: 'u7', username: 'mike_tyson', email: 'mike@example.com', registeredAt: '2025-06-13T14:00:00Z' },
                { id: 'u8', username: 'lisa_simpson', email: 'lisa@example.com', registeredAt: '2025-06-12T17:00:00Z' },
                { id: 'u9', username: 'bruce_wayne', email: 'bruce@example.com', registeredAt: '2025-06-11T10:00:00Z' },
                { id: 'u10', username: 'clark_kent', email: 'clark@example.com', registeredAt: '2025-06-10T11:00:00Z' },
                { id: 'u11', username: 'diana_prince', email: 'diana@example.com', registeredAt: '2025-06-09T12:00:00Z' },
                { id: 'u12', username: 'barry_allen', email: 'barry@example.com', registeredAt: '2025-06-08T13:00:00Z' },
                { id: 'u13', username: 'arthur_curry', email: 'arthur@example.com', registeredAt: '2025-06-07T14:00:00Z' },
                { id: 'u14', username: 'oliver_queen', email: 'oliver@example.com', registeredAt: '2025-06-06T15:00:00Z' },
                { id: 'u15', username: 'hal_jordan', email: 'hal@example.com', registeredAt: '2025-06-05T16:00:00Z' },
                { id: 'u16', username: 'lois_lane', email: 'lois@example.com', registeredAt: '2025-06-04T17:00:00Z' },
            ].sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt)); // Сортировка заглушки

            setTotalUsers(dummyUsers.length); // Общее количество
            
            // Ручная пагинация для заглушки
            const startIndex = (currentPage - 1) * usersPerPage;
            const endIndex = startIndex + usersPerPage;
            setUsers(dummyUsers.slice(startIndex, endIndex));
            // --- КОНЕЦ ЗАГЛУШКИ ---
        };

        fetchUsers();
    }, [currentPage]); // Перезагружаем список при изменении текущей страницы

    // Расчет общего количества страниц для пагинации
    const totalPages = Math.ceil(totalUsers / usersPerPage);

    // Функции для навигации по страницам
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
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('ru-RU', options);
    };

    return (
        <div className={styles.usersList}>
            <h2>Пользователи</h2>

            <div className={styles.totalUsersInfo}>
                <p>Общее количество пользователей: <span>{totalUsers}</span></p>
            </div>

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
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td>{user.username}</td>
                                    <td>{user.email}</td>
                                    <td>{formatDate(user.registeredAt)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className={styles.pagination}>
                <button 
                    onClick={handlePrevPage} 
                    disabled={currentPage === 1}
                    className={styles.paginationButton}
                >
                    Предыдущая
                </button>
                <span>Страница {currentPage} из {totalPages}</span>
                <button 
                    onClick={handleNextPage} 
                    disabled={currentPage === totalPages}
                    className={styles.paginationButton}
                >
                    Следующая
                </button>
            </div>
        </div>
    );
}

export default UsersList;