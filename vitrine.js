// Vitrine 3D dos personagens (tipo "seleção de personagem" de jogo):
// um personagem por vez num pedestal, arrasta pra girar, ícones pra trocar,
// e bolhas de expressão (carinhas de texto) que trocam o rosto na hora. Todos ficam em T-pose, parados.
// Quem monta é o projetos.js, quando o projeto tem um item { vitrine: {...} } na lista de imagens.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const CONFIG_VITRINE = {
  giroSozinho: 0.35,          // velocidade do giro automático (rad/s) quando ninguém está mexendo
  voltaGirarDepois: 3,        // segundos parado até voltar a girar sozinho
  sensibilidade: 0.012,       // quanto gira por pixel arrastado
  fov: 24,
};

const draco = new DRACOLoader().setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/libs/draco/');
const carregador = new GLTFLoader().setDRACOLoader(draco);
const carregadorTextura = new THREE.TextureLoader();
const cacheModelos = new Map();   // id → Promise<gltf>
const cacheRostos = new Map();    // url → Promise<Texture>

function carregarModelo(url) {
  if (!cacheModelos.has(url)) cacheModelos.set(url, carregador.loadAsync(url));
  return cacheModelos.get(url);
}
function carregarRosto(url) {
  if (!cacheRostos.has(url)) {
    cacheRostos.set(url, carregadorTextura.loadAsync(url).then((t) => {
      t.flipY = false;                       // igual às texturas que vêm dentro do .glb
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }));
  }
  return cacheRostos.get(url);
}
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const suave = (t) => 1 - Math.pow(1 - t, 3);
const volta = (t) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }; // pulinho no fim

