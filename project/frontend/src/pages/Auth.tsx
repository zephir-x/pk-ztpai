import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosClient } from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { applyAccentColor } from '../constants/theme';
import { AxiosError } from 'axios';

export default function Auth() {
    const { t } = useTranslation();
    const [isLogin, setIsLogin] = useState(true);
    usePageTitle(isLogin ? t.auth.signIn : t.auth.signUp);

    // Always enforce the default fiery orange brand theme on authentication screen
    useEffect(() => {
        applyAccentColor('fiery');
    }, []);

    // Form
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError(null);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!isLogin && password !== confirmPassword) {
            setError(t.auth.passwordsMismatch);
            return;
        }

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
                setConfirmPassword('');
            }
        } catch (err) {
            if (err instanceof AxiosError && err.response?.data) {
                const data = err.response.data;
                if (data.errors) {
                    const errorList = Object.values(data.errors).flat() as string[];
                    setError(errorList[0] || t.auth.unexpectedError);
                } else if (data.message) {
                    setError(data.message);
                } else if (data.detail) {
                    setError(data.detail);
                }
            } else {
                setError(t.auth.unexpectedError);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-spotlight p-4 overflow-hidden relative">
            {/* Main Animation Container */}
            <div className="relative w-full max-w-5xl h-[650px] bg-matte border border-gray-700 rounded-3xl overflow-hidden shadow-2xl flex">
                
                {/* Glass Form Panel (Moves left-right, permanently rounded on all corners) */}
                <div
                    className={`absolute top-0 left-0 w-1/2 h-full glass-auth-panel z-20 transition-transform duration-700 ease-in-out rounded-3xl ${
                        isLogin ? 'translate-x-full' : 'translate-x-0'
                    }`}
                >
                    <div className="relative w-full h-full">
                        {/* Login Content (Fades in when isLogin is true) */}
                        <div className={`absolute inset-0 flex flex-col justify-center px-12 transition-opacity duration-700 ease-in-out ${isLogin ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                            <div className="text-center mb-8">
                                <img src="/logo.png" alt="ProjectHub Logo" className="w-20 h-auto mx-auto mb-6 drop-shadow-sm" />
                                <h2 className="text-3xl font-bold text-matte-dark">
                                    {t.auth.welcomeBack}
                                </h2>
                                <p className="text-gray-500 mt-2">
                                    {t.auth.welcomeBackSubtitle}
                                </p>
                            </div>

                            {error && isLogin && (
                                <div className="bg-red-50/50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-matte-dark mb-1">{t.auth.email}</label>
                                    <input
                                        type="email"
                                        required
                                        className="input-glass"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder={t.auth.emailPlaceholder}
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-semibold text-matte-dark">{t.auth.password}</label>
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        className="input-glass"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder={t.auth.passwordPlaceholder}
                                    />
                                </div>

                                <button type="submit" disabled={isLoading} className="btn-fiery w-full mt-4 py-3 text-base">
                                    {isLoading ? t.auth.processing : t.auth.signInBtn}
                                </button>
                            </form>
                        </div>

                        {/* Register Content (Fades in when isLogin is false) */}
                        <div className={`absolute inset-0 flex flex-col justify-center px-12 transition-opacity duration-700 ease-in-out ${!isLogin ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                            <div className="text-center mb-8">
                                <img src="/logo.png" alt="ProjectHub Logo" className="w-20 h-auto mx-auto mb-6 drop-shadow-sm" />
                                <h2 className="text-3xl font-bold text-matte-dark">
                                    {t.auth.createAccount}
                                </h2>
                                <p className="text-gray-500 mt-2">
                                    {t.auth.createAccountSubtitle}
                                </p>
                            </div>

                            {error && !isLogin && (
                                <div className="bg-red-50/50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-matte-dark mb-1">{t.auth.email}</label>
                                    <input
                                        type="email"
                                        required
                                        className="input-glass"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder={t.auth.emailPlaceholder}
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-semibold text-matte-dark">{t.auth.password}</label>
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        className="input-glass"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder={t.auth.passwordPlaceholder}
                                    />
                                </div>
                                
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-semibold text-matte-dark">{t.auth.confirmPassword}</label>
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        className={"input-glass transition-colors duration-300 " + (
                                            password && confirmPassword && password === confirmPassword 
                                                ? 'border-green-500 ring-1 ring-green-500' 
                                                : (password && password !== confirmPassword ? 'border-red-500 ring-1 ring-red-500' : '')
                                        )}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder={t.auth.confirmPasswordPlaceholder}
                                    />
                                </div>

                                <button type="submit" disabled={isLoading} className="btn-fiery w-full mt-4 py-3 text-base">
                                    {isLoading ? t.auth.processing : t.auth.signUpBtn}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
                
                {/* Background Text for Login (Left Side) */}
                <div className={`w-1/2 h-full flex flex-col items-center justify-center p-12 text-center z-10 transition-opacity duration-700 ${isLogin ? 'opacity-100' : 'opacity-0'}`}>
                    <h2 className="text-4xl font-extrabold text-white tracking-wide mb-4">{t.auth.heroLoginTitle}</h2>
                    <p className="text-gray-400 text-lg mb-8">
                        {t.auth.heroLoginSubtitle}
                    </p>
                    <p className="text-gray-500 text-sm">{t.auth.noAccountYet}</p>
                    <button
                        onClick={toggleMode}
                        className="mt-4 px-8 py-2 rounded-full border border-gray-500 text-white hover:border-fiery hover:text-fiery transition-colors duration-300"
                    >
                        {t.auth.switchToSignUp}
                    </button>
                </div>
                
                {/* Background Text for Registration (Right Side) */}
                <div className={`w-1/2 h-full flex flex-col items-center justify-center p-12 text-center z-10 transition-opacity duration-700 ${!isLogin ? 'opacity-100' : 'opacity-0'}`}>
                    <h2 className="text-4xl font-extrabold text-white tracking-wide mb-4">{t.auth.heroRegisterTitle}</h2>
                    <p className="text-gray-400 text-lg mb-8">
                        {t.auth.heroRegisterSubtitle}
                    </p>
                    <p className="text-gray-500 text-sm">{t.auth.alreadyHaveAccount}</p>
                    <button
                        onClick={toggleMode}
                        className="mt-4 px-8 py-2 rounded-full border border-gray-500 text-white hover:border-fiery hover:text-fiery transition-colors duration-300"
                    >
                        {t.auth.switchToSignIn}
                    </button>
                </div>

            </div>
        </div>
    );
}
