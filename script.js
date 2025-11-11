// State management
let currentState = 'depressive';
let particles = [];
let autoTransitionInterval = null;
let thoughtIndex = 0;

// Thought arrays for each state
const manicThoughts = [
    "I can do anything! Everything is possible!",
    "My mind races with brilliant ideas.",
    "I don't need sleep. I have endless energy.",
    "I feel invincible, unstoppable, alive!",
    "The world moves too slowly for me.",
    "I can see connections others miss.",
    "Everything is beautiful and perfect."
];

const depressiveThoughts = [
    "Everything feels heavy. Time moves slowly.",
    "I can't find the energy to move.",
    "Nothing matters. Nothing will ever matter.",
    "I'm exhausted but can't rest.",
    "The world feels gray and distant.",
    "I'm a burden to everyone around me.",
    "Why does everything feel so difficult?"
];

const mixedThoughts = [
    "I'm energized but empty. Restless but exhausted.",
    "My mind races with dark thoughts.",
    "I want to do everything and nothing at once.",
    "I feel everything and nothing simultaneously.",
    "The world is too fast and too slow.",
    "I'm agitated and numb at the same time.",
    "I can't find peace in either direction."
];

// Statistics tracking
let stats = {
    manic: 0,
    mixed: 0,
    depressive: 0
};
let statsStartTime = Date.now();
let currentStateStartTime = Date.now();

// Timeline data
let timelineData = [];
const MAX_TIMELINE_POINTS = 100;

// DOM elements
const app = document.getElementById('app');
const manicBtn = document.getElementById('manic-btn');
const mixedBtn = document.getElementById('mixed-btn');
const depressiveBtn = document.getElementById('depressive-btn');
const stateIndicator = document.querySelector('.current-state');
const thoughtText = document.getElementById('thought-text');
const manicAudio = document.getElementById('manic-audio');
const depressiveAudio = document.getElementById('depressive-audio');
const mixedAudio = document.getElementById('mixed-audio');
const particlesContainer = document.querySelector('.particles');
const infoPanel = document.getElementById('info-panel');
const infoBtn = document.getElementById('info-btn');
const closeInfoBtn = document.getElementById('close-info');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const autoTransitionCheckbox = document.getElementById('auto-transition');
const mouseTrail = document.getElementById('mouse-trail');
const shareBtn = document.getElementById('share-btn');
const sharePanel = document.getElementById('share-panel');
const closeShareBtn = document.getElementById('close-share');
const timelineBtn = document.getElementById('timeline-btn');
const timelinePanel = document.getElementById('timeline-panel');
const closeTimelineBtn = document.getElementById('close-timeline');
const timelineCanvas = document.getElementById('timeline-canvas');
const clearTimelineBtn = document.getElementById('clear-timeline');
const intensitySlider = document.getElementById('intensity-slider');
const intensityValue = document.getElementById('intensity-value');
const manicTimeEl = document.getElementById('manic-time');
const mixedTimeEl = document.getElementById('mixed-time');
const depressiveTimeEl = document.getElementById('depressive-time');
const copyLinkBtn = document.getElementById('copy-link-btn');
const downloadImageBtn = document.getElementById('download-image-btn');
const copyTextBtn = document.getElementById('copy-text-btn');
const shareTextarea = document.getElementById('share-textarea');
// Get all state images
const stateImages = {
    '-3': document.getElementById('image-neg3'),
    '-2': document.getElementById('image-neg2'),
    '-1': document.getElementById('image-neg1'),
    '0': document.getElementById('image-0'),
    '1': document.getElementById('image-1'),
    '2': document.getElementById('image-2'),
    '3': document.getElementById('image-3')
};

// Current image value (0 = neutral)
let currentImageValue = 0;
let imageTransitionTimeout = null;

// Sound effects using Web Audio API
let audioContext = null;
let audioInitialized = false;

