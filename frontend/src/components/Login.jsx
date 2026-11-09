import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api';
import { useAuth } from '../auth/AuthContext';
import { reportClientIssue } from '../services/issueReporting';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [iniciando, setIniciando] = useState(false);
    const [retryAfter, setRetryAfter] = useState(0);
    const navigate = useNavigate();
    const { iniciarSesion } = useAuth();

    useEffect(() => {
        if (retryAfter <= 0) {
            return undefined;
        }

        const timer = window.setTimeout(() => {
            setRetryAfter((remaining) => Math.max(remaining - 1, 0));
        }, 1000);

        return () => window.clearTimeout(timer);
    }, [retryAfter]);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (retryAfter > 0 || iniciando) {
            return;
        }

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
            const status = error.response?.status;
            if (!status || status === 429 || status >= 500) {
                reportClientIssue('account', status);
            }

            if (error.response?.status === 429) {
                const retryHeader = Number(error.response.headers?.['retry-after']);
                const waitSeconds = Number.isFinite(retryHeader) && retryHeader > 0
                    ? Math.ceil(retryHeader)
                    : 60;
                setRetryAfter(waitSeconds);
                setError(`Demasiados intentos. Espera ${waitSeconds} segundos antes de volver a intentarlo.`);
            } else {
                const mensaje = error.response?.data?.errors
                    ? Object.values(error.response.data.errors).flat()[0]
                    : error.response?.data?.message || 'No se pudo conectar con el servidor.';
                setError(mensaje);
            }
        } finally {
            setIniciando(false);
        }
    };

    return (
        <section className="content-section">
            <h1>Iniciar sesión</h1>
            <p>Inicia sesión para acceder a tu cuenta.</p>
            <p>Inicia con el nombre de usuario o correo que registraste.</p>

            <form onSubmit={handleLogin} className="login-form" aria-busy={iniciando}>
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

                    <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
                </div>

                <button type="submit" className="btn-buy" disabled={iniciando || retryAfter > 0}>
                    {iniciando
                        ? 'Iniciando sesión...'
                        : retryAfter > 0
                            ? `Intenta de nuevo en ${retryAfter}s`
                            : 'Iniciar sesión'}
                </button>
            </form>
        </section>
    );
};

export default Login;