import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { carregamento } from './carregamento.js';

// =====================================================================
//  CONFIGURAÇÕES — mexa aqui sem medo
// =====================================================================
const CONFIG = {
  // Caminho do seu personagem exportado do Blender (.glb)
  modelo: 'modelo/personagem.glb?v=4',

  // Nome do osso da cabeça. Com Rigify exportando "só ossos de deformação"
  // o osso da cabeça é o DEF-spine.006. Se não achar, olhe o console (F12):
  // lá aparece a lista de todos os ossos do seu modelo.
  ossoCabeca: ['DEF-spine.006', 'head', 'spine.006', 'Head', 'cabeca'],

  // Nome da animação (como está no Blender). null = toca todas juntas (corpo + shape keys)
  animacao: null,
  // Quadro da animação usado como pose parada (quando o mouse está longe).
  // Veja na linha do tempo do Blender qual quadro tem a pose que você quer.
  quadroParado: 0,
  // A animação do Blender tem duas partes: a "normal" (toca quando o mouse chega perto) e o GIRO
  // (toca quando a pessoa troca a textura dela com uma foto — ver transformacao.js)
  animacaoAte: 163,          // último quadro da animação normal
  giro: {
    de: 170, ate: 222,       // quadros do giro (no 222 o corpo já voltou pra frente)
    duracao: 1.3,            // segundos (o giro original tem ~2,2 s; aqui toca bem mais rápido — pedido da Ana)
    trocaEm: 0.52,           // em que ponto do giro (0 a 1) a textura troca — no auge da névoa de glitter
  },

  // Usa só as malhas presas no rig (ignora chão, bolhas e outros objetos que vierem juntos na exportação)
  somenteMalhasDoRig: true,

  // Gira a personagem (graus). 180 = vira de frente se ela estiver de costas
  girarPersonagem: 180,

  // Toon shader do Blender não é exportado, então o site recria.
  // Materiais que chegarem vazios recebem esta textura com sombreado toon.
  texturaToon: 'modelo/textura.png',
  // Se algum material usar outra imagem, coloque aqui: { 'nomeDoMaterial': 'modelo/outra.png' }
  texturasPorMaterial: {},
  toonSombra: 0.85,          // quão clara é a sombra (0 = preta, 1 = sem sombra)
  toonSuavidade: 0.57,       // igual ao "Shadow Blur" do seu shader
  toonBrilhoBorda: 0.35,     // luz na borda (rim light)

  // Boca com degradê (nome do material da boca no Blender e as duas cores)
  // se o degradê ficar de cabeça pra baixo, troque "inverter" pra true/false
  boca: { material: 'boca', corCima: '#ffffff', corBaixo: '#7a7a7a', inverter: true },

  // Blush nas bochechas (feito pelo site, preso no osso da cabeça)
  blush: {
    ativo: false,            // desligado: o blush agora está na textura
    distancia: 0.05,         // afastamento do centro do rosto (pros lados)
    altura: 0.05,            // altura em relação ao pescoço
    tamanho: 0.04,
    opacidade: 0.75,
  },

  // Piscar sozinha enquanto olha o mouse (usa a shape key do Blender)
  piscar: {
    ativo: true,
    shapeKey: 'pisca',       // nome da shape key
    intervaloMin: 2,         // segundos entre uma piscada e outra (sorteado entre min e max)
    intervaloMax: 5,
    duracao: 0.18,           // quanto tempo dura a piscada
  },

  // Respiração enquanto ela está parada (feita pelo site, não precisa animar no Blender)
  respirar: {
    ativo: true,
    duracao: 3.6,            // segundos de cada respiração (puxar + soltar o ar)
    peito: 2.5,              // quanto o peito inclina (graus)
    ombros: 2,               // quanto os ombros sobem (graus)
    // ossos do Rigify usados (no .glb os ombros, braços e busto ficam soltos, então o site move eles junto)
    ossosPeito: ['DEF-spine.002', 'DEF-spine.003'],
    ossosOmbros: ['DEF-shoulder.L', 'DEF-shoulder.R'],
    ossosBracos: ['DEF-upper_arm.L', 'DEF-upper_arm.R'],
    ossosBusto: ['DEF-breast.L', 'DEF-breast.R'],
  },

  alturaPersonagem: 1.8,  // tamanho do personagem na cena
  distanciaPerto: 170,       // em pixels: mais perto que isso = toca a animação
  giroMaxHorizontal: 0.7,    // quanto a cabeça gira pros lados (radianos)
  giroMaxVertical: 0.35,     // quanto a cabeça gira pra cima/baixo

  corFundo: '#ffffff',
  chaoCor1: '#ffffff',
  chaoCor2: '#f0f0f0',
  chaoTamanhoQuadrado: 0.35,
  chaoDistanciaSumir: 22,    // a partir de onde o chão some no horizonte
  chaoVelocidade: 0,         // coloque 0.3 pro chão andar em direção à câmera

  // Sombra no chão (uma mancha suave, puxada pra trás e pro lado como na referência)
  sombra: { opacidade: 0.22, comprimento: 1.6, largura: 0.55, angulo: 35 },

  // Bolhas exportadas do Blender (pode ter várias, ex: uma com cada cabecinha).
  // Se nenhum arquivo existir, aparecem bolhas de teste feitas por código.
  modelosBolhas: ['modelo/bolha-cabeca.glb?v=2'],
  girarBolhas: 180,          // gira a cabecinha de frente (igual a personagem)
  // cor de cada bolha (vai alternando). A cabecinha ganha xadrez nessa cor.
  coresBolhas: ['#ff6fae', '#7ddf6a', '#62cfe6', '#ffae5c', '#a88cff'],
  xadrezBolha: {
    tamanhoQuadrado: 0.26,   // tamanho de cada quadradinho (maior = quadrados maiores)
    clarear: 0.3,            // quão mais clara é a segunda cor do xadrez
    brilho: 0.25,            // 0 = bem brilhante, 1 = fosco
  },
  // Objetos com esse pedaço no nome ganham o material de bolha de sabão
  // (materiais feitos com nodes no Blender não são exportados, então o site recria)
  nomeVidro: 'bolha',
  // Visual das bolhas (estilo emoji da Apple, menos saturado)
  estiloBolha: {
    corRosa: '#f7a8cf',
    corAzul: '#94d3ec',
    saturacao: 0.7,               // 0 = bolha toda branca, 1 = cores mais fortes
    opacidadeCentro: 0.1,         // bolhas soltas: quão leitoso é o meio (cobre a cabecinha)
    opacidadeCentroCapacete: 0.06, // capacete: meio quase transparente pra ver o rosto
  },
  quantidadeBolhas: 7,
  tempoVoltarBolha: 3,       // segundos até a bolha estourada voltar
  somEstouro: true,
};

// =====================================================================
//  CENA, CÂMERA E LUZ
// =====================================================================
const canvas = document.getElementById('cena');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.NeutralToneMapping;
// a tela é desenhada em duas etapas (chão, depois personagem), então limpamos na mão
renderer.autoClear = false;
renderer.setClearColor(CONFIG.corFundo);

const scene = new THREE.Scene();

// "estúdio" invisível que dá reflexos bonitos nas bolhas e no capacete
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

// DUAS CÂMERAS:
//  - cameraChao: em perspectiva, só pro chão (é ela que faz o xadrez sumir no horizonte)
//  - camera: ortográfica, pra personagem e as bolhas (sem distorção de perspectiva)
// O chão fica na "camada 1" e só a cameraChao enxerga ela.
const CAMADA_CHAO = 1;
const cameraChao = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 200);
cameraChao.layers.set(CAMADA_CHAO);
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
camera.position.set(0, 0, 20); // olhando reto pra frente

const _proj = new THREE.Vector3();
const baseChao = new THREE.Quaternion(); // pra onde a câmera do chão olha "de frente" (antes de virar)
function enquadrarCamera() {
  const aspecto = innerWidth / innerHeight;
  cameraChao.aspect = aspecto;
  // no celular (tela em pé) afasta a câmera pra caber o personagem
  const distancia = aspecto < 1 ? 7 / aspecto * 0.75 : 7;
  cameraChao.position.set(0, 1.4, distancia);
  cameraChao.lookAt(0, 0.75, 0);
  cameraChao.updateProjectionMatrix();
  cameraChao.updateMatrixWorld();
  baseChao.copy(cameraChao.quaternion);
  // a ortográfica fica na mesma distância, pra quando as duas virarem juntas tudo "andar" igual
  camera.position.set(0, 0, distancia);

  // calibra a ortográfica: os pés (y=0) e o topo da cabeça ficam no mesmo lugar
  // da tela em que a câmera em perspectiva mostraria. Assim ela "pisa" certinho no chão.
  const pes = _proj.set(0, 0, 0).project(cameraChao).y;
  const topo = _proj.set(0, CONFIG.alturaPersonagem, 0).project(cameraChao).y;
  const meiaAltura = CONFIG.alturaPersonagem / (topo - pes);
  const centroY = -pes * meiaAltura;
  camera.top = centroY + meiaAltura;
  camera.bottom = centroY - meiaAltura;
  camera.left = -meiaAltura * aspecto;
  camera.right = meiaAltura * aspecto;
  camera.updateProjectionMatrix();
}
enquadrarCamera();

scene.add(new THREE.HemisphereLight(0xffffff, 0xdddddd, 1.2));
const sol = new THREE.DirectionalLight(0xffffff, 1.6);
sol.position.set(-2.5, 6, 4);
scene.add(sol);

