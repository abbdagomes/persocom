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
    frase: 'mural de desenhos e experimentos',
    cores: ['#f7a8cf', '#ffe3f0'],
    mural: true,               // em vez da grade de quadradinhos, mostra o mural (projetos dessa categoria + DESENHOS)
  },
  design: {
    nome: 'Design gráfico',
    direcao: 'cima',
    frase: 'identidade, tipografia, editorial e web',
    cores: ['#8fe0a0', '#e4f9dc'],
  },
  '3d': {
    nome: '3D',
    direcao: 'direita',
    frase: 'personagens, impressão 3D, shaders e animação',
    cores: ['#94d3ec', '#e0f4fb'],
  },
};

// ---------- MURAL de desenhos (parede da Ilustração) ----------
// cada desenho: { src: 'projetos/ilustracao/nome.webp', titulo: 'nome do desenho', ano: '2025' }
// cada um aparece no formato dele; clicando, abre grande (com setas pra passar).
// Enquanto não tem imagem: { exemplo: 'texto', proporcao: '3 / 4' } mostra um quadro em degradê daquele formato.
const DESENHOS = [
  { exemplo: 'desenho 1', proporcao: '3 / 4' },
  { exemplo: 'desenho 2', proporcao: '1 / 1' },
  { exemplo: 'desenho 3', proporcao: '4 / 5' },
  { exemplo: 'desenho 4', proporcao: '4 / 3' },
  { exemplo: 'desenho 5', proporcao: '2 / 3' },
  { exemplo: 'desenho 6', proporcao: '1 / 1' },
  { exemplo: 'desenho 7', proporcao: '3 / 4' },
  { exemplo: 'desenho 8', proporcao: '5 / 4' },
];

