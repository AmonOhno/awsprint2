// Playwright 設定 — Web版(web/)のスモーク E2E。
// CI では「全件パス」を厳密に判定するため retries=0 固定(リトライで通った flaky も不合格)。
// web/ は依存ゼロの静的ファイルなので、Python 標準の http.server で配信するだけでよい。
import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI, // test.only の消し忘れで一部だけ実行されるのを防ぐ
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `python3 -m http.server ${PORT} --bind 127.0.0.1 --directory web`,
    url: `http://127.0.0.1:${PORT}/index.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    stderr: "ignore", // http.server のアクセスログ(stderr)でテスト出力が埋もれないように
  },
});
