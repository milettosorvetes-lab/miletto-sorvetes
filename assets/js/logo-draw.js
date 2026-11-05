/* Logo Miletto com animação de escrita à mão (handwriting reveal).
   Cada glifo do logo oficial é revelado por uma máscara que percorre o traço central
   da letra, na ordem natural de escrita. Depois, o logo reage ao mouse com uma onda suave. */

(function () {
  const NS = "http://www.w3.org/2000/svg";
  const FOGO = "#a8110f";
  const VELOCIDADE = 4200; // unidades do viewBox por segundo
  const PAUSA = 0.015; // "levantar a caneta" entre letras

  const el = (tag, attrs = {}, pai) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (pai) pai.appendChild(n);
    return n;
  };

  function montar(svg) {
    const { viewBox, glyphs, strokes } = window.MILETTO_LOGO;
    svg.setAttribute("viewBox", viewBox);
    svg.innerHTML = "";
    const defs = el("defs", {}, svg);
    const tinta = el("g", { class: "logo-tinta", fill: FOGO }, svg);

    const itens = glyphs.map((d, i) => {
      const mask = el("mask", { id: `mil-m${i}`, maskUnits: "userSpaceOnUse", x: "-200", y: "-200", width: "2400", height: "1400" }, defs);
      const traco = el("path", { d: strokes[i].d, fill: "none", stroke: "#fff", "stroke-width": strokes[i].w, "stroke-linecap": "round", "stroke-linejoin": "round" }, mask);
      const g = el("g", { class: "glifo" }, tinta);
      const letra = el("path", { d, mask: `url(#mil-m${i})` }, g);
      const L = traco.getTotalLength();
      traco.style.strokeDasharray = `${L} ${L}`;
      traco.style.strokeDashoffset = L;
      return { g, letra, traco, L };
    });
    return { svg, itens };
  }

  function semMascara(ctx) {
    ctx.itens.forEach((it) => it.letra.removeAttribute("mask"));
  }

  // Onda suave: as letras perto do cursor sobem um pouco e voltam com calma
  function onda(ctx) {
    const { svg, itens } = ctx;
    const centros = itens.map((it) => {
      const b = it.g.getBBox();
      gsap.set(it.g, { transformOrigin: "50% 100%" });
      return b.x + b.width / 2;
    });
    const pt = svg.createSVGPoint();
    svg.addEventListener("pointermove", (e) => {
      pt.x = e.clientX;
      pt.y = e.clientY;
      const x = pt.matrixTransform(svg.getScreenCTM().inverse()).x;
      itens.forEach((it, i) => {
        const f = Math.exp(-Math.pow((x - centros[i]) / 220, 2));
        gsap.to(it.g, { y: -26 * f, scale: 1 + 0.045 * f, rotate: (x - centros[i]) * -0.004 * f, duration: 0.9, ease: "power3.out", overwrite: "auto" });
      });
    });
    svg.addEventListener("pointerleave", () => {
      gsap.to(itens.map((it) => it.g), { y: 0, scale: 1, rotate: 0, duration: 1.4, ease: "power3.out", stagger: 0.03, overwrite: "auto" });
    });
  }

  window.desenharLogoMiletto = function (svg) {
    if (!svg || !window.MILETTO_LOGO) return Promise.resolve();
    const ctx = montar(svg);
    const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduz) {
      semMascara(ctx);
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const tl = gsap.timeline({
        delay: 0,
        onComplete: () => {
          semMascara(ctx);
          if (window.matchMedia("(hover: hover)").matches) onda(ctx);
          resolve();
        },
      });
      ctx.itens.forEach((it) => {
        tl.to(it.traco, { strokeDashoffset: 0, duration: Math.max(0.09, it.L / VELOCIDADE), ease: "power1.inOut" }, `>${PAUSA}`);
      });
      // Um leve "assentar" da tinta no final
      tl.fromTo(ctx.itens.map((it) => it.g), { scale: 1 }, { scale: 1.02, duration: 0.25, ease: "sine.out", yoyo: true, repeat: 1, stagger: 0.025, transformOrigin: "50% 100%" }, ">-0.1");
    });
  };
})();
