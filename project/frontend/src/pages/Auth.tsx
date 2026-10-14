import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosClient } from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { applyAccentColor } from '../constants/theme';
import { AxiosError } from 'axios';
import { ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';

export default function Auth() {
    const { t } = useTranslation();
    const [isLogin, setIsLogin] = useState(true);
    usePageTitle(isLogin ? t.auth.signIn : t.auth.signUp);

    // Always enforce the default fiery orange brand theme on authentication screen
    useEffect(() => {
        applyAccentColor('fiery');
    }, []);

    // Form states
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
                // Return smoothly to login screen upon successful registration
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

    const isPasswordMatching = !isLogin && password && confirmPassword && password === confirmPassword;
    const isPasswordMismatching = !isLogin && password && confirmPassword && password !== confirmPassword;

    return (
        <div className="min-h-screen flex items-center justify-center bg-glass-rain p-4 sm:p-6 overflow-hidden relative">
            {/* Ambient Background Light Elements */}
            <div className="absolute top-1/6 left-1/4 w-[36rem] h-[36rem] bg-white/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/6 right-1/4 w-[36rem] h-[36rem] bg-fiery/15 rounded-full blur-[130px] pointer-events-none animate-pulse-slow" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[52rem] h-[32rem] bg-rain-300/15 rounded-full blur-[140px] pointer-events-none" />

            {/* Main Elevated Glass Container - compact 560px height to prevent vertical scrolling on laptop displays */}
            <div className="relative w-full max-w-4xl h-[560px] bg-rain-900/80 backdrop-blur-3xl border border-white/30 rounded-3xl overflow-hidden shadow-[0_30px_75px_rgba(0,0,0,0.45),inset_0_1px_2px_rgba(255,255,255,0.45)] flex z-10">
                {/* Laser-cut top rim highlight */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none z-30" />

                {/* Sliding Frosted Glass Form Panel */}
                <div
                    className={`absolute top-0 left-0 w-1/2 h-full bg-gradient-to-b from-rain-800/85 via-rain-850/90 to-rain-900/95 backdrop-blur-3xl border border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.45)] z-20 transition-transform duration-700 ease-in-out rounded-3xl ${
                        isLogin ? 'translate-x-full' : 'translate-x-0'
                    }`}
                >
                    {/* Inner highlight rim */}
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none" />

                    <div className="relative w-full h-full flex flex-col justify-center">
                        {/* Login Form Content */}
                        <div
                            className={`absolute inset-0 flex flex-col justify-center px-8 sm:px-10 transition-all duration-500 ease-in-out ${
                                isLogin
                                    ? 'opacity-100 blur-0 scale-100 z-10 pointer-events-auto'
                                    : 'opacity-0 blur-sm scale-[0.98] z-0 pointer-events-none'
                            }`}
                        >
                            <div className="text-center mb-2">
                                <div className="group/logo inline-flex p-2 rounded-2xl bg-white/75 hover:bg-white/90 backdrop-blur-md border border-white/70 hover:border-white shadow-[0_8px_20px_rgba(0,0,0,0.2),inset_0_1px_2px_rgba(255,255,255,0.8)] hover:shadow-glow-accent transition-all duration-300 mb-2 cursor-pointer">
                                    <img
                                        src="/logo.png"
                                        alt="ProjectHub Logo"
                                        className="w-9 h-9 object-contain drop-shadow-sm group-hover/logo:scale-110 transition-transform duration-300"
                                    />
                                </div>
                                <h2 className="text-2xl font-extrabold text-white tracking-tight drop-shadow-sm">
                                    {t.auth.welcomeBack}
                                </h2>
                                <p className="text-rain-200 text-xs mt-0.5">
                                    {t.auth.welcomeBackSubtitle}
                                </p>
                            </div>

                            {/* Fixed-height error placeholder to prevent shifting inputs */}
                            <div className="h-8 mb-1 flex items-center">
                                {error && isLogin ? (
                                    <div className="w-full flex items-center gap-2 bg-red-500/20 border border-red-400/50 text-red-100 px-3 py-1.5 rounded-xl text-xs shadow-glow-crimson/30 backdrop-blur-md animate-blur-in">
                                        <AlertCircle size={14} className="text-red-400 shrink-0" />
                                        <span className="truncate">{error}</span>
                                    </div>
                                ) : null}
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-2.5">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-rain-200 mb-1">
                                        {t.auth.email}
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        className="input-glass !py-2.5 text-sm"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder={t.auth.emailPlaceholder}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-rain-200 mb-1">
                                        {t.auth.password}
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        className="input-glass !py-2.5 text-sm"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder={t.auth.passwordPlaceholder}
                                    />
                                </div>

                                {/* Invisible placeholder identically matching Confirm Password in height & structure */}
                                <div className="invisible pointer-events-none select-none" aria-hidden="true">
                                    <div className="flex justify-between items-center mb-1 h-3.5">
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-rain-200">
                                            {t.auth.confirmPassword}
                                        </label>
                                    </div>
                                    <input
                                        type="password"
                                        tabIndex={-1}
                                        disabled
                                        className="input-glass !py-2.5 text-sm"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn-fiery w-full py-2.5 text-sm"
                                >
                                    <span>{isLoading ? t.auth.processing : t.auth.signInBtn}</span>
                                </button>
                            </form>
                        </div>

                        {/* Registration Form Content */}
                        <div
                            className={`absolute inset-0 flex flex-col justify-center px-8 sm:px-10 transition-all duration-500 ease-in-out ${
                                !isLogin
                                    ? 'opacity-100 blur-0 scale-100 z-10 pointer-events-auto'
                                    : 'opacity-0 blur-sm scale-[0.98] z-0 pointer-events-none'
                            }`}
                        >
                            <div className="text-center mb-2">
                                <div className="group/logo inline-flex p-2 rounded-2xl bg-white/75 hover:bg-white/90 backdrop-blur-md border border-white/70 hover:border-white shadow-[0_8px_20px_rgba(0,0,0,0.2),inset_0_1px_2px_rgba(255,255,255,0.8)] hover:shadow-glow-accent transition-all duration-300 mb-2 cursor-pointer">
                                    <img
                                        src="/logo.png"
                                        alt="ProjectHub Logo"
                                        className="w-9 h-9 object-contain drop-shadow-sm group-hover/logo:scale-110 transition-transform duration-300"
                                    />
                                </div>
                                <h2 className="text-2xl font-extrabold text-white tracking-tight drop-shadow-sm">
                                    {t.auth.createAccount}
                                </h2>
                                <p className="text-rain-200 text-xs mt-0.5">
                                    {t.auth.createAccountSubtitle}
                                </p>
                            </div>

                            {/* Fixed-height error placeholder to prevent shifting inputs */}
                            <div className="h-8 mb-1 flex items-center">
                                {error && !isLogin ? (
                                    <div className="w-full flex items-center gap-2 bg-red-500/20 border border-red-400/50 text-red-100 px-3 py-1.5 rounded-xl text-xs shadow-glow-crimson/30 backdrop-blur-md animate-blur-in">
                                        <AlertCircle size={14} className="text-red-400 shrink-0" />
                                        <span className="truncate">{error}</span>
                                    </div>
                                ) : null}
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-2.5">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-rain-200 mb-1">
                                        {t.auth.email}
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        className="input-glass !py-2.5 text-sm"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder={t.auth.emailPlaceholder}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-rain-200 mb-1">
                                        {t.auth.password}
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        className="input-glass !py-2.5 text-sm"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder={t.auth.passwordPlaceholder}
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1 h-3.5">
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-rain-200">
                                            {t.auth.confirmPassword}
                                        </label>
                                        <div className="h-3.5 flex items-center">
                                            {isPasswordMatching ? (
                                                <span className="text-[11px] font-bold text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.7)] animate-blur-in">
                                                    {t.settings.security.passwordsMatch}
                                                </span>
                                            ) : isPasswordMismatching ? (
                                                <span className="text-[11px] font-bold text-rose-300 drop-shadow-[0_0_8px_rgba(244,63,94,0.7)] animate-blur-in">
                                                    {t.auth.passwordsMismatch}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        className={`input-glass !py-2.5 text-sm ${
                                            isPasswordMatching
                                                ? 'border-emerald-400 ring-2 ring-emerald-400/50 shadow-[0_0_24px_rgba(52,211,153,0.55),inset_0_1px_1px_rgba(255,255,255,0.3)]'
                                                : isPasswordMismatching
                                                ? 'border-rose-500 ring-2 ring-rose-500/50 shadow-[0_0_24px_rgba(244,63,94,0.55),inset_0_1px_1px_rgba(255,255,255,0.3)]'
                                                : ''
                                        }`}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder={t.auth.confirmPasswordPlaceholder}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn-fiery w-full py-2.5 text-sm"
                                >
                                    <span>{isLoading ? t.auth.processing : t.auth.signUpBtn}</span>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Hero Showcase (Left Side - visible when Login is active) */}
                <div
                    className={`w-1/2 h-full flex flex-col items-center justify-center p-8 sm:p-10 text-center z-10 transition-all duration-500 ease-in-out ${
                        isLogin
                            ? 'opacity-100 blur-0 scale-100 pointer-events-auto'
                            : 'opacity-0 blur-sm scale-[0.98] pointer-events-none'
                    }`}
                >
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md mb-2.5 max-w-xs">
                        {t.auth.heroLoginTitle}
                    </h2>
                    <p className="text-rain-200 text-xs sm:text-sm leading-relaxed mb-6 max-w-xs">
                        {t.auth.heroLoginSubtitle}
                    </p>

                    <div className="space-y-2.5">
                        <p className="text-rain-300 text-[11px] font-semibold uppercase tracking-wider">
                            {t.auth.noAccountYet}
                        </p>
                        <button
                            onClick={toggleMode}
                            className="glass-btn-ghost group flex items-center gap-2 hover:border-fiery hover:text-fiery hover:shadow-glow-accent px-5 py-2.5 text-xs sm:text-sm"
                        >
                            <span>{t.auth.switchToSignUp}</span>
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Hero Showcase (Right Side - visible when Register is active) */}
                <div
                    className={`w-1/2 h-full flex flex-col items-center justify-center p-8 sm:p-10 text-center z-10 transition-all duration-500 ease-in-out ${
                        !isLogin
                            ? 'opacity-100 blur-0 scale-100 pointer-events-auto'
                            : 'opacity-0 blur-sm scale-[0.98] pointer-events-none'
                    }`}
                >
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md mb-2.5 max-w-xs">
                        {t.auth.heroRegisterTitle}
                    </h2>
                    <p className="text-rain-200 text-xs sm:text-sm leading-relaxed mb-6 max-w-xs">
                        {t.auth.heroRegisterSubtitle}
                    </p>

                    <div className="space-y-2.5">
                        <p className="text-rain-300 text-[11px] font-semibold uppercase tracking-wider">
                            {t.auth.alreadyHaveAccount}
                        </p>
                        <button
                            onClick={toggleMode}
                            className="glass-btn-ghost group flex items-center gap-2 hover:border-fiery hover:text-fiery hover:shadow-glow-accent px-5 py-2.5 text-xs sm:text-sm"
                        >
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                            <span>{t.auth.switchToSignIn}</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
