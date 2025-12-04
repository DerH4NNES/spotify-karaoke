import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface BackButtonProps {
  to?: string;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
}

export default function BackButton({ to, className = '', style = {}, label }: BackButtonProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  // Fallback: Wenn kein Label übergeben, nimm Übersetzung
  const buttonLabel = label || t('back');
  return (
    <button
      type="button"
      className={`back-btn ${className}`}
      style={{ ...style }}
      onClick={() => (to ? navigate(to) : navigate(-1))}
      aria-label={buttonLabel}
    >
      <span style={{ fontSize: 22, marginRight: 8, verticalAlign: 'middle' }}>&larr;</span>
      <span style={{ verticalAlign: 'middle' }}>{buttonLabel}</span>
    </button>
  );
}
