// =====================================================================
//  REVISTA 3D DA BOCA BOCA — item { revista3d: { pasta, paginas } } no projetos.js
//  Fechada: a revista flutua girando devagar. Clicando, ela vira de frente e abre;
//  aí dá pra folhear (clicar do lado direito/esquerdo, arrastar, setas ← →, ou os botões ‹ ›).
//  As páginas são as imagens da revista do Issuu (projetos/boca-boca/revista/001.webp … 100.webp).
//  Cada folha = 2 páginas (frente e verso); só as folhas de cima de cada lado (e as capas de baixo) são
//  desenhadas, e as pilhas de folhas viram caixinhas com a grossura certa. A folha virando entorta um pouco.
//  Só ficam na memória as texturas das páginas perto da que está aberta (as 2 abertas em alta, pasta grande/).
//  Pra ler: 2 cliques (ou a lupa) amplia onde clicou, arrastar passeia, rodinha/pinça ajusta; e tem tela cheia.
// =====================================================================
import * as THREE from 'three';

const CONFIG_REVISTA = {
  proporcao: 2996 / 2300,        // altura / largura de uma página (as imagens do Issuu)
  grossuraFolha: 0.0007,         // em larguras de página (50 folhas ≈ 3,5% da largura)
  giro: 0.45,                    // velocidade do giro fechada (rad/s); passando o mouse ela quase para
  viraDuracao: 0.75,             // segundos pra virar uma página (rápido quando clica várias vezes seguidas)
  entorta: 0.9,                  // quanto a ponta da folha fica pra trás enquanto vira
  inclinaAberta: -0.2,           // a revista aberta deitada um pouquinho pra trás (rad)
  fov: 30,
  corPapel: '#f2eee6',           // borda das folhas
  corLombada: '#164f27',         // o verde da capa (medido na borda da capa e da contracapa)
  guardar: 6,                    // quantas páginas pra cada lado ficam carregadas
  zoom: { lupa: 2.6, maximo: 5 }, // ampliar pra ler (2 cliques ou o botão da lupa)
};
const ICONE_LUPA = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>';
const ICONE_CHEIA = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';

