import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Header from './components/Header';
import ServerHeader from './components/ServerHeader';
import Home from './components/Home';
import { AuthProvider } from './auth/AuthContext';
import { CartProvider, useCart } from './store/CartContext';
import { MinecraftStatusProvider } from './context/MinecraftStatusContext';

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
    React.useEffect(() => clearCart(), [clearCart]);

    return (
        <section className="content-section">
            <h2>Pago exitoso</h2>
            <p>Tu compra se realizó correctamente.</p>
        </section>
    );
}

function PagoCancelado() {
    return (
        <section className="content-section">
            <h2>Pago cancelado</h2>
            <p>La compra fue cancelada.</p>
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
                            <ServerHeader />
                            <Header />

                            <main>
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
                                            <section className="content-section">
                                                <h2>Reglas del servidor</h2>
                                                <p>1 Ser constantes en el server porfa.
                                                   2 No campear spawn
                                                   3 tengan su nacion en el server
                                                </p>
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