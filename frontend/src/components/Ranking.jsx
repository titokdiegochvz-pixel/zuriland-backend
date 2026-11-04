import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api';
import './Ranking.css';

const PlayerSkin = ({ name }) => {
    const [imageFailed, setImageFailed] = useState(false);

    return (
        <span className="ranking-player-skin" aria-hidden="true">
            {!imageFailed ? (
                <img
                    src={`https://mc-heads.net/avatar/${encodeURIComponent(name)}/64`}
                    alt=""
                    loading="lazy"
                    onError={() => setImageFailed(true)}
                />
            ) : (
                <span>{name.slice(0, 1)}</span>
            )}
        </span>
    );
};

const Ranking = () => {
    const navigate = useNavigate();
    const [players, setPlayers] = useState([]);
    const [updatedAt, setUpdatedAt] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        const loadRanking = async () => {
            setIsLoading(true);

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
                    throw new Error('Invalid Towny ranking response');
                }

                const rankedPlayers = data.towns.flatMap((town) => {
                    if (typeof town.name !== 'string' || !Array.isArray(town.players)) {
                        throw new Error('Invalid Towny ranking response');
                    }

                    return town.players.map((player) => {
                        const kills = Number(player.kills);
                        if (
                            typeof player.name !== 'string'
                            || !Number.isFinite(kills)
                            || kills < 0
                        ) {
                            throw new Error('Invalid Towny player ranking');
                        }

                        return {
                            name: player.name,
                            town: town.name,
                            kills,
                            online: Boolean(player.online),
                        };
                    });
                }).sort((first, second) =>
                    second.kills - first.kills
                    || first.name.localeCompare(second.name, 'es', { sensitivity: 'base' })
                );

                const timestamp = data.updated_at ? new Date(data.updated_at) : null;
                setPlayers(rankedPlayers);
                setUpdatedAt(timestamp && !Number.isNaN(timestamp.getTime()) ? timestamp : null);
                setError('');
            } catch (requestError) {
                if (requestError.name !== 'AbortError') {
                    setError('No se pudo cargar la clasificación. Revisa tu conexión e inténtalo de nuevo.');
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        loadRanking();
        return () => controller.abort();
    }, [reloadKey]);

    const formattedUpdatedAt = updatedAt?.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <section className="ranking-section" aria-labelledby="ranking-title">
            <div className="ranking-heading">
                <button
                    type="button"
                    className="ranking-back"
                    onClick={() => navigate('/community')}
                >
                    ← Volver a comunidad
                </button>

                <h1 id="ranking-title">Clasificación de jugadores</h1>
                <p>Ranking del servidor ordenado por kills totales.</p>
            </div>

            <div className="ranking-toolbar">
                <div>
                    <strong>{players.length}</strong>
                    <span>{players.length === 1 ? ' jugador' : ' jugadores'}</span>
                    {formattedUpdatedAt && (
                        <small> · Actualizado a las {formattedUpdatedAt}</small>
                    )}
                </div>
                <button
                    type="button"
                    className="ranking-refresh"
                    onClick={() => setReloadKey((key) => key + 1)}
                    disabled={isLoading}
                >
                    <svg viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M16.5 9a6.5 6.5 0 0 0-11.9-3L3 8m0 0V4m0 4h4m-3.5 3a6.5 6.5 0 0 0 11.9 3L17 12m0 0v4m0-4h-4" />
                    </svg>
                    {isLoading ? 'Cargando…' : 'Actualizar'}
                </button>
            </div>

            {error ? (
                <div className="ranking-message ranking-error" role="alert">
                    <span>{error}</span>
                    <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
                        Reintentar
                    </button>
                </div>
            ) : (
                <div className="ranking-table-wrap">
                    <table className="ranking-table">
                        <thead>
                            <tr>
                                <th scope="col">POS.</th>
                                <th scope="col">JUGADOR</th>
                                <th scope="col">CIUDAD</th>
                                <th scope="col">ESTADO</th>
                                <th scope="col" className="ranking-kills-heading">KILLS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td className="ranking-message" colSpan="5">Cargando clasificación…</td>
                                </tr>
                            ) : players.length ? (
                                players.map((player, index) => (
                                    <tr key={`${player.town}-${player.name}`}>
                                        <td className="rank-position">
                                            {index < 3 ? (
                                                <span className={`ranking-medal ranking-medal--${index + 1}`}>
                                                    {index + 1}
                                                </span>
                                            ) : index + 1}
                                        </td>
                                        <td>
                                            <span className="ranking-player">
                                                <PlayerSkin name={player.name} />
                                                <strong>{player.name}</strong>
                                            </span>
                                        </td>
                                        <td className="ranking-town">{player.town}</td>
                                        <td>
                                            <span className={`ranking-presence ${player.online ? 'is-online' : ''}`}>
                                                {player.online ? 'En línea' : 'Desconectado'}
                                            </span>
                                        </td>
                                        <td className="rank-kills">{player.kills.toLocaleString('es-MX')}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td className="ranking-message" colSpan="5">
                                        Aún no hay jugadores sincronizados para clasificar.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
};

export default Ranking;
