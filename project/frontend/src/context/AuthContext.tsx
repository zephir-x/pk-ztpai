import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

export interface UserPayload {
    id: string;
    email: string;
    role: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: UserPayload | null;
    isAdmin: boolean;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [user, setUser] = useState<UserPayload | null>(null);

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
            } catch {
                console.error("Invalid token format.");
                // Invalidate session on malformed token
                logout(); 
            }
        } else {
            setUser(null);
        }
    }, [token]);

    const login = (newToken: string) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
    };

    // Evaluate administrative privileges globally
    const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

    return (
        <AuthContext.Provider value={{ isAuthenticated: !!token, user, isAdmin, login, logout }}>
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
