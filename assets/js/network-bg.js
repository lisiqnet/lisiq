/**
 * Lisiq — Hero infrastructure network visualization.
 *
 * A subtle, performant nod to the company's subject matter: infrastructure
 * nodes connected by thin lines, with small packets travelling between them.
 * Implemented with plain Canvas 2D (no WebGL/3D library) so the effect stays
 * well within a tight performance budget — this is decoration, not the page.
 *
 * Respects prefers-reduced-motion (renders one static frame, no animation)
 * and pauses the render loop whenever the hero scrolls out of view.
 */
(() => {
  'use strict';

  const canvas = document.getElementById('network-bg');
  if (!canvas || !canvas.getContext) return;

  const hero = document.getElementById('hero');
  const ctx = canvas.getContext('2d', { alpha: true });
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width = 0, height = 0, dpr = 1;
  let nodes = [];
  let edges = [];
  let packets = [];
  let raf = null;
  let running = false;
  let mouse = { x: 0, y: 0, tx: 0, ty: 0 };

  const PURPLE = '40, 0, 65';

  function rand(min, max) { return min + Math.random() * (max - min); }

  function buildField() {
    width = hero.clientWidth;
    height = hero.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Node density scales gently with viewport area, capped for performance.
    const area = width * height;
    const count = Math.max(18, Math.min(46, Math.round(area / 32000)));

    nodes = Array.from({ length: count }, () => ({
      x: rand(0, width),
      y: rand(0, height),
      z: rand(0.4, 1),           // depth, drives size + parallax strength
      phase: rand(0, Math.PI * 2),
      speed: rand(0.15, 0.35),
      r: 0,
    }));
    nodes.forEach((n) => { n.r = 1 + n.z * 1.6; });

    // Connect each node to its nearest few neighbours (static topology).
    edges = [];
    const maxDist = Math.max(width, height) * 0.16;
    for (let i = 0; i < nodes.length; i++) {
      const dists = [];
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < maxDist) dists.push({ j, d });
      }
      dists.sort((a, b) => a.d - b.d);
      dists.slice(0, 2).forEach(({ j }) => {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (!edges.some((e) => e.key === key)) {
          edges.push({ key, a: i, b: j });
        }
      });
    }

    // A handful of packets travel along random edges.
    const packetCount = reduceMotion ? 0 : Math.min(7, Math.round(edges.length / 5));
    packets = Array.from({ length: packetCount }, () => spawnPacket());
  }

  function spawnPacket() {
    const edge = edges[Math.floor(Math.random() * edges.length)];
    return { edge, t: Math.random(), speed: rand(0.0025, 0.006) };
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);

    const drift = reduceMotion ? 0 : time * 0.00006;
    const parX = reduceMotion ? 0 : (mouse.x - width / 2) * 0.01;
    const parY = reduceMotion ? 0 : (mouse.y - height / 2) * 0.01;

    // Resolve animated node positions once per frame.
    const pos = nodes.map((n) => ({
      x: n.x + Math.sin(drift * 10 + n.phase) * 6 * n.speed * 6 + parX * n.z,
      y: n.y + Math.cos(drift * 10 + n.phase) * 6 * n.speed * 6 + parY * n.z,
    }));

    // Edges
    ctx.lineWidth = 1;
    edges.forEach(({ a, b }) => {
      const pa = pos[a], pb = pos[b];
      const grad = ctx.createLinearGradient(pa.x, pa.y, pb.x, pb.y);
      grad.addColorStop(0, `rgba(${PURPLE}, 0.10)`);
      grad.addColorStop(1, `rgba(${PURPLE}, 0.04)`);
      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    });

    // Nodes
    nodes.forEach((n, i) => {
      const p = pos[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${PURPLE}, ${0.14 + n.z * 0.1})`;
      ctx.fill();
    });

    // Packets travelling along edges
    if (!reduceMotion) {
      packets.forEach((pkt) => {
        pkt.t += pkt.speed;
        if (pkt.t > 1) {
          Object.assign(pkt, spawnPacket());
        }
        const pa = pos[pkt.edge.a], pb = pos[pkt.edge.b];
        const x = pa.x + (pb.x - pa.x) * pkt.t;
        const y = pa.y + (pb.y - pa.y) * pkt.t;
        ctx.beginPath();
        ctx.arc(x, y, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${PURPLE}, 0.45)`;
        ctx.fill();
      });
    }
  }

  function loop(time) {
    if (!running) return;
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;
    draw(time);
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(loop);
  }
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  function handleResize() {
    buildField();
    draw(performance.now());
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(handleResize, 180);
  });

  window.addEventListener('pointermove', (e) => {
    const rect = hero.getBoundingClientRect();
    mouse.tx = e.clientX - rect.left;
    mouse.ty = e.clientY - rect.top;
  }, { passive: true });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((entry) => (entry.isIntersecting ? start() : stop())),
      { threshold: 0.01 }
    );
    io.observe(hero);
  } else {
    start();
  }

  buildField();
  mouse.x = mouse.tx = width / 2;
  mouse.y = mouse.ty = height / 2;
  draw(0);
  if (reduceMotion) {
    // Static single frame only — no rAF loop, no listener-driven motion.
  } else {
    start();
  }
})();
