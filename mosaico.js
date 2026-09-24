// Mosaico de fotos ao vivo = o Shader GLSL que a Ana fez no TouchDesigner, refeito pro navegador.
// Igual ao glsl do TD: a imagem (câmera ou vídeo) é dividida num grid; em cada quadradinho pega a cor média,
// passa pra HSV e escolhe a foto do conjunto cuja cor média (em HSV) é a mais próxima. Depois desenha a foto ali.
// Interação (igual à instalação, com MediaPipe): a mão na frente da câmera, abrindo a pinça (polegar ↔ indicador)
// os quadrados crescem; fechando, diminuem. Sem câmera, roda numa animação de listras arco-íris e o tamanho vai na barrinha.
// Quem monta é o projetos.js, quando o projeto tem um item { mosaico: {...} } na lista de imagens.
// As cartelas de fotos (atlas .webp + .json com as cores médias) saem do .claude/ferramentas/atlas_mosaico.py
import * as THREE from 'three';
import { criarCarregamento } from './carregamento.js';

const CONFIG_MOSAICO = {
  tamanhoMin: 3,          // px: menor quadradinho (pinça fechada) — quase vira a imagem de volta
  tamanhoMax: 72,         // px: maior quadradinho (pinça aberta)
  tamanhoInicial: 0.55,   // 0 a 1 (entre o menor e o maior)
  suavidade: 7,           // quão rápido o tamanho segue a pinça (maior = mais rápido)
  pincaFechada: 0.14,     // distância polegar↔indicador (em "palmos") que conta como pinça fechada
  pincaAberta: 1.0,       // ... e como pinça bem aberta
  mediapipe: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1',
  modeloMao: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
};

// mesmo rgb2hsv do shader da Ana
const RGB2HSV = /* glsl */`
  vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
  }`;

const VERT = /* glsl */`
  out vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

// passo 1 — um pixel por quadradinho: qual foto combina (o glsl2 do TD)
const FRAG_ESCOLHA = /* glsl */`
  precision highp float;
  in vec2 vUv;
  out vec4 corSaida;
  uniform sampler2D uFonte;     // câmera ou vídeo
  uniform sampler2D uMedias;    // cor média de cada foto (1 pixel por foto)
  uniform float uN;
  uniform vec2 uGrade;          // quantos quadradinhos cabem no quadro (larg/tamanho, alt/tamanho)
  uniform vec2 uEscala;         // pra fonte cobrir o quadro sem esticar
  uniform float uEspelho;
  uniform float uHueShift;
  ${RGB2HSV}
  vec2 fonteUV(vec2 p) {
    p = (p - 0.5) * uEscala + 0.5;
    if (uEspelho > 0.5) p.x = 1.0 - p.x;
    return p;
  }
  void main() {
    // cada pixel deste passo = um quadradinho; "feed ao vivo pixelado" = média de 4×4 amostras dentro dele
    vec2 cel = floor(gl_FragCoord.xy);
    vec3 soma = vec3(0.0);
    for (int j = 0; j < 4; j++) for (int i = 0; i < 4; i++)
      soma += texture(uFonte, fonteUV((cel + (vec2(i, j) + 0.5) / 4.0) / uGrade)).rgb;
    vec3 ao = rgb2hsv(soma / 16.0);
    ao.r = mod(ao.r + uHueShift, 1.0);
    // a foto de cor média mais próxima (distância em HSV, igual ao TD)
    float menor = 9999.0, escolhida = 0.0;
    for (int k = 0; k < 1024; k++) {
      if (float(k) >= uN) break;
      vec3 m = rgb2hsv(texture(uMedias, vec2((float(k) + 0.5) / uN, 0.5)).rgb);
      float d = distance(m, ao);
      if (d < menor) { menor = d; escolhida = float(k); }
    }
    corSaida = vec4(mod(escolhida, 256.0) / 255.0, floor(escolhida / 256.0) / 255.0, 0.0, 1.0);
  }`;

// passo 2 — desenha a foto escolhida em cada quadradinho (o glsl1 do TD)
const FRAG_DESENHO = /* glsl */`
  precision highp float;
  in vec2 vUv;
  out vec4 corSaida;
  uniform sampler2D uEscolha;
  uniform sampler2D uAtlas;     // a cartela com todas as fotos
  uniform vec2 uGrade;
  uniform vec2 uAtlasGrade;     // fotos por linha, linhas da cartela
  uniform float uTile;          // px de cada foto na cartela
  void main() {
    vec2 g = vUv * uGrade;
    vec2 cel = floor(g), dentro = fract(g);
    // não deixa a foto "vazar" pra vizinha na cartela: afasta um pouco da borda (mais quando o quadradinho é pequeno)
    float borda = min(0.5, max(0.6 / uTile, 0.75 * max(length(dFdx(g)), length(dFdy(g)))));
    dentro = clamp(dentro, borda, 1.0 - borda);
    vec4 e = texelFetch(uEscolha, ivec2(cel), 0);
    float idx = floor(e.r * 255.0 + 0.5) + floor(e.g * 255.0 + 0.5) * 256.0;
    vec2 casa = vec2(mod(idx, uAtlasGrade.x), floor(idx / uAtlasGrade.x));   // coluna, linha (de cima pra baixo)
    vec2 uv = vec2((casa.x + dentro.x) / uAtlasGrade.x, 1.0 - (casa.y + 1.0 - dentro.y) / uAtlasGrade.y);
    // derivadas contínuas: sem "costura" nas bordas dos quadradinhos quando eles ficam bem pequenos
    vec2 dg = vec2(1.0) / uAtlasGrade;
    corSaida = textureGrad(uAtlas, uv, dFdx(g) * dg, dFdy(g) * dg);
  }`;

// ícone de câmera fotográfica do botão "tirar foto" (linhas, pega a cor do botão)
const ICONE_FOTO = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M4 8.5h3l1.6-2.5h6.8L17 8.5h3v10H4z"/><circle cx="12" cy="13.2" r="3.4"/></svg>`;

