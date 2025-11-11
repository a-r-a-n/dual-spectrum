// ========================================
// DUAL SPECTRUM - APPLICATION LOGIC
// Professional JavaScript ES6+ Implementation
// ========================================

// ========================================
// STATE MANAGEMENT
// ========================================
const AppState = {
    current: 'depressive',
    stats: { manic: 0, mixed: 0, depressive: 0 },
    startTime: Date.now(),
    thoughtIndex: 0,
    animationFrameId: null,
    audioEnabled: false,
    audioInitialized: false,
    timelineData: [],
    maxTimelinePoints: 100
};

// ========================================
// THOUGHT CONTENT DATABASE
// ========================================
const thoughts = {
    manic: [
        "I can do anything! Everything is possible!",
        "My mind races with brilliant ideas and endless energy.",
        "Sleep is optional. The world is mine to conquer.",
        "I feel invincible, unstoppable, infinitely alive!",
        "Time bends to my will. I move faster than reality.",
        "Every connection sparks genius. I see what others miss.",
        "The universe conspires in my favor. Nothing can stop me."
    ],
    depressive: [
        "Everything feels heavy. Time moves slowly.",
        "I can't find the energy to move forward.",
        "Nothing matters. Nothing will ever matter again.",
        "Exhaustion without rest. Emptiness without end.",
        "The world feels gray, distant, and unreachable.",
        "I'm a burden. Everyone would be better without me.",
        "Why does everything require so much effort?"
    ],
    mixed: [
        "I'm energized but empty. Restless but exhausted.",
        "My mind races with thoughts I don't want to have.",
        "I want to do everything and nothing all at once.",
        "I feel everything and nothing simultaneously.",
        "Agitation and numbness fight for dominance.",
        "I can't find peace in either direction.",
        "My body moves but my soul stays still."
    ]
};

// ========================================
// DOM ELEMENT CACHE
// ========================================
const DOM = {
    // Main elements
    app: document.getElementById('app'),
    
    // Buttons
    manicBtn: document.getElementById('manic-btn'),
    mixedBtn: document.getElementById('mixed-btn'),
    depressiveBtn: document.getElementById('depressive-btn'),
    
    // Display elements
    stateBadge: document.getElementById('state-badge'),
    stateText: document.getElementById('state-text'),
    thoughtText: document.getElementById('thought-text'),
    
    // Images - All 7 state images
    stateImages: {
        '-3': document.getElementById('image-neg3'),
        '-2': document.getElementById('image-neg2'),
        '-1': document.getElementById('image-neg1'),
        '0': document.getElementById('image-0'),
        '1': document.getElementById('image-1'),
        '2': document.getElementById('image-2'),
        '3': document.getElementById('image-3')
    },
    
    // Control buttons
    infoBtn: document.getElementById('info-btn'),
    fullscreenBtn: document.getElementById('fullscreen-btn'),
    shareBtn: document.getElementById('share-btn'),
    audioBtn: document.getElementById('audio-btn'),
    timelineBtn: document.getElementById('timeline-btn'),
    
    // Modals
    infoModal: document.getElementById('info-modal'),
    closeInfo: document.getElementById('close-info'),
    
    // Stats
    manicTime: document.getElementById('manic-time'),
    mixedTime: document.getElementById('mixed-time'),
    depressiveTime: document.getElementById('depressive-time'),
    
    // Canvas
    particlesCanvas: document.getElementById('particlesCanvas'),
    timelineCanvas: document.getElementById('timeline-canvas'),
    
    // Audio elements
    manicAudio: document.getElementById('manic-audio'),
    mixedAudio: document.getElementById('mixed-audio'),
    depressiveAudio: document.getElementById('depressive-audio'),
    
    // Timeline
    timelinePanel: document.getElementById('timeline-panel'),
    clearTimelineBtn: document.getElementById('clear-timeline-btn')
};

// ========================================
// AUDIO MANAGEMENT SYSTEM
// ========================================
class AudioManager {
    constructor() {
        this.context = null;
        this.initialized = false;
        this.currentAudio = null;
        this.fadeDuration = 1000;
    }

