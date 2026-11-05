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
                <p>Entra a jugar en pocos pasos. Copia la IP y agrégala en Minecraft Java.</p>
                <a className="home-play-button" href="#server-connect">
                    <PlayIcon />
                    Cómo entrar al servidor
                </a>
            </section>

            <section
                className="server-connect-panel"
                id="server-connect"
                aria-labelledby="server-connect-title"
            >
                <div className="server-connect-intro">
                    <ServerIcon />
                    <div>
                        <h2 id="server-connect-title">Conéctate al servidor</h2>
                        <p>Minecraft Java Edition <span>·</span> Survival</p>
                    </div>
                </div>
                <div className="server-address">
                    <span className="server-address-label">Dirección del servidor</span>
                    <code>{SERVER_IP}</code>
                    <button
                        type="button"
                        onClick={copyServerAddress}
                        aria-label="Copiar IP del servidor"
                    >
                        <CopyIcon />
                        Copiar IP
                    </button>
                </div>

                <ol className="server-connect-steps">
                    <li>
                        <strong>Abre Minecraft Java</strong>
                        <span>Inicia Minecraft: Java Edition.</span>
                    </li>
                    <li>
                        <strong>Entra a Multijugador</strong>
                        <span>En el menú principal, selecciona “Multijugador”.</span>
                    </li>
                    <li>
                        <strong>Agrega ZuriLand</strong>
                        <span>Pega la IP, guarda el servidor y selecciónalo para entrar.</span>
                    </li>
                </ol>

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
