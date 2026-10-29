// =====================================================================
//  PROJETOS
//  Tudo junto numa grade só, logo abaixo dela na home (descendo a página).
//  Os botões "tudo · 3D · design · ilustração" filtram a grade.
//  Clicando num projeto, a página dele abre num painel por cima da cena.
//
//  PRA EDITAR O CONTEÚDO: mexa só nas listas CATEGORIAS, DESENHOS e PROJETOS abaixo.
// =====================================================================

const CATEGORIAS = {
  '3d': { nome: '3D', cores: ['#94d3ec', '#e0f4fb'] },
  design: { nome: 'design', cores: ['#8fe0a0', '#e4f9dc'] },
  ilustracao: { nome: 'ilustração', cores: ['#f7a8cf', '#ffe3f0'] },
};

// ---------- DESENHOS (entram na grade como quadradinhos da ilustração) ----------
// cada desenho: { src: 'projetos/ilustracao/nome.webp', titulo: 'nome do desenho', ano: '2025' }
// na grade aparece recortado em quadrado; clicando, abre grande e inteiro (com setas pra passar).
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
//   id          → nome curto sem espaço (vira o link: seusite.com/#game-jam)
//   categoria   → '3d' | 'ilustracao' | 'design'
//   titulo, resumo, texto → nome, frase curta (no quadradinho) e texto do detalhe
//   destaque    → true = card duplo, e vem primeiro da categoria (os projetos "grandes" da tabela do Miro)
//   capa        → imagem do quadradinho (ex: 'projetos/game-jam/capa.jpg'). Vazio = degradê
//   capaInteira → true = a capa aparece inteira no card (sem cortar), bom pra imagem com fundo transparente
//   blocoBranco → true = as imagens de baixo ficam todas num blocão branco, sem moldura em cada uma
//                 (pros recortes/adesivos parecerem parte da página, não fotos — pedido da Ana no Sinapse)
//   video       → vídeo curtinho (turntable 360, animação...). Toca no hover e no detalhe
//   videoTopo   → (opcional) outro vídeo só pro topo do detalhe, se o do hover for diferente
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
    texto: 'Escultura de 1,80 m modelada em 3D e impressa em grande escala para a cenografia da Lovecore 7, festa do '
      + 'coletivo REBU DIGITAL. O trabalho foi da modelagem e da divisão da peça em partes para impressão até a montagem, '
      + 'o reforço interno e o acabamento. A Lovecore é um dos principais pólos da cena underground de São Paulo e reúne '
      + 'mais de 500 pessoas por edição, entre música eletrônica experimental, moda, artes visuais e cultura da internet.',
    capa: '', video: '', link: '',
    etiquetas: ['impressão 3d', 'escultura', 'cenografia', 'lovecore 7', 'rebu digital'],
    imagens: [],
  },
  {
    id: 'shader-glsl', categoria: '3d', destaque: true, titulo: 'Shader GLSL', resumo: 'instalação interativa · TouchDesigner',
    texto: 'Instalação interativa feita em TouchDesigner com shaders GLSL próprios para a cenografia da Lovecore 6, festa do '
      + 'coletivo REBU DIGITAL. A imagem da câmera vira, em tempo real, um mosaico de pequenas imagens, e o público muda '
      + 'o tamanho dos quadrados com o gesto de pinça da mão. A noite teve como atrações internacionais Dinamarca '
      + '(cofundador da Staycore) e o trio mexicano METH MATH; a Lovecore reúne mais de 500 pessoas por edição.',
    capa: 'projetos/shader-glsl/capa.webp',
    video: 'projetos/shader-glsl/instalacao.mp4?v=2',   // 480 px, 1,8 MB
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
      // o dia da Lovecore 6 (REBU) numa pastinha: clicando, as fotos e vídeos saem e se espalham (pasta.js)
      // vídeos: Downloads/IMG_3218.MOV (o painel) e IMG_9046.mov (a montagem); as fotos são quadros desses vídeos
      // o reel da REBU (baixado pela Ana do post instagram.com/reel/DQnHe1TkUl-) abre grande COM som e o player do site
      { pasta: { nome: 'lovecore 6', itens: [
          { video: 'projetos/shader-glsl/lovecore/making-of.mp4', poster: 'projetos/shader-glsl/lovecore/making-of-poster.webp', x: -21, y: -6, r: -4, w: 40 },
          { video: 'projetos/shader-glsl/lovecore/reel-rebu.mp4', som: true, poster: 'projetos/shader-glsl/lovecore/reel-rebu-poster.webp',
            legenda: 'vídeo: @rebudigital', emPe: true, x: 12, y: -6, r: 3, w: 16 },
          { video: 'projetos/shader-glsl/lovecore/painel.mp4', poster: 'projetos/shader-glsl/lovecore/painel-poster.webp', emPe: true, x: 33, y: -1, r: 7, w: 14 },
        ] } },
      // a tela do TouchDesigner gravada pela Ana (Videos/2026-07-15 14-17-35.mp4), sem a barra do Windows
      { video: 'projetos/shader-glsl/bastidores.mp4?v=2', ampliar: true, grande: 'projetos/shader-glsl/bastidores-grande.mp4?v=2',
        legenda: 'bastidores: a rede do shader GLSL no TouchDesigner' },
    ],
  },
  {
    id: 'game-jam', categoria: '3d', destaque: true, titulo: 'Tony Matrimony', resumo: 'personagens 3D · GMTK Game Jam 2026',
    texto: '8 personagens 3D criados em 4 dias para Tony Matrimony, jogo feito na GMTK Game Jam 2026, uma das maiores '
      + 'maratonas de jogos independentes do mundo, com mais de 10.000 projetos. Para dar conta do prazo, o processo '
      + 'começou pela blocagem rápida dos volumes, sem perder a unidade visual do elenco, e os modelos foram otimizados '
      + 'para a engine (topologia limpa, texturas leves e rigs simples). O jogo ficou em 94º lugar na categoria Arte.',
    capa: 'projetos/game-jam/tony-camera.webp?v=5', capaInteira: true,   // quadrada e o card é largo: não corta a cabeça nem os pés
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
    texto: 'Personagem 3D autoral modelada e animada com shaders toon que imitam o traço e o volume do desenho 2D. Um '
      + 'projeto pessoal para levar a expressividade da ilustração tradicional para o 3D, terminando numa animação com a '
      + 'fluidez e o charme de desenho animado.',
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
    texto: 'Série de composições e animações com 4 personagens 3D autorais. Para fugir do acabamento padrão do 3D, a solução '
      + 'foi usar mapas de profundidade (depth maps) aplicados direto como textura, o que deu à série um visual gráfico, '
      + 'colorido e lúdico.',
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
    texto: 'Site colaborativo que propõe experimentar São Paulo pelos cinco sentidos. O nome vem da sinapse, a conexão entre '
      + 'neurônios por onde passam os impulsos nervosos: é assim que toda experiência sensorial acontece no corpo. Com imagens '
      + 'sobrepostas, um filtro visual para cada sentido e jogos interativos, a plataforma convida a misturar os estímulos como '
      + 'acontece no dia a dia da cidade. O projeto abrangeu a conceituação, o logotipo (o "S" e o "P" em destaque são as '
      + 'iniciais de São Paulo), a experiência web e os cartazes de divulgação.',
    // capa = o mapa de adesivos + o logo (do Behance); passando o mouse, o mapa se montando no site;
    // no topo, por enquanto, o mesmo do hover. Material da pasta "Motion" do grupo e do Behance
    capa: 'projetos/sinapse/capa.webp', video: 'projetos/sinapse/capa-troca.mp4',   // (o topo vai ser o motion novo da Ana — trocar aqui com videoTopo)
    link: 'https://sinapse-5s3w.vercel.app/', blocoBranco: true,
    etiquetas: ['web', 'identidade', 'cartazes', 'motion'],
    imagens: [
      { video: 'projetos/sinapse/logo-objetos.mp4', legenda: 'o logo trocando letras por objetos da cidade (Juliana Nakashima)' },
      { src: 'projetos/sinapse/adesivos.webp?v=2', sangria: true },
      { video: 'projetos/sinapse/site.mp4', centro: true },
      { video: 'projetos/sinapse/placa-filtros.mp4', legenda: 'um filtro pra cada sentido: visão (vibrance), tato (bordas rasgadas), olfato (desfoque), audição (ruído) e paladar (vidro)' },
      { src: 'projetos/sinapse/cartazes.webp', legenda: 'cartazes de divulgação' },
      { video: 'projetos/sinapse/cartazes.mp4', centro: true, legenda: 'motion dos cartazes (Juliana Nakashima)' },
    ],
  },
  {
    id: 'cynth', categoria: 'design', titulo: 'Cynth', resumo: 'tipografia · fonte display',
    texto: 'Cynth é uma fonte display criada em dupla, com proporções expandidas, contraste forte de peso e contraformas em '
      + 'formato de gota (simples e alongadas). É uma família completa: caixa alta e baixa, numerais, acentos, pontuação '
      + 'e um conjunto grande de símbolos. A apresentação da fonte ganhou motion e peças interativas feitas no '
      + 'TouchDesigner.',
    // capa parada (a 1ª aba); passando o mouse, as abas da marca trocam 4 por segundo (como o switch do Touch)
    capa: 'projetos/cynth/capa.webp?v=2', video: 'projetos/cynth/capa-troca.mp4', link: '',
    etiquetas: ['tipografia', 'fonte display'],
    imagens: [
      // as abas (da capa) foram recoloridas nas cores da marca por .claude/ferramentas/recolorir_abas_cynth.py
      // vídeos da Ana (540 px, sem som), três lado a lado: as abas no TouchDesigner e os motions
      { video: 'projetos/cynth/abas.mp4', terco: true },
      { video: 'projetos/cynth/emoji.mp4', terco: true },
      { video: 'projetos/cynth/letras.mp4', terco: true },
      // detalhes do desenho das letras (recolorido nas cores da marca por .claude/ferramentas/recolorir_detalhes.py)
      { src: 'projetos/cynth/detalhes.webp', legenda: 'os bojos em gota: gota elongada (k, a) e em forma de gota (p, d)' },
      { testador: { fonte: 'projetos/cynth/cynth.otf' },
        legenda: 'teste a Cynth: digite na janelinha — o ✕ fecha e ela volta em outra cor' },
      { gradeLetras: { fonte: 'projetos/cynth/cynth.otf' },
        legenda: 'o grid do TouchDesigner em 3D: perto do mouse as letras crescem e embaralham, e ele vira bloco / esfera e volta — arraste pra girar' },
      // bastidores: a tela do TouchDesigner gravada (overview da rede, com os viewers ao vivo)
      { video: 'projetos/cynth/bastidores-grid.mp4', meia: true, ampliar: true, grande: 'projetos/cynth/bastidores-grid-grande.mp4', legenda: 'bastidores: a rede do grid no TouchDesigner' },
      { video: 'projetos/cynth/bastidores-abas.mp4', meia: true, ampliar: true, grande: 'projetos/cynth/bastidores-abas-grande.mp4', legenda: 'bastidores: a rede das abas no TouchDesigner' },
    ],
  },
  {
    id: 'revista-espm', categoria: 'design', titulo: 'Boca Boca', resumo: 'revista · identidade',
    texto: 'Boca Boca é uma revista sobre restaurantes de imigrantes em São Paulo. Em equipe, criamos o conceito editorial, '
      + 'a identidade visual e o projeto gráfico da primeira edição, dedicada à América Latina, além do vídeo de '
      + 'apresentação da marca.',
    // capa parada (o logo da capa do manual); passando o mouse, as bocas trocando do fim do vídeo (quadrado, igual ao card);
    // no topo da página, as bocas animadas
    capa: 'projetos/boca-boca/capa.webp', video: 'projetos/boca-boca/bocas-trocando.mp4', videoTopo: 'projetos/boca-boca/bocas.mp4?v=2', link: '',
    etiquetas: ['editorial', 'diagramação', 'identidade'],
    imagens: [
      // a revista inteira em 3D: flutua girando, clicando abre e dá pra folhear (revista3d.js; páginas tiradas do Issuu)
      { revista3d: { pasta: 'projetos/boca-boca/revista/', paginas: 100 },
        legenda: 'folheie a revista: clique pra abrir · clique nos lados, arraste ou use ← → pra virar · 2 cliques (ou a lupa) amplia pra ler' },
      // páginas do manual da marca (clicando, abrem grandes — cartela.js)
      { cartela: { formato: 'paginas', itens: [
          { nome: 'conceituação · universo gráfico', src: 'projetos/boca-boca/pagina-08.webp' },
          { nome: 'área de proteção e aplicações', src: 'projetos/boca-boca/pagina-11.webp' },
          { nome: 'tagline e ícones', src: 'projetos/boca-boca/pagina-12.webp' },
          { nome: 'elementos de apoio', src: 'projetos/boca-boca/pagina-13.webp' },
          { nome: 'diagramação', src: 'projetos/boca-boca/pagina-26.webp' },
        ] },
        legenda: 'bastidores: páginas do manual do projeto gráfico — clique pra ver grande' },
      { video: 'projetos/boca-boca/bocas-trocando.mp4', centro: true },
      { video: 'projetos/boca-boca/video.mp4', som: true, poster: 'projetos/boca-boca/poster.webp?v=2', legenda: 'o vídeo de apresentação da marca e da revista (com som)' },
    ],
  },
  {
    id: 'kitkat', categoria: 'design', titulo: 'KitKat Sugar Rush', resumo: 'embalagem · identidade',
    texto: 'Linha conceitual de KitKat para a Geração Z, inspirada no sugar rush: aquela vontade de doce depois do almoço. A '
      + 'identidade mistura retícula (halftone), anéis gráficos coloridos e fotos das sobremesas. O sistema tem um pouch '
      + 'com três sabores em porções individuais (Strawberry Cheesecake, Pudim e Tiramisu) e um tablete de Banana Split, '
      + 'cada um com sua cor.',
    capa: '', video: '', link: '',
    etiquetas: ['embalagem', 'identidade', 'conceito'],
    imagens: [],
  },

  // ---------------- ILUSTRAÇÃO (na grade, antes dos DESENHOS) ----------------
  {
    id: 'emoji-lab', categoria: 'ilustracao', titulo: 'Emoji Lab', resumo: 'colagem digital · vetor + 3D',
    texto: 'Série de 8 emojis autorais que desmontam a silhueta clássica do emoji. Cada peça é uma colagem digital entre '
      + 'vetor e render 3D, com reflexo de globo de festa, brilho, metal e texturas líquidas; algumas ganharam animação '
      + 'em loop.',
    // capa parada (o palhaço); passando o mouse, os 8 emojis trocam
    capa: 'projetos/emoji-lab/capa.webp?v=2', video: 'projetos/emoji-lab/capa-troca.mp4', link: '',
    etiquetas: ['ilustração', 'vetor', '3d', 'animação em loop'],
    imagens: [
      // a série inteira numa cartela; os animados tocam o loop no quadradinho (cartela.js)
      { cartela: { semNome: true, emojis: [
          { nome: 'palhaço', src: 'projetos/emoji-lab/palhaco.webp' },
          { nome: 'frankenstein', src: 'projetos/emoji-lab/frankenstein.webp' },
          { nome: 'globo de festa', src: 'projetos/emoji-lab/globo.webp' },
          { nome: 'robô-gatinho', src: 'projetos/emoji-lab/robo-gato.webp', video: 'projetos/emoji-lab/robo-gato.mp4', videoInteiro: 'projetos/emoji-lab/robo-gato-inteiro.mp4' },
          { nome: 'bolinha rosa', src: 'projetos/emoji-lab/bolinha-rosa.webp', video: 'projetos/emoji-lab/bolinha-rosa.mp4', videoInteiro: 'projetos/emoji-lab/bolinha-rosa-inteira.mp4?v=2' },
          { nome: 'slime', src: 'projetos/emoji-lab/slime.webp' },
          { nome: 'cabecinha', src: 'projetos/emoji-lab/cabecinha.webp', video: 'projetos/emoji-lab/cabecinha.mp4', videoInteiro: 'projetos/emoji-lab/cabecinha-inteira.mp4' },
          { nome: 'cristal', src: 'projetos/emoji-lab/cristal.webp' },
        ] },
        legenda: 'a série: clique em um pra ver grande — os marcados como "animado" se mexem em loop' },
    ],
  },
];


