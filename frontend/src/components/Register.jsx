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
    setRegistrando(true);
    try {
      const response = await axios.post(`${API_URL}/api/usuarios`, { nombre, email, password });
      iniciarSesion(response.data);
      navigate('/');
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      const errores = error.response?.data?.errors;
      const primerError = errores ? Object.values(errores).flat()[0] : null;
      alert(primerError || error.response?.data?.message || "Error al registrar usuario.");
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
          <input id="nombre" name="nombre" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="email">Email:</label>
          <input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="password">Contraseña:</label>
          <div className="password-input">
            <input
              id="password"
              name="password"
              type={mostrarPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
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
        </div>
        <button type="submit" disabled={registrando}>
          {registrando ? 'Registrando...' : 'Registrar'}
        </button>
      </form>
    </section>
  );
}

export default Register;
