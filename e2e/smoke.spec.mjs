// Web版の主要な画面フローを確認する最小限のスモーク E2E。
// アプリはサーバー通信なし(ゼロコスト原則)なので、外部へのリクエストが発生したら失敗にする。
import { test, expect } from "@playwright/test";

const TOTAL_QUESTIONS = 400;
const CATEGORY_COUNT = 6;

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  // 外部ネットワークは遮断(公式ガイドへのリンクは href を持つだけで、読み込みは発生しない)
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => {
    errors.push(`外部リクエスト: ${route.request().url()}`);
    return route.abort();
  });
  page.__errors = errors;
  await page.goto("/index.html");
  await expect(page.locator("#view-home")).toBeVisible();
});

test.afterEach(async ({ page }) => {
  expect(page.__errors, "コンソールエラー / 外部リクエストが発生していないこと").toEqual([]);
});

// 選択肢ボタンを「正解 / 不正解」で選ぶ。data-choice-idx が元データのインデックスを保持している。
async function choose(page, correct) {
  const answer = await page.evaluate(() => {
    const text = document.getElementById("question-text").textContent;
    return window.QUIZ_DATA.questions.find((q) => q.question === text).answer;
  });
  const sel = correct
    ? `#choices .choice[data-choice-idx="${answer}"]`
    : `#choices .choice:not([data-choice-idx="${answer}"])`;
  await page.locator(sel).first().click();
}

test("ホーム画面: 統計・カテゴリ・各導線が表示される", async ({ page }) => {
  await expect(page).toHaveTitle(/AWS Study/);
  await expect(page.locator("#stat-answered")).toHaveText(`0/${TOTAL_QUESTIONS}`);
  await expect(page.locator("#stat-accuracy")).toHaveText("–");
  await expect(page.locator("#category-grid .category-card")).toHaveCount(CATEGORY_COUNT);
  await expect(page.locator("#btn-review")).toBeDisabled(); // 未解答なので要復習 0
  await expect(page.locator("#btn-random")).toBeEnabled();
  await expect(page.locator("#btn-guide")).toBeEnabled();
  const diagramCount = Number(await page.locator("#diagram-count").textContent());
  expect(diagramCount).toBeGreaterThan(0);
});

test("ランダム10問: 解答→解説→次へを10問繰り返し、結果と進捗が反映される", async ({ page }) => {
  await page.locator("#btn-random").click();
  await expect(page.locator("#view-quiz")).toBeVisible();
  await expect(page.locator("#quiz-category")).toHaveText("ランダム10問");

  for (let i = 1; i <= 10; i++) {
    await expect(page.locator("#quiz-progress-text")).toHaveText(`${i} / 10 問`);
    await expect(page.locator("#choices .choice")).toHaveCount(4);
    await choose(page, true);
    await expect(page.locator("#explanation-head")).toHaveText("✓ 正解!");
    await expect(page.locator("#explanation-text")).not.toBeEmpty();
    await expect(page.locator("#choices .choice.correct")).toHaveCount(1);
    await page.locator("#btn-next").click();
  }

  await expect(page.locator("#view-result")).toBeVisible();
  await expect(page.locator("#result-correct")).toHaveText("10");
  await expect(page.locator("#result-total")).toHaveText("10");
  await expect(page.locator("#result-title")).toHaveText("全問正解!");
  await expect(page.locator("#btn-retry-wrong")).toBeHidden();

  await page.locator("#btn-result-home").click();
  await expect(page.locator("#stat-answered")).toHaveText(`10/${TOTAL_QUESTIONS}`);
  await expect(page.locator("#stat-accuracy")).toHaveText("100%");
  await expect(page.locator("#streak-count")).toHaveText("10");

  // 進捗は localStorage に保存され、再読み込み後も残る
  await page.reload();
  await expect(page.locator("#stat-answered")).toHaveText(`10/${TOTAL_QUESTIONS}`);
});

test("キーボード操作: 1–4 で解答、Enter で次へ進める", async ({ page }) => {
  await page.locator("#btn-random").click();
  await page.keyboard.press("1");
  await expect(page.locator("#explanation")).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator("#quiz-progress-text")).toHaveText("2 / 10 問");
  await expect(page.locator("#explanation")).toBeHidden();
});

