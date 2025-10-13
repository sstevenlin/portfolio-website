// Pokémon-Style Portfolio Game JavaScript

class PokemonPortfolioGame {
  constructor() {
    this.character = document.getElementById('character');
    this.modalOverlay = document.getElementById('modal-overlay');
    this.modalTitle = document.getElementById('modal-title');
    this.modalBody = document.getElementById('modal-body');
    this.modalClose = document.getElementById('modal-close');
    
    // Grid-based positioning (like Pokémon games)
    this.gridCols = 20;
    this.gridRows = 15;
    this.characterGridPos = { x: 10, y: 7 }; // Starting position - center of board
    this.isMoving = false;
    this.keys = {};
    this.moveCooldown = false;
    
    this.init();
  }
  
  init() {
    this.setupEventListeners();
    this.updateCharacterPosition();
    this.setupInteractiveZones();
    this.setupModal();
    this.playStartupSound();
  }
  
  setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      if (this.moveCooldown) return;
      
      const key = e.key.toLowerCase();
      this.keys[key] = true;
      
      // Handle spacebar interaction
      if (key === ' ') {
        e.preventDefault();
        this.attemptInteraction();
        return;
      }
      
      // Handle movement with grid-based system
      if (['arrowup', 'w'].includes(key)) {
        this.moveCharacter(0, -1);
      } else if (['arrowdown', 's'].includes(key)) {
        this.moveCharacter(0, 1);
      } else if (['arrowleft', 'a'].includes(key)) {
        this.moveCharacter(-1, 0);
      } else if (['arrowright', 'd'].includes(key)) {
        this.moveCharacter(1, 0);
      }
    });
    
    document.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
    
    // Prevent default behavior for arrow keys and WASD
    document.addEventListener('keydown', (e) => {
      const keys = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' '];
      if (keys.includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    });
  }
  
  moveCharacter(deltaX, deltaY) {
    if (this.moveCooldown) return;
    
    const newX = this.characterGridPos.x + deltaX;
    const newY = this.characterGridPos.y + deltaY;
    
    // Check boundaries
    if (newX >= 1 && newX <= this.gridCols && newY >= 1 && newY <= this.gridRows) {
      this.characterGridPos.x = newX;
      this.characterGridPos.y = newY;
      
      this.updateCharacterPosition();
      this.playMoveSound();
      this.setMoveCooldown();
    }
  }
  
  updateCharacterPosition() {
    // Update grid position display
    this.character.style.gridColumn = this.characterGridPos.x;
    this.character.style.gridRow = this.characterGridPos.y;
    
    // Update proximity indicators
    this.updateProximityIndicators();
  }
  
  // Proximity detection for furniture interaction
  getNearbyFurniture() {
    const nearbyFurniture = [];
    const charPos = this.characterGridPos;
    
    // Define exact furniture positions from HTML
    const furniturePositions = {
      bed: { x1: 2, x2: 5, y1: 3, y2: 6, type: 'about' },
      desk: { x1: 15, x2: 18, y1: 3, y2: 5, type: 'experience' },
      closet: { x1: 2, x2: 4, y1: 10, y2: 13, type: 'skills' },
      music: { x1: 16, x2: 18, y1: 10, y2: 12, type: 'contact' }
    };
    
    // Check if character is standing on any furniture
    for (const [furnitureName, bounds] of Object.entries(furniturePositions)) {
      if (furnitureName === 'music') {
        // Special case for music player - check a much larger area way to the left and higher
        if (charPos.x >= 11 && charPos.x <= 16 && charPos.y >= 5 && charPos.y <= 11) {
          nearbyFurniture.push({
            type: bounds.type,
            furniture: furnitureName,
            distance: 0
          });
        }
      } else if (furnitureName === 'desk') {
        // Special case for desk - expand interaction zone to the left and higher
        if (charPos.x >= 10 && charPos.x <= bounds.x2 && charPos.y >= 2 && charPos.y <= bounds.y2) {
          nearbyFurniture.push({
            type: bounds.type,
            furniture: furnitureName,
            distance: 0
          });
        }
      } else if (furnitureName === 'bed') {
        // Special case for bed - limit interaction zone to left side only and move higher
        if (charPos.x >= bounds.x1 && charPos.x <= bounds.x1 + 1 && charPos.y >= bounds.y1 - 1 && charPos.y <= bounds.y2) {
          nearbyFurniture.push({
            type: bounds.type,
            furniture: furnitureName,
            distance: 0
          });
        }
      } else if (furnitureName === 'closet') {
        // Special case for closet - shift interaction zone to the left and higher
        if (charPos.x >= 1 && charPos.x <= 3 && charPos.y >= 7 && charPos.y <= 10) {
          nearbyFurniture.push({
            type: bounds.type,
            furniture: furnitureName,
            distance: 0
          });
        }
      } else {
        // Normal furniture - check if standing on the furniture
        if (charPos.x >= bounds.x1 && charPos.x <= bounds.x2 &&
            charPos.y >= bounds.y1 && charPos.y <= bounds.y2) {
          nearbyFurniture.push({
            type: bounds.type,
            furniture: furnitureName,
            distance: 0
          });
        }
      }
    }
    
    return nearbyFurniture;
  }
  
  updateProximityIndicators() {
    // Remove existing indicators
    const existingIndicators = document.querySelectorAll('.proximity-indicator');
    existingIndicators.forEach(indicator => indicator.remove());
    
    // Add new indicators for nearby furniture
    const nearbyFurniture = this.getNearbyFurniture();
    if (nearbyFurniture.length > 0) {
      const furniture = nearbyFurniture[0];
      this.showProximityIndicator(furniture);
    }
  }
  
  showProximityIndicator(furniture) {
    const indicator = document.createElement('div');
    indicator.className = 'proximity-indicator';
    indicator.innerHTML = 'Press <span class="space-key">SPACE</span> to interact';
    
    // Position indicator above the character
    const characterRect = this.character.getBoundingClientRect();
    const gameWorld = document.querySelector('.game-world');
    const gameWorldRect = gameWorld.getBoundingClientRect();
    
    indicator.style.position = 'absolute';
    indicator.style.left = `${characterRect.left - gameWorldRect.left + characterRect.width / 2 - 80}px`;
    indicator.style.top = `${characterRect.top - gameWorldRect.top - 30}px`;
    indicator.style.zIndex = '1000';
    
    gameWorld.appendChild(indicator);
    
    // Remove indicator after a short delay
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.remove();
      }
    }, 2000);
  }
  
  attemptInteraction() {
    const nearbyFurniture = this.getNearbyFurniture();
    
    if (nearbyFurniture.length > 0) {
      const closestFurniture = nearbyFurniture[0];
      this.openModal(closestFurniture.type);
      this.playInteractSound();
    } else {
      // Play "can't interact" sound
      this.playTone(300, 0.1);
      setTimeout(() => this.playTone(250, 0.1), 100);
    }
  }
  
  // Click-to-move functionality
  moveToAndInteract(targetZone) {
    const targetGridPos = this.getZoneGridPosition(targetZone);
    if (!targetGridPos) return;
    
    // Calculate path to target
    const path = this.findPath(this.characterGridPos, targetGridPos);
    if (path.length === 0) {
      // Already at target or unreachable
      this.openModal(targetZone.dataset.zone);
      this.playInteractSound();
      return;
    }
    
    // Move along the path
    this.moveAlongPath(path, () => {
      // When movement is complete, interact with the furniture
      this.openModal(targetZone.dataset.zone);
      this.playInteractSound();
    });
  }
  
  getZoneGridPosition(zone) {
    // Use the exact same furniture positions as proximity detection
    const furniturePositions = {
      'about': { x1: 2, x2: 5, y1: 3, y2: 6 },      // Bed
      'experience': { x1: 15, x2: 18, y1: 3, y2: 5 }, // Desk  
      'skills': { x1: 2, x2: 4, y1: 10, y2: 13 },     // Closet
      'contact': { x1: 16, x2: 18, y1: 10, y2: 12 }   // Music Player
    };
    
    const zoneType = zone.dataset.zone;
    const bounds = furniturePositions[zoneType];
    
    if (!bounds) return null;
    
    // For movement, go to a good position next to the furniture
    if (zoneType === 'experience') {
      // Desk - go more to the left and higher
      return { x: bounds.x1 - 2, y: bounds.y1 - 1 };
    } else if (zoneType === 'contact') {
      // Music player - go much higher and more to the left
      return { x: bounds.x1 - 2, y: bounds.y1 - 1 };
    } else if (zoneType === 'about') {
      // Bed - adjust position to be less left and lower
      return { x: bounds.x1, y: bounds.y1 };
    } else if (zoneType === 'skills') {
      // Closet - cut off 2 from right and go 3 spaces higher
      return { x: 2, y: 7 };
    } else {
      // Left side furniture - go to right side of the furniture  
      return { x: bounds.x2, y: Math.floor((bounds.y1 + bounds.y2) / 2) };
    }
  }
  
  findPath(start, end) {
    // Simple pathfinding - move in L-shape (like chess knight or simple path)
    const path = [];
    let current = { x: start.x, y: start.y };
    
    // Move horizontally first, then vertically
    while (current.x !== end.x || current.y !== end.y) {
      const next = { ...current };
      
      if (current.x < end.x) {
        next.x++;
      } else if (current.x > end.x) {
        next.x--;
      } else if (current.y < end.y) {
        next.y++;
      } else if (current.y > end.y) {
        next.y--;
      }
      
      // Check if next position is valid
      if (next.x >= 1 && next.x <= this.gridCols && next.y >= 1 && next.y <= this.gridRows) {
        path.push({ ...next });
        current = next;
        } else {
        break; // Can't reach target
      }
    }
    
    return path;
  }
  
  moveAlongPath(path, onComplete) {
    if (path.length === 0) {
      onComplete();
      return;
    }
    
    let currentIndex = 0;
    
    const moveNext = () => {
      if (currentIndex >= path.length) {
        onComplete();
        return;
      }
      
      const nextPos = path[currentIndex];
      const deltaX = nextPos.x - this.characterGridPos.x;
      const deltaY = nextPos.y - this.characterGridPos.y;
      
      this.characterGridPos.x = nextPos.x;
      this.characterGridPos.y = nextPos.y;
      this.updateCharacterPosition();
      this.playMoveSound();
      
      currentIndex++;
      
      // Move to next position after a short delay
      setTimeout(moveNext, 200);
    };
    
    moveNext();
  }
  
  setMoveCooldown() {
    this.moveCooldown = true;
    setTimeout(() => {
      this.moveCooldown = false;
    }, 150); // Pokémon-style movement timing
  }
  
  setupInteractiveZones() {
    const zones = document.querySelectorAll('.interactive-zone');
    
    zones.forEach(zone => {
      zone.addEventListener('click', (e) => {
        e.preventDefault();
        this.moveToAndInteract(zone);
      });
    });
  }
  
  setupModal() {
    this.modalClose.addEventListener('click', () => {
      this.closeModal();
      this.playCloseSound();
    });
    
    this.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) {
        this.closeModal();
        this.playCloseSound();
      }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalOverlay.classList.contains('active')) {
        this.closeModal();
        this.playCloseSound();
      }
    });
  }
  
  openModal(zoneType) {
    const content = this.getZoneContent(zoneType);
    this.modalTitle.textContent = content.title;
    this.modalBody.innerHTML = content.body;
    this.modalOverlay.classList.add('active');
  }
  
  closeModal() {
    this.modalOverlay.classList.remove('active');
  }
  
  // Sound effects (using Web Audio API for retro sounds)
  playStartupSound() {
    // Simple beep sound for startup
    this.playTone(800, 0.1);
    setTimeout(() => this.playTone(1000, 0.1), 100);
  }
  
  playMoveSound() {
    // Footstep sound
    this.playTone(200, 0.05);
  }
  
  playInteractSound() {
    // Interaction sound
    this.playTone(600, 0.1);
    setTimeout(() => this.playTone(800, 0.1), 50);
  }
  
  playCloseSound() {
    // Close sound
    this.playTone(400, 0.1);
    setTimeout(() => this.playTone(300, 0.1), 50);
  }
  
  playTone(frequency, duration) {
    if (!window.AudioContext && !window.webkitAudioContext) return;
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'square'; // Retro square wave
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }
  
  getZoneContent(zoneType) {
    const content = {
      about: {
        title: 'Personal Space & Background',
        body: `
          <div class="info-section">
            <h3>About Steven</h3>
            <p>Hello! I'm Steven, a <span id="age-display">21</span> year old computer science student and critical philosopher.</p>
            <p>Currently pursuing a Bachelor's degree in CS & Mathematics at Cornell University, with a passion for theoretical machine learning and AI research.</p>
            <p>Working as an AI Intern at ScaleAI, gaining hands-on experience with cutting-edge ML technologies and large-scale systems.</p>
            <p>In my free time, I enjoy basketball, poker, hiking, and deep philosophical discussions. Always excited to tackle challenging problems!</p>
          </div>
          
          <div class="info-section">
            <h3>My Room, My Space</h3>
            <p>This room represents my personal space - where I think, code, and unwind. Each piece of furniture tells a different part of my story.</p>
            <p>Click around to explore different aspects of who I am and what I do!</p>
          </div>
        `
      },
      experience: {
        title: 'Work Desk & Experience',
        body: `
          <div class="info-section">
            <h3>My Work Space</h3>
            <p>This is where the magic happens! My desk is where I spend hours coding, researching, and building things that matter.</p>
            <p>From late-night coding sessions to early morning research, this space has seen it all.</p>
          </div>
          
          <div class="info-section">
            <h3>Professional Journey</h3>
            
            <div class="experience-item">
              <h4>AI Intern</h4>
              <div class="company">ScaleAI</div>
              <div class="duration">Current Position</div>
              <p>Developing machine learning infrastructure and AI models. Working with large-scale ML systems and data processing pipelines.</p>
            </div>
            
            <div class="experience-item">
              <h4>Software Engineering Intern</h4>
              <div class="company">Capital One</div>
              <div class="duration">Summer 2023</div>
              <p>Built web applications and APIs using modern JavaScript frameworks. Contributed to large-scale financial software systems.</p>
            </div>
            
            <div class="experience-item">
              <h4>Machine Learning Engineer Intern</h4>
              <div class="company">NASA Ames Research Center</div>
              <div class="duration">Summer 2022</div>
              <p>Researched ML algorithms for aerospace applications. Worked with satellite data and computer vision models for space missions.</p>
            </div>
          </div>
        `
      },
      skills: {
        title: 'Skills & Abilities',
        body: `
          <div class="info-section">
            <h3>My Skills Closet</h3>
            <p>This closet contains all my technical skills and abilities - the tools I use to build amazing things!</p>
            <p>From programming languages to frameworks, this is my arsenal of knowledge.</p>
          </div>
          
          <div class="info-section">
            <h3>Programming Languages</h3>
            <div class="skill-grid">
              <div class="skill-tag">Python</div>
              <div class="skill-tag">Java</div>
              <div class="skill-tag">C++</div>
              <div class="skill-tag">TypeScript</div>
              <div class="skill-tag">Go</div>
              <div class="skill-tag">Bash</div>
              <div class="skill-tag">HTML/CSS</div>
              <div class="skill-tag">SQL</div>
            </div>
          </div>
          
          <div class="info-section">
            <h3>Technologies & Frameworks</h3>
            <div class="skill-grid">
              <div class="skill-tag">React</div>
              <div class="skill-tag">Angular</div>
              <div class="skill-tag">TensorFlow</div>
              <div class="skill-tag">Three.js</div>
              <div class="skill-tag">Node.js</div>
              <div class="skill-tag">Machine Learning</div>
              <div class="skill-tag">Data Structures</div>
              <div class="skill-tag">Flutter</div>
              <div class="skill-tag">Dart</div>
            </div>
          </div>
          
          <div class="info-section">
            <h3>Creative & Design Tools</h3>
            <div class="skill-grid">
              <div class="skill-tag">Figma</div>
              <div class="skill-tag">Illustrator</div>
              <div class="skill-tag">Procreate</div>
              <div class="skill-tag">Houdini</div>
              <div class="skill-tag">Motion 5</div>
              <div class="skill-tag">Inventor</div>
            </div>
          </div>
          
          <div class="info-section">
            <h3>Development Tools</h3>
            <div class="skill-grid">
              <div class="skill-tag">Git</div>
              <div class="skill-tag">VSCode</div>
              <div class="skill-tag">Postman</div>
            </div>
          </div>
        `
      },
      contact: {
        title: 'Music & Contact',
        body: `
          <div class="info-section">
            <h3>My Music Player</h3>
            <p>Music is a big part of my life! I love listening to music while coding, studying, or just relaxing.</p>
            <p>From classical to hip-hop, my playlist reflects my diverse interests and helps me stay focused.</p>
          </div>
          
          <div class="info-section">
            <h3>Let's Connect!</h3>
            <p>I'm always interested in discussing new opportunities, research collaborations, or just having a chat about technology and philosophy.</p>
            
            <div class="experience-item">
              <h4>📧 Email</h4>
              <p><a href="mailto:sl3484@cornell.edu" style="color: #4A90E2; text-decoration: none;">sl3484@cornell.edu</a></p>
            </div>
            
            <div class="experience-item">
              <h4>💼 LinkedIn</h4>
              <p><a href="https://linkedin.com/in/steven-lin-" target="_blank" style="color: #4A90E2; text-decoration: none;">linkedin.com/in/steven-lin-</a></p>
            </div>
            
            <div class="experience-item">
              <h4>🐙 GitHub</h4>
              <p><a href="https://github.com/sstevenlin" target="_blank" style="color: #4A90E2; text-decoration: none;">github.com/sstevenlin</a></p>
            </div>
            
            <div class="experience-item">
              <h4>📱 Instagram</h4>
              <p><a href="https://instagram.com/sstevenlin" target="_blank" style="color: #4A90E2; text-decoration: none;">@sstevenlin</a></p>
            </div>
          </div>
        `
      }
    };
    
    return content[zoneType] || { title: 'Information', body: '<p>Content not available.</p>' };
  }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new PokemonPortfolioGame();
  
  // Calculate and display age
  const calculateAge = () => {
    const birthYear = 2003; // Adjust this to your actual birth year
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    const ageElement = document.getElementById('age-display');
    if (ageElement) {
      ageElement.textContent = age;
    }
  };
  
  calculateAge();
});