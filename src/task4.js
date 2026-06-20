import * as THREE from "three";
import { ARButton } from "three/addons/webxr/ARButton.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let container;
let camera, scene, renderer;
let reticle;
let controller;
let model = null;

const modelUrl = "/models/2003_hyundai_tiburon.glb";

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
  renderer.xr.enabled = true;

  container.appendChild(renderer.domElement);

  // Світло
  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1.5);
  hemisphereLight.position.set(0.5, 1, 0.25);
  scene.add(hemisphereLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
  scene.add(ambientLight);

  // Контролер натискання на екран
  controller = renderer.xr.getController(0);
  controller.addEventListener("select", onSelect);
  scene.add(controller);

  // Мітка поверхні
  addReticleToScene();

  // ARButton з hit-test
  const button = ARButton.createButton(renderer, {
    requiredFeatures: ["hit-test"]
  });

  document.body.appendChild(button);

  renderer.domElement.style.display = "none";

  window.addEventListener("resize", onWindowResize, false);
}

function addReticleToScene() {
  const geometry = new THREE.RingGeometry(0.15, 0.2, 32);
  geometry.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

  const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00
  });

  reticle = new THREE.Mesh(geometry, material);
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;

  scene.add(reticle);
}

function onSelect() {
  if (reticle.visible) {
    const loader = new GLTFLoader();

    // Якщо модель уже була додана — видаляємо стару
    if (model) {
      scene.remove(model);

      model.traverse((child) => {
        if (child.isMesh) {
          child.geometry.dispose();

          if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });

      model = null;
    }

    loader.load(
      modelUrl,

      function (gltf) {
        model = gltf.scene;

        // Ставимо модель у місце reticle
        model.position.setFromMatrixPosition(reticle.matrix);
        model.quaternion.setFromRotationMatrix(reticle.matrix);

        // Масштаб моделі
        model.scale.set(0.25, 0.25, 0.25);

        // Налаштування матеріалів
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            if (child.material) {
              child.material.needsUpdate = true;
            }
          }
        });

        scene.add(model);

        console.log("Transport model added to scene");
      },

      function (xhr) {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },

      function (error) {
        console.error("Error loading model:", error);
      }
    );
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

let hitTestSource = null;
let localSpace = null;
let hitTestSourceInitialized = false;

async function initializeHitTestSource() {
  const session = renderer.xr.getSession();

  const viewerSpace = await session.requestReferenceSpace("viewer");

  hitTestSource = await session.requestHitTestSource({
    space: viewerSpace
  });

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