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
  await page.waitForTimeout(1500);
  const title = await page.title().catch(()=> '');
  const h1 = await page.locator('h1').first().textContent().catch(()=> '');
  const body = await page.locator('body').innerText().catch(()=> '');
  console.log('title=',title,'h1=',h1);
  const labels = await page.$$eval('label', (nodes: Element[]) => nodes.map((n)=> (n.textContent||'').trim()).filter(t=>t && t.length<140));
  const selects = await page.$$eval('select', (nodes: Element[]) => nodes.map((n:any)=> n.id+':'+(n.value||'')+':'+(n.getAttribute('name')||'')));
  const buttons = await page.$$eval('button, input[type="button"], input[type="submit"]', (nodes: Element[]) => nodes.map((n:any)=> ((n.textContent||'').trim() || n.value || '').replace(/\s+/g,' ') ).filter(t=>t).slice(0,80));
  const inputs = await page.$$eval('input, textarea, select', (nodes: Element[]) => nodes.slice(0,120).map((n: any) => `${n.tagName.toLowerCase()} ${n.type || ''} name=${n.name||''} placeholder=${n.placeholder||''} value=${(n.value||'').slice(0,80)} id=${n.id||''}`));

  console.log('LABELS', JSON.stringify(labels.slice(0,120),null,2));
  console.log('SELECTS', JSON.stringify(selects, null, 2));
  console.log('BUTTONS', JSON.stringify(buttons.slice(0,120),null,2));
  console.log('INPUTS', JSON.stringify(inputs, null, 2));
  await browser.close();
})();
