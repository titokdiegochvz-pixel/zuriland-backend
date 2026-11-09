import React, { useState } from 'react';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
import { API_URL } from '../config/api';
import { reportClientIssue } from '../services/issueReporting';
import './PasswordRecovery.css';

const ResetPassword = () => {
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const token = query.get('token') || '';
    const email = query.get('email') || '';
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [errores, setErrores] = useState({});
    const [guardando, setGuardando] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setErrores({});
        setMessage('');
        setGuardando(true);

        try {
            const response = await axios.post(`${API_URL}/api/password/reset`, {
                email,
                token,
                password,
                password_confirmation: passwordConfirmation,
            });
            setMessage(response.data.message);
        } catch (requestError) {
            const erroresApi = requestError.response?.data?.errors;
            const status = requestError.response?.status;
            if (!status || status >= 500) {
                reportClientIssue('account', status);
            }

            if (erroresApi) {
                setErrores(Object.fromEntries(
                    Object.entries(erroresApi).map(([field, messages]) => [field, messages[0]]),
                ));
                setError('Revisa los datos señalados e inténtalo de nuevo.');
            } else {
                setError(
                    requestError.response?.data?.message
                        || 'No se pudo actualizar la contraseña. Inténtalo de nuevo.',
                );
            }
        } finally {
            setGuardando(false);
        }
    };

    const linkValido = Boolean(token && email);

    return (
        <section className="content-section password-recovery">
            <h1>Nueva contraseña</h1>
            {message ? (
                <>
                    <p className="password-recovery-success" role="status">{message}</p>
                    <Link className="password-recovery-action" to="/login">Iniciar sesión</Link>
                </>
            ) : linkValido ? (
                <>
                    <p>Crea una contraseña nueva para tu cuenta.</p>
                    <form className="password-recovery-form" onSubmit={handleSubmit} aria-busy={guardando}>
                        <label htmlFor="new-password">Nueva contraseña</label>
                        <input
                            id="new-password"
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            autoComplete="new-password"
                            minLength={8}
                            aria-describedby={errores.password ? 'new-password-help new-password-error' : 'new-password-help'}
                            required
                        />
                        <span id="new-password-help" className="password-recovery-hint">
                            Usa al menos 8 caracteres.
                        </span>
                        {errores.password && (
                            <span id="new-password-error" className="password-recovery-error">
                                {errores.password}
                            </span>
                        )}

                        <label htmlFor="password-confirmation">Confirma la contraseña</label>
                        <input
                            id="password-confirmation"
                            type="password"
                            value={passwordConfirmation}
                            onChange={(event) => setPasswordConfirmation(event.target.value)}
                            autoComplete="new-password"
                            minLength={8}
                            required
                        />
                        {error && <p className="password-recovery-error" role="alert">{error}</p>}
                        <button type="submit" className="btn-buy" disabled={guardando}>
                            {guardando ? 'Guardando...' : 'Guardar contraseña'}
                        </button>
                    </form>
                </>
            ) : (
                <>
                    <p className="password-recovery-error" role="alert">
                        El enlace está incompleto. Solicita uno nuevo para recuperar tu cuenta.
                    </p>
                    <Link className="password-recovery-action" to="/forgot-password">
                        Solicitar otro enlace
                    </Link>
                </>
            )}
        </section>
    );
};

export default ResetPassword;
