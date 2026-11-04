
import React, { useState } from 'react';
import './Ranking.css';

const Ranking = ({ onBack }) => {
    const [category, setCategory] = useState('residents');

    const [nations] = useState([
        {
            id: 1,
            name: 'Imperio EspaÃ±ol',
            residents: 45,
            towns: 12,
            land: 350,
            money: 2500000,
            kills: 342,
        },
        {
            id: 2,
            name: 'Reino de MÃ©xico',
            residents: 38,
            towns: 10,
            land: 290,
            money: 1850000,
            kills: 428,
        },
        {
            id: 3,
            name: 'RepÃºblica Francesa',
            residents: 30,
            towns: 8,
            land: 220,
            money: 1200000,
            kills: 290,
        },
        {
            id: 4,
            name: 'Imperio JaponÃ©s',
            residents: 22,
            towns: 6,
            land: 180,
            money: 950000,
            kills: 215,
        },
        {
            id: 5,
            name: 'Reino BritÃ¡nico',
            residents: 18,
            towns: 5,
            land: 140,
            money: 780000,
            kills: 180,
        },
    ]);

    const categories = {
        residents: { label: 'Residentes', icon: 'ðŸ‘¥' },
        towns: { label: 'Pueblos', icon: 'ðŸ˜ï¸' },
        land: { label: 'Territorio', icon: 'ðŸ—ºï¸' },
        money: { label: 'Dinero', icon: 'ðŸ’°' },
        kills: { label: 'Matanzas', icon: 'âš”ï¸' },
    };

    const formatMoney = (value) =>
        '$' + new Intl.NumberFormat('es-MX', {
            notation: 'compact',
            maximumFractionDigits: 1,
        }).format(value);

    const sortedNations = [...nations].sort(
        (a, b) => b[category] - a[category]
    );

    return (
        <section className="ranking-section">
            <div className="ranking-heading">
                <button className="ranking-back" onClick={onBack}>
                    â† Volver a comunidad
                </button>

                <span className="ranking-eyebrow">
                    COMPETICIÃ“N GLOBAL
                </span>

                <h2>Tabla de clasificaciÃ³n</h2>

                <p>Compara las estadÃ­sticas de las naciones.</p>
            </div>

            <div className="ranking-tabs">
                {Object.entries(categories).map(([key, item]) => (
                    <button
                        key={key}
                        className={`ranking-tab ${
                            category === key ? 'active' : ''
                        }`}
                        onClick={() => setCategory(key)}
                    >
                        {item.icon} {item.label}
                    </button>
                ))}
            </div>

            <div className="ranking-table-wrap">
                <table className="ranking-table">
                    <thead>
                        <tr>
                            <th>POS.</th>
                            <th>NACIÃ“N</th>
                            <th>RESIDENTES</th>
                            <th>PUEBLOS</th>
                            <th>TERRITORIO</th>
                            <th>DINERO</th>
                            <th>MATANZAS</th>
                        </tr>
                    </thead>

                    <tbody>
                        {sortedNations.map((nation, index) => (
                            <tr key={nation.id}>
                                <td className="rank-position">
                                    {index === 0
                                        ? 'ðŸ¥‡'
                                        : index === 1
                                        ? 'ðŸ¥ˆ'
                                        : index === 2
                                        ? 'ðŸ¥‰'
                                        : index + 1}
                                </td>

                                <td>
                                    <strong className="rank-nation">
                                        {nation.name}
                                    </strong>
                                </td>

                                <td>{nation.residents}</td>
                                <td>{nation.towns}</td>
                                <td>{nation.land}</td>

                                <td className="rank-money">
                                    {formatMoney(nation.money)}
                                </td>

                                <td className="rank-kills">
                                    {nation.kills.toLocaleString('es-MX')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <footer className="ranking-footer">
                <span>ðŸŒ {nations.length} naciones</span>
                <span>Datos de demostraciÃ³n</span>
            </footer>
        </section>
    );
};

export default Ranking;
