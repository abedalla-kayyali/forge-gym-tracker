// Custom Background
let _customBgHex = localStorage.getItem('forge_custom_bg') || '';

function _clearCustomBg() {
  // Remove inline style overrides set by applyCustomBg
  document.body.style.removeProperty('--bg');
  document.body.style.removeProperty('--bg2');
  document.body.style.removeProperty('--surface');
  document.body.style.removeProperty('--surface2');
}

function applyCustomBg(hex) {
  if (!hex) {
    _clearCustomBg();
    _customBgHex = '';
    localStorage.removeItem('forge_custom_bg');
    _renderCustomBgRow();
    return;
  }
  _customBgHex = hex;
  localStorage.setItem('forge_custom_bg', hex);
  // Derive a slightly lighter surface color from base bg
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lift = (v, a) => Math.min(255, Math.round(v + a));
  const toHex = (x, y, z) => '#' + [x, y, z].map(v => v.toString(16).padStart(2, '0')).join('');
  const bg2 = toHex(lift(r, 12), lift(g, 12), lift(b, 12));
  const surf = toHex(lift(r, 18), lift(g, 18), lift(b, 18));
  const surf2 = toHex(lift(r, 28), lift(g, 28), lift(b, 28));
  document.body.style.setProperty('--bg', hex);
  document.body.style.setProperty('--bg2', bg2);
  document.body.style.setProperty('--surface', surf);
  document.body.style.setProperty('--surface2', surf2);
  _renderCustomBgRow();
}

function _renderCustomBgRow() {
  const row = document.getElementById('custom-bg-row');
  if (!row) return;
  const hex = _customBgHex;
  row.innerHTML = `
    <span style="font-size:12px;color:var(--text3);font-family:'DM Mono',monospace;">BG COLOR</span>
    <label class="custom-bg-swatch" title="Pick background color" style="${hex ? 'background:' + hex + ';' : ''}">
      ${!hex ? '<span style="font-size:16px;line-height:28px;text-align:center;display:block;">+</span>' : ''}
      <input type="color" value="${hex || '#1a1a1a'}" oninput="applyCustomBg(this.value)">
    </label>
    ${hex ? `<button class="custom-bg-reset" onclick="applyCustomBg('')">? Reset</button>` : ''}
    ${hex ? `<span style="font-size:10px;font-family:'DM Mono',monospace;color:var(--text3);">${hex}</span>` : ''}
  `;
}
