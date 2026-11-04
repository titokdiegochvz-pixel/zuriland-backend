import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './Header.css';

const Header = () => {
    const { usuario, cerrarSesion } = useAuth();
    const navItems = [
        { id: 'home', label: 'Inicio', path: '/' },
        { id: 'store', label: 'Tienda', path: '/store' },
        { id: 'community', label: 'Comunidad', path: '/community' },
    ];

    return (
        <header className="main-navbar">
            <nav className="navbar-inner">
                <div className="navbar-links">
                    {navItems.map((item) => (
                        <Link
                            key={item.id}
                            to={item.path}
                            className="nav-link"
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>

                <div className="navbar-account">
                    {usuario ? (
                        <>
                            <span className="account-link" role="status">
                                Hola, {usuario.nombre}
                            </span>
                            <button type="button" className="register-button" onClick={cerrarSesion}>
                                Cerrar sesiÃ³n
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="account-link">
                                <span>â™™</span> Iniciar sesiÃ³n
                            </Link>

                            <Link to="/register" className="register-button">
                                Registrarse
                            </Link>
                        </>
                    )}

                    <Link to="/store" className="cart-button" title="Ir a la tienda">
                        ðŸ›’
                        <span className="cart-count">0</span>
                    </Link>
                </div>
            </nav>
        </header>
    );
};

export default Header;
