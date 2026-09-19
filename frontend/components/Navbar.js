import Link from 'next/link';

export default function Navbar() {
  return (
    <nav
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem 1.5rem',
        background: '#004aad',
        color: '#fff'
      }}
    >
      <span style={{ fontWeight: 'bold' }}>CCTC SafeSpace</span>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link href="/" style={{ color: '#fff' }}>
          Home
        </Link>
        <Link href="/report" style={{ color: '#fff' }}>
          Report
        </Link>
        <Link href="/login" style={{ color: '#fff' }}>
          Admin
        </Link>
      </div>
    </nav>
  );
}

