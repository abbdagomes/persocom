// =====================================================================
//  CATEGORIAS E PROJETOS
//  Na home: 3 cards de categoria. Clicando, a câmera vira (3D → direita,
//  Ilustração → esquerda, Design → cima) e aparece a "parede" com os projetos.
//  Clicando num projeto, abre o detalhe dele.
//
//  PRA EDITAR O CONTEÚDO: mexa só nas listas CATEGORIAS e PROJETOS abaixo.
// =====================================================================

const CATEGORIAS = {
  ilustracao: {
    nome: 'Ilustração',
    direcao: 'esquerda',       // pra onde a câmera vira
    frase: 'desenhos, personagens e pinturas',
    cores: ['#f7a8cf', '#ffe3f0'],
  },
  design: {
    nome: 'Design gráfico',
    direcao: 'cima',
    frase: 'identidades, posters e editorial',
    cores: ['#8fe0a0', '#e4f9dc'],
    // filtros dentro da categoria (cada projeto de design escolhe um)
    subcategorias: { identidade: 'Identidade', poster: 'Poster', editorial: 'Editorial' },
  },
  '3d': {
    nome: '3D',
    direcao: 'direita',
    frase: 'personagens, cenários e animação',
    cores: ['#94d3ec', '#e0f4fb'],
  },
};

// Cada projeto:
//   id          → nome curto sem espaço (vira o link: seusite.com/#3d/game-jam)
//   categoria   → '3d' | 'ilustracao' | 'design'
//   sub         → só no design: 'identidade' | 'poster' | 'editorial'
//   titulo, resumo, texto → nome, frase curta (no quadradinho) e texto do detalhe
//   capa        → imagem do quadradinho (ex: 'projetos/game-jam/capa.jpg'). Vazio = degradê
//   video       → vídeo curtinho (turntable 360, animação...). Toca no hover e no detalhe
//   imagens     → as imagens que aparecem rolando pra baixo no detalhe, em ordem:
//                 ['projetos/game-jam/1.jpg', 'projetos/game-jam/2.jpg', ...]
//                 ou com opções: { src: '...jpg', legenda: 'texto', meia: true }  (meia = duas lado a lado)
//                 vídeo no meio também vale: 'projetos/game-jam/giro.mp4'
//   link        → botão "ver projeto" (itch.io, Behance...). Vazio = sem botão
//   etiquetas   → palavrinhas que aparecem no detalhe
// ---------- vitrine 3D do Tony Matrimony (vitrine.js) ----------
// personagens: id = nome dos arquivos em projetos/game-jam/3d/ (id.glb, icone-id.webp, rostos/id-expressao.webp)
//   nome e frase aparecem em cima; "expressoes" = quais rostos esse personagem tem (os outros botões só tocam a animação)
// expressoes: a carinha de texto da bolha, o nome (aparece ao passar o mouse) e a cor
// (os personagens ficam em T-pose, parados — pedido da Ana; os .glb têm animações se um dia quiser usar)
const OITO_ROSTOS = ['feliz', 'muito-feliz', 'cute', 'neutra', 'triste', 'brava', 'chocada', 'bebada'];
const VITRINE_GAME_JAM = {
  pasta: 'projetos/game-jam/3d/',
  versao: 3,            // aumentar quando re-exportar os modelos/rostos (senão o navegador mostra os antigos)
  personagens: [
    { id: 'fotografo', nome: 'Tony', frase: 'o fotógrafo do casamento (e o herói do jogo)', expressoes: [] },
    { id: 'noiva', nome: 'a noiva', frase: 'só quer a foto perfeita', expressoes: OITO_ROSTOS },
    { id: 'noivo', nome: 'o noivo', frase: 'nervoso desde o "sim"', expressoes: OITO_ROSTOS },
    { id: 'convidada', nome: 'a convidada', frase: 'de olho no buquê', expressoes: OITO_ROSTOS },
    { id: 'convidado', nome: 'o convidado', frase: 'veio pelo bolo', expressoes: OITO_ROSTOS },
    { id: 'menina', nome: 'a menina', frase: 'daminha oficial', expressoes: ['feliz', 'cute', 'neutra'] },
    { id: 'menino', nome: 'o menino', frase: 'pajem por obrigação', expressoes: ['feliz', 'cute', 'neutra'] },
    { id: 'palhaco', nome: 'o palhaço', frase: 'ninguém sabe quem convidou', expressoes: [] },
  ],
  // cada expressão vira uma bolha com uma carinha de texto; 'cor' = cor da bolha (cores das bolhas do site)
  expressoes: [
    { id: 'feliz', rosto: '^_^', nome: 'feliz', cor: '#ff6fae' },
    { id: 'muito-feliz', rosto: '^o^', nome: 'muito feliz', cor: '#ffae5c' },
    { id: 'cute', rosto: '*^^*', nome: 'fofura', cor: '#f7a8cf' },
    { id: 'neutra', rosto: '·_·', nome: 'sem expressão', cor: '#a88cff' },
    { id: 'triste', rosto: 'T_T', nome: 'triste', cor: '#62cfe6' },
    { id: 'brava', rosto: '>_<', nome: 'bravo', cor: '#ff8a7a' },
    { id: 'chocada', rosto: '°口°', nome: 'chocado', cor: '#7ddf6a' },
    { id: 'bebada', rosto: '@_@', nome: 'bêbado', cor: '#94d3ec' },
  ],
};

