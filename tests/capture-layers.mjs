import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1440,height:1100}});
try{
 await page.goto(process.env.FORMA_BASE_URL||'http://127.0.0.1:3000');const canvas=page.locator('.three-canvas');await expect(canvas).toHaveAttribute('data-model-count','4291',{timeout:120000});await expect(canvas).toHaveAttribute('data-animating','false');
 await page.locator('.pro-layer-dock').getByRole('button',{name:'Muscles',exact:true}).click();
 await expect(canvas).toHaveAttribute('data-transparency','solid');await page.screenshot({path:'delivery/forma-muscles.png'});
 await page.locator('.pro-layer-dock').getByRole('button',{name:'Skin',exact:true}).click();await page.screenshot({path:'delivery/forma-skin.png'});
 console.log('Captured source muscle and outer skin layers.');
}finally{await browser.close();}
