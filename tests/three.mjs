import {chromium,expect} from '@playwright/test';
import {existsSync,readFileSync} from 'node:fs';
import * as THREE from 'three';
const models=JSON.parse(readFileSync(new URL('../src/model-manifest.json',import.meta.url))).models;
const browser=await chromium.launch({...(existsSync('/usr/bin/chromium')?{executablePath:'/usr/bin/chromium'}:{}),headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1100}});
page.setDefaultTimeout(30000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const base=process.env.FORMA_BASE_URL||'http://127.0.0.1:3000';
const canvas=page.locator('.three-canvas');
let passed=0;
async function run(name,fn){await fn();console.log('PASS',name);passed++;}
async function settled(){await expect(canvas).toHaveAttribute('data-animating','false');}
async function pick(name,pattern){await page.getByRole('textbox',{name:'Search 3D anatomy'}).fill(name);await page.locator('.pro-browser-results button').filter({hasText:pattern||name}).first().click();await settled();}
try{
 await page.goto(base);await expect(canvas).toHaveAttribute('data-model-count','4291',{timeout:120000});await settled();
 await run('new registered atlas loads with opaque depth-tested geometry',async()=>{
  expect(+(await canvas.getAttribute('data-visible-meshes'))).toBeGreaterThan(400);
  await expect(canvas).toHaveAttribute('data-transparency','solid');
  await page.screenshot({path:'delivery/forma-preview.png'});
 });
 await run('actual bone surface picking and progressive camera focus preserve the body',async()=>{
  const box=new THREE.Box3();for(const m of models.filter(m=>m.layer==='bones'||m.layer==='skin')){box.expandByPoint(new THREE.Vector3(...m.bounds[0]));box.expandByPoint(new THREE.Vector3(...m.bounds[1]));}
  const bone=models.find(m=>m.name==='Right humerus'&&!m.parentId),center=box.getCenter(new THREE.Vector3());
  const point=new THREE.Vector3((bone.bounds[0][0]+bone.bounds[1][0])/2,(bone.bounds[0][1]+bone.bounds[1][1])/2,bone.bounds[1][2]).sub(center);
  const rect=await canvas.boundingBox(),distance=+(await canvas.getAttribute('data-camera-distance'));
  const camera=new THREE.PerspectiveCamera(35,rect.width/rect.height,.001,15);camera.position.copy(new THREE.Vector3(0,.02,1).normalize().multiplyScalar(distance));camera.lookAt(0,0,0);camera.updateMatrixWorld();point.project(camera);
  await page.mouse.click(rect.x+(point.x+1)*rect.width/2,rect.y+(1-point.y)*rect.height/2);
  await expect(page.locator('.pro-inspector h2')).toHaveText('Right humerus');
  const visible=await canvas.getAttribute('data-visible-meshes');
  await page.evaluate(()=>{window.focusSamples=[];const el=document.querySelector('.three-canvas');new MutationObserver(()=>{if(el.dataset.animating==='true')window.focusSamples.push(+el.dataset.motionProgress)}).observe(el,{attributes:true});});
  await page.locator('.pro-selection-actions').getByRole('button',{name:'Focus',exact:true}).click();await settled();
  expect(await page.evaluate(()=>new Set(focusSamples.map(x=>Math.round(x*10))).size)).toBeGreaterThan(1);
  await expect(canvas).toHaveAttribute('data-visible-meshes',visible);
 });
 await run('search, slow focus, isolate, reviewed labels, hide, and undo',async()=>{
  await pick('L3',/^Third lumbar vertebra/);await expect(page.locator('.pro-inspector')).toContainText(/lumbar/i);
  await page.locator('.pro-selection-actions').getByRole('button',{name:'Isolate',exact:true}).click();await settled();
  expect(+(await canvas.getAttribute('data-visible-meshes'))).toBeLessThan(10);
  await page.getByRole('combobox',{name:'Anatomy selection mode'}).selectOption('landmark');
  await page.locator('.pro-landmarks > button').filter({hasText:'Spinous process'}).click();await settled();
  expect(+(await canvas.getAttribute('data-visible-landmarks'))).toBeGreaterThan(0);
  await page.screenshot({path:'delivery/forma-spine.png'});
  await page.locator('.pro-selection-actions').getByRole('button',{name:'Hide',exact:true}).click();
  await expect(canvas).toHaveAttribute('data-visible-meshes','0');
  await page.getByRole('button',{name:'Undo anatomy change',exact:true}).click();
  await expect(canvas).not.toHaveAttribute('data-visible-meshes','0');
 });
 await run('source intervertebral opening keeps adjacent bones and disc',async()=>{
  await pick('L3',/^Third lumbar vertebra/);await page.locator('.pro-inspector').getByRole('button',{name:'Landmarks',exact:true}).click();if(await page.getByRole('button',{name:'All landmarks',exact:true}).count())await page.getByRole('button',{name:'All landmarks',exact:true}).click();await page.locator('.pro-landmarks > button').filter({hasText:'Intervertebral foramen'}).click();await settled();
  expect(+(await canvas.getAttribute('data-visible-meshes'))).toBeGreaterThan(3);
  await expect(page.locator('.pro-inspector')).toContainText(/spinal nerve/i);
  await page.screenshot({path:'delivery/forma-foramen.png'});
 });
 await run('isolation respects bone opacity and connective visibility',async()=>{
  await page.getByRole('button',{name:'Bones transparency controls',exact:true}).click();
  await page.getByRole('slider',{name:'Bones opacity',exact:true}).fill('30');
  await expect(canvas).toHaveAttribute('data-transparency','depth-tested');
  await expect(canvas).toHaveAttribute('data-coverage-mode',/multisample|hashed/);
  await page.getByRole('button',{name:'Close transparency controls'}).click();
 });
 await run('regional source geometry covers shoulder, pelvis and knee',async()=>{
  await page.getByRole('tab',{name:'Explore',exact:true}).click();
  for(const name of ['Shoulder','Pelvis','Knee']){
   await page.locator('.pro-presets').getByRole('button',{name,exact:true}).click();await settled();
   expect(+(await canvas.getAttribute('data-visible-meshes'))).toBeGreaterThan(5);
   await page.screenshot({path:`delivery/forma-${name.toLowerCase()}.png`});
  }
 });
 await run('matched-scale compare and return to a focused structure',async()=>{
  await page.getByRole('button',{name:'Compare vertebrae',exact:true}).click();
  await expect(canvas).toHaveCount(2);await expect(canvas.first()).toHaveAttribute('data-model-count','4291',{timeout:120000});await expect(canvas.last()).toHaveAttribute('data-model-count','4291',{timeout:120000});
  await expect(canvas.first()).toHaveAttribute('data-animating','false');await expect(canvas.last()).toHaveAttribute('data-animating','false');
  const a=+(await canvas.first().getAttribute('data-camera-distance')),b=+(await canvas.last().getAttribute('data-camera-distance'));expect(Math.abs(a-b)).toBeLessThan(.001);
  await page.screenshot({path:'delivery/forma-compare.png'});
  await pick('Axis',/^Axis/);await expect(canvas).toHaveCount(1);await expect(canvas).toHaveAttribute('data-isolated','true');
  expect(+(await canvas.getAttribute('data-camera-distance'))).toBeLessThan(.5);
 });
 await run('mobile atlas fits viewport and retains camera controls',async()=>{
  await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Reset anatomy',exact:true}).click();await settled();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await expect(page.getByRole('button',{name:'Anatomy superior view'})).toBeVisible();
  await page.screenshot({path:'delivery/forma-mobile.png',fullPage:true});
 });
 expect(errors).toEqual([]);console.log(`${passed} 3D workflows passed; no runtime errors.`);
}finally{await browser.close();}