const CONFIG_GALERIA = {
  simbolos: '#$%&@01/*?+=<>[]{}', // símbolos do título embaralhando
  velocidadeEmbaralho: 40,
  nevoaMaxima: 0.5,                // quanto a cena fica enevoada atrás dos projetos (0 = nada, 1 = some)
  ordemCategorias: ['3d', 'design', 'ilustracao'],  // a grade alterna as categorias nessa ordem
};

const semMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;
const escapar = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rolarSuave = semMovimento ? 'auto' : 'smooth';

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
    <div class="thumb${p.capaInteira ? ' inteira' : ''}" style="--c1:${cores[0]}; --c2:${cores[1]}">
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
//  A GRADE: todos os projetos juntos, embaixo dela
//  Ordem: as categorias se alternam (3D, design, ilustração, 3D...), e dentro de cada uma os destaques
//  vêm primeiro — assim quase toda linha tem um card grande e a grade fica misturada.
//  Os DESENHOS entram depois dos projetos de ilustração.
// =====================================================================
const grade = document.getElementById('grade');

function itensDaGrade() {
  const filas = {};
  for (const id of CONFIG_GALERIA.ordemCategorias) {
    filas[id] = PROJETOS.filter((p) => p.categoria === id).sort((a, b) => !!b.destaque - !!a.destaque)
      .map((p) => ({ projeto: p, categoria: id }));
  }
  filas.ilustracao.push(...DESENHOS.map((d, i) => ({ desenho: d, indice: i, categoria: 'ilustracao' })));
  const itens = [];
  while (Object.values(filas).some((f) => f.length)) {
    for (const id of CONFIG_GALERIA.ordemCategorias) if (filas[id].length) itens.push(filas[id].shift());
  }
  return itens;
}

