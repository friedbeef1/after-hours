// Last Team Standing with the human taken out and one opponent benched, so it is 4 computer players a side.
// Counts how often each end of the map wins, to see whether a starting end has an edge.
const { open } = require('./harness.cjs');
const map = process.argv[2] || 'farm', rounds = +(process.argv[3] || 30), diff = process.argv[4] || 'medium';
(async () => {
  const { browser, page, errors } = await open();
  const out = await page.evaluate(async ([map, rounds, diff]) => {
    const g = window.__hs;
    g.input.noLock(); g.begin('herd', diff, map, 'lts');
    await new Promise((r) => setTimeout(r, 800));
    const res = { south: 0, north: 0, draw: 0, secs: [], reveals: 0, stuck: 0, audio: g.audio.loaded() };
    for (let i = 0; i < rounds; i++) {
      let n = 0;
      while (g.state !== 'live' && n++ < 600) g.simulate(0.1);
      g.player.alive = false; g.actors.filter((a) => a.team === 'hands')[1 + (i % 4)].alive = false;
      const before = { ...g.score }, south = g.attackers;
      let t = 0; const last = new Map(), still = new Map();
      while (g.state === 'live' && t < 130) {
        g.simulate(0.5); t += 0.5;
        for (const b of g.bots) {
          if (!b.a.alive || g.state !== 'live') continue;
          const k = b.a.name, p = last.get(k);
          if (p && Math.hypot(p.x - b.a.pos.x, p.z - b.a.pos.z) < 0.05 && (b.state === 'travel' || b.state === 'seek' || b.state === 'hunt')) { still.set(k, (still.get(k) || 0) + 0.5); if (still.get(k) === 4) { res.stuck++; (res.where = res.where || []).push(`${k} ${b.state} at ${b.a.pos.x.toFixed(1)},${b.a.pos.z.toFixed(1)} path:${b.path ? b.pi + '/' + b.path.length : 'none'} goal:${b.goal ? b.goal.x.toFixed(1) + ',' + b.goal.z.toFixed(1) : '-'} tgt:${!!b.target} daze:${b.a.dazeT.toFixed(1)} site:${b.plan.site} r${i}`); } } else still.set(k, 0);
          last.set(k, { x: b.a.pos.x, z: b.a.pos.z });
        }
      }
      if (g.revealed) res.reveals++;
      res.secs.push(Math.round(t));
      const w = g.score.herd > before.herd ? 'herd' : g.score.hands > before.hands ? 'hands' : null;
      if (!w) res.draw++; else if (w === south) res.south++; else res.north++;
      g.score.herd = 0; g.score.hands = 0; // keep the match going
      for (const a of g.actors) a.coins = 3500;
    }
    return res;
  }, [map, rounds, diff]);
  out.avg = Math.round(out.secs.reduce((a, b) => a + b, 0) / out.secs.length); out.longest = Math.max(...out.secs); delete out.secs;
  console.log(map, JSON.stringify(out), 'errors:', errors.filter((e) => !e.includes('ERR_FAILED')).slice(0, 4));
  await browser.close();
})();
