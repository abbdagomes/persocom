// Uma peça solta em 3D (item { peca3d: { arquivo, nome } } no projetos.js), com as texturas que vêm no próprio .glb. Arrastar gira;
// no computador, arrastar pra cima e pra baixo inclina; + e − aproximam. O contorno preto é a mesma malha, virada e um pouco maior.
import * as THREE from 'three';
import { carregarGlb } from './carregarGlb.js';
import { estudio } from './colar3d.js';
import { tr } from './idioma.js';

const CELULAR = matchMedia('(pointer: coarse)').matches;
const CONFIG_PECA = {
  giroSozinho: 0.35,
  sensibilidade: 0.011,
  inclinacao: 0.2, inclinacaoMin: -0.2, inclinacaoMax: 1.1,      // por baixo só tem o oco, onde entra a cabeça
  zoomMin: 0.55, zoomMax: 1.3,
  contorno: 0.28,        // grossura do contorno, com a peça medindo 100 de largura
  // pelo nome do material no .glb; os detalhes são os valores do Material.020 dela, com o estúdio bem mais fraco porque o mundo dela é quase preto
  brilho: {
    padrao: { roughness: 0.42, metalness: 0.15, envMapIntensity: 0.55 },
    detalhes: { roughness: 0.255, metalness: 0.76, envMapIntensity: 0.42 },
  },
};

export function montarPeca3d(raiz, cfg) {
  const C = CONFIG_PECA;
  const nome = cfg.nome || tr('a peça');
  raiz.innerHTML = `
    <div class="modelo-palco colar3d">
      <canvas class="modelo-cena" aria-label="${tr('{x} em 3D — arraste pra girar', { x: nome })}"></canvas>
      <div class="modelo-carregando">${tr('carregando o modelo…')}</div>
      <div class="modelo-dica">${tr('↔ arraste pra girar')}</div>
      <div class="modelo-zoom"><button type="button" data-zoom="-1" aria-label="${tr('aproximar')}">+</button><button type="button" data-zoom="1" aria-label="${tr('afastar')}">−</button></div>
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
  pmrem.dispose();
  const sol = new THREE.DirectionalLight(0xffffff, 1);
  sol.position.set(-120, 260, 300);
  cena.add(sol);
  const camera = new THREE.PerspectiveCamera(20, 1, 10, 6000);
  const giro = new THREE.Group();
  cena.add(giro);

  const materialContorno = new THREE.MeshBasicMaterial({ color: '#0b0a0d', side: THREE.BackSide, toneMapped: false });
  materialContorno.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\ntransformed += normal * ${C.contorno.toFixed(3)};`);
  };
  const geometrias = [], materiais = [materialContorno], texturas = [];

  let zoom = CELULAR ? 1.1 : 1, zoomAtual = zoom;
  function enquadrar() {
    const w = palco.clientWidth, h = palco.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const vista = Math.max(130, 130 / Math.max(camera.aspect, .01)) * zoomAtual;
    const d = (vista / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camera.position.set(0, 0, d);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }

  async function carregar() {
    const gltf = await carregarGlb(cfg.arquivo);
    if (!vivo) return;
    gltf.scene.updateMatrixWorld(true);
    const caixa = new THREE.Box3().setFromObject(gltf.scene);
    const centro = caixa.getCenter(new THREE.Vector3());
    const esc = 100 / Math.max(caixa.getSize(new THREE.Vector3()).x, 1e-6);
    gltf.scene.traverse((o) => {
      if (!o.isMesh) return;
      const g = o.geometry.clone().applyMatrix4(o.matrixWorld);
      g.translate(-centro.x, -centro.y, -centro.z);
      g.scale(esc, esc, esc);
      const m = new THREE.MeshStandardMaterial({ map: o.material.map, envMap: ambiente, side: THREE.DoubleSide, ...(C.brilho[o.material.name] || C.brilho.padrao) });
      if (m.map) { m.map.anisotropy = renderer.capabilities.getMaxAnisotropy(); texturas.push(m.map); }
      giro.add(new THREE.Mesh(g, materialContorno), new THREE.Mesh(g, m));
      geometrias.push(g); materiais.push(m);
    });
    aviso.hidden = true;
    pronto = true;
    enquadrar();
  }

  raiz.querySelectorAll('[data-zoom]').forEach((b) => b.addEventListener('click', () => {
    zoom = THREE.MathUtils.clamp(zoom + Number(b.dataset.zoom) * 0.15, C.zoomMin, C.zoomMax);
  }));
  // a frente da peça olha pra +Y no Blender, que no .glb vira −Z: por isso o giro de meia volta
  let angulo = Math.PI - 0.5, inclinacao = C.inclinacao, velocidade = 0, arrastando = false, ultimoToque = -99, xAnt = 0, yAnt = 0;
  let visivel = false, vivo = true, pronto = false, comecou = false, raf = 0;
  const relogio = new THREE.Clock();
  canvas.addEventListener('pointerdown', (e) => {
    arrastando = true; xAnt = e.clientX; yAnt = e.clientY; velocidade = 0;
    canvas.setPointerCapture(e.pointerId);
    raiz.querySelector('.modelo-dica').classList.add('sumir');
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!arrastando) return;
    const dx = e.clientX - xAnt, dy = e.clientY - yAnt; xAnt = e.clientX; yAnt = e.clientY;
    angulo += dx * C.sensibilidade; velocidade = dx * C.sensibilidade * 60; ultimoToque = relogio.elapsedTime;
    if (!CELULAR) inclinacao = THREE.MathUtils.clamp(inclinacao + dy * C.sensibilidade, C.inclinacaoMin, C.inclinacaoMax);
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
    giro.rotation.set(inclinacao, angulo, 0);
    if (pronto) renderer.render(cena, camera);
  }
  enquadrar();
  quadro();

  return {
    destruir() {
      vivo = false;
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      geometrias.forEach((g) => g.dispose());
      materiais.forEach((m) => m.dispose());
      texturas.forEach((x) => x.dispose());
      ambiente.dispose();
      renderer.dispose(); renderer.forceContextLoss();
    },
  };
}
