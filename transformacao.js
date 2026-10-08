// =====================================================================
//  TROCA DE VISUAL COM FOTO (na home)
//  Botão "upload de foto" → aparece um balão de fala saindo da personagem → a pessoa escolhe uma foto
//  e confirma → ela dá o giro numa névoa de glitter (main.js) e volta com a foto como textura.
//  A foto não sai do aparelho: vira uma textura direto no navegador.
// =====================================================================

const CONFIG_FOTO = {
  dicaBotao: 'customize persocom',     // aparece ao passar o mouse no botão
  textoBalao: 'me manda uma foto que eu mudo o meu visual com ela ✦',
  textoConfirma: 'ficou assim, posso?',
  textoDepois: 'gostou? ✦',
  tamanhoTextura: 1024,     // px do lado maior da foto (mantém a proporção)
  textoProcurando: 'procurando seu rosto…',
  textoAchou: 'achei seu rosto ✦ vou encaixar ele em mim e a roupa também. posso?',
  textoSemRosto: 'não achei um rosto, então vou usar a foto inteira ✦ posso?',
  // detector de rosto (MediaPipe, o mesmo do Shader GLSL) — só carrega quando a pessoa escolhe uma foto
  mediapipe: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1',
  modeloRosto: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
};

// ícone do botão = desenho da Ana (icones/customizar.svg): bonequinha com "?" no peito
const ICONE_CUSTOMIZAR = `<svg viewBox="0 0 224.05 404.38" aria-hidden="true">
  <path fill="currentColor" d="M201.93,134.11c5.92-2.2,11.84-2.32,16.97,1.77,7.91,6.31,5.02,14.26,2.36,22.5-2.42,7.48-6.2,16-12.44,21.08-4.76,3.87-12.29,5.25-18.29,5.57-4.42,14.47-13.7,26.94-25.7,36.01-12.65,9.56-32.49,20.4-47.7,24.86-5.66,1.66-7.84.82-13.1-1.06-20.1-7.17-47.25-21.58-60-38.99-4.41-6.03-8.09-13.79-10.53-20.82-11.81-.42-19.5-4.38-25.51-14.52C4.8,165.16-.43,150.99.03,144.97c.78-10.2,13.46-15.06,22.07-10.85-1.48-16.18-5.61-32.31-3.89-48.65.9-8.52,3.59-20.28,6.24-28.46C33.5,29.12,57.89,10.42,85.99,4.17,92.29,2.77,105.76.06,111.82,0s20.54,2.81,26.63,4.16c27.71,6.15,52.69,25.54,61.23,53.14,4.67,15.1,7.62,31.18,6.19,47.04l-3.94,29.78Z"/>
  <path fill="#fff" d="M131.94,196.02c0,2.12-8.92,3.83-19.92,3.83s-19.92-1.71-19.92-3.83l5.49.34c9.58.6,19.29.6,28.87,0l5.49-.34Z"/>
  <ellipse fill="#fff" cx="68.02" cy="145.05" rx="6.67" ry="24.67"/>
  <ellipse fill="#fff" cx="156.02" cy="145.05" rx="6.67" ry="24.67"/>
  <path fill="currentColor" d="M113.47,228.38h0c31.28,0,56.67,25.39,56.67,56.67v119.33H56.8v-119.33c0-31.28,25.39-56.67,56.67-56.67Z"/>
  <path fill="#fff" d="M95.45,291.69l-7.23-7.5c2.45-3.46,5.93-6.24,10.46-8.34,4.53-2.1,9.43-3.15,14.71-3.15l-.1,9.96c-3.29,0-6.52.82-9.7,2.46-3.18,1.64-5.89,3.83-8.13,6.55ZM111.6,349.25c-2.13,0-3.96-.76-5.48-2.28-1.52-1.52-2.28-3.35-2.28-5.48s.76-4,2.28-5.5c1.52-1.5,3.35-2.25,5.48-2.25s4,.75,5.5,2.25c1.5,1.5,2.25,3.34,2.25,5.5s-.75,3.96-2.25,5.48c-1.5,1.52-3.34,2.28-5.5,2.28ZM106.25,324.3v-5.03c0-3.46.72-6.51,2.15-9.15,1.43-2.64,3.58-4.87,6.45-6.68,2.83-1.75,4.95-3.66,6.37-5.74,1.42-2.08,2.12-4.33,2.12-6.74,0-2.62-.87-4.66-2.62-6.11-1.75-1.45-4.23-2.18-7.44-2.18l.1-9.96c6.81,0,12.1,1.55,15.86,4.64,3.76,3.09,5.64,7.45,5.64,13.08,0,3.88-.97,7.41-2.91,10.59-1.94,3.18-4.85,6.01-8.73,8.49-2.24,1.47-3.92,3.07-5.03,4.8-1.12,1.73-1.68,3.63-1.68,5.69v4.3h-10.28Z"/>
</svg>`;

