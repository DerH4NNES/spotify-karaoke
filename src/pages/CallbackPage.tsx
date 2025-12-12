import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { sdk } from '../spotify/api';
import PageHeader from '../components/PageHeader';

export default function CallbackPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

    // Check for OAuth errors in query or hash — if present, show message and do NOT re-trigger auth
    const err = searchParams.get('error') || hashParams.get('error');
    if (err) {
      if (mounted) {
        setError(
          `${err}${searchParams.get('error_description') ? ': ' + searchParams.get('error_description') : ''}`
        );
        setLoading(false);
      }
      return () => {
        mounted = false;
      };
    }

    // Only attempt to complete the flow if we actually have auth params in the URL
    const hasAccessToken = !!hashParams.get('access_token');
    const hasCode = !!searchParams.get('code');

    if (!hasAccessToken && !hasCode) {
      // No auth params -> don't call authenticate (that would redirect to Spotify)
      if (mounted) {
        setError(t('noAuthData')); // key should exist in locales; fallback to generic message if not
        setLoading(false);
      }
      return () => {
        mounted = false;
      };
    }

    // We have auth data in URL — let the SDK process it
    if (hasCode && !localStorage.getItem('spotify-sdk:verifier')) {
      // No verifier found in storage — try server-side exchange as fallback
      (async () => {
        try {
          const code = searchParams.get('code')!;
          const redirectUri = window.location.origin + window.location.pathname; // should equal VITE_REDIRECT_URI
          console.debug('CallbackPage: attempting server-side exchange for code', code);

          const resp = await fetch('/exchange', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, redirectUri }),
          });

          if (!resp.ok) {
            const text = await resp.text();
            throw new Error(`Server exchange failed: ${resp.status} ${text}`);
          }

          const token = await resp.json();
          console.debug('CallbackPage: server exchange returned token', token);

          // Put token into localStorage under the SDK cache key for AuthorizationCodeWithPKCEStrategy
          // SDK uses cache key "spotify-sdk:AuthorizationCodeWithPKCEStrategy:token"
          localStorage.setItem(
            'spotify-sdk:AuthorizationCodeWithPKCEStrategy:token',
            JSON.stringify({ ...token, expires: Date.now() + (token.expires_in || 0) * 1000 })
          );

          // now call sdk.authenticate to pick up token from cache
          const data = await sdk.authenticate();
          if (data && data.authenticated) {
            navigate('/playlists');
          } else {
            setError('Authentication failed after server exchange');
          }
        } catch (e: any) {
          console.error('Server-side exchange failed', e);
          setError(String(e?.message ?? e));
        } finally {
          setLoading(false);
        }
      })();

      return () => {
        mounted = false;
      };
    }

    // Debug: show verifier existence in storage (sdk expects key "spotify-sdk:verifier")
    try {
      const verifierRaw = localStorage.getItem('spotify-sdk:verifier');
      console.debug('CallbackPage: verifier in localStorage:', verifierRaw);
    } catch (e) {
      console.warn('CallbackPage: could not access localStorage', e);
    }

    // We have auth data in URL — let the SDK process it
    sdk
      .authenticate()
      .then((data: any) => {
        if (!mounted) return;
        if (data && data.authenticated) {
          navigate('/playlists');
        } else {
          // Not authenticated -> go back to root (login)
          navigate('/');
        }
      })
      .catch((e: any) => {
        console.error('Authentication callback failed', e);
        if (!mounted) return;
        setError(String(e?.message ?? e));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [navigate, t]);

  return (
    <section>
      <PageHeader title={t('loginCallback', { provider: 'Spotify' })} />
      {loading && <div className="small text-muted">{t('processingLogin')}</div>}
      {error && (
        <div className="text-danger small">
          {error}
          <div className="mt-2">
            <button className="btn btn-outline-secondary me-2" onClick={() => navigate('/')}>
              {t('retryLogin')}
            </button>
            <button className="btn btn-outline-secondary" onClick={() => navigate('/')}>
              {t('back')}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
