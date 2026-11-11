// Opens the built game in a headless browser. A tiny local web server hands out dist/ so pictures and sounds load.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg', '.json': 'application/json' };
exports.open = async function open(opts = {}) {
  const root = process.env.AFTERHOURS_BASELINE || path.join(__dirname, '../dist');
  const server = http.createServer((req, res) => {
    const file = path.join(root, decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
    if (!file.startsWith(root) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome-stable', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: opts.width || 1280, height: opts.height || 720 }, deviceScaleFactor: 1, hasTouch:true, isMobile:true });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message + '\n' + (e.stack || '')));
  const three = fs.readFileSync(path.join(__dirname, '../node_modules/three/build/three.min.js'), 'utf8');
  if(!process.env.AFTERHOURS_HOSTED) await page.route('**/three.min.js', (r) => r.fulfill({ contentType: 'application/javascript', body: three }));
  await page.route('**fonts.googleapis.com/**', (r) => r.abort());
  await page.goto(process.env.AFTERHOURS_HOSTED || `http://127.0.0.1:${server.address().port}/`,{waitUntil:'domcontentloaded',timeout:60000}); await page.waitForFunction('!!window.__hs',{},{timeout:60000});
  await page.waitForTimeout(opts.wait || 2500);
  const close = browser.close.bind(browser);
  browser.close = async () => { await close(); server.close(); };
  return { browser, page, errors };
};
