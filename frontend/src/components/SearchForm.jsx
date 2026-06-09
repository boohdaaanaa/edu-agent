import { useState } from 'react'

const CATEGORIES = [
  { value: '',                          label: 'Вільний пошук',         icon: '🔍' },
  { value: 'навчальна програма',        label: 'Навчальна програма',    icon: '📚' },
  { value: 'методичні вказівки',        label: 'Методичні вказівки',    icon: '📋' },
  { value: 'навчальний план',           label: 'Навчальний план',       icon: '🗓' },
  { value: 'підручник посібник',        label: 'Підручники та посібники', icon: '📖' },
  { value: 'силабус курс',              label: 'Силабуси',              icon: '📝' },
  { value: 'наукова стаття дослідження',label: 'Наукові статті',        icon: '🔭' },
]

const SUGGESTIONS = [
  'Комп\'ютерні науки',
  'Штучний інтелект',
  'Інженерія програмного забезпечення',
  'Кібербезпека',
  'Бази даних',
  'Алгоритми та структури даних',
  'Веб-розробка',
]

export default function SearchForm({ onSubmit, isLoading }) {
  const [topic, setTopic] = useState('')
  const [category, setCategory] = useState('навчальна програма')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (topic.trim()) onSubmit(topic.trim(), category)
  }

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>

        {/* Category selector */}
        <div style={styles.field}>
          <label style={styles.label}>Тип матеріалу</label>
          <div style={styles.categoryGrid}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.value + cat.label}
                type="button"
                onClick={() => setCategory(cat.value)}
                style={{
                  ...styles.catBtn,
                  ...(category === cat.value ? styles.catBtnActive : {})
                }}
              >
                <span style={styles.catIcon}>{cat.icon}</span>
                <span style={styles.catLabel}>{cat.label}</span>
              </button>
            ))}
          </div>
          {category === '' && (
            <div style={styles.hintBox}>
              💡 <strong>Вільний пошук</strong> — шукає точно по вашій темі без прив'язки до типу документа.
              Підходить для запитів типу «ціна навчання в НУЛП», «вступ до НУЛП» тощо.
            </div>
          )}
        </div>

        {/* Topic input */}
        <div style={styles.field}>
          <label style={styles.label}>Тема пошуку</label>
          <div style={styles.inputWrapper}>
            <span style={styles.inputIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </span>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder={
                category === ''
                  ? 'Наприклад: ціна навчання НУЛП 2024...'
                  : 'Наприклад: НУЛП комп\'ютерні науки...'
              }
              style={styles.input}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Quick suggestions */}
        <div style={styles.field}>
          <label style={styles.labelSmall}>Швидкий вибір</label>
          <div style={styles.suggestions}>
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setTopic(s)}
                style={styles.suggBtn}
                disabled={isLoading}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || !topic.trim()}
          style={{
            ...styles.submitBtn,
            ...(isLoading || !topic.trim() ? styles.submitBtnDisabled : {})
          }}
        >
          {isLoading ? (
            <>
              <span style={styles.spinnerSmall}></span>
              Агент працює...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              Запустити пошук
            </>
          )}
        </button>
      </form>

      <style>{`
        input:focus { outline: none; border-color: var(--accent-primary) !important; box-shadow: 0 0 0 3px rgba(79,142,247,0.15) !important; }
        input::placeholder { color: var(--text-muted); }
        button[style*="catBtn"]:hover:not(:disabled) { border-color: var(--border-accent); color: var(--text-primary); }
        @keyframes spin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
      `}</style>
    </div>
  )
}

const styles = {
  container: { width: '100%' },
  form: { display: 'flex', flexDirection: 'column', gap: '24px' },
  field: { display: 'flex', flexDirection: 'column', gap: '10px' },
  label: {
    fontFamily: 'var(--font-display)', fontSize: '0.7rem', fontWeight: 600,
    color: 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase',
  },
  labelSmall: {
    fontFamily: 'var(--font-display)', fontSize: '0.65rem', fontWeight: 600,
    color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase',
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))',
    gap: '8px',
  },
  catBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 14px', background: 'var(--bg-elevated)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)', cursor: 'pointer',
    transition: 'all 0.2s', fontSize: '0.82rem',
    fontFamily: 'var(--font-body)', textAlign: 'left',
  },
  catBtnActive: {
    background: 'rgba(79,142,247,0.12)',
    borderColor: 'var(--accent-primary)',
    color: 'var(--accent-primary)',
  },
  catIcon: { fontSize: '1rem', flexShrink: 0 },
  catLabel: { lineHeight: 1.3 },
  hintBox: {
    padding: '10px 14px',
    background: 'rgba(240,164,41,0.08)',
    border: '1px solid rgba(240,164,41,0.25)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-body)',
    lineHeight: 1.5,
  },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: {
    position: 'absolute', left: '14px',
    color: 'var(--text-muted)', display: 'flex',
    alignItems: 'center', pointerEvents: 'none',
  },
  input: {
    width: '100%', padding: '14px 14px 14px 44px',
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
    fontSize: '0.95rem', fontFamily: 'var(--font-body)', transition: 'all 0.2s',
  },
  suggestions: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  suggBtn: {
    padding: '6px 14px', background: 'transparent',
    border: '1px solid var(--border)', borderRadius: '20px',
    color: 'var(--text-muted)', fontSize: '0.8rem',
    fontFamily: 'var(--font-body)', cursor: 'pointer', transition: 'all 0.2s',
  },
  submitBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    width: '100%', padding: '15px',
    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
    border: 'none', borderRadius: 'var(--radius-md)', color: '#fff',
    fontSize: '0.95rem', fontFamily: 'var(--font-display)', fontWeight: 600,
    letterSpacing: '0.03em', cursor: 'pointer', transition: 'all 0.2s',
    boxShadow: '0 4px 20px rgba(79,142,247,0.3)',
  },
  submitBtnDisabled: { opacity: 0.5, cursor: 'not-allowed', boxShadow: 'none' },
  spinnerSmall: {
    width: '16px', height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff', borderRadius: '50%',
    display: 'inline-block', animation: 'spin 0.8s linear infinite',
  }
}