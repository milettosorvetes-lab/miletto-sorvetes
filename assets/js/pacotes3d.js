/* Versão 2: pacotes reais em 3D. Na capa, o nome em 3D fica no alto e os pacotes em leque embaixo; na seção de sabores, um por vez desliza preso à rolagem.
   Sem WebGL, sem internet para o three.js ou com movimento reduzido, os sabores viram uma lista com as fotos dos pacotes. */

const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const palcoCapa = document.querySelector('[data-palco="capa"]');
const palcoSabores = document.querySelector('[data-palco="sabores"]');
const secaoSabores = document.querySelector(".flavors");
const fls = [...document.querySelectorAll(".fl")];
const pontos = [...document.querySelectorAll(".flavors__pontos i")];

const toque = window.matchMedia("(hover: none), (pointer: coarse)").matches;
const sorteio = (a, b) => a + Math.random() * (b - a);
const suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// Ordem igual à do HTML. Cores tiradas de cada embalagem; "A" é a altura do pacote em relação à largura
const SABORES = [
  { arq: "pistache", A: 2.58, fundo: "#d9bd80", tx: "#3a1a10", gig: "rgba(116,37,11,.22)", itens: ["pist4", "pist1", "fruta2", "folha1", "nut1", "pist5", "fruta1", "folha3"] },
  { arq: "leitinho", A: 2.26, fundo: "#4a2a94", tx: "#f6e9d0", gig: "rgba(255,255,255,.14)", itens: ["fruta2", "fruta1", "folha2", "branco1", "fruta2", "folha4", "fruta1", "branco1"] },
  { arq: "limao", A: 2.4, fundo: "#b4d65a", tx: "#20390a", gig: "rgba(255,255,255,.4)", itens: ["lima1", "folha1", "lima1", "folha3", "lima1", "folha2", "lima1", "folha4"] },
  { arq: "chocolate", A: 2.29, fundo: "#3c1c11", tx: "#f3d9a2", gig: "rgba(232,170,75,.14)", itens: ["choc1", "choc1", "branco1", "choc1", "choc1", "folha4", "choc1", "choc1"] },
  { arq: "trufado", A: 2.24, fundo: "#f1dfba", tx: "#5b1d10", gig: "rgba(116,37,11,.14)", itens: ["branco1", "choc1", "branco1", "folha3", "branco1", "choc1", "branco1", "choc1"] },
];
// Silhueta dos pacotes: selo largo nas pontas, corpo mais estreito
const LARGURAS = [0.986, 0.96, 0.888, 0.847, 0.836, 0.828, 0.825, 0.823, 0.823, 0.823, 0.825, 0.851, 0.959, 0.981];
const largura = (v) => {
  const p = Math.min(0.9999, v) * (LARGURAS.length - 1), i = Math.floor(p);
  return LARGURAS[i] + (LARGURAS[i + 1] - LARGURAS[i]) * (p - i);
};

const semTres = () => document.documentElement.classList.add("sem3d");
// Abrir o site com ?diag mostra na tela por que o 3D rodou ou não, para conferir em um celular de verdade
const diagnostico = (texto) => {
  if (!new URLSearchParams(location.search).has("diag")) return;
  const c = document.createElement("canvas"), gl = c.getContext("webgl2") || c.getContext("webgl");
  const d = document.createElement("pre");
  d.style.cssText = "position:fixed;left:8px;right:8px;top:90px;z-index:9999;margin:0;padding:10px;background:#000;color:#fff;font:12px monospace;white-space:pre-wrap";
  d.textContent = `${texto}\nmovimento reduzido: ${reduz}\ntoque: ${toque}\nwebgl: ${!!gl}\ntela: ${innerWidth}x${innerHeight} @${devicePixelRatio}\n${navigator.userAgent}`;
  document.body.append(d);
};
const nomesItens = ["pist1", "pist4", "pist5", "nut1", "fruta1", "fruta2", "folha1", "folha2", "folha3", "folha4", "choc1", "branco1", "lima1"];

