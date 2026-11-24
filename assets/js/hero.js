/* 洪山菜薹林 · 一只昆虫的视角 —— 程序化绘制 + 风场动画 */
(function () {
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const $ = (id) => document.getElementById(id);
  const cFar = $('cv-far'), cBack = $('cv-back'), cMid = $('cv-mid'), cNear = $('cv-near'), cFx = $('cv-fx');
  const xFar = cFar.getContext('2d'), xBack = cBack.getContext('2d'), xMid = cMid.getContext('2d'), xNear = cNear.getContext('2d'), xFx = cFx.getContext('2d');
  let W = 0, H = 0, T0 = performance.now();
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const TAU = Math.PI * 2;

  /* ---------- 风场 ---------- */
  const mouse = { x: -1, y: -1, px: -1, gust: 0, gx: 0, ox: 0, oy: 0, tx: 0, ty: 0 };
  let gustCenter = -2000, gustNext = 2.5, gustAmp = 0;
  function wind(t, x) {
    let w = 0.32 + 0.22 * Math.sin(t * 0.55 + x * 0.0021) + 0.12 * Math.sin(t * 1.35 + x * 0.0047 + 1.3)
      + 0.05 * Math.sin(t * 3.1 + x * 0.011);
    // 阵风：从左向右推进
    const d = (x - gustCenter) / (W * 0.28 + 200);
    w += gustAmp * Math.exp(-d * d);
    // 鼠标带起的风
    if (mouse.gust > 0.01) { const dm = (x - mouse.gx) / 260; w += mouse.gust * Math.exp(-dm * dm); }
    return w;
  }

  /* ---------- 植株生成 ---------- */
  function makeStem(o) {
    const s = Object.assign({ lean: rnd(-0.06, 0.06), phase: rnd(0, TAU), k: rnd(0.8, 1.2) }, o);
    s.leaves = [];
    const nL = o.leafN || 5;
    for (let i = 0; i < nL; i++) {
      const tt = 0.08 + (i / nL) * 0.62 + rnd(-0.03, 0.03);
      const big = 1 - tt;
      s.leaves.push({
        t: tt, side: i % 2 ? 1 : -1,
        len: s.h * (0.10 + 0.22 * big * big) * rnd(0.85, 1.15) * (o.leafScale || 1),
        wid: rnd(0.28, 0.4) * (tt < 0.35 ? 1.25 : 0.7),
        ang: rnd(0.55, 1.0), ph: rnd(0, TAU), lobed: tt < 0.3
      });
    }
    // 花序：总状花序，下部开花、上部花蕾
    s.flowers = [];
    const nF = o.flowerN || 14;
    for (let i = 0; i < nF; i++) {
      const u = i / nF; // 0 底部 → 1 顶端
      s.flowers.push({
        u, side: (i % 2 ? 1 : -1) * rnd(0.6, 1),
        ped: (1 - u) * rnd(0.6, 1.1),
        size: u < 0.62 ? rnd(0.85, 1.15) : rnd(0.32, 0.5),
        bud: u >= 0.62, rot: rnd(0, TAU), tilt: rnd(0.45, 1), ph: rnd(0, TAU)
      });
    }
    return s;
  }

  let far = [], back = [], mid = [], near = [], pads = [];
  function layout() {
    far = []; back = []; mid = []; near = [];
    const sc = Math.max(0.7, Math.min(1.35, W / 1400));
    const n = Math.round(W / 30);
    for (let i = 0; i < n; i++) {
      far.push(makeStem({ x0: rnd(-20, W + 20), h: H * rnd(0.3, 0.6), w0: rnd(2.5, 4.5) * sc, flowerN: 10, leafN: 3, leafScale: 0.9, fscale: sc }));
    }
    const nb = W > 760 ? 9 : 5;
    for (let i = 0; i < nb; i++) {
      back.push(makeStem({ x0: W * (0.3 + 0.72 * i / nb) + rnd(-30, 30), h: H * rnd(0.55, 0.82), w0: rnd(7, 10) * sc, flowerN: 16, leafN: 5, fscale: sc * rnd(0.9, 1.1), lean: rnd(-0.1, 0.1) }));
    }
    // 主体：右侧成丛、左侧留白给标题（昆虫视角：茎粗、花大、花头逼近画面上缘）
    const spots = W > 760 ? [0.47, 0.62, 0.77, 0.9] : [0.12, 0.45, 0.8];
    const hs = [0.88, 0.97, 0.8, 0.9];
    spots.forEach((p, i) => {
      mid.push(makeStem({
        x0: W * p + rnd(-25, 25), h: H * hs[i % 4] * rnd(0.97, 1.03), w0: rnd(26, 32) * sc,
        flowerN: 24, leafN: 6, leafScale: 1.15, fscale: sc * rnd(1.55, 1.8), lean: rnd(-0.12, 0.08)
      }));
    });
    // 近景虚化大茎
    near.push(makeStem({ x0: W * 0.035, h: H * 1.2, w0: 62 * sc, flowerN: 18, leafN: 4, fscale: sc * 4.2, leafScale: 1.3, lean: 0.06 }));
    near.push(makeStem({ x0: W * 1.0, h: H * 0.95, w0: 52 * sc, flowerN: 18, leafN: 3, fscale: sc * 3.8, leafScale: 1.2, lean: -0.1 }));
    // 前景承托叶（瓢虫所在）
    pads = [{ x0: W * (W > 760 ? 0.33 : 0.1), y0: H + 40, len: Math.min(W * 0.56, 860) * (W > 760 ? 1 : 1.35), ang: -0.4, wid: 0.36, ph: 0 }];
  }

  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    [cFar, cBack, cMid, cNear, cFx].forEach((c) => {
      c.width = Math.round(W * DPR); c.height = Math.round(H * DPR);
      c.style.width = W + 'px'; c.style.height = H + 'px';
      c.getContext('2d').setTransform(DPR, 0, 0, DPR, 0, 0);
    });
    layout(); initFx();
  }

  /* ---------- 茎的几何 ---------- */
  function stemPoint(s, u, bend) {
    const y = H + 30 - u * s.h;
    const x = s.x0 + s.lean * u * s.h + bend * u * u;
    return [x, y];
  }
  function stemBend(s, t) {
    const w = wind(t, s.x0);
    return (w * 0.16 * s.h * s.k) / (1 + s.w0 * 0.012) + Math.sin(t * 2.3 + s.phase) * s.h * 0.006;
  }
  function stemAngle(s, u, bend) {
    const a = stemPoint(s, Math.max(0, u - 0.01), bend), b = stemPoint(s, Math.min(1, u + 0.01), bend);
    return Math.atan2(b[1] - a[1], b[0] - a[0]);
  }

  /* ---------- 绘制部件 ---------- */
  function drawStemBody(ctx, s, bend, palette) {
    const N = 26, L = [], R = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N, p = stemPoint(s, u, bend), a = stemAngle(s, u, bend);
      const w = s.w0 * (1 - 0.62 * u) * 0.5;
      const nx = Math.cos(a + Math.PI / 2), ny = Math.sin(a + Math.PI / 2);
      L.push([p[0] + nx * w, p[1] + ny * w]); R.push([p[0] - nx * w, p[1] - ny * w]);
    }
    const g = ctx.createLinearGradient(s.x0 - s.w0, 0, s.x0 + s.w0, 0);
    g.addColorStop(0, palette.stemDark); g.addColorStop(0.45, palette.stem); g.addColorStop(1, palette.stemDark);
    ctx.beginPath(); ctx.moveTo(L[0][0], L[0][1]);
    for (let i = 1; i < L.length; i++) ctx.lineTo(L[i][0], L[i][1]);
    for (let i = R.length - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
    ctx.closePath(); ctx.fillStyle = g; ctx.fill();
    if (palette.hl) { // 高光 + 白霜
      ctx.beginPath();
      for (let i = 0; i <= N; i++) { const p = L[i], q = R[i]; const x = p[0] * 0.7 + q[0] * 0.3, y = p[1] * 0.7 + q[1] * 0.3; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.strokeStyle = palette.hl; ctx.lineWidth = Math.max(1, s.w0 * 0.12); ctx.stroke();
    }
  }

  function leafPath(ctx, len, wid, lobed) {
    const w = len * wid;
    ctx.beginPath(); ctx.moveTo(0, 0);
    if (lobed) {
      ctx.bezierCurveTo(len * 0.18, -w * 0.5, len * 0.32, -w * 0.95, len * 0.55, -w * 0.82);
      ctx.bezierCurveTo(len * 0.8, -w * 0.7, len * 0.95, -w * 0.25, len, 0);
      ctx.bezierCurveTo(len * 0.92, w * 0.35, len * 0.7, w * 0.85, len * 0.45, w * 0.8);
      ctx.bezierCurveTo(len * 0.25, w * 0.75, len * 0.12, w * 0.4, 0, 0);
    } else {
      ctx.bezierCurveTo(len * 0.3, -w * 0.9, len * 0.75, -w * 0.6, len, 0);
      ctx.bezierCurveTo(len * 0.7, w * 0.6, len * 0.3, w * 0.8, 0, 0);
    }
    ctx.closePath();
  }
  function drawLeaf(ctx, lf, x, y, baseAng, t, palette, wv) {
    const flutter = Math.sin(t * 2.6 + lf.ph) * 0.07 + wv * 0.18 * lf.side;
    const a = baseAng + lf.side * lf.ang + flutter * 0.6 + (lf.side > 0 ? 0.25 : -0.25) * wv;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    // 叶面翻转的透视压缩
    ctx.scale(1, 0.75 + 0.25 * Math.sin(t * 1.8 + lf.ph));
    leafPath(ctx, lf.len, lf.wid, lf.lobed);
    const g = ctx.createLinearGradient(0, 0, lf.len, 0);
    g.addColorStop(0, palette.leafBase); g.addColorStop(0.55, palette.leafMid); g.addColorStop(1, palette.leafTip);
    ctx.fillStyle = g; ctx.fill();
    if (palette.vein) {
      ctx.strokeStyle = palette.vein; ctx.lineWidth = Math.max(0.8, lf.len * 0.012);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(lf.len * 0.5, -lf.len * lf.wid * 0.06, lf.len * 0.97, 0); ctx.stroke();
      ctx.lineWidth *= 0.5;
      for (let k = 1; k < 6; k++) {
        const px = lf.len * k / 6.5, sp = lf.len * lf.wid * 0.5 * (1 - k / 7);
        ctx.beginPath(); ctx.moveTo(px, 0); ctx.quadraticCurveTo(px + sp * 0.6, -sp * 0.4, px + sp, -sp * 0.85); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px, 0); ctx.quadraticCurveTo(px + sp * 0.6, sp * 0.4, px + sp, sp * 0.85); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawFlower(ctx, x, y, r, rot, tilt, palette) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1, tilt);
    for (let i = 0; i < 4; i++) {
      ctx.save(); ctx.rotate(i * Math.PI / 2 + 0.2);
      ctx.beginPath(); ctx.ellipse(r * 0.78, 0, r * 0.72, r * 0.5, 0, 0, TAU);
      const g = ctx.createRadialGradient(r * 0.3, 0, 0, r * 0.78, 0, r * 0.8);
      g.addColorStop(0, palette.petalIn); g.addColorStop(1, palette.petal);
      ctx.fillStyle = g; ctx.fill(); ctx.restore();
    }
    ctx.beginPath(); ctx.arc(0, 0, r * 0.28, 0, TAU); ctx.fillStyle = palette.core; ctx.fill();
    ctx.restore();
  }
  function drawBud(ctx, x, y, r, palette) {
    ctx.beginPath(); ctx.ellipse(x, y, r * 0.55, r * 0.8, 0, 0, TAU);
    const g = ctx.createLinearGradient(x, y - r, x, y + r);
    g.addColorStop(0, palette.budTop); g.addColorStop(1, palette.bud);
    ctx.fillStyle = g; ctx.fill();
  }

  const flowerPos = []; // 供蜜蜂寻找
  function drawPlant(ctx, s, t, palette, opt) {
    const bend = stemBend(s, t), wv = wind(t, s.x0);
    drawStemBody(ctx, s, bend, palette);
    // 叶
    s.leaves.forEach((lf) => {
      const p = stemPoint(s, lf.t, bend), a = stemAngle(s, lf.t, bend);
      drawLeaf(ctx, lf, p[0], p[1], a, t, palette, wv);
    });
    // 花序
    const fs = (s.fscale || 1) * (opt.fsize || 9);
    const top = 0.9;
    const items = [];
    s.flowers.forEach((f) => {
      const u = top + f.u * (1 - top) * 0.9;
      const p = stemPoint(s, u, bend), a = stemAngle(s, u, bend);
      // 围绕花轴的方位角：做出立体的总状花序
      const phi = f.rot + t * 0.05;
      const depth = Math.sin(phi);
      const pl = (0.55 + f.ped * 1.2) * fs * 2.3 * (f.bud ? 0.4 : 1);
      const jig = Math.sin(t * 3.4 + f.ph) * fs * 0.1 * (1 + wv);
      const ux = Math.cos(a), uy = Math.sin(a); // 沿茎方向（向上）
      const nx = -uy, ny = ux;                    // 垂直茎
      const side = Math.cos(phi) * pl, up = pl * (0.75 - f.u * 0.3) + depth * pl * 0.15;
      const fx = p[0] + nx * side + ux * up + jig, fy = p[1] + ny * side + uy * up;
      items.push({ f, p, fx, fy, depth });
    });
    items.sort((a, b) => a.depth - b.depth);
    ctx.strokeStyle = palette.ped; ctx.lineWidth = Math.max(0.8, fs * 0.11);
    items.forEach(({ p, fx, fy }) => { ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.quadraticCurveTo(p[0] * 0.6 + fx * 0.4, fy, fx, fy); ctx.stroke(); });
    items.forEach(({ f, fx, fy, depth }) => {
      const k = 0.82 + 0.18 * (depth + 1) / 2;
      if (f.bud) drawBud(ctx, fx, fy, fs * f.size * 1.6 * k, palette);
      else {
        drawFlower(ctx, fx, fy, fs * f.size * k, f.rot * 2 + Math.sin(t * 1.7 + f.ph) * 0.25, f.tilt, palette);
        if (opt.collect) flowerPos.push([fx, fy, fs * f.size]);
      }
    });
    // 顶端穹顶状花蕾簇
    const tp = stemPoint(s, 1, bend), ta = stemAngle(s, 1, bend);
    const tux = Math.cos(ta), tuy = Math.sin(ta);
    for (let k = 0; k < 9; k++) {
      const ring = k < 5 ? 1 : (k < 8 ? 0.55 : 0), ang = k * 1.256 + (k >= 5 ? 0.6 : 0);
      const off = Math.cos(ang) * fs * 0.9 * ring, lift = (1 - ring) * fs * 0.9 + fs * 0.2;
      drawBud(ctx, tp[0] - tuy * off + tux * lift, tp[1] + tux * off + tuy * lift, fs * (0.62 - ring * 0.08), palette);
    }
  }

  const PAL_MID = {
    stem: '#8a3566', stemDark: '#4d1638', hl: 'rgba(255,214,236,.28)',
    leafBase: '#5a2a4e', leafMid: '#4d5a3e', leafTip: '#5f7444', vein: 'rgba(214,160,196,.55)',
    ped: '#7d4a5c', petal: '#f5c20f', petalIn: '#fff0a6', core: '#d98b05', bud: '#9fb04a', budTop: '#e9d65a'
  };
  const PAL_FAR = {
    stem: '#9d7590', stemDark: '#80607a', hl: null,
    leafBase: '#8c7a88', leafMid: '#8e9a80', leafTip: '#97a785', vein: null,
    ped: '#9b8090', petal: '#f2d562', petalIn: '#f8e8a8', core: '#e2b84d', bud: '#b8bd7a', budTop: '#e6dc93'
  };
  const PAL_BACK = {
    stem: '#93527a', stemDark: '#6a3657', hl: null,
    leafBase: '#735870', leafMid: '#6f7d5e', leafTip: '#7d9064', vein: 'rgba(214,170,200,.35)',
    ped: '#8d6576', petal: '#f3cc3a', petalIn: '#fbeaa0', core: '#dfa226', bud: '#aab563', budTop: '#e6d877'
  };
  const PAL_NEAR = {
    stem: '#6d2450', stemDark: '#3a0f2a', hl: 'rgba(255,200,230,.25)',
    leafBase: '#40203a', leafMid: '#3b4a30', leafTip: '#4d6236', vein: 'rgba(200,140,180,.4)',
    ped: '#5d3346', petal: '#f0b80a', petalIn: '#fde68a', core: '#c97a04', bud: '#8da03d', budTop: '#dcc94a'
  };

  /* ---------- 前景承托叶 + 瓢虫 + 露珠 ---------- */
  const bug = { s: 0.18, dir: 1, pause: 0 };
  function drawPad(ctx, pd, t) {
    const wv = wind(t, pd.x0);
    const a = pd.ang + Math.sin(t * 1.1) * 0.025 + wv * -0.03;
    ctx.save(); ctx.translate(pd.x0, pd.y0); ctx.rotate(a);
    const len = pd.len, w = len * pd.wid;
    // 叶面
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(len * 0.25, -w * 0.95, len * 0.7, -w * 0.75, len, -w * 0.05);
    ctx.bezierCurveTo(len * 0.75, w * 0.42, len * 0.3, w * 0.55, 0, 0);
    const g = ctx.createLinearGradient(0, -w, 0, w * 0.5);
    g.addColorStop(0, '#6c8a4e'); g.addColorStop(0.45, '#4c6a3a'); g.addColorStop(1, '#3a2a3c');
    ctx.fillStyle = g; ctx.fill();
    // 白霜质感
    ctx.globalAlpha = 0.18; ctx.fillStyle = '#e8f0e0';
    ctx.beginPath(); ctx.ellipse(len * 0.45, -w * 0.38, len * 0.3, w * 0.18, -0.08, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    // 主脉（紫）
    ctx.strokeStyle = 'rgba(190,120,170,.85)'; ctx.lineWidth = 3.2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.5, -w * 0.28, len * 0.98, -w * 0.06); ctx.stroke();
    ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(190,130,170,.45)';
    for (let k = 1; k < 8; k++) {
      const px = len * k / 8.5, py = -w * 0.28 * Math.sin(Math.PI * k / 8.5) * 0.9;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + len * 0.06, py - w * 0.3, px + len * 0.1, py - w * 0.55 * (1 - k / 10)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + len * 0.05, py + w * 0.18, px + len * 0.08, py + w * 0.32 * (1 - k / 10)); ctx.stroke();
    }
    // 露珠
    const dx = len * 0.66, dy = -w * 0.42, dr = Math.max(12, len * 0.034);
    ctx.beginPath(); ctx.ellipse(dx + 2, dy + dr * 0.55, dr * 0.95, dr * 0.35, 0, 0, TAU); ctx.fillStyle = 'rgba(20,40,20,.25)'; ctx.fill();
    const dg = ctx.createRadialGradient(dx - dr * 0.35, dy - dr * 0.4, dr * 0.1, dx, dy, dr);
    dg.addColorStop(0, 'rgba(255,255,255,.95)'); dg.addColorStop(0.25, 'rgba(220,240,225,.45)'); dg.addColorStop(0.8, 'rgba(120,160,120,.25)'); dg.addColorStop(1, 'rgba(255,255,255,.6)');
    ctx.beginPath(); ctx.arc(dx, dy, dr, 0, TAU); ctx.fillStyle = dg; ctx.fill();
    ctx.beginPath(); ctx.arc(dx + dr * 0.3, dy + dr * 0.35, dr * 0.22, 0, TAU); ctx.fillStyle = 'rgba(255,250,200,.55)'; ctx.fill();
    // 瓢虫沿主脉爬行
    if (!reduce) {
      if (bug.pause > 0) bug.pause -= 1 / 60; else bug.s += 0.00055 * bug.dir;
      if (bug.s > 0.56) { bug.dir = -1; bug.pause = 1.6; } if (bug.s < 0.12) { bug.dir = 1; bug.pause = 2.2; }
    }
    const bx = len * bug.s, by = -w * 0.28 * Math.sin(Math.PI * bug.s) * 0.9 - 2;
    drawLadybug(ctx, bx, by, Math.max(15, len * 0.036), bug.dir > 0 ? -0.18 : Math.PI - 0.18, t);
    ctx.restore();
  }
  function drawLadybug(ctx, x, y, r, ang, t) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    // 腿
    ctx.strokeStyle = '#1b1414'; ctx.lineWidth = r * 0.09;
    for (let i = -1; i <= 1; i++) {
      const sw = Math.sin(t * 9 + i) * r * 0.12 * (bug.pause > 0 ? 0 : 1);
      ctx.beginPath(); ctx.moveTo(i * r * 0.35, 0); ctx.lineTo(i * r * 0.45 + sw, r * 0.85); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(i * r * 0.35, 0); ctx.lineTo(i * r * 0.45 - sw, -r * 0.85); ctx.stroke();
    }
    // 头 + 触角
    ctx.beginPath(); ctx.ellipse(r * 0.95, 0, r * 0.38, r * 0.42, 0, 0, TAU); ctx.fillStyle = '#151010'; ctx.fill();
    ctx.beginPath(); ctx.arc(r * 1.05, -r * 0.2, r * 0.1, 0, TAU); ctx.arc(r * 1.05, r * 0.2, r * 0.1, 0, TAU); ctx.fillStyle = '#f4efe6'; ctx.fill();
    ctx.lineWidth = r * 0.06;
    const aw = Math.sin(t * 4) * 0.15;
    ctx.beginPath(); ctx.moveTo(r * 1.2, -r * 0.15); ctx.quadraticCurveTo(r * 1.6, -r * 0.5, r * 1.75, -r * (0.45 + aw)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r * 1.2, r * 0.15); ctx.quadraticCurveTo(r * 1.6, r * 0.5, r * 1.75, r * (0.45 - aw)); ctx.stroke();
    // 鞘翅
    const g = ctx.createRadialGradient(-r * 0.2, -r * 0.35, r * 0.1, 0, 0, r * 1.1);
    g.addColorStop(0, '#ff6a4a'); g.addColorStop(0.6, '#d8261a'); g.addColorStop(1, '#8e0f0a');
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.86, 0, 0, TAU); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = '#2a0c08'; ctx.lineWidth = r * 0.06; ctx.beginPath(); ctx.moveTo(r * 0.62, 0); ctx.lineTo(-r, 0); ctx.stroke();
    ctx.fillStyle = '#140c0b';
    [[0.3, -0.42, 0.2], [0.3, 0.42, 0.2], [-0.35, -0.48, 0.19], [-0.35, 0.48, 0.19], [-0.05, -0.18, 0.13], [-0.05, 0.18, 0.13], [0.62, 0, 0.17]]
      .forEach(([a, b, c]) => { ctx.beginPath(); ctx.arc(a * r, b * r, c * r, 0, TAU); ctx.fill(); });
    ctx.beginPath(); ctx.ellipse(-r * 0.2, -r * 0.45, r * 0.32, r * 0.12, -0.3, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fill();
    ctx.restore();
  }

  /* ---------- 粒子：花粉、光斑、飘落花瓣、蜜蜂 ---------- */
  let pollen = [], bokeh = [], petals = [];
  const bee = { x: -80, y: 200, vx: 0, vy: 0, tx: 0, ty: 0, hover: 0, state: 'enter' };
  function initFx() {
    pollen = Array.from({ length: Math.round(W * H / 16000) }, () => ({ x: rnd(0, W), y: rnd(0, H), r: rnd(0.8, 2.6), a: rnd(0.3, 0.9), ph: rnd(0, TAU) }));
    bokeh = Array.from({ length: 14 }, () => ({ x: rnd(0, W), y: rnd(0, H * 0.7), r: rnd(18, 70), a: rnd(0.05, 0.16), vx: rnd(-0.06, 0.06), hue: Math.random() < 0.6 ? '255,236,170' : '255,255,255' }));
    petals = [];
    bee.x = -80; bee.y = H * 0.3; bee.state = 'enter';
  }
  function drawFx(t, dt) {
    xFx.clearRect(0, 0, W, H);
    // 光斑
    bokeh.forEach((b) => {
      b.x += b.vx + wind(t, b.x) * 0.05; if (b.x > W + 80) b.x = -80; if (b.x < -80) b.x = W + 80;
      const g = xFx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      g.addColorStop(0, `rgba(${b.hue},${b.a})`); g.addColorStop(0.7, `rgba(${b.hue},${b.a * 0.6})`); g.addColorStop(1, `rgba(${b.hue},0)`);
      xFx.fillStyle = g; xFx.beginPath(); xFx.arc(b.x, b.y, b.r, 0, TAU); xFx.fill();
    });
    // 花粉随风
    pollen.forEach((p) => {
      const w = wind(t, p.x);
      p.x += (0.25 + w * 1.6) * dt * 60; p.y += (Math.sin(t * 0.9 + p.ph) * 0.25 - 0.12) * dt * 60;
      if (p.x > W + 10) { p.x = -10; p.y = rnd(0, H); } if (p.y < -10) p.y = H + 10; if (p.y > H + 10) p.y = -10;
      const tw = 0.6 + 0.4 * Math.sin(t * 2 + p.ph);
      xFx.beginPath(); xFx.arc(p.x, p.y, p.r, 0, TAU); xFx.fillStyle = `rgba(255,232,140,${p.a * tw})`; xFx.fill();
    });
    // 飘落的花瓣
    if (!reduce && Math.random() < 0.025 && flowerPos.length) {
      const f = flowerPos[(Math.random() * flowerPos.length) | 0];
      petals.push({ x: f[0], y: f[1], r: f[2] * 0.7, rot: rnd(0, TAU), vr: rnd(-3, 3), vy: rnd(0.3, 0.8), life: 1 });
    }
    petals = petals.filter((p) => p.y < H + 20 && p.x < W + 40);
    petals.forEach((p) => {
      const w = wind(t, p.x);
      p.x += (w * 2.2 + 0.2) * dt * 60; p.y += p.vy * dt * 60; p.rot += p.vr * dt;
      xFx.save(); xFx.translate(p.x, p.y); xFx.rotate(p.rot); xFx.scale(1, Math.abs(Math.sin(p.rot * 1.3)) * 0.8 + 0.2);
      xFx.beginPath(); xFx.ellipse(0, 0, p.r * 0.75, p.r * 0.5, 0, 0, TAU); xFx.fillStyle = '#f7cb1d'; xFx.fill(); xFx.restore();
    });
    drawBee(t, dt);
  }
  function drawBee(t, dt) {
    if (reduce) return;
    if (bee.state === 'enter' || (bee.state === 'hover' && bee.hover <= 0)) {
      if (flowerPos.length) {
        const f = flowerPos[(Math.random() * flowerPos.length) | 0];
        bee.tx = f[0]; bee.ty = f[1] - 22; bee.state = 'fly';
      }
    }
    if (bee.state === 'fly') {
      const dx = bee.tx - bee.x, dy = bee.ty - bee.y, d = Math.hypot(dx, dy);
      bee.vx += dx * 0.0016; bee.vy += dy * 0.0016; bee.vx *= 0.94; bee.vy *= 0.94;
      if (d < 14) { bee.state = 'hover'; bee.hover = rnd(1.5, 3.2); }
    } else if (bee.state === 'hover') {
      bee.hover -= dt; bee.vx = Math.sin(t * 7) * 0.6; bee.vy = Math.cos(t * 5.3) * 0.5;
    }
    bee.x += bee.vx * dt * 60 + Math.sin(t * 13) * 0.3; bee.y += bee.vy * dt * 60 + Math.cos(t * 11) * 0.3;
    const s = Math.max(0.8, Math.min(1.3, W / 1400)) * 1.15;
    const ang = Math.atan2(bee.vy, bee.vx + 0.0001) * 0.25;
    xFx.save(); xFx.translate(bee.x, bee.y); xFx.rotate(ang); xFx.scale(bee.vx < -0.05 ? -s : s, s);
    // 翅膀（高频扇动）
    const fl = Math.sin(t * 90);
    xFx.fillStyle = 'rgba(235,245,255,.55)'; xFx.strokeStyle = 'rgba(120,140,160,.5)'; xFx.lineWidth = 0.6;
    xFx.beginPath(); xFx.ellipse(-2, -9 - fl * 2, 9, 5 + fl * 2, -0.5, 0, TAU); xFx.fill(); xFx.stroke();
    xFx.beginPath(); xFx.ellipse(4, -8 - fl * 2, 7, 4 + fl * 1.5, -0.2, 0, TAU); xFx.fill(); xFx.stroke();
    // 身体
    const g = xFx.createLinearGradient(-12, 0, 10, 0);
    g.addColorStop(0, '#2a1d0c'); g.addColorStop(0.2, '#f2b51c'); g.addColorStop(0.35, '#2a1d0c'); g.addColorStop(0.5, '#f2b51c'); g.addColorStop(0.65, '#2a1d0c'); g.addColorStop(0.8, '#e9a915'); g.addColorStop(1, '#e9a915');
    xFx.beginPath(); xFx.ellipse(0, 0, 11, 6.5, 0, 0, TAU); xFx.fillStyle = g; xFx.fill();
    xFx.beginPath(); xFx.arc(11, -1, 4.6, 0, TAU); xFx.fillStyle = '#2a1d0c'; xFx.fill();
    xFx.beginPath(); xFx.arc(12.5, -2.5, 1.2, 0, TAU); xFx.fillStyle = 'rgba(255,255,255,.7)'; xFx.fill();
    xFx.strokeStyle = '#2a1d0c'; xFx.lineWidth = 0.8;
    xFx.beginPath(); xFx.moveTo(13, -4); xFx.quadraticCurveTo(16, -10, 19, -9); xFx.stroke();
    xFx.restore();
  }

  /* ---------- 远景静态底 ---------- */
  function drawFarGround(ctx) {
    const g = ctx.createLinearGradient(0, H * 0.62, 0, H);
    g.addColorStop(0, 'rgba(150,170,120,0)'); g.addColorStop(0.5, 'rgba(126,140,98,.55)'); g.addColorStop(1, 'rgba(90,96,70,.9)');
    ctx.fillStyle = g; ctx.fillRect(0, H * 0.55, W, H * 0.45);
  }

  /* ---------- 主循环 ---------- */
  let last = performance.now(), frame = 0;
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const t = (now - T0) / 1000 * (reduce ? 0.25 : 1);
    // 阵风调度
    if (t > gustNext) { gustCenter = -W * 0.4; gustAmp = rnd(0.35, 0.75); gustNext = t + rnd(6, 11); }
    gustCenter += W * 0.32 * dt; if (gustCenter > W * 1.6) gustAmp *= 0.98;
    mouse.gust *= 0.96;
    // 视差
    mouse.ox += (mouse.tx - mouse.ox) * 0.05; mouse.oy += (mouse.ty - mouse.oy) * 0.05;
    cFar.style.transform = `translate3d(${mouse.ox * -10}px,${mouse.oy * -6}px,0)`;
    cBack.style.transform = `translate3d(${mouse.ox * -15}px,${mouse.oy * -8}px,0)`;
    cMid.style.transform = `translate3d(${mouse.ox * -22}px,${mouse.oy * -10}px,0)`;
    cNear.style.transform = `translate3d(${mouse.ox * -48}px,${mouse.oy * -18}px,0) scale(1.04)`;

    // 远景每两帧重绘一次
    if (frame % 2 === 0) {
      xFar.clearRect(0, 0, W, H); drawFarGround(xFar);
      far.forEach((s) => drawPlant(xFar, s, t, PAL_FAR, { fsize: 4.2 }));
      xBack.clearRect(0, 0, W, H);
      back.forEach((s) => drawPlant(xBack, s, t, PAL_BACK, { fsize: 8 }));
    }
    flowerPos.length = 0;
    xMid.clearRect(0, 0, W, H);
    mid.forEach((s) => drawPlant(xMid, s, t, PAL_MID, { fsize: 11, collect: true }));
    pads.forEach((p) => drawPad(xMid, p, t));
    xNear.clearRect(0, 0, W, H);
    near.forEach((s) => drawPlant(xNear, s, t, PAL_NEAR, { fsize: 9 }));
    drawFx(t, dt);
    frame++;
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', () => { clearTimeout(window.__rz); window.__rz = setTimeout(resize, 120); });
  window.addEventListener('pointermove', (e) => {
    mouse.tx = e.clientX / W - 0.5; mouse.ty = e.clientY / H - 0.5;
    if (mouse.px >= 0) { const sp = Math.abs(e.clientX - mouse.px); mouse.gust = Math.min(0.9, mouse.gust + sp * 0.004); mouse.gx = e.clientX; }
    mouse.px = e.clientX;
  });
  window.addEventListener('deviceorientation', (e) => {
    if (e.gamma == null) return; mouse.tx = Math.max(-0.5, Math.min(0.5, e.gamma / 60)); mouse.ty = Math.max(-0.5, Math.min(0.5, (e.beta - 45) / 90));
  });
  resize(); requestAnimationFrame(tick);
})();