// (a etiqueta da categoria no canto da capa, a frase curta embaixo do nome e os filtros saíram — pedido da Ana;
//  o "resumo" de cada projeto continua aqui no PROJETOS, caso um dia volte)

itensDaGrade().forEach((item) => {
  const c = CATEGORIAS[item.categoria];
  let q;
  if (item.projeto) {
    const p = item.projeto;
    q = document.createElement('a');
    q.className = `card quadradinho${p.destaque ? ' destaque' : ''}`;
    q.href = `#${p.id}`;
    q.innerHTML = `
      ${miniatura(p, c.cores)}
      <h3 data-texto="${escapar(p.titulo)}">${escapar(p.titulo)}</h3>`;
    ligarCard(q, () => { abertoPeloSite = true; location.hash = p.id; });
  } else {
    // desenho: quadradinho recortado; clicando abre grande, inteiro
    const d = item.desenho;
    const titulo = d.titulo || d.exemplo || 'desenho';
    q = document.createElement('button');
    q.type = 'button';
    q.className = 'card quadradinho desenho';
    q.innerHTML = `
      <div class="thumb" style="--c1:${c.cores[0]}; --c2:${c.cores[1]}">
        ${d.src ? `<img src="${escapar(d.src)}" alt="${escapar(d.titulo || '')}" loading="lazy" draggable="false">` : `<span class="desenho-exemplo">${escapar(d.exemplo || '')}</span>`}
        <span class="thumb-brilho"></span>
      </div>
      <h3 data-texto="${escapar(titulo)}">${escapar(titulo)}</h3>`;
    ligarCard(q, () => abrirZoom(item.indice));
  }
  q.draggable = false;
  q.dataset.categoria = item.categoria;
  grade.appendChild(q);
});

