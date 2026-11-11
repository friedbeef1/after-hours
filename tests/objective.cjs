// Checks the player's own path through the shop, planting, corking and zooming.
const { open } = require('./harness.cjs');
(async () => {
  const { browser, page, errors } = await open();
  const out = {};
  // --- shop with real key presses ---
  await page.evaluate(() => { const g = window.__hs; g.input.noLock(); g.begin('herd', 'easy', 'farm', 'pumpkin'); });
  await page.mouse.click(640, 300);
  await page.waitForTimeout(600);
  await page.evaluate(() => { const g = window.__hs; g.player.coins = 5000; g.freezeT = 60; });
  out.shopOpenAtStart = await page.evaluate(() => !document.getElementById('shop').hidden);
  await page.keyboard.press('Digit2'); await page.keyboard.press('Digit4'); await page.keyboard.press('Digit5');
  await page.waitForTimeout(150);
  out.afterBuying = await page.evaluate(() => { const p = window.__hs.player; return { primary: p.primary, armor: p.armor, kit: p.kit, coins: p.coins, holding: p.gadgetId }; });
  await page.keyboard.press('KeyB'); await page.waitForTimeout(120);
  out.shopClosedByB = await page.evaluate(() => document.getElementById('shop').hidden);
  await page.keyboard.press('Digit2'); await page.waitForTimeout(80);
  out.swapTo2 = await page.evaluate(() => window.__hs.player.gadgetId);
  await page.keyboard.press('KeyQ'); await page.waitForTimeout(80);
  out.swapBackQ = await page.evaluate(() => window.__hs.player.gadgetId);
  // --- planting as the Herd ---
  out.plant = await page.evaluate(() => {
    const g = window.__hs, p = g.player, P = g.pumpkin;
    P.carrier = p; g.freezeT = 0; g.simulate(0.2);
    for (const a of g.actors) if (a.team !== p.team) a.pos.set(38, 0, 38);
    p.pos.set(g.world.sites.A.x, 0, g.world.sites.A.z); p.vel.set(0, 0, 0);
    g.input.keys.KeyE = true; g.simulate(1.5);
    const mid = { busy: p.busy, progress: +P.progress.toFixed(2), prompt: document.getElementById('prompt-text').textContent };
    g.simulate(1.8); g.input.keys.KeyE = false; g.simulate(0.1);
    return { mid, state: P.state, site: P.site, fuse: Math.round(P.fuse), status: document.getElementById('status-text').textContent, timerFuse: document.getElementById('timer').classList.contains('fuse') };
  });
  await page.evaluate(() => { const g = window.__hs, p = g.player; p.pos.set(g.world.sites.A.x, 0, g.world.sites.A.z+4); p.yaw = Math.PI; p.pitch = -0.25; g.simulate(0.1); g.paused = true; });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'shots/m2-planted.png' });
  out.burst = await page.evaluate(() => { const g = window.__hs; g.paused = false; g.pumpkin.fuse = 0.3; for (const a of g.actors) if (a.team !== g.player.team) a.pos.set(38, 0, 38); g.simulate(0.5); return { state: g.pumpkin.state, gameState: g.state, score: g.score, why: document.getElementById('banner-sub').textContent }; });
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'shots/m2-burst.png' });
  // --- corking as the Hands ---
  out.cork = await page.evaluate(() => {
    const g = window.__hs; g.input.noLock(); g.begin('hands', 'easy', 'farm', 'pumpkin');
    const p = g.player, P = g.pumpkin; g.freezeT = 0; g.simulate(0.2); p.pos.set(-30,0,36); p.vel.set(0,0,0);
    const c = P.carrier; c.pos.set(g.world.sites.B.x, 0, g.world.sites.B.z); const b = g.botOf.get(c); b.state = 'hold'; b.guarding = true; b.path = null; b.legs = []; c.vel.set(0,0,0); b.hold = { x: g.world.sites.B.x, z: g.world.sites.B.z, lx: 0, lz: 0 };
    for (const a of g.actors) if (a !== c && a !== p) a.pos.set(a.team === p.team ? -38 : 38, 0, 38);
    let t = 0; while (P.state !== 'planted' && t < 8) { g.simulate(0.25); t += 0.25; for (const a of g.actors) if (a !== c && a !== p) a.pos.set(a.team === p.team ? -38 : 38, 0, 38); }
    const planted = P.state;
    for (const a of g.actors) if (a.team !== p.team) { a.alive = false; a.hp = 0; }
    p.pos.set(P.x + 0.8, 0, P.z); p.vel.set(0, 0, 0); p.kit = false;
    g.input.keys.KeyE = true; g.simulate(4);
    const mid = { progress: +P.progress.toFixed(1), busy: p.busy, state: g.state, prompt: document.getElementById('prompt-text').textContent };
    g.simulate(4.3); g.input.keys.KeyE = false;
    return { plantedByBot: planted, botPlantSecs: t, mid, state: P.state, gameState: g.state, score: g.score, why: document.getElementById('banner-sub').textContent, coins: p.coins };
  });
  // --- zoom ---
  out.zoom = await page.evaluate(() => {
    const g = window.__hs; while (g.state === 'roundEnd') g.simulate(0.5);
    const p = g.player; p.coins = 9000; g.buy(p, 'pea'); g.freezeT = 0; g.simulate(0.2);
    const wide = +p.spread().toFixed(4); p.scoped = true; g.simulate(0.4);
    return { holding: p.gadgetId, spreadUnzoomed: wide, spreadZoomed: +p.spread().toFixed(4), fov: Math.round(g.camera.fov), scopeShown: !document.getElementById('scope').hidden };
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'shots/m2-zoom.png', timeout: 15000 }).catch(e => console.log('zoom screenshot failed'));
  console.log(JSON.stringify(out, null, 1));
  console.log('errors:', errors.filter(e => !e.includes('ERR_FAILED')).slice(0, 6));
  await browser.close();
})();