// ---------- elementos ----------
const botao = document.createElement('button');
botao.type = 'button';
botao.className = 'bola botao-foto';
botao.innerHTML = ICONE_CUSTOMIZAR;
botao.dataset.dica = CONFIG_FOTO.dicaBotao;
botao.setAttribute('aria-label', CONFIG_FOTO.dicaBotao);
document.body.appendChild(botao);

const balao = document.createElement('div');
balao.className = 'balao-fala';
balao.setAttribute('role', 'dialog');
balao.setAttribute('aria-label', 'trocar o visual da personagem com uma foto');
balao.hidden = true;
balao.innerHTML = `
  <button type="button" class="balao-fechar" data-fechar aria-label="fechar">✕</button>
  <p class="balao-texto"></p>
  <div class="balao-escolher">
    <label class="pilula balao-pilula">escolher foto<input type="file" accept="image/*" hidden></label>
    <button type="button" class="balao-link" data-original hidden>voltar ao normal</button>
  </div>
  <div class="balao-previa" hidden>
    <img alt="prévia da foto escolhida">
    <div class="balao-botoes">
      <button type="button" class="pilula ver-projeto balao-pilula" data-confirmar>confirmar</button>
      <button type="button" class="balao-link" data-trocar>trocar foto</button>
    </div>
  </div>
  <p class="balao-nota">a foto fica só no seu aparelho</p>
  <span class="balao-rabinho" aria-hidden="true"></span>`;
document.body.appendChild(balao);

const texto = balao.querySelector('.balao-texto');
const entrada = balao.querySelector('input[type=file]');
const escolher = balao.querySelector('.balao-escolher');
const previa = balao.querySelector('.balao-previa');
const imgPrevia = previa.querySelector('img');
const nota = balao.querySelector('.balao-nota');
const rabinho = balao.querySelector('.balao-rabinho');
const botaoOriginal = balao.querySelector('[data-original]');

let fotoEscolhida = null;     // canvas da foto (proporção original, até 1024 px)
let rostoEscolhido = null;    // { olhos: [{x,y},{x,y}], nariz, boca } em pixels da foto, ou null se não achou rosto
let urlPrevia = null;
let trocou = false;           // ela já está com uma foto (aparece "voltar ao normal")
let timerSome = 0;

// ---------- balão segue a cabeça dela ----------
let raf = 0;
function posicionar() {
  raf = requestAnimationFrame(posicionar);
  const cab = window.posicaoCabecaNaTela?.();
  if (!cab) { fechar(); return; }
  const w = balao.offsetWidth, h = balao.offsetHeight;
  const celular = innerWidth < 640;
  let x, y;
  if (celular) {             // em cima da cabeça, centralizado
    x = Math.min(Math.max(12, cab.x - w / 2), innerWidth - w - 12);
    y = Math.max(64, cab.y - h - 64);
    balao.dataset.lado = 'baixo';
    rabinho.style.left = `${Math.min(Math.max(22, cab.x - x), w - 22)}px`;
    rabinho.style.top = '';
  } else {                   // do lado direito da cabeça
    x = Math.min(cab.x + 70, innerWidth - w - 16);
    y = Math.min(Math.max(16, cab.y - h * 0.55), innerHeight - h - 16);
    balao.dataset.lado = 'esquerda';
    rabinho.style.top = `${Math.min(Math.max(22, cab.y - y), h - 22)}px`;
    rabinho.style.left = '';
  }
  balao.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
}

function abrir(msg = CONFIG_FOTO.textoBalao, { soMensagem = false } = {}) {
  clearTimeout(timerSome);
  texto.textContent = msg;
  escolher.hidden = soMensagem || !!fotoEscolhida;
  previa.hidden = soMensagem || !fotoEscolhida;
  nota.hidden = soMensagem;
  botaoOriginal.hidden = !trocou;
  balao.querySelector('[data-fechar]').hidden = soMensagem;
  balao.hidden = false;
  balao.classList.remove('saindo');
  cancelAnimationFrame(raf);
  posicionar();
}
function fechar() {
  if (balao.hidden) return;
  balao.hidden = true;
  cancelAnimationFrame(raf);
}
function limparFoto() {
  fotoEscolhida = null;
  rostoEscolhido = null;
  if (urlPrevia) URL.revokeObjectURL(urlPrevia);
  urlPrevia = null;
  entrada.value = '';
}

