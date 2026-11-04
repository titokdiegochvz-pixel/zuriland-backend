import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../store/CartContext';
import { CartIcon, UserIcon } from './UiIcons';
import './Header.css';

const Header = () => {
    const { usuario, cerrarSesion } = useAuth();
    const { count } = useCart();
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
                        <NavLink
                            key={item.id}
                            to={item.path}
                            end={item.id === 'home'}
                            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </div>

                <div className="navbar-account">
                    {usuario ? (
                        <>
                            <span className="account-link" role="status">
                                <span className="account-brand-mark" aria-hidden="true">Z</span>
                                <span className="account-name">Hola, {usuario.nombre}</span>
                            </span>
                            <button type="button" className="register-button" onClick={cerrarSesion}>
                                Cerrar sesión
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="account-link">
                                <UserIcon /> Iniciar sesión
                            </Link>

                            <Link to="/register" className="register-button">
                                Registrarse
                            </Link>
                        </>
                    )}

                    <Link
                        to="/cart"
                        className="cart-button"
                        title="Ir al carrito"
                        aria-label={`Carrito, ${count} productos`}
                    >
                        <CartIcon />
                        <span className="cart-count">{count > 99 ? '99+' : count}</span>
                    </Link>
                </div>
            </nav>
        </header>
    );
};

export default Header;
