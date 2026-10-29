// =====================================================================
//  PLAYER DO VÍDEO COM SOM (Boca Boca — item { video, som: true } no projetos.js)
//  Todos os botões são do site (pedido da Ana: só um diferente ficava estranho): tocar/pausar, tempo,
//  linha pra pular (clicar ou arrastar; ← → pulam 5 s), som e tela cheia.
//  Tela cheia: tenta a de verdade; se o navegador não deixar (no painel do app ela não abre), o vídeo
//  vai pro <body> e cobre a janela. Esc sai (sem fechar o projeto). Clicar no vídeo toca/pausa,
//  2 cliques = tela cheia. A barra some sozinha enquanto toca, e volta mexendo o mouse.
// =====================================================================
const CONFIG_PLAYER = {
  pulo: 5,             // segundos que as setas pulam
  esconderBarra: 2.2,  // segundos parado (tocando) até a barra sumir
};

const svg = (d, extra = '') => `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" ${extra}>${d}</svg>`;
const ICONES = {
  tocar: svg('<path d="M7 4.5v15l12.5-7.5z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>'),
  pausar: svg('<rect x="6" y="4.5" width="4" height="15" rx="1.3" fill="currentColor"/><rect x="14" y="4.5" width="4" height="15" rx="1.3" fill="currentColor"/>'),
  som: svg('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>'),
  mudo: svg('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M16 9.5l5 5M21 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>'),
  cheia: svg('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'),
  sair: svg('<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'),
};
const relogio = (s) => {
  s = Math.max(0, Math.floor(s || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export function montarPlayer(caixa) {
  const P = CONFIG_PLAYER;
  const video = caixa.querySelector('video');
  video.controls = false;
  caixa.insertAdjacentHTML('beforeend', `
    <button type="button" class="player-grande" data-play aria-label="tocar">${ICONES.tocar}</button>
    <div class="player-barra">
      <button type="button" class="pilula player-botao" data-play aria-label="tocar">${ICONES.tocar}</button>
      <span class="player-tempo">0:00 / 0:00</span>
      <div class="player-linha" role="slider" tabindex="0" aria-label="posição do vídeo" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
        <div class="player-carregado"></div><div class="player-feito"></div><div class="player-bolinha"></div>
      </div>
      <button type="button" class="pilula player-botao" data-som aria-label="tirar o som">${ICONES.som}</button>
      <button type="button" class="pilula player-botao" data-cheia aria-label="tela cheia">${ICONES.cheia}</button>
    </div>`);
  const botoesPlay = caixa.querySelectorAll('[data-play]');
  const botaoSom = caixa.querySelector('[data-som]');
  const botaoCheia = caixa.querySelector('[data-cheia]');
  const tempo = caixa.querySelector('.player-tempo');
  const linha = caixa.querySelector('.player-linha');
  const feito = caixa.querySelector('.player-feito');
  const bolinha = caixa.querySelector('.player-bolinha');
  const carregado = caixa.querySelector('.player-carregado');

  // ---------- tocar / pausar ----------
  const alternar = () => (video.paused || video.ended ? video.play().catch(() => {}) : video.pause());
  botoesPlay.forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); alternar(); }));
  function mostrarEstado() {
    const parado = video.paused || video.ended;
    caixa.classList.toggle('tocando', !parado);
    for (const b of botoesPlay) {
      b.innerHTML = parado ? ICONES.tocar : ICONES.pausar;
      b.setAttribute('aria-label', parado ? 'tocar' : 'pausar');
    }
    acordar();
  }
  video.addEventListener('play', mostrarEstado);
  video.addEventListener('pause', mostrarEstado);
  video.addEventListener('ended', mostrarEstado);

  // ---------- clicar no vídeo: 1 clique toca/pausa, 2 cliques = tela cheia ----------
  let esperando = 0, soAcordou = false;
  // com a barra escondida, o 1º toque (celular) só faz a barra voltar
  caixa.addEventListener('pointerdown', () => { soAcordou = caixa.classList.contains('quieto'); }, true);
  video.addEventListener('click', () => {
    if (soAcordou) { soAcordou = false; return; }
    if (esperando) { clearTimeout(esperando); esperando = 0; telaCheia(); return; }
    esperando = setTimeout(() => { esperando = 0; alternar(); }, 230);
  });

  // ---------- tempo e linha ----------
  function mostrarTempo() {
    const dur = video.duration || 0, t = video.currentTime || 0, f = dur ? t / dur : 0;
    tempo.textContent = `${relogio(t)} / ${relogio(dur)}`;
    feito.style.width = `${f * 100}%`;
    bolinha.style.left = `${f * 100}%`;
    linha.setAttribute('aria-valuenow', Math.round(f * 100));
    const b = video.buffered;
    if (dur && b.length) carregado.style.width = `${(b.end(b.length - 1) / dur) * 100}%`;
  }
  ['timeupdate', 'loadedmetadata', 'progress', 'seeked'].forEach((ev) => video.addEventListener(ev, mostrarTempo));
  mostrarTempo();

  let arrastando = false;
  const pularPara = (e) => {
    const r = linha.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    if (video.duration) video.currentTime = f * video.duration;
    mostrarTempo();
  };
  linha.addEventListener('pointerdown', (e) => {
    arrastando = true;
    linha.setPointerCapture(e.pointerId);
    caixa.classList.add('arrastando');
    pularPara(e);
  });
  linha.addEventListener('pointermove', (e) => { if (arrastando) pularPara(e); });
  const soltar = () => { arrastando = false; caixa.classList.remove('arrastando'); };
  linha.addEventListener('pointerup', soltar);
  linha.addEventListener('pointercancel', soltar);
  linha.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    video.currentTime = Math.min(video.duration || 0, Math.max(0, video.currentTime + (e.key === 'ArrowLeft' ? -P.pulo : P.pulo)));
    e.preventDefault();
    e.stopPropagation();
  });

  // ---------- som (se o navegador só deixou tocar mudo, é aqui que liga) ----------
  function mostrarSom() {
    const mudo = video.muted || video.volume === 0;
    botaoSom.innerHTML = mudo ? ICONES.mudo : ICONES.som;
    botaoSom.setAttribute('aria-label', mudo ? 'ligar o som' : 'tirar o som');
    caixa.classList.toggle('mudo', mudo);
  }
  botaoSom.addEventListener('click', (e) => { e.stopPropagation(); video.muted = !video.muted; });
  video.addEventListener('volumechange', mostrarSom);
  mostrarSom();

  // ---------- tela cheia ----------
  const marcador = document.createElement('div');
  let falsa = false;
  const estaCheia = () => falsa || document.fullscreenElement === caixa;
  function mostrarCheia() {
    const c = estaCheia();
    botaoCheia.innerHTML = c ? ICONES.sair : ICONES.cheia;
    botaoCheia.setAttribute('aria-label', c ? 'sair da tela cheia' : 'tela cheia');
    caixa.classList.toggle('em-tela-cheia', c);
  }
  function ligarFalsa() {
    if (estaCheia()) return;
    marcador.style.height = `${caixa.offsetHeight}px`;
    caixa.before(marcador);
    document.body.appendChild(caixa);       // o painel do projeto tem backdrop-filter: "fixed" lá dentro ficaria preso
    falsa = true;
    caixa.classList.add('cheia');
    mostrarCheia();
  }
  function sairFalsa() {
    if (!falsa) return;
    marcador.replaceWith(caixa);
    falsa = false;
    caixa.classList.remove('cheia');
    mostrarCheia();
  }
  function telaCheia(ligar = !estaCheia()) {
    if (!ligar) {
      if (document.fullscreenElement === caixa) document.exitFullscreen().catch(() => {});
      sairFalsa();
      return;
    }
    if (caixa.requestFullscreen && document.fullscreenEnabled) {
      caixa.requestFullscreen().catch(ligarFalsa);
      setTimeout(() => { if (!estaCheia()) ligarFalsa(); }, 500);   // não respondeu (painel do app)
    } else ligarFalsa();
  }
  botaoCheia.addEventListener('click', (e) => { e.stopPropagation(); telaCheia(); });
  document.addEventListener('fullscreenchange', mostrarCheia);
  const teclas = (e) => {
    if (e.key !== 'Escape' || !falsa) return;
    sairFalsa();
    e.stopImmediatePropagation();
  };
  addEventListener('keydown', teclas, true);

  // ---------- a barra some enquanto toca (volta mexendo o mouse / tocando na tela) ----------
  let cochilo = 0;
  function acordar() {
    caixa.classList.remove('quieto');
    clearTimeout(cochilo);
    if (!video.paused && !arrastando) cochilo = setTimeout(() => caixa.classList.add('quieto'), P.esconderBarra * 1000);
  }
  caixa.addEventListener('pointermove', acordar);
  caixa.addEventListener('pointerdown', acordar);
  caixa.addEventListener('focusin', acordar);
  mostrarEstado();

  return {
    destruir() {
      clearTimeout(cochilo); clearTimeout(esperando);
      removeEventListener('keydown', teclas, true);
      document.removeEventListener('fullscreenchange', mostrarCheia);
      if (document.fullscreenElement === caixa) document.exitFullscreen().catch(() => {});
      sairFalsa();
    },
  };
}
