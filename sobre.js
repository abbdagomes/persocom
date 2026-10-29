// =====================================================================
//  SOBRE MIM — a Persocom conta quem é a Ana (botão ✦ do lado)
//  Clicou: a tela escurece, um holofote acende em cima dela, a câmera se aproxima e ela "fala" o texto
//  numa caixa de diálogo de jogo, em partes (clique / espaço / Enter passa; Esc ou ✕ fecha).
//  Na última parte aparecem contato, Instagram e currículo. "ler tudo" mostra o texto inteiro de uma vez.
//  O main.js chama montarSobre(...) quando ela termina de carregar.
// =====================================================================
import * as THREE from 'three';

const CONFIG_SOBRE = {
  nome: 'persocom',
  // o texto da Ana, em partes (nenhuma palavra cortada)
  partes: [
    'Olá! ✦',                // no "Olá" ela faz o aceno (a animação de "oi" da Ana)
    'Sou Ana Beatriz (Persocom), designer visual e artista multidisciplinar baseada em São Paulo.',
    'Minha relação com a criação começou na infância através do desenho, sempre com muito incentivo da minha família.',
    'Escolhi o Design em busca de estabilidade e de uma base sólida de fundamentos. Os projetos com clientes me deram '
      + 'disciplina; os pessoais, espaço pra testar.',
    'Foi nesse vai e vem que descobri a modelagem 3D e a arte generativa, que hoje são o meu principal foco.',
    'Atualmente, atuo na intersecção entre arte digital, tecnologia e cultura da internet, desenvolvendo uma pesquisa prática '
      + 'que articula comunicação gráfica, manufatura aditiva 3D, ilustração mista e experiências interativas.',
  ],
  msPorLetra: 22,          // velocidade da digitação
  aproximar: 1.75,         // quanto a câmera se aproxima (1 = nada); no celular 1,35
  som: 0.035,              // volume do "blip" da fala (0 = sem som)
};
const C = CONFIG_SOBRE;

