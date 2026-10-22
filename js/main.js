
(() => {
  "use strict";

  // Evita inicializar o efeito duas vezes.
  if (window.__atlasTouchExperience) return;
  window.__atlasTouchExperience = true;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  const layer = document.createElement("div");
  layer.id = "atlas-touch-layer";
  layer.setAttribute("aria-hidden", "true");

  Object.assign(layer.style, {
    position: "fixed",
    inset: "0",
    overflow: "hidden",
    pointerEvents: "none",
    zIndex: "99999",
    contain: "strict"
  });

  function mountLayer() {
    if (!layer.isConnected && !reduceMotion.matches) {
      document.body.appendChild(layer);
    }
  }

  function removeLayer() {
    layer.replaceChildren();
    layer.remove();
  }

  if (document.body) {
    mountLayer();
  } else {
    document.addEventListener("DOMContentLoaded", mountLayer, {
      once: true
    });
  }

  const MAX_RIPPLES = 4;
  const activeRipples = new Set();
  let lastTouchTime = 0;

  function createRipple(x, y, pointerType) {
    if (reduceMotion.matches || !layer.isConnected) return;

    // Mantém o efeito leve, mesmo com cliques repetidos.
    if (activeRipples.size >= MAX_RIPPLES) {
      const oldest = activeRipples.values().next().value;
      oldest?.remove();
      activeRipples.delete(oldest);
    }

    const ripple = document.createElement("span");
    ripple.className = "atlas-touch-ripple";

    const size = pointerType === "touch" ? 34 : 26;

    Object.assign(ripple.style, {
      position: "absolute",
      left: `${x}px`,
      top: `${y}px`,
      width: `${size}px`,
      height: `${size}px`,
      border: "1px solid rgba(164, 135, 80, 0.62)",
      borderRadius: "50%",
      boxSizing: "border-box",
      transform: "translate(-50%, -50%) scale(0.15)",
      opacity: "0",
      animation: "atlas-touch-wave 720ms cubic-bezier(0.16, 0.72, 0.28, 1) forwards",
      willChange: "transform, opacity"
    });

    layer.appendChild(ripple);
    activeRipples.add(ripple);

    function cleanup() {
      ripple.remove();
      activeRipples.delete(ripple);
    }

    ripple.addEventListener("animationend", cleanup, { once: true });

    // Limpeza de segurança para situações em que a animação não termina.
    window.setTimeout(cleanup, 1000);
  }

  document.addEventListener("pointerdown", (event) => {
    if (reduceMotion.matches || document.hidden) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const now = performance.now();

    // Pequena proteção contra eventos duplicados.
    if (now - lastTouchTime < 45) return;
    lastTouchTime = now;

    createRipple(
      event.clientX,
      event.clientY,
      event.pointerType
    );
  }, { passive: true });

  // Se o usuário preferir menos movimento, desativa a animação.
  reduceMotion.addEventListener?.("change", (event) => {
    if (event.matches) {
      removeLayer();
    } else {
      mountLayer();
    }
  });

  // Não deixa o efeito interferir na navegação por teclado.
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      layer.replaceChildren();
      activeRipples.clear();
    }
  });
})();

/**
 * ATLAS ÓSSEO — EXPERIENCE ENGINE
 * Interação visual, navegação, acessibilidade e microanimações.
 * Vanilla JavaScript | Sem bibliotecas externas.
 */

