// src/pages/Auth/LoginPage.jsx (или как у тебя называется страница входа)

import '../styles/loginPage.scss';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // <-- Убедись, что этот путь правильный

function LoginPage() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate(); // <-- ОДНОКРАТНАЯ ИНИЦИАЛИЗАЦИЯ navigate
    const { login, user, isLoading: authContextLoading } = useAuth(); // Получаем функцию `login` и `user` из контекста, а также `isLoading` для учета загрузки контекста

    const API_BASE_URL = process.env.REACT_APP_API_URL;

    // useEffect для перенаправления ПОСЛЕ того, как AuthContext обновит `user`
    useEffect(() => {
        // Проверяем `user` и `authContextLoading`
        // Если user есть и AuthContext НЕ в состоянии загрузки (т.е. данные профиля уже загружены)
        if (user && !authContextLoading) { 
            console.log('LoginPage useEffect: Пользователь обнаружен в AuthContext:', user.Username, 'Роль:', user.Role);
            if (user.Role === 'admin') { // Используем user.Role, как ты его сохраняешь
                navigate(`/admin`, { replace: true }); // Перенаправляем на /admin/ (базовый маршрут админки)
            } else {
                navigate(`/`, { replace: true });
            }
        }
    }, [user, navigate, authContextLoading]); // Добавили authContextLoading в зависимости

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true); // Начинаем загрузку для UI кнопки

        try {
            // *** 1. Выполняем HTTP-запрос для логина ***
            const response = await fetch(`${API_BASE_URL}/login`, { // <--- УБЕДИСЬ, ЧТО ЭТО ПРАВИЛЬНЫЙ ЭНДПОИНТ (например, /api/auth/login, а не просто /login)
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Если ответ не OK, это ошибка
                setError(data.error || 'Ошибка входа. Пожалуйста, попробуйте еще раз.');
                setLoading(false); // Сбросить loading при ошибке
                return; // Выйти из функции
            }

            const token = data.token;
            if (token) {
                // *** 2. Передаем полученный токен в функцию login из AuthContext ***
                // Функция `login` в AuthContext обновит состояние user и token в контексте,
                // а также сохранит токен и user в localStorage.
                login(token); 
                console.log('LoginPage: Токен успешно получен и передан в login() из AuthContext.');
                
                // Перенаправление произойдет благодаря useEffect выше, как только `user` обновится в контексте
                // и AuthContext завершит загрузку профиля (isLoading: false).
                // Убираем alert, так как он мешает плавной навигации.
                // alert('Вход успешен!'); 

            } else {
                setError('Ошибка: Токен не получен в ответе от сервера.');
                setLoading(false); // Сбросить loading
            }

        } catch (err) {
            setError('Ошибка подключения к серверу. Пожалуйста, попробуйте позже.');
            console.error('Login error:', err);
            setLoading(false); // Сбросить loading при сетевой ошибке
        }
        // finally { 
        //     // Здесь setLoading(false) не нужен, т.к. он уже обрабатывается в блоках try/catch,
        //     // либо его можно оставить, если уверены, что он сработает после navigate
        //     // в случае успешного входа, что может быть не всегда оптимально.
        //     // Лучше оставить управление loading только на success/error.
        // }
    };

    return (
        <div className="login container">
            <div className="login__body">
                <h2 className="login__title">Login</h2>
                <form onSubmit={handleSubmit}>
                    {error && <p className="error-message">{error}</p>}
                    <input
                        type="text"
                        placeholder="Username or Email"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit" disabled={loading}>
                        {loading ? 'Logging in...' : 'Log in'}
                    </button>
                </form>
                <p>
                    Haven't any account? <Link to='/register'>Register</Link>
                </p>
            </div>
        </div>
    );
}

export default LoginPage;