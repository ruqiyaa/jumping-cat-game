const startButton = document.getElementById("start-btn");
const startScreen = document.getElementById("start-screen");
const cat = document.getElementById("cat");
const gameArea = document.querySelector(".game-area");
const scoreElement = document.getElementById("score");
const bestScoreElement = document.getElementById("best-score");
const coinsElement = document.getElementById("coins");
const soundToggle = document.getElementById("sound-toggle");


const obstacleAssets = {
    plant: [
        "assets/obstacles/plants/plant-leafy.png",
        "assets/obstacles/plants/plant-flower.png",
        "assets/obstacles/plants/plant-fern.png",
        "assets/obstacles/plants/plant-tropical.png",
        "assets/obstacles/plants/plant-potted-red.png",
        "assets/obstacles/plants/plant-potted-orange.png"
    ],

    mushroom: [
        "assets/obstacles/mushrooms/mushroom-red-cluster.png",
        "assets/obstacles/mushrooms/mushroom-golden.png",
        "assets/obstacles/mushrooms/mushroom-red-cluster-small.png",
        "assets/obstacles/mushrooms/mushroom-golden-small.png",
        "assets/obstacles/mushrooms/mushroom-potted.png",
        "assets/obstacles/mushrooms/mushroom-cream.png"
    ],

    rock: [
        "assets/obstacles/rocks/rock-pebbles.png",
        "assets/obstacles/rocks/rock-boulder.png",
        "assets/obstacles/rocks/rock-round.png",
        "assets/obstacles/rocks/rock-jagged.png"
    ]
};


let isPlaying = false;
let isJumping = false;
let obstacleTimer = null;
let collisionTimer = null;

let score = 0;
let bestScore = Number(localStorage.getItem("kittenJumpBestScore")) || 0;
let obstacleDuration = 4.2;
let coinsCollected = 0;
let coinTimer = null;

let jumpsCompleted = 0;
let audioContext = null;
let musicBuffer = null;
let musicSource = null;
let musicGain = null;
let soundEnabled = true;

bestScoreElement.textContent = bestScore;

startButton.addEventListener("click", (event) => {
    event.stopPropagation();

    if(isPlaying) return;

    clearInterval(obstacleTimer);
    clearInterval(collisionTimer);
    clearInterval(coinTimer);
    

    //removing any leftover obstacles
    gameArea.querySelectorAll(".obstacle").forEach(obstacle => {
        obstacle.remove();
    })
    gameArea.querySelectorAll(".coin").forEach(coin => coin.remove());

    //reset cat
    isJumping = false;
    cat.classList.remove("jump");

    //reseting current game values
    score = 0;
    coinsCollected = 0;
    jumpsCompleted = 0;
    obstacleDuration = 4.2;
    scoreElement.textContent = 0;
    coinsElement.textContent = 0;

    //start new game
    isPlaying = true;
    startMusic();
    updateGroundSpeed();
    gameArea.classList.add("running");
    startScreen.classList.add("hidden");

    createObstacle();
    obstacleTimer = setInterval(createObstacle, 2400);
    collisionTimer = setInterval(checkCollision, 20);
    coinTimer = setInterval(createCoin, 3500);
});

function jump() {
    if(!isPlaying || isJumping) {
        return;
    }

    isJumping = true;
    cat.classList.add("jump");
    playJumpSound();
}

document.addEventListener("keydown", (event) => {
    if (event.code === "Space" || event.code === "ArrowUp") {
        event.preventDefault();
        jump();
    }
});

cat.addEventListener("animationend", (event) => {
    if (event.target !== cat || event.animationName !== "cat-hop") return;
    isJumping = false;
    cat.classList.remove("jump");
    if(isPlaying) {
        jumpsCompleted++;
        addScore();
        if (jumpsCompleted % 10 === 0){
            obstacleDuration = Math.max(2.8, obstacleDuration -0.15);
            updateGroundSpeed();
        }
    }
});


function createObstacle() {

    
    const types = Object.keys(obstacleAssets);
    const randomIndex = Math.floor(Math.random() * types.length);
    const type = types[randomIndex];
    const images = obstacleAssets[type];
    const imageIndex = Math.floor(Math.random() * images.length);
    const imagePath = images[imageIndex];

    // obstacle container
    const obstacle = document.createElement("div");

    obstacle.classList.add("obstacle", type);
    obstacle.style.animationDuration = `${getTravelTime()}s`;

    // creat img
    const image = document.createElement("img");
    image.src = imagePath;
    image.alt = "";
    image.draggable = false;

    // image inside obstacle
    obstacle.appendChild(image);

    // add obstacle
    gameArea.appendChild(obstacle);

    // remove obstacle
    obstacle.addEventListener("animationend", () => {
        obstacle.remove();
    }, { once: true });
}