if (reduz) {
  semTres();
  diagnostico("sem 3D: movimento reduzido");
  document.querySelectorAll(".fl").forEach((f, i) => { f.style.background = SABORES[i].fundo; f.style.setProperty("--tx", SABORES[i].tx); f.style.setProperty("--gig", SABORES[i].gig); });
} else {
  // Só monta o 3D depois do loader: preparar a cena trava a tela, e a animação de entrada engasgaria
  Promise.all([import("three"), import("three/addons/environments/RoomEnvironment.js"), import("three/addons/loaders/SVGLoader.js"), import("three/addons/utils/BufferGeometryUtils.js")])
    .then((modulos) => window.miletoPronto.then(() => modulos))
    .then(([THREE, { RoomEnvironment }, { SVGLoader }, { mergeVertices }]) => iniciar(THREE, RoomEnvironment, SVGLoader, mergeVertices))
    .catch((e) => {
      console.warn("3D indisponível, usando as fotos:", e);
      diagnostico(`sem 3D: ${e && e.message}`);
      window.miletoPronto.then(window.miletoEscreverSvg);
      semTres();
      fls.forEach((f, i) => { f.style.background = SABORES[i].fundo; f.style.setProperty("--tx", SABORES[i].tx); f.style.setProperty("--gig", SABORES[i].gig); });
    });
}

