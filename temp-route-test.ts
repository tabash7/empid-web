import { chromium } from "@playwright/test";
const routes = ['/dashboard','/workforce-command-center','/attendance','/timetracking','/timetracking/approvals','/timetracking/history','/leave','/performance','/team','/team/attendance','/tasks','/approvals','/manager/dashboard','/organization/teams','/notifications'];
(async()=>{
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({viewport:{width:1365,height:900}});
  await page.goto('http://localhost:5173/login', {waitUntil:'domcontentloaded'});
  await page.fill('#email-address','cutest.ducklings@gmail.com');
  await page.fill('#password','Password123$$');
  await page.click('button[type=submit]');
  await page.waitForTimeout(1400);

  for (const r of routes) {
    const url = `http://localhost:5173${r}`;
    await page.goto(url, {waitUntil:'domcontentloaded',timeout:25000});
    await page.waitForTimeout(700);
    const title = await page.title().catch(()=> '');
    const h1 = await page.locator('h1').first().textContent().catch(()=> '');
    console.log(`${r} -> ${new URL(page.url()).pathname} | ${h1 ? h1.slice(0,80).replace(/\n/g," ") : '(no h1)'} | ${title}`);
  }
  await browser.close();
})();
