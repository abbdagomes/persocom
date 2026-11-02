// =====================================================================
//  GAROTAS 3D — a cor de profundidade ao vivo (item { garotas3d: { pasta, quantas, cores } } no projetos.js)
//  Refaz o que a Ana fez no Blender (câmera ortográfica + passe Mist + rampa branco → cor → escuro), só que em
//  tempo real: a cor vem da distância até a câmera, então muda enquanto a pessoa gira a personagem.
//  Arrastar gira · botões trocam a personagem · a RAMPA de baixo é igual à Color Ramp do compositor dela: arrastar um
//  ponto muda onde a cor cai, clicar escolhe o ponto, o quadradinho troca a cor dele, + e − põem e tiram pontos
//  (2 cliques na barra também põem um ponto; Delete tira; ← → movem) · a barrinha é o quanto a profundidade "aperta".
//  Modelos: só a forma, sem textura (.claude/… exportar3d.py a partir de uma cópia na memória do garota.blend).
// =====================================================================
import * as THREE from 'three';
import { carregarGlb } from './carregarGlb.js';

const CONFIG_GAROTAS = {
  aspecto: 5 / 4,
  alturaQuadro: 1.5,             // quanto da cena cabe na altura (a personagem tem altura 1; sobra embaixo pro painel da rampa)
  inclinacao: { inicial: 0.42, min: 0.08, max: 0.95 },   // a câmera olha de cima, como nas imagens (radianos)
  giroSozinho: 0.45,             // rad/s até a pessoa mexer
  sensibilidade: 0.009,
  // a rampa de começo, nas posições da Color Ramp do Blender dela (0 = mais perto, 1 = mais longe)
  rampa: [{ p: 0, cor: '#ffffff' }, { p: 0.309, cor: '#ff2d6f' }, { p: 1, cor: '#4d0f26' }],
  // a rampa vai do ponto mais perto (branco) até esta fração do caminho pro ponto mais longe: menos = mais contraste
  aperto: { min: 0.45, max: 1, inicial: 0.68 },
  amostras: 500,                 // quantos pontos do modelo são medidos a cada quadro pra achar o perto e o longe
  chao: { casas: 26, cor: 0.72, ateOnde: 0.85 },
};

