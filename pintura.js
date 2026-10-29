// =====================================================================
//  PINTAR A PERSOCOM (botão "customize persocom", no meio, embaixo dela)
//  A pessoa pinta direto nela com o lápis (desenho da Ana = o cursor), escolhendo a cor no godê do canto.
//  Barra = espessura do lápis · ✓ confirmar (ela dá o giro com glitter) · ↶ voltar o último traço · lixeira = apaga tudo.
//  Arrastando FORA dela, ela gira (dá pra pintar as costas).
//  Zoom: botões + / −, rodinha do mouse (aproxima onde o mouse está) e pinça com dois dedos no celular;
//  com zoom, arrastar com o botão direito (ou com dois dedos) passeia pela tela.
//
//  Como funciona: cada ponto do traço é guardado na posição dela "parada" (pose de descanso), e o traço é desenhado
//  numa textura que cobre o mapa de UV dela (renderizando a malha "aberta" no plano do UV). A distância é medida
//  em 3D, então o traço tem a mesma espessura no corpo todo e passa de uma parte pra outra sem emenda.
//  O main.js chama montarPintura(...) quando ela termina de carregar.
// =====================================================================
import * as THREE from 'three';

const CONFIG_PINTURA = {
  dicaBotao: 'customize persocom',     // aparece ao passar o mouse no botão
  dica: 'pinte ela ✦  arraste fora dela pra girar · rodinha do mouse = zoom',
  zoom: { maximo: 4, passoBotao: 1.5 },   // até quantas vezes aproxima · quanto cada clique no + / − aproxima
  tamanhoTextura: 2048,                // resolução da "pele" de tinta (px)
  // raio do lápis nas medidas dela (ela tem ~9 de altura, da sola ao topo da cabeça)
  espessura: { min: 0.035, max: 0.42, inicial: 0.35 },   // inicial = posição da barra (0 a 1)
  // as tintas do godê: posição do centro de cada uma na imagem (0 a 1) e a cor que pinta
  cores: [
    { nome: 'menta', cor: '#8ff0d4', x: 0.2965, y: 0.1911 },
    { nome: 'verde', cor: '#7fe07a', x: 0.1686, y: 0.3418 },
    { nome: 'amarelo', cor: '#f2e64f', x: 0.0900, y: 0.5100 },
    { nome: 'branco', cor: '#ffffff', x: 0.2695, y: 0.5075 },
    { nome: 'preto', cor: '#2b2b2b', x: 0.4106, y: 0.6668 },
    { nome: 'laranja', cor: '#ff8360', x: 0.0950, y: 0.7000 },
    { nome: 'vermelho', cor: '#ff5c6c', x: 0.2099, y: 0.8415 },
    { nome: 'rosa', cor: '#f47aa8', x: 0.4165, y: 0.8659 },
    { nome: 'roxo', cor: '#8b6ee0', x: 0.5881, y: 0.7676 },
  ],
  corInicial: 6,                       // começa no vermelho
  raioTinta: 0.064,                    // tamanho de cada tinta no godê (fração da largura da imagem)
  maxPontosPorDesenho: 32,             // quantos pontos do traço vão de uma vez pra placa de vídeo
};
const P = CONFIG_PINTURA;

// ícone do botão = o lápis da Ana (o mesmo desenho do cursor do modo pintura), vetorizado pelas medidas dele:
// ponta com grafite, corpo, anel de metal e borracha; cinza com detalhes brancos, inclinado escrevendo
const ICONE_LAPIS = `<svg viewBox="-313 60 860 860" aria-hidden="true">
  <g transform="rotate(-135 117 490)">
    <path fill="currentColor" d="M117 1 L198 197 V795 H36 V197 Z"/>
    <path fill="#fff" d="M100 66 H134 L198 197 H36 Z"/>
    <rect fill="currentColor" x="22" y="803" width="191" height="66" rx="16"/>
    <rect fill="#fff" x="22" y="826" width="191" height="12"/>
    <path fill="currentColor" d="M29 880 H204 V912 C204 950 165 980 116.5 980 C68 980 29 950 29 912 Z"/>
  </g>
</svg>`;
const ICONE_CONFIRMAR = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5 10 17.5 19 7"/></svg>`;
const ICONE_VOLTAR = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5 4.5 9.5 9 14"/><path d="M4.5 9.5H14a5.5 5.5 0 0 1 0 11h-3"/></svg>`;
const ICONE_LUPA = (mais) => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 20 20"/><path d="M7.8 10.5h5.4${mais ? 'M10.5 7.8v5.4' : ''}"/></svg>`;
const ICONE_LIXEIRA = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6 7l1 13h10l1-13"/><path d="M10 11v5.5M14 11v5.5"/></svg>`;

