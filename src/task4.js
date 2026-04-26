import './style.css';

import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let container;
let camera, scene, renderer;
let reticle;
let controller;

let hitTestSource = null;
let localSpace = null;
let hitTestSourceInitialized = false;

let toyTemplate = null;

init();
animate();

function init() {
  container = document.createElement('div');
  document.body.appendChild(container);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    20
  );

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1.2);
  hemisphereLight.position.set(0.5, 1, 0.25);
  scene.add(hemisphereLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(2, 3, 2);
  scene.add(directionalLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  controller = renderer.xr.getController(0);
  controller.addEventListener('select', onSelect);
  scene.add(controller);

  addReticleToScene();

  const button = ARButton.createButton(renderer, {
    requiredFeatures: ['hit-test']
  });
  document.body.appendChild(button);

  loadToyModel();

  // fallback для ПК: клік мишкою теж додає модель
  //window.addEventListener('click', onSelect);

  window.addEventListener('resize', onWindowResize, false);
}

function addReticleToScene() {
  const geometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff });

  reticle = new THREE.Mesh(geometry, material);
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;

  scene.add(reticle);

  // для наочності
  //reticle.add(new THREE.AxesHelper(0.3));
}

function loadToyModel() {
  const loader = new GLTFLoader();

  loader.load(
    '/models/toy/beetle_toy_car.glb',
    function (gltf) {
      toyTemplate = gltf.scene;

      toyTemplate.scale.set(1.5, 1.5, 1.5);

      toyTemplate.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          if (child.material) {
            child.material.side = THREE.DoubleSide;
            child.material.needsUpdate = true;
          }
        }
      });

      console.log('Модель машинки успішно завантажена', toyTemplate);

      // ТЕСТ: одразу додаємо копію перед камерою
      /*
      const testCar = toyTemplate.clone(true);
      testCar.position.set(0, 0, -2);
      scene.add(testCar);
      */
      console.log('Тестова машинка додана перед камерою');
    },
    function (xhr) {
      if (xhr.total) {
        console.log(((xhr.loaded / xhr.total) * 100).toFixed(2) + '% loaded');
      }
    },
    function (error) {
      console.error('Помилка завантаження моделі:', error);
    }
  );
}

function onSelect() {
  console.log('onSelect спрацював');

  if (!reticle.visible) {
    console.log('reticle не видимий');
    return;
  }

  if (!toyTemplate) {
    console.log('модель ще не завантажена');
    return;
  }

  const toyInstance = toyTemplate.clone(true);

  toyInstance.position.setFromMatrixPosition(reticle.matrix);
  toyInstance.quaternion.setFromRotationMatrix(reticle.matrix);

  // піднімемо трохи над поверхнею, щоб точно було видно
  toyInstance.position.y += 0.1;

  // тимчасово БЕЗ rotateX
  // toyInstance.rotateX(-Math.PI / 2);

  scene.add(toyInstance);
  console.log('Модель додана на сцену');
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