// os quadradinhos entram (um depois do outro) quando aparecem na tela
const observador = new IntersectionObserver((entradas) => {
  let ordem = 0;
  for (const e of entradas) {
    if (!e.isIntersecting) continue;
    e.target.style.setProperty('--i', ordem++);
    e.target.classList.add('visivel');
    observador.unobserve(e.target);
  }
}, { rootMargin: '0px 0px -30px 0px' });
grade.querySelectorAll('.quadradinho').forEach((q) => observador.observe(q));


// =====================================================================
//  ROLAGEM: a cena fica parada atrás, cada vez mais enevoada
//  (e ela olha pra baixo — isso fica no main.js)
// =====================================================================
const secaoProjetos = document.getElementById('projetos');
const veu = document.getElementById('veu');
function aoRolar() {
  const r = Math.min(1, scrollY / (innerHeight * 0.6));
  veu.style.opacity = (r * CONFIG_GALERIA.nevoaMaxima).toFixed(3);
  veu.style.visibility = r > 0 ? 'visible' : 'hidden';
  document.body.classList.toggle('rolou', scrollY > 30);
}
addEventListener('scroll', aoRolar, { passive: true });
addEventListener('resize', aoRolar);
aoRolar();
const irPraGrade = () => scrollTo({ top: secaoProjetos.offsetTop + 30, behavior: rolarSuave });
document.querySelectorAll('[data-descer]').forEach((b) => b.addEventListener('click', irPraGrade));
document.querySelector('[data-subir]')?.addEventListener('click', () => scrollTo({ top: 0, behavior: rolarSuave }));

