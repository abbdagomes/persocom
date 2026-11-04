// O papel gigante dos desenhos: uma folha enorme pra arrastar e aproximar, sem 3D (leve no celular).
// Os de lápis ficam direto no papel; os coloridos, como folhas coladas com fita. Clicando, a câmera vai até o desenho.
// A imagem grande só carrega no desenho que está de perto; no celular, o que fica longe da tela sai da memória.
// Celular: tudo em cópias menores (-p) e o que é pesado espera. Abrir o caderno estourava a memória do iPhone (tela branca e recarregava).
import { tr } from './idioma.js';
const NITIDEZ = 1;        // a imagem pequena aguenta até essa ampliação; passou disso, entra a grande
const LARGURA_PEQUENA = 1100;
const LARGURA_PEQUENA_CELULAR = 700;
const GRAO = 460;         // tamanho do quadradinho de grão do papel, em pontos do papel
const MARGEM = 340;       // papel em branco em volta dos desenhos: dá pra centralizar qualquer um deles na tela
const suave = (t) => 1 - Math.pow(1 - t, 3);

// ---------- o caderno fechado que abre e mergulha no papel (toda vez que a pessoa clica no card; pelo link direto, não) ----------
// medidas do desenho do caderno (.claude/ferramentas/montar_caderno.py)
const CAD = { w: 1180, h: 1620, pagX: 627, pagY: 727, pagW: 870, pagH: 1278 };
function abrirCaderno(raiz, pasta, larguraPapel, escalaFinal, toque, aoEntrar) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { aoEntrar(); return; }
  const v = toque ? '-p' : '';
  const cena = document.createElement('div');
  cena.className = 'caderno-cena';
  cena.innerHTML = `
    <div class="caderno">
      <img class="caderno-miolo" src="${pasta}caderno-miolo${v}.webp" alt="" draggable="false">
      <div class="caderno-janela"><img src="${pasta}caderno-visao${v}.webp" alt="" draggable="false"></div>
      <div class="caderno-capa"><img src="${pasta}caderno-capa${v}.webp" alt="" draggable="false"><div class="caderno-verso"></div></div>
    </div>`;
  raiz.appendChild(cena);
  const caderno = cena.querySelector('.caderno');
  const e = Math.min(innerWidth * 0.8 / CAD.w, innerHeight * 0.82 / CAD.h);
  caderno.style.width = `${CAD.w * e}px`;
  // celular: aproxima bem menos e some antes (ampliar demais é o que mais gasta memória); a troca pro papel é no fade
  const zoom = toque ? 1.8 : Math.max(innerWidth / (CAD.pagW * e), innerHeight / (CAD.pagH * e)) * 1.32;
  caderno.style.setProperty('--zoom', zoom);
  // o papel inteiro cabe na página; no fim do zoom, ele está exatamente no tamanho e no lugar do papel de verdade que aparece atrás
  caderno.style.setProperty('--visao', (escalaFinal / zoom) / ((CAD.pagW * e) / larguraPapel));
  caderno.style.setProperty('--ox', `${(CAD.pagX / CAD.w) * 100}%`);
  caderno.style.setProperty('--oy', `${(CAD.pagY / CAD.h) * 100}%`);
  caderno.style.setProperty('--dx', `${(CAD.w / 2 - CAD.pagX) * e}px`);
  caderno.style.setProperty('--dy', `${(CAD.h / 2 - CAD.pagY) * e}px`);
  const esperas = [];
  let entrou = false;
  const entrar = () => { if (!entrou) { entrou = true; aoEntrar(); } };
  const fim = () => { esperas.forEach(clearTimeout); cena.remove(); entrar(); };
  cena.addEventListener('pointerdown', fim);      // tocar pula direto pro papel
  const imagens = [...cena.querySelectorAll('img')].map((i) => i.decode().catch(() => {}));
  const desiste = setTimeout(fim, 4000);          // internet lenta: não fica esperando o caderno
  esperas.push(desiste);
  Promise.all(imagens).then(() => {
    if (!cena.isConnected) return;
    clearTimeout(desiste);
    cena.classList.add('pronta');
    // a capa abre, os desenhos aparecem pequenininhos na página e a câmera entra neles, sem corte
    esperas.push(setTimeout(() => cena.classList.add('abre'), toque ? 450 : 600));
    esperas.push(setTimeout(() => { cena.classList.add('mergulha'); entrar(); }, toque ? 900 : 1050));
    esperas.push(setTimeout(fim, toque ? 1900 : 2800));
  });
}

