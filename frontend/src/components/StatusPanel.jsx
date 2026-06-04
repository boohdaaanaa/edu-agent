
export default function StatusPanel({ status, searchQuery, sources }) {
  const steps = [
    {
      id: 'searching',
      label: 'Веб-пошук',
      icon: '🌐',
      desc: searchQuery ? `"${searchQuery}"` : 'Пошук в інтернеті...'
    },
    {
      id: 'analyzing',
      label: 'Аналіз AI',
      icon: '🧠',
      desc: `Знайдено ${sources.length} джерел`
    },
    {
      id: 'done',
      label: 'Готово',
      icon: '✅',
      desc: 'Аналіз завершено'
    },
  ]

  const activeIdx =
    status === 'searching' ? 0
    : status === 'analyzing' ? 1
    : -1

  const allDone = status === 'done'

  if (status === 'idle' || status === 'error') return null

  return (
    <div style={styles.container} className="animate-fadeIn">
      <div style={styles.steps}>
        {steps.map((step, i) => {
          const isDone = allDone || i < activeIdx
          const isActive = !allDone && i === activeIdx
          return (
            <div key={step.id} style={styles.stepRow}>
              <div style={{
                ...styles.stepIndicator,
                ...(isDone ? styles.stepDone : {}),
                ...(isActive ? styles.stepActive : {}),
              }}>
                {isActive ? (
                  <span style={styles.spinner}></span>
                ) : isDone ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <span style={{ fontSize: '0.75rem', opacity: 0.4 }}>{i + 1}</span>
                )}
              </div>
              <div style={styles.stepContent}>
                <span style={{
                  ...styles.stepLabel,
                  ...(isActive ? { color: 'var(--accent-primary)' }
                    : isDone ? { color: 'var(--accent-success)' }
                    : { color: 'var(--text-muted)' })
                }}>
                  {step.icon} {step.label}
                </span>
                {(isActive || isDone) && (
                  <span style={styles.stepDesc}>{step.desc}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {sources.length > 0 && (
        <div style={styles.sourcesPreview}>
          <div style={styles.sourcesLabel}>Знайдені джерела ({sources.length})</div>
          <div style={styles.sourcesList}>
            {sources.slice(0, 5).map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.sourceChip}
              >
                <span style={styles.sourceNum}>{i + 1}</span>
                <span style={styles.sourceTitle}>
                  {s.title?.length > 55 ? s.title.slice(0, 55) + '…' : (s.title || 'Джерело')}
                </span>
                <span style={styles.sourceArrow}>↗</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      `}</style>
    </div>
  )
}

const styles = {
  container: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  steps: { display: 'flex', flexDirection: 'column', gap: '12px' },
  stepRow: { display: 'flex', alignItems: 'flex-start', gap: '12px' },
  stepIndicator: {
    width: '28px', height: '28px', borderRadius: '50%',
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, color: 'var(--text-muted)',
  },
  stepActive: {
    background: 'rgba(79,142,247,0.15)',
    borderColor: 'var(--accent-primary)',
  },
  stepDone: {
    background: 'rgba(61,214,140,0.15)',
    borderColor: 'var(--accent-success)',
    color: 'var(--accent-success)',
  },
  spinner: {
    width: '14px', height: '14px',
    border: '2px solid rgba(79,142,247,0.3)',
    borderTopColor: 'var(--accent-primary)',
    borderRadius: '50%', display: 'block',
    animation: 'spin 0.8s linear infinite',
  },
  stepContent: { display: 'flex', flexDirection: 'column', gap: '2px', paddingTop: '4px' },
  stepLabel: {
    fontSize: '0.85rem', fontWeight: 500,
    fontFamily: 'var(--font-display)', letterSpacing: '-0.01em',
  },
  stepDesc: { fontSize: '0.76rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' },
  sourcesPreview: {
    borderTop: '1px solid var(--border)', paddingTop: '14px',
    display: 'flex', flexDirection: 'column', gap: '8px',
  },
  sourcesLabel: {
    fontSize: '0.68rem', fontFamily: 'var(--font-display)', fontWeight: 600,
    color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase',
  },
  sourcesList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  sourceChip: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '8px 12px', background: 'var(--bg-elevated)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
    textDecoration: 'none', transition: 'border-color 0.2s',
  },
  sourceNum: {
    width: '18px', height: '18px', background: 'rgba(79,142,247,0.15)',
    color: 'var(--accent-primary)', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
  },
  sourceTitle: {
    flex: 1, fontSize: '0.8rem', color: 'var(--text-secondary)',
    fontFamily: 'var(--font-body)', overflow: 'hidden',
    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  sourceArrow: { fontSize: '0.8rem', color: 'var(--text-muted)' },
}