    async initialize() {
        if (this.initialized) return true;
        
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Resume context if suspended (mobile requirement)
            if (this.context.state === 'suspended') {
                await this.context.resume();
            }
            
            this.initialized = true;
            console.log('Audio system initialized');
            return true;
        } catch (error) {
            console.error('Audio initialization failed:', error);
            return false;
        }
    }

    async playStateAudio(state) {
        if (!this.initialized || !AppState.audioEnabled) return;

        const audioMap = {
            manic: DOM.manicAudio,
            mixed: DOM.mixedAudio,
            depressive: DOM.depressiveAudio
        };

        const newAudio = audioMap[state];
        if (!newAudio) return;

        // Fade out current audio
        if (this.currentAudio && this.currentAudio !== newAudio) {
            await this.fadeOut(this.currentAudio);
        }

        // Fade in new audio
        this.currentAudio = newAudio;
        await this.fadeIn(newAudio);
    }

    async fadeOut(audio) {
        return new Promise((resolve) => {
            if (!audio || audio.paused) {
                resolve();
                return;
            }

            const startVolume = audio.volume;
            const steps = 20;
            const stepDuration = this.fadeDuration / steps;
            const volumeStep = startVolume / steps;
            let currentStep = 0;

            const fadeInterval = setInterval(() => {
                currentStep++;
                audio.volume = Math.max(0, startVolume - (volumeStep * currentStep));

                if (currentStep >= steps || audio.volume <= 0) {
                    clearInterval(fadeInterval);
                    audio.pause();
                    audio.currentTime = 0;
                    resolve();
                }
            }, stepDuration);
        });
    }

    async fadeIn(audio) {
        return new Promise((resolve) => {
            if (!audio) {
                resolve();
                return;
            }

            const targetVolume = AppState.current === 'manic' ? 0.4 : 
                               AppState.current === 'mixed' ? 0.3 : 0.25;
            const steps = 20;
            const stepDuration = this.fadeDuration / steps;
            const volumeStep = targetVolume / steps;
            let currentStep = 0;

            audio.volume = 0;
            
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('Audio play prevented:', error);
                    resolve();
                });
            }

            const fadeInterval = setInterval(() => {
                currentStep++;
                audio.volume = Math.min(targetVolume, volumeStep * currentStep);

                if (currentStep >= steps || audio.volume >= targetVolume) {
                    clearInterval(fadeInterval);
                    resolve();
                }
            }, stepDuration);
        });
    }

    stopAll() {
        [DOM.manicAudio, DOM.mixedAudio, DOM.depressiveAudio].forEach(audio => {
            if (audio && !audio.paused) {
                this.fadeOut(audio);
            }
        });
        this.currentAudio = null;
    }

    async toggle() {
        AppState.audioEnabled = !AppState.audioEnabled;

        if (!this.initialized && AppState.audioEnabled) {
            await this.initialize();
        }

        if (AppState.audioEnabled) {
            await this.playStateAudio(AppState.current);
            DOM.audioBtn?.classList.add('audio-active');
        } else {
            this.stopAll();
            DOM.audioBtn?.classList.remove('audio-active');
        }

        return AppState.audioEnabled;
    }
}

const audioManager = new AudioManager();

// ========================================
// PARTICLE SYSTEM
// ========================================
class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.resize();
        this.init();
        
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    init() {
        const count = this.getParticleCount();
        this.particles = [];
        
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * this.getSpeed(),
                vy: (Math.random() - 0.5) * this.getSpeed(),
                radius: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }

    getParticleCount() {
        const state = AppState.current;
        if (state === 'manic') return 50;
        if (state === 'mixed') return 35;
        return 20;
    }

    getSpeed() {
        const state = AppState.current;
        if (state === 'manic') return 2.0;
        if (state === 'mixed') return 1.2;
        return 0.6;
    }

    update() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Wrap around screen
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;

            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
            this.ctx.fill();
        });
    }
}

