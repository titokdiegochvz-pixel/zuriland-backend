import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api';
import { useAuth } from '../auth/AuthContext';
import { CubeIcon } from './UiIcons';
import './Register.css';

function Register() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const navigate = useNavigate();
  const { iniciarSesion } = useAuth();

  const handleCardPointerMove = (event) => {
    if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const horizontalPosition = (event.clientX - bounds.left) / bounds.width - 0.5;
    const verticalPosition = (event.clientY - bounds.top) / bounds.height - 0.5;
    event.currentTarget.style.setProperty('--register-tilt-x', `${-verticalPosition * 6}deg`);
    event.currentTarget.style.setProperty('--register-tilt-y', `${horizontalPosition * 6}deg`);
  };

  const resetCardTilt = (event) => {
    event.currentTarget.style.setProperty('--register-tilt-x', '0deg');
    event.currentTarget.style.setProperty('--register-tilt-y', '0deg');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrores({});
    setErrorGeneral('');
    setRegistrando(true);
    try {
      const response = await axios.post(`${API_URL}/api/usuarios`, { nombre, email, password });
      iniciarSesion(response.data);
      navigate('/');
    } catch (error) {
      const erroresApi = error.response?.data?.errors;
      if (erroresApi) {
        setErrores(Object.fromEntries(
          Object.entries(erroresApi).map(([field, messages]) => [field, messages[0]]),
        ));
        setErrorGeneral('Revisa los datos señalados e inténtalo de nuevo.');
      } else {
        setErrorGeneral(
          error.response?.data?.message || 'No se pudo conectar con el servidor. Inténtalo de nuevo.',
        );
      }
    } finally {
      setRegistrando(false);
    }
  };

  return (
    <section className="register-page">
      <div className="register-cubes" aria-hidden="true">
        <span className="register-cube register-cube--one"><CubeIcon /></span>
        <span className="register-cube register-cube--two"><CubeIcon /></span>
        <span className="register-cube register-cube--three"><CubeIcon /></span>
      </div>
      <h2>Registrarse</h2>
      <p className="register-intro">Crea tu cuenta y prepárate para la aventura.</p>
      <form
        className="register-form"
        onSubmit={handleSubmit}
        onPointerMove={handleCardPointerMove}
        onPointerLeave={resetCardTilt}
      >
        <div>
          <label htmlFor="nombre">Nombre:</label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              setErrores((actuales) => ({ ...actuales, nombre: undefined }));
            }}
            aria-invalid={Boolean(errores.nombre)}
            aria-describedby={errores.nombre ? 'nombre-error' : undefined}
            autoComplete="nickname"
            required
          />
          {errores.nombre && <span id="nombre-error" className="register-field-error">{errores.nombre}</span>}
        </div>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrores((actuales) => ({ ...actuales, email: undefined }));
            }}
            aria-invalid={Boolean(errores.email)}
            aria-describedby={errores.email ? 'email-error' : undefined}
            autoComplete="email"
            required
          />
          {errores.email && <span id="email-error" className="register-field-error">{errores.email}</span>}
        </div>
        <div>
          <label htmlFor="password">Contraseña:</label>
          <div className="password-input">
            <input
              id="password"
              name="password"
              type={mostrarPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrores((actuales) => ({ ...actuales, password: undefined }));
              }}
              autoComplete="new-password"
              aria-invalid={Boolean(errores.password)}
              aria-describedby={errores.password ? 'password-help password-error' : 'password-help'}
              minLength={8}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setMostrarPassword((mostrar) => !mostrar)}
              aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={mostrarPassword}
            >
              {mostrarPassword ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          <span id="password-help" className="register-password-hint">
            Usa al menos 8 caracteres.
          </span>
          {errores.password && <span id="password-error" className="register-field-error">{errores.password}</span>}
        </div>
        {errorGeneral && <p className="register-form-error" role="alert">{errorGeneral}</p>}
        <button type="submit" disabled={registrando}>
          {registrando ? 'Registrando...' : 'Registrar'}
        </button>
      </form>
    </section>
  );
}

export default Register;
