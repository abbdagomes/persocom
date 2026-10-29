// =====================================================================
//  GRID DE LETRAS DO CYNTH — os dois arquivos do TouchDesigner da Ana refeitos em 3D (Three.js)
//  Igual ao Touch: uma geometria (um quadradinho) instanciada em cada ponto de uma grade; a grade se mistura
//  com outra forma (mathcombine mix, por lfo1 + scurve1); um "campo" (field POP) faz as peças crescerem e
//  as letras embaralharem (PointScale + Weight · w + Noisew × Weight); câmera em perspectiva.
//  Dois formatos (botões no canto):
//    - bolinhas  → "cynth gridizin.toe": bolinhas cinza-lilás, letra branca, grade ↔ bloco irregular no meio (4:5)
//    - quadrados → "quadrados letras cynth.toe": quadrados limão, letra preta, grade ↔ esfera (16:9)
//  Mouse: o campo segue o mouse no plano da grade · arrastar gira a câmera em volta · 2 cliques volta a câmera.
//  (as abas ficaram como o vídeo que a Ana fez no Touch — projetos/cynth/abas.mp4)
//  Item no projetos.js: { gradeLetras: { fonte } }
// =====================================================================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { carregarFonte } from './testador.js';

// o texto do Touch (text2), letra por letra; a quebra de linha vira peça vazia
const TEXTO = 'abcdefghijklmnopqrstuvwxyz\nABCDEFGHIJKLMNOPGRSTUVWXYZ!@?^~*%$#';
const CORES_MARCA = ['#8488a4', '#ef4b91', '#1aecca', '#bcfc54'];   // cinza-lilás, rosa, azul, limão

const FORMATOS = {
  bolinhas: {          // medido nos frames gravados do "cynth gridizin.toe"
    nome: 'bolinhas', forma: 0, aspecto: 4 / 5, colunas: 17,
    fundo: '#bcbcbc', cor: '#8488a4', corLetra: '#f1f1f1',
    base: 0.62, cresce: 0.62,                 // bolinha = 62% da célula; no campo cresce até encostar nas vizinhas
    alvo: 'bloco', bloco: 0.47,               // pointgen "rectangle": bloco irregular com 47% da largura
  },
  quadrados: {         // medido nos frames gravados do "quadrados letras cynth.toe"
    nome: 'quadradinhos', forma: 1, aspecto: 16 / 9, colunas: 20,
    fundo: '#e4e4e4', cor: '#bcfc54', corLetra: '#000000',
    base: 0.65, cresce: 0.5,
    alvo: 'esfera', esfera: 0.36,             // pointgen esfera: raio = 36% da altura da grade
  },
};
const CONFIG_GRADE = {
  raio: { min: 1.9, max: 5.1 },              // raio do campo em células (no Touch: limit 1,9 → 5,1)
  transicao: 0.64,                           // borda suave do campo (transitionrange 0,641)
  transformacao: { frequencia: 0.1, borda: 0.18 },   // lfo 0,1 Hz (ida e volta em 10 s) · tempo parado em cada forma
  fov: 34,                                   // abertura da câmera (graus)
};

// a cor exatamente como no hex (o sombreador escreve direto na tela, sem conversão de cor)
const rgb = (hex) => new THREE.Vector3(...[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255));
const onda = (t, s) => Math.sin(t * 0.71 + s) * 0.5 + Math.sin(t * 0.37 + s * 2.3) * 0.32 + Math.sin(t * 1.13 + s * 0.7) * 0.18;

