// Cenário 3D do jogo (Tony Matrimony): a festa de casamento com os personagens andando entre os
// lugares dos convidados (os marcadores do próprio jogo). Dá pra girar, arrastar e dar zoom — só dentro da cena.
// Quem monta é o projetos.js, quando o projeto tem um item { cenario: {...} } na lista de imagens.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const CONFIG_CENARIO = {
  escalaPersonagem: 0.25,      // o mesmo tamanho que o Tony tem no jogo
  velocidade: 1.25,            // passos por segundo (unidades do jogo)
  raioPasseio: 7,              // até que distância cada um anda de uma vez
  pausa: [2.5, 6],             // quanto tempo fica parado entre um passeio e outro (s)
  zoomMin: 5, zoomMax: 30,
  limites: { xMin: -13, xMax: 11, zMin: -20, zMax: 5 },   // onde a câmera pode olhar (área da festa)
  corCeu: '#cfe9f6',
};

const draco = new DRACOLoader().setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/libs/draco/');
const carregador = new GLTFLoader().setDRACOLoader(draco);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const sorteio = (a, b) => a + Math.random() * (b - a);

export function montarCenario(raiz, cfg) {
  const v = cfg.versao ? `?v=${cfg.versao}` : '';
  const url = (nome) => cfg.pasta + nome + v;

  raiz.innerHTML = `
    <div class="cenario-palco">
      <canvas class="cenario-cena" aria-label="cenário do jogo em 3D"></canvas>
      <div class="cenario-carregando">carregando o casamento…</div>
      <button class="cenario-ativar" type="button">▶ explorar a cena</button>
      <div class="cenario-dica">arraste pra girar · botão direito ou dois dedos pra mover · roda/pinça pra zoom</div>
      <button class="cenario-sair" type="button" hidden>✕ sair</button>
    </div>`;
  const palco = raiz.querySelector('.cenario-palco');
  const canvas = raiz.querySelector('.cenario-cena');
  const aviso = raiz.querySelector('.cenario-carregando');
  const botaoAtivar = raiz.querySelector('.cenario-ativar');
  const botaoSair = raiz.querySelector('.cenario-sair');

  // ---------- cena ----------
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const cena = new THREE.Scene();
  cena.background = new THREE.Color(CONFIG_CENARIO.corCeu);
  cena.fog = new THREE.Fog(CONFIG_CENARIO.corCeu, 45, 140);
  cena.add(new THREE.HemisphereLight(0xffffff, 0x88aa88, 1.6));
  const sol = new THREE.DirectionalLight(0xfff4e0, 2.2);
  sol.position.set(14, 22, 10);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 70 });
  sol.shadow.bias = -0.0005;
  cena.add(sol, sol.target);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 600);
  const controles = new OrbitControls(camera, canvas);
  controles.enableDamping = true;
  controles.dampingFactor = 0.08;
  controles.minDistance = CONFIG_CENARIO.zoomMin;
  controles.maxDistance = CONFIG_CENARIO.zoomMax;
  controles.minPolarAngle = THREE.MathUtils.degToRad(20);
  controles.maxPolarAngle = THREE.MathUtils.degToRad(72);   // nunca vai pra baixo do chão
  controles.screenSpacePanning = false;                      // arrastar move no chão, não sobe
  controles.enabled = false;                                  // só depois de clicar em "explorar"
  const L = CONFIG_CENARIO.limites;
  controles.addEventListener('change', () => {
    // prende o ponto que a câmera olha dentro da área da festa
    const t = controles.target;
    const cx = THREE.MathUtils.clamp(t.x, L.xMin, L.xMax), cz = THREE.MathUtils.clamp(t.z, L.zMin, L.zMax);
    if (cx !== t.x || cz !== t.z || t.y !== 0.5) {
      const d = new THREE.Vector3(cx - t.x, 0.5 - t.y, cz - t.z);
      t.add(d); camera.position.add(d);
    }
  });

  // ---------- personagens andando ----------
  const pessoas = [];      // { corpo, mixer, acoes, atual, alvo, espera }
  let lugares = [];        // marcadores de convidados (Vector3)
  let visivel = false, vivo = true, raf = 0;
  const relogio = new THREE.Clock();

  function trocar(p, nome) {
    const nova = p.acoes[nome] || p.acoes.Idle;
    if (!nova || nova === p.atual) return;
    nova.reset().play();
    if (p.atual) p.atual.crossFadeTo(nova, 0.3, false);
    p.atual = nova;
  }
  function novoPasseio(p) {
    const aqui = p.corpo.position;
    const perto = lugares.filter((l) => l.distanceTo(aqui) > 1.2 && l.distanceTo(aqui) < CONFIG_CENARIO.raioPasseio);
    p.alvo = (perto.length ? perto : lugares)[Math.floor(Math.random() * (perto.length || lugares.length))].clone();
    trocar(p, 'Walking');
  }
  function parar(p) {
    p.alvo = null;
    p.espera = sorteio(...CONFIG_CENARIO.pausa);
    const opcoes = ['Idle', 'Idle', 'Chat', 'Drinking'];
    trocar(p, opcoes[Math.floor(Math.random() * opcoes.length)]);
  }

  async function carregar() {
    const [gltfCena, ...modelos] = await Promise.all([
      carregador.loadAsync(url('cenario.glb')),
      ...cfg.personagens.map((p) => carregador.loadAsync(url(p.id + '.glb')).catch(() => null)),
    ]);
    if (!vivo) return;
    const mundo = gltfCena.scene;
    mundo.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = o.receiveShadow = true;
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        ms.forEach((m) => {
          m.metalness = 0; m.roughness = Math.max(m.roughness ?? 1, 0.8);
          // arbusto e montanhas usam textura com recorte: sem isso ficam com borda quadrada
          if (m.transparent || m.alphaTest > 0 || /bush|Montanha/i.test(m.name)) { m.transparent = false; m.alphaTest = 0.5; m.depthWrite = true; }
        });
        if (/montanha|chao_expandido/i.test(o.name)) o.castShadow = false;   // gigantes: só recebem sombra
      }
    });
    cena.add(mundo);
    mundo.traverse((o) => { if (/^ponto_.*uestSpot/.test(o.name)) lugares.push(o.getWorldPosition(new THREE.Vector3())); });
    const tripe = mundo.getObjectByName('ponto_CamTripod');

    // cada personagem começa num lugar diferente
    const embaralhados = [...lugares].sort(() => Math.random() - 0.5);
    modelos.forEach((gltf, i) => {
      if (!gltf) return;
      const cfgP = cfg.personagens[i];
      const corpo = SkeletonUtils.clone(gltf.scene);
      corpo.scale.setScalar(CONFIG_CENARIO.escalaPersonagem);
      corpo.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true; o.frustumCulled = false;
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          ms.forEach((m) => { m.transparent = false; m.depthWrite = true; m.metalness = 0; });   // (alguns vêm "transparentes" do Blender)
        }
      });
      const mixer = new THREE.AnimationMixer(corpo);
      const acoes = {};
      gltf.animations.forEach((clip) => { acoes[clip.name] = mixer.clipAction(clip); });
      const p = { corpo, mixer, acoes, atual: null, alvo: null, espera: sorteio(0, 3), fixo: !!cfgP.fixo };
      if (cfgP.fixo && tripe) {
        // o Tony fica do lado da câmera dele, olhando pra festa
        corpo.position.copy(tripe.getWorldPosition(new THREE.Vector3())).add(new THREE.Vector3(0.9, 0, 0.2));
        corpo.rotation.y = Math.PI;
      } else {
        corpo.position.copy(embaralhados[i % embaralhados.length]);
        corpo.rotation.y = Math.random() * Math.PI * 2;
      }
      trocar(p, 'Idle');
      mixer.update(Math.random() * 2);      // cada um num ponto diferente da animação
      cena.add(corpo);
      pessoas.push(p);
    });

    // câmera começa parecida com a do jogo: de cima, na diagonal, olhando pro centro da festa
    const centro = lugares.reduce((a, b) => a.add(b), new THREE.Vector3()).multiplyScalar(1 / Math.max(1, lugares.length));
    centro.y = 0.5;
    controles.target.copy(centro);
    camera.position.copy(centro).add(new THREE.Vector3(0, 14, 17));
    sol.target.position.copy(centro);
    controles.update();
    aviso.hidden = true;
  }

  function atualizarPessoas(dt) {
    for (const p of pessoas) {
      p.mixer.update(dt);
      if (p.fixo) continue;
      if (p.alvo) {
        const d = new THREE.Vector3().subVectors(p.alvo, p.corpo.position); d.y = 0;
        const dist = d.length();
        if (dist < 0.08) { parar(p); continue; }
        const passo = Math.min(dist, CONFIG_CENARIO.velocidade * dt);
        p.corpo.position.addScaledVector(d.normalize(), passo);
        // vira suave pra onde está andando (a frente do modelo é +Z)
        const alvoAng = Math.atan2(d.x, d.z);
        let diff = alvoAng - p.corpo.rotation.y;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        p.corpo.rotation.y += diff * Math.min(1, dt * 8);
      } else if ((p.espera -= dt) <= 0) {
        novoPasseio(p);
      }
    }
  }

  // ---------- ligar/desligar a exploração (pra não prender a rolagem da página) ----------
  function ativar(sim) {
    controles.enabled = sim;
    palco.classList.toggle('ativo', sim);
    botaoAtivar.hidden = sim;
    botaoSair.hidden = !sim;
  }
  botaoAtivar.addEventListener('click', () => ativar(true));
  botaoSair.addEventListener('click', () => ativar(false));
  const foraDoPalco = (e) => { if (controles.enabled && !palco.contains(e.target)) ativar(false); };
  document.addEventListener('pointerdown', foraDoPalco);
  const esc_ = (e) => { if (e.key === 'Escape' && controles.enabled) { ativar(false); e.stopPropagation(); } };
  addEventListener('keydown', esc_, true);

  function tamanho() {
    const w = palco.clientWidth, h = palco.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(tamanho); ro.observe(palco);
  let comecou = false;
  const io = new IntersectionObserver(([en]) => {
    visivel = en.isIntersecting;
    if (visivel) relogio.getDelta();
    // só baixa o cenário quando a pessoa chega perto dele na página
    if (visivel && !comecou) { comecou = true; carregar().catch(() => { aviso.textContent = 'não deu pra carregar o cenário 😢'; }); }
  }, { rootMargin: '300px 0px' });
  io.observe(palco);

  function quadro() {
    raf = requestAnimationFrame(quadro);
    if (!visivel || document.hidden) return;
    const dt = Math.min(relogio.getDelta(), 0.05);
    atualizarPessoas(dt);
    controles.update();
    renderer.render(cena, camera);
  }
  tamanho();
  quadro();

  return {
    destruir() {
      vivo = false;
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      document.removeEventListener('pointerdown', foraDoPalco);
      removeEventListener('keydown', esc_, true);
      controles.dispose();
      renderer.dispose();
    },
  };
}
