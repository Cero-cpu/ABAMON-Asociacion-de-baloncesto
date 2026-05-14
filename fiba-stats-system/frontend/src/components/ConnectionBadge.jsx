import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Wifi, WifiOff } from 'lucide-react';

export default function ConnectionBadge() {
    const [status, setStatus] = useState('checking'); // 'checking', 'online', 'offline'

    useEffect(() => {
        const checkConnection = async () => {
            const apiUrl = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8000/api' : '/api');
            try {
                // Ping simple al root del API
                await axios.get(apiUrl.replace('/api', '/'), { timeout: 5000 });
                setStatus('online');
            } catch (err) {
                setStatus('offline');
            }
        };

        checkConnection();
        const interval = setInterval(checkConnection, 30000); // Re-check cada 30s

        return () => clearInterval(interval);
    }, []);

    if (status === 'checking') {
        return (
            <div className="flex items-center gap-2 opacity-50">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                <span className="text-[10px] uppercase font-black tracking-widest">SISTEMA: VERIFICANDO...</span>
            </div>
        );
    }

    if (status === 'offline') {
        return (
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]" />
                <span className="text-[10px] uppercase font-black tracking-widest text-red-500">SISTEMA: DESCONECTADO</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
            <span className="text-[10px] uppercase font-black tracking-widest text-green-500">SISTEMA: EN LÍNEA</span>
        </div>
    );
}
