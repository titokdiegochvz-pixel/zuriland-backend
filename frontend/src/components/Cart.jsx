import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { API_URL } from '../config/api';
import { useCart } from '../store/CartContext';
import { findStoreProduct } from '../store/catalog';
import { CartIcon, CardIcon, TrashIcon } from './UiIcons';
import './Cart.css';

const formatPrice = (amount) =>
    `${new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        maximumFractionDigits: 0,
    }).format(amount)} MXN`;

const Cart = () => {
    const { items, total, updateQuantity, removeItem, clearCart } = useCart();
    const [searchParams, setSearchParams] = useSearchParams();
    const [paymentMessage, setPaymentMessage] = useState('');
    const [paymentError, setPaymentError] = useState('');
    const [processing, setProcessing] = useState('');
    const captureStarted = useRef('');

    useEffect(() => {
        const paypalStatus = searchParams.get('paypal');
        const orderId = searchParams.get('token');

        if (paypalStatus === 'cancelled') {
            setPaymentMessage('El pago fue cancelado. Tu carrito sigue guardado.');
            setSearchParams({}, { replace: true });
            return;
        }

        if (paypalStatus !== 'success' || !orderId || captureStarted.current === orderId) {
            return;
        }

        captureStarted.current = orderId;
        setProcessing('paypal');
        setPaymentError('');

        fetch(`${API_URL}/api/paypal/orders/${encodeURIComponent(orderId)}/capture`, {
            method: 'POST',
            headers: { Accept: 'application/json' },
        })
            .then(async (response) => {
                const data = await response.json();
                if (!response.ok || data.status !== 'COMPLETED') {
                    throw new Error(data.message || 'PayPal no pudo confirmar el pago.');
                }

                clearCart();
                setPaymentMessage(`Pago confirmado para ${data.title}.`);
                setSearchParams({}, { replace: true });
            })
            .catch((error) => {
                console.error('No se pudo confirmar el pago de PayPal:', error);
                setPaymentError(error.message || 'No se pudo confirmar el pago. Contacta soporte antes de volver a pagar.');
                captureStarted.current = '';
            })
            .finally(() => setProcessing(''));
    }, [searchParams, setSearchParams, clearCart]);

    const pay = async (provider) => {
        if (items.length === 0 || processing) {
            return;
        }

        setProcessing(provider);
        setPaymentError('');
        setPaymentMessage('');

        try {
            const endpoint = provider === 'paypal'
                ? '/api/paypal/orders'
                : '/api/create-checkout-session';
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    items: items.map(({ title, quantity }) => ({ title, quantity })),
                }),
            });
            const data = await response.json();
            const redirectUrl = provider === 'paypal' ? data.approval_url : data.url;

            if (!response.ok || !redirectUrl) {
                throw new Error(data.message || 'No se pudo iniciar el pago. Inténtalo de nuevo más tarde.');
            }

            window.location.assign(redirectUrl);
        } catch (error) {
            console.error(`No se pudo iniciar el pago con ${provider}:`, error);
            setPaymentError(error.message || 'No se pudo conectar con el servicio de pago.');
            setProcessing('');
        }
    };

    return (
        <section className="cart-page" aria-labelledby="cart-title">
            <div className="cart-heading">
                <span className="cart-heading-icon"><CartIcon /></span>
                <div>
                    <h1 id="cart-title">Tu carrito</h1>
                    <p>Revisa tus productos antes de pagar.</p>
                </div>
            </div>

            {paymentMessage && <p className="cart-message" role="status">{paymentMessage}</p>}
            {paymentError && <p className="cart-error" role="alert">{paymentError}</p>}

            {items.length === 0 ? (
                <div className="cart-empty">
                    <p>Tu carrito está vacío.</p>
                    <Link to="/store" className="cart-continue">Explorar la tienda</Link>
                </div>
            ) : (
                <div className="cart-layout">
                    <div className="cart-items">
                        {items.map((item) => {
                            const product = findStoreProduct(item.title);
                            if (!product) {
                                return null;
                            }

                            return (
                                <article className="cart-item" key={item.title}>
                                    <div className="cart-item-details">
                                        <h2>{product.title}</h2>
                                        <p>{product.description}</p>
                                        <span>{formatPrice(product.price)} cada uno</span>
                                    </div>
                                    <div className="cart-item-controls">
                                        <label className="quantity-control">
                                            <span>Cantidad</span>
                                            <input
                                                aria-label={`Cantidad de ${product.title}`}
                                                type="number"
                                                min="1"
                                                max="99"
                                                value={item.quantity}
                                                onChange={(event) => updateQuantity(item.title, event.target.value)}
                                            />
                                        </label>
                                        <strong>{formatPrice(product.price * item.quantity)}</strong>
                                        <button
                                            type="button"
                                            className="remove-item"
                                            onClick={() => removeItem(item.title)}
                                            aria-label={`Quitar ${product.title} del carrito`}
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                        <Link to="/store" className="cart-continue">Seguir comprando</Link>
                    </div>

                    <aside className="cart-summary" aria-label="Resumen del pedido">
                        <h2>Resumen</h2>
                        <div className="cart-total">
                            <span>Total</span>
                            <strong>{formatPrice(total)}</strong>
                        </div>
                        <p>El precio final se confirma con el proveedor de pago.</p>
                        <button
                            type="button"
                            className="checkout-button checkout-card"
                            onClick={() => pay('card')}
                            disabled={Boolean(processing)}
                        >
                            <CardIcon />
                            {processing === 'card' ? 'Conectando…' : 'Pagar con tarjeta'}
                        </button>
                        <button
                            type="button"
                            className="checkout-button checkout-paypal"
                            onClick={() => pay('paypal')}
                            disabled={Boolean(processing)}
                        >
                            <CartIcon />
                            {processing === 'paypal' ? 'Conectando…' : 'Pagar con PayPal'}
                        </button>
                        {processing && (
                            <p className="checkout-processing" role="status">
                                Preparando tu pago seguro…
                            </p>
                        )}
                    </aside>
                </div>
            )}
        </section>
    );
};

export default Cart;
