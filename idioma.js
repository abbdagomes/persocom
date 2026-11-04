// O idioma do site: português ou inglês (o inglês fica no traducoes.js).
// Na primeira visita segue o navegador: português pra quem usa em português, inglês pros outros.
// Depois vale a escolha da pessoa no botão PT / EN. Um link com ?lang=en ou ?lang=pt já abre no idioma certo.
import { FRASES_EN, PROJETOS_EN } from './traducoes.js';

function guardado() {
  try { return localStorage.getItem('idioma'); } catch { return null; }
}
function guardar(valor) {
  try { localStorage.setItem('idioma', valor); } catch { /* sem armazenamento: vale só o link */ }
}

const doLink = new URLSearchParams(location.search).get('lang');
const doNavegador = (navigator.languages?.[0] || navigator.language || 'pt').toLowerCase().startsWith('pt') ? 'pt' : 'en';
export const idioma = ['pt', 'en'].includes(doLink) ? doLink : (['pt', 'en'].includes(guardado()) ? guardado() : doNavegador);
if (doLink === idioma) guardar(idioma);

// tr('frase em português') = a frase no idioma do site. Sem tradução, fica em português.
// tr('ver {x} grande', { x: nome }) troca o {x} pelo valor.
export function tr(frase, valores) {
  let texto = idioma === 'en' ? (FRASES_EN[frase] ?? frase) : frase;
  if (valores) for (const [chave, valor] of Object.entries(valores)) texto = texto.replace(`{${chave}}`, valor);
  return texto;
}

// passa pelas listas de projetos trocando só os campos de texto (nomes de arquivo e ids ficam como estão)
const CAMPOS = new Set(['nome', 'legenda', 'secao', 'rotuloAntes', 'rotuloDepois', 'frase', 'creditoTopo']);
export function traduzirDados(valor) {
  if (idioma !== 'en' || !valor || typeof valor !== 'object') return valor;
  if (Array.isArray(valor)) { valor.forEach(traduzirDados); return valor; }
  if (valor.id && PROJETOS_EN[valor.id]) Object.assign(valor, PROJETOS_EN[valor.id]);
  for (const [chave, item] of Object.entries(valor)) {
    if (chave === 'papel') continue;     // o "nome" dos desenhos é o nome do arquivo
    if (typeof item === 'string') { if (CAMPOS.has(chave)) valor[chave] = tr(item); }
    else traduzirDados(item);
  }
  return valor;
}

// ---------- os textos que já vêm no index.html ----------
if (idioma === 'en') {
  document.documentElement.lang = 'en';
  document.title = tr('Portfólio');
  document.querySelectorAll('[data-tr]').forEach((el) => { el.textContent = tr(el.textContent.trim()); });
  document.querySelectorAll('[aria-label]').forEach((el) => el.setAttribute('aria-label', tr(el.getAttribute('aria-label'))));
  document.querySelectorAll('[data-dica]').forEach((el) => { el.dataset.dica = tr(el.dataset.dica); });
}

// ---------- o botão PT / EN ----------
const botao = document.createElement('button');
botao.type = 'button';
botao.className = 'pilula idioma-botao';
botao.setAttribute('aria-label', idioma === 'en' ? tr('mudar para português') : tr('mudar para inglês'));
botao.innerHTML = `<span${idioma === 'pt' ? ' class="ativo"' : ''}>PT</span><span class="idioma-barra">/</span><span${idioma === 'en' ? ' class="ativo"' : ''}>EN</span>`;
botao.addEventListener('click', () => {
  guardar(idioma === 'en' ? 'pt' : 'en');
  const url = new URL(location.href);
  url.searchParams.delete('lang');     // senão o link mandaria mais que a escolha
  location.replace(url);
  // só o #projeto mudou? o navegador não recarrega sozinho
  if (url.href === location.href) location.reload();
});
document.body.appendChild(botao);