// salva a foto: no celular abre o "compartilhar" (dá pra salvar na galeria); no computador baixa o .png
async function salvarFoto(blob) {
  const nome = `mosaico-persocom-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`;
  const arquivo = new File([blob], nome, { type: 'image/png' });
  if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [arquivo] })) {
    try { await navigator.share({ files: [arquivo], title: 'meu mosaico' }); return; } catch (e) {
      if (e.name === 'AbortError') return;             // a pessoa fechou o compartilhar
    }
  }
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: nome });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function montarMosaico(raiz, cfg) {
  const conjuntos = cfg.conjuntos;
  raiz.innerHTML = `
    <div class="mosaico-palco">
      <canvas class="mosaico-tela" aria-label="mosaico de fotos ao vivo"></canvas>
      <canvas class="mosaico-mao" aria-hidden="true"></canvas>
      ${conjuntos.length > 1 ? `<div class="mosaico-bolhas" role="group" aria-label="escolher o shader">
        ${conjuntos.map((c, i) => `<button type="button" class="mosaico-redondo mosaico-bolha${i === 0 ? ' ativo' : ''}" data-conjunto="${i}" data-nome="${c.nome}"
          aria-label="${c.nome}" aria-pressed="${i === 0}"><img src="${c.icone}" alt="" draggable="false"></button>`).join('')}
      </div>` : ''}
      <div class="mosaico-camera">
        <button type="button" class="pilula ver-projeto" data-camera>▶ ligar câmera</button>
        <span>faça pinça com a mão pra mudar o tamanho dos quadrados · a imagem fica só no seu aparelho</span>
      </div>
      <div class="mosaico-aviso" hidden></div>
      <label class="mosaico-tamanho"><span>quadrados</span><input type="range" min="0" max="1" step="0.001" value="${CONFIG_MOSAICO.tamanhoInicial}"></label>
      <button type="button" class="mosaico-redondo mosaico-foto" data-foto title="tirar foto do mosaico" aria-label="tirar foto do mosaico" hidden>${ICONE_FOTO}</button>
      <button type="button" class="pilula mosaico-sair" data-sair hidden>✕ sair da câmera</button>
      <div class="mosaico-flash" aria-hidden="true"></div>
    </div>`;
  const palco = raiz.querySelector('.mosaico-palco');
  const tela = raiz.querySelector('.mosaico-tela');
  const mao = raiz.querySelector('.mosaico-mao');
  const ctxMao = mao.getContext('2d');
  const botaoCamera = raiz.querySelector('[data-camera]');
  const caixaCamera = raiz.querySelector('.mosaico-camera');
  const aviso = raiz.querySelector('.mosaico-aviso');
  const slider = raiz.querySelector('.mosaico-tamanho input');
  const flash = raiz.querySelector('.mosaico-flash');
  const botaoFoto = raiz.querySelector('[data-foto]');
  const botaoSair = raiz.querySelector('[data-sair]');

  const renderer = new THREE.WebGLRenderer({ canvas: tela, antialias: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const camera2d = new THREE.Camera();
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  const cena = new THREE.Scene(); cena.add(quad);

  // fonte: antes da câmera, uma animação abstrata desenhada aqui mesmo (listras arco-íris + bolhas, cores do site);
  // com a câmera ligada, vira a câmera (espelhada)
  const video = document.createElement('video');
  Object.assign(video, { muted: true, playsInline: true });
  const texCamera = new THREE.VideoTexture(video);
  const anim = document.createElement('canvas');
  anim.width = 384; anim.height = 288;
  const texAnim = new THREE.CanvasTexture(anim);

  const alvo = new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false });
  const uEscolha = {
    uFonte: { value: texAnim }, uMedias: { value: null }, uN: { value: 1 },
    uGrade: { value: new THREE.Vector2(1, 1) }, uEscala: { value: new THREE.Vector2(1, 1) },
    uEspelho: { value: 0 }, uHueShift: { value: 0 },
  };
  const uDesenho = {
    uEscolha: { value: alvo.texture }, uAtlas: { value: null },
    uGrade: uEscolha.uGrade, uAtlasGrade: { value: new THREE.Vector2(1, 1) }, uTile: { value: 80 },
  };
  const matEscolha = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG_ESCOLHA, uniforms: uEscolha, depthTest: false });
  const matDesenho = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG_DESENHO, uniforms: uDesenho, depthTest: false });

  // ---------- conjuntos de fotos (cartela + cores médias), carregados sob demanda ----------
  const cache = new Map();
  const carregarImg = (src) => new Promise((ok, erro) => { const im = new Image(); im.onload = () => ok(im); im.onerror = erro; im.src = src; });
  async function conjunto(i) {
    if (!cache.has(i)) {
      cache.set(i, (async () => {
        const c = conjuntos[i];
        const [info, img] = await Promise.all([fetch(c.dados).then((r) => r.json()), carregarImg(c.atlas)]);
        const atlas = new THREE.Texture(img);
        atlas.generateMipmaps = true; atlas.minFilter = THREE.LinearMipmapLinearFilter; atlas.anisotropy = 4;
        atlas.needsUpdate = true;
        const px = new Uint8Array(info.n * 4);
        info.medias.forEach(([r, g, b], k) => px.set([r, g, b, 255], k * 4));
        const medias = new THREE.DataTexture(px, info.n, 1);
        medias.needsUpdate = true;
        return { info, atlas, medias };
      })());
    }
    return cache.get(i);
  }
  let pronto = false;
  let pedido = 0;   // o último conjunto escolhido (se a pessoa clicar enquanto outro carrega, vale o último)
  async function usarConjunto(i) {
    pedido = i;
    const { info, atlas, medias } = await conjunto(i);
    const img = atlas.image;
    if (!vivo || i !== pedido) return;
    uDesenho.uAtlas.value = atlas;
    uDesenho.uAtlasGrade.value.set(info.colunas, info.linhas);
    uDesenho.uTile.value = img.width / info.colunas;
    uEscolha.uMedias.value = medias;
    uEscolha.uN.value = info.n;
    pronto = true;
  }
  raiz.querySelectorAll('[data-conjunto]').forEach((b) => b.addEventListener('click', () => {
    raiz.querySelectorAll('[data-conjunto]').forEach((x) => {
      x.classList.toggle('ativo', x === b);
      x.setAttribute('aria-pressed', x === b);
    });
    usarConjunto(Number(b.dataset.conjunto));
  }));

  // ---------- tamanho dos quadradinhos (pinça ou barrinha) ----------
  let tamanho = CONFIG_MOSAICO.tamanhoInicial, tamanhoAlvo = tamanho;
  slider.addEventListener('input', () => { tamanhoAlvo = Number(slider.value); });
  const pxDoTamanho = (t) => CONFIG_MOSAICO.tamanhoMin * Math.pow(CONFIG_MOSAICO.tamanhoMax / CONFIG_MOSAICO.tamanhoMin, t);

  let W = 1, H = 1;
  function medir() {
    W = palco.clientWidth; H = palco.clientHeight;
    renderer.setSize(W, H, false);
    const dpr = Math.min(devicePixelRatio, 2);
    mao.width = W * dpr; mao.height = H * dpr; ctxMao.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  // a fonte cobre o quadro sem esticar (tipo object-fit: cover)
  function ajustarFonte() {
    const vw = stream ? video.videoWidth || 1 : anim.width, vh = stream ? video.videoHeight || 1 : anim.height;
    const aq = W / H, av = vw / vh;
    uEscolha.uEscala.value.set(av > aq ? aq / av : 1, av > aq ? 1 : av / aq);
  }

  // ---------- MODO CÂMERA: o mosaico ocupa a tela toda, com o botão de foto e o "sair da câmera" ----------
  // (o palco vai pro <body> enquanto isso: dentro do painel de vidro, o position: fixed não cobriria a tela)
  let telaCheia = false;
  function entrarTelaCheia() {
    if (telaCheia) return;
    telaCheia = true;
    document.body.appendChild(palco);
    palco.classList.add('tela-cheia');
    document.body.classList.add('mosaico-tela-cheia');
    caixaCamera.hidden = true;
    botaoFoto.hidden = false; botaoSair.hidden = false;
    botaoSair.focus({ preventScroll: true });
  }
  function sairTelaCheia() {
    if (!telaCheia) return;
    telaCheia = false;
    palco.classList.remove('tela-cheia');
    document.body.classList.remove('mosaico-tela-cheia');
    raiz.appendChild(palco);
    caixaCamera.hidden = false;
    botaoFoto.hidden = true; botaoSair.hidden = true;
  }
  // Esc sai da câmera (e não deixa o Esc do site fechar o projeto junto)
  const aoTeclar = (e) => {
    if (e.key === 'Escape' && telaCheia) { e.stopPropagation(); desligarCamera(); }
  };
  addEventListener('keydown', aoTeclar, true);

  // ---------- câmera + MediaPipe (só carregam quando a pessoa clica) ----------
  let stream = null, maos = null, ultimoTempo = -1, pontos = null;
  botaoCamera.addEventListener('click', ligarCamera);
  botaoSair.addEventListener('click', desligarCamera);
  // a mesma tela de pixels do carregamento do site, cobrindo o quadro enquanto a câmera e o rastreio da mão carregam
  let pixels = null;
  function cobrirComPixels() {
    tirarPixels();
    const c = document.createElement('canvas');
    c.className = 'mosaico-carregando';
    c.setAttribute('aria-hidden', 'true');
    palco.appendChild(c);
    pixels = criarCarregamento(c, { tempoMinimo: 1200, aoTerminar: () => { c.remove(); if (pixels?.tela === c) pixels = null; } });
    pixels.tela = c;
  }
  function tirarPixels() { if (pixels) { pixels.cancelar(); pixels.tela.remove(); pixels = null; } }

  async function ligarCamera() {
    botaoCamera.disabled = true;
    botaoCamera.textContent = 'ligando…';
    entrarTelaCheia();
    cobrirComPixels();
    pixels.progresso(0.08);
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      if (!vivo || !telaCheia) { stream.getTracks().forEach((t) => t.stop()); stream = null; return; }
      pixels?.progresso(0.35);
      video.srcObject = stream;
      await video.play();
      uEscolha.uFonte.value = texCamera;
      uEscolha.uEspelho.value = 1;
      pixels?.progresso(0.45);
      if (!maos) {
        const { FilesetResolver, HandLandmarker } = await import(`${CONFIG_MOSAICO.mediapipe}/vision_bundle.mjs`);
        pixels?.progresso(0.6);
        const arquivos = await FilesetResolver.forVisionTasks(`${CONFIG_MOSAICO.mediapipe}/wasm`);
        pixels?.progresso(0.75);
        maos = await HandLandmarker.createFromOptions(arquivos, {
          baseOptions: { modelAssetPath: CONFIG_MOSAICO.modeloMao, delegate: 'GPU' },
          runningMode: 'VIDEO', numHands: 1,
        });
        if (!vivo) { maos.close(); return; }
      }
      pixels?.pronto();
      if (stream) mostrarAviso('✋ mostre a mão e faça pinça', 3500);
    } catch (e) {
      pixels?.pronto();
      if (!stream) {
        desligarCamera();
        mostrarAviso('não deu pra ligar a câmera — o mosaico continua nas listras arco-íris', 5000);
      } else {
        mostrarAviso('o rastreio da mão não carregou — use a barrinha pra mudar o tamanho', 5000);
      }
    }
  }
  // desliga a câmera (a luzinha apaga), volta pra animação e sai da tela cheia
  function desligarCamera() {
    stream?.getTracks().forEach((t) => t.stop());
    stream = null; pontos = null;
    video.srcObject = null;
    uEscolha.uFonte.value = texAnim;
    uEscolha.uEspelho.value = 0;
    ctxMao.clearRect(0, 0, W, H);
    aviso.hidden = true;
    botaoCamera.disabled = false;
    botaoCamera.textContent = '▶ ligar câmera';
    tirarPixels();
    sairTelaCheia();
  }
  let timerAviso = 0;
  function mostrarAviso(txt, ms) {
    aviso.textContent = txt; aviso.hidden = false;
    clearTimeout(timerAviso);
    if (ms) timerAviso = setTimeout(() => { aviso.hidden = true; }, ms);
  }

  function rastrearMao() {
    if (!maos || !stream || video.readyState < 2 || video.currentTime === ultimoTempo) return;
    ultimoTempo = video.currentTime;
    const r = maos.detectForVideo(video, performance.now());
    const lm = r.landmarks?.[0];
    if (!lm) { pontos = null; return; }
    if (!aviso.hidden && aviso.textContent.startsWith('✋')) aviso.hidden = true;
    const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const palmo = d(lm[0], lm[9]) || 1;                     // pulso → base do dedo médio
    const pinca = d(lm[4], lm[8]) / palmo;                  // ponta do polegar ↔ ponta do indicador
    const t = (pinca - CONFIG_MOSAICO.pincaFechada) / (CONFIG_MOSAICO.pincaAberta - CONFIG_MOSAICO.pincaFechada);
    tamanhoAlvo = Math.min(1, Math.max(0, t));
    pontos = [lm[4], lm[8]];
  }
  // desenha a pinça por cima (duas bolinhas + linha), no mesmo enquadramento espelhado da câmera
  function desenharMao() {
    ctxMao.clearRect(0, 0, W, H);
    if (!pontos) return;
    const esc = uEscolha.uEscala.value;
    const tela = (p) => [((1 - p.x) - 0.5) / esc.x * W + W / 2, (p.y - 0.5) / esc.y * H + H / 2];
    const [a, b] = pontos.map(tela);
    ctxMao.strokeStyle = 'rgba(255,255,255,.9)'; ctxMao.lineWidth = 2;
    ctxMao.beginPath(); ctxMao.moveTo(a[0], a[1]); ctxMao.lineTo(b[0], b[1]); ctxMao.stroke();
    for (const [x, y] of [a, b]) {
      ctxMao.fillStyle = '#fff'; ctxMao.beginPath(); ctxMao.arc(x, y, 7, 0, Math.PI * 2); ctxMao.fill();
      ctxMao.fillStyle = '#ff6fae'; ctxMao.beginPath(); ctxMao.arc(x, y, 4, 0, Math.PI * 2); ctxMao.fill();
    }
  }

  // ---------- loop ----------
  // ---------- animação abstrata (antes da câmera): listras arco-íris andando na diagonal + bolhas peroladas subindo ----------
  const ctxAnim = anim.getContext('2d');
  const CORES_ARCOIRIS = ['#ff6fae', '#ffae5c', '#ffe07a', '#7ddf6a', '#62cfe6', '#94d3ec', '#a88cff', '#f7a8cf'];
  const bolhasAnim = Array.from({ length: 7 }, (_, i) => ({
    x: Math.random(), fase: Math.random() * Math.PI * 2, vel: 0.05 + Math.random() * 0.06,
    r: 0.07 + Math.random() * 0.09, inicio: i / 7,
  }));
  function desenharAnimacao(t) {
    const w = anim.width, h = anim.height, c = ctxAnim;
    // listras: um degradê arco-íris que se repete e desliza na diagonal
    const faixa = w * 0.9;                                        // largura de um arco-íris inteiro
    const desloc = (t * 38) % faixa;
    c.save();
    c.translate(w / 2, h / 2); c.rotate(-0.55); c.translate(-w, -h);
    for (let x = -faixa + desloc; x < w * 2 + faixa; x += faixa) {
      const g = c.createLinearGradient(x, 0, x + faixa, 0);
      CORES_ARCOIRIS.forEach((cor, i) => g.addColorStop(i / CORES_ARCOIRIS.length, cor));
      g.addColorStop(1, CORES_ARCOIRIS[0]);
      c.fillStyle = g;
      c.fillRect(x, 0, faixa + 1, h * 2);
    }
    c.restore();
    // um véu branco suave que "respira", como a luz perolada do site
    c.fillStyle = `rgba(255,255,255,${0.12 + 0.08 * Math.sin(t * 0.7)})`;
    c.fillRect(0, 0, w, h);
    // bolhas subindo e balançando (brancas peroladas, com brilho)
    for (const b of bolhasAnim) {
      const subida = ((t * b.vel + b.inicio) % 1.25) - 0.15;       // 0 embaixo → 1 em cima
      const y = h * (1 - subida), x = w * (b.x + 0.06 * Math.sin(t * 0.9 + b.fase)), r = h * b.r;
      const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
      g.addColorStop(0, 'rgba(255,255,255,0.98)');
      g.addColorStop(0.55, 'rgba(250,248,255,0.85)');
      g.addColorStop(1, 'rgba(220,230,245,0.55)');
      c.fillStyle = g;
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    }
  }

  // ---------- tirar foto ----------
  let querFoto = false;
  raiz.querySelector('[data-foto]').addEventListener('click', () => { querFoto = true; });
  function tirarFoto() {
    querFoto = false;
    tela.toBlob((blob) => { if (blob) salvarFoto(blob); }, 'image/png');
    flash.classList.remove('piscando'); void flash.offsetWidth; flash.classList.add('piscando');
  }

  let vivo = true, visivel = false, raf = 0, antes = performance.now();
  function quadro(agora) {
    raf = requestAnimationFrame(quadro);
    const dt = Math.min((agora - antes) / 1000, 0.05); antes = agora;
    if (!visivel || document.hidden || !pronto) return;
    if (stream && video.readyState < 2) return;
    if (!stream) { desenharAnimacao(agora / 1000); texAnim.needsUpdate = true; }
    rastrearMao();
    tamanho += (tamanhoAlvo - tamanho) * (1 - Math.exp(-CONFIG_MOSAICO.suavidade * dt));
    if (document.activeElement !== slider) slider.value = tamanho;
    const px = pxDoTamanho(tamanho);
    const colunas = Math.max(1, Math.ceil(W / px)), linhas = Math.max(1, Math.ceil(H / px));
    // a grade é um pouco maior que o quadro: os quadradinhos ficam sempre quadrados
    uEscolha.uGrade.value.set(W / px, H / px);
    if (alvo.width !== colunas || alvo.height !== linhas) alvo.setSize(colunas, linhas);
    ajustarFonte();
    quad.material = matEscolha; renderer.setRenderTarget(alvo); renderer.render(cena, camera2d);
    quad.material = matDesenho; renderer.setRenderTarget(null); renderer.render(cena, camera2d);
    if (querFoto) tirarFoto();                         // antes da mão: a foto sai só com o mosaico
    desenharMao();
  }

  const ro = new ResizeObserver(medir); ro.observe(palco);
  let comecou = false;
  const io = new IntersectionObserver(([en]) => {
    visivel = en.isIntersecting;
    if (visivel && !comecou) { comecou = true; usarConjunto(pedido).catch(() => mostrarAviso('não deu pra carregar as fotos 😢')); }
  }, { rootMargin: '300px 0px' });
  io.observe(palco);
  medir();
  raf = requestAnimationFrame(quadro);

  return {
    destruir() {
      vivo = false; cancelAnimationFrame(raf); clearTimeout(timerAviso);
      removeEventListener('keydown', aoTeclar, true);
      tirarPixels();
      if (telaCheia) { palco.remove(); document.body.classList.remove('mosaico-tela-cheia'); }
      ro.disconnect(); io.disconnect();
      stream?.getTracks().forEach((t) => t.stop());   // desliga a câmera (a luzinha apaga)
      maos?.close();
      video.pause(); video.srcObject = null;
      texCamera.dispose(); texAnim.dispose(); alvo.dispose(); matEscolha.dispose(); matDesenho.dispose();
      cache.forEach((p) => p.then(({ atlas, medias }) => { atlas.dispose(); medias.dispose(); }).catch(() => {}));
      renderer.dispose();
    },
  };
}
