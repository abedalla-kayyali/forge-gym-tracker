// Lightweight runtime cleanup for legacy placeholder icons/text.
// Important: keep this fast and never scan/modify SCRIPT/STYLE trees.

function _icon(surrogate) {
  return surrogate;
}

const ICONS = {
  mascot: _icon("\uD83E\uDD16"),        // 🤖
  level: _icon("\uD83E\uDD47"),         // 🥇
  emptyHint: _icon("\uD83C\uDFCB\uFE0F"), // 🏋️
  empty: _icon("\uD83D\uDCEC"),         // 📬
  goal: _icon("\uD83C\uDFAF"),          // 🎯
  logo: _icon("\uD83D\uDD25"),          // 🔥
  bio: _icon("\u2696\uFE0F"),           // ⚖️
  sparkle: _icon("\u2728"),             // ✨
  trophy: _icon("\uD83C\uDFC6"),        // 🏆
  tree: _icon("\uD83C\uDF33"),          // 🌳
  muscle: _icon("\uD83D\uDCAA"),        // 💪
  alarm: _icon("\u23F0"),               // ⏰
  check: _icon("\u2705"),               // ✅
  cali: _icon("\uD83E\uDD38"),          // 🤸
  left: _icon("\u2190"),                // ←
  right: _icon("\u2192")                // →
};

function _shouldSkipElement(el) {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return true;
  const tag = el.tagName;
  return tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT" || tag === "TEMPLATE";
}

function _isPlaceholderOnly(text) {
  const t = (text || "").trim();
  return /^[?\uFFFD]+$/.test(t);
}

function _cleanTextValue(s) {
  if (!s) return s;
  let out = String(s);
  out = out.replace(/\uFFFD/g, "-");
  out = out.replace(/[?\uFFFD]{2,}\s+/g, "");
  out = out.replace(/\s+[?\uFFFD]{2,}$/g, "");
  out = out.replace(/\s*-\s*-\s*/g, " - ");
  out = out.replace(/\s{2,}/g, " ");
  out = out.replace(/(\d)\s*-\s*(\d)/g, "$1-$2");
  return out.trim();
}

function _repairPlaceholderIcon(el) {
  if (_shouldSkipElement(el)) return;
  if (!_isPlaceholderOnly(el.textContent || "")) return;

  const cls = String(el.className || "");
  const id = String(el.id || "");

  if (id === "mascot-emoji" || cls.includes("mascot-emoji")) { el.textContent = ICONS.mascot; return; }
  if (id === "level-icon" || cls.includes("level-icon")) { el.textContent = ICONS.level; return; }
  if (id === "su-tree-icon") { el.textContent = ICONS.tree; return; }
  if (id === "mdc-icon" || cls.includes("mdc-muscle-icon")) { el.textContent = ICONS.muscle; return; }
  if (cls.includes("rest-done-icon")) { el.textContent = ICONS.alarm; return; }
  if (cls.includes("empty-hint-icon")) { el.textContent = ICONS.emptyHint; return; }
  if (cls.includes("empty-icon")) { el.textContent = ICONS.empty; return; }
  if (cls.includes("onb-goal-icon")) { el.textContent = ICONS.goal; return; }
  if (cls.includes("onb-logo-emoji")) { el.textContent = ICONS.logo; return; }
  if (cls.includes("onb-done-icon")) { el.textContent = ICONS.check; return; }
  if (cls.includes("tour-done-tile-icon")) { el.textContent = ICONS.trophy; return; }
  if (cls.includes("bio-modal-icon")) { el.textContent = ICONS.bio; return; }
  if (cls.includes("tour-fi-icon") || cls.includes("tour-icon-wrap")) { el.textContent = ICONS.sparkle; return; }
  if (id === "ach-emoji" || cls.includes("ach-emoji")) { el.textContent = ICONS.trophy; return; }
  if (cls.includes("pr-path-icon")) { el.textContent = ICONS.goal; return; }
  if (cls.includes("cali-snap-icon")) { el.textContent = ICONS.cali; return; }
  if (id === "balance-overall-badge" || id === "pr-path-target-text") { el.textContent = "--"; return; }
  if (id === "snap-last" || id === "snap-trend" || id === "snap-cali-skills") { el.textContent = "--"; return; }
  if (cls.includes("onb-slim-back")) { el.textContent = ICONS.left; return; }
  if (cls.includes("sh-qs-arrow")) { el.textContent = ICONS.right; return; }
  if (cls.includes("hdr-water-undo")) { el.textContent = "\u21BA"; return; } // ↺
  if (cls.includes("checkin-star")) { el.textContent = "\u2606"; return; } // ☆

  // Unknown placeholders: leave as-is to avoid illogical icon substitutions.
}

