(() => {
  "use strict";

  const isTouch =
    window.matchMedia &&
    (matchMedia("(pointer: coarse)").matches ||
      navigator.maxTouchPoints > 0 ||
      "ontouchstart" in window);

  const reducedMotion =
    window.matchMedia &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ================= INTRO ================= */

  const intro = document.getElementById("intro");
  const page = document.getElementById("page");
  let introDone = false;

  function finishIntro() {
    if (introDone) return;
    introDone = true;
    intro.style.opacity = "0";
    page.removeAttribute("hidden");
    if (!reducedMotion) {
      page.classList.add("rise");
    }
    setTimeout(() => {
      intro.style.display = "none";
    }, 950);
  }

  intro.addEventListener("click", finishIntro);
  intro.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") finishIntro();
  });

  setTimeout(finishIntro, 5200);

  /* ================= PÉTALOS (canvas) ================= */

  const canvas = document.getElementById("petals");
  const ctx = canvas.getContext("2d");
  let W = 0;
  let H = 0;
  let DPR = 1;
  let particles = [];
  let burst = [];

  const COLORS = ["#FFE082", "#FFD54F", "#FFC107", "#FFB300", "#FFA000", "#FFF176", "#FFB74D"];
  const FLOWERS = ["🌼", "🌻", "💛", "🌻", "🌼"];

  const baseCount = isTouch ? (reducedMotion ? 10 : 18) : reducedMotion ? 18 : 44;

  function makeParticle(spawnAbove) {
    const isFlower = Math.random() < 0.42;
    const size = isFlower
      ? (isTouch ? 20 + Math.random() * 14 : 28 + Math.random() * 20)
      : 10 + Math.random() * (isTouch ? 16 : 26);
    return {
      kind: isFlower ? "flower" : "petal",
      collectible: false,
      glyph: FLOWERS[Math.floor(Math.random() * FLOWERS.length)],
      x: -60 + Math.random() * (W + 120),
      y: spawnAbove
        ? -40 - Math.random() * 60
        : Math.random() * (H + 100) - 40,
      size,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      speed: (isFlower ? 0.85 : 1.15) * (isTouch ? 0.55 : 0.9) + Math.random() * (isTouch ? 1 : 1.7),
      sway: 20 + Math.random() * (isTouch ? 26 : 44),
      freq: 0.16 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * (isTouch ? 0.02 : 0.05),
      alpha: 0.7 + Math.random() * 0.3,
    };
  }

  function toFlower(p) {
    p.kind = "flower";
    p.collectible = true;
    p.glyph = FLOWERS[Math.floor(Math.random() * FLOWERS.length)];
    p.size = isTouch ? 20 + Math.random() * 14 : 28 + Math.random() * 20;
    p.speed = 0.85 * (isTouch ? 0.55 : 0.9) + Math.random() * (isTouch ? 1 : 1.7);
    p.alpha = 0.8 + Math.random() * 0.2;
    return p;
  }

  function spawnBurst(amount) {
    for (let i = 0; i < amount; i++) {
      burst.push({
        ...makeParticle(false),
        x: W * (0.2 + Math.random() * 0.6),
        y: -30,
        speed: (isTouch ? 1.6 : 2.4) + Math.random() * (isTouch ? 2.2 : 3.4),
      });
    }
  }

  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    const fade = Math.min(1, Math.max(0, (p.y + 28) / 28));
    ctx.globalAlpha = p.alpha * fade;
    ctx.fillStyle = p.color;
    const s = p.size;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(s * 0.42, -s * 0.38, s * 0.62, -s * 1.18);
    ctx.quadraticCurveTo(-s * 0.42, -s * 0.38, -s * 0.62, -s * 1.18);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = Math.max(0.8, s * 0.05);
    ctx.stroke();
    ctx.restore();
  }

  function drawFlower(p, t) {
    ctx.save();
    ctx.font = `${Math.round(p.size * 1.35)}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const fade = Math.min(1, Math.max(0, (p.y + 28) / 28));
    ctx.globalAlpha = p.alpha * fade;
    if (p.collectible) {
      const pulse = 0.55 + 0.45 * Math.sin(t * 3.2 + p.phase);
      const r = p.size * (1.15 + 0.22 * pulse);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 196, 40, ${(0.11 + 0.09 * pulse) * fade})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 190, 30, ${(0.4 + 0.35 * pulse) * fade})`;
      ctx.lineWidth = Math.max(1.5, p.size * 0.09);
      ctx.stroke();
    }
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot * 0.5);
    ctx.fillText(p.glyph, 0, 0);
    ctx.restore();
  }

  function step(p, t) {
    p.y += p.speed;
    p.rot += p.rotSpeed;
    p.x += Math.sin(t * p.freq + p.phase) * (p.sway * 0.04);
    if (p.y > H + 70) {
      p.y = -60;
      p.x = Math.random() * (W + 120) - 60;
    }
    if (p.x < -90) p.x = W + 80;
    if (p.x > W + 90) p.x = -80;
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  resize();

  function seedParticles() {
    particles = [];
    for (let i = 0; i < baseCount; i++) {
      const p = makeParticle(false);
      if (p.kind === "flower") p.collectible = true;
      particles.push(p);
    }
  }

  seedParticles();

  let minFlowers = isTouch ? 4 : 6;
  let lastTopup = 0;

  function topUpFlowers(t) {
    if (t - lastTopup < 1.4) return;
    lastTopup = t;
    let n = 0;
    for (const p of particles) {
      if (p.collectible) n++;
    }
    if (n >= minFlowers) return;
    const target = minFlowers - n;
    let done = 0;
    for (const p of particles) {
      if (done >= target) break;
      if (p.kind === "petal") {
        toFlower(p);
        done++;
      }
    }
  }

  let lastResize = 0;
  addEventListener("resize", () => {
    const now = Date.now();
    if (now - lastResize < 250) return;
    lastResize = now;
    const oldW = W;
    resize();
    if (Math.abs(oldW - W) > 40) {
      seedParticles();
      return;
    }
    for (const p of particles) {
      if (p.y > H + 70) {
        p.y = -40 - Math.random() * 30;
        p.x = Math.random() * (W + 120) - 60;
      }
      if (p.x > W + 90) p.x = W + 80;
      if (p.x < -90) p.x = -80;
    }
    for (const p of burst) {
      if (p.y > H + 70) p.y = -40;
    }
  });

  let paused = false;
  document.addEventListener("visibilitychange", () => {
    paused = document.visibilityState === "hidden";
  });

  requestAnimationFrame(drawLoop);

  function drawLoop(t) {
    if (!paused) {
      const time = t / 1000;
      ctx.clearRect(0, 0, W, H);
      topUpFlowers(time);
      for (const p of particles) {
        step(p, time);
        p.kind === "flower" ? drawFlower(p, time) : drawPetal(p);
      }
      for (const p of burst) {
        step(p, time);
        p.kind === "flower" ? drawFlower(p, time) : drawPetal(p);
      }
    }
    requestAnimationFrame(drawLoop);
  }

  /* ================= CORAZONES / FLORES en el rastro ================= */

  const trailLayer = document.getElementById("trail-layer");
  const TR = ["💛", "♥", "🌼", "🌻", "💖", "🌼"];

  function spawnTrail(x, y) {
    const el = document.createElement("span");
    el.className = "trail-heart";
    const s = 0.55 + Math.random() * (isTouch ? 1.1 : 1.6);
    el.style.fontSize = Math.round(s * 22) + "px";
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.setProperty("--s", Math.round(s * 22) + "px");
    el.style.setProperty("--o", 0.5 + Math.random() * 0.5);
    el.style.setProperty("--t", (0.7 + Math.random() * 0.6) + "s");
    el.style.setProperty("--dx", (Math.random() - 0.5) * 90 + "px");
    el.style.setProperty("--rot", (Math.random() - 0.5) * 120 + "deg");
    el.style.setProperty("--sc", 0.7 + Math.random() * 0.8);
    el.textContent = TR[Math.floor(Math.random() * TR.length)];
    trailLayer.append(el);
    el.addEventListener("animationend", () => el.remove());
    while (trailLayer.children.length > 60) {
      trailLayer.firstChild.remove();
    }
  }

  let trailTimer = null;

  function handlePointer(e) {
    const touches = e.touches;
    if (touches && touches.length > 0) {
      for (const t of touches) spawnTrail(t.clientX, t.clientY);
      return;
    }
    spawnTrail(e.clientX, e.clientY);
  }

  addEventListener("mousemove", (e) => {
    if (isTouch) return;
    if (trailTimer) return;
    trailTimer = setTimeout(() => {
      handlePointer(e);
      trailTimer = null;
    }, 24);
  });

  addEventListener("touchmove", handlePointer, { passive: true });

  /* ================= SONIDOS (Web Audio) ================= */

  let audioCtx = null;
  let audioGain = null;

  function ensureAudio() {
    if (!audioCtx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        audioCtx = new AC();
        audioGain = audioCtx.createGain();
        audioGain.connect(audioCtx.destination);
        audioGain.gain.value = 0.2;
      } catch (_) {
        return;
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      try { audioCtx.resume(); } catch (_) {}
    }
  }

  function tone(freq, dur, vol, delay) {
    if (!audioCtx || !audioGain) return;
    const t0 = audioCtx.currentTime + (delay || 0);
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.015);
    g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(audioGain);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  const PENTA = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77];

  function playCollect(i) {
    ensureAudio();
    const f = PENTA[(i - 1) % PENTA.length];
    tone(f, 0.18, 0.55, 0);
    tone(f * 2, 0.14, 0.18, 0.06);
  }

  function playFanfare() {
    ensureAudio();
    const seq = [
      [523.25, 0],
      [659.25, 0.12],
      [783.99, 0.24],
      [1046.5, 0.36],
      [1318.5, 0.48],
    ];
    for (const [f, d] of seq) {
      tone(f, 0.34, 0.6, d);
      tone(f / 2, 0.34, 0.3, d);
    }
  }

  /* ================= JUEGO: ATRA PAR FLORES ================= */

  const TARGET = 7;
  let collected = 0;
  let lastCatchAt = 0;
  const countEl = document.getElementById("count");
  const hudDots = document.getElementById("hud-dots");
  const collectLayer = document.getElementById("confetti-layer");
  const SPARK_COLORS = ["#FFD54F", "#FFB300", "#FFF176", "#FFC107", "#FFE082", "#FFFFFF"];

  function sparkBurst(x, y, n) {
    for (let i = 0; i < n; i++) {
      const el = document.createElement("span");
      el.className = "spark-pop";
      const a = Math.random() * Math.PI * 2;
      const r = 22 + Math.random() * 34;
      el.style.left = x + "px";
      el.style.top = y + "px";
      el.style.setProperty("--c", SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)]);
      el.style.setProperty("--dx", Math.round(Math.cos(a) * r) + "px");
      el.style.setProperty("--dy", Math.round(Math.sin(a) * r - 18) + "px");
      el.style.setProperty("--rot", (Math.random() - 0.5) * 540 + "deg");
      collectLayer.append(el);
      el.addEventListener("animationend", () => el.remove());
    }
  }

  function setHud(popLast) {
    countEl.textContent = collected;
    if (popLast) {
      countEl.classList.remove("pop");
      void countEl.offsetWidth;
      countEl.classList.add("pop");
    }
    const dots = hudDots.children;
    for (let i = 0; i < dots.length; i++) {
      if (i < collected) {
        dots[i].classList.add("on");
      } else {
        dots[i].classList.remove("on");
      }
    }
  }

  function catchFlower(x, y) {
    const R = (isTouch ? 56 : 46) + 8;
    let best = null;
    let bestD = R;
    for (const p of particles) {
      if (!p.collectible) continue;
      if (p.y > H + 20 || p.y < -20 || p.x < -20 || p.x > W + 20) continue;
      const dx = p.x - x;
      const dy = p.y - y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    if (!best) return false;

    const idx = particles.indexOf(best);
    if (idx !== -1) particles.splice(idx, 1);

    collected += 1;
    sparkBurst(x, y, isTouch ? 9 : 12);
    setHud(true);
    playCollect(collected);

    if (collected >= TARGET) {
      collected = 0;
      setTimeout(() => {
        spawnBurst(isTouch ? 8 : 18);
        launchConfetti(isTouch ? 42 : 90);
        playFanfare();
        if (navigator.vibrate && isTouch) {
          try { navigator.vibrate([40, 30, 40]); } catch (_) {}
        }
        openBouquet();
      }, 260);
    }
    return true;
  }

  addEventListener("pointerdown", (e) => {
    onFirstInteraction();
    const now = Date.now();
    if (now - lastCatchAt < 120) return;
    if (menuOpen()) return;
    if (catchFlower(e.clientX, e.clientY)) {
      lastCatchAt = now;
    }
  }, { passive: true });

  addEventListener("touchstart", (e) => {
    onFirstInteraction();
    if (e.touches.length === 0) return;
    const t = e.touches[0];
    const now = Date.now();
    if (now - lastCatchAt < 120) return;
    if (menuOpen()) return;
    if (catchFlower(t.clientX, t.clientY)) {
      lastCatchAt = now;
    }
  }, { passive: true });

  function menuOpen() {
    return (
      document.querySelector(".letter-backdrop.open") ||
      document.querySelector(".bouquet-backdrop.open")
    );
  }

  setHud(false);

  /* ================= CONTADOR ================= */

  const ANNIVERSARY = new Date(2017, 5, 28, 0, 0, 0);

  function diffParts(from, to) {
    let years = to.getFullYear() - from.getFullYear();
    let months = to.getMonth() - from.getMonth();
    let days = to.getDate() - from.getDate();
    if (days < 0) {
      months -= 1;
      const prev = new Date(to.getFullYear(), to.getMonth(), 0);
      days += prev.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    return { years, months, days };
  }

  function updateCounter() {
    const now = new Date();
    const diff = diffParts(ANNIVERSARY, now);
    const total = Math.floor((now - ANNIVERSARY) / 86400000);
    document.getElementById("c-years").textContent = diff.years;
    document.getElementById("c-months").textContent = diff.months;
    document.getElementById("c-days").textContent = diff.days;
    document.getElementById("c-total").textContent = total.toLocaleString("es-AR");
  }

  updateCounter();
  setInterval(updateCounter, 60000);

  /* ================= CONFETI ================= */

  const confettiLayer = document.getElementById("confetti-layer");
  const CONF = ["#FFD54F", "#FFB300", "#FFF176", "#FFC107", "#FFE082", "#FFFBF0", "#FFB74D"];

  function launchConfetti(n) {
    for (let i = 0; i < n; i++) {
      const el = document.createElement("span");
      el.className = "confetti-piece";
      const w = 5 + Math.random() * 8;
      const h = 7 + Math.random() * 11;
      el.style.width = w + "px";
      el.style.height = h + "px";
      el.style.left = Math.random() * 100 + "%";
      el.style.top = "-1.5rem";
      el.style.setProperty("--c", CONF[Math.floor(Math.random() * CONF.length)]);
      el.style.setProperty("--w", w + "px");
      el.style.setProperty("--h", h + "px");
      el.style.setProperty("--dx", (Math.random() - 0.5) * 240 + "px");
      el.style.setProperty("--dy", (220 + Math.random() * 420) + "px");
      el.style.setProperty("--rot", (Math.random() - 0.5) * 900 + "deg");
      el.style.setProperty("--t", (1.4 + Math.random() * 1.2) + "s");
      confettiLayer.append(el);
      el.addEventListener("animationend", () => el.remove());
    }
  }

  /* ================= CARTA ================= */

  const letter = document.getElementById("letter");
  const openBtn = document.getElementById("open-letter");
  const closeBtn = document.getElementById("close-letter");

  function openLetter() {
    letter.classList.add("open");
    spawnBurst(isTouch ? 10 : 22);
    launchConfetti(isTouch ? 60 : 130);
    if (navigator.vibrate && isTouch) {
      try { navigator.vibrate([40]); } catch (_) {}
    }
  }

  function closeLetter() {
    letter.classList.remove("open");
  }

  openBtn.addEventListener("click", openLetter);
  closeBtn.addEventListener("click", closeLetter);
  letter.addEventListener("click", (e) => {
    if (e.target === letter) closeLetter();
  });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLetter();
  });

  /* ================= RAMO DE FLORES ================= */

  const bouquet = document.getElementById("bouquet");
  const bouquetStage = document.querySelector(".bouquet-stage");
  const gardenRoot = document.querySelector(".garden-root");
  const SPARKS = ["✨", "✧", "✦", "💛", "✦"];
  const DRIFTS = ["🌼", "✿", "💛", "✧", "🌻"];
  const BLOOMS = ["🌼", "🌻", "🌻", "🌼"];

  function buildGarden() {
    gardenRoot.innerHTML = "";
    bouquetStage.querySelectorAll(".sparkle").forEach((el) => el.remove());
    bouquetStage.querySelectorAll(".garden-drift").forEach((el) => el.remove());

    const sky = document.createElement("div");
    sky.className = "garden-sky";
    gardenRoot.append(sky);

    const glow = document.createElement("div");
    glow.className = "garden-glow";
    gardenRoot.append(glow);

    const sun = document.createElement("div");
    sun.className = "garden-sun";
    for (let k = 0; k < 12; k++) {
      const ray = document.createElement("div");
      ray.className = "garden-ray";
      ray.style.setProperty("--r", k * 30 + "deg");
      sun.append(ray);
    }
    const suncore = document.createElement("div");
    suncore.className = "garden-suncore";
    sun.append(suncore);
    gardenRoot.append(sun);

    for (const [cLeft, cTop, cS] of [[8, 14, 1], [76, 26, 0.72], [46, 40, 0.5]]) {
      const cloud = document.createElement("div");
      cloud.className = "garden-cloud";
      cloud.style.left = cLeft + "%";
      cloud.style.top = cTop + "%";
      const cw = Math.round(36 + 64 * cS) + "px";
      cloud.style.width = cw;
      cloud.style.height = Math.round(36 + 30 * cS) + "px";
      gardenRoot.append(cloud);
    }

    const mtnBack = document.createElement("div");
    mtnBack.className = "garden-mtn";
    gardenRoot.append(mtnBack);

    const mtnNear = document.createElement("div");
    mtnNear.className = "garden-mtn near";
    gardenRoot.append(mtnNear);

    const hill = document.createElement("div");
    hill.className = "garden-hill";
    gardenRoot.append(hill);

    const meadow = document.createElement("div");
    meadow.className = "garden-meadow";
    gardenRoot.append(meadow);

    const rows = [
      { count: isTouch ? 14 : 19, bottom: 20.5, fz: isTouch ? 12 : 16, z: 7 },
      { count: isTouch ? 14 : 18, bottom: 16.5, fz: isTouch ? 16 : 21, z: 7 },
      { count: isTouch ? 13 : 17, bottom: 13, fz: isTouch ? 21 : 27, z: 8 },
      { count: isTouch ? 11 : 14, bottom: 9.5, fz: isTouch ? 27 : 34, z: 8 },
      { count: isTouch ? 9 : 11, bottom: 6, fz: isTouch ? 34 : 42, z: 8 },
      { count: isTouch ? 7 : 8, bottom: 3, fz: isTouch ? 44 : 54, z: 9 },
    ];

    let fi = 0;
    for (const row of rows) {
      for (let i = 0; i < row.count; i++) {
        const jitter = (Math.random() - 0.5) * 5;
        const left = (i / (row.count - 1)) * 92 + 4 + jitter;
        const flower = document.createElement("span");
        flower.className = "garden-flower";
        flower.style.setProperty("--left", left + "%");
        flower.style.setProperty("--bot", (row.bottom + Math.random() * 1.8) + "%");
        flower.style.setProperty("--fz", Math.round(row.fz * (0.9 + Math.random() * 0.2)) + "px");
        flower.style.setProperty("--sd", Math.round(fi * 140) + "ms");
        flower.style.zIndex = String(row.z);
        flower.textContent = BLOOMS[Math.floor(Math.random() * BLOOMS.length)];
        gardenRoot.append(flower);
        fi++;
      }
    }

    const one = isTouch ? 8 : 12;
    for (let i = 0; i < one; i++) {
      const d = document.createElement("span");
      d.className = "garden-drift";
      d.textContent = DRIFTS[Math.floor(Math.random() * DRIFTS.length)];
      d.style.left = (2 + Math.random() * 92) + "%";
      d.style.top = (Math.random() * 62) + "%";
      d.style.setProperty("--dx", Math.round((Math.random() - 0.5) * 160) + "px");
      d.style.setProperty("--dy", Math.round(12 + Math.random() * 50) + "%");
      d.style.setProperty("--d", Math.round(Math.random() * 6000) + "ms");
      bouquetStage.append(d);
    }

    const sparkleCount = isTouch ? 9 : 16;
    for (let i = 0; i < sparkleCount; i++) {
      const sp = document.createElement("span");
      sp.className = "sparkle";
      sp.textContent = SPARKS[Math.floor(Math.random() * SPARKS.length)];
      sp.style.left = (5 + Math.random() * 90) + "%";
      sp.style.top = (5 + Math.random() * 70) + "%";
      sp.style.setProperty("--d", Math.round(Math.random() * 2200) + "ms");
      bouquetStage.append(sp);
    }
  }

  function openBouquet() {
    buildGarden();
    bouquet.classList.add("open");
    spawnBurst(isTouch ? 10 : 20);
    launchConfetti(isTouch ? 50 : 100);
    if (navigator.vibrate && isTouch) {
      try { navigator.vibrate([35, 45]); } catch (_) {}
    }
  }

  function closeBouquet() {
    bouquet.classList.remove("open");
    collected = 0;
    setHud(true);
  }

  document.getElementById("close-bouquet").addEventListener("click", closeBouquet);
  document.getElementById("close-bouquet-x").addEventListener("click", closeBouquet);
  bouquet.addEventListener("click", (e) => {
    if (e.target === bouquet) closeBouquet();
  });

  /* ================= MÚSICA ================= */

  const music = document.getElementById("music");
  const musicBtn = document.getElementById("music-btn");
  const toast = document.getElementById("toast");
  let musicOn = false;
  let musicBroken = false;
  let toastTimer = null;
  let firstInteraction = true;

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 4200);
  }

  function startMusic() {
    if (musicOn) return;
    if (musicBroken) {
      showToast("🎵 Agregá music.mp3 junto a index.html para la música de fondo");
      return;
    }
    try {
      const prom = music.play();
      if (prom && prom.then) {
        prom.then(() => {
          musicOn = true;
          musicBtn.classList.add("playing");
        }).catch(() => {
          musicBroken = true;
          showToast("🎵 No pude reproducir el audio. Verificá que music.mp3 sea un archivo de audio válido.");
        });
      } else {
        musicOn = true;
        musicBtn.classList.add("playing");
      }
      setTimeout(() => {
        if (musicOn || musicBroken) return;
        if (music.readyState >= 3) {
          musicOn = true;
          musicBtn.classList.add("playing");
          return;
        }
        musicBroken = true;
        showToast("🎵 Agregá music.mp3 junto a index.html para la música de fondo");
      }, 1200);
    } catch (_) {
      musicBroken = true;
      showToast("🎵 Aún no hay canción. Agregá music.mp3 junto a index.html");
    }
  }

  function onFirstInteraction() {
    if (!firstInteraction) return;
    firstInteraction = false;
    musicBtn.querySelector(".music-hint").classList.remove("hidden");
    startMusic();
  }

  addEventListener("pointerdown", onFirstInteraction);
  addEventListener("keydown", onFirstInteraction);
  addEventListener("touchend", onFirstInteraction);

  music.addEventListener("error", () => {
    musicBroken = true;
  });

  musicBtn.addEventListener("click", () => {
    if (musicOn) {
      music.pause();
      musicOn = false;
      musicBtn.classList.remove("playing");
      return;
    }
    onFirstInteraction();
    if (!musicOn && !musicBroken) startMusic();
  });

  setTimeout(() => {
    musicBtn.querySelector(".music-hint").classList.remove("hidden");
  }, 4600);
})();