// Render video frame-demi-frame: SCENE.frame(n/FPS) -> JPEG -> ffmpeg (H.264) + VO (AAC)
const {chromium}=require('playwright');const fs=require('fs');const {spawn}=require('child_process');
const THREE_JS=fs.readFileSync(__dirname+'/node_modules/three/build/three.min.js');
const FPS=+(process.argv[2]||30), OUT=process.argv[3]||'video.mp4', SAMPAI=process.argv[4]?+process.argv[4]:null;
const DIR=__dirname+'/../bering/';
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:600,height:1000}});
 p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.route('https://cdnjs.cloudflare.com/**',r=>r.fulfill({body:THREE_JS,contentType:'application/javascript'}));
 const TYPES={html:'text/html; charset=utf-8',js:'application/javascript',mp3:'audio/mpeg'};
 await p.route('http://pratinjau.local/**',r=>{const f=new URL(r.request().url()).pathname.slice(1)||'index.html';
   if(!fs.existsSync(DIR+f))return r.fulfill({status:404,body:''});
   r.fulfill({body:fs.readFileSync(DIR+f),contentType:TYPES[f.split('.').pop()]||'application/octet-stream'});});
 await p.goto('http://pratinjau.local/index.html');
 await p.waitForFunction(()=>window.__siap,null,{timeout:180000});
 const dur=SAMPAI||await p.evaluate(()=>DUR);const N=Math.round(dur*FPS);
 const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate',String(FPS),'-c:v','mjpeg','-i','-',
   '-i',DIR+'vo.mp3','-filter_complex','[1:a]apad,atrim=0:'+dur.toFixed(3)+',loudnorm=I=-15:TP=-1.5:LRA=11,aresample=48000[a]',
   '-map','0:v','-map','[a]','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-profile:v','high','-g',String(FPS*2),
   '-c:a','aac','-b:a','192k','-movflags','+faststart','-t',dur.toFixed(3),OUT]);
 ff.stderr.on('data',d=>process.stdout.write('ffmpeg: '+d));
 const t0=Date.now();
 for(let n=0;n<N;n++){
   const d=await p.evaluate(t=>{window.__frame(t);return document.getElementById('stage').toDataURL('image/jpeg',.93);},n/FPS);
   const buf=Buffer.from(d.split(',')[1],'base64');
   if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));
   if(n%150===0){const el=(Date.now()-t0)/1000;console.log(`frame ${n}/${N} · ${el.toFixed(0)} dtk · sisa ±${((N-n)*el/Math.max(1,n)/60).toFixed(1)} mnt`);}
 }
 ff.stdin.end();await new Promise(r=>ff.on('close',r));await b.close();console.log('SELESAI',OUT);
})();
