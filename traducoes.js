// =====================================================================
//  O SITE EM INGLÊS: todo o inglês fica aqui.
//  PRA EDITAR: troque só o texto da direita (o inglês).
//  Se mudar uma frase em português em outro arquivo, mude também a da esquerda aqui;
//  frase sem par aqui aparece em português mesmo no site em inglês (nada quebra).
// =====================================================================

// a fala dela no "sobre mim", na mesma ordem do sobre.js
export const SOBRE_EN = [
  'Hi! ✦',
  "I'm Ana Beatriz (Persocom), a visual designer and multidisciplinary artist based in São Paulo.",
  'My relationship with making things began in childhood through drawing, always with a lot of encouragement from my family.',
  'I chose Design looking for stability and a solid foundation. Client projects gave me discipline; personal ones gave me room to experiment.',
  'It was in that back and forth that I discovered 3D modeling and generative art, which are now my main focus.',
  'Today I work at the intersection of digital art, technology and internet culture, developing a hands-on research practice that '
    + 'brings together graphic communication, 3D additive manufacturing, mixed illustration and interactive experiences.',
];

// o texto de cada projeto, pelo id dele no projetos.js
export const PROJETOS_EN = {
  'boneca-lovecore': {
    titulo: 'Love is Survival',
    texto: 'A 1.80 m sculpture modeled in 3D and printed at large scale for the set design of Lovecore 7, a party by the '
      + 'REBU DIGITAL collective that brings together over 500 people per edition. The work ran from modeling and splitting the '
      + 'piece into parts for printing to assembly, internal reinforcement and finishing. The scene was also recreated in 3D, '
      + 'with light and material tuned so the render imitates the real photo of the piece.',
  },
  'shader-glsl': {
    texto: 'Interactive installation built in TouchDesigner with custom GLSL shaders for the set design of Lovecore 6, a party '
      + 'by the REBU DIGITAL collective. The camera image turns, in real time, into a mosaic of small images, and the audience '
      + "changes the size of the squares with a pinch of the hand. The night's international acts were Dinamarca (co-founder of "
      + 'Staycore) and the Mexican trio METH MATH; Lovecore brings together over 500 people per edition.',
  },
  'game-jam': {
    texto: "8 3D characters created in 4 days for Tony Matrimony, a game made at GMTK Game Jam 2026, one of the world's largest "
      + 'independent game marathons, with more than 10,000 projects. To meet the deadline, the process began with quick blocking '
      + "of the volumes, without losing the cast's visual unity, and the models were optimized for the engine (clean topology, "
      + 'light textures and simple rigs). The game placed 94th in the Art category.',
  },
  'menina-polvo': {
    titulo: 'Octopus Girl',
    texto: 'A 3D character study, modeled and animated from a drawing, with toon shaders that imitate the line and volume of '
      + '2D drawing. The idea was to bring the expressiveness of traditional illustration into 3D, ending in an animation '
      + 'with the fluidity and charm of a cartoon.',
  },
  immortan: {
    titulo: 'Immortan Pendant',
    texto: '"Immortan" whistle pendant, created for the brand UMS 458, with skulls on the sides and covered in spikes. I modeled '
      + 'the piece from scratch in 3D, printed it and finished it by hand. It was released in two sizes, in black and silver.',
  },
  'cyber-dance': {
    texto: 'An original character modeled and animated in 3D, in a study of shader and movement. The dance was animated based on '
      + 'the choreography of "Cyber Dance", and custom materials go along with sets that change pattern and color. In '
      + 'post-production, done in After Effects, the video got its baroque frame and final effects.',
  },
  rocca: {
    texto: "Character and texture study. I modeled and textured Rocca in 3D based on Akihito Tsukushi's illustration for Gears "
      + "Maiden, trying to carry the drawing's details and colors into volume.",
  },
  'garotas-3d': {
    titulo: 'Mist Dolls',
    texto: 'A series of compositions and animations with 4 original 3D characters. The starting point was the anime aesthetic; '
      + 'along the way, textures gave way to depth maps, and color came to say what is near and what is far. The result is a '
      + 'graphic, colorful and playful series.',
  },
  sinapse: {
    texto: 'A collaborative website that invites you to experience São Paulo through the five senses. The name comes from the '
      + 'synapse, the connection between neurons through which nerve impulses travel: that is how every sensory experience happens '
      + 'in the body. With layered images, a visual filter for each sense and interactive games, the platform invites you to mix '
      + "stimuli the way it happens in the city's everyday life. The project covered the concept, the logo (the highlighted \"S\" "
      + 'and "P" are the initials of São Paulo), the web experience and the promotional posters.',
  },
  cynth: {
    texto: 'Cynth is a display typeface created as a duo, with expanded proportions, strong weight contrast and teardrop-shaped '
      + 'counters (simple and elongated). It is a complete family: uppercase and lowercase, numerals, accents, punctuation and a '
      + 'large set of symbols. The typeface presentation got motion and interactive pieces made in TouchDesigner.',
  },
  'revista-espm': {
    texto: 'Boca Boca is a magazine about immigrant restaurants in São Paulo. As a team, we created the editorial concept, the '
      + "visual identity and the graphic design of the first issue, dedicated to Latin America, as well as the brand's "
      + 'presentation video.',
  },
  desenhos: { titulo: 'Drawings' },
  'emoji-lab': {
    texto: 'A series of 8 original emojis that take apart the classic emoji silhouette. Each piece is a digital collage between '
      + 'vector and 3D render, with disco ball reflections, glow, metal and liquid textures; some got a looping animation.',
  },
};

