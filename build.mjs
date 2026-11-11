// Bundles everything in src/ into single web pages inside dist/.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, readdirSync, existsSync } from 'node:fs';

// All sounds are glued into ONE file (faster to load, far fewer files to publish); the game gets a table of
// where each sound starts and how long it is.
const sounds = readdirSync('assets/audio').filter((f) => f.endsWith('.mp3')).sort();
const table = {}, chunks = [];
let offset = 0;
for (const f of sounds) { const b = readFileSync(`assets/audio/${f}`); table[f.slice(0, -4)] = [offset, b.length]; offset += b.length; chunks.push(b); }
writeFileSync('src/audio-pack.js', `// made by build.mjs, do not edit\nexport const AUDIO_PACK = ${JSON.stringify(table)};\n`);

const out = await build({ entryPoints: ['src/main.js'], bundle: true, format: 'iife', minify: process.argv.includes('--min'), write: false, target: 'es2020' });
const js = out.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const page = readFileSync('src/page.html', 'utf8').replace('/*__BUNDLE__*/', () => js);
mkdirSync('dist', { recursive: true });
// pictures and sounds travel next to the page
rmSync('dist/assets', { recursive: true, force: true });
cpSync('assets/tex', 'dist/assets/tex', { recursive: true });
cpSync('assets/ui', 'dist/assets/ui', { recursive: true });
if (existsSync('assets/chars')) cpSync('assets/chars', 'dist/assets/chars', { recursive: true });
writeFileSync('dist/assets/audio.mp3', Buffer.concat(chunks));
// the fragment used for the shareable preview page
writeFileSync('dist/harvest-standoff.html', page);
// A complete stand-alone page for the public website. Unlike the preview fragment it loads NOTHING from other
// companies' servers: the 3D library and the fonts are copied next to the page.
mkdirSync('dist/vendor', { recursive: true });
cpSync('node_modules/three/build/three.min.js', 'dist/vendor/three.min.js');
cpSync('assets/fonts', 'dist/assets/fonts', { recursive: true });
const fontCss = `<style>
@font-face { font-family: "Lilita One"; font-weight: 400; font-display: swap; src: url(assets/fonts/lilita-one.woff2) format("woff2"); }
@font-face { font-family: "Nunito"; font-weight: 200 1000; font-display: swap; src: url(assets/fonts/nunito.woff2) format("woff2"); }
</style>`;
const cut = page.indexOf('</style>') + '</style>'.length;
const headPart = page.slice(0, cut)
  .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/, fontCss)
  .replace(/<meta name="claude:viewport-fit-sides"[^>]*>\n?/, '');
const bodyPart = page.slice(cut).replace(/https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js\/[^/]+\/three\.min\.js/, 'vendor/three.min.js');
const about = 'After Hours bright toy-room preview. Original opponent AI and match rules in a full living room.';
writeFileSync('dist/index.html', `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="${about}">
<meta name="theme-color" content="#263d3a">
<meta property="og:title" content="After Hours - first playable">
<meta property="og:description" content="${about}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="assets/ui/favicon.png">
<style>html,body{margin:0}[hidden]{display:none!important}</style>
${headPart}
</head>
<body>
${bodyPart}
</body>
</html>
`);
console.log(`built: ${(page.length / 1024).toFixed(0)} KB`);

// Preserve full third-party notices in the static output.
cpSync("licenses", "dist/licenses", {recursive:true});
cpSync("THIRD-PARTY-NOTICES.md", "dist/THIRD-PARTY-NOTICES.md");
