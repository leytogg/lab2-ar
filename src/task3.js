import * as THREE from "three";
import { ARButton } from "three/addons/webxr/ARButton.js";

let container;
let camera, scene, renderer;
let reticle;
let controller;

init();
animate();

function init() {
  container = document.createElement("div");
  document.body.appendChild(container);

  // Сцена
  scene = new THREE.Scene();

  // Камера
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    20
  );

  // Renderer
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Вмикаємо WebXR
  renderer.xr.enabled = true;

  container.appendChild(renderer.domElement);

  // Світло
  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  hemisphereLight.position.set(0.5, 1, 0.25);
  scene.add(hemisphereLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(2, 4, 3);
  scene.add(directionalLight);

  // Контролер для натискання на екран у AR
  controller = renderer.xr.getController(0);
  controller.addEventListener("select", onSelect);
  scene.add(controller);

  // Додаємо мітку поверхні
  addReticleToScene();

  // Кнопка AR з підтримкою hit-test
  const button = ARButton.createButton(renderer, {
    requiredFeatures: ["hit-test"]
  });

  document.body.appendChild(button);

  // Ховаємо canvas до запуску AR
  renderer.domElement.style.display = "none";

  window.addEventListener("resize", onWindowResize, false);
}

function addReticleToScene() {
  // Кільце, яке показує місце розміщення об'єкта
  const geometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(
    -Math.PI / 2
  );

  const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00
  });

  reticle = new THREE.Mesh(geometry, material);
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;

  scene.add(reticle);

  // Осі координат для наочності
  reticle.add(new THREE.AxesHelper(0.5));
}

function onSelect() {
  if (reticle.visible) {
    // Об'єкт згідно варіанту №2 — BoxGeometry
    const geometry = new THREE.BoxGeometry(0.18, 0.18, 0.18);

    const material = new THREE.MeshStandardMaterial({
      color: Math.random() * 0xffffff,
      metalness: Math.random(),
      roughness: Math.random() * 0.5
    });

    const boxMesh = new THREE.Mesh(geometry, material);

    // Ставимо куб у позицію reticle
    boxMesh.position.setFromMatrixPosition(reticle.matrix);
    boxMesh.quaternion.setFromRotationMatrix(reticle.matrix);

    scene.add(boxMesh);
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  renderer.setAnimationLoop(render);
}

// Дані для Hit Test
let hitTestSource = null;
let localSpace = null;
let hitTestSourceInitialized = false;

async function initializeHitTestSource() {
  const session = renderer.xr.getSession();

  // Простір, що базується на положенні камери пристрою
  const viewerSpace = await session.requestReferenceSpace("viewer");

  // Джерело hit-test
  hitTestSource = await session.requestHitTestSource({
    space: viewerSpace
  });

  // Стабільна локальна система координат
  localSpace = await session.requestReferenceSpace("local");

  hitTestSourceInitialized = true;

  session.addEventListener("end", () => {
    hitTestSourceInitialized = false;
    hitTestSource = null;
  });
}

function render(timestamp, frame) {
  if (frame) {
    if (!hitTestSourceInitialized) {
      initializeHitTestSource();
    }

    if (hitTestSourceInitialized && hitTestSource) {
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