(() => {
  "use strict";

  // =========================================================
  // 01. INICIALIZAÇÃO E CONFIGURAÇÕES
  // =========================================================

  if (window.__ATLAS_EXPERIENCE_ENGINE__) return;
  window.__ATLAS_EXPERIENCE_ENGINE__ = true;

  const CONFIG = {
    accent: "#A48750",
    revealDuration: 750,
    rippleDuration: 760,
    maxRipples: 5,
    scrollThreshold: 500,
    tiltStrength: 4,
    debug: false
  };

  const doc = document;
  const root = doc.documentElement;
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );
  const finePointer = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  );

  const state = {
    initialized: false,
    scrollScheduled: false,
    pointerScheduled: false,
    lastPointerTime: 0,
    ripples: new Set(),
    tiltCards: new Set(),
    visibleSections: new Set(),
    observers: [],
    scrollProgress: 0
  };

  const log = (...args) => {
    if (CONFIG.debug) console.info("[Atlas Experience]", ...args);
  };

  // =========================================================
  // 02. ESTILOS EMBUTIDOS — NÃO PRECISA DE OUTRO CSS
  // =========================================================

  function injectStyles() {
    if (doc.getElementById("atlas-experience-styles")) return;

    const style = doc.createElement("style");
    style.id = "atlas-experience-styles";

    style.textContent = `
      :root {
        --atlas-gold: ${CONFIG.accent};
        --atlas-progress: 0%;
        --atlas-motion-duration: ${CONFIG.revealDuration}ms;
      }

      /* Barra superior de leitura */
      #atlas-reading-progress {
        position: fixed;
        inset: 0 auto auto 0;
        width: var(--atlas-progress);
        height: 3px;
        z-index: 100001;
        pointer-events: none;
        background: var(--atlas-gold);
        transition: width 100ms linear;
        transform: translateZ(0);
      }

      /* Camada de interações */
      #atlas-experience-layer {
        position: fixed;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
        z-index: 100000;
        contain: strict;
      }

      /* Ondas suaves de toque */
      .atlas-ripple {
        position: absolute;
        width: 30px;
        height: 30px;
        border: 1px solid rgba(164, 135, 80, .68);
        border-radius: 50%;
        box-sizing: border-box;
        transform: translate(-50%, -50%) scale(.15);
        animation: atlas-ripple-animation
          ${CONFIG.rippleDuration}ms
          cubic-bezier(.16, .72, .28, 1) forwards;
        will-change: transform, opacity;
      }

      .atlas-ripple::after {
        content: "";
        position: absolute;
        inset: 5px;
        border: 1px solid rgba(164, 135, 80, .28);
        border-radius: inherit;
      }

      @keyframes atlas-ripple-animation {
        0% {
          opacity: 0;
          transform: translate(-50%, -50%) scale(.15);
        }
        18% { opacity: .72; }
        100% {
          opacity: 0;
          transform: translate(-50%, -50%) scale(3.2);
        }
      }

      /* Entrada progressiva dos elementos */
      .atlas-reveal {
        opacity: 0;
        transform: translate3d(0, 22px, 0);
        transition:
          opacity var(--atlas-motion-duration) ease,
          transform var(--atlas-motion-duration)
            cubic-bezier(.2, .65, .3, 1);
        transition-delay: var(--atlas-reveal-delay, 0ms);
      }

      .atlas-reveal.atlas-visible {
        opacity: 1;
        transform: translate3d(0, 0, 0);
      }

      .atlas-reveal[data-atlas-reveal="left"] {
        transform: translate3d(-24px, 0, 0);
      }

      .atlas-reveal[data-atlas-reveal="right"] {
        transform: translate3d(24px, 0, 0);
      }

      .atlas-reveal[data-atlas-reveal="left"].atlas-visible,
      .atlas-reveal[data-atlas-reveal="right"].atlas-visible {
        transform: translate3d(0, 0, 0);
      }

      /* Feedback de botões */
      .atlas-interactive {
        -webkit-tap-highlight-color: transparent;
      }

      .atlas-interactive.atlas-pressed {
        transform: scale(.975);
        transition: transform 100ms ease-out;
      }

      /* Cartões 3D: apenas elementos com a classe atlas-tilt */
      .atlas-tilt {
        transform:
          perspective(1000px)
          rotateX(var(--atlas-tilt-x, 0deg))
          rotateY(var(--atlas-tilt-y, 0deg));
        transition: transform 180ms ease-out;
        transform-style: preserve-3d;
      }

      .atlas-tilt.atlas-tilting {
        transition: transform 70ms linear;
      }

      /* Botão de voltar ao topo */
      #atlas-back-to-top {
        position: fixed;
        right: max(22px, env(safe-area-inset-right));
        bottom: max(22px, env(safe-area-inset-bottom));
        z-index: 99990;
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        border: 1px solid rgba(164, 135, 80, .5);
        border-radius: 50%;
        background: rgba(250, 247, 240, .96);
        color: #684d2d;
        font: inherit;
        font-size: 21px;
        line-height: 1;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transform: translateY(8px);
        transition:
          opacity 220ms ease,
          transform 220ms ease,
          visibility 220ms ease,
          background 220ms ease;
        box-shadow: 0 4px 18px rgba(48, 35, 20, .08);
        -webkit-tap-highlight-color: transparent;
      }

      #atlas-back-to-top.atlas-top-visible {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      #atlas-back-to-top:hover {
        background: #f0e7d5;
      }

      #atlas-back-to-top:focus-visible {
        outline: 2px solid var(--atlas-gold);
        outline-offset: 4px;
      }

      /* Acessibilidade */
      @media (prefers-reduced-motion: reduce) {
        .atlas-reveal,
        .atlas-tilt,
        #atlas-back-to-top,
        #atlas-reading-progress {
          animation: none !important;
          transition: none !important;
        }

        .atlas-reveal {
          opacity: 1 !important;
          transform: none !important;
        }

        .atlas-ripple {
          display: none !important;
        }
      }
    `;

    doc.head.appendChild(style);
  }

  // =========================================================
  // 03. ELEMENTOS GLOBAIS
  // =========================================================

  let experienceLayer;
  let progressBar;
  let topButton;

  function createInterface() {
    experienceLayer = doc.createElement("div");
    experienceLayer.id = "atlas-experience-layer";
    experienceLayer.setAttribute("aria-hidden", "true");

    progressBar = doc.createElement("div");
    progressBar.id = "atlas-reading-progress";
    progressBar.setAttribute("aria-hidden", "true");

    topButton = doc.createElement("button");
    topButton.id = "atlas-back-to-top";
    topButton.type = "button";
    topButton.setAttribute("aria-label", "Voltar ao início");
    topButton.title = "Voltar ao início";
    topButton.textContent = "↑";

    doc.body.append(experienceLayer, progressBar, topButton);

    topButton.addEventListener("click", () => {
      doc.getElementById("inicio")?.scrollIntoView({
        behavior: reducedMotion.matches ? "auto" : "smooth",
        block: "start"
      }) || window.scrollTo({
        top: 0,
        behavior: reducedMotion.matches ? "auto" : "smooth"
      });
    });
  }

  // =========================================================
  // 04. EFEITO DE TOQUE E CLIQUE
  // =========================================================

  function createRipple(x, y, pointerType) {
    if (
      reducedMotion.matches ||
      !experienceLayer?.isConnected ||
      doc.hidden
    ) return;

    if (state.ripples.size >= CONFIG.maxRipples) {
      const oldest = state.ripples.values().next().value;
      oldest?.remove();
      state.ripples.delete(oldest);
    }

    const ripple = doc.createElement("span");
    ripple.className = "atlas-ripple";

    const size = pointerType === "touch" ? 34 : 30;

    Object.assign(ripple.style, {
      left: `${x}px`,
      top: `${y}px`,
      width: `${size}px`,
      height: `${size}px`
    });

    experienceLayer.appendChild(ripple);
    state.ripples.add(ripple);

    const cleanup = () => {
      ripple.remove();
      state.ripples.delete(ripple);
    };

    ripple.addEventListener("animationend", cleanup, { once: true });
    window.setTimeout(cleanup, CONFIG.rippleDuration + 180);
  }

  function setupTouchExperience() {
    doc.addEventListener("pointerdown", (event) => {
      if (reducedMotion.matches) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;

      const now = performance.now();
      if (now - state.lastPointerTime < 45) return;
      state.lastPointerTime = now;

      createRipple(event.clientX, event.clientY, event.pointerType);
    }, { passive: true });
  }

  // =========================================================
  // 05. ANIMAÇÕES DE ENTRADA AO ROLAR
  // =========================================================

  function setupRevealAnimations() {
    const selectors = [
      "main section",
      ".chapter",
      ".chapter-card",
      ".content-card",
      ".atlas-card",
      ".info-card",
      ".timeline-item",
      ".reference-item"
    ];

    const elements = new Set();

    selectors.forEach((selector) => {
      doc.querySelectorAll(selector).forEach((element) => {
        if (element.matches("[data-atlas-no-reveal]")) return;
        if (element.closest("[data-atlas-no-reveal]")) return;
        elements.add(element);
      });
    });

    // Só ativa a revelação nos elementos que ainda não têm
    // um estado de visibilidade definido pelo próprio site.
    const revealElements = [...elements].filter((element) => {
      if (element.classList.contains("atlas-visible")) return false;
      if (element.classList.contains("atlas-reveal")) return false;
      return true;
    });

    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      revealElements.forEach((element) => {
        element.classList.add("atlas-visible");
      });
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("atlas-visible");
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.12,
      rootMargin: "0px 0px -45px 0px"
    });

    revealElements.forEach((element, index) => {
      element.classList.add("atlas-reveal");
      element.style.setProperty(
        "--atlas-reveal-delay",
        `${Math.min(index % 4, 3) * 65}ms`
      );
      observer.observe(element);
    });

    state.observers.push(observer);
    log(`${revealElements.length} elementos preparados para revelação.`);
  }

  // =========================================================
  // 06. CARTÕES COM PROFUNDIDADE 3D
  // =========================================================

  function setupTiltCards() {
    // Para ativar: adicione class="atlas-tilt" ao cartão desejado.
    if (!finePointer.matches || reducedMotion.matches) return;

    doc.querySelectorAll(".atlas-tilt").forEach((card) => {
      if (state.tiltCards.has(card)) return;
      state.tiltCards.add(card);

      card.addEventListener("pointerenter", () => {
        card.classList.add("atlas-tilting");
      });

      card.addEventListener("pointermove", (event) => {
        if (event.pointerType !== "mouse") return;

        const rect = card.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;

        const rotateY = (x - 0.5) * CONFIG.tiltStrength * 2;
        const rotateX = (0.5 - y) * CONFIG.tiltStrength * 2;

        card.style.setProperty("--atlas-tilt-x", `${rotateX}deg`);
        card.style.setProperty("--atlas-tilt-y", `${rotateY}deg`);
      });

      card.addEventListener("pointerleave", () => {
        card.classList.remove("atlas-tilting");
        card.style.setProperty("--atlas-tilt-x", "0deg");
        card.style.setProperty("--atlas-tilt-y", "0deg");
      });
    });
  }

  // =========================================================
  // 07. FEEDBACK FÍSICO DOS BOTÕES
  // =========================================================

  function setupButtonFeedback() {
    const selector = [
      "button",
      ".btn",
      ".button",
      ".nav-link",
      "[role='button']"
    ].join(",");

    doc.querySelectorAll(selector).forEach((element) => {
      if (element.id === "atlas-back-to-top") return;
      if (element.dataset.atlasFeedback === "true") return;

      element.dataset.atlasFeedback = "true";
      element.classList.add("atlas-interactive");

      element.addEventListener("pointerdown", () => {
        if (reducedMotion.matches) return;
        element.classList.add("atlas-pressed");
      });

      const release = () => {
        element.classList.remove("atlas-pressed");
      };

      element.addEventListener("pointerup", release);
      element.addEventListener("pointercancel", release);
      element.addEventListener("pointerleave", release);
      element.addEventListener("blur", release);
    });
  }

  // =========================================================
  // 08. BARRA DE PROGRESSO E BOTÃO DE TOPO
  // =========================================================

  function updateScrollInterface() {
    state.scrollScheduled = false;

    const scrollTop = window.scrollY || root.scrollTop;
    const scrollableHeight =
      root.scrollHeight - window.innerHeight;

    const progress = scrollableHeight > 0
      ? Math.min(100, Math.max(0, (scrollTop / scrollableHeight) * 100))
      : 0;

    state.scrollProgress = progress;
    root.style.setProperty("--atlas-progress", `${progress}%`);

    if (topButton) {
      topButton.classList.toggle(
        "atlas-top-visible",
        scrollTop > CONFIG.scrollThreshold
      );
    }
  }

  function requestScrollUpdate() {
    if (state.scrollScheduled) return;
    state.scrollScheduled = true;
    window.requestAnimationFrame(updateScrollInterface);
  }

  function setupScrollInterface() {
    window.addEventListener("scroll", requestScrollUpdate, {
      passive: true
    });

    window.addEventListener("resize", requestScrollUpdate, {
      passive: true
    });

    updateScrollInterface();
  }

  // =========================================================
  // 09. NAVEGAÇÃO INTERNA SUAVE
  // =========================================================

  function setupSmoothAnchors() {
    doc.addEventListener("click", (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href || href === "#") return;

      let targetId;

      try {
        targetId = decodeURIComponent(href.slice(1));
      } catch {
        return;
      }

      const target = doc.getElementById(targetId);
      if (!target) return;

      event.preventDefault();

      target.scrollIntoView({
        behavior: reducedMotion.matches ? "auto" : "smooth",
        block: "start"
      });

      // Atualiza o fragmento sem disparar outro salto.
      if (window.location.hash !== href) {
        window.history.replaceState(null, "", href);
      }
    });
  }

  // =========================================================
  // 10. SEÇÃO ATUAL NA NAVEGAÇÃO
  // =========================================================

  function setupActiveNavigation() {
    const sections = [...doc.querySelectorAll(
      "main section[id], section[id], article[id]"
    )];

    const links = [...doc.querySelectorAll(
      'nav a[href^="#"], .nav a[href^="#"]'
    )];

    if (!sections.length || !links.length) return;
    if (!("IntersectionObserver" in window)) return;

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          state.visibleSections.add(entry.target.id);
        } else {
          state.visibleSections.delete(entry.target.id);
        }
      });

      const currentSection = sections.find((section) =>
        state.visibleSections.has(section.id)
      );

      if (!currentSection) return;

      links.forEach((link) => {
        const isActive =
          link.getAttribute("href") === `#${currentSection.id}`;

        if (isActive) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }, {
      rootMargin: "-15% 0px -65% 0px",
      threshold: 0
    });

    sections.forEach((section) => sectionObserver.observe(section));
    state.observers.push(sectionObserver);
  }

  // =========================================================
  // 11. PROTEÇÃO PARA ABA EM SEGUNDO PLANO
  // =========================================================

  function setupVisibilityHandling() {
    doc.addEventListener("visibilitychange", () => {
      if (doc.hidden) {
        state.ripples.forEach((ripple) => ripple.remove());
        state.ripples.clear();
      }
    });

    reducedMotion.addEventListener?.("change", (event) => {
      if (!event.matches) return;

      state.ripples.forEach((ripple) => ripple.remove());
      state.ripples.clear();

      state.tiltCards.forEach((card) => {
        card.classList.remove("atlas-tilting");
        card.style.setProperty("--atlas-tilt-x", "0deg");
        card.style.setProperty("--atlas-tilt-y", "0deg");
      });
    });
  }

  // =========================================================
  // 12. INICIALIZAÇÃO
  // =========================================================

  function init() {
    if (state.initialized) return;
    if (!doc.body) return;

    state.initialized = true;

    injectStyles();
    createInterface();
    setupTouchExperience();
    setupRevealAnimations();
    setupTiltCards();
    setupButtonFeedback();
    setupScrollInterface();
    setupSmoothAnchors();
    setupActiveNavigation();
    setupVisibilityHandling();

    log("Atlas Experience Engine inicializado.");
  }

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
