import { useState } from 'react'
import { fetchEmbedding } from './api/embeddings.js'
import { computeScore } from './api/scoring.js'
import IssueForm from './components/IssueForm.jsx'
import styles from './App.module.css'

const NEW_ISSUE_THRESHOLD = 0.45

// sessionStorage からAPIキーを復元（ページリロードまで保持）
const storedKey = sessionStorage.getItem('openai_api_key') ?? ''

export default function App() {
  // ---- API Key ----
  const [apiKey, setApiKey]           = useState(storedKey)
  const [apiKeyInput, setApiKeyInput] = useState(storedKey)
  const [keyVisible, setKeyVisible]   = useState(false)
  const [keyError, setKeyError]       = useState('')

  // ---- Issues ----
  const [issues, setIssues]           = useState([])
  const [showForm, setShowForm]       = useState(false)
  const [registering, setRegistering] = useState(false)

  // ---- Query ----
  const [query, setQuery]               = useState('')
  const [queryPersons, setQueryPersons] = useState([''])
  const [queryDate, setQueryDate]       = useState('')

  // ---- Weights ----
  const [weights, setWeights] = useState({ text: 50, date: 25, person: 25 })

  // ---- Results ----
  const [results, setResults]         = useState(null)
  const [classifying, setClassifying] = useState(false)
  const [error, setError]             = useState('')

  // ============================================================
  // APIキー保存
  // ============================================================
  const handleSaveKey = () => {
    const trimmed = apiKeyInput.trim()
    if (!trimmed.startsWith('sk-')) {
      setKeyError('APIキーは sk- で始まる必要があります')
      return
    }
    setApiKey(trimmed)
    sessionStorage.setItem('openai_api_key', trimmed)
    setKeyError('')
  }

  const handleClearKey = () => {
    setApiKey('')
    setApiKeyInput('')
    sessionStorage.removeItem('openai_api_key')
  }

  // ============================================================
  // Issue登録
  // ============================================================
  const handleRegister = async (formData) => {
    setRegistering(true)
    setError('')
    try {
      const text = `${formData.title} ${formData.summary} ${formData.timeline.map(t => t.event).join(' ')}`
      const embedding = await fetchEmbedding(text, apiKey)
      setIssues(prev => [...prev, { id: Date.now(), ...formData, embedding }])
      setShowForm(false)
    } catch (e) {
      setError('登録エラー: ' + e.message)
    }
    setRegistering(false)
  }

  // ============================================================
  // 分類
  // ============================================================
  const handleClassify = async () => {
    if (!query.trim()) { setError('検索文を入力してください'); return }
    if (!issues.length) { setError('Issueを先に登録してください'); return }
    setClassifying(true)
    setError('')
    setResults(null)
    try {
      const queryEmbedding = await fetchEmbedding(query, apiKey)
      const qPersons = queryPersons.filter(Boolean)

      const scored = issues
        .map(issue => ({
          issue,
          ...computeScore({ queryEmbedding, queryPersons: qPersons, queryDate, issue, weights }),
        }))
        .sort((a, b) => b.total - a.total)

      setResults(scored)
    } catch (e) {
      setError('分類エラー: ' + e.message)
    }
    setClassifying(false)
  }

  // ---- Weight スライダー（合計100%を維持）----
  const updateWeight = (key, val) => {
    const v = Number(val)
    const others = ['text', 'date', 'person'].filter(k => k !== key)
    const remaining = 100 - v
    const sum = weights[others[0]] + weights[others[1]]
    const ratio = sum > 0 ? remaining / sum : 0.5
    setWeights({
      ...weights,
      [key]: v,
      [others[0]]: Math.round(weights[others[0]] * ratio),
      [others[1]]: 100 - v - Math.round(weights[others[0]] * ratio),
    })
  }

  const topResult = results?.[0]
  const isNew = !topResult || topResult.total < NEW_ISSUE_THRESHOLD
  const isReady = !!apiKey

  return (
    <div className={styles.app}>
      {/* ===== HEADER ===== */}
      <header className={styles.header}>
        <div className={styles.logo}>
          ISSUE<span className={styles.accent}>MATCH</span>
        </div>
        <div className={styles.headerMeta}>MULTILINGUAL · SEMANTIC · VECTOR SEARCH</div>
      </header>

      {/* ===== API KEY PANEL ===== */}
      <div className={`${styles.keyPanel} ${isReady ? styles.keyPanelReady : ''}`}>
        <div className={styles.keyPanelInner}>
          <div className={styles.keyStatus}>
            <span className={styles.dot} style={{ background: isReady ? '#50d0a0' : '#f66' }} />
            {isReady ? 'API KEY CONNECTED' : 'API KEY NOT SET'}
          </div>

          {!isReady ? (
            <div className={styles.keyInputRow}>
              <input
                className={styles.keyInp}
                type={keyVisible ? 'text' : 'password'}
                placeholder="sk-..."
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveKey()}
              />
              <button className={styles.keyToggle} onClick={() => setKeyVisible(v => !v)}>
                {keyVisible ? 'HIDE' : 'SHOW'}
              </button>
              <button className={styles.primaryBtn} onClick={handleSaveKey}>SAVE</button>
              {keyError && <span className={styles.error}>{keyError}</span>}
            </div>
          ) : (
            <div className={styles.keyInputRow}>
              <span className={styles.keyMasked}>
                {apiKey.slice(0, 8)}{'•'.repeat(16)}{apiKey.slice(-4)}
              </span>
              <button className={styles.ghostBtn} onClick={handleClearKey}>CLEAR</button>
            </div>
          )}

          <div className={styles.keyNote}>
            キーはこのブラウザのsessionStorageにのみ保存されます。タブを閉じると消えます。
          </div>
        </div>
      </div>

      <main className={styles.main}>
        {/* ===== LEFT: Issues ===== */}
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              ISSUES <span className={styles.accent}>{issues.length}</span>
            </h2>
            <button className={styles.ghostBtn} disabled={!isReady}
              onClick={() => { setShowForm(v => !v); setError('') }}>
              {showForm ? 'CANCEL' : '+ ADD ISSUE'}
            </button>
          </div>

          {showForm && (
            <div className={styles.formWrap}>
              <IssueForm onRegister={handleRegister} loading={registering} />
            </div>
          )}

          {error && <div className={styles.error}>{error}</div>}

          {!isReady && (
            <div className={styles.empty}>上のAPIキーを設定してください</div>
          )}

          {isReady && issues.length === 0 && (
            <div className={styles.empty}>
              No issues yet.<br />Click "+ ADD ISSUE" to start.
            </div>
          )}

          {issues.length > 0 && (
            <div className={styles.issueList}>
              {issues.map(issue => (
                <div key={issue.id} className={styles.issueCard}>
                  <div className={styles.issueTitle}>{issue.title}</div>
                  <div className={styles.issueSummary}>{issue.summary}</div>
                  <div className={styles.tags}>
                    {issue.persons.map((p, i) => (
                      <span key={i} className={styles.tagPerson}>{p}</span>
                    ))}
                    {issue.timeline.filter(t => t.date).map((t, i) => (
                      <span key={i} className={styles.tagDate}>{t.date}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ===== RIGHT: Classify ===== */}
        <section className={styles.panel}>

          {/* Weights */}
          <div className={styles.card}>
            <h2 className={styles.panelTitle} style={{ marginBottom: 16 }}>SCORING WEIGHTS</h2>
            {[
              { key: 'text',   label: 'Text Similarity (embedding)', color: '#5a5af0' },
              { key: 'date',   label: 'Date Proximity',              color: '#f0a050' },
              { key: 'person', label: 'Person / Org Match',          color: '#50d0a0' },
            ].map(({ key, label, color }) => (
              <div key={key} className={styles.weightRow}>
                <div className={styles.weightMeta}>
                  <span className={styles.weightLabel}>{label}</span>
                  <span style={{ fontSize: 11, color, fontWeight: 600 }}>{weights[key]}%</span>
                </div>
                <div className={styles.trackWrap}>
                  <div className={styles.track}>
                    <div className={styles.trackFill} style={{ width: `${weights[key]}%`, background: color }} />
                  </div>
                  <input type="range" min={0} max={100} value={weights[key]}
                    onChange={e => updateWeight(key, e.target.value)}
                    style={{ width: '100%', accentColor: color }} />
                </div>
              </div>
            ))}
          </div>

          {/* Query */}
          <div className={styles.card}>
            <h2 className={styles.panelTitle} style={{ marginBottom: 16 }}>CLASSIFY INPUT</h2>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Natural language input (any language)</label>
              <textarea className={styles.inp} rows={3} value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="日本語・English・中文、何でもOK…"
                style={{ resize: 'vertical' }} />
            </div>

            <div className={styles.field}>
              <div className={styles.rowLabel}>
                <label className={styles.fieldLabel}>Persons / Orgs mentioned</label>
                <button className={styles.miniBtn}
                  onClick={() => setQueryPersons(p => [...p, ''])}>+ ADD</button>
              </div>
              {queryPersons.map((p, i) => (
                <input key={i} className={styles.inp} placeholder="Name / Organization…" value={p}
                  onChange={e => { const ps = [...queryPersons]; ps[i] = e.target.value; setQueryPersons(ps) }}
                  style={{ marginBottom: 4 }} />
              ))}
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Date of event</label>
              <input className={styles.inp} type="date" value={queryDate}
                onChange={e => setQueryDate(e.target.value)} />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button className={styles.primaryBtn} onClick={handleClassify}
              disabled={classifying || !isReady}>
              {classifying
                ? <span className={styles.pulse}>EMBEDDING & SCORING…</span>
                : 'CLASSIFY →'}
            </button>
          </div>

          {/* Results */}
          {results && (
            <div className={`${styles.card} ${styles.slideIn}`}>
              <h2 className={styles.panelTitle} style={{ marginBottom: 16 }}>RESULT</h2>

              <div className={styles.verdict} style={{
                background: isNew ? '#1a0a0a' : '#0a1a0f',
                borderColor: isNew ? '#5a1a1a' : '#1a5a2a',
              }}>
                <span className={styles.verdictIcon}>{isNew ? '🆕' : '🔗'}</span>
                <div>
                  <div className={styles.verdictTitle} style={{ color: isNew ? '#f08080' : '#80e0a0' }}>
                    {isNew ? 'NEW ISSUE' : 'EXISTING ISSUE MATCH'}
                  </div>
                  <div className={styles.verdictSub}>
                    {isNew
                      ? `Top score ${(topResult.total * 100).toFixed(1)}% — threshold ${(NEW_ISSUE_THRESHOLD * 100).toFixed(0)}% unmet`
                      : `"${topResult.issue.title}" — ${(topResult.total * 100).toFixed(1)}%`}
                  </div>
                </div>
              </div>

              {results.map((r, idx) => (
                <div key={r.issue.id} className={styles.resultCard}
                  style={{ borderColor: idx === 0 && !isNew ? '#1a4a2a' : '#1e1e2e',
                            background:   idx === 0 && !isNew ? '#0d1a0f' : '#0d0d14' }}>
                  <div className={styles.resultHeader}>
                    <span className={styles.rank}>#{idx + 1}</span>
                    <span className={styles.resultTitle}>{r.issue.title}</span>
                    <span className={styles.totalScore}
                      style={{ color: r.total > NEW_ISSUE_THRESHOLD ? '#80e0a0' : '#888' }}>
                      {(r.total * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className={styles.subScores}>
                    {[
                      { label: 'TEXT',   val: r.textScore,   color: '#5a5af0' },
                      { label: 'DATE',   val: r.dateScore,   color: '#f0a050' },
                      { label: 'PERSON', val: r.personScore, color: '#50d0a0' },
                    ].map(({ label, val, color }) => (
                      <div key={label} className={styles.subScore}>
                        <div className={styles.subLabel}>{label}</div>
                        <div className={styles.subTrack}>
                          <div className={styles.subFill} style={{ width: `${val * 100}%`, background: color }} />
                        </div>
                        <div style={{ fontSize: 10, color }}>{(val * 100).toFixed(1)}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className={styles.threshold}>
                NEW ISSUE threshold: {(NEW_ISSUE_THRESHOLD * 100).toFixed(0)}% composite score
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
