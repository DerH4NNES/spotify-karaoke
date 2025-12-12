import React from 'react';

type Props<T> = {
  items: T[];
  ariaLabel: string;
  renderItem: (item: T, idx: number, meta: { isCenter: boolean; pos: number }) => React.ReactNode;
  onActivateCenter?: (item: T) => void;
  onItemContextMenu?: (e: React.MouseEvent, item: T) => void;
};

export default function SimpleView<T>({
  items,
  ariaLabel,
  renderItem,
  onActivateCenter,
  onItemContextMenu,
}: Props<T>) {
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
              title={String((item as any).name ?? '')}
              style={{ position: 'relative' }}
            >
              <div
                className="cf5-slot-inner"
                style={{ width: '100%', height: '100%', position: 'relative' }}
                onClick={() => onActivateCenter && onActivateCenter(item)}
                onContextMenu={(e) => {
                  if (onItemContextMenu) {
                    e.preventDefault();
                    onItemContextMenu(e, item);
                  }
                }}
              >
                {renderItem(item, idx, { isCenter: true, pos: idx })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
