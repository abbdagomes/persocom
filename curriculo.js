// O currículo: clicando em "currículo", ela toca a animação do Blender (persocom rig.blend, quadros 356 a 386),
// mostra o papel com o currículo e o papel cresce e vem pra frente, pra pessoa ler ou baixar.
// A animação fica num arquivo separado (curriculo/animacao.glb, 150 KB): só o movimento e o papel, sem a personagem.
import * as THREE from 'three';
import { carregarGlb } from './carregarGlb.js';
import { tr, idioma } from './idioma.js';

// cada idioma tem o seu currículo (o inglês sai de .claude/ferramentas/gerar_curriculo_en.py)
const EM_INGLES = idioma === 'en';
const CONFIG_CURRICULO = {
  animacao: 'curriculo/animacao.glb?v=1',
  papel: EM_INGLES ? 'curriculo/papel-en.webp' : 'curriculo/papel.webp',   // a folha pequena, que ela segura
  folha: EM_INGLES ? 'curriculo/folha-en.webp' : 'curriculo/folha.webp',   // a folha grande, pra ler
  pdf: EM_INGLES ? 'curriculo-en.pdf' : 'curriculo.pdf',
  nomeDoArquivo: EM_INGLES ? 'Resume Ana Beatriz Gomes Bueno.pdf' : 'Curriculo Ana Beatriz Gomes Bueno.pdf',
  quadroInicial: 356,
  quadroDoPapel: 374,                      // antes disso o papel está escondido atrás dela
  fps: 24,
  velocidadeVoltando: 1.4,                 // ela guarda o papel um pouco mais rápido do que mostra
  // chaves do rosto no Blender: o site cuida das bocas e da piscada, então elas ficam aqui (quadro, valor)
  bocaO: [[356, 0], [359, 0.68], [370, 0.76], [374, 0]],
  piscada: [[366, 0], [367, 1], [369, 0]],
};
const C = CONFIG_CURRICULO;

// valor de uma lista de chaves num certo quadro, em linha reta entre as chaves
function valorNoQuadro(chaves, quadro) {
  if (quadro <= chaves[0][0]) return chaves[0][1];
  for (let i = 1; i < chaves.length; i++) {
    const [q1, v1] = chaves[i];
    if (quadro > q1) continue;
    const [q0, v0] = chaves[i - 1];
    return v0 + (v1 - v0) * ((quadro - q0) / (q1 - q0));
  }
  return chaves[chaves.length - 1][1];
}

