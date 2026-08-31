/**
 * @file glitch.js
 * @description Glitch text system and role typewriter.
 */

class GlitchSystem {
  static CHARS = '░▒▓█▄▀#@!?01XZ';

  constructor() {
    this._timers = [];
    this._scheduleLoop();
  }

  /**
   * Apply glitch to element — progressively reveals original.
   * @param {HTMLElement} el
   * @param {number}      duration ms
   */
  glitch(el, duration = 350) {
    const original = el.dataset.glitchOriginal ?? el.textContent;
    el.dataset.glitchOriginal = original;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const revealed = Math.floor(progress * original.length);
      el.textContent = original.split('').map((ch, i) => {
        if (ch === ' ' || ch === '\n') return ch;
        if (i < revealed) return original[i];
        return GlitchSystem.CHARS[Math.floor(Math.random() * GlitchSystem.CHARS.length)];
      }).join('');
      if (progress < 1) raf = requestAnimationFrame(tick);
      else el.textContent = original;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }

  _scheduleLoop() {
    const schedule = () => {
      const delay = 6000 + Math.random() * 5000;
      const timer = setTimeout(() => {
        const targets = document.querySelectorAll('[data-glitch]');
        if (targets.length > 0) {
          this.glitch(targets[Math.floor(Math.random() * targets.length)]);
        }
        schedule();
      }, delay);
      this._timers.push(timer);
    };
    const init = setTimeout(schedule, 3500);
    this._timers.push(init);
  }

  destroy() {
    this._timers.forEach(clearTimeout);
    this._timers = [];
  }
}


/** Role typewriter with delete-retype cycle */
class RoleTypewriter {
  constructor(el, roles, opts = {}) {
    this.el      = el;
    this.roles   = roles;
    this.opts    = { typeSpeed: 85, deleteSpeed: 45, pauseEnd: 2200, pauseStart: 500, ...opts };
    this.current = 0;
    this.text    = '';
    this.deleting= false;
    this._timer  = null;
    this._type();
  }

  _type() {
    const role = this.roles[this.current];
    this.text = this.deleting
      ? role.substring(0, this.text.length - 1)
      : role.substring(0, this.text.length + 1);

    this.el.textContent = this.text;
    let delay = this.deleting ? this.opts.deleteSpeed : this.opts.typeSpeed;

    if (!this.deleting && this.text === role) {
      delay = this.opts.pauseEnd;
      this.deleting = true;
    } else if (this.deleting && this.text === '') {
      this.deleting = false;
      this.current  = (this.current + 1) % this.roles.length;
      delay = this.opts.pauseStart;
    }
    this._timer = setTimeout(() => this._type(), delay);
  }

  destroy() { clearTimeout(this._timer); }
}
