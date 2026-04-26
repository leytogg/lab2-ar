import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// 1. СЦЕНА
const scene = new THREE.Scene();

// 2. КАМЕРА
const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.01,
  20
);

// 3. РЕНДЕРЕР
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

// 4. КНОПКА AR
document.body.appendChild(
  ARButton.createButton(renderer, {
    requiredFeatures: [],
    optionalFeatures: ['dom-overlay'],
    domOverlay: { root: document.body }
  })
);

// 5. ОСВІТЛЕННЯ
const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1.4);
scene.add(hemisphereLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(2, 3, 2);
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

// 6. ЗМІННА ДЛЯ МОДЕЛІ
let guitarModel = null;

// 7. ЗАВАНТАЖЕННЯ GLTF-МОДЕЛІ
const loader = new GLTFLoader();

loader.load(
  '/models/guitar/scene.gltf',

  // якщо модель успішно завантажилась
  function (gltf) {
    guitarModel = gltf.scene;

    // масштаб моделі
    guitarModel.scale.set(0.4, 0.4, 0.4);

    // розміщення перед користувачем
    guitarModel.position.set(0, -0.2, -1.8);

    // початковий поворот
    guitarModel.rotation.y = Math.PI;

    // проходимося по всіх дочірніх елементах моделі
    guitarModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        // якщо хочеш, щоб модель краще реагувала на світло
        if (child.material) {
          child.material.side = THREE.DoubleSide;
        }
      }
    });

    scene.add(guitarModel);
    console.log('Модель гітари успішно завантажена');
  },

  // прогрес завантаження
  function (xhr) {
    console.log((xhr.loaded / xhr.total * 100).toFixed(2) + '% loaded');
  },

  // якщо виникла помилка
  function (error) {
    console.error('Помилка завантаження моделі:', error);
  }
);

// 8. АНІМАЦІЯ
function animate() {
  renderer.setAnimationLoop(render);
}

function render() {
  const time = performance.now() * 0.001;

  // якщо модель вже завантажилась, анімуємо її
  if (guitarModel) {
    // плавне обертання
    guitarModel.rotation.y += 0.01;

    // легке похитування
    guitarModel.rotation.z = Math.sin(time * 2) * 0.08;

    // легкий рух вгору-вниз
    guitarModel.position.y = -0.2 + Math.sin(time * 1.5) * 0.05;
  }

  renderer.render(scene, camera);
}

animate();

// 9. АДАПТАЦІЯ ПІД РОЗМІР ВІКНА
window.addEventListener('resize', onWindowResize);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}