// =====================================================================
//  DESENHO aberto em tamanho grande, por cima de tudo (setas / ← → passam, Esc ou clicar fora fecha)
// =====================================================================
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

// =====================================================================
//  PÁGINA DO PROJETO: um painel por cima da cena (a grade continua no mesmo lugar, embaixo)
// =====================================================================
const galeria = document.getElementById('galeria');
galeria.innerHTML = `<div class="painel"><div class="painel-rolagem"><article class="detalhe"></article></div></div>`;
const painel = galeria.querySelector('.painel-rolagem');
const det = galeria.querySelector('.detalhe');
let projetoAberto = null;
let abertoPeloSite = false;   // true = abriu clicando na grade (aí fechar = voltar no histórico)

// clicar fora do painel fecha
galeria.addEventListener('click', (e) => { if (e.target === galeria) fecharPeloBotao(); });

let vitrineAtual = null;   // a vitrine 3D aberta (se tiver), pra desligar ao sair
let cenarioAtual = null;   // o cenário 3D do jogo (se tiver)
let modeloAtual = null;    // o visualizador de modelo com a barra de topologia (se tiver)
let mosaicoAtual = null;   // o mosaico de fotos ao vivo (se tiver) — destruir desliga a câmera
let testadorAtual = null;  // o testador de fonte (se tiver)
let gradeAtual = null;     // a grade de letras do Cynth (se tiver)
let cartelaAtual = null;   // a cartela de emojis (se tiver)
let revistaAtual = null;   // a revista 3D (se tiver)
let pastaAtual = null;     // a pastinha com as fotos do dia (se tiver)
let somAtual = null;       // o observador que dá play no vídeo com som quando ele aparece
let playersAtuais = [];    // os players do vídeo com som (player.js)
function desligarVitrine() {
  vitrineAtual?.destruir(); vitrineAtual = null;
  cenarioAtual?.destruir(); cenarioAtual = null;
  modeloAtual?.destruir(); modeloAtual = null;
  mosaicoAtual?.destruir(); mosaicoAtual = null;
  testadorAtual?.destruir(); testadorAtual = null;
  gradeAtual?.destruir(); gradeAtual = null;
  cartelaAtual?.destruir(); cartelaAtual = null;
  revistaAtual?.destruir(); revistaAtual = null;
  pastaAtual?.destruir(); pastaAtual = null;
  somAtual?.disconnect(); somAtual = null;
  playersAtuais.forEach((p) => p.destruir()); playersAtuais = [];
}

