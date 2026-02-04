import React from 'react';
import { useTranslation } from 'react-i18next';

const Workflow = () => {
    const { t } = useTranslation();

    return (
        <section className="workflow" style={{ marginTop: '80px', borderTop: '2px solid var(--border-main)', paddingTop: '60px' }}>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px' }}>
                <article>
                    <div style={{ fontSize: '4rem', fontWeight: 900, lineHeight: 1, marginBottom: '16px' }}>1.</div>
                    <h3 style={{ margin: 0, marginBottom: '16px', border: 'none' }}>{t('workflow.step1.title')}</h3>
                    <p>{t('workflow.step1.desc')}</p>
                </article>
                <article>
                    <div style={{ fontSize: '4rem', fontWeight: 900, lineHeight: 1, marginBottom: '16px' }}>2.</div>
                    <h3 style={{ margin: 0, marginBottom: '16px', border: 'none' }}>{t('workflow.step2.title')}</h3>
                    <p>{t('workflow.step2.desc')}</p>
                </article>
                <article>
                    <div style={{ fontSize: '4rem', fontWeight: 900, lineHeight: 1, marginBottom: '16px' }}>3.</div>
                    <h3 style={{ margin: 0, marginBottom: '16px', border: 'none' }}>{t('workflow.step3.title')}</h3>
                    <p>{t('workflow.step3.desc')}</p>
                </article>
            </div>
        </section>
    );
};

export default Workflow;
