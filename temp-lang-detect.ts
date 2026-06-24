import { chromium } from "@playwright/test";
(async()=>{
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({viewport:{width:1440,height:900}});
  await page.goto('http://localhost:5173/login');
  await page.fill('#email-address','cutest.ducklings@gmail.com');
  await page.fill('#password','Password123$$');
  await page.click("button[type='submit']");
  await page.waitForTimeout(1400);

  const labels = await page.$$eval('*', (nodes: Element[]) => nodes
    .map((n)=>{
      const t=(n as HTMLElement).textContent?.toLowerCase() || '';
      if (t.includes('language') || t.includes('lang') || t.includes('arabic') || t.includes('english') || t.includes('???') || t.includes('???????') || t.includes('??????????')) {
        return `${n.tagName.toLowerCase()}|${(n.getAttribute('id')||'')}:${(n.getAttribute('class')||'')}|${n.textContent?.trim()}`;
      }
      return '';
    }).filter(Boolean).slice(0,120));
  console.log(labels.slice(0,80));
  console.log('settings', await page.locator('a[href="/profile/settings"], a[href="/settings"], a[href*="settings"]').count());

  const links = await page.$$eval('a[href]', nodes => nodes.map((n: Element) => (n as HTMLAnchorElement).getAttribute('href')).filter(Boolean).filter((h)=>/settings|language|lang|locale/i.test(h || '')));
  console.log('potential links', links);

  await browser.close();
})();
