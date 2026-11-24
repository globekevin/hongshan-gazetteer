/* 洪山志览 · 内页渲染 */
(function () {
  const D = window.HS;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const Q = new URLSearchParams(location.search);
  const CN = '〇一二三四五六七八九十';
  const cnum = (n) => n <= 10 ? CN[n] : n < 20 ? '十' + (n % 10 ? CN[n % 10] : '') : CN[Math.floor(n / 10)] + '十' + (n % 10 ? CN[n % 10] : '');
  const P = {}; D.parts.forEach((p) => (P[p.id] = p));
  const DV = '1124d';
  // 各部分详细解读按需加载：打开哪页只下载哪页的内容
  const need = (ids) => Promise.all(ids.filter((id) => P[id] && !P[id]._d).map((id) => new Promise((ok) => {
    const s = document.createElement('script'); s.src = `data/part/${id}.js?v=${DV}`;
    s.onload = () => { Object.assign(P[id], (window.HS_D || {})[id] || {}); P[id]._d = 1; ok(); };
    s.onerror = () => ok(); document.head.append(s);
  })));
  const pid = () => (P[Q.get('id')] ? Q.get('id') : 'p01');
  const G = {}; D.groups.forEach((g) => (G[g.id] = g));
  /* ---------- 响应式插画：按实际显示尺寸选图，进入视口才加载，先垫小图再换高清 ---------- */
  const WEBP = (() => { try { return document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0; } catch (e) { return false; } })();
  // Safari 的 canvas 不能编码 webp 但能显示，用解码探测
  const webpOK = WEBP ? Promise.resolve(true) : new Promise((r) => { const i = new Image(); i.onload = () => r(i.width > 0); i.onerror = () => r(false); i.src = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA'; });
  const BG_W = [800, 1600, 2560];
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const bgSrc = (id, w) => `assets/img/w${w}/${id}.webp`;
  const bgIO = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return; bgIO.unobserve(e.target); loadBg(e.target);
  }), { rootMargin: '300px 0px' });
  function loadBg(el) {
    const id = el.dataset.bg;
    webpOK.then((ok) => {
      if (!ok) { el.style.backgroundImage = `url(assets/img/${id}.jpg)`; return; }
      const dpr = saveData ? 1 : Math.min(2, devicePixelRatio || 1);
      let need = Math.max(el.clientWidth, el.clientHeight * 1.5) * dpr; // 图为 3:2，cover 裁切
      if (innerWidth <= 760) need = Math.min(need, 1600);               // 手机不下发 2560
      const w = BG_W.find((x) => x >= need * 0.9) || BG_W[BG_W.length - 1];
      const small = `url(${bgSrc(id, 800)})`;
      el.style.backgroundImage = small;
      if (w === 800) return;
      const im = new Image();
      im.onload = () => { const set = () => { el.style.backgroundImage = `url(${im.src}), ${small}`; }; im.decode ? im.decode().then(set, set) : set(); };
      im.src = bgSrc(id, w);
    });
  }
  new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => {
    if (n.nodeType !== 1) return;
    if (n.matches('[data-bg]')) bgIO.observe(n);
    n.querySelectorAll('[data-bg]').forEach((x) => bgIO.observe(x));
  }))).observe(document.documentElement, { childList: true, subtree: true });
  const partLabel = (p) => p.no ? `第${cnum(p.no)}篇` : ({ zongshu: '卷首', dashiji: '卷首', renwu: '卷末', fulu: '卷末' }[p.id] || '');
  const ordered = D.parts.filter((p) => p.no).sort((a, b) => a.no - b.no);
  const SPECIAL_LINK = { zongshu: 'overview.html', dashiji: 'timeline.html', renwu: 'people.html', fulu: 'legends.html' };
  const partHref = (p) => SPECIAL_LINK[p.id] || `part.html?id=${p.id}`;

  /* ---------- 公共框架 ---------- */
  function chrome(active) {
    document.body.classList.add('inner');
    const nav = [['atlas.html', '志览'], ['overview.html', '区情'], ['timeline.html', '大事记'], ['caitai.html', '菜薹'], ['people.html', '人物'], ['legends.html', '诗文传说']];
    const top = document.createElement('header');
    top.className = 'hs-top';
    top.innerHTML = `<a class="hs-corner" href="index.html" title="回到菜薹林">${HSLogo(62)}<b>洪山志览<small>HONGSHAN</small></b></a>
      <button class="hs-burger" aria-label="菜单">☰</button>
      <nav class="hs-nav">${nav.map(([h, t]) => `<a href="${h}" class="${active === h ? 'on' : ''}">${t}</a>`).join('')}</nav>`;
    document.body.prepend(top);
    $('.hs-burger', top).onclick = () => $('.hs-nav', top).classList.toggle('open');
    const onS = () => top.classList.toggle('solid', scrollY > 40);
    addEventListener('scroll', onS, { passive: true }); onS();
    const f = document.createElement('footer');
    f.className = 'hs-foot';
    f.innerHTML = `<div class="wrap"><div class="fl">${HSLogo(40)}<div><b>洪山志览</b><div>一株菜薹里的洪山 · 《洪山区志》通俗解读</div></div></div>
      <div style="max-width:560px;line-height:1.8">内容依据《洪山区志》（武汉市洪山区地方志编纂委员会 编，武汉出版社）整理解读，记述时限主要至2000年，附录延至2006年。原文经 OCR 识别，个别字词或有出入，引用请以纸本为准。插画为 AI 创作的示意图。</div></div>`;
    document.body.append(f);
  }
  function reveal() {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.08 });
    $$('.reveal').forEach((el) => io.observe(el));
  }
  function countUp() {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return; io.unobserve(e.target);
      const el = e.target, raw = el.dataset.v, num = parseFloat(raw.replace(/,/g, ''));
      if (isNaN(num) || !/^[\d.,]+$/.test(raw)) { el.textContent = raw; return; }
      const dec = (raw.split('.')[1] || '').length, t0 = performance.now(), dur = 1400;
      const step = (now) => { const k = Math.min(1, (now - t0) / dur), e2 = 1 - Math.pow(1 - k, 3); el.textContent = (num * e2).toFixed(dec); if (k < 1) requestAnimationFrame(step); else el.textContent = raw; };
      requestAnimationFrame(step);
    }), { threshold: 0.4 });
    $$('.num .v').forEach((el) => io.observe(el));
  }
  const numsHTML = (arr, v) => `<div class="nums ${v || ''} reveal">${(arr || []).map((n) => `<div class="num"><span class="v" data-v="${esc(n.value)}">${esc(n.value)}</span><span class="u">${esc(n.unit)}</span><div class="l">${esc(n.label)}</div>${n.page ? `<span class="pg">原书 p.${n.page}</span>` : ''}</div>`).join('')}</div>`;
  const storiesHTML = (arr, v) => `<div class="stories ${v || ''}">${(arr || []).map((s) => `<article class="story reveal"><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p>${s.page ? `<span class="pg">原书第 ${s.page} 页</span>` : ''}</article>`).join('')}</div>`;
  const tilesHTML = (arr, typeKey) => `<div class="tiles">${(arr || []).map((t) => `<div class="tile reveal"><h4>${esc(t.name)}${typeKey && t[typeKey] ? `<small>${esc(t[typeKey])}</small>` : ''}</h4><p>${esc(t.text)}</p>${t.page ? `<span class="pg">原书 p.${t.page}</span>` : ''}</div>`).join('')}</div>`;
  const section = (eyebrow, title, inner, extra) => `<section class="sec ${extra || ''}"><div class="wrap"><div class="eyebrow">${eyebrow}</div><h2 class="sec-title">${title}</h2>${inner}</div></section>`;

  /* ---------- 志览 ---------- */
  function atlas() {
    chrome('atlas.html');
    const z = P.zongshu;
    const specials = [
      ['overview.html', 'zongshu', '卷首 · 总述', '区情总览', z.tagline],
      ['caitai.html', 'caitai', '专题', '洪山菜薹', '金殿玉菜的千年身世'],
      ['timeline.html', 'dashiji', '卷首 · 大事记', '大事记', P.dashiji.tagline],
      ['people.html', 'renwu', '卷末 · 人物', '人物', P.renwu.tagline],
      ['legends.html', 'fulu', '卷末 · 附录', '诗文传说', '十八个传说，一卷诗与联'],
    ];
    const main = document.createElement('main');
    main.innerHTML = `
    <section class="atlas-hero"><div class="wrap">
      <div class="eyebrow">THE GAZETTEER · 一千零四十一页</div>
      <h1>志 览</h1>
      <p class="sub">《洪山区志》共 29 篇，外加总述、大事记、人物与附录，从两亿年前的燕山运动写到光谷的光纤。我们把它拆成六座“园子”——山水、建置、物产、政事、文教、民生，挑着读，也能一页页翻原文。</p>
      <div class="atlas-search"><input id="q" placeholder="搜一搜：菜薹、东湖、卓刀泉、方言、血吸虫……"><button id="qb">查 找</button></div>
      <div class="sr" id="sr"></div>
      <div class="specials">${specials.map(([h, im, s, t, d]) => `<a class="sp reveal" href="${h}"><div class="bg" data-bg="${im}"></div><div class="t"><small>${s}</small><h3>${t}</h3><p>${esc(d)}</p></div></a>`).join('')}</div>
    </div></section>
    ${D.groups.map((g) => `
    <section class="grp g-${g.id}" style="--c:${g.color}"><div class="wrap">
      <div class="grp-head reveal"><div class="gn">${g.name}</div><div><div class="ge">${g.en}</div><div class="gd">${g.desc}</div></div></div>
      <div class="cards">${g.parts.map((id) => { const p = P[id]; return `<a class="card reveal" href="part.html?id=${id}"><div class="im" data-no="${partLabel(p)}" data-bg="${id}"></div><div class="tx">${g.id === 'zhengshi' ? `<small>${partLabel(p)}</small>` : ''}<h3>${esc(p.title)}</h3><p>${esc(p.tagline || '')}</p></div></a>`; }).join('')}</div>
    </div></section>`).join('')}`;
    document.body.insertBefore(main, $('.hs-foot'));
    // 搜索：首次输入时才加载全站索引
    const idx = []; let idxState = 0;
    const buildIdx = () => D.parts.forEach((p) => {
      idx.push({ t: p.title, s: (p.tagline || '') + ' ' + (p.keywords || []).join(' '), h: partHref(p), k: partLabel(p) });
      (p.stories || []).forEach((s) => idx.push({ t: s.title, s: s.text, h: partHref(p), k: p.title + ' · 故事' }));
      (p.chapters || []).forEach((c, i) => {
        idx.push({ t: c.title, s: (p.chapterNotes || {})[c.zhuanji ? '0' : c.no] || '', h: `read.html?id=${p.id}&ch=${i}`, k: p.title + ' · 章' });
        c.sections.forEach((s, j) => idx.push({ t: s, s: '', h: `read.html?id=${p.id}&ch=${i}#s${j}`, k: p.title + ' · ' + c.title }));
      });
      ['places', 'sights', 'universities', 'relics', 'tombs', 'specialties', 'people'].forEach((k) => (p[k] || []).forEach((x) => idx.push({ t: x.name, s: x.text, h: partHref(p), k: p.title })));
      (p.legends || []).forEach((x) => idx.push({ t: x.title, s: x.text.slice(0, 80), h: 'legends.html', k: '民间传说' }));
    });
    const run = () => {
      const q = $('#q').value.trim(), box = $('#sr');
      if (!q) { box.style.display = 'none'; return; }
      if (idxState !== 2) {
        box.innerHTML = '<a>正在载入索引……</a>'; box.style.display = 'block';
        if (!idxState) { idxState = 1; need(D.parts.map((p) => p.id)).then(() => { buildIdx(); idxState = 2; run(); }); }
        return;
      }
      const res = idx.filter((x) => (x.t + x.s).includes(q)).slice(0, 40);
      box.innerHTML = res.length ? res.map((x) => `<a href="${x.h}"><b>${esc(x.t).replaceAll(esc(q), `<mark>${esc(q)}</mark>`)}</b><span>${esc(x.k)}</span></a>`).join('') : '<a>未找到相关条目，换个词试试</a>';
      box.style.display = 'block';
    };
    $('#q').addEventListener('input', run); $('#qb').onclick = run;
    reveal();
  }

  /* ---------- 篇页 ---------- */
  const VARIANT = { shanshui: 'full', jianzhi: 'split', wuchan: 'arch', zhengshi: 'band', wenjiao: 'frame', minsheng: 'scrollv' };
  function part() {
    const p = P[Q.get('id')] || P.p01;
    if (SPECIAL_LINK[p.id]) { location.replace(SPECIAL_LINK[p.id]); return; }
    const g = G[p.group]; document.documentElement.style.setProperty('--c', g.color);
    document.title = `${partLabel(p)} ${p.title} · 洪山志览`;
    chrome('atlas.html');
    const v = VARIANT[p.group];
    const hero = `<header class="ph ${v === 'full' ? '' : v}">
      <div class="bg" data-bg="${p.id}"></div>
      <div class="in">${v === 'band' ? `<div><div class="eyebrow">${g.name} · ${partLabel(p)}</div><h1>${esc(p.title)}</h1><div class="tag">${esc(p.tagline)}</div></div><div class="seal">${cnum(p.no)}<br>篇</div>`
        : `<div class="eyebrow">${g.name} · ${partLabel(p)}</div><h1>${esc(p.title)}</h1><div class="tag">${esc(p.tagline)}</div>`}</div>
      ${v === 'full' ? '<div class="scroll">向下阅读</div>' : ''}
    </header>`;
    const nv = ['', 'v2', 'v3'][p.no % 3], sv = ['', 'notes', 'line'][(p.no + 1) % 3];
    let extras = '';
    if (p.places) extras += section('街 · 乡 · 镇', '十四个地名的前世今生', tilesHTML(p.places, 'type'));
    if (p.caitai) extras += `<section class="sec"><div class="wrap"><a href="caitai.html" class="sp reveal" style="height:320px;display:flex"><div class="bg" data-bg="${'caitai'}"></div><div class="t"><small>专题 · 专记</small><h3>洪山菜薹：金殿玉菜</h3><p>${esc(p.caitai.lead.slice(0, 60))}……</p></div></a></div></section>`
      + section('名 优 特 产', '洪山的“菜篮子”明星', tilesHTML(p.specialties));
    if (p.sights) extras += `<section class="sec"><div class="wrap"><div class="eyebrow">湖 光 山 色</div><h2 class="sec-title">去洪山，看什么</h2><div class="sp reveal" style="height:300px;display:flex;margin-bottom:24px"><div class="bg" data-bg="${'tour'}"></div><div class="t"><small>旅游业</small><h3>东湖之滨，洪山之麓</h3></div></div>${tilesHTML(p.sights)}</div></section>`;
    if (p.universities) extras += section('大 学 之 城', '区内的高等学府', tilesHTML(p.universities));
    if (p.relics) extras += section('文 物 古 迹', '六千年的地下与地上', tilesHTML(p.relics));
    if (p.customs) extras += section('生 活 习 俗', '老洪山人的日子', tilesHTML(p.customs.map((c) => ({ name: c.title, text: c.text, page: c.page }))));
    if (p.dialect) extras += section('方 言', '洪山话，你听得懂几句？', `<div class="dialect">${p.dialect.map((d) => `<div class="dl reveal"><b>${esc(d.word)}</b><span>${esc(d.meaning)}</span></div>`).join('')}</div>${p.sayings ? `<h3 class="h-kai" style="font-size:26px;margin:46px 0 18px">俗语选</h3><div class="sayings">${p.sayings.map((s) => `<span>${esc(s)}</span>`).join('')}</div>` : ''}`);
    if (p.tombs) extras += section('陵 园 墓 葬', '青山有幸埋忠骨', tilesHTML(p.tombs));
    const chs = p.chapters.map((c, i) => `<a class="ch reveal ${c.zhuanji ? 'zj' : ''}" href="read.html?id=${p.id}&ch=${i}"><div class="no">${c.zhuanji ? '专记' : '第' + cnum(c.no) + '章'}</div><h3>${esc(c.title)}</h3><p>${esc((p.chapterNotes || {})[c.zhuanji ? '0' : String(c.no)] || '')}</p><div class="secs">${c.sections.slice(0, 8).map(esc).join(' · ')}${c.sections.length > 8 ? ' …' : ''}</div><span class="go">→</span></a>`).join('');
    const i = ordered.indexOf(p), prev = ordered[i - 1], next = ordered[i + 1];
    const main = document.createElement('main');
    main.innerHTML = hero + `
      <section class="sec"><div class="wrap-narrow"><div class="eyebrow">导 读</div><p class="lead reveal">${esc(p.lead)}</p>
        <div class="kw">${(p.keywords || []).map((k) => `<span class="chip">#${esc(k)}</span>`).join('')}</div></div>
        <div class="wrap">${numsHTML(p.numbers, nv)}</div></section>
      ${section('志 中 拾 趣', '书里这些事，值得一说', storiesHTML(p.stories, sv))}
      ${extras}
      <section class="sec" style="background:rgba(239,230,210,.5)"><div class="wrap"><div class="eyebrow">原 文 目 录</div><h2 class="sec-title">逐章读原文</h2>
        ${p.intro_len !== 0 ? `<p class="muted" style="margin:-10px 0 26px">共 ${p.chapters.length} 章 · 原书第 ${p.start}—${p.end} 页 · <a href="read.html?id=${p.id}&ch=intro">先读本篇概述 →</a></p>` : ''}
        <div class="chs">${chs}</div>
        <div class="pnav">${prev ? `<a href="part.html?id=${prev.id}"><small>← 上一篇 · ${partLabel(prev)}</small><b>${esc(prev.title)}</b></a>` : '<span></span>'}${next ? `<a class="nx" href="part.html?id=${next.id}"><small>下一篇 · ${partLabel(next)} →</small><b>${esc(next.title)}</b></a>` : '<span></span>'}</div>
      </div></section>`;
    document.body.insertBefore(main, $('.hs-foot'));
    reveal(); countUp();
  }

  /* ---------- 原文阅读 ---------- */
  function loadText(id, cb) {
    if (window.HS_TEXT && HS_TEXT[id]) return cb(HS_TEXT[id]);
    const s = document.createElement('script'); s.src = `data/text/${id}.js?v=${DV}`; s.onload = () => cb(HS_TEXT[id]); document.head.append(s);
  }
  function blocksHTML(blocks, lastPg) {
    let h = '';
    blocks.forEach(([t, s, pg]) => {
      const mark = pg !== lastPg.v ? `<span class="pgm">原书 p.${pg}</span>` : ''; lastPg.v = pg;
      if (t === 'h') {
        if (/^[一二三四五六七八九十]+、/.test(s)) h += `<h3>${esc(s)}</h3>`;
        else h += `<h4>${esc(s)}</h4>`;
      } else if (/^(图|表)\s*\d+[-—－]\d+/.test(s) && s.length < 40) h += `<p class="fig">${esc(s)}</p>`;
      else h += `<p>${mark}${esc(s)}</p>`;
    });
    return h;
  }
  function read() {
    const p = P[Q.get('id')] || P.p01;
    const g = G[p.group]; if (g) document.documentElement.style.setProperty('--c', g.color);
    chrome(p.group ? 'atlas.html' : (SPECIAL_LINK[p.id] || 'atlas.html'));
    loadText(p.id, (T) => {
      const chParam = Q.get('ch');
      const hasIntro = T.intro && T.intro.length > 0;
      let ci = chParam === 'intro' && hasIntro ? -1 : Math.max(0, Math.min(T.chapters.length - 1, parseInt(chParam || '0', 10) || 0));
      if (chParam === null && hasIntro) ci = -1;
      const ch = ci < 0 ? { title: '概述', sections: [{ title: '', page: p.start, blocks: T.intro }] } : T.chapters[ci];
      const meta = ci < 0 ? null : p.chapters[ci];
      const chLabel = ci < 0 ? '概述' : (meta && meta.zhuanji ? '专记' : (p.no ? `第${cnum(ch.no)}章` : '原文'));
      document.title = `${ch.title} · ${p.title} · 洪山志览`;
      const note = ci < 0 ? '本篇总说：先看全貌，再读各章。' : ((p.chapterNotes || {})[meta && meta.zhuanji ? '0' : String(ch.no)] || '');
      const lastPg = { v: null };
      let sk = 0; const sid = ch.sections.map((x) => x.title ? 's' + (sk++) : '');
      const body = ch.sections.map((s, j) => (s.title ? `<h2 id="${sid[j]}">${esc(s.title)}</h2>` : '') + blocksHTML(s.blocks, lastPg)).join('');
      const navList = [];
      if (hasIntro) navList.push(`<a href="read.html?id=${p.id}&ch=intro" class="${ci < 0 ? 'on' : ''}">概述</a>`);
      T.chapters.forEach((c, k) => navList.push(`<a href="read.html?id=${p.id}&ch=${k}" class="${k === ci ? 'on' : ''}">${p.no ? (p.chapters[k].zhuanji ? '专记 ' : `${cnum(c.no)} · `) : ''}${esc(c.title)}</a>`));
      const prevI = ci - 1, nextI = ci + 1;
      const link = (k) => k < 0 ? (hasIntro ? `read.html?id=${p.id}&ch=intro` : null) : `read.html?id=${p.id}&ch=${k}`;
      const prevH = ci < 0 ? null : (prevI < 0 ? link(-1) : link(prevI));
      const nextH = nextI < T.chapters.length ? link(nextI) : null;
      const tName = (k) => k < 0 ? '概述' : T.chapters[k].title;
      const main = document.createElement('main');
      main.innerHTML = `<div class="progress" id="prog"></div>
        <header class="rd-head"><div class="bg" data-bg="${p.id === 'fulu' ? 'fulu' : p.id}"></div><div class="in">
          <div class="crumb"><a href="atlas.html">志览</a> / <a href="${partHref(p)}">${partLabel(p)} ${esc(p.title)}</a> / ${chLabel}</div>
          <h1>${esc(ch.title)}</h1></div></header>
        <div class="rd">
          <aside class="rd-side"><div class="sgrp"><h5>本篇各章</h5>${navList.join('')}</div>
            ${ch.sections.filter((s) => s.title).length ? `<div class="sgrp secl"><h5>本章小节</h5>${ch.sections.map((s, j) => s.title ? `<a href="#${sid[j]}" data-s="${sid[j]}">${esc(s.title)}</a>` : '').join('')}</div>` : ''}
          </aside>
          <article class="rd-main">
            ${note ? `<div class="rd-note"><b>导读：</b>${esc(note)}</div>` : ''}
            <div class="fontctl"><button data-f="-1">A−</button><button data-f="1">A+</button><span class="pg" style="align-self:center;margin-left:8px">以下为原书原文（OCR 识别，表格与插图从略）</span></div>
            <div class="rd-body" id="body">${body}</div>
            <div class="rd-pager">${prevH ? `<a href="${prevH}"><small>← 上一章</small><b>${esc(tName(prevI < 0 ? -1 : prevI))}</b></a>` : `<a href="${partHref(p)}"><small>← 返回</small><b>${esc(p.title)}</b></a>`}
              ${nextH ? `<a class="nx" href="${nextH}"><small>下一章 →</small><b>${esc(tName(nextI))}</b></a>` : `<a class="nx" href="${partHref(p)}"><small>本篇读完 →</small><b>回到${esc(p.title)}</b></a>`}</div>
          </article></div>`;
      document.body.insertBefore(main, $('.hs-foot'));
      // 字号
      let fs = parseFloat(localStorage.getItem('hs-fs') || '18');
      const apply = () => { $('#body').style.fontSize = fs + 'px'; localStorage.setItem('hs-fs', fs); }; apply();
      $$('.fontctl button').forEach((b) => (b.onclick = () => { fs = Math.max(15, Math.min(24, fs + +b.dataset.f)); apply(); }));
      // 进度 + 小节高亮
      const heads = $$('.rd-body h2');
      const onS = () => {
        const h = document.documentElement; $('#prog').style.width = (scrollY / (h.scrollHeight - innerHeight) * 100) + '%';
        let cur = null; heads.forEach((x) => { if (x.getBoundingClientRect().top < 140) cur = x.id; });
        $$('.secl a').forEach((a) => a.classList.toggle('on', a.dataset.s === cur));
      };
      addEventListener('scroll', onS, { passive: true }); onS();
      if (location.hash) setTimeout(() => { const t = $(location.hash); t && t.scrollIntoView(); }, 50);
    });
  }

  /* ---------- 区情（总述） ---------- */
  function overview() {
    chrome('overview.html');
    const z = P.zongshu, pl = P.p02;
    const icons = ['◎', '⌂', '⛰', '⚘', '⚙', '✎', '✚', '✦'];
    const main = document.createElement('main');
    main.innerHTML = `<header class="ph"><div class="bg" data-bg="${'zongshu'}"></div><div class="in"><div class="eyebrow">卷首 · 总述</div><h1>洪山是谁</h1><div class="tag">${esc(z.tagline)}</div></div><div class="scroll">向下阅读</div></header>
      <section class="sec"><div class="wrap-narrow"><div class="eyebrow">一 段 话 认 识 洪 山</div><p class="lead reveal">${esc(z.lead)}</p></div><div class="wrap">${numsHTML(z.numbers, 'v3')}</div></section>
      ${section('全 景 八 题', '八个角度看洪山', `<div class="pano reveal">${(z.panorama || []).map((x, i) => `<div><h4><i>${icons[i % 8]} 0${i + 1}</i>${esc(x.title)}</h4><p>${esc(x.text)}</p></div>`).join('')}</div>`)}
      ${section('总 述 拾 趣', '值得记住的几件事', storiesHTML(z.stories, 'notes'))}
      ${section('街 乡 镇', '2000年的洪山版图：6乡2镇6街', tilesHTML(pl.places, 'type') + `<p style="margin-top:26px"><a class="btn" href="part.html?id=p02">详读第二篇 建置 街乡镇 →</a> <a class="btn ghost" href="read.html?id=zongshu">读总述原文</a></p>`)}`;
    document.body.insertBefore(main, $('.hs-foot'));
    reveal(); countUp();
  }

  /* ---------- 大事记 ---------- */
  function timeline() {
    chrome('timeline.html');
    const d = P.dashiji, ev = d.events.slice().sort((a, b) => a.year - b.year);
    const main = document.createElement('main');
    main.innerHTML = `<header class="ph band"><div class="bg" data-bg="${'dashiji'}"></div><div class="in"><div><div class="eyebrow">卷首 · 大事记</div><h1>三千年，一条河</h1><div class="tag">${esc(d.tagline)}</div></div><div class="seal">大事<br>纪年</div></div></header>
      <section class="sec" style="padding-bottom:20px"><div class="wrap-narrow"><p class="lead reveal">${esc(d.lead)}</p></div></section>
      <div class="tl-filter">${['全部', '古代', '近代', '当代', '只看大事'].map((x, i) => `<button class="${i ? '' : 'on'}" data-f="${x}">${x}</button>`).join('')}</div>
      <div class="tl" id="tl"></div>
      <section class="sec"><div class="wrap" style="text-align:center"><a class="btn" href="read.html?id=dashiji">翻阅大事记原文（原书第11—30页）</a></div></section>`;
    document.body.insertBefore(main, $('.hs-foot'));
    const draw = (f) => {
      let h = '', era = null;
      ev.filter((e) => f === '全部' || (f === '只看大事' ? e.major : e.era === f)).forEach((e) => {
        if (e.era !== era) { era = e.era; h += `<div class="tl-era"><span>${era}</span></div>`; }
        const yr = e.year < 0 ? `前${-e.year}` : e.year;
        h += `<div class="ev reveal ${e.major ? 'major' : ''}"><span class="dot"></span><div class="yr">${yr}</div><div class="box"><div class="tm">${esc(e.time)}</div><h3>${esc(e.title)}</h3><p>${esc(e.text)}</p><span class="pg">原书 p.${e.page}</span></div></div>`;
      });
      $('#tl').innerHTML = h; reveal();
    };
    $$('.tl-filter button').forEach((b) => (b.onclick = () => { $$('.tl-filter button').forEach((x) => x.classList.remove('on')); b.classList.add('on'); draw(b.dataset.f); }));
    draw('全部');
  }

  /* ---------- 人物 ---------- */
  function people() {
    chrome('people.html');
    const r = P.renwu, fields = ['全部', ...Array.from(new Set(r.people.map((x) => x.field)))];
    const main = document.createElement('main');
    main.innerHTML = `<header class="ph split"><div class="bg" data-bg="${'renwu'}"></div><div class="in"><div class="eyebrow">卷末 · 人物</div><h1>洪山人物</h1><div class="tag">${esc(r.tagline)}</div></div></header>
      <section class="sec" style="padding-top:40px"><div class="wrap-narrow"><p class="lead reveal">${esc(r.lead)}</p></div><div class="wrap">${numsHTML(r.stats, 'v2')}</div></section>
      <section class="sec" style="padding-top:0"><div class="wrap"><div class="eyebrow">人 物 传 略</div><h2 class="sec-title">${r.people.length} 位传主 · 点卡片读生平</h2><p class="muted" style="margin:-12px 0 22px;font-size:13px">原书导语称“人物传略收录75人”，经逐页核对，正文（第910—933页）实有 ${r.people.length} 篇传略，此处按正文收录。</p>
        <div class="tl-filter" style="position:static;background:none;justify-content:flex-start">${fields.map((f, i) => `<button class="${i ? '' : 'on'}" data-f="${f}">${f}</button>`).join('')}</div>
        <div class="pp-grid" id="pg"></div></div></section>
      ${r.heroes && r.heroes.length ? section('英 烈 名 录', '他们的名字', `<div class="namewall reveal">${r.heroes.map((n) => `<span>${esc(n)}</span>`).join('')}</div>`) : ''}
      <section class="sec"><div class="wrap" style="text-align:center"><a class="btn" href="read.html?id=renwu">阅读人物篇原文</a></div></section>
      <div class="modal" id="md"><div class="card2"><button class="x">×</button><div id="mdc"></div></div></div>`;
    document.body.insertBefore(main, $('.hs-foot'));
    const draw = (f) => {
      $('#pg').innerHTML = r.people.map((x, i) => (f === '全部' || x.field === f) ? `<div class="pp reveal" data-i="${i}"><div class="nm">${esc(x.name)}</div><div class="yr">${esc(x.years || '')}${x.origin ? ' · ' + esc(x.origin).slice(0, 14) : ''}</div><span class="tg">${esc(x.tag)}</span><div class="ini">${esc(x.name[0])}</div></div>` : '').join('');
      reveal();
      $$('.pp').forEach((el) => (el.onclick = () => {
        const x = r.people[+el.dataset.i];
        $('#mdc').innerHTML = `<div class="eyebrow">${esc(x.field)}</div><h2>${esc(x.name)}</h2><div class="muted" style="margin-bottom:18px">${esc(x.years || '')} · ${esc(x.origin || '')} · ${esc(x.tag)}</div><div class="body">${esc(x.text)}</div><p class="pg" style="margin-top:18px">原书第 ${x.page} 页 · <a href="read.html?id=renwu">读原文</a></p>`;
        $('#md').classList.add('open');
      }));
    };
    $('#md').onclick = (e) => { if (e.target.id === 'md' || e.target.classList.contains('x')) $('#md').classList.remove('open'); };
    $$('.tl-filter button').forEach((b) => (b.onclick = () => { $$('.tl-filter button').forEach((x) => x.classList.remove('on')); b.classList.add('on'); draw(b.dataset.f); }));
    draw('全部');
  }

  /* ---------- 诗文传说 ---------- */
  function legends() {
    chrome('legends.html');
    const f = P.fulu;
    const pal = [['#3a2d5c', '#7a2f5c'], ['#2f5d50', '#1d3b33'], ['#8a4b1f', '#5c2b12'], ['#244a6b', '#1a2f45'], ['#7a2f5c', '#b8860b'], ['#5a3a2a', '#2f1f16']];
    const main = document.createElement('main');
    main.innerHTML = `<header class="ph scrollv"><div class="in"><div class="eyebrow">卷末 · 附录</div><h1>诗文传说</h1><div class="tag">卓刀泉、放鹰台、孝子菜……</div></div><div class="bg" data-bg="${'fulu'}"></div></header>
      ${section('民 间 传 说', `${f.legends.length} 个故事，点开来读`, `<div class="lg-grid">${f.legends.map((l, i) => { const [a, b] = pal[i % pal.length]; return `<div class="lg reveal" data-i="${i}" style="--a:${a};--b:${b}"><span class="n">传说 · ${String(i + 1).padStart(2, '0')}</span><h3>${esc(l.title)}</h3><p>${esc(l.text.slice(0, 34))}…</p></div>`; }).join('')}</div>`)}
      ${section('诗 词', '历代诗人笔下的洪山（向左滑动）', `<div class="poems">${f.poems.map((p) => `<div class="poem"><h4>${esc(p.title)}</h4><span class="au">〔${esc(p.dynasty)}〕${esc(p.author)}</span><div class="tx">${esc(p.text)}</div></div>`).join('')}</div>`)}
      ${section('楹 联', '寺观亭台上的对子', `<div class="couplets">${f.couplets.map((c) => { const [a, b] = c.text.split('\n'); return `<div class="cp reveal"><div class="pair"><div>${esc(a || '')}</div><div>${esc(b || '')}</div></div><small>${esc(c.place)}</small></div>`; }).join('')}</div>`)}
      ${f.wencun && f.wencun.length ? section('文 存', '几份改变洪山版图的文件', tilesHTML(f.wencun.map((w) => ({ name: w.title, text: w.summary, page: w.page })))) : ''}
      <section class="sec"><div class="wrap" style="text-align:center"><a class="btn" href="read.html?id=fulu">阅读附录原文</a></div></section>
      <div class="modal" id="md"><div class="card2"><button class="x">×</button><div id="mdc"></div></div></div>`;
    document.body.insertBefore(main, $('.hs-foot'));
    $$('.lg').forEach((el) => (el.onclick = () => {
      const l = f.legends[+el.dataset.i];
      $('#mdc').innerHTML = `<div class="eyebrow">民间传说</div><h2>${esc(l.title)}</h2><div class="body" style="margin-top:16px">${esc(l.text)}</div><p class="pg" style="margin-top:18px">原书第 ${l.page} 页</p>`;
      $('#md').classList.add('open');
    }));
    $('#md').onclick = (e) => { if (e.target.id === 'md' || e.target.classList.contains('x')) $('#md').classList.remove('open'); };
    reveal();
  }

  /* ---------- 菜薹专题 ---------- */
  function caitai() {
    chrome('caitai.html');
    document.documentElement.style.setProperty('--c', '#7a2f5c');
    const a = P.p07, c = a.caitai, f = P.fulu;
    const leg = f.legends.filter((l) => /菜薹|孝子菜/.test(l.title));
    const zi = a.chapters.findIndex((x) => x.zhuanji);
    const main = document.createElement('main');
    main.innerHTML = `<header class="ph arch"><div class="bg" data-bg="${'caitai'}"></div><div class="in"><div class="eyebrow">专 题 · 专 记</div><h1>洪山菜薹</h1><div class="tag">紫薹黄花，金殿玉菜</div></div></header>
      <section class="sec"><div class="wrap-narrow"><p class="lead reveal">${esc(c.lead)}</p></div><div class="wrap">${numsHTML(c.facts, 'v2')}</div></section>
      ${section('古 籍 里 的 菜 薹', '书上是这么写的', `<div class="ct-quote">${c.quotes.map((q) => `<div class="reveal"><p>${esc(q.text)}</p><small>${esc(q.src)}</small></div>`).join('')}</div>`)}
      ${section('身 世 年 表', '从油菜到红菜薹', `<div class="ct-tl">${c.timeline.map((t) => `<div class="reveal"><b>${esc(t.time)}</b>${esc(t.text)}</div>`).join('')}</div>`)}
      ${section('传 说', '关于一棵菜的三个故事', `<div class="stories notes">${leg.map((l) => `<article class="story reveal"><h3>${esc(l.title)}</h3><p style="white-space:pre-wrap">${esc(l.text)}</p><span class="pg">原书第 ${l.page} 页</span></article>`).join('')}</div>`)}
      ${section('同 一 片 土', '洪山的其他名优物产', tilesHTML(a.specialties))}
      <section class="sec"><div class="wrap" style="text-align:center;display:flex;gap:14px;justify-content:center;flex-wrap:wrap">${zi >= 0 ? `<a class="btn" href="read.html?id=p07&ch=${zi}">读原书专记《洪山菜薹》</a>` : ''}<a class="btn ghost" href="part.html?id=p07">进入第七篇 农业</a></div></section>`;
    document.body.insertBefore(main, $('.hs-foot'));
    reveal(); countUp();
  }

  window.HSApp = {
    atlas,
    part: () => need([pid()]).then(part),
    read: () => need([pid()]).then(read),
    overview: () => need(['zongshu', 'p02']).then(overview),
    timeline: () => need(['dashiji']).then(timeline),
    people: () => need(['renwu']).then(people),
    legends: () => need(['fulu']).then(legends),
    caitai: () => need(['p07', 'fulu']).then(caitai),
  };
})();
