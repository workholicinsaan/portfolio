/* ============================================================
   MOHAMMAD TALIB KHAN · PORTFOLIO · 5D EDITION · app.js
   One file, no libraries, shared by every page.

   What lives here, top to bottom:
     1. setup, one animation loop for everything
     2. theme switch (circular reveal where the browser supports it)
     3. liquid brass background (WebGL) and the 3D particle field
     4. the 3D entity sphere on the home page
     5. tilt, light and depth on cards, magnetic buttons, cursor, nav pill
     6. reveals, split headings, number count-ups, marquee bands, parallax
     7. the original features: case reader, work filters, screenshot lightbox
     8. a performance guard that lightens the effects on slow devices

   All page text stays in the HTML. Scripts only add motion on top, so
   search engines and AI crawlers read the same words a visitor does.
   ============================================================ */
(() => {
  "use strict";

  /* ---------------------------------------------------------- 1. SETUP */
  const doc = document, root = doc.documentElement, body = doc.body;
  const mm = (q) => window.matchMedia(q);
  const reduce = mm("(prefers-reduced-motion: reduce)").matches;
  const fine = mm("(hover: hover) and (pointer: fine)").matches;
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const weak = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
  const small = Math.min(innerWidth, innerHeight) < 560;
  const Q = { low: saveData || (weak && small), mid: weak || small };

  const $ = (s, r) => (r || doc).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || doc).querySelectorAll(s));
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
  const safe = (fn) => { try { fn(); } catch (e) { if (window.console) console.warn("[portfolio]", e); } };
  const ss = {
    get: (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };

  /* pointer, restored across pages so the light does not jump on navigation */
  const P = { x: innerWidth * 0.62, y: innerHeight * 0.3, nx: 0.62, ny: 0.3, moved: false, target: null };
  (() => {
    const s = ss.get("ptr");
    if (!s) return;
    const a = s.split(",");
    P.nx = clamp(+a[0] || 0.62, 0, 1); P.ny = clamp(+a[1] || 0.3, 0, 1);
    P.x = P.nx * innerWidth; P.y = P.ny * innerHeight;
  })();
  addEventListener("pagehide", () => ss.set("ptr", P.nx.toFixed(3) + "," + P.ny.toFixed(3)));

  const V = { w: innerWidth, h: innerHeight, sy: scrollY, vel: 0 };

  /* one requestAnimationFrame loop; features add and remove their own tasks */
  const tasks = new Set();
  let rafId = 0, lastT = 0;
  function tick(t) {
    rafId = 0;
    const dt = lastT ? Math.min(t - lastT, 64) : 16.7;
    lastT = t;
    const sy = scrollY;
    V.vel = lerp(V.vel, sy - V.sy, 0.25);
    V.sy = sy;
    tasks.forEach((f) => {
      try { f(t, dt); } catch (e) { tasks.delete(f); if (window.console) console.warn("[portfolio]", e); }
    });
    if (tasks.size && !doc.hidden) rafId = requestAnimationFrame(tick);
  }
  const run = (f) => { tasks.add(f); if (!rafId && !doc.hidden) { lastT = 0; rafId = requestAnimationFrame(tick); } };
  const stop = (f) => { tasks.delete(f); };
  doc.addEventListener("visibilitychange", () => {
    if (!doc.hidden && tasks.size && !rafId) { lastT = 0; rafId = requestAnimationFrame(tick); }
  });

  /* throttled scroll and resize hooks */
  const scrollFns = [], resizeFns = [], themeFns = [];
  let scrollQ = false, rsT = 0;
  addEventListener("scroll", () => {
    if (scrollQ) return;
    scrollQ = true;
    requestAnimationFrame(() => { scrollQ = false; scrollFns.forEach((f) => safe(f)); });
  }, { passive: true });
  addEventListener("resize", () => {
    clearTimeout(rsT);
    rsT = setTimeout(() => { V.w = innerWidth; V.h = innerHeight; resizeFns.forEach((f) => safe(f)); }, 160);
  });

  /* colour helpers */
  const col = {};
  const pad = doc.createElement("canvas").getContext("2d");
  function rgb(str) {
    pad.fillStyle = "#000";
    pad.fillStyle = str;
    const v = pad.fillStyle;
    if (v.charAt(0) === "#") return [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16)];
    const m = v.match(/[\d.]+/g);
    return m ? [+m[0], +m[1], +m[2]] : [191, 161, 129];
  }
  const rgba = (str, a) => { const c = rgb(str); return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; };
  function readColours() {
    const cs = getComputedStyle(root);
    const g = (n, d) => cs.getPropertyValue(n).trim() || d;
    col.dark = root.getAttribute("data-theme") !== "light";
    col.brass = g("--brass", "#BFA181");
    col.sand = g("--sand", "#D4C5B0");
    col.chalk = g("--chalk", "#F4F4F4");
    col.ground = g("--ground", "#1C1C1C");
    col.line = g("--line-2", "rgba(212,197,176,.27)");
  }

  /* ---------------------------------------------------------- 2. THEME */
  (() => {
    let pref = null;
    try { pref = localStorage.getItem("theme"); } catch (e) {}
    if (!root.hasAttribute("data-theme")) {
      if (pref) root.setAttribute("data-theme", pref);
      else if (mm("(prefers-color-scheme: light)").matches) root.setAttribute("data-theme", "light");
    }
  })();
  readColours();

  function setTheme(next) {
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    readColours();
    themeFns.forEach((f) => safe(f));
  }
  const themeBtn = $("#themeBtn");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      if (!doc.startViewTransition || reduce) { setTheme(next); return; }
      const r = themeBtn.getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      root.classList.add("vt-theme");
      let vt;
      try { vt = doc.startViewTransition(() => setTheme(next)); } catch (e) { root.classList.remove("vt-theme"); setTheme(next); return; }
      vt.ready.then(() => {
        root.animate(
          { clipPath: ["circle(0px at " + x + "px " + y + "px)", "circle(" + rad + "px at " + x + "px " + y + "px)"] },
          { duration: 760, easing: "cubic-bezier(.7,0,.2,1)", pseudoElement: "::view-transition-new(root)" }
        );
      }).catch(() => {});
      vt.finished.finally(() => root.classList.remove("vt-theme"));
    });
  }
  const yr = $("#yr");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------- 3a. LIQUID BRASS (WebGL) */
  const FX = { on: false, scale: Q.low ? 0.32 : Q.mid ? 0.42 : 0.6, skip: Q.low ? 2 : 1, n: 0 };
  function initShader() {
    if (saveData) { root.classList.add("no-gl"); return; }
    const cv = doc.createElement("canvas");
    cv.id = "fx";
    cv.setAttribute("aria-hidden", "true");
    body.insertBefore(cv, body.firstChild);
    let gl = null;
    try {
      gl = cv.getContext("webgl", { antialias: false, alpha: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: "low-power" });
    } catch (e) {}
    if (!gl) { cv.remove(); root.classList.add("no-gl"); return; }

    const VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
    const FS = [
      "#ifdef GL_FRAGMENT_PRECISION_HIGH",
      "precision highp float;",
      "#else",
      "precision mediump float;",
      "#endif",
      "uniform vec2 uR;uniform float uT;uniform vec2 uM;uniform float uS;uniform float uL;uniform float uK;",
      "uniform vec3 uG;uniform vec3 uB;uniform vec3 uD;uniform vec3 uC;",
      "void main(){",
      "  float mn=min(uR.x,uR.y);",
      "  vec2 p=(gl_FragCoord.xy-.5*uR)/mn*2.4;",
      "  float t=uT*.06+uS;",
      "  vec2 q=p;",
      "  for(int i=1;i<6;i++){",
      "    float f=float(i);",
      "    q.x+=.6/f*sin(f*1.6*q.y+t+.35*f)+(uM.x-.5)*.05;",
      "    q.y+=.5/f*cos(f*1.25*q.x-t*.8+.55*f)+(uM.y-.5)*.05;",
      "  }",
      "  float v=.5+.5*sin(q.x*1.15+q.y*.85+t*.45);",
      "  float w=.5+.5*cos(q.y*1.7-q.x*.6-t*.3);",
      "  vec2 m=(uM*uR-.5*uR)/mn*2.4;",
      "  vec2 fc=(vec2(.72,.6)*uR-.5*uR)/mn*2.4;",
      "  float d=length(p-m);",
      "  float light=exp(-d*d*.5);",
      "  vec3 c;",
      "  if(uL<.5){",
      "    vec3 deep=mix(uG,uB,.5);",
      "    c=mix(uG,deep,smoothstep(.3,.92,v));",
      "    c=mix(c,uB,smoothstep(.8,.99,v)*(.26+.44*light));",
      "    c=mix(c,uD,smoothstep(.93,1.,v*w)*.45*(.25+light));",
      "    float spec=pow(smoothstep(.84,1.,v),8.);",
      "    c+=uC*spec*(.04+.3*light);",
      "    float vig=1.-smoothstep(.1,2.1,length(p-fc));",
      "    c=mix(uG,c,(.12+.44*vig+.12*light)*uK);",
      "  }else{",
      "    c=mix(uG,uD,smoothstep(.3,.95,v)*.55);",
      "    c=mix(c,uB,smoothstep(.8,1.,v*w)*(.18+.25*light));",
      "    float vig=1.-smoothstep(.1,2.2,length(p-fc));",
      "    c=mix(uG,c,(.22+.5*vig)*uK);",
      "  }",
      "  float n=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);",
      "  c+=(n-.5)*.018;",
      "  gl_FragColor=vec4(c,1.);",
      "}"
    ].join("\n");

    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { if (window.console) console.warn(gl.getShaderInfoLog(s)); return null; }
      return s;
    };
    const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) { cv.remove(); root.classList.add("no-gl"); return; }
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { cv.remove(); root.classList.add("no-gl"); return; }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = {};
    ["uR", "uT", "uM", "uS", "uL", "uK", "uG", "uB", "uD", "uC"].forEach((k) => { u[k] = gl.getUniformLocation(prog, k); });
    const v3 = (hex) => rgb(hex).map((x) => x / 255);
    const setCols = () => {
      const dark = col.dark;
      gl.uniform3fv(u.uG, v3(dark ? "#1C1C1C" : "#F4F4F4"));
      gl.uniform3fv(u.uB, v3("#BFA181"));
      gl.uniform3fv(u.uD, v3("#D4C5B0"));
      gl.uniform3fv(u.uC, v3("#F4F4F4"));
      gl.uniform1f(u.uL, dark ? 0 : 1);
    };
    const size = () => {
      const w = Math.max(2, Math.round(innerWidth * FX.scale)), h = Math.max(2, Math.round(innerHeight * FX.scale));
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(u.uR, w, h);
      gl.uniform1f(u.uK, innerWidth < 760 ? 0.72 : 1);
    };
    let mx = P.nx, my = 1 - P.ny, sc = scrollY * 0.0009;
    const draw = (force) => {
      FX.n++;
      if (!force && FX.skip > 1 && FX.n % FX.skip) return;
      const now = Date.now();
      /* no mouse on touch screens, so the light drifts on its own */
      const lx = fine ? P.nx : 0.55 + 0.25 * Math.sin(now / 7000), ly = fine ? P.ny : 0.42 + 0.18 * Math.cos(now / 9000);
      mx = lerp(mx, lx, 0.035);
      my = lerp(my, 1 - ly, 0.035);
      sc = lerp(sc, scrollY * 0.0009, 0.06);
      gl.uniform1f(u.uT, (now / 1000) % 3600);
      gl.uniform2f(u.uM, mx, my);
      gl.uniform1f(u.uS, sc);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const task = () => draw(false);

    setCols();
    size();
    draw(true);
    requestAnimationFrame(() => cv.classList.add("on"));
    FX.on = true;
    FX.resize = () => { size(); draw(true); };
    FX.kill = () => { stop(task); FX.on = false; cv.remove(); root.classList.add("no-gl"); };
    if (!reduce) run(task);
    resizeFns.push(() => { size(); draw(true); });
    themeFns.push(() => { setCols(); draw(true); });
    if (reduce) scrollFns.push(() => draw(true));
    cv.addEventListener("webglcontextlost", (e) => { e.preventDefault(); FX.kill(); });
  }

  /* ---------------------------------------------------------- 3b. 3D PARTICLE FIELD
     Points sit in a box in front of the camera. Scrolling moves the camera
     forward through them, the cursor turns it slightly. */
  const PT = {};
  function initParticles() {
    const cv = $("#bg");
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const DEPTH = 3.4, NEAR = 0.35;
    let W = 0, H = 0, F = 0, pts = [], edges = [], cmx = P.nx, cmy = P.ny, density = 1;

    const seed = () => {
      const base = Q.low ? 42000 : Q.mid ? 30000 : 20000;
      const n = Math.round(clamp((W * H) / base, 24, Q.low ? 40 : Q.mid ? 60 : 96) * density);
      pts = [];
      for (let i = 0; i < n; i++) {
        pts.push({ x: (Math.random() * 2 - 1) * 1.8, y: (Math.random() * 2 - 1) * 1.15, z: Math.random() * DEPTH, r: 0.55 + Math.random() * 1.3, sx: 0, sy: 0, a: 0, zc: 1 });
      }
      edges = [];
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, dz = pts[i].z - pts[j].z;
          if (dx * dx + dy * dy + dz * dz < 0.36) edges.push(i, j);
        }
      }
    };
    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      W = innerWidth; H = innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      F = Math.min(W, H) * 0.78;
      seed();
    };
    const draw = (t) => {
      cmx = lerp(cmx, P.nx, 0.05);
      cmy = lerp(cmy, P.ny, 0.05);
      const camZ = scrollY * 0.0012 + (reduce ? 0 : (t || 0) * 0.000035);
      const yaw = (cmx - 0.5) * 0.45, pitch = (cmy - 0.5) * 0.3;
      const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const zMid = NEAR + DEPTH / 2, ox = W / 2, oy = H / 2;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const z = (((p.z - camZ) % DEPTH) + DEPTH) % DEPTH + NEAR;
        const zz = z - zMid;
        const x1 = p.x * cyw - zz * syw, z1 = p.x * syw + zz * cyw;
        const y1 = p.y * cp - z1 * sp, z2 = p.y * sp + z1 * cp;
        const zc = z2 + zMid;
        p.zc = zc;
        if (zc < 0.15) { p.a = 0; continue; }
        p.sx = ox + (x1 / zc) * F;
        p.sy = oy + (y1 / zc) * F;
        p.a = clamp((NEAR + DEPTH - zc) / (DEPTH * 0.45), 0, 1) * clamp((zc - NEAR * 0.6) / 0.5, 0, 1);
      }
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1;
      ctx.strokeStyle = col.brass;
      const la = col.dark ? 0.2 : 0.16;
      for (let k = 0; k < edges.length; k += 2) {
        const A = pts[edges[k]], B = pts[edges[k + 1]];
        if (A.a < 0.02 || B.a < 0.02 || Math.abs(A.zc - B.zc) > 1) continue;
        ctx.globalAlpha = Math.min(A.a, B.a) * la;
        ctx.beginPath(); ctx.moveTo(A.sx, A.sy); ctx.lineTo(B.sx, B.sy); ctx.stroke();
      }
      if (P.moved && fine) {
        for (let i = 0; i < pts.length; i++) {
          const p = pts[i];
          if (p.a < 0.05) continue;
          const dx = p.sx - P.x, dy = p.sy - P.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < 200) {
            ctx.globalAlpha = (1 - d / 200) * 0.42 * p.a;
            ctx.beginPath(); ctx.moveTo(p.sx, p.sy); ctx.lineTo(P.x, P.y); ctx.stroke();
          }
        }
      }
      ctx.fillStyle = col.brass;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (p.a < 0.02) continue;
        ctx.globalAlpha = p.a * (col.dark ? 0.78 : 0.6);
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, Math.max(0.45, p.r * (1.5 / p.zc)), 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    size();
    draw(0);
    if (!reduce) run(draw);
    else scrollFns.push(() => draw(0));
    resizeFns.push(() => { size(); draw(0); });
    themeFns.push(() => draw(0));
    PT.thin = () => { density = 0.55; seed(); };
  }

  /* ---------------------------------------------------------- 4. ENTITY SPHERE
     Fibonacci sphere, perspective divide, painter ordering, signal pulses
     that walk the edges, drag to spin with inertia. Edit LABELS to change
     the entity names. */
  function initGraph() {
    const cv = $("#ggraph");
    if (!cv) return;
    const host = cv.closest(".graphbox") || cv.parentNode;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const LABELS = [
      "AEO", "GEO", "JSON-LD", "Entities", "Core Web Vitals", "AI Overviews",
      "Schema", "GA4", "Crawl budget", "E-E-A-T", "llms.txt", "Ahrefs",
      "Next.js", "Google Ads", "Internal links", "Perplexity"
    ];
    const N = Q.low ? 52 : 76;
    let nodes = [], edges = [], adj = [], pulses = [], proj = [], order = [];
    let W = 0, H = 0, born = 0, live = false;
    let ay = 0.5, ax = -0.26, vy = 0, tx = 0, ty = 0, px = 0, py = 0, drag = null;
    const spr = {};

    const glow = (c) => {
      const s = 64, cvs = doc.createElement("canvas");
      cvs.width = cvs.height = s;
      const g = cvs.getContext("2d");
      const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      gr.addColorStop(0, rgba(c, 1));
      gr.addColorStop(0.16, rgba(c, 0.95));
      gr.addColorStop(0.4, rgba(c, 0.22));
      gr.addColorStop(1, rgba(c, 0));
      g.fillStyle = gr;
      g.fillRect(0, 0, s, s);
      return cvs;
    };
    const sprites = () => {
      spr.brass = glow(col.dark ? "#BFA181" : "#8A6A44");
      spr.sand = glow(col.dark ? "#D4C5B0" : "#6B6053");
      spr.hot = glow(col.dark ? "#F4F4F4" : "#8A6A44");
    };

    const build = () => {
      nodes = [];
      for (let k = 0; k < N; k++) {
        const y = 1 - (k / (N - 1)) * 2, r = Math.sqrt(Math.max(0, 1 - y * y)), th = k * 2.39996323;
        const rad = 0.84 + ((k * 37) % 19) / 100;
        const li = k % 4 === 1 ? (k / 4) | 0 : -1;
        nodes.push({
          x: Math.cos(th) * r * rad, y: y * rad, z: Math.sin(th) * r * rad,
          label: li >= 0 && li < LABELS.length ? LABELS[li] : null,
          x0: (Math.random() * 2 - 1) * 2.6, y0: (Math.random() * 2 - 1) * 2.2, z0: (Math.random() * 2 - 1) * 2.6
        });
        proj.push({ sx: 0, sy: 0, s: 1, z: 0, a: 0 });
        order.push(k);
      }
      const lim = 10.5 / N;
      edges = []; adj = nodes.map(() => []);
      for (let a = 0; a < N; a++) {
        for (let b = a + 1; b < N; b++) {
          const dx = nodes[a].x - nodes[b].x, dy = nodes[a].y - nodes[b].y, dz = nodes[a].z - nodes[b].z;
          if (dx * dx + dy * dy + dz * dz < lim) { edges.push(a, b); adj[a].push(b); adj[b].push(a); }
        }
      }
      pulses = [];
      const np = Q.low ? 6 : 12;
      for (let i = 0; i < np; i++) {
        let a = (Math.random() * N) | 0;
        while (!adj[a].length) a = (a + 1) % N;
        pulses.push({ a: a, b: adj[a][(Math.random() * adj[a].length) | 0], t: Math.random(), sp: 0.008 + Math.random() * 0.012 });
      }
    };
    const size = () => {
      const r = host.getBoundingClientRect();
      if (!r.width) return;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (tm, f) => {
      if (!W) return;
      const k = born ? easeOut(clamp((tm - born) / 1900, 0, 1)) : 1;
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.4, cam = 2.9;
      const cY = Math.cos(ay + px), sY = Math.sin(ay + px), cX = Math.cos(ax + py), sX = Math.sin(ax + py);
      for (let n = 0; n < N; n++) {
        const p = nodes[n], q = proj[n];
        const X = k < 1 ? lerp(p.x0, p.x, k) : p.x, Y = k < 1 ? lerp(p.y0, p.y, k) : p.y, Z = k < 1 ? lerp(p.z0, p.z, k) : p.z;
        const x1 = X * cY - Z * sY, z1 = X * sY + Z * cY;
        const y2 = Y * cX - z1 * sX, z2 = Y * sX + z1 * cX;
        const sc = cam / (cam - clamp(z2, -2.5, 2.2));
        q.sx = cx + x1 * sc * R; q.sy = cy + y2 * sc * R; q.s = sc; q.z = z2;
        q.a = clamp(0.14 + ((z2 + 1.1) / 2.2) * 0.86, 0.05, 1);
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = col.line;
      for (let e = 0; e < edges.length; e += 2) {
        const A = proj[edges[e]], B = proj[edges[e + 1]];
        ctx.globalAlpha = Math.min(A.a, B.a) * 0.5 * k;
        ctx.beginPath(); ctx.moveTo(A.sx, A.sy); ctx.lineTo(B.sx, B.sy); ctx.stroke();
      }
      if (k > 0.7) {
        for (let i = 0; i < pulses.length; i++) {
          const pu = pulses[i];
          pu.t += pu.sp * (f || 1);
          if (pu.t >= 1) {
            const prev = pu.a;
            pu.a = pu.b; pu.t = 0;
            const nb = adj[pu.a];
            let nx = nb[(Math.random() * nb.length) | 0];
            if (nx === prev && nb.length > 1) nx = nb[(nb.indexOf(nx) + 1) % nb.length];
            pu.b = nx;
          }
          const A = proj[pu.a], B = proj[pu.b];
          const x = lerp(A.sx, B.sx, pu.t), y = lerp(A.sy, B.sy, pu.t);
          const s = 13 * lerp(A.s, B.s, pu.t);
          ctx.globalAlpha = lerp(A.a, B.a, pu.t) * (k - 0.7) / 0.3;
          ctx.drawImage(spr.hot, x - s / 2, y - s / 2, s, s);
        }
      }
      order.sort((u, v) => proj[u].z - proj[v].z);
      ctx.font = "500 10.5px 'JetBrains Mono', ui-monospace, monospace";
      ctx.textBaseline = "middle";
      for (let m = 0; m < N; m++) {
        const i = order[m], q = proj[i], lab = nodes[i].label;
        const s = (lab ? 17 : 10) * q.s;
        ctx.globalAlpha = q.a * (0.25 + 0.75 * k);
        ctx.drawImage(lab ? spr.brass : spr.sand, q.sx - s / 2, q.sy - s / 2, s, s);
        if (lab && q.a > 0.62 && k > 0.92) {
          const dd = Math.hypot(q.sx - cx, q.sy - cy);
          if (dd < 22) continue;
          const flip = q.sx > cx;
          const tw = ctx.measureText(lab).width;
          const bx = flip ? q.sx - s * 0.35 - 10 - tw - 12 : q.sx + s * 0.35 + 10;
          const alpha = ((q.a - 0.62) / 0.38) * ((k - 0.92) / 0.08);
          ctx.globalAlpha = alpha * 0.9;
          ctx.fillStyle = col.dark ? "rgba(28,28,28,.72)" : "rgba(255,255,255,.8)";
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(bx, q.sy - 10, tw + 12, 20, 6); else ctx.rect(bx, q.sy - 10, tw + 12, 20);
          ctx.fill();
          ctx.strokeStyle = col.line;
          ctx.stroke();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = col.sand;
          ctx.fillText(lab, bx + 6, q.sy + 0.5);
        }
      }
      ctx.globalAlpha = 1;
    };

    const frame = (t, dt) => {
      const f = dt / 16.7;
      if (!drag) {
        ay += (0.0021 + vy) * f;
        vy *= Math.pow(0.94, f);
        ax = lerp(ax, -0.26, 0.01 * f);
      }
      px += (tx - px) * 0.06 * f;
      py += (ty - py) * 0.06 * f;
      draw(t, f);
    };

    build();
    sprites();
    size();

    if (reduce) {
      draw(0, 1);
      resizeFns.push(() => { size(); draw(0, 1); });
      themeFns.push(() => { sprites(); draw(0, 1); });
      return;
    }

    new IntersectionObserver((en) => {
      en.forEach((x) => {
        if (x.isIntersecting && !live) {
          live = true;
          if (!born) born = performance.now();
          run(frame);
        } else if (!x.isIntersecting && live) {
          live = false;
          stop(frame);
        }
      });
    }, { threshold: 0.04 }).observe(host);

    host.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      drag = { x: e.clientX, y: e.clientY };
      try { host.setPointerCapture(e.pointerId); } catch (err) {}
      host.classList.add("is-drag");
    });
    host.addEventListener("pointermove", (e) => {
      if (drag) {
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        drag.x = e.clientX; drag.y = e.clientY;
        vy = dx * 0.0055;
        ay += vy;
        ax = clamp(ax + dy * 0.004, -1.25, 1.25);
      } else {
        const r = host.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 0.85;
        ty = ((e.clientY - r.top) / r.height - 0.5) * -0.55;
      }
    });
    const end = () => { drag = null; host.classList.remove("is-drag"); };
    host.addEventListener("pointerup", end);
    host.addEventListener("pointercancel", end);
    host.addEventListener("pointerleave", () => { if (!drag) { tx = 0; ty = 0; } });
    resizeFns.push(size);
    themeFns.push(sprites);
    addEventListener("load", size);
  }

  /* ---------------------------------------------------------- 5a. TILT, LIGHT, DEPTH
     .fx3d cards tilt toward the cursor and their inner layers shift at
     different depths. .fxg panels only catch the light on their border. */
  const TILT = ".fpc,.skm,.cm,.skill,.work,.stop,.st,.cstrip,.cta,.split>.card,.tools li";
  const GLOW = ".tile,#toolkit>.card,.wordmark";
  const DEPTHS = [
    [".w__shot img", -14],
    [".w__m", 7],
    [".w__t,.skill__t,.stop__t,.fpc h4,.skm b,.cm b,.cstrip__t,.card__h", 5],
    [".st svg", 10],
    [".st b", 6],
    [".tm", 9]
  ];
  const active = new Map(), hotSet = new Set();
  let hot = null, needPtr = false, metals = [];

  function addGlow(el) {
    if (el.classList.contains("wordmark")) return;
    for (let i = 0; i < el.children.length; i++) if (el.children[i].tagName === "FX-GLOW") return;
    const g = doc.createElement("fx-glow");
    g.className = "fx-glow";
    g.setAttribute("aria-hidden", "true");
    el.appendChild(g);
  }
  function glowTarget(el) {
    if (el._g === undefined) {
      let g = null;
      for (let i = 0; i < el.children.length; i++) if (el.children[i].tagName === "FX-GLOW") { g = el.children[i]; break; }
      el._g = g || el;
    }
    return el._g;
  }
  function engage(c) {
    let s = active.get(c);
    if (!s) { s = { x: 0, y: 0, z: 0, tx: 0, ty: 0, layers: null, on: true }; active.set(c, s); }
    s.on = true;
    s.w = c.offsetWidth || 1;
    s.h = c.offsetHeight || 1;
    s.maxY = clamp(2400 / s.w, 2.5, 11);
    s.maxX = clamp(2400 / s.h, 1.5, 11);
    if (!s.layers) {
      s.layers = [];
      DEPTHS.forEach((d) => {
        $$(d[0], c).forEach((el) => { if (el.closest(".fx3d") === c) s.layers.push([el, d[1]]); });
      });
    }
    c.style.willChange = "transform";
    run(tiltTask);
  }
  function release(c) {
    const s = active.get(c);
    if (s) { s.on = false; s.tx = 0; s.ty = 0; }
  }
  function aim(c) {
    const s = active.get(c);
    if (!s) return;
    const r = c.getBoundingClientRect();
    const left = r.left + r.width / 2 - s.w / 2, top = r.top + r.height / 2 - s.h / 2;
    s.tx = clamp((P.x - left) / s.w, 0, 1) * 2 - 1;
    s.ty = clamp((P.y - top) / s.h, 0, 1) * 2 - 1;
  }
  function tiltTask(t, dt) {
    const k = 1 - Math.pow(1 - 0.14, Math.min(dt / 16.7, 3));
    active.forEach((s, c) => {
      s.x = lerp(s.x, s.tx, k);
      s.y = lerp(s.y, s.ty, k);
      s.z = lerp(s.z, s.on ? 1 : 0, k);
      if (!s.on && Math.abs(s.x) < 0.003 && Math.abs(s.y) < 0.003 && s.z < 0.01) {
        c.style.transform = "";
        c.style.willChange = "";
        s.layers.forEach((l) => { l[0].style.translate = ""; });
        active.delete(c);
        return;
      }
      c.style.transform = "perspective(1100px) rotateX(" + (-s.y * s.maxX).toFixed(2) + "deg) rotateY(" + (s.x * s.maxY).toFixed(2) + "deg) translateZ(" + (s.z * 8).toFixed(1) + "px)";
      for (let i = 0; i < s.layers.length; i++) {
        const l = s.layers[i];
        l[0].style.translate = (s.x * l[1]).toFixed(1) + "px " + (s.y * l[1]).toFixed(1) + "px";
      }
    });
    if (!active.size) stop(tiltTask);
  }
  function ptrTask() {
    stop(ptrTask);
    if (!needPtr) return;
    needPtr = false;
    const t = P.target;
    const card = !reduce && t && t.closest ? t.closest(".fx3d") : null;
    if (card !== hot) {
      if (hot) release(hot);
      if (card) engage(card);
      hot = card;
    }
    if (card) aim(card);

    const chain = [];
    let el = t && t.closest ? t.closest(".fx3d,.fxg") : null;
    while (el) {
      chain.push(el);
      const g = glowTarget(el), r = el.getBoundingClientRect();
      g.style.setProperty("--mx", (P.x - r.left).toFixed(0) + "px");
      g.style.setProperty("--my", (P.y - r.top).toFixed(0) + "px");
      el = el.parentElement ? el.parentElement.closest(".fx3d,.fxg") : null;
    }
    hotSet.forEach((g) => { if (chain.indexOf(g) < 0) { g.classList.remove("is-hot"); hotSet.delete(g); } });
    chain.forEach((g) => { if (!hotSet.has(g)) { g.classList.add("is-hot"); hotSet.add(g); } });

    const lx = ((P.nx - 0.5) * 2).toFixed(3);
    for (let i = 0; i < metals.length; i++) metals[i].style.setProperty("--lx", lx);
  }
  function initTilt() {
    $$(TILT).forEach((c) => { c.classList.add("fx3d"); addGlow(c); });
    $$(GLOW).forEach((c) => { c.classList.add("fxg"); addGlow(c); });
    metals = $$(".metal");
    if (!fine) return;
    addEventListener("pointermove", (e) => {
      P.x = e.clientX; P.y = e.clientY;
      P.nx = P.x / V.w; P.ny = P.y / V.h;
      P.moved = true; P.target = e.target;
      needPtr = true;
      run(ptrTask);
    }, { passive: true });
    root.addEventListener("mouseleave", () => {
      P.target = null; needPtr = true; run(ptrTask);
    });
    scrollFns.push(() => {
      if (!P.moved) return;
      P.target = doc.elementFromPoint(P.x, P.y);
      needPtr = true;
      run(ptrTask);
    });
  }

  /* ---------------------------------------------------------- 5b. MAGNETIC BUTTONS */
  function initMagnetic() {
    if (!fine || reduce) return;
    $$(".btn,.sbtn,.shead__l,.iconbtn,.mark,.fchip,.cardlink").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
        el.style.translate = (x * 0.3).toFixed(1) + "px " + (y * 0.42).toFixed(1) + "px";
      });
      el.addEventListener("pointerleave", () => { el.style.translate = ""; });
    });
  }

  /* ---------------------------------------------------------- 5c. CURSOR */
  function initCursor() {
    if (!fine || reduce) return;
    const c = doc.createElement("div");
    c.className = "cur is-off";
    c.setAttribute("aria-hidden", "true");
    c.innerHTML = '<span class="cur__ring"><i></i><em></em></span><span class="cur__dot"></span>';
    body.appendChild(c);
    root.classList.add("has-cur");
    const ring = $(".cur__ring", c), dot = $(".cur__dot", c), label = $("em", c);
    let rx = P.x, ry = P.y;
    const ringTask = (t, dt) => {
      const k = 1 - Math.pow(1 - 0.2, Math.min(dt / 16.7, 3));
      rx = lerp(rx, P.x, k); ry = lerp(ry, P.y, k);
      ring.style.transform = "translate3d(" + rx.toFixed(1) + "px," + ry.toFixed(1) + "px,0)";
      if (Math.abs(rx - P.x) < 0.15 && Math.abs(ry - P.y) < 0.15) stop(ringTask);
    };
    addEventListener("pointermove", (e) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      P.x = e.clientX; P.y = e.clientY;
      dot.style.transform = "translate3d(" + e.clientX + "px," + e.clientY + "px,0)";
      c.classList.remove("is-off");
      run(ringTask);
    }, { passive: true });
    const LINK = "a,button,[role='button'],.fchip,label,summary,input,select,textarea";
    const state = (t) => {
      if (!t || !t.closest) { c.classList.remove("has-txt", "is-link"); return; }
      const tagged = t.closest("[data-cursor]");
      const txt = tagged ? tagged.getAttribute("data-cursor") : "";
      if (label.textContent !== txt) label.textContent = txt;
      c.classList.toggle("has-txt", !!txt);
      c.classList.toggle("is-link", !txt && !!t.closest(LINK));
    };
    doc.addEventListener("pointerover", (e) => state(e.target));
    /* the page can scroll under a still mouse, so re-check what is under it */
    scrollFns.push(() => { if (!c.classList.contains("is-off")) state(doc.elementFromPoint(P.x, P.y)); });
    doc.addEventListener("pointerdown", () => c.classList.add("is-down"));
    doc.addEventListener("pointerup", () => c.classList.remove("is-down"));
    root.addEventListener("mouseleave", () => c.classList.add("is-off"));
  }

  /* ---------------------------------------------------------- 5d. NAV PILL */
  function initNavPill() {
    const nav = $(".navc");
    if (!nav) return;
    const links = $$("a", nav);
    if (!links.length) return;
    const pill = doc.createElement("span");
    pill.className = "navc__pill";
    pill.setAttribute("aria-hidden", "true");
    nav.insertBefore(pill, nav.firstChild);
    nav.classList.add("has-pill");
    const current = $("a[aria-current='page']", nav);
    const place = (a, instant) => {
      if (!a) { pill.style.opacity = "0"; return; }
      if (instant) pill.style.transition = "none";
      pill.style.opacity = "1";
      pill.style.width = a.offsetWidth + "px";
      pill.style.transform = "translateX(" + a.offsetLeft + "px)";
      if (instant) { void pill.offsetWidth; pill.style.transition = ""; }
    };
    place(current, true);
    links.forEach((a) => {
      a.addEventListener("pointerenter", () => place(a));
      a.addEventListener("focus", () => place(a));
    });
    nav.addEventListener("pointerleave", () => place(current));
    nav.addEventListener("focusout", (e) => { if (!nav.contains(e.relatedTarget)) place(current); });
    resizeFns.push(() => place(current, true));
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(() => place(current, true));
  }

  /* ---------------------------------------------------------- 6a. SPLIT HEADINGS
     Words (or letters, for the name) are wrapped in spans so they can flip
     up in 3D. The text itself is untouched, so crawlers read it as normal. */
  function splitHeading(h, letters) {
    if (h.classList.contains("is-split")) return;
    let i = 0;
    const plain = h.textContent.replace(/\s+/g, " ").trim();
    const walk = (node) => {
      Array.prototype.slice.call(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/(\s+)/);
          const frag = doc.createDocumentFragment();
          parts.forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(doc.createTextNode(part)); return; }
            const w = doc.createElement("span");
            w.className = "w";
            if (letters) {
              Array.from(part).forEach((chr) => {
                const c = doc.createElement("span");
                c.className = "ch";
                c.textContent = chr;
                c.style.setProperty("--wi", i++);
                w.appendChild(c);
              });
            } else {
              w.textContent = part;
              w.style.setProperty("--wi", i++);
            }
            frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) {
          walk(n);
        }
      });
    };
    walk(h);
    if (letters) h.setAttribute("aria-label", plain);
    h.classList.add("is-split");
  }

  /* ---------------------------------------------------------- 6b. COUNT-UPS AND SCRAMBLES
     Drawn on an overlay (data-s + ::after). The number in the HTML never
     changes, so nothing half-animated can ever be indexed. */
  const GLYPHS = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789#%+/<>";
  function scramble(el, dur) {
    const final = el.textContent;
    if (!final.trim() || el._fx) return;
    el._fx = 1;
    dur = dur || 900;
    el.classList.add("scr", "is-scr");
    const t0 = performance.now(), n = final.length;
    const at = [];
    for (let i = 0; i < n; i++) at.push((i / n) * 0.7 + Math.random() * 0.3);
    let last = 0;
    const task = (t) => {
      const k = (t - t0) / dur;
      if (k >= 1) { el.classList.remove("is-scr"); el.removeAttribute("data-s"); stop(task); return; }
      if (t - last < 42) return;
      last = t;
      let out = "";
      for (let i = 0; i < n; i++) {
        const ch = final.charAt(i);
        out += ch === " " || k >= at[i] ? ch : GLYPHS.charAt((Math.random() * GLYPHS.length) | 0);
      }
      el.setAttribute("data-s", out);
    };
    run(task);
  }
  function countUp(el, dur) {
    const txt = el.textContent.trim();
    if (!txt || el._fx) return;
    const m = txt.match(/^([^\d]*?)(\d[\d,]*(?:\.\d+)?)([^\d]*)$/);
    if (!m) { scramble(el); return; }
    el._fx = 1;
    dur = dur || 1500;
    const pre = m[1], num = m[2], suf = m[3];
    const dec = (num.split(".")[1] || "").length, comma = num.indexOf(",") > -1;
    const target = parseFloat(num.replace(/,/g, ""));
    const fmt = (v) => (comma ? v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }) : v.toFixed(dec));
    el.classList.add("scr", "is-scr");
    const t0 = performance.now();
    const task = (t) => {
      const k = clamp((t - t0) / dur, 0, 1);
      el.setAttribute("data-s", pre + fmt(target * easeExpo(k)) + suf);
      if (k >= 1) { el.classList.remove("is-scr"); el.removeAttribute("data-s"); stop(task); }
    };
    el.setAttribute("data-s", pre + fmt(0) + suf);
    run(task);
  }

  /* ---------------------------------------------------------- 6c. REVEALS */
  const EXTRA = [
    [".stats4>.st", "pop"],
    [".t-tools .tools li", "pop"],
    [".fp>.fpc", "pop"],
    [".skmini>.skm", ""],
    [".cmini>.cm", "flip"],
    [".rail>.stop", "side"],
    [".certs li", "flip"],
    [".clist li", "flip"],
    ["#toolkit .chips", ""]
  ];
  function initReveal() {
    EXTRA.forEach((x) => {
      $$(x[0]).forEach((el) => {
        el.classList.add("rv");
        if (x[1]) el.setAttribute("data-rv", x[1]);
      });
    });
    const heads = $$("main h1, .shead h2, .cstrip h2, .cta h2");
    heads.forEach((h) => {
      h.classList.add("metal");
      if (!reduce) splitHeading(h, !!h.closest(".phead"));
    });
    $$(".phead h1").forEach((h) => h.style.setProperty("--w0", "260ms"));
    $$(".eyebrow").forEach((e) => {
      const tn = Array.prototype.slice.call(e.childNodes).filter((n) => n.nodeType === 3 && n.textContent.trim());
      tn.forEach((n) => {
        const s = doc.createElement("span");
        s.className = "scr-t";
        s.textContent = n.textContent;
        n.parentNode.replaceChild(s, n);
      });
    });
    $$(".stop").forEach((s) => {
      const y = $(".stop__yr", s), m = y && y.textContent.match(/\d{4}/);
      if (m) s.setAttribute("data-y", m[0]);
    });
    $$(".cstrip,.cta,.pill").forEach((el) => el.classList.add("beam"));
    $$(".graphbox").forEach((el) => el.setAttribute("data-cursor", "Drag"));
    $$(".skill").forEach((el) => el.setAttribute("data-cursor", "Read"));
    $$(".w__shot img").forEach((el) => el.setAttribute("data-cursor", "View"));

    if (reduce || !("IntersectionObserver" in window)) {
      $$(".rv").forEach((el) => el.classList.add("in"));
      heads.forEach((h) => h.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      let i = 0;
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        io.unobserve(el);
        el.style.setProperty("--rd", Math.min(i++ * 70, 560) + "ms");
        el.classList.add("in");
      });
    }, { rootMargin: "0px 0px -5% 0px", threshold: 0.06 });
    $$(".rv").forEach((el) => io.observe(el));
    heads.forEach((h) => io.observe(h));

    /* numbers count up, labels decode, once each, when they come into view */
    const fxio = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        fxio.unobserve(el);
        const delay = el.matches(".w__m b") ? 380 + Array.prototype.indexOf.call(el.parentNode.parentNode.children, el.parentNode) * 140 : el.matches(".st b") ? 520 : 120;
        setTimeout(() => {
          if (el.matches(".scr-t")) scramble(el, 800);
          else countUp(el);
        }, delay);
      });
    }, { threshold: 0.6 });
    $$(".w__m b,.st b,.eyebrow .scr-t").forEach((el) => fxio.observe(el));
  }

  /* ---------------------------------------------------------- 6d. MARQUEE BANDS
     The words are drawn from data-t attributes by CSS, so the repeated
     copies never show up as page text. Scrolling speeds them up and skews them. */
  function initBands() {
    const wrap = $(".bands");
    if (!wrap) return;
    const bands = $$(".band", wrap).map((b, i) => {
      const tr = $(".band__track", b);
      return { b: b, tr: tr, html: tr.innerHTML, x: 0, set: 0, dir: i % 2 ? 1 : -1 };
    });
    const measure = () => {
      bands.forEach((it) => {
        it.tr.innerHTML = it.html;
        const setW = it.tr.scrollWidth || 1;
        const copies = Math.max(2, Math.ceil((it.b.clientWidth * 1.2) / setW) + 1);
        let h = "";
        for (let i = 0; i < copies; i++) h += it.html;
        it.tr.innerHTML = h;
        it.set = setW;
        it.x = it.dir > 0 ? -setW : 0;
      });
    };
    measure();
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(measure);
    resizeFns.push(measure);
    if (reduce) return;
    let boost = 0;
    const task = (t, dt) => {
      const f = dt / 16.7;
      boost = lerp(boost, clamp(V.vel, -60, 60), 0.08);
      bands.forEach((it) => {
        it.x += it.dir * (0.55 + Math.abs(boost) * 0.12) * f;
        if (it.dir < 0 && it.x <= -it.set) it.x += it.set;
        if (it.dir > 0 && it.x >= 0) it.x -= it.set;
        it.tr.style.transform = "translate3d(" + it.x.toFixed(1) + "px,0,0) skewX(" + (clamp(boost * 0.18, -9, 9) * it.dir).toFixed(2) + "deg)";
      });
    };
    new IntersectionObserver((en) => {
      en.forEach((x) => { if (x.isIntersecting) run(task); else stop(task); });
    }).observe(wrap);
  }

  /* ---------------------------------------------------------- 6e. SLEEP OFF-SCREEN LOOPS
     Endless sheen and beam loops pause while their element is off screen,
     which saves battery on long pages like Work. */
  function initSleep() {
    if (reduce || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((en) => {
      en.forEach((x) => x.target.classList.toggle("zz", !x.isIntersecting));
    }, { rootMargin: "120px 0px" });
    $$(".metal,.beam,.avatar-wrap,.inner,.bands,.graphbox,.stats4,.card__h,.wordmark,.pagehead").forEach((el) => io.observe(el));
  }

  /* ---------------------------------------------------------- 6f. PARALLAX + PROGRESS */
  function initParallax() {
    const ph = $(".pagehead");
    if (!ph || reduce) return;
    const upd = () => {
      ph.style.setProperty("--py", (scrollY * 0.25).toFixed(1));
      ph.style.setProperty("--px", ((P.nx - 0.5) * -30).toFixed(1));
    };
    upd();
    scrollFns.push(upd);
    if (fine) {
      let q = false;
      addEventListener("pointermove", () => {
        if (q) return;
        q = true;
        requestAnimationFrame(() => { q = false; upd(); });
      }, { passive: true });
    }
  }
  function initProgress() {
    const bar = doc.createElement("div");
    bar.className = "progress";
    bar.setAttribute("aria-hidden", "true");
    body.appendChild(bar);
    const upd = () => {
      const max = root.scrollHeight - innerHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? clamp(scrollY / max, 0, 1) : 0).toFixed(4) + ")";
    };
    upd();
    scrollFns.push(upd);
    resizeFns.push(upd);
  }

  /* ---------------------------------------------------------- 7a. CASE READER (skills page) */
  function initCases() {
    const ovl = $("#ovl"), sTitle = $("#sheetTitle"), sSub = $("#sheetSub"), sBody = $("#sheetBody"), sX = $("#sheetX");
    if (!ovl || !sTitle || !sBody || !sX) return;
    let lastFocus = null;
    $$(".skill").forEach((card) => {
      const cases = $(".cases", card);
      const count = cases ? $$(".case", cases).length : 0;
      const foot = doc.createElement("div");
      foot.className = "skill__f";
      foot.innerHTML = "<span>" + (count ? count + (count === 1 ? " case study" : " case studies") : "Nothing written up yet") + "</span><b>Read &rarr;</b>";
      card.appendChild(foot);
      const open = () => {
        lastFocus = card;
        sTitle.textContent = $(".skill__t", card).textContent;
        sSub.textContent = $(".skill__d", card).textContent;
        sBody.innerHTML = count
          ? cases.innerHTML
          : '<div class="empty">Nothing here yet. Add an <code>&lt;article class="case"&gt;</code> block inside this card in <code>skills.html</code> and it shows up straight away.</div>';
        $$(".case", sBody).forEach((c, i) => c.style.setProperty("--ci", i));
        ovl.setAttribute("open", "");
        body.style.overflow = "hidden";
        sX.focus();
      };
      card.addEventListener("click", open);
      card.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); open(); }
      });
    });
    const close = () => {
      ovl.removeAttribute("open");
      body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    };
    sX.addEventListener("click", close);
    ovl.addEventListener("click", (ev) => { if (ev.target === ovl) close(); });
    doc.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && ovl.hasAttribute("open")) close(); });
  }

  /* ---------------------------------------------------------- 7b. WORK FILTERS (work page) */
  function initFilters() {
    const filters = $("#filters"), grid = $("#workGrid");
    if (!filters || !grid) return;
    const wlist = $("#wlist");
    const cards = $$(".work", grid);
    const rows = wlist ? $$(".wrow", wlist) : [];
    const chips = $$(".fchip", filters);
    const searchEl = $("#wsearch"), moreBtn = $("#moreBtn"), listEmpty = $("#listEmpty"), listCount = $("#listCount");
    const PAGE = 12;
    let type = "all", query = "", limit = PAGE;

    const note = doc.createElement("p");
    note.className = "work__empty";
    note.hidden = true;
    note.textContent = "No cards under this one yet. Check the list below.";
    grid.appendChild(note);

    const countFor = (f) => {
      let n = 0;
      cards.forEach((c) => { if (f === "all" || c.dataset.type === f) n++; });
      rows.forEach((r) => { if (f === "all" || r.dataset.type === f) n++; });
      return n;
    };
    const render = () => {
      let shown = 0;
      cards.forEach((c) => {
        const on = type === "all" || c.dataset.type === type;
        c.hidden = !on;
        if (on) shown++;
      });
      note.hidden = shown > 0;
      if (!rows.length) return;
      let matched = 0, visible = 0;
      rows.forEach((r) => {
        const okType = type === "all" || r.dataset.type === type;
        const okQuery = !query || r.textContent.toLowerCase().indexOf(query) > -1;
        if (okType && okQuery) {
          matched++;
          if (matched <= limit) { r.hidden = false; visible++; } else r.hidden = true;
        } else r.hidden = true;
      });
      if (listEmpty) listEmpty.hidden = matched > 0;
      if (listCount) listCount.textContent = matched ? visible + " of " + matched : "";
      if (moreBtn) {
        const left = matched - limit;
        moreBtn.hidden = left <= 0;
        moreBtn.textContent = "Show " + Math.min(left, PAGE) + " more";
      }
    };
    /* after a filter change the visible cards are dealt in again, in 3D */
    const redeal = () => {
      if (reduce) return;
      let i = 0;
      cards.forEach((c) => {
        if (c.hidden || !c.classList.contains("in")) return;
        const r = c.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        c.classList.remove("in");
        void c.offsetWidth;
        c.style.setProperty("--rd", Math.min(i++ * 60, 480) + "ms");
        c.classList.add("in");
      });
    };
    chips.forEach((chip) => {
      const f = chip.dataset.f;
      chip.insertAdjacentHTML("beforeend", "<i>" + countFor(f) + "</i>");
      chip.setAttribute("aria-pressed", chip.classList.contains("is-on") ? "true" : "false");
      chip.addEventListener("click", () => {
        chips.forEach((c) => { c.classList.remove("is-on"); c.setAttribute("aria-pressed", "false"); });
        chip.classList.add("is-on");
        chip.setAttribute("aria-pressed", "true");
        type = f;
        limit = PAGE;
        render();
        redeal();
      });
    });
    if (searchEl) searchEl.addEventListener("input", () => { query = searchEl.value.toLowerCase().trim(); limit = PAGE; render(); });
    if (moreBtn) moreBtn.addEventListener("click", () => { limit += PAGE; render(); });
    render();
  }

  /* ---------------------------------------------------------- 7c. SCREENSHOT LIGHTBOX (work page) */
  function initLightbox() {
    const lb = $("#lb"), lbImg = $("#lbImg"), lbCap = $("#lbCap"), lbX = $("#lbX");
    if (!lb || !lbImg || !lbX) return;
    let back = null;
    const openShot = (img) => {
      back = img;
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt || "";
      const card = img.closest(".work"), t = card ? $(".w__t", card) : null;
      if (lbCap) lbCap.textContent = t ? t.textContent : "";
      lb.setAttribute("open", "");
      body.style.overflow = "hidden";
      lbX.focus();
    };
    const closeShot = () => {
      lb.removeAttribute("open");
      body.style.overflow = "";
      if (back) back.focus();
    };
    $$(".w__shot img").forEach((img) => {
      img.tabIndex = 0;
      img.setAttribute("role", "button");
      img.setAttribute("aria-label", "Open screenshot full size");
      img.addEventListener("click", () => openShot(img));
      img.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); openShot(img); }
      });
    });
    lbX.addEventListener("click", closeShot);
    lb.addEventListener("click", (ev) => { if (ev.target === lb) closeShot(); });
    doc.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && lb.hasAttribute("open")) closeShot(); });
  }

  /* ---------------------------------------------------------- 8. PERFORMANCE GUARD
     Watches the first couple of seconds of frames. If the device cannot keep
     up, the glass goes solid, the background renders at a lower resolution
     and the particle field thins out. If it is still struggling, WebGL stops. */
  function perfGuard() {
    if (reduce || !FX.on || window.__fxNoGuard) return;
    const samples = [];
    let n = 0, t0 = 0;
    const task = (t, dt) => {
      if (doc.hidden) return;
      if (++n < 12) return;
      if (!t0) t0 = t;
      samples.push(dt);
      if (samples.length < 90 && (t - t0 < 2600 || samples.length < 10)) return;
      stop(task);
      samples.sort((a, b) => a - b);
      const med = samples[samples.length >> 1], p90 = samples[Math.floor(samples.length * 0.9)];
      if (med > 30) {
        root.classList.add("lite");
        if (PT.thin) PT.thin();
        if (FX.kill) FX.kill();
      } else if (med > 21 || p90 > 45) {
        root.classList.add("lite");
        FX.scale = Math.min(FX.scale, 0.34);
        FX.skip = 2;
        if (FX.resize) FX.resize();
        if (PT.thin) PT.thin();
      }
    };
    setTimeout(() => run(task), 1400);
  }

  /* ---------------------------------------------------------- BOOT */
  safe(initReveal);
  safe(initShader);
  safe(initParticles);
  safe(initGraph);
  safe(initTilt);
  safe(initMagnetic);
  safe(initCursor);
  safe(initNavPill);
  safe(initBands);
  safe(initSleep);
  safe(initParallax);
  safe(initProgress);
  safe(initCases);
  safe(initFilters);
  safe(initLightbox);
  safe(perfGuard);
})();
