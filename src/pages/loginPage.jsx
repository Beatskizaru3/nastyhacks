import '../styles/loginPage.scss';

import  React, { useState }  from 'react';
import { Link, useNavigate } from 'react-router-dom';

function LoginPage(props){


    const [ email, setEmail] = React.useState('');
    const [ password, setPassword] = React.useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Попытка входа:', { email, password } )
         // Здесь позже будет API-запрос к бэкенду
    // if (успешно) {
    //   localStorage.setItem('token', 'ваш_токен'); // Сохраняем токен
    //   navigate('/'); // Перенаправляем на главную
    // } else {
    //   alert('Ошибка входа');
    // }
    }
    return(
        <div className="login container">
            <div className="login__body">
                <h2 className="login__title">Login</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    ></input>
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        >
                        </input>
                        <button>
                            Log in
                        </button>
                </form>
                <p>
                    Haven't any account? <Link to='/register'>Register</Link>
                </p>
            </div>
        </div>
    )
}

export default LoginPage;