// ---------- o "pincel": desenha os pontos do traço na textura de tinta, com a malha aberta no plano do UV ----------
const SOMBREADOR_UV = {
  vertexShader: /* glsl */`
    uniform vec2 uDesloca;          // empurra a malha uns pixels (pinta a "margem" das ilhas do UV, sem fresta nas emendas)
    uniform vec3 uCentro;           // o traço cabe numa bola (centro + alcance): o que está longe nem é desenhado
    uniform float uAlcance;
    varying vec3 vPos;
    varying vec3 vNor;
    void main() {
      vPos = position;              // posição na pose de descanso
      vNor = normal;
      gl_Position = vec4(uv * 2.0 - 1.0 + uDesloca, 0.0, 1.0);
      // longe do traço: joga o vértice pra fora da textura (o triângulo some e a placa nem pinta os pixels dele).
      // O alcance tem folga bem maior que qualquer triângulo, então nada perto do traço fica de fora.
      if (distance(position, uCentro) > uAlcance) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    }`,
  fragmentShader: /* glsl */`
    #define MAX ${P.maxPontosPorDesenho}
    uniform vec3 uPontos[MAX];
    uniform vec3 uNormais[MAX];
    uniform int uQuantos;
    uniform float uRaio;
    uniform vec3 uCor;
    varying vec3 vPos;
    varying vec3 vNor;
    float distSegmento(vec3 p, vec3 a, vec3 b) {
      vec3 ab = b - a;
      float t = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-8), 0.0, 1.0);
      return length(p - a - ab * t);
    }
    void main() {
      float d = length(vPos - uPontos[0]);
      vec3 n = uNormais[0];
      for (int i = 0; i < MAX - 1; i++) {
        if (i + 1 >= uQuantos) break;
        float di = distSegmento(vPos, uPontos[i], uPontos[i + 1]);
        if (di < d) { d = di; n = uNormais[i]; }
      }
      // só o lado virado pra quem pinta (pintar a frente do vestido não pinta as costas)
      float lado = smoothstep(-0.15, 0.2, dot(normalize(vNor), n));
      float a = (1.0 - smoothstep(uRaio * 0.82, uRaio, d)) * lado;
      if (a <= 0.003) discard;
      gl_FragColor = vec4(uCor * a, a);   // tinta "pré-multiplicada" (o toon do main.js mistura assim)
    }`,
};

