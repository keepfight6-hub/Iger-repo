// node render.js <url> <out.mp4> <fps> [t0] [t1] [audio]
const { chromium } = require('playwright'); const { spawn } = require('child_process');
(async () => {
  const [url, out, fpsS, t0S, t1S, audio] = process.argv.slice(2); const fps = +fpsS;
  const b = await chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 540, height: 1000 } }); p.on('pageerror', e => console.log('[ERROR]', e.message));
  await p.goto(url); await p.evaluate(() => window.__ready);
  const dur = await p.evaluate(() => SCENE.dur);
  const t0 = t0S ? +t0S : 0, t1 = t1S ? +t1S : dur; const n = Math.round((t1 - t0) * fps);
  const args = ['-y','-loglevel','error','-f','image2pipe','-c:v','mjpeg','-framerate',String(fps),'-i','-'];
  if (audio) args.push('-ss', String(t0), '-i', audio);
  args.push('-c:v','libx264','-preset','slow','-crf','17','-pix_fmt','yuv420p','-profile:v','high','-level','4.2','-r',String(fps));
  if (audio) args.push('-c:a','aac','-b:a','192k','-ar','48000','-shortest');
  args.push('-movflags','+faststart', out);
  const ff = spawn('ffmpeg', args, { stdio: ['pipe','inherit','inherit'] });
  const st = Date.now();
  for (let i = 0; i < n; i++) {
    const d = await p.evaluate(t => window.__jpeg(t, .95), t0 + i / fps);
    const buf = Buffer.from(d.split(',')[1], 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(`frame ${i}/${n}  ${((Date.now()-st)/1000).toFixed(0)} dtk`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close(); console.log('selesai', out);
})();
