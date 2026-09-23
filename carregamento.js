// =====================================================================
//  TELA DE CARREGAMENTO — "pixels carregando"
//  A tela começa coberta de pixels. Conforme o site carrega, eles somem
//  aos poucos (em ordem aleatória) e o site vai aparecendo por baixo.
//  O 3D também começa pixelado e vai ficando nítido (isso fica no main.js).
// =====================================================================

const CONFIG_CARREGAMENTO = {
  tamanhoPixel: 22,          // tamanho de cada "pixel" (px). No celular usa 70% disso
  cores: ['#ffffff', '#fbfbfb', '#f5f5f5', '#efefef', '#e9e9e9'], // tons dos pixels
  tempoMinimo: 1600,         // ms: mesmo se carregar rápido, o efeito dura pelo menos isso
  suavidade: 0.06,           // quão rápido o número "alcança" o carregamento real (0 a 1)
  texto: 'carregando',
  fonteTexto: "'Silkscreen', 'VT323', monospace",
  corTexto: '#a8a8a8',
  tamanhoTexto: 24,
};

const tela = document.getElementById('carregando');
const ctx = tela.getContext('2d');
const C = CONFIG_CARREGAMENTO;

let pixels = [];
let colunas = 0;
let linhas = 0;
let tamanho = C.tamanhoPixel;
let alvo = 0;        // quanto já carregou de verdade (0 a 1)
let mostrado = 0;    // quanto a tela está mostrando (vai atrás do alvo, suave)
let terminou = false;
let acabou = false;
const inicio = performance.now();

function montarGrade() {
  const dpr = Math.min(devicePixelRatio, 2);
  tela.width = innerWidth * dpr;
  tela.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  tamanho = innerWidth < 600 ? Math.round(C.tamanhoPixel * 0.7) : C.tamanhoPixel;
  colunas = Math.ceil(innerWidth / tamanho);
  linhas = Math.ceil(innerHeight / tamanho);
  // cada pixel sorteia em que momento do carregamento ele some
  pixels = Array.from({ length: colunas * linhas }, () => ({
    some: Math.random(),
    cor: C.cores[Math.floor(Math.random() * C.cores.length)],
  }));
}

function desenhar() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  for (let i = 0; i < pixels.length; i++) {
    const p = pixels[i];
    if (mostrado >= p.some) continue;
    ctx.fillStyle = p.cor;
    ctx.fillRect((i % colunas) * tamanho, Math.floor(i / colunas) * tamanho, tamanho, tamanho);
  }

  // texto + porcentagem (some no finalzinho)
  const opacidade = 1 - Math.min(1, Math.max(0, (mostrado - 0.8) / 0.2));
  if (opacidade > 0) {
    const pct = String(Math.floor(mostrado * 100)).padStart(2, '0');
    ctx.globalAlpha = opacidade;
    ctx.fillStyle = C.corTexto;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${C.tamanhoTexto}px ${C.fonteTexto}`;
    ctx.fillText(`${C.texto} ${pct}%`, innerWidth / 2, innerHeight / 2);
    ctx.globalAlpha = 1;
  }
}

function quadro() {
  // não deixa passar do tempo mínimo (pra dar tempo de ver o efeito)
  const limiteTempo = (performance.now() - inicio) / C.tempoMinimo;
  const meta = Math.min(terminou ? 1 : alvo * 0.97, limiteTempo);
  mostrado += (meta - mostrado) * C.suavidade;
  if (terminou && meta >= 1 && mostrado > 0.995) mostrado = 1;

  desenhar();

  if (mostrado >= 1) {
    acabou = true;
    tela.remove();
    return;
  }
  requestAnimationFrame(quadro);
}

montarGrade();
addEventListener('resize', () => { if (!acabou) montarGrade(); });
requestAnimationFrame(quadro);

export const carregamento = {
  // p = 0 a 1 (quanto já carregou)
  progresso(p) { alvo = Math.max(alvo, Math.min(1, p)); },
  // tudo pronto: os pixels que faltam somem
  pronto() { terminou = true; alvo = 1; },
  // 0 a 1: quanto a tela já foi revelada (o 3D usa pra ficar menos pixelado)
  get revelado() { return mostrado; },
  get ativo() { return !acabou; },
};
