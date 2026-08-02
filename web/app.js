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
  const views = ["home", "quiz", "result", "flash"];
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
