import React from 'react';

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  buttons?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  buttons,
  style,
  className,
  children,
}: PageHeaderProps & { children?: React.ReactNode }) {
  return (
    <header className={`m-4 ${className || ''}`} style={style}>
      <div className="d-flex flex-row align-items-start justify-content-between gap-2">
        <div className="d-flex flex-column align-items-start flex-grow-1">
          <h1 className="page-head">{title}</h1>
          {subtitle && <div className="page-subhead">{subtitle}</div>}
          {children}
        </div>
        <div className="d-flex align-items-center gap-2 flex-shrink-0 justify-content-end">
          {buttons}
        </div>
      </div>
    </header>
  );
}
