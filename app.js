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
        this.audioContext = null;
        
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
    // Initialize audio on first user interaction
    const initAudioOnInteraction = () => {
      this.initializeAudio();
      // Remove these listeners after first interaction
      document.removeEventListener('keydown', initAudioOnInteraction);
      document.removeEventListener('click', initAudioOnInteraction);
    };
    
    document.addEventListener('keydown', initAudioOnInteraction);
    document.addEventListener('click', initAudioOnInteraction);
    
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
        // Special case for music player - check area shifted way down and to the right
        if (charPos.x >= 16 && charPos.x <= 19 && charPos.y >= 10 && charPos.y <= 13) {
          nearbyFurniture.push({
            type: bounds.type,
            furniture: furnitureName,
            distance: 0
          });
        }
      } else if (furnitureName === 'desk') {
        // Special case for desk - expand interaction zone to the left and higher
        if (charPos.x >= 15 && charPos.x <= bounds.x2 && charPos.y >= 2 && charPos.y <= bounds.y2) {
          nearbyFurniture.push({
            type: bounds.type,
            furniture: furnitureName,
            distance: 0
          });
        }
      } else if (furnitureName === 'bed') {
        // Special case for bed - limit interaction zone to left side only and move higher
        if (charPos.x >= bounds.x1 + 3 && charPos.x <= bounds.x1 + 4 && charPos.y >= bounds.y1 - 1 && charPos.y <= bounds.y2) {
          nearbyFurniture.push({
            type: bounds.type,
            furniture: furnitureName,
            distance: 0
          });
        }
      } else if (furnitureName === 'closet') {
        // Special case for closet - 4 spaces below lowest bed border (bed y=3-6, so 4 below = y=10-13)
        if (charPos.x >= 3 && charPos.x <= 5 && charPos.y >= 10 && charPos.y <= 13) {
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
      // Desk - moved 4 right and 2 down from previous position (13,2) -> (17,4)
      return { x: bounds.x1 + 2, y: bounds.y1 + 1 };
    } else if (zoneType === 'contact') {
      // Music player - moved 3 right and 2 down from previous position (14,9) -> (17,11)
      return { x: bounds.x1 + 1, y: bounds.y1 + 1 };
    } else if (zoneType === 'about') {
      // Bed - moved 2 right and 2 down from previous position (2,3) -> (4,5)
      return { x: bounds.x1 + 2, y: bounds.y1 + 2 };
    } else if (zoneType === 'skills') {
      // Closet - moved 2 right and 4 down from previous position (2,7) -> (4,11)
      return { x: 4, y: 11 };
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
    // Only play sounds if audio context is already initialized (user has interacted)
    if (!this.audioContext) {
      return; // Silently fail if audio context not initialized
    }

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'square'; // Retro square wave
      
      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      // Silently fail if audio context is not available
      console.log('Audio not available:', error.message);
    }
  }

  initializeAudio() {
    // Initialize audio context on first user interaction
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('Audio context initialized');
      } catch (error) {
        console.log('Audio context not supported');
      }
    }
  }
  
  getZoneContent(zoneType) {
    const content = {
      about: {
        title: 'Personal Space & Background',
        body: `
          <div class="info-section">
            <h3>About Steven</h3>
            <p>Hello! I'm Steven, a <span id="age-display">19</span> year old computer science student and critical philosopher.</p>
            <p>Currently pursuing a Bachelor's degree in CS & Mathematics at Cornell University, with a passion for theoretical machine learning and AI research.</p>
            <p>Working as an AI Intern at ScaleAI, gaining hands-on experience with cutting-edge ML technologies and large-scale systems.</p>
            <p>In my free time, I enjoy basketball, poker, hiking, and ragebaiting. Am a big fan of problem solving.</p>
          </div>
          
          <div class="info-section">
            <h3>My Room, My Space</h3>
            <p>This room represents my personal space - where I think and unwind. Each piece of furniture tells a different part of my story.</p>
            <p>Click around to explore different aspects of who I am and what I do!</p>
          </div>
        `
      },
      experience: {
        title: 'Work Desk & Experience',
        body: `
          <div class="info-section">
            <h3>My Work Space</h3>
            <p>This is where the magic happens! Funnily enough, even though this is a desk, I rarely use my actual one in my dorm.</p>
            <p>You can probably find me at the library or at a cafe. </p>
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
              <div class="duration">Summer 2025</div>
              <p>Built a semantic search engine. Contributed to large-scale financial software systems.</p>
            </div>
            
            <div class="experience-item">
              <h4>Machine Learning Engineer Intern</h4>
              <div class="company">NASA Ames Research Center</div>
              <div class="duration">Spring 2025</div>
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
            <p>This closet contains all my technical skills and abilities.</p>
            <p>It contains programming languages and frameworks. But my greatest skill is ragebaiting people. </p>
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
            <p>Music is a big part of my life! I wake up playing music and I fall asleep to it.</p>
            <p>My favorite artist of all time is Frank Ocean because he's the goat. But I listen to all genres 
            from country to rap to everything in between.</p>
            
            <div class="spotify-player" id="spotify-player">
              <div class="now-playing" id="now-playing">
                <div class="track-info">
                  <div class="track-name" id="track-name">Blonde</div>
                  <div class="artist-name" id="artist-name">Frank Ocean</div>
                </div>
                <div class="player-controls">
                  <button id="prev-track" class="control-btn">⏮</button>
                  <button id="play-pause" class="control-btn play-btn">▶</button>
                  <button id="next-track" class="control-btn">⏭</button>
                </div>
                <div class="progress-bar">
                  <div class="progress" id="progress"></div>
                </div>
                <div class="volume-control">
                  <span>🔊</span>
                  <input type="range" id="volume" min="0" max="100" value="50">
                </div>
              </div>
            </div>
          </div>
          
          <div class="info-section">
            <h3>Let's Connect!</h3>
            <p>I'm always interested in discussing new opportunities, research collaborations, or just having a chat!</p>
            
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

// Spotify Integration
class SpotifyPlayer {
  constructor() {
    this.deviceId = null;
    this.player = null;
    this.isPlaying = false;
    this.currentTrack = null;
    this.topTracks = [];
    
    this.init();
  }
  
  async init() {
    // Set up manual songs immediately
    this.setupManualSongs();
    console.log('✅ Manual songs loaded successfully');
    this.setupPlayer();
  }

  


  // Method to set up manual songs with audio URLs
  setupManualSongs() {
    this.topTracks = [
      {
        name: "Nights",
        artist: "Frank Ocean",
        uri: "spotify:track:manual1",
        album: "Blonde",
        image: null,
        audioUrl: null // No audio file - visual only
      },
      {
        name: "Virginia Beach",
        artist: "Drake",
        uri: "spotify:track:manual2", 
        album: "For All The Dogs",
        image: null,
        audioUrl: null // No audio file - visual only
      },
      {
        name: "I Really Want To Stay At Your House",
        artist: "Rosa Walton, Hallie Coggins",
        uri: "spotify:track:manual3",
        album: "SOS",
        image: null,
        audioUrl: null // No audio file - visual only
      },
      {
        name: "Dreams and Nightmares",
        artist: "Meek Mill",
        uri: "spotify:track:manual4",
        album: "Midnights",
        image: null,
        audioUrl: null // No audio file - visual only
      },
      {
        name: "Believe - 2024 Remaster",
        artist: "Cher", 
        uri: "spotify:track:manual5",
        album: "Harry's House",
        image: null,
        audioUrl: null // No audio file - visual only
      }
    ];
    
    // Set the first song as current
    this.currentTrack = this.topTracks[0];
    
    // Initialize audio
    this.initializeAudio();
  }


  
  setupPlayer() {
    if (this.topTracks.length > 0) {
      // Use manual songs
      this.currentTrack = this.topTracks[0];
      this.updateCurrentSongDisplay();
      this.updatePlayerDisplay();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Update modal if it's currently open
      this.updateModalIfOpen();
      
      // Cycle through your actual top tracks every 30 seconds
      setInterval(() => {
        this.cycleThroughTracks();
      }, 30000);
        } else {
      console.log('❌ No tracks available for player setup');
    }
  }
  
  updateModalIfOpen() {
    // Check if the music player modal is currently open
    const modal = document.getElementById('modal-overlay');
    if (modal && modal.style.display !== 'none') {
      // Modal is open, update the player display
      setTimeout(() => {
        this.updatePlayerDisplay();
      }, 100);
    }
  }
  
  
  setupEventListeners() {
    // Set up event listeners when the modal opens
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-zone="contact"]')) {
        // Music player modal is opening, set up controls
        setTimeout(() => {
          this.setupModalControls();
        }, 100);
      }
    });
  }
  
  setupModalControls() {
    // Update the modal display with current track first
    this.updatePlayerDisplay();
    
    // Play/Pause button
    const playPauseBtn = document.getElementById('play-pause');
    if (playPauseBtn) {
      // Remove existing listeners to avoid duplicates
      playPauseBtn.replaceWith(playPauseBtn.cloneNode(true));
      const newPlayPauseBtn = document.getElementById('play-pause');
      newPlayPauseBtn.addEventListener('click', () => {
        this.togglePlayPause();
      });
    }
    
    // Previous track
    const prevBtn = document.getElementById('prev-track');
    if (prevBtn) {
      prevBtn.replaceWith(prevBtn.cloneNode(true));
      const newPrevBtn = document.getElementById('prev-track');
      newPrevBtn.addEventListener('click', () => {
        this.previousTrack();
      });
    }
    
    // Next track
    const nextBtn = document.getElementById('next-track');
    if (nextBtn) {
      nextBtn.replaceWith(nextBtn.cloneNode(true));
      const newNextBtn = document.getElementById('next-track');
      newNextBtn.addEventListener('click', () => {
        this.nextTrack();
      });
    }
    
    // Volume control
    const volumeSlider = document.getElementById('volume');
    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        this.setVolume(e.target.value);
      });
    }
  }
  
  updateCurrentSongDisplay() {
    const songTitle = document.getElementById('song-title');
    if (songTitle && this.currentTrack) {
      songTitle.textContent = `${this.currentTrack.name} - ${this.currentTrack.artist}`;
    }
  }
  
  updatePlayerDisplay() {
    const trackName = document.getElementById('track-name');
    const artistName = document.getElementById('artist-name');
    const playPauseBtn = document.getElementById('play-pause');
    
    if (trackName && this.currentTrack) {
      trackName.textContent = this.currentTrack.name;
    }
    
    if (artistName && this.currentTrack) {
      artistName.textContent = this.currentTrack.artist;
    }
    
    if (playPauseBtn) {
      playPauseBtn.textContent = this.isPlaying ? '⏸' : '▶';
    }
  }
  
  initializeAudio() {
    // Create audio element for playback
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.volume = 0.5; // Default volume
    
    // Handle audio events
    this.audio.addEventListener('ended', () => {
      this.nextTrack();
    });
    
    this.audio.addEventListener('error', (e) => {
      console.log('Audio error:', e);
      // Fallback to visual feedback if audio fails
    });
    
    this.audio.addEventListener('canplay', () => {
      console.log('Audio ready to play');
    });
  }

  togglePlayPause() {
    if (!this.currentTrack || !this.currentTrack.audioUrl) {
      console.log('No audio URL available');
      return;
    }
    
    this.isPlaying = !this.isPlaying;
    
    if (this.isPlaying) {
      this.playCurrentTrack();
    } else {
      this.pauseCurrentTrack();
    }
    
    this.updatePlayerDisplay();
    
    // Visual feedback
    const playPauseBtn = document.getElementById('play-pause');
    if (playPauseBtn) {
      playPauseBtn.style.transform = 'scale(0.95)';
      setTimeout(() => {
        playPauseBtn.style.transform = 'scale(1)';
      }, 150);
    }
  }

  playCurrentTrack() {
    if (!this.currentTrack || !this.currentTrack.audioUrl) return;
    
    try {
      this.audio.src = this.currentTrack.audioUrl;
      this.audio.currentTime = 0;
      
      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log(`Playing: ${this.currentTrack.name}`);
        }).catch(error => {
          console.log('Playback failed:', error);
          this.isPlaying = false;
          this.updatePlayerDisplay();
        });
      }
    } catch (error) {
      console.log('Audio playback error:', error);
      this.isPlaying = false;
      this.updatePlayerDisplay();
    }
  }

  pauseCurrentTrack() {
    if (this.audio) {
      this.audio.pause();
      console.log('Paused');
    }
  }
  
  previousTrack() {
    if (this.topTracks.length === 0) return;
    
    const currentIndex = this.topTracks.findIndex(track => track === this.currentTrack);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : this.topTracks.length - 1;
    
    this.currentTrack = this.topTracks[prevIndex];
    
    // If currently playing, start playing the new track
    if (this.isPlaying) {
      this.playCurrentTrack();
    }
    
    this.updateCurrentSongDisplay();
    this.updatePlayerDisplay();
    this.updateModalIfOpen();
    
    console.log('Previous track:', this.currentTrack.name);
  }
  
  nextTrack() {
    if (this.topTracks.length === 0) return;
    
    const currentIndex = this.topTracks.findIndex(track => track === this.currentTrack);
    const nextIndex = currentIndex < this.topTracks.length - 1 ? currentIndex + 1 : 0;
    
    this.currentTrack = this.topTracks[nextIndex];
    
    // If currently playing, start playing the new track
    if (this.isPlaying) {
      this.playCurrentTrack();
    }
    
    this.updateCurrentSongDisplay();
    this.updatePlayerDisplay();
    this.updateModalIfOpen();
    
    console.log('Next track:', this.currentTrack.name);
  }
  
  setVolume(volume) {
    if (this.audio) {
      this.audio.volume = volume / 100; // Convert 0-100 to 0-1
      console.log('Volume set to:', volume + '%');
    }
  }
  
  cycleThroughTracks() {
    // Cycle through your actual top tracks
    if (this.topTracks.length > 0) {
      const currentIndex = this.topTracks.findIndex(track => track === this.currentTrack);
      const nextIndex = (currentIndex + 1) % this.topTracks.length;
      this.currentTrack = this.topTracks[nextIndex];
      this.updateCurrentSongDisplay();
      this.updatePlayerDisplay();
      
      // Update modal if it's currently open
      this.updateModalIfOpen();
    }
  }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new PokemonPortfolioGame();
  const spotifyPlayer = new SpotifyPlayer();
  
  // Make spotifyPlayer globally accessible
  window.spotifyPlayer = spotifyPlayer;
  console.log('🎵 Music player ready with manual songs!');
  
  // Manual songs are now set up automatically - no token needed!
  
  // Calculate and display age
  const calculateAge = () => {
    const birthYear = 2006; // Adjust this to your actual birth year
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    const ageElement = document.getElementById('age-display');
    if (ageElement) {
      ageElement.textContent = age;
    }
  };
  
  calculateAge();
});