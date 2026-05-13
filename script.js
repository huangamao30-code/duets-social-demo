/* ╔══════════════════════════════════════════════════════════════
   Duets · Social Demo – interactions
   - Initial screen ⇄ Screens 1/2/3 transitions
   - Horizontal swipe / drag between screens 1↔2↔3
   - Tab switching (click)
   - Card flip / open-collection / back-to-initial
   - Popups (1/2/3/4) with backdrop + ESC dismiss
   - Particle confetti on key button presses
   - Per-screen Get Points list staggered reveal
   ════════════════════════════════════════════════════════════════ */

(() => {
  "use strict";

  /* ─── Cached references ─── */
  const app           = document.getElementById("app");
  const initialScreen = document.getElementById("screen-initial");
  const swipeStage    = document.getElementById("swipeStage");
  const swipeTrack    = document.getElementById("swipeTrack");
  const tabBar        = document.getElementById("tabBar");
  const tabs          = Array.from(tabBar.querySelectorAll(".tab"));
  const themeLayers   = Array.from(document.querySelectorAll(".theme-bg__layer"));
  const screensThemed = Array.from(document.querySelectorAll(".screen--themed"));
  const pageDots      = Array.from(document.querySelectorAll(".page-dot"));
  const popupBackdrop = document.getElementById("popupBackdrop");
  const popups        = Array.from(document.querySelectorAll(".popup"));
  const cardModal     = document.getElementById("cardModal");
  const fxCanvas      = document.getElementById("fxCanvas");
  const fxCtx         = fxCanvas.getContext("2d");

  /* ─── State ─── */
  let currentIdx     = 0;          /* 0 / 1 / 2 (screens 1/2/3) */
  let inSwipeMode    = false;      /* user has entered the swipe stage */
  let isDragging     = false;
  let pointerStartX  = 0;
  let pointerStartY  = 0;
  let pointerLastX   = 0;
  let pointerLastT   = 0;
  let pointerVel     = 0;
  let trackOffsetPx  = 0;
  let phoneWidth     = 420;
  let lockedAxis     = null;       /* "x" | "y" | null */
  let activePopup    = null;

  /* ════════════ Phone width / unit helpers ════════════ */

  function measurePhone() {
    const rect = document.querySelector(".phone-frame").getBoundingClientRect();
    phoneWidth = rect.width;
    /* Re-snap to current screen after resize */
    if (inSwipeMode) {
      trackOffsetPx = -currentIdx * phoneWidth;
      swipeTrack.style.transform = `translate3d(${trackOffsetPx}px, 0, 0)`;
    }
    sizeCanvas();
  }
  function sizeCanvas() {
    const rect = app.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    fxCanvas.width  = rect.width  * dpr;
    fxCanvas.height = rect.height * dpr;
    fxCanvas.style.width  = rect.width  + "px";
    fxCanvas.style.height = rect.height + "px";
    fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", measurePhone, { passive: true });

  /* ════════════ Initial → swipe stage transition ════════════ */

  function enterSwipeStage(startIdx = 0) {
    if (inSwipeMode) return;
    inSwipeMode = true;
    initialScreen.classList.add("is-leaving");
    initialScreen.setAttribute("aria-hidden", "true");
    setTimeout(() => initialScreen.classList.remove("is-active"), 720);
    swipeStage.classList.add("is-active");
    swipeStage.setAttribute("aria-hidden", "false");
    screensThemed.forEach(s => s.setAttribute("aria-hidden", "true"));
    screensThemed[startIdx]?.setAttribute("aria-hidden", "false");
    measurePhone();
    currentIdx = startIdx;
    swipeTrack.classList.add("is-snapping");
    requestAnimationFrame(() => {
      trackOffsetPx = -currentIdx * phoneWidth;
      swipeTrack.style.transform = `translate3d(${trackOffsetPx}px, 0, 0)`;
      updateThemeAndTabs();
      revealGetPoints();
    });
  }

  function exitToInitial() {
    if (!inSwipeMode) return;
    inSwipeMode = false;
    initialScreen.classList.add("is-active");
    initialScreen.classList.remove("is-leaving");
    initialScreen.setAttribute("aria-hidden", "false");
    swipeStage.classList.remove("is-active");
    swipeStage.setAttribute("aria-hidden", "true");
    /* Reset reveal so it replays next entry */
    document.querySelectorAll(".get-points__list.is-revealed")
      .forEach(el => el.classList.remove("is-revealed"));
  }

  /* ════════════ Switch screen index ════════════ */

  function setScreen(idx, animate = true) {
    idx = Math.max(0, Math.min(2, idx));
    currentIdx = idx;
    trackOffsetPx = -currentIdx * phoneWidth;
    if (animate) {
      swipeTrack.classList.add("is-snapping");
      swipeTrack.classList.remove("is-dragging");
    } else {
      swipeTrack.classList.remove("is-snapping");
    }
    swipeTrack.style.transform = `translate3d(${trackOffsetPx}px, 0, 0)`;
    updateThemeAndTabs();
    /* Defer reveal so each entry replays the stagger */
    document.querySelectorAll(".get-points__list").forEach(el => {
      el.classList.remove("is-revealed");
    });
    setTimeout(revealGetPoints, animate ? 220 : 0);
  }

  function updateThemeAndTabs() {
    themeLayers.forEach((l, i) => l.classList.toggle("is-active", i === currentIdx));
    tabs.forEach((t, i) => t.classList.toggle("is-active", i === currentIdx));
    pageDots.forEach((d, i) => d.classList.toggle("is-active", i === currentIdx));
    screensThemed.forEach((s, i) =>
      s.setAttribute("aria-hidden", i === currentIdx ? "false" : "true"));
  }

  function revealGetPoints() {
    const list = screensThemed[currentIdx]?.querySelector(".get-points__list");
    if (list) {
      list.classList.remove("is-revealed");
      requestAnimationFrame(() =>
        requestAnimationFrame(() => list.classList.add("is-revealed")));
    }
  }

  /* ════════════ Pointer / swipe handling ════════════ */

  function isInteractive(target) {
    return !!target.closest(`
      .start-btn, .tab, .open-btn, .cta-go-add, .header-back,
      .header-relationship__edit, .cta-add-duet,
      .popup, .popup__dismiss, .progress-reward
    `);
  }

  function getXY(e) {
    if (e.touches && e.touches[0]) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if (e.changedTouches && e.changedTouches[0]) {
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  function onPointerDown(e) {
    if (!inSwipeMode) return;
    if (activePopup) return;
    if (isInteractive(e.target)) return;
    const { x, y } = getXY(e);
    isDragging   = true;
    pointerStartX = x;
    pointerStartY = y;
    pointerLastX  = x;
    pointerLastT  = performance.now();
    pointerVel    = 0;
    lockedAxis    = null;
    swipeTrack.classList.add("is-dragging");
    swipeTrack.classList.remove("is-snapping");
    measurePhone();
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    const { x, y } = getXY(e);
    const dx = x - pointerStartX;
    const dy = y - pointerStartY;

    /* Determine intent on first significant move */
    if (lockedAxis === null) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        lockedAxis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      } else return;
    }
    if (lockedAxis === "y") return; /* let vertical scroll happen */

    if (e.cancelable && e.type === "touchmove") e.preventDefault();

    /* Velocity sample */
    const now = performance.now();
    const dt = Math.max(now - pointerLastT, 1);
    pointerVel = (x - pointerLastX) / dt;
    pointerLastX = x;
    pointerLastT = now;

    let translate = trackOffsetPx + dx;
    /* Rubber-band at edges */
    if (currentIdx === 0 && dx > 0)         translate = trackOffsetPx + dx * 0.3;
    if (currentIdx === 2 && dx < 0)         translate = trackOffsetPx + dx * 0.3;
    swipeTrack.style.transform = `translate3d(${translate}px, 0, 0)`;
  }

  function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;
    if (lockedAxis !== "x") {
      swipeTrack.classList.remove("is-dragging");
      swipeTrack.classList.add("is-snapping");
      swipeTrack.style.transform = `translate3d(${trackOffsetPx}px, 0, 0)`;
      return;
    }
    const { x } = getXY(e);
    const dx = x - pointerStartX;
    const threshold = phoneWidth * 0.18;
    const velThreshold = 0.4; /* px/ms */
    let newIdx = currentIdx;
    if ((dx < -threshold || pointerVel < -velThreshold) && currentIdx < 2) newIdx++;
    else if ((dx > threshold || pointerVel > velThreshold) && currentIdx > 0) newIdx--;
    setScreen(newIdx);
  }

  /* Attach pointer handlers */
  swipeStage.addEventListener("touchstart", onPointerDown, { passive: true });
  swipeStage.addEventListener("touchmove",  onPointerMove,  { passive: false });
  swipeStage.addEventListener("touchend",   onPointerUp,    { passive: true });
  swipeStage.addEventListener("touchcancel", onPointerUp,   { passive: true });

  swipeStage.addEventListener("mousedown", e => {
    onPointerDown(e);
    window.addEventListener("mousemove", onPointerMoveBound);
    window.addEventListener("mouseup",   onPointerUpBound, { once: true });
  });
  function onPointerMoveBound(e) { onPointerMove(e); }
  function onPointerUpBound(e) {
    onPointerUp(e);
    window.removeEventListener("mousemove", onPointerMoveBound);
  }


  /* ════════════ Popups ════════════ */

  function openPopup(id) {
    const popup = document.getElementById(`popup-${id}`);
    if (!popup) return;
    closePopup(); /* close any existing */
    popup.hidden = false;
    popupBackdrop.hidden = false;
    requestAnimationFrame(() => {
      popup.classList.add("is-visible");
      popupBackdrop.classList.add("is-visible");
    });
    activePopup = popup;
  }
  function closePopup() {
    if (!activePopup) return;
    const p = activePopup;
    p.classList.remove("is-visible");
    popupBackdrop.classList.remove("is-visible");
    activePopup = null;
    setTimeout(() => {
      p.hidden = true;
      if (!document.querySelector(".popup.is-visible")) popupBackdrop.hidden = true;
    }, 280);
  }
  function popupAccent(id) {
    return ({
      1: ["#43defb", "#0aa4f7", "#ffffff"],
      2: ["#ff86a7", "#ff356c", "#ffffff"],
      3: ["#ffcf02", "#ff9500", "#ffffff"],
      4: ["#abf1fe", "#7b8fae", "#ffffff"],
    })[id] || ["#ffffff"];
  }

  popupBackdrop.addEventListener("click", closePopup);
  popups.forEach(p => p.addEventListener("click", closePopup));
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      if (activePopup) closePopup();
      else if (cardModal.classList.contains("is-visible")) closeCardModal();
    }
  });

  /* ════════════ Card-collection modal (1:622) ════════════ */

  let modalOpen = false;

  function openCardModal() {
    if (modalOpen) return;
    modalOpen = true;
    cardModal.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => cardModal.classList.add("is-visible"));
  }
  function closeCardModal() {
    if (!modalOpen) return;
    modalOpen = false;
    cardModal.classList.remove("is-visible");
    setTimeout(() => cardModal.setAttribute("aria-hidden", "true"), 360);
  }


  /* ════════════ Click delegation ════════════ */

  document.addEventListener("click", e => {
    const t = e.target.closest("[data-action], [data-popup], [data-target], [data-card]");
    if (!t) return;

    /* Tab click → switch screen */
    if (t.matches(".tab")) {
      const target = parseInt(t.dataset.target, 10) - 1;
      if (!Number.isNaN(target)) setScreen(target);
      ripple(t, e);
      return;
    }

    /* Action buttons */
    if (t.dataset.action === "enter-screens") {
      enterSwipeStage(0);
      confettiBurst({ count: 60, color: ["#43defb", "#ffcf02", "#ff86a7", "#ffffff"] });
      return;
    }
    if (t.dataset.action === "back-to-initial") {
      exitToInitial();
      return;
    }
    if (t.dataset.action === "open-modal") {
      openCardModal();
      ripple(t, e);
      return;
    }
    if (t.dataset.action === "close-modal") {
      closeCardModal();
      return;
    }
    if (t.dataset.action === "close-popup") {
      closePopup();
      return;
    }

    /* data-popup attribute → open numbered popup */
    if (t.dataset.popup) {
      openPopup(t.dataset.popup);
      ripple(t, e);
      return;
    }

    /* Card flip */
    if (t.matches(".deck-card") && !t.classList.contains("deck-card--empty")) {
      t.classList.remove("is-flipped");
      void t.offsetWidth;     /* force reflow to replay anim */
      t.classList.add("is-flipped");
      setTimeout(() => t.classList.remove("is-flipped"), 800);
      ripple(t, e);
    }
  });

  /* Initial-screen cards: subtle press feedback */
  document.querySelectorAll(".back-card").forEach(card => {
    if (card.classList.contains("back-card--empty")) return;
    card.addEventListener("click", (e) => {
      e.stopPropagation();
      card.animate(
        [
          { transform: `rotate(${getComputedStyle(card).getPropertyValue("--tilt")}) scale(1)` },
          { transform: `rotate(${getComputedStyle(card).getPropertyValue("--tilt")}) scale(1.06)` },
          { transform: `rotate(${getComputedStyle(card).getPropertyValue("--tilt")}) scale(1)` },
        ],
        { duration: 360, easing: "cubic-bezier(.34, 1.56, .64, 1)" }
      );
    });
  });


  /* ════════════ Lightweight ripple on buttons ════════════ */

  function ripple(el, evt) {
    const rect = el.getBoundingClientRect();
    const x = (evt.clientX ?? rect.left + rect.width / 2) - rect.left;
    const y = (evt.clientY ?? rect.top + rect.height / 2) - rect.top;
    const span = document.createElement("span");
    span.style.cssText = `
      position:absolute;left:${x}px;top:${y}px;
      width:0;height:0;
      border-radius:50%;
      background:radial-gradient(circle, rgba(255,255,255,0.55), transparent 70%);
      transform:translate(-50%,-50%);
      pointer-events:none;
      animation: ripple-spread 0.7s ease-out forwards;
    `;
    const prev = getComputedStyle(el).position;
    if (prev === "static") el.style.position = "relative";
    el.appendChild(span);
    setTimeout(() => span.remove(), 720);
  }
  /* Inject keyframes once */
  const rippleStyle = document.createElement("style");
  rippleStyle.textContent = `
    @keyframes ripple-spread {
      0%   { width:0; height:0; opacity:0.9; }
      100% { width:240px; height:240px; opacity:0; }
    }
  `;
  document.head.appendChild(rippleStyle);


  /* ════════════ Particle confetti ════════════ */

  const particles = [];
  let rafActive = false;

  function confettiBurst({ count = 30, color = ["#fff"], originX, originY } = {}) {
    const rect = app.getBoundingClientRect();
    const cx = originX ?? rect.width / 2;
    const cy = originY ?? rect.height / 2;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        g: 0.12,
        size: 4 + Math.random() * 5,
        color: color[Math.floor(Math.random() * color.length)],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.2,
        life: 1,
        decay: 0.012 + Math.random() * 0.01,
      });
    }
    if (!rafActive) {
      rafActive = true;
      requestAnimationFrame(tick);
    }
  }
  function tick() {
    const rect = app.getBoundingClientRect();
    fxCtx.clearRect(0, 0, rect.width, rect.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += p.g;
      p.rot += p.vr;
      p.life -= p.decay;
      if (p.life <= 0 || p.y > rect.height + 30) {
        particles.splice(i, 1);
        continue;
      }
      fxCtx.save();
      fxCtx.globalAlpha = Math.max(0, p.life);
      fxCtx.translate(p.x, p.y);
      fxCtx.rotate(p.rot);
      fxCtx.fillStyle = p.color;
      fxCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
      fxCtx.restore();
    }
    if (particles.length > 0) {
      requestAnimationFrame(tick);
    } else {
      rafActive = false;
      fxCtx.clearRect(0, 0, rect.width, rect.height);
    }
  }


  /* ════════════ Idle floating animation on swipe-stage hero ════════════ */

  let floatPhase = 0;
  function idleFloat() {
    floatPhase += 0.012;
    document.querySelectorAll(".deck-card:not(.deck-card--empty)").forEach((c, i) => {
      const baseY = parseFloat(c.style.getPropertyValue("--y")) || 0;
      const ofs = Math.sin(floatPhase + i * 0.8) * 1.2;
      c.style.setProperty("--y", (baseY + ofs - ofs) + "px");
      /* Note: pure transform-based floating handled via CSS; we leave this
         as a placeholder so cards never feel static even without hover. */
    });
    requestAnimationFrame(idleFloat);
  }
  /* Disable JS-driven float (handled via CSS keyframes on .back-card).
     Keeping function in case we want JS-driven motion later. */


  /* ════════════ Init ════════════ */

  measurePhone();
  /* Pre-position track so first screen is shown without animation */
  swipeTrack.style.transform = `translate3d(0px, 0, 0)`;

  /* Optional ?screen=N / ?popup=N URL params for previewing & screenshot tests */
  const params = new URLSearchParams(location.search);
  const urlScreen = parseInt(params.get("screen"), 10);
  if (urlScreen >= 1 && urlScreen <= 3) {
    enterSwipeStage(urlScreen - 1);
  }
  const urlPopup = parseInt(params.get("popup"), 10);
  if (urlPopup >= 1 && urlPopup <= 4) {
    if (!inSwipeMode) enterSwipeStage(0);
    setTimeout(() => openPopup(urlPopup), 600);
  }
  if (params.get("modal") === "1") {
    if (!inSwipeMode) enterSwipeStage(0);
    setTimeout(openCardModal, 600);
  }

  /* Optional keyboard nav for dev/accessibility */
  document.addEventListener("keydown", e => {
    if (!inSwipeMode || activePopup) return;
    if (e.key === "ArrowLeft"  && currentIdx > 0) setScreen(currentIdx - 1);
    if (e.key === "ArrowRight" && currentIdx < 2) setScreen(currentIdx + 1);
    if (e.key === "Backspace" || e.key === "Escape") exitToInitial();
  });

})();