// Initialize audio context (must be called on user interaction for mobile)
function initAudioContext() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioInitialized = true;
        } catch (e) {
            console.log('Audio context not supported:', e);
            return false;
        }
    }
    
    // Resume audio context if suspended (required for mobile browsers)
    if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            console.log('Audio context resumed');
        }).catch(err => {
            console.log('Failed to resume audio context:', err);
        });
    }
    
    return true;
}

async function playClickSound() {
    // Initialize audio context if not already done
    if (!audioInitialized) {
        if (!initAudioContext()) {
            return; // Audio not supported
        }
    }
    
    // Ensure context is resumed (async for mobile)
    if (audioContext && audioContext.state === 'suspended') {
        try {
            await audioContext.resume();
        } catch (e) {
            console.log('Failed to resume audio context:', e);
            return;
        }
    }
    
    if (!audioContext || audioContext.state === 'closed') {
        return;
    }
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = currentState === 'manic' ? 800 : currentState === 'mixed' ? 600 : 400;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        console.log('Error playing click sound:', e);
    }
}

async function playTransitionSound() {
    // Initialize audio context if not already done
    if (!audioInitialized) {
        if (!initAudioContext()) {
            return; // Audio not supported
        }
    }
    
    // Ensure context is resumed (async for mobile)
    if (audioContext && audioContext.state === 'suspended') {
        try {
            await audioContext.resume();
        } catch (e) {
            console.log('Failed to resume audio context:', e);
            return;
        }
    }
    
    if (!audioContext || audioContext.state === 'closed') {
        return;
    }
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.3);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
        console.log('Error playing transition sound:', e);
    }
}

// Update statistics
function updateStats() {
    const now = Date.now();
    const elapsed = (now - currentStateStartTime) / 1000; // seconds
    
    stats[currentState] += elapsed;
    currentStateStartTime = now;
    
    updateStatsDisplay();
}

function updateStatsDisplay() {
    manicTimeEl.textContent = formatTime(stats.manic);
    mixedTimeEl.textContent = formatTime(stats.mixed);
    depressiveTimeEl.textContent = formatTime(stats.depressive);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Initialize particles
function createParticles() {
    const particleCount = currentState === 'manic' ? 30 : currentState === 'mixed' ? 20 : 15;
    
    // Clear existing particles
    particlesContainer.innerHTML = '';
    particles = [];
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random size
        const size = currentState === 'manic' 
            ? Math.random() * 8 + 4 
            : Math.random() * 6 + 3;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Random position
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        
        // Random animation delay
        particle.style.animationDelay = `${Math.random() * 20}s`;
        particle.style.animationDuration = currentState === 'manic' 
            ? `${Math.random() * 4 + 4}s`
            : `${Math.random() * 10 + 10}s`;
        
        particlesContainer.appendChild(particle);
        particles.push(particle);
    }
}

// Update thought text
function updateThought() {
    let thoughts;
    if (currentState === 'manic') {
        thoughts = manicThoughts;
    } else if (currentState === 'mixed') {
        thoughts = mixedThoughts;
    } else {
        thoughts = depressiveThoughts;
    }
    
    thoughtIndex = (thoughtIndex + 1) % thoughts.length;
    thoughtText.style.opacity = '0';
    
    setTimeout(() => {
        thoughtText.textContent = thoughts[thoughtIndex];
        thoughtText.style.opacity = '1';
    }, 300);
}

