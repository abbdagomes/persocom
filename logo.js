// =====================================================================
//  LOGO MODULAR DO MENU
//  Cabeça em cima e PERSOCOM em linha embaixo. Parado, mostra a sua versão
//  (o SVG "base"). Passando o mouse, o logo SORTEIA combinações novas sem parar:
//  cada caractere embaralha feito código e vira outra letra/símbolo, sem sair
//  do lugar. Tirando o mouse, volta pra sua versão.
//  No celular: cada toque sorteia uma combinação nova.
// =====================================================================

const COR = '#231f20';

const CONFIG_LOGO = {
  // o SVG com as letras "de base" (em linha) e onde ele fica no logo de 190 x 150
  base: { svg: 'logo/asset-16.svg', x: -3, y: 93, largura: 196 },
  linhaY: 122,              // altura da linha dos caracteres sorteados
  linhaDeAte: [14, 178],    // de onde até onde (x) eles se espalham, com espaço igual
  escalaCaracteres: 0.6,    // tamanho geral dos caracteres sorteados

  tempoPorCombinacao: 1500, // ms que cada combinação fica na tela com o mouse em cima
  atrasoEntreLetras: 60,    // ms entre uma letra e a próxima começar a trocar
  quadrosEmbaralhando: 4,   // quantos símbolos aparecem antes de assentar
  velocidadeEmbaralho: 50,  // ms de cada símbolo
  simbolosEmbaralho: '#$%&@01/*?+=<>[]{}',

  // chance de cada casa virar...
  chanceSimboloQualquer: 0.22, // ...um símbolo qualquer (☎ ☃ ♞...)
  chanceSimboloDaLetra: 0.38,  // ...um símbolo parecido com a letra (€ pro E, © pro C...)
  // (o resto: a letra numa fonte sorteada)
  chanceMinuscula: 0.3,        // chance da letra vir minúscula
};

// Fontes das letras (todas do Google Fonts). tam = ajuste pra ficarem com tamanhos parecidos
const FONTES = [
  { f: 'Bungee Outline', tam: 44 },
  { f: 'Bungee', tam: 40 },
  { f: 'Bungee Shade', tam: 40 },
  { f: 'Pinyon Script', tam: 56 },
  { f: 'Rubik Mono One', tam: 32 },
  { f: 'Monoton', tam: 44 },
  { f: 'DM Serif Display', tam: 50 },
  { f: 'Major Mono Display', tam: 38 },
  { f: 'Special Elite', tam: 50 },
  { f: 'Crimson Text', tam: 52 },
  { f: 'UnifrakturMaguntia', tam: 50 },
  { f: 'Silkscreen', tam: 40 },
  { f: 'Codystar', tam: 48 },
  { f: 'VT323', tam: 56 },
  { f: 'Rampart One', tam: 44 },
  { f: 'Syne Mono', tam: 46 },
];

// Fonte dos símbolos (Noto, do Google): aparecem iguais em qualquer aparelho, sem virar emoji
const FONTE_SIMBOLOS = "'Noto Sans Symbols', 'Noto Sans Symbols 2', 'Noto Sans Math', 'Noto Sans', sans-serif";

// Símbolos parecidos com cada letra. Também dá pra usar:
//   { forma: 'anel' | 'pontilhado' | 'ponto' }   { icone: 'public' }   { desenho: 'pCirculo' | 'notas' }
const SIMBOLOS_DA_LETRA = {
  P: ['Ⓟ', '₱', 'Þ', '¶', { desenho: 'pCirculo' }],
  E: ['€', '∃', 'Σ', 'ℰ', 'ξ', 'Ɛ', '♫', '♪', { desenho: 'notas' }],
  R: ['®', 'Я', 'ℝ', 'ℛ', 'ʀ', 'ⓡ'],
  S: ['$', '§', 'Ŝ', '∫', 'ƨ', '⚡', '☡', 'ⓢ'],
  O: ['●', '○', '◐', '◎', '⊙', '☯', '☻', '✪', '❂', '☉', 'Θ', 'Φ', '⌽', '☼', '⚙', '✿',
    { forma: 'anel' }, { forma: 'pontilhado' }, { forma: 'ponto' }, { icone: 'public' }, { icone: 'album' }],
  C: ['©', '☾', '⊂', '¢', 'Ↄ', 'ⓒ', '☽'],
  M: ['Ⓜ', '₥', 'ʍ', '♏', '♍', 'ⓜ'],
};

