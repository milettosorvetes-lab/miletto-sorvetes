/* Onde comprar: mapa por cidade, busca e cidade mais próxima do visitante */
(function () {
  const t = window.t;
  const { total, cidades } = window.MILETTO_ONDE;
  const nomes = Object.keys(cidades);
  const qtd = (c) => cidades[c][3];
  const num = (k, v) => (document.querySelector(`[data-num="${k}"]`).textContent = v);
  num("pontos", total);
  num("cidades", nomes.length);
  num("estados", new Set(nomes.map((c) => cidades[c][2])).size);

  const lista = document.querySelector(".onde__lista");
  const busca = document.querySelector(".onde__busca");
  const msg = document.querySelector(".onde__msg");
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const avisar = (texto) => { msg.hidden = !texto; msg.textContent = texto || ""; };

  const mapa = L.map("mapa", { scrollWheelZoom: false });
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "© OpenStreetMap" }).addTo(mapa);
  const limites = L.latLngBounds(nomes.map((c) => cidades[c].slice(0, 2)));
  mapa.fitBounds(limites, { padding: [20, 20] });
  nomes.forEach((c) => {
    L.circleMarker(cidades[c].slice(0, 2), { radius: 6 + Math.sqrt(qtd(c)) * 1.6, color: "#fff", weight: 2, fillColor: "#a8110f", fillOpacity: 0.88 })
      .addTo(mapa).bindTooltip(`${c} – ${cidades[c][2]}`).on("click", () => abrirCidade(c));
  });

  const linhaCidade = (c) => `<li><button class="onde__item" type="button" data-c="${esc(c)}"><b>${esc(c)} – ${cidades[c][2]}</b><span>${qtd(c)} ${t(qtd(c) > 1 ? "pontos" : "ponto")}</span></button></li>`;
  const linkWhats = (c) => `https://wa.me/${window.MILETTO.whatsapp}?text=${encodeURIComponent(`Olá, Miletto! Onde encontro seus produtos em ${c}?`)}`;

  function listarCidades() {
    const ordem = [...nomes].sort((a, b) => qtd(b) - qtd(a));
    lista.innerHTML = ordem.map(linhaCidade).join("");
  }
  function abrirCidade(c) {
    lista.innerHTML = `<li><button class="onde__item" type="button" data-voltar><b>← ${t("Todas as cidades")}</b></button></li>` + `<li class="onde__ponto"><b>${esc(c)} – ${cidades[c][2]}</b><small>${qtd(c)} ${t(qtd(c) > 1 ? "pontos de venda" : "ponto de venda")}</small></li>` + `<li><a class="onde__ponto" href="${linkWhats(c)}" target="_blank" rel="noopener"><b>${t("Perguntar no WhatsApp onde comprar")}</b><small>${t("A gente indica o ponto mais perto de você.")}</small></a></li>`;
    lista.scrollTop = 0;
    mapa.flyTo(cidades[c].slice(0, 2), 11, { duration: 1 });
  }
  lista.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.hasAttribute("data-voltar")) { listarCidades(); avisar(""); mapa.flyToBounds(limites, { duration: 1 }); }
    else abrirCidade(b.dataset.c);
  });

  busca.addEventListener("input", () => {
    const q = norm(busca.value.trim());
    if (q.length < 2) return listarCidades();
    const achados = nomes.filter((c) => norm(c).includes(q));
    lista.innerHTML = achados.length ? achados.map(linhaCidade).join("") : `<li class="onde__ponto">${t("Nada encontrado. Tente outra cidade ou fale com a gente no WhatsApp.")}</li>`;
  });

  // shortcut: distância até o centro da cidade, não até a loja; geocodificar os endereços daria o ponto exato
  const km = (a, b) => {
    const r = Math.PI / 180;
    const h = Math.sin((b[0] - a[0]) * r / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin((b[1] - a[1]) * r / 2) ** 2;
    return 12742 * Math.asin(Math.sqrt(h));
  };
  document.querySelector(".onde__perto").addEventListener("click", () => {
    if (!navigator.geolocation) return avisar(t("Seu navegador não informa a localização. Escolha sua cidade na lista."));
    avisar(t("Procurando..."));
    navigator.geolocation.getCurrentPosition((pos) => {
      const eu = [pos.coords.latitude, pos.coords.longitude];
      const c = nomes.map((n) => [n, km(eu, cidades[n])]).sort((a, b) => a[1] - b[1])[0];
      avisar(`${t("A Miletto mais perto de você está em")} ${c[0]} (${t("cerca de")} ${Math.round(c[1])} km).`);
      abrirCidade(c[0]);
    }, () => avisar(t("Não foi possível pegar sua localização. Escolha sua cidade na lista.")), { timeout: 10000 });
  });

  listarCidades();
  ScrollTrigger.create({ trigger: "#mapa", start: "top bottom", once: true, onEnter: () => mapa.invalidateSize() });
  window.miletoPronto.then(() => {
    mapa.invalidateSize();
    gsap.fromTo("[data-hero-in]", { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.8, ease: "expo.out", stagger: 0.08 });
  });
})();
