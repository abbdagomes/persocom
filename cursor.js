// =====================================================================
//  CURSOR + RASTRO DE GLITTER
//  Setinha perolada (vira bolinha em cima de coisas clicáveis) e um rastro
//  de estrelinhas/coraçõezinhos pixelados nas cores do site.
//  Só funciona com mouse (no celular não existe cursor).
// =====================================================================

const CONFIG_CURSOR = {
  // cores do glitter (as das bolhas, em tom pastel) + branco brilhante
  cores: ['#ff8fc4', '#f7a8cf', '#94d3ec', '#8fe0a0', '#c3b1ff', '#ffc98f'],
  chanceBranco: 0.3,          // chance de uma estrelinha sair branca brilhante
  tamanhoPixel: 2,            // tamanho de cada "pixel" do glitter (px)
  distanciaEntreEstrelas: 16, // a cada quantos px de movimento nasce uma estrelinha
  vida: [0.5, 1.0],           // quanto tempo cada uma dura (segundos, sorteado)
  estrelasNoClique: 10,       // estourinho ao clicar
  // o que conta como "clicável" (o cursor vira bolinha)
  clicaveis: 'a, button, .bola, .card, .seta, #logo, [data-clicavel]',
};

const temMouse = matchMedia('(pointer: fine)').matches;

