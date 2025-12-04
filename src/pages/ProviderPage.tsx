import React from 'react';
import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader';

export default function ProviderPage() {
  const providers = Object.entries(['spotify']).map(([name]) => name);
  const { t } = useTranslation();

  return (
    <section aria-labelledby="provider-head">
      <PageHeader title={t('chooseProvider')} subtitle={t('chooseProviderSub')} />
      <div className="d-flex gap-2 mt-3">
        {providers.map((name) => (
          <Link key={name} to={`/${name}`} style={{ textDecoration: 'none' }}>
            <Button variant="outline-secondary" style={{ padding: 0 }}>
              {name.charAt(0).toUpperCase() + name.slice(1)}
            </Button>
          </Link>
        ))}
      </div>
    </section>
  );
}
