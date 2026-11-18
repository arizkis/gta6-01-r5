// Four small screen-printed faces, painted locally once and reused by the dialogue HUD.
const portraits = new Map();
const people = {
  juno: { skin: '#ce9978', shade: '#a46b58', shirt: '#ef946f', hair: '#4e4547', backdrop: '#eb5f8d' },
  tavi: { skin: '#c99878', shade: '#97644e', shirt: '#75d2be', hair: '#4e4547', backdrop: '#187d80' },
  niko: { skin: '#c99878', shade: '#a36a50', shirt: '#f6bf65', hair: '#4e4547', backdrop: '#e88b46' },
  paz: { skin: '#c99878', shade: '#9b6656', shirt: '#e99fba', hair: '#4e4547', backdrop: '#a8659a' },
};
export function portraitFor(speaker = 'Juno') {
  const id = Object.keys(people).find(name => speaker.toLowerCase().includes(name)) ?? 'juno';
  if (portraits.has(id)) return portraits.get(id);
  const p = people[id], canvas = document.createElement('canvas');
  canvas.width = 160; canvas.height = 184;
  const ctx = canvas.getContext('2d');
  function polygon(color, points) {
    ctx.fillStyle = color; ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = p.backdrop; ctx.fillRect(0, 0, 160, 184);
  polygon('#ffd591', [[0, 18], [160, 0], [160, 37], [0, 68]]);
  polygon(p.shirt, [[9, 184], [20, 142], [58, 126], [103, 126], [143, 148], [157, 184]]);
  polygon(p.shade, [[65, 112], [98, 112], [102, 142], [79, 154], [59, 140]]);
  polygon(p.hair, [[39, 108], [35, 52], [48, 25], [91, 19], [121, 43], [126, 109], [109, 132]]);
  polygon(p.skin, [[47, 54], [73, 39], [108, 50], [115, 98], [99, 121], [78, 130], [54, 111]]);
  polygon(p.shade, [[94, 52], [108, 50], [115, 98], [99, 121], [78, 130], [83, 107]]);
  polygon(p.hair, [[41, 60], [44, 30], [85, 20], [116, 38], [116, 64], [90, 46], [67, 55]]);
  ctx.fillStyle = '#203e4c'; ctx.fillRect(49, 72, 26, 13); ctx.fillRect(87, 72, 25, 13); ctx.fillRect(72, 76, 18, 4);
  ctx.fillStyle = '#8ed3d3'; ctx.fillRect(52, 74, 16, 3); ctx.fillRect(90, 74, 14, 3);
  polygon('#e7ac84', [[79, 82], [74, 99], [88, 99]]);
  ctx.fillStyle = '#693e40'; ctx.fillRect(69, 110, 23, 3);
  if (id === 'juno') polygon(p.hair, [[39, 59], [27, 85], [33, 140], [50, 127], [51, 65]]);
  if (id === 'tavi') {
    polygon('#225f65', [[38, 49], [46, 22], [103, 20], [122, 47]]);
    ctx.fillStyle = '#f8c46c'; ctx.fillRect(38, 44, 88, 8); ctx.fillRect(80, 26, 14, 13);
    polygon('#23565e', [[31, 144], [51, 137], [64, 184], [37, 184]]);
  }
  if (id === 'niko') { ctx.fillStyle = '#ffe19c'; ctx.fillRect(99, 99, 5, 8); polygon('#263f4a', [[60, 136], [80, 152], [102, 136], [93, 168], [73, 170]]); }
  if (id === 'paz') {
    polygon('#f7c98a', [[30, 49], [53, 31], [105, 31], [132, 50], [123, 58], [38, 58]]);
    ctx.strokeStyle = '#ffdd8f'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(113, 102, 8, 0, Math.PI * 2); ctx.stroke();
  }
  const url = canvas.toDataURL('image/png'); portraits.set(id, url); return url;
}
