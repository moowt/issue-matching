/**
 * OpenAI text-embedding-3-small を使って多言語テキストをベクトル化する
 * APIキーは呼び出し元から渡す（画面で入力 → sessionStorage に保持）
 */

const EMBEDDING_MODEL = 'text-embedding-3-small'

/**
 * テキスト → 埋め込みベクトル (number[])
 * @param {string} text
 * @param {string} apiKey  OpenAI APIキー
 */
export async function fetchEmbedding(text, apiKey) {
  if (!apiKey) {
    throw new Error('OpenAI APIキーが設定されていません')
  }

  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: text,
      model: EMBEDDING_MODEL,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`OpenAI API error ${res.status}: ${err?.error?.message ?? res.statusText}`)
  }

  const data = await res.json()
  return data.data[0].embedding // number[]
}

/**
 * コサイン類似度 (0〜1)
 */
export function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-10)
}
