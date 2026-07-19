# AWS Study — ゼロコスト AWS 資格対策アプリ

AWS 認定(SAA レベル)の勉強用クイズアプリ。**Web版**と**iOS版**の2つを同梱し、サーバー・課金要素なしで動作します。

- 問題: 30問 / 6カテゴリ(コンピューティング・ストレージ・ネットワーク・セキュリティIAM・データベース・サーバーレス運用)、全問に詳しい解説付き
- 機能: ランダム10問クイズ / カテゴリ別クイズ / 弱点復習(間違えた問題だけ再出題) / フラッシュカード / 進捗・正答率・連続正解ストリーク

## 使い方

### Web版(すぐ使える)

```bash
open web/index.html
```

ブラウザで開くだけ。ビルド・サーバー不要。キーボード操作対応(1–4 で解答、Enter で次へ、フラッシュカードは Space / ←→)。
GitHub Pages で公開する場合は `web/` を公開ディレクトリに設定するだけです(無料)。

### iOS版

`ios/AWSStudy.swiftpm` を **Xcode** で開いて実行(シミュレータ or 実機)。iPad なら **Swift Playgrounds** アプリでも直接実行できます。
App Playground 形式のため、有料の Apple Developer Program は不要です(無料 Apple ID で実機インストール可)。

## リポジトリ構成

```
data/questions.json         問題データの単一ソース(編集はここだけ)
scripts/sync-questions.sh   Web / iOS へ問題データを配布
web/                        Web版(静的 HTML/CSS/JS)
ios/AWSStudy.swiftpm/       iOS版(SwiftUI App Playground)
docs/architecture.md        アーキテクチャ図(毎時レビュー対象)
docs/RULES.md               運用規約(ブランチ運用・データ管理・レビュールーチン)
docs/archive/               旧計画ドキュメント(2026-07-04 時点の未実装構想)
```

## 問題を追加するには

1. `data/questions.json` に問題を追記(書式と品質基準は [docs/RULES.md](docs/RULES.md) 参照)
2. `scripts/sync-questions.sh` を実行
3. 生成物ごとコミット