const PROJETOS = [
  {
    id: 'game-jam', categoria: '3d', titulo: 'Tony Matrimony', resumo: 'personagens 3D · GMTK Game Jam 2026',
    texto: 'Personagens que criei para Tony Matrimony, jogo feito em equipe na GMTK Game Jam 2026. '
      + 'No jogo você é Tony, um fotógrafo de casamento: com o timer da câmera correndo, precisa posicionar os convidados, '
      + 'ativar objetos e tirar a melhor foto possível. Modelei os 8 personagens em low poly no Blender, com texturas pintadas '
      + 'e rostos trocáveis, que dão a cada personagem várias expressões durante o jogo.',
    capa: 'projetos/game-jam/tony-camera.webp?v=5',
    video: 'projetos/game-jam/turntable.mp4?v=9',
    link: 'https://ayayun.itch.io/tony-matrimony',
    etiquetas: ['gmtk game jam 2026', 'personagens', 'low poly', 'blender', 'textura'],
    imagens: [
      { src: 'projetos/game-jam/lineup.webp?v=7', legenda: 'o elenco completo do casamento' },
      { vitrine: VITRINE_GAME_JAM, legenda: 'o elenco em 3D — arraste pra girar, troque de personagem e estoure as bolhas de expressão' },
      { cenario: { pasta: 'projetos/game-jam/3d/', versao: 1, personagens: [
          { id: 'fotografo', fixo: true }, { id: 'noiva' }, { id: 'noivo' }, { id: 'convidada' },
          { id: 'convidado' }, { id: 'menina' }, { id: 'menino' }, { id: 'palhaco' }] },
        legenda: 'o cenário do jogo em 3D — clique em "explorar" pra girar, mover e dar zoom' },
      // vídeo do jogo: quando chegar, pôr aqui { video: 'projetos/game-jam/gameplay.mp4', legenda: 'gameplay de Tony Matrimony' },
    ],
  },
  {
    id: 'menina-polvo', categoria: '3d', titulo: 'Menina Polvo', resumo: 'estudo de personagem · shader e animação',
    // texto provisório — a Ana vai escrever o texto certinho
    texto: 'Estudo de personagem feito no Blender, focado em shader e animação: um shader toon com luz e sombra '
      + 'pintadas em texturas separadas, contorno, rig no corpo e nos tentáculos e uma animação dela sentando.',
    capa: 'projetos/menina-polvo/capa.webp',
    video: 'projetos/menina-polvo/turntable.mp4',
    link: '',
    etiquetas: ['estudo de personagem', 'shader toon', 'animação', 'rig', 'blender'],
    imagens: [
      { src: 'projetos/menina-polvo/sentada.webp', legenda: 'render final' },
      { modelo3d: { arquivo: 'projetos/menina-polvo/menina-polvo.glb', versao: 2 },
        legenda: 'o modelo em 3D com o shader — gire, arraste o sol pra mudar a luz, veja cada camada do shader e desça a barra pra ver a topologia' },
      { video: 'projetos/menina-polvo/sentada.mp4', legenda: 'animação: ela sentando', centro: true },
    ],
  },
  { id: '3d-3', categoria: '3d', titulo: 'Projeto 3D 3', resumo: 'descrição curta', texto: 'Texto do projeto.', capa: '', video: '', imagens: [], link: '', etiquetas: ['3d'] },
  { id: '3d-4', categoria: '3d', titulo: 'Projeto 3D 4', resumo: 'descrição curta', texto: 'Texto do projeto.', capa: '', video: '', imagens: [], link: '', etiquetas: ['3d'] },

  { id: 'ilus-1', categoria: 'ilustracao', titulo: 'Ilustração 1', resumo: 'descrição curta', texto: 'Texto do projeto.', capa: '', video: '', imagens: [], link: '', etiquetas: ['ilustração'] },
  { id: 'ilus-2', categoria: 'ilustracao', titulo: 'Ilustração 2', resumo: 'descrição curta', texto: 'Texto do projeto.', capa: '', video: '', imagens: [], link: '', etiquetas: ['ilustração'] },
  { id: 'ilus-3', categoria: 'ilustracao', titulo: 'Ilustração 3', resumo: 'descrição curta', texto: 'Texto do projeto.', capa: '', video: '', imagens: [], link: '', etiquetas: ['ilustração'] },
  { id: 'ilus-4', categoria: 'ilustracao', titulo: 'Ilustração 4', resumo: 'descrição curta', texto: 'Texto do projeto.', capa: '', video: '', imagens: [], link: '', etiquetas: ['ilustração'] },

  { id: 'id-1', categoria: 'design', sub: 'identidade', titulo: 'Identidade 1', resumo: 'identidade visual', texto: 'Texto do projeto.', capa: '', video: '', imagens: [], link: '', etiquetas: ['identidade'] },
  { id: 'id-2', categoria: 'design', sub: 'identidade', titulo: 'Identidade 2', resumo: 'identidade visual', texto: 'Texto do projeto.', capa: '', video: '', imagens: [], link: '', etiquetas: ['identidade'] },
  { id: 'poster-1', categoria: 'design', sub: 'poster', titulo: 'Poster 1', resumo: 'poster', texto: 'Texto do projeto.', capa: '', video: '', imagens: [], link: '', etiquetas: ['poster'] },
  { id: 'poster-2', categoria: 'design', sub: 'poster', titulo: 'Poster 2', resumo: 'poster', texto: 'Texto do projeto.', capa: '', video: '', imagens: [], link: '', etiquetas: ['poster'] },
  { id: 'edit-1', categoria: 'design', sub: 'editorial', titulo: 'Editorial 1', resumo: 'editorial', texto: 'Texto do projeto.', capa: '', video: '', imagens: [], link: '', etiquetas: ['editorial'] },
  { id: 'edit-2', categoria: 'design', sub: 'editorial', titulo: 'Editorial 2', resumo: 'editorial', texto: 'Texto do projeto.', capa: '', video: '', imagens: [], link: '', etiquetas: ['editorial'] },
];