// Switch state function
function switchState(newState) {
    if (currentState === newState) return;
    
    // Update statistics
    updateStats();
    
    // Play transition sound
    playTransitionSound();
    
    // Remove all state classes
    app.classList.remove('state-manic', 'state-mixed', 'state-depressive');
    app.classList.add(`state-${newState}`);
    
    // Update buttons
    manicBtn.classList.remove('active');
    mixedBtn.classList.remove('active');
    depressiveBtn.classList.remove('active');
    
    if (newState === 'manic') manicBtn.classList.add('active');
    else if (newState === 'mixed') mixedBtn.classList.add('active');
    else depressiveBtn.classList.add('active');
    
    // Update indicator
    stateIndicator.textContent = newState.charAt(0).toUpperCase() + newState.slice(1);
    
    // Update thought
    let thoughts;
    if (newState === 'manic') thoughts = manicThoughts;
    else if (newState === 'mixed') thoughts = mixedThoughts;
    else thoughts = depressiveThoughts;
    
    thoughtIndex = Math.floor(Math.random() * thoughts.length);
    thoughtText.textContent = thoughts[thoughtIndex];
    
    // Update audio
    manicAudio.pause();
    mixedAudio.pause();
    depressiveAudio.pause();
    manicAudio.currentTime = 0;
    mixedAudio.currentTime = 0;
    depressiveAudio.currentTime = 0;
    
    // Play appropriate audio
    const audio = newState === 'manic' ? manicAudio : newState === 'mixed' ? mixedAudio : depressiveAudio;
    audio.volume = newState === 'manic' ? 0.3 : newState === 'mixed' ? 0.25 : 0.2;
    audio.play().catch(() => {});
    
    // Recreate particles
    createParticles();
    
    // Restart thought rotation
    startThoughtRotation();
    
    // Add to timeline
    addTimelinePoint(newState);
    
    // Update state images
    updateStateImages(newState);
    
    // Update current state
    currentState = newState;
    currentStateStartTime = Date.now();
    
    // Add transition effect
    app.style.transition = 'all 0.6s ease-in-out';
}

// Hide all images
function hideAllImages() {
    Object.values(stateImages).forEach(img => {
        if (img) {
            img.classList.remove('active');
            img.style.opacity = '0';
            img.style.visibility = 'hidden';
            img.style.transform = 'scale(0.7)';
        }
    });
}

// Show a specific image by value
function showImage(value) {
    const img = stateImages[String(value)];
    if (img) {
        img.classList.add('active');
        img.style.opacity = '1';
        img.style.visibility = 'visible';
        img.style.transform = 'scale(1)';
        img.style.zIndex = '25';
        currentImageValue = value;
        console.log(`Showing image value: ${value}`);
    }
}

// Progressive image transition - smoothly transitions through images
function transitionToImage(targetValue, state) {
    // Clear any existing transition
    if (imageTransitionTimeout) {
        clearTimeout(imageTransitionTimeout);
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
    
    // Start from current position
    let stepIndex = 0;
    
    function nextStep() {
        if (stepIndex <= steps) {
            const nextValue = current + (direction * stepIndex);
            hideAllImages();
            showImage(nextValue);
            
            if (stepIndex < steps) {
                // Continue to next step
                stepIndex++;
                imageTransitionTimeout = setTimeout(nextStep, 400); // 400ms between each image
            } else {
                // Transition complete
                imageTransitionTimeout = null;
            }
        }
    }
    
    // Start transition
    nextStep();
}

// Update state images based on current state with progressive transitions
function updateStateImages(state) {
    console.log('Updating state images for:', state);
    
    if (state === 'manic') {
        // Progressive transition: 0 → 1 → 2 → 3
        transitionToImage(3, state);
    } else if (state === 'mixed') {
        // Stay at neutral (0)
        transitionToImage(0, state);
    } else if (state === 'depressive') {
        // Progressive transition: 0 → -1 → -2 → -3
        transitionToImage(-3, state);
    }
}

// Switch to manic state
function switchToManic() {
    switchState('manic');
}

// Switch to mixed state
function switchToMixed() {
    switchState('mixed');
}

// Switch to depressive state
function switchToDepressive() {
    switchState('depressive');
}

// Initialize audio on first user interaction
function initAudioOnInteraction() {
    if (!audioInitialized) {
        initAudioContext();
    }
}

// Event listeners with audio initialization
manicBtn.addEventListener('click', () => {
    initAudioOnInteraction();
    playClickSound();
    switchToManic();
});
mixedBtn.addEventListener('click', () => {
    initAudioOnInteraction();
    playClickSound();
    switchToMixed();
});
depressiveBtn.addEventListener('click', () => {
    initAudioOnInteraction();
    playClickSound();
    switchToDepressive();
});

// Also initialize on touch events for mobile
manicBtn.addEventListener('touchstart', initAudioOnInteraction, { once: true, passive: true });
mixedBtn.addEventListener('touchstart', initAudioOnInteraction, { once: true, passive: true });
depressiveBtn.addEventListener('touchstart', initAudioOnInteraction, { once: true, passive: true });

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    initAudioOnInteraction();
    if (e.key === 'm' || e.key === 'M') {
        playClickSound();
        switchToManic();
    } else if (e.key === 'x' || e.key === 'X') {
        playClickSound();
        switchToMixed();
    } else if (e.key === 'd' || e.key === 'D') {
        playClickSound();
        switchToDepressive();
    }
});

