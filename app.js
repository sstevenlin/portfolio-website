// main.js

// 1) Import from CDN
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';


document.addEventListener('DOMContentLoaded', () => {
  // Navigation functionality
  const nav = document.getElementById('main-nav');
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');
  
  // Show navigation on scroll
  let lastScrollY = window.scrollY;
  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    
    if (currentScrollY > 100) {
      nav.classList.add('visible');
    } else {
      nav.classList.remove('visible');
    }
    
    lastScrollY = currentScrollY;
  });
  
  // Mobile menu toggle
  mobileMenuToggle.addEventListener('click', () => {
    mobileMenuToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
  });
  
  // Close mobile menu when clicking on links
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenuToggle.classList.remove('active');
      navMenu.classList.remove('active');
    });
  });
  
  // Smooth scrolling for navigation links
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const targetSection = document.querySelector(targetId);
      
      if (targetSection) {
        const offsetTop = targetSection.offsetTop - 80; // Account for nav height
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    });
  });

  // Light/Dark Toggle
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

const birthDate = new Date('2006-03-05T09:30:00');  

function updateAge() {
  const now = new Date();
  const msPerYear = 365.2425 * 24 * 60 * 60 * 1000;
  const age = (now - birthDate) / msPerYear;
  const el = document.getElementById('age-display');
  if (el) el.textContent = age.toFixed(9);
  requestAnimationFrame(updateAge);
}

requestAnimationFrame(updateAge);


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

  // Scroll animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate');
      }
    });
  }, observerOptions);

  // Observe all scroll sections
  const scrollSections = document.querySelectorAll('.scroll-section');
  scrollSections.forEach(section => {
    observer.observe(section);
  });
});