// ========================================
// TIMELINE VISUALIZATION
// ========================================
class TimelineChart {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    draw(data) {
        if (!this.canvas || !this.ctx) return;
        
        const width = this.canvas.width = this.canvas.offsetWidth;
        const height = this.canvas.height = this.canvas.offsetHeight;
        
        this.ctx.clearRect(0, 0, width, height);
        
        if (data.length < 2) return;

        // Configuration
        const padding = 30;
        const graphWidth = width - padding * 2;
        const graphHeight = height - padding * 2;

        // State positions
        const stateY = {
            manic: padding,
            mixed: padding + graphHeight / 2,
            depressive: padding + graphHeight
        };

        // State colors
        const colors = {
            manic: '#ffd43b',
            mixed: '#e599d7',
            depressive: '#4a90e2'
        };

        // Find time range
        const times = data.map(d => d.time);
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);
        const timeRange = maxTime - minTime || 1;

        // Draw grid lines
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= 4; i++) {
            const y = padding + (graphHeight / 4) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(padding, y);
            this.ctx.lineTo(width - padding, y);
            this.ctx.stroke();
        }

        // Draw state labels
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.font = '12px Inter, sans-serif';
        this.ctx.textAlign = 'right';
        this.ctx.fillText('Manic', padding - 10, stateY.manic + 5);
        this.ctx.fillText('Mixed', padding - 10, stateY.mixed + 5);
        this.ctx.fillText('Depressive', padding - 10, stateY.depressive + 5);

        // Draw lines and points
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        for (let i = 0; i < data.length - 1; i++) {
            const point1 = data[i];
            const point2 = data[i + 1];
            
            const x1 = padding + ((point1.time - minTime) / timeRange) * graphWidth;
            const y1 = stateY[point1.state];
            const x2 = padding + ((point2.time - minTime) / timeRange) * graphWidth;
            const y2 = stateY[point2.state];
            
            // Draw line
            this.ctx.strokeStyle = colors[point1.state];
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
            
            // Draw point
            this.ctx.fillStyle = colors[point1.state];
            this.ctx.beginPath();
            this.ctx.arc(x1, y1, 5, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw last point
        if (data.length > 0) {
            const lastPoint = data[data.length - 1];
            const x = padding + ((lastPoint.time - minTime) / timeRange) * graphWidth;
            const y = stateY[lastPoint.state];
            
            this.ctx.fillStyle = colors[lastPoint.state];
            this.ctx.beginPath();
            this.ctx.arc(x, y, 6, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Pulse effect on last point
            this.ctx.strokeStyle = colors[lastPoint.state];
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 10, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }
}

// ========================================
// INITIALIZE SYSTEMS
// ========================================
let particleSystem = null;
let timelineChart = null;

if (DOM.particlesCanvas) {
    particleSystem = new ParticleSystem(DOM.particlesCanvas);
}

if (DOM.timelineCanvas) {
    timelineChart = new TimelineChart(DOM.timelineCanvas);
}

// ========================================
// ANIMATION LOOP
// ========================================
function animate() {
    if (particleSystem) {
        particleSystem.update();
    }
    AppState.animationFrameId = requestAnimationFrame(animate);
}

// ========================================
// SOUND EFFECTS SYSTEM
// ========================================
let audioContext = null;

function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

function playClickSound() {
    if (!audioContext) {
        initAudioContext();
    }
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Create a pleasant click sound
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        console.log('Click sound error:', error);
    }
}

function playTransitionSound() {
    if (!audioContext) {
        initAudioContext();
    }
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Create a smooth transition sound
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.15);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
    } catch (error) {
        console.log('Transition sound error:', error);
    }
}

// ========================================
// IMAGE TRANSITION SYSTEM
// ========================================
let currentImageValue = 0; // Track current image value (0 = neutral)
let imageTransitionTimeout = null;

// Hide all images
function hideAllImages() {
    Object.values(DOM.stateImages).forEach(img => {
        if (img) {
            img.classList.remove('active');
            img.classList.add('hidden');
        }
    });
}

