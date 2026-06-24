import { chromium } from '@playwright/test';

const slugs = ['attendance-management-system','best-hrms-saudi-arabia'];
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });

  await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
  await page.fill('#email-address','cutest.ducklings@gmail.com');
  await page.fill('#password','Password123$$');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle').catch(()=>{});
  await page.waitForTimeout(2200);

  for (const slug of slugs) {
    const targets = [`/blog/${slug}.html`, `/blog/${slug}`, `/blog/${slug}/`];
    for (const t of targets) {
      const url = `http://localhost:5173${t}`;
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);
      const path = new URL(page.url()).pathname;
      const title = await page.title().catch(() => '');
      const h1 = await page.locator('h1').first().textContent().catch(() => '');
      const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 200);
      console.log(t, '|', path, '| title=', title, '| h1=', (h1 || '').replace(/\n/g,' '), '| text=', body);
    }
  }

  await browser.close();
})();
