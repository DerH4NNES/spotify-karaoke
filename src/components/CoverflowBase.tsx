import React, { useEffect, useRef } from 'react';
// component SCSS moved to centralized location
import '../scss/components/Coverflow.scss';
import useCoverflow from './useCoverflow';

type CoverflowBaseProps<T> = {
  items: T[];
  loop?: boolean;
  ariaLabel?: string;
  visibleRange?: number;
  animationMs?: number;
  renderItem: (item: T, idx: number, meta: { isCenter: boolean; pos: number }) => React.ReactNode;
  onActivateCenter?: (item: T) => void; // e.g. playlist open / track play
  enableGamepad?: boolean;
};

export default function CoverflowBase<T>({
  items,
  loop = true,
  ariaLabel = 'Items',
  visibleRange = 2,
  animationMs = 230,
  renderItem,
  onActivateCenter,
  enableGamepad: _enableGamepad = true,
}: CoverflowBaseProps<T>) {
  const minItemsForSlider = visibleRange * 2 + 1;
  const cf = useCoverflow({ count: items.length, loop, visibleRange, animationMs });

  // repeat/hold refs
  const leftRepeatRef = useRef<number | null>(null);
  const rightRepeatRef = useRef<number | null>(null);
  const leftDelayRef = useRef<number | null>(null);
  const rightDelayRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (leftRepeatRef.current) window.clearInterval(leftRepeatRef.current);
      if (rightRepeatRef.current) window.clearInterval(rightRepeatRef.current);
      if (leftDelayRef.current) window.clearTimeout(leftDelayRef.current);
      if (rightDelayRef.current) window.clearTimeout(rightDelayRef.current);
    };
  }, []);

  if (items.length < minItemsForSlider) {
    // Fallback: Zeige alle Items nebeneinander, keine Slider-Logik, mit Bootstrap-Row/Col
    return (
      <div className="cf5-viewport" role="listbox" aria-label={ariaLabel} tabIndex={0}>
        <div className="row justify-content-center align-items-center" style={{ minHeight: 200 }}>
          {items.map((item, idx) => (
            <div className="col-auto" key={`cf-simple-${idx}`}>
              <div
                className={'cf5-slot center'}
                role="option"
                aria-selected={false}
                tabIndex={0}
                onClick={() => onActivateCenter && onActivateCenter(item)}
                title={String((item as any).name ?? '')}
                style={{ position: 'relative' }}
              >
                {renderItem(item, idx, {
                  isCenter: true,
                  pos: idx,
                })}
                {!(item as any).images?.[0]?.url && (
                  <img
                    src="/favicon.ico"
                    alt="Dummy"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      zIndex: 0,
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="cf5-root">
      <button
        type="button"
        className="cf5-arrow left"
        onClick={cf.goPrev}
        aria-label="Vorherige"
        disabled={!loop && cf.active === 0}
      >
        ‹
      </button>

      <div
        className="cf5-viewport"
        role="listbox"
        aria-label={ariaLabel}
        tabIndex={0}
        onPointerDown={cf.onPointerDown}
        onPointerUp={cf.onPointerUp}
      >
        <div className={`cf5-grid ${cf.gridAnimClass}`}>
          {cf.slots.map((idx, pos) => {
            const item = items[idx]!;
            const isCenter = idx === cf.active;
            return (
              <div
                key={`cf-${idx}-${pos}`}
                className={`cf5-slot ${isCenter ? 'center' : 'side'}`}
                role="option"
                aria-selected={isCenter}
                tabIndex={0}
                onClick={() => {
                  if (isCenter) {
                    if (onActivateCenter) onActivateCenter(item);
                  } else {
                    cf.setActiveWithAnim(idx);
                  }
                }}
                title={String((item as any).name ?? '')}
              >
                {renderItem(item, idx, { isCenter, pos })}
              </div>
            );
          })}
        </div>

        <div className="cf5-fade left" />
        <div className="cf5-fade right" />
      </div>

      <button
        type="button"
        className="cf5-arrow"
        onClick={cf.goNext}
        aria-label="Nächste"
        disabled={!loop && cf.active === items.length - 1}
      >
        ›
      </button>
    </div>
  );
}