botao.addEventListener('click', () => {
  if (!balao.hidden && !escolher.hidden) { fechar(); return; }
  abrir();
});
balao.querySelector('[data-fechar]').addEventListener('click', () => { limparFoto(); fechar(); });
balao.querySelector('[data-trocar]').addEventListener('click', () => entrada.click());
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !balao.hidden && !document.body.classList.contains('em-galeria')) { limparFoto(); fechar(); } });

// ---------- detector de rosto (carrega uma vez, na primeira foto) ----------
let detector = null;
async function acharRosto(canvas) {
  try {
    if (!detector) {
      const { FilesetResolver, FaceDetector } = await import(`${CONFIG_FOTO.mediapipe}/vision_bundle.mjs`);
      const arquivos = await FilesetResolver.forVisionTasks(`${CONFIG_FOTO.mediapipe}/wasm`);
      detector = await FaceDetector.createFromOptions(arquivos, {
        baseOptions: { modelAssetPath: CONFIG_FOTO.modeloRosto },
        runningMode: 'IMAGE', minDetectionConfidence: 0.5,
      });
    }
    const achados = detector.detect(canvas).detections;
    if (!achados.length) return null;
    // o maior rosto da foto
    const r = achados.sort((a, b) => (b.boundingBox?.width || 0) - (a.boundingBox?.width || 0))[0];
    // pontos do rosto: 0 = olho direito da pessoa, 1 = olho esquerdo, 2 = ponta do nariz, 3 = boca
    const px = (i) => (r.keypoints[i] ? { x: r.keypoints[i].x * canvas.width, y: r.keypoints[i].y * canvas.height } : null);
    if (!px(0) || !px(1)) return null;
    return { olhos: [px(0), px(1)], nariz: px(2), boca: px(3) };
  } catch (e) {
    console.warn('detector de rosto não carregou — usando a foto inteira', e);
    return null;
  }
}

// ---------- escolheu a foto: guarda (no máx. 1024 px), procura o rosto e mostra a prévia ----------
entrada.addEventListener('change', async () => {
  const arquivo = entrada.files?.[0];
  if (!arquivo) return;
  try {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.src = url;
    await img.decode();
    const T = CONFIG_FOTO.tamanhoTextura;
    const escala = Math.min(1, T / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * escala);
    c.height = Math.round(img.naturalHeight * escala);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    if (urlPrevia) URL.revokeObjectURL(urlPrevia);
    urlPrevia = url;
    imgPrevia.src = url;
    fotoEscolhida = null;
    abrir(CONFIG_FOTO.textoProcurando, { soMensagem: true });
    const rosto = await acharRosto(c);
    fotoEscolhida = c;
    rostoEscolhido = rosto;
    abrir(rosto ? CONFIG_FOTO.textoAchou : CONFIG_FOTO.textoSemRosto);
  } catch {
    abrir('hmm, não consegui abrir essa imagem. tenta outra? ✦');
  }
});

// ---------- confirmou: gira e "veste" a foto (o encaixe é feito no main.js) ----------
async function transformar(foto, rosto) {
  fechar();
  botao.disabled = true;
  await window.transformarPersonagem?.(foto, rosto);
  botao.disabled = false;
  abrir(trocou ? CONFIG_FOTO.textoDepois : 'voltei ✦', { soMensagem: true });
  timerSome = setTimeout(fechar, 2600);
}
balao.querySelector('[data-confirmar]').addEventListener('click', () => {
  if (!fotoEscolhida) return;
  const foto = fotoEscolhida, rosto = rostoEscolhido;
  limparFoto();
  trocou = true;
  transformar(foto, rosto);
});
botaoOriginal.addEventListener('click', () => {
  trocou = false;
  limparFoto();
  transformar(null);
});

// o botão fica logo acima dos cards de categoria (que mudam de altura no celular)
const cards = document.getElementById('categorias');
function encaixarBotao() {
  const topoCards = cards ? cards.getBoundingClientRect().top : innerHeight - 160;
  botao.style.bottom = `${Math.max(16, innerHeight - topoCards + 14)}px`;
}
addEventListener('resize', encaixarBotao);
new ResizeObserver(encaixarBotao).observe(cards || document.body);
encaixarBotao();
// indo pra uma galeria, o balão some
addEventListener('virar', () => fechar());
