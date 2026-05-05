# IssueMatch

多言語対応のIssue分類デモアプリです。  
自然文（日本語・英語・中国語など）を入力すると、登録済みIssueとの類似度をベクトル検索で判定します。

## 仕組み

```
入力テキスト
    ↓ OpenAI text-embedding-3-small（多言語埋め込み）
ベクトル (1536次元)
    ↓ コサイン類似度 × テキスト重み
    ↓ 日付近接スコア   × 日付重み
    ↓ 関係者一致度     × 人物重み
複合スコア → 既存Issueへの紐付け or 新規Issue判定
```

## ローカルでの開発

```bash
# 1. リポジトリをクローン
git clone https://github.com/YOUR_USERNAME/issuematch.git
cd issuematch

# 2. 依存パッケージをインストール
npm install

# 3. 開発サーバー起動
npm run dev
```

ブラウザで http://localhost:5173 を開いてください。  
APIキーはアプリ画面上で入力します（sessionStorageにのみ保存）。

## GitHub Pages へのデプロイ

```bash
# ビルド（docs/ フォルダに出力されます）
npm run build

# docs/ をコミットして main にプッシュ
git add docs/
git commit -m "build"
git push origin main
```

GitHub リポジトリの Settings → Pages で以下を設定してください。

- **Source**: Deploy from a branch
- **Branch**: `main` / `docs`

## スコアリング

| スコア | 計算方法 |
|---|---|
| Text Similarity | コサイン類似度（埋め込みベクトル） |
| Date Proximity | 指数減衰 `exp(-Δday/30)` |
| Person Match | Jaccard係数（名前の集合重複率） |

複合スコアが **45%未満** の場合は「NEW ISSUE」と判定されます。

## 注意事項

- APIキーはブラウザの sessionStorage にのみ保存されます（タブを閉じると消えます）
- Issueデータはページリロードで消えます（POC用途）
- 本番利用にはバックエンドサーバーでAPIキー管理を推奨