export function montarPintura({ renderer, camera, cameraChao, personagem, uniformePintura, girar }) {
  const malhas = personagem.malhasPintaveis;
  if (!malhas.length || !personagem.raiz) return null;
  const T = P.tamanhoTextura;

  // ---------- textura de tinta (começa vazia) ----------
  const alvo = new THREE.WebGLRenderTarget(T, T, {
    depthBuffer: false, generateMipmaps: false,
    minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
  });
  const materialUV = new THREE.ShaderMaterial({
    ...SOMBREADOR_UV,
    uniforms: {
      uDesloca: { value: new THREE.Vector2() },
      uCentro: { value: new THREE.Vector3() },
      uAlcance: { value: 1e9 },
      uPontos: { value: Array.from({ length: P.maxPontosPorDesenho }, () => new THREE.Vector3()) },
      uNormais: { value: Array.from({ length: P.maxPontosPorDesenho }, () => new THREE.Vector3()) },
      uQuantos: { value: 0 },
      uRaio: { value: 0.1 },
      uCor: { value: new THREE.Color() },
    },
    side: THREE.DoubleSide, depthTest: false, depthWrite: false,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
  });
  const cenaUV = new THREE.Scene();
  for (const m of malhas) {
    const aberta = new THREE.Mesh(m.geometry, materialUV);
    aberta.frustumCulled = false;
    cenaUV.add(aberta);
  }
  const cameraUV = new THREE.Camera();
  const _cor = new THREE.Color();
  const _corFundo = new THREE.Color();
  // margem em volta das ilhas do UV (em pixels da textura)
  const DESLOCAMENTOS = [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5], [0, 0]].map(([x, y]) => [x * 2 / T, y * 2 / T]);
  const FOLGA = 1.2;                    // folga do alcance do pincel (nas medidas dela: ~9 de altura)
  const _caixa = new THREE.Box3();

  function usarAlvo(acao) {
    const antes = renderer.getRenderTarget();
    renderer.getClearColor(_corFundo);
    const alfaAntes = renderer.getClearAlpha();
    renderer.setRenderTarget(alvo);
    acao();
    renderer.setRenderTarget(antes);
    renderer.setClearColor(_corFundo, alfaAntes);
  }
  function limparTinta() {
    usarAlvo(() => { renderer.setClearColor(0x000000, 0); renderer.clear(true, false, false); });
  }
  limparTinta();
  uniformePintura.value = alvo.texture;

  // desenha um pedaço de traço (até MAX pontos ligados)
  function desenhar(pontos, cor, raio) {
    const u = materialUV.uniforms;
    pontos.forEach((pt, i) => { u.uPontos.value[i].copy(pt.p); u.uNormais.value[i].copy(pt.n); });
    u.uQuantos.value = pontos.length;
    _caixa.makeEmpty();
    pontos.forEach((pt) => _caixa.expandByPoint(pt.p));
    _caixa.getCenter(u.uCentro.value);
    u.uAlcance.value = _caixa.max.distanceTo(_caixa.min) / 2 + raio + FOLGA;
    u.uRaio.value = raio;
    u.uCor.value.copy(_cor.set(cor));
    usarAlvo(() => {
      for (const [x, y] of DESLOCAMENTOS) {
        u.uDesloca.value.set(x, y);
        renderer.render(cenaUV, cameraUV);
      }
    });
  }
  // um trecho inteiro (em pedaços de MAX pontos, um emendado no outro)
  function desenharTrecho(pts, cor, raio) {
    const M = P.maxPontosPorDesenho;
    for (let i = 0; i < pts.length; i += M - 1) desenhar(pts.slice(i, i + M), cor, raio);
  }
  // traços = [{ cor, raio, trechos: [[{p, n}, ...], ...] }] → "voltar" redesenha tudo menos o último
  const tracos = [];
  function redesenharTudo() {
    limparTinta();
    for (const t of tracos) for (const tr of t.trechos) if (tr.length) desenharTrecho(tr, t.cor, t.raio);
  }

  // ---------- onde o mouse encosta nela → ponto na pose de descanso ----------
  // A malha dela tem ~600 mil vértices: em vez de procurar o triângulo no processador, a placa de vídeo desenha
  // só o pixel embaixo do mouse, com a "cor" = posição (e depois a normal) da pose de descanso naquele ponto.
  const CAMADA_PINTURA = 8;
  malhas.forEach((m) => m.layers.enable(CAMADA_PINTURA));
  const ehFloat = renderer.extensions.has('EXT_color_buffer_float');
  // 2 pixels: o da esquerda guarda a posição e o da direita a normal (antes eram dois desenhos e duas leituras)
  const alvoToque = new THREE.WebGLRenderTarget(2, 1, { type: ehFloat ? THREE.FloatType : THREE.HalfFloatType });
  const novoLido = () => (ehFloat ? new Float32Array(8) : new Uint16Array(8));
  const lido = novoLido();
  const valor = (buf, i) => (ehFloat ? buf[i] : THREE.DataUtils.fromHalfFloat(buf[i]));
  const gl = renderer.getContext();
  const temLeituraSemTravar = !!renderer.readRenderTargetPixelsAsync && renderer.capabilities.isWebGL2;
  const materialToque = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  materialToque.toneMapped = false;
  materialToque.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('void main() {', 'varying vec3 vPosRep;\nvarying vec3 vNorRep;\nvoid main() {')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPosRep = position;\nvNorRep = normal;');
    sh.fragmentShader = sh.fragmentShader
      .replace('void main() {', 'varying vec3 vPosRep;\nvarying vec3 vNorRep;\nvoid main() {')
      .replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor = vec4(gl_FragCoord.x < 1.0 ? vPosRep : normalize(vNorRep), 1.0);');
  };
  const cameraToque = camera.clone();
  // desenha os 2 pixels embaixo do dedo/mouse (só ela, com a "cor" = posição e normal na pose de descanso)
  function desenharToque(e) {
    const cena = personagem.raiz.parent;
    cameraToque.copy(camera);
    cameraToque.layers.set(CAMADA_PINTURA);
    // com zoom, a tela mostra só um pedaço da imagem: o pixel do mouse vira um pedacinho menor da imagem inteira
    const v = camera.view?.enabled ? camera.view : null;
    const fracao = v ? v.width / v.fullWidth : 1;
    const x = Math.floor(e.clientX) * fracao + (v ? v.offsetX : 0);
    const y = Math.floor(e.clientY) * fracao + (v ? v.offsetY : 0);
    cameraToque.setViewOffset(innerWidth, innerHeight, x, y, fracao * 2, fracao);
    const antesOverride = cena.overrideMaterial, antesFundo = cena.background;
    cena.overrideMaterial = materialToque;
    cena.background = null;
    renderer.setRenderTarget(alvoToque);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(cena, cameraToque);
    cena.overrideMaterial = antesOverride;
    cena.background = antesFundo;
  }
  function guardarEstado() {
    renderer.getClearColor(_corFundo);
    return { alvo: renderer.getRenderTarget(), alfa: renderer.getClearAlpha() };
  }
  function voltarEstado(e) {
    renderer.setRenderTarget(e.alvo);
    renderer.setClearColor(_corFundo, e.alfa);
  }
  const pontoDe = (buf, soSaber) => {
    if (valor(buf, 3) <= 0.5) return null;
    if (soSaber) return true;
    return {
      p: new THREE.Vector3(valor(buf, 0), valor(buf, 1), valor(buf, 2)),
      n: new THREE.Vector3(valor(buf, 4), valor(buf, 5), valor(buf, 6)).normalize(),
    };
  };
  // na hora (o começo do traço e o círculo do lápis)
  function pontoSob(e, soSaber = false) {
    const estado = guardarEstado();
    desenharToque(e);
    if (temLeituraSemTravar) gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);   // pode ter uma leitura "sem travar" no meio
    renderer.readRenderTargetPixels(alvoToque, 0, 0, 2, 1, lido);
    voltarEstado(estado);
    return pontoDe(lido, soSaber);
  }
  // sem travar: a placa de vídeo responde no quadro seguinte (no celular, esperar na hora deixava tudo lento)
  function pontoSobDepois(e) {
    if (!temLeituraSemTravar) return Promise.resolve(pontoSob(e));
    const estado = guardarEstado();
    desenharToque(e);
    const buf = novoLido();
    const promessa = renderer.readRenderTargetPixelsAsync(alvoToque, 0, 0, 2, 1, buf);
    voltarEstado(estado);
    return promessa.then(() => pontoDe(buf, false), () => null);
  }

  // =====================================================================
  //  INTERFACE
  // =====================================================================
  // a nuvenzinha "customize persocom" ao lado da cabeça dela (index.html) ganha o lápis da Ana
  const botao = document.querySelector('.nuvem-balao');
  botao.insertAdjacentHTML('afterbegin', ICONE_LAPIS);
  botao.hidden = false;
  requestAnimationFrame(() => botao.classList.add('aparece'));

  const ui = document.createElement('div');
  ui.className = 'pintura';
  ui.hidden = true;
  ui.innerHTML = `
    <p class="pintura-dica">${P.dica}</p>
    <div class="pintura-botoes">
      <button type="button" class="bola pintura-confirmar" data-confirmar title="pronto!" aria-label="confirmar a pintura">${ICONE_CONFIRMAR}</button>
      <button type="button" class="bola pintura-voltar" data-voltar title="voltar o último traço" aria-label="voltar o último traço">${ICONE_VOLTAR}</button>
      <button type="button" class="bola pintura-lixeira" data-lixeira title="apagar tudo" aria-label="apagar toda a pintura">${ICONE_LIXEIRA}</button>
    </div>
    <div class="pintura-zoom">
      <button type="button" class="bola" data-zoom="1" title="aproximar" aria-label="aproximar">${ICONE_LUPA(true)}</button>
      <button type="button" class="bola" data-zoom="-1" title="afastar" aria-label="afastar">${ICONE_LUPA(false)}</button>
    </div>
    <label class="pintura-espessura" title="espessura do lápis">
      <span class="ponto-fino" aria-hidden="true"></span>
      <input type="range" min="0" max="1" step="0.01" value="${P.espessura.inicial}" aria-label="espessura do lápis">
      <span class="ponto-grosso" aria-hidden="true"></span>
    </label>
    <div class="pintura-gode" role="radiogroup" aria-label="cores">
      <img src="pintura/gode.webp" alt="" draggable="false">
      ${P.cores.map((c, i) => `<button type="button" class="tinta" role="radio" aria-checked="false" aria-label="${c.nome}"
        style="left:${c.x * 100}%; top:${c.y * 100}%; --cor:${c.cor}" data-tinta="${i}"></button>`).join('')}
    </div>`;
  document.body.appendChild(ui);

  // o lápis (desenho da Ana) vira o cursor enquanto pinta; a ponta fica com a cor escolhida
  const lapis = document.createElement('div');
  lapis.className = 'cursor-lapis';
  lapis.innerHTML = '<span class="lapis-tamanho"></span><img src="pintura/lapis.webp" alt="" draggable="false"><span class="lapis-ponta"></span>';
  document.body.appendChild(lapis);
  const mouseFino = matchMedia('(pointer: fine)').matches;

  const barra = ui.querySelector('input[type=range]');
  let corAtual = P.cores[P.corInicial].cor;
  const raioAtual = () => P.espessura.min + (P.espessura.max - P.espessura.min) * Math.pow(Number(barra.value), 1.5);
  function escolherCor(i) {
    corAtual = P.cores[i].cor;
    ui.querySelectorAll('.tinta').forEach((b, j) => {
      b.classList.toggle('escolhida', i === j);
      b.setAttribute('aria-checked', i === j);
    });
    document.documentElement.style.setProperty('--cor-lapis', corAtual);
  }
  escolherCor(P.corInicial);
  ui.querySelector('.pintura-gode').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tinta]');
    if (b) escolherCor(Number(b.dataset.tinta));
  });

  // tamanho do círculo em volta da ponta = a espessura de verdade na tela
  const _escalaMundo = new THREE.Vector3();
  function atualizarTamanhoLapis() {
    personagem.raiz.getWorldScale(_escalaMundo);
    const pxPorUnidade = innerHeight / ((camera.top - camera.bottom) / camera.zoom) * zoom.z;
    lapis.style.setProperty('--tamanho', `${Math.max(4, raioAtual() * 2 * _escalaMundo.x * pxPorUnidade)}px`);
  }
  barra.addEventListener('input', () => { atualizarTamanhoLapis(); lapis.classList.add('mostra-tamanho'); });
  barra.addEventListener('change', () => lapis.classList.remove('mostra-tamanho'));

  // ---------- entrar / sair do modo pintura ----------
  // ---------- zoom: um "recorte" da imagem nas duas câmeras (chão e ela), assim ela continua pisando no chão ----------
  // centro = ponto da imagem inteira (0 a 1) que fica no meio da tela
  const zoom = { z: 1, alvo: 1, cx: 0.5, cy: 0.5, alvoCx: 0.5, alvoCy: 0.5 };
  const limitar = THREE.MathUtils.clamp;
  function limitarCentro() {
    const m = 0.5 / zoom.alvo;
    zoom.alvoCx = limitar(zoom.alvoCx, m, 1 - m);
    zoom.alvoCy = limitar(zoom.alvoCy, m, 1 - m);
  }
  // aproxima (fator > 1) ou afasta, mantendo parado o ponto que está embaixo de (sx, sy)
  function zoomEm(fator, sx = innerWidth / 2, sy = innerHeight / 2, base = zoom) {
    const ux = sx / innerWidth - 0.5, uy = sy / innerHeight - 0.5;
    const fx = base.alvoCx + ux / base.alvo, fy = base.alvoCy + uy / base.alvo;
    const novo = limitar(base.alvo * fator, 1, P.zoom.maximo);
    zoom.alvo = novo;
    zoom.alvoCx = fx - ux / novo;
    zoom.alvoCy = fy - uy / novo;
    limitarCentro();
  }
  function aplicarZoom(dt) {
    const antes = zoom.z;
    zoom.z = THREE.MathUtils.damp(zoom.z, zoom.alvo, 12, dt);
    zoom.cx = THREE.MathUtils.damp(zoom.cx, zoom.alvoCx, 12, dt);
    zoom.cy = THREE.MathUtils.damp(zoom.cy, zoom.alvoCy, 12, dt);
    if (zoom.alvo === 1 && zoom.z < 1.002) {
      zoom.z = 1; zoom.cx = zoom.cy = 0.5;
      // só desfaz o zoom que a pintura fez (o "sobre mim" também aproxima a câmera)
      if (zoom.ligado) { camera.clearViewOffset(); cameraChao?.clearViewOffset(); zoom.ligado = false; }
    } else {
      zoom.ligado = true;
      const W = innerWidth, H = innerHeight, w = W / zoom.z, h = H / zoom.z;
      const x = limitar(zoom.cx * W - w / 2, 0, W - w), y = limitar(zoom.cy * H - h / 2, 0, H - h);
      camera.setViewOffset(W, H, x, y, w, h);
      cameraChao?.setViewOffset(W, H, x, y, w, h);
    }
    if (pintando && Math.abs(zoom.z - antes) > 1e-4) atualizarTamanhoLapis();
  }
  ui.querySelector('.pintura-zoom').addEventListener('click', (e) => {
    const b = e.target.closest('[data-zoom]');
    if (b) zoomEm(Number(b.dataset.zoom) > 0 ? P.zoom.passoBotao : 1 / P.zoom.passoBotao);
  });

  let pintando = false;
  const giro = { alvo: 0, atual: 0, base: personagem.raiz.rotation.y };
  function entrar() {
    if (pintando || personagem.girando) return;
    pintando = true;
    personagem.pintando = true;
    scrollTo({ top: 0 });
    document.documentElement.classList.add('travado');
    document.body.classList.add('pintando');
    if (mouseFino) document.documentElement.classList.add('com-lapis');
    ui.hidden = false;
    atualizarTamanhoLapis();
    ui.querySelector('.pintura-dica').classList.remove('sumiu');
    setTimeout(() => ui.querySelector('.pintura-dica').classList.add('sumiu'), 4200);
  }
  async function sair(comGiro) {
    if (!pintando) return;
    pintando = false;
    tracoAtual = null;
    arrastando = null;
    ui.hidden = true;
    document.body.classList.remove('pintando');
    document.documentElement.classList.remove('travado', 'com-lapis');
    lapis.classList.remove('visivel');
    // volta de frente pelo caminho mais curto (se ela deu várias voltas, não desenrola tudo)
    const volta = Math.PI * 2;
    giro.alvo = Math.round(giro.atual / volta) * volta;
    zoom.alvo = 1; zoom.alvoCx = zoom.alvoCy = 0.5;
    if (comGiro && tracos.length) {
      botao.disabled = true;
      // volta de frente e dá o giro com glitter
      await new Promise((ok) => setTimeout(ok, 350));
      await girar();
      botao.disabled = false;
    }
    personagem.pintando = false;
  }
  botao.addEventListener('click', entrar);
  ui.querySelector('[data-confirmar]').addEventListener('click', () => sair(true));
  ui.querySelector('[data-voltar]').addEventListener('click', () => { tracos.pop(); redesenharTudo(); });
  ui.querySelector('[data-lixeira]').addEventListener('click', () => { tracos.length = 0; limparTinta(); });
  addEventListener('keydown', (e) => {
    if (!pintando) return;
    if (e.key === 'Escape') sair(true);
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); tracos.pop(); redesenharTudo(); }
  });

  // ---------- pintar (encostando nela) ou girar (arrastando fora dela) ----------
  const canvas = renderer.domElement;
  let tracoAtual = null;     // o traço sendo feito agora
  let arrastando = null;     // girando ela: { x, giro }
  let passeando = null;      // com zoom, botão direito/do meio arrastando: { x, y, cx, cy }
  let pinca = null;          // dois dedos no celular: zoom + passear
  const dedos = new Map();
  const distDedos = () => { const [a, b] = [...dedos.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  const meioDedos = () => { const [a, b] = [...dedos.values()]; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; };
  canvas.addEventListener('pointerdown', (e) => {
    if (!pintando) return;
    canvas.setPointerCapture(e.pointerId);
    if (e.pointerType === 'touch') {
      dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (dedos.size === 2) {
        // o segundo dedo chegou: era pinça, não traço (desfaz o pontinho que o primeiro dedo começou)
        if (tracoAtual) { tracos.splice(tracos.indexOf(tracoAtual), 1); redesenharTudo(); }
        tracoAtual = null; arrastando = null;
        pinca = { dist: distDedos(), meio: meioDedos(), alvo: zoom.alvo, alvoCx: zoom.alvoCx, alvoCy: zoom.alvoCy };
      }
      if (dedos.size > 1) return;
    }
    if (e.button === 1 || e.button === 2) {
      passeando = { x: e.clientX, y: e.clientY, cx: zoom.alvoCx, cy: zoom.alvoCy };
      return;
    }
    if (e.button > 0) return;
    const pt = pontoSob(e);
    if (pt) {
      tracoAtual = { cor: corAtual, raio: raioAtual(), trechos: [[pt]], telaUltima: { x: e.clientX, y: e.clientY } };
      tracos.push(tracoAtual);
      desenhar([pt], tracoAtual.cor, tracoAtual.raio);
    } else {
      arrastando = { x: e.clientX, giro: giro.alvo };
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!pintando) return;
    if (dedos.has(e.pointerId)) dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinca) {
      if (dedos.size < 2) return;
      // aproxima pelo quanto os dedos abriram, segurando o ponto que estava entre os dedos embaixo deles
      const m = meioDedos();
      const ux0 = pinca.meio.x / innerWidth - 0.5, uy0 = pinca.meio.y / innerHeight - 0.5;
      const fx = pinca.alvoCx + ux0 / pinca.alvo, fy = pinca.alvoCy + uy0 / pinca.alvo;
      const novo = limitar(pinca.alvo * distDedos() / pinca.dist, 1, P.zoom.maximo);
      zoom.alvo = novo;
      zoom.alvoCx = fx - (m.x / innerWidth - 0.5) / novo;
      zoom.alvoCy = fy - (m.y / innerHeight - 0.5) / novo;
      limitarCentro();
      return;
    }
    if (passeando) {
      zoom.alvoCx = passeando.cx - (e.clientX - passeando.x) / (innerWidth * zoom.alvo);
      zoom.alvoCy = passeando.cy - (e.clientY - passeando.y) / (innerHeight * zoom.alvo);
      limitarCentro();
      return;
    }
    if (arrastando) {
      giro.alvo = arrastando.giro + (e.clientX - arrastando.x) * 0.012;
      return;
    }
    if (!tracoAtual) return;
    // o caminho do dedo/mouse fica guardado e é lido aos pouquinhos, sem travar (ver lerMovimentos)
    const eventos = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    for (const ev of (eventos.length ? eventos : [e])) caminho.push({ x: ev.clientX, y: ev.clientY, traco: tracoAtual });
    if (!lendo) lerMovimentos();
  });
  // A cada rodada pega o caminho desde a última leitura e escolhe uns pontos ao longo dele (um a cada
  // PASSO px da tela, no máximo MAX_LEITURAS): lê todos de uma vez, sem travar, e liga um no outro.
  // Assim o dedo rápido não vira pontinhos soltos, e o celular não lê cada movimentinho (era isso que travava).
  const PASSO = 7, MAX_LEITURAS = 5;
  let caminho = [], lendo = false;
  async function lerMovimentos() {
    lendo = true;
    while (caminho.length) {
      const traco = caminho[0].traco;
      const trecho = caminho.filter((c) => c.traco === traco);
      caminho = caminho.filter((c) => c.traco !== traco);
      const de = traco.telaUltima || trecho[0];
      const pts = [de, ...trecho];
      let total = 0;
      for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      const passo = Math.max(PASSO, total / MAX_LEITURAS);
      const escolhidos = [];
      let andou = 0, proximo = passo;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i], d = Math.hypot(b.x - a.x, b.y - a.y);
        while (d > 0 && andou + d >= proximo) {
          const t = (proximo - andou) / d;
          escolhidos.push({ clientX: a.x + (b.x - a.x) * t, clientY: a.y + (b.y - a.y) * t });
          proximo += passo;
        }
        andou += d;
      }
      const fim = pts[pts.length - 1];
      if (!escolhidos.length || andou - (proximo - passo) > 1) escolhidos.push({ clientX: fim.x, clientY: fim.y });
      traco.telaUltima = fim;
      // quanto um passo na tela vale no corpo dela (a câmera é ortográfica): pra saber o que é "pulou de parte"
      const v = camera.view?.enabled ? camera.view.width / camera.view.fullWidth : 1;
      const passoNoCorpo = passo * (camera.top - camera.bottom) / camera.zoom / innerHeight * v;
      const lidos = await Promise.all(escolhidos.map(pontoSobDepois));
      if (tracos.includes(traco)) lidos.forEach((pt) => continuarTraco(traco, pt, passoNoCorpo));   // (se apagou tudo no meio, deixa pra lá)
    }
    lendo = false;
  }
  function continuarTraco(traco, pt, passoNoCorpo = 0) {
    const trecho = traco.trechos[traco.trechos.length - 1];
    if (!pt) { if (trecho.length) traco.trechos.push([]); return; }
    const ultimo = trecho[trecho.length - 1];
    if (ultimo) {
      const dist = ultimo.p.distanceTo(pt.p);
      if (dist < traco.raio * 0.2) return;                                   // nem mexeu
      if (dist > 1.2 + passoNoCorpo * 2.5) { traco.trechos.push([pt]); desenhar([pt], traco.cor, traco.raio); return; }   // pulou de uma parte pra outra
      desenhar([ultimo, pt], traco.cor, traco.raio);
    } else {
      desenhar([pt], traco.cor, traco.raio);
    }
    trecho.push(pt);
  }
  const soltar = (e) => {
    dedos.delete(e.pointerId);
    if (pinca) { if (!dedos.size) pinca = null; return; }   // só volta a pintar depois de soltar os dois dedos
    tracoAtual = null; arrastando = null; passeando = null;
  };
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);
  // rodinha do mouse (ou pinça no trackpad): zoom onde o mouse está
  canvas.addEventListener('wheel', (e) => {
    if (!pintando) return;
    e.preventDefault();
    const passo = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    zoomEm(Math.exp(-passo * (e.ctrlKey ? 0.01 : 0.0015)), e.clientX, e.clientY);
  }, { passive: false });
  canvas.addEventListener('contextmenu', (e) => { if (pintando) e.preventDefault(); });

  // o lápis segue o mouse (a ponta fica exatamente onde o mouse está)
  addEventListener('pointermove', (e) => {
    if (!pintando || !mouseFino || e.pointerType !== 'mouse') return;
    lapis.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    lapis.classList.add('visivel');
    pedirToque(e);
  });
  document.documentElement.addEventListener('mouseleave', () => lapis.classList.remove('visivel'));
  // o círculo do tamanho aparece quando o lápis está em cima dela (vê no máximo uma vez por quadro)
  let toquePedido = null;
  function pedirToque(e) {
    const ja = toquePedido;
    toquePedido = { clientX: e.clientX, clientY: e.clientY, alvo: e.target };
    if (ja) return;
    requestAnimationFrame(() => {
      const t = toquePedido;
      toquePedido = null;
      if (!pintando) return;
      lapis.classList.toggle('sobre-ela', !!(t.alvo === canvas && !arrastando && !passeando && (tracoAtual || pontoSob(t, true))));
    });
  }

  // ---------- a nuvem segue a cabeça dela (fora da bolha, em cima e do lado direito) ----------
  const _ancora = new THREE.Vector3(), _tela = new THREE.Vector3();
  function posicionarNuvem() {
    _ancora.copy(personagem.pontoCabeca);
    _ancora.x += 0.26; _ancora.y += 0.3;        // em metros da cena
    _tela.copy(_ancora).project(camera);
    let x = (_tela.x + 1) / 2 * innerWidth, y = (1 - _tela.y) / 2 * innerHeight;
    // no celular a tela é estreita: a nuvem encosta na borda em vez de ficar cortada
    // (r = onde ela ficou no quadro anterior, sem o empurrão da borda)
    const r = botao.getBoundingClientRect(), margem = 8;
    const antesX = Number(botao.dataset.x || x), antesY = Number(botao.dataset.y || y);
    const direita = r.right - antesX + x, topo = r.top - antesY + y;
    if (r.width) {
      if (direita > innerWidth - margem) x -= direita - (innerWidth - margem);
      if (topo < margem) y += margem - topo;
    }
    botao.dataset.x = x; botao.dataset.y = y;
    botao.style.transform = `translate(${x}px, ${y}px)`;
  }
  addEventListener('resize', () => { if (pintando) atualizarTamanhoLapis(); });
  // abrindo um projeto pelo link no meio da pintura: sai (a pintura fica)
  addEventListener('hashchange', () => sair(false));

  return {
    // chamado todo quadro pelo main.js: ela gira suave quando a pessoa arrasta
    atualizar(dt) {
      giro.atual = THREE.MathUtils.damp(giro.atual, giro.alvo, 9, dt);
      aplicarZoom(dt);
      if (!pintando && !personagem.falando && !document.body.classList.contains('rolou')) posicionarNuvem();
      personagem.raiz.rotation.y = giro.base + giro.atual;
    },
  };
}
