/**
 * @file skills-network.js
 * @description Canvas 2D interactive skill node network visualization.
 * Nodes float organically and respond to hover with glow + tooltip.
 */

class SkillsNetwork {
  /** @param {HTMLCanvasElement} canvas */
  constructor(canvas) {
    this.canvas      = canvas;
    this.ctx         = canvas.getContext('2d');
    this.W           = 0;
    this.H           = 0;
    this.time        = 0;
    this.mouse       = { x: -1000, y: -1000 };
    this.hoveredNode = null;
    this.rafId       = null;
    this._resizeTimer= null;

    this._buildGraph();
    this._resize();
    this._bindEvents();
    this._animate();
  }

  _buildGraph() {
    const CAT = {
      frontend:   '#00FF88',
      backend:    '#00AAFF',
      ai:         '#C8FF00',
      blockchain: '#FF8A00',
      finance:    '#FF3A20',
    };

    const skills = [
      // Frontend / UI — cluster center ~(0.18, 0.28)
      { name:'React',         cat:'frontend',   level:90, r:20 },
      { name:'Tailwind',      cat:'frontend',   level:92, r:20 },
      { name:'Angular',       cat:'frontend',   level:82, r:17 },
      { name:'HTML5 / CSS3',  cat:'frontend',   level:95, r:21 },
      { name:'JavaScript ES6+',cat:'frontend', level:94, r:22 },
      { name:'Ethers.js',     cat:'frontend',   level:92, r:20 },
      // Backend / Languages — cluster center ~(0.5, 0.2)
      { name:'Node.js',       cat:'backend',    level:95, r:22 },
      { name:'Express.js',    cat:'backend',    level:93, r:20 },
      { name:'PHP',           cat:'backend',    level:90, r:20 },
      { name:'Python',        cat:'backend',    level:92, r:21 },
      { name:'FastAPI',       cat:'backend',    level:88, r:19 },
      { name:'Laravel',       cat:'backend',    level:85, r:18 },
      { name:'SQLite / MySQL',cat:'backend',    level:92, r:21 },
      // AI & Vision Automation — cluster center ~(0.78, 0.32)
      { name:'Gemini Vision AI',cat:'ai',       level:95, r:22 },
      { name:'OpenCV (WASM)', cat:'ai',         level:88, r:19 },
      { name:'pHash / SSIM',  cat:'ai',         level:90, r:20 },
      { name:'Puppeteer',     cat:'ai',         level:92, r:20 },
      { name:'AI QA Benchmarks',cat:'ai',       level:94, r:21 },
      { name:'Telegram Bot API',cat:'ai',       level:95, r:21 },
      // Blockchain / Smart Contracts — cluster center ~(0.65, 0.7)
      { name:'Solidity',      cat:'blockchain', level:93, r:22 },
      { name:'Smart Contracts',cat:'blockchain',level:94, r:22 },
      { name:'Ethereum (EVM)',cat:'blockchain', level:90, r:20 },
      { name:'Remix / Etherscan',cat:'blockchain',level:90, r:18 },
      { name:'QR Traceability',cat:'blockchain',level:92, r:19 },
      { name:'JWT & bcrypt',  cat:'blockchain', level:90, r:18 },
      // Financial Investment & Trading — cluster center ~(0.3, 0.72)
      { name:'Investment Mgmt',cat:'finance',   level:92, r:21 },
      { name:'Crypto Markets',cat:'finance',    level:95, r:22 },
      { name:'Technical Analysis',cat:'finance',level:94, r:22 },
      { name:'Fundamental Analysis',cat:'finance',level:90, r:20 },
      { name:'Risk Management',cat:'finance',   level:93, r:21 },
      { name:'Indonesian Stocks',cat:'finance', level:88, r:19 },
    ];

    const centers = {
      frontend:   [0.17, 0.28],
      backend:    [0.50, 0.20],
      ai:         [0.78, 0.32],
      blockchain: [0.65, 0.70],
      finance:    [0.30, 0.72],
    };

    this.nodes = skills.map((s) => {
      const [cx, cy] = centers[s.cat];
      return {
        ...s,
        color:  CAT[s.cat],
        nx:     Math.max(0.05, Math.min(0.95, cx + (Math.random() - 0.5) * 0.28)),
        ny:     Math.max(0.08, Math.min(0.92, cy + (Math.random() - 0.5) * 0.22)),
        ox:     Math.random() * Math.PI * 2,
        oy:     Math.random() * Math.PI * 2,
        spd:    0.3 + Math.random() * 0.5,
        x: 0, y: 0, bx: 0, by: 0,
      };
    });

    // Same-category connections (short range)
    this.edges = [];
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const a = this.nodes[i], b = this.nodes[j];
        if (a.cat !== b.cat) continue;
        const d = Math.hypot(a.nx - b.nx, a.ny - b.ny);
        if (d < 0.22) this.edges.push([i, j]);
      }
    }

    // Cross-category connections for key skills
    this.crossEdges = [
      [8,12],[7,11],[6,20],[17,19],[12,23],[14,12],[11,16]
    ].filter(([a,b]) => a < this.nodes.length && b < this.nodes.length);
  }

  _resize() {
    const wrap = this.canvas.parentElement;
    this.W = wrap.clientWidth;
    this.H = Math.min(Math.round(this.W * 0.56), 520);
    this.canvas.width  = this.W;
    this.canvas.height = this.H;
    this.nodes.forEach(n => {
      n.bx = n.nx * this.W;
      n.by = n.ny * this.H;
      n.x  = n.bx;
      n.y  = n.by;
    });
  }

  _bindEvents() {
    window.addEventListener('resize', () => {
      clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => this._resize(), 200);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const r = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - r.left;
      this.mouse.y = e.clientY - r.top;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.mouse.x = -1000;
      this.mouse.y = -1000;
      this.hoveredNode = null;
      const tt = document.getElementById('skills-tooltip');
      if (tt) tt.style.opacity = '0';
    });
  }

  _animate() {
    this.rafId  = requestAnimationFrame(() => this._animate());
    this.time  += 0.007;
    this._draw();
  }

  _draw() {
    const { ctx, W, H, time } = this;
    ctx.clearRect(0, 0, W, H);

    // Update positions + detect hover
    let hovered = null;
    this.nodes.forEach(n => {
      n.x = n.bx + Math.sin(time * n.spd + n.ox) * 8;
      n.y = n.by + Math.cos(time * n.spd * 0.7 + n.oy) * 6;
      if (Math.hypot(this.mouse.x - n.x, this.mouse.y - n.y) < n.r + 10) {
        hovered = n;
      }
    });
    this.hoveredNode = hovered;

    // Cross-category edges (very faint)
    this.crossEdges.forEach(([ai, bi]) => {
      this._drawEdge(this.nodes[ai], this.nodes[bi], 'rgba(255,255,255,0.04)', 0.6);
    });

    // Same-category edges
    this.edges.forEach(([ai, bi]) => {
      const na = this.nodes[ai], nb = this.nodes[bi];
      const active = hovered === na || hovered === nb;
      this._drawEdge(na, nb, this._rgba(na.color, active ? 0.55 : 0.15), active ? 1.2 : 0.8);
    });

    // Nodes
    this.nodes.forEach(n => this._drawNode(n, n === hovered));

    // Tooltip
    if (hovered) this._updateTooltip(hovered);
    else {
      const tt = document.getElementById('skills-tooltip');
      if (tt) tt.style.opacity = '0';
    }
  }

  _drawEdge(a, b, color, width) {
    this.ctx.beginPath();
    this.ctx.moveTo(a.x, a.y);
    this.ctx.lineTo(b.x, b.y);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth   = width;
    this.ctx.stroke();
  }

  _drawNode(n, hovered) {
    const { ctx } = this;
    const scale   = hovered ? 1.45 : 1;
    const radius  = n.r * scale;

    if (hovered) {
      // Glow halo
      ctx.beginPath();
      ctx.arc(n.x, n.y, radius * 2.2, 0, Math.PI * 2);
      const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, radius * 2.2);
      grd.addColorStop(0, this._rgba(n.color, 0.25));
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fill();
    }

    // Main circle
    ctx.beginPath();
    ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = this._rgba(n.color, hovered ? 1 : 0.65);
    ctx.fill();

    // Inner void dot
    ctx.beginPath();
    ctx.arc(n.x, n.y, radius * 0.38, 0, Math.PI * 2);
    ctx.fillStyle = '#0A0A0F';
    ctx.fill();

    // Label below node
    const fs = Math.max(9, Math.min(12, radius * 0.72));
    ctx.font      = `${hovered ? '600 ' : ''}${fs}px 'JetBrains Mono',monospace`;
    ctx.fillStyle = hovered ? '#FFFFFF' : this._rgba(n.color, 0.85);
    ctx.textAlign = 'center';
    ctx.fillText(n.name, n.x, n.y + radius + 14);
  }

  _updateTooltip(n) {
    const tt = document.getElementById('skills-tooltip');
    if (!tt) return;
    const r = this.canvas.getBoundingClientRect();
    tt.style.left    = `${r.left + n.x}px`;
    tt.style.top     = `${r.top  + n.y - 14}px`;
    tt.style.opacity = '1';
    tt.style.color   = n.color;
    tt.style.borderColor = n.color;
    tt.querySelector('.tooltip-name').textContent  = n.name;
    tt.querySelector('.tooltip-level').textContent = `PROFICIENCY: ${n.level}%`;
  }

  _rgba(hex, a) {
    const n = parseInt(hex.replace('#',''), 16);
    return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;
  }

  destroy() { cancelAnimationFrame(this.rafId); }
}