const CONFIG_GALERIA = {
  simbolos: '#$%&@01/*?+=<>[]{}', // símbolos do título embaralhando
  velocidadeEmbaralho: 40,
  atrasoParede: 250,               // ms depois que a câmera começa a virar pra parede aparecer
};

// setas de cada direção (a de "voltar" é a oposta)
const SETAS = { direita: '›', esquerda: '‹', cima: '⌃', baixo: '⌄' };
const OPOSTA = { direita: 'esquerda', esquerda: 'direita', cima: 'baixo' };

const semMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;
const escapar = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- título embaralhando feito código ----------
function embaralharTitulo(el) {
  if (semMovimento || !el) return;
  const final = el.dataset.texto;
  clearInterval(el._timer);
  let passo = 0;
  el._timer = setInterval(() => {
    passo += 1;
    el.textContent = [...final].map((ch, i) => {
      if (ch === ' ' || i < passo - 3) return ch;
      const s = CONFIG_GALERIA.simbolos;
      return s[Math.floor(Math.random() * s.length)];
    }).join('');
    if (passo - 3 >= final.length) {
      clearInterval(el._timer);
      el.textContent = final;
    }
  }, CONFIG_GALERIA.velocidadeEmbaralho);
}

// miniatura: capa, vídeo (toca no hover) ou degradê com as cores
function miniatura(p, cores) {
  return `
    <div class="thumb" style="--c1:${cores[0]}; --c2:${cores[1]}">
      ${p.capa ? `<img src="${escapar(p.capa)}" alt="" loading="lazy" draggable="false">` : ''}
      ${p.video ? `<video src="${escapar(p.video)}" muted loop playsinline preload="none"></video>` : ''}
      <span class="thumb-brilho"></span>
    </div>`;
}