function _stripLeadingPlaceholders(el) {
  if (_shouldSkipElement(el) || el.children.length) return;
  const txt = (el.textContent || "").trim();
  if (/^[?\uFFFD]+\s+/.test(txt)) {
    el.textContent = txt.replace(/^[?\uFFFD]+\s+/, "");
  }
}

function _repairAttributes(el) {
  if (_shouldSkipElement(el) || !el.getAttributeNames) return;
  ["title", "placeholder", "aria-label"].forEach((name) => {
    const val = el.getAttribute(name);
    if (!val) return;
    const clean = _cleanTextValue(val);
    if (clean !== val) el.setAttribute(name, clean);
  });
}

function _repairTextNode(node) {
  if (!node || node.nodeType !== Node.TEXT_NODE) return;
  const parent = node.parentElement;
  if (_shouldSkipElement(parent)) return;
  const oldVal = node.nodeValue || "";
  if (!oldVal) return;
  const clean = _cleanTextValue(oldVal);
  if (clean !== oldVal) node.nodeValue = clean;
}

function _repairElement(el) {
  if (_shouldSkipElement(el)) return;
  _repairPlaceholderIcon(el);
  _stripLeadingPlaceholders(el);
  _repairAttributes(el);
  for (const node of el.childNodes) _repairTextNode(node);
}

function _repairKnownTextArtifacts() {
  ["hdr-coach-ticker-text", "mascot-line", "mascot-name", "xp-label"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = _cleanTextValue(el.textContent || "");
  });

  const evo = document.getElementById("mascot-evo");
  if (evo && evo.innerHTML.includes("\uFFFD")) {
    evo.innerHTML = evo.innerHTML.replace(/\uFFFD/g, ">");
  }
}

function repairDamagedIcons(root) {
  const scope = root && root.nodeType === Node.ELEMENT_NODE ? root : document.body;
  if (!scope) return;

  _repairElement(scope);
  scope.querySelectorAll("*").forEach((el) => _repairElement(el));
  _repairKnownTextArtifacts();
}

let _repairScheduled = false;
let _repairing = false;

function _scheduleRepair(root) {
  if (_repairScheduled) return;
  _repairScheduled = true;
  requestAnimationFrame(() => {
    _repairScheduled = false;
    if (_repairing) return;
    _repairing = true;
    try {
      repairDamagedIcons(root || document.body);
    } finally {
      _repairing = false;
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => _scheduleRepair(document.body));
} else {
  _scheduleRepair(document.body);
}

const _iconRepairObserver = new MutationObserver((mutations) => {
  let root = null;
  for (const m of mutations) {
    if (m.type === "characterData") {
      const p = m.target && m.target.parentElement;
      if (p && !_shouldSkipElement(p)) { root = p; break; }
      continue;
    }
    if (m.addedNodes && m.addedNodes.length) {
      for (const n of m.addedNodes) {
        if (n.nodeType === Node.ELEMENT_NODE && !_shouldSkipElement(n)) { root = n; break; }
      }
      if (root) break;
    }
  }
  _scheduleRepair(root || document.body);
});

_iconRepairObserver.observe(document.documentElement, {
  childList: true,
  subtree: true,
  characterData: true
});