async function iniciar(THREE, RoomEnvironment, SVGLoader, mergeVertices) {
  const carregador = new THREE.TextureLoader();
  const carrega = (url) => carregador.loadAsync(url).then((t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; });

  const [frentes, versos, itens] = await Promise.all([
    Promise.all(SABORES.map((s) => carrega(`assets/img/pacotes/${s.arq}.webp`))),
    Promise.all(SABORES.map((s) => carrega(`assets/img/pacotes/${s.arq}-verso.webp`))),
    Promise.all(nomesItens.map((n) => carrega(`assets/img/3d/${n}.webp`))),
  ]);
  const texItem = Object.fromEntries(nomesItens.map((n, i) => [n, itens[i]]));

  // Rugas do filme metalizado, compartilhadas por todos os pacotes
  const rugas = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 512;
    const x = c.getContext("2d");
    x.fillStyle = "#808080"; x.fillRect(0, 0, 512, 512);
    x.filter = "blur(1.5px)";
    for (let i = 0; i < 420; i++) {
      x.strokeStyle = Math.random() > 0.5 ? "rgba(255,255,255,.16)" : "rgba(0,0,0,.16)";
      x.lineWidth = sorteio(0.6, 2.4);
      x.beginPath();
      const px = sorteio(0, 512), py = sorteio(0, 512), a = sorteio(0, 6.28), t = sorteio(20, 110);
      x.moveTo(px, py); x.lineTo(px + Math.cos(a) * t, py + Math.sin(a) * t);
      x.stroke();
    }
    return new THREE.CanvasTexture(c);
  })();

  // Selos das pontas mais metálicos e polidos que o corpo: verde = rugosidade, azul = metal
  const mapaFilme = (() => {
    const c = document.createElement("canvas"); c.width = 4; c.height = 256;
    const x = c.getContext("2d"), g = x.createLinearGradient(0, 0, 0, 256);
    const selo = "rgb(0,50,240)", corpo = "rgb(0,97,107)";
    [[0, selo], [0.07, selo], [0.1, corpo], [0.9, corpo], [0.93, selo], [1, selo]].forEach(([p, cor]) => g.addColorStop(p, cor));
    x.fillStyle = g; x.fillRect(0, 0, 4, 256);
    return new THREE.CanvasTexture(c);
  })();

  const COLS = 56, LINS = 96;
  function folha(A, lado, FUNDO) {
    const g = new THREE.PlaneGeometry(1, 1, COLS, LINS), p = g.attributes.position;
    for (let lin = 0, n = 0; lin <= LINS; lin++) for (let col = 0; col <= COLS; col++, n++) {
      const u = col / COLS, v = lin / LINS;
      const bojo = suave(0.035, 0.2, v) * suave(0.965, 0.8, v);
      const secao = Math.pow(Math.max(0, 1 - (2 * u - 1) ** 2), 0.55);
      const franzido = Math.exp(-(((v - 0.09) / 0.055) ** 2)) + Math.exp(-(((v - 0.91) / 0.055) ** 2));
      let z = FUNDO * bojo * secao;
      z += franzido * 0.012 * secao * Math.sin(u * 46 + 9 * Math.sin(u * 7 + lado));
      z += 0.004 * bojo * Math.sin(u * 17 + v * 31 + lado) * Math.sin(v * 23 - u * 11);
      if (lado < 0) z += 0.012 * bojo * Math.exp(-(((u - 0.5) / 0.022) ** 2)); // emenda do verso
      const dente = (lin === 0 ? 1 : lin === LINS ? -1 : 0) * 0.012 * (col % 2 ? 1 : 0);
      p.setXYZ(n, (u - 0.5) * largura(v) * lado, (0.5 - v) * A + dente, Math.max(z, 0.0015) * lado);
    }
    g.computeVertexNormals();
    return g;
  }
  const geos = new Map();
  const geoDe = (A, fundo) => { const k = `${A}-${fundo}`; if (!geos.has(k)) geos.set(k, [folha(A, 1, fundo), folha(A, -1, fundo)]); return geos.get(k); };

  function criarPacote(i, fundo = 0.17) {
    const grupo = new THREE.Group(), [gf, gv] = geoDe(SABORES[i].A, fundo);
    const mat = (map) => new THREE.MeshStandardMaterial({ map, metalness: 1, roughness: 1, metalnessMap: mapaFilme, roughnessMap: mapaFilme, bumpMap: rugas, bumpScale: 0.5, envMapIntensity: 0.9 });
    grupo.add(new THREE.Mesh(gf, mat(frentes[i])), new THREE.Mesh(gv, mat(versos[i])));
    return grupo;
  }

  function criarItem(nome, tam) {
    const t = texItem[nome], asp = t.image.width / t.image.height;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, toneMapped: false, depthWrite: false, rotation: sorteio(-0.8, 0.8) }));
    s.scale.set(asp > 1 ? tam : tam * asp, asp > 1 ? tam / asp : tam, 1);
    s.userData = { fase: sorteio(0, 6), base: s.scale.clone() };
    return s;
  }

  function criarPalco(el) {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, toque ? 1.5 : 2)); // celular: troca nitidez por fluidez
    renderer.toneMapping = THREE.NeutralToneMapping;
    el.prepend(renderer.domElement);
    const cena = new THREE.Scene();
    cena.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
    cena.environmentIntensity = 0.85;
    const sol = new THREE.DirectionalLight(0xfff4e0, 1.3);
    sol.position.set(-2, 3, 4);
    cena.add(sol);
    const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 60);
    const palco = { el, renderer, cena, camera, aoAjustar: null };
    const ajustar = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      palco.aoAjustar?.(w / h);
    };
    new ResizeObserver(ajustar).observe(el);
    palco.ajustar = ajustar;
    return palco;
  }
  const distancia = (camera, altura) => altura / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));

  let mouseX = 0, mouseY = 0, mx = 0, my = 0;
  window.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    mouseX = gsap.utils.clamp(-1, 1, (e.clientX / innerWidth - 0.5) * 2);
    mouseY = gsap.utils.clamp(-1, 1, (e.clientY / innerHeight - 0.5) * 2);
  }, { passive: true });

  /* ---------- Inclinação do celular: move a capa; só existe em sites https ---------- */
  const sensor = { ativo: false, x: 0, y: 0, alvoX: 0, alvoY: 0, baseX: null, baseY: 0 };
  const aoInclinar = (e) => {
    if (e.gamma == null || e.beta == null) return;
    const ang = (screen.orientation && screen.orientation.angle) || 0;
    // Em pé, gama é esquerda-direita e beta frente-trás; deitado, eles trocam de papel
    const lado = ang === 90 ? e.beta : ang === 270 ? -e.beta : e.gamma;
    const frente = ang === 90 ? -e.gamma : ang === 270 ? e.gamma : e.beta;
    if (sensor.baseX === null) { sensor.baseX = lado; sensor.baseY = frente; }
    // A posição "de repouso" acompanha devagar a mão de quem segura, para o pacote voltar ao centro
    sensor.baseX += (lado - sensor.baseX) * 0.006;
    sensor.baseY += (frente - sensor.baseY) * 0.006;
    sensor.alvoX = gsap.utils.clamp(-1.8, 1.8, (lado - sensor.baseX) / 16);
    sensor.alvoY = gsap.utils.clamp(-1.2, 1.2, (frente - sensor.baseY) / 16);
    sensor.ativo = true;
  };
  if (toque && window.isSecureContext && "DeviceOrientationEvent" in window) {
    const pedir = DeviceOrientationEvent.requestPermission;
    if (typeof pedir !== "function") window.addEventListener("deviceorientation", aoInclinar, { passive: true }); // Android
    else {
      // iPhone: só libera o sensor depois de um toque de quem visita
      const botao = document.querySelector(".capa__mover");
      botao.hidden = false;
      const aoTocar = () => DeviceOrientationEvent.requestPermission().then((r) => {
        window.removeEventListener("click", aoTocar);
        botao.hidden = true;
        if (r === "granted") window.addEventListener("deviceorientation", aoInclinar, { passive: true });
      }).catch(() => {}); // sem gesto válido: tenta de novo no próximo toque
      window.addEventListener("click", aoTocar);
    }
  }

  /* ---------- Capa: nome em 3D no alto, pacotes em leque embaixo, sombras no chão ---------- */
  const capa = criarPalco(palcoCapa);
  const svgLogo = document.getElementById("logo-hero");

  // O nome vem dos glifos do logo oficial e é escrito à mão já em 3D: cada letra tem uma máscara
  // desenhada num canvas, seguindo o traço central dela, e o que a máscara não cobriu ainda não aparece
  const nome = new THREE.Group();
  nome.visible = false;
  capa.cena.add(nome);
  const matNome = new THREE.MeshPhysicalMaterial({ color: 0xa00c0a, roughness: 0.4, clearcoat: 0.45, clearcoatRoughness: 0.14, envMapIntensity: 0.22, specularIntensity: 0.45 });
  const svgLoader = new SVGLoader();
  const { glyphs, strokes } = window.MILETTO_LOGO;
  const glifos = glyphs.map((d, i) => {
    const c = document.createElement("canvas"); c.width = 820; c.height = 310;
    const ctx = c.getContext("2d");
    ctx.scale(0.5, 0.5); ctx.translate(-120, -240); // viewBox do logo
    ctx.strokeStyle = "#fff"; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = strokes[i].w + 14;
    const tex = new THREE.CanvasTexture(c);
    const mat = matNome.clone();
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.mascara = { value: tex };
      sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec2 vMascara;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvMascara = vec2((position.x + 820.0) / 1640.0, 0.5 - position.y / 620.0);");
      sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nuniform sampler2D mascara;\nvarying vec2 vMascara;").replace("#include <clipping_planes_fragment>", "#include <clipping_planes_fragment>\nif (texture2D(mascara, vMascara).r < 0.5) discard;");
    };
    mat.customProgramCacheKey = () => "nome-mascara";
    const malhas = [];
    svgLoader.parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`).paths.forEach((caminho) => SVGLoader.createShapes(caminho).forEach((forma) => {
      let g = new THREE.ExtrudeGeometry(forma, { depth: 26, curveSegments: 18, bevelEnabled: true, bevelThickness: 17, bevelSize: 10, bevelOffset: -7, bevelSegments: 8 });
      g.deleteAttribute("uv"); g.deleteAttribute("normal");
      g = mergeVertices(g, 0.01);
      g.translate(-940, -550, -13); // centro do viewBox do logo
      g.computeVertexNormals();
      const m = new THREE.Mesh(g, mat);
      malhas.push(m);
      nome.add(m);
    }));
    const medidor = document.createElementNS("http://www.w3.org/2000/svg", "path");
    medidor.setAttribute("d", strokes[i].d);
    return { ctx, tex, mat, malhas, traco: new Path2D(strokes[i].d), L: medidor.getTotalLength(), p: 0 };
  });
  const pintaMascara = (gl) => {
    gl.ctx.clearRect(120, 240, 1640, 620);
    if (gl.p > 0) { // traço de tamanho zero com ponta redonda desenharia um pingo antes da hora
      gl.ctx.setLineDash([gl.L * gl.p, gl.L + 1]);
      gl.ctx.stroke(gl.traco);
    }
    gl.tex.needsUpdate = true;
  };
  glifos.forEach(pintaMascara);

  const COLOCA = [
    { i: 2, x: -2.2, y: -0.14, z: 0.05, rz: 0.2, ry: 0.3 },
    { i: 0, x: -0.75, y: 0.16, z: 0.3, rz: 0.03, ry: 0.1 },
    { i: 1, x: 0.75, y: 0, z: 0.42, rz: -0.03, ry: -0.1 },
    { i: 3, x: 2.2, y: -0.04, z: 0.15, rz: -0.13, ry: -0.3 },
  ];
  const texSombra = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const x = c.getContext("2d"), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(70,38,12,.55)"); g.addColorStop(0.55, "rgba(70,38,12,.2)"); g.addColorStop(1, "rgba(70,38,12,0)");
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const noLeque = COLOCA.map((c, n) => {
    const p = criarPacote(c.i, toque ? 0.26 : 0.17);
    p.scale.setScalar(1.13);
    capa.cena.add(p);
    const sombra = new THREE.Sprite(new THREE.SpriteMaterial({ map: texSombra, depthWrite: false, depthTest: false }));
    sombra.renderOrder = -1;
    capa.cena.add(sombra);
    return { ...c, p, sombra, fase: n * 1.4 };
  });

  // Folhas em primeiro plano ficam desfocadas, como numa foto de produto
  const desfoca = (nomeTex) => {
    const img = texItem[nomeTex].image, c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const x = c.getContext("2d");
    x.filter = "blur(7px)";
    x.drawImage(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return (texItem[nomeTex + "-blur"] = t, nomeTex + "-blur");
  };
  // x, y, z, tamanho, aparece no celular
  const ITENS_CAPA = [["pist4", -3.75, -0.25, 0.3, 0.52, 1], ["fruta2", -2.5, 0.42, 0.5, 0.26, 0], ["nut1", -0.02, 0.62, 0.7, 0.15, 1], ["pist1", 1.3, 0.52, 0.5, 0.42, 1], ["lima1", 3.65, 0.05, 0.3, 0.5, 1], ["fruta1", 3.5, -1.25, 0.4, 0.3, 1], ["choc1", -3.45, -1.2, 0.2, 0.24, 0], [desfoca("folha2"), 4.35, 0.75, 1.2, 0.72, 0], [desfoca("folha3"), -3.9, -2.15, 1.3, 0.8, 1]];
  const itensCapa = ITENS_CAPA.map(([n, x, y, z, t, cel]) => {
    const s = criarItem(n, t);
    s.position.set(x, y, z);
    s.userData.pos = s.position.clone();
    s.userData.noCelular = cel;
    capa.cena.add(s);
    return s;
  });

  let fatorZ = 1, centroY = -1, fatorX = 1, alturaCapa = 6.4, chaoY = -2.42;
  const posicionaNome = () => {
    // Encaixa o nome exatamente onde o SVG está, para a troca não dar pulo
    const r = svgLogo.getBoundingClientRect(), pal = palcoCapa.getBoundingClientRect();
    const k = alturaCapa / pal.height, topo = r.top - pal.top - (gsap.getProperty(svgLogo, "y") || 0);
    const esc = (r.width * k) / 1640;
    nome.userData.esc = esc;
    nome.userData.base = new THREE.Vector3((r.left - pal.left + r.width / 2 - pal.width / 2) * k, -(topo + r.height / 2 - pal.height / 2) * k, 0);
  };
  capa.aoAjustar = (asp) => {
    const estreito = asp < 0.85;
    alturaCapa = estreito ? Math.max(8.2, 3.9 / asp) : Math.max(6.4, 11 / asp);
    centroY = estreito ? -0.95 : -0.98;
    chaoY = centroY - 1.62;
    fatorX = estreito ? 0.5 : 1;
    fatorZ = estreito ? 2.4 : 1; // sobrepostos e mais gordinhos: mais distância para um não atravessar o outro
    itensCapa.forEach((s) => { s.visible = !estreito || !!s.userData.noCelular; s.userData.fatorX = estreito ? 0.42 : 1; s.userData.sobe = estreito ? 0.5 : 0; });
    capa.camera.position.set(0, 0, distancia(capa.camera, alturaCapa));
    posicionaNome();
  };

  const estadoCapa = { entrada: 0, saida: 0, assenta: 0 };
  ScrollTrigger.create({ trigger: ".capa", start: "top top", end: "bottom top", scrub: 0.5, onUpdate: (st) => { estadoCapa.saida = st.progress; } });
  gsap.to(estadoCapa, { entrada: 1, duration: 1.6, ease: "expo.out", delay: 0.2 });

  // Mesma velocidade da escrita do logo plano
  const VELOCIDADE = 4200, PAUSA = 0.015;
  const escreveNome = () => {
    posicionaNome();
    nome.visible = true;
    const tl = gsap.timeline({ onComplete: () => {
      // Terminou: tira as máscaras, que não servem mais, e o nome fica inteiro
      glifos.forEach((gl) => { gl.malhas.forEach((m) => { m.material = matNome; }); gl.mat.dispose(); gl.tex.dispose(); });
      window.miletoAposNome();
    } });
    glifos.forEach((gl) => tl.to(gl, { p: 1, duration: Math.max(0.09, gl.L / VELOCIDADE), ease: "power1.inOut", onUpdate: () => pintaMascara(gl) }, `>${PAUSA}`));
    tl.to(estadoCapa, { assenta: 1, duration: 0.25, ease: "sine.out", yoyo: true, repeat: 1 });
  };

  function quadroCapa(tempo) {
    const cx = sensor.ativo ? sensor.x + dedo.x : mx, cy = sensor.ativo ? sensor.y : my;
    const { entrada, saida, assenta } = estadoCapa;
    const u = nome.userData;
    if (nome.visible && u.base) {
      nome.position.set(u.base.x + cx * 0.05, u.base.y - cy * 0.04 + saida * 1.1 + Math.sin(tempo * 0.7) * 0.012, 0);
      nome.rotation.set(cy * 0.05, cx * 0.09, 0);
      const e = u.esc * (1 + assenta * 0.018);
      nome.scale.set(e, -e, e);
    }
    noLeque.forEach((n, k) => {
      const dentro = gsap.utils.clamp(0, 1, entrada * 1.5 - k * 0.12);
      const x = n.x * fatorX * (1 + saida * 0.3) + cx * (0.08 + n.z * 0.1);
      const flutua = Math.sin(tempo * 0.9 + n.fase) * 0.05;
      n.p.position.set(x, centroY + n.y + (1 - dentro) * -6 + flutua - cy * 0.06 + saida * (k % 2 ? 1.4 : 0.8), n.z * fatorZ);
      n.p.rotation.set(0.04 + cy * 0.12, n.ry + cx * 0.32 + saida * (k < 2 ? -1.5 : 1.5) + (1 - dentro) * 2.4, n.rz + Math.sin(tempo * 0.6 + n.fase) * 0.02);
      // A sombra encolhe quando o pacote sobe, como um objeto flutuando sobre o chão
      const forca = dentro * (1 - saida * 1.6) * (1 - flutua * 1.2);
      n.sombra.position.set(x, chaoY, -0.5);
      n.sombra.scale.set(1.55 * Math.max(0.3, forca), 0.26 * Math.max(0.3, forca), 1);
      n.sombra.material.opacity = Math.max(0, forca);
    });
    itensCapa.forEach((s) => {
      const v = s.userData;
      s.position.x = v.pos.x * (v.fatorX ?? 1) * (1 + saida * 0.4) + cx * (0.12 + v.pos.z * 0.22);
      s.position.y = v.pos.y + (v.sobe ?? 0) + Math.sin(tempo * 0.8 + v.fase) * 0.05 - cy * 0.07 + saida * 1.2;
      s.material.rotation += 0.0008;
      s.scale.copy(v.base).multiplyScalar(Math.min(1, entrada));
    });
    capa.renderer.render(capa.cena, capa.camera);
  }

  /* ---------- Sabores: a rolagem troca o sabor, com um pacote subindo e o próximo vindo de baixo ---------- */
  const sabores = criarPalco(palcoSabores);
  const pacotes = SABORES.map((_, i) => { const p = criarPacote(i, toque ? 0.3 : 0.24); p.visible = false; sabores.cena.add(p); // mais gordinhos: giram e mostram a lateral
    return p; });
  // Oito ingredientes por sabor, em posições fixas em volta do pacote
  // Nenhum fica no canto inferior direito, onde está o texto
  const ANEL = [[-2.1, 1.0, 0.3, 0.5], [1.7, 1.15, -0.3, 0.46], [-2.75, -0.15, -0.3, 0.62], [2.7, 0.6, 0.4, 0.4], [-1.65, -1.15, 0.4, 0.46], [1.3, 0.3, 0.3, 0.3], [-0.95, 1.45, -0.4, 0.32], [-2.65, -1.3, 0.2, 0.3]];
  const conjuntos = SABORES.map((s) => s.itens.map((nome, k) => {
    const [x, y, z, t] = ANEL[k], it = criarItem(nome, t);
    it.visible = false;
    it.userData.pos = new THREE.Vector3(x, y, z);
    sabores.cena.add(it);
    return it;
  }));
  let fatorSabor = 1;
  sabores.aoAjustar = (asp) => {
    const retrato = asp < 1;
    fatorSabor = retrato ? 0.42 : 1;
    // No retrato a câmera desce: o pacote sobe e deixa espaço para o texto
    sabores.camera.position.set(0, retrato ? -0.42 : 0, distancia(sabores.camera, retrato ? 4.4 : 3.7));
  };

  let progresso = 0;
  const N = SABORES.length;
  const mistura = (a, b, t) => gsap.utils.interpolate(a, b, t);

  function aplicaSabor() {
    const p = progresso * (N - 1), a = Math.floor(p), b = Math.min(N - 1, a + 1), t = suave(0.44, 0.56, p - a); // troca rápida: misturar cores opostas devagar deixaria o fundo cinza
    secaoSabores.style.background = mistura(SABORES[a].fundo, SABORES[b].fundo, t);
    const ativo = Math.round(p);
    secaoSabores.style.setProperty("--tx-pontos", SABORES[ativo].tx);
    fls.forEach((f, i) => {
      const d = p - i, vis = 1 - suave(0.28, 0.46, Math.abs(d));
      f.style.opacity = vis;
      f.style.visibility = vis > 0.01 ? "visible" : "hidden";
      f.style.pointerEvents = vis > 0.5 ? "" : "none";
      f.style.setProperty("--tx", SABORES[i].tx);
      f.style.setProperty("--gig", SABORES[i].gig);
      f.querySelector(".fl__gigante").style.transform = `translateX(${-d * 28}vw)`;
      f.querySelector(".fl__info").style.transform = `translateY(${d * 60}px)`;
    });
    pontos.forEach((d, i) => d.classList.toggle("on", i === ativo));
  }

  function quadroSabores(tempo) {
    const p = progresso * (N - 1);
    pacotes.forEach((g, i) => {
      const d = p - i, dist = Math.abs(d);
      g.visible = dist < 1.05;
      if (g.visible) {
        // Fica parado no centro por um tempo; o de cima sobe e o próximo vem de baixo
        const e = Math.sign(d) * (dist < 0.5 ? Math.pow(dist * 2, 1.7) / 2 : dist);
        g.position.set(mx * 0.08, Math.sin(tempo * 0.9) * 0.04 + e * (fatorSabor < 1 ? 4.4 : 3.1), 0); // no retrato o próximo fica fora da tela, longe do texto
        // A troca é só o deslize vertical; o mouse ainda inclina o pacote de leve
        g.rotation.set(0.03 + my * 0.14, -0.12 + mx * 0.28 + Math.sin(tempo * 0.5) * 0.08, -0.1 + Math.sin(tempo * 0.6) * 0.015);
      }
    });
    conjuntos.forEach((itensS, i) => {
      const d = p - i, vis = 1 - suave(0.22, 0.46, Math.abs(d));
      itensS.forEach((s) => {
        s.visible = vis > 0.01 && !(fatorSabor < 1 && s.userData.pos.y < -1); // no retrato, os de baixo cobririam o texto
        if (!s.visible) return;
        const u = s.userData, abre = 0.55 + 0.45 * vis;
        s.position.set(u.pos.x * fatorSabor * abre + mx * (0.12 + u.pos.z * 0.25), u.pos.y * abre + Math.sin(tempo * 0.8 + u.fase) * 0.06 - my * 0.08 - d * 1.2, u.pos.z);
        s.scale.copy(u.base).multiplyScalar(vis * (fatorSabor < 1 ? 0.8 : 1));
        s.material.rotation += 0.0012;
      });
    });
    sabores.renderer.render(sabores.cena, sabores.camera);
  }

  ScrollTrigger.create({
    trigger: ".flavors", start: "top top", end: () => "+=" + innerHeight * (N - 1) * 1.1,
    pin: ".flavors__pin", scrub: 0.6, onUpdate: (st) => { progresso = st.progress; aplicaSabor(); },
  });
  // O pin nasce depois das animações de baixo; sem ordenar, elas calculam a posição sem o espaço dele
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
  aplicaSabor();

  /* ---------- Quadro a quadro: cada palco só desenha enquanto está na tela ---------- */
  const noPalco = new Map();
  [[capa, quadroCapa], [sabores, quadroSabores]].forEach(([pl, fn]) => {
    new IntersectionObserver((es) => { noPalco.set(fn, es[0].isIntersecting); }).observe(pl.el);
    pl.ajustar();
  });
  // No celular não há mouse: os pacotes balançam sozinhos, mostrando o volume, e o dedo também os vira
  const dedo = { x: 0, inicio: 0 };
  if (toque) {
    window.addEventListener("touchstart", (e) => { dedo.inicio = e.touches[0].clientX - dedo.x * 90; gsap.killTweensOf(dedo); }, { passive: true });
    window.addEventListener("touchmove", (e) => { dedo.x = gsap.utils.clamp(-2, 2, (e.touches[0].clientX - dedo.inicio) / 90); }, { passive: true });
    window.addEventListener("touchend", () => gsap.to(dedo, { x: 0, duration: 1.2, ease: "power3.out" }), { passive: true });
  }
  const relogio = new THREE.Clock();
  gsap.ticker.add(() => {
    const tempo = relogio.getElapsedTime();
    const alvoX = toque ? Math.sin(tempo * 0.8) * 1.5 + dedo.x : mouseX;
    const alvoY = toque ? Math.sin(tempo * 0.55) * 0.6 : mouseY;
    sensor.x += (sensor.alvoX - sensor.x) * 0.1;
    sensor.y += (sensor.alvoY - sensor.y) * 0.1;
    mx += (alvoX - mx) * 0.08;
    my += (alvoY - my) * 0.08;
    noPalco.forEach((ativo, fn) => { if (ativo) fn(tempo); });
  });
  document.querySelector(".capa__fotos")?.remove();
  escreveNome();
  diagnostico("3D ativo");
}
