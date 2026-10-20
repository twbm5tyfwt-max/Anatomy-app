import {chromium,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:760,height:650}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await mkdir('/tmp/forma-quiz-views',{recursive:true});await page.goto('http://127.0.0.1:3000/tests/fixtures/visual.html');await page.waitForFunction(()=>window.questionViews?.length>0);
 const n=await page.evaluate(()=>questionViews.length);
 for(let i=0;i<n;i++){
  await page.evaluate(i=>showQuestion(i),i);
  const canvas=page.locator('.three-canvas');await expect(canvas).toHaveAttribute('data-model-count','4291',{timeout:120000});await expect(canvas).toHaveAttribute('data-animating','false');
  const q=await page.evaluate(i=>({id:questionViews[i].id,answer:questionViews[i].answer,target:questionViews[i].anatomy.targetLandmarkId,candidates:questionViews[i].anatomy.landmarkIds}),i);
  if(q.target)await expect(page.locator(`[data-landmark-id="${q.target}"]`)).toHaveCount(1);
  if(q.candidates)expect(+(await canvas.getAttribute('data-visible-landmarks'))).toBeGreaterThan(q.id.endsWith('-click')?1:0);
  await expect(page.locator('.landmark-label')).toHaveCount(0);
  await page.screenshot({path:`/tmp/forma-quiz-views/${String(i).padStart(2,'0')}.png`});console.log('PASS',q.id,q.answer);
 }
 expect(errors).toEqual([]);console.log(`${n} eligible visual question views checked.`);
}finally{await browser.close();}
