/* Miletto Sorvetes — comportamento compartilhado entre as páginas */

// Contatos oficiais
window.MILETTO = {
  instagram: "https://www.instagram.com/milettosorvetes/",
  linktree: "https://linktr.ee/milettosorvetes",
  whatsapp: "556335718463",
};

const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const ehToque = window.matchMedia("(hover: none), (pointer: coarse)").matches;

function linkWhatsApp(mensagem) {
  const { whatsapp, linktree } = window.MILETTO;
  if (!whatsapp) return linktree;
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensagem || "Olá, Miletto!")}`;
}
window.linkWhatsApp = linkWhatsApp;

/* ---------- Scroll suave + GSAP ---------- */
gsap.registerPlugin(ScrollTrigger);
let lenis = null;
if (!reduzMovimento && window.Lenis) {
  lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}
window.miletoLenis = lenis;

/* ---------- Links de contato ---------- */
document.body.insertAdjacentHTML("beforeend", '<a class="whats-flutuante" data-whats="Olá, Miletto! Vim pelo site." aria-label="WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.05 21.5h-.01a9.45 9.45 0 0 1-4.82-1.32l-.35-.21-3.58.94.96-3.49-.23-.36a9.43 9.43 0 0 1-1.45-5.03c0-5.22 4.25-9.47 9.48-9.47 2.53 0 4.91.99 6.7 2.78a9.42 9.42 0 0 1 2.77 6.7c0 5.22-4.25 9.46-9.47 9.46zm8.06-17.53A11.33 11.33 0 0 0 12.05.63C5.77.63.66 5.74.66 12.02c0 2.01.52 3.97 1.52 5.7L.56 23.63l6.05-1.59a11.37 11.37 0 0 0 5.44 1.39h.01c6.28 0 11.39-5.11 11.39-11.39 0-3.04-1.18-5.9-3.34-8.07z"/></svg></a>');
document.querySelectorAll("[data-whats]").forEach((a) => {
  a.href = linkWhatsApp(a.dataset.whats);
  a.target = "_blank";
  a.rel = "noopener";
});
document.querySelectorAll("[data-insta]").forEach((a) => {
  a.href = window.MILETTO.instagram;
  a.target = "_blank";
  a.rel = "noopener";
});
document.querySelectorAll("[data-ano]").forEach((el) => (el.textContent = new Date().getFullYear()));

/* ---------- Cortina de transição ---------- */
// Páginas internas já trazem a cortina no HTML (cobrindo), para não piscar o conteúdo antes do JS
let cortina = document.querySelector(".cortina");
if (!cortina) {
  cortina = document.createElement("div");
  cortina.className = "cortina";
  cortina.innerHTML = '<div class="cortina__painel"><img class="cortina__selo" src="assets/img/selo-miletto.svg" alt=""></div>';
  document.body.appendChild(cortina);
}
const painel = cortina.querySelector(".cortina__painel");

function abrirCortina() {
  // Revela a página que acabou de carregar (painel sai por cima)
  gsap.set(painel, { yPercent: 0 });
  return gsap
    .timeline()
    .fromTo(".cortina__selo", { scale: 1 }, { scale: 0.6, opacity: 0, duration: 0.45, ease: "back.in(2)" })
    .to(painel, { yPercent: -125, duration: 1, ease: "expo.inOut" }, "-=0.1")
    .set(painel, { yPercent: 110 })
    .set(".cortina__selo", { scale: 1, opacity: 1 });
}

function fecharCortina(destino) {
  if (reduzMovimento) return (window.location.href = destino);
  cortina.style.pointerEvents = "all";
  gsap
    .timeline({ onComplete: () => (window.location.href = destino) })
    .set(painel, { yPercent: 110 })
    .fromTo(".cortina__selo", { scale: 0.4, rotate: -30, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 0.7, ease: "elastic.out(1, .55)" }, 0.35)
    .to(painel, { yPercent: 0, duration: 0.8, ease: "expo.inOut" }, 0);
}

document.addEventListener("click", (e) => {
  const a = e.target.closest("a[href]");
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank") return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin || !url.pathname.endsWith(".html") && !url.pathname.endsWith("/")) return;
  if (url.pathname === location.pathname && url.hash) return;
  e.preventDefault();
  document.documentElement.classList.remove("menu-aberto");
  fecharCortina(url.href);
});
window.addEventListener("pageshow", (e) => {
  if (e.persisted) gsap.set(painel, { yPercent: 110 });
});

/* ---------- Loader com o selo dos fundadores (página inicial) ---------- */
/* Desenha o selo de Dona Claudete e Seu Sérgio: o fundo surge e os traços vão sendo riscados */
window.animarSelo = async function (host, duracao) {
  const img = host.querySelector("img");
  try {
    const svgTexto = await (await fetch(img.src)).text();
    host.innerHTML = svgTexto;
  } catch (e) {
    gsap.fromTo(img, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: duracao, ease: "expo.out" }); // sem fetch (arquivo local)
    return;
  }
  const svg = host.querySelector("svg");
  svg.style.width = "100%";
  svg.style.height = "auto";
  svg.style.display = "block";
  const todos = [...svg.querySelectorAll("path")];
  const base = todos.slice(0, 3);
  const tracos = todos.slice(3).map((p) => ({ p, y: p.getBBox().y })).sort((a, b) => a.y - b.y).map((t) => t.p);
  tracos.forEach((p) => {
    p.setAttribute("pathLength", 1);
    p.setAttribute("stroke", p.getAttribute("fill"));
    p.setAttribute("stroke-width", 1);
    p.style.strokeDasharray = 1;
    p.style.strokeDashoffset = 1;
    p.style.fillOpacity = 0;
  });
  return gsap.timeline()
    .fromTo(base, { opacity: 0, scale: 0.88, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: duracao * 0.45, ease: "back.out(1.6)" }, 0)
    .to(tracos, { strokeDashoffset: 0, duration: duracao * 0.4, ease: "none", stagger: { amount: duracao * 0.5 } }, duracao * 0.1)
    .to(tracos, { fillOpacity: 1, duration: duracao * 0.3, ease: "sine.out", stagger: { amount: duracao * 0.4 } }, duracao * 0.3)
    .add(() => tracos.forEach((p) => p.removeAttribute("stroke")));
};

function rodarLoader() {
  const loader = document.querySelector(".loader");
  if (!loader) return Promise.resolve();
  if (reduzMovimento) {
    loader.remove();
    document.body.classList.remove("is-loading");
    return Promise.resolve();
  }
  // Entrada curta: o selo é desenhado e a tela sobe, sem contador
  return new Promise((resolve) => {
    window.animarSelo(loader.querySelector(".loader__selo"), 0.8);
    gsap.delayedCall(0.95, () => {
      document.body.classList.remove("is-loading");
      resolve();
      gsap.to(loader, { yPercent: -112, duration: 0.65, ease: "expo.inOut", onComplete: () => loader.remove() });
    });
  });
}

/* ---------- Navegação ---------- */
const nav = document.querySelector(".nav");
if (nav) {
  let ultimo = 0;
  const aoRolar = (y) => {
    nav.classList.toggle("is-solid", y > 40);
    const menuAberto = document.documentElement.classList.contains("menu-aberto");
    nav.classList.toggle("is-hidden", !menuAberto && y > 300 && y > ultimo);
    ultimo = y;
  };
  if (lenis) lenis.on("scroll", ({ scroll }) => aoRolar(scroll));
  else window.addEventListener("scroll", () => aoRolar(window.scrollY), { passive: true });
  aoRolar(window.scrollY);

  const burger = nav.querySelector(".nav__burger");
  burger?.addEventListener("click", () => {
    const aberto = document.documentElement.classList.toggle("menu-aberto");
    burger.setAttribute("aria-expanded", aberto);
    if (lenis) aberto ? lenis.stop() : lenis.start();
    if (aberto) gsap.fromTo(".menu-mobile a", { y: 60, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.07, duration: 0.8, ease: "expo.out", delay: 0.2 });
  });
}

/* ---------- Texto dividido em linhas/palavras ---------- */
function dividir(el) {
  const palavras = el.innerHTML.trim().split(/(\s+|<br\s*\/?>)/i);
  el.innerHTML = palavras
    .map((p) => {
      if (/^<br/i.test(p)) return "<br>";
      if (/^\s+$/.test(p)) return " ";
      return `<span class="split-linha" style="display:inline-block"><span>${p}</span></span>`;
    })
    .join("");
  return el.querySelectorAll(".split-linha > span");
}

function animacoesDeRolagem() {
  document.querySelectorAll("[data-split]").forEach((el) => {
    const partes = dividir(el);
    gsap.from(partes, {
      yPercent: 115,
      rotate: 4,
      duration: 1.1,
      ease: "expo.out",
      stagger: 0.045,
      scrollTrigger: { trigger: el, start: "top 86%" },
    });
  });

  ScrollTrigger.batch("[data-reveal]", {
    start: "top 88%",
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, ease: "expo.out", stagger: 0.1, overwrite: true }),
  });

  document.querySelectorAll("[data-parallax]").forEach((el) => {
    const v = parseFloat(el.dataset.parallax) || 0.15;
    gsap.fromTo(el, { yPercent: v * 100 }, { yPercent: -v * 100, ease: "none", scrollTrigger: { trigger: el.closest("section") || el, start: "top bottom", end: "bottom top", scrub: true } });
  });

  document.querySelectorAll("[data-gira]").forEach((el) => {
    gsap.to(el, { rotate: parseFloat(el.dataset.gira) || 180, ease: "none", scrollTrigger: { trigger: el.closest("section, footer") || el, start: "top bottom", end: "bottom top", scrub: true } });
  });
}

/* ---------- Vídeos: só tocam quando visíveis ---------- */
function videosPreguicosos() {
  const io = new IntersectionObserver(
    (entradas) =>
      entradas.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) {
          if (target.dataset.src && !target.src) target.src = target.dataset.src;
          if (!target.hasAttribute("data-manual")) target.play().catch(() => {});
        } else target.pause();
      }),
    { rootMargin: "200px 0px" }
  );
  document.querySelectorAll("video[data-auto]").forEach((v) => {
    v.muted = true;
    v.playsInline = true;
    io.observe(v);
  });
}

/* ---------- Cursor e botões magnéticos ---------- */
function interacoesPonteiro() {
  if (ehToque || reduzMovimento) return;
  const cursor = document.createElement("div");
  cursor.className = "cursor";
  cursor.innerHTML = "<span></span>";
  document.body.appendChild(cursor);
  const rotulo = cursor.querySelector("span");
  const xTo = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3" });
  const yTo = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3" });
  window.addEventListener("pointermove", (e) => {
    cursor.style.opacity = 1;
    xTo(e.clientX);
    yTo(e.clientY);
  });
  document.addEventListener("pointerover", (e) => {
    const alvo = e.target.closest("[data-cursor]");
    cursor.classList.toggle("grande", !!alvo);
    rotulo.textContent = alvo ? alvo.dataset.cursor : "";
  });

  document.querySelectorAll(".btn, [data-magnetico]").forEach((el) => {
    const forca = 0.3;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * forca, y: (e.clientY - r.top - r.height / 2) * forca, duration: 0.5, ease: "power3.out" });
    });
    el.addEventListener("pointerleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, .4)" }));
  });

  // Cards com inclinação 3D
  document.querySelectorAll("[data-tilt]").forEach((el) => {
    const forca = parseFloat(el.dataset.tilt) || 8;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty("--mx", `${px * 100}%`);
      el.style.setProperty("--my", `${py * 100}%`);
      gsap.to(el, { rotateY: (px - 0.5) * forca, rotateX: (0.5 - py) * forca, transformPerspective: 900, duration: 0.6, ease: "power2.out" });
    });
    el.addEventListener("pointerleave", () => gsap.to(el, { rotateX: 0, rotateY: 0, duration: 1, ease: "elastic.out(1, .5)" }));
  });
}

/* ---------- Inicialização ---------- */
const ehInicio = !!document.querySelector(".loader");
const pronto = ehInicio ? rodarLoader() : (reduzMovimento ? Promise.resolve() : abrirCortina().then());
if (!ehInicio) cortina.classList.remove("cortina--cobrindo");

animacoesDeRolagem();
videosPreguicosos();
interacoesPonteiro();

window.miletoPronto = pronto.then(() => {
  ScrollTrigger.refresh();
  document.dispatchEvent(new CustomEvent("miletto:pronto"));
});
