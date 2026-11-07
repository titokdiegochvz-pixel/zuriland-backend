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
import { useMinecraftStatus } from '../context/MinecraftStatusContext';
import './Home.css';

const SERVER_IP = 'pgsql-stained.tun.ply.gg';

const Home = () => {
    const [copyMessage, setCopyMessage] = useState('');
    const { status, players } = useMinecraftStatus();

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
                <div
                    className={`home-live-status home-live-status--${status}`}
                    role="status"
                    aria-live="polite"
                >
                    <span className="home-live-status-dot" aria-hidden="true" />
                    <div className="home-live-status-count">
                        <span>
                            {status === 'online'
                                ? 'SERVIDOR EN LÍNEA'
                                : status === 'offline'
                                    ? 'SERVIDOR DESCONECTADO'
                                    : status === 'loading'
                                        ? 'CONSULTANDO SERVIDOR'
                                        : 'ESTADO NO DISPONIBLE'}
                        </span>
                        <strong>
                            {status === 'online'
                                ? `${players} ${players === 1 ? 'jugador' : 'jugadores'} en línea`
                                : status === 'loading'
                                    ? 'Cargando estado…'
                                    : status === 'offline'
                                        ? 'No disponible para entrar'
                                        : 'Intenta de nuevo en unos segundos'}
                        </strong>
                    </div>
                    <span className="home-live-status-divider" aria-hidden="true" />
                    <div className="home-live-address">
                        <span>IP DEL SERVIDOR</span>
                        <code>{SERVER_IP}</code>
                    </div>
                    <button
                        type="button"
                        className="home-live-copy"
                        onClick={copyServerAddress}
                    >
                        <CopyIcon />
                        Copiar IP
                    </button>
                </div>
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

            <section className="server-context" aria-labelledby="server-context-title">
                <header className="server-context-heading">
                    <h2 id="server-context-title">¡Bienvenidos a ZuriLand!</h2>
                    <p>
                        ¿Buscas una experiencia diferente en Minecraft Vanilla? Un lugar donde
                        puedas construir tu imperio, formar alianzas, hacer amigos y vivir
                        emocionantes aventuras. Entonces prepárate: ZuriLand te está esperando.
                    </p>
                </header>

                <div className="server-context-grid">
                    <article className="server-context-block">
                        <h3>Ciudades</h3>
                        <p>
                            El servidor contará con diferentes ciudades a las que los jugadores
                            podrán pertenecer de manera aleatoria. Cada ciudad tendrá sus propios
                            habitantes para que conozcas nuevos compañeros, hagas amistades y
                            desarrolles tu hogar junto a ellos.
                        </p>
                    </article>

                    <article className="server-context-block">
                        <h3>Economía</h3>
                        <p>
                            ¡El comercio será parte fundamental de nuestra comunidad! Podrás
                            conseguir recursos, comerciar con otros jugadores y hacer crecer tu
                            riqueza.
                        </p>
                    </article>

                    <article className="server-context-block">
                        <h3>Días de paz</h3>
                        <p>
                            De lunes a sábado podrás vivir tranquilamente. Construye tu casa,
                            consigue materiales, comercia, desarrolla tu ciudad y disfruta de la
                            supervivencia sin preocuparte por ser atacado.
                        </p>
                    </article>

                    <article className="server-context-block server-context-block--war">
                        <h3>Domingos de guerra</h3>
                        <p>
                            Una vez a la semana, los domingos, habrá un periodo de tiempo limitado
                            en el que todos los jugadores podrán atacarse entre sí. Será el momento
                            de defender tu ciudad, demostrar tu habilidad y luchar por sobrevivir.
                        </p>
                        <p>
                            Esta oportunidad de combate solamente estará disponible los domingos.
                            Al terminar el evento, volverá la paz hasta el siguiente domingo.
                        </p>
                    </article>
                </div>

                <p className="server-context-closing">
                    Construye, comercia, haz alianzas, crea amistades y prepárate para sobrevivir
                    a los domingos de guerra. Aquí podrás vivir en paz seis días, pero el séptimo
                    tendrás que estar preparado.
                    <strong>Seis días de paz, un día de guerra.</strong>
                </p>
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
