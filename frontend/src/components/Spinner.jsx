export default function Spinner({ size = 24, color = 'var(--cm-red)' }) {
  return (
    <div style={{
      width: size, height: size,
      border: `3px solid ${color}20`,
      borderTop: `3px solid ${color}`,
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
  )
}
