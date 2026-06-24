import { chromium } from '@playwright/test';
(async()=>{
  const page=(await chromium.launch({headless:true})).newPage();
  await page.goto('http://localhost:4173/blog/attendance-management-system.html', {waitUntil:'domcontentloaded'}).catch(()=>{});
  await page.waitForTimeout(1200);
  const result = await page.evaluate(() => {
    const img = document.querySelector('figure.app-screenshot-card img');
    if (!img) return {ok:false, reason:'no img element'};
    const status = (img as HTMLImageElement).complete ? 'complete' : 'loading';
    return {
      ok: true,
      src: img.getAttribute('src'),
      naturalWidth: (img as HTMLImageElement).naturalWidth,
      naturalHeight: (img as HTMLImageElement).naturalHeight,
      status,
      computedDisplay: getComputedStyle(img).display,
      complete: (img as HTMLImageElement).complete,
      broken: (img as HTMLImageElement).naturalWidth===0 || (img as HTMLImageElement).naturalHeight===0,
      alt: img.getAttribute('alt'),
      className: img.className
    };
  });
  console.log(JSON.stringify(result, null, 2));
  await page.screenshot({path:'D:/empid-web/temp-check-attendance-img.png', fullPage:true});
  await page.close();
})();