export function montarSobre({ camera, cameraChao, personagem }) {
  const botao = document.querySelector('.botao-sobre');
  if (!botao || !personagem.raiz) return null;
  // os links do fim da conversa = os mesmos do fim da lista de projetos (index.html, <nav class="contatos">)
  const links = [...document.querySelectorAll('[data-contato]')].map((a) => a.outerHTML.replace(' data-contato', '')).join('');

  const ui = document.createElement('div');
  ui.className = 'sobre';
  ui.hidden = true;
  ui.innerHTML = `
    <div class="sobre-escuro"></div>
    <div class="sobre-feixe"></div>
    <div class="sobre-chao"></div>
    <div class="sobre-caixa" role="dialog" aria-label="sobre a Ana Beatriz">
      <span class="sobre-nome">${C.nome}</span>
      <button type="button" class="sobre-fechar" data-fechar aria-label="fechar">✕</button>
      <p class="sobre-texto" aria-live="polite"></p>
      <div class="sobre-links" hidden>${links}</div>
      <div class="sobre-rodape">
        <button type="button" class="sobre-ler" data-ler>ler tudo</button>
        <span class="sobre-pagina"></span>
        <span class="sobre-seta" aria-hidden="true">▸</span>
      </div>
    </div>`;
  document.body.appendChild(ui);
  const caixa = ui.querySelector('.sobre-caixa');
  const texto = ui.querySelector('.sobre-texto');
  const pagina = ui.querySelector('.sobre-pagina');
  const linksEl = ui.querySelector('.sobre-links');

  // ---------- digitação ----------
  let parte = 0, letras = 0, digitando = false, tudo = false, timer = null;
  function mostrarParte(i) {
    parte = i; letras = 0; tudo = false;
    caixa.classList.remove('tudo');
    linksEl.hidden = true;
    pagina.textContent = `${i + 1}/${C.partes.length}`;
    caixa.classList.toggle('ultima', i === C.partes.length - 1);
    if (i === 0) personagem.dizerOi?.();
    digitar();
  }
  function digitar() {
    clearTimeout(timer);
    const alvo = C.partes[parte];
    digitando = letras < alvo.length;
    personagem.falandoAgora = digitando;
    personagem.letraFalando = digitando ? alvo[letras] : null;   // a boca acompanha a letra (main.js)
    caixa.classList.toggle('digitando', digitando);
    texto.textContent = alvo.slice(0, letras);
    if (!digitando) { if (parte === C.partes.length - 1) linksEl.hidden = false; return; }
    letras++;
    if (letras % 3 === 1 && /\S/.test(alvo[letras - 1])) blip();
    const ch = alvo[letras - 1];
    timer = setTimeout(digitar, C.msPorLetra * (/[.,;]/.test(ch) ? 7 : 1));
  }
  function avancar() {
    if (tudo) return;
    if (digitando) { letras = C.partes[parte].length; digitar(); return; }   // termina a frase de uma vez
    if (parte < C.partes.length - 1) mostrarParte(parte + 1);
    else fechar();
  }
  function lerTudo() {
    clearTimeout(timer);
    tudo = true; digitando = false; personagem.falandoAgora = false; personagem.letraFalando = null;
    caixa.classList.remove('digitando'); caixa.classList.add('tudo');
    texto.textContent = C.partes.join(' ');
    pagina.textContent = '';
    linksEl.hidden = false;
  }

  // ---------- "blip" da fala (bem baixinho) ----------
  let audio = null;
  function blip() {
    if (!C.som) return;
    try {
      audio ??= new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime;
      o.type = 'triangle';
      o.frequency.value = 620 + Math.random() * 180;
      g.gain.setValueAtTime(C.som, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      o.connect(g).connect(audio.destination);
      o.start(t); o.stop(t + 0.07);
    } catch { /* sem áudio, tudo bem */ }
  }

  // ---------- câmera se aproximando (um "recorte" igual nas duas câmeras, ela continua no chão) ----------
  const zoom = { z: 1, alvo: 1, cx: 0.5, cy: 0.5, alvoCx: 0.5, alvoCy: 0.5, ligado: false };
  const _v = new THREE.Vector3(), _pes = new THREE.Vector3();
  function telaDe(pontoMundo) {
    // posição na tela SEM zoom (pra mirar a aproximação)
    const view = camera.view?.enabled ? { ...camera.view } : null;
    if (view) camera.clearViewOffset();
    _v.copy(pontoMundo).project(camera);
    if (view) camera.setViewOffset(view.fullWidth, view.fullHeight, view.offsetX, view.offsetY, view.width, view.height);
    return { x: (_v.x + 1) / 2, y: (1 - _v.y) / 2 };
  }
  function aplicarZoom(dt) {
    const k = 1 - Math.exp(-dt * 3.2);
    zoom.z += (zoom.alvo - zoom.z) * k;
    zoom.cx += (zoom.alvoCx - zoom.cx) * k;
    zoom.cy += (zoom.alvoCy - zoom.cy) * k;
    if (zoom.alvo === 1 && Math.abs(zoom.z - 1) < 0.002) {
      zoom.z = 1;
      if (zoom.ligado) { camera.clearViewOffset(); cameraChao?.clearViewOffset(); zoom.ligado = false; }
      return;
    }
    zoom.ligado = true;
    const W = innerWidth, H = innerHeight, w = W / zoom.z, h = H / zoom.z;
    const x = THREE.MathUtils.clamp(zoom.cx * W - w / 2, 0, W - w), y = THREE.MathUtils.clamp(zoom.cy * H - h / 2, 0, H - h);
    camera.setViewOffset(W, H, x, y, w, h);
    cameraChao?.setViewOffset(W, H, x, y, w, h);
  }

  // ---------- holofote: segue ela na tela (com o zoom junto) ----------
  // o tamanho dela de verdade (da sola ao topo da bolha da cabeça): o osso da cabeça fica na BASE da cabeça,
  // e medir por ele deixava o topo da cabeça fora da luz
  let caixa3d = null;     // medida no 1º clique (medir a malha com ossos é pesado; não atrasa o carregamento)
  const _topo = new THREE.Vector3();
  const naTela = (p) => { _v.copy(p).project(camera); return { x: (_v.x + 1) / 2 * innerWidth, y: (1 - _v.y) / 2 * innerHeight }; };
  function posicionarHolofote() {
    caixa3d ??= new THREE.Box3().setFromObject(personagem.raiz);
    personagem.raiz.getWorldPosition(_pes);
    _pes.y = caixa3d.min.y;
    _topo.copy(_pes); _topo.y = caixa3d.max.y;
    const pes = naTela(_pes), topo = naTela(_topo);
    const altura = Math.max(80, pes.y - topo.y);
    ui.style.setProperty('--x', `${(pes.x + topo.x) / 2}px`);
    // o meio da luz um pouquinho acima do meio dela (a cabeça é o que mais importa)
    ui.style.setProperty('--y', `${(topo.y + pes.y) / 2 - altura * 0.05}px`);
    ui.style.setProperty('--pes', `${pes.y}px`);
    ui.style.setProperty('--alt', `${altura}px`);
  }

  // ---------- abrir / fechar ----------
  let aberto = false;
  function abrir() {
    if (aberto || personagem.pintando || personagem.girando) return;
    aberto = true;
    personagem.falando = true;
    scrollTo({ top: 0 });
    document.documentElement.classList.add('travado');
    document.body.classList.add('sobre-aberto');
    ui.hidden = false;
    requestAnimationFrame(() => ui.classList.add('aceso'));
    // mira no peito/rosto dela
    const cab = telaDe(personagem.pontoCabeca);
    personagem.raiz.getWorldPosition(_pes); _pes.y = 0;
    const pes = telaDe(_pes);
    zoom.alvo = innerWidth < 600 ? C.aproximar * 0.77 : C.aproximar;
    zoom.alvoCx = cab.x;
    zoom.alvoCy = cab.y + (pes.y - cab.y) * 0.42;
    setTimeout(() => { if (aberto) mostrarParte(0); }, 650);
  }
  function fechar() {
    if (!aberto) return;
    aberto = false;
    clearTimeout(timer);
    personagem.falando = false;
    personagem.falandoAgora = false;
    personagem.letraFalando = null;
    personagem.oiRestante = 0;
    zoom.alvo = 1; zoom.alvoCx = zoom.alvoCy = 0.5;
    ui.classList.remove('aceso');
    document.body.classList.remove('sobre-aberto');
    document.documentElement.classList.remove('travado');
    setTimeout(() => { if (!aberto) { ui.hidden = true; texto.textContent = ''; } }, 500);
  }
  botao.addEventListener('click', (e) => { e.preventDefault(); abrir(); });
  ui.addEventListener('click', (e) => {
    if (e.target.closest('[data-fechar]')) { fechar(); return; }
    if (e.target.closest('[data-ler]')) { lerTudo(); return; }
    if (e.target.closest('a')) return;          // links do fim
    avancar();
  });
  addEventListener('keydown', (e) => {
    if (!aberto) return;
    if (e.key === 'Escape') { e.stopImmediatePropagation(); fechar(); }
    else if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); avancar(); }
  }, true);

  // ---------- o botão fica logo acima do título "projetos" (que espia no pé da tela, na home) ----------
  botao.hidden = false;
  const topoProjetos = document.querySelector('.projetos-topo');
  function encaixarBotao() {
    const topo = topoProjetos ? topoProjetos.getBoundingClientRect().top + scrollY : innerHeight - 160;
    botao.style.bottom = `${Math.max(16, innerHeight - topo + 14)}px`;
  }
  addEventListener('resize', encaixarBotao);
  new ResizeObserver(encaixarBotao).observe(document.body);
  encaixarBotao();

  return {
    atualizar(dt) {
      if (aberto || zoom.ligado) aplicarZoom(dt);
      if (aberto) posicionarHolofote();
    },
  };
}
