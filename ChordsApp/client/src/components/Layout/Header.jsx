import React from 'react';
import useTheme from '../../hooks/useTheme';
import { useTranslation } from 'react-i18next';

const Header = () => {
    const { theme, toggleTheme } = useTheme();
    const { t, i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'he' : 'en';
        i18n.changeLanguage(newLang);
    };

    return (
        <header className="app-header" style={{
            borderBottom: '2px solid var(--border-main)',
            padding: '20px 0',
            marginBottom: '40px'
        }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <a href="/" style={{
                    textDecoration: 'none',
                    fontWeight: 900,
                    fontSize: '1.5rem',
                    letterSpacing: '-0.05em',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <div style={{
                        width: '24px',
                        height: '24px',
                        background: 'var(--text-primary)',
                        borderRadius: '0'
                    }}></div>
                    aChordim
                </a>

                <div className="header-actions" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <button className="ghost-button" onClick={toggleLanguage} style={{ fontWeight: 600 }}>
                        {i18n.language === 'en' ? 'HE' : 'EN'}
                    </button>
                    <button className="ghost-button" id="signInButton" type="button">{t('nav.signin')}</button>
                    <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle Theme">
                        <div style={{
                            width: '12px',
                            height: '12px',
                            background: theme === 'dark' ? 'white' : 'black',
                            borderRadius: '50%'
                        }}></div>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
