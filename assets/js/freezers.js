/* Página de freezers: hero, passo a passo e formulário */

(function () {
  const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Hero
  gsap.set(".fz-hero [data-hero-in]", { opacity: 0, y: 50 });
  gsap.set(".fz-hero__freezer img", { opacity: 0, x: 160, rotate: 8 });
  window.miletoPronto.then(() => {
    gsap
      .timeline()
      .to(".fz-hero [data-hero-in]", { opacity: 1, y: 0, duration: 1.2, ease: "expo.out", stagger: 0.1 }, 0)
      .to(".fz-hero__freezer img", { opacity: 1, x: 0, rotate: 0, duration: 1.6, ease: "elastic.out(1, .7)" }, 0.2)
      .fromTo(".fz-hero__freezer .sombra", { scaleX: 0.3, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 1.2, ease: "expo.out" }, 0.4);
    if (!reduz) {
      gsap.to(".fz-hero__freezer img", { y: -16, duration: 2.6, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.8 });
      gsap.to(".fz-hero__freezer .sombra", { scaleX: 0.86, opacity: 0.7, duration: 2.6, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.8 });
    }
  });
  if (!reduz) {
    gsap.to(".onda-1", { attr: { d: "M820 0c80 160 0 280 140 400s320 40 340 240 160 260 160 260h300V0z" }, duration: 6, ease: "sine.inOut", yoyo: true, repeat: -1 });
    gsap.to(".onda-2", { attr: { d: "M1040 0c20 140-60 240 60 350s240 60 260 230 100 320 100 320h300V0z" }, duration: 7.5, ease: "sine.inOut", yoyo: true, repeat: -1 });
    gsap.to(".fz-hero__freezer", { yPercent: -14, ease: "none", scrollTrigger: { trigger: ".fz-hero", start: "top top", end: "bottom top", scrub: true } });
  }

  // Passo a passo: a linha "escorre" e acende cada etapa
  const linha = document.querySelector(".etapas__linha path");
  const etapas = gsap.utils.toArray(".etapa");
  if (linha) {
    gsap.set(linha, { strokeDasharray: 1000, strokeDashoffset: 1000 });
    gsap.to(linha, {
      strokeDashoffset: 0,
      ease: "none",
      scrollTrigger: {
        trigger: ".etapas",
        start: "top 70%",
        end: "bottom 55%",
        scrub: 0.5,
        onUpdate: (st) => etapas.forEach((e, i) => e.classList.toggle("ativo", st.progress >= i / (etapas.length - 1) - 0.02)),
      },
    });
  }
  if (window.innerWidth <= 900) {
    etapas.forEach((e) => ScrollTrigger.create({ trigger: e, start: "top 70%", onEnter: () => e.classList.add("ativo") }));
  }

  // Formulário de contratação em etapas -> mensagem completa no WhatsApp
  formularioContratacao();
})();