// =====================================================================
//  CHÃO INFINITO (xadrez feito por código, some no horizonte)
// =====================================================================
const materialChao = new THREE.ShaderMaterial({
  uniforms: {
    uCor1: { value: new THREE.Color(CONFIG.chaoCor1) },
    uCor2: { value: new THREE.Color(CONFIG.chaoCor2) },
    uFundo: { value: new THREE.Color(CONFIG.corFundo) },
    uTamanho: { value: CONFIG.chaoTamanhoQuadrado },
    uSumir: { value: CONFIG.chaoDistanciaSumir },
    uDeslocamento: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec3 vMundo;
    void main() {
      vec4 mundo = modelMatrix * vec4(position, 1.0);
      vMundo = mundo.xyz;
      gl_Position = projectionMatrix * viewMatrix * mundo;
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 uCor1, uCor2, uFundo;
    uniform float uTamanho, uSumir, uDeslocamento;
    varying vec3 vMundo;
    void main() {
      vec2 p = vMundo.xz + vec2(0.0, uDeslocamento);
      vec2 celula = floor(p / uTamanho);
      float xadrez = mod(celula.x + celula.y, 2.0);
      vec3 cor = mix(uCor1, uCor2, xadrez);
      float d = length(vMundo.xz - cameraPosition.xz);
      float nevoa = smoothstep(uSumir * 0.25, uSumir, d);
      gl_FragColor = vec4(mix(cor, uFundo, nevoa), 1.0);
      #include <colorspace_fragment>
    }`,
});
const chao = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), materialChao);
chao.rotation.x = -Math.PI / 2;
chao.layers.set(CAMADA_CHAO);
scene.add(chao);

// sombra suave embaixo dela (desenhada no chão em perspectiva)
function texturaSombra() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,0,0,1)');
  grad.addColorStop(0.5, 'rgba(0,0,0,0.5)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
const sombra = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new THREE.MeshBasicMaterial({ map: texturaSombra(), transparent: true, opacity: CONFIG.sombra.opacidade, depthWrite: false })
);
sombra.rotation.x = -Math.PI / 2;
sombra.rotation.z = THREE.MathUtils.degToRad(CONFIG.sombra.angulo);
sombra.scale.set(CONFIG.sombra.comprimento, CONFIG.sombra.largura, 1);
// empurra a sombra pro lado dela (fica "atrás" da personagem, como na referência)
const direcaoSombra = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), sombra.rotation.z);
sombra.position.copy(direcaoSombra.multiplyScalar(CONFIG.sombra.comprimento * 0.4)).setY(0.003);
sombra.layers.set(CAMADA_CHAO);
scene.add(sombra);

// =====================================================================
//  MOUSE
// =====================================================================
const mouse = { x: innerWidth / 2, y: innerHeight / 2, dentro: false };
addEventListener('pointermove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  mouse.dentro = true;
});
document.documentElement.addEventListener('mouseleave', () => { mouse.dentro = false; });

// =====================================================================
//  PERSONAGEM
// =====================================================================
const personagem = {
  raiz: null,
  cabeca: null,
  cabecaRepouso: new THREE.Quaternion(),
  mixer: null,
  acao: null,
  acaoParada: null,
  acaoGiro: null,
  girando: null,           // { aoTrocar, aoTerminar, trocou } enquanto gira
  pesoGiro: 0,
  materiaisToon: [],       // materiais que usam a textura (os que trocam pela foto)
  animando: false,
  pesoOlhar: 1,
  yaw: 0,
  pitch: 0,
  pesoAnim: 0,
  pontoCabeca: new THREE.Vector3(),
  piscaAlvos: [],
  ossosRespiracao: [],
  tempoRespiracao: 0,
  proximaPiscada: 2,
  tempoPiscada: -1,
};
window.personagem = personagem; // pra investigar pelo console (F12)

// avisa a tela de carregamento quando a personagem estiver pronta
let marcarPersonagemPronto;
const personagemPronto = new Promise((ok) => { marcarPersonagemPronto = ok; });
// aceita arquivos exportados com "Compressão" (Draco) ligada no Blender — ficam bem menores
const draco = new DRACOLoader().setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/libs/draco/');
const carregador = new GLTFLoader().setDRACOLoader(draco);

carregador.load(
  CONFIG.modelo,
  (gltf) => montarPersonagem(gltf.scene, gltf.animations),
  (e) => {
    // a personagem é quase tudo que o site baixa: vale até 85% da barra
    if (e.total) carregamento.progresso((e.loaded / e.total) * 0.85);
  },
  (erro) => {
    console.warn('Não achei o modelo, usando boneco de teste.', erro);
    mostrarAviso(`Modelo não encontrado — mostrando um boneco de teste. Coloque seu arquivo em <b>${CONFIG.modelo}</b>`);
    bonecoTeste = criarBonecoTeste();
    montarPersonagem(bonecoTeste, bonecoTeste.animations);
  }
);

function montarPersonagem(obj, animacoes) {
  // Proteção: se a exportação trouxe a cena inteira (chão, bolhas, widgets do Rigify...),
  // fica só com as malhas presas no rig (o corpo e o capacete).
  if (CONFIG.somenteMalhasDoRig && obj !== bonecoTeste) {
    const soltas = [];
    obj.traverse((o) => { if (o.isMesh && !o.isSkinnedMesh) soltas.push(o); });
    const temRig = obj.getObjectByProperty('isSkinnedMesh', true);
    if (temRig && soltas.length) {
      console.log('Ignorando objetos que não são da personagem:', soltas.map((o) => o.name));
      soltas.forEach((o) => o.removeFromParent());
    }
  }

  obj.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = !ehVidro(o);
      if (o.isSkinnedMesh) o.frustumCulled = false;
    }
  });
  aplicarVidro(obj, materialCapacete);
  if (obj !== bonecoTeste) aplicarToon(obj);

  obj.rotation.y = THREE.MathUtils.degToRad(obj === bonecoTeste ? 0 : CONFIG.girarPersonagem);
  normalizarTamanho(obj);
  scene.add(obj);
  personagem.raiz = obj;

  // --- acha o osso da cabeça ---
  const limpar = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const ossos = [];
  obj.traverse((o) => { if (o.isBone || o.name) ossos.push(o); });
  console.log('Ossos/objetos do modelo:', ossos.filter((o) => o.isBone).map((o) => o.name));

  for (const nome of CONFIG.ossoCabeca) {
    const achado = ossos.find((o) => limpar(o.name) === limpar(nome));
    if (achado) { personagem.cabeca = achado; break; }
  }
  if (!personagem.cabeca) {
    personagem.cabeca = ossos.find((o) => o.isBone && /head|cabeca/i.test(o.name) && !/mch|org|tweak/i.test(o.name));
  }
  if (personagem.cabeca) {
    personagem.cabecaRepouso.copy(personagem.cabeca.quaternion);
    console.log('Osso da cabeça:', personagem.cabeca.name);
  } else {
    console.warn('Não achei o osso da cabeça. Coloque o nome certo em CONFIG.ossoCabeca');
  }

  // --- animação ---
  if (animacoes && animacoes.length) {
    console.log('Animações do modelo:', animacoes.map((a) => a.name));
    // Junta todas as animações numa só: a do rig (corpo) + a das shape keys (rosto).
    // Se CONFIG.animacao tiver um nome, usa só aquela.
    const escolhida = CONFIG.animacao && THREE.AnimationClip.findByName(animacoes, CONFIG.animacao);
    const tudo = escolhida || new THREE.AnimationClip('tudo', -1, animacoes.flatMap((a) => a.tracks));
    const fps = 24;
    // a animação normal vai só até o quadro CONFIG.animacaoAte (depois disso, no Blender, vem o giro)
    const clip = tudo.duration * fps > CONFIG.animacaoAte + 2
      ? THREE.AnimationUtils.subclip(tudo, 'acao', 0, CONFIG.animacaoAte, fps) : tudo;
    personagem.mixer = new THREE.AnimationMixer(obj);
    personagem.acao = personagem.mixer.clipAction(clip);
    personagem.acao.setLoop(THREE.LoopRepeat);
    personagem.acao.setEffectiveWeight(0).play();

    // o giro (só existe se o .glb tiver os quadros dele)
    if (tudo.duration * fps >= CONFIG.giro.ate) {
      const clipGiro = THREE.AnimationUtils.subclip(tudo, 'giro', CONFIG.giro.de, CONFIG.giro.ate, fps);
      personagem.acaoGiro = personagem.mixer.clipAction(clipGiro);
      personagem.acaoGiro.setLoop(THREE.LoopOnce, 1);
      personagem.acaoGiro.clampWhenFinished = true;
      personagem.acaoGiro.setDuration(CONFIG.giro.duracao);
      personagem.acaoGiro.setEffectiveWeight(0);
    }

    // pose parada = um quadro da animação (em vez da T-pose do rig)
    const quadro = CONFIG.quadroParado;
    const clipParado = THREE.AnimationUtils.subclip(clip, 'parado', quadro, quadro + 1, fps);
    personagem.acaoParada = personagem.mixer.clipAction(clipParado);
    personagem.acaoParada.play();
  }

  // ponto fixo da cabeça (na pose parada) pra medir a distância do mouse
  if (personagem.mixer) personagem.mixer.update(0);
  if (personagem.cabeca) personagem.cabecaRepouso.copy(personagem.cabeca.quaternion);
  obj.updateMatrixWorld(true);
  (personagem.cabeca || obj).getWorldPosition(personagem.pontoCabeca);

  // malhas que têm a shape key de piscar
  obj.traverse((o) => {
    const indice = o.morphTargetDictionary?.[CONFIG.piscar.shapeKey];
    if (indice !== undefined) personagem.piscaAlvos.push({ malha: o, indice, base: o.morphTargetInfluences[indice] });
  });

  // ossos da respiração (peito e ombros do Rigify)
  const acharOsso = (nome) => ossos.find((o) => o.isBone && limpar(o.name) === limpar(nome));
  const grupos = [
    ['peito', CONFIG.respirar.ossosPeito],
    ['ombro', CONFIG.respirar.ossosOmbros],
    ['braco', CONFIG.respirar.ossosBracos],
    ['busto', CONFIG.respirar.ossosBusto],
  ];
  for (const [tipo, nomes] of grupos) {
    for (const nome of nomes) {
      const osso = acharOsso(nome);
      if (!osso) continue;
      const x = osso.getWorldPosition(new THREE.Vector3()).x;
      personagem.ossosRespiracao.push({
        osso, tipo, lado: x >= 0 ? 1 : -1,
        base: { p: osso.position.clone(), q: osso.quaternion.clone(), s: osso.scale.clone() },
      });
    }
  }
  console.log('Ossos da respiração:', personagem.ossosRespiracao.map((r) => r.osso.name));

  criarBlush();

  marcarPersonagemPronto();
}

let bonecoTeste = null;

// ---------- material toon (imita o "experiment cel_gp" do Blender) ----------
const carregadorTextura = new THREE.TextureLoader();
const cacheTexturas = {};
function carregarTextura(caminho) {
  if (!cacheTexturas[caminho]) {
    const t = carregadorTextura.load(caminho);
    t.flipY = false; // texturas de .glb não são invertidas
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    cacheTexturas[caminho] = t;
  }
  return cacheTexturas[caminho];
}

// ---------- FOTO "VESTIDA" NELA (troca de visual — ver transformacao.js e a seção do GIRO) ----------
// uModo: 0 = textura dela · 1 = foto espalhada na folha de UV (quando não acha rosto) · 2 = foto PROJETADA:
// o rosto da pessoa encaixado na cabeça (olhos nos olhos dela), cabelo atrás, e a roupa no vestido/braços/pernas.
// Medidas da personagem no Blender (pose de descanso, Z pra cima, frente = +Y):
const MEDIDAS_PERSONAGEM = {
  olhoX: 0.448,        // olhos em x = ±0,448 (centro das malhas dos olhos)
  olhoZ: 0.42,         // altura do centro dos olhos
  narizZ: 0.14,        // ponta do nariz
  bocaZ: -0.24,        // meio da boca
  queixoZ: -0.74,      // queixo / começo do pescoço (abaixo disso é o corpo)
  pesZ: -7.62,         // sola dos pés
  barraZ: -5.15,       // barra do vestido (daqui pra baixo: pernas)
  sapatoZ: -6.2,       // daqui pra baixo: os sapatos (continuam os dela)
  maoX: 3.9,           // daqui pra fora (na pose de descanso os braços ficam abertos, ao longo de x): mãos
  bracoY: -1.08, bracoProf: -0.145,   // eixo do braço (altura e profundidade), pra "enrolar" a manga em volta
  ombroX: 1.3,         // daqui pra fora são os braços (ficam "dobrados" pra dentro da roupa, viram as mangas)
  // o "globo" do olho dela (a parte que recebe o olho da pessoa): oval centrado em x ±0,45, altura 0,358
  globoX: 0.4505, globoZ: 0.358, globoMeiaLarg: 0.22, globoMeiaAlt: 0.346,
};
const UNI_FOTO = {
  uFoto: { value: null },
  uModo: { value: 0 },
  uCabeca: { value: new THREE.Vector4() },        // meio dos olhos na foto (px), escala k (px por unidade), metade da dist. dos olhos (px)
  uTamFoto: { value: new THREE.Vector2(1, 1) },   // largura/altura da foto (px)
  uGiroRosto: { value: new THREE.Vector2(1, 0) }, // cos/sen da inclinação do rosto na foto
  uRoupa: { value: new THREE.Vector4() },         // modo 2: retângulo da ROUPA na foto (px: x0, y0, x1, y1) — vazio = cor lisa
  uCorRoupa: { value: new THREE.Color() },        // modo 2: a cor que mais aparece na roupa (pernas, e o vestido se não tiver roupa na foto)
  uOlhoE: { value: new THREE.Vector4(0, 0.02, 0.16, 0.235) },   // pedaços da textura que continuam os dela: os olhos
  uOlhoD: { value: new THREE.Vector4(0.85, 0.02, 1, 0.235) },
};
const f3 = (x) => x.toFixed(3);
const GLSL_FOTO = /* glsl */`
  uniform sampler2D uFoto;
  uniform float uModo;
  uniform vec4 uCabeca, uRoupa, uOlhoE, uOlhoD;
  uniform vec2 uGiroRosto, uTamFoto;
  uniform vec3 uCorRoupa;
  varying vec3 vPosRep;
  varying vec3 vNorRep;
  bool dentro(vec2 u, vec4 r) { return u.x > r.x && u.x < r.z && u.y > r.y && u.y < r.w; }
  // passou da borda da foto? "espelha" de volta (sem as listras de esticar o último pixel)
  vec2 espelha(vec2 u) { return 1.0 - abs(1.0 - mod(u, 2.0)); }
  vec2 gira(vec2 d) { return vec2(d.x * uGiroRosto.x - d.y * uGiroRosto.y, d.x * uGiroRosto.y + d.y * uGiroRosto.x); }
  vec3 corDaFoto(vec2 uvTextura, vec3 original) {
    bool globo = dentro(uvTextura, uOlhoE) || dentro(uvTextura, uOlhoD);
    if (globo && uModo < 1.5) return original;                     // sem rosto achado: os olhos continuam os dela
    vec3 foto;
    if (globo) {
      // o OLHO DA PESSOA vira o olho dela: recorte em volta do olho da foto, esticado pra preencher o oval
      float meio = uCabeca.w;                                       // metade da distância entre os olhos NA FOTO (px)
      float lado = vPosRep.x > 0.0 ? -1.0 : 1.0;                    // o olho +x dela = o olho da esquerda na foto
      vec2 centro = uCabeca.xy + gira(vec2(lado * meio, 0.0));
      vec2 l = vec2(-(vPosRep.x - (-lado) * ${f3(MEDIDAS_PERSONAGEM.globoX)}) / ${f3(MEDIDAS_PERSONAGEM.globoMeiaLarg)},
                    -(vPosRep.y - ${f3(MEDIDAS_PERSONAGEM.globoZ)}) / ${f3(MEDIDAS_PERSONAGEM.globoMeiaAlt)});
      vec2 d = gira(l * vec2(meio * 0.62, meio * 0.42));              // tamanho do recorte: olho + pálpebra + cílios
      foto = texture2D(uFoto, espelha((centro + d) / uTamFoto)).rgb;
    } else if (uModo < 1.5) {
      foto = texture2D(uFoto, uvTextura).rgb;
    } else {
      // posição na pose de descanso, em medidas do Blender (o .glb troca: z do Blender = y, frente = -z)
      float bx = vPosRep.x, bz = vPosRep.y;
      float frente = -normalize(vNorRep).z;
      if (bz > ${f3(MEDIDAS_PERSONAGEM.queixoZ)}) {
        // cabeça: x da foto cresce pra direita de quem olha (= -x dela); y da foto cresce pra baixo (= -z)
        float dy = -(bz - ${f3(MEDIDAS_PERSONAGEM.olhoZ)});
        float atras = smoothstep(0.15, -0.35, frente);          // atrás da cabeça: cabelo (alto da cabeça na foto)
        dy = mix(dy, -1.15, atras);
        float k = uCabeca.z;
        vec2 d = gira(vec2(-bx, dy) * k);                         // em pixels da foto (mesma proporção nos dois eixos)
        foto = texture2D(uFoto, espelha((uCabeca.xy + d) / uTamFoto)).rgb;
        // em volta do globo (pálpebras, que fecham quando ela pisca): cor da pele da pessoa (pega logo abaixo do olho),
        // senão a pálpebra fechada mostraria o olho da foto de novo
        // (só do tamanho do globo, com borda suave — fora dele continua a foto normal)
        vec2 e = vec2((abs(bx) - ${f3(MEDIDAS_PERSONAGEM.globoX)}) / ${f3(MEDIDAS_PERSONAGEM.globoMeiaLarg)},
                      (bz - ${f3(MEDIDAS_PERSONAGEM.globoZ)}) / ${f3(MEDIDAS_PERSONAGEM.globoMeiaAlt)});
        float palpebra = (1.0 - smoothstep(0.7, 1.0, length(e))) * (1.0 - atras);
        float meioOlho = uCabeca.w;
        vec2 pele = uCabeca.xy + gira(vec2((bx > 0.0 ? -1.0 : 1.0) * meioOlho, meioOlho * 0.7));
        foto = mix(foto, texture2D(uFoto, espelha(pele / uTamFoto)).rgb, palpebra);
      } else {
        // CORPO com a roupa da foto "planificada": o pedaço de roupa abaixo do queixo é enrolado em volta dela
        // como um tubo (frente = roupa, costas = a mesma roupa espelhada, lados sem esticar)
        float zp = vPosRep.z;
        bool temRoupa = uRoupa.z - uRoupa.x > 2.0;
        if (bz < ${f3(MEDIDAS_PERSONAGEM.sapatoZ)}) {
          return original;                                          // sapatos: os dela
        } else if (bz < ${f3(MEDIDAS_PERSONAGEM.barraZ)}) {
          foto = uCorRoupa * 0.8;                                   // pernas: a cor da roupa, um tom mais escuro (meia/calça)
        } else if (abs(bx) > ${f3(MEDIDAS_PERSONAGEM.maoX)}) {
          // mãos: cor da pele da pessoa (pega logo abaixo do olho na foto)
          foto = texture2D(uFoto, espelha((uCabeca.xy + gira(vec2(-uCabeca.w, uCabeca.w * 0.7))) / uTamFoto)).rgb;
        } else if (abs(bx) > ${f3(MEDIDAS_PERSONAGEM.ombroX)} && bz > -4.2) {
          // braços (ao longo de x): mangas = a borda da roupa, enrolada em volta do braço
          float ang = atan(bz - ${f3(MEDIDAS_PERSONAGEM.bracoY)}, zp - ${f3(MEDIDAS_PERSONAGEM.bracoProf)}) / 3.14159;
          float ao = (abs(bx) - ${f3(MEDIDAS_PERSONAGEM.ombroX)}) / (${f3(MEDIDAS_PERSONAGEM.maoX)} - ${f3(MEDIDAS_PERSONAGEM.ombroX)});
          vec2 uvM = vec2((bx > 0.0 ? 0.08 : 0.92) + ang * 0.06, ao * 0.55);
          foto = temRoupa ? texture2D(uFoto, mix(uRoupa.xy, uRoupa.zw, uvM) / uTamFoto).rgb : uCorRoupa;
        } else {
          // vestido: ângulo em volta do corpo (0 = frente) → largura da roupa; altura (pescoço → barra) → altura da roupa
          float th = atan(bx, -zp);
          float t = abs(th) > 1.5708 ? sign(th) * (3.14159 - abs(th)) : th;   // costas = frente espelhada
          vec2 uvR = vec2(0.5 - t / 3.14159, (${f3(MEDIDAS_PERSONAGEM.queixoZ)} - bz) / (${f3(MEDIDAS_PERSONAGEM.queixoZ)} - ${f3(MEDIDAS_PERSONAGEM.barraZ)}));
          foto = temRoupa ? texture2D(uFoto, mix(uRoupa.xy, uRoupa.zw, uvR) / uTamFoto).rgb : uCorRoupa;
        }
      }
    }
    // mantém os brilhos dela (só os pontos MAIS claros da textura original — o braço dela é claro e não conta)
    float l = dot(original, vec3(0.2126, 0.7152, 0.0722));
    return mix(foto, vec3(1.0), smoothstep(0.86, 0.99, l) * 0.6);
  }`;

function criarMaterialToon(textura) {
  const mat = new THREE.MeshStandardMaterial({ map: textura, roughness: 1, metalness: 0 });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uSombra = { value: CONFIG.toonSombra };
    shader.uniforms.uSuave = { value: CONFIG.toonSuavidade };
    shader.uniforms.uBorda = { value: CONFIG.toonBrilhoBorda };
    Object.assign(shader.uniforms, UNI_FOTO);
    shader.vertexShader = shader.vertexShader
      .replace('void main() {', 'varying vec3 vPosRep;\nvarying vec3 vNorRep;\nvoid main() {')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPosRep = position;\nvNorRep = normal;')
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', 'uniform float uSombra, uSuave, uBorda;\n' + GLSL_FOTO + '\nvoid main() {')
      .replace('#include <map_fragment>', '#include <map_fragment>\nif (uModo > 0.5) diffuseColor.rgb = corDaFoto(vMapUv, diffuseColor.rgb);')
      .replace(
        '#include <opaque_fragment>',
        `
        // luz em "degraus" suaves: claro / sombra
        vec3 luzDir = normalize((viewMatrix * vec4(-0.5, 1.0, 0.8, 0.0)).xyz);
        float nl = dot(normal, luzDir) * 0.5 + 0.5;
        float degrau = smoothstep(0.5 - uSuave * 0.5, 0.5 + uSuave * 0.5, nl);
        vec3 cor = diffuseColor.rgb * mix(uSombra, 1.0, degrau);
        // luz de borda
        float borda = pow(1.0 - saturate(dot(normal, geometryViewDir)), 3.0);
        cor += borda * uBorda;
        outgoingLight = cor;
        #include <opaque_fragment>`
      );
  };
  return mat;
}

function criarMaterialBoca(geometria, lado) {
  // o degradê segue o UV da boca (a faixa "de cima pra baixo" da boca no mapa UV)
  const uv = geometria.attributes.uv;
  let minV = Infinity, maxV = -Infinity;
  for (let i = 0; i < uv.count; i++) {
    minV = Math.min(minV, uv.getY(i));
    maxV = Math.max(maxV, uv.getY(i));
  }
  const mat = new THREE.MeshBasicMaterial({ side: lado, name: CONFIG.boca.material });
  mat.onBeforeCompile = (s) => {
    s.uniforms.uMinV = { value: CONFIG.boca.inverter ? maxV : minV };
    s.uniforms.uMaxV = { value: CONFIG.boca.inverter ? minV : maxV };
    s.uniforms.uCima = { value: new THREE.Color(CONFIG.boca.corCima) };
    s.uniforms.uBaixo = { value: new THREE.Color(CONFIG.boca.corBaixo) };
    s.vertexShader = s.vertexShader
      .replace('void main() {', 'uniform float uMinV, uMaxV;\nvarying float vAltura;\nvoid main() {')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvAltura = (uv.y - uMinV) / (uMaxV - uMinV);');
    s.fragmentShader = s.fragmentShader
      .replace('void main() {', 'uniform vec3 uCima, uBaixo;\nvarying float vAltura;\nvoid main() {')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb = mix(uBaixo, uCima, smoothstep(0.1, 0.9, vAltura));');
  };
  return mat;
}

function aplicarToon(obj) {
  obj.traverse((o) => {
    if (!o.isMesh || ehVidro(o)) return;
    const m = o.material;
    // boca: degradê de cima pra baixo
    if (m.name === CONFIG.boca.material) {
      o.material = criarMaterialBoca(o.geometry, m.side);
      return;
    }
    // outro material com Emission: mostra a textura sem luz
    if (m.emissiveMap) {
      o.material = new THREE.MeshBasicMaterial({ map: m.emissiveMap, side: m.side, name: m.name });
      return;
    }
    if (m.map) return;
    const caminho = CONFIG.texturasPorMaterial[m.name] || CONFIG.texturaToon;
    if (!caminho) return;
    const novo = criarMaterialToon(carregarTextura(caminho));
    novo.side = m.side;
    novo.name = m.name;
    o.material = novo;
    personagem.materiaisToon.push(novo);
  });
}

// ---------- blush ----------
function texturaBlush() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const suave = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  suave.addColorStop(0, 'rgba(255,255,255,0.75)');
  suave.addColorStop(0.55, 'rgba(255,255,255,0.35)');
  suave.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = suave;
  g.fillRect(0, 0, 128, 128);
  const brilho = g.createRadialGradient(48, 44, 0, 48, 44, 22);
  brilho.addColorStop(0, 'rgba(255,255,255,0.9)');
  brilho.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = brilho;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function criarBlush() {
  const p = personagem;
  const B = CONFIG.blush;
  if (!B.ativo || !p.cabeca || p.raiz === bonecoTeste) return;

  // coloca na pose parada antes de medir
  if (p.mixer) p.mixer.update(0);
  p.raiz.updateMatrixWorld(true);

  const H = CONFIG.alturaPersonagem;
  const pescoco = p.cabeca.getWorldPosition(new THREE.Vector3());
  const malhas = [];
  p.raiz.traverse((o) => { if (o.isMesh && !ehVidro(o)) malhas.push(o); });

  // "transparent: false" + mistura manual: assim o blush aparece através do vidro do capacete
  const material = new THREE.MeshBasicMaterial({
    map: texturaBlush(),
    transparent: false,
    opacity: B.opacidade,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendSrc: THREE.SrcAlphaFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    polygonOffset: true,
    polygonOffsetFactor: -4,
  });
  material.onBeforeCompile = (s) => {
    // aplica a opacidade mesmo sem "transparent"
    s.fragmentShader = s.fragmentShader.replace('#include <opaque_fragment>', '#include <opaque_fragment>\ngl_FragColor.a = diffuseColor.a;');
  };
  const geo = new THREE.PlaneGeometry(B.tamanho * H, B.tamanho * H);
  const raio = new THREE.Raycaster();

  for (const lado of [-1, 1]) {
    // "atira" um raio de frente pro rosto e cola o blush onde bater
    const alvo = pescoco.clone().add(new THREE.Vector3(lado * B.distancia * H, B.altura * H, 0));
    raio.set(alvo.clone().setZ(alvo.z + 2), new THREE.Vector3(0, 0, -1));
    const hit = raio.intersectObjects(malhas, false)[0];
    if (!hit) continue;
    const centroCabeca = pescoco.clone().add(new THREE.Vector3(0, B.altura * H, -0.1 * H));
    const normal = hit.point.clone().sub(centroCabeca).normalize();
    const blush = new THREE.Mesh(geo, material);
    blush.renderOrder = 10; // desenha depois do rosto
    blush.position.copy(hit.point).addScaledVector(normal, 0.002);
    blush.lookAt(hit.point.clone().add(normal));
    p.cabeca.attach(blush);
  }
}

function normalizarTamanho(obj) {
  obj.updateMatrixWorld(true);
  const caixa = new THREE.Box3().setFromObject(obj);
  const altura = caixa.getSize(new THREE.Vector3()).y || 1;
  obj.scale.multiplyScalar(CONFIG.alturaPersonagem / altura);
  obj.updateMatrixWorld(true);
  caixa.setFromObject(obj);
  const centro = caixa.getCenter(new THREE.Vector3());
  obj.position.x -= centro.x;
  obj.position.z -= centro.z;
  obj.position.y -= caixa.min.y;
}

const _v = new THREE.Vector3();
const _qPai = new THREE.Quaternion();
const _qMundo = new THREE.Quaternion();
const _qGiro = new THREE.Quaternion();
const _euler = new THREE.Euler();

function atualizarPersonagem(dt) {
  const p = personagem;
  if (!p.raiz) return;

  // Desfaz o que o site mexeu no quadro anterior (giro da cabeça e piscada).
  // Importante: a animação só reescreve valores quando eles mudam, então sem isso
  // o olho podia ficar fechado ou a cabeça torta depois que ela para.
  if (p.cabeca) p.cabeca.quaternion.copy(p.cabecaRepouso);
  for (const alvo of p.piscaAlvos) alvo.malha.morphTargetInfluences[alvo.indice] = alvo.base;
  for (const r of p.ossosRespiracao) {
    r.osso.position.copy(r.base.p);
    r.osso.quaternion.copy(r.base.q);
    r.osso.scale.copy(r.base.s);
  }

  // onde a cabeça está na tela (em pixels). Usa o ponto fixo da pose parada,
  // senão a própria animação mexe a cabeça e muda a distância o tempo todo
  _v.copy(p.pontoCabeca).project(camera);
  const telaX = (_v.x + 1) / 2 * innerWidth;
  const telaY = (1 - _v.y) / 2 * innerHeight;
  const distancia = Math.hypot(mouse.x - telaX, mouse.y - telaY);
  // margem: entra perto de "distanciaPerto" e só sai 40% mais longe (evita ficar liga/desliga)
  const limite = p.animando ? CONFIG.distanciaPerto * 1.4 : CONFIG.distanciaPerto;
  // (numa galeria ela não está na tela, então não anima)
  const perto = !virada.galeria && mouse.dentro && distancia < limite;

  // perto → toca a animação | longe → para e volta a olhar o mouse
  // mistura suave entre a pose parada e a animação (sem saltos, mesmo se o mouse entra e sai rápido)
  if (p.acao) {
    if (perto && !p.animando) {
      // só recomeça do quadro 0 se a animação já tinha sumido por completo
      if (p.pesoAnim < 0.02) p.acao.time = 0;
      p.animando = true;
    } else if (!perto && p.animando) {
      p.animando = false;
    }
    p.pesoAnim = THREE.MathUtils.damp(p.pesoAnim, p.animando ? 1 : 0, 5, dt);
    p.acao.paused = !p.animando && p.pesoAnim < 0.02;
    // o giro (troca de textura) manda em tudo enquanto acontece
    if (p.acaoGiro) {
      p.pesoGiro = THREE.MathUtils.damp(p.pesoGiro, p.girando ? 1 : 0, p.girando ? 18 : 7, dt);
      if (!p.girando && p.pesoGiro < 0.01) { p.pesoGiro = 0; if (p.acaoGiro.isScheduled()) p.acaoGiro.stop(); }
      p.acaoGiro.setEffectiveWeight(p.pesoGiro);
    }
    p.acao.setEffectiveWeight(p.pesoAnim * (1 - p.pesoGiro));
    p.acaoParada.setEffectiveWeight((1 - p.pesoAnim) * (1 - p.pesoGiro));
  }
  if (p.mixer) p.mixer.update(dt);
  atualizarGiro(dt);
  // guarda os valores "limpos" da animação deste quadro
  if (p.cabeca) p.cabecaRepouso.copy(p.cabeca.quaternion);
  for (const alvo of p.piscaAlvos) alvo.base = alvo.malha.morphTargetInfluences[alvo.indice];
  for (const r of p.ossosRespiracao) {
    r.base.p.copy(r.osso.position);
    r.base.q.copy(r.osso.quaternion);
    r.base.s.copy(r.osso.scale);
  }

  // olha o mouse (e respira) na mesma medida em que NÃO está animando
  p.pesoOlhar = (p.acao ? 1 - p.pesoAnim : 1) * (1 - p.pesoGiro);
  piscar(dt);
  respirar(dt);

  if (!p.cabeca) return;

  // cabeça seguindo o mouse

  const dx = THREE.MathUtils.clamp((mouse.x - telaX) / (innerWidth * 0.5), -1, 1);
  const dy = THREE.MathUtils.clamp((telaY - mouse.y) / (innerHeight * 0.5), -1, 1);
  let alvoYaw = mouse.dentro ? dx * CONFIG.giroMaxHorizontal : 0;
  let alvoPitch = mouse.dentro ? -dy * CONFIG.giroMaxVertical : 0;
  // quando a câmera vira pra uma galeria, ela olha pro mesmo lado
  if (virada.galeria) {
    alvoYaw = Math.sign(-virada.alvoYaw) * CONFIG.giroMaxHorizontal;
    alvoPitch = virada.alvoPitch > 0 ? -CONFIG.giroMaxVertical : 0;
  }
  p.yaw = THREE.MathUtils.damp(p.yaw, alvoYaw, 7, dt);
  p.pitch = THREE.MathUtils.damp(p.pitch, alvoPitch, 7, dt);

  if (p.pesoOlhar < 0.001) return;

  // gira a cabeça no espaço do mundo
  _euler.set(p.pitch * p.pesoOlhar, p.yaw * p.pesoOlhar, 0, 'YXZ');
  _qGiro.setFromEuler(_euler);
  girarOssoNoMundo(p.cabeca, _qGiro);
}

// gira um osso no espaço do mundo (funciona com qualquer orientação de osso do Rigify)
function girarOssoNoMundo(osso, giro) {
  osso.parent.updateWorldMatrix(true, false);
  osso.parent.getWorldQuaternion(_qPai);
  _qMundo.multiplyQuaternions(_qPai, osso.quaternion).premultiply(giro);
  osso.quaternion.copy(_qPai.invert()).multiply(_qMundo);
}

// Respiração enquanto ela está parada: o peito sobe e inclina um tiquinho pra trás
// e os ombros sobem junto. Tudo bem sutil.
const _qResp = new THREE.Quaternion();
const _eixoX = new THREE.Vector3(1, 0, 0);
const _eixoZ = new THREE.Vector3(0, 0, 1);
const _m0 = new THREE.Matrix4();
const _mDelta = new THREE.Matrix4();
const _mTmp = new THREE.Matrix4();
const _escala = new THREE.Vector3();
const _pivo = new THREE.Vector3();

// aplica uma transformação "do mundo" num osso, mexendo posição e rotação
// (usado nos ossos que no .glb ficaram soltos na raiz, como ombros e braços)
function aplicarNoMundo(osso, delta) {
  osso.updateWorldMatrix(true, false);
  _mTmp.multiplyMatrices(delta, osso.matrixWorld);
  _mTmp.premultiply(_m0.copy(osso.parent.matrixWorld).invert());
  _mTmp.decompose(osso.position, osso.quaternion, _escala);
}

function respirar(dt) {
  const p = personagem;
  const R = CONFIG.respirar;
  const peito = p.ossosRespiracao.filter((r) => r.tipo === 'peito');
  if (!R.ativo || !peito.length) return;

  p.tempoRespiracao += dt;
  // curva de respiração: puxa o ar mais rápido e solta devagar
  const ciclo = (p.tempoRespiracao / R.duracao) % 1;
  const ar = ciclo < 0.4 ? Math.sin((ciclo / 0.4) * Math.PI / 2) : Math.cos(((ciclo - 0.4) / 0.6) * Math.PI / 2);
  const forca = ar * p.pesoOlhar;
  if (forca < 0.001) return;

  // 1) peito inclina um pouco pra trás (pescoço e cabeça vêm junto)
  const topoPeito = peito[peito.length - 1].osso;
  topoPeito.updateWorldMatrix(true, false);
  const antes = topoPeito.matrixWorld.clone();
  _qResp.setFromAxisAngle(_eixoX, -THREE.MathUtils.degToRad(R.peito) * forca);
  for (const r of peito) girarOssoNoMundo(r.osso, _qResp);
  topoPeito.updateWorldMatrix(true, false);
  _mDelta.multiplyMatrices(topoPeito.matrixWorld, antes.invert());

  // 2) ombros, braços e busto seguem o peito
  for (const r of p.ossosRespiracao) if (r.tipo !== 'peito') aplicarNoMundo(r.osso, _mDelta);

  // 3) ombros sobem: ombro + braço do mesmo lado giram em volta do ombro
  for (const lado of [-1, 1]) {
    const ombro = p.ossosRespiracao.find((r) => r.tipo === 'ombro' && r.lado === lado);
    if (!ombro) continue;
    ombro.osso.getWorldPosition(_pivo);
    _qResp.setFromAxisAngle(_eixoZ, THREE.MathUtils.degToRad(R.ombros) * forca * lado);
    _mDelta.makeTranslation(_pivo.x, _pivo.y, _pivo.z)
      .multiply(_mTmp.makeRotationFromQuaternion(_qResp))
      .multiply(_m0.makeTranslation(-_pivo.x, -_pivo.y, -_pivo.z));
    const delta = _mDelta.clone();
    for (const r of p.ossosRespiracao) {
      if ((r.tipo === 'ombro' || r.tipo === 'braco') && r.lado === lado) aplicarNoMundo(r.osso, delta);
    }
  }
}

// Piscada automática enquanto ela está parada olhando o mouse (usa a shape key "pisca")
function piscar(dt) {
  const p = personagem;
  const P = CONFIG.piscar;
  if (!P.ativo || !p.piscaAlvos.length) return;

  p.proximaPiscada -= dt;
  if (p.proximaPiscada <= 0 && p.tempoPiscada < 0) {
    p.tempoPiscada = 0;
    p.proximaPiscada = THREE.MathUtils.randFloat(P.intervaloMin, P.intervaloMax);
  }
  if (p.tempoPiscada < 0) return;

  p.tempoPiscada += dt;
  const fase = p.tempoPiscada / P.duracao;
  if (fase >= 1) {
    p.tempoPiscada = -1;
    return;
  }
  // fecha e abre (0 → 1 → 0). Só vale quando ela não está animando
  const valor = Math.sin(fase * Math.PI) * p.pesoOlhar;
  for (const { malha, indice } of p.piscaAlvos) {
    malha.morphTargetInfluences[indice] = Math.max(malha.morphTargetInfluences[indice], valor);
  }
}

// Boneco simples usado enquanto você não coloca o seu modelo
function criarBonecoTeste() {
  const g = new THREE.Group();
  const cinza = new THREE.MeshStandardMaterial({ color: 0xd4d4d4, roughness: 0.35, metalness: 0.15 });
  const escuro = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.4 });

  for (const x of [-0.11, 0.11]) {
    const perna = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.5), escuro);
    perna.position.set(x, 0.3, 0);
    const sapato = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 16), cinza);
    sapato.scale.set(1, 0.55, 1.3);
    sapato.position.set(x, 0.05, 0.03);
    g.add(perna, sapato);
  }

  const vestido = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.42, 0.72, 32), cinza);
  vestido.position.y = 0.88;
  g.add(vestido);

  const cabeca = new THREE.Group();
  cabeca.name = 'head';
  cabeca.position.y = 1.24;
  const rosto = new THREE.Mesh(new THREE.SphereGeometry(0.24, 32, 24), cinza);
  rosto.position.y = 0.27;
  for (const x of [-0.08, 0.08]) {
    const olho = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), escuro);
    olho.position.set(x, 0.3, 0.215);
    cabeca.add(olho);
  }
  const capacete = new THREE.Mesh(
    new THREE.SphereGeometry(0.36, 48, 32),
    new THREE.MeshPhysicalMaterial({ roughness: 0.05, transmission: 1, thickness: 0.05, iridescence: 0.6 })
  );
  capacete.position.y = 0.27;
  cabeca.add(rosto, capacete);
  g.add(cabeca);

  const criarBraco = (nome, x) => {
    const ombro = new THREE.Group();
    ombro.name = nome;
    ombro.position.set(x, 1.15, 0);
    const braco = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.38, 6, 12), cinza);
    braco.position.y = -0.22;
    ombro.add(braco);
    g.add(ombro);
    return ombro;
  };
  criarBraco('bracoDireito', 0.2).rotation.z = 0.25;
  criarBraco('bracoEsquerdo', -0.2).rotation.z = -0.25;

  // animação de "tchauzinho" (no seu modelo, é a animação do Blender)
  const q = (ang) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), ang).toArray();
  const trilha = new THREE.QuaternionKeyframeTrack(
    'bracoDireito.quaternion',
    [0, 0.3, 0.6, 0.9, 1.2],
    [...q(2.3), ...q(2.8), ...q(2.3), ...q(2.8), ...q(2.3)]
  );
  g.animations = [new THREE.AnimationClip('tchau', 1.2, [trilha])];
  return g;
}

