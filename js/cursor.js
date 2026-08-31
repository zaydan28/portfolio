/**
 * @file cursor.js
 * @description Custom magnetic cursor with interactive hover states.
 * Only activates on pointer: fine (mouse) devices.
 */

class MagneticCursor {
  constructor() {
    this.outer  = document.getElementById('cursor-outer');
    this.inner  = document.getElementById('cursor-inner');
    this.label  = document.getElementById('cursor-label');
    if (!this.outer || !this.inner) return;

    this.mouse      = { x: -200, y: -200 };
    this.outerPos   = { x: -200, y: -200 };
    this.innerPos   = { x: -200, y: -200 };
    this.magnetEl   = null;
    this.visible    = false;

    this._bindEvents();
    this._animLoop();
  }

  _bindEvents() {
    document.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      if (!this.visible) { this.visible = true; this._setOpacity(1); }
    });

    document.addEventListener('mouseleave', () => { this.visible = false; this._setOpacity(0); });
    document.addEventListener('mousedown',  () => this._press(true));
    document.addEventListener('mouseup',    () => this._press(false));

    const SEL = 'a, button, [data-magnetic], input, textarea, select, label, [role="button"]';

    document.addEventListener('mouseover', (e) => {
      const t = e.target.closest(SEL);
      if (t) this._onEnter(t);
    });

    document.addEventListener('mouseout', (e) => {
      const t = e.target.closest(SEL);
      if (t) this._onLeave(t);
    });
  }

  _animLoop() {
    const lerpO = 0.1;
    const lerpI = 0.75;

    this.outerPos.x += (this.mouse.x - this.outerPos.x) * lerpO;
    this.outerPos.y += (this.mouse.y - this.outerPos.y) * lerpO;
    this.innerPos.x += (this.mouse.x - this.innerPos.x) * lerpI;
    this.innerPos.y += (this.mouse.y - this.innerPos.y) * lerpI;

    this.outer.style.transform =
      `translate(${this.outerPos.x}px,${this.outerPos.y}px) translate(-50%,-50%)`;
    this.inner.style.transform =
      `translate(${this.innerPos.x}px,${this.innerPos.y}px) translate(-50%,-50%)`;

    requestAnimationFrame(() => this._animLoop());
  }

  _setOpacity(v) {
    this.outer.style.opacity = v;
    this.inner.style.opacity = v;
  }

  _onEnter(target) {
    this.outer.classList.add('cursor--hover');
    this.inner.classList.add('cursor--hover');
    if (target.dataset.magnetic !== undefined) {
      this.magnetEl = target;
      target.addEventListener('mousemove', this._handleMag);
    }
  }

  _onLeave(target) {
    this.outer.classList.remove('cursor--hover');
    this.inner.classList.remove('cursor--hover');
    if (this.magnetEl === target) {
      target.style.transform = '';
      target.removeEventListener('mousemove', this._handleMag);
      this.magnetEl = null;
    }
  }

  _handleMag = (e) => {
    if (!this.magnetEl) return;
    const r  = this.magnetEl.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width  / 2)) * 0.28;
    const dy = (e.clientY - (r.top  + r.height / 2)) * 0.28;
    this.magnetEl.style.transform = `translate(${dx}px,${dy}px)`;
  };

  _press(down) {
    this.inner.classList.toggle('cursor--pressed', down);
    this.outer.classList.toggle('cursor--pressed', down);
  }
}
