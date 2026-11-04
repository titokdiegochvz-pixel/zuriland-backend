import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);
const STORAGE_KEY = 'zuriland_usuario';

const safeUserData = (user) => ({
    id: user.id,
    nombre: user.nombre,
    email: user.email,
});

const readStoredUser = () => {
    const storedUser = sessionStorage.getItem(STORAGE_KEY);
    if (!storedUser) {
        return null;
    }

    let user;
    try {
        user = JSON.parse(storedUser);
    } catch {
        sessionStorage.removeItem(STORAGE_KEY);
        return null;
    }

    if (!user || typeof user !== 'object' || Array.isArray(user)) {
        sessionStorage.removeItem(STORAGE_KEY);
        return null;
    }

    const safeUser = safeUserData(user);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
    return safeUser;
};

export function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(readStoredUser);

    const iniciarSesion = (user) => {
        const safeUser = safeUserData(user);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
        setUsuario(safeUser);
    };

    const cerrarSesion = () => {
        sessionStorage.removeItem(STORAGE_KEY);
        setUsuario(null);
    };

    return (
        <AuthContext.Provider value={{ usuario, iniciarSesion, cerrarSesion }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider.');
    }
    return context;
}
