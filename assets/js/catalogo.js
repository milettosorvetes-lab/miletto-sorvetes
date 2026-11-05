/* Catálogo interativo: filtros por categoria e ficha de cada linha (catálogo 2026) */
(function () {
  const t = window.t;
  const CATS = [["todos", "Todos"], ["picoles", "Picolés"], ["sorvetes", "Sorvetes"], ["acai", "Açaí"], ["zero", "Zero açúcar"], ["buffet", "Buffet"]];
  const LINHAS = [
    { id: "gourmet", cats: ["picoles"], novo: 1, img: "cat-gourmet", nome: "Linha Gourmet", desc: "Picolés feitos com leite integral. Experiência única em cada mordida.", sabores: ["Açaí com Pistache Dubai", "Torta de Limão", "Cookies & Cream"], tam: ["65 g", "55 g"] },
    { id: "premium", cats: ["picoles"], img: "cat-premium", nome: "Picolé Premium", desc: "Milebianco: sabor ninho com cobertura de chocolate branco com amendoim e recheio de chocolate com avelã. Brigadeiro: sabor brigadeiro.", sabores: ["Milebianco", "Brigadeiro"] },
    { id: "moreninha", cats: ["picoles"], img: "cat-moreninha", nome: "Moreninha", desc: "Crocante e cremosa, feita com leite integral.", sabores: ["Leite Condensado", "Flocos"], tam: ["50 g"] },
    { id: "especial", cats: ["picoles"], img: "cat-especial", nome: "Linha Especial", desc: "Clássicos com cobertura, para quem gosta de um picolé caprichado.", sabores: ["Skimo", "Açaí com Leitinho"], tam: ["60 g"] },
    { id: "duo", cats: ["picoles"], img: "cat-duo", nome: "Linha Duo", desc: "Morango com meia cobertura sabor stracciatella lattisimo, e sabor coco branco com cobertura de chocolate meio amargo.", sabores: ["Morango com Leitinho", "Mini Saia"], tam: ["55 g"] },
    { id: "fruta", cats: ["picoles"], img: "cat-fruta", nome: "Mais Fruta", desc: "Produto zero lactose, com sabor de fruta de verdade.", sabores: ["Limão", "Groselha", "Uva"], tam: ["65 g"] },
    { id: "leite", cats: ["picoles"], img: "cat-leite", nome: "Mais Leite", desc: "Sabores que todo mundo ama, com a cremosidade do picolé ao leite.", sabores: ["Leite Condensado", "Milho Verde", "Maracujá", "Morango", "Cupuaçu", "Coco", "Chocolate"] },
    { id: "kids", cats: ["picoles"], img: "cat-kids", nome: "Linha Kids", desc: "Sabor com diversão, zero lactose.", sabores: ["Tuttifrutti pinta-língua", "Chiclete com cobertura de chocolate branco"], tam: ["50 g"] },
    { id: "zero", cats: ["zero", "picoles", "sorvetes"], img: "cat-zero", nome: "Linha Zero Açúcar", desc: "Todo o sabor que você ama, sem adição de açúcares. Em picolés e potes.", sabores: ["Chocolate Belga", "Leitinho Trufado", "Iogurte Grego com Frutas Vermelhas"], tam: ["Picolé", "Pote 220 ml"] },
    { id: "sorbet", cats: ["sorvetes"], novo: 1, img: "cat-sorbet", nome: "Sorbet de Morango", desc: "Com mais de 50% de morangos selecionados, sabor intenso e cremosidade surpreendente. Zero lactose e à base de água.", sabores: ["Morango"], tam: ["900 ml"] },
    { id: "sublime", cats: ["sorvetes"], novo: 1, img: "cat-sublime", nome: "Linha Sublime", desc: "Experiências únicas em sabores elegantes.", sabores: ["Mini Saia", "Chocomenta", "Leitinho com Avelã", "Iogurte Grego com Morango"], tam: ["1,5 L"] },
    { id: "classicos", cats: ["sorvetes"], img: "cat-classicos", nome: "Linha Clássicos", desc: "Os sabores de sempre, feitos com leite integral.", sabores: ["Flocos", "Morango", "Quatro Leites", "Napolitano", "Creme", "Chocolate", "Mousse de Maracujá"], tam: ["1,5 L", "1 L", "350 ml", "250 ml"] },
    { id: "acai", cats: ["acai"], img: "cat-acai", nome: "Linha de Açaí", desc: "Do plantio ao pote, nosso açaí é feito 100% por aqui.", sabores: ["Açaí Natural", "Açaí com Paçoca", "Açaí natural com sorvete de leitinho", "Açaí natural com mescla de leitinho"], tam: ["220 ml", "1 L", "1,5 L"] },
    { id: "buffet-7l", cats: ["buffet", "sorvetes"], img: "cat-7l", nome: "Sorvete 7 litros", desc: "Mais de 20 sabores para sorveterias e buffets, nas linhas Tradicional e Premium.", sabores: ["Blue Ice", "Chiclete", "Chocolate", "Chocomenta", "Creme", "Cupuaçu", "Coco", "Flocos", "Iogurte Grego com Morango", "Leite Condensado", "Maracujá", "Morango", "Napolitano", "Prestígio", "Uva", "Chocomaltine", "Kinder Ovo", "Lacta", "Ninho Trufado", "Nutella", "Torta de Limão", "Cookies and Cream", "Floresta Negra", "Capuccino", "Romeu e Julieta", "Pudim de Leite", "Abacaxi com Vinho"], tam: ["7 L"] },
    { id: "buffet-10l", cats: ["buffet", "acai"], img: "cat-10l", nome: "Açaí 10 litros", desc: "De plantação própria, pronto para consumo, com 0% de gordura trans.", sabores: ["Açaí Natural", "Açaí com Banana", "Açaí com Morango", "Açaí com Cupuaçu"], tam: ["10 L"] },
    { id: "buffet", cats: ["buffet"], img: "cat-buffet", nome: "Linha Buffet", desc: "Para sorveterias, restaurantes e eventos: a Miletto servida na hora.", sabores: ["Sorvete 7 litros", "Açaí 10 litros"] },
  ];

  const grade = document.querySelector(".catalogo__grid");
  const filtros = document.querySelector(".catalogo__filtros");
  const modal = document.querySelector(".produto-modal");
  const fundo = document.querySelectorAll(".nav, .menu-mobile, main, .rodape, .whats-flutuante");

  grade.innerHTML = LINHAS.map((l) => `<button class="cat-card" type="button" data-id="${l.id}" aria-haspopup="dialog">
    ${l.novo ? `<span class="sabor__tag">${t("Lançamento")}</span>` : ""}
    <img src="assets/img/${l.img}.webp" alt="${t(l.nome)}" loading="lazy">
    <div><h3>${t(l.nome)}</h3><small>${l.sabores.length} ${t(l.sabores.length > 1 ? "sabores" : "sabor")}</small></div></button>`).join("");
  const cartoes = [...grade.children];

  filtros.innerHTML = CATS.map(([k, n], i) => `<button type="button" data-cat="${k}" aria-pressed="${!i}">${t(n)}</button>`).join("");
  filtros.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    filtros.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b));
    const vis = cartoes.filter((c) => {
      const ok = b.dataset.cat === "todos" || LINHAS.find((l) => l.id === c.dataset.id).cats.includes(b.dataset.cat);
      c.hidden = !ok;
      return ok;
    });
    gsap.fromTo(vis, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: 0.04 });
    ScrollTrigger.refresh();
  });

  const lista = (sel, itens) => (modal.querySelector(sel).innerHTML = itens.map((s) => `<li>${t(s)}</li>`).join(""));
  function abrir(id) {
    const l = LINHAS.find((x) => x.id === id);
    if (!l) return;
    const img = modal.querySelector(".produto-modal__img");
    img.src = `assets/img/${l.img}.webp`;
    img.alt = t(l.nome);
    modal.querySelector("#pm-nome").textContent = t(l.nome);
    modal.querySelector(".pm-desc").textContent = t(l.desc);
    lista(".pm-sabores", l.sabores);
    lista(".pm-tam", l.tam || []);
    modal.querySelector(".pm-tam-t").hidden = !l.tam;
    modal.querySelector(".pm-whats").href = window.linkWhatsApp(`Olá, Miletto! Tenho interesse em: ${l.nome}.`);
    // shortcut: show() em vez de showModal(), com inert no resto da página; a camada superior nativa não rendeu certo aqui
    modal.show();
    fundo.forEach((e) => (e.inert = true));
    modal.querySelector(".produto-modal__fechar").focus();
    window.miletoLenis?.stop();
    gsap.fromTo(modal, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: "expo.out" });
    history.replaceState(null, "", `#${id}`);
  }
  grade.addEventListener("click", (e) => { const c = e.target.closest(".cat-card"); if (c) abrir(c.dataset.id); });
  modal.querySelector(".produto-modal__fechar").addEventListener("click", () => modal.close());
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.open) modal.close(); });
  modal.addEventListener("close", () => { fundo.forEach((e) => (e.inert = false)); window.miletoLenis?.start(); history.replaceState(null, "", location.pathname); });

  window.miletoPronto.then(() => {
    gsap.fromTo(cartoes, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.04 });
    gsap.fromTo("[data-hero-in]", { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.8, ease: "expo.out", stagger: 0.08 });
    if (location.hash) abrir(location.hash.slice(1));
  });
})();
