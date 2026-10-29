// =====================================================================
//  CARTELA DE EMOJIS (Emoji Lab — item { cartela: { emojis } } no projetos.js)
//  Todos os emojis da série numa grade de "figurinhas": os animados tocam o loop no próprio quadradinho.
//  Clicando, abre grande (com setas / ← → pra passar; Esc ou clicar fora fecha).
//  cada emoji: { nome, src: 'imagem.webp', video: 'loop.mp4' (opcional), nota: 'texto curto' (opcional),
//               videoInteiro: 'loop sem cortar.mp4' (opcional: aberto grande toca o vídeo no tamanho original) }
// =====================================================================
const escapar = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const midia = (e, classe = '') => (e.video
  ? `<video class="${classe}" src="${escapar(e.video)}" poster="${escapar(e.src)}" autoplay muted loop playsinline disablepictureinpicture disableremoteplayback></video>`
  : `<img class="${classe}" src="${escapar(e.src)}" alt="${escapar(e.nome)}" loading="lazy" draggable="false">`);

export function montarCartela(raiz, cfg) {
  const lista = cfg.emojis || cfg.itens || [];
  const formato = cfg.formato ? ` ${cfg.formato}` : '';   // 'paginas' = páginas deitadas do manual (Boca Boca)
  const comNome = !cfg.semNome;                             // semNome: os emojis não têm nome (pedido da Ana) — o nome fica só pro leitor de tela
  raiz.innerHTML = `<div class="cartela${formato}">${lista.map((e, i) => `
    <button type="button" class="cartela-item" data-i="${i}" aria-label="ver ${escapar(e.nome)} grande">
      ${midia(e)}
      ${e.video ? '<span class="cartela-selo">animado</span>' : ''}
      ${comNome ? `<span class="cartela-nome">${escapar(e.nome)}</span>` : ''}
    </button>`).join('')}</div>`;

  // aberto em tamanho grande
  const zoom = document.createElement('div');
  zoom.className = `mural-zoom cartela-zoom${formato}`;
  zoom.hidden = true;
  zoom.innerHTML = `
    <button class="pilula zoom-fechar" data-fechar aria-label="fechar">✕</button>
    <button class="pilula zoom-seta" data-passo="-1" aria-label="anterior">‹</button>
    <figure class="zoom-quadro"><div class="zoom-midia"></div><figcaption></figcaption></figure>
    <button class="pilula zoom-seta" data-passo="1" aria-label="próximo">›</button>`;
  document.body.appendChild(zoom);
  let atual = -1;
  function abrir(i) {
    atual = (i + lista.length) % lista.length;
    const e = lista[atual];
    // aberto grande: o vídeo no tamanho original (sem o corte quadrado da cartela), se tiver
    zoom.querySelector('.zoom-midia').innerHTML = e.videoInteiro
      ? midia({ ...e, video: e.videoInteiro }, 'cartela-grande inteiro')
      : midia(e, 'cartela-grande');
    zoom.querySelector('figcaption').textContent = [comNome && e.nome, e.nota].filter(Boolean).join(' · ');
    zoom.hidden = false;
  }
  function fechar() { zoom.hidden = true; zoom.querySelector('.zoom-midia').innerHTML = ''; atual = -1; }
  raiz.querySelector('.cartela').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-i]');
    if (b) abrir(Number(b.dataset.i));
  });
  zoom.addEventListener('click', (ev) => {
    const seta = ev.target.closest('[data-passo]');
    if (seta) abrir(atual + Number(seta.dataset.passo));
    else if (ev.target === zoom || ev.target.closest('[data-fechar]')) fechar();
  });
  // pega o teclado antes do projetos.js (senão o Esc fecharia o projeto inteiro)
  const teclas = (ev) => {
    if (zoom.hidden) return;
    if (ev.key === 'Escape') fechar();
    else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') abrir(atual + (ev.key === 'ArrowLeft' ? -1 : 1));
    else return;
    ev.stopImmediatePropagation();
    ev.preventDefault();
  };
  addEventListener('keydown', teclas, true);

  return {
    destruir() {
      removeEventListener('keydown', teclas, true);
      zoom.remove();
    },
  };
}
