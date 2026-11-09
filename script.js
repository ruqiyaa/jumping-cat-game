const startButton = document.getElementById("start-btn");
const startScreen = document.getElementById("start-screen");
const cat = document.getElementById("cat");
const gameArea = document.querySelector(".game-area");

let isPlaying = false;
let isJumping = false;
let obstacleTimer = null;

startButton.addEventListener("click", (event) => {
    event.stopPropagation();

    if(isPlaying) return;

    isPlaying = true;
    startScreen.classList.add("hidden");

    createObstacle();
    obstacleTimer = setInterval(createObstacle, 1800);
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

cat.addEventListener("animationend", () => {
    isJumping = false;
    cat.classList.remove("jump");
})


function createObstacle() {
    const types = ["plant", "mushroom", "rock"];

    const randomIndex = Math.floor(Math.random() * types.length);
    const type = types[randomIndex];

    const obstacle = document.createElement("div");
    obstacle.classList.add("obstacle", type);

    //plant parts
    if(type === "plant"){
        obstacle.innerHTML = `
        <span class="stem"></span>
        <span class="leaf left"></span>
        <span class="leaf right"></span>
        `;
    }

    //mushroon parts
    else if(type === "mushroom"){
        obstacle.innerHTML = `
        <span class="cap"></span>
        <span class="stem"></span>
        `;
    }

    //adding obstacle to game
    gameArea.appendChild(obstacle);

    //remove after animation ends
    obstacle.addEventListener("animationend", () => {
        obstacle.remove();
    })


}