const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function montarRevista3d(raiz, cfg) {
  const R = CONFIG_REVISTA;
  const PAGINAS = cfg.paginas || 100;
  const FOLHAS = Math.ceil(PAGINAS / 2);
  const W = 1, H = R.proporcao;
  const url = (p, alta) => `${cfg.pasta}${alta ? 'grande/' : ''}${String(p).padStart(3, '0')}.webp`;

  raiz.innerHTML = `
    <div class="revista3d" data-modo="fechada">
      <canvas aria-label="revista Boca Boca em 3D"></canvas>
      <p class="revista-dica">clique pra abrir e folhear</p>
      <div class="revista-controles">
        <button type="button" class="pilula" data-passo="-1" aria-label="página anterior">‹</button>
        <span class="revista-contador">capa</span>
        <button type="button" class="pilula" data-passo="1" aria-label="próxima página">›</button>
        <button type="button" class="pilula revista-icone" data-zoom aria-label="ampliar pra ler" title="ampliar pra ler (ou 2 cliques na página)">${ICONE_LUPA}</button>
        <button type="button" class="pilula revista-icone" data-cheia aria-label="tela cheia" title="tela cheia">${ICONE_CHEIA}</button>
        <button type="button" class="pilula revista-fechar" data-fechar>fechar ✕</button>
      </div>
    </div>`;
  const palco = raiz.querySelector('.revista3d');
  const canvas = palco.querySelector('canvas');
  const contador = palco.querySelector('.revista-contador');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const anisotropia = renderer.capabilities.getMaxAnisotropy();
  const cena = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(R.fov, 1, 0.1, 50);
  // luz (só pras bordas das folhas e a lombada; as páginas mostram a cor exata da imagem)
  cena.add(new THREE.AmbientLight('#ffffff', 0.8));
  const sol = new THREE.DirectionalLight('#ffffff', 0.22);
  cena.add(sol);

  // flutua (gira e sobe/desce) > livro (desliza pro lado pra ficar centralizada fechada ou aberta) > folhas
  const flutua = new THREE.Group();
  const livro = new THREE.Group();
  flutua.add(livro);
  cena.add(flutua);

  // ---------- sombra no "chão" ----------
  const sombraCanvas = document.createElement('canvas');
  sombraCanvas.width = sombraCanvas.height = 128;
  const sc = sombraCanvas.getContext('2d');
  const grad = sc.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(40,50,70,.35)'); grad.addColorStop(1, 'rgba(40,50,70,0)');
  sc.fillStyle = grad; sc.fillRect(0, 0, 128, 128);
  const texSombra = new THREE.CanvasTexture(sombraCanvas);
  const sombra = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: texSombra, transparent: true, depthWrite: false }));
  sombra.rotation.x = -Math.PI / 2;
  sombra.position.y = -H / 2 - 0.16;
  cena.add(sombra);

  // ---------- texturas das páginas (carrega perto da página aberta, solta as longe) ----------
  const loader = new THREE.TextureLoader();
  const texturas = new Map();       // página → { tex, pronta }  (900 px)
  const grandes = new Map();        // página → { tex, pronta }  (1800 px, só as abertas — pra ler com zoom)
  function textura(p, alta = false) {
    if (p < 1 || p > PAGINAS) return null;
    const mapa = alta ? grandes : texturas;
    let t = mapa.get(p);
    if (!t) {
      t = { tex: null, pronta: false };
      t.tex = loader.load(url(p, alta), () => { t.pronta = true; });
      t.tex.colorSpace = THREE.SRGBColorSpace;
      t.tex.anisotropy = anisotropia;
      mapa.set(p, t);
    }
    return t.pronta ? t.tex : null;
  }
  const pagina = (p, alta) => (alta && textura(p, true)) || textura(p);
  function limparTexturas(centro) {
    for (const [p, t] of texturas) {
      const capa = p <= 2 || p >= PAGINAS - 1;
      if (!capa && Math.abs(p - centro) > R.guardar * 2) { t.tex.dispose(); texturas.delete(p); }
    }
    for (const [p, t] of grandes) if (p < centro - 2 || p > centro + 3) { t.tex.dispose(); grandes.delete(p); }
    for (let p = centro - R.guardar; p <= centro + R.guardar + 1; p++) textura(p);
  }

  // ---------- uma folha: frente e verso dividindo as mesmas posições ----------
  const NX = 28;
  function criarFolha(dinamica) {
    const base = new THREE.PlaneGeometry(W, H, NX, 1);
    base.translate(W / 2, 0, 0);            // a lombada fica no x = 0
    const pos = base.getAttribute('position');
    if (dinamica) pos.setUsage(THREE.DynamicDrawUsage);
    const gF = base;
    const gB = new THREE.BufferGeometry();
    gB.setAttribute('position', pos);
    gB.setAttribute('normal', base.getAttribute('normal'));
    const uvB = base.getAttribute('uv').clone();
    for (let i = 0; i < uvB.count; i++) uvB.setX(i, 1 - uvB.getX(i));   // o verso não fica espelhado
    gB.setAttribute('uv', uvB);
    gB.setIndex(base.getIndex());
    // páginas sem luz nenhuma = a cor exata da imagem (só a folha virando ganha uma sombrinha, em desenhar)
    const mF = new THREE.MeshBasicMaterial({ color: R.corPapel, side: THREE.FrontSide });
    const mB = new THREE.MeshBasicMaterial({ color: R.corPapel, side: THREE.BackSide });
    const grupo = new THREE.Group();
    grupo.add(new THREE.Mesh(gF, mF), new THREE.Mesh(gB, mB));
    livro.add(grupo);
    return { gF, gB, mF, mB, grupo, pos, folha: -1 };
  }
  const lugares = {
    esqCima: criarFolha(false), esqBaixo: criarFolha(false),
    dirCima: criarFolha(false), dirBaixo: criarFolha(false),
    virando: criarFolha(true),
  };
  function porMapa(m, tex, luz = 1) {
    m.color.set(tex ? '#ffffff' : R.corPapel).multiplyScalar(luz);
    if (m.map === tex) return;
    m.map = tex;
    m.needsUpdate = true;
  }
  function mostrarFolha(l, folha, angulo, z, luz = 1, alta = false) {
    l.grupo.visible = folha >= 0;
    if (folha < 0) return;
    l.folha = folha;
    porMapa(l.mF, pagina(folha * 2 + 1, alta), luz);
    porMapa(l.mB, pagina(folha * 2 + 2, alta), luz);
    l.grupo.rotation.y = -angulo;          // 0 = deitada do lado direito, π = do lado esquerdo
    l.grupo.position.z = z;
  }

  // a folha virando: a ponta fica um pouco pra trás (dobra suave), o comprimento não muda
  function entortar(l, angulo, sentido) {
    const p = l.pos, k = R.entorta * Math.sin(angulo) * sentido;
    let x = 0, z = 0;
    for (let i = 0; i <= NX; i++) {
      if (i > 0) {
        const s = (i - 0.5) / NX;
        const phi = angulo - k * s;
        x += Math.cos(phi) * (W / NX);
        z += Math.sin(phi) * (W / NX);
      }
      for (const linha of [0, 1]) p.setXYZ(linha * (NX + 1) + i, x, linha ? -H / 2 : H / 2, z);
    }
    p.needsUpdate = true;
    l.gF.computeVertexNormals();
  }

  // ---------- as pilhas (caixinhas com a grossura das folhas) ----------
  const matPilha = new THREE.MeshLambertMaterial({ color: R.corPapel });
  const pilhaDir = new THREE.Mesh(new THREE.BoxGeometry(W, H, 1).translate(W / 2, 0, 0.5), matPilha);
  const pilhaEsq = new THREE.Mesh(new THREE.BoxGeometry(W, H, 1).translate(-W / 2, 0, 0.5), matPilha);
  livro.add(pilhaDir, pilhaEsq);
  // a lombada verde (só aparece com a revista fechada, quando um dos lados está vazio)
  const matLombada = new THREE.MeshLambertMaterial({ color: R.corLombada });
  const lombada = new THREE.Mesh(new THREE.BoxGeometry(0.004, H, 1).translate(-0.001, 0, 0.5), matLombada);
  lombada.scale.z = FOLHAS * R.grossuraFolha + 0.0004;
  livro.add(lombada);
  function pilha(m, n) {
    const h = Math.max(0, n * R.grossuraFolha - 0.0006);
    m.visible = h > 0.0001;
    m.scale.z = Math.max(h, 0.0001);
    m.position.z = 0.0003;
  }

  // ---------- estado ----------
  let modo = 'fechada';                    // fechada | abrindo | aberta | fechando
  let s = 0;                               // folhas já viradas pro lado esquerdo (0 = capa, FOLHAS = contracapa)
  let vira = null;                         // { k, sentido, t, dur }
  let fila = 0;
  let abrir = null;                        // { de, para, t }
  let girando = 0, girVel = R.giro, mouseDentro = false;
  let mx = 0, my = 0, deslize = -W / 2, tempo = 0;

  function comecarVirar(sentido) {
    if (sentido > 0 && s >= FOLHAS) return false;
    if (sentido < 0 && s <= 0) return false;
    vira = { k: sentido > 0 ? s : s - 1, sentido, t: 0, dur: fila ? R.viraDuracao * 0.5 : R.viraDuracao };
    return true;
  }
  function passo(sentido) {
    if (modo === 'fechada') { abrirRevista(); return; }
    if (modo !== 'aberta') return;
    if (vira) { if (Math.sign(fila) !== -sentido && Math.abs(fila) < 3) fila += sentido; return; }
    comecarVirar(sentido);
  }
  function abrirRevista() {
    if (modo !== 'fechada') return;
    modo = 'abrindo';
    const volta = Math.PI * 2;
    abrir = { de: girando, para: Math.round(girando / volta) * volta, t: 0 };
    palco.dataset.modo = 'aberta';
  }
  function fecharRevista() {
    if (modo !== 'aberta') return;
    zoom.alvo = 1;
    telaCheia(false);
    fila = 0;
    modo = 'fechando';
    if (vira) vira = null;
    if (s === 0) { modo = 'fechada'; palco.dataset.modo = 'fechada'; return; }
    if (s > 1) s = 1;                      // pula direto pra 1ª folha e fecha a capa
    comecarVirar(-1);
  }

  function atualizarContador() {
    contador.textContent = s === 0 ? 'capa' : s >= FOLHAS ? 'contracapa' : `${s * 2}–${s * 2 + 1} / ${PAGINAS}`;
    palco.querySelector('[data-passo="-1"]').disabled = s === 0;
    palco.querySelector('[data-passo="1"]').disabled = s >= FOLHAS;
  }
  atualizarContador();

  // ---------- ampliar pra ler (recorte da câmera, igual ao zoom da pintura) ----------
  const zoom = { nivel: 1, alvo: 1, cx: 0.5, cy: 0.5 };
  let telaW = 1, telaH = 1;
  const limitar = (v, a, b) => Math.min(b, Math.max(a, v));
  function aplicarZoom(dt) {
    zoom.nivel += (zoom.alvo - zoom.nivel) * Math.min(1, dt * 8);
    if (Math.abs(zoom.nivel - zoom.alvo) < 0.002) zoom.nivel = zoom.alvo;
    palco.classList.toggle('ampliada', zoom.alvo > 1);
    if (zoom.nivel <= 1.001) { if (camera.view?.enabled) camera.clearViewOffset(); return; }
    const vw = telaW / zoom.nivel, vh = telaH / zoom.nivel;
    zoom.cx = limitar(zoom.cx, 0.5 / zoom.nivel, 1 - 0.5 / zoom.nivel);
    zoom.cy = limitar(zoom.cy, 0.5 / zoom.nivel, 1 - 0.5 / zoom.nivel);
    camera.setViewOffset(telaW, telaH, zoom.cx * telaW - vw / 2, zoom.cy * telaH - vh / 2, vw, vh);
  }
  // o ponto da tela (0–1) que está embaixo do mouse, no quadro inteiro (sem zoom)
  const pontoNoQuadro = (px, py) => [zoom.cx + (px - 0.5) / zoom.nivel, zoom.cy + (py - 0.5) / zoom.nivel];
  function ampliarEm(px, py) {
    if (zoom.alvo > 1) { zoom.alvo = 1; return; }
    [zoom.cx, zoom.cy] = pontoNoQuadro(px, py);
    zoom.alvo = R.zoom.lupa;
  }
  function zoomPara(n, px, py) {             // rodinha / pinça: amplia mantendo o ponto embaixo do dedo
    n = limitar(n, 1, R.zoom.maximo);
    const [fx, fy] = pontoNoQuadro(px, py);
    zoom.nivel = zoom.alvo = n;
    zoom.cx = fx - (px - 0.5) / n;
    zoom.cy = fy - (py - 0.5) / n;
  }

  // tela cheia: a revista sai da página e ocupa a janela toda (o painel do projeto tem transform,
  // então ela vai pro <body>; um marcador segura o lugar pra página não pular)
  const marcador = document.createElement('div');
  let cheia = false;
  function telaCheia(ligar) {
    if (ligar === cheia) return;
    cheia = ligar;
    if (ligar) {
      marcador.style.height = `${palco.offsetHeight}px`;
      raiz.insertBefore(marcador, palco);
      document.body.appendChild(palco);
    } else {
      marcador.replaceWith(palco);
    }
    palco.classList.toggle('cheia', ligar);
    zoom.alvo = zoom.nivel = 1;
    if (ligar && !visivel) { visivel = true; antes = 0; raf = requestAnimationFrame(laco); }
  }

  // ---------- quadro ----------
  function enquadrar() {
    const aberta = modo !== 'fechada';
    // aberta: sobra espaço em cima/embaixo pra folha que levanta não sair do quadro (e pros botões)
    const w = aberta ? 2 * W * 1.1 : W * 1.7, h = aberta ? H * 1.5 : H * 1.4;
    const tg = Math.tan(THREE.MathUtils.degToRad(R.fov / 2));
    return Math.max(h / 2 / tg, w / 2 / (tg * camera.aspect));
  }
  let distancia = 0, olhar = -0.04;

  function desenhar(dt) {
    tempo += dt;
    // a folha virando
    let sEf = s;
    if (vira) {
      vira.t += dt / vira.dur;
      if (vira.t >= 1) {
        s += vira.sentido; vira = null;
        atualizarContador();
        if (modo === 'fechando' && s === 0) { modo = 'fechada'; palco.dataset.modo = 'fechada'; }
        else if (fila) { const sentido = Math.sign(fila); fila -= sentido; comecarVirar(sentido); }
      } else sEf = s + vira.sentido * suave(vira.t);
    }
    limparTexturas(Math.round(sEf) * 2);

    // girar de frente e abrir
    if (abrir) {
      abrir.t = Math.min(1, abrir.t + dt / 0.7);
      girando = abrir.de + (abrir.para - abrir.de) * suave(abrir.t);
      if (abrir.t >= 1) { abrir = null; girando = 0; modo = 'aberta'; comecarVirar(1); }
    } else if (modo === 'fechada') {
      girVel += ((mouseDentro ? 0.08 : R.giro) - girVel) * Math.min(1, dt * 3);
      girando += girVel * dt;
    }

    const fechada = modo === 'fechada' || modo === 'abrindo';
    const amaciar = Math.min(1, dt * 5);
    const segue = zoom.alvo > 1 ? 0 : 1;   // ampliada ela para de seguir o mouse (senão o texto treme)
    flutua.rotation.y = fechada ? girando : flutua.rotation.y + (mx * 0.12 * segue - flutua.rotation.y) * amaciar;
    const alvoX = fechada ? Math.sin(tempo * 0.8) * 0.06 - my * 0.1 : R.inclinaAberta + my * 0.06 * segue;
    flutua.rotation.x += (alvoX - flutua.rotation.x) * amaciar;
    const alvoY = fechada ? Math.sin(tempo * 1.3) * 0.05 : 0;
    flutua.position.y += (alvoY - flutua.position.y) * amaciar;

    // fechada fica centralizada; aberta, a lombada no meio
    const alvoDeslize = sEf < 1 ? -W / 2 * (1 - sEf) : sEf > FOLHAS - 1 ? W / 2 * (sEf - (FOLHAS - 1)) : 0;
    deslize += (alvoDeslize - deslize) * Math.min(1, dt * 8);
    livro.position.x = deslize;

    // as folhas
    const k = vira ? vira.k : -1;
    const nEsq = vira ? k : s, iniDir = vira ? k + 1 : s;
    const nDir = FOLHAS - iniDir;
    const T = R.grossuraFolha;
    pilha(pilhaEsq, nEsq); pilha(pilhaDir, nDir);
    lombada.visible = nEsq === 0 || nDir === 0;
    const alta = modo === 'aberta' && !vira;
    mostrarFolha(lugares.esqCima, nEsq >= 1 ? nEsq - 1 : -1, Math.PI, nEsq * T + 0.0002, 1, alta);
    mostrarFolha(lugares.esqBaixo, nEsq >= 2 ? 0 : -1, Math.PI, 0);
    mostrarFolha(lugares.dirCima, nDir >= 1 ? iniDir : -1, 0, nDir * T + 0.0002, 1, alta);
    mostrarFolha(lugares.dirBaixo, nDir >= 2 ? FOLHAS - 1 : -1, 0, 0);
    if (vira) {
      const a = Math.PI * suave(vira.t);
      const l = lugares.virando;
      mostrarFolha(l, k, 0, 0, 1 - 0.22 * Math.sin(a));     // escurece um pouco em pé, como se pegasse sombra
      l.grupo.rotation.y = 0;
      const zDe = vira.sentido > 0 ? nDir * T : nEsq * T, zPara = vira.sentido > 0 ? nEsq * T : nDir * T;
      l.grupo.position.z = zDe + (zPara - zDe) * (a / Math.PI) + 0.0006;
      entortar(l, a, vira.sentido);
    } else lugares.virando.grupo.visible = false;

    // sombra: acompanha a largura que aparece e fica mais fraca quando ela sobe
    const largura = fechada ? W * (0.45 + 0.55 * Math.abs(Math.cos(flutua.rotation.y))) : 2 * W;
    sombra.scale.set(largura * 1.3, 0.5, 1);
    sombra.material.opacity = 1 - flutua.position.y * 4;

    const alvoDist = enquadrar();
    distancia = distancia ? distancia + (alvoDist - distancia) * Math.min(1, dt * 3) : alvoDist;
    camera.position.set(0, distancia * 0.18, distancia);
    olhar += ((modo === 'fechada' ? -0.04 : -0.1) - olhar) * Math.min(1, dt * 3);   // aberta sobe um pouco (botões embaixo)
    camera.lookAt(0, olhar, 0);
    sol.position.copy(camera.position);
    aplicarZoom(dt);
    renderer.render(cena, camera);
  }

  // ---------- mouse / toque / teclado ----------
  let toque = null;
  canvas.addEventListener('pointerenter', () => { mouseDentro = true; });
  canvas.addEventListener('pointerleave', () => { mouseDentro = false; mx = my = 0; });
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mx = ((e.clientX - r.left) / r.width) * 2 - 1;
    my = ((e.clientY - r.top) / r.height) * 2 - 1;
  });
  const dedos = new Map();                  // pinça (tela cheia)
  let pinca = null, cliqueEsperando = 0;
  const fracao = (e) => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
  canvas.addEventListener('pointerdown', (e) => {
    toque = { x: e.clientX, y: e.clientY, ux: e.clientX, uy: e.clientY };
    dedos.set(e.pointerId, [e.clientX, e.clientY]);
    if (zoom.alvo > 1 || cheia) canvas.setPointerCapture?.(e.pointerId);
    if (dedos.size === 2) {
      const [a, b] = [...dedos.values()];
      pinca = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), n: zoom.nivel };
      toque = null;
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dedos.has(e.pointerId)) return;
    dedos.set(e.pointerId, [e.clientX, e.clientY]);
    if (pinca && dedos.size === 2 && modo === 'aberta') {
      const [a, b] = [...dedos.values()];
      const r = canvas.getBoundingClientRect();
      zoomPara(pinca.n * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinca.d, ((a[0] + b[0]) / 2 - r.left) / r.width, ((a[1] + b[1]) / 2 - r.top) / r.height);
      return;
    }
    if (toque && zoom.alvo > 1) {                // ampliada: arrastar passeia pela página
      const r = canvas.getBoundingClientRect();
      zoom.cx -= (e.clientX - toque.ux) / r.width / zoom.nivel;
      zoom.cy -= (e.clientY - toque.uy) / r.height / zoom.nivel;
      toque.ux = e.clientX; toque.uy = e.clientY;
    }
  });
  const soltar = (e) => { dedos.delete(e.pointerId); if (dedos.size < 2) pinca = null; };
  canvas.addEventListener('pointercancel', (e) => { soltar(e); toque = null; });
  canvas.addEventListener('pointerup', (e) => {
    soltar(e);
    if (!toque) return;
    const dx = e.clientX - toque.x, dy = e.clientY - toque.y;
    toque = null;
    const parado = Math.hypot(dx, dy) < 12;
    if (modo === 'fechada') { if (parado) abrirRevista(); return; }
    if (modo !== 'aberta') return;
    if (zoom.alvo > 1) {                         // ampliada: só 2 cliques volta (arrastar foi passear)
      if (!parado) return;
      if (cliqueEsperando) { clearTimeout(cliqueEsperando); cliqueEsperando = 0; zoom.alvo = 1; }
      else cliqueEsperando = setTimeout(() => { cliqueEsperando = 0; }, 300);
      return;
    }
    if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) { passo(dx < 0 ? 1 : -1); return; }   // arrastar = virar
    if (!parado) return;
    const [px, py] = fracao(e);
    if (cliqueEsperando) { clearTimeout(cliqueEsperando); cliqueEsperando = 0; ampliarEm(px, py); return; }   // 2 cliques = ampliar
    cliqueEsperando = setTimeout(() => { cliqueEsperando = 0; passo(px > 0.5 ? 1 : -1); }, 260);            // 1 clique = virar
  });
  canvas.addEventListener('wheel', (e) => {
    if (modo !== 'aberta' || (!cheia && zoom.alvo <= 1)) return;   // fora da tela cheia, a rodinha só ajusta quem já ampliou
    e.preventDefault();
    const [px, py] = fracao(e);
    zoomPara(zoom.nivel * Math.exp(-e.deltaY * 0.0018), px, py);
  }, { passive: false });
  palco.querySelector('.revista-controles').addEventListener('click', (e) => {
    const b = e.target.closest('[data-passo]');
    if (b) passo(Number(b.dataset.passo));
    else if (e.target.closest('[data-zoom]')) { if (modo === 'aberta') ampliarEm(0.5, 0.42); }
    else if (e.target.closest('[data-cheia]')) telaCheia(!cheia);
    else if (e.target.closest('[data-fechar]')) fecharRevista();
  });
  // ← → folheiam e Esc fecha a revista (antes do projetos.js, senão o Esc fecharia o projeto)
  const teclas = (e) => {
    if (cheia && e.key === 'Escape' && zoom.alvo <= 1 && modo !== 'aberta') telaCheia(false);
    else if (modo !== 'aberta') return;
    else if (e.key !== 'Escape' && !(visivel || cheia)) return;   // as setas só valem com ela na tela
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') passo(e.key === 'ArrowRight' ? 1 : -1);
    else if (e.key === 'Escape') { if (zoom.alvo > 1) zoom.alvo = 1; else if (cheia) telaCheia(false); else fecharRevista(); }
    else return;
    e.stopImmediatePropagation();
    e.preventDefault();
  };
  addEventListener('keydown', teclas, true);

  // ---------- tamanho e laço (só roda enquanto aparece na tela) ----------
  function tamanho() {
    const r = palco.getBoundingClientRect();
    if (!r.width) return;
    renderer.setSize(r.width, r.height, false);
    telaW = r.width; telaH = r.height;
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  }
  const obsTamanho = new ResizeObserver(tamanho);
  obsTamanho.observe(palco);
  tamanho();

  let raf = 0, visivel = false, antes = 0;
  function laco(agora) {
    if (!visivel) return;
    const dt = Math.min(0.05, Math.max(0, (agora - (antes || agora)) / 1000));
    antes = agora;
    desenhar(dt);
    raf = requestAnimationFrame(laco);
  }
  // (vale o último aviso: ao ir/voltar da tela cheia chegam dois de uma vez, "sumiu" e "apareceu")
  const obs = new IntersectionObserver((avisos) => {
    const era = visivel;
    visivel = avisos[avisos.length - 1].isIntersecting || cheia;
    if (visivel && !era) { antes = 0; raf = requestAnimationFrame(laco); }
  });
  obs.observe(palco);

  return {
    destruir() {
      obs.disconnect(); obsTamanho.disconnect(); cancelAnimationFrame(raf); visivel = false;
      removeEventListener('keydown', teclas, true);
      clearTimeout(cliqueEsperando);
      if (cheia) { palco.remove(); marcador.remove(); }
      for (const t of [...texturas.values(), ...grandes.values()]) t.tex.dispose();
      for (const l of Object.values(lugares)) { l.gF.dispose(); l.gB.dispose(); l.mF.dispose(); l.mB.dispose(); }
      pilhaDir.geometry.dispose(); pilhaEsq.geometry.dispose(); matPilha.dispose();
      lombada.geometry.dispose(); matLombada.dispose();
      sombra.geometry.dispose(); sombra.material.dispose(); texSombra.dispose();
      renderer.dispose();
    },
  };
}