// hover (título + vídeo) e clique com estouro, pra qualquer card-bolha
function ligarCard(card, aoClicar) {
  const video = card.querySelector('video');
  card.addEventListener('mouseenter', () => {
    embaralharTitulo(card.querySelector('[data-texto]'));
    if (video) { video.currentTime = 0; video.play().catch(() => {}); }
  });
  card.addEventListener('mouseleave', () => video?.pause());
  card.addEventListener('click', (e) => {
    e.preventDefault();
    if (card.classList.contains('estourando')) return;
    const r = card.getBoundingClientRect();
    card.classList.add('estourando');
    window.soltarGlitter?.(r.left + r.width / 2, r.top + r.height / 2, 18);
    setTimeout(() => {
      aoClicar();
      setTimeout(() => card.classList.remove('estourando'), 400);
    }, 280);
  });
}

// =====================================================================
//  HOME: os 3 cards de categoria (na mesma direção pra onde a câmera vira)
// =====================================================================
const barra = document.getElementById('categorias');
['ilustracao', 'design', '3d'].forEach((id) => {
  const c = CATEGORIAS[id];
  const primeiro = PROJETOS.find((p) => p.categoria === id) || {};
  const card = document.createElement('a');
  card.className = `card card-categoria vai-${c.direcao}`;
  card.href = `#${id}`;
  card.draggable = false;
  card.innerHTML = `
    ${miniatura({ capa: primeiro.capa, video: primeiro.video }, c.cores)}
    <h3><span class="seta-dir">${SETAS[c.direcao]}</span><span data-texto="${escapar(c.nome)}">${escapar(c.nome)}</span></h3>
    <p>${escapar(c.frase)}</p>`;
  ligarCard(card, () => { location.hash = id; });
  barra.appendChild(card);
});

// =====================================================================
//  GALERIA (a "parede" de cada categoria) + DETALHE do projeto
// =====================================================================
const galeria = document.getElementById('galeria');
let categoriaAberta = null;
let filtroAtual = 'tudo';

