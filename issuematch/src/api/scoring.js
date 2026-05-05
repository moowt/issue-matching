import { cosineSimilarity } from './embeddings.js'

/**
 * 日付の近さスコア (0〜1)
 * 同日=1.0, 30日離れると約0.37, 90日で約0.05
 * 日付未入力の場合は 1.0（ペナルティなし）
 */
export function dateSimilarity(dateA, dateB) {
  if (!dateA || !dateB) return 1
  const diffDays = Math.abs(new Date(dateA) - new Date(dateB)) / (1000 * 60 * 60 * 24)
  return Math.exp(-diffDays / 30)
}

/**
 * 関係者の一致度スコア (0〜1) — クエリ側 recall ベース
 * クエリで挙げた人物のうち Issue に含まれる割合
 * クエリに人物未入力の場合は 1.0（ペナルティなし）
 */
export function personSimilarity(queryPersons, issuePersons) {
  const qList = queryPersons.map(p => p.toLowerCase().trim()).filter(Boolean)
  if (!qList.length) return 1
  const issueSet = new Set(issuePersons.map(p => p.toLowerCase().trim()).filter(Boolean))
  const matched = qList.filter(p => issueSet.has(p)).length
  return matched / qList.length
}

// factor(x, α) = 1 - α + α×x  (α=0: 無効化, α=1: 生の値をそのまま使用)
function factor(x, alpha) {
  return 1 - alpha + alpha * x
}

/**
 * Issue1件に対する複合スコアを計算（掛け算モデル）
 * alphas: { text: 0〜1, date: 0〜1, person: 0〜1 }
 */
export function computeScore({ queryEmbedding, queryPersons, queryDate, issue, alphas }) {
  const textScore   = cosineSimilarity(queryEmbedding, issue.embedding)
  const latestDate  = issue.timeline.map(t => t.date).filter(Boolean).sort().at(-1)
  const dateScore   = dateSimilarity(queryDate, latestDate)
  const personScore = personSimilarity(queryPersons, issue.persons)

  const total = factor(textScore, alphas.text)
              * factor(dateScore, alphas.date)
              * factor(personScore, alphas.person)

  return { textScore, dateScore, personScore, total }
}
