import { useState } from 'react'
import s from './IssueForm.module.css'

const empty = () => ({
  title: '',
  summary: '',
  timeline: [{ event: '', date: '' }],
  persons: [''],
})

export default function IssueForm({ onRegister, loading }) {
  const [form, setForm] = useState(empty())
  const [error, setError] = useState('')

  const updateTimeline = (i, field, val) =>
    setForm(p => { const t = [...p.timeline]; t[i] = { ...t[i], [field]: val }; return { ...p, timeline: t } })

  const updatePerson = (i, val) =>
    setForm(p => { const ps = [...p.persons]; ps[i] = val; return { ...p, persons: ps } })

  const handleSubmit = async () => {
    if (!form.title || !form.summary) { setError('タイトルと概要は必須です'); return }
    setError('')
    await onRegister({ ...form, persons: form.persons.filter(Boolean) })
    setForm(empty())
  }

  return (
    <div className={s.form}>
      <div className={s.field}>
        <label className={s.label}>Title</label>
        <input className={s.inp} placeholder="Issue title…" value={form.title}
          onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
      </div>

      <div className={s.field}>
        <label className={s.label}>Summary</label>
        <textarea className={s.inp} rows={3} placeholder="Issue summary…" value={form.summary}
          onChange={e => setForm(p => ({ ...p, summary: e.target.value }))} style={{ resize: 'vertical' }} />
      </div>

      <div className={s.field}>
        <div className={s.rowLabel}>
          <label className={s.label}>Timeline</label>
          <button className={s.addBtn}
            onClick={() => setForm(p => ({ ...p, timeline: [...p.timeline, { event: '', date: '' }] }))}>
            + ADD
          </button>
        </div>
        {form.timeline.map((t, i) => (
          <div key={i} className={s.timelineRow}>
            <input className={s.inp} placeholder="Event…" value={t.event}
              onChange={e => updateTimeline(i, 'event', e.target.value)} style={{ flex: 2 }} />
            <input className={s.inp} type="date" value={t.date}
              onChange={e => updateTimeline(i, 'date', e.target.value)} style={{ flex: 1 }} />
          </div>
        ))}
      </div>

      <div className={s.field}>
        <div className={s.rowLabel}>
          <label className={s.label}>Persons / Orgs</label>
          <button className={s.addBtn}
            onClick={() => setForm(p => ({ ...p, persons: [...p.persons, ''] }))}>
            + ADD
          </button>
        </div>
        {form.persons.map((p, i) => (
          <input key={i} className={s.inp} placeholder="Name / Organization…" value={p}
            onChange={e => updatePerson(i, e.target.value)} style={{ marginBottom: 4 }} />
        ))}
      </div>

      {error && <div className={s.error}>{error}</div>}

      <button className={s.submitBtn} onClick={handleSubmit} disabled={loading}>
        {loading ? <span className={s.pulse}>EMBEDDING…</span> : 'REGISTER ISSUE'}
      </button>
    </div>
  )
}