// Remove duplicate initialization - it's now at the end

// Handle visibility change (pause audio when tab is hidden)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        manicAudio.pause();
        depressiveAudio.pause();
    } else {
        if (currentState === 'manic') {
            manicAudio.play().catch(() => {});
        } else {
            depressiveAudio.play().catch(() => {});
        }
    }
});

// Add smooth transitions on state change
let transitionTimeout;
function addTransitionEffect() {
    clearTimeout(transitionTimeout);
    app.style.transition = 'all 0.6s ease-in-out';
    transitionTimeout = setTimeout(() => {
        app.style.transition = '';
    }, 600);
}

// Enhanced button interactions
manicBtn.addEventListener('mouseenter', () => {
    if (currentState !== 'manic') {
        manicBtn.style.transform = 'scale(1.1)';
    }
});

manicBtn.addEventListener('mouseleave', () => {
    if (currentState !== 'manic') {
        manicBtn.style.transform = 'scale(1)';
    }
});

depressiveBtn.addEventListener('mouseenter', () => {
    if (currentState !== 'depressive') {
        depressiveBtn.style.transform = 'scale(1.1)';
    }
});

depressiveBtn.addEventListener('mouseleave', () => {
    if (currentState !== 'depressive') {
        depressiveBtn.style.transform = 'scale(1)';
    }
});

// Info panel controls
infoBtn.addEventListener('click', () => {
    infoPanel.classList.remove('hidden');
});

closeInfoBtn.addEventListener('click', () => {
    infoPanel.classList.add('hidden');
});

// Close info panel on background click
infoPanel.addEventListener('click', (e) => {
    if (e.target === infoPanel) {
        infoPanel.classList.add('hidden');
    }
});

// Fullscreen functionality
fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('Fullscreen not supported:', err);
        });
        fullscreenBtn.innerHTML = '<span>⛶</span>';
    } else {
        document.exitFullscreen();
        fullscreenBtn.innerHTML = '<span>⛶</span>';
    }
});

// Handle fullscreen change
document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
        fullscreenBtn.innerHTML = '<span>⛶</span>';
    } else {
        fullscreenBtn.innerHTML = '<span>⛶</span>';
    }
});

// Auto-transition functionality
autoTransitionCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) {
        // Start auto-transitioning every 8 seconds
        autoTransitionInterval = setInterval(() => {
            const states = ['manic', 'mixed', 'depressive'];
            const currentIndex = states.indexOf(currentState);
            const nextIndex = (currentIndex + 1) % states.length;
            switchState(states[nextIndex]);
        }, 8000);
    } else {
        // Stop auto-transition
        if (autoTransitionInterval) {
            clearInterval(autoTransitionInterval);
            autoTransitionInterval = null;
        }
    }
});

// Mouse trail effect (only on non-touch devices)
let mouseX = 0;
let mouseY = 0;
let trailX = 0;
let trailY = 0;
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

if (!isTouchDevice && mouseTrail) {
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        mouseTrail.style.opacity = '1';
    });

    function animateMouseTrail() {
        trailX += (mouseX - trailX) * 0.1;
        trailY += (mouseY - trailY) * 0.1;
        
        mouseTrail.style.left = `${trailX - 10}px`;
        mouseTrail.style.top = `${trailY - 10}px`;
        
        requestAnimationFrame(animateMouseTrail);
    }

    animateMouseTrail();

    // Hide mouse trail when mouse leaves window
    document.addEventListener('mouseleave', () => {
        mouseTrail.style.opacity = '0';
    });
}

