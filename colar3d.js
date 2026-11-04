// O colar em 3D (item { colar3d: { arquivo } } no projetos.js): o apito é o arquivo de impressão dela, a corrente de bolinhas é
// gerada aqui. Arrastar gira; + e − aproximam do pingente; os botões trocam entre preto e prata, as duas cores da peça.
// Modelo: .claude/ferramentas/pecas_3mf.py + pecas_glb.py, a partir de "UMS apito 2.3mf".
import * as THREE from 'three';
import { carregarGlb } from './carregarGlb.js';
import { tr } from './idioma.js';

const CELULAR = matchMedia('(pointer: coarse)').matches;
const CONFIG_COLAR = {
  // medidas em mm, com a peça pendurada: a argola em cima, a janelinha do apito pra frente
  furo: new THREE.Vector3(1, 47.5, -7),   // onde a corrente encosta dentro da argola
  raioBolinha: 1.7,
  passoBolinha: 4.5,
  altura: 255,                  // do furo até o alto da corrente
  largura: 44,                  // meia largura da corrente
  giroSozinho: 0.35,
  sensibilidade: 0.011,
  zoomMin: 0.36, zoomMax: 1,
  // valores tirados das fotos dela: preto fosco; prata de alumínio fosco, clara nas faces e escura nos vãos
  cores: {
    preto: { color: '#242428', metalness: 0.1, roughness: 0.66, manchas: 0.35 },
    prata: { color: '#e4e5e8', metalness: 1, roughness: 0.27, manchas: 1 },
  },
};

// o estúdio que a peça reflete: branco como o das fotos, com painéis escuros que dão o contraste do metal
export function estudio() {
  const c = new THREE.Scene();
  const parede = (cor) => new THREE.MeshBasicMaterial({ color: cor, side: THREE.DoubleSide });
  c.add(new THREE.Mesh(new THREE.SphereGeometry(10, 24, 16), new THREE.MeshBasicMaterial({ color: '#dcdee2', side: THREE.BackSide })));
  const painel = (cor, x, y, z, w, h) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), parede(cor));
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    c.add(m);
  };
  painel('#ffffff', -2, 6, 3, 7, 5);       // luz grande em cima
  painel('#ffffff', 3, 1, 8, 7, 7);        // luz grande na frente
  painel('#0e0e10', -8, 0, 2, 2.4, 12);    // escuro à esquerda
  painel('#0e0e10', 8, -1, 3, 2.6, 12);    // escuro à direita
  painel('#0e0e10', -5, 0, 7, 1.1, 14);    // faixas finas: são elas que riscam as pontas de claro e escuro, como nas fotos
  painel('#0e0e10', 6, 0, 6, 1, 14);
  painel('#26262a', 0, -7, 2, 12, 5);      // escuro embaixo
  painel('#1c1c1f', 0, 1, -7, 5, 6);       // escuro atrás
  return c;
}

