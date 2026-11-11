// Turns a generated 3D model (.glb, T-pose, no skeleton) into a small game-ready character:
//   - shrinks it to a few thousand triangles
//   - stands it 1.75 m tall on the ground, facing "north" like every character in the game
//   - works out where the hips and shoulders are and paints "which bone moves me" weights onto every corner
//   - writes assets/chars/<name>.json (the shape) and assets/chars/<name>.jpg (the colours)
//
// usage: node tools/chars/bake.mjs <model.glb> <name> [--tris 9000] [--flip] [--arm-up 0]
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld, simplify } from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'node:fs';

const args = process.argv.slice(2);
const src = args[0], name = args[1];
const opt = (k, d) => { const i = args.indexOf('--' + k); return i < 0 ? d : args[i + 1]; };
const flip = args.includes('--flip');
const target = +opt('tris', 9000);
const H = 1.75;

const P = [], N = [], UV = [], I = [];
let image = null, C = null, before = 0, raw = src.endsWith('.json');
if (raw) {
  // a model sculpted by our own Blender scripts: already light, already in the game's axes, coloured per corner
  const d = JSON.parse(fs.readFileSync(src, 'utf8'));
  P.push(...d.P); N.push(...d.N); I.push(...d.I); C = d.C;
  for (let i = 0; i < d.P.length / 3; i++) UV.push(0, 0);
  before = d.I.length / 3;
} else {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
  const doc = await io.read(src);
  await MeshoptSimplifier.ready;
  const countTris = () => doc.getRoot().listMeshes().flatMap((m) => m.listPrimitives()).reduce((n, p) => n + (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount()) / 3, 0);
  before = countTris();
  await doc.transform(weld());
  if (before > target) await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio: target / before, error: 0.05 }));

  // ---- pull every triangle out into plain lists, in world space ----
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    const m = node.getWorldMatrix();
    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute('POSITION'), nrm = prim.getAttribute('NORMAL'), uv = prim.getAttribute('TEXCOORD_0'), idx = prim.getIndices();
      const base = P.length / 3, v = [0, 0, 0];
      for (let i = 0; i < pos.getCount(); i++) {
        pos.getElement(i, v);
        P.push(m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12], m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13], m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14]);
        if (nrm) { nrm.getElement(i, v); N.push(m[0] * v[0] + m[4] * v[1] + m[8] * v[2], m[1] * v[0] + m[5] * v[1] + m[9] * v[2], m[2] * v[0] + m[6] * v[1] + m[10] * v[2]); } else N.push(0, 1, 0);
        if (uv) { const t = [0, 0]; uv.getElement(i, t); UV.push(t[0], t[1]); } else UV.push(0, 0);
      }
      if (idx) for (let i = 0; i < idx.getCount(); i++) I.push(base + idx.getScalar(i)); else for (let i = 0; i < pos.getCount(); i++) I.push(base + i);
      const mat = prim.getMaterial(), tex = mat && mat.getBaseColorTexture();
      if (tex && !image) image = tex.getImage();
    }
  }
}
const nv = P.length / 3;

// ---- stand it up: 1.75 m tall, feet on the ground, centred, facing -z ----
let min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9];
for (let i = 0; i < nv; i++) for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], P[i * 3 + k]); max[k] = Math.max(max[k], P[i * 3 + k]); }
const s = raw ? 1 : H / (max[1] - min[1]), cx = raw ? 0 : (min[0] + max[0]) / 2, cz = raw ? 0 : (min[2] + max[2]) / 2, f = flip ? -1 : 1;
for (let i = 0; i < nv; i++) {
  P[i * 3] = (P[i * 3] - cx) * s * f; P[i * 3 + 1] = (P[i * 3 + 1] - min[1]) * s; P[i * 3 + 2] = (P[i * 3 + 2] - cz) * s * f;
  const l = Math.hypot(N[i * 3], N[i * 3 + 1], N[i * 3 + 2]) || 1;
  N[i * 3] = (N[i * 3] / l) * f; N[i * 3 + 1] /= l; N[i * 3 + 2] = (N[i * 3 + 2] / l) * f;
}

