import { cosineSimilarity } from './embeddings.js'

/**
 * 日付の近さスコア (0〜1)
 * 同日=1.0, 30日離れると約0.37, 90日で約0.05
 */
export function dateSimilarity(dateA, dateB) {
  if (!dateA || !dateB) return 0
  const diffDays = Math.abs(new Date(dateA) - new Date(dateB)) / (1000 * 60 * 60 * 24)
  return Math.exp(-diffDays / 30)
}

/**
 * 関係者の一致度スコア (0〜1)
 * Jaccard係数ベース
 */
export function personSimilarity(personsA, personsB) {
  const setA = new Set(personsA.map(p => p.toLowerCase().trim()).filter(Boolean))
  const setB = new Set(personsB.map(p => p.toLowerCase().trim()).filter(Boolean))
  if (!setA.size || !setB.size) return 0

  let overlap = 0
  setA.forEach(p => { if (setB.has(p)) overlap++ })
  return overlap / Math.max(setA.size, setB.size)
}

/**
 * Issue1件に対する複合スコアを計算
 */
export function computeScore({ queryEmbedding, queryPersons, queryDate, issue, weights }) {
  const textScore   = cosineSimilarity(queryEmbedding, issue.embedding)
  const latestDate  = issue.timeline.map(t => t.date).filter(Boolean).sort().at(-1)
  const dateScore   = dateSimilarity(queryDate, latestDate)
  const personScore = personSimilarity(queryPersons, issue.persons)

  const total =
    textScore   * (weights.text   / 100) +
    dateScore   * (weights.date   / 100) +
    personScore * (weights.person / 100)

  return { textScore, dateScore, personScore, total }
}
