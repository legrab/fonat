export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="logo-wrap" aria-label="Fonat">
      <svg className="logo" viewBox="0 0 64 64" role="img">
        <g fill="none" strokeLinecap="round" strokeWidth="7">
          <path className="strand accent" d="M18 56C18 40 18 25 21 8" />
          <path
            className="strand primary"
            d="M31 56C28 42 31 34 31 27C31 20 40 21 53 21"
          />
          <path
            className="strand neutral"
            d="M43 56C37 41 42 29 42 13C46 11 51 11 57 11"
          />
        </g>
      </svg>
      {!compact && (
        <span>
          <strong>Fonat</strong>
          <small>Szálról szálra.</small>
        </span>
      )}
    </div>
  );
}
