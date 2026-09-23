// Visualizador de UM modelo com o shader toon da Ana + barra lateral "material ↕ topologia".
// Arrastando a barra pra baixo, uma linha desce pelo personagem: acima dela aparece a malha de arame
// (as arestas de verdade, em quadrados), abaixo continua o material. Pra cima, o material volta.
// Quem monta é o projetos.js, quando o projeto tem um item { modelo3d: {...} } na lista de imagens.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const CONFIG_MODELO = {
  luz: new THREE.Vector3(-0.05, 0.74, 0.67).normalize(),   // (é trocada pela luz do arquivo da Ana, que vem no .glb)
  contornoMinPx: 0.45,        // o contorno usa a espessura real do Solidify; isso é só o mínimo em pixels
  corContorno: '#15161a',
  corArame: '#3a4a5e',
  corPreenchimento: '#eef2f7',   // "barro" claro por trás do arame
  corCorte: '#62cfe6',        // brilhinho na linha do corte
  giroSozinho: 0.3,
  sensibilidade: 0.011,
  zoomMin: 0.55, zoomMax: 1.6,
};

const draco = new DRACOLoader().setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/libs/draco/');
const carregador = new GLTFLoader().setDRACOLoader(draco);

// pedacinho comum: posição de mundo pro fragment shader (pra saber de que lado do corte está)
const VERT_MUNDO = /* glsl */`
  varying vec3 vMundo;
  varying vec3 vNormalMundo;
  varying vec2 vUv;
  void main() {
    vec4 m = modelMatrix * vec4(position, 1.0);
    vMundo = m.xyz;
    vNormalMundo = normalize(mat3(modelMatrix) * normal);
    vUv = uv;
    gl_Position = projectionMatrix * viewMatrix * m;
  }`;

