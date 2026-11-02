// =====================================================================
//  ANTES / DEPOIS (item { comparar: { antes, depois, rotuloAntes, rotuloDepois } } no projetos.js)
//  Duas imagens do mesmo tamanho, uma por cima da outra: arrastar a barrinha mostra mais de uma ou de outra.
//  Quando aparece na tela, a barrinha dá uma passeada sozinha pra pessoa entender que dá pra mexer.
// =====================================================================
const escapar = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const CONFIG_COMPARAR = {
  inicio: 50,                  // onde a barrinha começa (% da largura)
  passeio: [50, 72, 28, 50],   // a passeada de quando aparece
  duracaoPasseio: 2600,        // milissegundos
};

export function montarComparar(raiz, cfg) {
  const C = CONFIG_COMPARAR;
  raiz.innerHTML = `
    <div class="comparar" style="--p:${C.inicio}%">
      <img class="comparar-depois" src="${escapar(cfg.depois)}" alt="${escapar(cfg.rotuloDepois)}" draggable="false">
      <img class="comparar-antes" src="${escapar(cfg.antes)}" alt="${escapar(cfg.rotuloAntes)}" draggable="false">
      <span class="comparar-rotulo esquerda">${escapar(cfg.rotuloAntes)}</span>
      <span class="comparar-rotulo direita">${escapar(cfg.rotuloDepois)}</span>
      <div class="comparar-barra" role="slider" tabindex="0" aria-label="comparar as duas imagens"
        aria-valuemin="0" aria-valuemax="100" aria-valuenow="${C.inicio}"><span></span></div>
    </div>`;
  const caixa = raiz.querySelector('.comparar');
  const barra = caixa.querySelector('.comparar-barra');

  function por(p) {
    p = Math.min(100, Math.max(0, p));
    caixa.style.setProperty('--p', `${p}%`);
    barra.setAttribute('aria-valuenow', Math.round(p));
    return p;
  }
  const pelaTela = (e) => {
    const r = caixa.getBoundingClientRect();
    por(((e.clientX - r.left) / r.width) * 100);
  };

  // ---------- arrastar (em qualquer lugar da imagem) ----------
  let arrastando = false, passeio = 0;
  const pararPasseio = () => { cancelAnimationFrame(passeio); passeio = 0; };
  caixa.addEventListener('pointerdown', (e) => {
    pararPasseio();
    arrastando = true;
    caixa.setPointerCapture(e.pointerId);
    pelaTela(e);
  });
  caixa.addEventListener('pointermove', (e) => { if (arrastando) pelaTela(e); });
  const soltar = () => { arrastando = false; };
  caixa.addEventListener('pointerup', soltar);
  caixa.addEventListener('pointercancel', soltar);
  barra.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    pararPasseio();
    por(Number(barra.getAttribute('aria-valuenow')) + (e.key === 'ArrowLeft' ? -4 : 4));
    e.preventDefault();
    e.stopPropagation();
  });

  // ---------- a passeada de quando aparece (uma vez só) ----------
  const obs = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    obs.disconnect();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t0 = performance.now(), P = C.passeio, trechos = P.length - 1;
    const passo = (agora) => {
      const t = Math.min(1, (agora - t0) / C.duracaoPasseio) * trechos;
      const i = Math.min(trechos - 1, Math.floor(t)), f = t - i;
      por(P[i] + (P[i + 1] - P[i]) * (f * f * (3 - 2 * f)));
      if (t < trechos) passeio = requestAnimationFrame(passo);
    };
    passeio = requestAnimationFrame(passo);
  }, { threshold: 0.6 });
  obs.observe(caixa);

  return { destruir() { obs.disconnect(); pararPasseio(); } };
}