// Cada projeto:
//   id          → nome curto sem espaço (vira o link: seusite.com/#3d/game-jam)
//   categoria   → '3d' | 'ilustracao' | 'design'
//   titulo, resumo, texto → nome, frase curta (no quadradinho) e texto do detalhe
//   destaque    → true = card duplo e primeiro da parede (os projetos "grandes" da tabela do Miro)
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
  // ---------------- 3D ----------------
  {
    id: 'boneca-lovecore', categoria: '3d', destaque: true, titulo: 'Boneca 1,80 m', resumo: 'escultura 3D impressa · Lovecore 7',
    texto: 'O projeto consistiu na criação e materialização de uma escultura física de 1,80 m, desenvolvida digitalmente em 3D '
      + 'e fabricada via impressão em grande escala para a Lovecore 7. O fluxo de trabalho envolveu desde a modelagem e '
      + 'subdivisão estrutural das peças para viabilizar o fatiamento e a impressão, até o pós-processamento, montagem, '
      + 'reforço interno e acabamento superficial. A peça foi projetada para garantir presença de palco e impacto cenográfico '
      + 'imersivo na Lovecore, evento realizado pelo coletivo REBU DIGITAL que reuniu nesta edição a atração internacional '
      + 'somewherespecial. Consolidada como um dos principais pólos da vanguarda underground de São Paulo, a festa atua como '
      + 'uma plataforma multidisciplinar que reúne mais de 500 pessoas por edição, articulando música eletrônica experimental, '
      + 'moda, cultura da internet e artes visuais com curadoria de artistas nacionais e internacionais.',
    capa: '', video: '', link: '',
    etiquetas: ['impressão 3d', 'escultura', 'cenografia', 'lovecore 7', 'rebu digital'],
    imagens: [],
  },
  {
    id: 'shader-glsl', categoria: '3d', destaque: true, titulo: 'Shader GLSL', resumo: 'instalação interativa · TouchDesigner',
    texto: 'O projeto consistiu em uma instalação visual e interativa desenvolvida em TouchDesigner com shaders GLSL '
      + 'customizados, gerando um grid de imagens dinâmico e responsivo em tempo real. A aplicação explorou a intersecção '
      + 'entre código criativo, performance gráfica e arte generativa, permitindo que o público interagisse diretamente com '
      + 'os parâmetros visuais no espaço. O trabalho foi exibido como parte da cenografia interativa da Lovecore 6, integrando '
      + 'a atmosfera sonora e visual da noite que teve como atrações internacionais o produtor Dinamarca (cofundador da label '
      + 'Staycore) e o trio mexicano de neo-perreo gótico METH MATH. Realizado pelo coletivo REBU DIGITAL, o evento é um dos '
      + 'maiores pólos da vanguarda underground paulistana, atraindo mais de 500 pessoas por edição ao fundir música de clube '
      + 'desconstruída, artes visuais, moda e estética da internet.',
    capa: 'projetos/shader-glsl/capa.webp',
    video: 'projetos/shader-glsl/instalacao.mp4',
    link: '',
    etiquetas: ['touchdesigner', 'glsl', 'mediapipe', 'interativo', 'lovecore 6'],
    imagens: [
      { mosaico: {
          // cada conjunto = uma pasta de fotos (feito com .claude/ferramentas/atlas_mosaico.py)
          conjuntos: [
            // nome = aparece ao passar o mouse no botão · icone = imagem cinza (cabeça da menina da home / emoji)
            { nome: 'anime shader', icone: 'projetos/shader-glsl/icone-anime.webp',
              atlas: 'projetos/shader-glsl/garotas.webp', dados: 'projetos/shader-glsl/garotas.json' },
            // emojis da Apple (pacote emoji-datasource-apple 16.0.0) — 400 dos 3783, os de cores mais variadas
            { nome: 'emoji shader', icone: 'projetos/shader-glsl/icone-emoji.webp',
              atlas: 'projetos/shader-glsl/emojis.webp', dados: 'projetos/shader-glsl/emojis.json' },
          ],
        },
        legenda: 'teste você: ligue a câmera e faça pinça com a mão — abrindo, os quadrados crescem; fechando, diminuem' },
    ],
  },
  {
    id: 'game-jam', categoria: '3d', titulo: 'Tony Matrimony', resumo: 'personagens 3D · GMTK Game Jam 2026',
    texto: 'Durante a GMTK Game Jam 2026, uma das maiores maratonas globais de desenvolvimento de jogos independentes, '
      + 'com mais de 10.000 projetos submetidos, assumi a produção completa de 8 personagens 3D em apenas 4 dias para o jogo '
      + 'Tony Matrimony. O curto prazo do evento exigiu a estruturação de um pipeline extremamente ágil, focado em blocagem '
      + 'rápida de volumes com o objetivo central de manter a consistência estilística e a identidade visual de todo o elenco. '
      + 'Além do desafio artístico, cada modelo foi desenvolvido com foco rigoroso em otimização para a engine, utilizando '
      + 'topologia limpa, texturas eficientes e rigs simplificados para garantir integração imediata sem perda de desempenho. '
      + 'Essa rapidez técnica aliada à coesão visual foi determinante para o destaque do jogo na competição, conquistando o '
      + '94º lugar na categoria de Arte entre os milhares de participantes.',
    capa: 'projetos/game-jam/tony-camera.webp?v=5',
    video: 'projetos/game-jam/turntable.mp4?v=9',
    link: 'https://ayayun.itch.io/tony-matrimony',
    etiquetas: ['gmtk game jam 2026', '94º em arte', 'personagens', 'low poly', 'blender'],
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
    texto: 'Projeto pessoal de exploração técnica e artística focado em transpor a expressividade do desenho tradicional '
      + 'para o ambiente tridimensional. O desenvolvimento envolveu a modelagem completa do personagem, criação de shaders '
      + 'estilizados (estética toon shading) para simular traços e volumes de ilustração 2D, culminando em uma animação '
      + 'pensada para manter a fluidez e o charme visual da estética de desenho animado.',
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
  {
    id: 'garotas-3d', categoria: '3d', titulo: 'Garotas 3D', resumo: 'composições e animações · depth maps',
    texto: 'Conjunto de composições e animações experimentais com 4 modelos 3D autorais, concebido a partir de um processo de '
      + 'desconstrução da estética digital padrão. Ao longo do desenvolvimento, a busca por uma identidade mais autêntica e '
      + 'expressiva levou ao uso experimental de mapas de profundidade (depth maps) aplicados diretamente como texturas. '
      + 'O resultado é uma série vibrante, gráfica e lúdica que subverte o acabamento tradicional do 3D em favor de uma '
      + 'linguagem visual contemporânea e colorida.',
    capa: '', video: '', link: '',
    etiquetas: ['personagens', 'animação', 'depth maps', 'experimental'],
    imagens: [],
  },
  // caixa Nike x MAD: entra quando tiver texto e imagens

  // ---------------- DESIGN GRÁFICO ----------------
  {
    id: 'ama', categoria: 'design', titulo: 'AMA', resumo: 'identidade · redesign de marca',
    texto: 'Redesign de marca desenvolvido colaborativamente para a ONG AMA. O novo conceito traduz empatia e suporte através '
      + 'de um logotipo tipográfico integrado, em que as letras formam duas pessoas conectadas. O projeto estabeleceu um guia '
      + 'de marca completo, incluindo padronização cromática, sistema gráfico modular e desdobramento em múltiplos pontos de '
      + 'contato: editorial, uniformes, frota de veículos e campanhas institucionais.',
    capa: '', video: '', link: '',
    etiquetas: ['identidade', 'logotipo', 'guia de marca'],
    imagens: [],
  },
  {
    id: 'sinapse', categoria: 'design', titulo: 'Sinapse', resumo: 'web · identidade',
    texto: 'Projeto colaborativo de web design e identidade visual focado na vivência dos sentidos na rotina de São Paulo. '
      + 'A plataforma utiliza sobreposições de imagens, filtros visuais dedicados para cada sentido e interações lúdicas que '
      + 'refletem o dinamismo caótico da cidade. O escopo abrangeu desde a conceituação e criação do logotipo (com destaque às '
      + 'iniciais de SP) até a arquitetura da experiência web, cartazes de divulgação e desdobramentos em produtos.',
    capa: '', video: '', link: '',
    etiquetas: ['web', 'identidade', 'cartazes'],
    imagens: [],
  },
  {
    id: 'cynth', categoria: 'design', titulo: 'Cynth', resumo: 'tipografia · fonte display',
    texto: 'Projeto de tipografia desenvolvido em dupla, nascido da pesquisa e experimentação formal com contrastes de peso e '
      + 'geometria. A Cynth é uma fonte display com proporções expandidas e forte presença visual, marcada pelo desenho '
      + 'característico de suas contraformas internas em formato de gotas (simples e elongadas). O resultado é uma família '
      + 'tipográfica completa, contemplando caixa alta, caixa baixa, numerais, acentuação, pontuação e conjunto abrangente de símbolos.',
    capa: '', video: '', link: '',
    etiquetas: ['tipografia', 'fonte display'],
    imagens: [],
  },
  {
    id: 'revista-espm', categoria: 'design', titulo: 'Revista ESPM', resumo: 'editorial · identidade',
    texto: 'Criação da identidade visual, conceito editorial e projeto gráfico para a primeira edição de uma revista focada em '
      + 'mapear e valorizar restaurantes de imigrantes em São Paulo. Com o continente latino-americano como tema inaugural, '
      + 'o projeto foi construído colaborativamente em equipe, unindo diagramação, pesquisa cultural e um vídeo para '
      + 'apresentação da marca e da publicação.',
    capa: '', video: '', link: '',
    etiquetas: ['editorial', 'diagramação', 'identidade'],
    imagens: [],
  },
  {
    id: 'kitkat', categoria: 'design', titulo: 'KitKat Sugar Rush', resumo: 'embalagem · identidade',
    texto: 'KitKat Sugar Rush é uma linha conceitual criada para trazer uma experiência Value Up ao varejo, com identidade visual '
      + 'pensada estrategicamente para a Geração Z. O projeto explora o conceito do sugar rush (aquele impulso por uma sobremesa '
      + 'indulgente no pós-almoço). A identidade une texturas de retícula (halftone), anéis gráficos vibrantes e fotografias '
      + 'reais de alta definição das sobremesas, garantindo forte apelo sensorial no ponto de venda. A linha é estruturada em '
      + 'uma embalagem pouch coletiva que reúne três sabores em porções individuais: Strawberry Cheesecake (rosa), Pudim '
      + '(amarelo) e Tiramisu (marrom), e se expande com o tablete no sabor Banana Split (azul), formando um sistema de '
      + 'embalagens coeso, dinâmico e contemporâneo.',
    capa: '', video: '', link: '',
    etiquetas: ['embalagem', 'identidade', 'conceito'],
    imagens: [],
  },

  // ---------------- ILUSTRAÇÃO (aparecem no mural, antes dos DESENHOS) ----------------
  {
    id: 'emoji-lab', categoria: 'ilustracao', titulo: 'Emoji Lab', resumo: 'colagem digital · vetor + 3D',
    texto: 'Projeto autoral de experimentação visual focado em desconstruir a silhueta clássica dos emojis. O processo combina '
      + 'vetorização com renders produzidos no software 3D, criando colagens digitais que misturam linguagens diferentes em '
      + 'cada peça: reflexos de globo de festa, brilhos etéreos, acabamento metálico e texturas líquidas. Algumas das peças '
      + 'foram animadas em loop para adicionar movimento às sobreposições.',
    capa: '', video: '', link: '',
    etiquetas: ['ilustração', 'vetor', '3d', 'animação em loop'],
    imagens: [],
  },
];