// Hide mobile hint after first interaction
const mobileHint = document.getElementById('mobile-hint');
if (mobileHint && isTouchDevice) {
    let hintHidden = false;
    const hideHint = () => {
        if (!hintHidden) {
            mobileHint.style.opacity = '0';
            setTimeout(() => {
                mobileHint.style.display = 'none';
            }, 500);
            hintHidden = true;
        }
    };
    
    app.addEventListener('touchstart', hideHint, { once: true });
    manicBtn.addEventListener('click', hideHint, { once: true });
    mixedBtn.addEventListener('click', hideHint, { once: true });
    depressiveBtn.addEventListener('click', hideHint, { once: true });
}

// Rotate thoughts periodically
let thoughtRotationInterval = null;

function startThoughtRotation() {
    // Clear existing interval
    if (thoughtRotationInterval) {
        clearInterval(thoughtRotationInterval);
    }
    
    // Set interval based on current state
    let interval;
    if (currentState === 'manic') {
        interval = 3000;
    } else if (currentState === 'mixed') {
        interval = 4000;
    } else {
        interval = 5000;
    }
    
    thoughtRotationInterval = setInterval(() => {
        updateThought();
    }, interval);
}

// Start initial thought rotation
startThoughtRotation();

// Timeline functions
function addTimelinePoint(state) {
    const now = Date.now();
    timelineData.push({ state, time: now });
    
    // Keep only last MAX_TIMELINE_POINTS
    if (timelineData.length > MAX_TIMELINE_POINTS) {
        timelineData.shift();
    }
    
    drawTimeline();
}

function drawTimeline() {
    const ctx = timelineCanvas.getContext('2d');
    const width = timelineCanvas.width = timelineCanvas.offsetWidth;
    const height = timelineCanvas.height = timelineCanvas.offsetHeight;
    
    ctx.clearRect(0, 0, width, height);
    
    if (timelineData.length < 2) return;
    
    // Find time range
    const times = timelineData.map(d => d.time);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const timeRange = maxTime - minTime || 1;
    
    // State colors
    const colors = {
        manic: '#ffd93d',
        mixed: '#d4a5d4',
        depressive: '#eaeaea'
    };
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = (height / 5) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    // Draw timeline
    const padding = 20;
    const graphHeight = height - padding * 2;
    const graphWidth = width - padding * 2;
    
    // State positions (manic = top, mixed = middle, depressive = bottom)
    const stateY = {
        manic: padding,
        mixed: padding + graphHeight / 2,
        depressive: padding + graphHeight
    };
    
    // Draw lines
    ctx.lineWidth = 2;
    for (let i = 0; i < timelineData.length - 1; i++) {
        const point1 = timelineData[i];
        const point2 = timelineData[i + 1];
        
        const x1 = padding + ((point1.time - minTime) / timeRange) * graphWidth;
        const y1 = stateY[point1.state];
        const x2 = padding + ((point2.time - minTime) / timeRange) * graphWidth;
        const y2 = stateY[point2.state];
        
        ctx.strokeStyle = colors[point1.state];
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        // Draw point
        ctx.fillStyle = colors[point1.state];
        ctx.beginPath();
        ctx.arc(x1, y1, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw last point
    if (timelineData.length > 0) {
        const lastPoint = timelineData[timelineData.length - 1];
        const x = padding + ((lastPoint.time - minTime) / timeRange) * graphWidth;
        const y = stateY[lastPoint.state];
        
        ctx.fillStyle = colors[lastPoint.state];
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Timeline panel controls
timelineBtn.addEventListener('click', () => {
    timelinePanel.classList.remove('hidden');
    drawTimeline();
});

closeTimelineBtn.addEventListener('click', () => {
    timelinePanel.classList.add('hidden');
});

timelinePanel.addEventListener('click', (e) => {
    if (e.target === timelinePanel) {
        timelinePanel.classList.add('hidden');
    }
});

clearTimelineBtn.addEventListener('click', () => {
    timelineData = [];
    drawTimeline();
});

// Share functionality
shareBtn.addEventListener('click', () => {
    sharePanel.classList.remove('hidden');
    updateShareText();
});

closeShareBtn.addEventListener('click', () => {
    sharePanel.classList.add('hidden');
});

sharePanel.addEventListener('click', (e) => {
    if (e.target === sharePanel) {
        sharePanel.classList.add('hidden');
    }
});

function updateShareText() {
    const totalTime = stats.manic + stats.mixed + stats.depressive;
    const manicPercent = totalTime > 0 ? ((stats.manic / totalTime) * 100).toFixed(1) : 0;
    const mixedPercent = totalTime > 0 ? ((stats.mixed / totalTime) * 100).toFixed(1) : 0;
    const depressivePercent = totalTime > 0 ? ((stats.depressive / totalTime) * 100).toFixed(1) : 0;
    
    const text = `Dual Spectrum - An Interactive Expression of Bipolar I Disorder

Time Spent:
- Manic: ${formatTime(stats.manic)} (${manicPercent}%)
- Mixed: ${formatTime(stats.mixed)} (${mixedPercent}%)
- Depressive: ${formatTime(stats.depressive)} (${depressivePercent}%)

Total Time: ${formatTime(totalTime)}

Current State: ${currentState.charAt(0).toUpperCase() + currentState.slice(1)}

Experience this interactive artwork at: ${window.location.href}

Destiny A., Christian H., Thomas M., & Aran S. (2025). Dual Spectrum [Digital artwork]. Northwest Vista.`;
    
    shareTextarea.value = text;
}

copyLinkBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
        copyLinkBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyLinkBtn.textContent = 'Copy Link';
        }, 2000);
    });
});

