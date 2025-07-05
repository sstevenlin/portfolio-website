// main.js

// 1) Import from CDN
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';


document.addEventListener('DOMContentLoaded', () => {
  // Light/Dark Toggle (unchanged)…
  const toggleBtn = document.getElementById('mode-toggle');
  const iconSvg   = document.getElementById('mode-icon');
  const body      = document.body;
  const sunSVG    = iconSvg.innerHTML.trim();
  const moonSVG   = `
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M21 12.79A9 9 0 1111.21 3
             a7 7 0 009.79 9.79z"/>
  `;
  toggleBtn.addEventListener('click', () => {
    const isDark = body.classList.toggle('dark-mode');
    iconSvg.innerHTML = isDark ? moonSVG : sunSVG;
  });

  // Three.js setup
  let container = document.getElementById('hero-canvas');
  if (!container) {
    container = document.createElement('div');
    container.id = 'hero-canvas';
    document.getElementById('hero').prepend(container);
  }

  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(35, window.innerWidth/window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // lights
  scene.add(new THREE.AmbientLight(0x404040, 1.2));
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(5,10,7.5);
  scene.add(dir);

  camera.position.set(0,0,6);
  camera.lookAt(scene.position);

  // load GLB
  const loader = new GLTFLoader();
  loader.load(
    'assets/models/day31_spinning_top.glb',
    gltf => {
      const top = gltf.scene;
      top.traverse(n => {
        if (n.isMesh) {
          n.material.transparent = true;
          n.material.opacity = 0.4;

          n.material.color.setHex(0xFFFFFF);
        }
      });
      top.scale.set(0.06, 0.06, 0.06);
      top.position.set(0,-0.2,0);
      top.rotation.z = 0.15;
      scene.add(top);

      let wob = 0;
      const spinSpeed = 0.15, wobbleSpeed = 0, wobbleAmt = 0;
      (function animate() {

        requestAnimationFrame(animate);
      
        top.rotation.y += spinSpeed;
      
        if (wobbleSpeed !== 0 && wobbleAmt !== 0) {
          wobbleOffset += wobbleSpeed;
          top.rotation.x = Math.sin(wobbleOffset) * wobbleAmt;
        } else {
          top.rotation.x = 0;   // <— clear out any previous tilt
        }
      
        renderer.render(scene, camera);
      })();
    },
    undefined,
    err => console.error('GLTF load error:', err)
  );

  window.addEventListener('resize', () => {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w,h);
    camera.aspect = w/h;
    camera.updateProjectionMatrix();
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const slider = document.querySelector('.image-slider');
  if (!slider) return;
  const slides = slider.querySelectorAll('.slides img');
  let idx = 0;

  const show = newIndex => {
    slides[idx].classList.remove('active');
    idx = (newIndex + slides.length) % slides.length;
    slides[idx].classList.add('active');
  };

  slider.querySelector('.prev-btn')
    .addEventListener('click', () => show(idx - 1));
  slider.querySelector('.next-btn')
    .addEventListener('click', () => show(idx + 1));
});