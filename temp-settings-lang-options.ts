import { chromium } from "@playwright/test";
(async()=>{
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({viewport:{width:1365,height:900}});
  await page.goto('http://localhost:5173/login');
  await page.fill('#email-address','cutest.ducklings@gmail.com');
  await page.fill('#password','Password123$$');
  await page.click("button[type='submit']");
  await page.waitForTimeout(1400);
  await page.goto('http://localhost:5173/profile/settings');
  await page.waitForTimeout(2000);
  const data = await page.evaluate(() => {
    const out:any[] = [];
    const selects = Array.from(document.querySelectorAll('select'));
    for (const s of selects) {
      const opts = Array.from(s.options).map(o => `${o.value}::${o.textContent?.trim()}`);
      out.push({id: s.id, name: s.name, value: (s as HTMLSelectElement).value, opts});
    }
    return out;
  });
  console.log(JSON.stringify(data, null, 2));
  await page.screenshot({ path: 'D:/empid-web/tests/screenshots/output/settings-debug.png', fullPage: true });
  await browser.close();
})();
