import { chromium } from "@playwright/test";
(async()=>{
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({viewport:{width:1365,height:900}});
  const paths = ['/blog','/blog/attendance-management-system.html','/dashboard','/employees','/workforce-command-center','/leave','/reports','/employee-self-service'];
  await page.goto('http://localhost:5173/login', {waitUntil:'domcontentloaded'});
  await page.fill('#email-address','cutest.ducklings@gmail.com');
  await page.fill('#password','Password123$$');
  await page.click('button[type=submit]');
  await page.waitForTimeout(1200);
  for (const p of paths){
    const url = `http://localhost:5173${p}`;
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:25000});
    const title = await page.title().catch(()=> '');
    const h1 = await page.locator('h1').first().textContent().catch(()=> '');
    const pathName = new URL(page.url()).pathname;
    console.log(p,'=>',pathName,'|title=',title,'|h1=',(h1||'').slice(0,80));
  }
  await browser.close();
})();
