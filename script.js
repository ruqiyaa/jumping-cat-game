const startButton = document.getElementById("start-btn");
const startScreen = document.getElementById("start-screen");
const cat = document.getElementById("cat");
const gameArea = document.querySelector(".game-area");
const scoreElement = document.getElementById("score");
const bestScoreElement = document.getElementById("best-score");
const coinsElement = document.getElementById("coins");


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
}

document.addEventListener("keydown", (event) => {
    if (event.code === "Space" || event.code === "ArrowUp") {
        event.preventDefault();
        jump();
    }
});

gameArea.addEventListener("click", () => {
    jump();
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
    obstacle.style.animationDuration = `${obstacleDuration}s`;

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

    coin.style.animationDuration = `${obstacleDuration}s`;

    gameArea.appendChild(coin);

    coin.addEventListener("animationend", () => {
        coin.remove();
    }, { once: true });
}



function checkCollision() {
    //cat's position and dimension
    const catBounds = cat.getBoundingClientRect();
    // Create a smaller hitbox for the cat
    const catRect = {
        left: catBounds.left + 34,
        right: catBounds.right - 34,
        top: catBounds.top + 28,
        bottom: catBounds.bottom - 22
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
        const coinRect = {
            left: bounds.left + 4,
            right: bounds.right - 4,
            top: bounds.top + 4,
            bottom: bounds.bottom - 4
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
        }
    }
}


function endGame() {
    isPlaying = false;
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


function updateGroundSpeed() {

    const groundTileWidth = 640.72;

    // Distance an obstacle travels across the game
    const obstacleDistance = gameArea.clientWidth + 80;

    // Keep ground speed proportional to obstacle speed
    const groundDuration =
        (groundTileWidth * obstacleDuration) / obstacleDistance;

    gameArea.style.setProperty(
        "--ground-duration",
        `${groundDuration}s`
    );
}