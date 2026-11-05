
import React, { useEffect, useState } from 'react';
import { API_URL } from '../config/api';
import { DiscordIcon, GamepadIcon } from './UiIcons';
import './ServerHeader.css';

const ServerHeader = () => {
    const [mostrarGuia, setMostrarGuia] = useState(false);
    const [estadoServidor, setEstadoServidor] = useState({ status: 'loading', players: 0 });

    const ip = 'pgsql-stained.tun.ply.gg';

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const loadServerStatus = async () => {
            try {
                const response = await fetch(`${API_URL}/api/minecraft/status`, {
                    signal: controller.signal,
                    headers: { Accept: 'application/json' },
                });
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
                if (
                    typeof data.online !== 'boolean'
                    || !Number.isInteger(data.players?.online)
                    || data.players.online < 0
                ) {
                    throw new Error('Invalid Minecraft status response');
                }

                if (isMounted) {
                    setEstadoServidor({
                        status: data.online ? 'online' : 'offline',
                        players: data.online ? data.players.online : 0,
                    });
                }
            } catch (error) {
                if (isMounted && error.name !== 'AbortError') {
                    setEstadoServidor({ status: 'unavailable', players: 0 });
                }
            }
        };

        loadServerStatus();
        const interval = window.setInterval(loadServerStatus, 30_000);

        return () => {
            isMounted = false;
            controller.abort();
            window.clearInterval(interval);
        };
    }, []);

    const copiarIP = async () => {
        try {
            await navigator.clipboard.writeText(ip);
            alert('¡IP copiada! ' + ip);
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
                        <span className="banner-icon"><GamepadIcon /></span>

                        <div>
                            <span className="banner-small" role="status" aria-live="polite">
                                {estadoServidor.status === 'online'
                                    ? `${estadoServidor.players} ${estadoServidor.players === 1 ? 'JUGADOR' : 'JUGADORES'} EN LÍNEA`
                                    : estadoServidor.status === 'offline'
                                        ? 'SERVIDOR DESCONECTADO'
                                        : estadoServidor.status === 'loading'
                                            ? 'CONSULTANDO JUGADORES'
                                            : 'JUGADORES NO DISPONIBLES'}
                            </span>
                            <strong>{ip}</strong>
                        </div>
                    </div>

                    <div className="banner-center">
                        <img className="brand-logo" src="/site/logo512.png" alt="Logo de ZuriLand" />

                        <button
                            type="button"
                            className="btn-play"
                            onClick={() => setMostrarGuia(true)}
                        >
                            Ver guía visual
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
                                ¡HAZ CLIC PARA UNIRTE!
                            </span>
                            <strong>DISCORD SERVER</strong>
                        </div>

                        <span className="discord-icon"><DiscordIcon /></span>
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
                        aria-label="Cómo entrar a ZURILAND"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="guia-cerrar"
                            onClick={() => setMostrarGuia(false)}
                            aria-label="Cerrar guía"
                        >
                            ×
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