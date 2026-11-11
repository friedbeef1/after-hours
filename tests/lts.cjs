// Last Team Standing: checks the "nowhere left to hide" reveal, the time-up endings and the draw.
const { open } = require('./harness.cjs');
(async () => {
  const { browser, page, errors } = await open();
  const out = await page.evaluate(async () => {
    const g = window.__hs, res = {};
    g.input.noLock(); g.begin('herd', 'easy', 'farm', 'lts');
    await new Promise((r) => setTimeout(r, 1500));
    res.audio = g.audio.loaded();
    const live = () => { let n = 0; while (g.state !== 'live' && n++ < 400) g.simulate(0.1); };
    const title = () => document.getElementById('banner-title').textContent + ' | ' + document.getElementById('banner-sub').textContent;
    const next = () => { let n = 0; while (g.state === 'roundEnd' && n++ < 400) g.simulate(0.1); live(); };
    const freezeBots = () => { for (const b of g.bots) { b.update = () => {}; } };
    res.pumpkin = g.pumpkin.state; res.shopKit = g.shopItems(g.player).find((i) => i.id === 'kit');
    res.botKits = g.actors.filter((a) => a.kit).length;
    freezeBots(); live();
    // 1) reveal: everyone shows up for both teams once 30 seconds are left
    g.roundT = 30.5; g.simulate(1.2);
    res.revealed = g.revealed; res.intel = [g.intel.herd.size, g.intel.hands.size];
    res.status = document.getElementById('status-text').textContent; res.statusShown = !document.getElementById('status').hidden;
    // 2) time up with more animals standing
    g.actors.filter((a) => a.team === 'hands')[0].alive = false;
    g.roundT = 0.05; g.simulate(0.2);
    res.count = { title: title(), score: { ...g.score }, state: g.state };
    next(); freezeBots();
    // 3) time up, same numbers, one team cleaner
    g.actors.filter((a) => a.team === 'herd')[1].hp = 40;
    g.roundT = 0.05; g.simulate(0.2);
    res.clean = { title: title(), score: { ...g.score } };
    next();
    // 4) time up, dead level: a draw, nobody scores, everyone still gets pocket money
    const before = g.player.coins;
    g.roundT = 0.05; g.simulate(0.2);
    res.draw = { title: title(), score: { ...g.score }, gained: g.player.coins - before, round: g.round };
    next();
    res.afterDraw = { round: g.round, state: g.state };
    // 5) a normal ending: all farmhands out
    for (const a of g.actors) if (a.team === 'hands') a.alive = false;
    g.simulate(0.1);
    res.wipe = { title: title(), score: { ...g.score } };
    return res;
  });
  console.log(JSON.stringify(out, null, 1));
  console.log('errors:', errors.filter((e) => !e.includes('ERR_FAILED')).slice(0, 6));
  await browser.close();
})();
