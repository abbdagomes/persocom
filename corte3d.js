// O corte da escultura para impressão, em 3D (item { corte3d: { arquivo, arma } } no projetos.js; arma = os nomes das peças dela).
// Cada peça do arquivo de impressão fica no seu lugar; a barra separa as peças ("vista explodida"). Arrastar gira.
// Modelo: .claude/ferramentas/pecas_3mf.py + pecas_glb.py, a partir do .3mf dela.
import * as THREE from 'three';
import { carregarGlb } from './carregarGlb.js';

const CELULAR = matchMedia('(pointer: coarse)').matches;
const CONFIG_CORTE = {
  tons: ['#e3e6ea', '#c9ced6'],   // as peças vizinhas alternam: dá pra ver os cortes até com tudo montado
  afastaAltura: 0.42,             // quanto as peças se afastam na altura, em relação ao centro
  afastaLado: 0.6,                // e pros lados (os braços)
  afastaArma: 0.42,               // a arma inteira ainda vai mais pro lado (m)
  giroSozinho: 0.25,
  sensibilidade: 0.011,
  duracaoAbrir: 1700,             // ms: ao aparecer na tela, as peças se separam sozinhas uma vez
};
const suave = (t) => t * t * (3 - 2 * t);

export function montarCorte3d(raiz, cfg) {
  const C = CONFIG_CORTE;
  raiz.innerHTML = `
    <div class="modelo-palco corte3d">
      <canvas class="modelo-cena" aria-label="as peças da escultura em 3D — arraste pra girar"></canvas>
      <div class="modelo-carregando">carregando o modelo…</div>
      <div class="modelo-dica">↔ arraste pra girar</div>
      <div class="modelo-barra" role="slider" tabindex="0" aria-label="montada ou em peças" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
        <span class="modelo-barra-rotulo cima">montada</span>
        <div class="modelo-trilho"><div class="modelo-preenchido"></div><div class="modelo-pegador"></div></div>
        <span class="modelo-barra-rotulo baixo">peças</span>
      </div>
    </div>`;
  const palco = raiz.querySelector('.modelo-palco');
  const canvas = raiz.querySelector('.modelo-cena');
  const aviso = raiz.querySelector('.modelo-carregando');
  const barra = raiz.querySelector('.modelo-barra');
  const trilho = raiz.querySelector('.modelo-trilho');
  const pegador = raiz.querySelector('.modelo-pegador');
  const preenchido = raiz.querySelector('.modelo-preenchido');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !CELULAR, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, CELULAR ? 1.5 : 2));
  const cena = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(22, 1, 0.1, 100);
  const giro = new THREE.Group();
  cena.add(giro);
  cena.add(new THREE.HemisphereLight(0xffffff, 0xaab2bf, 1.5));
  const sol = new THREE.DirectionalLight(0xffffff, 1.9);
  sol.position.set(-1.5, 3, 4);
  cena.add(sol);

  const pecas = [];     // { malha, lugar, fim }
  const materiais = C.tons.map((cor) => new THREE.MeshStandardMaterial({ color: cor, roughness: 0.82, metalness: 0 }));
  let abertura = 0, angulo = 0.5, velocidade = 0, arrastando = false, ultimoToque = -99;
  let visivel = false, vivo = true, raf = 0, comecou = false, animando = 0, pronto = false;
  const relogio = new THREE.Clock();
  // tamanho do conjunto montado e separado, pra câmera manter tudo no quadro
  const tamanhos = { r0: 1, a0: 1, r1: 1, a1: 1 };

  function aplicarAbertura() {
    const t = suave(abertura);
    for (const p of pecas) p.malha.position.lerpVectors(p.lugar, p.fim, t);
    pegador.style.top = `${abertura * 100}%`;
    preenchido.style.height = `${abertura * 100}%`;
    barra.setAttribute('aria-valuenow', Math.round(abertura * 100));
    enquadrar();
  }
  function enquadrar() {
    const w = palco.clientWidth, h = palco.clientHeight;
    if (!w || !h) return;
    const t = suave(abertura);
    const raio = tamanhos.r0 + (tamanhos.r1 - tamanhos.r0) * t;
    const alt = tamanhos.a0 + (tamanhos.a1 - tamanhos.a0) * t;
    const tg = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const reserva = w < 500 ? 0.82 : 0.9;      // a barra fica do lado
    const d = Math.max((alt / 2 * 1.06) / tg, (raio * 1.04) / (tg * (w / h) * reserva));
    camera.position.set(0, 0.06 * d, d);
    camera.lookAt(0, 0, 0);
  }
  function tamanho() {
    const w = palco.clientWidth, h = palco.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    enquadrar();
  }

  async function carregar() {
    const gltf = await carregarGlb(cfg.arquivo);
    if (!vivo) return;
    const malhas = [];
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((o) => { if (o.isMesh) malhas.push(o); });
    const dados = malhas.map((m) => {
      const nome = (m.parent && /^p\d+$/.test(m.parent.name) ? m.parent.name : m.name).split('_')[0];
      const geo = m.geometry.clone().applyMatrix4(m.matrixWorld);
      geo.computeBoundingBox();
      return { nome, geo, centro: geo.boundingBox.getCenter(new THREE.Vector3()) };
    });
    const ehArma = (d) => cfg.arma.includes(d.nome);
    const caixa = (lista) => lista.reduce((b, d) => b.union(d.geo.boundingBox), new THREE.Box3());
    const meioCorpo = caixa(dados.filter((d) => !ehArma(d))).getCenter(new THREE.Vector3());
    const meioArma = caixa(dados.filter(ehArma)).getCenter(new THREE.Vector3());
    const tudo = caixa(dados);
    const meio = tudo.getCenter(new THREE.Vector3());

    // do mais alto pro mais baixo, alternando os tons
    [...dados].sort((a, b) => b.centro.y - a.centro.y).forEach((d, i) => {
      const arma = ehArma(d);
      const c = arma ? meioArma : meioCorpo;
      const fim = new THREE.Vector3(
        (d.centro.x - c.x) * C.afastaLado + (arma ? -C.afastaArma : 0),
        (d.centro.y - c.y) * C.afastaAltura,
        (d.centro.z - c.z) * 0.25,
      );
      // cada peça gira e anda em volta do próprio centro
      d.geo.translate(-d.centro.x, -d.centro.y, -d.centro.z);
      const malha = new THREE.Mesh(d.geo, materiais[i % materiais.length]);
      const lugar = d.centro.clone().sub(meio);
      giro.add(malha);
      pecas.push({ malha, lugar, fim: lugar.clone().add(fim) });
    });
    // o que precisa caber: altura e o maior raio em volta do eixo de giro, montada e separada
    const mede = (qual) => {
      let raio = 0, min = Infinity, max = -Infinity;
      for (const p of pecas) {
        const pos = p[qual], b = p.malha.geometry.boundingBox;
        const meiaX = (b.max.x - b.min.x) / 2, meiaZ = (b.max.z - b.min.z) / 2;
        raio = Math.max(raio, Math.hypot(Math.abs(pos.x) + meiaX, Math.abs(pos.z) + meiaZ));
        min = Math.min(min, pos.y - (b.max.y - b.min.y) / 2);
        max = Math.max(max, pos.y + (b.max.y - b.min.y) / 2);
      }
      return { raio, alt: max - min };
    };
    for (const p of pecas) p.malha.geometry.computeBoundingBox();
    const m0 = mede('lugar'), m1 = mede('fim');
    tamanhos.r0 = m0.raio; tamanhos.a0 = m0.alt; tamanhos.r1 = m1.raio; tamanhos.a1 = m1.alt;
    pronto = true;
    aviso.hidden = true;
    aplicarAbertura();
    animando = performance.now();      // as peças se separam sozinhas
  }

  // ---------- a barra ----------
  function porPonteiro(e) {
    const r = trilho.getBoundingClientRect();
    abertura = THREE.MathUtils.clamp((e.clientY - r.top) / r.height, 0, 1);
    animando = 0;
    aplicarAbertura();
  }
  let arrastandoBarra = false;
  barra.addEventListener('pointerdown', (e) => { arrastandoBarra = true; barra.setPointerCapture(e.pointerId); porPonteiro(e); e.preventDefault(); });
  barra.addEventListener('pointermove', (e) => { if (arrastandoBarra) porPonteiro(e); });
  barra.addEventListener('pointerup', () => { arrastandoBarra = false; });
  barra.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    abertura = THREE.MathUtils.clamp(abertura + (e.key === 'ArrowDown' ? 0.05 : -0.05), 0, 1);
    animando = 0;
    aplicarAbertura();
    e.preventDefault();
  });

  // ---------- girar ----------
  let xAnt = 0;
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

  const ro = new ResizeObserver(tamanho);
  ro.observe(palco);
  const io = new IntersectionObserver(([en]) => {
    visivel = en.isIntersecting;
    if (visivel) relogio.getDelta();
    if (visivel && !comecou) {
      comecou = true;
      carregar().catch(() => { aviso.textContent = 'não deu pra carregar o modelo'; });
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
    giro.rotation.y = angulo;
    if (animando) {
      abertura = Math.min(1, (performance.now() - animando) / C.duracaoAbrir);
      if (abertura >= 1) animando = 0;
      aplicarAbertura();
    }
    if (pronto) renderer.render(cena, camera);
  }
  tamanho();
  quadro();

  return {
    destruir() {
      vivo = false;
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      for (const p of pecas) p.malha.geometry.dispose();
      materiais.forEach((m) => m.dispose());
      renderer.dispose(); renderer.forceContextLoss();
    },
  };
}
