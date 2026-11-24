/* 统一标识：一丛洪山菜薹（SVG，带微风摇曳） */
window.HSLogo = function (size) {
  size = size || 64;
  const flower = (x, y, r, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})">` +
    [0, 90, 180, 270].map(a => `<ellipse cx="${r * .75}" cy="0" rx="${r * .7}" ry="${r * .48}" transform="rotate(${a + 12})" fill="#f5c20f"/>`).join('') +
    `<circle r="${r * .3}" fill="#d98b05"/></g>`;
  const bud = (x, y, r) => `<ellipse cx="${x}" cy="${y}" rx="${r * .55}" ry="${r * .8}" fill="#b9bf4e"/>`;
  const head = (cx, cy, s) => {
    let h = '';
    h += bud(cx, cy - 6 * s, 3 * s) + bud(cx - 2.6 * s, cy - 3.5 * s, 2.6 * s) + bud(cx + 2.8 * s, cy - 3.2 * s, 2.6 * s);
    h += `<path d="M${cx} ${cy + 2 * s} l${-6 * s} ${-1 * s} M${cx} ${cy + 5 * s} l${6.5 * s} ${-1.5 * s} M${cx} ${cy + 8 * s} l${-6 * s} ${1 * s} M${cx} ${cy + 11 * s} l${6 * s} ${0.5 * s}" stroke="#7d4a5c" stroke-width="${0.9 * s}" fill="none"/>`;
    h += flower(cx - 6 * s, cy + 1 * s, 3.1 * s, 10) + flower(cx + 6.5 * s, cy + 3.5 * s, 3.3 * s, 35) + flower(cx - 6 * s, cy + 9 * s, 3.4 * s, 60) + flower(cx + 6 * s, cy + 11.5 * s, 3.2 * s, 20) + flower(cx + 1 * s, cy - 1 * s, 2.6 * s, 45);
    return h;
  };
  const leaf = (x, y, len, ang, w) => `<path transform="translate(${x} ${y}) rotate(${ang})" d="M0 0 C ${len * .3} ${-len * w} ${len * .75} ${-len * w * .7} ${len} 0 C ${len * .7} ${len * w * .6} ${len * .3} ${len * w * .8} 0 0Z" fill="url(#hsLeaf)"/>` +
    `<path transform="translate(${x} ${y}) rotate(${ang})" d="M1 0 Q ${len * .5} ${-len * .04} ${len * .95} 0" stroke="rgba(214,160,196,.8)" stroke-width=".8" fill="none"/>`;
  return `<svg class="hs-logo-svg" width="${size}" height="${size * 1.15}" viewBox="0 0 120 138" aria-label="洪山菜薹" role="img">
  <defs>
    <linearGradient id="hsStem" x1="0" x2="1"><stop offset="0" stop-color="#4d1638"/><stop offset=".45" stop-color="#8f3a6b"/><stop offset="1" stop-color="#4d1638"/></linearGradient>
    <linearGradient id="hsLeaf" x1="0" x2="1"><stop offset="0" stop-color="#5a2a4e"/><stop offset=".6" stop-color="#4f5e3f"/><stop offset="1" stop-color="#6a8048"/></linearGradient>
  </defs>
  <ellipse cx="60" cy="132" rx="40" ry="5" fill="rgba(90,60,40,.18)"/>
  <g class="hs-st hs-st1"><path d="M58 132 C 54 100, 40 70, 30 44" stroke="url(#hsStem)" stroke-width="4.2" fill="none" stroke-linecap="round"/>
    ${leaf(50, 104, 26, 200, .34)}${leaf(42, 80, 16, 215, .3)}${head(29, 30, .95)}</g>
  <g class="hs-st hs-st3"><path d="M63 132 C 68 104, 82 80, 92 56" stroke="url(#hsStem)" stroke-width="4" fill="none" stroke-linecap="round"/>
    ${leaf(70, 108, 26, -20, .34)}${leaf(80, 86, 15, -35, .3)}${head(93, 42, .9)}</g>
  <g class="hs-st hs-st2"><path d="M60 132 C 60 100, 62 60, 60 24" stroke="url(#hsStem)" stroke-width="5" fill="none" stroke-linecap="round"/>
    ${leaf(60, 112, 30, -32, .36)}${leaf(60, 96, 28, 212, .34)}${leaf(61, 70, 16, -40, .3)}${head(60, 10, 1.05)}</g>
</svg>`;
};