// Show a specific image by value with cool transition effect
function showImage(value) {
    const img = DOM.stateImages[String(value)];
    if (img) {
        img.classList.remove('hidden');
        img.style.opacity = '0';
        img.style.transform = 'scale(0.8) rotate(-5deg)';
        img.style.filter = 'blur(10px)';
        
        // Cool transition: zoom + rotate + blur effect
        requestAnimationFrame(() => {
            img.classList.add('active');
            img.style.transition = 'opacity 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.6s ease-out';
            img.style.opacity = '1';
            img.style.transform = 'scale(1) rotate(0deg)';
            img.style.filter = 'blur(0px)';
            currentImageValue = value;
        });
    }
}

// Progressive image transition - smoothly transitions through images
function transitionToImage(targetValue) {
    // Clear any existing transition
    if (imageTransitionTimeout) {
        clearTimeout(imageTransitionTimeout);
        imageTransitionTimeout = null;
    }
    
    const current = currentImageValue;
    const target = targetValue;
    
    // If already at target, just show it
    if (current === target) {
        hideAllImages();
        showImage(target);
        return;
    }
    
    // Determine direction and steps
    const direction = target > current ? 1 : -1;
    const steps = Math.abs(target - current);
    
    // Calculate transition duration - faster transitions
    const baseDelay = 250; // 250ms between each image for faster, fluid transitions
    
    // Start from current position
    let stepIndex = 0;
    
    function nextStep() {
        if (stepIndex <= steps) {
            const nextValue = current + (direction * stepIndex);
            
            // Smooth crossfade - fade out current, fade in next
            if (stepIndex === 0) {
                // First step - just show current
                hideAllImages();
                showImage(nextValue);
            } else {
                // Subsequent steps - crossfade
                const prevValue = current + (direction * (stepIndex - 1));
                const prevImg = DOM.stateImages[String(prevValue)];
                const nextImg = DOM.stateImages[String(nextValue)];
                
                if (prevImg && nextImg) {
                    // Cool transition: ripple + zoom + rotation effect
                    const slideDirection = nextValue > prevValue ? 1 : -1;
                    
                    // Create ripple effect on container
                    const container = prevImg.closest('.image-container');
                    if (container) {
                        container.style.animation = 'none';
                        setTimeout(() => {
                            container.style.animation = 'rippleEffect 0.5s ease-out';
                        }, 10);
                    }
                    
                    // Fade out previous with cool exit animation
                    prevImg.style.transition = 'opacity 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.4s ease-out';
                    prevImg.style.opacity = '0';
                    prevImg.style.transform = `scale(0.7) rotate(${slideDirection * 15}deg) translateX(${slideDirection * -40}px)`;
                    prevImg.style.filter = 'blur(8px)';
                    
                    // Fade in next with cool entrance animation
                    setTimeout(() => {
                        hideAllImages();
                        const nextImgElement = DOM.stateImages[String(nextValue)];
                        if (nextImgElement) {
                            nextImgElement.style.transition = 'opacity 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.5s ease-out';
                            nextImgElement.style.transform = `scale(0.7) rotate(${slideDirection * -15}deg) translateX(${slideDirection * 40}px)`;
                            nextImgElement.style.opacity = '0';
                            nextImgElement.style.filter = 'blur(8px)';
                            nextImgElement.classList.remove('hidden');
                            nextImgElement.classList.add('active');
                            
                            // Animate in with bounce effect
                            requestAnimationFrame(() => {
                                nextImgElement.style.opacity = '1';
                                nextImgElement.style.transform = 'scale(1.1) rotate(0deg) translateX(0)';
                                nextImgElement.style.filter = 'blur(0px)';
                                
                                // Bounce back to normal size
                                setTimeout(() => {
                                    nextImgElement.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
                                    nextImgElement.style.transform = 'scale(1) rotate(0deg) translateX(0)';
                                }, 100);
                                
                                currentImageValue = nextValue;
                            });
                        }
                    }, 200);
                } else {
                    hideAllImages();
                    showImage(nextValue);
                }
            }
            
            if (stepIndex < steps) {
                // Continue to next step
                stepIndex++;
                imageTransitionTimeout = setTimeout(nextStep, baseDelay);
            } else {
                // Transition complete
                imageTransitionTimeout = null;
            }
        }
    }
    
    // Start transition immediately
    nextStep();
}