// =====================================================================
//  BOLHAS DE SABÃO
// =====================================================================
// Bolha no estilo do emoji da Apple: branca leitosa, borda com arco-íris
// (rosa em cima/esquerda, azul embaixo/direita), "horizonte" no meio e um brilho no alto.
// É desenhada pelo site (não depende de luz), então fica igual em qualquer tela.
function criarMaterialBolha(opacidadeCentro) {
  const B = CONFIG.estiloBolha;
  const mat = new THREE.MeshStandardMaterial({ transparent: true, depthWrite: false, toneMapped: false });
  mat.onBeforeCompile = (s) => {
    s.uniforms.uCentro = { value: opacidadeCentro };
    s.uniforms.uRosa = { value: new THREE.Color(B.corRosa) };
    s.uniforms.uAzul = { value: new THREE.Color(B.corAzul) };
    s.uniforms.uSat = { value: B.saturacao };
    s.fragmentShader = s.fragmentShader
      .replace('void main() {', 'uniform float uCentro, uSat;\nuniform vec3 uRosa, uAzul;\nvoid main() {')
      .replace(
        '#include <opaque_fragment>',
        `#include <opaque_fragment>
        vec3 n = normalize(normal);
        float f = 1.0 - saturate(dot(n, geometryViewDir));       // 0 no meio, 1 na borda
        vec2 dir = normalize(n.xy + 1e-5);

        // corpo branco leitoso, mais forte na borda
        vec3 cor = vec3(1.0);
        float alpha = mix(uCentro, 0.95, pow(f, 1.5));

        // arco-íris da borda: rosa em cima/esquerda, azul embaixo/direita
        float lado = dot(dir, normalize(vec2(-0.6, 0.8))) * 0.5 + 0.5;
        vec3 arco = mix(uAzul, uRosa, smoothstep(0.3, 0.7, lado));
        float borda = smoothstep(0.35, 0.95, f);
        cor = mix(cor, arco, borda * uSat);

        // metade de baixo levemente azulada + linha do "horizonte"
        float baixo = smoothstep(0.0, -0.7, n.y) * (1.0 - borda);
        cor = mix(cor, mix(vec3(1.0), uAzul, 0.5), baixo * 0.35 * uSat);
        float horizonte = exp(-pow((n.y + 0.06) / 0.045, 2.0)) * (1.0 - f);
        cor = mix(cor, uAzul * 0.8, horizonte * 0.3 * uSat);
        alpha += horizonte * 0.15;

        // brilho branco no alto
        float brilho = pow(saturate(dot(n, normalize(vec3(-0.35, 0.6, 0.72)))), 40.0);
        float faixa = smoothstep(0.55, 0.9, f) * smoothstep(0.2, 0.8, dot(dir, vec2(-0.5, 0.85)));
        cor = mix(cor, vec3(1.0), max(brilho, faixa * 0.6));
        alpha = max(alpha, brilho * 0.9);

        gl_FragColor = vec4(cor, clamp(alpha, 0.0, 1.0));`
      );
  };
  return mat;
}
const materialBolha = criarMaterialBolha(CONFIG.estiloBolha.opacidadeCentro);
const materialCapacete = criarMaterialBolha(CONFIG.estiloBolha.opacidadeCentroCapacete);

