
import React, { useState } from 'react';
import { useMinecraftStatus } from '../context/MinecraftStatusContext';
import { CopyIcon, DiscordIcon, GamepadIcon } from './UiIcons';
import './ServerHeader.css';

const SITE_ASSET_BASE = import.meta.env.DEV ? '' : '/site';

const ServerHeader = () => {
    const { status, players } = useMinecraftStatus();
    const [ipCopiada, setIpCopiada] = useState(false);
    const [mostrarGuia, setMostrarGuia] = useState(false);

    const ip = 'pgsql-stained.tun.ply.gg';

    const copiarIP = async () => {
        try {
            await navigator.clipboard.writeText(ip);
            setIpCopiada(true);
            window.setTimeout(() => setIpCopiada(false), 2000);
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
                            <span
                                className={`banner-small server-status-label server-status-label--${status}`}
                                role="status"
                                aria-live="polite"
                            >
                                {status === 'online'
                                    ? `${players} ${players === 1 ? 'JUGADOR' : 'JUGADORES'} EN LÍNEA`
                                    : status === 'offline'
                                        ? 'SERVIDOR DESCONECTADO'
                                        : status === 'loading'
                                            ? 'CONSULTANDO JUGADORES'
                                            : 'JUGADORES NO DISPONIBLES'}
                            </span>
                            <strong>{ip}</strong>
                            <button
                                type="button"
                                className="server-banner-copy"
                                onClick={copiarIP}
                            >
                                <CopyIcon />
                                {ipCopiada ? 'IP copiada' : 'Copiar IP'}
                            </button>
                        </div>
                    </div>

                    <div className="banner-center">
                        <img className="brand-logo" src={`${SITE_ASSET_BASE}/logo512.png`} alt="Logo de ZuriLand" />

                        <button
                            type="button"
                            className="btn-play"
                            onClick={() => setMostrarGuia(true)}
                        >
                            Jugar ahora
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
                        aria-label="Cómo entrar a ZuriLand"
                        onClick={(event) => event.stopPropagation()}
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
                            src={`${SITE_ASSET_BASE}/server-join-guide.png`}
                            alt="Instrucciones para agregar y conectar al servidor pgsql-stained.tun.ply.gg en Minecraft"
                            className="guia-imagen"
                            width={2152}
                            height={731}
                        />
                        <button
                            type="button"
                            className="guia-copiar"
                            onClick={copiarIP}
                        >
                            {ipCopiada ? '¡IP copiada!' : 'Copiar IP del servidor'}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default ServerHeader;