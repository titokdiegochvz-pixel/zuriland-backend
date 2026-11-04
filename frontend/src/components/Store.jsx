import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_URL } from '../config/api';

const Store = () => {
    const [categoria, setCategoria] = useState('rangos');
    const [paypalMensaje, setPaypalMensaje] = useState('');
    const [paypalProcesando, setPaypalProcesando] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const captureStarted = useRef(false);

    const comprar = async (titulo, precio) => {
        try {
            const response = await fetch(`${API_URL}/api/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    title: titulo,
                    price: precio
                })
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                alert(data.error || 'Error al crear la sesión de pago.');
            }

        } catch (error) {
            console.error('Error:', error);
            alert('No se pudo conectar con el servidor de pagos.');
        }
    };

    const pagarConPayPal = async (titulo) => {
        setPaypalProcesando(true);
        setPaypalMensaje('');

        try {
            const response = await fetch(`${API_URL}/api/paypal/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ title: titulo })
            });
            const data = await response.json();

            if (!response.ok || !data.approval_url) {
                throw new Error(data.message || 'No se pudo iniciar el pago con PayPal.');
            }

            window.location.assign(data.approval_url);
        } catch (error) {
            console.error('Error al iniciar el pago con PayPal:', error);
            setPaypalMensaje(error.message || 'No se pudo conectar con PayPal.');
            setPaypalProcesando(false);
        }
    };

    useEffect(() => {
        const paypalStatus = searchParams.get('paypal');
        const orderId = searchParams.get('token');

        if (paypalStatus === 'cancelled') {
            setPaypalMensaje('El pago con PayPal fue cancelado.');
            setSearchParams({}, { replace: true });
            return;
        }

        if (paypalStatus !== 'success' || !orderId || captureStarted.current) {
            return;
        }

        captureStarted.current = true;
        setPaypalProcesando(true);

        fetch(`${API_URL}/api/paypal/orders/${encodeURIComponent(orderId)}/capture`, {
            method: 'POST',
            headers: { 'Accept': 'application/json' }
        })
            .then(async (response) => {
                const data = await response.json();
                if (!response.ok || data.status !== 'COMPLETED') {
                    throw new Error(data.message || 'PayPal no confirmó el pago.');
                }
                setPaypalMensaje(`Pago confirmado para ${data.title}.`);
                setSearchParams({}, { replace: true });
            })
            .catch((error) => {
                console.error('Error al confirmar el pago de PayPal:', error);
                setPaypalMensaje(error.message || 'No se pudo confirmar el pago.');
            })
            .finally(() => setPaypalProcesando(false));
    }, [searchParams, setSearchParams]);

    const dataTienda = {
        rangos: [
            { titulo: 'Elite', precio: 49, desc: 'Kit hierro' },
            { titulo: 'Dios', precio: 99, desc: 'Kit diamante' },
            { titulo: 'Leyenda', precio: 199, desc: 'Kit Netherite' }
        ],
        cosmeticos: [],
        comandos: {
            "Productos": [
                { titulo: 'Pack Utilidad', precio: 49, desc: '/feed (10m), /heal (15m), /fix (uso único), /enderchest' },
                { titulo: 'Pack Maestro', precio: 149, desc: '/heal ilimitado, /feed ilimitado, /fix ilimitado, /nick, 10 slots /sethome' }
            ]
        }
    };

    return (
        <section className="content-section">
            <h2>Tienda ZURILAND</h2>

            <div className="category-nav">
                <button onClick={() => setCategoria('rangos')}>Rangos</button>
                <button onClick={() => setCategoria('cosmeticos')}>Cosméticos</button>
                <button onClick={() => setCategoria('comandos')}>Comandos</button>
            </div>

            {paypalMensaje && <p role="status">{paypalMensaje}</p>}
            {paypalProcesando && <p role="status">Procesando pago con PayPal...</p>}

            <div className="shop-grid">
                {categoria === 'comandos' ? (
                    Object.entries(dataTienda.comandos).map(([seccion, items]) => (
                        <div key={seccion} style={{ width: '100%', marginBottom: '30px' }}>
                            <h2 style={{ textAlign: 'left' }}>{seccion}</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                                {items.map((item, index) => (
                                    <div className="rank-card" key={index}>
                                        <h3>{item.titulo}</h3>
                                        <p style={{ fontSize: '0.85rem' }}>{item.desc}</p>
                                        <p><strong>{item.precio} pesos mexicanos</strong></p>
                                        <button onClick={() => comprar(item.titulo, item.precio)} className="btn-buy">
                                            🛒 Pagar con tarjeta
                                        </button>
                                        <button onClick={() => pagarConPayPal(item.titulo)} className="btn-buy" disabled={paypalProcesando}>
                                            Pagar con PayPal
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    dataTienda[categoria] && dataTienda[categoria].length > 0 ? (
                        dataTienda[categoria].map((item, index) => (
                            <div className="rank-card" key={index}>
                                <h3>{item.titulo}</h3>
                                <p>{item.desc}</p>
                                <button onClick={() => comprar(item.titulo, item.precio)} className="btn-buy">
                                    🛒 Pagar con tarjeta - {item.precio} pesos mexicanos
                                </button>
                                <button onClick={() => pagarConPayPal(item.titulo)} className="btn-buy" disabled={paypalProcesando}>
                                    Pagar con PayPal
                                </button>
                            </div>
                        ))
                    ) : (
                        <p>No hay productos disponibles en esta categoría.</p>
                    )
                )}
            </div>
        </section>
    );
};

export default Store;