import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type SupportedLanguage, type Translations } from '../i18n/types';
import { en } from '../i18n/translations/en';
import { pl } from '../i18n/translations/pl';

const TRANSLATION_MAP: Record<SupportedLanguage, Translations> = {
    en,
    pl
};

interface LanguageContextType {
    language: SupportedLanguage;
    setLanguage: (lang: SupportedLanguage) => void;
    t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguageState] = useState<SupportedLanguage>(() => {
        const saved = localStorage.getItem('app_language');
        return saved === 'pl' || saved === 'en' ? saved : 'en';
    });

    const setLanguage = (lang: SupportedLanguage) => {
        setLanguageState(lang);
        localStorage.setItem('app_language', lang);
    };

    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    const value: LanguageContextType = {
        language,
        setLanguage,
        t: TRANSLATION_MAP[language] || en
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export const useTranslation = () => {
    const { language, setLanguage, t } = useLanguage();
    return { language, setLanguage, t };
};
