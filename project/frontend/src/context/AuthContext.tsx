import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { userService } from '../api/userService';
import { type UserProfileResponse } from '../types/api';
import { applyAccentColor } from '../constants/theme';
import { useLanguage } from './LanguageContext';
import { type SupportedLanguage } from '../i18n/types';

export interface UserPayload {
    id: string;
    email: string;
    role: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: UserPayload | null;
    profile: UserProfileResponse | null;
    isAdmin: boolean;
    login: (token: string) => void;
    logout: () => void;
    refreshProfile: () => Promise<void>;
    setProfile: React.Dispatch<React.SetStateAction<UserProfileResponse | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [user, setUser] = useState<UserPayload | null>(null);
    const [profile, setProfile] = useState<UserProfileResponse | null>(null);
    const { setLanguage } = useLanguage();

    // Default to the fiery brand accent for initial non-authenticated states
    useEffect(() => {
        if (!token) {
            applyAccentColor('fiery');
        }
    }, [token]);

    // Refresh profile from backend
    const refreshProfile = async () => {
        try {
            const data = await userService.getProfile();
            setProfile(data);
            // Apply user custom accent color after authenticated profile fetch
            if (data.accentColor) {
                applyAccentColor(data.accentColor);
            }
            if (data.language === 'en' || data.language === 'pl') {
                setLanguage(data.language as SupportedLanguage);
            }
        } catch (err) {
            console.error('Failed to retrieve user profile:', err);
        }
    };

    // Decode and synchronize user payload whenever authentication token changes
    useEffect(() => {
        if (token) {
            try {
                const decoded: any = jwtDecode(token);

                // Map standard and ASP.NET Core specific JWT claims
                const id = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || decoded.sub || decoded.id;
                const email = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || decoded.email;
                const role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded.role;

                setUser({ id, email, role });
                refreshProfile();
            } catch {
                console.error('Invalid token format.');
                logout();
            }
        } else {
            setUser(null);
            setProfile(null);
            applyAccentColor('fiery');
        }
    }, [token]);

    const login = (newToken: string) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setProfile(null);
        applyAccentColor('fiery');
    };

    // Evaluate administrative privileges globally
    const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

    return (
        <AuthContext.Provider value={{ isAuthenticated: !!token, user, profile, isAdmin, login, logout, refreshProfile, setProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
