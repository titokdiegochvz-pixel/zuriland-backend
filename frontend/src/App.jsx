import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Header from './components/Header';
import ServerHeader from './components/ServerHeader';
import Home from './components/Home';
import Store from './components/Store';
import Community from './components/Community';
import Ranking from './components/Ranking';
import Login from './components/Login';
import Register from './components/Register';
import { AuthProvider } from './auth/AuthContext';
import Cart from './components/Cart';
import { CartProvider, useCart } from './store/CartContext';
import { MinecraftStatusProvider } from './context/MinecraftStatusContext';

import './App.css';

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
                                    <Route path="/register" element={<Register />} />
                                    <Route path="/pago-exitoso" element={<PagoExitoso />} />
                                    <Route path="/pago-cancelado" element={<PagoCancelado />} />
                                    <Route path="*" element={<Navigate to="/" />} />
                                </Routes>
                            </main>
                        </div>
                    </MinecraftStatusProvider>
                </Router>
            </CartProvider>
        </AuthProvider>
    );
}

export default App;