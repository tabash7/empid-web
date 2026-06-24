import { chromium } from '@playwright/test';

(async ()=>{
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
  await page.fill('#email-address', 'cutest.ducklings@gmail.com');
  await page.fill('#password', 'Password123$$');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);

  const links = await page.locator('a[href*="/blog"], a[href*="blog/"]').evaluateAll((nodes) =>
    [...new Set(Array.from(nodes).map((n) => (n as HTMLAnchorElement).getAttribute('href')).filter(Boolean))]
  );
  console.log('blog-like links:');
  links.slice(0,80).forEach((l) => console.log(String(l)));

  await browser.close();
})();
