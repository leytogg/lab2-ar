import * as THREE from "three";
import { ARButton } from "three/addons/webxr/ARButton.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let camera, scene, renderer;
let loader;
let model;

init();
animate();

function init() {
  const container = document.createElement("div");
  document.body.appendChild(container);

  // Сцена
  scene = new THREE.Scene();

  // Камера
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    40
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
  const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 2);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 5, 10);
  pointLight.position.set(-3, 3, 3);
  scene.add(pointLight);

  // Посилання на GLB-модель з папки public/models
  const modelUrl = "/models/furniture_set.glb";

  // Завантажувач GLTF/GLB
  loader = new GLTFLoader();

  loader.load(
    modelUrl,

    function (gltf) {
      model = gltf.scene;

      // Позиція моделі перед камерою
      model.position.set(0, -0.6, -3);

      // Масштаб моделі
      model.scale.set(0.6, 0.6, 0.6);

      // Налаштування матеріалів моделі
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

      console.log("Furniture model added to scene");
    },

    function (xhr) {
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },

    function (error) {
      console.error("Model loading error:", error);
    }
  );

  // Кнопка запуску AR
  document.body.appendChild(ARButton.createButton(renderer));

  window.addEventListener("resize", onWindowResize, false);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  renderer.setAnimationLoop(render);
}

function render() {
  animateModel();
  renderer.render(scene, camera);
}

let degrees = 0;

function animateModel() {
  if (model !== undefined) {
    degrees += 0.2;

    // Плавне обертання моделі навколо осі Y
    model.rotation.y = THREE.MathUtils.degToRad(degrees);
  }
}