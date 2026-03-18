// js/fx.js — FORGE unified FX facade
// Thin delegation layer over fx-sound.js, fx-haptic.js, fx-visuals.js
// Usage: fx.sound('sndPR'); fx.haptic('hapPR'); fx.burst('PR', x, y);
(function() {
  'use strict';
  window.fx = {
    sound: function(name) {
      try { if (typeof window[name] === 'function') window[name](); } catch(e) {}
    },
    haptic: function(name) {
      try { if (typeof window[name] === 'function') window[name](); } catch(e) {}
    },
    burst: function(type, x, y) {
      var fn = 'burst' + type;
      try { if (typeof window[fn] === 'function') window[fn](x, y); } catch(e) {}
    },
    flash: function(type) {
      var fn = 'flash' + type;
      try { if (typeof window[fn] === 'function') window[fn](); } catch(e) {}
    }
  };
})();
