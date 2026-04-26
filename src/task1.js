import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';

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
/*
document.body.appendChild(
  ARButton.createButton(renderer, {
    requiredFeatures: [],
    optionalFeatures: ['dom-overlay'],
    domOverlay: { root: document.body }
  })
);
*/
document.body.appendChild(ARButton.createButton(renderer));

// 5. ОСВІТЛЕННЯ


// М'яке загальне світло
const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1.2);
scene.add(hemisphereLight);

// Напрямлене світло
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(1, 2, 1);
scene.add(directionalLight);


// 6. ГЕОМЕТРІЇ + МАТЕРІАЛИ + MESH


// 6.1 Куб (BoxGeometry)
const boxGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
const boxMaterial = new THREE.MeshStandardMaterial({
  color: 0xff3333,
  metalness: 0.3,
  roughness: 0.6
});
const box = new THREE.Mesh(boxGeometry, boxMaterial);
box.position.set(-0.6, 0, -1.8);
scene.add(box);

// 6.2 Куля (SphereGeometry)
const sphereGeometry = new THREE.SphereGeometry(0.22, 32, 32);
const sphereMaterial = new THREE.MeshPhongMaterial({
  color: 0x3366ff,
  shininess: 100
});
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.set(0, 0, -1.8);
scene.add(sphere);

// 6.3 Циліндр (CylinderGeometry)
const cylinderGeometry = new THREE.CylinderGeometry(0.18, 0.18, 0.42, 32);
const cylinderMaterial = new THREE.MeshLambertMaterial({
  color: 0x33cc66
});
const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
cylinder.position.set(0.6, 0, -1.8);
scene.add(cylinder);


// 7. АНІМАЦІЯ

function animate() {
  renderer.setAnimationLoop(render);
}

function render() {
  const time = performance.now() * 0.001;

  // Куб обертається
  box.rotation.x += 0.01;
  box.rotation.y += 0.015;

  // Куля плавно підстрибує
  sphere.position.y = Math.sin(time * 2) * 0.15;

  // Циліндр обертається навколо своєї осі
  cylinder.rotation.y += 0.02;
  cylinder.rotation.z += 0.01;

  renderer.render(scene, camera);
}

animate();

// 8. АДАПТАЦІЯ ПІД РОЗМІР ВІКНА

window.addEventListener('resize', onWindowResize);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}