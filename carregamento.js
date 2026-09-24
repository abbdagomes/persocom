// =====================================================================
//  TELA DE CARREGAMENTO — "pixels carregando"
//  A tela começa coberta de pixels. Conforme o site carrega, eles somem
//  aos poucos (em ordem aleatória) e o site vai aparecendo por baixo.
//  O 3D também começa pixelado e vai ficando nítido (isso fica no main.js).
//  O mesmo efeito é reaproveitado no modo câmera do mosaico (mosaico.js),
//  com criarCarregamento(canvas) — aí ele cobre só o quadro da câmera.
// =====================================================================

const CONFIG_CARREGAMENTO = {
  tamanhoPixel: 22,          // tamanho de cada "pixel" (px). No celular usa 70% disso
  cores: ['#ffffff', '#fbfbfb', '#f5f5f5', '#efefef', '#e9e9e9'], // tons dos pixels
  tempoMinimo: 1600,         // ms: mesmo se carregar rápido, o efeito dura pelo menos isso
  suavidade: 0.06,           // quão rápido o número "alcança" o carregamento real (0 a 1, por quadro a 60 fps)
  texto: 'carregando',
  fonteTexto: "'Silkscreen', 'VT323', monospace",
  corTexto: '#a8a8a8',
  tamanhoTexto: 24,
};
const C = CONFIG_CARREGAMENTO;

// tela = o <canvas> que vai ficar coberto de pixels (ocupa o tamanho do elemento na página)
// opcoes.texto = o que aparece antes da porcentagem ("carregando", "ligando a câmera"...)
export function criarCarregamento(tela, opcoes = {}) {
  const ctx = tela.getContext('2d');
  const texto = opcoes.texto || C.texto;
  const tempoMinimo = opcoes.tempoMinimo ?? C.tempoMinimo;
  let pixels = [];
  let colunas = 0;
  let linhas = 0;
  let tamanho = C.tamanhoPixel;
  let largura = 0, altura = 0;
  let alvo = 0;        // quanto já carregou de verdade (0 a 1)
  let mostrado = 0;    // quanto a tela está mostrando (vai atrás do alvo, suave)
  let terminou = false;
  let acabou = false;
  const inicio = performance.now();
  let ultimoQuadro = inicio;

  function montarGrade() {
    const dpr = Math.min(devicePixelRatio, 2);
    largura = tela.clientWidth || innerWidth;
    altura = tela.clientHeight || innerHeight;
    tela.width = largura * dpr;
    tela.height = altura * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    tamanho = innerWidth < 600 ? Math.round(C.tamanhoPixel * 0.7) : C.tamanhoPixel;
    colunas = Math.ceil(largura / tamanho);
    linhas = Math.ceil(altura / tamanho);
    // cada pixel sorteia em que momento do carregamento ele some
    pixels = Array.from({ length: colunas * linhas }, () => ({
      some: Math.random(),
      cor: C.cores[Math.floor(Math.random() * C.cores.length)],
    }));
  }

  function desenhar() {
    ctx.clearRect(0, 0, largura, altura);
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
      ctx.fillText(`${texto} ${pct}%`, largura / 2, altura / 2);
      ctx.globalAlpha = 1;
    }
  }

  function quadro(agora) {
    if (acabou) return;
    // não deixa passar do tempo mínimo (pra dar tempo de ver o efeito)
    const limiteTempo = (agora - inicio) / tempoMinimo;
    const meta = Math.min(terminou ? 1 : alvo * 0.97, limiteTempo);
    // anda pelo tempo, não por quadro: num computador lento (poucos quadros por segundo) termina no mesmo tempo
    const quadros60 = Math.min((agora - ultimoQuadro) / (1000 / 60), 30);
    ultimoQuadro = agora;
    mostrado += (meta - mostrado) * (1 - Math.pow(1 - C.suavidade, quadros60));
    if (terminou && meta >= 1 && mostrado > 0.995) mostrado = 1;

    desenhar();

    if (mostrado >= 1) {
      acabou = true;
      if (opcoes.aoTerminar) opcoes.aoTerminar(); else tela.remove();
      return;
    }
    requestAnimationFrame(quadro);
  }

  montarGrade();
  const aoRedimensionar = () => { if (!acabou) montarGrade(); };
  addEventListener('resize', aoRedimensionar);
  requestAnimationFrame(quadro);

  return {
    // p = 0 a 1 (quanto já carregou)
    progresso(p) { alvo = Math.max(alvo, Math.min(1, p)); },
    // tudo pronto: os pixels que faltam somem
    pronto() { terminou = true; alvo = 1; },
    // para na hora (ex.: a pessoa saiu antes de terminar)
    cancelar() { acabou = true; removeEventListener('resize', aoRedimensionar); ctx.clearRect(0, 0, largura, altura); },
    // 0 a 1: quanto a tela já foi revelada (o 3D usa pra ficar menos pixelado)
    get revelado() { return mostrado; },
    get ativo() { return !acabou; },
  };
}

// a tela de carregamento do site (cobre tudo quando a página abre)
export const carregamento = criarCarregamento(document.getElementById('carregando'));