function formularioContratacao() {
  const t = window.t;
  const form = document.getElementById("form-contrato");
  if (!form) return;
  const etapas = [...form.querySelectorAll(".etapa-form")];
  const passosLado = [...document.querySelectorAll(".contrato__passos li")];
  const barra = document.querySelector(".contrato__progresso span");
  const erro = form.querySelector(".contrato__erro");
  const nav = form.querySelector("[data-navegacao]");
  const btVoltar = form.querySelector("[data-voltar]");
  const btAvancar = form.querySelector("[data-avancar]");
  const TOTAL = 3;
  let atual = 0;
  let linkFinal = "";

  // Máscaras
  const mascaras = {
    telefone: (v) => {
      const d = v.replace(/\D/g, "").slice(0, 11);
      if (d.length <= 2) return d.length ? `(${d}` : "";
      if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
      if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
      return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7)}`;
    },
    cnpj: (v) => {
      const d = v.replace(/\D/g, "").slice(0, 14);
      return d.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
    },
  };
  form.querySelectorAll("[data-mascara]").forEach((inp) => inp.addEventListener("input", () => (inp.value = mascaras[inp.dataset.mascara](inp.value))));
  form.addEventListener("input", (e) => {
    e.target.removeAttribute("aria-invalid");
    e.target.closest(".opcoes, .aceite")?.classList.remove("invalido");
    erro.textContent = "";
  });

  function validar(i) {
    const etapa = etapas[i];
    let ok = true;
    let primeiro = null;
    etapa.querySelectorAll("input[required], select[required]").forEach((c) => {
      let valido = c.type === "checkbox" ? c.checked : c.value.trim() !== "";
      if (valido && c.name === "whatsapp") valido = c.value.replace(/\D/g, "").length >= 10;
      if (valido && c.type === "email" && c.value) valido = c.checkValidity();
      if (!valido) {
        ok = false;
        primeiro ||= c;
        if (c.type === "checkbox") c.closest(".aceite")?.classList.add("invalido");
        else c.setAttribute("aria-invalid", "true");
      }
    });
    const email = etapa.querySelector('input[type="email"]');
    if (email && email.value && !email.checkValidity()) { ok = false; primeiro ||= email; email.setAttribute("aria-invalid", "true"); }
    etapa.querySelectorAll("[data-grupo-obrigatorio]").forEach((g) => {
      if (!g.querySelector("input:checked")) { ok = false; g.classList.add("invalido"); primeiro ||= g.querySelector("input"); }
    });
    if (!ok) {
      erro.textContent = t("Confira os campos destacados para continuar.");
      gsap.fromTo(".contrato__card", { x: -8 }, { x: 0, duration: 0.6, ease: "elastic.out(1, .3)" });
      primeiro?.focus({ preventScroll: true });
    }
    return ok;
  }

  function mostrar(i, direcao = 1) {
    const antes = etapas[atual];
    const depois = etapas[i];
    atual = i;
    gsap.to(antes, {
      opacity: 0, x: -30 * direcao, duration: 0.25, ease: "power2.in",
      onComplete: () => {
        antes.classList.remove("ativa");
        gsap.set(antes, { clearProps: "all" });
        depois.classList.add("ativa");
        gsap.fromTo(depois, { opacity: 0, x: 30 * direcao }, { opacity: 1, x: 0, duration: 0.6, ease: "expo.out" });
        const campos = depois.querySelectorAll(".campo, .aceite");
        if (campos.length) gsap.fromTo(campos, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "expo.out", stagger: 0.03 });
        depois.querySelector("input:not([type=radio]):not([type=checkbox]), select")?.focus({ preventScroll: true });
      },
    });
    const fim = i >= TOTAL;
    barra.style.transform = `scaleX(${fim ? 1 : (i + 1) / TOTAL})`;
    passosLado.forEach((li, k) => { li.classList.toggle("ativo", k === i); li.classList.toggle("feito", k < i); });
    nav.hidden = fim;
    btVoltar.hidden = i === 0;
    btAvancar.innerHTML = t(i === TOTAL - 1 ? "Enviar pelo WhatsApp" : "Continuar") +
      ' <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
    if (window.miletoLenis) window.miletoLenis.scrollTo("#quero", { offset: -20, duration: 0.9 });
  }

  function mensagem() {
    const d = new FormData(form);
    const v = (k) => (d.get(k) || "").toString().trim() || "—";
    return [
      "Olá, Miletto! Quero contratar um freezer para o meu estabelecimento.",
      "",
      "*Contato*",
      `Nome: ${v("nome")} (${v("funcao")})`,
      `WhatsApp: ${v("whatsapp")}`,
      `E-mail: ${v("email")}`,
      `Melhor horário: ${v("contato")}`,
      "",
      "*Estabelecimento*",
      `Nome: ${v("negocio")}`,
      `CNPJ: ${v("cnpj")}`,
      `Tipo: ${v("tipo")}`,
      `Endereço: ${v("endereco")} — ${v("bairro")}, ${v("cidade")}`,
      `Referência: ${v("referencia")}`,
      `Funcionamento: ${v("horario")}`,
      "",
      "*Espaço e interesse*",
      `Espaço para o freezer: ${v("espaco")}`,
      `Tomada próxima: ${v("tomada")}`,
      `Produtos: ${d.getAll("produtos").join(", ") || "—"}`,
      `Observações: ${v("obs")}`,
    ].join("\n");
  }

  btAvancar.addEventListener("click", () => {
    if (!validar(atual)) return;
    if (atual < TOTAL - 1) return mostrar(atual + 1, 1);
    linkFinal = window.linkWhatsApp(mensagem());
    document.getElementById("reabrir-whats").href = linkFinal;
    window.open(linkFinal, "_blank", "noopener");
    mostrar(TOTAL, 1);
    gsap.fromTo(".contrato__ok img", { scale: 0, rotate: -30 }, { scale: 1, rotate: 0, duration: 1.2, ease: "elastic.out(1, .5)", delay: 0.3 });
  });
  btVoltar.addEventListener("click", () => atual > 0 && mostrar(atual - 1, -1));
  form.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") { e.preventDefault(); btAvancar.click(); }
  });
  document.getElementById("novo-pedido").addEventListener("click", () => { form.reset(); mostrar(0, -1); });
}