// o acabamento da peça, sem textura no arquivo: só variações largas no brilho, calculadas na própria posição da peça. Nada de
// relevo: a face plana fica lisa, como ela pediu
function acabamento(material, uni) {
  material.onBeforeCompile = (sh) => {
    sh.uniforms.uManchas = uni;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPeca;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPeca = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vPeca; uniform float uManchas;
        float ruido(vec3 p) {
          vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          #define H(o) fract(sin(dot(i + o, vec3(127.1, 311.7, 74.7))) * 43758.5453)
          return mix(mix(mix(H(vec3(0,0,0)), H(vec3(1,0,0)), f.x), mix(H(vec3(0,1,0)), H(vec3(1,1,0)), f.x), f.y),
                     mix(mix(H(vec3(0,0,1)), H(vec3(1,0,1)), f.x), mix(H(vec3(0,1,1)), H(vec3(1,1,1)), f.x), f.y), f.z);
        }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor + (ruido(vPeca * .12) - .5) * .12 * uManchas, .05, 1.);`);
  };
}

// o caminho da corrente: passa deitada pelo furo, abre pros lados e fecha em cima
function caminhoCorrente() {
  const C = CONFIG_COLAR, f = C.furo, h = C.altura, l = C.largura;
  const lado = [[7, .4], [17, 16], [l * .72, h * .3], [l, h * .58], [l * .78, h * .84], [l * .3, h * .985]];
  const pts = [new THREE.Vector3(f.x, f.y, f.z)];
  lado.forEach(([x, y], i) => pts.push(new THREE.Vector3(f.x + x, f.y + y, f.z + Math.sin(i * 1.7) * 2.5)));
  pts.push(new THREE.Vector3(f.x, f.y + h, f.z));
  [...lado].reverse().forEach(([x, y], i) => pts.push(new THREE.Vector3(f.x - x, f.y + y, f.z - Math.sin(i * 1.3) * 2.5)));
  return new THREE.CatmullRomCurve3(pts, true, 'centripetal');
}

export function montarColar3d(raiz, cfg) {
  const C = CONFIG_COLAR;
  raiz.innerHTML = `
    <div class="modelo-palco colar3d">
      <canvas class="modelo-cena" aria-label="${tr('o colar em 3D — arraste pra girar')}"></canvas>
      <div class="modelo-carregando">${tr('carregando o modelo…')}</div>
      <div class="modelo-dica">${tr('↔ arraste pra girar')}</div>
      <div class="modelo-zoom"><button type="button" data-zoom="-1" aria-label="${tr('aproximar')}">+</button><button type="button" data-zoom="1" aria-label="${tr('afastar')}">−</button></div>
      <div class="colar-cores" role="group" aria-label="${tr('cor da peça')}">
        <button type="button" class="pilula ativo" data-cor="preto">${tr('preto')}</button>
        <button type="button" class="pilula" data-cor="prata">${tr('prata')}</button>
      </div>
    </div>`;
  const palco = raiz.querySelector('.modelo-palco');
  const canvas = raiz.querySelector('.modelo-cena');
  const aviso = raiz.querySelector('.modelo-carregando');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !CELULAR, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, CELULAR ? 1.5 : 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  const cena = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const ambiente = pmrem.fromScene(estudio(), 0.03).texture;
  cena.environment = ambiente;
  cena.environmentIntensity = 1.2;
  pmrem.dispose();
  const sol = new THREE.DirectionalLight(0xffffff, .9);
  sol.position.set(-120, 260, 300);
  cena.add(sol);
  const camera = new THREE.PerspectiveCamera(20, 1, 10, 6000);
  const giro = new THREE.Group();
  cena.add(giro);

  const { manchas: _m, ...corInicial } = C.cores.preto;
  const materialPeca = new THREE.MeshStandardMaterial({ ...corInicial, vertexColors: true });      // a sombra dos vãos vem assada no arquivo
  const uManchas = { value: C.cores.preto.manchas };
  acabamento(materialPeca, uManchas);
  const materialCorrente = new THREE.MeshStandardMaterial({ color: '#c6c8cc', metalness: 1, roughness: 0.28 });
  const geoBolinha = new THREE.SphereGeometry(C.raioBolinha, 16, 12);
  const geoLigacao = new THREE.CylinderGeometry(.55, .55, C.passoBolinha, 8);
  const geoFecho = new THREE.CapsuleGeometry(1.7, 8, 4, 12);
  let geoPeca = null;

  // ---------- a corrente ----------
  const curva = caminhoCorrente();
  const total = Math.round(curva.getLength() / C.passoBolinha);
  const bolinhas = new THREE.InstancedMesh(geoBolinha, materialCorrente, total);
  const ligacoes = new THREE.InstancedMesh(geoLigacao, materialCorrente, total);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), _s = new THREE.Vector3(1, 1, 1), cima = new THREE.Vector3(0, 1, 0);
  const pontos = curva.getSpacedPoints(total);
  for (let i = 0; i < total; i++) {
    m.compose(pontos[i], q.identity(), _s);
    bolinhas.setMatrixAt(i, m);
    const dir = pontos[i + 1].clone().sub(pontos[i]);
    q.setFromUnitVectors(cima, dir.clone().normalize());
    m.compose(pontos[i].clone().addScaledVector(dir, .5), q, _s);
    ligacoes.setMatrixAt(i, m);
  }
  const fecho = new THREE.Mesh(geoFecho, materialCorrente);
  fecho.position.set(C.furo.x, C.furo.y + C.altura, C.furo.z);
  fecho.rotation.z = Math.PI / 2;
  giro.add(bolinhas, ligacoes, fecho);

  // ---------- enquadrar: zoom 1 = o colar inteiro; aproximando, a câmera desce até o pingente ----------
  let zoom = CELULAR ? 1 : 0.82, zoomAtual = zoom, altoCentro = 0;
  const yPingente = 0, yColar = (C.furo.y + C.altura - 50) / 2;
  function enquadrar() {
    const w = palco.clientWidth, h = palco.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const t = THREE.MathUtils.clamp((zoomAtual - C.zoomMin) / (C.zoomMax - C.zoomMin), 0, 1);
    altoCentro = yPingente + (yColar - yPingente) * t;
    const alturaVista = (C.furo.y + C.altura + 50 + 40) * zoomAtual;
    const larguraPreciso = 120 / Math.max(camera.aspect, .01);
    const vista = Math.max(alturaVista, larguraPreciso);
    const d = (vista / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camera.position.set(0, altoCentro + d * .07, d);
    camera.lookAt(0, altoCentro, 0);
    camera.updateProjectionMatrix();
  }

  async function carregar() {
    const gltf = await carregarGlb(cfg.arquivo);
    if (!vivo) return;
    gltf.scene.updateMatrixWorld(true);
    const malha = gltf.scene.getObjectByProperty('isMesh', true);
    geoPeca = malha.geometry.clone().applyMatrix4(malha.matrixWorld);
    geoPeca.computeBoundingBox();
    const b = geoPeca.boundingBox, c = b.getCenter(new THREE.Vector3());
    geoPeca.translate(-c.x, -c.y, -c.z);
    const esc = 100 / b.getSize(new THREE.Vector3()).x;       // a maior medida da peça tem 100 mm
    geoPeca.scale(esc, esc, esc);
    // do .glb pra peça pendurada: a argola sobe, a janelinha fica de frente
    geoPeca.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1));
    giro.add(new THREE.Mesh(geoPeca, materialPeca));
    giro.position.x = -C.furo.x;
    aviso.hidden = true;
    pronto = true;
    enquadrar();
  }

  // ---------- cor, zoom e girar ----------
  raiz.querySelectorAll('[data-cor]').forEach((b) => b.addEventListener('click', () => {
    const cor = C.cores[b.dataset.cor];
    materialPeca.color.set(cor.color);
    materialPeca.metalness = cor.metalness;
    materialPeca.roughness = cor.roughness;
    uManchas.value = cor.manchas;
    raiz.querySelectorAll('[data-cor]').forEach((x) => x.classList.toggle('ativo', x === b));
  }));
  raiz.querySelectorAll('[data-zoom]').forEach((b) => b.addEventListener('click', () => {
    zoom = THREE.MathUtils.clamp(zoom + Number(b.dataset.zoom) * 0.16, C.zoomMin, C.zoomMax);
  }));
  let angulo = -0.5, velocidade = 0, arrastando = false, ultimoToque = -99, xAnt = 0;
  let visivel = false, vivo = true, pronto = false, comecou = false, raf = 0;
  const relogio = new THREE.Clock();
  canvas.addEventListener('pointerdown', (e) => {
    arrastando = true; xAnt = e.clientX; velocidade = 0;
    canvas.setPointerCapture(e.pointerId);
    raiz.querySelector('.modelo-dica').classList.add('sumir');
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!arrastando) return;
    const dx = e.clientX - xAnt; xAnt = e.clientX;
    angulo += dx * C.sensibilidade; velocidade = dx * C.sensibilidade * 60; ultimoToque = relogio.elapsedTime;
  });
  const soltar = () => { arrastando = false; ultimoToque = relogio.elapsedTime; };
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);

  const ro = new ResizeObserver(enquadrar);
  ro.observe(palco);
  const io = new IntersectionObserver(([en]) => {
    visivel = en.isIntersecting;
    if (visivel) relogio.getDelta();
    if (visivel && !comecou) {
      comecou = true;
      carregar().catch(() => { aviso.textContent = tr('não deu pra carregar o modelo'); });
    }
  }, { rootMargin: '300px 0px' });
  io.observe(palco);

  function quadro() {
    raf = requestAnimationFrame(quadro);
    if (!visivel || document.hidden) return;
    const dt = Math.min(relogio.getDelta(), 0.05), t = relogio.elapsedTime;
    if (!arrastando) {
      velocidade *= Math.pow(0.04, dt);
      angulo += velocidade * dt;
      if (t - ultimoToque > 3) angulo += C.giroSozinho * dt;
    }
    if (Math.abs(zoom - zoomAtual) > 0.001) {
      zoomAtual += (zoom - zoomAtual) * (1 - Math.pow(0.002, dt));
      enquadrar();
    }
    // gira em volta da corrente: o eixo é o furo
    giro.rotation.y = angulo;
    if (pronto) renderer.render(cena, camera);
  }
  enquadrar();
  quadro();

  return {
    destruir() {
      vivo = false;
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      [geoBolinha, geoLigacao, geoFecho, geoPeca].forEach((g) => g?.dispose());
      materialPeca.dispose(); materialCorrente.dispose(); ambiente.dispose();
      bolinhas.dispose(); ligacoes.dispose();
      renderer.dispose(); renderer.forceContextLoss();
    },
  };
}