// ---- find the body landmarks from the shape itself ----
const X = (i) => P[i * 3], Y = (i) => P[i * 3 + 1], Z = (i) => P[i * 3 + 2];
let maxAbsX = 0;
for (let i = 0; i < nv; i++) maxAbsX = Math.max(maxAbsX, Math.abs(X(i)));
// arms: the bits that stick out furthest sideways
let sy = 0, sn = 0, aMin = 1e9, aMax = -1e9, zArm = 0;
for (let i = 0; i < nv; i++) if (Math.abs(X(i)) > maxAbsX * 0.8) { sy += Y(i); sn++; aMin = Math.min(aMin, Y(i)); aMax = Math.max(aMax, Y(i)); zArm += Z(i); }
const shoulderY = sy / sn, armHalf = Math.max(0.05, (aMax - aMin) / 2); zArm /= sn;
// shoulder: walking inward from the hand, the first place where the body is much taller than an arm
const band = armHalf * 3.2, BW = 0.02, cols = Math.ceil(maxAbsX / BW) + 1;
const cLo = new Array(cols).fill(1e9), cHi = new Array(cols).fill(-1e9);
for (let i = 0; i < nv; i++) if (Math.abs(Y(i) - shoulderY) < band) { const c = Math.floor(Math.abs(X(i)) / BW); cLo[c] = Math.min(cLo[c], Y(i)); cHi[c] = Math.max(cHi[c], Y(i)); }
let shoulderX = maxAbsX * 0.45;
for (let c = cols - 1; c >= 0; c--) if (cHi[c] - cLo[c] > armHalf * 3.3) { shoulderX = (c + 1) * BW; break; }
shoulderX = +opt('shoulder', shoulderX);
// crotch: going up from the feet, the first height where the two legs have joined in the middle
const SL = 0.02, rows = Math.ceil(H / SL) + 1, gap = new Array(rows).fill(1e9);
for (let i = 0; i < nv; i++) { const r = Math.floor(Y(i) / SL); gap[r] = Math.min(gap[r], Math.abs(X(i))); }
let crotchY = 0.35;
for (let r = 2; r < rows; r++) if (gap[r] < 0.02) { crotchY = r * SL; break; }
crotchY = +opt('crotch', crotchY);
let hx = 0, hn = 0;
for (let i = 0; i < nv; i++) if (Y(i) < crotchY * 0.6) { hx += Math.abs(X(i)); hn++; }
const hipX = hn ? hx / hn : 0.15;
const neckY = +opt('neck', shoulderY + armHalf + 0.06);

// ---- weights: each corner follows up to two "bones" (0 body, 1 left leg, 2 right leg, 3 left arm, 4 right arm, 5 head) ----
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const BI = new Uint8Array(nv * 2), BWt = new Uint8Array(nv * 2);
for (let i = 0; i < nv; i++) {
  const x = X(i), y = Y(i), ax = Math.abs(x);
  let bone = 0, w = 0;
  const wa = Math.abs(y - shoulderY) < armHalf * 2.4 ? smooth(shoulderX - 0.05, shoulderX + 0.07, ax) : 0;
  const wl = (1 - smooth(crotchY - 0.05, crotchY + 0.09, y)) * smooth(0.015, 0.06, ax);
  const wh = wa > 0 ? 0 : smooth(neckY - 0.04, neckY + 0.1, y);
  if (wa >= wl && wa >= wh && wa > 0) { bone = x < 0 ? 3 : 4; w = wa; } else if (wl >= wh && wl > 0) { bone = x < 0 ? 1 : 2; w = wl; } else if (wh > 0) { bone = 5; w = wh; }
  BI[i * 2] = bone; BWt[i * 2] = Math.round(w * 255); BI[i * 2 + 1] = 0; BWt[i * 2 + 1] = 255 - BWt[i * 2];
}

// ---- pack it small ----
const b64 = (ta) => Buffer.from(ta.buffer, ta.byteOffset, ta.byteLength).toString('base64');
const pos16 = new Int16Array(nv * 3), nrm8 = new Int8Array(nv * 3), uv16 = new Uint16Array(nv * 2);
for (let i = 0; i < nv * 3; i++) { pos16[i] = Math.round((P[i] / 2) * 32767); nrm8[i] = Math.round(N[i] * 127); }
for (let i = 0; i < nv * 2; i++) uv16[i] = Math.round(Math.min(1, Math.max(0, UV[i])) * 65535);
const idx = nv < 65536 ? new Uint16Array(I) : new Uint32Array(I);
const out = {
  name, verts: nv, tris: I.length / 3, idxBytes: nv < 65536 ? 2 : 4,
  pos: b64(pos16), nrm: b64(nrm8), uv: C ? '' : b64(uv16), col: C ? b64(new Uint8Array(C)) : '', idx: b64(idx), bi: b64(BI), bw: b64(BWt),
  rig: { shoulderX: +shoulderX.toFixed(3), shoulderY: +shoulderY.toFixed(3), armHalf: +armHalf.toFixed(3), crotchY: +crotchY.toFixed(3), hipX: +hipX.toFixed(3), neckY: +neckY.toFixed(3), handX: +(maxAbsX - 0.07).toFixed(3), handZ: +zArm.toFixed(3) },
};
fs.mkdirSync('assets/chars', { recursive: true });
fs.writeFileSync(`assets/chars/${name}.json`, JSON.stringify(out));
if (image) await sharp(Buffer.from(image)).resize(1024, 1024, { fit: 'inside' }).jpeg({ quality: 86 }).toFile(`assets/chars/${name}.jpg`);
console.log(JSON.stringify({ name, trisBefore: Math.round(before), tris: out.tris, verts: nv, texture: !!image, jsonKB: Math.round(fs.statSync(`assets/chars/${name}.json`).size / 1024), size: { x: +((max[0] - min[0]) * s).toFixed(2), z: +((max[2] - min[2]) * s).toFixed(2) }, colours: !!C, rig: out.rig }));
