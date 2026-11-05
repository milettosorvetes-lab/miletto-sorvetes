/* Página do açaí: hero, "do pé ao pote" sincronizado com a rolagem e faixa de fotos */

(function () {
  const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  gsap.set(".page-hero [data-hero-in]", { opacity: 0, y: 50 });
  window.miletoPronto.then(() => {
    gsap
      .timeline()
      .fromTo(".page-hero__bg video", { scale: 1.18 }, { scale: 1, duration: 2.2, ease: "expo.out" }, 0)
      .to(".page-hero [data-hero-in]", { opacity: 1, y: 0, duration: 1.2, ease: "expo.out", stagger: 0.12 }, 0.15)
      .fromTo(".page-hero__selo", { scale: 0, rotate: -60 }, { scale: 1, rotate: 0, duration: 1.3, ease: "elastic.out(1, .5)" }, 0.5);
  });

  if (!reduz) {
    gsap.to(".page-hero__bg", { yPercent: 18, ease: "none", scrollTrigger: { trigger: ".page-hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".page-hero .wrap", { yPercent: -30, opacity: 0, ease: "none", scrollTrigger: { trigger: ".page-hero", start: "center center", end: "bottom top", scrub: true } });
  }

  // Do pé ao pote: cada etapa ativa troca o vídeo da "tela"
  const tela = document.querySelector(".processo__tela");
  const videos = tela ? [...tela.querySelectorAll("video")] : [];
  const badgeN = tela?.querySelector(".processo__badge b");
  const badgeT = tela?.querySelector(".processo__badge span");
  const passos = [...document.querySelectorAll(".passo")];
  let atual = -1;

  function ativar(i) {
    if (i === atual) return;
    atual = i;
    passos.forEach((p, k) => p.classList.toggle("ativo", k === i));
    videos.forEach((v, k) => {
      if (k === i) {
        if (!v.src) v.src = v.dataset.src;
        v.currentTime = 0;
        v.play().catch(() => {});
        v.classList.add("ativo");
      } else {
        v.classList.remove("ativo");
        setTimeout(() => k !== atual && v.pause(), 800);
      }
    });
    if (badgeN) {
      gsap.fromTo([badgeN, badgeT], { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "expo.out", stagger: 0.05 });
      badgeN.textContent = String(i + 1).padStart(2, "0");
      badgeT.textContent = passos[i].dataset.nome;
    }
  }

  const mm = gsap.matchMedia();
  mm.add("(min-width: 861px)", () => {
    // pré-carrega o próximo vídeo quando a seção aparece
    ScrollTrigger.create({
      trigger: "#processo",
      start: "top 80%",
      once: true,
      onEnter: () => videos.forEach((v) => !v.src && (v.preload = "auto", v.src = v.dataset.src)),
    });
    passos.forEach((p, i) => {
      ScrollTrigger.create({
        trigger: p,
        start: "top 55%",
        end: "bottom 55%",
        onToggle: (st) => st.isActive && ativar(i),
      });
    });
    ScrollTrigger.create({
      trigger: "#processo",
      start: "top 60%",
      end: "bottom top",
      onToggle: (st) => (st.isActive ? videos[Math.max(atual, 0)]?.play().catch(() => {}) : videos.forEach((v) => v.pause())),
    });
  });

  // Faixa de fotos deslizando com a rolagem
  const faixa = document.querySelector("[data-faixa]");
  if (faixa && !reduz) {
    gsap.fromTo(
      faixa,
      { x: () => window.innerWidth * 0.1 },
      {
        x: () => -(faixa.scrollWidth - window.innerWidth * 0.9),
        ease: "none",
        scrollTrigger: { trigger: faixa.parentElement, start: "top bottom", end: "bottom top", scrub: 0.6, invalidateOnRefresh: true },
      }
    );
  }
})();
