// =====================================================================
//  PASTINHA (Shader GLSL — item { pasta: { nome, itens } } no projetos.js)
//  Uma pasta fechada; clicando, ela abre e as fotos/vídeos do dia saem voando e se espalham pela mesa,
//  meio tortinhos. Clicando numa foto, ela abre grande (o projetos.js escuta o evento "ampliar");
//  com som: true, o vídeo abre grande com som e o player do site.
//  Clicando na pasta de novo, tudo volta pra dentro.
//  cada item: { src: 'foto.webp' } ou { video: 'loop.mp4', poster: 'quadro.webp' } + onde cai na mesa:
//    (os 3 primeiros aparecem pequenininhos espiando de dentro da pasta, pelo poster; emPe: true = vídeo em pé)
//    x, y = deslocamento do centro (em % da largura / da altura da mesa) · r = giro (graus) · w = largura (% da mesa)
//    celular: { x, y, w } = o lugar e o tamanho no celular, onde a mesa é em pé
// =====================================================================
import { tr } from './idioma.js';
const escapar = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function montarPasta(raiz, cfg) {
  const itens = cfg.itens || [];
  raiz.innerHTML = `
    <div class="pasta-mesa">
      ${itens.map((it, i) => `
        <button type="button" class="pasta-item" tabindex="-1" data-i="${i}" aria-label="${tr('ver grande')}"
          style="--x:${it.x}; --y:${it.y}; --r:${it.r}; --w:${it.w}; --i:${i}${it.celular ? `; --cx:${it.celular.x}; --cy:${it.celular.y}; --cw:${it.celular.w}` : ''}">
          ${it.video
            ? `<video src="${escapar(it.video)}"${it.poster ? ` poster="${escapar(it.poster)}"` : ''} muted loop playsinline preload="none" disablepictureinpicture disableremoteplayback></video>`
            : `<img src="${escapar(it.src)}" alt="" loading="lazy" draggable="false">`}
        </button>`).join('')}
      <button type="button" class="pasta" aria-expanded="false" aria-label="${tr('abrir a pasta {x}', { x: escapar(cfg.nome) })}">
        <span class="pasta-tras"></span>
        ${itens.slice(0, 3).map((it, k) => `<span class="pasta-papel papel-${k + 1}${it.emPe ? ' em-pe' : ''}" style="background-image:url('${escapar(it.poster || it.src)}')"></span>`).join('')}
        <span class="pasta-frente"><span class="pasta-nome">${escapar(cfg.nome)}</span></span>
      </button>
      <p class="pasta-dica">${tr('clique na pasta')}</p>
    </div>`;
  const mesa = raiz.querySelector('.pasta-mesa');
  const pasta = mesa.querySelector('.pasta');
  const botoes = [...mesa.querySelectorAll('.pasta-item')];
  const videos = mesa.querySelectorAll('video');
  const dica = mesa.querySelector('.pasta-dica');

  function abrir(sim) {
    mesa.classList.toggle('aberta', sim);
    pasta.setAttribute('aria-expanded', sim);
    pasta.setAttribute('aria-label', tr(sim ? 'guardar a pasta {x}' : 'abrir a pasta {x}', { x: cfg.nome }));
    dica.textContent = sim ? tr('clique pra ver grande · na pasta pra guardar') : tr('clique na pasta');
    botoes.forEach((b) => { b.tabIndex = sim ? 0 : -1; });
    videos.forEach((v) => (sim ? v.play().catch(() => {}) : v.pause()));
  }
  pasta.addEventListener('click', () => abrir(!mesa.classList.contains('aberta')));
  mesa.addEventListener('click', (e) => {
    const b = e.target.closest('.pasta-item');
    if (!b || !mesa.classList.contains('aberta')) return;
    const it = itens[Number(b.dataset.i)];
    raiz.dispatchEvent(new CustomEvent('ampliar', {
      bubbles: true,
      detail: { src: it.grande || it.video || it.src, tipo: it.video ? 'video' : 'img', legenda: it.legenda || '', som: !!it.som, poster: it.poster },
    }));
  });

  return { destruir() { videos.forEach((v) => v.pause()); } };
}
