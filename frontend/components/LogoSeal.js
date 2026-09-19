export default function LogoSeal({ size = 48, className = '' }) {
  return (
    <img
      src="/cctc-seal.png"
      alt="Official seal of Consolatrix College of Toledo City"
      width={size}
      height={size}
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        borderRadius: '50%',
        display: 'block',
        flexShrink: 0
      }}
    />
  );
}
