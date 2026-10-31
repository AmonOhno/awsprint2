# AWS Study — ゼロコスト AWS 資格対策アプリ

AWS 認定(SAA レベル)の勉強用クイズアプリ。**Web版**と**iOS版**の2つを同梱し、サーバー・課金要素なしで動作します。

- 問題: 400問 / 6カテゴリ(コンピューティング・ストレージ・ネットワーク・セキュリティIAM・データベース・サーバーレス運用)、全問に詳しい解説付き
- 難易度: level 1(基礎)60問 / level 2(応用)140問 / level 3(本試験レベル)200問
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
data/diagrams/<問題ID>.json  問題ごとの図解ブリーフ(単一ソース)
scripts/sync-questions.sh   Web / iOS へ問題データを配布
scripts/build-diagrams.py   図解の検証 + SVG生成 + Web/iOS へ配布 + ギャラリー生成
web/                        Web版(静的 HTML/CSS/JS + 生成済み SVG)
ios/AWSStudy.swiftpm/       iOS版(SwiftUI App Playground)
.claude/skills/zukai-creator/ 図解作成スキル(出典: github.com/53able/skills)
docs/architecture.md        アーキテクチャ図(毎時レビュー対象)
docs/DIAGRAM-WORKFLOW.md    問題図解の作り方・スキーマ・共通スタイル
docs/diagrams/README.md     問題図解ギャラリー(自動生成)
docs/RULES.md               運用規約(ブランチ運用・データ管理・レビュールーチン)
e2e/                        Web版のスモーク E2E(Playwright)
playwright.config.mjs       E2E 設定(retries=0・web/ を http.server で配信)
.github/workflows/          CI(E2E / Claude Code Review)
docs/archive/               旧計画ドキュメント(2026-07-04 時点の未実装構想)
```

## 問題を追加するには

1. `data/questions.json` に問題を追記(書式と品質基準は [docs/RULES.md](docs/RULES.md) 参照)
2. `scripts/sync-questions.sh` を実行
3. 生成物ごとコミット

## 問題の図解を追加するには

判断構造を1枚にまとめた図解を、問題ごとに付けていく(現在 3 問 / 400 問)。
図解は**ビルド時に SVG へ変換**され、クイズの解説欄に表示される(Web版・iOS版とも)。
アプリは出来上がった SVG を表示するだけなので、実行時の依存は増えない。

```bash
npm install                        # 初回のみ(mermaid-cli / 開発時だけの無料依存)
python3 scripts/build-diagrams.py  # 検証 → SVG生成 → Web・iOS へ配布 → ギャラリー生成
```

1. Claude Code で `zukai-creator` スキルを使い、`data/diagrams/<問題ID>.json` にブリーフを書く
2. `python3 scripts/build-diagrams.py` を実行(`--force` で全 SVG を再生成)
3. ブリーフと生成物をコミット

手順とスタイルルールの詳細は [docs/DIAGRAM-WORKFLOW.md](docs/DIAGRAM-WORKFLOW.md)、
できた図は[図解ギャラリー](docs/diagrams/README.md)で確認できる。

## CI(GitHub Actions)

PR の作成・更新(`opened` / `synchronize` / `reopened` / `ready_for_review`)で次の2つが動く。

| ワークフロー | 内容 | 失敗条件 |
| --- | --- | --- |
| [`e2e.yml`](.github/workflows/e2e.yml)(ジョブ名 `e2e (web smoke)`) | 問題データの同期チェック + Web版のスモーク E2E(Playwright / Chromium) | 生成物が単一ソースと食い違う、または E2E が1件でも失敗 |
| [`claude-code-review.yml`](.github/workflows/claude-code-review.yml) | Claude Code 公式 `code-review` プラグインで PR をレビューし、PR にコメント | (レビュー結果でマージは止めない) |

### E2E

```bash
npm ci                                   # 初回のみ(PUPPETEER_SKIP_DOWNLOAD=true を付けると mermaid 用 Chrome の取得を省ける)
npx playwright install chromium          # 初回のみ
CI=1 npx playwright test --retries=0     # CI と同条件で実行(npm run test:e2e でも可)
```

- 対象: ホーム / ランダム10問(解答→解説→結果・進捗保存)/ キーボード操作 / 弱点復習 / 間違い直し /
  図解つき問題(SVG 読み込み)/ フラッシュカード / 試験ガイド(用語ダイアログ)/ 進捗リセット。
- 「全件パス」を厳密にするため `--retries=0` 固定。リトライで通った flaky も合格扱いにしない。
  テストのスキップ・無効化(`test.skip` / `test.only` など)で緑にしないこと(CI では `test.only` があると失敗する)。
- アプリはゼロコスト原則によりサーバー通信を持たないため、モックは不要。代わりに**外部へのリクエストやコンソールエラーが
  発生したらテスト失敗**にしている。`web/` は Python 標準の `http.server` で配信する(追加サーバー不要)。
- 失敗時はスクリーンショット・トレース入りのレポートが Actions の Artifacts(`playwright-report`)に残る。
- **対象外: iOS版**。SwiftUI App Playground(`.swiftpm`)のビルド・UI テストには macOS + Xcode のランナーが必要で、
  macOS ランナーは Linux の 10 倍の分数を消費する(ゼロコスト原則に反する)うえ、App Playground 形式は
  `xcodebuild` での UI テスト実行が前提にしにくいため。iOS は従来どおり [docs/RULES.md](docs/RULES.md) 第6節の手動確認とする。
  図解ビルド(mermaid-cli)も Chrome の取得が必要で E2E とは独立しているため、このワークフローでは実行しない。

### Claude Code Review の初期設定(リポジトリ管理者が1回だけ行う)

1. **Claude GitHub App をインストール**: <https://github.com/apps/claude> からこのリポジトリにインストールする
   (Claude Code のターミナルで `/install-github-app` を実行しても可)。
2. **Secrets を登録**: GitHub の Settings → Secrets and variables → Actions → New repository secret で、次の**どちらか一方**を登録する。
   - `ANTHROPIC_API_KEY` — Anthropic Console で発行した API キー(従量課金)
   - `CLAUDE_CODE_OAUTH_TOKEN` — Claude Pro / Max プランの場合。ローカルで `claude setup-token` を実行して発行する
3. Draft PR と fork からの PR ではレビューは動かない(fork には Secrets が渡らないため)。Draft を Ready for review にすると動く。

### E2E を必須チェックにする(ブランチ保護)

1. 一度この PR などで `E2E` ワークフローを実行し、チェック名 `e2e (web smoke)` を GitHub に認識させる。
2. Settings → Branches → Add branch ruleset(または Branch protection rule)で対象ブランチに `main` を指定。
3. 「Require status checks to pass」を有効にし、`e2e (web smoke)` を追加する
   (「Require branches to be up to date before merging」も有効にすると、最新の main で通ったものだけマージできる)。
4. Claude Code Review はコメント用途のため必須チェックにはしない(API の一時障害でマージが止まるのを避ける)。

> 注: [docs/RULES.md](docs/RULES.md) 第1節のとおり現フェーズは main への直接 push も許可されている。
> 必須チェックは PR 経由の変更に効くため、直接 push する場合はローカルで E2E を実行してから push すること。
