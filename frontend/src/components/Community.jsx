
import React, { useEffect, useRef, useState } from 'react';
import { API_URL } from '../config/api';
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
    const [snapshot, setSnapshot] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const hasSnapshot = useRef(false);

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
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
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
                    setError('No se pudo cargar la lista. Revisa tu conexión e inténtalo de nuevo.');
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

    return (
        <section className="community-section">
            <div className="community-card">
                <div className="community-icon">ðŸŒ</div>

                <span className="community-eyebrow">
                    COMPETICIÃ“N GLOBAL
                </span>

                <h2>Comunidad</h2>

                <p>
                    Explora las naciones, consulta las clasificaciones
                    y descubre las reglas de nuestro servidor.
                </p>

                <div className="community-actions">
                    <button
                        className="community-button ranking-button"
                        onClick={onOpenRanking}
                    >
                        <span>ðŸ†</span>
                        Tabla de clasificaciÃ³n
                        <span className="button-arrow">â†’</span>
                    </button>

                    <button
                        className="community-button rules-button"
                        onClick={onOpenRules}
                    >
                        <span>ðŸ“œ</span>
                        Reglas
                        <span className="button-arrow">â†’</span>
                    </button>
                </div>

                <div className="town-roster" aria-labelledby="town-roster-title">
                    <div className="roster-toolbar">
                        <div>
                            <h3 id="town-roster-title">Jugadores de Towny</h3>
                            <p>Residentes de cada ciudad y su estado actual.</p>
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

                    {isLoading ? (
                        <div className="roster-loading" aria-label="Cargando jugadores">
                            {[0, 1, 2].map((item) => (
                                <div className="roster-skeleton" key={item} />
                            ))}
                        </div>
                    ) : snapshot?.towns.length ? (
                        <div className="town-list">
                            {snapshot.towns.map((town) => {
                                const players = [...(town.players || [])].sort((first, second) =>
                                    first.name.localeCompare(second.name, 'es', { sensitivity: 'base' })
                                );
                                const onlineCount = players.filter((player) => player.online).length;

                                return (
                                    <section className="town-group" key={town.name}>
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
                    ) : !error ? (
                        <p className="roster-empty">Aún no hay ciudades disponibles.</p>
                    ) : null}
                </div>
            </div>
        </section>
    );
};

export default Community;