function abrirProjeto(projetoId) {
  const p = PROJETOS.find((x) => x.id === projetoId);
  if (!p) return false;
  if (projetoAberto === projetoId) return true;
  projetoAberto = projetoId;
  fecharZoom();
  desligarVitrine();
  const c = CATEGORIAS[p.categoria];
  galeria.style.setProperty('--c1', c.cores[0]);
  galeria.style.setProperty('--c2', c.cores[1]);

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
  //   { testador: { fonte } }                                      (janelinha pra digitar e testar uma fonte — testador.js)
  //   { gradeLetras: { fonte } }                                   (grade de letras do Cynth — cynth.js)
  //   { cartela: { emojis } }                                      (cartela de figurinhas, animadas tocando — cartela.js)
  //   { cartela: { formato: 'paginas', itens } }                    (páginas deitadas, clicando abrem grandes — cartela.js)
  //   { issuu: 'https://e.issuu.com/embed.html?...' }               (a revista pra folhear, do Issuu)
  //   { revista3d: { pasta, paginas } }                             (revista em 3D que abre e folheia — revista3d.js)
  //   { video: '...', som: true, poster: '...jpg' }                 (vídeo com som e controles, não toca sozinho)
  //   { src: '...', sangria: true }                                 (no blocão branco: vai de uma borda à outra, sem margem)
  //   { video: '...', ampliar: true, grande: '...mp4' }              (clicando abre grande; "grande" = versão em resolução maior)
  //   { pasta: { nome, itens: [{ src | video, x, y, r, w }] } }       (pastinha: clicando, as fotos saem e se espalham — pasta.js)
  //   { instagram: 'https://www.instagram.com/reel/...' }            (o post inteiro, dentro da página)
  const normalizar = (m) => (typeof m === 'string' ? (/\.(mp4|webm)$/i.test(m) ? { video: m } : { src: m }) : m);
  // o destaque do topo: o vídeo, senão a capa, senão a 1ª imagem
  const lista = (p.imagens || []).map(normalizar);
  const destaque = p.videoTopo || p.video ? { video: p.videoTopo || p.video } : p.capa ? { src: p.capa } : lista.shift();

  const midiaHTML = (m, classe = '') => {
    if (!m || m.exemplo) {
      return `<div class="midia-vazia ${classe}" style="--c1:${c.cores[0]}; --c2:${c.cores[1]}"><span>${escapar(m?.exemplo || p.titulo)}</span></div>`;
    }
    if (m.vitrine) return `<div class="vitrine" data-vitrine></div>`;
    if (m.cenario) return `<div class="cenario" data-cenario></div>`;
    if (m.modelo3d) return `<div class="modelo3d" data-modelo3d></div>`;
    if (m.mosaico) return `<div class="mosaico" data-mosaico></div>`;
    if (m.testador) return `<div class="testador" data-testador></div>`;
    if (m.cartela) return `<div class="cartela-lugar" data-cartela></div>`;
    if (m.pasta) return `<div class="pasta-lugar" data-pasta></div>`;
    // post do Instagram (o próprio post, com o crédito de quem postou); o endereço vem do link "copiar link"
    if (m.instagram) {
      const id = (/instagram\.com\/(?:reel|p)\/([\w-]+)/.exec(m.instagram) || [])[1];
      return id ? `<div class="instagram"><iframe src="https://www.instagram.com/${m.instagram.includes('/reel/') ? 'reel' : 'p'}/${id}/embed/" title="post do Instagram" loading="lazy" allow="autoplay; encrypted-media; fullscreen" allowfullscreen scrolling="no"></iframe></div>` : '';
    }
    if (m.revista3d) return `<div class="revista3d-lugar" data-revista3d></div>`;
    if (m.gradeLetras) return `<div class="cynth-interativo" data-grade-letras></div>`;
    if (m.issuu) return `<div class="issuu"><iframe src="${escapar(m.issuu)}" title="${escapar(p.titulo)} no Issuu" loading="lazy" allow="fullscreen" allowfullscreen></iframe></div>`;
    // o vídeo completo, com som: esse sim tem os controles (não toca sozinho)
    // vídeo com som: os botões são todos do site (player.js), não os do navegador
    if (m.video && m.som) return `<div class="video-som" data-player><video class="${classe} com-som" src="${escapar(m.video)}"${m.poster ? ` poster="${escapar(m.poster)}"` : ''} preload="metadata" playsinline disablepictureinpicture></video></div>`;
    // vídeos "planos": sem botões nem barra por cima (pedido da Ana) — tocam sozinhos, sem som, em loop
    if (m.video) return `<video class="${classe}" src="${escapar(m.video)}" autoplay muted loop playsinline disablepictureinpicture disableremoteplayback></video>`;
    return `<img class="${classe}" src="${escapar(m.src)}" alt="${escapar(m.legenda || p.titulo)}" loading="lazy">`;
  };

  // as imagens de baixo, uma embaixo da outra (as "meia" ficam de duas em duas)
  const imagensHTML = lista.map((m) => `
    <figure class="detalhe-imagem${m.ampliar ? ' ampliavel' : ''}${m.sangria ? ' sangria' : ''}${m.meia ? ' meia' : ''}${m.terco ? ' terco' : ''}${m.centro ? ' centro' : ''}${m.vitrine ? ' com-vitrine' : ''}${m.cenario ? ' com-cenario' : ''}${m.modelo3d ? ' com-modelo3d' : ''}${m.mosaico ? ' com-mosaico' : ''}${m.testador ? ' com-testador' : ''}${m.gradeLetras ? ' com-cynth' : ''}">
      ${midiaHTML(m)}
      ${m.ampliar ? `<button type="button" class="pilula ampliar-botao" data-ampliar="${escapar(m.grande || m.video || m.src)}" data-tipo="${m.video ? 'video' : 'img'}" data-legenda="${escapar(m.legenda || '')}" aria-label="ver de perto">⤢ ver de perto</button>` : ''}
      ${m.legenda ? `<figcaption>${escapar(m.legenda)}</figcaption>` : ''}
    </figure>`).join('');

  det.innerHTML = `
    <div class="detalhe-barra">
      <button class="pilula voltar-grade" data-fechar-projeto>‹ todos os projetos</button>
      <button class="pilula fechar-projeto" data-fechar-projeto aria-label="fechar">✕</button>
    </div>
    <div class="detalhe-corpo">
      <div class="detalhe-midia">${midiaHTML(destaque)}</div>
      <div class="detalhe-info">
        <h2 data-texto="${escapar(p.titulo)}">${escapar(p.titulo)}</h2>
        <div class="etiquetas">
          <span class="etiqueta forte">${escapar(c.nome)}</span>
          ${(p.etiquetas || []).map((e) => `<span class="etiqueta">${escapar(e)}</span>`).join('')}
        </div>
        <p class="detalhe-texto">${escapar(p.texto)}</p>
        ${p.link ? `<a class="pilula ver-projeto" href="${escapar(p.link)}" target="_blank" rel="noopener">ver projeto ↗</a>` : ''}
        ${lista.length ? `<button class="pilula rolar" data-rolar>⌄ ver mais imagens (${lista.length})</button>` : ''}
      </div>
    </div>
    ${lista.length ? `<div class="detalhe-imagens${p.blocoBranco ? ' bloco-branco' : ''}">${imagensHTML}</div>` : ''}
    <div class="detalhe-fim"${lista.length ? '' : ' hidden'}>
      <button class="pilula" data-topo>⌃ voltar pro topo</button>
      <button class="pilula" data-fechar-projeto>‹ todos os projetos</button>
    </div>`;

  // os visualizadores 3D / câmera só carregam quando o projeto abre
  const montar = (seletor, chave, arquivo, funcao, guardar) => {
    const lugar = det.querySelector(seletor);
    if (!lugar) return;
    const cfg = lista.find((m) => m[chave])[chave];
    import(arquivo).then((modulo) => {
      if (!lugar.isConnected) return;          // já saiu do projeto enquanto carregava
      guardar(modulo[funcao](lugar, cfg));
    });
  };
  montar('[data-vitrine]', 'vitrine', './vitrine.js', 'montarVitrine', (v) => { vitrineAtual = v; });
  montar('[data-cenario]', 'cenario', './cenario.js', 'montarCenario', (v) => { cenarioAtual = v; });
  montar('[data-modelo3d]', 'modelo3d', './modelo3d.js', 'montarModelo3d', (v) => { modeloAtual = v; });
  montar('[data-mosaico]', 'mosaico', './mosaico.js', 'montarMosaico', (v) => { mosaicoAtual = v; });
  montar('[data-testador]', 'testador', './testador.js', 'montarTestador', (v) => { testadorAtual = v; });
  montar('[data-grade-letras]', 'gradeLetras', './cynth.js', 'montarGrade', (v) => { gradeAtual = v; });
  montar('[data-cartela]', 'cartela', './cartela.js', 'montarCartela', (v) => { cartelaAtual = v; });
  montar('[data-pasta]', 'pasta', './pasta.js', 'montarPasta', (v) => { pastaAtual = v; });
  montar('[data-revista3d]', 'revista3d', './revista3d.js', 'montarRevista3d', (v) => { revistaAtual = v; });

  // o vídeo com som começa sozinho quando a pessoa chega nele (e pausa quando ela rola pra longe);
  // se o navegador não deixar tocar com som, toca mudo (a pessoa liga o som nos controles)
  const lugaresPlayer = det.querySelectorAll('[data-player]');
  if (lugaresPlayer.length) {
    import('./player.js').then((modulo) => {
      lugaresPlayer.forEach((c) => { if (c.isConnected) playersAtuais.push(modulo.montarPlayer(c)); });
    });
  }
  const comSom = det.querySelectorAll('video.com-som');
  if (comSom.length) {
    somAtual = new IntersectionObserver((avisos) => {
      for (const a of avisos) {
        const v = a.target;
        if (a.isIntersecting) {
          if (v.dataset.pausadoPelaPessoa) continue;
          v.dataset.tocandoSozinho = '1';
          v.play().catch(() => { v.muted = true; v.play().catch(() => {}); });
        } else if (!v.paused) {
          v.dataset.pausaAuto = '1';
          v.pause();
        }
      }
    }, { threshold: 0.6 });
    comSom.forEach((v) => {
      somAtual.observe(v);
      // se a pessoa pausou com o vídeo na tela, não volta a tocar sozinho
      v.addEventListener('pause', () => {
        if (v.dataset.pausaAuto) { delete v.dataset.pausaAuto; return; }   // fui eu (rolou pra longe)
        if (!v.ended && v.isConnected) v.dataset.pausadoPelaPessoa = '1';
      });
      v.addEventListener('play', () => { delete v.dataset.pausadoPelaPessoa; });
    });
  }

  // clicar numa imagem/vídeo "ampliar" abre grande
  det.querySelectorAll('.ampliavel').forEach((f) => f.addEventListener('click', () => abrirAmpliado(f.querySelector('[data-ampliar]')?.dataset)));
  det.addEventListener('ampliar', (e) => abrirAmpliado({ ampliar: e.detail.src, ...e.detail }));   // a pastinha

  det.querySelectorAll('[data-fechar-projeto]').forEach((b) => b.addEventListener('click', fecharPeloBotao));
  det.querySelector('[data-rolar]')?.addEventListener('click', () => {
    painel.scrollTo({ top: det.querySelector('.detalhe-imagens').offsetTop - 20, behavior: rolarSuave });
  });
  det.querySelector('[data-topo]').addEventListener('click', () => painel.scrollTo({ top: 0, behavior: rolarSuave }));

  painel.scrollTop = 0;
  galeria.classList.add('aberta');
  galeria.setAttribute('aria-hidden', 'false');
  // a página de trás para de rolar enquanto o projeto está aberto (e fica no mesmo lugar)
  document.documentElement.classList.add('travado');
  document.body.classList.add('projeto-aberto');
  embaralharTitulo(det.querySelector('h2'));
  return true;
}

