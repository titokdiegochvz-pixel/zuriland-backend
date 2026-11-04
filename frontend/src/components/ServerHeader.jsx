
import React, { useState } from 'react';
import { API_URL } from '../config/api';
import './ServerHeader.css';

const ServerHeader = () => {
    const [mostrarGuia, setMostrarGuia] = useState(false);

    const ip = 'pgsql-stained.tun.ply.gg';

    const copiarIP = async () => {
        try {
            await navigator.clipboard.writeText(ip);
            alert('Â¡IP copiada! ' + ip);
        } catch {
            window.prompt('Copia la IP del servidor:', ip);
        }
    };

    return (
        <>
            <header className="server-banner">
                <div className="server-banner-overlay" />

                <div className="banner-content">
                    <div className="banner-item banner-players">
                        <span className="banner-icon">ðŸŽ®</span>

                        <div>
                            <span className="banner-small">
                                0 JUGADORES EN LÃNEA
                            </span>
                            <strong>pgsql-stained.tun.ply.gg</strong>
                        </div>
                    </div>

                    <div className="banner-center">
                        <div className="logo-z">Z</div>

                        <button
                            type="button"
                            className="btn-play"
                            onClick={() => setMostrarGuia(true)}
                        >
                            Juega ahora
                        </button>
                    </div>

                    <a
                        href="https://discord.gg/e7SN74u7S"
                        className="banner-item banner-discord"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <div>
                            <span className="banner-small">
                                Â¡HAZ CLIC PARA UNIRTE!
                            </span>
                            <strong>DISCORD SERVER</strong>
                        </div>

                        <span className="discord-icon">â—‰</span>
                    </a>
                </div>
            </header>

            {mostrarGuia && (
                <div
                    className="guia-overlay"
                    onClick={() => setMostrarGuia(false)}
                >
                    <div
                        className="guia-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-label="CÃ³mo entrar a ZURILAND"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="guia-cerrar"
                            onClick={() => setMostrarGuia(false)}
                            aria-label="Cerrar guÃ­a"
                        >
                            Ã—
                        </button>


                  <img
                   src={`${API_URL}/images/pgsql-stained.tun.ply.gg.jpg`}
                   alt="Instrucciones para entrar al servidor ZURILAND"
                   className="guia-imagen"
                   width={2152}
                   height={731}
                   loading="lazy"
                  />


                        <p
                            className="guia-error"
                            style={{ display: 'none' }}
                        >

                        </p>

                        <button
                            type="button"
                            className="guia-copiar"
                            onClick={copiarIP}
                        >
                            Copiar IP del servidor
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default ServerHeader;