const CONFIG_GALERIA = {
  simbolos: '#$%&@01/*?+=<>[]{}', // símbolos do título embaralhando
  velocidadeEmbaralho: 40,
  atrasoParede: 250,               // ms depois que a câmera começa a virar pra parede aparecer
};

// setas de cada direção (aparecem nos cards das categorias)
const SETAS = { direita: '›', esquerda: '‹', cima: '⌃', baixo: '⌄' };

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
  // a miniatura do card é a do primeiro projeto da categoria que já tem capa ou vídeo
  const primeiro = PROJETOS.find((p) => p.categoria === id && (p.capa || p.video)) || {};
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
// ícone de casinha do botão que volta pra home (desenhado com linhas, pega a cor do botão)
const ICONE_CASA = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M3.5 11 12 4l8.5 7"/><path d="M6 9.5V20h4.5v-5.5h3V20H18V9.5"/></svg>`;
let categoriaAberta = null;

function montarGrade(id) {
  const c = CATEGORIAS[id];
  // os projetos em destaque (card duplo) vêm primeiro
  const lista = PROJETOS.filter((p) => p.categoria === id).sort((a, b) => !!b.destaque - !!a.destaque);
  const grade = galeria.querySelector('.grade');
  grade.innerHTML = '';
  grade.classList.toggle('mural', !!c.mural);
  lista.forEach((p, i) => {
    const q = document.createElement('a');
    q.className = `card quadradinho${p.destaque ? ' destaque' : ''}${c.mural ? ' no-mural' : ''}`;
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
  if (c.mural) montarMural(grade, c, lista.length);
  if (!lista.length && !c.mural) grade.innerHTML = '<p class="vazio">nenhum projeto aqui ainda ✦</p>';
  // no próximo quadro, os quadradinhos entram (um depois do outro)
  requestAnimationFrame(() => requestAnimationFrame(() => {
    grade.querySelectorAll('.quadradinho').forEach((q) => q.classList.add('visivel'));
  }));
}

// ---------- MURAL: os desenhos em colunas, cada um no seu formato ----------
function montarMural(grade, c, inicio) {
  DESENHOS.forEach((d, i) => {
    const q = document.createElement('button');
    q.type = 'button';
    q.className = 'card quadradinho desenho';
    q.style.setProperty('--i', inicio + i);
    q.innerHTML = `
      <div class="thumb" style="--c1:${c.cores[0]}; --c2:${c.cores[1]}${d.proporcao ? `; aspect-ratio:${d.proporcao}` : ''}">
        ${d.src ? `<img src="${escapar(d.src)}" alt="${escapar(d.titulo || '')}" loading="lazy" draggable="false">` : `<span class="desenho-exemplo">${escapar(d.exemplo || '')}</span>`}
        <span class="thumb-brilho"></span>
      </div>
      ${d.titulo ? `<h3>${escapar(d.titulo)}</h3>` : ''}`;
    q.addEventListener('click', () => abrirZoom(i));
    grade.appendChild(q);
  });
}

// desenho aberto em tamanho grande, por cima de tudo (setas / ← → passam, Esc ou clicar fora fecha)
const zoom = document.createElement('div');
zoom.className = 'mural-zoom';
zoom.hidden = true;
zoom.innerHTML = `
  <button class="pilula zoom-fechar" data-zoom-fechar aria-label="fechar">✕</button>
  <button class="pilula zoom-seta" data-passo="-1" aria-label="desenho anterior">‹</button>
  <figure class="zoom-quadro"><div class="zoom-midia"></div><figcaption></figcaption></figure>
  <button class="pilula zoom-seta" data-passo="1" aria-label="próximo desenho">›</button>`;
document.body.appendChild(zoom);
let zoomAtual = -1;

function abrirZoom(i) {
  zoomAtual = (i + DESENHOS.length) % DESENHOS.length;
  const d = DESENHOS[zoomAtual];
  const [c1, c2] = CATEGORIAS.ilustracao.cores;
  zoom.querySelector('.zoom-midia').innerHTML = d.src
    ? `<img src="${escapar(d.src)}" alt="${escapar(d.titulo || '')}">`
    : `<div class="midia-vazia" style="--c1:${c1}; --c2:${c2}; aspect-ratio:${d.proporcao || '1'}"><span>${escapar(d.exemplo || '')}</span></div>`;
  zoom.querySelector('figcaption').textContent = [d.titulo, d.ano].filter(Boolean).join(' · ');
  zoom.hidden = false;
}
function fecharZoom() {
  if (zoom.hidden) return false;
  zoom.hidden = true;
  zoomAtual = -1;
  return true;
}
zoom.addEventListener('click', (e) => {
  const seta = e.target.closest('[data-passo]');
  if (seta) abrirZoom(zoomAtual + Number(seta.dataset.passo));
  else if (e.target === zoom || e.target.closest('[data-zoom-fechar]')) fecharZoom();
});

function abrirCategoria(id) {
  const c = CATEGORIAS[id];
  if (categoriaAberta !== id) {
    categoriaAberta = id;
    galeria.className = `galeria vem-${c.direcao}`;
    galeria.style.setProperty('--c1', c.cores[0]);
    galeria.style.setProperty('--c2', c.cores[1]);
    galeria.innerHTML = `
      <div class="painel"><div class="painel-rolagem">
        <header class="painel-topo">
          <button class="pilula voltar casa" data-voltar title="voltar pra home" aria-label="voltar pra home">${ICONE_CASA}</button>
          <div class="painel-titulo">
            <h2 data-texto="${escapar(c.nome)}">${escapar(c.nome)}</h2>
            <p>${escapar(c.frase)}</p>
          </div>
        </header>
        <div class="grade"></div>
        <article class="detalhe" hidden></article>
      </div></div>`;
    montarGrade(id);

    galeria.querySelector('[data-voltar]').addEventListener('click', voltar);

    // a câmera vira e, logo depois, a parede entra
    dispatchEvent(new CustomEvent('virar', { detail: c.direcao }));
    document.body.classList.add('em-galeria');
    document.body.dataset.direcao = c.direcao;
    const abrirParede = () => {
      galeria.classList.add('aberta');
      embaralharTitulo(galeria.querySelector('.painel-titulo h2'));
    };
    // abrindo direto pelo link / refresh: a parede já aparece, sem esperar a câmera
    if (document.body.classList.contains('sem-transicao')) abrirParede();
    else setTimeout(abrirParede, semMovimento ? 0 : CONFIG_GALERIA.atrasoParede);
  }
  fecharDetalhe();
}

let vitrineAtual = null;   // a vitrine 3D aberta (se tiver), pra desligar ao sair
let cenarioAtual = null;   // o cenário 3D do jogo (se tiver)
let modeloAtual = null;    // o visualizador de modelo com a barra de topologia (se tiver)
let mosaicoAtual = null;   // o mosaico de fotos ao vivo (se tiver) — destruir desliga a câmera
function desligarVitrine() {
  vitrineAtual?.destruir(); vitrineAtual = null;
  cenarioAtual?.destruir(); cenarioAtual = null;
  modeloAtual?.destruir(); modeloAtual = null;
  mosaicoAtual?.destruir(); mosaicoAtual = null;
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
  //   { mosaico: { conjuntos } }                                   (o mosaico de fotos ao vivo com câmera + pinça — mosaico.js)
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
    if (m.mosaico) return `<div class="mosaico" data-mosaico></div>`;
    if (m.video) return `<video class="${classe}" src="${escapar(m.video)}" autoplay muted loop playsinline controls></video>`;
    return `<img class="${classe}" src="${escapar(m.src)}" alt="${escapar(m.legenda || p.titulo)}" loading="lazy">`;
  };

  // as imagens de baixo, uma embaixo da outra (as "meia" ficam de duas em duas)
  const imagensHTML = lista.map((m) => `
    <figure class="detalhe-imagem${m.meia ? ' meia' : ''}${m.terco ? ' terco' : ''}${m.centro ? ' centro' : ''}${m.vitrine ? ' com-vitrine' : ''}${m.cenario ? ' com-cenario' : ''}${m.modelo3d ? ' com-modelo3d' : ''}${m.mosaico ? ' com-mosaico' : ''}">
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

  const lugarMosaico = det.querySelector('[data-mosaico]');
  if (lugarMosaico) {
    const cfgMosaico = lista.find((m) => m.mosaico).mosaico;
    import('./mosaico.js').then(({ montarMosaico }) => {
      if (!lugarMosaico.isConnected) return;
      mosaicoAtual = montarMosaico(lugarMosaico, cfgMosaico);
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
}

function fecharCategoria() {
  if (!categoriaAberta) return;
  categoriaAberta = null;
  fecharZoom();
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
// se alguém abrir o site já com #3d/... no link (ou der refresh numa página de projeto),
// abre direto nela, sem animação: assim os pixels do carregamento revelam a página certa, não a home.
// (a câmera do main.js também já começa virada, olhando o body.em-galeria)
if (location.hash) {
  document.body.classList.add('sem-transicao');
  seguirEndereco();
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('sem-transicao')));
}

// Esc: fecha o desenho aberto → sai do detalhe → sai da galeria (← → passam os desenhos)
addEventListener('keydown', (e) => {
  if (!zoom.hidden) {
    if (e.key === 'Escape') fecharZoom();
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') abrirZoom(zoomAtual + (e.key === 'ArrowLeft' ? -1 : 1));
    return;
  }
  if (e.key !== 'Escape' || !categoriaAberta) return;
  const det = galeria.querySelector('.detalhe');
  if (det && !det.hidden) location.hash = categoriaAberta;
  else voltar();
});

// clicar no logo volta pra home
document.getElementById('logo')?.addEventListener('click', () => {
  if (categoriaAberta) voltar();
});
