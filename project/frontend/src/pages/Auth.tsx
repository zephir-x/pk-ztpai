import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosClient } from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { AxiosError } from 'axios';

export default function Auth() {
    // State determining which form is active (default: Login)
    const [isLogin, setIsLogin] = useState(true);
    usePageTitle(isLogin ? 'Sign In' : 'Sign Up');

    // Form
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError(null);
        setEmail('');
        setPassword('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (isLogin) {
                const response = await axiosClient.post('/auth/login', { email, password });
                login(response.data.token);
                navigate('/dashboard');
            } else {
                await axiosClient.post('/auth/register', { email, password });
                // After successful registration, proceed seamlessly back to the login screen
                setIsLogin(true);
                setEmail('');
                setPassword('');
            }
        } catch (err) {
            if (err instanceof AxiosError && err.response?.data) {
                const data = err.response.data;
                if (data.errors) {
                    setError(Object.values(data.errors).flat().join(' '));
                } else if (data.message) {
                    setError(data.message);
                }
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-spotlight p-4 overflow-hidden relative">
            {/* Main Animation Container */}
            <div className="relative w-full max-w-5xl h-[650px] bg-matte border border-gray-700 rounded-3xl overflow-hidden shadow-2xl flex">
                {/* Glass Form Panel (Moves left-right) */}
                <div
                    className={`absolute top-0 left-0 w-1/2 h-full glass-auth-panel z-20 transition-transform duration-700 ease-in-out flex flex-col justify-center px-12 ${
                        isLogin ? 'translate-x-full rounded-l-3xl' : 'translate-x-0 rounded-r-3xl'
                    }`}
                >
                    <div className="text-center mb-8">
                        <img src="/logo.png" alt="ProjectHub Logo" className="w-16 h-auto mx-auto mb-6 drop-shadow-sm" />
                        <h2 className="text-3xl font-bold text-matte-dark">
                            {isLogin ? 'Welcome back' : 'Create Account'}
                        </h2>
                        <p className="text-gray-500 mt-2">
                            {isLogin ? 'Sign in to access your workspaces' : 'Set up your profile in seconds'}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50/50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-matte-dark mb-1">Email Address</label>
                            <input
                                type="email"
                                required
                                className="input-glass"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-semibold text-matte-dark">Password</label>
                            </div>
                            <input
                                type="password"
                                required
                                className="input-glass"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={isLogin ? "••••••••" : "Min. 8 chars (A-Z, a-z, 0-9)"}
                            />
                        </div>

                        <button type="submit" disabled={isLoading} className="btn-fiery w-full mt-4 py-3 text-base">
                            {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
                        </button>
                    </form>
                </div>
                
                {/* Background Text for Login (Left Side) */}
                <div className={`w-1/2 h-full flex flex-col items-center justify-center p-12 text-center z-10 transition-opacity duration-700 ${isLogin ? 'opacity-100' : 'opacity-0'}`}>
                    <h2 className="text-4xl font-extrabold text-white tracking-wide mb-4">Passionately Curious.</h2>
                    <p className="text-gray-400 text-lg mb-8">
                        Manage your projects with extreme precision. Experience the clarity of thought and execution.
                    </p>
                    <p className="text-gray-500 text-sm">Don't have an account yet?</p>
                    <button
                        onClick={toggleMode}
                        className="mt-4 px-8 py-2 rounded-full border border-gray-500 text-white hover:border-fiery hover:text-fiery transition-colors duration-300"
                    >
                        Switch to Sign Up
                    </button>
                </div>
                
                {/* Background Text for Registration (Right Side) */}
                <div className={`w-1/2 h-full flex flex-col items-center justify-center p-12 text-center z-10 transition-opacity duration-700 ${!isLogin ? 'opacity-100' : 'opacity-0'}`}>
                    <h2 className="text-4xl font-extrabold text-white tracking-wide mb-4">Built for Teams.</h2>
                    <p className="text-gray-400 text-lg mb-8">
                        Join ProjectHub and bring order to chaos. Your workspaces await.
                    </p>
                    <p className="text-gray-500 text-sm">Already part of the team?</p>
                    <button
                        onClick={toggleMode}
                        className="mt-4 px-8 py-2 rounded-full border border-gray-500 text-white hover:border-fiery hover:text-fiery transition-colors duration-300"
                    >
                        Switch to Sign In
                    </button>
                </div>

            </div>
        </div>
    );
}
