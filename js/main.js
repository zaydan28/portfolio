/**
 * @file main.js
 * @description Main application orchestrator.
 * Initialises and wires: Lenis, GSAP ScrollTrigger, Splitting.js,
 * Preloader, Nav, Hero, About, Skills, Experience, Projects, Contact, Footer.
 */

const App = (() => {
  'use strict';

  /* ─────────────────────────── INSTANCES ─── */
  let lenis        = null;
  let heroScene    = null;
  let skillsNet    = null;
  let glitchSys    = null;

  /* ══════════════════════════════════════════
     PRELOADER
     ══════════════════════════════════════════ */
  const Preloader = {
    el:       null,
    barEl:    null,
    pctEl:    null,
    textEl:   null,

    init() {
      this.el     = document.getElementById('preloader');
      this.barEl  = document.getElementById('preloader-progress');
      this.pctEl  = document.getElementById('preloader-percent');
      this.textEl = document.getElementById('preloader-text');
      if (!this.el) { App.onReady(); return; }
      this._run();
    },

    _run() {
      const msgs = [
        'BOOTING SYSTEM...',
        'LOADING PROFILE DATA...',
        'DECRYPTING IDENTITY...',
        'INITIALIZING RENDERER...',
        'ESTABLISHING CHANNELS...',
        'ALL SYSTEMS READY.',
      ];
      let pct = 0, msgIdx = 0;

      const step = () => {
        pct = Math.min(pct + 2 + Math.random() * 9, 100);
        const p = Math.floor(pct);
        if (this.pctEl) this.pctEl.textContent = p;
        if (this.barEl) this.barEl.style.width  = p + '%';

        const nextMsg = Math.floor((p / 100) * msgs.length);
        if (nextMsg !== msgIdx && nextMsg < msgs.length) {
          msgIdx = nextMsg;
          if (this.textEl) this.textEl.textContent = msgs[msgIdx];
        }

        if (pct < 100) setTimeout(step, 55 + Math.random() * 75);
        else           setTimeout(() => this._exit(), 250);
      };

      setTimeout(step, 350);
    },

    _exit() {
      gsap.to(this.el, {
        opacity:  0,
        duration: 0.75,
        ease:     'power2.inOut',
        onComplete: () => {
          this.el.style.display = 'none';
          document.body.classList.remove('loading');
          App.onReady();
        }
      });
    }
  };

  /* ══════════════════════════════════════════
     SMOOTH SCROLL
     ══════════════════════════════════════════ */
  const SmoothScroll = {
    init() {
      if (!window.Lenis) return;
      lenis = new Lenis({
        duration:    1.2,
        easing:      (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);

      // Make anchor links go through Lenis
      document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          const target = document.querySelector(a.getAttribute('href'));
          if (target) lenis.scrollTo(target, { offset: -64 });
        });
      });
    }
  };

  /* ══════════════════════════════════════════
     NAVIGATION
     ══════════════════════════════════════════ */
  const Nav = {
    el:         null,
    toggle:     null,
    menu:       null,
    links:      null,
    isOpen:     false,

    init() {
      this.el     = document.getElementById('nav');
      this.toggle = document.getElementById('nav-toggle');
      this.menu   = document.getElementById('mobile-menu');
      this.links  = document.querySelectorAll('.nav-link');

      // Scroll-based background
      ScrollTrigger.create({
        start:       '80px top',
        onEnter:     () => this.el?.classList.add('nav--scrolled'),
        onLeaveBack: () => this.el?.classList.remove('nav--scrolled'),
      });

      // Mobile toggle
      this.toggle?.addEventListener('click', () => this._toggleMobile());
      this.menu?.querySelectorAll('a').forEach(a =>
        a.addEventListener('click', () => this._closeMobile())
      );

      // Active section tracking
      document.querySelectorAll('section[id]').forEach(sec => {
        ScrollTrigger.create({
          trigger: sec,
          start:   'top center',
          end:     'bottom center',
          onToggle: (self) => {
            if (self.isActive) this._setActive('#' + sec.id);
          }
        });
      });
    },

    _toggleMobile() {
      this.isOpen = !this.isOpen;
      this.toggle?.classList.toggle('nav-toggle--open', this.isOpen);
      this.menu?.classList.toggle('mobile-menu--open', this.isOpen);
      this.menu?.setAttribute('aria-hidden', String(!this.isOpen));
      document.body.style.overflow = this.isOpen ? 'hidden' : '';
    },

    _closeMobile() {
      this.isOpen = false;
      this.toggle?.classList.remove('nav-toggle--open');
      this.menu?.classList.remove('mobile-menu--open');
      this.menu?.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    },

    _setActive(href) {
      this.links.forEach(l =>
        l.classList.toggle('nav-link--active', l.getAttribute('href') === href)
      );
    }
  };

  /* ══════════════════════════════════════════
     HERO
     ══════════════════════════════════════════ */
  const Hero = {
    init() {
      // Three.js background
      const canvas = document.getElementById('three-canvas');
      if (canvas && window.THREE) {
        try { heroScene = new HeroParticleScene(canvas); }
        catch (e) { console.warn('3D scene init failed:', e); }
      }

      // Typewriter
      const roleEl = document.getElementById('role-display');
      if (roleEl) {
        new RoleTypewriter(roleEl, [
          'FULLSTACK DEV',
          'AI AUTOMATION',
          'SMART CONTRACT ENGINEER',
          'CRYPTO TRADER',
          'INVESTMENT MANAGER',
        ]);
      }

      // HUD clock
      const clockEl = document.getElementById('hero-clock');
      if (clockEl) {
        const updateClock = () => {
          clockEl.textContent = new Date().toLocaleTimeString('en-US', {
            hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
          }) + ' WIB';
        };
        updateClock();
        setInterval(updateClock, 1000);
      }

      // Photo 3D tilt on mouse
      const wrap = document.getElementById('hero-photo-wrap');
      if (wrap) {
        document.addEventListener('mousemove', (e) => {
          const cx = window.innerWidth  / 2;
          const cy = window.innerHeight / 2;
          const dx = ((e.clientX - cx) / window.innerWidth)  * 14;
          const dy = ((e.clientY - cy) / window.innerHeight) * 10;
          wrap.style.transform =
            `perspective(1000px) rotateY(${dx}deg) rotateX(${-dy}deg)`;
        });
      }

      this._animateIn();
    },

    _animateIn() {
      const tl = gsap.timeline({ delay: 0.15 });

      tl.from('.hud-corner', {
        opacity: 0, scale: 0.8,
        duration: 0.6, stagger: 0.1, ease: 'power2.out'
      }, 0);

      tl.from('.photo-hexagon-wrap', {
        opacity: 0, scale: 0.75,
        duration: 0.9, ease: 'back.out(1.5)'
      }, 0.25);

      tl.from('.orbit-ring', {
        opacity: 0, scale: 0,
        duration: 0.6, stagger: 0.18, ease: 'power2.out'
      }, 0.6);

      tl.from('.hero-name .char', {
        opacity: 0, y: 55, skewX: 4,
        duration: 0.5, stagger: 0.022, ease: 'power3.out'
      }, 0.45);

      tl.from([
        '.hero-eyebrow', '.hero-role-wrap', '.hero-bio',
        '.hero-actions',  '.hero-metrics'
      ], {
        opacity: 0, y: 28,
        duration: 0.6, stagger: 0.1, ease: 'power2.out'
      }, 0.85);

      tl.from('.scroll-indicator', {
        opacity: 0, y: 15,
        duration: 0.6, ease: 'power2.out'
      }, 1.4);
    }
  };

  /* ══════════════════════════════════════════
     ABOUT
     ══════════════════════════════════════════ */
  const About = {
    init() {
      _sectionHeader('#about');
      this._initTerminal();
      this._initStats();
      this._initBio();
    },

    _initTerminal() {
      const out = document.getElementById('about-output');
      if (!out) return;

      const lines = [
        '{',
        `  <span class="t-key">"name"</span>: <span class="t-str">"Haekal Mimtazulfaqhi Zaydan"</span>,`,
        `  <span class="t-key">"alias"</span>: <span class="t-str">"HMZ"</span>,`,
        `  <span class="t-key">"education"</span>: <span class="t-str">"B.Eng Informatics (S.Kom), Pamulang Univ"</span>,`,
        `  <span class="t-key">"location"</span>: <span class="t-str">"Depok, West Java, Indonesia"</span>,`,
        `  <span class="t-key">"email"</span>: <span class="t-str">"zaydan281003@gmail.com"</span>,`,
        `  <span class="t-key">"phone"</span>: <span class="t-str">"+62 813-8099-4278"</span>,`,
        `  <span class="t-key">"roles"</span>: [<span class="t-str">"FULLSTACK DEV","AI AUTOMATION","SMART CONTRACT ENGINEER","CRYPTO TRADER","INVESTMENT MANAGER"</span>],`,
        `  <span class="t-key">"core_stack"</span>: [<span class="t-str">"Node.js","React","Solidity","Python","PHP","Ethers.js","FastAPI"</span>],`,
        `  <span class="t-key">"status"</span>: <span class="t-green">"ACTIVE"</span>,`,
        `  <span class="t-key">"clearance"</span>: <span class="t-amber">"LEVEL_5"</span>`,
        '}'
      ];

      ScrollTrigger.create({
        trigger: '#about',
        start:   'top 62%',
        once:    true,
        onEnter: () => {
          let i = 0;
          const next = () => {
            if (i >= lines.length) return;
            const div = document.createElement('div');
            div.className   = 't-output-line';
            div.innerHTML   = lines[i];
            div.style.opacity = '0';
            out.appendChild(div);
            gsap.to(div, { opacity: 1, duration: 0.1 });
            i++;
            setTimeout(next, 100);
          };
          next();
        }
      });
    },

    _initStats() {
      ScrollTrigger.create({
        trigger: '.about-stats-grid',
        start:   'top 72%',
        once:    true,
        onEnter: () => {
          document.querySelectorAll('[data-count]').forEach(el => {
            const target = parseInt(el.dataset.count, 10);
            const delay  = parseInt(el.closest('[data-delay]')?.dataset.delay || 0, 10);
            setTimeout(() => AnimatedCounter.animate(el, target), delay);
          });
          gsap.from('.stat-bar-fill', {
            scaleX: 0, transformOrigin: 'left center',
            duration: 1.2, stagger: 0.1, ease: 'power3.out'
          });
        }
      });

      gsap.from('.stat-card', {
        scrollTrigger: { trigger: '.about-stats-grid', start: 'top 72%' },
        y: 40, opacity: 0, duration: 0.6, stagger: 0.12, ease: 'power2.out'
      });
    },

    _initBio() {
      gsap.from('.about-bio-text p', {
        scrollTrigger: { trigger: '.about-bio-wrap', start: 'top 75%' },
        y: 28, opacity: 0, duration: 0.7, stagger: 0.15, ease: 'power2.out'
      });
    }
  };

  /* ══════════════════════════════════════════
     SKILLS
     ══════════════════════════════════════════ */
  const Skills = {
    init() {
      _sectionHeader('#skills');

      const canvas = document.getElementById('skills-canvas');
      if (canvas) {
        ScrollTrigger.create({
          trigger: '#skills',
          start:   'top 65%',
          once:    true,
          onEnter: () => {
            try {
              skillsNet = new SkillsNetwork(canvas);
              gsap.from(canvas, { opacity: 0, duration: 0.8, ease: 'power2.out' });
            } catch (e) { console.warn('Skills canvas error:', e); }
          }
        });
      }

      gsap.from('.skill-item', {
        scrollTrigger: { trigger: '.skills-grid', start: 'top 75%' },
        opacity: 0, y: 18, duration: 0.4, stagger: 0.04, ease: 'power2.out'
      });
    }
  };

  /* ══════════════════════════════════════════
     EXPERIENCE
     ══════════════════════════════════════════ */
  const Experience = {
    init() {
      _sectionHeader('#experience');

      // Animate spine fill via ScrollTrigger scrub
      gsap.fromTo('.timeline-spine-fill',
        { scaleY: 0 },
        {
          scaleY: 1, transformOrigin: 'top center', ease: 'none',
          scrollTrigger: {
            trigger: '.timeline', start: 'top 60%', end: 'bottom 45%', scrub: 1
          }
        }
      );

      // Animate each entry card
      document.querySelectorAll('.timeline-entry').forEach((entry) => {
        const card    = entry.querySelector('.entry-card');
        const dot     = entry.querySelector('.connector-dot');
        const isRight = entry.classList.contains('timeline-entry--right');

        if (card) {
          gsap.from(card, {
            scrollTrigger: { trigger: entry, start: 'top 78%' },
            opacity: 0, x: isRight ? 55 : -55, duration: 0.8, ease: 'power3.out'
          });
        }
        if (dot) {
          gsap.from(dot, {
            scrollTrigger: { trigger: entry, start: 'top 78%' },
            scale: 0, opacity: 0, duration: 0.5, ease: 'back.out(2)'
          });
        }
      });
    }
  };

  /* ══════════════════════════════════════════
     PROJECTS
     ══════════════════════════════════════════ */
  const Projects = {
    init() {
      _sectionHeader('#projects');
      this._initTilt();
      this._animateCards();
    },

    _initTilt() {
      document.querySelectorAll('[data-tilt]').forEach(tile => {
        tile.addEventListener('mousemove', (e) => {
          const r  = tile.getBoundingClientRect();
          const dx = ((e.clientX - (r.left + r.width  / 2)) / r.width)  * 11;
          const dy = ((e.clientY - (r.top  + r.height / 2)) / r.height) * 9;
          tile.style.transform =
            `perspective(800px) rotateX(${-dy}deg) rotateY(${dx}deg) scale3d(1.02,1.02,1.02)`;
        });

        tile.addEventListener('mouseleave', () => {
          gsap.to(tile, {
            rotateX: 0, rotateY: 0, scale: 1,
            duration: 0.55, ease: 'power2.out',
            clearProps: 'transform'
          });
        });
      });
    },

    _animateCards() {
      gsap.from('.project-tile', {
        scrollTrigger: { trigger: '.projects-grid', start: 'top 72%' },
        opacity: 0, y: 55, duration: 0.7, stagger: 0.1, ease: 'power3.out'
      });
    }
  };

  /* ══════════════════════════════════════════
     CONTACT
     ══════════════════════════════════════════ */
  const Contact = {
    init() {
      _sectionHeader('#contact');
      this._initForm();
      this._animateChannels();
    },

    _initForm() {
      const form   = document.getElementById('contact-form');
      const status = document.getElementById('form-status');
      if (!form) return;

      // Focus/blur states
      form.querySelectorAll('.form-input').forEach(inp => {
        inp.addEventListener('focus', () =>
          inp.closest('.form-input-wrap')?.classList.add('is-focused'));
        inp.addEventListener('blur', () =>
          inp.closest('.form-input-wrap')?.classList.remove('is-focused'));
      });

      // Submit (simulated)
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        btn.classList.add('btn--loading');
        btn.disabled = true;

        await new Promise(r => setTimeout(r, 1800));

        btn.classList.remove('btn--loading');
        btn.disabled = false;

        if (status) {
          status.textContent = '[ \u2713 ] MESSAGE TRANSMITTED. RESPONSE WITHIN 24H.';
          status.classList.add('form-status--success');
          form.reset();
          setTimeout(() => {
            status.textContent = '';
            status.classList.remove('form-status--success');
          }, 5000);
        }
      });
    },

    _animateChannels() {
      gsap.from('.channel-link', {
        scrollTrigger: { trigger: '.contact-channels', start: 'top 75%' },
        opacity: 0, x: -40, duration: 0.6, stagger: 0.1, ease: 'power2.out'
      });
      gsap.from('.contact-form .form-group', {
        scrollTrigger: { trigger: '.contact-form', start: 'top 75%' },
        opacity: 0, y: 25, duration: 0.5, stagger: 0.1, ease: 'power2.out'
      });
    }
  };

  /* ══════════════════════════════════════════
     FOOTER
     ══════════════════════════════════════════ */
  const Footer = {
    init() {
      const clockEl = document.getElementById('footer-time');
      if (clockEl) {
        const update = () => {
          clockEl.textContent = new Date().toLocaleTimeString('en-US', {
            hour12: false
          }) + ' WIB';
        };
        update();
        setInterval(update, 1000);
      }

      const cpuEl = document.getElementById('footer-cpu');
      const memEl = document.getElementById('footer-mem');
      if (cpuEl && memEl) {
        setInterval(() => {
          cpuEl.textContent = (1.8 + Math.random() * 7).toFixed(1) + '%';
          memEl.textContent = (118 + Math.random() * 45).toFixed(0) + 'MB';
        }, 2200);
      }
    }
  };

  /* ══════════════════════════════════════════
     SHARED: Section header animation helper
     ══════════════════════════════════════════ */
  function _sectionHeader(sel) {
    const sec = document.querySelector(sel);
    if (!sec) return;

    gsap.from(sec.querySelector('.section-num'), {
      scrollTrigger: { trigger: sec, start: 'top 72%' },
      opacity: 0, x: -25, duration: 0.6, ease: 'power2.out'
    });

    const chars = sec.querySelectorAll('.section-title .char');
    if (chars.length) {
      gsap.from(chars, {
        scrollTrigger: { trigger: sec, start: 'top 72%' },
        opacity: 0, y: 38, duration: 0.5, stagger: 0.03, ease: 'power3.out'
      });
    }

    const line = sec.querySelector('.section-line');
    if (line) {
      gsap.from(line, {
        scrollTrigger: { trigger: sec, start: 'top 72%' },
        scaleX: 0, transformOrigin: 'left center',
        duration: 0.9, delay: 0.18, ease: 'power2.out'
      });
    }
  }

  /* ══════════════════════════════════════════
     BOOT
     ══════════════════════════════════════════ */
  function _init() {
    // Register GSAP plugin
    gsap.registerPlugin(ScrollTrigger);

    // Custom cursor (skip on touch devices)
    if (window.matchMedia('(pointer: fine)').matches) {
      new MagneticCursor();
    }

    // Splitting.js — split section titles into chars
    if (window.Splitting) {
      Splitting({ target: '[data-splitting]' });
    }

    // Glitch system
    glitchSys = new GlitchSystem();

    // Preloader kicks off and calls App.onReady when done
    Preloader.init();
  }

  function onReady() {
    SmoothScroll.init();
    Nav.init();
    Hero.init();
    About.init();
    Skills.init();
    Experience.init();
    Projects.init();
    Contact.init();
    Footer.init();

    // Refresh after all animations registered
    setTimeout(() => ScrollTrigger.refresh(), 120);
  }

  document.addEventListener('DOMContentLoaded', _init);

  return { onReady };
})();
