import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_URL } from '../config/api';

const MinecraftStatusContext = createContext({
    status: 'loading',
    players: 0,
    playerNames: [],
    playerNamesAvailable: false,
});

export const MinecraftStatusProvider = ({ children }) => {
    const [serverStatus, setServerStatus] = useState({
        status: 'loading',
        players: 0,
        playerNames: [],
        playerNamesAvailable: false,
    });

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const loadServerStatus = async () => {
            try {
                const response = await fetch(`${API_URL}/api/minecraft/status`, {
                    signal: controller.signal,
                    headers: { Accept: 'application/json' },
                });
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
                if (
                    typeof data.online !== 'boolean'
                    || !Number.isInteger(data.players?.online)
                    || data.players.online < 0
                ) {
                    throw new Error('Invalid Minecraft status response');
                }

                if (isMounted) {
                    setServerStatus({
                        status: data.online ? 'online' : 'offline',
                        players: data.online ? data.players.online : 0,
                        playerNames: data.online && Array.isArray(data.players.list)
                            ? data.players.list
                            : [],
                        playerNamesAvailable: data.online && data.players.list_available === true,
                    });
                }
            } catch (error) {
                if (isMounted && error.name !== 'AbortError') {
                    setServerStatus({
                        status: 'unavailable',
                        players: 0,
                        playerNames: [],
                        playerNamesAvailable: false,
                    });
                }
            }
        };

        loadServerStatus();
        const interval = window.setInterval(loadServerStatus, 30_000);

        return () => {
            isMounted = false;
            controller.abort();
            window.clearInterval(interval);
        };
    }, []);

    return (
        <MinecraftStatusContext.Provider value={serverStatus}>
            {children}
        </MinecraftStatusContext.Provider>
    );
};

export const useMinecraftStatus = () => useContext(MinecraftStatusContext);