export function montarPapel(cfg) {
  const largura = cfg.largura + MARGEM * 2, altura = cfg.altura + MARGEM * 2;
  const raiz = document.createElement('section');
  raiz.className = 'papel';
  raiz.setAttribute('aria-label', tr('desenhos'));
  const toque = matchMedia('(pointer: coarse)').matches;
  raiz.innerHTML = `
    <div class="papel-tela"><div class="papel-mundo" style="width:${largura}px; height:${altura}px">
      <img class="papel-marcas" src="${cfg.pasta}marcas${toque ? '-p' : ''}.webp" alt="" draggable="false">
    </div></div>
    <button type="button" class="pilula papel-fechar" aria-label="${tr('fechar')}">✕</button>
    <button type="button" class="pilula papel-passo anterior" data-passo="-1" aria-label="${tr('desenho anterior')}">‹</button>
    <button type="button" class="pilula papel-passo proximo" data-passo="1" aria-label="${tr('próximo desenho')}">›</button>
    <div class="papel-zoom">
      <button type="button" class="pilula" data-zoom="1.4" aria-label="${tr('aproximar')}">+</button>
      <button type="button" class="pilula" data-zoom="0.7" aria-label="${tr('afastar')}">−</button>
    </div>
    <div class="papel-dica">${toque ? tr('arraste pra explorar · toque num desenho') : tr('arraste pra explorar · clique num desenho')}</div>`;
  document.body.appendChild(raiz);
  const tela = raiz.querySelector('.papel-tela');
  const mundo = raiz.querySelector('.papel-mundo');
  const dica = raiz.querySelector('.papel-dica');

  const itens = cfg.itens.map((d, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `papel-item ${d.tipo}`;
    b.style.cssText = `left:${d.x + MARGEM}px; top:${d.y + MARGEM}px; width:${d.w}px; aspect-ratio:${d.a}; --r:${d.r || 0}deg`;
    const img = document.createElement('img');
    img.alt = '';
    img.draggable = false;
    b.appendChild(img);
    mundo.appendChild(b);
    return { d, b, img, x: d.x + MARGEM, y: d.y + MARGEM, alto: d.w / d.a, grande: false };
  });

  // ---------- câmera: um ponto do papel aparece em (ponto × s + x, ponto × s + y) ----------
  const cam = { x: 0, y: 0, s: 1 };
  let vivo = true, raf = 0, parado = 0, olhando = 0, porCima = 0;
  // celular com o caderno: os desenhos só começam a carregar quando ele já está abrindo
  let imagensLigadas = !(toque && cfg.abertura);
  // celular: tudo o que ficou atrás do papel sai da tela, pra liberar memória
  const nomePequena = (d) => `${cfg.pasta}${d.nome}${toque ? '-p' : ''}.webp`;
  const nomeGrande = (d) => `${cfg.pasta}${d.nome}${toque ? '' : '-grande'}.webp`;
  let w = 1, h = 1;
  const escalaMin = () => Math.max(w / largura, h / altura);     // mesmo no mais longe, o papel cobre a tela toda
  const escalaMax = () => Math.max(2.4, escalaMin() * 6);

  function aplicar() {
    // a beira do papel nunca aparece
    cam.x = Math.min(0, Math.max(w - largura * cam.s, cam.x));
    cam.y = Math.min(0, Math.max(h - altura * cam.s, cam.y));
    mundo.style.transform = `translate3d(${cam.x}px, ${cam.y}px, 0) scale(${cam.s})`;
    // celular: repintar o fundo e trocar o will-change a cada movimento fazia a tela piscar; lá o grão só acerta quando para
    if (!toque) {
      acertarGrao();
      mundo.classList.add('mexendo');
    }
    clearTimeout(parado);
    parado = setTimeout(aoParar, 180);
    if (!olhando) olhando = setTimeout(() => { olhando = 0; if (vivo) atualizarImagens(false); }, 200);
  }
  // o grão do papel acompanha a câmera, sem ser uma camada gigante na memória
  function acertarGrao() {
    tela.style.backgroundPosition = `${cam.x}px ${cam.y}px`;
    tela.style.backgroundSize = `${GRAO * cam.s}px`;
  }
  function aoParar() {
    if (!vivo) return;
    if (toque) acertarGrao();
    mundo.classList.remove('mexendo');     // parado, o navegador redesenha na escala certa e fica nítido
    atualizarImagens(true);
  }
  function atualizarImagens(podeGrande) {
    if (!imagensLigadas) return;
    const dpr = Math.min(devicePixelRatio, 2);
    const folga = Math.max(w, h) * (toque ? 0.35 : 0.7);
    const dentro = (it, m) => it.x * cam.s + cam.x < w + m && (it.x + it.d.w) * cam.s + cam.x > -m
      && it.y * cam.s + cam.y < h + m && (it.y + it.alto) * cam.s + cam.y > -m;
    for (const it of itens) {
      const { d } = it;
      if (!dentro(it, folga)) {
        it.b.style.visibility = 'hidden';
        if (toque && it.img.hasAttribute('src')) { it.img.removeAttribute('src'); it.grande = false; }
        continue;
      }
      it.b.style.visibility = '';
      if (!it.img.hasAttribute('src')) it.img.src = nomePequena(d);
      if (!podeGrande && !it.grande) continue;
      const quer = dentro(it, 0) && d.w * cam.s * dpr > (toque ? LARGURA_PEQUENA_CELULAR * 1.2 : LARGURA_PEQUENA * NITIDEZ) * Math.min(1, d.a);
      if (quer === it.grande) continue;
      it.grande = quer;
      if (!quer) { it.img.src = nomePequena(d); continue; }
      const nova = new Image();
      nova.onload = () => { if (vivo && it.grande) it.img.src = nova.src; };
      nova.src = nomeGrande(d);
    }
  }

  function irPara(alvo, duracao = 620) {
    cancelAnimationFrame(raf);
    const de = { ...cam }, t0 = performance.now();
    const passo = (agora) => {
      if (!vivo) return;
      const k = suave(Math.min(1, (agora - t0) / duracao));
      cam.s = de.s * Math.pow(alvo.s / de.s, k);
      // o ponto do papel no meio da tela anda em linha reta enquanto a escala muda
      const cx = (w / 2 - de.x) / de.s + ((w / 2 - alvo.x) / alvo.s - (w / 2 - de.x) / de.s) * k;
      const cy = (h / 2 - de.y) / de.s + ((h / 2 - alvo.y) / alvo.s - (h / 2 - de.y) / de.s) * k;
      cam.x = w / 2 - cx * cam.s;
      cam.y = h / 2 - cy * cam.s;
      aplicar();
      if (k < 1) raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
  }
  function zoomEm(px, py, fator, animado = false) {
    const s = Math.min(escalaMax(), Math.max(escalaMin(), cam.s * fator));
    const alvo = { s, x: px - ((px - cam.x) / cam.s) * s, y: py - ((py - cam.y) / cam.s) * s };
    marcar(null);
    if (animado) irPara(alvo, 320);
    else { Object.assign(cam, alvo); aplicar(); }
  }

  // ---------- ao abrir: no meio do papel, de um jeito que dá pra ver os desenhos e que tem mais pra todo lado ----------
  function vistaInicial() {
    const s = Math.max(escalaMin(), Math.min(0.42, Math.max(w, h) / 2400));
    return { s, x: w / 2 - largura / 2 * s, y: h / 2 - altura / 2 * s };
  }
  function medir() {
    const r = tela.getBoundingClientRect();
    w = r.width || innerWidth; h = r.height || innerHeight;
  }
  medir();
  Object.assign(cam, vistaInicial());
  aplicar();
  addEventListener('resize', aoMudarTela);
  function aoMudarTela() { medir(); aplicar(); }

  // ---------- ver um desenho de perto ----------
  let focado = null, vistaAntes = null;
  // a ordem de passar: de cima pra baixo, da esquerda pra direita, por faixas do papel
  const ordem = [...itens].sort((a, b) => Math.floor(a.y / 1100) - Math.floor(b.y / 1100) || a.x - b.x);
  function marcar(it) {
    focado?.b.classList.remove('em-foco');
    focado = it;
    it?.b.classList.add('em-foco');
    raiz.classList.toggle('focado', !!it);
  }
  function passar(n) {
    if (focado) focar(ordem[(ordem.indexOf(focado) + n + ordem.length) % ordem.length]);
  }
  function focar(it) {
    if (focado === it) { desfocar(); return; }
    if (!focado) vistaAntes = { ...cam };
    marcar(it);
    some();
    const r = it.alto;
    const s = Math.min(escalaMax(), Math.min((w * 0.92) / it.d.w, (h * 0.9) / r));
    irPara({ s, x: w / 2 - (it.x + it.d.w / 2) * s, y: h / 2 - (it.y + r / 2) * s });
  }
  function desfocar() {
    if (!focado) return false;
    marcar(null);
    irPara(vistaAntes);
    return true;
  }

  // ---------- arrastar, pinça e clique ----------
  const dedos = new Map();
  let inicio = null, moveu = false, deslize = false, pinca = 0, vx = 0, vy = 0, ultimo = 0;
  function some() { dica.classList.add('sumir'); }

  tela.addEventListener('pointerdown', (e) => {
    cancelAnimationFrame(raf);
    tela.setPointerCapture(e.pointerId);
    dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (dedos.size === 1) {
      inicio = { x: e.clientX, y: e.clientY, alvo: e.target.closest('.papel-item') };
      moveu = false; deslize = false; vx = vy = 0; ultimo = e.timeStamp;
    } else {
      moveu = true;
      deslize = false;
      pinca = 0;
    }
    e.preventDefault();
  });
  tela.addEventListener('pointermove', (e) => {
    const dedo = dedos.get(e.pointerId);
    if (!dedo) return;
    const dx = e.clientX - dedo.x, dy = e.clientY - dedo.y;
    dedo.x = e.clientX; dedo.y = e.clientY;
    if (dedos.size === 2) {
      const [a, b] = [...dedos.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinca) zoomEm((a.x + b.x) / 2, (a.y + b.y) / 2, dist / pinca);
      pinca = dist;
      some();
      return;
    }
    if (deslize) return;
    if (!moveu && Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y) < 7) return;
    // com um desenho aberto no celular, deslizar pro lado passa pro próximo; pra cima e pra baixo passeia pelo papel
    if (!moveu && focado && e.pointerType === 'touch'
      && Math.abs(e.clientX - inicio.x) > Math.abs(e.clientY - inicio.y) * 1.3) { moveu = true; deslize = true; return; }
    if (!moveu) { moveu = true; marcar(null); some(); mundo.classList.add('arrastando'); }
    cam.x += dx; cam.y += dy;
    const dt = Math.max(1, e.timeStamp - ultimo);
    vx = dx / dt; vy = dy / dt; ultimo = e.timeStamp;
    aplicar();
  });
  const soltar = (e) => {
    if (!dedos.delete(e.pointerId)) return;
    pinca = 0;
    if (dedos.size) return;
    mundo.classList.remove('arrastando');
    if (deslize) {
      deslize = false;
      const dx = e.clientX - inicio.x, dy = e.clientY - inicio.y;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) passar(dx < 0 ? 1 : -1);
      return;
    }
    if (!moveu) {
      some();
      if (inicio?.alvo) focar(itens.find((it) => it.b === inicio.alvo));
      else desfocar();
      return;
    }
    if (e.timeStamp - ultimo < 60) inercia();
  };
  tela.addEventListener('pointerup', soltar);
  tela.addEventListener('pointercancel', soltar);
  function inercia() {
    let antes = performance.now();
    const passo = (agora) => {
      if (!vivo) return;
      const dt = Math.min(32, agora - antes); antes = agora;
      cam.x += vx * dt; cam.y += vy * dt;
      const atrito = Math.pow(0.994, dt);
      vx *= atrito; vy *= atrito;
      aplicar();
      if (Math.hypot(vx, vy) > 0.02) raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
  }
  // roda do mouse e pinça do trackpad aproximam; dois dedos no trackpad passeiam
  tela.addEventListener('wheel', (e) => {
    e.preventDefault();
    cancelAnimationFrame(raf);
    some();
    const roda = e.ctrlKey || (e.deltaX === 0 && Math.abs(e.deltaY) >= 40);
    if (roda) zoomEm(e.clientX, e.clientY, Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0016)));
    else { marcar(null); cam.x -= e.deltaX; cam.y -= e.deltaY; aplicar(); }
  }, { passive: false });

  // teclado: Enter abre o desenho (o clique do mouse já foi tratado no pointerup)
  itens.forEach((it) => it.b.addEventListener('click', (e) => { if (e.detail === 0) focar(it); }));
  raiz.querySelector('.papel-fechar').addEventListener('click', () => cfg.aoFechar());
  raiz.querySelectorAll('[data-passo]').forEach((b) => b.addEventListener('click', () => passar(Number(b.dataset.passo))));
  raiz.querySelectorAll('[data-zoom]').forEach((b) => b.addEventListener('click', () => {
    some();
    zoomEm(w / 2, h / 2, Number(b.dataset.zoom), true);
  }));
  // Esc: primeiro volta do desenho aberto; o segundo fecha o papel (o projetos.js cuida disso)
  const aoTeclar = (e) => {
    if (e.key === 'Escape' && desfocar()) e.stopImmediatePropagation();
    if (focado && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { passar(e.key === 'ArrowLeft' ? -1 : 1); e.preventDefault(); }
  };
  addEventListener('keydown', aoTeclar, true);

  requestAnimationFrame(() => raiz.classList.add('aberto'));
  porCima = setTimeout(() => document.body.classList.add('papel-por-cima'), 450);
  if (cfg.abertura) {
    abrirCaderno(raiz, cfg.pasta, largura, cam.s, toque, () => {
      imagensLigadas = true;
      if (vivo) atualizarImagens(true);
    });
  }

  return {
    destruir() {
      vivo = false;
      cancelAnimationFrame(raf);
      clearTimeout(parado);
      clearTimeout(porCima);
      document.body.classList.remove('papel-por-cima');
      removeEventListener('resize', aoMudarTela);
      removeEventListener('keydown', aoTeclar, true);
      raiz.remove();
    },
  };
}
