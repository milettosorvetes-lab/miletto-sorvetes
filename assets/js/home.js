/* Página inicial: entrada da capa, sabores em rolagem horizontal e vídeo que expande */

(function () {
  const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hero = document.querySelector(".capa");

  if (!reduz) gsap.set(".nav", { yPercent: -160, opacity: 0 });
  if (!reduz) gsap.set(".capa__frase strong, .capa__rodape", { opacity: 0 }); // só aparecem depois do nome escrito

  window.miletoAposNome = () => {
    const tl = gsap.timeline();
    tl.fromTo(".capa__frase strong", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: "expo.out", stagger: 0.12 }, 0)
      .fromTo(".capa__rodape", { opacity: 0 }, { opacity: 1, duration: 0.8 }, 0.4);
    if (reduz) tl.progress(1);
  };
  window.miletoEscreverSvg = () => desenharLogoMiletto(document.getElementById("logo-hero")).then(window.miletoAposNome);

  window.miletoPronto.then(() => {
    // Entrada: menu desce, o nome é escrito à mão e o resto aparece em sequência
    gsap.to(".nav", { yPercent: 0, opacity: 1, duration: 1.2, ease: "expo.out", delay: 0.2, clearProps: "transform,opacity" });
    // Com 3D, quem escreve o nome é o pacotes3d.js; o logo plano só entra sem 3D
    if (reduz) window.miletoEscreverSvg();
  });

  if (reduz) return;

  // Selo dos fundadores é desenhado quando entra na tela
  const selo = document.querySelector("[data-selo]");
  ScrollTrigger.create({ trigger: selo, start: "top 80%", once: true, onEnter: () => window.animarSelo(selo, 2.2) });

  // Ao rolar, a frase some
  gsap.timeline({ scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.6 } })
    .to(".capa__frase", { y: -60, opacity: 0, ease: "none", duration: 0.6 }, 0);

  // Vídeo do açaizal: de cartão a tela cheia
  const ehEstreito = window.innerWidth < 700;
  gsap.timeline({ scrollTrigger: { trigger: ".expande", start: "top top", end: "bottom bottom", scrub: 0.6 } })
    .fromTo(".expande__midia", { clipPath: ehEstreito ? "inset(22% 10% 22% 10% round 32px)" : "inset(18% 22% 18% 22% round 44px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "power2.inOut", duration: 0.6 })
    .fromTo(".expande__texto", { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }, 0.45)
    .to({}, { duration: 0.25 });
})();
