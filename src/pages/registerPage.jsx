import '../styles/registerPage.scss';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function RegisterPage() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const API_BASE_URL = process.env.REACT_APP_API_URL;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null); // Сбрасываем предыдущие ошибки
        setLoading(true); // Включаем индикатор загрузки

        try {
            // Отправляем запрос на /register. Прокси в package.json перенаправит на http://localhost:8080/register
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Отправляем данные для регистрации
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json(); // Парсим JSON-ответ от сервера

            if (!response.ok) {
                // Если статус ответа не 2xx (например, 400), это ошибка
                setError(data.error || 'Ошибка регистрации. Пожалуйста, попробуйте еще раз.');
                return; // Прекращаем выполнение функции
            }

            // Успешная регистрация
            alert('Регистрация прошла успешно! Теперь вы можете войти.'); // Сообщение пользователю
            navigate('/login'); // Перенаправляем на страницу логина после успешной регистрации

        } catch (err) {
            // Обработка сетевых ошибок
            setError('Ошибка подключения к серверу. Пожалуйста, попробуйте позже.');
            console.error('Register error:', err);
        } finally {
            setLoading(false); // Выключаем индикатор загрузки
        }
    };

    return (
        <div className="register container">
            <div className="register__body">
                <h2 className="register__title">Register</h2>
                <form onSubmit={handleSubmit}>
                    {/* Отображаем сообщение об ошибке, если оно есть */}
                    {error && <p className="error-message">{error}</p>}
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                        {/* Изменяем текст кнопки в зависимости от состояния загрузки */}
                        {loading ? 'Регистрация...' : 'Sign Up'}
                    </button>
                </form>
                <p>
                   Already have account? <Link to='/login'>Log in</Link>
                </p>
            </div>
        </div>
    );
}

export default RegisterPage;