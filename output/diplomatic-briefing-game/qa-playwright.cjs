const path = require("node:path");
const { chromium } = require("playwright");

const root = __dirname;
const fileUrl = `file://${path.join(root, "standalone.html")}`;

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto(fileUrl);
  await page.waitForSelector(".room");
  await page.waitForSelector("text=外交部例行记者会现场");
  await page.waitForSelector("text=拨打外交部现场电话");
  await page.waitForSelector("#intro .connect-btn");
  await page.screenshot({ path: path.join(root, "qa-initial.png"), fullPage: true });
  await page.locator("#intro .connect-btn").click();
  await page.waitForSelector("text=正在呼叫...");
  await page.waitForFunction(() => document.querySelector("#intro").classList.contains("hidden"), { timeout: 12000 });
  await page.waitForSelector("text=开始接受记者提问");
  await page.waitForFunction(() => !document.querySelector(".question-marker.ready"));
  await page.locator("#materialToggle", { hasText: "开始接受记者提问" }).click();
  await page.waitForSelector("text=记者提问中");
  await page.waitForFunction(() => document.querySelectorAll(".question-marker.ready").length > 0);
  const markerText = await page.locator(".question-marker.ready").first().textContent();
  if (!/(美联社|法新社)/.test(markerText || "")) {
    throw new Error("Question marker should show the media name");
  }

  const hotspot = await page.locator("#teacherHotspot").boundingBox();
  await page.mouse.move(hotspot.x + hotspot.width / 2, hotspot.y + hotspot.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(2200);
  await page.mouse.up();
  await page.waitForSelector("text=教师资料与演示控制");
  await page.locator("#teacherPanel .btn.primary", { hasText: "关闭" }).click();
  await page.waitForFunction(() => document.querySelector("#teacherPanel").classList.contains("hidden"));
  await page.screenshot({ path: path.join(root, "qa-scene.png"), fullPage: true });

  await page.mouse.move(460, 360);
  await page.locator(".question-marker.ready").first().click({ force: true });
  await page.waitForSelector(".reporter-bubble.asking");
  await page.waitForSelector(".card-panel:not(.hidden)");
  await page.waitForSelector("text=黄岩岛距离菲律宾更近");
  await page.waitForSelector("text=提示：①优先依据最早开发、长期实际管控");
  await page.waitForSelector("text=提示：②可举例子说明");
  await page.screenshot({ path: path.join(root, "qa-question.png"), fullPage: true });
  await page.locator("button", { hasText: "结束本题" }).click();
  await page.waitForFunction(() => document.querySelector("#cardPanel").classList.contains("hidden"));
  await page.waitForFunction(() => !document.querySelector(".speaker-modal"));
  await page.screenshot({ path: path.join(root, "qa-standard-answer.png"), fullPage: true });

  await page.mouse.move(850, 360);
  await page.locator(".question-marker.ready").first().click({ force: true });
  await page.waitForSelector("text=依法办理我国发放的渔业捕捞许可证");
  await page.waitForSelector("text=提示：②多方证据相互印证");
  await page.locator("button", { hasText: "结束本题" }).click();
  await page.waitForSelector("text=本场记者提问已完成");

  await page.screenshot({ path: path.join(root, "qa-summary.png"), fullPage: true });
  if (errors.length) {
    throw new Error(errors.join("\n"));
  }
  await browser.close();
  console.log("QA passed");
})();
