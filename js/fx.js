// js/fx.js — FORGE unified FX facade
// Thin delegation layer over fx-sound.js, fx-haptic.js, fx-visuals.js
// Usage: fx.sound('sndPR'); fx.haptic('hapPR'); fx.burst('PR', btnEl); fx.burst('Save');
(function() {
  'use strict';
  window.fx = {
    sound: function(name) {
      try { if (typeof window[name] === 'function') window[name](); } catch(e) {}
    },
    haptic: function(name) {
      try { if (typeof window[name] === 'function') window[name](); } catch(e) {}
    },
    burst: function(type) {
      var fn = 'burst' + type;
      var args = Array.prototype.slice.call(arguments, 1);
      try { if (typeof window[fn] === 'function') window[fn].apply(window, args); } catch(e) {}
    },
    flash: function(type) {
      var fn = 'flash' + type;
      try { if (typeof window[fn] === 'function') window[fn](); } catch(e) {}
    }
  };
})();
