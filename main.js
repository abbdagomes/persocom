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
  modelo: 'modelo/personagem.glb?v=2',

  // Nome do osso da cabeça. Com Rigify exportando "só ossos de deformação"
  // o osso da cabeça é o DEF-spine.006. Se não achar, olhe o console (F12):
  // lá aparece a lista de todos os ossos do seu modelo.
  ossoCabeca: ['DEF-spine.006', 'head', 'spine.006', 'Head', 'cabeca'],

  // Nome da animação (como está no Blender). null = toca todas juntas (corpo + shape keys)
  animacao: null,
  // Quadro da animação usado como pose parada (quando o mouse está longe).
  // Veja na linha do tempo do Blender qual quadro tem a pose que você quer.
  quadroParado: 0,

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
    const clip = escolhida || new THREE.AnimationClip('tudo', -1, animacoes.flatMap((a) => a.tracks));
    personagem.mixer = new THREE.AnimationMixer(obj);
    personagem.acao = personagem.mixer.clipAction(clip);
    personagem.acao.setLoop(THREE.LoopRepeat);
    personagem.acao.setEffectiveWeight(0).play();

    // pose parada = um quadro da animação (em vez da T-pose do rig)
    const fps = 24;
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

function criarMaterialToon(textura) {
  const mat = new THREE.MeshStandardMaterial({ map: textura, roughness: 1, metalness: 0 });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uSombra = { value: CONFIG.toonSombra };
    shader.uniforms.uSuave = { value: CONFIG.toonSuavidade };
    shader.uniforms.uBorda = { value: CONFIG.toonBrilhoBorda };
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', 'uniform float uSombra, uSuave, uBorda;\nvoid main() {')
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
    p.acao.setEffectiveWeight(p.pesoAnim);
    p.acaoParada.setEffectiveWeight(1 - p.pesoAnim);
  }
  if (p.mixer) p.mixer.update(dt);
  // guarda os valores "limpos" da animação deste quadro
  if (p.cabeca) p.cabecaRepouso.copy(p.cabeca.quaternion);
  for (const alvo of p.piscaAlvos) alvo.base = alvo.malha.morphTargetInfluences[alvo.indice];
  for (const r of p.ossosRespiracao) {
    r.base.p.copy(r.osso.position);
    r.base.q.copy(r.osso.quaternion);
    r.base.s.copy(r.osso.scale);
  }

  // olha o mouse (e respira) na mesma medida em que NÃO está animando
  p.pesoOlhar = p.acao ? 1 - p.pesoAnim : 1;
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