// Update state images based on current state with progressive transitions
function updateStateImages(state) {
    // Clear any pending transitions first
    if (imageTransitionTimeout) {
        clearTimeout(imageTransitionTimeout);
        imageTransitionTimeout = null;
    }
    
    // Play transition sound
    playTransitionSound();
    
    if (state === 'manic') {
        // Progressive transition from current to 3
        transitionToImage(3);
    } else if (state === 'mixed') {
        // Transition to neutral (0)
        transitionToImage(0);
    } else if (state === 'depressive') {
        // Progressive transition from current to -3
        transitionToImage(-3);
    }
}

// ========================================
// STATE TRANSITION MANAGER
// ========================================
async function switchState(newState) {
    if (AppState.current === newState) return;

    // Update statistics
    const elapsed = (Date.now() - AppState.startTime) / 1000;
    AppState.stats[AppState.current] += elapsed;
    AppState.startTime = Date.now();
    updateStatsDisplay();

    // Add to timeline
    addTimelinePoint(newState);

    // Update state
    const previousState = AppState.current;
    AppState.current = newState;
    DOM.app.className = `state-${newState}`;

    // Update buttons
    [DOM.manicBtn, DOM.mixedBtn, DOM.depressiveBtn].forEach(btn => 
        btn.classList.remove('active')
    );
    
    if (newState === 'manic') DOM.manicBtn.classList.add('active');
    else if (newState === 'mixed') DOM.mixedBtn.classList.add('active');
    else DOM.depressiveBtn.classList.add('active');

    // Update state badge
    if (DOM.stateText) {
        DOM.stateText.textContent = newState.charAt(0).toUpperCase() + newState.slice(1);
    }

    // Update images with smooth progressive transition
    updateStateImages(newState);

    // Update thought
    updateThought(newState);

    // Reinitialize particles with smooth transition
    if (particleSystem) {
        setTimeout(() => {
            particleSystem.init();
        }, 200);
    }

    // Update audio
    if (AppState.audioEnabled) {
        await audioManager.playStateAudio(newState);
    }

    // Restart thought rotation
    startThoughtRotation();
}

// ========================================
// THOUGHT MANAGEMENT
// ========================================
function updateThought(state) {
    if (!DOM.thoughtText) return;
    
    AppState.thoughtIndex = Math.floor(Math.random() * thoughts[state].length);
    
    DOM.thoughtText.style.opacity = '0';
    
    setTimeout(() => {
        DOM.thoughtText.textContent = thoughts[state][AppState.thoughtIndex];
        DOM.thoughtText.style.opacity = '1';
    }, 400);
}

let thoughtInterval;

function startThoughtRotation() {
    clearInterval(thoughtInterval);
    
    const intervals = {
        manic: 3500,
        mixed: 4500,
        depressive: 6000
    };
    
    thoughtInterval = setInterval(() => {
        if (!DOM.thoughtText) return;
        
        const state = AppState.current;
        AppState.thoughtIndex = (AppState.thoughtIndex + 1) % thoughts[state].length;
        
        DOM.thoughtText.style.opacity = '0';
        setTimeout(() => {
            DOM.thoughtText.textContent = thoughts[state][AppState.thoughtIndex];
            DOM.thoughtText.style.opacity = '1';
        }, 400);
    }, intervals[AppState.current]);
}