// troca o material dos objetos "bolha" (e dos que estão dentro deles) pelo vidro
function ehVidro(o) {
  const nome = CONFIG.nomeVidro.toLowerCase();
  for (let p = o; p; p = p.parent) {
    if (p.name.toLowerCase().includes(nome)) return true;
  }
  return false;
}
function aplicarVidro(obj, material = materialBolha) {
  obj.traverse((o) => {
    if (o.isMesh && o.name.toLowerCase().includes(CONFIG.nomeVidro.toLowerCase())) {
      o.material = material;
    }
  });
}

const geoBolha = new THREE.SphereGeometry(1, 48, 32);
const geoMiolo = new THREE.SphereGeometry(0.42, 24, 16);
const coresMiolo = [0xff3e9d, 0xb6ff00, 0x3ee6e6, 0xffb13e, 0x9a7bff];

const bolhas = [];
const cascas = []; // usado pra detectar o clique

function calcularBaseBolha(d) {
  d.base.set(d.fx * camera.right, camera.bottom + d.fy * (camera.top - camera.bottom), d.z);
}

function posicionarBolha(b) {
  const lado = Math.random() < 0.5 ? -1 : 1;
  const d = b.userData;
  // posição guardada como fração da tela, assim as bolhas se espalham certo em qualquer largura
  d.fx = lado * THREE.MathUtils.randFloat(0.3, 0.9);   // 0 = meio, 1 = borda da tela
  d.fy = THREE.MathUtils.randFloat(0.35, 0.92);        // 0 = embaixo, 1 = em cima
  // não deixa bolha passar atrás do logo (canto de cima à esquerda)
  if (d.fx < -0.55) d.fy = Math.min(d.fy, 0.62);
  d.z = THREE.MathUtils.randFloat(-1.5, 0.8);
  calcularBaseBolha(d);
  d.raio = THREE.MathUtils.randFloat(0.16, 0.36);
  d.fase = Math.random() * Math.PI * 2;
  d.vel = THREE.MathUtils.randFloat(0.5, 1.1);
  b.position.copy(d.base);
}

