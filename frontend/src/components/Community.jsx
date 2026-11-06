
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api';
import { useMinecraftStatus } from '../context/MinecraftStatusContext';
import {
    ArrowRightIcon,
    BookIcon,
    FlagIcon,
    TrophyIcon,
    UsersIcon,
} from './UiIcons';
import './Community.css';

const PlayerSkin = ({ name }) => {
    const [imageFailed, setImageFailed] = useState(false);

    return (
        <span className="player-skin" aria-hidden="true">
            {!imageFailed ? (
                <img
                    src={`https://mc-heads.net/avatar/${encodeURIComponent(name)}/64`}
                    alt=""
                    loading="lazy"
                    onError={() => setImageFailed(true)}
                />
            ) : (
                <span className="player-skin-fallback">{name.slice(0, 1)}</span>
            )}
        </span>
    );
};

const Community = ({ onOpenRanking, onOpenRules }) => {
    const navigate = useNavigate();
    const {
        status: minecraftStatus,
        players: liveServerPlayerCount,
        playerNames: livePlayerNames,
        playerNamesAvailable,
    } = useMinecraftStatus();
    const [snapshot, setSnapshot] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const hasSnapshot = useRef(false);
    const openRanking = onOpenRanking || (() => navigate('/ranking'));
    const openRules = onOpenRules || (() => navigate('/rules'));

    useEffect(() => {
        let isMounted = true;
        let isRequestInFlight = false;
        let controller;

        const loadRoster = async () => {
            if (isRequestInFlight) {
                return;
            }

            isRequestInFlight = true;
            controller = new AbortController();

            if (hasSnapshot.current) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }

            try {
                const response = await fetch(`${API_URL}/api/towny/kills`, {
                    signal: controller.signal,
                    headers: { Accept: 'application/json' },
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || `HTTP ${response.status}`);
                }

                if (!Array.isArray(data.towns)) {
                    throw new Error('Invalid Towny roster response');
                }

                if (isMounted) {
                    hasSnapshot.current = true;
                    setSnapshot(data);
                    setError('');
                }
            } catch (requestError) {
                if (isMounted && requestError.name !== 'AbortError') {
                    setError(requestError.message || 'No se pudo cargar la lista. Revisa tu conexión e inténtalo de nuevo.');
                }
            } finally {
                isRequestInFlight = false;
                if (isMounted) {
                    setIsLoading(false);
                    setIsRefreshing(false);
                }
            }
        };

        loadRoster();
        const interval = window.setInterval(loadRoster, 30_000);

        return () => {
            isMounted = false;
            controller?.abort();
            window.clearInterval(interval);
        };
    }, [reloadKey]);

    const updatedAt = snapshot?.updated_at
        ? new Date(snapshot.updated_at).toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
        })
        : null;

    const highlightedTowns = snapshot?.towns
        ? [...snapshot.towns]
            .sort((first, second) => (second.players?.length || 0) - (first.players?.length || 0))
            .slice(0, 3)
        : [];
    const townyPlayers = Array.isArray(snapshot?.players) ? snapshot.players : [];
    const playersByName = new Map(
        townyPlayers.map((player) => [player.name.toLowerCase(), player])
    );
    livePlayerNames.forEach((name) => {
        const key = name.toLowerCase();
        const knownPlayer = playersByName.get(key);
        playersByName.set(key, knownPlayer
            ? { ...knownPlayer, online: true }
            : { name, kills: 0, online: true });
    });

    const hasCompleteLivePlayerList = minecraftStatus === 'online'
        && playerNamesAvailable
        && livePlayerNames.length === liveServerPlayerCount;
    if (hasCompleteLivePlayerList) {
        const liveNames = new Set(livePlayerNames.map((name) => name.toLowerCase()));
        playersByName.forEach((player, key) => {
            playersByName.set(key, { ...player, online: liveNames.has(key) });
        });
    }

    const allPlayers = [...playersByName.values()].sort((first, second) =>
        first.name.localeCompare(second.name, 'es', { sensitivity: 'base' })
    );
    const newPlayers = Array.isArray(snapshot?.new_players) ? snapshot.new_players : [];
    const rosterOnlineCount = allPlayers.filter((player) => player.online).length;
    const onlinePlayerCount = minecraftStatus === 'online'
        ? Math.max(rosterOnlineCount, liveServerPlayerCount)
        : rosterOnlineCount;
    const unidentifiedOnlineCount = Math.max(0, onlinePlayerCount - rosterOnlineCount);

    return (
        <section className="community-section">
            <div className="community-content">
                <header className="community-card">
                    <div className="community-icon"><UsersIcon /></div>

                    <span className="community-eyebrow">
                        COMUNIDAD ZURILAND
                    </span>

                    <h1>Comunidad</h1>

                    <p>
                        Explora las naciones, consulta las clasificaciones y mantente al día
                        con las reglas, eventos y guerras del servidor.
                    </p>

                    <div className="community-actions">
                        <button
                            type="button"
                            className="community-button ranking-button"
                            onClick={openRanking}
                        >
                            <TrophyIcon />
                            Tabla de clasificación
                            <ArrowRightIcon className="button-arrow" />
                        </button>

                        <button
                            type="button"
                            className="community-button rules-button"
                            onClick={openRules}
                        >
                            <BookIcon />
                            Reglas
                            <ArrowRightIcon className="button-arrow" />
                        </button>
                    </div>
                </header>

                <nav className="community-shortcuts" aria-label="Explora la comunidad">
                    <a className="community-shortcut" href="#town-cities">
                        <span className="shortcut-icon"><FlagIcon /></span>
                        <span>
                            <strong>Naciones</strong>
                            <small>Conoce las ciudades de Towny.</small>
                        </span>
                    </a>
                    <a className="community-shortcut" href="#town-roster">
                        <span className="shortcut-icon"><UsersIcon /></span>
                        <span>
                            <strong>Residentes</strong>
                            <small>Consulta jugadores y su estado.</small>
                        </span>
                    </a>
                    <button
                        type="button"
                        className="community-shortcut"
                        onClick={openRanking}
                    >
                        <span className="shortcut-icon"><TrophyIcon /></span>
                        <span>
                            <strong>Clasificación</strong>
                            <small>Ranking de jugadores por kills.</small>
                        </span>
                    </button>
                </nav>

                <section className="featured-towns" id="town-cities" aria-labelledby="featured-towns-title">
                    <div className="community-section-heading">
                        <span />
                        <h2 id="featured-towns-title">Ciudades de Towny</h2>
                        <span />
                    </div>

                    {isLoading ? (
                        <div className="featured-town-loading" aria-label="Cargando ciudades">
                            {[0, 1, 2].map((item) => (
                                <div className="featured-town-skeleton" key={item} />
                            ))}
                        </div>
                    ) : highlightedTowns.length ? (
                        <div className="featured-town-grid">
                            {highlightedTowns.map((town, index) => {
                                const onlineCount = (town.players || []).filter((player) => player.online).length;
                                return (
                                    <a
                                        className={`featured-town-card featured-town-card--${index + 1}`}
                                        href={`#town-${snapshot.towns.indexOf(town)}`}
                                        key={town.name}
                                    >
                                        <span className="town-rank">{index + 1}</span>
                                        <span className="town-emblem"><FlagIcon /></span>
                                        <span className="featured-town-copy">
                                            <strong>{town.name}</strong>
                                            <small>{town.players?.length || 0} residentes</small>
                                        </span>
                                        <span className="town-online-count">
                                            <strong>{onlineCount}</strong>
                                            <small>en línea</small>
                                        </span>
                                    </a>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="featured-town-empty">Aún no hay ciudades disponibles.</p>
                    )}
                </section>

                <section className="town-roster" id="town-roster" aria-labelledby="town-roster-title">
                    <div className="roster-toolbar">
                        <div>
                            <h3 id="town-roster-title">Jugadores del servidor</h3>
                            <p>Todos los jugadores que han entrado, estén en línea o no.</p>
                        </div>
                        <button
                            type="button"
                            className="roster-refresh"
                            onClick={() => setReloadKey((key) => key + 1)}
                            disabled={isLoading || isRefreshing}
                            aria-label="Actualizar lista de jugadores"
                        >
                            <svg viewBox="0 0 20 20" aria-hidden="true">
                                <path d="M16.5 9a6.5 6.5 0 0 0-11.9-3L3 8m0 0V4m0 4h4m-3.5 3a6.5 6.5 0 0 0 11.9 3L17 12m0 0v4m0-4h-4" />
                            </svg>
                            {isRefreshing ? 'Actualizando…' : 'Actualizar'}
                        </button>
                    </div>

                    {updatedAt && (
                        <p className="roster-updated" aria-live="polite">
                            Lista actualizada a las {updatedAt}
                        </p>
                    )}

                    {!isLoading && !error && (
                        <p className="roster-player-count" aria-live="polite">
                            {allPlayers.length} {allPlayers.length === 1 ? 'jugador registrado' : 'jugadores registrados'}
                            {' · '}{onlinePlayerCount} en línea
                            {' · '}{Math.max(0, allPlayers.length - rosterOnlineCount)} desconectados
                        </p>
                    )}

                    {!isLoading && !error && unidentifiedOnlineCount > 0 && (
                        <p className="roster-updated" aria-live="polite">
                            {unidentifiedOnlineCount} {unidentifiedOnlineCount === 1 ? 'conexión está' : 'conexiones están'} activa
                            {unidentifiedOnlineCount === 1 ? '' : 's'}, pero Towny aún no {unidentifiedOnlineCount === 1 ? 'la identifica' : 'las identifica'}.
                        </p>
                    )}

                    {error && (
                        <div className="roster-error" role="alert">
                            <span>{error}</span>
                            <button
                                type="button"
                                onClick={() => setReloadKey((key) => key + 1)}
                            >
                                Reintentar
                            </button>
                        </div>
                    )}

                    {!isLoading && !error && (
                        <section className="roster-newcomers" aria-labelledby="roster-newcomers-title">
                            <div className="roster-newcomers-heading">
                                <div>
                                    <h4 id="roster-newcomers-title">Nuevos en las últimas 24 horas</h4>
                                    <p>Registrados por primera vez desde esta actualización; no incluye visitas anteriores.</p>
                                </div>
                                <span>
                                    {newPlayers.length} {newPlayers.length === 1 ? 'jugador' : 'jugadores'}
                                </span>
                            </div>

                            {newPlayers.length ? (
                                <ul className="newcomer-list">
                                    {newPlayers.map((player) => (
                                        <li className="newcomer-row" key={player.name}>
                                            <PlayerSkin name={player.name} />
                                            <span className="player-name">{player.name}</span>
                                            <span className="newcomer-time">
                                                Visto {new Date(player.first_seen_at).toLocaleString('es-MX', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                            <span className={`player-presence ${player.online ? 'is-online' : 'is-offline'}`}>
                                                <span className="player-status-dot" />
                                                {player.online ? 'Conectado' : 'Desconectado'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="roster-empty">Aún no se han detectado jugadores nuevos.</p>
                            )}
                        </section>
                    )}

                    {isLoading ? (
                        <div className="roster-loading" aria-label="Cargando jugadores">
                            {[0, 1, 2].map((item) => (
                                <div className="roster-skeleton" key={item} />
                            ))}
                        </div>
                    ) : allPlayers.length ? (
                        <ul className="player-list server-player-list">
                            {allPlayers.map((player) => (
                                <li
                                    className={`player-row ${player.online ? 'is-online' : 'is-offline'}`}
                                    key={player.name}
                                >
                                    <PlayerSkin name={player.name} />
                                    <span className="player-name">{player.name}</span>
                                    <span className="player-presence">
                                        <span className="player-status-dot" />
                                        {player.online ? 'Conectado' : 'Desconectado'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : !error ? (
                        <p className="roster-empty">Aún no hay jugadores registrados.</p>
                    ) : null}

                    {!isLoading && snapshot?.towns.length > 0 && (
                        <details className="town-resident-details">
                            <summary>Ver residentes agrupados por ciudad</summary>
                            <div className="town-list">
                                {snapshot.towns.map((town, index) => {
                                    const players = [...(town.players || [])].sort((first, second) =>
                                        first.name.localeCompare(second.name, 'es', { sensitivity: 'base' })
                                    );
                                    const onlineCount = players.filter((player) => player.online).length;

                                    return (
                                        <section className="town-group" id={`town-${index}`} key={town.name}>
                                            <div className="town-heading">
                                                <h4>{town.name}</h4>
                                                <span>
                                                    {onlineCount} / {players.length} en línea
                                                </span>
                                            </div>

                                            {players.length ? (
                                                <ul className="player-list">
                                                    {players.map((player) => (
                                                        <li
                                                            className={`player-row ${player.online ? 'is-online' : 'is-offline'}`}
                                                            key={player.name}
                                                        >
                                                            <PlayerSkin name={player.name} />
                                                            <span className="player-name">{player.name}</span>
                                                            <span className="player-presence">
                                                                <span className="player-status-dot" />
                                                                {player.online ? 'Conectado' : 'Desconectado'}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="town-empty">Esta ciudad todavía no tiene residentes.</p>
                                            )}
                                        </section>
                                    );
                                })}
                            </div>
                        </details>
                    )}
                </section>
            </div>
        </section>
    );
};

export default Community;
