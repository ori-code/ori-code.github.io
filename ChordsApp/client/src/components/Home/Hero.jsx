import React from 'react';
import { useTranslation } from 'react-i18next';

const Hero = () => {
    const { t } = useTranslation();

    return (
        <section className="hero" style={{ marginBottom: '80px' }}>
            <h1 style={{ fontSize: '4rem', lineHeight: '0.9', marginBottom: '24px', whiteSpace: 'pre-line' }}>
                {t('hero.title')}
            </h1>
            <p style={{ fontSize: '1.2rem', maxWidth: '600px', marginBottom: '40px', whiteSpace: 'pre-line' }}>
                {t('hero.subtitle')}
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
                <button style={{ padding: '16px 32px', fontSize: '1rem' }}>{t('hero.cta')}</button>
                <button className="ghost-button">{t('hero.how')}</button>
            </div>
        </section>
    );
};

export default Hero;
