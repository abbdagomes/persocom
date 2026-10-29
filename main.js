import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { carregamento } from './carregamento.js';
import { montarPintura } from './pintura.js';
import { montarSobre } from './sobre.js';

// =====================================================================
//  CONFIGURAÇÕES — mexa aqui sem medo
// =====================================================================
const CONFIG = {
  // Caminho do seu personagem exportado do Blender (.glb)
  modelo: 'modelo/personagem.glb?v=6',

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
  // boca falando (shape keys da Ana: a, e, o, M) — usada no "sobre mim" (sobre.js)
  fala: {
    formas: ['a', 'e', 'o', 'M'],
    intensidade: 0.85,       // quanto abre (1 = a shape key inteira)
    troca: 0.075,            // de quantos em quantos segundos olha a letra (mais rápido treme)
    suavidade: 22,           // quão rápido vai de uma boca pra outra
  },
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
function enquadrarCamera() {
  const aspecto = innerWidth / innerHeight;
  cameraChao.aspect = aspecto;
  // no celular (tela em pé) afasta a câmera pra caber o personagem
  const distancia = aspecto < 1 ? 7 / aspecto * 0.75 : 7;
  cameraChao.position.set(0, 1.4, distancia);
  cameraChao.lookAt(0, 0.75, 0);
  cameraChao.updateProjectionMatrix();
  cameraChao.updateMatrixWorld();
  // a ortográfica fica na mesma distância da de perspectiva
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
  materiaisToon: [],       // materiais que usam a textura
  malhasPintaveis: [],     // malhas onde dá pra pintar (pintura.js)
  pintando: false,         // modo pintura ligado: ela fica parada de frente
  animando: false,
  pesoOlhar: 1,
  yaw: 0,
  pitch: 0,
  pesoAnim: 0,
  pontoCabeca: new THREE.Vector3(),
  piscaAlvos: [],
  bocaAlvos: [],           // malhas com as bocas da fala
  boca: [0, 0, 0, 0],      // quanto de a, e, o, M agora
  bocaAlvo: [0, 0, 0, 0],
  bocaTempo: 0,
  letraFalando: null,      // a letra que o sobre.js está "falando" agora
  oiRestante: 0,           // segundos que faltam do "oi" (a animação de aceno, no começo da fala)
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
    // as bocas da fala (a, e, o, M) só mexem quando ela fala: tira elas da animação do arquivo
    // (no .blend o "a" ficou com chave em 1 na KeyAction e deixava a boca entreaberta, com o branquinho dentro)
    let dicBoca = null;
    obj.traverse((o) => { if (!dicBoca && o.morphTargetDictionary && 'a' in o.morphTargetDictionary) dicBoca = o.morphTargetDictionary; });
    if (dicBoca) {
      const zerar = CONFIG.fala.formas.map((f) => dicBoca[f]).filter((i) => i !== undefined);
      const passo = Object.keys(dicBoca).length;
      for (const anim of animacoes) {
        for (const trilha of anim.tracks) {
          if (!trilha.name.endsWith('.morphTargetInfluences') || trilha.values.length !== trilha.times.length * passo) continue;
          for (let q = 0; q < trilha.times.length; q++) for (const i of zerar) trilha.values[q * passo + i] = 0;
        }
      }
    }
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

  // malhas que têm as bocas da fala (a, e, o, M)
  obj.traverse((o) => {
    const dic = o.morphTargetDictionary;
    if (!dic || !CONFIG.fala.formas.some((f) => f in dic)) return;
    personagem.bocaAlvos.push({ malha: o, indices: CONFIG.fala.formas.map((f) => dic[f]) });
  });

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

// ---------- TINTA (o que a pessoa pinta nela — ver pintura.js) ----------
// textura com a tinta, no mesmo mapa de UV da textura dela (começa vazia; a pintura.js troca pela de verdade)
const tintaVazia = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
tintaVazia.needsUpdate = true;
const UNI_PINTURA = { uPintura: { value: tintaVazia } };

function criarMaterialToon(textura) {
  const mat = new THREE.MeshStandardMaterial({ map: textura, roughness: 1, metalness: 0 });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uSombra = { value: CONFIG.toonSombra };
    shader.uniforms.uSuave = { value: CONFIG.toonSuavidade };
    shader.uniforms.uBorda = { value: CONFIG.toonBrilhoBorda };
    Object.assign(shader.uniforms, UNI_PINTURA);
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', 'uniform float uSombra, uSuave, uBorda;\nuniform sampler2D uPintura;\nvoid main() {')
      // a tinta por cima da textura dela (a luz toon e o brilho de borda continuam por cima da tinta)
      .replace('#include <map_fragment>', '#include <map_fragment>\nvec4 tinta = texture2D(uPintura, vMapUv);\ndiffuseColor.rgb = diffuseColor.rgb * (1.0 - tinta.a) + tinta.rgb;')
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
    personagem.malhasPintaveis.push(o);
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
  // (descendo pros projetos ou com um projeto aberto, não anima)
  // o "oi" (começo do "sobre mim") toca a animação dela inteira uma vez, mesmo sem o mouse perto
  if (p.oiRestante > 0) p.oiRestante -= dt;
  const perto = p.oiRestante > 0
    || (rolagem.valor < 0.3 && !rolagem.projetoAberto && !p.pintando && !p.falando && mouse.dentro && distancia < limite);

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
  falar(dt);
  respirar(dt);

  if (!p.cabeca) return;

  // cabeça seguindo o mouse

  const dx = THREE.MathUtils.clamp((mouse.x - telaX) / (innerWidth * 0.5), -1, 1);
  const dy = THREE.MathUtils.clamp((telaY - mouse.y) / (innerHeight * 0.5), -1, 1);
  let alvoYaw = mouse.dentro ? dx * CONFIG.giroMaxHorizontal : 0;
  let alvoPitch = mouse.dentro ? -dy * CONFIG.giroMaxVertical : 0;
  // pintando: fica olhando reto pra frente (parada, pra pintar)
  if (p.pintando) { alvoYaw = 0; alvoPitch = 0; }
  // contando o "sobre mim": de frente pra câmera, e enquanto o texto aparece a cabeça balança de leve (falando)
  if (p.falando) {
    p.tempoFala = (p.tempoFala || 0) + dt;
    const f = p.falandoAgora ? 1 : 0.25;
    alvoYaw = Math.sin(p.tempoFala * 2.3) * 0.07 * f;
    alvoPitch = (Math.sin(p.tempoFala * 7.1) * 0.035 + Math.sin(p.tempoFala * 3.3) * 0.02) * f;
  }
  // descendo pros projetos, ela olha pra baixo (pra grade)
  if (rolagem.valor > 0) {
    alvoYaw *= 1 - rolagem.valor * 0.7;
    alvoPitch = THREE.MathUtils.lerp(alvoPitch, CONFIG.giroMaxVertical, rolagem.valor);
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
// a boca acompanha a letra que está sendo digitada (vogal → a / e / o · m, b, p → M · espaço e pontuação → fecha)
function formaDaLetra(ch) {
  if (!ch) return null;
  const c = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (c === 'a') return [1, 0, 0, 0];
  if (c === 'e' || c === 'i' || c === 'y') return [0, 1, 0, 0];
  if (c === 'o' || c === 'u') return [0, 0, 1, 0];
  if (c === 'm' || c === 'b' || c === 'p') return [0, 0, 0, 1];
  if (/[a-z]/.test(c)) return [0.35, 0.2, 0, 0];   // outras consoantes: entreaberta
  return null;
}
function falar(dt) {
  const p = personagem, B = CONFIG.fala;
  if (!p.bocaAlvos.length) return;
  p.bocaTempo -= dt;
  if (p.bocaTempo <= 0) {
    p.bocaTempo = B.troca;
    const forma = p.falando ? formaDaLetra(p.letraFalando) : null;
    p.bocaAlvo = forma ? forma.map((v) => v * B.intensidade) : [0, 0, 0, 0];
  }
  const k = 1 - Math.exp(-dt * B.suavidade);
  for (let i = 0; i < 4; i++) p.boca[i] += (p.bocaAlvo[i] - p.boca[i]) * k;
  for (const { malha, indices } of p.bocaAlvos) {
    indices.forEach((idx, i) => { if (idx !== undefined) malha.morphTargetInfluences[idx] = p.boca[i]; });
  }
}

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
  if (personagem.pintando) return;
  const b = bolhaSobMouse(e);
  if (!b) return;
  b.userData.estado = 'estourando';
  b.userData.tempo = 0;
  b.userData.raio = b.scale.x;
  tocarPop();
});
canvas.addEventListener('pointermove', (e) => {
  const sobreBolha = !personagem.pintando && !!bolhaSobMouse(e);
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
//  GIRO: quando a pessoa confirma a pintura (pintura.js), ela dá um giro numa névoa de glitter.
//  girarPersonagem() → Promise (resolve quando termina o giro)
// =====================================================================
const CONFIG_GLITTER = {
  quantidade: 650,          // partículas girando em volta dela (bem pequenas, viram uma "névoa")
  cores: ['#ffffff', '#ffffff', '#f6f4ff', '#f2f7ff'],   // brancas (com um tiquinho de perolado)
  tamanhoPx: 5,             // tamanho de cada partícula (pixels)
  nevoa: 0.8,               // opacidade máxima da névoa perolada
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

function girarPersonagem() {
  return new Promise((ok) => {
    const p = personagem;
    if (!p.acaoGiro || p.girando) { ok(); return; }   // modelo sem giro: nada
    p.girando = { aoTerminar: ok };
    p.acaoGiro.reset();
    p.acaoGiro.setEffectiveWeight(p.pesoGiro);
    p.acaoGiro.play();
    efeitoGiro.tempo = 0;
  });
}

// o "oi": toca a animação de aceno dela uma vez (o sobre.js chama no "Olá!")
personagem.dizerOi = () => {
  const p = personagem;
  if (!p.acao) return;
  p.acao.time = 0;
  p.oiRestante = p.acao.getClip().duration;
};

// modo pintura (o botão "customize persocom"), quando ela termina de carregar
let pintura = null;
let sobre = null;        // o "sobre mim" (sobre.js): holofote + ela contando quem é a Ana
personagemPronto.then(() => {
  if (bonecoTeste) return;
  pintura = montarPintura({ renderer, camera, cameraChao, personagem, uniformePintura: UNI_PINTURA.uPintura, girar: girarPersonagem });
  sobre = montarSobre({ camera, cameraChao, personagem });
});

const _centroGiro = new THREE.Vector3(0, 0, 0);
function atualizarGiro(dt) {
  const p = personagem, g = p.girando, e = efeitoGiro;
  let alvo = 0, nevoa = 0;
  if (g) {
    const prog = Math.min(1, p.acaoGiro.time / p.acaoGiro.getClip().duration);
    alvo = Math.sin(Math.PI * Math.min(1, prog * 1.08));                    // glitter: sobe e desce
    nevoa = Math.pow(Math.max(0, Math.sin(Math.PI * prog)), 2.2) * CONFIG_GLITTER.nevoa;
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
//  ROLAGEM: a cena fica parada atrás; descendo pros projetos, ela olha pra baixo
//  (o véu que deixa a cena enevoada fica no projetos.js)
// =====================================================================
const rolagem = { valor: 0, projetoAberto: false };   // valor: 0 = na home, 1 = já nos projetos
function lerRolagem() {
  rolagem.valor = THREE.MathUtils.clamp(scrollY / (innerHeight * 0.6), 0, 1);
  rolagem.projetoAberto = document.body.classList.contains('projeto-aberto');
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
  lerRolagem();
  const dt = Math.min(relogio.getDelta(), 0.05);
  const t = relogio.elapsedTime;
  materialChao.uniforms.uDeslocamento.value -= CONFIG.chaoVelocidade * dt;
  atualizarPersonagem(dt);
  pintura?.atualizar(dt);
  sobre?.atualizar(dt);
  atualizarBolhas(dt, t);
  // 1) chão em perspectiva  2) personagem e bolhas em ortográfica, por cima
  renderer.clear();
  renderer.render(scene, cameraChao);
  renderer.clearDepth();
  renderer.render(scene, camera);
});
