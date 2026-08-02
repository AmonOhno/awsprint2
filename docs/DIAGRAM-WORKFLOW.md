# 問題図解ワークフロー(zukai-creator)

各問題に「解答の判断構造がひと目でわかる図」を1枚ずつ付けるための手順とルール。
図解の設計手順そのものは、リポジトリ同梱のスキル [`.claude/skills/zukai-creator`](../.claude/skills/zukai-creator/SKILL.md)(出典: <https://github.com/53able/skills>)に従う。

## 1. ファイル構成

```
.claude/skills/zukai-creator/         スキル本体(SKILL.md / pattern-catalog / review-checklist / 検証スクリプト)
data/diagrams/<問題ID>.json           図解ブリーフ = 単一ソース(手で編集するのはここだけ)
scripts/build-diagrams.py             ブリーフの検証 + SVG生成 + 配布 + ギャラリー生成
scripts/mermaid.config.json           mermaid-cli のテーマ設定(フォント・線色・折り返し幅)
web/diagrams/<問題ID>.svg              自動生成(Web版が表示する)
web/data/diagrams.js                  自動生成(図解を持つ問題IDの一覧)
ios/.../Resources/diagrams/<問題ID>.svg 自動生成(iOS版が表示する)
docs/diagrams/README.md               自動生成ギャラリー(GitHub 上で Mermaid が描画される・編集禁止)
```

初回だけ、リポジトリ直下で `npm install` を実行して mermaid-cli(開発依存・無料)を入れる。
アプリ本体は SVG を表示するだけなので、実行時の依存は増えない([RULES.md](RULES.md) 第2節のゼロコスト原則を満たす)。

問題文・選択肢・解説は `data/questions.json` にしかない。ブリーフには `question_id` だけを持たせ、
文面はギャラリー生成時に単一ソースから引く(二重管理を作らない)。

## 2. 1問あたりの手順

1. `data/questions.json` から対象問題(問題文・選択肢・解説)を読む。
2. zukai-creator の Step 1〜5 を実施する。図解の**主メッセージは「なぜその選択肢が最適か」の判断軸**に固定する。
   - 問題文と解説に書かれていない性能値・制約・因果を創作しない(解説の範囲内で描く)。
   - 少なくとも2つの候補パターンを出し、単純な方を選ぶ(`candidate_patterns` に両方残す)。
3. `data/diagrams/<問題ID>.json` を書く。テンプレートは `.claude/skills/zukai-creator/assets/diagram-brief-template.json`
   に本リポジトリ独自の `question_id` / `mermaid` を足したもの(→ 第3節)。
4. `python3 scripts/build-diagrams.py` を実行する(検証 → SVG生成 → Web/iOS へ配布 → ギャラリー再生成)。
   SVG は Mermaid の内容ハッシュが変わったものだけ再生成する。全再生成は `--force`。
5. zukai-creator の `references/review-checklist.md` で見直す。特に
   「図が一文で何を語っているか」が問題の解説と一致するかを確認する。
6. ブリーフと生成物(`docs/diagrams/README.md`)を同じコミットに含める。

## 3. ブリーフのスキーマ

スキル標準のフィールド(`purpose` / `audience` / `message` / `source_summary` / `elements` /
`relationships` / `groups` / `candidate_patterns` / `selected_pattern` / `style_rules` / `open_questions`)に加えて:

| フィールド | 内容 |
|---|---|
| `question_id` | `data/questions.json` の `id`。ファイル名と一致させる |
| `mermaid` | 完成図。Mermaid の `flowchart` 記法(GitHub がそのまま描画できる) |

`elements[].id` は図中のノードIDと合わせる。`relationships[].from` / `to` は `elements[].id` を参照する
(未定義IDを参照すると検証で落ちる)。

## 4. 共通スタイルルール(全問共通・崩さない)

400問を通して同じ意味が同じ見た目になるようにする。

| 種別 | 意味 | Mermaid クラス |
|---|---|---|
| 角丸/矩形・青 | 要件・前提条件(問題文が与える条件) | `req` |
| 菱形・青 | 判断ポイント(何で決まるか) | `judge` |
| 矩形・緑 | 正解につながる構成要素 | `best` |
| 矩形・グレー | 実在するが要件を満たさない選択肢 | `alt` |
| 矩形・白 | AWS サービス・一般の構成要素 | `svc` |
| 破線枠・薄字 | 注釈(誤読しやすい点の補足) | `note` |

- 線: 実線矢印 = 主たる流れ・判断の進行、破線矢印 = 条件付き/弱い関係。
- コネクタのラベルは短い動詞句にする。
- グループ化は **`subgraph` の枠のみ**を使う(背景色との重ねがけをしない)。
- 太字は主メッセージを担うノードだけ。アイコン・絵文字は使わない。

Mermaid の `classDef` は生成スクリプトが各図に自動で付与するので、ブリーフ側の `mermaid` には
`:::req` のようなクラス指定だけを書き、`classDef` 行は書かない。

## 5. アプリへの表示(事前SVG化)

**Mermaid はビルド時に SVG へ変換し、アプリは出来上がった SVG を表示するだけ**にしている
(2026-08-02 決定)。実行時に Mermaid ランタイムを読み込まないので、CDN 依存もオフライン動作の心配もない。

- **Web版**: クイズの解説カード内に `<img src="diagrams/<問題ID>.svg">` で表示する。
  図解の有無は `web/data/diagrams.js` のIDリストで判定する(`file://` で開いても `fetch` が要らない形)。
- **iOS版**: SwiftUI は SVG を直接描画できないため、`DiagramView.swift` が WKWebView に
  SVG マークアップを埋め込んで表示する。縦横比は SVG の `viewBox` から読み、`aspectRatio` に渡す。
  バンドル内では SwiftPM の `.process("Resources")` によりフォルダ構造が平坦化され、
  `diagrams/cmp01.svg` は `cmp01.svg` として入る(ローダーは両方のパスを試す)。
- SVG は白背景を焼き込んである。Web版のダークテーマ上でも「図版カード」として読めるようにするため。
- 図解は全問には無い。無い問題では図解の枠ごと非表示にする(Web・iOS とも)。