// ---------- ver de perto (itens com ampliar: true) ----------
// abre grande na tela; clicando na imagem aproxima mais (2,5×) onde clicou, e o mouse passeia; clicar de novo volta
const ampliado = document.createElement('div');
ampliado.className = 'ampliado';
ampliado.hidden = true;
ampliado.innerHTML = `
  <button class="pilula zoom-fechar" data-fechar-ampliado aria-label="fechar">✕</button>
  <figure class="ampliado-quadro"><div class="ampliado-midia"></div><figcaption></figcaption></figure>
  <p class="ampliado-dica">clique pra aproximar · clique de novo pra voltar</p>`;
document.body.appendChild(ampliado);
const ampliadoMidia = ampliado.querySelector('.ampliado-midia');
let playerAmpliado = null;   // vídeo com som aberto grande (usa o player.js)
function abrirAmpliado(dados) {        // { ampliar: src, tipo: 'video' | 'img', legenda, som, poster }
  if (!dados) return;
  const src = escapar(dados.ampliar);
  const comSom = dados.tipo === 'video' && dados.som;
  ampliadoMidia.innerHTML = comSom
    ? `<div class="video-som"><video class="com-som" src="${src}"${dados.poster ? ` poster="${escapar(dados.poster)}"` : ''} playsinline disablepictureinpicture></video></div>`
    : dados.tipo === 'video'
      ? `<video src="${src}" autoplay muted loop playsinline disablepictureinpicture disableremoteplayback></video>`
      : `<img src="${src}" alt="" draggable="false">`;
  ampliadoMidia.classList.toggle('com-player', !!comSom);   // com o player, clicar é tocar/pausar (não aproxima)
  ampliado.querySelector('figcaption').textContent = dados.legenda || '';
  ampliadoMidia.classList.remove('perto');
  ampliado.hidden = false;
  if (comSom) {
    const caixa = ampliadoMidia.querySelector('.video-som');
    import('./player.js').then((m) => {
      if (!caixa.isConnected) return;
      playerAmpliado = m.montarPlayer(caixa);
      caixa.querySelector('video').play().catch(() => {});   // veio de um clique: pode tocar com som
    });
  }
}
function fecharAmpliado() {
  if (ampliado.hidden) return false;
  playerAmpliado?.destruir(); playerAmpliado = null;
  ampliado.hidden = true;
  ampliadoMidia.innerHTML = '';
  return true;
}
const origemZoom = (e) => {
  const r = ampliadoMidia.getBoundingClientRect();
  ampliadoMidia.style.setProperty('--ox', `${((e.clientX - r.left) / r.width) * 100}%`);
  ampliadoMidia.style.setProperty('--oy', `${((e.clientY - r.top) / r.height) * 100}%`);
};
ampliadoMidia.addEventListener('click', (e) => {
  if (ampliadoMidia.classList.contains('com-player')) return;
  origemZoom(e); ampliadoMidia.classList.toggle('perto');
});
ampliadoMidia.addEventListener('pointermove', (e) => { if (ampliadoMidia.classList.contains('perto')) origemZoom(e); });
ampliado.addEventListener('click', (e) => {
  if (e.target === ampliado || e.target.closest('[data-fechar-ampliado]')) fecharAmpliado();
});
// Esc fecha só o ampliado (não o projeto)
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && fecharAmpliado()) e.stopImmediatePropagation();
}, true);