// Símbolos que podem aparecer em qualquer casa
const SIMBOLOS_QUALQUER = [
  '☎', '☃', '☆', '★', '♞', '♘', '♛', '☠', '✂', '✈', '✉', '✎', '☂', '☀', '☁', '☄', '♠', '♣', '♥', '♦',
  '⌘', '⚛', '⚘', '❇', '✱', '♯', '▦', '☋', '☈', '÷', 'Å', 'ŵ', 'Ẑ', '⊎', '↜', '⇚', '⚑', '⎈', '✇',
  '❖', '❦', '➿', '✺', '✦', '!', '?',
  { icone: 'laptop' }, { icone: 'phone' }, { icone: 'music_note' }, { icone: 'favorite' },
];

// ---------- CABEÇAS ----------
// Cada combinação também sorteia uma cabeça. O desenho é recortado no formato da cabeça
// (logo/cabeca-contorno.svg). "fundo" é um fundo CSS; "rosto" desenha olhos + sorriso por cima.
// Pra criar mais: adicione um item. (px = tamanho no logo normal; o site ajusta sozinho)
const TEXTURA_PERSONAGEM = 'modelo/textura.png';
const CABECAS = [
  // o xadrez com degradê da textura da sua personagem, com rostinho
  { fundo: `url(${TEXTURA_PERSONAGEM}) 47.9% 6.8% / 422% auto`, rosto: 'personagem' },
  { fundo: '#231f20', rosto: 'claro' },
  { fundo: 'repeating-conic-gradient(#231f20 0 25%, #fff 0 50%) 0 0 / {10px} {10px}', rosto: 'xadrez' },
  { fundo: 'repeating-linear-gradient(45deg, #231f20 0 {3px}, #fff {3px} {7px})' },
  { fundo: 'repeating-radial-gradient(circle at 50% 45%, #231f20 0 {2.5px}, #fff {2.5px} {6px})' },
  { fundo: 'linear-gradient(#111, #fff)', rosto: 'escuro' },
  { fundo: 'radial-gradient(circle, #fff 0 {1.6px}, transparent {2px}) 0 0 / {7px} {7px}, #231f20' },
  { fundo: 'linear-gradient(#231f20 {1px}, transparent {1px}) 0 0 / {8px} {8px}, linear-gradient(90deg, #231f20 {1px}, #fff {1px}) 0 0 / {8px} {8px}' },
  { simbolos: true }, // cheia de um símbolo sorteado
  { simbolos: true, rosto: 'escuro' },
];

// desenhos vetoriais. O Ⓟ é lido do asset-13.
const DESENHOS = {
  pCirculo: { tamanho: 78.23, d: '' },
  notas: {
    tamanho: 40,
    d: 'M12,6 L34,1 L34,8 L12,13 Z M12,6 h3.2 v24 h-3.2 Z M30.8,2 h3.2 v23 h-3.2 Z ' +
       'M13.5,30 a6.8,5 -22 1,1 -13.2,4 a6.8,5 -22 1,1 13.2,-4 Z M32.3,25 a6.8,5 -22 1,1 -13.2,4 a6.8,5 -22 1,1 13.2,-4 Z',
  },
};

const LETRAS = ['P', 'E', 'R', 'S', 'O', 'C', 'O', 'M'];