for (let i = 0; i < CONFIG.quantidadeBolhas; i++) {
  const b = new THREE.Group();
  const casca = new THREE.Mesh(geoBolha, materialBolha);
  casca.userData.bolha = b;
  const cor = coresMiolo[i % coresMiolo.length];
  const miolo = new THREE.Mesh(
    geoMiolo,
    new THREE.MeshStandardMaterial({ color: cor, emissive: cor, emissiveIntensity: 0.25, roughness: 0.3 })
  );
  b.add(casca, miolo);
  b.userData = { base: new THREE.Vector3(), raio: 0.3, fase: 0, vel: 1, estado: 'viva', tempo: 0 };
  posicionarBolha(b);
  b.scale.setScalar(0.001);
  scene.add(b);
  bolhas.push(b);
  cascas.push(casca);
}

// Troca as bolhas de teste pelos modelos do Blender (se existirem).
// Cada bolha usa um dos modelos da lista, alternando.
async function carregarBolhasDoBlender() {
  const loader = carregador;
  const modelos = [];
  for (const caminho of CONFIG.modelosBolhas) {
    let gltf;
    try {
      gltf = await loader.loadAsync(caminho);
    } catch {
      console.warn('Não achei o modelo de bolha:', caminho);
      continue;
    }
    const cena = gltf.scene;
    cena.rotation.y = THREE.MathUtils.degToRad(CONFIG.girarBolhas);

    // a esfera da bolha é a malha maior; o resto (a cabecinha) é o "conteúdo"
    const malhas = [];
    cena.traverse((o) => { if (o.isMesh) malhas.push(o); });
    const raio = (m) => { m.geometry.computeBoundingSphere(); return m.geometry.boundingSphere.radius; };
    const casca = malhas.reduce((a, b) => (raio(b) > raio(a) ? b : a));
    for (const m of malhas) {
      if (m === casca || ehVidro(m)) {
        m.material = materialBolha;
        m.renderOrder = 1; // desenha depois da cabecinha
      } else {
        m.userData.conteudo = true;
      }
    }
    modelos.push(centralizarBolha(cena, casca));
  }
  if (!modelos.length) return; // continua com as bolhas de teste

  cascas.length = 0;
  bolhas.forEach((b, i) => {
    b.clear();
    const copia = modelos[i % modelos.length].clone();
    // cada bolha ganha uma cor, com a textura xadrez
    const cor = CONFIG.coresBolhas[i % CONFIG.coresBolhas.length];
    const material = criarMaterialXadrez(cor);
    copia.traverse((o) => {
      if (!o.isMesh) return;
      if (o.userData.conteudo) o.material = material;
      o.userData.bolha = b;
      cascas.push(o);
    });
    b.add(copia);
  });
}

