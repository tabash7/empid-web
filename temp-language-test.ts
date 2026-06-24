import { chromium } from "@playwright/test";
(async()=>{
  const base = 'http://localhost:5173';
  const page = await (await chromium.launch({headless:true})).newPage({viewport:{width:1365,height:768}});
  await page.goto(base + '/login', { waitUntil:'domcontentloaded' });
  await page.fill('#email-address', 'amina.haddad@empid.test');
  await page.fill('#password', 'demo789');
  await page.click("button[type='submit']");
  await page.waitForTimeout(1600);

  await page.goto(base + '/profile/settings', { waitUntil:'domcontentloaded' });
  await page.waitForTimeout(1500);

  const selects = await page.$$eval('select', (nodes:any[]) => nodes.map(s => ({id:s.id, value:s.value, options:Array.from(s.options).map((o:any)=>`${o.value}|${(o.textContent||'').trim()}`)})));
  console.log(selects);

  const languageLabel = await page.locator('label:has-text("Language")').count();
  console.log('language label', languageLabel);
  const languageSelect = page.locator("label:has-text('Language') + div select, label:has-text('Language') ~ select, #_r_0_, #_r_1_, #_r_2_").first();
  console.log('language select count', await languageSelect.count());
  if(await languageSelect.count() > 0){
    await languageSelect.selectOption({ value: 'ar' }).catch((err)=> console.log('select err', String(err.message || err)));
    await page.waitForTimeout(600);
    console.log('selected', await languageSelect.inputValue());
  }

  await page.close();
})();