// shader toon = o "experiment cel_gp" da Ana (Simple Cel Shader), reproduzido nó por nó:
//  L = luz difusa (sol × 0,2546 + mundo — valores medidos no EEVEE)
//  cor = mix(sombra, clara, smoothstep(faixa → faixa+suave))
//  linha de sombra: escurece (Brightness = "Shadow Line") a faixa logo antes da sombra ("Shadow Line Range")
//  2 brilhos (Specular BSDF GGX com a normal deslocada por Shift/Tilt, cortados pela "Hardness")
//  borda (rim): Layer Weight "Facing" → Linear Light com a cor da borda, só no lado iluminado
function materialCel(clara, sombra, info, u) {
  const c = info.cel || {};
  const b1 = c.b1 || {}, b2 = c.b2 || {}, bd = c.borda || {};
  const cor = (a, pad = [1, 1, 1]) => new THREE.Color(...(a || pad));
  // (x, y, z) do Blender → (x, z, -y) do site
  const eixo = (a) => (a ? new THREE.Vector3(a[0], a[2], -a[1]) : new THREE.Vector3());
  const ior = bd.ior ?? 0.05;
  return new THREE.ShaderMaterial({
    uniforms: {
      clara: { value: clara }, sombra: { value: sombra || clara }, temSombra: { value: sombra ? 1 : 0 },
      faixa: { value: c.faixa ?? info.cel_faixa ?? 0.1 }, suave: { value: c.suave ?? info.cel_suave ?? 0.1 },
      linha: { value: c.linha ?? 0 }, linhaFaixa: { value: c.linhaFaixa ?? 0 },
      b1Cor: { value: cor(b1.cor) }, b1Forca: { value: b1.forca ?? 0 }, b1A: { value: Math.max((b1.aspereza ?? 0.5) ** 2, 0.002) },
      b1Dureza: { value: b1.dureza ?? 1 }, b1Off: { value: eixo(b1.off) },
      b2Cor: { value: cor(b2.cor) }, b2Forca: { value: b2.forca ?? 0 }, b2A: { value: Math.max((b2.aspereza ?? 0.5) ** 2, 0.002) },
      b2Dureza: { value: b2.dureza ?? 1 }, b2Off: { value: eixo(b2.off) },
      bordaCor: { value: cor(bd.cor, [0.7, 0.7, 0.8]) }, bordaExp: { value: ior < 0.5 ? 2 * ior : 0.5 / (1 - Math.min(ior, 0.99999)) },
      bordaBlur: { value: bd.blur ?? 0.2 }, bordaSombra: { value: bd.sombra ?? 0 },
      luz: u.luz, luzForca: u.luzForca, ambiente: u.ambiente, corte: u.corte, corCorte: u.corCorte, modo: u.modo,
    },
    vertexShader: VERT_MUNDO,
    fragmentShader: /* glsl */`
      uniform sampler2D clara; uniform sampler2D sombra; uniform float temSombra;
      uniform float faixa; uniform float suave; uniform float linha; uniform float linhaFaixa;
      uniform vec3 b1Cor; uniform float b1Forca; uniform float b1A; uniform float b1Dureza; uniform vec3 b1Off;
      uniform vec3 b2Cor; uniform float b2Forca; uniform float b2A; uniform float b2Dureza; uniform vec3 b2Off;
      uniform vec3 bordaCor; uniform float bordaExp; uniform float bordaBlur; uniform float bordaSombra;
      uniform vec3 luz; uniform float luzForca; uniform float ambiente;
      uniform float corte; uniform vec3 corCorte; uniform float modo;
      varying vec3 vMundo; varying vec3 vNormalMundo; varying vec2 vUv;

      float faixaSuave(float v, float a, float b) {           // Map Range em modo Smoothstep
        float x = (b - a) > 1e-5 ? clamp((v - a) / (b - a), 0.0, 1.0) : step(a, v);
        return x * x * (3.0 - 2.0 * x);
      }
      float brilho(vec3 n, vec3 off, float a, float forca, vec3 V) {   // Specular BSDF (GGX) com o sol + reflexo do mundo
        vec3 nb = normalize(n + off);
        vec3 H = normalize(luz + V);
        float nh = max(dot(nb, H), 0.0), nl = dot(nb, luz), nv = max(dot(nb, V), 0.05);
        float a2 = a * a, d = nh * nh * (a2 - 1.0) + 1.0;
        float sol = nl > 0.0 ? luzForca * a2 / (3.14159265 * d * d) / (4.0 * nv) : 0.0;
        float mundo = ambiente * (1.0 - 0.55 * sqrt(a));
        return forca * (sol + mundo);
      }
      void main() {
        if (vMundo.y > corte) discard;                          // acima da linha: é a vez da topologia
        vec3 n = normalize(vNormalMundo);
        if (!gl_FrontFacing) n = -n;
        vec3 V = normalize(cameraPosition - vMundo);
        float L = luzForca * 0.2546 * max(dot(n, luz), 0.0) + ambiente * 0.82;
        float t = faixaSuave(L, faixa, faixa + suave);
        vec3 cl = texture2D(clara, vUv).rgb;
        vec3 sb = temSombra > 0.5 ? texture2D(sombra, vUv).rgb : cl * 0.55;
        float borda0 = 1.0 - smoothstep(0.0, 0.06, corte - vMundo.y);
        if (modo > 1.5) {                                        // só textura: a cor clara, sem luz nenhuma
          gl_FragColor = vec4(mix(cl, corCorte, borda0 * 0.85), 1.0);
          #include <colorspace_fragment>
          return;
        }
        if (modo > 0.5) { cl = vec3(0.93); sb = vec3(0.42); }  // só luz e sombra: "barro" claro e sombra cinza
        vec3 cor = mix(sb, cl, t);
        // linha de sombra
        float tl = faixaSuave(L, faixa + linhaFaixa, faixa + suave);
        float m4 = mix(t, 1.0, 1.0 - tl);
        cor = mix(max(cor + linha, 0.0), cor, clamp(m4, 0.0, 1.0));
        // 2º brilho e 1º brilho
        float s2 = brilho(n, b2Off, b2A, b2Forca, V);
        cor = mix(cor, b2Cor, clamp(-0.12 + (s2 - b2Dureza) / (1.01 - b2Dureza) * 1.12, 0.0, 1.0));
        float s1 = brilho(n, b1Off, b1A, b1Forca, V);
        cor = mix(cor, b1Cor, clamp(-0.12 + (s1 - b1Dureza) / (1.01 - b1Dureza) * 1.02, 0.0, 0.9));
        // borda (rim), Linear Light
        float facing = 1.0 - pow(abs(dot(n, V)), bordaExp);
        float fr = (facing - 0.039) / max(bordaBlur - 0.039, 1e-4) * (bordaSombra + t);
        cor = cor + clamp(fr, 0.0, 1.0) * (2.0 * bordaCor - 1.0);
        float borda = 1.0 - smoothstep(0.0, 0.06, corte - vMundo.y);   // brilhinho logo abaixo do corte
        gl_FragColor = vec4(mix(cor, corCorte, borda * 0.85), 1.0);
        #include <colorspace_fragment>
      }`,
    side: THREE.DoubleSide,
  });
}

