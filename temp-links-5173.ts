import { chromium } from "@playwright/test";
(async()=>{
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport:{ width: 1440, height: 1000 } });
  await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
  await page.fill('#email-address','cutest.ducklings@gmail.com');
  await page.fill('#password','Password123$$');
  await page.click('button[type=submit]');
  await page.waitForTimeout(1800);
  const links = await page.$$eval('a[href], button[data-route]', (nodes: Element[]) => {
    return nodes.slice(0,250).map((node: Element) => {
      const tag = node.tagName.toLowerCase();
      const href = (node as HTMLAnchorElement).getAttribute ? (node as HTMLAnchorElement).getAttribute('href') : '';
      const route = (node as HTMLElement).getAttribute('data-route') || '';
      const txt = (node.textContent || '').trim().replace(/\s+/g,' ');
      return `${tag}:${href || route || ''}:${txt}`;
    }).filter(x => x.includes('http') || x.includes('/'));
  });
  console.log(links.filter(x => x.includes('/')));
  await browser.close();
})();
