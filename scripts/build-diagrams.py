#!/usr/bin/env python3
"""data/diagrams/*.json(図解ブリーフ)を検証し、SVG とギャラリーを生成する。

  1. zukai-creator 同梱の check-diagram-brief.py + 本リポジトリ固有ルールで検証
  2. Mermaid を mermaid-cli で SVG に事前レンダリング(アプリはこの SVG を表示するだけ)
  3. web/ と iOS バンドルへ配布、Web 用マニフェストを生成
  4. docs/diagrams/README.md(GitHub 上で描画されるギャラリー)を生成

使い方: python3 scripts/build-diagrams.py [--force]
SVG は内容ハッシュが変わったときだけ再生成する(--force で全再生成)。
手順の詳細は docs/DIAGRAM-WORKFLOW.md を参照。
"""
import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BRIEF_DIR = ROOT / "data" / "diagrams"
QUESTIONS = ROOT / "data" / "questions.json"
CHECKER = ROOT / ".claude" / "skills" / "zukai-creator" / "scripts" / "check-diagram-brief.py"
MMDC = ROOT / "node_modules" / ".bin" / "mmdc"
MERMAID_CONFIG = ROOT / "scripts" / "mermaid.config.json"
WEB_SVG_DIR = ROOT / "web" / "diagrams"
IOS_SVG_DIR = ROOT / "ios" / "AWSStudy.swiftpm" / "Resources" / "diagrams"
WEB_MANIFEST = ROOT / "web" / "data" / "diagrams.js"
GALLERY = ROOT / "docs" / "diagrams" / "README.md"

# 共通スタイル(docs/DIAGRAM-WORKFLOW.md 第4節)。各図の末尾に自動で付与する。
CLASS_DEFS = """
    classDef req fill:#e3f2fd,stroke:#1565c0,stroke-width:1px,color:#0d2b45
    classDef judge fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:#0d2b45
    classDef best fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,color:#12331a
    classDef alt fill:#f5f5f5,stroke:#9e9e9e,stroke-width:1px,color:#3c3c3c
    classDef svc fill:#ffffff,stroke:#607d8b,stroke-width:1px,color:#22303a
    classDef note fill:#fffde7,stroke:#c0a03c,stroke-width:1px,color:#43380d
"""
KNOWN_CLASSES = {"req", "judge", "best", "alt", "svc", "note"}
HASH_MARK = "diagram-source-hash:"


def die(msg: str) -> None:
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def load_questions() -> dict:
    data = json.loads(QUESTIONS.read_text(encoding="utf-8"))
    return {q["id"]: q for q in data["questions"]}


def check_local_rules(path: Path, brief: dict, questions: dict) -> None:
    qid = brief.get("question_id", "")
    if qid != path.stem:
        die(f"{path.name}: question_id({qid!r})とファイル名が一致しません")
    if qid not in questions:
        die(f"{path.name}: question_id {qid!r} は data/questions.json に存在しません")
    mermaid = brief.get("mermaid", "").strip()
    if not mermaid:
        die(f"{path.name}: mermaid が空です")
    if "classDef" in mermaid:
        die(f"{path.name}: classDef は生成時に自動付与します。mermaid から削除してください")
    for line in mermaid.splitlines():
        for token in line.split(":::")[1:]:
            name = token.split()[0].strip("\"'[](){}<>|-,;")
            if name not in KNOWN_CLASSES:
                die(f"{path.name}: 未定義のスタイルクラス :::{name}(使えるのは {sorted(KNOWN_CLASSES)})")


def mermaid_source(brief: dict) -> str:
    return brief["mermaid"].rstrip() + "\n" + CLASS_DEFS.strip("\n") + "\n"


def source_hash(source: str) -> str:
    payload = source + MERMAID_CONFIG.read_text(encoding="utf-8")
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:16]


def needs_render(svg_path: Path, digest: str, force: bool) -> bool:
    if force or not svg_path.exists():
        return True
    head = svg_path.read_text(encoding="utf-8")[:400]
    return f"{HASH_MARK} {digest}" not in head


