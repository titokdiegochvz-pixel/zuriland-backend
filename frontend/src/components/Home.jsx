import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    BookIcon,
    CopyIcon,
    PlayIcon,
    SparkIcon,
    ServerIcon,
    UsersIcon,
    CartIcon,
} from './UiIcons';
import './Home.css';

const SERVER_IP = 'pgsql-stained.tun.ply.gg';

const Home = () => {
    const [copyMessage, setCopyMessage] = useState('');

    const copyServerAddress = async () => {
        try {
            if (!navigator.clipboard) {
                throw new Error('El portapapeles no está disponible.');
            }

            await navigator.clipboard.writeText(SERVER_IP);
            setCopyMessage('IP copiada. ¡Te esperamos en ZuriLand!');
        } catch {
            window.prompt('Copia la IP del servidor:', SERVER_IP);
            setCopyMessage('Usa esta dirección para conectarte: ' + SERVER_IP);
        }
    };

    return (
        <div className="home-page">
            <section className="home-hero" aria-labelledby="home-title">
                <h1 id="home-title">
                    Bienvenido a <span>ZURILAND</span>
                </h1>
                <div className="home-divider" aria-hidden="true">
                    <span />
                    <SparkIcon />
                    <span />
                </div>
                <p>Explora, construye y forma parte de una gran comunidad Survival.</p>
                <a className="home-play-button" href="#server-connect">
                    <PlayIcon />
                    Juega ahora
                </a>
            </section>

            <section
                className="server-connect-panel"
                id="server-connect"
                aria-label="Conéctate al servidor"
            >
                <div className="server-connect-intro">
                    <ServerIcon />
                    <div>
                        <h2>Conéctate al servidor</h2>
                        <p>Minecraft Java Edition <span>·</span> Survival</p>
                    </div>
                </div>
                <div className="server-address">
                    <code>{SERVER_IP}</code>
                    <button
                        type="button"
                        onClick={copyServerAddress}
                        aria-label="Copiar IP del servidor"
                    >
                        <CopyIcon />
                    </button>
                </div>
                <span className="server-edition">Java</span>
                {copyMessage && (
                    <span className="server-copy-message" role="status">
                        {copyMessage}
                    </span>
                )}
            </section>

            <nav className="home-feature-links" aria-label="Explora ZuriLand">
                <Link to="/community" className="home-feature-link">
                    <UsersIcon />
                    <span>
                        <strong>Comunidad</strong>
                        <small>Conoce a otros jugadores y forma alianzas.</small>
                    </span>
                </Link>
                <Link to="/store" className="home-feature-link">
                    <CartIcon />
                    <span>
                        <strong>Tienda</strong>
                        <small>Explora rangos, kits y productos del servidor.</small>
                    </span>
                </Link>
                <Link to="/rules" className="home-feature-link">
                    <BookIcon />
                    <span>
                        <strong>Reglas</strong>
                        <small>Consulta las normas del servidor.</small>
                    </span>
                </Link>
            </nav>

            <footer className="home-footer">
                <div className="home-footer-inner">
                    <Link to="/" className="home-footer-brand" aria-label="ZuriLand, inicio">
                        <span className="home-footer-mark">Z</span>
                        <span>
                            <strong>ZuriLand</strong>
                            <small>Servidor Minecraft Survival</small>
                        </span>
                    </Link>
                    <nav className="home-footer-nav" aria-label="Navegación del pie de página">
                        <Link to="/">Inicio</Link>
                        <Link to="/store">Tienda</Link>
                        <Link to="/community">Comunidad</Link>
                        <Link to="/rules">Reglas</Link>
                    </nav>
                    <a
                        className="home-footer-discord"
                        href="https://discord.gg/e7SN74u7S"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Discord
                    </a>
                </div>
                <p>© {new Date().getFullYear()} ZuriLand. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
};

export default Home;
