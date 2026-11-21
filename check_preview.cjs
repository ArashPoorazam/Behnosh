const {chromium}=require('/home/daedalus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {pathToFileURL}=require('node:url');
const {resolve,dirname,join}=require('node:path');
const input=resolve(process.argv[2]||'output/delster-classic-viewer.html');
(async()=>{
  const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--allow-file-access-from-files']});
  const page=await browser.newPage({viewport:{width:1200,height:1000},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(input).href);
  await page.waitForFunction(()=>document.body.dataset.loaded==='true',{timeout:60000});
  await page.locator('#bottle').evaluate(async el=>{await el.updateComplete;});
  await page.waitForTimeout(1200);
  await page.screenshot({path:join(dirname(input),'web-preview.png')});
  const result=await page.locator('#bottle').evaluate(el=>({loaded:el.loaded,dimensions:el.getDimensions(),materials:el.model.materials.map(m=>m.name)}));
  await page.locator('#rotate').click();
  result.rotationEnabled=await page.locator('#bottle').evaluate(el=>el.autoRotate);
  await page.locator('#front').click();
  result.rotationStopped=await page.locator('#bottle').evaluate(el=>!el.autoRotate);
  if(await page.locator('#art').count()){
    result.originalTextureLoaded=await page.locator('#art').evaluate(button=>new Promise(resolve=>{
      const model=document.querySelector('#bottle');
      model.addEventListener('load',()=>resolve(model.loaded&&button.textContent.includes('original')),{once:true});
      button.click();
    }));
    result.enhancedTextureLoaded=await page.locator('#art').evaluate(button=>new Promise(resolve=>{
      const model=document.querySelector('#bottle');
      model.addEventListener('load',()=>resolve(model.loaded&&button.textContent.includes('enhanced')),{once:true});
      button.click();
    }));
    await page.locator('#bottle').evaluate(el=>{el.cameraOrbit='28deg 60deg auto';el.jumpCameraToGoal();});
    await page.waitForTimeout(1000);
    await page.screenshot({path:join(dirname(input),'web-angle.png')});
  }
  result.errors=errors;
  console.log(JSON.stringify(result,null,2));
  await browser.close();
  if(errors.length)process.exit(1);
})().catch(e=>{console.error(e);process.exit(1)});