// cabecinha colorida com xadrez (o xadrez do Blender é feito com nodes e não é exportado)
function criarMaterialXadrez(cor) {
  const X = CONFIG.xadrezBolha;
  const c1 = new THREE.Color(cor);
  const c2 = c1.clone().lerp(new THREE.Color('#ffffff'), X.clarear);
  const mat = new THREE.MeshStandardMaterial({ color: c1, roughness: X.brilho, metalness: 0, envMapIntensity: 1.3 });
  mat.onBeforeCompile = (s) => {
    s.uniforms.uTam = { value: X.tamanhoQuadrado };
    s.uniforms.uCor1 = { value: c1 };
    s.uniforms.uCor2 = { value: c2 };
    s.vertexShader = s.vertexShader
      .replace('void main() {', 'varying vec3 vLocal;\nvoid main() {')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocal = position;');
    s.fragmentShader = s.fragmentShader
      .replace('void main() {', 'uniform float uTam;\nuniform vec3 uCor1, uCor2;\nvarying vec3 vLocal;\nvoid main() {')
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        // xadrez "projetado de frente", como nas imagens
        float xadrez = mod(floor(vLocal.x / uTam) + floor(vLocal.y / uTam), 2.0);
        diffuseColor.rgb = mix(uCor1, uCor2, xadrez);`
      );
  };
  return mat;
}

// deixa o modelo com o centro no meio e a esfera da bolha com raio 1 (o site controla o tamanho final)
function centralizarBolha(obj, casca) {
  obj.updateMatrixWorld(true);
  const caixa = new THREE.Box3().setFromObject(casca || obj);
  const centro = caixa.getCenter(new THREE.Vector3());
  const tamanho = caixa.getSize(new THREE.Vector3());
  const grupo = new THREE.Group();
  obj.position.sub(centro);
  grupo.add(obj);
  grupo.scale.setScalar(2 / (Math.max(tamanho.x, tamanho.y, tamanho.z) || 1));
  return grupo;
}
const bolhasProntas = carregarBolhasDoBlender();

// quando personagem, bolhas e fontes estiverem prontas, os últimos pixels da tela de carregamento somem
Promise.all([personagemPronto, bolhasProntas.catch(() => {}), document.fonts.ready]).then(() => carregamento.pronto());

// gotinhas que voam quando a bolha estoura
const gotas = [];
const geoGota = new THREE.SphereGeometry(1, 8, 6);
function soltarGotas(posicao, raio) {
  for (let i = 0; i < 14; i++) {
    const m = new THREE.Mesh(geoGota, new THREE.MeshBasicMaterial({ color: 0xcfe8ff, transparent: true }));
    const dir = new THREE.Vector3().randomDirection();
    m.position.copy(posicao).addScaledVector(dir, raio);
    m.scale.setScalar(THREE.MathUtils.randFloat(0.012, 0.03));
    m.userData = { vel: dir.multiplyScalar(THREE.MathUtils.randFloat(1, 2.2)), vida: 0.5 };
    scene.add(m);
    gotas.push(m);
  }
}

function atualizarBolhas(dt, t) {
  for (const b of bolhas) {
    const d = b.userData;
    if (d.estado === 'viva') {
      calcularBaseBolha(d);
      b.position.y = d.base.y + Math.sin(t * d.vel + d.fase) * 0.15;
      b.position.x = d.base.x + Math.sin(t * d.vel * 0.6 + d.fase) * 0.08;
      b.scale.setScalar(THREE.MathUtils.damp(b.scale.x, d.raio, 4, dt));
    } else if (d.estado === 'estourando') {
      d.tempo += dt;
      b.scale.setScalar(d.raio * (1 + d.tempo * 5));
      if (d.tempo > 0.07) {
        b.visible = false;
        soltarGotas(b.position, d.raio);
        d.estado = 'escondida';
        d.tempo = 0;
      }
    } else if (d.estado === 'escondida') {
      d.tempo += dt;
      if (d.tempo > CONFIG.tempoVoltarBolha) {
        posicionarBolha(b);
        b.scale.setScalar(0.001);
        b.visible = true;
        d.estado = 'viva';
      }
    }
  }

  for (let i = gotas.length - 1; i >= 0; i--) {
    const g = gotas[i];
    const d = g.userData;
    d.vida -= dt;
    d.vel.y -= 4 * dt;
    g.position.addScaledVector(d.vel, dt);
    g.material.opacity = Math.max(d.vida / 0.5, 0);
    if (d.vida <= 0) {
      scene.remove(g);
      g.material.dispose();
      gotas.splice(i, 1);
    }
  }
}

// clique nas bolhas
const raycaster = new THREE.Raycaster();
const ponteiro = new THREE.Vector2();
function bolhaSobMouse(e) {
  ponteiro.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(ponteiro, camera);
  const vivas = cascas.filter((c) => c.userData.bolha.userData.estado === 'viva');
  const hit = raycaster.intersectObjects(vivas, false)[0];
  return hit ? hit.object.userData.bolha : null;
}
canvas.addEventListener('pointerdown', (e) => {
  const b = bolhaSobMouse(e);
  if (!b) return;
  b.userData.estado = 'estourando';
  b.userData.tempo = 0;
  b.userData.raio = b.scale.x;
  tocarPop();
});
canvas.addEventListener('pointermove', (e) => {
  const sobreBolha = !!bolhaSobMouse(e);
  canvas.style.cursor = sobreBolha ? 'pointer' : 'default';
  // avisa o cursor perolado (cursor.js) pra virar bolinha em cima das bolhas
  document.body.classList.toggle('cursor-clicavel', sobreBolha);
});
canvas.addEventListener('pointerleave', () => document.body.classList.remove('cursor-clicavel'));

let audio;
function tocarPop() {
  if (!CONFIG.somEstouro) return;
  audio ??= new AudioContext();
  const agora = audio.currentTime;
  const osc = audio.createOscillator();
  const vol = audio.createGain();
  osc.frequency.setValueAtTime(900, agora);
  osc.frequency.exponentialRampToValueAtTime(180, agora + 0.08);
  vol.gain.setValueAtTime(0.25, agora);
  vol.gain.exponentialRampToValueAtTime(0.001, agora + 0.1);
  osc.connect(vol).connect(audio.destination);
  osc.start(agora);
  osc.stop(agora + 0.12);
}

// =====================================================================
//  GIRO + TROCA DE TEXTURA: a pessoa manda uma foto (transformacao.js) → a personagem dá o giro numa
//  névoa de glitter e, quando volta pra pose, está com a foto de "textura".
//  transformacao.js chama: window.transformarPersonagem(textura) → Promise (resolve quando termina o giro)
// =====================================================================
const CONFIG_GLITTER = {
  quantidade: 650,          // partículas girando em volta dela (bem pequenas, viram uma "névoa")
  cores: ['#ffffff', '#ffffff', '#f6f4ff', '#f2f7ff'],   // brancas (com um tiquinho de perolado)
  tamanhoPx: 5,             // tamanho de cada partícula (pixels)
  nevoa: 0.8,               // opacidade máxima da névoa perolada (no auge ela esconde a troca de textura)
};

// estrelinha de 4 pontas com brilho, pra cada partícula
function texturaBrilho() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  // halo cinza-perolado bem leve por fora (senão a partícula branca some no fundo branco do site)
  const halo = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  halo.addColorStop(0, 'rgba(255,255,255,1)');
  halo.addColorStop(0.35, 'rgba(255,255,255,0.9)');
  halo.addColorStop(0.55, 'rgba(170,178,200,0.22)');
  halo.addColorStop(1, 'rgba(150,158,180,0)');
  g.fillStyle = halo; g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#fff';
  g.beginPath();
  for (let i = 0; i < 8; i++) {
    const r = i % 2 ? 4 : 30, a = (i / 8) * Math.PI * 2;
    g.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r);
  }
  g.closePath(); g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
// estrelinha de 5 pontas (opção do window.mudarGlitter — ex.: estrelinhas vermelhas)
function texturaEstrela() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 12 : 30, a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
    g.lineTo(32 + Math.cos(a) * r, 34 + Math.sin(a) * r);
  }
  g.closePath(); g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
// névoa perolada (rosa/lilás bem clarinho, some nas bordas)
function texturaNevoa() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  r.addColorStop(0, 'rgba(255,255,255,0.95)');
  r.addColorStop(0.35, 'rgba(255,232,246,0.85)');
  r.addColorStop(0.62, 'rgba(226,214,255,0.45)');
  r.addColorStop(1, 'rgba(220,240,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const efeitoGiro = (() => {
  const n = CONFIG_GLITTER.quantidade, H = CONFIG.alturaPersonagem;
  const pos = new Float32Array(n * 3), cor = new Float32Array(n * 3);
  const dados = [];
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    dados.push({
      ang: Math.random() * Math.PI * 2,
      raio: H * (0.1 + Math.random() * 0.24),
      alt: Math.random() * H * 1.05,
      vel: 4 + Math.random() * 6,             // giro (rad/s) — rápido, acompanhando ela
      sobe: H * (0.05 + Math.random() * 0.25), // sobe devagar enquanto gira
    });
    c.set(CONFIG_GLITTER.cores[i % CONFIG_GLITTER.cores.length]);
    cor.set([c.r, c.g, c.b], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(cor, 3));
  const mat = new THREE.PointsMaterial({
    size: CONFIG_GLITTER.tamanhoPx, sizeAttenuation: false, map: texturaBrilho(), vertexColors: true,
    transparent: true, opacity: 0, depthWrite: false,
  });
  const pontos = new THREE.Points(geo, mat);
  pontos.frustumCulled = false;
  pontos.visible = false;
  pontos.renderOrder = 5;
  scene.add(pontos);
  const nevoa = new THREE.Sprite(new THREE.SpriteMaterial({ map: texturaNevoa(), transparent: true, opacity: 0, depthWrite: false, depthTest: false }));
  nevoa.scale.set(H * 1.0, H * 1.3, 1);
  nevoa.visible = false;
  nevoa.renderOrder = 6;
  scene.add(nevoa);
  return { pontos, nevoa, dados, pos, brilho: 0, tempo: 0 };
})();

// muda o glitter do giro na hora (sem recarregar): window.mudarGlitter({ cores: ['#e0262b'], forma: 'estrela', tamanhoPx: 9 })
// forma: 'estrela' (5 pontas) ou 'brilho' (o padrão, estrelinha de 4 pontas com halo)
window.mudarGlitter = ({ cores, forma, tamanhoPx } = {}) => {
  const e = efeitoGiro, c = new THREE.Color();
  if (cores?.length) {
    const cor = e.pontos.geometry.attributes.color;
    for (let i = 0; i < cor.count; i++) { c.set(cores[i % cores.length]); cor.setXYZ(i, c.r, c.g, c.b); }
    cor.needsUpdate = true;
  }
  if (forma) { e.pontos.material.map = forma === 'estrela' ? texturaEstrela() : texturaBrilho(); e.pontos.material.needsUpdate = true; }
  if (tamanhoPx) CONFIG_GLITTER.tamanhoPx = tamanhoPx;
};

// prepara a foto: rosto achado → projeta (rosto na cabeça, roupa no corpo); sem rosto → espalha na folha de UV
// foto = <canvas> com a foto (proporção original) · rosto = { olhos: [{x,y},{x,y}], nariz, boca } em pixels da foto, ou null
function prepararFoto(foto, rosto) {
  const t = new THREE.CanvasTexture(foto);
  t.flipY = false;                       // uv (0,0) = canto de cima da foto
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (!rosto) return { textura: t, modo: 1 };
  const W = foto.width, H = foto.height, M = MEDIDAS_PERSONAGEM;
  const [a, b] = [...rosto.olhos].sort((p, q) => p.x - q.x);       // olho da esquerda e da direita (na foto)
  const meio = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  // nariz e boca da pessoa: quantos px abaixo da linha dos olhos (na direção do rosto, mesmo se estiver inclinado)
  const baixo = { x: -Math.sin(ang), y: Math.cos(ang) };
  const abaixo = (pt, padrao) => (pt ? Math.max(4, (pt.x - meio.x) * baixo.x + (pt.y - meio.y) * baixo.y) : padrao);
  const nariz = abaixo(rosto.nariz, dist * 0.55);
  const boca = Math.max(nariz + 4, abaixo(rosto.boca, dist * 0.95));
  const queixo = boca + (boca - nariz) * 1.6;                       // a ponta do queixo fica um pouco abaixo da boca
  // UMA escala só (não distorce nariz e boca): escolhida pra boca da pessoa cair na boca dela; o rosto todo
  // fica dentro da cabeça dela. Os olhos da foto vão pros olhos dela à parte (recorte de cada olho).
  const k = boca / (M.olhoZ - M.bocaZ);                             // pixels da foto por unidade do modelo
  // cor da roupa: a que mais aparece abaixo do queixo (numa faixa da largura dos ombros); se a foto quase não tem
  // nada abaixo do rosto, a que mais aparece no resto da foto, fora do rosto
  const ombros = dist * 2.4;
  const yRoupa = meio.y + boca + (boca - nariz) * 1.2;               // logo abaixo do queixo de verdade
  const rostoCaixa = { x0: meio.x - dist * 1.3, x1: meio.x + dist * 1.3, y0: meio.y - dist * 1.6, y1: meio.y + queixo + dist * 0.2 };
  // retângulo da roupa: largura dos ombros, na proporção do corpo dela "desenrolado" (não estica);
  // se a foto tem pouco abaixo do rosto, fica um pedaço menor (mesma proporção); quase nada → cor lisa
  const proporcao = (Math.PI * 1.2) / (M.queixoZ - M.barraZ);       // largura / altura da roupa planificada
  let larg = dist * 4.0, alt = larg / proporcao;
  const sobra = H - yRoupa;
  if (sobra < alt) { alt = sobra; larg = alt * proporcao; }
  const x0 = Math.min(Math.max(0, meio.x - larg / 2), Math.max(0, W - larg));
  const roupa = alt > dist * 0.25 ? [x0, yRoupa, Math.min(W, x0 + larg), yRoupa + alt] : [0, 0, 0, 0];
  const corRoupa = (H - yRoupa > dist * 0.25 && corPredominante(foto, meio.x - ombros, yRoupa, meio.x + ombros, H))
    || corPredominante(foto, 0, 0, W, H, rostoCaixa) || new THREE.Color(0.5, 0.5, 0.5);
  return {
    textura: t, modo: 2,
    cabeca: [meio.x, meio.y, k, dist / 2],
    corRoupa, roupa,
    tam: [W, H],
    giro: [Math.cos(ang), Math.sin(ang)],
  };
}
// a cor que mais aparece num pedaço da foto (agrupa cores parecidas e tira a média do grupo maior)
function corPredominante(foto, x0, y0, x1, y1, fora = null) {
  const W = foto.width, H = foto.height;
  x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0));
  x1 = Math.min(W, Math.ceil(x1)); y1 = Math.min(H, Math.ceil(y1));
  if (x1 - x0 < 4 || y1 - y0 < 4) return null;
  const px = foto.getContext('2d').getImageData(x0, y0, x1 - x0, y1 - y0).data;
  const grupos = new Map();
  const passo = Math.max(1, Math.floor(Math.sqrt(((x1 - x0) * (y1 - y0)) / 40000)));   // no máx. ~40 mil amostras
  for (let y = 0; y < y1 - y0; y += passo) {
    for (let x = 0; x < x1 - x0; x += passo) {
      if (fora && x + x0 > fora.x0 && x + x0 < fora.x1 && y + y0 > fora.y0 && y + y0 < fora.y1) continue;
      const i = (y * (x1 - x0) + x) * 4;
      const r = px[i], g = px[i + 1], b = px[i + 2];
      const chave = (r >> 4) << 8 | (g >> 4) << 4 | (b >> 4);              // 16 tons por canal
      const gr = grupos.get(chave) || [0, 0, 0, 0];
      gr[0] += r; gr[1] += g; gr[2] += b; gr[3]++;
      grupos.set(chave, gr);
    }
  }
  let maior = null;
  for (const gr of grupos.values()) if (!maior || gr[3] > maior[3]) maior = gr;
  return maior ? new THREE.Color().setRGB(maior[0] / maior[3] / 255, maior[1] / maior[3] / 255, maior[2] / maior[3] / 255, THREE.SRGBColorSpace) : null;
}

function vestirFoto(f) {
  if (!f) { UNI_FOTO.uModo.value = 0; return; }                    // volta pra textura dela
  UNI_FOTO.uFoto.value?.dispose?.();
  UNI_FOTO.uFoto.value = f.textura;
  UNI_FOTO.uModo.value = f.modo;
  if (f.modo === 2) {
    UNI_FOTO.uCabeca.value.set(...f.cabeca);
    UNI_FOTO.uTamFoto.value.set(...f.tam);
    UNI_FOTO.uCorRoupa.value.copy(f.corRoupa);
    UNI_FOTO.uRoupa.value.set(...f.roupa);
    UNI_FOTO.uGiroRosto.value.set(...f.giro);
  }
}

// gira, "veste" a foto no meio (no auge da névoa) e resolve quando ela volta pra pose
// foto = <canvas> (a foto da pessoa) · rosto = olhos achados na foto (ou null) · foto null = volta ao normal
window.transformarPersonagem = (foto, rosto = null) => new Promise((ok) => {
  const p = personagem;
  const nova = foto ? prepararFoto(foto, rosto) : null;
  if (!p.acaoGiro) { vestirFoto(nova); ok(); return; }   // modelo sem giro: só troca
  if (p.girando) { ok(); return; }
  p.girando = { trocou: false, aoTrocar: () => vestirFoto(nova), aoTerminar: ok };
  p.acaoGiro.reset();
  p.acaoGiro.setEffectiveWeight(p.pesoGiro);
  p.acaoGiro.play();
  efeitoGiro.tempo = 0;
});

// onde fica a cabeça dela na tela (o balão de fala do transformacao.js se posiciona por aqui)
window.posicaoCabecaNaTela = () => {
  if (!personagem.raiz || virada.galeria) return null;
  _v.copy(personagem.pontoCabeca).project(camera);
  return { x: (_v.x + 1) / 2 * innerWidth, y: (1 - _v.y) / 2 * innerHeight };
};

const _centroGiro = new THREE.Vector3(0, 0, 0);
function atualizarGiro(dt) {
  const p = personagem, g = p.girando, e = efeitoGiro;
  let alvo = 0, nevoa = 0;
  if (g) {
    const prog = Math.min(1, p.acaoGiro.time / p.acaoGiro.getClip().duration);
    alvo = Math.sin(Math.PI * Math.min(1, prog * 1.08));                    // glitter: sobe e desce
    nevoa = Math.pow(Math.max(0, Math.sin(Math.PI * prog)), 2.2) * CONFIG_GLITTER.nevoa;
    if (!g.trocou && prog >= CONFIG.giro.trocaEm) { g.trocou = true; g.aoTrocar(); }
    if (prog >= 1) { p.girando = null; g.aoTerminar(); }
  }
  e.brilho = THREE.MathUtils.damp(e.brilho, alvo, g ? 10 : 4, dt);
  const ligado = e.brilho > 0.005;
  e.pontos.visible = ligado;
  e.nevoa.visible = nevoa > 0.005;
  if (!ligado) return;
  e.tempo += dt;
  // ela fica centrada no meio da cena com os pés no chão (normalizarTamanho): o glitter gira em volta do eixo x=z=0, do chão pra cima
  const centro = _centroGiro, H = CONFIG.alturaPersonagem;
  for (let i = 0; i < e.dados.length; i++) {
    const d = e.dados[i];
    d.ang -= d.vel * dt * (0.35 + e.brilho);                             // mesmo sentido do giro dela
    const r = d.raio * (0.55 + 0.75 * e.brilho);
    const y = (d.alt + d.sobe * e.tempo) % (H * 1.1);
    e.pos[i * 3] = centro.x + Math.cos(d.ang) * r;
    e.pos[i * 3 + 1] = centro.y + y;
    e.pos[i * 3 + 2] = centro.z + Math.sin(d.ang) * r;
  }
  e.pontos.geometry.attributes.position.needsUpdate = true;
  e.pontos.material.opacity = Math.min(1, e.brilho * 1.3);
  e.pontos.material.size = CONFIG_GLITTER.tamanhoPx * renderer.getPixelRatio() * (0.7 + 0.5 * e.brilho);
  e.nevoa.material.opacity = nevoa;
  e.nevoa.position.set(centro.x, centro.y + H * 0.52, centro.z);
}

// =====================================================================
//  CÂMERA VIRANDO PRAS GALERIAS (3D → direita, Ilustração → esquerda, Design → cima)
//  Quem pede a virada é o projetos.js, com: dispatchEvent(new CustomEvent('virar', { detail: 'direita' }))
// =====================================================================
const DIRECOES = {
  frente: { yaw: 0, pitch: 0 },
  direita: { yaw: -90, pitch: 0 },
  esquerda: { yaw: 90, pitch: 0 },
  cima: { yaw: 0, pitch: 62 },
};
const VELOCIDADE_VIRADA = 3.2; // maior = vira mais rápido

const virada = { yaw: 0, pitch: 0, alvoYaw: 0, alvoPitch: 0, galeria: false };
const _qVirada = new THREE.Quaternion();
const _eVirada = new THREE.Euler(0, 0, 0, 'YXZ');

addEventListener('virar', (e) => {
  const d = DIRECOES[e.detail] || DIRECOES.frente;
  virada.alvoYaw = d.yaw;
  virada.alvoPitch = d.pitch;
  virada.galeria = e.detail !== 'frente';
  // quando começa a voltar, some com a bolinha do cursor que ficou "presa" na bolha
  document.body.classList.remove('cursor-clicavel');
});
// abriu o site direto numa galeria (link com #3d/... ou refresh): a câmera já começa virada, sem animação
if (document.body.classList.contains('em-galeria')) {
  const d = DIRECOES[document.body.dataset.direcao] || DIRECOES.frente;
  virada.yaw = virada.alvoYaw = d.yaw;
  virada.pitch = virada.alvoPitch = d.pitch;
  virada.galeria = true;
}

function aplicarVirada(dt) {
  virada.yaw = THREE.MathUtils.damp(virada.yaw, virada.alvoYaw, VELOCIDADE_VIRADA, dt);
  virada.pitch = THREE.MathUtils.damp(virada.pitch, virada.alvoPitch, VELOCIDADE_VIRADA, dt);
  _eVirada.set(THREE.MathUtils.degToRad(virada.pitch), THREE.MathUtils.degToRad(virada.yaw), 0);
  _qVirada.setFromEuler(_eVirada);
  // as duas câmeras giram "no lugar", como quem vira a cabeça
  cameraChao.quaternion.copy(baseChao).multiply(_qVirada);
  camera.quaternion.copy(_qVirada);
}

// =====================================================================
//  AVISO, TAMANHO DA TELA E LOOP
// =====================================================================
function mostrarAviso(html) {
  const el = document.getElementById('aviso');
  el.innerHTML = html;
  el.hidden = false;
  setTimeout(() => { el.hidden = true; }, 8000);
}

addEventListener('resize', () => {
  enquadrarCamera();
  renderer.setSize(innerWidth, innerHeight);
});

// enquanto carrega, o 3D fica pixelado e vai ganhando resolução aos poucos
const resolucaoFinal = Math.min(window.devicePixelRatio, 2);
let resolucaoAtual = resolucaoFinal;
function atualizarPixelado() {
  let alvoRes = resolucaoFinal;
  if (carregamento.ativo) {
    const r = carregamento.revelado;
    // 12 "degraus" de resolução, começando bem pixelado
    alvoRes = 0.03 + (resolucaoFinal - 0.03) * Math.round(r * r * 12) / 12;
  }
  if (alvoRes !== resolucaoAtual) {
    resolucaoAtual = alvoRes;
    renderer.setPixelRatio(alvoRes);
    renderer.setSize(innerWidth, innerHeight);
  }
  canvas.classList.toggle('pixelado', carregamento.ativo);
}

const relogio = new THREE.Clock();
renderer.setAnimationLoop(() => {
  atualizarPixelado();
  const dt = Math.min(relogio.getDelta(), 0.05);
  const t = relogio.elapsedTime;
  materialChao.uniforms.uDeslocamento.value -= CONFIG.chaoVelocidade * dt;
  atualizarPersonagem(dt);
  atualizarBolhas(dt, t);
  aplicarVirada(dt);
  // 1) chão em perspectiva  2) personagem e bolhas em ortográfica, por cima
  renderer.clear();
  renderer.render(scene, cameraChao);
  renderer.clearDepth();
  renderer.render(scene, camera);
});
