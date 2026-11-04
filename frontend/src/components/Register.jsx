import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api';
import { useAuth } from '../auth/AuthContext';

function Register() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const navigate = useNavigate();
  const { iniciarSesion } = useAuth();

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
    <section>
      <h2>Registrarse</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="nombre">Nombre:</label>
          <input id="nombre" name="nombre" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="email">Email:</label>
          <input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="password">ContraseÃ±a:</label>
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
              aria-label={mostrarPassword ? 'Ocultar contraseÃ±a' : 'Mostrar contraseÃ±a'}
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
