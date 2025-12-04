import React, { useState } from 'react';
import { sdk } from '../spotify/api';
import { useTranslation } from 'react-i18next';

export function Logout() {
  const [ready, setReady] = useState(true);
  const { t } = useTranslation();

  const handleLogout = () => {
    try {
      sdk.logOut();
    } catch (e) {
      console.warn('logout failed', e);
    }
    if (setReady) setReady(false);
  };

  return (
    <div className="position-absolute m-2 p-0">
      {ready && (
        <button className="btn btn-outline-primary" onClick={handleLogout}>
          {t('logout')}
        </button>
      )}
    </div>
  );
}
