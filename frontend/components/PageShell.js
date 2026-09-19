export default function PageShell({ children, blur = true, style = {} }) {
  return (
    <div
      className={`page-bg ${blur ? 'page-bg--blur' : ''}`}
      style={{ padding: '2rem 1.25rem 3rem', ...style }}
    >
      {children}
    </div>
  );
}