const logo = document.getElementById('logo');
const NS = 'http://www.w3.org/2000/svg';
const sorteia = (lista) => lista[Math.floor(Math.random() * lista.length)];
const semMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;

async function lerSvg(caminho) {
  const texto = await (await fetch(caminho)).text();
  return new DOMParser().parseFromString(texto, 'image/svg+xml').documentElement;
}

// ---------- sorteio ----------
// transforma um item das listas (texto ou objeto) num caractere pronto pra desenhar
function comoSimbolo(item) {
  return typeof item === 'string' ? { t: item, simbolo: true, tam: 36 } : { tam: 40, ...item };
}

function sortearCaractere(letra, atual) {
  for (let tentativa = 0; tentativa < 8; tentativa++) {
    const r = Math.random();
    let c;
    if (r < CONFIG_LOGO.chanceSimboloQualquer) {
      c = comoSimbolo(sorteia(SIMBOLOS_QUALQUER));
    } else if (r < CONFIG_LOGO.chanceSimboloQualquer + CONFIG_LOGO.chanceSimboloDaLetra) {
      c = comoSimbolo(sorteia(SIMBOLOS_DA_LETRA[letra]));
    } else {
      const fonte = sorteia(FONTES);
      const t = Math.random() < CONFIG_LOGO.chanceMinuscula ? letra.toLowerCase() : letra;
      c = { t, f: fonte.f, tam: fonte.tam };
    }
    if (!atual || JSON.stringify(c) !== JSON.stringify(atual)) return c;
  }
  return { t: letra, f: sorteia(FONTES).f, tam: 44 };
}

// ---------- lê as peças do SVG base (uma por letra) ----------
function separarPecas(svgBase, medidor) {
  svgBase.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
  const estilo = svgBase.querySelector('style');
  const grupo = svgBase.querySelector('g') || svgBase;
  // grupos sem posição própria (ex: "C" + "o" agrupados no Illustrator) viram peças separadas
  const soltas = [...grupo.children].flatMap((el) =>
    (el.tagName === 'g' && !el.hasAttribute('transform') && el.children.length > 1 ? [...el.children] : [el]));
  const pecas = soltas.map((el) => {
    const copia = el.cloneNode(true);
    medidor.appendChild(copia);
    const b = copia.getBBox();
    medidor.removeChild(copia);
    return { els: [el], b };
  });
  const centro = (p) => p.b.x + p.b.width / 2;
  const dentro = (p, q) => p !== q && p.b.x >= q.b.x - 0.5 && p.b.y >= q.b.y - 0.5 &&
    p.b.x + p.b.width <= q.b.x + q.b.width + 0.5 && p.b.y + p.b.height <= q.b.y + q.b.height + 0.5;
  // pedacinhos soltos e peças que ficam dentro de outra (ex: o "m" dentro do arquivinho) se juntam
  const anexas = pecas.filter((p) => (p.b.width < 4 && p.b.height < 4) || pecas.some((q) => dentro(p, q)));
  const letras = pecas.filter((p) => !anexas.includes(p)).sort((a, b) => centro(a) - centro(b));
  for (const p of anexas) {
    const dona = letras.find((q) => dentro(p, q)) ||
      letras.reduce((a, b) => (Math.abs(centro(b) - centro(p)) < Math.abs(centro(a) - centro(p)) ? b : a));
    dona.els.push(...p.els);
  }
  return { letras, estilo };
}

