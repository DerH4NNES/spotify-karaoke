import React from 'react';
import { useNavigate } from 'react-router-dom';
import { sdk } from '../spotify/api';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader';

export default function LoginPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogin = () => {
    sdk.authenticate().then((data) => {
      if (data.authenticated) {
        navigate('/spotify/playlists');
      }
    });
  };

  return (
    <section>
      <PageHeader title={t('loginForProvider', { provider: 'Spotify' })} />
      <button className="btn btn-primary" onClick={handleLogin}>
        {t('login')}
      </button>
    </section>
  );
}