function createCoin() {

    const coin = document.createElement("div");
    coin.classList.add("coin");

    const image = document.createElement("img");

    image.src = "assets/coins/coin-fish.png";
    image.alt = "";
    image.draggable = false;

    coin.appendChild(image);

    coin.style.animationDuration = `${getTravelTime()}s`;

    gameArea.appendChild(coin);

    coin.addEventListener("animationend", () => {
        coin.remove();
    }, { once: true });
}



function checkCollision() {
    //cat's position and dimension
    const catBounds = cat.getBoundingClientRect();
    const catScale = catBounds.width / 156;
    // Create a smaller hitbox for the cat
   const catRect = {
    left: catBounds.left + 34 * catScale,
    right: catBounds.right - 34 * catScale,
    top: catBounds.top + 28 * catScale,
    bottom: catBounds.bottom - 22 * catScale
};

    const obstacles = gameArea.querySelectorAll(".obstacle");

    for (const obstacle of obstacles) {
        const bounds = obstacle.getBoundingClientRect();

        // Create a smaller hitbox for the obstacle
        const obstacleRect = {
            left: bounds.left + bounds.width * 0.18,
            right: bounds.right - bounds.width * 0.18,
            top: bounds.top + bounds.height * 0.18,
            bottom: bounds.bottom - bounds.height * 0.12
        };
        const isColliding = 
            catRect.left < obstacleRect.right &&
            catRect.right > obstacleRect.left &&
            catRect.top < obstacleRect.bottom &&
            catRect.bottom > obstacleRect.top;

        if(isColliding) {
            endGame();
            return;
        }
    }

    const coins = gameArea.querySelectorAll(".coin");

    for (const coin of coins) {
        const bounds = coin.getBoundingClientRect();
        const coinPaddingX = bounds.width * (4 / 48);
        const coinPaddingY = bounds.height * (4 / 48);

        const coinRect = {
            left: bounds.left + coinPaddingX,
            right: bounds.right - coinPaddingX,
            top: bounds.top + coinPaddingY,
            bottom: bounds.bottom - coinPaddingY
        };
        
         // Check whether the cat touches the coin
        const collected =
            catRect.left < coinRect.right &&
            catRect.right > coinRect.left &&
            catRect.top < coinRect.bottom &&
            catRect.bottom > coinRect.top;

        if(collected) {
            coin.remove();
            coinsCollected += 1;
            coinsElement.textContent = coinsCollected;
            addScore(2);
            playCoinSound();
        }
    }
}


function endGame() {
    isPlaying = false;
    stopMusic();
    playGameOverSound();
    gameArea.classList.remove("running");
    clearInterval(obstacleTimer);
    clearInterval(collisionTimer);
    clearInterval(coinTimer);
    gameArea.querySelectorAll(".obstacle").forEach(obstacle => {
        obstacle.remove();
    });
    gameArea.querySelectorAll(".coin").forEach(coin => {
        coin.remove();
    })

    cat.classList.remove("jump");
    isJumping = false;

    startScreen.querySelector("h2").textContent = "Game Over!";
    startScreen.querySelector("p").textContent = "Oops! Kitty hit obstacle.";

    startButton.textContent = "Play Again";
    startScreen.classList.remove("hidden");
}


function addScore(points=1) {
    score += points;
    scoreElement.textContent = score;

    if( score > bestScore){
        bestScore = score;
        bestScoreElement.textContent = bestScore;
        localStorage.setItem("kittenJumpBestScore", bestScore);
    }
}

const REFERENCE_DISTANCE = 1180;

function getTravelTime() {
    const distance = gameArea.clientWidth + 80;
    const scale = Math.sqrt(Math.min(1, distance / REFERENCE_DISTANCE));
    return obstacleDuration * scale;
}


function updateGroundSpeed() {
    const styles = getComputedStyle(gameArea);
    const travelTime = getTravelTime();
    const obstacleDistance = gameArea.clientWidth + 80;

    const groundTileWidth = parseFloat(
        styles.getPropertyValue("--ground-tile-width")
    ) || 640.72;

    const mountainTileWidth = parseFloat(
        styles.getPropertyValue("--mountain-tile-width")
    ) || 640;

    const groundDuration = (groundTileWidth * travelTime) / obstacleDistance;

    // Mountains move at 25% of obstacle speed
    const mountainDuration = (mountainTileWidth * travelTime * 4) / obstacleDistance;

    gameArea.style.setProperty("--ground-duration", `${groundDuration}s`);
    gameArea.style.setProperty("--mountain-duration", `${mountainDuration}s`);
}

window.addEventListener("resize", updateGroundSpeed);

