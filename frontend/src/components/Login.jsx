import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api';
import { useAuth } from '../auth/AuthContext';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [iniciando, setIniciando] = useState(false);
    const navigate = useNavigate();
    const { iniciarSesion } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIniciando(true);

        try {
            const response = await axios.post(`${API_URL}/api/login`, {
                identificador: username,
                password,
            });
            iniciarSesion(response.data.usuario);
            navigate('/');
        } catch (error) {
            const mensaje = error.response?.data?.errors
                ? Object.values(error.response.data.errors).flat()[0]
                : error.response?.data?.message || 'No se pudo conectar con el servidor.';
            setError(mensaje);
        } finally {
            setIniciando(false);
        }
    };

    return (
        <section className="content-section">
            <h2>Iniciar sesión</h2>
            <p>Inicia sesión para acceder a tu cuenta.</p>
            <p>Inicia con el nombre de usuario o correo que registraste.</p>

            <form onSubmit={handleLogin} className="login-form">
                <div>
                    <label htmlFor="login-identificador">Usuario o correo electrónico</label>
                    <input
                        id="login-identificador"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="login-password">Contraseña</label>
                    <input
                        id="login-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                    />
                </div>

                {error && <p role="alert">{error}</p>}

                <div className="form-options">
                    <label htmlFor="remember-login">
                        <input id="remember-login" type="checkbox" /> Recordarme
                    </label>

                    <Link to="/register">¿Olvidaste tu contraseña?</Link>
                </div>

                <button type="submit" className="btn-buy" disabled={iniciando}>
                    {iniciando ? 'Iniciando sesión...' : 'Iniciar sesión'}
                </button>
            </form>
        </section>
    );
};

export default Login;