export function montarCurriculo({ camera, personagem }) {
  const ui = document.createElement('div');
  ui.className = 'curriculo';
  ui.hidden = true;
  ui.innerHTML = `
    <div class="curriculo-fundo"></div>
    <div class="curriculo-rolagem">
      <img class="curriculo-folha" alt="${tr('Currículo de Ana Beatriz Gomes Bueno')}" draggable="false">
    </div>
    <div class="curriculo-barra">
      <a class="pilula" href="${C.pdf}" download="${C.nomeDoArquivo}">${tr('↓ baixar')}</a>
      <button type="button" class="pilula curriculo-fechar" aria-label="${tr('fechar')}">✕</button>
    </div>`;
  document.body.appendChild(ui);
  const folha = ui.querySelector('.curriculo-folha');
  const rolagem = ui.querySelector('.curriculo-rolagem');
  const botaoFechar = ui.querySelector('.curriculo-fechar');

  // ---------- carrega a animação e o papel depois que o site já abriu (não pesa na entrada) ----------
  let papel = null, acao = null, pronto = null;
  function carregar() {
    pronto ??= Promise.all([
      carregarGlb(C.animacao),
      new THREE.TextureLoader().loadAsync(C.papel),
    ]).then(([gltf, textura]) => {
      papel = gltf.scene.getObjectByName('Plane');
      // o papel olha pra câmera pelo lado de trás da malha: sem inverter, o texto saía espelhado
      textura.colorSpace = THREE.SRGBColorSpace;
      textura.flipY = false;
      textura.repeat.set(-1, 1);
      textura.offset.set(1, 0);
      textura.anisotropy = 4;
      papel.material = new THREE.MeshBasicMaterial({ map: textura, side: THREE.DoubleSide, toneMapped: false });
      papel.frustumCulled = false;
      papel.visible = false;
      personagem.raiz.add(papel);
      // a animação do papel começa no quadro em que ele sai de trás dela: encaixa no tempo do resto
      const atraso = (C.quadroDoPapel - C.quadroInicial) / C.fps;
      // (clone: as trilhas do papel dividem a mesma lista de tempos, e sem ele o atraso somava 3 vezes)
      const trilhas = gltf.animations.flatMap((a) => (a.name === 'PlaneAction' ? a.tracks.map((t) => t.clone().shift(atraso)) : a.tracks));
      acao = personagem.mixer.clipAction(new THREE.AnimationClip('curriculo', -1, trilhas));
      acao.setLoop(THREE.LoopOnce, 1);
      acao.clampWhenFinished = true;
      acao.setEffectiveWeight(0);
      personagem.acaoCurriculo = acao;
    });
    return pronto;
  }
  const quandoOcioso = window.requestIdleCallback || ((f) => setTimeout(f, 1500));
  quandoOcioso(() => carregar().catch(() => {}));

  // ---------- a folha grande sai de onde o papel está nas mãos dela ----------
  const _p = new THREE.Vector3();
  function retanguloDoPapel() {
    papel.updateWorldMatrix(true, false);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    // os 4 cantos da malha (no .glb o plano fica deitado: X e Z, altura zero)
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      _p.set(x, 0, z).applyMatrix4(papel.matrixWorld).project(camera);
      const sx = (_p.x + 1) / 2 * innerWidth, sy = (1 - _p.y) / 2 * innerHeight;
      x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
    }
    return { left: x0, top: y0, width: x1 - x0, height: y1 - y0 };
  }
  // a transformação que faz a folha (no lugar final dela) parecer estar no retângulo r
  function transformacaoAte(r) {
    const f = folha.getBoundingClientRect();
    const cx = r.left + r.width / 2 - (f.left + f.width / 2);
    const cy = r.top + r.height / 2 - (f.top + f.height / 2);
    return `translate(${cx}px, ${cy}px) scale(${r.width / f.width}, ${r.height / f.height})`;
  }

  // ---------- abrir / fechar ----------
  // fechado → tocando (a animação) → aberto (a folha grande na tela) → voltando (ela guarda o papel) → fechado
  let estado = 'fechado', linkDeOrigem = null, vez = 0;
  const ligarRosto = (ligar) => { personagem.curriculoRosto = ligar ? atualizarRosto : null; };

  async function abrir(link) {
    if (estado !== 'fechado') return;
    estado = 'tocando';
    const estaVez = ++vez;
    linkDeOrigem = link;
    if (document.body.classList.contains('sobre-aberto')) document.querySelector('.sobre [data-fechar]')?.click();
    scrollTo({ top: 0, behavior: 'instant' });
    document.documentElement.classList.add('travado');
    ui.hidden = false;                 // transparente: só segura os cliques enquanto ela anima
    folha.src ||= C.folha;
    const folhaPronta = folha.decode().catch(() => {});

    let comAnimacao = !personagem.pintando && !personagem.girando;
    if (comAnimacao) {
      try { await carregar(); } catch { comAnimacao = false; }
    }
    if (estaVez !== vez) return;
    if (!comAnimacao) {                // sem a animação (ela ocupada ou arquivo sem carregar): abre a folha direto
      await folhaPronta;
      if (estaVez === vez) mostrarFolha(null);
      return;
    }
    acao.reset();
    acao.timeScale = 1;
    acao.play();
    personagem.curriculoTocando = true;
    ligarRosto(true);
    folhaEsperada = folhaPronta;
  }

  let folhaEsperada = null;
  function mostrarFolha(origem) {
    estado = 'aberto';
    folha.style.transition = 'none';
    ui.classList.add('visivel-folha');   // antes de medir: escondida, a folha mede zero
    folha.style.transform = origem ? transformacaoAte(origem) : 'scale(.92)';
    folha.style.opacity = origem ? '1' : '0';
    folha.getBoundingClientRect();     // aplica a posição inicial antes de animar
    folha.style.transition = '';
    if (papel) papel.visible = false;
    requestAnimationFrame(() => {
      ui.classList.add('aberto');
      folha.style.transform = '';
      folha.style.opacity = '';
      botaoFechar.focus({ preventScroll: true });
    });
  }

  function fechar() {
    if (estado !== 'aberto') return;
    estado = 'voltando';
    ui.classList.remove('perto');
    rolagem.scrollTo(0, 0);
    ui.classList.remove('aberto');
    const comAnimacao = personagem.curriculoTocando && papel;
    if (comAnimacao) folha.style.transform = transformacaoAte(retanguloDoPapel());
    else { folha.style.transform = 'scale(.92)'; folha.style.opacity = '0'; }
    let feito = false;
    const fim = () => {
      if (feito || estado !== 'voltando') return;
      feito = true;
      ui.classList.remove('visivel-folha');
      folha.style.transform = folha.style.opacity = '';
      ui.hidden = true;
      if (comAnimacao) {               // devolve o papel pras mãos e toca a animação ao contrário
        papel.visible = true;
        acao.paused = false;
        acao.timeScale = -C.velocidadeVoltando;
      } else terminar();
    };
    folha.addEventListener('transitionend', fim, { once: true });
    setTimeout(fim, 600);              // garantia: se a transição não avisar
  }

  function terminar() {
    estado = 'fechado';
    personagem.curriculoTocando = false;
    ligarRosto(false);
    if (papel) papel.visible = false;
    document.documentElement.classList.remove('travado');
    linkDeOrigem?.focus?.({ preventScroll: true });
    linkDeOrigem = null;
  }

  // ---------- o rosto das chaves do Blender (a boca em "o" e a piscada) ----------
  function atualizarRosto() {
    if (!acao) return;
    const quadro = C.quadroInicial + acao.time * C.fps;
    const peso = personagem.pesoCurriculo;
    const o = valorNoQuadro(C.bocaO, quadro) * peso;
    const pisca = valorNoQuadro(C.piscada, quadro) * peso;
    for (const { malha, indices } of personagem.bocaAlvos) {
      if (indices[2] !== undefined) malha.morphTargetInfluences[indices[2]] = Math.max(malha.morphTargetInfluences[indices[2]], o);
    }
    for (const { malha, indice } of personagem.piscaAlvos) {
      malha.morphTargetInfluences[indice] = Math.max(malha.morphTargetInfluences[indice], pisca);
    }
  }

  // ---------- cliques ----------
  // clique normal = a animação; com Ctrl/Cmd ou botão do meio, o navegador abre o PDF numa aba, como qualquer link
  document.addEventListener('click', (e) => {
    const link = e.target.closest?.('[data-curriculo]');
    if (!link || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    abrir(link);
  });
  ui.addEventListener('click', (e) => {
    if (estado !== 'aberto') return;
    if (e.target.closest('.curriculo-fechar')) { fechar(); return; }
    if (e.target.closest('a')) return;
    if (e.target === folha) {
      // clicar na folha aproxima (no celular é o jeito de ler: a pinça é desligada no site) e rola até onde clicou
      const r = folha.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      const perto = ui.classList.toggle('perto');
      if (perto) {
        const n = folha.getBoundingClientRect();
        rolagem.scrollTo(n.width * px - rolagem.clientWidth / 2, n.height * py - rolagem.clientHeight / 2);
      }
      return;
    }
    fechar();                          // clicou fora da folha
  });
  addEventListener('keydown', (e) => {
    if (estado === 'fechado') return;
    if (e.key === 'Escape') { e.stopImmediatePropagation(); fechar(); }
  }, true);

  return {
    atualizar() {
      if (!personagem.curriculoTocando || !acao) return;
      const quadro = C.quadroInicial + acao.time * C.fps;
      if (estado === 'tocando') {
        papel.visible = quadro >= C.quadroDoPapel;
        // chegou no fim: a folha grande assume (assim que estiver carregada)
        if (acao.paused && folhaEsperada) {
          const esperada = folhaEsperada;
          folhaEsperada = null;
          esperada.then(() => { if (estado === 'tocando') mostrarFolha(retanguloDoPapel()); });
        }
      } else if (estado === 'voltando' && acao.timeScale < 0) {
        papel.visible = quadro >= C.quadroDoPapel;
        if (acao.time <= 0 || acao.paused) terminar();
      }
    },
  };
}