// ========================================
// STATISTICS MANAGEMENT
// ========================================
function updateStatsDisplay() {
    if (DOM.manicTime) DOM.manicTime.textContent = formatTime(AppState.stats.manic);
    if (DOM.mixedTime) DOM.mixedTime.textContent = formatTime(AppState.stats.mixed);
    if (DOM.depressiveTime) DOM.depressiveTime.textContent = formatTime(AppState.stats.depressive);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Update stats every second
setInterval(() => {
    const elapsed = (Date.now() - AppState.startTime) / 1000;
    AppState.stats[AppState.current] += elapsed;
    AppState.startTime = Date.now();
    updateStatsDisplay();
}, 1000);

// ========================================
// TIMELINE MANAGEMENT
// ========================================
function addTimelinePoint(state) {
    AppState.timelineData.push({
        state: state,
        time: Date.now()
    });

    // Keep only last MAX points
    if (AppState.timelineData.length > AppState.maxTimelinePoints) {
        AppState.timelineData.shift();
    }

    // Update timeline chart if visible
    if (DOM.timelinePanel && !DOM.timelinePanel.classList.contains('hidden') && timelineChart) {
        timelineChart.draw(AppState.timelineData);
    }
}

function clearTimeline() {
    AppState.timelineData = [];
    if (timelineChart) {
        timelineChart.draw([]);
    }
}

// ========================================
// EVENT LISTENERS - STATE BUTTONS
// ========================================
if (DOM.manicBtn) {
    DOM.manicBtn.addEventListener('click', () => {
        playClickSound();
        switchState('manic');
    });
}

if (DOM.mixedBtn) {
    DOM.mixedBtn.addEventListener('click', () => {
        playClickSound();
        switchState('mixed');
    });
}

if (DOM.depressiveBtn) {
    DOM.depressiveBtn.addEventListener('click', () => {
        playClickSound();
        switchState('depressive');
    });
}

// ========================================
// EVENT LISTENERS - KEYBOARD SHORTCUTS
// ========================================
document.addEventListener('keydown', (e) => {
    // Ignore if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    const key = e.key.toLowerCase();
    
    if (key === 'm') switchState('manic');
    else if (key === 'x') switchState('mixed');
    else if (key === 'd') switchState('depressive');
    else if (key === 'a' && DOM.audioBtn) DOM.audioBtn.click();
    else if (key === 'i' && DOM.infoBtn) DOM.infoBtn.click();
    else if (key === 'f' && DOM.fullscreenBtn) DOM.fullscreenBtn.click();
});

// ========================================
// EVENT LISTENERS - MODAL CONTROLS
// ========================================
if (DOM.infoBtn && DOM.infoModal) {
    DOM.infoBtn.addEventListener('click', () => {
        playClickSound();
        DOM.infoModal.classList.add('visible');
    });
}

if (DOM.closeInfo && DOM.infoModal) {
    DOM.closeInfo.addEventListener('click', () => {
        playClickSound();
        DOM.infoModal.classList.remove('visible');
    });
    
    DOM.infoModal.addEventListener('click', (e) => {
        if (e.target === DOM.infoModal) {
            DOM.infoModal.classList.remove('visible');
        }
    });
}

// ========================================
// EVENT LISTENERS - UTILITY CONTROLS
// ========================================

// Fullscreen
if (DOM.fullscreenBtn) {
    DOM.fullscreenBtn.addEventListener('click', () => {
        playClickSound();
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Fullscreen not supported:', err);
            });
        } else {
            document.exitFullscreen();
        }
    });
}

// Audio toggle
if (DOM.audioBtn) {
    DOM.audioBtn.addEventListener('click', async () => {
        playClickSound();
        const enabled = await audioManager.toggle();
        console.log(`Audio ${enabled ? 'enabled' : 'disabled'}`);
    });
}

