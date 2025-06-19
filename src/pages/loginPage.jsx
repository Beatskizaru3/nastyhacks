import '../styles/loginPage.scss';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // <-- Убедись, что этот путь правильный, или измени на '../AuthContext'

function LoginPage() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login, user } = useAuth(); // Получаем функцию `login` из контекста

    useEffect(() => {
        // Этот useEffect в LoginPage предназначен для перенаправления ПОСЛЕ того, как AuthContext обновит `user`
        if (user) {
            console.log('LoginPage useEffect: Пользователь обнаружен в AuthContext:', user.Username);
            if (user.Role === 'admin') {
                navigate('/admin-dashboard', { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Ошибка входа. Пожалуйста, попробуйте еще раз.');
                setLoading(false); // Обязательно сбросить loading при ошибке
                return;
            }

            const token = data.token;
            if (token) {
                // *** КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ 1: Вызываем функцию login из AuthContext ***
                // Эта функция login обновит состояние user и token в контексте,
                // а также сохранит токен в localStorage с правильным ключом.
                login(token); 
                console.log('LoginPage: Вызвана функция login() из AuthContext.');
                
                // *** КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ 2: Удаляем прямое сохранение в localStorage ***
                // localStorage.setItem('jwtToken', token); // Эту строку УДАЛЯЕМ, так как login() это сделает
                // console.log('Токен успешно сохранен:', token); // Этот лог теперь будет в AuthContext
                
                // Перенаправление произойдет благодаря useEffect выше, как только `user` обновится в контексте
                // и AuthContext завершит загрузку профиля.
                // Возможно, стоит удалить alert('Вход успешен!'); так как перенаправление происходит быстро.
                alert('Вход успешен!'); 

            } else {
                setError('Ошибка: Токен не получен в ответе от сервера.');
                setLoading(false);
            }

        } catch (err) {
            setError('Ошибка подключения к серверу. Пожалуйста, попробуйте позже.');
            console.error('Login error:', err);
        } finally {
            // Loading сбросится после обработки всех случаев, включая перенаправление
            // setLoading(false); // Можно убрать отсюда, если navigate() происходит успешно.
                               // Если оставить, то он сработает до навигации.
        }
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