// ---------- desenha um caractere dentro de uma casa ----------
function desenhar(casa, e) {
  const alvo = casa.interno;
  alvo.replaceChildren();
  const k = CONFIG_LOGO.escalaCaracteres;
  alvo.setAttribute('transform', `translate(${e.peca ? casa.xBase : casa.xLinha} ${CONFIG_LOGO.linhaY})`);
  casa.atual = e;

  if (e.peca) {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('transform', e.transform);
    e.peca.els.forEach((el) => g.appendChild(el.cloneNode(true)));
    alvo.appendChild(g);
    return;
  }

  let el;
  if (e.forma) {
    el = document.createElementNS(NS, 'circle');
    el.setAttribute('r', (e.forma === 'ponto' ? 9 : 13) * k);
    if (e.forma === 'ponto') {
      el.setAttribute('fill', COR);
    } else {
      el.setAttribute('fill', 'none');
      el.setAttribute('stroke', COR);
      el.setAttribute('stroke-width', (e.forma === 'pontilhado' ? 2.8 : 3.5) * k);
      if (e.forma === 'pontilhado') {
        el.setAttribute('stroke-dasharray', `0.1 ${5.4 * k}`);
        el.setAttribute('stroke-linecap', 'round');
      }
    }
  } else if (e.desenho) {
    const d = DESENHOS[e.desenho];
    el = document.createElementNS(NS, 'path');
    el.setAttribute('d', d.d);
    el.setAttribute('fill', COR);
    el.setAttribute('transform', `scale(${(e.tam * k) / d.tamanho}) translate(${-d.tamanho / 2} ${-d.tamanho / 2})`);
  } else {
    el = document.createElementNS(NS, 'text');
    // \uFE0E pede a versão "texto" do símbolo (preta), nunca a de emoji colorido
    el.textContent = e.icone || (e.simbolo ? e.t + '\uFE0E' : e.t);
    el.setAttribute('font-family', e.icone ? 'Material Icons' : e.simbolo ? FONTE_SIMBOLOS : `'${e.f}', monospace`);
    el.setAttribute('font-size', (e.tam || 38) * k);
    el.setAttribute('text-anchor', 'middle');
    el.setAttribute('dominant-baseline', 'central');
    el.setAttribute('fill', COR);
    if (e.icone) el.style.fontFeatureSettings = "'liga'";
  }
  alvo.appendChild(el);
}

// ---------- cabeça ----------
const cabeca = logo.querySelector('.logo-cabeca');
const cabecaVariante = cabeca.querySelector('.cabeca-variante');
const cabecaRosto = cabeca.querySelector('.cabeca-rosto');
let cabecaAtual = -1; // -1 = a de bolinhas original
let timersCabeca = [];

// troca {10px} por um tamanho que acompanha o tamanho do logo
const tamanhos = (css) => css.replace(/\{([\d.]+)px\}/g, (_, n) => `calc(${n}px * var(--escala))`);

// olhos e sorriso por cima da cabeça (coordenadas da cabeça: 203 x 223)
function desenharRosto(estilo) {
  const cores = {
    claro: { olho: '#fff', brilho: '#231f20', boca: '#fff' },
    escuro: { olho: '#231f20', brilho: '#fff', boca: '#231f20' },
    xadrez: { olho: '#fff', brilho: '#231f20', boca: '#231f20', contorno: '#231f20' },
    personagem: { olho: '#1a1a1a', brilho: '#fff', boca: '#fff', blush: true },
  }[estilo];
  if (!cores) { cabecaRosto.innerHTML = ''; return; }
  const olho = (cx) => `
    <ellipse cx="${cx}" cy="128" rx="15" ry="21" fill="${cores.olho}" ${cores.contorno ? `stroke="${cores.contorno}" stroke-width="3"` : ''}/>
    <circle cx="${cx + 5}" cy="119" r="6" fill="${cores.brilho}"/>
    <ellipse cx="${cx}" cy="143" rx="7" ry="3" fill="${cores.brilho}" opacity=".8"/>`;
  cabecaRosto.innerHTML = `
    ${olho(76)}${olho(127)}
    <path d="M86,172 Q101.5,185 117,172" fill="none" stroke="${cores.boca}" stroke-width="5" stroke-linecap="round"/>
    ${cores.blush ? '<circle cx="62" cy="162" r="10" fill="#fff" opacity=".35"/><circle cx="141" cy="162" r="10" fill="#fff" opacity=".35"/>' : ''}`;
}

