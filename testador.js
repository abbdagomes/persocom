// =====================================================================
//  TESTADOR DA FONTE CYNTH (página do Cynth — item { testador: { fonte } } no projetos.js)
//  Uma janelinha igual às abas da marca: a pessoa digita e vê na Cynth de verdade.
//  Cada letra digitada troca a carinha da barra; o ✕ "fecha" a janela e ela volta em outra cor.
//  Embaixo: cores da marca, tamanho e atalhos (alfabeto, números, acentos).
// =====================================================================

const CONFIG_TESTADOR = {
  textoInicial: 'Cynth',
  // cores da marca (medidas nos vídeos da Ana)
  cores: [
    { nome: 'verde-limão', cor: '#b6fa60' },
    { nome: 'rosa', cor: '#ef4b91' },
    { nome: 'azul', cor: '#1aecca' },
    { nome: 'cinza', cor: '#8385a0' },
  ],
  // carinhas das abas da Ana (só com caracteres que a Cynth tem)
  carinhas: ['(=øwø=)', '(*o*)!', '\\(^-^)/', '~(>∆<)~', '(@°-°@)', 'O(owo)O', 'q(ø-_-ø)p', 'm(∆w∆)m', 'w(Û v Û)w', '\\(^_<)/', '(ˆ* = *ˆ)!', 'o(>< )o', '(=^-^=)'],
  atalhos: [
    { nome: 'Aa', texto: 'abcdefghijklmnopqrstuvwxyz\nABCDEFGHIJKLMNOPQRSTUVWXYZ' },
    { nome: '0–9', texto: '0123456789\n!?@#$%&*+=<>()[]{}' },
    { nome: 'acentos', texto: 'ÀÁÂÃÄÅÆÇÈÉÊË\nàáâãäæçèéêëñõöøœÿ' },
  ],
  tamanho: { min: 24, max: 180, inicial: 96 },   // px (no celular diminui um pouco)
};
const C = CONFIG_TESTADOR;

let fonteCarregada = null;
export function carregarFonte(url) {
  if (!fonteCarregada) {
    const f = new FontFace('Cynth', `url(${url})`);
    fonteCarregada = f.load().then((ok) => { document.fonts.add(ok); return ok; });
  }
  return fonteCarregada;
}

export function montarTestador(raiz, cfg = {}) {
  raiz.innerHTML = `
    <div class="testador-palco">
      <div class="testador-janela" style="--cor:${C.cores[0].cor}">
        <div class="testador-barra">
          <button type="button" class="testador-x" data-fechar aria-label="fechar a janela (ela volta em outra cor)">✕</button>
          <span class="testador-carinha">CYNTH</span>
        </div>
        <textarea class="testador-texto" spellcheck="false" autocapitalize="off" autocomplete="off"
          aria-label="digite pra testar a fonte Cynth">${C.textoInicial}</textarea>
      </div>
    </div>
    <div class="testador-controles">
      <div class="testador-cores" role="radiogroup" aria-label="cor da janela">
        ${C.cores.map((c, i) => `<button type="button" class="testador-cor${i ? '' : ' ativa'}" role="radio" aria-checked="${!i}"
          aria-label="${c.nome}" title="${c.nome}" style="--cor:${c.cor}" data-cor="${i}"></button>`).join('')}
      </div>
      <label class="testador-tamanho" title="tamanho">
        <span aria-hidden="true">a</span>
        <input type="range" min="${C.tamanho.min}" max="${C.tamanho.max}" value="${C.tamanho.inicial}" aria-label="tamanho da letra">
        <span aria-hidden="true" class="grande">A</span>
      </label>
      <div class="testador-atalhos">
        ${C.atalhos.map((a, i) => `<button type="button" class="pilula" data-atalho="${i}">${a.nome}</button>`).join('')}
      </div>
    </div>`;

  const janela = raiz.querySelector('.testador-janela');
  const texto = raiz.querySelector('.testador-texto');
  const carinha = raiz.querySelector('.testador-carinha');
  const barra = raiz.querySelector('input[type=range]');
  let corAtual = 0, carinhaAtual = 0;

  carregarFonte(cfg.fonte).then(ajustarAltura).catch(() => console.warn('não carregou a fonte Cynth'));

  // a caixa cresce com o texto (sem barra de rolagem dentro da janela)
  function ajustarAltura() {
    texto.style.height = 'auto';
    texto.style.height = `${texto.scrollHeight}px`;
  }
  function aplicarTamanho() {
    const celular = innerWidth < 600 ? 0.55 : 1;
    texto.style.fontSize = `${Number(barra.value) * celular}px`;
    ajustarAltura();
  }
  function escolherCor(i) {
    corAtual = (i + C.cores.length) % C.cores.length;
    janela.style.setProperty('--cor', C.cores[corAtual].cor);
    raiz.querySelectorAll('.testador-cor').forEach((b, j) => {
      b.classList.toggle('ativa', j === corAtual);
      b.setAttribute('aria-checked', j === corAtual);
    });
  }
  function proximaCarinha() {
    carinhaAtual = (carinhaAtual + 1) % C.carinhas.length;
    carinha.textContent = C.carinhas[carinhaAtual];
  }

  texto.addEventListener('input', () => { proximaCarinha(); ajustarAltura(); });
  barra.addEventListener('input', aplicarTamanho);
  raiz.querySelector('.testador-cores').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cor]');
    if (b) escolherCor(Number(b.dataset.cor));
  });
  raiz.querySelector('.testador-atalhos').addEventListener('click', (e) => {
    const a = e.target.closest('[data-atalho]');
    if (!a) return;
    texto.value = C.atalhos[Number(a.dataset.atalho)].texto;
    proximaCarinha();
    ajustarAltura();
  });
  // ✕: a janela "fecha" (some encolhendo) e volta na próxima cor
  let timer = null;
  raiz.querySelector('[data-fechar]').addEventListener('click', () => {
    if (janela.classList.contains('fechando')) return;
    janela.classList.add('fechando');
    timer = setTimeout(() => {
      escolherCor(corAtual + 1);
      proximaCarinha();
      janela.classList.remove('fechando');
    }, 260);
  });
  addEventListener('resize', aplicarTamanho);
  aplicarTamanho();

  return {
    destruir() {
      clearTimeout(timer);
      removeEventListener('resize', aplicarTamanho);
    },
  };
}
