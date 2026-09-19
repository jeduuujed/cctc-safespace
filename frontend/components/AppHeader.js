import Link from 'next/link';
import LogoSeal from './LogoSeal';

export default function AppHeader({
  variant = 'landing',
  title = 'CCTC SafeSpace',
  userLine,
  onLogout,
  admin = false,
  showStudentLogout = false,
  backHref = '/',
  backLabel = 'Back to Home'
}) {
  const brand = (
    <Link
      href="/"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        textDecoration: 'none',
        color: '#111'
      }}
    >
      <LogoSeal size={variant === 'landing' ? 44 : 40} />
      <span style={{ fontWeight: 700, fontSize: variant === 'landing' ? 18 : 17 }}>
        {admin ? 'CCTC SafeSpace Admin' : title}
      </span>
    </Link>
  );

  if (variant === 'landing') {
    return (
      <header
        style={{
          height: 'var(--header-height)',
          background: '#fff',
          borderBottom: '1px solid #eee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '0 1.5rem',
          position: 'relative',
          zIndex: 10
        }}
      >
        {brand}
      </header>
    );
  }

  if (variant === 'admin') {
    return (
      <header
        style={{
          height: 'var(--header-height)',
          background: '#fff',
          borderBottom: '1px solid #eee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.25rem',
          position: 'relative',
          zIndex: 10
        }}
      >
        {brand}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {userLine && <span style={{ color: '#333', fontSize: 14 }}>{userLine}</span>}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'transparent',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 13
              }}
            >
              Logout <span aria-hidden>→</span>
            </button>
          )}
        </div>
      </header>
    );
  }

  /* auth | student */
  return (
    <header
      style={{
        height: 'var(--header-height)',
        background: '#fff',
        borderBottom: '1px solid #eee',
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        padding: '0 1.25rem',
        position: 'relative',
        zIndex: 10
      }}
    >
      <div>
        <Link
          href={backHref}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: '#111',
            fontSize: 14,
            textDecoration: 'none'
          }}
        >
          <span aria-hidden>←</span> {backLabel}
        </Link>
      </div>
      <div style={{ justifySelf: 'center' }}>{brand}</div>
      <div
        style={{
          justifySelf: 'end',
          fontSize: 14,
          color: '#333',
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}
      >
        {userLine && <span>{userLine}</span>}
        {showStudentLogout && onLogout && (
          <button
            type="button"
            onClick={onLogout}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 13
            }}
          >
            Logout <span aria-hidden>→</span>
          </button>
        )}
        {!userLine && !showStudentLogout && '\u00a0'}
      </div>
    </header>
  );
}