copyTextBtn.addEventListener('click', () => {
    shareTextarea.select();
    document.execCommand('copy');
    copyTextBtn.textContent = 'Copied!';
    setTimeout(() => {
        copyTextBtn.textContent = 'Copy Text';
    }, 2000);
});

downloadImageBtn.addEventListener('click', () => {
    // Use html2canvas if available, otherwise use a simple screenshot method
    if (typeof html2canvas !== 'undefined') {
        html2canvas(app).then(canvas => {
            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'dual-spectrum-artwork.png';
                a.click();
                URL.revokeObjectURL(url);
            });
        });
    } else {
        // Fallback: try to use browser's screenshot API or show instructions
        alert('To download an image, you can use your browser\'s screenshot feature or install html2canvas library.');
    }
});

// Intensity slider
intensitySlider.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    intensityValue.textContent = `${Math.round(value * 100)}%`;
    
    // Apply intensity to CSS variable
    document.documentElement.style.setProperty('--intensity', value);
    
    // Adjust animation speeds
    const speedMultiplier = 1 / value;
    app.style.setProperty('--transition-fast', `${0.3 * speedMultiplier}s`);
    app.style.setProperty('--transition-medium', `${0.6 * speedMultiplier}s`);
    app.style.setProperty('--transition-slow', `${1.2 * speedMultiplier}s`);
});

// Update statistics every second
setInterval(() => {
    const now = Date.now();
    const elapsed = (now - currentStateStartTime) / 1000;
    stats[currentState] += elapsed;
    currentStateStartTime = now;
    updateStatsDisplay();
}, 1000);

// Swipe gesture support for mobile
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

const states = ['manic', 'mixed', 'depressive'];

function handleSwipe() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // Minimum swipe distance
    const minSwipeDistance = 50;
    
    // Check if horizontal swipe is greater than vertical (horizontal swipe)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
        const currentIndex = states.indexOf(currentState);
        
        if (deltaX > 0) {
            // Swipe right - go to previous state
            const prevIndex = currentIndex === 0 ? states.length - 1 : currentIndex - 1;
            switchState(states[prevIndex]);
        } else {
            // Swipe left - go to next state
            const nextIndex = (currentIndex + 1) % states.length;
            switchState(states[nextIndex]);
        }
    }
}

