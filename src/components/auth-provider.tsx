"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface AuthUser {
    userId: string;
    email: string;
    name: string;
    picture: string;
    language: 'en' | 'es' | 'ca';
}

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    logout: () => Promise<void>;
    updateLanguage: (locale: 'en' | 'es' | 'ca') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => {
                if (res.ok) return res.json();
                return null;
            })
            .then(data => {
                setUser(data);
            })
            .catch(() => {
                setUser(null);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    const logout = useCallback(async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        window.location.href = '/login';
    }, []);

    const updateLanguage = useCallback(async (language: 'en' | 'es' | 'ca') => {
        if (!user) return;
        setUser(prev => prev ? { ...prev, language } : null);
        try {
            await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language }),
            });
        } catch (error) {
            console.error('Failed to update language', error);
        }
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, isLoading, logout, updateLanguage }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