function fecharProjeto() {
  if (!projetoAberto) return;
  projetoAberto = null;
  galeria.classList.remove('aberta');
  galeria.setAttribute('aria-hidden', 'true');
  det.querySelectorAll('video').forEach((v) => v.pause());
  desligarVitrine();
  fecharAmpliado();
  document.documentElement.classList.remove('travado');
  document.body.classList.remove('projeto-aberto');
}

// botão de fechar / Esc / clicar fora: se abriu pela grade, volta no histórico (assim o "voltar" do
// navegador faz a mesma coisa); se chegou direto pelo link, só tira o #projeto do endereço
function fecharPeloBotao() {
  if (abertoPeloSite) {
    abertoPeloSite = false;
    history.back();
  } else {
    history.pushState('', '', location.pathname + location.search);
    seguirEndereco();
  }
}

// ---------- o endereço (#game-jam...) decide o que aparece ----------
// links antigos continuam valendo: #3d/game-jam abre o projeto e #3d desce pra grade (não tem mais filtro)
function seguirEndereco() {
  const partes = location.hash.replace('#', '').split('/').filter(Boolean);
  const projeto = partes.find((x) => PROJETOS.some((p) => p.id === x));
  if (projeto) { abrirProjeto(projeto); return; }
  fecharProjeto();
  abertoPeloSite = false;
  if (CATEGORIAS[partes[0]]) {
    history.replaceState('', '', location.pathname + location.search);
    irPraGrade();
  }
}
addEventListener('hashchange', seguirEndereco);
// se alguém abrir o site já com #projeto no link (ou der refresh numa página de projeto),
// abre direto nela, sem animação: assim os pixels do carregamento revelam a página certa, não a home.
if (location.hash) {
  document.body.classList.add('sem-transicao');
  seguirEndereco();
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('sem-transicao')));
}

// Esc: fecha o desenho aberto → fecha o projeto (← → passam os desenhos)
addEventListener('keydown', (e) => {
  if (!zoom.hidden) {
    if (e.key === 'Escape') fecharZoom();
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') abrirZoom(zoomAtual + (e.key === 'ArrowLeft' ? -1 : 1));
    return;
  }
  if (e.key === 'Escape' && projetoAberto) fecharPeloBotao();
});

// clicar no logo volta pro começo da home
document.getElementById('logo')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (projetoAberto) fecharPeloBotao();
  scrollTo({ top: 0, behavior: rolarSuave });
});
