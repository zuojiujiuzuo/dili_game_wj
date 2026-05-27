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
  await page.screenshot({ path: path.join(root, "qa-initial.png"), fullPage: true });
  await page.click("text=接通");
  await page.waitForFunction(() => document.querySelector("#intro").classList.contains("hidden"));
  await page.click("text=教师材料");
  await page.waitForSelector("text=课堂主线");
  await page.click("text=收起");
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
  await page.locator(".journalist.raised").first().click({ force: true });
  await page.waitForSelector(".card-panel:not(.hidden)");
  await page.screenshot({ path: path.join(root, "qa-question.png"), fullPage: true });
  await page.locator(".evidence", { hasText: "距离不能直接决定归属" }).click();
  await page.locator(".evidence", { hasText: "阿拉斯加类比例证" }).click();
  await page.locator('.evidence[data-id="near-wins"]').click();
  await page.locator("button", { hasText: "确认证据链" }).click();
  await page.waitForSelector("text=选错证据：谁距离近就归谁");
  const wrongClass = await page.locator('.evidence[data-id="near-wins"]').evaluate((el) => el.classList.contains("wrong"));
  if (!wrongClass) throw new Error("Wrong evidence was not marked");
  await page.screenshot({ path: path.join(root, "qa-wrong-evidence.png"), fullPage: true });
  await page.locator('.evidence[data-id="near-wins"]').click();
  await page.locator(".evidence", { hasText: "优先看开发、管控与活动痕迹" }).click();
  await page.locator("button", { hasText: "确认证据链" }).click();
  await page.waitForSelector("text=中间会弹出发言人回答大框");
  await page.screenshot({ path: path.join(root, "qa-standard-answer.png"), fullPage: true });
  await page.locator("button", { hasText: "完成本题" }).click();
  await page.waitForSelector(".speaker-modal");
  const firstAnswer = await page.locator(".speaker-answer").textContent();
  if (!firstAnswer.includes("领土归属从来都和地理距离远近没有任何关系")) {
    throw new Error("First speaker answer did not contain the teacher's original answer");
  }
  await page.screenshot({ path: path.join(root, "qa-speaker-answer.png"), fullPage: true });
  await page.locator("button", { hasText: "回答完毕" }).click();

  await page.mouse.move(850, 360);
  await page.locator(".journalist.raised:not(.done)").first().click({ force: true });
  await page.waitForSelector(".card-panel:not(.hidden)");
  await page.locator('.evidence[data-id="state-licensed-fishing"]').click();
  await page.locator('.evidence[data-id="fishing-sovereign-control"]').click();
  await page.locator('.evidence[data-id="multi-evidence-chain"]').click();
  await page.locator("button", { hasText: "确认证据链" }).click();
  await page.waitForSelector("text=中间会弹出发言人回答大框");
  await page.locator("button", { hasText: "完成本题" }).click();
  await page.waitForSelector(".speaker-modal");
  const secondAnswer = await page.locator(".speaker-answer").textContent();
  if (!secondAnswer.includes("依法办理我国发放的渔业捕捞许可证")) {
    throw new Error("Second speaker answer did not contain the teacher's original answer");
  }
  await page.locator("button", { hasText: "回答完毕" }).click();
  await page.waitForSelector("text=发布会总结");

  await page.screenshot({ path: path.join(root, "qa-summary.png"), fullPage: true });
  if (errors.length) {
    throw new Error(errors.join("\n"));
  }
  await browser.close();
  console.log("QA passed");
})();
