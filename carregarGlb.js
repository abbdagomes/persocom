// Um só carregador de .glb pro site todo. O Draco abre "ajudantes" (workers) que guardam a memória da descompressão
// enquanto estiverem ligados: com um carregador por módulo, a página do Tony chegava a 12 deles e o iPhone derrubava a aba.
// Aqui são no máximo 4 (1 no celular), e eles desligam logo depois que acaba de carregar.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const DECODIFICADOR = 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/libs/draco/';
const CELULAR = matchMedia('(pointer: coarse)').matches;
let draco = null, carregador = null, emUso = 0, espera = 0;

export async function carregarGlb(url, aoProgredir) {
  clearTimeout(espera);
  if (!carregador) {
    draco = new DRACOLoader().setDecoderPath(DECODIFICADOR).setWorkerLimit(CELULAR ? 1 : 4);
    carregador = new GLTFLoader().setDRACOLoader(draco);
  }
  emUso++;
  try {
    return await carregador.loadAsync(url, aoProgredir);
  } finally {
    emUso--;
    if (!emUso) {
      // depois do dispose o DRACOLoader não volta a funcionar: o próximo .glb cria outro
      espera = setTimeout(() => { draco.dispose(); draco = carregador = null; }, 1500);
    }
  }
}