function mostrarCabeca(i) {
  cabecaAtual = i;
  if (i < 0) {
    cabeca.classList.remove('variando');
    cabecaRosto.innerHTML = '';
    return;
  }
  const c = CABECAS[i];
  cabeca.classList.add('variando');
  cabecaVariante.innerHTML = '';
  cabecaVariante.style.background = c.fundo ? tamanhos(c.fundo) : '#fff';
  if (c.simbolos) {
    const s = sorteia(SIMBOLOS_QUALQUER.filter((x) => typeof x === 'string'));
    const grade = document.createElement('div');
    grade.className = 'simbolos';
    for (let n = 0; n < 48; n++) {
      const span = document.createElement('span');
      span.textContent = s + '\uFE0E';
      grade.appendChild(span);
    }
    cabecaVariante.appendChild(grade);
  }
  desenharRosto(c.rosto);
}

// embaralha a cabeça rapidinho (como as letras) e assenta na escolhida
function trocarCabeca(destino) {
  timersCabeca.forEach(clearTimeout);
  timersCabeca = [];
  if (semMovimento || destino < 0) { mostrarCabeca(destino); return; }
  const quadros = 3;
  for (let q = 0; q < quadros; q++) {
    timersCabeca.push(setTimeout(() => mostrarCabeca(Math.floor(Math.random() * CABECAS.length)), q * 60));
  }
  timersCabeca.push(setTimeout(() => mostrarCabeca(destino), quadros * 60));
}

function sortearCabeca() {
  let i;
  do { i = Math.floor(Math.random() * CABECAS.length); } while (i === cabecaAtual && CABECAS.length > 1);
  return i;
}

// ---------- monta o logo ----------
let casas = [];
const conjuntoBase = [];

// carrega todas as fontes do logo logo no começo (senão a letra fica em branco na 1ª vez que aparece)
function preCarregarFontes() {
  const todosSimbolos = [...SIMBOLOS_QUALQUER, ...Object.values(SIMBOLOS_DA_LETRA).flat()]
    .filter((s) => typeof s === 'string').join('');
  const icones = [...SIMBOLOS_QUALQUER, ...SIMBOLOS_DA_LETRA.O].filter((s) => s.icone).map((s) => s.icone).join(' ');
  const pedidos = [
    ...FONTES.map((f) => document.fonts.load(`40px "${f.f}"`, 'PERSOCOMpersocom#$%&@01')),
    ...['Noto Sans Symbols', 'Noto Sans Symbols 2', 'Noto Sans Math', 'Noto Sans']
      .map((f) => document.fonts.load(`40px "${f}"`, todosSimbolos)),
    document.fonts.load('40px "Material Icons"', icones),
  ];
  // imagens das cabeças (o recorte e a textura), pra cabeça não sumir na 1ª troca
  ['logo/cabeca-contorno.svg', TEXTURA_PERSONAGEM].forEach((src) => { new Image().src = src; });
  return Promise.allSettled(pedidos);
}
preCarregarFontes();