function montarGrade(id) {
  const c = CATEGORIAS[id];
  const lista = PROJETOS.filter((p) => p.categoria === id && (filtroAtual === 'tudo' || p.sub === filtroAtual));
  const grade = galeria.querySelector('.grade');
  grade.innerHTML = '';
  lista.forEach((p, i) => {
    const q = document.createElement('a');
    q.className = 'card quadradinho';
    q.href = `#${id}/${p.id}`;
    q.draggable = false;
    q.style.setProperty('--i', i);
    q.innerHTML = `
      ${miniatura(p, c.cores)}
      <h3 data-texto="${escapar(p.titulo)}">${escapar(p.titulo)}</h3>
      <p>${escapar(p.resumo)}</p>`;
    ligarCard(q, () => { location.hash = `${id}/${p.id}`; });
    grade.appendChild(q);
  });
  if (!lista.length) grade.innerHTML = '<p class="vazio">nenhum projeto aqui ainda ✦</p>';
  // no próximo quadro, os quadradinhos entram (um depois do outro)
  requestAnimationFrame(() => requestAnimationFrame(() => {
    grade.querySelectorAll('.quadradinho').forEach((q) => q.classList.add('visivel'));
  }));
}

function abrirCategoria(id) {
  const c = CATEGORIAS[id];
  if (categoriaAberta !== id) {
    categoriaAberta = id;
    filtroAtual = 'tudo';
    const filtros = c.subcategorias
      ? `<div class="filtros">
          <button class="filtro ativo" data-filtro="tudo">Tudo</button>
          ${Object.entries(c.subcategorias).map(([k, v]) => `<button class="filtro" data-filtro="${k}">${escapar(v)}</button>`).join('')}
        </div>`
      : '';
    galeria.className = `galeria vem-${c.direcao}`;
    galeria.style.setProperty('--c1', c.cores[0]);
    galeria.style.setProperty('--c2', c.cores[1]);
    galeria.innerHTML = `
      <div class="painel"><div class="painel-rolagem">
        <header class="painel-topo">
          <button class="pilula voltar" data-voltar>${SETAS[OPOSTA[c.direcao]]} voltar</button>
          <div class="painel-titulo">
            <h2 data-texto="${escapar(c.nome)}">${escapar(c.nome)}</h2>
            <p>${escapar(c.frase)}</p>
          </div>
        </header>
        ${filtros}
        <div class="grade"></div>
        <article class="detalhe" hidden></article>
      </div></div>`;
    montarGrade(id);

    galeria.querySelectorAll('.filtro').forEach((b) => b.addEventListener('click', () => {
      filtroAtual = b.dataset.filtro;
      galeria.querySelectorAll('.filtro').forEach((x) => x.classList.toggle('ativo', x === b));
      montarGrade(id);
    }));
    galeria.querySelector('[data-voltar]').addEventListener('click', voltar);

    // a câmera vira e, logo depois, a parede entra
    dispatchEvent(new CustomEvent('virar', { detail: c.direcao }));
    document.body.classList.add('em-galeria');
    document.body.dataset.direcao = c.direcao;
    setTimeout(() => {
      galeria.classList.add('aberta');
      embaralharTitulo(galeria.querySelector('.painel-titulo h2'));
    }, semMovimento ? 0 : CONFIG_GALERIA.atrasoParede);
  }
  fecharDetalhe();
}

let vitrineAtual = null;   // a vitrine 3D aberta (se tiver), pra desligar ao sair
let cenarioAtual = null;   // o cenário 3D do jogo (se tiver)
let modeloAtual = null;    // o visualizador de modelo com a barra de topologia (se tiver)
function desligarVitrine() {
  vitrineAtual?.destruir(); vitrineAtual = null;
  cenarioAtual?.destruir(); cenarioAtual = null;
  modeloAtual?.destruir(); modeloAtual = null;
}