def render_svg(qid: str, source: str, digest: str, svg_path: Path) -> None:
    """mermaid-cli で SVG を生成し、コンテナ幅に追従するよう後処理する。"""
    if not MMDC.exists():
        die("mermaid-cli が見つかりません。リポジトリ直下で `npm install` を実行してください")
    with tempfile.TemporaryDirectory() as tmp:
        mmd = Path(tmp) / f"{qid}.mmd"
        out = Path(tmp) / f"{qid}.svg"
        mmd.write_text(source, encoding="utf-8")
        result = subprocess.run(
            [str(MMDC), "-i", str(mmd), "-o", str(out),
             "-c", str(MERMAID_CONFIG), "-I", f"diagram-{qid}", "-b", "white", "-q"],
            capture_output=True, text=True,
        )
        if result.returncode != 0 or not out.exists():
            die(f"{qid}: SVG 生成に失敗しました\n{result.stdout}\n{result.stderr}")
        svg = out.read_text(encoding="utf-8")

    # mmdc は max-width をインラインで焼き込むため、表示幅がここで頭打ちになる。
    # コンテナ幅いっぱいに拡大縮小させたいので style を差し替える(背景の白は残す)。
    svg, n = re.subn(r'(<svg[^>]*?)\sstyle="[^"]*"', r'\1 style="background-color:#ffffff;"', svg, count=1)
    if n != 1:
        die(f"{qid}: 生成された SVG の style 属性を書き換えられませんでした(mermaid-cli の出力仕様変更?)")
    header = (f"<!-- 自動生成ファイル — 直接編集禁止。data/diagrams/{qid}.json を編集して "
              f"scripts/build-diagrams.py を実行すること。{HASH_MARK} {digest} -->\n")
    svg_path.parent.mkdir(parents=True, exist_ok=True)
    svg_path.write_text(header + svg, encoding="utf-8")


def render_section(brief: dict, question: dict) -> str:
    correct = question["choices"][question["answer"]]
    others = [c for i, c in enumerate(question["choices"]) if i != question["answer"]]
    lines = [
        f"## {question['id']} — {question['category']} / level {question['level']}",
        "",
        f"**問題**: {question['question']}",
        "",
        f"**正解**: {correct}",
        "",
        "**他の選択肢**: " + " / ".join(others),
        "",
        f"**図解の主メッセージ**: {brief['message']}",
        "",
        f"**採用パターン**: {brief['selected_pattern']}"
        + (f"(候補: {' / '.join(brief.get('candidate_patterns', []))})" if brief.get("candidate_patterns") else ""),
        "",
        "```mermaid",
        mermaid_source(brief).rstrip(),
        "```",
        "",
        f"アプリ表示用の SVG: [`web/diagrams/{question['id']}.svg`](../../web/diagrams/{question['id']}.svg)",
        "",
        f"**解説**: {question['explanation']}",
        "",
    ]
    if brief.get("open_questions"):
        lines += ["**確認事項**: " + " / ".join(brief["open_questions"]), ""]
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description="図解ブリーフの検証・SVG生成・ギャラリー生成")
    parser.add_argument("--force", action="store_true", help="SVG を無条件に再生成する")
    args = parser.parse_args()

    questions = load_questions()
    paths = sorted(BRIEF_DIR.glob("*.json"))
    if not paths:
        die(f"図解ブリーフがありません: {BRIEF_DIR}")

    sections, ids = [], []
    for path in paths:
        result = subprocess.run(
            [sys.executable, str(CHECKER), str(path)], capture_output=True, text=True
        )
        if result.returncode != 0:
            die(f"{path.name}: {result.stderr.strip()}")
        brief = json.loads(path.read_text(encoding="utf-8"))
        check_local_rules(path, brief, questions)

        qid = brief["question_id"]
        source = mermaid_source(brief)
        digest = source_hash(source)
        svg_path = WEB_SVG_DIR / f"{qid}.svg"
        if needs_render(svg_path, digest, args.force):
            render_svg(qid, source, digest, svg_path)
            print(f"SVG生成: {svg_path.relative_to(ROOT)}")
        else:
            print(f"SVG最新: {svg_path.relative_to(ROOT)}")

        IOS_SVG_DIR.mkdir(parents=True, exist_ok=True)
        shutil.copy2(svg_path, IOS_SVG_DIR / f"{qid}.svg")

        sections.append(render_section(brief, questions[qid]))
        ids.append(qid)

    # Web は file:// でも動かすため、図解の有無は fetch ではなくマニフェストで判定する
    WEB_MANIFEST.write_text(
        "// 自動生成ファイル — 直接編集禁止。scripts/build-diagrams.py が生成する。\n"
        "// 図解 SVG(web/diagrams/<問題ID>.svg)を持つ問題IDの一覧。\n"
        f"window.QUIZ_DIAGRAMS = {json.dumps(ids, ensure_ascii=False)};\n",
        encoding="utf-8",
    )

    header = [
        "# 問題図解ギャラリー",
        "",
        "**自動生成ファイル — 直接編集禁止。**",
        "`data/diagrams/<問題ID>.json` を編集して `python3 scripts/build-diagrams.py` を実行すること",
        "(手順: [DIAGRAM-WORKFLOW.md](../DIAGRAM-WORKFLOW.md))。",
        "",
        f"収録: {len(sections)} 問 / 全 {len(questions)} 問",
        "",
        "---",
        "",
        "",
    ]
    GALLERY.parent.mkdir(parents=True, exist_ok=True)
    GALLERY.write_text("\n".join(header) + "\n---\n\n".join(sections), encoding="utf-8")
    print(f"OK: {len(ids)} 問 — SVG(web/ios)・{WEB_MANIFEST.relative_to(ROOT)}・{GALLERY.relative_to(ROOT)} を更新しました")


if __name__ == "__main__":
    main()
