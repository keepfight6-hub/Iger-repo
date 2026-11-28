// Potret frame adegan dari pratinjau lokal (http://localhost:8765)
const {chromium}=require('playwright');const fs=require('fs');
const THREE_JS=fs.readFileSync(__dirname+'/node_modules/three/build/three.min.js');
(async()=>{
 const times=(process.argv[2]||'0.35,2.1,4.4,6.2,8.9').split(',').map(Number);
 const out=process.argv[3]||'shots';fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch();
 const p=await b.newPage({viewport:{width:600,height:1000}});
 const logs=[];p.on('console',m=>logs.push(m.type()+': '+m.text()));p.on('pageerror',e=>logs.push('PAGEERR '+e.message));
 // three.js r128 dari salinan npm lokal (CDN tidak terjangkau dari container ini)
 await p.route('https://cdnjs.cloudflare.com/**',r=>r.fulfill({body:THREE_JS,contentType:'application/javascript'}));
 // file proyek dilayani langsung dari disk lewat route (tanpa server)
 const DIR=__dirname+'/../bering/';const TYPES={html:'text/html; charset=utf-8',js:'application/javascript',mp3:'audio/mpeg',json:'application/json'};
 await p.route('http://pratinjau.local/**',r=>{const f=new URL(r.request().url()).pathname.slice(1)||'index.html';
   if(!fs.existsSync(DIR+f))return r.fulfill({status:404,body:''});
   r.fulfill({body:fs.readFileSync(DIR+f),contentType:TYPES[f.split('.').pop()]||'application/octet-stream'});});
 await p.goto('http://pratinjau.local/index.html');
 try{await p.waitForFunction(()=>window.__siap||!document.getElementById('err').hidden,null,{timeout:150000});}
 catch(e){console.log('TIMEOUT status:',await p.textContent('#status'),'\n',logs.join('\n'));await b.close();return;}
 console.log('status:',await p.textContent('#status'));
 const err=await p.textContent('#err');if(err)console.log('ERR BOX:',err);
 for(const t of times){const t1=Date.now();
   const d=await p.evaluate(t=>{window.__frame(t);return document.getElementById('stage').toDataURL('image/jpeg',.9);},t);
   fs.writeFileSync(`${out}/f_${t.toFixed(2)}.jpg`,Buffer.from(d.split(',')[1],'base64'));console.log('t',t,Date.now()-t1,'ms');}
 console.log(logs.slice(0,20).join('\n'));await b.close();})();