function abrirDetalhe(id, projetoId) {
  const p = PROJETOS.find((x) => x.id === projetoId && x.categoria === id);
  if (!p) return;
  desligarVitrine();
  const c = CATEGORIAS[id];
  const det = galeria.querySelector('.detalhe');

  // cada item da lista "imagens" pode ser só o caminho ('...jpg') ou um objeto:
  //   { src: '...jpg', legenda: 'texto embaixo', meia: true }   (meia = fica lado a lado com outra)
  //   { video: '...mp4', legenda: '...' }                        (vídeo no meio das imagens)
  //   { exemplo: 'texto' }                                        (quadro de exemplo, pra ver o layout)
  //   { src: '...', terco: true }                                 (terco = três lado a lado)
  //   { video: '...', centro: true }                              (sozinho no meio, estreito — bom pra vídeo em pé)
  //   { vitrine: { pasta, personagens, expressoes } }             (personagens em 3D pra girar — vitrine.js)
  //   { cenario: { pasta, personagens } }                          (cenário do jogo em 3D com gente andando — cenario.js)
  //   { modelo3d: { arquivo } }                                    (um modelo pra girar, com a barra material ↕ topologia — modelo3d.js)
  const normalizar = (m) => (typeof m === 'string' ? (/\.(mp4|webm)$/i.test(m) ? { video: m } : { src: m }) : m);
  // o destaque do topo: o vídeo, senão a capa, senão a 1ª imagem
  const lista = (p.imagens || []).map(normalizar);
  const destaque = p.video ? { video: p.video } : p.capa ? { src: p.capa } : lista.shift();

  const midiaHTML = (m, classe = '') => {
    if (!m || m.exemplo) {
      return `<div class="midia-vazia ${classe}" style="--c1:${c.cores[0]}; --c2:${c.cores[1]}"><span>${escapar(m?.exemplo || p.titulo)}</span></div>`;
    }
    if (m.vitrine) return `<div class="vitrine" data-vitrine></div>`;
    if (m.cenario) return `<div class="cenario" data-cenario></div>`;
    if (m.modelo3d) return `<div class="modelo3d" data-modelo3d></div>`;
    if (m.video) return `<video class="${classe}" src="${escapar(m.video)}" autoplay muted loop playsinline controls></video>`;
    return `<img class="${classe}" src="${escapar(m.src)}" alt="${escapar(m.legenda || p.titulo)}" loading="lazy">`;
  };

  // as imagens de baixo, uma embaixo da outra (as "meia" ficam de duas em duas)
  const imagensHTML = lista.map((m) => `
    <figure class="detalhe-imagem${m.meia ? ' meia' : ''}${m.terco ? ' terco' : ''}${m.centro ? ' centro' : ''}${m.vitrine ? ' com-vitrine' : ''}${m.cenario ? ' com-cenario' : ''}${m.modelo3d ? ' com-modelo3d' : ''}">
      ${midiaHTML(m)}
      ${m.legenda ? `<figcaption>${escapar(m.legenda)}</figcaption>` : ''}
    </figure>`).join('');

  det.innerHTML = `
    <button class="pilula voltar-grade" data-voltar-grade>‹ todos os projetos</button>
    <div class="detalhe-corpo">
      <div class="detalhe-midia">${midiaHTML(destaque)}</div>
      <div class="detalhe-info">
        <h2 data-texto="${escapar(p.titulo)}">${escapar(p.titulo)}</h2>
        <div class="etiquetas">
          ${p.sub && c.subcategorias ? `<span class="etiqueta forte">${escapar(c.subcategorias[p.sub])}</span>` : ''}
          ${(p.etiquetas || []).map((e) => `<span class="etiqueta">${escapar(e)}</span>`).join('')}
        </div>
        <p class="detalhe-texto">${escapar(p.texto)}</p>
        ${p.link ? `<a class="pilula ver-projeto" href="${escapar(p.link)}" target="_blank" rel="noopener">ver projeto ↗</a>` : ''}
        ${lista.length ? `<button class="pilula rolar" data-rolar>⌄ ver mais imagens (${lista.length})</button>` : ''}
      </div>
    </div>
    ${lista.length ? `<div class="detalhe-imagens">${imagensHTML}</div>` : ''}
    <div class="detalhe-fim">
      <button class="pilula" data-topo>⌃ voltar pro topo</button>
      <button class="pilula" data-voltar-grade>‹ todos os projetos</button>
    </div>`;

  const lugarVitrine = det.querySelector('[data-vitrine]');
  if (lugarVitrine) {
    const cfgVitrine = lista.find((m) => m.vitrine).vitrine;
    import('./vitrine.js').then(({ montarVitrine }) => {
      if (!lugarVitrine.isConnected) return;          // já saiu do projeto enquanto carregava
      vitrineAtual = montarVitrine(lugarVitrine, cfgVitrine);
    });
  }

  const lugarCenario = det.querySelector('[data-cenario]');
  if (lugarCenario) {
    const cfgCenario = lista.find((m) => m.cenario).cenario;
    import('./cenario.js').then(({ montarCenario }) => {
      if (!lugarCenario.isConnected) return;
      cenarioAtual = montarCenario(lugarCenario, cfgCenario);
    });
  }

  const lugarModelo = det.querySelector('[data-modelo3d]');
  if (lugarModelo) {
    const cfgModelo = lista.find((m) => m.modelo3d).modelo3d;
    import('./modelo3d.js').then(({ montarModelo3d }) => {
      if (!lugarModelo.isConnected) return;
      modeloAtual = montarModelo3d(lugarModelo, cfgModelo);
    });
  }

  const painel = galeria.querySelector('.painel-rolagem');
  det.querySelectorAll('[data-voltar-grade]').forEach((b) => b.addEventListener('click', () => { location.hash = id; }));
  det.querySelector('[data-rolar]')?.addEventListener('click', () => {
    const alvo = det.querySelector('.detalhe-imagens');
    painel.scrollTo({ top: alvo.offsetTop - 20, behavior: semMovimento ? 'auto' : 'smooth' });
  });
  det.querySelector('[data-topo]').addEventListener('click', () => painel.scrollTo({ top: 0, behavior: semMovimento ? 'auto' : 'smooth' }));
  // o botão "voltar pro topo" só aparece se tiver rolagem
  det.querySelector('.detalhe-fim').hidden = !lista.length;

  galeria.querySelector('.grade').hidden = true;
  galeria.querySelector('.filtros')?.setAttribute('hidden', '');
  det.hidden = false;
  galeria.querySelector('.painel-rolagem').scrollTop = 0;
  embaralharTitulo(det.querySelector('h2'));
}

