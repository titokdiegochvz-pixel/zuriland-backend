import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';

import Header from './components/Header';
import ServerHeader from './components/ServerHeader';
import Home from './components/Home';
import { AuthProvider } from './auth/AuthContext';
import { CartProvider, useCart } from './store/CartContext';
import { MinecraftStatusProvider } from './context/MinecraftStatusContext';
import { API_URL } from './config/api';
import { reportClientIssue } from './services/issueReporting';

import './App.css';

const Store = lazy(() => import('./components/Store'));
const Community = lazy(() => import('./components/Community'));
const Ranking = lazy(() => import('./components/Ranking'));
const Login = lazy(() => import('./components/Login'));
const Register = lazy(() => import('./components/Register'));
const ForgotPassword = lazy(() => import('./components/ForgotPassword'));
const ResetPassword = lazy(() => import('./components/ResetPassword'));
const Cart = lazy(() => import('./components/Cart'));

function PagoExitoso() {
    const { clearCart } = useCart();
    const [status, setStatus] = React.useState('checking');
    const [attempt, setAttempt] = React.useState(0);
    const sessionId = new URLSearchParams(window.location.search).get('session_id');

    React.useEffect(() => {
        if (!sessionId) {
            setStatus('unverified');
            return undefined;
        }

        const controller = new AbortController();
        let isMounted = true;

        const verifyPayment = async () => {
            setStatus('checking');

            try {
                const response = await fetch(
                    `${API_URL}/api/checkout-session/${encodeURIComponent(sessionId)}`,
                    {
                        signal: controller.signal,
                        headers: { Accept: 'application/json' },
                    },
                );
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(`Payment verification failed with HTTP ${response.status}.`);
                }

                if (isMounted && data.paid === true) {
                    clearCart();
                    setStatus('paid');
                } else if (isMounted) {
                    setStatus('pending');
                }
            } catch (error) {
                if (isMounted && error.name !== 'AbortError') {
                    const statusCode = Number(error.message.match(/HTTP (\d+)/)?.[1]);
                    reportClientIssue(
                        'payment',
                        Number.isInteger(statusCode) ? statusCode : undefined,
                    );
                    setStatus('error');
                }
            }
        };

        verifyPayment();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [attempt, clearCart, sessionId]);

    return (
        <section className="content-section" aria-labelledby="payment-result-title" aria-live="polite">
            <h1 id="payment-result-title">
                {status === 'paid'
                    ? 'Pago confirmado'
                    : status === 'checking'
                        ? 'Verificando tu pago'
                        : status === 'pending'
                            ? 'Pago aún no confirmado'
                            : 'No pudimos verificar el pago'}
            </h1>
            <p>
                {status === 'paid'
                    ? 'El proveedor confirmó tu pago.'
                    : status === 'checking'
                        ? 'Estamos consultando el estado con Stripe. No vuelvas a pagar mientras verificamos.'
                        : status === 'pending'
                            ? 'Stripe todavía no confirma el pago. Espera un momento y vuelve a consultar antes de intentar pagar otra vez.'
                            : 'No recibimos una confirmación segura de Stripe. Revisa el estado del pago o vuelve a intentarlo.'}
            </p>
            {status === 'pending' && (
                <button type="button" className="btn-buy" onClick={() => setAttempt((value) => value + 1)}>
                    Volver a verificar
                </button>
            )}
            {(status === 'error' || status === 'unverified') && (
                <Link to="/cart">Volver al carrito</Link>
            )}
        </section>
    );
}

function PagoCancelado() {
    return (
        <section className="content-section">
            <h1>Pago cancelado</h1>
            <p>La compra fue cancelada.</p>
            <Link to="/cart">Volver a tu carrito</Link>
        </section>
    );
}

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <Router>
                    <MinecraftStatusProvider>
                        <div>
                            <a className="skip-link" href="#main-content">Saltar al contenido</a>
                            <ServerHeader />
                            <Header />

                            <main id="main-content" tabIndex="-1">
                                <Suspense fallback={<p className="route-loading" role="status">Cargando sección…</p>}>
                                    <Routes>
                                        <Route path="/" element={<Home />} />
                                        <Route path="/home" element={<Home />} />
                                        <Route path="/store" element={<Store />} />
                                        <Route path="/store/zuriland" element={<Store />} />
                                        <Route path="/cart" element={<Cart />} />
                                        <Route path="/community" element={<Community />} />
                                        <Route path="/ranking" element={<Ranking />} />
                                        <Route path="/rules" element={
                                            <section className="content-section" aria-labelledby="rules-title">
                                                <h1 id="rules-title">Reglas del servidor</h1>
                                                <ol>
                                                    <li>Mantén actividad en el servidor.</li>
                                                    <li>No acampes en el spawn.</li>
                                                    <li>Únete o funda una nación en el servidor.</li>
                                                </ol>
                                            </section>
                                        } />
                                        <Route path="/login" element={<Login />} />
                                        <Route path="/forgot-password" element={<ForgotPassword />} />
                                        <Route path="/reset-password" element={<ResetPassword />} />
                                        <Route path="/register" element={<Register />} />
                                        <Route path="/pago-exitoso" element={<PagoExitoso />} />
                                        <Route path="/pago-cancelado" element={<PagoCancelado />} />
                                        <Route path="*" element={<Navigate to="/" />} />
                                    </Routes>
                                </Suspense>
                            </main>
                        </div>
                    </MinecraftStatusProvider>
                </Router>
            </CartProvider>
        </AuthProvider>
    );
}

export default App;