// todas as outras frases: português → inglês
export const FRASES_EN = {
  // ---------- a página ----------
  'Portfólio': 'Portfolio',
  'sobre mim': 'about me',
  'Projetos': 'Projects',
  'projetos': 'projects',
  'descer pros projetos': 'go down to the projects',
  'contato': 'contact',
  '✉ contato': '✉ contact',
  '☰ currículo': '☰ résumé',
  '⌃ voltar pro começo': '⌃ back to the top',
  '✓ e-mail copiado': '✓ email copied',
  'carregando': 'loading',
  'mudar para inglês': 'switch to English',
  'mudar para português': 'switch to Portuguese',

  // ---------- categorias ----------
  'ilustração': 'illustration',

  // ---------- página de projeto ----------
  'fechar': 'close',
  '‹ todos os projetos': '‹ all projects',
  'ver projeto ↗': 'view project ↗',
  'ver mais imagens': 'see more images',
  '⌃ voltar pro topo': '⌃ back to the top',
  'ver de perto': 'see up close',
  '⤢ ver de perto': '⤢ see up close',
  'post do Instagram': 'Instagram post',
  'clique pra aproximar · clique de novo pra voltar': 'click to zoom in · click again to go back',
  'desenho': 'drawing',
  'desenho anterior': 'previous drawing',
  'próximo desenho': 'next drawing',
  'anterior': 'previous',
  'próximo': 'next',

  // ---------- legendas e títulos dos projetos ----------
  'foto': 'photo',
  'render 3D': '3D render',
  'processo': 'process',
  'mídias': 'media',
  'teste você: ligue a câmera e faça pinça com a mão — abrindo, os quadrados crescem; fechando, diminuem':
    'try it yourself: turn on the camera and pinch with your hand: opening makes the squares grow, closing makes them shrink',
  'vídeo: @rebudigital': 'video: @rebudigital',
  'bastidores: a rede do shader GLSL no TouchDesigner': 'behind the scenes: the GLSL shader network in TouchDesigner',
  'o elenco completo do casamento': 'the full wedding cast',
  'o elenco em 3D — arraste pra girar, troque de personagem e estoure as bolhas de expressão':
    'the cast in 3D: drag to rotate, switch characters and pop the expression bubbles',
  'o cenário do jogo em 3D — clique em "explorar" pra girar, mover e dar zoom':
    'the game set in 3D: click "explore" to rotate, move and zoom',
  'render final': 'final render',
  'o modelo em 3D com o shader — gire, arraste o sol pra mudar a luz, veja cada camada do shader e desça a barra pra ver a topologia':
    'the 3D model with the shader: rotate it, drag the sun to change the light, see each shader layer and slide the bar down to see the topology',
  'animação: ela sentando': 'animation: her sitting down',
  'foto: UMS 458': 'photo: UMS 458',
  'em uso': 'in use',
  'a referência: ilustração de Akihito Tsukushi, Gears Maiden': 'the reference: illustration by Akihito Tsukushi, Gears Maiden',
  'o capacete': 'the helmet',
  'profundidade': 'depth',
  'o logo trocando letras por objetos da cidade (Juliana Nakashima)': 'the logo swapping letters for objects from the city (Juliana Nakashima)',
  'um filtro pra cada sentido: visão (vibrance), tato (bordas rasgadas), olfato (desfoque), audição (ruído) e paladar (vidro)':
    'a filter for each sense: sight (vibrance), touch (torn edges), smell (blur), hearing (noise) and taste (glass)',
  'cartazes de divulgação': 'promotional posters',
  'motion dos cartazes (Juliana Nakashima)': 'poster motion (Juliana Nakashima)',
  'os bojos em gota: gota elongada (k, a) e em forma de gota (p, d)': 'the teardrop bowls: elongated teardrop (k, a) and teardrop shape (p, d)',
  'teste a Cynth: digite na janelinha — o ✕ fecha e ela volta em outra cor': 'try Cynth: type in the little window; the ✕ closes it and it comes back in another color',
  'o grid do TouchDesigner em 3D: perto do mouse as letras crescem e embaralham, e ele vira bloco / esfera e volta — arraste pra girar':
    'the TouchDesigner grid in 3D: near the mouse the letters grow and scramble, and it turns into a block / sphere and back; drag to rotate',
  'bastidores: a rede do grid no TouchDesigner': 'behind the scenes: the grid network in TouchDesigner',
  'bastidores: a rede das abas no TouchDesigner': 'behind the scenes: the tabs network in TouchDesigner',
  'folheie a revista: clique pra abrir · clique nos lados, arraste ou use ← → pra virar · 2 cliques (ou a lupa) amplia pra ler':
    'flip through the magazine: click to open · click the sides, drag or use ← → to turn · double-click (or the magnifier) to zoom in and read',
  'conceituação · universo gráfico': 'concept · graphic universe',
  'área de proteção e aplicações': 'clear space and applications',
  'tagline e ícones': 'tagline and icons',
  'elementos de apoio': 'supporting elements',
  'diagramação': 'layout',
  'bastidores: páginas do manual do projeto gráfico — clique pra ver grande': 'behind the scenes: pages from the graphic design manual; click to see them large',
  'o vídeo de apresentação da marca e da revista (com som)': 'the brand and magazine presentation video (with sound)',
  'a série: clique em um pra ver grande — os marcados como "animado" se mexem em loop': 'the series: click one to see it large; the ones marked "animated" move in a loop',
  'palhaço': 'clown',
  'globo de festa': 'disco ball',
  'robô-gatinho': 'robot kitten',
  'bolinha rosa': 'pink ball',
  'cabecinha': 'little head',
  'cristal': 'crystal',

  // ---------- os personagens do Tony Matrimony ----------
  'o fotógrafo do casamento (e o herói do jogo)': 'the wedding photographer (and the hero of the game)',
  'a noiva': 'the bride',
  'só quer a foto perfeita': 'just wants the perfect photo',
  'o noivo': 'the groom',
  'nervoso desde o "sim"': 'nervous since the "I do"',
  'a convidada': 'the guest',
  'de olho no buquê': 'eyeing the bouquet',
  'o convidado': 'the other guest',
  'veio pelo bolo': 'came for the cake',
  'a menina': 'the girl',
  'daminha oficial': 'official flower girl',
  'o menino': 'the boy',
  'pajem por obrigação': 'ring bearer under protest',
  'o palhaço': 'the clown',
  'ninguém sabe quem convidou': 'nobody knows who invited him',
  'feliz': 'happy',
  'muito feliz': 'very happy',
  'fofura': 'cuteness',
  'sem expressão': 'expressionless',
  'triste': 'sad',
  'bravo': 'angry',
  'chocado': 'shocked',
  'bêbado': 'drunk',

  // ---------- modelos 3D ----------
  'aproximar': 'zoom in',
  'afastar': 'zoom out',
  '↔ arraste pra girar': '↔ drag to rotate',
  'carregando o modelo…': 'loading the model…',
  'carregando…': 'loading…',
  'não deu pra carregar o modelo': "couldn't load the model",
  'não deu pra carregar o modelo 😢': "couldn't load the model 😢",
  'não deu pra carregar 😢': "couldn't load it 😢",
  'o colar em 3D — arraste pra girar': 'the necklace in 3D: drag to rotate',
  'cor da peça': 'color of the piece',
  'preto': 'black',
  'prata': 'silver',
  'as peças da escultura em 3D — arraste pra girar': 'the sculpture pieces in 3D: drag to rotate',
  'montada ou em peças': 'assembled or in pieces',
  'montada': 'assembled',
  'peças': 'pieces',
  'modelo 3D — arraste pra girar': '3D model: drag to rotate',
  'camadas do shader': 'shader layers',
  'completo': 'full',
  'luz e sombra': 'light and shadow',
  'só textura': 'texture only',
  'contorno': 'outline',
  'arraste o sol pra mudar a luz (duplo clique volta)': 'drag the sun to change the light (double-click resets)',
  'luz': 'light',
  'material ou topologia': 'material or topology',
  'topologia': 'topology',
  'a peça': 'the piece',
  '{x} em 3D — arraste pra girar': '{x} in 3D: drag to rotate',

  // ---------- comparar ----------
  'comparar as duas imagens': 'compare the two images',

  // ---------- currículo ----------
  'Currículo de Ana Beatriz Gomes Bueno': 'Résumé of Ana Beatriz Gomes Bueno',
  '↓ baixar': '↓ download',

  // ---------- cenário do jogo ----------
  'cenário do jogo em 3D': 'the game set in 3D',
  'carregando o casamento…': 'loading the wedding…',
  '▶ explorar a cena': '▶ explore the scene',
  'arraste pra girar · botão direito ou dois dedos pra mover · roda/pinça pra zoom': 'drag to rotate · right button or two fingers to move · wheel/pinch to zoom',
  '✕ sair': '✕ exit',
  'não deu pra carregar o cenário 😢': "couldn't load the set 😢",

  // ---------- cartela ----------
  'animado': 'animated',
  'ver {x} grande': 'see {x} large',

  // ---------- Cynth ----------
  'formato do grid': 'grid format',
  'cor das peças': 'color of the pieces',
  'cor': 'color',
  'bolinhas': 'dots',
  'quadradinhos': 'squares',
  'passe o mouse pelas letras · arraste pra girar em 3D · 2 cliques volta': 'move the mouse over the letters · drag to rotate in 3D · double-click to reset',
  'verde-limão': 'lime green',
  'rosa': 'pink',
  'azul': 'blue',
  'cinza': 'gray',
  'acentos': 'accents',
  'fechar a janela (ela volta em outra cor)': 'close the window (it comes back in another color)',
  'digite pra testar a fonte Cynth': 'type to try the Cynth typeface',
  'cor da janela': 'window color',
  'tamanho': 'size',
  'tamanho da letra': 'letter size',

  // ---------- Garotas 3D ----------
  'personagem 3D colorida pela profundidade': '3D character colored by depth',
  'escolher a personagem': 'choose the character',
  'personagem': 'character',
  'cor do ponto escolhido': 'color of the selected point',
  'adicionar um ponto': 'add a point',
  'tirar o ponto escolhido': 'remove the selected point',
  'arraste pra girar: o que chega perto clareia': 'drag to rotate: whatever comes closer gets lighter',
  'ponto da rampa': 'ramp point',

  // ---------- mosaico ----------
  'meu mosaico': 'my mosaic',
  'mosaico de fotos ao vivo': 'live photo mosaic',
  'escolher o shader': 'choose the shader',
  '▶ ligar câmera': '▶ turn on camera',
  'faça pinça com a mão pra mudar o tamanho dos quadrados · a imagem fica só no seu aparelho': 'pinch with your hand to change the size of the squares · the image stays on your device',
  'quadrados': 'squares',
  'tirar foto do mosaico': 'take a photo of the mosaic',
  '✕ sair da câmera': '✕ exit camera',
  'trocar câmera (frontal / traseira)': 'switch camera (front / back)',
  'trocar entre câmera frontal e traseira': 'switch between front and back camera',
  'não deu pra trocar de câmera': "couldn't switch camera",
  'ligando…': 'turning on…',
  '✋ mostre a mão e faça pinça': '✋ show your hand and pinch',
  'não deu pra ligar a câmera — o mosaico continua nas listras arco-íris': "couldn't turn on the camera; the mosaic stays on the rainbow stripes",
  'o rastreio da mão não carregou — use a barrinha pra mudar o tamanho': "hand tracking didn't load; use the slider to change the size",
  'não deu pra carregar as fotos 😢': "couldn't load the photos 😢",

  // ---------- papel dos desenhos ----------
  'desenhos': 'drawings',
  'arraste pra explorar · toque num desenho': 'drag to explore · tap a drawing',
  'arraste pra explorar · clique num desenho': 'drag to explore · click a drawing',

  // ---------- pastinha ----------
  'ver grande': 'see large',
  'abrir a pasta {x}': 'open the {x} folder',
  'guardar a pasta {x}': 'close the {x} folder',
  'clique na pasta': 'click the folder',
  'clique pra ver grande · na pasta pra guardar': 'click to see large · click the folder to put away',

  // ---------- pintar ----------
  'pinte ela ✦  arraste fora dela pra girar · rodinha do mouse = zoom': 'paint her ✦  drag outside her to rotate · mouse wheel = zoom',
  'pronto!': 'done!',
  'confirmar a pintura': 'confirm the painting',
  'voltar o último traço': 'undo the last stroke',
  'apagar tudo': 'erase everything',
  'apagar toda a pintura': 'erase the whole painting',
  'espessura do lápis': 'pencil thickness',
  'cores': 'colors',
  'menta': 'mint',
  'verde': 'green',
  'amarelo': 'yellow',
  'branco': 'white',
  'laranja': 'orange',
  'vermelho': 'red',
  'roxo': 'purple',

  // ---------- player de vídeo ----------
  'tocar': 'play',
  'pausar': 'pause',
  'posição do vídeo': 'video position',
  'tirar o som': 'mute',
  'ligar o som': 'unmute',
  'tela cheia': 'fullscreen',
  'sair da tela cheia': 'exit fullscreen',

  // ---------- revista ----------
  'revista Boca Boca em 3D': 'Boca Boca magazine in 3D',
  'clique pra abrir e folhear': 'click to open and flip through',
  'página anterior': 'previous page',
  'próxima página': 'next page',
  'capa': 'cover',
  'contracapa': 'back cover',
  'ampliar pra ler': 'zoom in to read',
  'ampliar pra ler (ou 2 cliques na página)': 'zoom in to read (or double-click the page)',
  'fechar ✕': 'close ✕',

  // ---------- sobre mim ----------
  'sobre a Ana Beatriz': 'about Ana Beatriz',
  'ler tudo': 'read all',

  // ---------- elenco do Tony ----------
  'personagem em 3D — arraste pra girar': 'character in 3D: drag to rotate',
  'personagem anterior': 'previous character',
  'próximo personagem': 'next character',
};
