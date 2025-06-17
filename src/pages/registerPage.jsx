import '../styles/registerPage.scss';

import  React, { useState }  from 'react';
import { Link, useNavigate } from 'react-router-dom';

function RegisterPage(props){


    const [ email, setEmail] = React.useState('');
    const [ username, setUsername ] = React.useState('');
    const [ password, setPassword] = React.useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Попытка входа:', { username, email, password } )
         // Здесь позже будет API-запрос к бэкенду
    // if (успешно) {
    //   localStorage.setItem('token', 'ваш_токен'); // Сохраняем токен
    //   navigate('/'); // Перенаправляем на главную
    // } else {
    //   alert('Ошибка входа');
    // }
    }
    return(
        <div className="register container">
            <div className="register__body">
                <h2 className="register__title">Register</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    ></input>
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
                            Sign Up
                        </button>
                </form>
                <p>
                   Already have account? <Link to='/login'>Log in</Link>
                </p>
            </div>
        </div>
    )
}

export default RegisterPage;