function materialLiso(cor, u, opacidade = 1) {
  return new THREE.ShaderMaterial({
    uniforms: { cor: { value: new THREE.Color(cor) }, corte: u.corte, opacidade: { value: opacidade } },
    vertexShader: VERT_MUNDO,
    fragmentShader: /* glsl */`
      uniform vec3 cor; uniform float corte; uniform float opacidade; varying vec3 vMundo;
      void main() { if (vMundo.y > corte) discard; gl_FragColor = vec4(cor, opacidade); 
        #include <colorspace_fragment>
      }`,
    transparent: opacidade < 1, depthWrite: opacidade >= 1, side: THREE.DoubleSide,
  });
}

// contorno = o Solidify dela (casco invertido): espessura de verdade no tamanho do modelo,
// com um mínimo bem fino em pixels pra não sumir quando ela está pequena na tela
function materialContorno(u) {
  return new THREE.ShaderMaterial({
    uniforms: { espMundo: u.espContorno, minPx: { value: CONFIG_MODELO.contornoMinPx }, tela: u.tela, corte: u.corte,
      cor: { value: new THREE.Color(CONFIG_MODELO.corContorno) } },
    vertexShader: /* glsl */`
      uniform float espMundo; uniform float minPx; uniform vec2 tela; varying float vY;
      void main() {
        vec3 nm = normalize(mat3(modelMatrix) * normal);
        vec4 m = modelMatrix * vec4(position, 1.0); vY = m.y;
        vec4 c0 = projectionMatrix * viewMatrix * m;
        vec4 c1 = projectionMatrix * viewMatrix * vec4(m.xyz + nm * espMundo, 1.0);
        vec2 px = (c1.xy / c1.w - c0.xy / c0.w) * tela * 0.5;          // quantos pixels a espessura real dá
        float fator = length(px) < minPx ? minPx / max(length(px), 1e-4) : 1.0;
        gl_Position = projectionMatrix * viewMatrix * vec4(m.xyz + nm * espMundo * min(fator, 6.0), 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 cor; uniform float corte; varying float vY;
      void main() { if (vY > corte) discard; gl_FragColor = vec4(cor, 1.0);
        #include <colorspace_fragment>
      }`,
    side: THREE.BackSide,
  });
}

