// Plays simulated rounds with the human player standing still, and logs how each round ended.
const { open } = require('./harness.cjs');
const team = process.argv[2] || 'herd', diff = process.argv[3] || 'easy', rounds = +(process.argv[4] || 6), map = process.argv[5] || 'farm', mode = process.argv[6] || 'pumpkin';
(async () => {
  const { browser, page, errors } = await open();
  await page.evaluate(([team, diff, map, mode]) => { const g = window.__hs; g.input.noLock(); g.begin(team, diff, map, mode); }, [team, diff, map, mode]);
  await page.waitForTimeout(500);
  const log = await page.evaluate((rounds) => {
    const g = window.__hs, out = [];
    let guard = 0;
    while (g.round <= rounds && g.state !== 'matchEnd' && guard++ < 400) {
      const r = g.round;
      let t = 0, stuck = 0, planted = null, firstSplat = null, revealed = false; const lastPos = new Map(), still = new Map();
      const buys = g.actors.map(a => (a.primary ? a.primary[0] : '-') + (a.armor ? 'o' : '') + (a.kit ? 'k' : '') + (a.throws.flour ? 'F' : '') + (a.throws.rooster ? 'R' : '') + (a.throws.mud ? 'M' : '')).join(' ');
      const carrier = g.pumpkin.carrier && g.pumpkin.carrier.name;
      while (g.round === r && g.state !== 'roundEnd' && g.state !== 'matchEnd' && t < 200) {
        g.simulate(0.5); t += 0.5;
        if (firstSplat === null && g.actors.some(a => !a.alive)) firstSplat = Math.round(100 - g.roundT);
        revealed = revealed || g.revealed;
        if (g.pumpkin.state === 'planted' && planted === null) planted = `${g.pumpkin.site}@${Math.round(100 - g.roundT)}s`;
        for (const b of g.bots) {
          if (!b.a.alive || g.state !== 'live') continue;
          const k = b.a.name, p = lastPos.get(k);
          if (p && Math.hypot(p.x - b.a.pos.x, p.z - b.a.pos.z) < 0.05 && !b.a.busy && (b.state === 'travel' || b.state === 'seek' || b.state === 'hunt')) { still.set(k, (still.get(k) || 0) + 0.5); if (still.get(k) === 4) stuck++; } else still.set(k, 0);
          lastPos.set(k, { x: b.a.pos.x, z: b.a.pos.z });
        }
      }
      const left = g.actors.reduce((n, a) => n + a.throws.flour + a.throws.rooster + a.throws.mud, 0);
      out.push({ r, mode: g.mode, firstSplat, revealed, title: document.getElementById('banner-title').textContent, thrownLeft: left, att: g.attackers, carrier, buys, planted, end: g.pumpkin.state, why: document.getElementById('banner-sub').textContent.slice(0, 90), secs: t, score: `${g.score.herd}-${g.score.hands}`, alive: `${g.actors.filter(a => a.team === 'herd' && a.alive).length}v${g.actors.filter(a => a.team === 'hands' && a.alive).length}`, stuck, coins: g.actors.filter((a, i) => i % 5 === 1).map(a => a.coins).join('/') });
      while (g.state === 'roundEnd') g.simulate(0.5);
    }
    return { out, audio: g.audio.loaded(), state: g.state };
  }, rounds);
  for (const l of log.out) console.log(JSON.stringify(l));
  console.log('audio files loaded:', log.audio, '| state:', log.state, '| errors:', errors.filter(e => !e.includes('ERR_FAILED')).slice(0, 6));
  await browser.close();
})();
