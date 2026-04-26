import './style.css';

import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';

let container;
let camera, scene, renderer;
let reticle;
let controller;

let hitTestSource = null;
let localSpace = null;
let hitTestSourceInitialized = false;

init();
animate();

function init() {
  container = document.createElement('div');
  document.body.appendChild(container);

  // 1. Сцена
  scene = new THREE.Scene();

  // 2. Камера
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    20
  );

  // 3. Рендерер
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  // 4. Освітлення
  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1.2);
  hemisphereLight.position.set(0.5, 1, 0.25);
  scene.add(hemisphereLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
  directionalLight.position.set(1, 2, 1);
  scene.add(directionalLight);

  // 5. Контролер для AR-взаємодії
  controller = renderer.xr.getController(0);
  controller.addEventListener('select', onSelect);
  scene.add(controller);

  // 6. Мітка поверхні
  addReticleToScene();

  // 7. Кнопка входу в AR з hit-test
  const button = ARButton.createButton(renderer, {
    requiredFeatures: ['hit-test']
  });
  document.body.appendChild(button);

  // 8. Для перевірки на ПК
  //window.addEventListener('click', onSelect);

  window.addEventListener('resize', onWindowResize, false);
}

function addReticleToScene() {
  const geometry = new THREE.RingGeometry(0.12, 0.16, 32).rotateX(-Math.PI / 2);
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff });

  reticle = new THREE.Mesh(geometry, material);
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;

  scene.add(reticle);

  // Для наочності
  //reticle.add(new THREE.AxesHelper(0.3));
}

function createExtrudedStar() {
  const outerRadius = 0.12;
  const innerRadius = 0.055;
  const spikes = 5;

  const shape = new THREE.Shape();

  for (let i = 0; i < spikes * 2; i++) {
    const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;

    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }

  shape.closePath();

  const extrudeSettings = {
    depth: 0.05,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.01,
    bevelThickness: 0.01
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.center();

  const material = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.35,
    roughness: 0.4
  });

  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

function onSelect() {
  if (!reticle.visible) return;

  const star = createExtrudedStar();

  // Ставимо об’єкт у позицію reticle
  star.position.setFromMatrixPosition(reticle.matrix);
  star.quaternion.setFromRotationMatrix(reticle.matrix);

  // Трохи піднімаємо над поверхнею, щоб об'єкт не "тонув"
  star.position.y += 0.03;

  scene.add(star);
  console.log('Зірка додана на сцену');
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  renderer.setAnimationLoop(render);
}

async function initializeHitTestSource() {
  const session = renderer.xr.getSession();

  const viewerSpace = await session.requestReferenceSpace('viewer');
  hitTestSource = await session.requestHitTestSource({ space: viewerSpace });

  localSpace = await session.requestReferenceSpace('local');

  hitTestSourceInitialized = true;

  session.addEventListener('end', () => {
    hitTestSourceInitialized = false;
    hitTestSource = null;
  });
}

function render(timestamp, frame) {
  if (frame) {
    if (!hitTestSourceInitialized) {
      initializeHitTestSource();
    }

    if (hitTestSourceInitialized) {
      const hitTestResults = frame.getHitTestResults(hitTestSource);

      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        const pose = hit.getPose(localSpace);

        reticle.visible = true;
        reticle.matrix.fromArray(pose.transform.matrix);
      } else {
        reticle.visible = false;
      }
    }
  }

  renderer.render(scene, camera);
}