// parte de cima (topologia): "barro" claro que tampa as linhas de trás + as arestas por cima
function materialPreenche(u) {
  return new THREE.ShaderMaterial({
    uniforms: { corte: u.corte, luz: u.luz, cor: { value: new THREE.Color(CONFIG_MODELO.corPreenchimento) } },
    vertexShader: VERT_MUNDO,
    fragmentShader: /* glsl */`
      uniform float corte; uniform vec3 luz; uniform vec3 cor; varying vec3 vMundo; varying vec3 vNormalMundo;
      void main() {
        if (vMundo.y <= corte) discard;
        vec3 n = normalize(vNormalMundo); if (!gl_FrontFacing) n = -n;
        float l = 0.78 + 0.22 * max(dot(n, luz), 0.0);
        gl_FragColor = vec4(cor * l, 1.0);
        #include <colorspace_fragment>
      }`,
    side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
  });
}
function materialArame(u) {
  return new THREE.ShaderMaterial({
    uniforms: { corte: u.corte, cor: { value: new THREE.Color(CONFIG_MODELO.corArame) } },
    vertexShader: /* glsl */`
      varying float vY;
      void main() { vec4 m = modelMatrix * vec4(position, 1.0); vY = m.y; gl_Position = projectionMatrix * viewMatrix * m; }`,
    fragmentShader: /* glsl */`
      uniform float corte; uniform vec3 cor; varying float vY;
      void main() { if (vY <= corte) discard; gl_FragColor = vec4(cor, 0.42); 
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false,
  });
}

export function montarModelo3d(raiz, cfg) {
  raiz.innerHTML = `
    <div class="modelo-palco">
      <canvas class="modelo-cena" aria-label="modelo 3D — arraste pra girar"></canvas>
      <div class="modelo-carregando">carregando o modelo…</div>
      <div class="modelo-dica">↔ arraste pra girar</div>
      <div class="modelo-zoom"><button type="button" data-zoom="-1" aria-label="aproximar">+</button><button type="button" data-zoom="1" aria-label="afastar">−</button></div>
      <div class="modelo-camadas" role="group" aria-label="camadas do shader">
        <button type="button" data-modo="0" class="ativo">completo</button>
        <button type="button" data-modo="1">luz e sombra</button>
        <button type="button" data-modo="2">só textura</button>
        <button type="button" data-contorno class="ativo" aria-pressed="true">contorno</button>
      </div>
      <div class="modelo-luz" title="arraste o sol pra mudar a luz (duplo clique volta)">
        <div class="modelo-luz-disco"><div class="modelo-sol" aria-hidden="true">☀</div></div>
        <span>luz</span>
      </div>
      <div class="modelo-barra" role="slider" tabindex="0" aria-label="material ou topologia" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
        <span class="modelo-barra-rotulo cima">material</span>
        <div class="modelo-trilho"><div class="modelo-preenchido"></div><div class="modelo-pegador"></div></div>
        <span class="modelo-barra-rotulo baixo">topologia</span>
      </div>
    </div>`;
  const palco = raiz.querySelector('.modelo-palco');
  const canvas = raiz.querySelector('.modelo-cena');
  const aviso = raiz.querySelector('.modelo-carregando');
  const barra = raiz.querySelector('.modelo-barra');
  const trilho = raiz.querySelector('.modelo-trilho');
  const pegador = raiz.querySelector('.modelo-pegador');
  const preenchido = raiz.querySelector('.modelo-preenchido');
  const disco = raiz.querySelector('.modelo-luz-disco');
  const sol = raiz.querySelector('.modelo-sol');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const cena = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(22, 1, 0.1, 500);
  const giro = new THREE.Group(); cena.add(giro);

  const u = {
    luz: { value: CONFIG_MODELO.luz.clone() },
    corte: { value: 1e5 },                       // começa todo com material
    corCorte: { value: new THREE.Color(CONFIG_MODELO.corCorte) },
    tela: { value: new THREE.Vector2(1, 1) },
    luzForca: { value: 1 }, ambiente: { value: 0.18 },
    espContorno: { value: 0.001 },
    modo: { value: 0 },                          // 0 completo · 1 só luz e sombra · 2 só textura
  };
  const luzOriginal = new THREE.Vector3();
  const cascos = [];
  let altura = 1, fracao = 0, zoom = 1;
  let angulo = 0, velocidade = 0, arrastando = false, ultimoToque = -99, visivel = false, vivo = true, raf = 0;
  const relogio = new THREE.Clock();

  function aplicarCorte() {
    // fração 0 = linha no topo (tudo material); 1 = linha no pé (tudo topologia)
    u.corte.value = fracao <= 0.001 ? 1e5 : fracao >= 0.999 ? -1e5 : altura * (1 - fracao);
    pegador.style.top = `${fracao * 100}%`;
    preenchido.style.height = `${fracao * 100}%`;
    barra.setAttribute('aria-valuenow', Math.round(fracao * 100));
  }

  async function carregar() {
    const gltf = await carregador.loadAsync(cfg.arquivo + (cfg.versao ? `?v=${cfg.versao}` : ''));
    if (!vivo) return;
    const modelo = gltf.scene;
    const caixa = new THREE.Box3().setFromObject(modelo);
    const tam = caixa.getSize(new THREE.Vector3());
    const escala = 2 / tam.y;                     // o modelo fica com 2 de altura
    modelo.scale.setScalar(escala);
    modelo.position.set(-(caixa.min.x + tam.x / 2) * escala, -caixa.min.y * escala, -(caixa.min.z + tam.z / 2) * escala);
    altura = 2;
    const extras = [];
    modelo.traverse((o) => {
      if (o.isLineSegments || o.isLine) {
        o.material = materialArame(u); o.renderOrder = 3; o.frustumCulled = false;
        return;
      }
      if (!o.isMesh) return;
      const m = o.material, info = m.userData || {};
      const tipo = info.tipo || (m.map ? 'cel' : 'liso');
      if (tipo === 'vidro') { o.material = materialLiso('#dfe9f5', u, 0.22); o.renderOrder = 2; return; }
      // luz e contorno do arquivo dela (vêm nos extras de qualquer material)
      if (info.luz) {
        const d = info.luz.dir; u.luz.value.set(d[0], d[2], -d[1]).normalize();
        u.luzForca.value = info.luz.forca ?? 1; u.ambiente.value = info.luz.ambiente ?? 0.18;
      }
      if (info.contorno && info.altura) u.espContorno.value = info.contorno / info.altura * 2;   // o modelo aqui tem 2 de altura
      o.material = tipo === 'cel'
        ? materialCel(m.map, m.emissiveMap, info, u)
        : materialLiso(m.color ? '#' + m.color.getHexString() : '#18181b', u);
      // contorno + "barro" da parte de topologia, usando a mesma malha
      const casco = new THREE.Mesh(o.geometry, materialContorno(u)); cascos.push(casco);
      const barro = new THREE.Mesh(o.geometry, materialPreenche(u));
      extras.push([o, casco], [o, barro]);
    });
    extras.forEach(([o, e]) => o.add(e));
    luzOriginal.copy(u.luz.value);
    mostrarSol();
    giro.add(modelo);
    aviso.hidden = true;
    enquadrar();
  }

  function enquadrar() {
    const w = palco.clientWidth, h = palco.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    u.tela.value.set(w, h);
    camera.aspect = w / h;
    const d = (altura * 0.62) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / Math.min(1, camera.aspect * 1.4) * zoom;
    camera.position.set(0, altura * 0.52 + 0.1 * zoom, d);
    camera.lookAt(0, altura * (0.5 + (1 - zoom) * 0.62), 0);   // aproximando, olha mais pro rosto
    camera.updateProjectionMatrix();
  }

  // ---------- barra material ↕ topologia ----------
  function porPonteiro(e) {
    const r = trilho.getBoundingClientRect();
    fracao = THREE.MathUtils.clamp((e.clientY - r.top) / r.height, 0, 1);
    aplicarCorte();
  }
  let arrastandoBarra = false;
  barra.addEventListener('pointerdown', (e) => { arrastandoBarra = true; barra.setPointerCapture(e.pointerId); porPonteiro(e); e.preventDefault(); });
  barra.addEventListener('pointermove', (e) => { if (arrastandoBarra) porPonteiro(e); });
  barra.addEventListener('pointerup', () => { arrastandoBarra = false; });
  barra.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      fracao = THREE.MathUtils.clamp(fracao + (e.key === 'ArrowDown' ? 0.05 : -0.05), 0, 1); aplicarCorte(); e.preventDefault();
    }
  });

  // ---------- camadas do shader ----------
  raiz.querySelectorAll('[data-modo]').forEach((b) => b.addEventListener('click', () => {
    u.modo.value = Number(b.dataset.modo);
    raiz.querySelectorAll('[data-modo]').forEach((x) => x.classList.toggle('ativo', x === b));
  }));
  const botaoContorno = raiz.querySelector('[data-contorno]');
  botaoContorno.addEventListener('click', () => {
    const liga = !botaoContorno.classList.contains('ativo');
    botaoContorno.classList.toggle('ativo', liga); botaoContorno.setAttribute('aria-pressed', liga);
    cascos.forEach((c) => { c.visible = liga; });
  });

  // ---------- luz: arrastar o sol dentro do disco ----------
  // o disco é a vista de frente: centro = luz vindo de frente; borda = luz rasante; em cima = luz de cima
  function mostrarSol() {
    const d = u.luz.value;
    sol.style.left = `${50 + d.x * 50}%`; sol.style.top = `${50 - d.y * 50}%`;
    sol.classList.toggle('atras', d.z < 0);
  }
  function luzPorPonteiro(e) {
    const r = disco.getBoundingClientRect();
    let x = ((e.clientX - r.left) / r.width) * 2 - 1, y = -(((e.clientY - r.top) / r.height) * 2 - 1);
    const l = Math.hypot(x, y);
    if (l > 1) { x /= l; y /= l; }
    u.luz.value.set(x, y, Math.sqrt(Math.max(0.02, 1 - x * x - y * y))).normalize();
    mostrarSol();
  }
  let arrastandoLuz = false;
  disco.addEventListener('pointerdown', (e) => { arrastandoLuz = true; disco.setPointerCapture(e.pointerId); luzPorPonteiro(e); e.preventDefault(); });
  disco.addEventListener('pointermove', (e) => { if (arrastandoLuz) luzPorPonteiro(e); });
  disco.addEventListener('pointerup', () => { arrastandoLuz = false; });
  disco.addEventListener('dblclick', () => { u.luz.value.copy(luzOriginal); mostrarSol(); });

  // ---------- girar e zoom ----------
  let xAnt = 0;
  canvas.addEventListener('pointerdown', (e) => { arrastando = true; xAnt = e.clientX; velocidade = 0; canvas.setPointerCapture(e.pointerId); raiz.querySelector('.modelo-dica').classList.add('sumir'); });
  canvas.addEventListener('pointermove', (e) => {
    if (!arrastando) return;
    const dx = e.clientX - xAnt; xAnt = e.clientX;
    angulo += dx * CONFIG_MODELO.sensibilidade; velocidade = dx * CONFIG_MODELO.sensibilidade * 60; ultimoToque = relogio.elapsedTime;
  });
  const soltar = () => { arrastando = false; ultimoToque = relogio.elapsedTime; };
  canvas.addEventListener('pointerup', soltar); canvas.addEventListener('pointercancel', soltar);
  raiz.querySelectorAll('[data-zoom]').forEach((b) => b.addEventListener('click', () => {
    zoom = THREE.MathUtils.clamp(zoom + Number(b.dataset.zoom) * 0.2, CONFIG_MODELO.zoomMin, CONFIG_MODELO.zoomMax);
    enquadrar();
  }));

  const ro = new ResizeObserver(enquadrar); ro.observe(palco);
  let comecou = false;
  const io = new IntersectionObserver(([en]) => {
    visivel = en.isIntersecting;
    if (visivel) relogio.getDelta();
    if (visivel && !comecou) { comecou = true; carregar().catch(() => { aviso.textContent = 'não deu pra carregar o modelo 😢'; }); }
  }, { rootMargin: '300px 0px' });
  io.observe(palco);

  function quadro() {
    raf = requestAnimationFrame(quadro);
    if (!visivel || document.hidden) return;
    const dt = Math.min(relogio.getDelta(), 0.05), t = relogio.elapsedTime;
    if (!arrastando) {
      velocidade *= Math.pow(0.04, dt); angulo += velocidade * dt;
      if (t - ultimoToque > 3) angulo += CONFIG_MODELO.giroSozinho * dt;
    }
    giro.rotation.y = angulo;
    renderer.render(cena, camera);
  }
  aplicarCorte();
  quadro();

  return {
    destruir() {
      vivo = false; cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      renderer.dispose();
    },
  };
}
