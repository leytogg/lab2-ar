import * as THREE from "three";
import { ARButton } from "three/addons/webxr/ARButton.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

let camera, scene, renderer;
let capsuleMesh, cylinderMesh, ringMesh;
let controls;

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
  const directionalLight = new THREE.DirectionalLight(0xffffff, 4);
  directionalLight.position.set(3, 3, 3);
  scene.add(directionalLight);

  const pointLight = new THREE.PointLight(0xffffff, 10, 10);
  pointLight.position.set(-2, 2, 2);
  scene.add(pointLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  // 1. CapsuleGeometry
  const capsuleGeometry = new THREE.CapsuleGeometry(0.25, 0.7, 8, 16);
  const capsuleMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4444,
    roughness: 0.35,
    metalness: 0.2
  });

  capsuleMesh = new THREE.Mesh(capsuleGeometry, capsuleMaterial);
  capsuleMesh.position.set(-1.2, 0, -2);
  scene.add(capsuleMesh);

  // 2. CylinderGeometry
  const cylinderGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 32);
  const cylinderMaterial = new THREE.MeshPhongMaterial({
    color: 0x44ff44,
    shininess: 90
  });

  cylinderMesh = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
  cylinderMesh.position.set(0, 0, -2);
  scene.add(cylinderMesh);

  // 3. RingGeometry
  const ringGeometry = new THREE.RingGeometry(0.25, 0.5, 32);
  const ringMaterial = new THREE.MeshStandardMaterial({
    color: 0x4488ff,
    roughness: 0.25,
    metalness: 0.7,
    side: THREE.DoubleSide
  });

  ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
  ringMesh.position.set(1.2, 0, -2);
  scene.add(ringMesh);

  // Позиція камери для перегляду у браузері
  camera.position.z = 3;

  // Контролери для огляду на вебсторінці
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

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
  controls.update();
  rotateObjects();
  renderer.render(scene, camera);
}

function rotateObjects() {
  capsuleMesh.rotation.x -= 0.01;
  capsuleMesh.rotation.y -= 0.01;

  cylinderMesh.rotation.x += 0.015;
  cylinderMesh.rotation.y += 0.02;
  cylinderMesh.rotation.z += 0.01;

  ringMesh.rotation.x += 0.01;
  ringMesh.rotation.z += 0.02;
}