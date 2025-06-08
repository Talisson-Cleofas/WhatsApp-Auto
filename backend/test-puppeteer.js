const puppeteer = require("puppeteer");

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto("https://www.google.com");
    console.log("Google opened successfully");
    await browser.close();
  } catch (e) {
    console.error("Puppeteer launch failed:", e);
  }
})();