if (temMouse) {
  const C = CONFIG_CURSOR;
  document.documentElement.classList.add('cursor-proprio');

  // ---------- o cursor ----------
  const cursor = document.createElement('div');
  cursor.id = 'cursor';
  cursor.innerHTML = `
    <svg class="cursor-seta" viewBox="0 0 28 28" aria-hidden="true">
      <defs>
        <linearGradient id="perola" x1="0" y1="0" x2=".8" y2="1">
          <stop offset="0" stop-color="#ffffff"/>
          <stop offset=".55" stop-color="#eef0f3"/>
          <stop offset="1" stop-color="#cdd2d9"/>
        </linearGradient>
      </defs>
      <!-- seta reta: borda da esquerda em pé, ponta em cima (onde o clique acontece) -->
      <path d="M4 3 L4 21 L9 16.6 L16.8 16.6 Z"
        fill="url(#perola)" stroke="#c9ced6" stroke-width="1" stroke-linejoin="round"/>
      <path d="M5.5 6.2 L5.5 17.2" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".9"/>
    </svg>
    <div class="cursor-bolinha"></div>`;
  document.body.appendChild(cursor);

  // ---------- o glitter (desenhado num canvas por cima de tudo) ----------
  const tela = document.createElement('canvas');
  tela.id = 'glitter';
  document.body.appendChild(tela);
  const ctx = tela.getContext('2d');
  function ajustarTela() {
    const dpr = Math.min(devicePixelRatio, 2);
    tela.width = innerWidth * dpr;
    tela.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  ajustarTela();
  addEventListener('resize', ajustarTela);

  // desenhos em pixel: # = cor, o = brilho claro, w = branco
  const FORMAS = [
    ['..o..', '..#..', 'o#w#o', '..#..', '..o..'],                                  // estrelinha
    ['...o...', '...#...', '..o#o..', 'o##w##o', '..o#o..', '...#...', '...o...'],  // estrela
    ['.o.', 'o#o', '.o.'],                                                           // pontinho
    ['.##.##.', '#w#####', '#######', '.#####.', '..###..', '...#...'],              // coração
    ['..#..', '.#w#.', '..#..'],                                                     // brilho
  ];
  const PESOS = [5, 3, 4, 1, 3]; // quais aparecem mais (o coração é mais raro)
  const sortearForma = () => {
    let r = Math.random() * PESOS.reduce((a, b) => a + b);
    for (let i = 0; i < FORMAS.length; i++) { r -= PESOS[i]; if (r < 0) return FORMAS[i]; }
    return FORMAS[0];
  };

  const estrelas = [];
  let animando = false;

  function soltarEstrela(x, y, forca = 1) {
    const branca = Math.random() < C.chanceBranco;
    const ang = Math.random() * Math.PI * 2;
    const vel = (10 + Math.random() * 25) * forca;
    estrelas.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 10,
      vx: Math.cos(ang) * vel,
      vy: Math.sin(ang) * vel - 12, // sobem um pouquinho
      forma: sortearForma(),
      cor: branca ? '#ffffff' : C.cores[Math.floor(Math.random() * C.cores.length)],
      branca,
      vida: 0,
      duracao: C.vida[0] + Math.random() * (C.vida[1] - C.vida[0]),
      pisca: Math.random() * Math.PI * 2,
    });
    if (!animando) { animando = true; ultimo = performance.now(); requestAnimationFrame(quadro); }
  }

  function desenharEstrela(e) {
    const t = e.vida / e.duracao;
    // aparece rápido, pisca e vai sumindo
    const alfa = Math.min(1, t * 6) * (1 - t) * (0.75 + 0.25 * Math.sin(e.pisca + e.vida * 18));
    const s = C.tamanhoPixel;
    const linhas = e.forma;
    const x0 = Math.round(e.x - (linhas[0].length * s) / 2);
    const y0 = Math.round(e.y - (linhas.length * s) / 2);
    ctx.globalAlpha = Math.max(0, alfa);
    for (let j = 0; j < linhas.length; j++) {
      for (let i = 0; i < linhas[j].length; i++) {
        const p = linhas[j][i];
        if (p === '.') continue;
        // estrela branca ganha um contorno lilás bem clarinho pra aparecer no fundo branco
        ctx.fillStyle = p === '#' ? e.cor : p === 'w' ? '#ffffff' : (e.branca ? '#e6dcff' : '#fff6fb');
        ctx.fillRect(x0 + i * s, y0 + j * s, s, s);
      }
    }
    ctx.globalAlpha = 1;
  }

  let ultimo = performance.now();
  function quadro(agora) {
    const dt = Math.min((agora - ultimo) / 1000, 0.05);
    ultimo = agora;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = estrelas.length - 1; i >= 0; i--) {
      const e = estrelas[i];
      e.vida += dt;
      if (e.vida >= e.duracao) { estrelas.splice(i, 1); continue; }
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.vx *= 0.94;
      e.vy = e.vy * 0.94 + 6 * dt; // cai de levinho
      desenharEstrela(e);
    }
    if (estrelas.length) requestAnimationFrame(quadro);
    else { animando = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }

  // ---------- segue o mouse ----------
  let px = -100;
  let py = -100;
  let andado = 0;

  addEventListener('pointermove', (ev) => {
    if (ev.pointerType !== 'mouse') return;
    cursor.style.transform = `translate(${ev.clientX}px, ${ev.clientY}px)`;
    cursor.classList.add('visivel');

    // rastro: uma estrelinha a cada X px andados
    andado += Math.hypot(ev.clientX - px, ev.clientY - py);
    px = ev.clientX;
    py = ev.clientY;
    if (andado > 200) andado = 0; // entrou na tela agora: não solta um monte de uma vez
    while (andado >= C.distanciaEntreEstrelas) {
      andado -= C.distanciaEntreEstrelas;
      soltarEstrela(px, py, 0.6);
    }

    const clicavel = ev.target.closest && ev.target.closest(C.clicaveis);
    cursor.classList.toggle('clicavel', !!clicavel || document.body.classList.contains('cursor-clicavel'));
  });

  addEventListener('pointerdown', (ev) => {
    if (ev.pointerType !== 'mouse') return;
    cursor.classList.add('apertado');
    for (let i = 0; i < C.estrelasNoClique; i++) soltarEstrela(ev.clientX, ev.clientY, 2.2);
  });
  addEventListener('pointerup', () => cursor.classList.remove('apertado'));

  // outros arquivos podem pedir um estouro de glitter (ex: o card de projeto estourando)
  window.soltarGlitter = (x, y, quantidade = 12) => {
    for (let i = 0; i < quantidade; i++) soltarEstrela(x, y, 2.6);
  };
  document.documentElement.addEventListener('mouseleave', () => cursor.classList.remove('visivel'));
}
