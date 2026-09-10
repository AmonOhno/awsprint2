/* AWS Study — ゼロコスト静的クイズアプリ
 * データ: window.QUIZ_DATA(data/questions.js、単一ソースは data/questions.json)
 * 図解: window.QUIZ_DIAGRAMS(data/diagrams.js)+ diagrams/<問題ID>.svg(事前生成)
 * 進捗: localStorage のみ(サーバー通信なし) */
(() => {
  "use strict";

  const QUESTIONS = window.QUIZ_DATA.questions;
  // 図解を持つ問題ID。file:// でも動くよう、存在確認は fetch ではなくこの一覧で行う
  const DIAGRAM_IDS = new Set(window.QUIZ_DIAGRAMS || []);
  const STORAGE_KEY = "awsstudy.progress.v1";

  // ---- 進捗ストア -------------------------------------------------------
  // progress: { [questionId]: { attempts, correct, wrongStreak } }, streak: 連続正解数
  const store = {
    data: load(),
    get(id) {
      return this.data.progress[id] || { attempts: 0, correct: 0, wrongStreak: 0 };
    },
    record(id, isCorrect) {
      const p = this.get(id);
      p.attempts += 1;
      if (isCorrect) {
        p.correct += 1;
        p.wrongStreak = 0;
        this.data.streak += 1;
      } else {
        p.wrongStreak += 1;
        this.data.streak = 0;
      }
      this.data.progress[id] = p;
      save(this.data);
    },
    reset() {
      this.data = { progress: {}, streak: 0 };
      save(this.data);
    },
    // 要復習 = 直近で間違えたまま正解し直していない問題
    weakIds() {
      return QUESTIONS.filter((q) => this.get(q.id).wrongStreak > 0).map((q) => q.id);
    },
    // 習得済み = 2回以上正解し、直近も正解している問題
    masteredIds() {
      return QUESTIONS.filter((q) => {
        const p = this.get(q.id);
        return p.correct >= 2 && p.wrongStreak === 0;
      }).map((q) => q.id);
    },
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) { /* 破損時は初期化 */ }
    return { progress: {}, streak: 0 };
  }
  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  // ---- ビュー切り替え ---------------------------------------------------
  const views = ["home", "quiz", "result", "flash", "guide"];
  function show(name) {
    views.forEach((v) => {
      document.getElementById(`view-${v}`).hidden = v !== name;
    });
    window.scrollTo(0, 0);
  }

  const $ = (id) => document.getElementById(id);

  // ---- ホーム画面 -------------------------------------------------------
  function renderHome() {
    const answered = QUESTIONS.filter((q) => store.get(q.id).attempts > 0);
    const attempts = QUESTIONS.reduce((n, q) => n + store.get(q.id).attempts, 0);
    const corrects = QUESTIONS.reduce((n, q) => n + store.get(q.id).correct, 0);
    const weak = store.weakIds();

    $("stat-answered").textContent = `${answered.length}/${QUESTIONS.length}`;
    $("stat-accuracy").textContent = attempts ? `${Math.round((corrects / attempts) * 100)}%` : "–";
    $("stat-mastered").textContent = store.masteredIds().length;
    $("stat-weak").textContent = weak.length;
    $("review-count").textContent = weak.length;
    $("btn-review").disabled = weak.length === 0;
    $("diagram-count").textContent = DIAGRAM_IDS.size;
    $("btn-diagram-quiz").disabled = DIAGRAM_IDS.size === 0;

    const streak = store.data.streak;
    $("streak-badge").hidden = streak < 2;
    $("streak-count").textContent = streak;

    const categories = [...new Set(QUESTIONS.map((q) => q.category))];
    const grid = $("category-grid");
    grid.innerHTML = "";
    categories.forEach((cat) => {
      const qs = QUESTIONS.filter((q) => q.category === cat);
      const done = qs.filter((q) => {
        const p = store.get(q.id);
        return p.correct > 0 && p.wrongStreak === 0;
      }).length;
      const card = document.createElement("button");
      card.className = "category-card";
      card.innerHTML = `
        <div class="category-name"><span>${cat}</span><span class="category-count">${done}/${qs.length}</span></div>
        <div class="category-bar"><div class="category-bar-fill" style="width:${(done / qs.length) * 100}%"></div></div>`;
      card.addEventListener("click", () => startQuiz(shuffle(qs), cat));
      grid.appendChild(card);
    });
    show("home");
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---- クイズ -----------------------------------------------------------
  const quiz = { list: [], index: 0, correct: 0, wrongIds: [], label: "", answered: false };

  function startQuiz(list, label) {
    if (!list.length) return;
    Object.assign(quiz, { list, index: 0, correct: 0, wrongIds: [], label, answered: false });
    renderQuestion();
    show("quiz");
  }

  function renderQuestion() {
    const q = quiz.list[quiz.index];
    quiz.answered = false;
    $("quiz-category").textContent = quiz.label;
    $("quiz-progress-text").textContent = `${quiz.index + 1} / ${quiz.list.length} 問`;
    $("quiz-progress-bar").style.width = `${(quiz.index / quiz.list.length) * 100}%`;
    $("question-text").textContent = q.question;
    $("explanation").hidden = true;
    $("btn-next").hidden = true;

    // 選択肢は毎回シャッフル(正解の位置を覚えてしまうのを防ぐ)
    const order = shuffle(q.choices.map((_, i) => i));
    const box = $("choices");
    box.innerHTML = "";
    order.forEach((choiceIdx, pos) => {
      const btn = document.createElement("button");
      btn.className = "choice";
      btn.dataset.choiceIdx = choiceIdx;
      btn.innerHTML = `<span class="key">${pos + 1}</span><span>${q.choices[choiceIdx]}</span>`;
      btn.addEventListener("click", () => answer(choiceIdx, btn));
      box.appendChild(btn);
    });
  }

  function answer(choiceIdx, clickedBtn) {
    if (quiz.answered) return;
    quiz.answered = true;
    const q = quiz.list[quiz.index];
    const isCorrect = choiceIdx === q.answer;
    store.record(q.id, isCorrect);
    if (isCorrect) quiz.correct += 1;
    else quiz.wrongIds.push(q.id);

    document.querySelectorAll("#choices .choice").forEach((btn) => {
      btn.disabled = true;
      const idx = Number(btn.dataset.choiceIdx);
      if (idx === q.answer) btn.classList.add("correct");
      else if (btn === clickedBtn) btn.classList.add("wrong");
      else btn.classList.add("dimmed");
    });

    const head = $("explanation-head");
    head.textContent = isCorrect ? "✓ 正解!" : "✗ 不正解";
    head.className = `explanation-head ${isCorrect ? "ok" : "ng"}`;
    $("explanation-text").textContent = q.explanation;
    showDiagram(q);
    $("explanation").hidden = false;
    $("btn-next").hidden = false;
    $("btn-next").textContent = quiz.index + 1 < quiz.list.length ? "次の問題 ⏎" : "結果を見る ⏎";
    $("btn-next").focus();
  }

  // 図解は全問には付いていないため、ある問題だけ解説の下に表示する
  function showDiagram(q) {
    const fig = $("diagram");
    const img = $("diagram-img");
    if (!DIAGRAM_IDS.has(q.id)) {
      fig.hidden = true;
      img.removeAttribute("src");
      return;
    }
    img.src = `diagrams/${q.id}.svg`;
    img.alt = `${q.choices[q.answer]} を選ぶ判断の分かれ目を示した図解`;
    fig.hidden = false;
  }

  function next() {
    if (quiz.index + 1 < quiz.list.length) {
      quiz.index += 1;
      renderQuestion();
    } else {
      renderResult();
    }
  }

  function renderResult() {
    const rate = quiz.correct / quiz.list.length;
    $("result-correct").textContent = quiz.correct;
    $("result-total").textContent = quiz.list.length;
    const [emoji, title, msg] =
      rate === 1 ? ["🏆", "全問正解!", "完璧です。次のカテゴリへ進みましょう。"]
      : rate >= 0.7 ? ["🎉", "合格ライン!", "SAA の合格ラインは約 72%。この調子で弱点を潰しましょう。"]
      : rate >= 0.4 ? ["📚", "あと一歩", "解説を読み直して、弱点復習モードで定着させましょう。"]
      : ["💪", "これから伸びる", "間違いは学習のチャンス。解説を読んでもう一度挑戦しましょう。"];
    $("result-emoji").textContent = emoji;
    $("result-title").textContent = title;
    $("result-msg").textContent = msg;
    $("btn-retry-wrong").hidden = quiz.wrongIds.length === 0;
    show("result");
  }

  // ---- フラッシュカード -------------------------------------------------
  const flash = { list: [], index: 0 };

  function startFlash() {
    flash.list = shuffle(QUESTIONS);
    flash.index = 0;
    renderFlash();
    show("flash");
    $("flashcard").focus();
  }

  function renderFlash() {
    const q = flash.list[flash.index];
    $("flashcard").classList.remove("flipped");
    $("flash-progress-text").textContent = `${flash.index + 1} / ${flash.list.length} 枚`;
    $("flash-front-text").textContent = q.question;
    $("flash-answer-text").textContent = q.choices[q.answer];
    $("flash-exp-text").textContent = q.explanation;
  }

  function flashMove(delta) {
    flash.index = (flash.index + delta + flash.list.length) % flash.list.length;
    renderFlash();
  }

  // ---- 試験ガイド閲覧 ---------------------------------------------------
  // window.EXAM_GUIDE(data/exam-guide.js)を読み、覚えるべき用語をタップ可能にする。
  const GUIDE = window.EXAM_GUIDE || null;
  const GLOSSARY = (GUIDE && GUIDE.glossary) || {};

  // 本文の [[termId|表示テキスト]] を、クリックで説明が開くチップに変換して container へ追加する。
  // 未知の用語IDはそのまま文字として表示し、壊れないようにする(データ入力ミスに強く)。
  function appendRichText(container, text) {
    const re = /\[\[([^\]]+)\]\]/g;
    let last = 0, m;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) container.appendChild(document.createTextNode(text.slice(last, m.index)));
      const [id, label] = m[1].split("|");
      const entry = GLOSSARY[id];
      if (entry) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "term";
        btn.textContent = label || entry.term;
        btn.setAttribute("aria-label", `${label || entry.term} の説明を開く`);
        btn.addEventListener("click", () => openTermDialog(id));
        container.appendChild(btn);
      } else {
        container.appendChild(document.createTextNode(label || id));
      }
      last = re.lastIndex;
    }
    if (last < text.length) container.appendChild(document.createTextNode(text.slice(last)));
  }

  // 用語説明ダイアログ。<dialog> のネイティブ機能(Esc・フォーカス管理)を活用する。
  const termDialog = $("term-dialog");
  function openTermDialog(id) {
    const entry = GLOSSARY[id];
    if (!entry) return;
    $("term-dialog-title").textContent = entry.term;
    const reading = $("term-dialog-reading");
    reading.textContent = entry.reading || "";
    reading.hidden = !entry.reading;
    $("term-dialog-desc").textContent = entry.desc;
    if (typeof termDialog.showModal === "function") termDialog.showModal();
    else termDialog.setAttribute("open", ""); // 古い環境向けフォールバック
  }
  function closeTermDialog() {
    if (typeof termDialog.close === "function") termDialog.close();
    else termDialog.removeAttribute("open");
  }

  let guideRendered = false;
  function renderGuide() {
    if (!GUIDE) return;
    if (!guideRendered) {
      buildGuide();
      guideRendered = true;
    }
    show("guide");
  }

  function buildGuide() {
    const { meta, sections } = GUIDE;
    $("guide-code").textContent = meta.code;
    $("guide-title").textContent = meta.title;
    $("guide-note").textContent = meta.updatedNote;
    const src = $("guide-source");
    src.href = meta.sourceUrl;

    const facts = $("guide-facts");
    facts.innerHTML = "";
    meta.facts.forEach((f) => {
      const el = document.createElement("div");
      el.className = "fact";
      el.innerHTML = `<div class="fact-label"></div><div class="fact-value"></div>`;
      el.querySelector(".fact-label").textContent = f.label;
      el.querySelector(".fact-value").textContent = f.value;
      facts.appendChild(el);
    });

    const toc = $("guide-toc");
    const body = $("guide-body");
    toc.innerHTML = "";
    body.innerHTML = "";

    sections.forEach((sec) => {
      const link = document.createElement("a");
      link.className = "toc-link";
      link.href = `#guide-${sec.id}`;
      link.textContent = sec.title;
      link.addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById(`guide-${sec.id}`).scrollIntoView({ behavior: "smooth", block: "start" });
      });
      toc.appendChild(link);

      const secEl = document.createElement("section");
      secEl.className = "guide-section";
      secEl.id = `guide-${sec.id}`;
      const h = document.createElement("h2");
      h.textContent = sec.title;
      secEl.appendChild(h);
      sec.blocks.forEach((b) => secEl.appendChild(renderBlock(b)));
      body.appendChild(secEl);
    });
  }

  function renderBlock(b) {
    if (b.type === "p") {
      const p = document.createElement("p");
      p.className = "guide-p";
      appendRichText(p, b.text);
      return p;
    }
    if (b.type === "ul") {
      const ul = document.createElement("ul");
      ul.className = "guide-ul";
      b.items.forEach((it) => {
        const li = document.createElement("li");
        appendRichText(li, it);
        ul.appendChild(li);
      });
      return ul;
    }
    if (b.type === "domain") {
      const card = document.createElement("div");
      card.className = "domain-card";
      const head = document.createElement("div");
      head.className = "domain-head";
      const title = document.createElement("div");
      title.className = "domain-title";
      title.textContent = `分野 ${b.num}: ${b.title}`;
      const weight = document.createElement("span");
      weight.className = "domain-weight";
      weight.textContent = `${b.weight}%`;
      head.appendChild(title);
      head.appendChild(weight);
      card.appendChild(head);

      const bar = document.createElement("div");
      bar.className = "domain-bar";
      const fill = document.createElement("div");
      fill.className = "domain-bar-fill";
      fill.style.width = `${b.weight}%`;
      bar.appendChild(fill);
      card.appendChild(bar);

      b.tasks.forEach((task) => {
        const t = document.createElement("div");
        t.className = "task";
        const tt = document.createElement("div");
        tt.className = "task-title";
        tt.textContent = task.t;
        const td = document.createElement("div");
        td.className = "task-detail";
        appendRichText(td, task.detail);
        t.appendChild(tt);
        t.appendChild(td);
        card.appendChild(t);
      });
      return card;
    }
    if (b.type === "services") {
      const wrap = document.createElement("div");
      wrap.className = "service-groups";
      b.groups.forEach((g) => {
        const grp = document.createElement("div");
        grp.className = "service-group";
        const name = document.createElement("div");
        name.className = "service-group-name";
        name.textContent = g.name;
        grp.appendChild(name);
        const chips = document.createElement("div");
        chips.className = "service-chips";
        g.terms.forEach((id) => {
          const entry = GLOSSARY[id];
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "term term-chip";
          btn.textContent = entry ? entry.term : id;
          btn.addEventListener("click", () => openTermDialog(id));
          chips.appendChild(btn);
        });
        grp.appendChild(chips);
        wrap.appendChild(grp);
      });
      return wrap;
    }
    return document.createElement("div");
  }

  // ---- イベント登録 -----------------------------------------------------
  $("btn-home").addEventListener("click", renderHome);
  $("btn-random").addEventListener("click", () => startQuiz(shuffle(QUESTIONS).slice(0, 10), "ランダム10問"));
  $("btn-review").addEventListener("click", () => {
    const ids = new Set(store.weakIds());
    startQuiz(shuffle(QUESTIONS.filter((q) => ids.has(q.id))), "弱点復習");
  });
  // 図解があるのは一部の問題だけなので、そこだけを出題する導線を用意する
  $("btn-diagram-quiz").addEventListener("click", () => {
    startQuiz(shuffle(QUESTIONS.filter((q) => DIAGRAM_IDS.has(q.id))), "図解つき問題");
  });
  $("btn-flash").addEventListener("click", startFlash);
  $("btn-guide").addEventListener("click", renderGuide);
  $("btn-guide").disabled = !GUIDE;
  $("btn-guide-home").addEventListener("click", renderHome);
  // ダイアログ: ✕ ボタン / 背景クリックで閉じる(Esc はネイティブで対応)
  $("term-dialog-close").addEventListener("click", closeTermDialog);
  termDialog.addEventListener("click", (e) => {
    if (e.target === termDialog) closeTermDialog(); // backdrop クリック
  });
  $("btn-reset").addEventListener("click", () => {
    if (confirm("学習進捗をすべてリセットします。よろしいですか?")) {
      store.reset();
      renderHome();
    }
  });
  $("btn-next").addEventListener("click", next);
  $("btn-quit").addEventListener("click", renderHome);
  $("btn-result-home").addEventListener("click", renderHome);
  $("btn-retry-wrong").addEventListener("click", () => {
    const ids = new Set(quiz.wrongIds);
    startQuiz(shuffle(QUESTIONS.filter((q) => ids.has(q.id))), "間違い直し");
  });
  $("flashcard").addEventListener("click", () => $("flashcard").classList.toggle("flipped"));
  $("btn-flash-prev").addEventListener("click", () => flashMove(-1));
  $("btn-flash-next").addEventListener("click", () => flashMove(1));
  $("btn-flash-quit").addEventListener("click", renderHome);

  document.addEventListener("keydown", (e) => {
    if (!$("view-quiz").hidden) {
      if (e.key >= "1" && e.key <= "4" && !quiz.answered) {
        const btn = document.querySelectorAll("#choices .choice")[Number(e.key) - 1];
        if (btn) btn.click();
      } else if (e.key === "Enter" && quiz.answered) {
        next();
      }
    } else if (!$("view-flash").hidden) {
      if (e.key === " ") {
        e.preventDefault();
        $("flashcard").classList.toggle("flipped");
      } else if (e.key === "ArrowRight") flashMove(1);
      else if (e.key === "ArrowLeft") flashMove(-1);
    }
  });

  renderHome();
})();
