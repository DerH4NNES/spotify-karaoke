import React from 'react';
import useCoverflow from '../useCoverflow';

type SliderProps<T> = {
  items: T[];
  cf: ReturnType<typeof useCoverflow>;
  ariaLabel: string;
  renderItem: (item: T, idx: number, meta: { isCenter: boolean; pos: number }) => React.ReactNode;
  onActivateCenter?: (item: T) => void;
  onItemContextMenu?: (e: React.MouseEvent, item: T) => void;
  loop: boolean;
};

export default function SliderView<T>({
  items,
  cf,
  ariaLabel,
  renderItem,
  onActivateCenter,
  onItemContextMenu,
  loop,
}: SliderProps<T>) {
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
                onContextMenu={(e) => {
                  if (onItemContextMenu) {
                    e.preventDefault();
                    onItemContextMenu(e, item);
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