async function montar() {
  const [svgBase, svgP] = await Promise.all([lerSvg(CONFIG_LOGO.base.svg), lerSvg('logo/asset-13.svg')]);
  DESENHOS.pCirculo.d = svgP.querySelector('path[d^="M78.23,39.11"]').getAttribute('d');

  const caixa = document.createElement('div');
  caixa.className = 'logo-letras ativa';
  caixa.style.left = '0';
  caixa.style.top = '0';
  caixa.style.width = 'calc(190px * var(--escala))';
  logo.appendChild(caixa);

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 190 150');
  caixa.appendChild(svg);

  const medidor = document.createElementNS(NS, 'svg');
  medidor.setAttribute('viewBox', svgBase.getAttribute('viewBox'));
  medidor.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  document.body.appendChild(medidor);
  const { letras, estilo } = separarPecas(svgBase, medidor);
  medidor.remove();
  if (estilo) svg.appendChild(estilo.cloneNode(true));

  const vb = svgBase.getAttribute('viewBox').split(/[\s,]+/).map(Number);
  const B = CONFIG_LOGO.base;
  const esc = B.largura / vb[2];
  const [ini, fim] = CONFIG_LOGO.linhaDeAte;

  casas = letras.map((p, i) => {
    const cx = B.x + (p.b.x + p.b.width / 2) * esc;
    const externo = document.createElementNS(NS, 'g');
    const interno = document.createElementNS(NS, 'g');
    externo.appendChild(interno);
    externo.classList.add('letra');
    externo.style.setProperty('--i', i);
    svg.appendChild(externo);
    conjuntoBase.push({ peca: p, transform: `translate(${B.x - cx} ${B.y - CONFIG_LOGO.linhaY}) scale(${esc})` });
    const casa = {
      interno,
      timers: [],
      letra: LETRAS[i] || 'O',
      xBase: cx,
      xLinha: ini + ((fim - ini) * i) / (letras.length - 1),
    };
    desenhar(casa, conjuntoBase[i]);
    return casa;
  });

  logo.classList.add('pronto');
}

// ---------- embaralho ----------
// (conta pelo relógio: mesmo num computador/celular lento, a letra sempre assenta no tempo certo)
function embaralhar(casa, destino, inicio = performance.now()) {
  const duracao = CONFIG_LOGO.quadrosEmbaralhando * CONFIG_LOGO.velocidadeEmbaralho;
  if (performance.now() - inicio < duracao) {
    desenhar(casa, { t: sorteia([...CONFIG_LOGO.simbolosEmbaralho]), f: sorteia(FONTES).f, tam: 38 });
    casa.timers.push(setTimeout(() => embaralhar(casa, destino, inicio), CONFIG_LOGO.velocidadeEmbaralho));
  } else {
    desenhar(casa, destino);
  }
}

let timerCombinacao = null;

function pararTudo() {
  clearTimeout(timerCombinacao);
  casas.forEach((casa) => {
    casa.timers.forEach(clearTimeout);
    casa.timers = [];
    // se a letra ainda estava embaralhando, assenta no destino antes de começar outra troca
    if (casa.destino && casa.atual !== casa.destino) desenhar(casa, casa.destino);
  });
}

// troca cada letra pro destino dela, uma depois da outra (da esquerda pra direita)
function irPara(destinos) {
  pararTudo();
  casas.forEach((casa, i) => {
    casa.destino = destinos[i];
    if (semMovimento) desenhar(casa, destinos[i]);
    else casa.timers.push(setTimeout(() => embaralhar(casa, destinos[i]), i * CONFIG_LOGO.atrasoEntreLetras));
  });
}

function novaCombinacao() {
  irPara(casas.map((casa) => sortearCaractere(casa.letra, casa.atual)));
  trocarCabeca(sortearCabeca());
}

function voltarPraBase() {
  irPara(conjuntoBase);
  trocarCabeca(-1);
}

// com o mouse em cima: uma combinação nova atrás da outra
function sortearSemParar() {
  novaCombinacao();
  if (!semMovimento) timerCombinacao = setTimeout(sortearSemParar, CONFIG_LOGO.tempoPorCombinacao);
}

const semMouse = () => matchMedia('(hover: none)').matches;

montar().then(() => {
  logo.addEventListener('mouseenter', () => { if (!semMouse()) sortearSemParar(); });
  logo.addEventListener('mouseleave', () => { if (!semMouse()) voltarPraBase(); });

  // no celular: cada toque sorteia uma combinação; depois de 5 s sem tocar, volta pra base
  let voltar = null;
  logo.addEventListener('click', (e) => {
    if (!semMouse()) return;
    e.preventDefault();
    novaCombinacao();
    clearTimeout(voltar);
    voltar = setTimeout(voltarPraBase, 5000);
  });
});