// Touch event listeners for swipe gestures
app.addEventListener('touchstart', (e) => {
    // Initialize audio on first touch
    initAudioOnInteraction();
    
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

app.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
}, { passive: true });

// Prevent default touch behaviors that interfere
app.addEventListener('touchmove', (e) => {
    // Allow scrolling in panels, but prevent on main app
    const isPanelOpen = !infoPanel.classList.contains('hidden') || 
                        !timelinePanel.classList.contains('hidden') || 
                        !sharePanel.classList.contains('hidden');
    
    if (isPanelOpen) {
        return; // Allow default scrolling in panels
    }
    
    // Prevent pull-to-refresh and other default behaviors on main app
    e.preventDefault();
}, { passive: false });

// Handle image loading errors gracefully for all images
Object.entries(stateImages).forEach(([value, img]) => {
    if (img) {
        img.addEventListener('error', function() {
            console.error(`Image ${value} failed to load from:`, this.src);
            this.style.opacity = '0';
            this.style.visibility = 'hidden';
        });
        img.addEventListener('load', function() {
            console.log(`Image ${value} loaded successfully, dimensions:`, this.naturalWidth, 'x', this.naturalHeight);
            // Force visibility on load if it's the active image
            if (this.classList.contains('active') || value === '0') {
                this.style.opacity = '1';
                this.style.visibility = 'visible';
                this.style.transform = 'scale(1)';
                this.style.zIndex = '25';
            }
        });
    }
});

// Initialize on load
window.addEventListener('load', () => {
    createParticles();
    updateStatsDisplay();
    currentStateStartTime = Date.now();
    
    // Initialize images - start at appropriate value based on current state
    if (currentState === 'depressive') {
        currentImageValue = -3;
        hideAllImages();
        showImage(-3);
    } else if (currentState === 'manic') {
        currentImageValue = 3;
        hideAllImages();
        showImage(3);
    } else {
        currentImageValue = 0;
        hideAllImages();
        showImage(0);
    }
    
    // Double-check image visibility after a short delay
    setTimeout(() => {
        const activeImage = stateImages[String(currentImageValue)];
        if (activeImage) {
            if (activeImage.complete && activeImage.naturalHeight !== 0) {
                console.log('Active image loaded successfully:', activeImage.src);
                activeImage.style.opacity = '1';
                activeImage.style.visibility = 'visible';
                activeImage.style.transform = 'scale(1)';
                activeImage.style.zIndex = '25';
                activeImage.classList.add('active');
            } else {
                console.warn('Active image may not be loaded properly:', activeImage.src);
                // Try to reload
                const src = activeImage.src;
                activeImage.src = '';
                setTimeout(() => {
                    activeImage.src = src;
                }, 100);
            }
        }
    }, 500);
    
    // Try to play initial audio (will fail silently on mobile until user interaction)
    depressiveAudio.volume = 0.2;
    depressiveAudio.play().catch(() => {
        // Audio will be enabled on first user interaction
    });
    
    // Add initial timeline point
    addTimelinePoint('depressive');
    
    // Resize timeline canvas
    window.addEventListener('resize', () => {
        if (!timelinePanel.classList.contains('hidden')) {
            drawTimeline();
        }
    });
    
    // Handle safe area for mobile devices (notches)
    const setSafeArea = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setSafeArea();
    window.addEventListener('resize', setSafeArea);
    window.addEventListener('orientationchange', setSafeArea);
    
    // Initialize audio context on any user interaction (for mobile)
    const initOnAnyInteraction = () => {
        initAudioOnInteraction();
        // Also try to play background audio
        if (depressiveAudio.paused) {
            depressiveAudio.play().catch(() => {});
        }
    };
    
    // Listen for various interaction events
    document.addEventListener('touchstart', initOnAnyInteraction, { once: true, passive: true });
    document.addEventListener('click', initOnAnyInteraction, { once: true });
    document.addEventListener('touchend', initOnAnyInteraction, { once: true, passive: true });
});