test("弱点復習: 間違えた問題が要復習に入り、復習で正解すると解消される", async ({ page }) => {
  await page.locator("#category-grid .category-card").first().click();
  await choose(page, false);
  await expect(page.locator("#explanation-head")).toHaveText("✗ 不正解");
  await expect(page.locator("#choices .choice.wrong")).toHaveCount(1);
  await page.locator("#btn-quit").click();

  await expect(page.locator("#stat-weak")).toHaveText("1");
  await expect(page.locator("#btn-review")).toBeEnabled();
  await page.locator("#btn-review").click();
  await expect(page.locator("#quiz-category")).toHaveText("弱点復習");
  await expect(page.locator("#quiz-progress-text")).toHaveText("1 / 1 問");
  await choose(page, true);
  await page.locator("#btn-next").click();
  await expect(page.locator("#view-result")).toBeVisible();
  await page.locator("#btn-result-home").click();
  await expect(page.locator("#stat-weak")).toHaveText("0");
});

test("結果画面: 間違えた問題だけをやり直せる", async ({ page }) => {
  await page.locator("#btn-random").click();
  for (let i = 0; i < 10; i++) {
    await choose(page, i >= 2); // 最初の2問だけ不正解
    await page.locator("#btn-next").click();
  }
  await expect(page.locator("#result-correct")).toHaveText("8");
  await page.locator("#btn-retry-wrong").click();
  await expect(page.locator("#quiz-category")).toHaveText("間違い直し");
  await expect(page.locator("#quiz-progress-text")).toHaveText("1 / 2 問");
});

test("図解つき問題: 解答後に図解 SVG が読み込まれて表示される", async ({ page }) => {
  await page.locator("#btn-diagram-quiz").click();
  await expect(page.locator("#quiz-category")).toHaveText("図解つき問題");
  await choose(page, true);
  const img = page.locator("#diagram-img");
  await expect(page.locator("#diagram")).toBeVisible();
  await expect(img).toHaveAttribute("src", /^diagrams\/[a-z]+\d+\.svg$/);
  await expect.poll(() => img.evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
});

test("フラッシュカード: めくる・前後に移動する", async ({ page }) => {
  await page.locator("#btn-flash").click();
  await expect(page.locator("#view-flash")).toBeVisible();
  await expect(page.locator("#flash-progress-text")).toHaveText(`1 / ${TOTAL_QUESTIONS} 枚`);
  await expect(page.locator("#flash-front-text")).not.toBeEmpty();

  const card = page.locator("#flashcard");
  await card.click();
  await expect(card).toHaveClass(/flipped/);
  await page.keyboard.press("Space");
  await expect(card).not.toHaveClass(/flipped/);

  await page.locator("#btn-flash-next").click();
  await expect(page.locator("#flash-progress-text")).toHaveText(`2 / ${TOTAL_QUESTIONS} 枚`);
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#flash-progress-text")).toHaveText(`${TOTAL_QUESTIONS} / ${TOTAL_QUESTIONS} 枚`);
  await page.locator("#btn-flash-quit").click();
  await expect(page.locator("#view-home")).toBeVisible();
});

test("試験ガイド: 目次・本文が表示され、用語をタップすると説明ダイアログが開閉する", async ({ page }) => {
  await page.locator("#btn-guide").click();
  await expect(page.locator("#view-guide")).toBeVisible();
  await expect(page.locator("#guide-code")).toHaveText("SAA-C03");
  await expect(page.locator("#guide-toc .toc-link").first()).toBeVisible();
  await expect(page.locator("#guide-body .guide-section").first()).toBeVisible();

  const term = page.locator("#guide-body button.term").first();
  const label = (await term.textContent()).trim();
  await term.click();
  const dialog = page.locator("#term-dialog");
  await expect(dialog).toBeVisible();
  await expect(page.locator("#term-dialog-title")).not.toBeEmpty();
  await expect(page.locator("#term-dialog-desc")).not.toBeEmpty();
  expect(label.length).toBeGreaterThan(0);
  await page.locator("#term-dialog-close").click();
  await expect(dialog).toBeHidden();

  await page.locator("#guide-body button.term").first().click();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  await page.locator("#btn-guide-home").click();
  await expect(page.locator("#view-home")).toBeVisible();
});

test("進捗リセット: 確認ダイアログで OK すると進捗が初期化される", async ({ page }) => {
  await page.locator("#btn-random").click();
  await choose(page, true);
  await page.locator("#btn-quit").click();
  await expect(page.locator("#stat-answered")).toHaveText(`1/${TOTAL_QUESTIONS}`);

  page.once("dialog", (d) => d.accept());
  await page.locator("#btn-reset").click();
  await expect(page.locator("#stat-answered")).toHaveText(`0/${TOTAL_QUESTIONS}`);
  await expect(page.locator("#stat-accuracy")).toHaveText("–");
});
