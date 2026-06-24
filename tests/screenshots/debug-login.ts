import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);

  const title = await page.title();
  const lang = await page.locator('html').getAttribute('lang');
  const bodyText = await page.locator('body').innerText().then((t) => t.slice(0, 240)).catch(() => '');
  const inputInfo = await page.locator('input').evaluateAll((nodes) => nodes.map((node) => {
    const n = node as HTMLInputElement;
    return `${n.tagName.toLowerCase()}.${n.type} id=${n.id || 'no-id'} name=${n.name || 'no-name'} placeholder=${n.getAttribute('placeholder') || 'no'};`;
  }));

  console.log('title=', title);
  console.log('lang=', lang);
  console.log('body=', bodyText);
  console.log('inputs=', JSON.stringify(inputInfo));

  await browser.close();
})();