gameArea.addEventListener("pointerdown", () => {
    jump();
});

// ---------- MUSIC -----------//
function createMusicBuffer(context) {
    const bpm = 108;
    const beat = 60 / bpm;
    const loopDuration = beat * 8;
    const sampleRate = context.sampleRate;
    const frameCount = Math.ceil(loopDuration * sampleRate);

    const buffer = context.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);

    function addNote(frequency, startBeat, durationBeats, volume) {
     const startFrame = Math.floor(
            startBeat * beat * sampleRate
        );

        const noteFrames = Math.floor(
            durationBeats * beat * sampleRate
        );

        for (let i = 0; i < noteFrames; i++) {

            const index = startFrame + i;

            if (index >= frameCount) break;

            const time = i / sampleRate;
            const duration = noteFrames / sampleRate;

            // Fade the note in and out
            const attack = Math.min(1, time / 0.02);
            const release = Math.min(1, (duration - time) / 0.08);

            const envelope = Math.max(
                0,
                Math.min(attack, release)
            );

            const wave =
                Math.sin(2 * Math.PI * frequency * time) +
                0.18 * Math.sin(2 * Math.PI * frequency * 2 * time);

            data[index] += wave * volume * envelope;
        }
    }

    // Original eight-note melody
    const melody = [
        523.25, 659.25, 783.99, 659.25,
        587.33, 698.46, 880.00, 783.99
    ];

    melody.forEach((frequency, index) => {
        addNote(frequency, index, 0.72, 0.25);
    });

    // Soft bass notes underneath the melody
    const bass = [130.81, 146.83, 164.81, 146.83];

    bass.forEach((frequency, index) => {
        addNote(frequency, index * 2, 1.7, 0.12);
    });

    return buffer;
}


function initialiseAudio() {

    if (audioContext) return true;

    const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
        console.error("Web Audio is not supported.");
        return false;
    }

    audioContext = new AudioContextClass();

    musicGain = audioContext.createGain();
    musicGain.gain.value = 0.0001;

    musicGain.connect(audioContext.destination);

    musicBuffer = createMusicBuffer(audioContext);

    return true;
}


function startMusic() {

    if (!soundEnabled || !initialiseAudio()) return;

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    // Avoid starting duplicate music tracks
    if (musicSource) return;

    const source = audioContext.createBufferSource();

    source.buffer = musicBuffer;
    source.loop = true;

    source.connect(musicGain);

    musicSource = source;

    // Fade in the background music
    const now = audioContext.currentTime;

    musicGain.gain.cancelScheduledValues(now);
    musicGain.gain.setValueAtTime(0.0001, now);
    musicGain.gain.linearRampToValueAtTime(0.15, now + 0.5);

    source.start(now);
}

function stopMusic() {

    if (!musicSource) return;

    musicSource.stop();
    musicSource = null;

    const now = audioContext.currentTime;

    musicGain.gain.cancelScheduledValues(now);
    musicGain.gain.setValueAtTime(0.0001, now);
}



function playTone(
    frequency,
    delay = 0,
    duration = 0.18,
    volume = 0.08,
    type = "sine",
    endFrequency = null
) {

    if (!soundEnabled || !audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    const startTime = audioContext.currentTime + delay;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);

    if (endFrequency) {
        oscillator.frequency.exponentialRampToValueAtTime(
            endFrequency,
            startTime + duration
        );
    }

    // Fade sound in and out
    gain.gain.setValueAtTime(0.0001, startTime);

    gain.gain.exponentialRampToValueAtTime(
        volume,
        startTime + 0.015
    );

    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        startTime + duration
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.02);
}


function playJumpSound() {

    playTone(480, 0, 0.18, 0.07, "triangle", 760);
}

function playCoinSound() {

    // First chime
    playTone(880, 0, 0.13, 0.08, "sine", 1200);

    // Second, higher chime
    playTone(1320, 0.09, 0.18, 0.06, "sine", 1500);
}

function playGameOverSound() {

    // Three descending notes
    playTone(440, 0, 0.22, 0.075, "triangle", 330);

    playTone(330, 0.16, 0.24, 0.065, "triangle", 247);

    playTone(247, 0.34, 0.38, 0.055, "triangle", 185);
}

soundToggle.addEventListener("click", () => {

    soundEnabled = !soundEnabled;

    soundToggle.textContent = soundEnabled
        ? "Sound: ON"
        : "Sound: OFF";

    soundToggle.setAttribute(
        "aria-pressed",
        String(soundEnabled)
    );

    if (soundEnabled && isPlaying) {
        startMusic();
    } else if (!soundEnabled) {
        stopMusic();
    }
    soundToggle.blur();
});