function fecharDetalhe() {
  const det = galeria.querySelector('.detalhe');
  if (!det || det.hidden) return;
  det.hidden = true;
  det.querySelectorAll('video').forEach((v) => v.pause());
  desligarVitrine();
  galeria.querySelector('.grade').hidden = false;
  galeria.querySelector('.filtros')?.removeAttribute('hidden');
}

function fecharCategoria() {
  if (!categoriaAberta) return;
  categoriaAberta = null;
  galeria.classList.remove('aberta');
  galeria.querySelectorAll('video').forEach((v) => v.pause());
  desligarVitrine();
  document.body.classList.remove('em-galeria');
  dispatchEvent(new CustomEvent('virar', { detail: 'frente' }));
}

function voltar() {
  history.pushState('', '', location.pathname + location.search); // tira o #...
  seguirEndereco();
}

// ---------- o endereço (#3d, #3d/game-jam...) decide o que aparece ----------
function seguirEndereco() {
  const [cat, proj] = location.hash.replace('#', '').split('/');
  if (CATEGORIAS[cat]) {
    abrirCategoria(cat);
    if (proj) abrirDetalhe(cat, proj);
  } else {
    fecharCategoria();
  }
}
addEventListener('hashchange', seguirEndereco);
// se alguém abrir o site já com #3d no link, espera a página aparecer e vira
if (location.hash) setTimeout(seguirEndereco, 600);

// Esc: sai do detalhe → sai da galeria
addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || !categoriaAberta) return;
  const det = galeria.querySelector('.detalhe');
  if (det && !det.hidden) location.hash = categoriaAberta;
  else voltar();
});

// clicar no logo volta pra home
document.getElementById('logo')?.addEventListener('click', () => {
  if (categoriaAberta) voltar();
});
