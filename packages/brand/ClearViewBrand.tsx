import './brand.css';

/** Original Open View symbol: an open C and its independently cited source. */
export function ClearViewMark({ className = '' }: { className?: string }) {
  return <svg className={`clearview-mark ${className}`} viewBox="0 0 256 256" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M80 32H224V80H96A16 16 0 0 0 80 96V160A16 16 0 0 0 96 176H224V224H80L32 176V80Z" />
    <path className="clearview-mark-source" d="M192 112H224V144H192Z" />
  </svg>;
}

export function ClearViewBrand({ tone = 'dark', compact = false }: { tone?: 'dark' | 'light'; compact?: boolean }) {
  return <span className={`clearview-brand clearview-brand-${tone}${compact ? ' clearview-brand-compact' : ''}`}>
    <ClearViewMark /><span className="clearview-wordmark">ClearView</span>
  </span>;
}