// ---------- as letras da Cynth num atlas (16 × 16 células, uma por código de caractere) ----------
function criarAtlas(fonte) {
  const cel = 128, c = document.createElement('canvas');
  c.width = c.height = cel * 16;
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.textAlign = 'center';
  g.font = `${cel * 0.46}px ${fonte}`;
  for (let code = 33; code < 256; code++) {
    const ch = String.fromCharCode(code);
    const m = g.measureText(ch);
    const x = (code % 16) * cel + cel / 2, y = Math.floor(code / 16) * cel + cel / 2;
    g.fillText(ch, x, y + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}

const VERTICE = /* glsl */`
  attribute vec3 aGrade;          // posição na grade
  attribute vec3 aForma;          // posição na outra forma (bloco / esfera)
  attribute vec3 aNormalForma;    // pra onde a peça olha na outra forma
  attribute float aIndice;        // número do ponto (qual letra do texto)
  uniform float uMix, uBase, uCresce, uRaio, uDentro, uTempo, uLen;
  uniform vec3 uCampo;
  uniform sampler2D uTexto;
  varying vec2 vUv;
  varying float vChar;
  float onda(float t, float s) { return sin(t * 0.71 + s) * 0.5 + sin(t * 0.37 + s * 2.3) * 0.32 + sin(t * 1.13 + s * 0.7) * 0.18; }
  void main() {
    vec3 P = mix(aGrade, aForma, uMix);
    vec3 N = normalize(mix(vec3(0.0, 0.0, 1.0), aNormalForma, uMix) + vec3(0.0, 0.0, 1e-4));
    // o campo (field POP): perto dele a peça cresce e a letra anda pelo texto (embaralha)
    float d = distance(P, uCampo);
    float f = d <= uDentro ? 1.0 : (d >= uRaio ? 0.0 : 1.0 - (d - uDentro) / (uRaio - uDentro));
    float peso = f * f * (3.0 - 2.0 * f);
    float escala = uBase * (1.0 + uCresce * peso);
    float pulo = peso > 0.02 ? floor(peso * 24.0 * (0.5 + 0.5 * onda(uTempo * 0.9, aIndice * 1.37))) : 0.0;
    float idx = mod(aIndice + pulo, uLen);
    vChar = floor(texture2D(uTexto, vec2((idx + 0.5) / uLen, 0.5)).r * 255.0 + 0.5);
    // a peça vira pra N (instance rotate to forward, como no Touch)
    vec3 cima = abs(N.y) > 0.99 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
    vec3 u = normalize(cross(cima, N));
    vec3 v = cross(N, u);
    vec3 pos = P + (u * position.x + v * position.y) * escala;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }`;
const FRAGMENTO = /* glsl */`
  uniform sampler2D uAtlas;
  uniform vec3 uCor, uCorLetra;
  uniform float uForma;           // 0 = bolinha · 1 = quadrado
  varying vec2 vUv;
  varying float vChar;
  void main() {
    float a = 1.0;
    if (uForma < 0.5) {
      float r = length(vUv - 0.5), w = fwidth(r);
      a = 1.0 - smoothstep(0.5 - w, 0.5, r);
    }
    if (a < 0.02) discard;
    vec2 cel = vec2(mod(vChar, 16.0), floor(vChar / 16.0));
    vec2 uvLetra = vec2((cel.x + vUv.x) / 16.0, 1.0 - (cel.y + 1.0 - vUv.y) / 16.0);
    float letra = texture2D(uAtlas, uvLetra).a;
    gl_FragColor = vec4(mix(uCor, uCorLetra, letra), a);
  }`;

export function montarGrade(raiz, cfg) {
  const G = CONFIG_GRADE;
  raiz.innerHTML = `
    <div class="cynth-palco cynth-grade">
      <canvas></canvas>
      <div class="cynth-formatos" role="group" aria-label="formato do grid">
        ${Object.entries(FORMATOS).map(([id, f], i) => `<button type="button" class="pilula${i ? '' : ' ativo'}" data-formato="${id}">${f.nome}</button>`).join('')}
      </div>
      <div class="cynth-cores" role="group" aria-label="cor das peças">
        ${CORES_MARCA.map((c) => `<button type="button" class="testador-cor" style="--cor:${c}" data-cor="${c}" aria-label="cor ${c}"></button>`).join('')}
      </div>
      <p class="cynth-dica">passe o mouse pelas letras · arraste pra girar em 3D · 2 cliques volta</p>
    </div>`;
  const palco = raiz.querySelector('.cynth-palco');
  const canvas = palco.querySelector('canvas');
  const dica = palco.querySelector('.cynth-dica');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const cena = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(G.fov, 1, 0.1, 400);
  const controles = new OrbitControls(camera, canvas);
  controles.enableDamping = true;
  controles.enablePan = false;
  controles.enableZoom = false;          // a rodinha continua rolando a página
  controles.rotateSpeed = 0.6;

  const textoCodigos = new Uint8Array(TEXTO.length * 4);
  [...TEXTO].forEach((ch, i) => { textoCodigos[i * 4] = ch.charCodeAt(0); });
  const texturaTexto = new THREE.DataTexture(textoCodigos, TEXTO.length, 1);
  texturaTexto.needsUpdate = true;

  const uni = {
    uMix: { value: 0 }, uBase: { value: 0.62 }, uCresce: { value: 0.6 }, uRaio: { value: 3 }, uDentro: { value: 1 },
    uTempo: { value: 0 }, uLen: { value: TEXTO.length }, uCampo: { value: new THREE.Vector3() },
    uTexto: { value: texturaTexto }, uAtlas: { value: criarAtlas("'Geist Mono', monospace") },
    uCor: { value: new THREE.Vector3() }, uCorLetra: { value: new THREE.Vector3() }, uForma: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({ vertexShader: VERTICE, fragmentShader: FRAGMENTO, uniforms: uni, side: THREE.DoubleSide });
  material.alphaToCoverage = true;      // borda da bolinha lisinha (com o antialias)
  carregarFonte(cfg.fonte).then(() => { uni.uAtlas.value.dispose(); uni.uAtlas.value = criarAtlas('Cynth'); }).catch(() => {});

  let malha = null, formato = null, colunas = 0, linhas = 0;
  function montarFormato(id) {
    formato = FORMATOS[id];
    palco.style.setProperty('--aspecto', formato.aspecto);
    palco.dataset.formato = id;
    colunas = formato.colunas;
    linhas = Math.ceil(colunas / formato.aspecto) + 1;
    const n = colunas * linhas;
    const grade = new Float32Array(n * 3), forma = new Float32Array(n * 3), normal = new Float32Array(n * 3), indice = new Float32Array(n);
    // aleatório com semente (pro bloco ficar sempre igual)
    let s = 7;
    const aleatorio = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < n; i++) {
      const c = i % colunas, l = Math.floor(i / colunas);
      grade.set([c - (colunas - 1) / 2, (linhas - 1) / 2 - l, 0], i * 3);
      if (formato.alvo === 'bloco') {
        const lado = formato.bloco * colunas;
        forma.set([(aleatorio() - 0.5) * lado, (aleatorio() - 0.5) * lado, (aleatorio() - 0.5) * 0.6], i * 3);
        normal.set([0, 0, 1], i * 3);
      } else {
        // esfera: pontos espalhados por igual numa espiral (de cima pra baixo, girando no ângulo de ouro);
        // na transição, cada coluna da grade vira um "fio" ondulado descendo, como no render do Touch
        const y = 1 - 2 * (i + 0.5) / n, raioAnel = Math.sqrt(1 - y * y), ang = i * 2.399963;
        const R = formato.esfera * linhas;
        const x = Math.sin(ang) * raioAnel, z = Math.cos(ang) * raioAnel;
        forma.set([x * R, y * R, z * R], i * 3);
        normal.set([x, y, z], i * 3);
      }
      indice[i] = i;
    }
    const geo = new THREE.InstancedBufferGeometry();
    const base = new THREE.PlaneGeometry(1, 1);
    geo.index = base.index;
    geo.setAttribute('position', base.attributes.position);
    geo.setAttribute('uv', base.attributes.uv);
    geo.setAttribute('aGrade', new THREE.InstancedBufferAttribute(grade, 3));
    geo.setAttribute('aForma', new THREE.InstancedBufferAttribute(forma, 3));
    geo.setAttribute('aNormalForma', new THREE.InstancedBufferAttribute(normal, 3));
    geo.setAttribute('aIndice', new THREE.InstancedBufferAttribute(indice, 1));
    geo.instanceCount = n;
    if (malha) { malha.geometry.dispose(); cena.remove(malha); }
    malha = new THREE.Mesh(geo, material);
    malha.frustumCulled = false;
    cena.add(malha);
    uni.uForma.value = formato.forma;
    uni.uBase.value = formato.base;
    uni.uCresce.value = formato.cresce;
    escolherCor(formato.cor);
    renderer.setClearColor(formato.fundo);
    palco.querySelectorAll('[data-formato]').forEach((b) => b.classList.toggle('ativo', b.dataset.formato === id));
    medir();
    voltarCamera();
  }
  function escolherCor(hex) {
    uni.uCor.value.copy(rgb(hex));
    // letra: a do formato (branca nas bolinhas, preta nos quadrados); letra branca no limão ou no azul some → fica preta
    const clara = hex === '#bcfc54' || hex === '#1aecca';
    uni.uCorLetra.value.copy(rgb(clara ? '#000000' : formato.corLetra));
    palco.querySelectorAll('[data-cor]').forEach((b) => b.classList.toggle('ativa', b.dataset.cor === hex));
  }
  // câmera de frente, enquadrando a grade inteira
  function voltarCamera() {
    const altura = linhas - 1, largura = colunas;
    const t = Math.tan(THREE.MathUtils.degToRad(G.fov / 2));
    const dist = Math.max(altura / 2 / t, largura / 2 / (t * camera.aspect)) * 0.98;
    camera.position.set(0, 0, dist);
    controles.target.set(0, 0, 0);
    controles.update();
  }
  function medir() {
    const w = palco.clientWidth, h = palco.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  // ---------- o campo: segue o mouse (no plano da grade) ou passeia sozinho (noise1 do Touch) ----------
  const campo = { pos: new THREE.Vector3(), alvo: new THREE.Vector3(), anterior: new THREE.Vector3(), raio: G.raio.min, velocidade: 0 };
  const raycaster = new THREE.Raycaster(), plano = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), _p = new THREE.Vector2(), _hit = new THREE.Vector3();
  let mouseNoPlano = null, ultimoMouse = -99, tempo = 0;
  palco.addEventListener('pointermove', (e) => {
    if (e.target !== canvas) return;
    const r = canvas.getBoundingClientRect();
    _p.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(_p, camera);
    mouseNoPlano = raycaster.ray.intersectPlane(plano, _hit) ? _hit.clone() : null;
    ultimoMouse = tempo;
    dica.classList.add('sumiu');
  });
  canvas.addEventListener('pointerleave', () => { mouseNoPlano = null; });
  canvas.addEventListener('dblclick', voltarCamera);
  palco.querySelector('.cynth-formatos').addEventListener('click', (e) => {
    const b = e.target.closest('[data-formato]');
    if (b && FORMATOS[b.dataset.formato] !== formato) montarFormato(b.dataset.formato);
  });
  palco.querySelector('.cynth-cores').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cor]');
    if (b) escolherCor(b.dataset.cor);
  });

  function quadro(dt) {
    tempo += dt;
    uni.uTempo.value = tempo;
    if (mouseNoPlano && tempo - ultimoMouse < 3) campo.alvo.copy(mouseNoPlano);
    else campo.alvo.set(colunas * 0.3 * onda(tempo * 0.3, 1.7), linhas * 0.3 * onda(tempo * 0.33, 5.2), 0);
    campo.pos.lerp(campo.alvo, 1 - Math.exp(-dt * 6));
    // raio pela velocidade (no Touch: slope → lag → limit 1,9..5,1)
    campo.velocidade += campo.pos.distanceTo(campo.anterior);
    campo.anterior.copy(campo.pos);
    const alvoRaio = Math.min(G.raio.max, Math.max(G.raio.min, G.raio.min + campo.velocidade * 0.8));
    campo.raio += (alvoRaio - campo.raio) * (1 - Math.exp(-dt * 2.5));
    campo.velocidade *= Math.exp(-dt * 5);
    uni.uCampo.value.copy(campo.pos);
    uni.uRaio.value = campo.raio;
    uni.uDentro.value = campo.raio * (1 - G.transicao);
    // a transformação (lfo + curva em S: fica um tempo em cada forma)
    const lfo = 0.5 + 0.5 * Math.sin(tempo * Math.PI * 2 * G.transformacao.frequencia - Math.PI / 2);
    const u = Math.min(1, Math.max(0, (lfo - G.transformacao.borda) / (1 - 2 * G.transformacao.borda)));
    uni.uMix.value = u * u * (3 - 2 * u);
    controles.update();
    renderer.render(cena, camera);
  }

  // só anima enquanto aparece na tela
  let raf = 0, visivel = false, ultimo = 0;
  const passo = (agora) => {
    const dt = Math.min(0.05, Math.max(0, (agora - ultimo) / 1000));
    ultimo = agora;
    quadro(dt);
    raf = visivel ? requestAnimationFrame(passo) : 0;
  };
  const obs = new IntersectionObserver(([e]) => {
    visivel = e.isIntersecting;
    if (visivel && !raf) { ultimo = performance.now(); raf = requestAnimationFrame(passo); }
  });
  obs.observe(palco);
  const obsTamanho = new ResizeObserver(() => { medir(); });
  obsTamanho.observe(palco);
  montarFormato('bolinhas');

  return {
    destruir() {
      obs.disconnect(); obsTamanho.disconnect(); cancelAnimationFrame(raf); visivel = false;
      controles.dispose();
      malha?.geometry.dispose(); material.dispose(); uni.uAtlas.value.dispose(); texturaTexto.dispose();
      renderer.dispose();
    },
  };
}
