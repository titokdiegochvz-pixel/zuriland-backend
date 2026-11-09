import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { API_URL } from '../config/api';
import { reportClientIssue } from '../services/issueReporting';
import './PasswordRecovery.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [enviando, setEnviando] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setMessage('');
        setEnviando(true);

        try {
            const response = await axios.post(`${API_URL}/api/password/email`, { email });
            setMessage(response.data.message);
        } catch (requestError) {
            const status = requestError.response?.status;
            if (!status || status === 429 || status >= 500) {
                reportClientIssue('account', status);
            }

            setError(
                status === 429
                    ? 'Hiciste varias solicitudes. Espera un minuto antes de volver a intentarlo.'
                    : requestError.response?.data?.message
                        || 'No se pudo enviar la solicitud. Inténtalo de nuevo más tarde.',
            );
        } finally {
            setEnviando(false);
        }
    };

    return (
        <section className="content-section password-recovery">
            <h1>Recuperar contraseña</h1>
            <p>Escribe el correo de tu cuenta y te enviaremos un enlace para crear una nueva contraseña.</p>

            <form className="password-recovery-form" onSubmit={handleSubmit} aria-busy={enviando}>
                <label htmlFor="recovery-email">Correo electrónico</label>
                <input
                    id="recovery-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                />
                {error && <p className="password-recovery-error" role="alert">{error}</p>}
                {message && <p className="password-recovery-success" role="status">{message}</p>}
                <button type="submit" className="btn-buy" disabled={enviando}>
                    {enviando ? 'Enviando solicitud...' : 'Enviar enlace de recuperación'}
                </button>
            </form>

            <Link className="password-recovery-back" to="/login">Volver a iniciar sesión</Link>
        </section>
    );
};

export default ForgotPassword;