const VERTICE = /* glsl */`
  varying float vProf;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vProf = -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;
const FRAGMENTO = /* glsl */`
  uniform float uPerto, uLonge;
  uniform sampler2D uRampa;  // a rampa já pronta numa tirinha de 256 cores
  varying float vProf;
  void main() {
    float t = clamp((vProf - uPerto) / (uLonge - uPerto), 0.0, 1.0);
    gl_FragColor = vec4(texture2D(uRampa, vec2(t, 0.5)).rgb, 1.0);
  }`;
// o chão xadrez da série: vai até a borda de baixo e some no branco lá atrás, como nas imagens dela
const CHAO_FRAG = /* glsl */`
  uniform float uCasas, uTom, uAteOnde;
  varying vec2 vP;
  void main() {
    vec2 q = floor(vP * uCasas);
    float xadrez = mod(q.x + q.y, 2.0);
    float fade = 1.0 - smoothstep(0.0, uAteOnde, -vP.y);
    float sombra = 1.0 - 0.35 * (1.0 - smoothstep(0.05, 0.42, length(vP * vec2(1.0, 1.6))));
    vec3 c = mix(vec3(1.0), vec3(mix(1.0, uTom, xadrez)), fade) * sombra;
    gl_FragColor = vec4(c, 1.0);
  }`;
const CHAO_VERT = /* glsl */`
  varying vec2 vP;
  void main() { vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

export function montarGarotas3d(raiz, cfg) {
  const G = CONFIG_GAROTAS;
  raiz.innerHTML = `
    <div class="garotas3d" style="--aspecto:${G.aspecto}">
      <canvas aria-label="personagem 3D colorida pela profundidade"></canvas>
      <div class="garotas3d-quem" role="group" aria-label="escolher a personagem">
        ${Array.from({ length: cfg.quantas }, (_, i) => `<button type="button" class="pilula${i ? '' : ' ativo'}" data-garota="${i + 1}" aria-label="personagem ${i + 1}">${i + 1}</button>`).join('')}
      </div>
      <div class="rampa-painel">
        <div class="rampa-linha">
          <label class="rampa-cor" title="cor do ponto escolhido"><input type="color" aria-label="cor do ponto escolhido"></label>
          <div class="rampa-faixa">
            <canvas class="rampa-barra" width="256" height="1" aria-hidden="true"></canvas>
            <div class="rampa-pontos"></div>
          </div>
          <button type="button" class="pilula rampa-botao" data-rampa="mais" aria-label="adicionar um ponto" title="adicionar um ponto">+</button>
          <button type="button" class="pilula rampa-botao" data-rampa="menos" aria-label="tirar o ponto escolhido" title="tirar o ponto escolhido">−</button>
        </div>
        <label class="garotas3d-aperto"><span>profundidade</span>
          <input class="aperto-barra" type="range" min="0" max="100" value="${Math.round((1 - (G.aperto.inicial - G.aperto.min) / (G.aperto.max - G.aperto.min)) * 100)}"></label>
      </div>
      <p class="garotas3d-dica">arraste pra girar: o que chega perto clareia</p>
    </div>`;
  const palco = raiz.querySelector('.garotas3d');
  const canvas = palco.querySelector('canvas');
  const dica = palco.querySelector('.garotas3d-dica');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, matchMedia('(pointer: coarse)').matches ? 1.5 : 2));   // celular: menos pixels
  renderer.setClearColor(0xffffff, 1);
  const cena = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20);

  const uni = {
    uPerto: { value: 4 }, uLonge: { value: 6 }, uRampa: { value: null },
  };
  const material = new THREE.ShaderMaterial({ vertexShader: VERTICE, fragmentShader: FRAGMENTO, uniforms: uni, side: THREE.DoubleSide });
  const chao = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12).rotateX(-Math.PI / 2),
    new THREE.ShaderMaterial({
      vertexShader: CHAO_VERT, fragmentShader: CHAO_FRAG,
      uniforms: { uCasas: { value: G.chao.casas / 2 }, uTom: { value: G.chao.cor }, uAteOnde: { value: G.chao.ateOnde } },
    }),
  );
  cena.add(chao);
  const giro = new THREE.Group();
  cena.add(giro);

  // ---------- as personagens (carrega quando escolhe; todas com altura 1 e os pés no chão) ----------
  const modelos = new Map();
  let amostras = [], atual = 0, vivo = true;
  function carregar(n) {
    if (!modelos.has(n)) {
      modelos.set(n, carregarGlb(`${cfg.pasta}garota${n}.glb`).then((g) => {
        const o = g.scene;
        o.traverse((m) => { if (m.isMesh) { m.material = material; m.frustumCulled = false; } });
        const caixa = new THREE.Box3().setFromObject(o);
        const tam = caixa.getSize(new THREE.Vector3());
        const k = 1 / tam.y;
        o.scale.setScalar(k);
        const centro = caixa.getCenter(new THREE.Vector3());
        o.position.set(-centro.x * k, -caixa.min.y * k, -centro.z * k);
        // uns pontos espalhados pelo modelo (na posição final), pra medir a profundidade sem olhar a malha inteira
        o.updateMatrixWorld(true);
        const pontos = [], v = new THREE.Vector3();
        o.traverse((m) => {
          if (!m.isMesh) return;
          const pos = m.geometry.getAttribute('position');
          const passo = Math.max(1, Math.floor(pos.count / G.amostras));
          for (let i = 0; i < pos.count; i += passo) {
            v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
            pontos.push(v.x, v.y, v.z);
          }
        });
        return { o, pontos };
      }));
    }
    return modelos.get(n);
  }
  function mostrar(n) {
    atual = n;
    carregar(n).then(({ o, pontos }) => {
      if (!vivo || atual !== n) return;
      giro.clear();
      giro.add(o);
      amostras = pontos;
    }).catch(() => {});
  }
  mostrar(1);

  // ---------- botões ----------
  palco.addEventListener('click', (e) => {
    const q = e.target.closest('[data-garota]');
    if (q) {
      palco.querySelectorAll('[data-garota]').forEach((b) => b.classList.toggle('ativo', b === q));
      mostrar(Number(q.dataset.garota));
    }
  });
  let aperto = G.aperto.inicial;
  palco.querySelector('.aperto-barra').addEventListener('input', (e) => {
    aperto = G.aperto.max - (G.aperto.max - G.aperto.min) * (Number(e.target.value) / 100);
  });

  // ---------- a rampa (igual à Color Ramp do Blender: mistura as cores em linear) ----------
  const TAM = 256;
  const dadosRampa = new Uint8Array(TAM * 4);
  const texRampa = new THREE.DataTexture(dadosRampa, TAM, 1);
  texRampa.minFilter = texRampa.magFilter = THREE.LinearFilter;
  texRampa.wrapS = texRampa.wrapT = THREE.ClampToEdgeWrapping;
  uni.uRampa.value = texRampa;
  const barra = palco.querySelector('.rampa-barra');
  const pontosEl = palco.querySelector('.rampa-pontos');
  const corEl = palco.querySelector('.rampa-cor input');
  const quadradoCor = palco.querySelector('.rampa-cor');
  const paraLinear = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const paraSRGB = (v) => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055);
  const lerHex = (h) => [1, 3, 5].map((i) => paraLinear(parseInt(h.slice(i, i + 2), 16) / 255));
  const escreverHex = (l) => `#${l.map((v) => Math.round(paraSRGB(v) * 255).toString(16).padStart(2, '0')).join('')}`;
  const pontos = G.rampa.map((p) => ({ ...p }));
  let escolhido = pontos[1];
  const ordenados = () => [...pontos].sort((a, b) => a.p - b.p);
  function corEm(t) {                    // a cor (linear) da rampa na posição t
    const o = ordenados();
    if (t <= o[0].p) return lerHex(o[0].cor);
    const ultimo = o[o.length - 1];
    if (t >= ultimo.p) return lerHex(ultimo.cor);
    const i = o.findIndex((p) => p.p >= t);
    const a = o[i - 1], b = o[i], f = (t - a.p) / Math.max(b.p - a.p, 1e-5);
    const ca = lerHex(a.cor), cb = lerHex(b.cor);
    return ca.map((v, k) => v + (cb[k] - v) * f);
  }
  function atualizarRampa() {
    for (let i = 0; i < TAM; i++) {
      const c = corEm(i / (TAM - 1));
      for (let k = 0; k < 3; k++) dadosRampa[i * 4 + k] = Math.round(paraSRGB(c[k]) * 255);
      dadosRampa[i * 4 + 3] = 255;
    }
    texRampa.needsUpdate = true;
    const ctx = barra.getContext('2d');
    ctx.putImageData(new ImageData(new Uint8ClampedArray(dadosRampa), TAM, 1), 0, 0);
  }
  function desenharPontos() {
    pontosEl.innerHTML = pontos.map((p, i) => `<button type="button" class="rampa-ponto${p === escolhido ? ' ativo' : ''}" data-i="${i}"
      role="slider" aria-label="ponto da rampa" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(p.p * 100)}"
      style="left:${p.p * 100}%; --cor:${p.cor}"></button>`).join('');
    corEl.value = escolhido.cor;
    quadradoCor.style.setProperty('--cor', escolhido.cor);
    palco.querySelector('[data-rampa="menos"]').disabled = pontos.length <= 2;
  }
  function moverNaBarra(p, e) {
    const r = pontosEl.getBoundingClientRect();
    p.p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const el = pontosEl.querySelector(`[data-i="${pontos.indexOf(p)}"]`);
    if (el) { el.style.left = `${p.p * 100}%`; el.setAttribute('aria-valuenow', Math.round(p.p * 100)); }
    atualizarRampa();
  }
  function novoPonto(t) {
    const p = { p: t, cor: escreverHex(corEm(t)) };
    pontos.push(p);
    escolhido = p;
    atualizarRampa();
    desenharPontos();
  }
  function tirarEscolhido() {
    if (pontos.length <= 2) return;
    pontos.splice(pontos.indexOf(escolhido), 1);
    escolhido = ordenados()[0];
    atualizarRampa();
    desenharPontos();
  }
  let arrastandoPonto = null;
  pontosEl.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.rampa-ponto');
    if (!b) return;
    escolhido = pontos[Number(b.dataset.i)];
    arrastandoPonto = escolhido;
    desenharPontos();
    pontosEl.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  pontosEl.addEventListener('pointermove', (e) => { if (arrastandoPonto) moverNaBarra(arrastandoPonto, e); });
  const soltarPonto = () => { arrastandoPonto = null; };
  pontosEl.addEventListener('pointerup', soltarPonto);
  pontosEl.addEventListener('pointercancel', soltarPonto);
  palco.querySelector('.rampa-faixa').addEventListener('dblclick', (e) => {
    if (e.target.closest('.rampa-ponto')) return;
    const r = pontosEl.getBoundingClientRect();
    novoPonto(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
  });
  pontosEl.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') { tirarEscolhido(); e.preventDefault(); return; }
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    escolhido.p = Math.min(1, Math.max(0, escolhido.p + (e.key === 'ArrowLeft' ? -0.02 : 0.02)));
    atualizarRampa();
    desenharPontos();
    pontosEl.querySelector(`[data-i="${pontos.indexOf(escolhido)}"]`)?.focus();
    e.preventDefault();
    e.stopPropagation();
  });
  corEl.addEventListener('input', () => {
    escolhido.cor = corEl.value;
    quadradoCor.style.setProperty('--cor', corEl.value);
    pontosEl.querySelector(`[data-i="${pontos.indexOf(escolhido)}"]`)?.style.setProperty('--cor', corEl.value);
    atualizarRampa();
  });
  palco.querySelector('[data-rampa="mais"]').addEventListener('click', () => {
    // no meio do maior vão entre dois pontos
    const o = ordenados();
    let melhor = 0, t = 0.5;
    for (let i = 1; i < o.length; i++) if (o[i].p - o[i - 1].p > melhor) { melhor = o[i].p - o[i - 1].p; t = (o[i].p + o[i - 1].p) / 2; }
    novoPonto(t);
  });
  palco.querySelector('[data-rampa="menos"]').addEventListener('click', tirarEscolhido);
  atualizarRampa();
  desenharPontos();

  // ---------- arrastar gira ----------
  let yaw = 0.5, pitch = G.inclinacao.inicial, mexeu = false, toque = null;
  canvas.addEventListener('pointerdown', (e) => {
    toque = { x: e.clientX, y: e.clientY, yaw, pitch };
    canvas.setPointerCapture(e.pointerId);
    if (!mexeu) { mexeu = true; dica.classList.add('sumiu'); }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!toque) return;
    yaw = toque.yaw + (e.clientX - toque.x) * G.sensibilidade;
    pitch = Math.min(G.inclinacao.max, Math.max(G.inclinacao.min, toque.pitch + (e.clientY - toque.y) * G.sensibilidade * 0.6));
  });
  const soltar = () => { toque = null; };
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);

  // ---------- tamanho e laço (só roda enquanto aparece) ----------
  const _alvo = new THREE.Vector3(0, 0.34, 0);
  let w = 1, h = 1;
  function tamanho() {
    const r = palco.getBoundingClientRect();
    if (!r.width) return;
    w = r.width; h = r.height;
    renderer.setSize(w, h, false);
    // tela em pé (celular): mais folga, ela fica entre os números (em cima) e a rampa (embaixo)
    const emPe = w / h < 1;
    _alvo.y = emPe ? 0.42 : 0.34;
    const alt = emPe ? 1.75 : G.alturaQuadro, larg = alt * (w / h);
    camera.left = -larg / 2; camera.right = larg / 2; camera.top = alt / 2; camera.bottom = -alt / 2;
    camera.updateProjectionMatrix();
  }
  const obsTamanho = new ResizeObserver(tamanho);
  obsTamanho.observe(palco);
  tamanho();

  const DIST = 5, _frente = new THREE.Vector3();
  function desenhar(dt) {
    if (!mexeu) yaw += G.giroSozinho * dt;
    giro.rotation.y = yaw;
    camera.position.set(0, _alvo.y + Math.sin(pitch) * DIST, Math.cos(pitch) * DIST);
    camera.lookAt(_alvo);
    camera.updateMatrixWorld();
    // mede o ponto mais perto e o mais longe dela AGORA (como ela está girada): a rampa inteira cai em cima dela,
    // o mais perto da câmera é branco e o mais longe é escuro, igual ao Mist ajustado à mão no Blender
    if (amostras.length) {
      const cy = Math.cos(yaw), sy = Math.sin(yaw);
      camera.getWorldDirection(_frente);
      const cam = camera.position;
      let perto = Infinity, longe = -Infinity;
      for (let i = 0; i < amostras.length; i += 3) {
        const x = amostras[i], y = amostras[i + 1], z = amostras[i + 2];
        const wx = x * cy + z * sy, wz = -x * sy + z * cy;      // o mesmo giro do grupo (rotation.y = yaw)
        const d = (wx - cam.x) * _frente.x + (y - cam.y) * _frente.y + (wz - cam.z) * _frente.z;
        if (d < perto) perto = d;
        if (d > longe) longe = d;
      }
      uni.uPerto.value = perto;
      uni.uLonge.value = perto + (longe - perto) * aperto;
    }
    renderer.render(cena, camera);
  }
  let raf = 0, visivel = false, antes = 0;
  function laco(agora) {
    if (!visivel) return;
    const dt = Math.min(0.05, Math.max(0, (agora - (antes || agora)) / 1000));
    antes = agora;
    desenhar(dt);
    raf = requestAnimationFrame(laco);
  }
  const obs = new IntersectionObserver((avisos) => {
    const era = visivel;
    visivel = avisos[avisos.length - 1].isIntersecting;
    if (visivel && !era) { antes = 0; raf = requestAnimationFrame(laco); }
  });
  obs.observe(palco);

  return {
    destruir() {
      vivo = false; visivel = false;
      obs.disconnect(); obsTamanho.disconnect(); cancelAnimationFrame(raf);
      for (const p of modelos.values()) {
        p.then(({ o }) => o.traverse((m) => { if (m.isMesh) m.geometry.dispose(); })).catch(() => {});
      }
      chao.geometry.dispose(); chao.material.dispose(); material.dispose(); texRampa.dispose();
      renderer.dispose(); renderer.forceContextLoss();   // devolve a memória da placa na hora (celular)
    },
  };
}