export function montarVitrine(raiz, cfg) {
  const v = cfg.versao ? `?v=${cfg.versao}` : '';
  const url = (nome) => cfg.pasta + nome + v;
  const personagens = cfg.personagens;
  const expressoes = cfg.expressoes;
  const cor = getComputedStyle(raiz).getPropertyValue('--c1').trim() || '#94d3ec';

  raiz.innerHTML = `
    <div class="vitrine-palco">
      <canvas class="vitrine-cena" aria-label="personagem em 3D — arraste pra girar"></canvas>
      <div class="vitrine-carregando">carregando…</div>
      <button class="vitrine-seta esq" data-passo="-1" aria-label="personagem anterior">‹</button>
      <button class="vitrine-seta dir" data-passo="1" aria-label="próximo personagem">›</button>
      <div class="vitrine-info"><h3></h3><p></p></div>
      <div class="vitrine-dica">↔ arraste pra girar</div>
      <div class="vitrine-expressoes">
        ${expressoes.map((e, i) => `<button class="vitrine-expr" data-expr="${esc(e.id)}" title="${esc(e.nome)}" aria-label="${esc(e.nome)}" style="--cor:${esc(e.cor || '#94d3ec')}; --atraso:${(i * -0.37).toFixed(2)}s"><span>${esc(e.rosto)}</span></button>`).join('')}
      </div>
    </div>
    <div class="vitrine-elenco">
      ${personagens.map((p, i) => `<button class="vitrine-icone" data-i="${i}" title="${esc(p.nome)}" aria-label="${esc(p.nome)}"><img src="${esc(url('icone-' + p.id + '.webp'))}" alt=""></button>`).join('')}
    </div>`;

  const canvas = raiz.querySelector('.vitrine-cena');
  const palco = raiz.querySelector('.vitrine-palco');
  const aviso = raiz.querySelector('.vitrine-carregando');
  const titulo = raiz.querySelector('.vitrine-info h3');
  const frase = raiz.querySelector('.vitrine-info p');
  const barraExpr = raiz.querySelector('.vitrine-expressoes');

  // ---------- cena ----------
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  const cena = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  cena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  cena.add(new THREE.HemisphereLight(0xffffff, 0xe8ecf4, 0.6));
  const camera = new THREE.PerspectiveCamera(CONFIG_VITRINE.fov, 1, 0.1, 200);

  // pedestal perolado na cor da categoria + sombrinha em cima
  const pedestal = new THREE.Group();
  const corPed = new THREE.Color(cor);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.06, 0.34, 64),
    new THREE.MeshPhysicalMaterial({ color: corPed.clone().lerp(new THREE.Color('#ffffff'), 0.35), roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15 }));
  base.position.y = -0.17;
  const tampa = new THREE.Mesh(new THREE.CylinderGeometry(0.96, 0.96, 0.02, 64),
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.3, clearcoat: 1 }));
  tampa.position.y = 0.005;
  const sombraTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'); const r = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    r.addColorStop(0, 'rgba(40,50,70,0.35)'); r.addColorStop(1, 'rgba(40,50,70,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const sombra = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ map: sombraTex, transparent: true, depthWrite: false }));
  sombra.rotation.x = -Math.PI / 2; sombra.position.y = 0.02;
  pedestal.add(base, tampa, sombra);
  cena.add(pedestal);

  const giro = new THREE.Group();        // o que o arrastar gira
  cena.add(giro);

  // ---------- estado ----------
  let atual = null;            // { id, raizModelo, materiais, escala }
  let indice = 0;
  let expressao = expressoes[0].id;
  let angulo = 0, velocidade = 0, arrastando = false, ultimoToque = -99;
  let transicao = null;        // { tipo:'sai'|'entra', t0, alvo }
  let visivel = false, vivo = true, relogio = new THREE.Clock(), raf = 0;
  let pedido = 0;              // evita corrida se trocar rápido

  function tamanho() {
    const w = canvas.clientWidth, h = canvas.clientHeight;   // no celular o canvas não ocupa o palco todo
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    enquadrar();
  }
  function enquadrar() {
    // pedestal tem raio 1; o personagem é escalado pra caber em "alturaAlvo"
    const alturaAlvo = 2.25, meio = alturaAlvo * 0.5;
    const d = (alturaAlvo * 0.7) / Math.tan(THREE.MathUtils.degToRad(CONFIG_VITRINE.fov / 2)) / Math.min(1, camera.aspect * 0.9);
    camera.position.set(0, meio + d * 0.12, d);
    camera.lookAt(0, meio - 0.42, 0);   // olha mais pra baixo: o pedestal sobe e fica acima da barra de expressões
  }

  function aplicarRosto(p, exprId) {
    const tem = p.expressoes?.includes(exprId);
    const endereco = tem ? url(`rostos/${p.id}-${exprId}.webp`) : null;
    if (!atual || atual.id !== p.id) return;
    const alvo = atual;
    if (!endereco) { alvo.materiais.forEach((m) => { m.map = m.userData.mapaOriginal; m.needsUpdate = true; }); return; }
    carregarRosto(endereco).then((tex) => {
      if (atual !== alvo) return;
      alvo.materiais.forEach((m) => { m.map = tex; m.needsUpdate = true; });
    });
  }

  function marcarBotoes() {
    const p = personagens[indice];
    raiz.querySelectorAll('.vitrine-icone').forEach((b, i) => b.classList.toggle('ativo', i === indice));
    // só aparecem as bolhas dos rostos que esse personagem tem; sem nenhum (Tony, palhaço) a barra some
    raiz.querySelectorAll('.vitrine-expr').forEach((b) => {
      b.hidden = !p.expressoes?.includes(b.dataset.expr);
      b.classList.toggle('ativo', b.dataset.expr === expressao);
    });
    barraExpr.hidden = !p.expressoes?.length;
    titulo.textContent = p.nome;
    frase.textContent = p.frase || '';
  }

  async function mostrar(i) {
    indice = (i + personagens.length) % personagens.length;
    marcarBotoes();
    const meu = ++pedido;
    const p = personagens[indice];
    if (atual) transicao = { tipo: 'sai', t0: relogio.elapsedTime };
    aviso.hidden = cacheModelos.has(url(p.id + '.glb'));
    let gltf;
    try { gltf = await carregarModelo(url(p.id + '.glb')); } catch (e) { aviso.textContent = 'não deu pra carregar 😢'; return; }
    if (meu !== pedido || !vivo) return;
    aviso.hidden = true;
    // espera a saída do anterior terminar
    const falta = transicao?.tipo === 'sai' ? Math.max(0, 0.18 - (relogio.elapsedTime - transicao.t0)) : 0;
    if (falta) await new Promise((r) => setTimeout(r, falta * 1000));
    if (meu !== pedido || !vivo) return;

    if (atual) giro.remove(atual.raizModelo);
    const modelo = gltf.scene;     // cada personagem é carregado uma vez só, então dá pra reusar a cena
    // tira do suporte antigo antes de medir (quando volta pra um personagem já visto, o suporte velho estava encolhido)
    modelo.removeFromParent();
    modelo.position.set(0, 0, 0); modelo.scale.setScalar(1); modelo.rotation.set(0, 0, 0);
    modelo.updateMatrixWorld(true);
    const caixa = new THREE.Box3().setFromObject(modelo);
    const tam = caixa.getSize(new THREE.Vector3());
    // T-pose: cabe na altura e na largura (braços abertos)
    const escala = Math.min(2.05 / tam.y, 2.5 / Math.max(tam.x, tam.z)) * (p.escala || 1);
    const centro = caixa.getCenter(new THREE.Vector3());
    const suporte = new THREE.Group();
    modelo.position.set(-centro.x, -caixa.min.y, -centro.z);
    suporte.add(modelo);
    suporte.scale.setScalar(escala);
    const materiais = new Set();
    modelo.traverse((o) => {
      if (o.isMesh) {
        o.frustumCulled = false;
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        ms.forEach((m) => {
          if (m.map) {
            if (!m.userData.mapaOriginal) m.userData.mapaOriginal = m.map;
            materiais.add(m);
          }
          m.metalness = 0; m.roughness = Math.max(m.roughness ?? 1, 0.75);
          // alguns vieram do Blender marcados como "transparentes": aí dava pra ver o lado de dentro
          m.transparent = false; m.opacity = 1; m.depthWrite = true; m.alphaTest = 0;
          m.needsUpdate = true;
        });
      }
    });
    giro.add(suporte);
    atual = { id: p.id, raizModelo: suporte, materiais: [...materiais], escala };
    // o rosto escolhido continua se esse personagem tiver; senão volta pro primeiro que ele tem
    if (p.expressoes?.length && !p.expressoes.includes(expressao)) expressao = p.expressoes[0];
    marcarBotoes();
    aplicarRosto(p, expressao);
    transicao = { tipo: 'entra', t0: relogio.elapsedTime, alvo: escala };
    suporte.scale.setScalar(0.001);
    // já deixa o próximo carregando
    carregarModelo(url(personagens[(indice + 1) % personagens.length].id + '.glb')).catch(() => {});
  }

  function escolherExpressao(id) {
    expressao = id;
    marcarBotoes();
    const p = personagens[indice];
    aplicarRosto(p, id);
    const botao = raiz.querySelector(`[data-expr="${id}"]`);
    botao.classList.remove('estalo'); void botao.offsetWidth; botao.classList.add('estalo');   // "ploc" da bolha
    if (window.soltarGlitter) {
      const r = botao.getBoundingClientRect();
      window.soltarGlitter(r.left + r.width / 2, r.top + r.height / 2, 12);
    }
  }

  // ---------- controles ----------
  raiz.querySelectorAll('.vitrine-icone').forEach((b) => b.addEventListener('click', () => mostrar(+b.dataset.i)));
  raiz.querySelectorAll('.vitrine-seta').forEach((b) => b.addEventListener('click', () => mostrar(indice + +b.dataset.passo)));
  raiz.querySelectorAll('.vitrine-expr').forEach((b) => b.addEventListener('click', () => escolherExpressao(b.dataset.expr)));
  let xAnt = 0;
  canvas.addEventListener('pointerdown', (e) => { arrastando = true; xAnt = e.clientX; velocidade = 0; canvas.setPointerCapture(e.pointerId); palco.classList.add('arrastando'); raiz.querySelector('.vitrine-dica').classList.add('sumir'); });
  canvas.addEventListener('pointermove', (e) => {
    if (!arrastando) return;
    const dx = e.clientX - xAnt; xAnt = e.clientX;
    angulo += dx * CONFIG_VITRINE.sensibilidade;
    velocidade = dx * CONFIG_VITRINE.sensibilidade * 60;
    ultimoToque = relogio.elapsedTime;
  });
  const soltar = () => { if (!arrastando) return; arrastando = false; ultimoToque = relogio.elapsedTime; palco.classList.remove('arrastando'); };
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);
  const teclas = (e) => {
    if (!raiz.matches(':hover') && !raiz.contains(document.activeElement)) return;
    if (e.key === 'ArrowRight') { mostrar(indice + 1); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { mostrar(indice - 1); e.preventDefault(); }
  };
  addEventListener('keydown', teclas);
  const ro = new ResizeObserver(tamanho); ro.observe(palco);
  const io = new IntersectionObserver(([en]) => { visivel = en.isIntersecting; if (visivel) relogio.getDelta(); }, { threshold: 0.05 });
  io.observe(palco);

  // ---------- loop ----------
  function quadro() {
    raf = requestAnimationFrame(quadro);
    if (!visivel || document.hidden) return;
    const dt = Math.min(relogio.getDelta(), 0.05);
    const t = relogio.elapsedTime;
    if (!arrastando) {
      velocidade *= Math.pow(0.04, dt);                    // inércia depois de soltar
      angulo += velocidade * dt;
      if (t - ultimoToque > CONFIG_VITRINE.voltaGirarDepois) angulo += CONFIG_VITRINE.giroSozinho * dt;
    }
    giro.rotation.y = angulo;
    if (atual) {
      if (transicao) {
        const k = Math.min(1, (t - transicao.t0) / (transicao.tipo === 'sai' ? 0.18 : 0.45));
        const s = transicao.tipo === 'sai' ? atual.escala * (1 - suave(k)) : atual.escala * volta(k);
        atual.raizModelo.scale.setScalar(Math.max(0.001, s));
        if (k >= 1) transicao = transicao.tipo === 'sai' ? transicao : null;
      }
    }
    renderer.render(cena, camera);
  }

  tamanho();
  mostrar(0);
  quadro();

  return {
    destruir() {
      vivo = false;
      cancelAnimationFrame(raf);
      removeEventListener('keydown', teclas);
      ro.disconnect(); io.disconnect();
      giro.clear();
      renderer.dispose();
      pmrem.dispose();
    },
  };
}
