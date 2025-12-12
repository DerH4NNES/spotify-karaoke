import React from 'react';
import useCoverflow from '../useCoverflow';
import SimpleView from './SimpleView';
import SliderView from './SliderView';

export type CoverflowProps<T> = {
  items: T[];
  loop?: boolean;
  ariaLabel?: string;
  visibleRange?: number;
  animationMs?: number;
  renderItem: (item: T, idx: number, meta: { isCenter: boolean; pos: number }) => React.ReactNode;
  onActivateCenter?: (item: T) => void;
  onItemContextMenu?: (e: React.MouseEvent, item: T) => void;
};

export default function Coverflow<T>({
  items,
  loop = true,
  ariaLabel = 'Items',
  visibleRange = 2,
  animationMs = 230,
  renderItem,
  onActivateCenter,
  onItemContextMenu,
}: CoverflowProps<T>) {
  const minForSlider = visibleRange * 2 + 1;
  const cf = useCoverflow({ count: items.length, loop, visibleRange, animationMs });

  if (items.length < minForSlider) {
    return (
      <SimpleView
        items={items}
        ariaLabel={ariaLabel}
        renderItem={renderItem}
        onActivateCenter={onActivateCenter}
        onItemContextMenu={onItemContextMenu}
      />
    );
  }

  return (
    <SliderView
      items={items}
      cf={cf}
      ariaLabel={ariaLabel}
      renderItem={renderItem}
      onActivateCenter={onActivateCenter}
      onItemContextMenu={onItemContextMenu}
      loop={loop}
    />
  );
}