// Share
if (DOM.shareBtn) {
    DOM.shareBtn.addEventListener('click', async () => {
        playClickSound();
        const totalTime = AppState.stats.manic + AppState.stats.mixed + AppState.stats.depressive;
        const manicPercent = totalTime > 0 ? ((AppState.stats.manic / totalTime) * 100).toFixed(1) : 0;
        const mixedPercent = totalTime > 0 ? ((AppState.stats.mixed / totalTime) * 100).toFixed(1) : 0;
        const depressivePercent = totalTime > 0 ? ((AppState.stats.depressive / totalTime) * 100).toFixed(1) : 0;
        
        const shareData = {
            title: 'Dual Spectrum',
            text: `An Interactive Expression of Bipolar I Disorder\n\nTime Spent:\nManic: ${formatTime(AppState.stats.manic)} (${manicPercent}%)\nMixed: ${formatTime(AppState.stats.mixed)} (${mixedPercent}%)\nDepressive: ${formatTime(AppState.stats.depressive)} (${depressivePercent}%)`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.log('Share cancelled or failed');
                }
            }
        } else {
            try {
                await navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
            } catch (err) {
                console.log('Clipboard access denied');
            }
        }
    });
}

// Timeline
if (DOM.timelineBtn && DOM.timelinePanel) {
    DOM.timelineBtn.addEventListener('click', () => {
        playClickSound();
        const isHidden = DOM.timelinePanel.classList.toggle('hidden');
        if (!isHidden && timelineChart) {
            // Small delay to ensure canvas is rendered
            setTimeout(() => {
                timelineChart.draw(AppState.timelineData);
            }, 100);
        }
    });
}

if (DOM.clearTimelineBtn) {
    DOM.clearTimelineBtn.addEventListener('click', () => {
        playClickSound();
        clearTimeline();
    });
}

// ========================================
// MOBILE TOUCH GESTURES
// ========================================
let touchStartX = 0;
let touchStartY = 0;
const states = ['depressive', 'mixed', 'manic'];

document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // Minimum swipe distance
    const minSwipeDistance = 50;
    
    // Horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
        const currentIndex = states.indexOf(AppState.current);
        
        if (deltaX > 0) {
            // Swipe right - previous state
            const prevIndex = currentIndex === 0 ? states.length - 1 : currentIndex - 1;
            switchState(states[prevIndex]);
        } else {
            // Swipe left - next state
            const nextIndex = (currentIndex + 1) % states.length;
            switchState(states[nextIndex]);
        }
    }
}, { passive: true });

// ========================================
// INITIALIZATION
// ========================================
function initialize() {
    console.log('Initializing Dual Spectrum...');
    
    // Initialize images - set initial image based on current state
    if (AppState.current === 'depressive') {
        currentImageValue = -3;
        hideAllImages();
        showImage(-3);
    } else if (AppState.current === 'manic') {
        currentImageValue = 3;
        hideAllImages();
        showImage(3);
    } else {
        currentImageValue = 0;
        hideAllImages();
        showImage(0);
    }
    
    // Start animation loop
    animate();
    
    // Start thought rotation
    startThoughtRotation();
    
    // Add initial timeline point
    addTimelinePoint(AppState.current);
    
    // Initialize audio on first user interaction and auto-enable
    const initAudio = async () => {
        // Initialize audio context for sound effects
        initAudioContext();
        
        if (!audioManager.initialized) {
            await audioManager.initialize();
        }
        // Auto-enable audio after initialization
        if (!AppState.audioEnabled) {
            AppState.audioEnabled = true;
            await audioManager.playStateAudio(AppState.current);
            if (DOM.audioBtn) {
                DOM.audioBtn.classList.add('audio-active');
            }
        }
    };
    
    // Initialize audio on any user interaction
    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('touchstart', initAudio, { once: true, passive: true });
    document.addEventListener('keydown', initAudio, { once: true });
    
    console.log('Dual Spectrum initialized successfully');
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

// ========================================
// VISIBILITY CHANGE HANDLER
// ========================================
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause audio when tab is hidden
        audioManager.stopAll();
    } else {
        // Resume audio when tab is visible
        if (AppState.audioEnabled) {
            audioManager.playStateAudio(AppState.current);
        }
    }
});

// ========================================
// CLEANUP ON UNLOAD
// ========================================
window.addEventListener('beforeunload', () => {
    audioManager.stopAll();
    if (AppState.animationFrameId) {
        cancelAnimationFrame(AppState.animationFrameId);
    }
});