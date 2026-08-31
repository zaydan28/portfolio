/**
 * @file counter.js
 * @description Animated number counter with ease-out cubic.
 */

class AnimatedCounter {
  static animate(el, target, duration = 1600, formatter = null) {
    if (!el || isNaN(target)) return;
    const startTime = performance.now();
    const tick = (now) => {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      const value    = Math.round(eased * target);
      el.textContent = formatter ? formatter(value) : value;
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = formatter ? formatter(target) : target;
    };
    requestAnimationFrame(tick);
  }
  static initAll(selector = '[data-count]') {
    document.querySelectorAll(selector).forEach(el => {
      const target = parseInt(el.dataset.count, 10);
      if (!isNaN(target)) AnimatedCounter.animate(el, target);
    });
  }
}
