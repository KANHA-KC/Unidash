import type { WidgetSize } from '../types';

const SPAN: Record<WidgetSize, number> = { sm: 1, md: 2, lg: 3, full: 4 };

/** A tiny abstract thumbnail of a dashboard's layout. */
export function MiniPreview({ sizes }: { sizes: WidgetSize[] }) {
  return (
    <div className="mini" aria-hidden>
      {sizes.slice(0, 8).map((s, i) => (
        <span key={i} style={{ gridColumn: `span ${SPAN[s]}` }} className={i === 0 ? 'first' : ''} />
      ))}
      {!sizes.length && <span style={{ gridColumn: 'span 4' }} className="ghost" />}
    </div>
  );
}
